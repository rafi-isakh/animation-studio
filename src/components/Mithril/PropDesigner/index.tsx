"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useProject } from "@/contexts/ProjectContext";
import { Prop, DetectedId, DetectionSession, ID_PATTERN, categorizeId, CHARACTER_KEYWORDS, getCharacterDesignSheetPrompt, getObjectDesignSheetPrompt } from "./types";
import DetectionPanel from "./DetectionPanel";
import PropListView from "./PropListView";
import StoryboardTable from "./StoryboardTable";
import {
  savePropDesignerSettings,
  saveProp,
  saveDetectedIds,
  updatePropDesignSheetImage,
  updatePropReferenceImage,
  getProps,
  deleteProp,
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
  refFileName: string;
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
  // Guard: prevent context-restore useEffect from re-running after our own syncToContext writes
  const hasRestoredFromContext = useRef(false);

  // Local state
  const [sessions, setSessions] = useState<DetectionSession[]>([]);
  const [detectedIds, setDetectedIds] = useState<DetectedId[]>([]);
  const [genre, setGenre] = useState<string>("Modern");
  const [styleKeyword, setStyleKeyword] = useState<string>("anime 2d style");
  const [isAnalyzingCharacters, setIsAnalyzingCharacters] = useState(false);
  const [isAnalyzingObjects, setIsAnalyzingObjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Session counters for auto-naming
  const [characterSessionCount, setCharacterSessionCount] = useState(0);
  const [objectSessionCount, setObjectSessionCount] = useState(0);

  // Derive flat props array from all sessions (for context persistence compatibility)
  const allProps = useMemo(() => sessions.flatMap(s => s.props), [sessions]);

  // CSV imported scenes (local storyboard data)
  const [importedScenes, setImportedScenes] = useState<CsvScene[]>([]);
  // Version counter to force re-computation when CSV is imported
  const [importVersion, setImportVersion] = useState(0);
  // CSV Character ID descriptions (CHARACTER_ID -> description from CSV)
  const [csvCharacterDescriptions, setCsvCharacterDescriptions] = useState<Map<string, string>>(new Map());
  // CSV Genre
  const [csvGenre, setCsvGenre] = useState<string | null>(null);

  // Per-clip generated preview images (key: "sIdx-cIdx", value: base64 data URL)
  const [generatedClipImages, setGeneratedClipImages] = useState<Record<string, string>>({});

  // Helper: update props within a specific session
  const updateSessionProps = useCallback((sessionId: string, updater: (props: Prop[]) => Prop[]) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, props: updater(s.props) } : s
    ));
  }, []);

  // CSV Import handler
  const handleCSVImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }


    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        return;
      }


      const rows = parseCSV(text);

      if (rows.length < 2) {
        setError("CSV file is empty or has no data rows");
        return;
      }

      const header = rows[0].map((h) => h.trim());

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
        refFileName: getIdx(["Reference Image", "Ref Image", "참조 이미지"]),
      };


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
          refFileName: val(map.refFileName),
        });
      }

      if (clips.length > 0) {
      }

      if (clips.length === 0) {
        setError("No valid clips found in CSV");
        return;
      }


      // Parse Character ID Summary and Genre from remaining rows
      const characterDescMap = new Map<string, string>();
      let parsedGenre: string | null = null;
      let inCharacterSection = false;
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        // Detect Character ID Summary section
        const firstCol = row[0]?.trim() || "";
        if (firstCol.toLowerCase().includes("character id") || 
            firstCol.toLowerCase().includes("캐릭터 id")) {
          // Check if this is a section header (not a data row)
          // Skip if second column is "Description" or empty (header row)
          if (row.length < 2 || !row[1]?.trim() || 
              row[1].toLowerCase().includes("description") || 
              row[1].toLowerCase().includes("설명")) {
            inCharacterSection = true;
            continue;
          }
        }
        
        // Detect Genre section
        if (firstCol.toLowerCase().includes("genre") || firstCol.toLowerCase().includes("장르")) {
          inCharacterSection = false;
          // Genre value might be in same row or next column
          if (row.length > 1 && row[1]?.trim()) {
            parsedGenre = row[1].trim();
          }
          continue;
        }
        
        // Parse character ID entries (format: CHARACTER_ID, description)
        if (inCharacterSection && row.length >= 2) {
          const characterId = row[0]?.trim();
          const description = row[1]?.trim();
          if (characterId && description && characterId.match(/^[A-Z][A-Z0-9_]+$/)) {
            characterDescMap.set(characterId, description);
          }
        }
      }

      
      // Clear existing sessions and detected IDs to start fresh with imported data
      setSessions([]);
      setCharacterSessionCount(0);
      setObjectSessionCount(0);
      setDetectedIds([]);

      // Set the scenes and increment version to force re-computation
      const newScenes: CsvScene[] = [{ clips }];
      setImportedScenes(newScenes);
      setImportVersion(prev => prev + 1);
      
      // Store character descriptions and genre
      setCsvCharacterDescriptions(characterDescMap);
      if (parsedGenre) {
        setCsvGenre(parsedGenre);
        setGenre(parsedGenre);
      } else {
        // Auto-detect genre from content if not found in CSV
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
      }

      setError(null);
    };

    reader.readAsText(file);
    // Clear the input value so the same file can be selected again
    if (e.target) e.target.value = "";
  }, []);

  useEffect(() => {
    if (importedScenes.length > 0) {
    }
  }, [importedScenes]);

  // Determine active scenes (context or imported)
  const contextScenes = storyboardGenerator.scenes;
  const contextCharacterIdSummary = storyboardGenerator.characterIdSummary;
  const contextGenre = storyboardGenerator.genre;
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
    // Skip if we already restored — prevents feedback loop where our own
    // syncToContext updates propDesignerGenerator.result and re-triggers this effect
    if (hasRestoredFromContext.current) {
      return;
    }

    if (propDesignerGenerator.result) {
      const result = propDesignerGenerator.result;

      setGenre(result.settings?.genre || "Modern");
      setStyleKeyword(result.settings?.styleKeyword || "anime 2d style");
      setDetectedIds(result.detectedIds || []);

      const loadedProps: Prop[] = result.props.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        descriptionKo: p.descriptionKo,
        csvDescription: p.csvDescription,
        appearingClips: p.appearingClips || [],
        contextPrompts: [],
        designSheetPrompt: p.designSheetPrompt || "",
        designSheetImageUrl: p.designSheetImageRef,
        referenceImageUrl: p.referenceImageRef,
        referenceImages: p.referenceImageRefs,
        age: p.age,
        gender: p.gender,
        hairColor: p.hairColor,
        hairStyle: p.hairStyle,
        eyeColor: p.eyeColor,
        personality: p.personality,
        role: p.role,
        isVariant: p.isVariant,
        variantDetails: p.variantDetails,
        variantVisuals: p.variantVisuals,
        isGenerating: false,
      }));

      // Restore sessions if available, otherwise create legacy sessions from flat props
      if (result.sessions && result.sessions.length > 0) {
        const restoredSessions: DetectionSession[] = result.sessions.map(sm => ({
          id: sm.id,
          name: sm.name,
          type: sm.type,
          timestamp: sm.timestamp,
          isMinimized: true, // Start minimized since loaded from context
          props: sm.props.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            descriptionKo: p.descriptionKo,
            csvDescription: p.csvDescription,
            appearingClips: p.appearingClips || [],
            contextPrompts: [],
            designSheetPrompt: p.designSheetPrompt || "",
            designSheetImageUrl: p.designSheetImageRef,
            referenceImageUrl: p.referenceImageRef,
            referenceImages: p.referenceImageRefs,
            age: p.age,
            gender: p.gender,
            hairColor: p.hairColor,
            hairStyle: p.hairStyle,
            eyeColor: p.eyeColor,
            personality: p.personality,
            role: p.role,
            isVariant: p.isVariant,
            variantDetails: p.variantDetails,
            variantVisuals: p.variantVisuals,
            isGenerating: false,
          })),
        }));
        setSessions(restoredSessions);
        const charCount = restoredSessions.filter(s => s.type === "character").length;
        const objCount = restoredSessions.filter(s => s.type === "object").length;
        setCharacterSessionCount(charCount);
        setObjectSessionCount(objCount);
      } else {
        // Legacy: create sessions from flat props array
        const restoredSessions: DetectionSession[] = [];
        const characterProps = loadedProps.filter(p => p.category === "character");
        const objectProps = loadedProps.filter(p => p.category === "object");
        let charCount = 0;
        let objCount = 0;
        if (characterProps.length > 0) {
          charCount = 1;
          restoredSessions.push({
            id: crypto.randomUUID(),
            name: "Character Sheet #1",
            type: "character",
            props: characterProps,
            timestamp: Date.now(),
            isMinimized: true,
          });
        }
        if (objectProps.length > 0) {
          objCount = 1;
          restoredSessions.push({
            id: crypto.randomUUID(),
            name: "Object Sheet #1",
            type: "object",
            props: objectProps,
            timestamp: Date.now(),
            isMinimized: true,
          });
        }
        setSessions(restoredSessions);
        setCharacterSessionCount(charCount);
        setObjectSessionCount(objCount);
      }
      hasRestoredFromContext.current = true;
    }
  }, [propDesignerGenerator.result, hasImportedScenes]);

  // Load characterIdSummary and genre from storyboard context (when not using CSV import)
  useEffect(() => {
    if (hasImportedScenes) return;
    if (propDesignerGenerator.result) return; // Already loaded from saved state

    if (contextGenre) {
      setGenre(contextGenre);
    }
    if (contextCharacterIdSummary && contextCharacterIdSummary.length > 0) {
      const descMap = new Map<string, string>();
      for (const char of contextCharacterIdSummary) {
        descMap.set(char.characterId, char.description);
      }
      setCsvCharacterDescriptions(descMap);
    }
  }, [contextCharacterIdSummary, contextGenre, hasImportedScenes, propDesignerGenerator.result]);

  // Extract IDs from storyboard clips (context or imported)
  // Use useEffect for the side effect (setDetectedIds) instead of useMemo
  // Include importVersion to force re-run when CSV is imported
  useEffect(() => {

    if (!activeScenes || activeScenes.length === 0) {
      setDetectedIds([]);
      return;
    }

    const characterIds = new Set<string>();
    const objectIds = new Set<string>();
    const idOccurrences = new Map<string, { clipIds: string[]; contexts: { clipId: string; text: string; refFileName?: string }[] }>();

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
                const refFileName = (clip as CsvClip).refFileName || undefined;
                occ.contexts.push({ clipId, text: contextText.substring(0, 200), ...(refFileName ? { refFileName } : {}) });
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

  // Helper to convert Prop to metadata for context persistence
  const propToMetadata = useCallback((p: Prop) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    descriptionKo: p.descriptionKo,
    csvDescription: p.csvDescription,
    appearingClips: p.appearingClips,
    designSheetPrompt: p.designSheetPrompt,
    designSheetImageRef: p.designSheetImageUrl || "",
    referenceImageRef: p.referenceImageUrl,
    referenceImageRefs: p.referenceImages,
    age: p.age,
    gender: p.gender,
    hairColor: p.hairColor,
    hairStyle: p.hairStyle,
    eyeColor: p.eyeColor,
    personality: p.personality,
    role: p.role,
    isVariant: p.isVariant,
    variantDetails: p.variantDetails,
    variantVisuals: p.variantVisuals,
  }), []);

  // Helper to sync all sessions to context
  const syncToContext = useCallback((updatedSessions: DetectionSession[]) => {
    const flatProps = updatedSessions.flatMap(s => s.props);
    setPropDesignerResult({
      settings: { styleKeyword, propBasePrompt: "", genre },
      props: flatProps.map(propToMetadata),
      detectedIds,
      sessions: updatedSessions.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        timestamp: s.timestamp,
        props: s.props.map(propToMetadata),
      })),
    });
  }, [styleKeyword, genre, detectedIds, setPropDesignerResult, propToMetadata]);

  // Helper to create a new session from detection results and save to Firestore
  const createSessionFromDetection = useCallback(
    async (newProps: Prop[], category: "character" | "object") => {
      // Create new session
      const sessionNumber = category === "character"
        ? characterSessionCount + 1
        : objectSessionCount + 1;
      const sessionName = category === "character"
        ? `Character Sheet #${sessionNumber}`
        : `Object Sheet #${sessionNumber}`;

      const newSession: DetectionSession = {
        id: crypto.randomUUID(),
        name: sessionName,
        type: category,
        props: newProps,
        timestamp: Date.now(),
        isMinimized: false, // Open expanded for new detections
      };

      // Update session counter
      if (category === "character") {
        setCharacterSessionCount(prev => prev + 1);
      } else {
        setObjectSessionCount(prev => prev + 1);
      }

      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);

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
            csvDescription: prop.csvDescription,
            appearingClips: prop.appearingClips,
            contextPrompts: prop.contextPrompts,
            designSheetPrompt: prop.designSheetPrompt,
            designSheetImageRef: prop.designSheetImageUrl,
            referenceImageRef: prop.referenceImageUrl,
            referenceImageRefs: prop.referenceImages,
            age: prop.age,
            gender: prop.gender,
            hairColor: prop.hairColor,
            hairStyle: prop.hairStyle,
            eyeColor: prop.eyeColor,
            personality: prop.personality,
            role: prop.role,
            isVariant: prop.isVariant,
            variantDetails: prop.variantDetails,
            variantVisuals: prop.variantVisuals,
          });
        }
      }

      // Update context
      syncToContext(updatedSessions);

      return newSession.id;
    },
    [currentProjectId, detectedIds, genre, sessions, styleKeyword, characterSessionCount, objectSessionCount, syncToContext]
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
      // Convert csvCharacterDescriptions Map to a plain object for the API
      const charDescObj: Record<string, string> = {};
      for (const [id, desc] of csvCharacterDescriptions.entries()) {
        charDescObj[id] = desc;
      }

      const response = await fetch("/api/generate_prop_sheet/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: activeScenes,
          objectIds: [],
          characterIds,
          characterDescriptions: Object.keys(charDescObj).length > 0 ? charDescObj : undefined,
          genre,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      // Create a map of existing props by name to preserve images
      const existingPropsByName = new Map<string, Prop>();
      allProps.forEach((p) => {
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
        hairColor?: string;
        hairStyle?: string;
        eyeColor?: string;
        personality?: string;
        role?: string;
        // Variant detection
        isVariant?: boolean;
        variantDetails?: string | null;
        variantVisuals?: string | null;
      }) => {
        const existing = existingPropsByName.get(char.name.toLowerCase());
        
        // Check if we have CSV description for this character ID
        // Match by exact name or by characterId contained in the name
        let csvDescription: string | null = null;
        // Try exact match first, then partial match
        if (csvCharacterDescriptions.has(char.name)) {
          csvDescription = csvCharacterDescriptions.get(char.name)!;
        } else if (csvCharacterDescriptions.has(char.name.toUpperCase())) {
          csvDescription = csvCharacterDescriptions.get(char.name.toUpperCase())!;
        } else {
          for (const [characterId, desc] of csvCharacterDescriptions.entries()) {
            if (char.name.includes(characterId) || char.name.toUpperCase().includes(characterId)) {
              csvDescription = desc;
              break;
            }
          }
        }
        if (csvDescription) {
        }

        // Extract accurate role from CSV description if available
        let resolvedRole = char.role;
        if (csvDescription) {
          const desc = csvDescription.toLowerCase();
          // Check for "Protagonist" first
          if (desc.match(/^protagonist[\.\s,]/i) || desc === "protagonist") {
            resolvedRole = "Protagonist";
          } else {
            // Extract relationship from patterns like "Protagonist's son", "주인공의 아들"
            const relMatch = csvDescription.match(/protagonist'?s?\s+(\w+)/i);
            if (relMatch) {
              // Capitalize the first letter of the extracted role
              resolvedRole = relMatch[1].charAt(0).toUpperCase() + relMatch[1].slice(1).toLowerCase();
            }
          }
        }
        
        // Build design sheet prompt using CSV description if available
        let designPrompt = existing?.designSheetPrompt || char.characterSheetPrompt;
        if (!designPrompt || designPrompt.trim() === "") {
          // Helper to ensure text ends with period
          const ensurePeriod = (text: string): string => {
            const trimmed = text.trim();
            return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
          };
          
          if (csvDescription) {
            // Use CSV description + visual description with new template format
            const csvDesc = ensurePeriod(csvDescription);
            const visualDesc = char.description ? ensurePeriod(char.description) : '';
            designPrompt = `Make 2d anime white background character sheet of who would be ${csvDesc} ${visualDesc} Maintain 1 full body front view, 1 face closeup view, 1 hands close up template. ${genre}.`;
          } else {
            // Fallback to AI-generated description only
            const visualDesc = ensurePeriod(char.description);
            designPrompt = `Make 2d anime white background character sheet of who would be ${visualDesc} Maintain 1 full body front view, 1 face closeup view, 1 hands close up template. ${genre}.`;
          }
        }
        
        return {
          id: existing?.id || crypto.randomUUID(),
          name: char.name,
          category: "character" as const,
          description: char.description, // Keep AI visual description
          descriptionKo: char.descriptionKo,
          csvDescription: csvDescription || existing?.csvDescription, // Store CSV description separately
          appearingClips: char.appearingClips,
          contextPrompts: char.contextPrompts,
          designSheetPrompt: designPrompt,
          designSheetImageUrl: existing?.designSheetImageUrl,
          designSheetImageBase64: existing?.designSheetImageBase64,
          referenceImageUrl: existing?.referenceImageUrl,
          referenceImageBase64: existing?.referenceImageBase64,
          isGenerating: false,
          // Easy Mode metadata (preserve existing if available)
          age: existing?.age || char.age,
          gender: existing?.gender || char.gender,
          hairColor: existing?.hairColor || char.hairColor,
          hairStyle: existing?.hairStyle || char.hairStyle,
          eyeColor: existing?.eyeColor || char.eyeColor,
          personality: existing?.personality || char.personality,
          role: existing?.role || resolvedRole,
          // Variant detection
          isVariant: char.isVariant || false,
          variantDetails: char.variantDetails || undefined,
          variantVisuals: char.variantVisuals || undefined,
        };
      });

      await createSessionFromDetection(newCharacters, "character");
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
    allProps,
    createSessionFromDetection,
    csvCharacterDescriptions,
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
      allProps.forEach((p) => {
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
        
        // Fallback: If AI returns empty prompt, generate one using template
        let designPrompt = existing?.designSheetPrompt || obj.productSheetPrompt;
        if (!designPrompt || designPrompt.trim() === "") {
          designPrompt = getObjectDesignSheetPrompt(
            { name: obj.name, description: obj.description },
            genre,
            styleKeyword
          );
        }
        
        return {
          id: existing?.id || crypto.randomUUID(),
          name: obj.name,
          category: "object" as const,
          description: obj.description,
          descriptionKo: obj.descriptionKo,
          appearingClips: obj.appearingClips,
          contextPrompts: obj.contextPrompts,
          designSheetPrompt: designPrompt,
          designSheetImageUrl: existing?.designSheetImageUrl,
          designSheetImageBase64: existing?.designSheetImageBase64,
          referenceImageUrl: existing?.referenceImageUrl,
          referenceImageBase64: existing?.referenceImageBase64,
          isGenerating: false,
        };
      });

      await createSessionFromDetection(newObjects, "object");
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
    allProps,
    createSessionFromDetection,
  ]);

  // Generate design sheet image for a prop (supports multiple reference images)
  // sessionId is curried when creating session-specific callbacks
  const handleGenerateImage = useCallback(
    async (sessionId: string, propId: string, prompt: string, referenceImages?: string[]) => {
      updateSessionProps(sessionId, props =>
        props.map((p) => (p.id === propId ? { ...p, isGenerating: true } : p))
      );

      try {
        // Delete old design sheet image from S3 before generating new one
        if (currentProjectId) {
          try {
            await deletePropDesignSheetImage(currentProjectId, propId);
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
            setSessions(prev => {
              const updatedSessions = prev.map(s => {
                if (s.id !== sessionId) return s;
                const generatedProp = s.props.find(p => p.id === propId);
                const isDefaultCharacter = generatedProp && generatedProp.category === "character" && !generatedProp.isVariant;

                const updatedProps = s.props.map(p => {
                  if (p.id === propId) {
                    return { ...p, designSheetImageUrl: uploadData.url, designSheetPrompt: prompt, isGenerating: false };
                  }
                  // Auto-link default character's design sheet to related variants
                  if (isDefaultCharacter && p.isVariant && p.category === "character" && generatedProp) {
                    const variantDetails = p.variantDetails?.toLowerCase() || "";
                    const characterName = generatedProp.name.toLowerCase();
                    const characterId = generatedProp.name.toUpperCase();
                    if (variantDetails.includes(characterName) || variantDetails.includes(characterId) || p.name.includes(characterId.split("_")[0])) {
                      const currentRefs = p.referenceImages || [];
                      if (!currentRefs.includes(uploadData.url)) {
                        console.log(`[Auto-link] Adding ${generatedProp.name} design sheet to variant ${p.name}`);
                        return { ...p, referenceImages: [uploadData.url, ...currentRefs] };
                      }
                    }
                  }
                  return p;
                });
                return { ...s, props: updatedProps };
              });

              setTimeout(() => syncToContext(updatedSessions), 0);
              return updatedSessions;
            });

            // Auto-link: save variants to Firestore
            const targetSession = sessions.find(s => s.id === sessionId);
            const targetProp = targetSession?.props.find(p => p.id === propId);
            const isDefaultChar = targetProp && targetProp.category === "character" && !targetProp.isVariant;

            if (currentProjectId && isDefaultChar && targetProp && targetSession) {
              const variantsToUpdate = targetSession.props.filter(p => {
                if (!p.isVariant || p.category !== "character") return false;
                const variantDetails = p.variantDetails?.toLowerCase() || "";
                const characterName = targetProp.name.toLowerCase();
                const characterId = targetProp.name.toUpperCase();
                return variantDetails.includes(characterName) || variantDetails.includes(characterId) || p.name.includes(characterId.split("_")[0]);
              });

              for (const variant of variantsToUpdate) {
                const currentRefs = variant.referenceImages || [];
                if (!currentRefs.includes(uploadData.url)) {
                  const newRefs = [uploadData.url, ...currentRefs];
                  try {
                    await saveProp(currentProjectId, {
                      ...propToMetadata(variant),
                      referenceImageRefs: newRefs,
                      contextPrompts: variant.contextPrompts,
                    });
                    console.log(`[Auto-link] Saved ${variant.name} to Firestore with auto-linked reference`);
                  } catch (error) {
                    console.error(`[Auto-link] Failed to save variant ${variant.name}:`, error);
                  }
                }
              }
            }

            return;
          }
        }

        // Fallback to base64 if upload fails
        updateSessionProps(sessionId, props =>
          props.map(p => p.id === propId ? { ...p, designSheetImageBase64: data.imageBase64, designSheetPrompt: prompt, isGenerating: false } : p)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Image generation failed");
        updateSessionProps(sessionId, props =>
          props.map(p => p.id === propId ? { ...p, isGenerating: false } : p)
        );
      }
    },
    [currentProjectId, customApiKey, sessions, syncToContext, updateSessionProps, propToMetadata]
  );

  // Set reference images for a prop (supports multiple images)
  const handleSetReferenceImages = useCallback(
    (sessionId: string, propId: string, images: string[]) => {
      setSessions(prev => {
        const updated = prev.map(s =>
          s.id === sessionId
            ? { ...s, props: s.props.map(p => p.id === propId ? { ...p, referenceImages: images } : p) }
            : s
        );
        setTimeout(() => syncToContext(updated), 0);
        return updated;
      });
    },
    [syncToContext]
  );

  // Update prop fields and sync to context
  const handleUpdateProp = useCallback(
    (sessionId: string, propId: string, updates: Partial<Prop>) => {
      setSessions(prev => {
        const updated = prev.map(s =>
          s.id === sessionId
            ? { ...s, props: s.props.map(p => p.id === propId ? { ...p, ...updates } : p) }
            : s
        );
        setTimeout(() => syncToContext(updated), 0);
        return updated;
      });
    },
    [syncToContext]
  );

  // Close a session (remove it)
  const handleCloseSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      setTimeout(() => syncToContext(updated), 0);
      return updated;
    });
  }, [syncToContext]);

  // Toggle session minimize/restore
  const handleToggleMinimize = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, isMinimized: !s.isMinimized } : s
    ));
  }, []);

  // Clear all sessions (local state + context + Firestore)
  const handleClearAll = useCallback(async (sessionId?: string) => {
    if (sessionId) {
      // Clear a specific session
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        setTimeout(() => syncToContext(updated), 0);
        return updated;
      });
    } else {
      // Clear all
      setSessions([]);
      setCharacterSessionCount(0);
      setObjectSessionCount(0);
      await clearPropDesignerData();
    }
  }, [clearPropDesignerData, syncToContext]);

  // Generate a preview image for a specific clip using its imagePrompt
  const handleRequestImageSample = useCallback(async (sceneIndex: number, clipIndex: number) => {
    const scene = activeScenes[sceneIndex];
    if (!scene) return;
    const clip = scene.clips[clipIndex];
    if (!clip) return;

    const prompt = clip.imagePrompt;
    if (!prompt) return;

    const response = await fetch("/api/generate_prop_sheet/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        aspectRatio: "16:9",
        customApiKey: customApiKey || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[PropDesigner] Image sample generation failed:", errorData);
      return;
    }

    const data = await response.json();
    if (data.imageBase64) {
      const key = `${sceneIndex}-${clipIndex}`;
      setGeneratedClipImages(prev => ({ ...prev, [key]: `data:image/png;base64,${data.imageBase64}` }));
    }
  }, [activeScenes, customApiKey]);

  // JSON file input ref for session import
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Export session as JSON
  const handleExportSession = useCallback(() => {
    const exportData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      settings: { styleKeyword, genre },
      detectedIds: detectedIds.map(d => ({ id: d.id, category: d.category, clipIds: d.clipIds, contexts: d.contexts, occurrences: d.occurrences })),
      props: allProps.map(p => ({
        id: p.id, name: p.name, category: p.category, description: p.description, descriptionKo: p.descriptionKo,
        csvDescription: p.csvDescription, appearingClips: p.appearingClips, contextPrompts: p.contextPrompts,
        designSheetPrompt: p.designSheetPrompt, designSheetImageUrl: p.designSheetImageUrl, referenceImages: p.referenceImages,
        age: p.age, gender: p.gender, hairColor: p.hairColor, hairStyle: p.hairStyle, eyeColor: p.eyeColor,
        personality: p.personality, role: p.role, isVariant: p.isVariant, variantDetails: p.variantDetails, variantVisuals: p.variantVisuals,
      })),
      sessions: sessions.map(s => ({
        id: s.id, name: s.name, type: s.type, timestamp: s.timestamp,
        propIds: s.props.map(p => p.id),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `propdesigner_session_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [styleKeyword, genre, detectedIds, allProps, sessions]);

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
          csvDescription: p.csvDescription as string | undefined,
          appearingClips: (p.appearingClips as string[]) || [],
          contextPrompts: (p.contextPrompts as { clipId: string; text: string }[]) || [],
          designSheetPrompt: (p.designSheetPrompt as string) || "",
          designSheetImageUrl: p.designSheetImageUrl as string | undefined,
          referenceImages: p.referenceImages as string[] | undefined,
          age: p.age as string | undefined,
          gender: p.gender as string | undefined,
          hairColor: p.hairColor as string | undefined,
          hairStyle: p.hairStyle as string | undefined,
          eyeColor: p.eyeColor as string | undefined,
          personality: p.personality as string | undefined,
          role: p.role as string | undefined,
          isVariant: p.isVariant as boolean | undefined,
          variantDetails: p.variantDetails as string | undefined,
          variantVisuals: p.variantVisuals as string | undefined,
          isGenerating: false,
        }));

        // Restore sessions from export or create legacy sessions from flat props
        if (session.sessions && Array.isArray(session.sessions)) {
          const propsMap = new Map(loadedProps.map(p => [p.id, p]));
          const importedSessions: DetectionSession[] = session.sessions.map((s: { id: string; name: string; type: "character" | "object"; timestamp: number; propIds: string[] }) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            timestamp: s.timestamp,
            isMinimized: true,
            props: (s.propIds || []).map((id: string) => propsMap.get(id)).filter(Boolean) as Prop[],
          }));
          setSessions(importedSessions);
          setCharacterSessionCount(importedSessions.filter(s => s.type === "character").length);
          setObjectSessionCount(importedSessions.filter(s => s.type === "object").length);
        } else {
          // Legacy v1.0 format: create sessions from flat props
          const importedSessions: DetectionSession[] = [];
          const characterProps = loadedProps.filter(p => p.category === "character");
          const objectProps = loadedProps.filter(p => p.category === "object");
          if (characterProps.length > 0) {
            importedSessions.push({ id: crypto.randomUUID(), name: "Character Sheet #1", type: "character", props: characterProps, timestamp: Date.now(), isMinimized: true });
          }
          if (objectProps.length > 0) {
            importedSessions.push({ id: crypto.randomUUID(), name: "Object Sheet #1", type: "object", props: objectProps, timestamp: Date.now(), isMinimized: true });
          }
          setSessions(importedSessions);
          setCharacterSessionCount(characterProps.length > 0 ? 1 : 0);
          setObjectSessionCount(objectProps.length > 0 ? 1 : 0);
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
              disabled={sessions.length === 0}
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
          <div className="flex items-center gap-4">
            <span>
              Using imported CSV data ({totalClips} clips)
            </span>
            {csvCharacterDescriptions.size > 0 && (
              <span className="text-xs text-teal-400">
                • {csvCharacterDescriptions.size} character{csvCharacterDescriptions.size !== 1 ? 's' : ''} with descriptions
              </span>
            )}
            {csvGenre && (
              <span className="text-xs text-teal-400">
                • Genre: {csvGenre}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setImportedScenes([]);
              setCsvCharacterDescriptions(new Map());
              setCsvGenre(null);
            }}
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
          <StoryboardTable
            scenes={activeScenes}
            totalClips={totalClips}
            onRequestImageSample={handleRequestImageSample}
            generatedImages={generatedClipImages}
          />

          {/* Session Modals */}
          {sessions.map((session, idx) => (
            <PropListView
              key={session.id}
              props={session.props}
              genre={genre}
              styleKeyword={styleKeyword}
              projectId={currentProjectId || undefined}
              customApiKey={customApiKey || undefined}
              onGenerateImage={(propId, prompt, refs) => handleGenerateImage(session.id, propId, prompt, refs)}
              onSetReferenceImages={(propId, images) => handleSetReferenceImages(session.id, propId, images)}
              onUpdateProp={(propId, updates) => handleUpdateProp(session.id, propId, updates)}
              onClose={() => handleCloseSession(session.id)}
              onClearAll={() => handleClearAll(session.id)}
              onToggleMinimize={() => handleToggleMinimize(session.id)}
              title={session.name}
              accentColor={session.type === "character" ? "purple" : "cyan"}
              initialMinimized={session.isMinimized}
              sessionId={session.id}
              minimizedIndex={idx}
            />
          ))}
        </>
      )}
    </div>
  );
}
