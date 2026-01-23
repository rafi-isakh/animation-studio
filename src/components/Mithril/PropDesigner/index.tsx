"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useMithril } from "../MithrilContext";
import { useProject } from "@/contexts/ProjectContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrase";
import { Prop, DetectedId, ID_PATTERN, categorizeId, CHARACTER_KEYWORDS } from "./types";
import DetectionPanel from "./DetectionPanel";
import PropGrid from "./PropGrid";
import PropDetail from "./PropDetail";
import {
  savePropDesignerSettings,
  saveProp,
  saveDetectedIds,
  updatePropDesignSheetImage,
  updatePropReferenceImage,
} from "../services/firestore";

export default function PropDesigner() {
  const { language, dictionary } = useLanguage();
  const { currentProjectId } = useProject();
  const {
    storyboardGenerator,
    propDesignerGenerator,
    setPropDesignerResult,
    clearPropDesignerData,
    customApiKey,
  } = useMithril();

  // Local state
  const [props, setProps] = useState<Prop[]>([]);
  const [detectedIds, setDetectedIds] = useState<DetectedId[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [genre, setGenre] = useState<string>("Modern");
  const [styleKeyword, setStyleKeyword] = useState<string>("anime 2d style");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from context on mount
  useEffect(() => {
    if (propDesignerGenerator.result) {
      const result = propDesignerGenerator.result;
      setGenre(result.settings?.genre || "Modern");
      setStyleKeyword(result.settings?.styleKeyword || "anime 2d style");
      setDetectedIds(result.detectedIds || []);
      setProps(
        result.props.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          descriptionKo: p.descriptionKo,
          appearingClips: p.appearingClips,
          contextPrompts: [],
          designSheetPrompt: p.designSheetPrompt,
          designSheetImageUrl: p.designSheetImageRef,
          referenceImageUrl: p.referenceImageRef,
          isGenerating: false,
        }))
      );
    }
  }, [propDesignerGenerator.result]);

  // Extract IDs from storyboard clips
  const extractedIds = useMemo(() => {
    if (!storyboardGenerator.scenes || storyboardGenerator.scenes.length === 0) {
      return { characters: [] as string[], objects: [] as string[] };
    }

    const characterIds = new Set<string>();
    const objectIds = new Set<string>();
    const idOccurrences = new Map<string, { clipIds: string[]; contexts: { clipId: string; text: string }[] }>();

    storyboardGenerator.scenes.forEach((scene, sIdx) => {
      scene.clips.forEach((clip, cIdx) => {
        const clipId = `${sIdx + 1}-${cIdx + 1}`;
        const combinedText = `${clip.story} ${clip.imagePrompt} ${clip.imagePromptEnd || ""} ${clip.videoPrompt} ${clip.dialogue} ${clip.backgroundId}`;
        const matches = combinedText.match(ID_PATTERN);

        if (matches) {
          matches.forEach((id) => {
            // Track occurrences
            if (!idOccurrences.has(id)) {
              idOccurrences.set(id, { clipIds: [], contexts: [] });
            }
            const occ = idOccurrences.get(id)!;
            if (!occ.clipIds.includes(clipId)) {
              occ.clipIds.push(clipId);
              // Extract context - take the sentence containing the ID
              const contextText = clip.imagePrompt || clip.story || "";
              if (contextText.includes(id)) {
                occ.contexts.push({ clipId, text: contextText.substring(0, 200) });
              }
            }

            // Categorize
            const category = categorizeId(id, CHARACTER_KEYWORDS as unknown as string[]);
            if (category === "character") {
              characterIds.add(id);
            } else {
              objectIds.add(id);
            }
          });
        }
      });
    });

    // Build detected IDs with occurrence data
    const allDetected: DetectedId[] = [];
    [...characterIds, ...objectIds].forEach((id) => {
      const occ = idOccurrences.get(id);
      if (occ) {
        allDetected.push({
          id,
          category: characterIds.has(id) ? "character" : "object",
          clipIds: occ.clipIds,
          contexts: occ.contexts,
          occurrences: occ.clipIds.length,
        });
      }
    });

    setDetectedIds(allDetected);

    return {
      characters: Array.from(characterIds).sort(),
      objects: Array.from(objectIds).sort(),
    };
  }, [storyboardGenerator.scenes]);

  // Toggle ID category
  const handleToggleCategory = useCallback((id: string) => {
    setDetectedIds((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, category: d.category === "character" ? "object" : "character" }
          : d
      )
    );
  }, []);

  // Remove ID from detection
  const handleRemoveId = useCallback((id: string) => {
    setDetectedIds((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Detect props using AI
  const handleDetectProps = useCallback(async () => {
    const objectIds = detectedIds.filter((d) => d.category === "object").map((d) => d.id);

    if (objectIds.length === 0) {
      setError("No object IDs to analyze. All detected IDs are categorized as characters.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/generate_prop_sheet/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: storyboardGenerator.scenes,
          targetIds: objectIds,
          genre,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      // Convert API response to Prop objects
      const newProps: Prop[] = data.objects.map((obj: {
        name: string;
        description: string;
        descriptionKo: string;
        appearingClips: string[];
        contextPrompts: { clipId: string; text: string }[];
        productSheetPrompt: string;
      }) => ({
        id: crypto.randomUUID(),
        name: obj.name,
        category: "object" as const,
        description: obj.description,
        descriptionKo: obj.descriptionKo,
        appearingClips: obj.appearingClips,
        contextPrompts: obj.contextPrompts,
        designSheetPrompt: obj.productSheetPrompt,
        isGenerating: false,
      }));

      setProps(newProps);

      // Save to Firestore
      if (currentProjectId) {
        await savePropDesignerSettings(currentProjectId, {
          styleKeyword,
          propBasePrompt: "",
          genre,
        });

        await saveDetectedIds(
          currentProjectId,
          detectedIds.map((d) => ({
            id: d.id,
            category: d.category,
            clipIds: d.clipIds,
            contexts: d.contexts,
            occurrences: d.occurrences,
          }))
        );

        for (const prop of newProps) {
          await saveProp(currentProjectId, {
            name: prop.name,
            category: prop.category,
            description: prop.description,
            descriptionKo: prop.descriptionKo,
            appearingClips: prop.appearingClips,
            contextPrompts: prop.contextPrompts,
            designSheetPrompt: prop.designSheetPrompt,
          });
        }
      }

      // Update context
      setPropDesignerResult({
        settings: { styleKeyword, propBasePrompt: "", genre },
        props: newProps.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          descriptionKo: p.descriptionKo,
          appearingClips: p.appearingClips,
          designSheetPrompt: p.designSheetPrompt,
          designSheetImageRef: p.designSheetImageUrl || "",
          referenceImageRef: p.referenceImageUrl,
        })),
        detectedIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detect props");
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    detectedIds,
    storyboardGenerator.scenes,
    genre,
    customApiKey,
    currentProjectId,
    styleKeyword,
    setPropDesignerResult,
  ]);

  // Generate design sheet image for a prop
  const handleGenerateImage = useCallback(
    async (propId: string, prompt: string, referenceImageBase64?: string) => {
      setProps((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, isGenerating: true } : p))
      );

      try {
        const response = await fetch("/api/generate_prop_sheet/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            referenceImageBase64,
            aspectRatio: "16:9",
            customApiKey: customApiKey || undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Image generation failed");

        // Upload to S3
        if (currentProjectId) {
          const uploadResponse = await fetch("/api/mithril/s3/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: currentProjectId,
              imageType: "prop",
              propId,
              propSubtype: "designsheet",
              base64: data.imageBase64,
            }),
          });

          const uploadData = await uploadResponse.json();
          if (uploadResponse.ok) {
            // Update Firestore
            await updatePropDesignSheetImage(
              currentProjectId,
              propId,
              uploadData.url,
              prompt
            );

            // Update local state with S3 URL
            setProps((prev) =>
              prev.map((p) =>
                p.id === propId
                  ? {
                      ...p,
                      designSheetImageUrl: uploadData.url,
                      designSheetPrompt: prompt,
                      isGenerating: false,
                    }
                  : p
              )
            );
            return;
          }
        }

        // Fallback to base64 if upload fails
        setProps((prev) =>
          prev.map((p) =>
            p.id === propId
              ? {
                  ...p,
                  designSheetImageBase64: data.imageBase64,
                  designSheetPrompt: prompt,
                  isGenerating: false,
                }
              : p
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Image generation failed");
        setProps((prev) =>
          prev.map((p) => (p.id === propId ? { ...p, isGenerating: false } : p))
        );
      }
    },
    [currentProjectId, customApiKey]
  );

  // Set reference image for a prop
  const handleSetReferenceImage = useCallback(
    async (propId: string, base64: string) => {
      // Upload to S3
      if (currentProjectId) {
        try {
          const uploadResponse = await fetch("/api/mithril/s3/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: currentProjectId,
              imageType: "prop",
              propId,
              propSubtype: "reference",
              base64: base64.includes("base64,") ? base64.split("base64,")[1] : base64,
            }),
          });

          const uploadData = await uploadResponse.json();
          if (uploadResponse.ok) {
            await updatePropReferenceImage(currentProjectId, propId, uploadData.url);

            setProps((prev) =>
              prev.map((p) =>
                p.id === propId ? { ...p, referenceImageUrl: uploadData.url } : p
              )
            );
            return;
          }
        } catch (err) {
          console.error("Failed to upload reference image:", err);
        }
      }

      // Fallback to local base64
      setProps((prev) =>
        prev.map((p) =>
          p.id === propId ? { ...p, referenceImageBase64: base64 } : p
        )
      );
    },
    [currentProjectId]
  );

  const selectedProp = props.find((p) => p.id === selectedPropId);

  // Check if storyboard is available
  const hasStoryboard = storyboardGenerator.scenes && storyboardGenerator.scenes.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
            Prop Designer
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Detect and design recurring props/objects from your storyboard
          </p>
        </div>

        {/* Genre selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Genre/Era:</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 focus:ring-1 focus:ring-teal-500 outline-none w-40"
            placeholder="e.g., High Fantasy"
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* No storyboard warning */}
      {!hasStoryboard && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6 text-center">
          <p className="text-yellow-300">
            No storyboard data available. Please generate a storyboard in Stage 4 first.
          </p>
        </div>
      )}

      {hasStoryboard && (
        <>
          {/* Detection Panel */}
          <DetectionPanel
            detectedIds={detectedIds}
            onToggleCategory={handleToggleCategory}
            onRemoveId={handleRemoveId}
            onDetectProps={handleDetectProps}
            isAnalyzing={isAnalyzing}
            totalClips={storyboardGenerator.scenes.reduce(
              (acc, scene) => acc + scene.clips.length,
              0
            )}
          />

          {/* Props Grid */}
          {props.length > 0 && (
            <PropGrid
              props={props}
              selectedPropId={selectedPropId}
              onSelectProp={setSelectedPropId}
              onGenerateImage={handleGenerateImage}
            />
          )}

          {/* Prop Detail */}
          {selectedProp && (
            <PropDetail
              prop={selectedProp}
              genre={genre}
              styleKeyword={styleKeyword}
              onClose={() => setSelectedPropId(null)}
              onGenerateImage={handleGenerateImage}
              onSetReferenceImage={handleSetReferenceImage}
            />
          )}

          {/* Clear button */}
          {props.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearPropDesignerData}
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded text-sm font-bold transition-colors"
              >
                Clear All Props
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
