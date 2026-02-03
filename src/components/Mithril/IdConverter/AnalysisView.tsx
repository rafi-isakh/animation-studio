"use client";

import { useState } from "react";
import { Trash2, Plus, Save, Search, Loader2 } from "lucide-react";
import type {
  IdConverterEntity,
  IdConverterVariant,
} from "../services/firestore/types";

interface AnalysisViewProps {
  glossary: IdConverterEntity[];
  context: { fileUri?: string; text?: string };
  onConfirm: (updatedGlossary: IdConverterEntity[]) => void;
  onRetake: () => void;
  apiKey?: string;
}

const ENTITY_TYPE_STYLES = {
  CHARACTER: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  ITEM: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  LOCATION: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export function AnalysisView({
  glossary,
  context,
  onConfirm,
  onRetake,
  apiKey,
}: AnalysisViewProps) {
  const [entities, setEntities] = useState<IdConverterEntity[]>(glossary);
  const [newEntityName, setNewEntityName] = useState("");
  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const [isAnalyzingNew, setIsAnalyzingNew] = useState(false);

  const handleEntityNameChange = (index: number, newName: string) => {
    const newEntities = [...entities];
    newEntities[index] = { ...newEntities[index], name: newName };
    setEntities(newEntities);
  };

  const handleEntityTypeChange = (
    index: number,
    newType: IdConverterEntity["type"]
  ) => {
    const newEntities = [...entities];
    newEntities[index] = { ...newEntities[index], type: newType };
    setEntities(newEntities);
  };

  const removeEntity = (index: number) => {
    if (
      confirm(
        `Are you sure you want to delete the entity "${entities[index].name}" and all its variants?`
      )
    ) {
      const newEntities = [...entities];
      newEntities.splice(index, 1);
      setEntities(newEntities);
    }
  };

  const handleVariantChange = (
    entityIndex: number,
    variantIndex: number,
    field: keyof IdConverterVariant,
    value: string | string[]
  ) => {
    const newEntities = [...entities];
    const newVariants = [...newEntities[entityIndex].variants];
    newVariants[variantIndex] = {
      ...newVariants[variantIndex],
      [field]: value,
    };
    newEntities[entityIndex] = { ...newEntities[entityIndex], variants: newVariants };
    setEntities(newEntities);
  };

  const addVariant = (entityIndex: number) => {
    const newEntities = [...entities];
    const newVariants = [
      ...newEntities[entityIndex].variants,
      {
        id: "NEW_ID",
        description: "새로운 변형 설명",
        tags: [],
      },
    ];
    newEntities[entityIndex] = { ...newEntities[entityIndex], variants: newVariants };
    setEntities(newEntities);
  };

  const removeVariant = (entityIndex: number, variantIndex: number) => {
    const newEntities = [...entities];
    const newVariants = [...newEntities[entityIndex].variants];
    newVariants.splice(variantIndex, 1);
    newEntities[entityIndex] = { ...newEntities[entityIndex], variants: newVariants };
    setEntities(newEntities);
  };

  const handleAddNewEntity = async () => {
    if (!newEntityName.trim()) return;

    setIsAnalyzingNew(true);
    try {
      const response = await fetch("/api/id-converter/analyze-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: context.text,
          entityName: newEntityName,
          apiKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze entity");
      }

      const data = await response.json();
      if (data.entity) {
        setEntities((prev) => [...prev, data.entity]);
        setNewEntityName("");
        setIsAddingEntity(false);
      } else {
        alert(
          `Could not find any relevant information for "${newEntityName}" in the text.`
        );
      }
    } catch (e) {
      console.error(e);
      alert("Failed to analyze the new entity. Please try again.");
    } finally {
      setIsAnalyzingNew(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-[#DB2777] mb-2">
          Entity Analysis
        </h2>
        <p className="text-gray-400">
          The AI has detected the following entities. Review and edit the IDs
          before processing.
        </p>
      </div>

      <div className="grid gap-6">
        {entities.map((entity, entIdx) => (
          <div
            key={entIdx}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <select
                value={entity.type}
                onChange={(e) =>
                  handleEntityTypeChange(
                    entIdx,
                    e.target.value as IdConverterEntity["type"]
                  )
                }
                className={`px-3 py-1.5 rounded text-xs font-bold border ${ENTITY_TYPE_STYLES[entity.type]} bg-transparent cursor-pointer`}
              >
                <option value="CHARACTER">CHARACTER</option>
                <option value="ITEM">ITEM</option>
                <option value="LOCATION">LOCATION</option>
              </select>
              <input
                value={entity.name}
                onChange={(e) => handleEntityNameChange(entIdx, e.target.value)}
                className="bg-transparent text-xl font-bold text-white border-b border-transparent focus:border-[#DB2777] outline-none flex-1"
              />
              <button
                onClick={() => removeEntity(entIdx)}
                className="text-gray-500 hover:text-red-400 hover:bg-red-900/10 p-2 rounded transition-colors"
                title="Delete entire entity"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-gray-700">
              {entity.variants.map((variant, varIdx) => (
                <div
                  key={varIdx}
                  className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-900/50 p-3 rounded"
                >
                  <div className="flex-1 w-full md:w-auto">
                    <label className="text-xs text-gray-500 uppercase font-mono">
                      Context ID
                    </label>
                    <input
                      value={variant.id}
                      onChange={(e) =>
                        handleVariantChange(entIdx, varIdx, "id", e.target.value)
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1 text-[#DB2777] font-mono focus:border-[#DB2777] outline-none"
                    />
                  </div>
                  <div className="flex-[2] w-full md:w-auto">
                    <label className="text-xs text-gray-500 uppercase font-mono">
                      Description (KO)
                    </label>
                    <input
                      value={variant.description}
                      onChange={(e) =>
                        handleVariantChange(
                          entIdx,
                          varIdx,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1 text-gray-300 focus:border-[#DB2777] outline-none"
                    />
                  </div>
                  <button
                    onClick={() => removeVariant(entIdx, varIdx)}
                    className="text-red-400 hover:bg-red-900/20 p-2 rounded mt-4 md:mt-0 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addVariant(entIdx)}
                className="flex items-center gap-2 text-sm text-[#DB2777] hover:text-[#DB2777]/80 mt-2"
              >
                <Plus size={14} /> Add Variant
              </button>
            </div>
          </div>
        ))}

        {/* Add New Entity Section */}
        {!isAddingEntity ? (
          <button
            onClick={() => setIsAddingEntity(true)}
            className="w-full py-4 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-[#DB2777] hover:border-[#DB2777]/50 hover:bg-gray-800/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span>Add Missing Entity (Analyze with AI)</span>
          </button>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 border border-[#DB2777]/50 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">
              Add New Entity
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase font-mono mb-1 block">
                  Entity Name (Korean/English)
                </label>
                <input
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="e.g. The Black Dragon or 흑룡"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white focus:border-[#DB2777] outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleAddNewEntity()}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleAddNewEntity}
                  disabled={isAnalyzingNew || !newEntityName.trim()}
                  className="bg-[#DB2777] hover:bg-[#DB2777]/80 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded font-bold flex items-center gap-2 transition-colors min-w-[140px] justify-center"
                >
                  {isAnalyzingNew ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                  {isAnalyzingNew ? "Analyzing..." : "Analyze & Add"}
                </button>
                <button
                  onClick={() => {
                    setIsAddingEntity(false);
                    setNewEntityName("");
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-3 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * The AI will scan the source text to identify variants and
              generate descriptions.
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-6 mt-12 flex justify-between bg-gray-900/90 backdrop-blur-sm p-4 border border-gray-700 rounded-xl shadow-2xl z-20">
        <button
          onClick={onRetake}
          className="px-6 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          Cancel / Upload Different File
        </button>
        <button
          onClick={() => onConfirm(entities)}
          className="flex items-center gap-2 px-8 py-3 rounded-lg bg-[#DB2777] hover:bg-[#DB2777]/80 text-white font-bold shadow-lg transition-all transform hover:scale-105"
        >
          <Save size={18} /> Confirm Glossary & Start Processing
        </button>
      </div>
    </div>
  );
}
