"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useProject } from "@/contexts/ProjectContext";
import { Prop, DetectedId, ID_PATTERN, categorizeId, CHARACTER_KEYWORDS } from "./types";
import DetectionPanel from "./DetectionPanel";
import PropListView from "./PropListView";
import StoryboardTable from "./StoryboardTable";
import {
  savePropDesignerSettings,
  saveProp,
  saveDetectedIds,
  updatePropDesignSheetImage,
  updatePropReferenceImage,
} from "../services/firestore";
import { deletePropDesignSheetImage } from "../services/s3";

// CSV clip structure for imported data
// CSV headers: Scene,Clip,Length,Accumulated Time,Background ID,Background Prompt,Story,
// Image Prompt (Start),Image Prompt (End),Video Prompt,Sora Video Prompt,
// Dialogue (Ko),Dialogue (En),SFX (Ko),SFX (En),BGM (Ko),BGM (En)
interface CsvClip {
  story: string;
  imagePrompt: string;
  imagePromptEnd: string;
  videoPrompt: string;
  dialogue: string;
  dialogueEn: string;
  backgroundId: string;
  backgroundPrompt: string;
  length: string;
  accumulatedTime: string;
  soraVideoPrompt: string;
  sfx: string;
  sfxEn: string;
  bgm: string;
  bgmEn: string;
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
  const [genre, setGenre] = useState<string>("Modern");
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);
  const [isObjectSheetOpen, setIsObjectSheetOpen] = useState(false);
  // Track if modals were opened from refresh (should start minimized) vs detection (should start expanded)
  const [charactersLoadedFromContext, setCharactersLoadedFromContext] = useState(false);
  const [objectsLoadedFromContext, setObjectsLoadedFromContext] = useState(false);
  const [styleKeyword, setStyleKeyword] = useState<string>("anime 2d style");
  const [isAnalyzingCharacters, setIsAnalyzingCharacters] = useState(false);
  const [isAnalyzingObjects, setIsAnalyzingObjects] = useState(false);
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

      // Match CSV headers: Scene,Clip,Length,Accumulated Time,Background ID,Background Prompt,Story,
      // Image Prompt (Start),Image Prompt (End),Video Prompt,Sora Video Prompt,
      // Dialogue (Ko),Dialogue (En),SFX (Ko),SFX (En),BGM (Ko),BGM (En)
      const map = {
        scene: getIdx(["Scene"]),
        clip: getIdx(["Clip"]),
        length: getIdx(["Length"]),
        accTime: getIdx(["Accumulated Time"]),
        bgId: getIdx(["Background ID"]),
        bgPrompt: getIdx(["Background Prompt"]),
        story: getIdx(["Story"]),
        imgStart: getIdx(["Image Prompt (Start)"]),
        imgEnd: getIdx(["Image Prompt (End)"]),
        vid: getIdx(["Video Prompt"]),
        soraVid: getIdx(["Sora Video Prompt"]),
        dia: getIdx(["Dialogue (Ko)"]),
        diaEn: getIdx(["Dialogue (En)"]),
        sfx: getIdx(["SFX (Ko)"]),
        sfxEn: getIdx(["SFX (En)"]),
        bgm: getIdx(["BGM (Ko)"]),
        bgmEn: getIdx(["BGM (En)"]),
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
          dialogueEn: val(map.diaEn),
          backgroundId: val(map.bgId),
          backgroundPrompt: val(map.bgPrompt),
          length: val(map.length),
          accumulatedTime: val(map.accTime),
          soraVideoPrompt: val(map.soraVid),
          sfx: val(map.sfx),
          sfxEn: val(map.sfxEn),
          bgm: val(map.bgm),
          bgmEn: val(map.bgmEn),
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

      // Clear existing props and detected IDs to start fresh with imported data
      setProps([]);
      setDetectedIds([]);

      // Set the scenes and increment version to force re-computation
      const newScenes: CsvScene[] = [{ clips }];
      setImportedScenes(newScenes);
      setImportVersion(prev => prev + 1);

      console.log("[CSV Import] State updates dispatched - props and detectedIds cleared");

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
    if (hasImportedScenes) {
      return importedScenes;
    }
    if (hasContextScenes) {
      return contextScenes;
    }
    return [];
  }, [contextScenes, importedScenes, hasContextScenes, hasImportedScenes]);

  // Load from context on mount (only if we don't have imported scenes)
  useEffect(() => {
    // Skip loading from context if we have imported scenes (CSV import should take precedence)
    if (hasImportedScenes) {
      return;
    }

    if (propDesignerGenerator.result) {
      const result = propDesignerGenerator.result;

      setGenre(result.settings?.genre || "Modern");
      setStyleKeyword(result.settings?.styleKeyword || "anime 2d style");
      setDetectedIds(result.detectedIds || []);

      const loadedProps = result.props.map((p) => ({
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
        // Multiple reference images
        referenceImages: p.referenceImageRefs,
        // Character metadata (Easy Mode)
        age: p.age,
        gender: p.gender,
        personality: p.personality,
        role: p.role,
        // Variant detection
        isVariant: p.isVariant,
        variantDetails: p.variantDetails,
        variantVisuals: p.variantVisuals,
        isGenerating: false,
      }));

      setProps(loadedProps);

      // Auto-open modals if there are props of that category (start minimized since loaded from context)
      const hasCharacters = loadedProps.some((p) => p.category === "character");
      const hasObjects = loadedProps.some((p) => p.category === "object");
      if (hasCharacters) {
        setIsCharacterSheetOpen(true);
        setCharactersLoadedFromContext(true); // Start minimized
      }
      if (hasObjects) {
        setIsObjectSheetOpen(true);
        setObjectsLoadedFromContext(true); // Start minimized
      }
    }
  }, [propDesignerGenerator.result, hasImportedScenes]);

  // Extract IDs from storyboard clips (context or imported)
  // Use useEffect for the side effect (setDetectedIds) instead of useMemo
  // Include importVersion to force re-run when CSV is imported
  useEffect(() => {
    console.log("[PropDesigner] Extracting IDs from", activeScenes.length, "scenes (importVersion:", importVersion, ")");

    if (!activeScenes || activeScenes.length === 0) {
      setDetectedIds([]);
      return;
    }

    const characterIds = new Set<string>();
    const objectIds = new Set<string>();
    const idOccurrences = new Map<string, { clipIds: string[]; contexts: { clipId: string; text: string }[] }>();

    activeScenes.forEach((scene, sIdx) => {
      scene.clips.forEach((clip, cIdx) => {
        const clipId = `${sIdx + 1}-${cIdx + 1}`;
        // Include all text fields for ID extraction
        const combinedText = [
          clip.story || "",
          clip.imagePrompt || "",
          clip.imagePromptEnd || "",
          clip.videoPrompt || "",
          clip.dialogue || "",
          clip.dialogueEn || "",
          clip.backgroundId || "",
          clip.backgroundPrompt || "",
          clip.soraVideoPrompt || "",
          clip.sfx || "",
          clip.sfxEn || "",
          clip.bgm || "",
          clip.bgmEn || "",
        ].join(" ");
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
    console.log("[PropDesigner] Extracted", allDetected.length, "IDs:", allDetected.map(d => d.id).join(", "));
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

  // Helper to save props to Firestore and update context
  const saveAndUpdateProps = useCallback(
    async (newProps: Prop[], category: "character" | "object") => {
      // Merge with existing props of the other category
      const otherCategoryProps = props.filter((p) => p.category !== category);
      const allProps = [...otherCategoryProps, ...newProps];
      setProps(allProps);

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
            // Multiple reference images
            referenceImageRefs: prop.referenceImages,
            // Character metadata (Easy Mode)
            age: prop.age,
            gender: prop.gender,
            personality: prop.personality,
            role: prop.role,
            // Variant detection
            isVariant: prop.isVariant,
            variantDetails: prop.variantDetails,
            variantVisuals: prop.variantVisuals,
          });
        }
      }

      // Update context
      setPropDesignerResult({
        settings: { styleKeyword, propBasePrompt: "", genre },
        props: allProps.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          descriptionKo: p.descriptionKo,
          appearingClips: p.appearingClips,
          designSheetPrompt: p.designSheetPrompt,
          designSheetImageRef: p.designSheetImageUrl || "",
          referenceImageRef: p.referenceImageUrl,
          // Multiple reference images
          referenceImageRefs: p.referenceImages,
          // Character metadata (Easy Mode)
          age: p.age,
          gender: p.gender,
          personality: p.personality,
          role: p.role,
          // Variant detection
          isVariant: p.isVariant,
          variantDetails: p.variantDetails,
          variantVisuals: p.variantVisuals,
        })),
        detectedIds,
      });
    },
    [currentProjectId, detectedIds, genre, props, setPropDesignerResult, styleKeyword]
  );

  // Detect characters using AI
  const handleDetectCharacters = useCallback(async () => {
    const characterIds = detectedIds.filter((d) => d.category === "character").map((d) => d.id);

    if (characterIds.length === 0) {
      setError("No character IDs to analyze.");
      return;
    }

    setIsAnalyzingCharacters(true);
    setError(null);

    try {
      const response = await fetch("/api/generate_prop_sheet/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: activeScenes,
          objectIds: [],
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

      // Convert API response to Prop objects for characters
      const newCharacters: Prop[] = (data.characters || []).map((char: {
        name: string;
        description: string;
        descriptionKo: string;
        appearingClips: string[];
        contextPrompts: { clipId: string; text: string }[];
        characterSheetPrompt: string;
        // Easy Mode metadata
        age?: string;
        gender?: string;
        personality?: string;
        role?: string;
        // Variant detection
        isVariant?: boolean;
        variantDetails?: string | null;
        variantVisuals?: string | null;
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
          // Easy Mode metadata (preserve existing if available)
          age: existing?.age || char.age,
          gender: existing?.gender || char.gender,
          personality: existing?.personality || char.personality,
          role: existing?.role || char.role,
          // Variant detection
          isVariant: char.isVariant || false,
          variantDetails: char.variantDetails || undefined,
          variantVisuals: char.variantVisuals || undefined,
        };
      });

      await saveAndUpdateProps(newCharacters, "character");

      // Auto-open the character sheet modal (expanded, not minimized)
      setCharactersLoadedFromContext(false);
      setIsCharacterSheetOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detect characters");
    } finally {
      setIsAnalyzingCharacters(false);
    }
  }, [
    detectedIds,
    activeScenes,
    genre,
    customApiKey,
    props,
    saveAndUpdateProps,
  ]);

  // Detect objects using AI
  const handleDetectObjects = useCallback(async () => {
    const objectIds = detectedIds.filter((d) => d.category === "object").map((d) => d.id);

    if (objectIds.length === 0) {
      setError("No object IDs to analyze.");
      return;
    }

    setIsAnalyzingObjects(true);
    setError(null);

    try {
      const response = await fetch("/api/generate_prop_sheet/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: activeScenes,
          objectIds,
          characterIds: [],
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

      await saveAndUpdateProps(newObjects, "object");

      // Auto-open the object sheet modal (expanded, not minimized)
      setObjectsLoadedFromContext(false);
      setIsObjectSheetOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detect objects");
    } finally {
      setIsAnalyzingObjects(false);
    }
  }, [
    detectedIds,
    activeScenes,
    genre,
    customApiKey,
    props,
    saveAndUpdateProps,
  ]);

  // Generate design sheet image for a prop (supports multiple reference images)
  const handleGenerateImage = useCallback(
    async (propId: string, prompt: string, referenceImages?: string[]) => {
      setProps((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, isGenerating: true } : p))
      );

      try {
        // Delete old design sheet image from S3 before generating new one
        if (currentProjectId) {
          try {
            await deletePropDesignSheetImage(currentProjectId, propId);
            console.log(`[PropDesigner] Deleted old design sheet for prop: ${propId}`);
          } catch (error) {
            console.warn(`[PropDesigner] Failed to delete old design sheet (may not exist):`, error);
          }
        }

        // Support both single reference (legacy) and multiple references
        const refImagesForApi = referenceImages?.map((img) =>
          img.includes("base64,") ? img.split("base64,")[1] : img
        );

        const response = await fetch("/api/generate_prop_sheet/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            referenceImages: refImagesForApi,
            // Legacy support: also send first image as referenceImageBase64
            referenceImageBase64: refImagesForApi?.[0],
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
                  // Multiple reference images
                  referenceImageRefs: p.referenceImages,
                  // Character metadata (Easy Mode)
                  age: p.age,
                  gender: p.gender,
                  personality: p.personality,
                  role: p.role,
                  // Variant detection
                  isVariant: p.isVariant,
                  variantDetails: p.variantDetails,
                  variantVisuals: p.variantVisuals,
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

  // Set reference images for a prop (supports multiple images)
  const handleSetReferenceImages = useCallback(
    async (propId: string, images: string[]) => {
      // Update local state immediately with base64 images
      setProps((prev) => {
        const newProps = prev.map((p) =>
          p.id === propId ? { ...p, referenceImages: images } : p
        );

        // Also update context so reference images persist
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
            referenceImageRefs: p.referenceImages,
            age: p.age,
            gender: p.gender,
            personality: p.personality,
            role: p.role,
            isVariant: p.isVariant,
            variantDetails: p.variantDetails,
            variantVisuals: p.variantVisuals,
          })),
          detectedIds,
        });

        return newProps;
      });

      // TODO: In the future, upload all images to S3 and store URLs
      // For now, just keep them as base64 in local state
    },
    [styleKeyword, genre, detectedIds, setPropDesignerResult]
  );

  // Update prop fields
  const handleUpdateProp = useCallback(
    (propId: string, updates: Partial<Prop>) => {
      setProps((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, ...updates } : p))
      );
    },
    []
  );

  // Clear all props (local state + context + Firestore)
  const handleClearAll = useCallback(async () => {
    // Clear local state
    setProps([]);
    // Clear context and Firestore
    await clearPropDesignerData();
  }, [clearPropDesignerData]);

  // JSON file input ref for session import
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Export session as JSON
  const handleExportSession = useCallback(() => {
    const session = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      settings: {
        styleKeyword,
        genre,
      },
      detectedIds: detectedIds.map((d) => ({
        id: d.id,
        category: d.category,
        clipIds: d.clipIds,
        contexts: d.contexts,
        occurrences: d.occurrences,
      })),
      props: props.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        descriptionKo: p.descriptionKo,
        appearingClips: p.appearingClips,
        contextPrompts: p.contextPrompts,
        designSheetPrompt: p.designSheetPrompt,
        designSheetImageUrl: p.designSheetImageUrl,
        referenceImages: p.referenceImages,
        age: p.age,
        gender: p.gender,
        personality: p.personality,
        role: p.role,
        isVariant: p.isVariant,
        variantDetails: p.variantDetails,
        variantVisuals: p.variantVisuals,
      })),
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `propdesigner_session_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [styleKeyword, genre, detectedIds, props]);

  // Import session from JSON
  const handleImportSession = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const session = JSON.parse(text);

        // Validate session structure
        if (!session.props || !Array.isArray(session.props)) {
          setError("Invalid session file: missing props array");
          return;
        }

        // Load settings
        if (session.settings) {
          if (session.settings.styleKeyword) setStyleKeyword(session.settings.styleKeyword);
          if (session.settings.genre) setGenre(session.settings.genre);
        }

        // Load detected IDs
        if (session.detectedIds && Array.isArray(session.detectedIds)) {
          setDetectedIds(session.detectedIds);
        }

        // Load props
        const loadedProps: Prop[] = session.props.map((p: Record<string, unknown>) => ({
          id: (p.id as string) || crypto.randomUUID(),
          name: (p.name as string) || "",
          category: (p.category as "character" | "object") || "object",
          description: (p.description as string) || "",
          descriptionKo: (p.descriptionKo as string) || "",
          appearingClips: (p.appearingClips as string[]) || [],
          contextPrompts: (p.contextPrompts as { clipId: string; text: string }[]) || [],
          designSheetPrompt: (p.designSheetPrompt as string) || "",
          designSheetImageUrl: p.designSheetImageUrl as string | undefined,
          referenceImages: p.referenceImages as string[] | undefined,
          age: p.age as string | undefined,
          gender: p.gender as string | undefined,
          personality: p.personality as string | undefined,
          role: p.role as string | undefined,
          isVariant: p.isVariant as boolean | undefined,
          variantDetails: p.variantDetails as string | undefined,
          variantVisuals: p.variantVisuals as string | undefined,
          isGenerating: false,
        }));

        setProps(loadedProps);

        // Auto-open modals if there are props (start minimized)
        const hasCharacters = loadedProps.some((p) => p.category === "character");
        const hasObjects = loadedProps.some((p) => p.category === "object");
        if (hasCharacters) {
          setCharactersLoadedFromContext(true);
          setIsCharacterSheetOpen(true);
        }
        if (hasObjects) {
          setObjectsLoadedFromContext(true);
          setIsObjectSheetOpen(true);
        }

        setError(null);
      } catch (err) {
        setError("Failed to parse session file: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    };

    reader.readAsText(file);
    if (e.target) e.target.value = "";
  }, []);

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

          {/* Session Export/Import Buttons */}
          <div className="flex items-center gap-1 border-l border-gray-700 pl-4">
            <button
              onClick={handleExportSession}
              disabled={props.length === 0}
              className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-300 border border-gray-600 rounded text-xs font-bold transition-colors flex items-center gap-1"
              title="Export session as JSON"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Export
            </button>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleImportSession}
              className="hidden"
            />
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded text-xs font-bold transition-colors flex items-center gap-1"
              title="Import session from JSON"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              Import
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
            onDetectCharacters={handleDetectCharacters}
            onDetectObjects={handleDetectObjects}
            isAnalyzingCharacters={isAnalyzingCharacters}
            isAnalyzingObjects={isAnalyzingObjects}
            totalClips={totalClips}
          />

          {/* Storyboard Table */}
          <StoryboardTable scenes={activeScenes} totalClips={totalClips} />

          {/* Character Sheet Modal */}
          {isCharacterSheetOpen && (
            <PropListView
              props={props.filter((p) => p.category === "character")}
              genre={genre}
              styleKeyword={styleKeyword}
              onGenerateImage={handleGenerateImage}
              onSetReferenceImages={handleSetReferenceImages}
              onUpdateProp={handleUpdateProp}
              onClose={() => setIsCharacterSheetOpen(false)}
              onClearAll={handleClearAll}
              title="Character Sheet Generator"
              accentColor="purple"
              initialMinimized={charactersLoadedFromContext}
            />
          )}

          {/* Object Sheet Modal */}
          {isObjectSheetOpen && (
            <PropListView
              props={props.filter((p) => p.category === "object")}
              genre={genre}
              styleKeyword={styleKeyword}
              onGenerateImage={handleGenerateImage}
              onSetReferenceImages={handleSetReferenceImages}
              onUpdateProp={handleUpdateProp}
              onClose={() => setIsObjectSheetOpen(false)}
              onClearAll={handleClearAll}
              title="Object/Prop Sheet Generator"
              accentColor="cyan"
              initialMinimized={objectsLoadedFromContext}
            />
          )}
        </>
      )}
    </div>
  );
}
