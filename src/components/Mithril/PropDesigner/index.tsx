"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useProject } from "@/contexts/ProjectContext";
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

// CSV clip structure for imported data
interface CsvClip {
  story: string;
  imagePrompt: string;
  imagePromptEnd: string;
  videoPrompt: string;
  dialogue: string;
  backgroundId: string;
}

interface CsvScene {
  clips: CsvClip[];
}

// CSV parser - handles quoted fields and multi-line values
const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (current !== "" || row.length > 0) {
        row.push(current);
        result.push(row);
        row = [];
        current = "";
      }
      if (char === "\r" && nextChar === "\n") i++;
    } else {
      current += char;
    }
  }

  if (current !== "" || row.length > 0) {
    row.push(current);
    result.push(row);
  }

  return result;
};

export default function PropDesigner() {
  const { currentProjectId } = useProject();
  const {
    storyboardGenerator,
    propDesignerGenerator,
    setPropDesignerResult,
    clearPropDesignerData,
    customApiKey,
  } = useMithril();

  // File input ref for CSV import
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Local state
  const [props, setProps] = useState<Prop[]>([]);
  const [detectedIds, setDetectedIds] = useState<DetectedId[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [genre, setGenre] = useState<string>("Modern");
  const [styleKeyword, setStyleKeyword] = useState<string>("anime 2d style");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSV imported scenes (local storyboard data)
  const [importedScenes, setImportedScenes] = useState<CsvScene[]>([]);
  // Version counter to force re-computation when CSV is imported
  const [importVersion, setImportVersion] = useState(0);

  // CSV Import handler
  const handleCSVImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[CSV Import] No file selected");
      return;
    }

    console.log("[CSV Import] File selected:", file.name, file.size, "bytes");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        console.log("[CSV Import] File read but text is empty");
        return;
      }

      console.log("[CSV Import] File read, length:", text.length);

      const rows = parseCSV(text);
      console.log("[CSV Import] Parsed rows:", rows.length);

      if (rows.length < 2) {
        setError("CSV file is empty or has no data rows");
        return;
      }

      const header = rows[0].map((h) => h.trim());
      console.log("[CSV Import] Headers found:", header);

      const getIdx = (labels: string[]) =>
        header.findIndex((h) =>
          labels.some((l) => h === l || h.toLowerCase() === l.toLowerCase())
        );

      const map = {
        bgId: getIdx(["Background ID", "배경 ID"]),
        story: getIdx(["Story", "스토리"]),
        imgStart: getIdx(["Image prompt (Start)", "Image Prompt"]),
        imgEnd: getIdx(["Image prompt (End)"]),
        vid: getIdx(["Video Prompt"]),
        dia: getIdx(["Dialogue (Ko)", "Dialogue"]),
      };

      console.log("[CSV Import] Column mapping:", map);

      const clips: CsvClip[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const val = (idx: number) => (idx >= 0 && idx < row.length ? row[idx] : "");
        clips.push({
          story: val(map.story),
          imagePrompt: val(map.imgStart),
          imagePromptEnd: val(map.imgEnd),
          videoPrompt: val(map.vid),
          dialogue: val(map.dia),
          backgroundId: val(map.bgId),
        });
      }

      console.log("[CSV Import] Clips created:", clips.length);
      if (clips.length > 0) {
        console.log("[CSV Import] First clip sample:", clips[0]);
      }

      if (clips.length === 0) {
        setError("No valid clips found in CSV");
        return;
      }

      console.log("[CSV Import] Setting importedScenes with", clips.length, "clips");

      // Set the scenes and increment version to force re-computation
      const newScenes: CsvScene[] = [{ clips }];
      setImportedScenes(newScenes);
      setImportVersion(prev => prev + 1);

      console.log("[CSV Import] State updates dispatched");

      // Auto-detect genre from content
      const sampleText = clips.slice(0, 10).map((c) => `${c.story} ${c.imagePrompt}`).join(" ");
      if (sampleText.match(/sword|magic|castle|knight|dragon|kingdom/i)) {
        setGenre("High Fantasy");
      } else if (sampleText.match(/spaceship|laser|robot|cyberpunk|future|neon/i)) {
        setGenre("Sci-Fi / Cyberpunk");
      } else if (sampleText.match(/historical|joseon|dynasty|samurai|ancient/i)) {
        setGenre("Historical Period");
      } else if (sampleText.match(/school|student|classroom|romance/i)) {
        setGenre("School Life / Slice of Life");
      }

      setError(null);
    };

    reader.readAsText(file);
    // Clear the input value so the same file can be selected again
    if (e.target) e.target.value = "";
  }, []);

  // Debug: log when importedScenes changes
  useEffect(() => {
    console.log("[PropDesigner] importedScenes state changed:", importedScenes.length, "scenes");
    if (importedScenes.length > 0) {
      console.log("[PropDesigner] First scene has", importedScenes[0].clips.length, "clips");
    }
  }, [importedScenes]);

  // Determine active scenes (context or imported)
  const contextScenes = storyboardGenerator.scenes;
  const hasContextScenes = contextScenes && contextScenes.length > 0;
  const hasImportedScenes = importedScenes.length > 0;

  // Use a memoized value that depends on the actual array lengths
  // Prioritize imported scenes when user explicitly imports a CSV
  const activeScenes = useMemo(() => {
    console.log("[PropDesigner] Recomputing activeScenes - context:", hasContextScenes, "imported:", hasImportedScenes);
    if (hasImportedScenes) {
      console.log("[PropDesigner] Using imported scenes (priority)");
      return importedScenes;
    }
    if (hasContextScenes) {
      return contextScenes;
    }
    return [];
  }, [contextScenes, importedScenes, hasContextScenes, hasImportedScenes]);

  console.log("[PropDesigner] activeScenes length:", activeScenes.length);

  // Load from context on mount
  useEffect(() => {
    if (propDesignerGenerator.result) {
      const result = propDesignerGenerator.result;
      console.log("[PropDesigner] Loading from context:", result.props.length, "props");
      result.props.forEach((p, i) => {
        console.log(`[PropDesigner] Prop ${i}: ${p.name}, imageRef: ${p.designSheetImageRef?.substring(0, 50)}...`);
      });

      setGenre(result.settings?.genre || "Modern");
      setStyleKeyword(result.settings?.styleKeyword || "anime 2d style");
      // Only set detected IDs from context if we don't have imported scenes
      // (imported scenes will trigger their own ID extraction)
      if (!hasImportedScenes) {
        setDetectedIds(result.detectedIds || []);
      }
      setProps(
        result.props.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          descriptionKo: p.descriptionKo,
          appearingClips: p.appearingClips || [],
          contextPrompts: [],
          designSheetPrompt: p.designSheetPrompt || "",
          designSheetImageUrl: p.designSheetImageRef,
          referenceImageUrl: p.referenceImageRef,
          isGenerating: false,
        }))
      );
    }
  }, [propDesignerGenerator.result, hasImportedScenes]);

  // Extract IDs from storyboard clips (context or imported)
  // Use useEffect for the side effect (setDetectedIds) instead of useMemo
  // Include importVersion to force re-run when CSV is imported
  useEffect(() => {
    console.log("[PropDesigner] ID extraction effect running, importVersion:", importVersion, "activeScenes:", activeScenes.length);

    if (!activeScenes || activeScenes.length === 0) {
      console.log("[PropDesigner] No active scenes, clearing detected IDs");
      setDetectedIds([]);
      return;
    }

    const characterIds = new Set<string>();
    const objectIds = new Set<string>();
    const idOccurrences = new Map<string, { clipIds: string[]; contexts: { clipId: string; text: string }[] }>();

    activeScenes.forEach((scene, sIdx) => {
      scene.clips.forEach((clip, cIdx) => {
        const clipId = `${sIdx + 1}-${cIdx + 1}`;
        const combinedText = `${clip.story || ""} ${clip.imagePrompt || ""} ${clip.imagePromptEnd || ""} ${clip.videoPrompt || ""} ${clip.dialogue || ""} ${clip.backgroundId || ""}`;
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

    console.log("[PropDesigner] Extracted IDs from", activeScenes.length, "scenes:", allDetected.length, "IDs found");
    setDetectedIds(allDetected);
  }, [activeScenes, importVersion]);

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

  // Detect props and characters using AI
  const handleDetectProps = useCallback(async () => {
    const objectIds = detectedIds.filter((d) => d.category === "object").map((d) => d.id);
    const characterIds = detectedIds.filter((d) => d.category === "character").map((d) => d.id);

    if (objectIds.length === 0 && characterIds.length === 0) {
      setError("No IDs to analyze. Please detect IDs from the storyboard first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/generate_prop_sheet/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: activeScenes,
          objectIds,
          characterIds,
          genre,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      // Create a map of existing props by name to preserve images
      const existingPropsByName = new Map<string, Prop>();
      props.forEach((p) => {
        if (p.name) {
          existingPropsByName.set(p.name.toLowerCase(), p);
        }
      });

      // Convert API response to Prop objects for objects
      const newObjects: Prop[] = (data.objects || []).map((obj: {
        name: string;
        description: string;
        descriptionKo: string;
        appearingClips: string[];
        contextPrompts: { clipId: string; text: string }[];
        productSheetPrompt: string;
      }) => {
        const existing = existingPropsByName.get(obj.name.toLowerCase());
        return {
          id: existing?.id || crypto.randomUUID(),
          name: obj.name,
          category: "object" as const,
          description: obj.description,
          descriptionKo: obj.descriptionKo,
          appearingClips: obj.appearingClips,
          contextPrompts: obj.contextPrompts,
          designSheetPrompt: existing?.designSheetPrompt || obj.productSheetPrompt,
          designSheetImageUrl: existing?.designSheetImageUrl,
          designSheetImageBase64: existing?.designSheetImageBase64,
          referenceImageUrl: existing?.referenceImageUrl,
          referenceImageBase64: existing?.referenceImageBase64,
          isGenerating: false,
        };
      });

      // Convert API response to Prop objects for characters
      const newCharacters: Prop[] = (data.characters || []).map((char: {
        name: string;
        description: string;
        descriptionKo: string;
        appearingClips: string[];
        contextPrompts: { clipId: string; text: string }[];
        characterSheetPrompt: string;
      }) => {
        const existing = existingPropsByName.get(char.name.toLowerCase());
        return {
          id: existing?.id || crypto.randomUUID(),
          name: char.name,
          category: "character" as const,
          description: char.description,
          descriptionKo: char.descriptionKo,
          appearingClips: char.appearingClips,
          contextPrompts: char.contextPrompts,
          designSheetPrompt: existing?.designSheetPrompt || char.characterSheetPrompt,
          designSheetImageUrl: existing?.designSheetImageUrl,
          designSheetImageBase64: existing?.designSheetImageBase64,
          referenceImageUrl: existing?.referenceImageUrl,
          referenceImageBase64: existing?.referenceImageBase64,
          isGenerating: false,
        };
      });

      const allNewProps = [...newCharacters, ...newObjects];
      setProps(allNewProps);

      // Save to Firestore - first clear existing props, then save new ones
      if (currentProjectId) {
        // Clear existing props first to avoid duplicates
        await clearPropDesignerData();

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

        for (const prop of allNewProps) {
          await saveProp(currentProjectId, {
            id: prop.id,
            name: prop.name,
            category: prop.category,
            description: prop.description,
            descriptionKo: prop.descriptionKo,
            appearingClips: prop.appearingClips,
            contextPrompts: prop.contextPrompts,
            designSheetPrompt: prop.designSheetPrompt,
            designSheetImageRef: prop.designSheetImageUrl,
            referenceImageRef: prop.referenceImageUrl,
          });
        }
      }

      // Update context
      setPropDesignerResult({
        settings: { styleKeyword, propBasePrompt: "", genre },
        props: allNewProps.map((p) => ({
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
      setError(err instanceof Error ? err.message : "Failed to detect props/characters");
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    detectedIds,
    activeScenes,
    genre,
    customApiKey,
    currentProjectId,
    styleKeyword,
    setPropDesignerResult,
    props,
    clearPropDesignerData,
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
            setProps((prev) => {
              const newProps = prev.map((p) =>
                p.id === propId
                  ? {
                      ...p,
                      designSheetImageUrl: uploadData.url,
                      designSheetPrompt: prompt,
                      isGenerating: false,
                    }
                  : p
              );

              // Also update context so it persists across re-renders
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

              return newProps;
            });
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
    [currentProjectId, customApiKey, styleKeyword, genre, detectedIds, setPropDesignerResult]
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

  // Clear all props (local state + context + Firestore)
  const handleClearAll = useCallback(async () => {
    // Clear local state
    setProps([]);
    setSelectedPropId(null);
    // Clear context and Firestore
    await clearPropDesignerData();
  }, [clearPropDesignerData]);

  // Check if storyboard is available (from context or imported CSV)
  const hasStoryboard = activeScenes && activeScenes.length > 0;
  const hasContextStoryboard = storyboardGenerator.scenes && storyboardGenerator.scenes.length > 0;

  // Calculate total clips from active scenes
  const totalClips = activeScenes.reduce((acc, scene) => acc + scene.clips.length, 0);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-teal-400 to-cyan-500">
            Character & Prop Designer
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Detect and design characters and props from your storyboard
          </p>
        </div>

        {/* Genre selector and CSV import */}
        <div className="flex items-center gap-4">
          {/* CSV Import Button */}
          <div>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
            <button
              onClick={() => csvInputRef.current?.click()}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded text-sm font-bold transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              Import CSV
            </button>
          </div>

          {/* Genre selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Genre:</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 focus:ring-1 focus:ring-teal-500 outline-none w-40"
              placeholder="e.g., High Fantasy"
            />
          </div>
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

      {/* No storyboard warning with CSV import option */}
      {!hasStoryboard && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center space-y-4">
          <div className="text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-16 h-16 mx-auto mb-4 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <p className="text-lg font-bold text-gray-300 mb-2">No Storyboard Data</p>
            <p className="text-sm text-gray-500 mb-4">
              Generate a storyboard in Stage 4 or import a CSV file with storyboard data.
            </p>
          </div>
          <button
            onClick={() => csvInputRef.current?.click()}
            className="px-6 py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            Import Storyboard CSV
          </button>
        </div>
      )}

      {/* Data source indicator - show when using imported CSV */}
      {hasImportedScenes && (
        <div className="bg-teal-900/30 border border-teal-700 rounded-lg px-4 py-2 text-teal-300 text-sm flex items-center justify-between">
          <span>
            Using imported CSV data ({totalClips} clips)
          </span>
          <button
            onClick={() => setImportedScenes([])}
            className="text-teal-400 hover:text-teal-300 text-xs font-bold"
          >
            Clear Import
          </button>
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
            totalClips={totalClips}
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
                onClick={handleClearAll}
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
