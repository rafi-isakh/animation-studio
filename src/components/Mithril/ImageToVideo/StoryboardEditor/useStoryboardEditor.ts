"use client";

import { useReducer, useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useMithril } from '../../MithrilContext';
import { storyboardEditorReducer, initialState } from './reducer';
import {
  loadI2VStoryboardAll,
  saveI2VStoryboardAll,
  getI2VScenes,
  getI2VClips,
  getI2VVoicePrompts,
} from '../../services/firestore';
import {
  uploadI2VStoryboardFrameImage,
  uploadI2VStoryboardFrameEndImage,
  uploadI2VStoryboardAssetImage,
} from '../../services/s3/images';
import type {
  Scene,
  VoicePrompt,
  Asset,
  AspectRatio,
  Continuity,
  ViewMode,
  ProjectData,
} from './types';

// Stage result key for StoryboardEditor (Stage 4 in I2V pipeline)
const STORYBOARD_EDITOR_STAGE = 4;

// Debounce delay for auto-save (ms)
const AUTO_SAVE_DELAY = 2000;

// Helper to check if a string is a URL (already uploaded to S3)
const isUrl = (str: string | undefined): boolean => {
  if (!str) return false;
  return str.startsWith('http://') || str.startsWith('https://');
};

// Helper to extract base64 from data URL or return as-is
const getBase64 = (str: string): string => {
  if (str.startsWith('data:')) {
    return str.split(',')[1];
  }
  return str;
};

// Helper to create state hash for change detection
const createStateHash = (
  storyboardData: Scene[],
  voicePrompts: VoicePrompt[],
  assets: Asset[],
  aspectRatio: string,
  targetDuration: string
): string => {
  return JSON.stringify({
    sceneCount: storyboardData.length,
    clipCount: storyboardData.reduce((acc, s) => acc + s.clips.length, 0),
    voicePromptCount: voicePrompts.length,
    assetCount: assets.length,
    aspectRatio,
    targetDuration,
    // Track which clips have generated images (use substring to detect changes without storing full base64)
    generatedImages: storyboardData.flatMap((s, sIdx) =>
      s.clips.map((c, cIdx) =>
        c.generatedImage ? `${sIdx}-${cIdx}:${c.generatedImage.substring(0, 20)}` : null
      ).filter(Boolean)
    ),
    generatedImagesEnd: storyboardData.flatMap((s, sIdx) =>
      s.clips.map((c, cIdx) =>
        c.generatedImageEnd ? `${sIdx}-${cIdx}:${c.generatedImageEnd.substring(0, 20)}` : null
      ).filter(Boolean)
    ),
  });
};

