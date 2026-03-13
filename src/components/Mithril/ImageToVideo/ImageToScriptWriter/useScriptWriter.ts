"use client";

import { useReducer, useCallback, useEffect, useRef, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { useMithril } from '../../MithrilContext';
import { scriptWriterReducer, initialState } from './reducer';
import { blobToBase64, compressBase64Image, isUrl } from './utils/imageCompression';
import { useI2VStoryboardOrchestrator, type StoryboardJobUpdate } from './useI2VStoryboardOrchestrator';
import { getActiveProjectI2VStoryboardJobs } from '../../services/firestore/jobQueue';
import type {
  ScriptWriterState,
  Scene,
  VoicePrompt,
  PanelData,
  GenerationConditions,
  GenerationInstructions,
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
  // Stage 1 (ImageSplitter) functions
  getImageSplitterMeta,
  getMangaPages,
  getMangaPanels,
} from '../../services/firestore';
import { uploadI2VPanelImage, uploadI2VStoryboardReferenceImage } from '../../services/s3/images';

export function useScriptWriter() {
  const { getStageResult, setStageResult, currentProjectId, customApiKey } = useMithril();
  const [state, dispatch] = useReducer(scriptWriterReducer, initialState);
  const [loadedStage1Pages, setLoadedStage1Pages] = useState<MangaPage[]>([]);
  const isLoadingRef = useRef(false);
  const isLoadingStage1Ref = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep a ref to current state for async operations
  const stateRef = useRef<ScriptWriterState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Ref to allPanels for use in handleJobUpdate callback
  const allPanelsRef = useRef<PanelData[]>([]);

  // Handle real-time job updates from Firestore subscription
  const handleJobUpdate = useCallback((update: StoryboardJobUpdate) => {

    // For in-progress statuses, ensure the UI shows generating state
    const inProgressStatuses = ['pending', 'submitted', 'polling', 'preparing', 'generating', 'uploading'];
    if (inProgressStatuses.includes(update.status)) {
      dispatch({ type: 'START_GENERATING' });
      return;
    }

    if (update.status === 'completed' && update.scenes) {
      // Map referenceImageIndex to actual panel images
      const currentPanels = allPanelsRef.current;
      const updatedScenes: Scene[] = update.scenes.map((scene) => ({
        ...scene,
        clips: scene.clips.map((clip) => {
          let refImage: string | undefined;
          if (
            clip.referenceImageIndex !== undefined &&
            clip.referenceImageIndex >= 0 &&
            clip.referenceImageIndex < currentPanels.length
          ) {
            refImage = currentPanels[clip.referenceImageIndex].imageBase64;
          }
          return { ...clip, referenceImage: refImage };
        }),
      }));

      const voicePrompts: VoicePrompt[] = update.voicePrompts || [];

      dispatch({
        type: 'FINISH_GENERATING',
        result: { scenes: updatedScenes, voicePrompts },
      });
      setStageResult(2, { scenes: updatedScenes, voicePrompts });
      // No need to save to Firestore - backend already saved to i2vScript subcollection
    } else if (update.status === 'failed') {
      dispatch({ type: 'GENERATION_ERROR' });
    } else if (update.status === 'cancelled') {
      dispatch({ type: 'GENERATION_ERROR' });
    }
  }, [setStageResult]);

  // Initialize I2V storyboard orchestrator
  const orchestrator = useI2VStoryboardOrchestrator({
    projectId: currentProjectId,
    customApiKey,
    onJobUpdate: handleJobUpdate,
    enabled: true,
  });

  // Ref to orchestrator to avoid re-triggering effects when the object reference changes
  const orchestratorRef = useRef(orchestrator);
  useEffect(() => {
    orchestratorRef.current = orchestrator;
  }, [orchestrator]);

  // Apply pending completed update once panel data is loaded
  useEffect(() => {
    if (!orchestrator.pendingUpdate) return;
    if (allPanelsRef.current.length === 0) {
      return;
    }

    handleJobUpdate(orchestrator.pendingUpdate);
    orchestrator.clearPendingUpdate();
  }, [orchestrator.pendingUpdate, handleJobUpdate, orchestrator.clearPendingUpdate]);

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
        dispatch({
          type: 'SET_INSTRUCTIONS',
          instructions: {
            custom: meta.customInstruction || '',
            background: meta.backgroundInstruction || '',
            negative: meta.negativeInstruction || '',
            video: meta.videoInstruction || '',
          },
        });

        // Load scenes
        const firestoreScenes = await getI2VScenes(currentProjectId);
        const loadedScenes: Scene[] = [];

        for (const scene of firestoreScenes) {
          const firestoreClips = await getI2VClips(currentProjectId, scene.sceneIndex);
          const clips: Continuity[] = firestoreClips.map((c) => ({
            story: c.story || '',
            storyDetailKo: c.storyDetailKo || '',
            storyGroupLabel: c.storyGroupLabel || '',
            storyGroupSize: c.storyGroupSize,
            imagePrompt: c.imagePrompt || '',
            imagePromptEnd: c.imagePromptEnd,
            videoPrompt: c.videoPrompt || '',
            pixAiPrompt: c.pixAiPrompt || '',
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
            referenceImageUrl: c.referenceImageUrl,
            refFileName: c.refFileName || '',
            facePresent: c.facePresent,
            // If a custom reference image URL was saved, use it directly (skip panel index lookup)
            referenceImage: c.referenceImageUrl || undefined,
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

        // Check for any active I2V storyboard jobs (restore generating state)
        const activeJobs = await getActiveProjectI2VStoryboardJobs(currentProjectId);
        if (activeJobs.length > 0) {
          // Sort by created_at descending and take the most recent
          const sortedJobs = activeJobs.sort((a, b) =>
            (b.created_at || '').localeCompare(a.created_at || '')
          );
          const latestJob = sortedJobs[0];
          orchestratorRef.current.setActiveJobId(latestJob.id);
          dispatch({ type: 'START_GENERATING' });
        }
      } catch (error) {
        console.error('Error loading ScriptWriter data from Firestore:', error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadFromFirestore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId, setStageResult]);

  // Get panels from Stage 1 (context or loaded from Firestore)
  const stage1Result = getStageResult(1) as { pages: MangaPage[] } | undefined;
  const stage1PagesFromContext = stage1Result?.pages || [];

  // Load Stage 1 data from Firestore if not in context
  useEffect(() => {
    if (!currentProjectId || isLoadingStage1Ref.current) return;
    if (stage1PagesFromContext.length > 0) {
      // Already have data from context, no need to load
      setLoadedStage1Pages([]);
      return;
    }

    const loadStage1FromFirestore = async () => {
      isLoadingStage1Ref.current = true;
      try {
        const meta = await getImageSplitterMeta(currentProjectId);
        if (!meta) {
          isLoadingStage1Ref.current = false;
          return;
        }

        const firestorePages = await getMangaPages(currentProjectId);
        const loadedPages: MangaPage[] = [];

        for (const page of firestorePages) {
          const firestorePanels = await getMangaPanels(currentProjectId, page.pageIndex);
          const panels = firestorePanels.map((p) => ({
            id: p.id,
            box_2d: p.box_2d,
            label: p.label,
            imageUrl: p.imageRef, // S3 URL
          }));

          loadedPages.push({
            id: page.id,
            pageIndex: page.pageIndex,
            previewUrl: page.imageRef,
            fileName: page.fileName,
            panels,
            status: page.status as 'pending' | 'processing' | 'completed' | 'error',
            readingDirection: page.readingDirection as 'rtl' | 'ltr',
          });
        }

        if (loadedPages.length > 0) {
          setLoadedStage1Pages(loadedPages);
          // Also set in context for other components
          setStageResult(1, { pages: loadedPages.filter((p) => p.status === 'completed') });
        }
      } catch (error) {
        console.error('Error loading Stage 1 data from Firestore:', error);
      } finally {
        isLoadingStage1Ref.current = false;
      }
    };

    loadStage1FromFirestore();
  }, [currentProjectId, stage1PagesFromContext.length, setStageResult]);

  // Use context data if available, otherwise use loaded data
  const stage1Pages = stage1PagesFromContext.length > 0 ? stage1PagesFromContext : loadedStage1Pages;
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

  // Keep allPanelsRef in sync for the handleJobUpdate callback
  useEffect(() => {
    allPanelsRef.current = allPanels;
  }, [allPanels]);

  // Update reference images when allPanels becomes available
  // (handles case where script is loaded from Firestore before panels are loaded)
  useEffect(() => {
    if (!state.result?.scenes.length || allPanels.length === 0) return;

    // Check if any clips can actually be updated (conditions must match exactly)
    const needsUpdate = state.result.scenes.some((scene) =>
      scene.clips.some(
        (clip) =>
          clip.referenceImageIndex !== undefined &&
          clip.referenceImageIndex >= 0 &&
          clip.referenceImageIndex < allPanels.length &&
          !clip.referenceImage
      )
    );

    if (!needsUpdate) return;

    // Update scenes with reference images from allPanels
    let changed = false;
    const updatedScenes = state.result.scenes.map((scene) => ({
      ...scene,
      clips: scene.clips.map((clip) => {
        if (
          clip.referenceImageIndex !== undefined &&
          clip.referenceImageIndex >= 0 &&
          clip.referenceImageIndex < allPanels.length &&
          !clip.referenceImage
        ) {
          changed = true;
          return {
            ...clip,
            referenceImage: allPanels[clip.referenceImageIndex].imageBase64,
          };
        }
        return clip;
      }),
    }));

    if (changed) {
      dispatch({ type: 'UPDATE_SCENES', scenes: updatedScenes });
    }
  }, [allPanels, state.result?.scenes]);

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

  const setSourceText = useCallback((text: string) => {
    dispatch({ type: 'SET_SOURCE_TEXT', text });
  }, []);

  const setConditions = useCallback((conditions: Partial<GenerationConditions>) => {
    dispatch({ type: 'SET_CONDITIONS', conditions });
  }, []);

  const setGuides = useCallback((guides: Partial<StyleGuides>) => {
    dispatch({ type: 'SET_GUIDES', guides });
  }, []);

  const setInstructions = useCallback((instructions: Partial<GenerationInstructions>) => {
    dispatch({ type: 'SET_INSTRUCTIONS', instructions });
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
    // Save metadata (Firestore doesn't accept undefined, use empty string or omit)
    await saveI2VScriptMeta(projectId, {
      targetDuration: '',
      sourceText: config.sourceText || '',
      storyCondition: config.conditions.story || '',
      imageCondition: config.conditions.image || '',
      videoCondition: config.conditions.video || '',
      soundCondition: config.conditions.sound || '',
      customInstruction: config.instructions.custom || '',
      backgroundInstruction: config.instructions.background || '',
      negativeInstruction: config.instructions.negative || '',
      videoInstruction: config.instructions.video || '',
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
          referenceImageUrl: clip.referenceImageUrl,
          refFileName: clip.refFileName,
          pixAiPrompt: clip.pixAiPrompt,
          facePresent: clip.facePresent,
          story: clip.story || '',
          storyDetailKo: clip.storyDetailKo,
          storyGroupLabel: clip.storyGroupLabel,
          storyGroupSize: clip.storyGroupSize,
          imagePrompt: clip.imagePrompt || '',
          imagePromptEnd: clip.imagePromptEnd || '',
          videoPrompt: clip.videoPrompt || '',
          soraVideoPrompt: clip.soraVideoPrompt || '',
          dialogue: clip.dialogue || '',
          dialogueEn: clip.dialogueEn || '',
          sfx: clip.sfx || '',
          sfxEn: clip.sfxEn || '',
          bgm: clip.bgm || '',
          bgmEn: clip.bgmEn || '',
          length: clip.length || '',
          accumulatedTime: clip.accumulatedTime || '',
          backgroundPrompt: clip.backgroundPrompt || '',
          backgroundId: clip.backgroundId || '',
        });
      }
    }
  };

  // Generate storyboard via background job worker
  const generate = useCallback(async () => {
    const currentState = stateRef.current;

    if (allPanels.length === 0 && !currentState.config.sourceText) {
      throw new Error('No panel images available. Please upload panels or source file (.txt).');
    }

    if (!currentProjectId) {
      throw new Error('No project selected.');
    }

    dispatch({ type: 'START_GENERATING' });

    try {
      // Collect panel URLs for the backend worker.
      // Panels from Stage 1 have S3 URLs. Imported base64 panels need to be
      // uploaded to S3 first.
      const panelUrls: string[] = [];
      const panelLabels: string[] = [];

      for (const panel of allPanels) {
        if (isUrl(panel.imageBase64)) {
          // S3 URL - use directly
          panelUrls.push(panel.imageBase64);
        } else {
          // Base64 panel (imported) - upload to S3 first
          let imageData = panel.imageBase64;
          if (imageData.length > 100000) {
            imageData = await compressBase64Image(imageData, 800, 0.7);
          }

          const idx = allPanels.indexOf(panel);
          const url = await uploadI2VPanelImage(
            currentProjectId,
            0, // pageIndex — imported panels don't have pages
            idx,
            imageData,
          );
          panelUrls.push(url);
        }
        panelLabels.push(panel.label);
      }

      // Submit job to orchestrator
      const result = await orchestratorRef.current.submitJob({
        panelUrls,
        panelLabels,
        sourceText: currentState.config.sourceText || undefined,
        storyCondition: currentState.config.conditions.story,
        imageCondition: currentState.config.conditions.image,
        videoCondition: currentState.config.conditions.video,
        soundCondition: currentState.config.conditions.sound,
        imageGuide: currentState.config.guides.image || undefined,
        videoGuide: currentState.config.guides.video || undefined,
        customInstruction: currentState.config.instructions.custom || undefined,
        backgroundInstruction: currentState.config.instructions.background || undefined,
        negativeInstruction: currentState.config.instructions.negative || undefined,
        videoInstruction: currentState.config.instructions.video || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit storyboard job');
      }

      // Job submitted successfully - updates will come via Firestore subscription
      // (handleJobUpdate callback handles FINISH_GENERATING and GENERATION_ERROR)
    } catch (error) {
      dispatch({ type: 'GENERATION_ERROR' });
      throw error;
    }
  }, [allPanels, currentProjectId]);

  // Split Start/End frames
  const splitStartEnd = useCallback(async () => {
    const currentState = stateRef.current;
    if (!currentState.result?.scenes.length) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    dispatch({ type: 'START_SPLITTING' });

    try {
      // Strip heavy fields (referenceImage, etc.) to avoid exceeding body size limit
      const lightScenes = currentState.result.scenes.map((scene) => ({
        sceneTitle: scene.sceneTitle,
        clips: scene.clips.map((clip) => ({
          imagePrompt: clip.imagePrompt,
        })),
      }));

      const response = await fetch('/api/manga/split-start-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: lightScenes, apiKey: customApiKey }),
        signal,
      });

      if (!response.ok) {
        let errorMessage = `Failed to split frames (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const returnedScenes = data.scenes || [];

      // Apply split results back to the full scenes (preserving all original fields)
      const updatedScenes: Scene[] = currentState.result.scenes.map((scene, sIdx) => ({
        ...scene,
        clips: scene.clips.map((clip, cIdx) => {
          const returned = returnedScenes[sIdx]?.clips?.[cIdx];
          if (!returned) return clip;
          return {
            ...clip,
            imagePrompt: returned.imagePrompt ?? clip.imagePrompt,
            imagePromptEnd: returned.imagePromptEnd,
          };
        }),
      }));

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

  // Upload a new reference image to S3 and persist the URL
  const replaceReferenceImage = useCallback(
    async (sceneIndex: number, clipIndex: number, base64: string) => {
      if (!currentProjectId) return;

      const url = await uploadI2VStoryboardReferenceImage(currentProjectId, sceneIndex, clipIndex, base64);

      const currentState = stateRef.current;
      if (!currentState.result) return;

      const updatedScenes = currentState.result.scenes.map((scene, sIdx) => {
        if (sIdx !== sceneIndex) return scene;
        return {
          ...scene,
          clips: scene.clips.map((clip, cIdx) => {
            if (cIdx !== clipIndex) return clip;
            return { ...clip, referenceImage: url, referenceImageUrl: url };
          }),
        };
      });

      dispatch({ type: 'UPDATE_SCENES', scenes: updatedScenes });
      setStageResult(2, { scenes: updatedScenes, voicePrompts: currentState.result.voicePrompts });

      // Persist the URL to Firestore immediately
      const clip = updatedScenes[sceneIndex]?.clips[clipIndex];
      if (clip) {
        await saveI2VClip(currentProjectId, sceneIndex, clipIndex, {
          referenceImageIndex: clip.referenceImageIndex ?? 0,
          referenceImageUrl: url,
          refFileName: clip.refFileName,
          pixAiPrompt: clip.pixAiPrompt,
          facePresent: clip.facePresent,
          story: clip.story || '',
          storyDetailKo: clip.storyDetailKo,
          storyGroupLabel: clip.storyGroupLabel,
          storyGroupSize: clip.storyGroupSize,
          imagePrompt: clip.imagePrompt || '',
          imagePromptEnd: clip.imagePromptEnd || '',
          videoPrompt: clip.videoPrompt || '',
          soraVideoPrompt: clip.soraVideoPrompt || '',
          dialogue: clip.dialogue || '',
          dialogueEn: clip.dialogueEn || '',
          sfx: clip.sfx || '',
          sfxEn: clip.sfxEn || '',
          bgm: clip.bgm || '',
          bgmEn: clip.bgmEn || '',
          length: clip.length || '',
          accumulatedTime: clip.accumulatedTime || '',
          backgroundPrompt: clip.backgroundPrompt || '',
          backgroundId: clip.backgroundId || '',
        });
      }
    },
    [currentProjectId, setStageResult]
  );

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
  const cancel = useCallback(async () => {
    // Immediately stop the generating UI
    dispatch({ type: 'GENERATION_ERROR' });

    // Cancel background job via orchestrator
    const result = await orchestratorRef.current.cancelJob();
    if (!result.success) {
      console.warn('Failed to cancel job:', result.error);
    }

    // Also abort any direct API calls (e.g., splitStartEnd)
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
        ...(textOnly ? [] : ['Reference Filename']),
        'Story',
        'Image Prompt (Start)',
        ...(hasEndPrompts ? ['Image Prompt (End)'] : []),
        'Video Prompt',
        'Pix AI',
        'Dialogue (Ko)',
        'Dialogue (En)',
        'SFX (Ko)',
        'SFX (En)',
        'BGM (Ko)',
        'BGM (En)',
      ];

      let globalClipCounter = 1;
      const rows = scenes.flatMap((scene, sIdx) =>
        scene.clips.map((clip) => {
          const row = [
            escapeCSV(`Scene ${sIdx + 1}: ${scene.sceneTitle}`),
            escapeCSV(String(globalClipCounter++).padStart(3, '0')),
            escapeCSV(clip.length),
            escapeCSV(clip.accumulatedTime),
            escapeCSV(clip.backgroundId),
            escapeCSV(clip.backgroundPrompt),
          ];

          if (!textOnly) {
            row.push(escapeCSV(clip.refFileName || ''));
          }

          row.push(escapeCSV(clip.story), escapeCSV(clip.imagePrompt));

          if (hasEndPrompts) row.push(escapeCSV(clip.imagePromptEnd || ''));

          row.push(
            escapeCSV(clip.videoPrompt),
            escapeCSV(clip.pixAiPrompt || ''),
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
    setSourceText,
    setConditions,
    setGuides,
    setInstructions,

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
    replaceReferenceImage,
    cancel,
    clear,
    exportCSV,
  };
}
