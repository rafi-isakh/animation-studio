"use client";

import { useReducer, useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useMithril } from '../../MithrilContext';
import { storyboardEditorReducer, initialState } from './reducer';
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

export function useStoryboardEditor() {
  const { storyboardGenerator, getStageResult, setStageResult, isLoading: isContextLoading } = useMithril();
  const [state, dispatch] = useReducer(storyboardEditorReducer, initialState);
  const hasInitializedRef = useRef(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

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

  // Load existing data from context on mount (for when navigating back to this stage)
  useEffect(() => {
    if (hasInitializedRef.current) return;

    // Wait for MithrilContext to finish loading
    if (isContextLoading) return;

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
    }

    hasInitializedRef.current = true;
    setIsLoadingData(false);
  }, [getStageResult, isContextLoading]);

  // Persist state to context whenever storyboard data changes
  useEffect(() => {
    // Only persist if we have data and have been initialized
    if (!hasInitializedRef.current || state.storyboardData.length === 0) {
      return;
    }

    setStageResult(STORYBOARD_EDITOR_STAGE, {
      scenes: state.storyboardData,
      storyboardData: state.storyboardData, // Alias for compatibility
      voicePrompts: state.voicePrompts,
      assets: state.assets,
      aspectRatio: state.aspectRatio,
      targetDuration: state.targetDuration,
    });
  }, [
    state.storyboardData,
    state.voicePrompts,
    state.assets,
    state.aspectRatio,
    state.targetDuration,
    setStageResult,
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