export function useStoryboardEditor() {
  const { storyboardGenerator, getStageResult, setStageResult, isLoading: isContextLoading, currentProjectId: projectId } = useMithril();
  const [state, dispatch] = useReducer(storyboardEditorReducer, initialState);
  const hasInitializedRef = useRef(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Computed values
  const totalClips = useMemo(() => {
    return state.storyboardData.reduce((acc, s) => acc + s.clips.length, 0);
  }, [state.storyboardData]);

  const hasEndPrompts = useMemo(() => {
    return state.storyboardData.some((s) =>
      s.clips.some((c) => !!c.imagePromptEnd)
    );
  }, [state.storyboardData]);

  const hasData = useMemo(() => {
    return state.storyboardData.length > 0;
  }, [state.storyboardData]);

  // Load existing data from Firestore or context on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;

    // Wait for MithrilContext to finish loading
    if (isContextLoading) return;

    const loadData = async () => {
      // First, try to load from Firestore if we have a projectId
      if (projectId) {
        try {
          const firestoreData = await loadI2VStoryboardAll(projectId);
          if (firestoreData && firestoreData.scenes.length > 0) {
            // Convert Firestore format to local format (URL fields -> local fields)
            const scenes: Scene[] = firestoreData.scenes.map((s) => ({
              sceneTitle: s.sceneTitle,
              clips: s.clips.map((c) => ({
                story: c.story,
                imagePrompt: c.imagePrompt,
                imagePromptEnd: c.imagePromptEnd,
                videoPrompt: c.videoPrompt,
                soraVideoPrompt: c.soraVideoPrompt,
                dialogue: c.dialogue,
                dialogueEn: c.dialogueEn,
                sfx: c.sfx,
                sfxEn: c.sfxEn,
                bgm: c.bgm,
                bgmEn: c.bgmEn,
                length: c.length,
                accumulatedTime: c.accumulatedTime,
                backgroundPrompt: c.backgroundPrompt,
                backgroundId: c.backgroundId,
                referenceImage: c.referenceImageUrl || undefined,
                referenceImageIndex: c.referenceImageIndex,
                generatedImage: c.generatedImageUrl || undefined,
                generatedImageEnd: c.generatedImageEndUrl || undefined,
              })),
            }));

            dispatch({ type: 'SET_STORYBOARD_DATA', payload: scenes });

            if (firestoreData.voicePrompts.length > 0) {
              dispatch({
                type: 'SET_VOICE_PROMPTS',
                payload: firestoreData.voicePrompts.map((v) => ({
                  promptKo: v.promptKo,
                  promptEn: v.promptEn,
                })),
              });
            }

            if (firestoreData.assets.length > 0) {
              dispatch({
                type: 'SET_ASSETS',
                payload: firestoreData.assets.map((a) => ({
                  id: a.id,
                  tags: a.tags,
                  image: a.imageUrl, // URL from Firestore/S3
                  type: a.type,
                })),
              });
            }

            if (firestoreData.meta) {
              dispatch({ type: 'SET_ASPECT_RATIO', payload: firestoreData.meta.aspectRatio });
              dispatch({ type: 'SET_TARGET_DURATION', payload: firestoreData.meta.targetDuration });
            }

            dispatch({ type: 'SET_VIEW', payload: 'generator' });

            // Set lastSavedRef to prevent unnecessary save on load
            const loadedAssets = firestoreData.assets.map((a) => ({
              id: a.id,
              tags: a.tags,
              image: a.imageUrl,
              type: a.type,
            }));
            lastSavedRef.current = createStateHash(
              scenes,
              firestoreData.voicePrompts,
              loadedAssets,
              firestoreData.meta?.aspectRatio || '16:9',
              firestoreData.meta?.targetDuration || '60'
            );

            hasInitializedRef.current = true;
            setIsLoadingData(false);
            return;
          }
        } catch (error) {
          console.error('Failed to load from Firestore:', error);
        }
      }

      // Fallback: Try to load from in-memory context (Stage 4)
      const existingData = getStageResult(STORYBOARD_EDITOR_STAGE) as {
        scenes?: Scene[];
        storyboardData?: Scene[];
        voicePrompts?: VoicePrompt[];
        assets?: Asset[];
        aspectRatio?: AspectRatio;
        targetDuration?: string;
      } | undefined;

      const scenes = existingData?.scenes || existingData?.storyboardData;
      if (scenes && scenes.length > 0) {
        dispatch({ type: 'SET_STORYBOARD_DATA', payload: scenes });
        if (existingData?.voicePrompts) {
          dispatch({ type: 'SET_VOICE_PROMPTS', payload: existingData.voicePrompts });
        }
        if (existingData?.assets) {
          dispatch({ type: 'SET_ASSETS', payload: existingData.assets });
        }
        if (existingData?.aspectRatio) {
          dispatch({ type: 'SET_ASPECT_RATIO', payload: existingData.aspectRatio });
        }
        if (existingData?.targetDuration) {
          dispatch({ type: 'SET_TARGET_DURATION', payload: existingData.targetDuration });
        }
        dispatch({ type: 'SET_VIEW', payload: 'generator' });
        hasInitializedRef.current = true;
        setIsLoadingData(false);
        return;
      }

      // No own data - try to load from ImageToScriptWriter's Firestore data (i2vScript)
      if (projectId) {
        try {
          const i2vScenes = await getI2VScenes(projectId);

          if (i2vScenes.length > 0) {
            // Load clips for each scene
            const scenesWithClips: Scene[] = await Promise.all(
              i2vScenes.map(async (sceneDoc) => {
                const clips = await getI2VClips(projectId, sceneDoc.sceneIndex);
                return {
                  sceneTitle: sceneDoc.sceneTitle,
                  clips: clips.map((c) => ({
                    story: c.story,
                    imagePrompt: c.imagePrompt,
                    imagePromptEnd: c.imagePromptEnd,
                    videoPrompt: c.videoPrompt,
                    soraVideoPrompt: c.soraVideoPrompt,
                    dialogue: c.dialogue,
                    dialogueEn: c.dialogueEn,
                    sfx: c.sfx,
                    sfxEn: c.sfxEn,
                    bgm: c.bgm,
                    bgmEn: c.bgmEn,
                    length: c.length,
                    accumulatedTime: c.accumulatedTime,
                    backgroundPrompt: c.backgroundPrompt,
                    backgroundId: c.backgroundId,
                    referenceImageIndex: c.referenceImageIndex,
                    referenceImage: undefined,
                    generatedImage: undefined,
                    generatedImageEnd: undefined,
                  })),
                };
              })
            );

            const voicePrompts = await getI2VVoicePrompts(projectId);

            dispatch({ type: 'SET_STORYBOARD_DATA', payload: scenesWithClips });
            if (voicePrompts.length > 0) {
              dispatch({
                type: 'SET_VOICE_PROMPTS',
                payload: voicePrompts.map((v) => ({
                  promptKo: v.promptKo,
                  promptEn: v.promptEn,
                })),
              });
            }
            dispatch({ type: 'SET_VIEW', payload: 'generator' });
            hasInitializedRef.current = true;
            setIsLoadingData(false);

            // Save to i2vStoryboard for future loads
            saveI2VStoryboardAll(projectId, {
              meta: {
                targetDuration: '60',
                aspectRatio: '16:9',
              },
              scenes: scenesWithClips.map((scene) => ({
                sceneTitle: scene.sceneTitle || '',
                clips: scene.clips.map((clip) => ({
                  story: clip.story || '',
                  imagePrompt: clip.imagePrompt || '',
                  imagePromptEnd: clip.imagePromptEnd || '',
                  videoPrompt: clip.videoPrompt || '',
                  soraVideoPrompt: clip.soraVideoPrompt || '',
                  backgroundPrompt: clip.backgroundPrompt || '',
                  backgroundId: clip.backgroundId || '',
                  dialogue: clip.dialogue || '',
                  dialogueEn: clip.dialogueEn || '',
                  sfx: clip.sfx || '',
                  sfxEn: clip.sfxEn || '',
                  bgm: clip.bgm || '',
                  bgmEn: clip.bgmEn || '',
                  length: clip.length || '',
                  accumulatedTime: clip.accumulatedTime || '',
                  referenceImageIndex: clip.referenceImageIndex ?? 0,
                  referenceImageUrl: '',
                  generatedImageUrl: '',
                  generatedImageEndUrl: '',
                })),
              })),
              voicePrompts: voicePrompts.map((v) => ({
                promptKo: v.promptKo || '',
                promptEn: v.promptEn || '',
              })),
              assets: [],
            }).then(() => {
              // Set lastSavedRef to prevent duplicate save
              lastSavedRef.current = createStateHash(
                scenesWithClips,
                voicePrompts.map((v) => ({ promptKo: v.promptKo, promptEn: v.promptEn })),
                [],
                '16:9',
                '60'
              );
            }).catch((err) => {
              console.error('[StoryboardEditor] Failed to save to i2vStoryboard:', err);
            });

            return;
          }
        } catch (error) {
          console.error('[StoryboardEditor] Failed to load from i2vScript:', error);
        }
      }

      // Fallback: Try in-memory context (for legacy compatibility)
      let scriptResult = getStageResult(2) as { scenes?: Scene[]; voicePrompts?: VoicePrompt[] } | undefined;

      if (!scriptResult?.scenes || scriptResult.scenes.length === 0) {
        scriptResult = getStageResult(3) as { scenes?: Scene[]; voicePrompts?: VoicePrompt[] } | undefined;
      }

      if (scriptResult && scriptResult.scenes && scriptResult.scenes.length > 0) {
        dispatch({ type: 'SET_STORYBOARD_DATA', payload: scriptResult.scenes });
        if (scriptResult.voicePrompts) {
          dispatch({ type: 'SET_VOICE_PROMPTS', payload: scriptResult.voicePrompts });
        }
        dispatch({ type: 'SET_VIEW', payload: 'generator' });
        hasInitializedRef.current = true;
        setIsLoadingData(false);
        return;
      }

      // Fallback: Text-to-Video pipeline compatibility
      if (storyboardGenerator && storyboardGenerator.scenes && storyboardGenerator.scenes.length > 0) {
        dispatch({ type: 'SET_STORYBOARD_DATA', payload: storyboardGenerator.scenes as Scene[] });
        if (storyboardGenerator.voicePrompts) {
          dispatch({ type: 'SET_VOICE_PROMPTS', payload: storyboardGenerator.voicePrompts as VoicePrompt[] });
        }
        dispatch({ type: 'SET_VIEW', payload: 'generator' });
      }

      hasInitializedRef.current = true;
      setIsLoadingData(false);
    };

    loadData();
  }, [getStageResult, isContextLoading, storyboardGenerator, projectId]);

  // Persist state to context and Firestore whenever storyboard data changes
  useEffect(() => {
    // Only persist if we have data and have been initialized
    if (!hasInitializedRef.current || state.storyboardData.length === 0) {
      return;
    }

    // Persist to in-memory context immediately
    setStageResult(STORYBOARD_EDITOR_STAGE, {
      scenes: state.storyboardData,
      storyboardData: state.storyboardData, // Alias for compatibility
      voicePrompts: state.voicePrompts,
      assets: state.assets,
      aspectRatio: state.aspectRatio,
      targetDuration: state.targetDuration,
    });

    // Debounced save to Firestore
    if (!projectId) return;

    // Create a hash of current state using helper function
    const stateHash = createStateHash(
      state.storyboardData,
      state.voicePrompts,
      state.assets,
      state.aspectRatio,
      state.targetDuration
    );

    if (stateHash === lastSavedRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Process scenes and upload images to S3 if needed
        const processedScenes = await Promise.all(
          state.storyboardData.map(async (scene, sIdx) => ({
            sceneTitle: scene.sceneTitle,
            clips: await Promise.all(
              scene.clips.map(async (clip, cIdx) => {
                let generatedImageUrl = clip.generatedImage;
                let generatedImageEndUrl = clip.generatedImageEnd;

                // Upload start frame to S3 if it's base64
                if (clip.generatedImage && !isUrl(clip.generatedImage)) {
                  try {
                    generatedImageUrl = await uploadI2VStoryboardFrameImage(
                      projectId,
                      sIdx,
                      cIdx,
                      getBase64(clip.generatedImage)
                    );
                  } catch (err) {
                    console.error(`Failed to upload frame ${sIdx}-${cIdx}:`, err);
                    generatedImageUrl = undefined;
                  }
                }

                // Upload end frame to S3 if it's base64
                if (clip.generatedImageEnd && !isUrl(clip.generatedImageEnd)) {
                  try {
                    generatedImageEndUrl = await uploadI2VStoryboardFrameEndImage(
                      projectId,
                      sIdx,
                      cIdx,
                      getBase64(clip.generatedImageEnd)
                    );
                  } catch (err) {
                    console.error(`Failed to upload frame end ${sIdx}-${cIdx}:`, err);
                    generatedImageEndUrl = undefined; // Don't save base64 to Firestore
                  }
                }

                return {
                  story: clip.story || '',
                  imagePrompt: clip.imagePrompt || '',
                  imagePromptEnd: clip.imagePromptEnd || '',
                  videoPrompt: clip.videoPrompt || '',
                  soraVideoPrompt: clip.soraVideoPrompt || '',
                  backgroundPrompt: clip.backgroundPrompt || '',
                  backgroundId: clip.backgroundId || '',
                  dialogue: clip.dialogue || '',
                  dialogueEn: clip.dialogueEn || '',
                  sfx: clip.sfx || '',
                  sfxEn: clip.sfxEn || '',
                  bgm: clip.bgm || '',
                  bgmEn: clip.bgmEn || '',
                  length: clip.length || '',
                  accumulatedTime: clip.accumulatedTime || '',
                  referenceImageIndex: clip.referenceImageIndex ?? 0,
                  // Only store URLs, not base64 (use empty string instead of undefined for Firestore)
                  referenceImageUrl: isUrl(clip.referenceImage) ? clip.referenceImage : '',
                  generatedImageUrl: isUrl(generatedImageUrl) ? generatedImageUrl : '',
                  generatedImageEndUrl: isUrl(generatedImageEndUrl) ? generatedImageEndUrl : '',
                };
              })
            ),
          }))
        );

        // Process assets and upload to S3 if needed
        const processedAssets = await Promise.all(
          state.assets.map(async (asset) => {
            let imageUrl = asset.image;

            // Upload asset to S3 if it's base64
            if (asset.image && !isUrl(asset.image)) {
              try {
                imageUrl = await uploadI2VStoryboardAssetImage(
                  projectId,
                  asset.id,
                  asset.type,
                  getBase64(asset.image)
                );
              } catch (err) {
                console.error(`Failed to upload asset ${asset.id}:`, err);
                imageUrl = ''; // Don't save base64 to Firestore
              }
            }

            return {
              id: asset.id,
              tags: asset.tags,
              imageUrl: isUrl(imageUrl) ? imageUrl : '',
              type: asset.type,
            };
          })
        );

        await saveI2VStoryboardAll(projectId, {
          meta: {
            targetDuration: state.targetDuration,
            aspectRatio: state.aspectRatio,
          },
          scenes: processedScenes,
          voicePrompts: state.voicePrompts.map((v) => ({
            promptKo: v.promptKo,
            promptEn: v.promptEn,
          })),
          assets: processedAssets.filter((a) => a.imageUrl),
        });
        lastSavedRef.current = stateHash;
      } catch (error) {
        console.error('Failed to save to Firestore:', error);
      } finally {
        setIsSaving(false);
      }
    }, AUTO_SAVE_DELAY);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    state.storyboardData,
    state.voicePrompts,
    state.assets,
    state.aspectRatio,
    state.targetDuration,
    setStageResult,
    projectId,
  ]);

  // Actions
  const setView = useCallback((view: ViewMode) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setAspectRatio = useCallback((ratio: AspectRatio) => {
    dispatch({ type: 'SET_ASPECT_RATIO', payload: ratio });
  }, []);

  const setTargetDuration = useCallback((duration: string) => {
    dispatch({ type: 'SET_TARGET_DURATION', payload: duration });
  }, []);

  const updateClip = useCallback(
    (sceneIdx: number, clipIdx: number, clip: Continuity) => {
      dispatch({ type: 'UPDATE_CLIP', payload: { sceneIdx, clipIdx, clip } });
    },
    []
  );

  const addAssets = useCallback(
    async (type: 'character' | 'background', files: FileList) => {
      const newAssets: Asset[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve((e.target?.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        newAssets.push({
          id: Math.random().toString(36).substr(2, 9),
          tags: file.name.split('.')[0].toUpperCase(),
          image: base64,
          type,
        });
      }
      dispatch({ type: 'ADD_ASSETS', payload: newAssets });
    },
    []
  );

  const updateAssetTags = useCallback((id: string, tags: string) => {
    dispatch({ type: 'UPDATE_ASSET_TAGS', payload: { id, tags } });
  }, []);

  const deleteAsset = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ASSET', payload: id });
  }, []);

  // Import JSON project
  const importJSONProject = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const project: ProjectData = JSON.parse(
            event.target?.result as string
          );
          dispatch({ type: 'LOAD_PROJECT', payload: project });
        } catch {
          throw new Error('Failed to parse project file');
        }
      };
      reader.readAsText(file);
    },
    []
  );

  // CSV parsing helper
  const parseCSV = useCallback((text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let current = '';
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
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (current !== '' || row.length > 0) {
          row.push(current);
          result.push(row);
          row = [];
          current = '';
        }
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        current += char;
      }
    }
    if (current !== '' || row.length > 0) {
      row.push(current);
      result.push(row);
    }
    return result;
  }, []);

  // Import CSV
  const importCSV = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length < 2) return;

        const header = rows[0].map((h) => h.trim());
        const findIdx = (names: string[]) => {
          let found = header.findIndex((h) =>
            names.some((n) => h === n)
          );
          if (found !== -1) return found;
          return header.findIndex((h) =>
            names.some((n) => h.toLowerCase().includes(n.toLowerCase()))
          );
        };

        const idx = {
          scene: findIdx(['Scene', '씬']),
          clip: findIdx(['Clip', '클립']),
          length: findIdx(['Length', '길이']),
          accTime: findIdx(['Accumulated', '누적']),
          bgId: findIdx(['Background ID', '배경 ID']),
          bgPrompt: findIdx(['Background Prompt', '배경 프롬프트']),
          story: findIdx(['Story', '스토리']),
          imgStart: findIdx(['Image Prompt', 'Image Prompt (Start)']),
          imgEnd: findIdx(['Image Prompt (End)']),
          video: findIdx(['Video Prompt', '비디오 프롬프트']),
          sora: findIdx(['Sora']),
          dialogue: findIdx(['Dialogue (Ko)']),
          dialogueEn: findIdx(['Dialogue (En)']),
          sfx: findIdx(['SFX (Ko)']),
          sfxEn: findIdx(['SFX (En)']),
          bgm: findIdx(['BGM (Ko)']),
          bgmEn: findIdx(['BGM (En)']),
          refImg: findIdx(['Reference Image', '레퍼런스 이미지']),
        };

        const scenes: Scene[] = [];
        let currentScene: Scene | null = null;
        let lastSceneLabel = '';

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i];
          if (cols.length < 2) continue;
          const getVal = (index: number) =>
            index < 0 || index >= cols.length ? '' : cols[index];
          const sceneLabel = getVal(idx.scene);
          const clip: Continuity = {
            length: getVal(idx.length),
            accumulatedTime: getVal(idx.accTime),
            backgroundId: getVal(idx.bgId),
            backgroundPrompt: getVal(idx.bgPrompt),
            story: getVal(idx.story),
            imagePrompt:
              idx.imgEnd >= 0
                ? getVal(idx.imgStart)
                : getVal(idx.imgStart) || getVal(idx.imgEnd),
            imagePromptEnd: getVal(idx.imgEnd) || undefined,
            videoPrompt: getVal(idx.video),
            soraVideoPrompt: getVal(idx.sora),
            dialogue: getVal(idx.dialogue),
            dialogueEn: getVal(idx.dialogueEn),
            sfx: getVal(idx.sfx),
            sfxEn: getVal(idx.sfxEn),
            bgm: getVal(idx.bgm),
            bgmEn: getVal(idx.bgmEn),
            referenceImage: getVal(idx.refImg) || undefined,
          };

          if (!currentScene || (sceneLabel && sceneLabel !== lastSceneLabel)) {
            lastSceneLabel = sceneLabel;
            const label = sceneLabel || `Scene ${scenes.length + 1}`;
            const sceneTitle = label.includes(': ')
              ? label.split(': ').slice(1).join(': ')
              : label;
            currentScene = { sceneTitle, clips: [clip] };
            scenes.push(currentScene);
          } else {
            currentScene.clips.push(clip);
          }
        }

        if (scenes.length > 0) {
          dispatch({ type: 'SET_STORYBOARD_DATA', payload: scenes });
          dispatch({ type: 'SET_VIEW', payload: 'generator' });
        }
      };
      reader.readAsText(file);
    },
    [parseCSV]
  );

  // Export project as JSON
  const saveProject = useCallback(() => {
    const project: ProjectData = {
      storyboardData: state.storyboardData,
      voicePrompts: state.voicePrompts,
      assets: state.assets,
      targetDuration: state.targetDuration,
      aspectRatio: state.aspectRatio,
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `project_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  }, [state]);

  // Export CSV
  const escapeCSV = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const downloadCSV = useCallback(() => {
    if (state.storyboardData.length === 0) return;

    const hasEnd = state.storyboardData.some((s) =>
      s.clips.some((c) => !!c.imagePromptEnd)
    );
    const headers = [
      'Scene',
      'Clip',
      'Length',
      'Accumulated Time',
      'Background ID',
      'Background Prompt',
      'Reference Image',
      'Story',
      'Image Prompt (Start)',
      ...(hasEnd ? ['Image Prompt (End)'] : []),
      'Video Prompt',
      'Sora Video Prompt',
      'Dialogue (Ko)',
      'Dialogue (En)',
      'SFX (Ko)',
      'SFX (En)',
      'BGM (Ko)',
      'BGM (En)',
    ];

    const csvContent = [
      headers.join(','),
      ...state.storyboardData.flatMap((scene, sIdx) =>
        scene.clips.map((clip, cIdx) => {
          const row = [
            escapeCSV(`Scene ${sIdx + 1}: ${scene.sceneTitle}`),
            escapeCSV(`${sIdx + 1}-${cIdx + 1}`),
            escapeCSV(clip.length),
            escapeCSV(clip.accumulatedTime),
            escapeCSV(clip.backgroundId),
            escapeCSV(clip.backgroundPrompt),
            escapeCSV(clip.referenceImage || ''),
            escapeCSV(clip.story),
            escapeCSV(clip.imagePrompt),
          ];
          if (hasEnd) row.push(escapeCSV(clip.imagePromptEnd || ''));
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
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'storyboard.csv';
    link.click();
  }, [state.storyboardData]);

  // Load data from previous stage (ImageToScriptWriter)
  const loadFromPreviousStage = useCallback(() => {
    // ImageToScriptWriter saves to stage result key 2 (legacy inconsistency)
    // Try key 2 first, then key 3 for compatibility
    let scriptResult = getStageResult(2) as { scenes?: Scene[]; voicePrompts?: VoicePrompt[] } | undefined;

    if (!scriptResult?.scenes || scriptResult.scenes.length === 0) {
      scriptResult = getStageResult(3) as { scenes?: Scene[]; voicePrompts?: VoicePrompt[] } | undefined;
    }

    if (scriptResult && scriptResult.scenes && scriptResult.scenes.length > 0) {
      dispatch({ type: 'SET_STORYBOARD_DATA', payload: scriptResult.scenes });
      if (scriptResult.voicePrompts) {
        dispatch({ type: 'SET_VOICE_PROMPTS', payload: scriptResult.voicePrompts });
      }
      dispatch({ type: 'SET_VIEW', payload: 'generator' });
      return;
    }

    // Also try storyboardGenerator for text-to-video pipeline compatibility
    if (storyboardGenerator && storyboardGenerator.scenes && storyboardGenerator.scenes.length > 0) {
      dispatch({ type: 'SET_STORYBOARD_DATA', payload: storyboardGenerator.scenes as Scene[] });
      if (storyboardGenerator.voicePrompts) {
        dispatch({ type: 'SET_VOICE_PROMPTS', payload: storyboardGenerator.voicePrompts as VoicePrompt[] });
      }
      dispatch({ type: 'SET_VIEW', payload: 'generator' });
    }
  }, [getStageResult, storyboardGenerator]);

  return {
    state,
    totalClips,
    hasEndPrompts,
    hasData,
    isLoadingData,
    isSaving,
    setView,
    setLoading,
    setAspectRatio,
    setTargetDuration,
    updateClip,
    addAssets,
    updateAssetTags,
    deleteAsset,
    importJSONProject,
    importCSV,
    saveProject,
    downloadCSV,
    loadFromPreviousStage,
  };
}
