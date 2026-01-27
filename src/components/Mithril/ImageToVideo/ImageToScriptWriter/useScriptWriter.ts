"use client";

import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import { useMithril } from '../../MithrilContext';
import { scriptWriterReducer, initialState } from './reducer';
import { blobToBase64, compressBase64Image, urlToBase64, isUrl } from './utils/imageCompression';
import type {
  ScriptWriterState,
  Scene,
  VoicePrompt,
  PanelData,
  GenerationConditions,
  StyleGuides,
  Continuity,
} from './types';
import type { MangaPage } from '../ImageSplitter';
import {
  getI2VScriptMeta,
  getI2VScenes,
  getI2VClips,
  getI2VVoicePrompts,
  saveI2VScriptMeta,
  saveI2VScene,
  saveI2VClip,
  saveI2VVoicePrompts,
  clearI2VScript,
} from '../../services/firestore';

export function useScriptWriter() {
  const { getStageResult, setStageResult, currentProjectId } = useMithril();
  const [state, dispatch] = useReducer(scriptWriterReducer, initialState);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep a ref to current state for async operations
  const stateRef = useRef<ScriptWriterState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load data from Firestore when project changes
  useEffect(() => {
    if (!currentProjectId || isLoadingRef.current) return;

    const loadFromFirestore = async () => {
      isLoadingRef.current = true;
      try {
        const meta = await getI2VScriptMeta(currentProjectId);
        if (!meta) {
          isLoadingRef.current = false;
          return;
        }

        // Load config from meta
        dispatch({
          type: 'SET_TARGET_DURATION',
          duration: meta.targetDuration || '03:00',
        });
        if (meta.sourceText) {
          dispatch({ type: 'SET_SOURCE_TEXT', text: meta.sourceText });
        }
        dispatch({
          type: 'SET_CONDITIONS',
          conditions: {
            story: meta.storyCondition || '',
            image: meta.imageCondition || '',
            video: meta.videoCondition || '',
            sound: meta.soundCondition || '',
          },
        });

        // Load scenes
        const firestoreScenes = await getI2VScenes(currentProjectId);
        const loadedScenes: Scene[] = [];

        for (const scene of firestoreScenes) {
          const firestoreClips = await getI2VClips(currentProjectId, scene.sceneIndex);
          const clips: Continuity[] = firestoreClips.map((c) => ({
            story: c.story || '',
            imagePrompt: c.imagePrompt || '',
            imagePromptEnd: c.imagePromptEnd,
            videoPrompt: c.videoPrompt || '',
            soraVideoPrompt: c.soraVideoPrompt || '',
            dialogue: c.dialogue || '',
            dialogueEn: c.dialogueEn || '',
            sfx: c.sfx || '',
            sfxEn: c.sfxEn || '',
            bgm: c.bgm || '',
            bgmEn: c.bgmEn || '',
            length: c.length || '',
            accumulatedTime: c.accumulatedTime || '',
            backgroundPrompt: c.backgroundPrompt || '',
            backgroundId: c.backgroundId || '',
            referenceImageIndex: c.referenceImageIndex,
          }));

          loadedScenes.push({
            sceneTitle: scene.sceneTitle,
            clips,
          });
        }

        // Load voice prompts
        const voicePrompts = await getI2VVoicePrompts(currentProjectId);

        if (loadedScenes.length > 0) {
          dispatch({
            type: 'FINISH_GENERATING',
            result: {
              scenes: loadedScenes,
              voicePrompts: voicePrompts.map((v) => ({
                promptKo: v.promptKo,
                promptEn: v.promptEn,
              })),
            },
          });
          // Also set stage result for downstream stages
          setStageResult(2, { scenes: loadedScenes, voicePrompts });
        }
      } catch (error) {
        console.error('Error loading ScriptWriter data from Firestore:', error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadFromFirestore();
  }, [currentProjectId, setStageResult]);

  // Get panels from Stage 1
  const stage1Result = getStageResult(1) as { pages: MangaPage[] } | undefined;
  const stage1Pages = stage1Result?.pages || [];
  const totalPanelsFromStage1 = stage1Pages.reduce((acc, p) => acc + p.panels.length, 0);

  // Convert manga image files to base64 when they change
  useEffect(() => {
    const convertImages = async () => {
      const converted: string[] = [];
      for (const img of state.mangaImageFiles) {
        if (typeof img === 'string') {
          converted.push(img);
        } else {
          const base64 = await blobToBase64(img);
          converted.push(base64);
        }
      }
      dispatch({ type: 'SET_CONVERTED_IMAGES', images: converted });
    };

    if (state.mangaImageFiles.length > 0) {
      convertImages();
    } else {
      dispatch({ type: 'SET_CONVERTED_IMAGES', images: [] });
    }
  }, [state.mangaImageFiles]);

  // Collect all panels - prefer imported manga images, fallback to Stage 1
  const allPanels: PanelData[] = useMemo(() => {
    const panels: PanelData[] = [];

    // If we have imported manga images, use those
    if (state.mangaImages.length > 0) {
      state.mangaImages.forEach((base64, idx) => {
        panels.push({
          id: `imported-${idx}`,
          imageBase64: base64,
          label: `Panel ${idx + 1}`,
        });
      });
    }
    // Otherwise, use panels from Stage 1
    else {
      stage1Pages.forEach((page) => {
        page.panels.forEach((panel) => {
          if (panel.imageUrl) {
            panels.push({
              id: panel.id,
              imageBase64: panel.imageUrl,
              label: panel.label || `Panel ${panels.length + 1}`,
            });
          }
        });
      });
    }

    return panels;
  }, [stage1Pages, state.mangaImages]);

  const totalPanels = allPanels.length || totalPanelsFromStage1;

  // Handle manga panel upload (images, ZIP, JSON)
  const uploadMangaFiles = useCallback(async (files: FileList | File[]) => {
    const newFiles: (File | string)[] = [];
    const fileList = Array.from(files);

    for (const file of fileList) {
      // Handle ZIP files
      if (
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed' ||
        file.name.endsWith('.zip')
      ) {
        try {
          const zip = await JSZip.loadAsync(file);
          const imageNames = Object.keys(zip.files)
            .filter(
              (name) =>
                name.match(/\.(jpg|jpeg|png|webp)$/i) &&
                !zip.files[name].dir &&
                !name.startsWith('__')
            )
            .sort((a, b) =>
              a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
            );

          for (const name of imageNames) {
            const blob = await zip.files[name].async('blob');
            const imgFile = new File([blob], name.split('/').pop() || name, {
              type: 'image/jpeg',
            });
            newFiles.push(imgFile);
          }
        } catch (err) {
          console.error('Failed to extract ZIP:', err);
          throw new Error(`Failed to extract ZIP: ${file.name}`);
        }
      }
      // Handle JSON files (can contain base64 images)
      else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const json = JSON.parse(text);

          let extractedImages: string[] = [];
          if (json.mangaImages && Array.isArray(json.mangaImages)) {
            extractedImages = json.mangaImages;
          } else if (Array.isArray(json)) {
            extractedImages = json.filter((item: unknown) => typeof item === 'string');
          }

          if (extractedImages.length > 0) {
            newFiles.push(...extractedImages);
          } else {
            throw new Error(`No images found in ${file.name}`);
          }
        } catch (err) {
          console.error('JSON parsing error:', err);
          throw new Error(`Failed to read JSON: ${file.name}`);
        }
      }
      // Handle image files
      else if (file.type.startsWith('image/')) {
        newFiles.push(file);
      }
    }

    if (newFiles.length > 0) {
      dispatch({ type: 'ADD_MANGA_FILES', files: newFiles });
    }
  }, []);

  // Clear manga images
  const clearMangaImages = useCallback(() => {
    dispatch({ type: 'CLEAR_MANGA_IMAGES' });
  }, []);

  // Config setters
  const setGenre = useCallback((genre: string) => {
    dispatch({ type: 'SET_GENRE', genre });
  }, []);

  const setTargetDuration = useCallback((duration: string) => {
    dispatch({ type: 'SET_TARGET_DURATION', duration });
  }, []);

  const setSourceText = useCallback((text: string) => {
    dispatch({ type: 'SET_SOURCE_TEXT', text });
  }, []);

  const setConditions = useCallback((conditions: Partial<GenerationConditions>) => {
    dispatch({ type: 'SET_CONDITIONS', conditions });
  }, []);

  const setGuides = useCallback((guides: Partial<StyleGuides>) => {
    dispatch({ type: 'SET_GUIDES', guides });
  }, []);

  // UI toggles
  const toggleConditions = useCallback(() => {
    dispatch({ type: 'TOGGLE_CONDITIONS' });
  }, []);

  const toggleGuides = useCallback(() => {
    dispatch({ type: 'TOGGLE_GUIDES' });
  }, []);

  // Helper: Save to Firestore
  const saveToFirestore = async (
    projectId: string,
    config: ScriptWriterState['config'],
    scenes: Scene[],
    voicePrompts: VoicePrompt[]
  ) => {
    // Save metadata
    await saveI2VScriptMeta(projectId, {
      targetDuration: config.targetDuration,
      sourceText: config.sourceText || undefined,
      storyCondition: config.conditions.story,
      imageCondition: config.conditions.image,
      videoCondition: config.conditions.video,
      soundCondition: config.conditions.sound,
    });

    // Save voice prompts
    await saveI2VVoicePrompts(
      projectId,
      voicePrompts.map((v) => ({ promptKo: v.promptKo, promptEn: v.promptEn }))
    );

    // Save scenes and clips
    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
      const scene = scenes[sceneIndex];
      await saveI2VScene(projectId, sceneIndex, { sceneTitle: scene.sceneTitle });

      for (let clipIndex = 0; clipIndex < scene.clips.length; clipIndex++) {
        const clip = scene.clips[clipIndex];
        await saveI2VClip(projectId, sceneIndex, clipIndex, {
          referenceImageIndex: clip.referenceImageIndex ?? 0,
          story: clip.story,
          imagePrompt: clip.imagePrompt,
          imagePromptEnd: clip.imagePromptEnd,
          videoPrompt: clip.videoPrompt,
          soraVideoPrompt: clip.soraVideoPrompt,
          dialogue: clip.dialogue,
          dialogueEn: clip.dialogueEn,
          sfx: clip.sfx,
          sfxEn: clip.sfxEn,
          bgm: clip.bgm,
          bgmEn: clip.bgmEn,
          length: clip.length,
          accumulatedTime: clip.accumulatedTime,
          backgroundPrompt: clip.backgroundPrompt,
          backgroundId: clip.backgroundId,
        });
      }
    }
  };

  // Generate storyboard
  const generate = useCallback(async () => {
    const currentState = stateRef.current;

    if (allPanels.length === 0) {
      throw new Error('No panel images available. Please upload panels or complete Stage 1.');
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    dispatch({ type: 'START_GENERATING' });

    try {
      // Convert URLs to base64 and compress all panel images
      const compressedPanels = await Promise.all(
        allPanels.map(async (panel) => {
          let imageData = panel.imageBase64;

          // If it's a URL (S3), fetch and convert to base64
          if (isUrl(imageData)) {
            try {
              imageData = await urlToBase64(imageData, 800, 0.7);
            } catch (err) {
              console.error(`Failed to fetch image from URL: ${imageData}`, err);
              throw new Error(`Failed to load panel image. Please try refreshing the page.`);
            }
          }
          // Otherwise compress if too large
          else if (imageData.length > 100000) {
            imageData = await compressBase64Image(imageData, 800, 0.7);
          }

          return { ...panel, imageBase64: imageData };
        })
      );

      const response = await fetch('/api/manga/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panels: compressedPanels,
          sourceText: currentState.config.sourceText || undefined,
          targetDuration: currentState.config.targetDuration,
          storyCondition: currentState.config.conditions.story,
          imageCondition: currentState.config.conditions.image,
          videoCondition: currentState.config.conditions.video,
          soundCondition: currentState.config.conditions.sound,
          imageGuide: currentState.config.guides.image || undefined,
          videoGuide: currentState.config.guides.video || undefined,
        }),
        signal,
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Request too large. Try reducing the number of panels or image quality.');
        }
        let errorMessage = 'Failed to generate storyboard';
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          if (
            responseText.toLowerCase().includes('request') ||
            responseText.toLowerCase().includes('large') ||
            responseText.toLowerCase().includes('entity')
          ) {
            errorMessage = 'Request too large. Try reducing the number of panels or use smaller images.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const generatedScenes: Scene[] = data.scenes || [];
      const generatedVoicePrompts: VoicePrompt[] = data.voicePrompts || [];

      // Map referenceImageIndex to actual panel images
      const updatedScenes: Scene[] = generatedScenes.map((scene) => ({
        ...scene,
        clips: scene.clips.map((clip) => {
          let refImage: string | undefined;
          if (
            clip.referenceImageIndex !== undefined &&
            clip.referenceImageIndex >= 0 &&
            clip.referenceImageIndex < allPanels.length
          ) {
            refImage = allPanels[clip.referenceImageIndex].imageBase64;
          }
          return { ...clip, referenceImage: refImage };
        }),
      }));

      dispatch({
        type: 'FINISH_GENERATING',
        result: { scenes: updatedScenes, voicePrompts: generatedVoicePrompts },
      });

      // Save to stage results
      setStageResult(2, { scenes: updatedScenes, voicePrompts: generatedVoicePrompts });

      // Save to Firestore
      if (currentProjectId) {
        try {
          await saveToFirestore(
            currentProjectId,
            currentState.config,
            updatedScenes,
            generatedVoicePrompts
          );
        } catch (error) {
          console.error('Error saving to Firestore:', error);
        }
      }

      abortControllerRef.current = null;
    } catch (error) {
      if (signal.aborted) return;
      dispatch({ type: 'GENERATION_ERROR' });
      abortControllerRef.current = null;
      throw error;
    }
  }, [allPanels, setStageResult, currentProjectId]);

  // Split Start/End frames
  const splitStartEnd = useCallback(async () => {
    const currentState = stateRef.current;
    if (!currentState.result?.scenes.length) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    dispatch({ type: 'START_SPLITTING' });

    try {
      const response = await fetch('/api/manga/split-start-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: currentState.result.scenes }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to split frames');
      }

      const data = await response.json();
      const updatedScenes: Scene[] = data.scenes || [];

      dispatch({ type: 'FINISH_SPLITTING', scenes: updatedScenes });
      setStageResult(2, { scenes: updatedScenes, voicePrompts: currentState.result.voicePrompts });

      // Save to Firestore
      if (currentProjectId) {
        try {
          await saveToFirestore(
            currentProjectId,
            currentState.config,
            updatedScenes,
            currentState.result.voicePrompts
          );
        } catch (error) {
          console.error('Error saving to Firestore:', error);
        }
      }

      abortControllerRef.current = null;
    } catch (error) {
      if (signal.aborted) return;
      dispatch({ type: 'SPLITTING_ERROR' });
      abortControllerRef.current = null;
      throw error;
    }
  }, [setStageResult, currentProjectId]);

  // Clear all data
  const clear = useCallback(async () => {
    dispatch({ type: 'RESET' });

    // Clear from Firestore
    if (currentProjectId) {
      try {
        await clearI2VScript(currentProjectId);
      } catch (error) {
        console.error('Error clearing ScriptWriter from Firestore:', error);
      }
    }
  }, [currentProjectId]);

  // Update a clip
  const updateClip = useCallback(
    (sceneIndex: number, clipIndex: number, changes: Partial<Continuity>) => {
      const currentState = stateRef.current;
      if (!currentState.result) return;

      const updatedScenes = currentState.result.scenes.map((scene, sIdx) => {
        if (sIdx !== sceneIndex) return scene;
        return {
          ...scene,
          clips: scene.clips.map((clip, cIdx) => {
            if (cIdx !== clipIndex) return clip;
            return { ...clip, ...changes };
          }),
        };
      });

      dispatch({ type: 'UPDATE_SCENES', scenes: updatedScenes });
      setStageResult(2, { scenes: updatedScenes, voicePrompts: currentState.result.voicePrompts });
    },
    [setStageResult]
  );

  // Cancel ongoing operations
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Export CSV
  const exportCSV = useCallback(
    (textOnly: boolean = false) => {
      const currentState = stateRef.current;
      if (!currentState.result?.scenes.length) return;

      const { scenes } = currentState.result;
      const hasEndPrompts = scenes.some((scene) =>
        scene.clips.some((clip) => !!clip.imagePromptEnd)
      );

      const escapeCSV = (val: unknown) => {
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const headers = [
        'Scene',
        'Clip',
        'Length',
        'Accumulated Time',
        'Background ID',
        'Background Prompt',
        ...(textOnly ? [] : ['Reference Image']),
        'Story',
        'Image Prompt (Start)',
        ...(hasEndPrompts ? ['Image Prompt (End)'] : []),
        'Video Prompt',
        'Sora Video Prompt',
        'Dialogue (Ko)',
        'Dialogue (En)',
        'SFX (Ko)',
        'SFX (En)',
        'BGM (Ko)',
        'BGM (En)',
      ];

      const rows = scenes.flatMap((scene, sIdx) =>
        scene.clips.map((clip, cIdx) => {
          const row = [
            escapeCSV(`Scene ${sIdx + 1}: ${scene.sceneTitle}`),
            escapeCSV(`${sIdx + 1}-${cIdx + 1}`),
            escapeCSV(clip.length),
            escapeCSV(clip.accumulatedTime),
            escapeCSV(clip.backgroundId),
            escapeCSV(clip.backgroundPrompt),
          ];

          if (!textOnly) {
            const ref = clip.referenceImage || '';
            row.push(escapeCSV(ref.startsWith('blob:') ? '[Image Blob]' : ref));
          }

          row.push(escapeCSV(clip.story), escapeCSV(clip.imagePrompt));

          if (hasEndPrompts) row.push(escapeCSV(clip.imagePromptEnd || ''));

          row.push(
            escapeCSV(clip.videoPrompt),
            escapeCSV(clip.soraVideoPrompt),
            escapeCSV(clip.dialogue),
            escapeCSV(clip.dialogueEn),
            escapeCSV(clip.sfx),
            escapeCSV(clip.sfxEn),
            escapeCSV(clip.bgm),
            escapeCSV(clip.bgmEn)
          );
          return row.join(',');
        })
      );

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = textOnly ? 'storyboard_text_only.csv' : 'storyboard_full.csv';
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  // Derived state
  const hasEndPrompts = useMemo(() => {
    return (
      state.result?.scenes.some((scene) =>
        scene.clips.some((clip) => !!clip.imagePromptEnd)
      ) ?? false
    );
  }, [state.result]);

  const hasResults = !!state.result?.scenes.length;

  return {
    // State
    state,

    // Stage 1 data
    stage1Pages,
    totalPanelsFromStage1,

    // Derived
    allPanels,
    totalPanels,
    hasEndPrompts,
    hasResults,

    // Actions - Config
    setGenre,
    setTargetDuration,
    setSourceText,
    setConditions,
    setGuides,

    // Actions - UI
    toggleConditions,
    toggleGuides,

    // Actions - Manga images
    uploadMangaFiles,
    clearMangaImages,

    // Actions - Generation
    generate,
    splitStartEnd,
    updateClip,
    cancel,
    clear,
    exportCSV,
  };
}
