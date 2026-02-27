"use client";

import { Plus, Upload, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import StyleSelector from "./StyleSelector";
import PromptSlot from "./PromptSlot";
import type { PromptSlot as PromptSlotType, ModelProvider } from "../types";

interface InputViewProps {
  style: string;
  onStyleChange: (style: string) => void;
  modelProvider: ModelProvider;
  onModelProviderChange: (provider: ModelProvider) => void;
  prompts: PromptSlotType[];
  isGlobalGenerating: boolean;
  fileInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  bulkInputRef: React.RefObject<HTMLInputElement | null>;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdatePromptText: (index: number, value: string) => void;
  onImageUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: (index: number) => void;
  onBulkUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
}

export default function InputView({
  style,
  onStyleChange,
  modelProvider,
  onModelProviderChange,
  prompts,
  isGlobalGenerating,
  fileInputRefs,
  bulkInputRef,
  onAddSlot,
  onRemoveSlot,
  onUpdatePromptText,
  onImageUpload,
  onImageRemove,
  onBulkUpload,
  onGenerate,
}: InputViewProps) {
  const hasValidInput = prompts.some(
    (p) => p.text.trim() !== "" || p.image !== null
  );

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Batch World Generation
        </h1>
        <p className="text-zinc-400">
          Generate front views or upload existing ones, then create matching back
          views.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 text-zinc-100 shadow-sm p-6 space-y-6">
        <StyleSelector
          style={style}
          onStyleChange={onStyleChange}
          modelProvider={modelProvider}
          onModelProviderChange={onModelProviderChange}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">
              Front View Inputs
            </label>
            <span className="text-xs text-zinc-500">
              Text Prompt OR Image Upload
            </span>
          </div>

          <div className="space-y-3">
            {prompts.map((prompt, index) => (
              <PromptSlot
                key={index}
                index={index}
                text={prompt.text}
                image={prompt.image}
                canDelete={prompts.length > 1}
                fileInputRef={(el) => {
                  fileInputRefs.current[index] = el;
                }}
                onTextChange={(value) => onUpdatePromptText(index, value)}
                onImageUpload={(e) => onImageUpload(index, e)}
                onImageRemove={() => onImageRemove(index)}
                onDelete={() => onRemoveSlot(index)}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onAddSlot}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 py-2 px-4 bg-zinc-900/30 text-zinc-100 hover:bg-zinc-800 border border-dashed border-zinc-700 flex-1"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Slot
            </button>
            <button
              onClick={() => bulkInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 py-2 px-4 bg-zinc-900/30 text-zinc-100 hover:bg-zinc-800 border border-dashed border-zinc-700 flex-1"
            >
              <Upload className="w-4 h-4 mr-2" /> Bulk Upload Images
            </button>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={bulkInputRef as React.RefObject<HTMLInputElement>}
              onChange={onBulkUpload}
            />
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2777] disabled:opacity-50 disabled:pointer-events-none bg-[#DB2777] text-white hover:bg-[#BE185D] shadow-sm w-full h-12 text-base"
          onClick={onGenerate}
          disabled={isGlobalGenerating || !hasValidInput}
        >
          {isGlobalGenerating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Generate / Process Front Views{" "}
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
