import type {
  ScriptWriterState,
  GenerationConditions,
  StyleGuides,
  Scene,
  VoicePrompt,
} from './types';
import { GENRE_PRESETS } from './constants';

// Action types
export type ScriptWriterAction =
  // Config actions
  | { type: 'SET_GENRE'; genre: string }
  | { type: 'SET_TARGET_DURATION'; duration: string }
  | { type: 'SET_SOURCE_TEXT'; text: string }
  | { type: 'SET_CONDITIONS'; conditions: Partial<GenerationConditions> }
  | { type: 'SET_GUIDES'; guides: Partial<StyleGuides> }
  // UI actions
  | { type: 'TOGGLE_CONDITIONS' }
  | { type: 'TOGGLE_GUIDES' }
  // Manga images actions
  | { type: 'ADD_MANGA_FILES'; files: (File | string)[] }
  | { type: 'SET_CONVERTED_IMAGES'; images: string[] }
  | { type: 'CLEAR_MANGA_IMAGES' }
  // Processing actions
  | { type: 'START_GENERATING' }
  | { type: 'FINISH_GENERATING'; result: { scenes: Scene[]; voicePrompts: VoicePrompt[] } }
  | { type: 'GENERATION_ERROR' }
  | { type: 'START_SPLITTING' }
  | { type: 'FINISH_SPLITTING'; scenes: Scene[] }
  | { type: 'SPLITTING_ERROR' }
  // Result actions
  | { type: 'UPDATE_SCENES'; scenes: Scene[] }
  | { type: 'RESET' };

// Get default preset
const defaultPreset = GENRE_PRESETS[0];

// Initial state
export const initialState: ScriptWriterState = {
  config: {
    genre: 'fantasy',
    targetDuration: '03:00',
    sourceText: '',
    conditions: {
      story: defaultPreset.story,
      image: defaultPreset.image,
      video: defaultPreset.video,
      sound: defaultPreset.sound,
    },
    guides: {
      image: '',
      video: '',
    },
  },
  ui: {
    showConditions: false,
    showGuides: false,
  },
  processing: {
    isGenerating: false,
    isSplitting: false,
  },
  mangaImages: [],
  mangaImageFiles: [],
  result: null,
};

// Reducer function
export function scriptWriterReducer(
  state: ScriptWriterState,
  action: ScriptWriterAction
): ScriptWriterState {
  switch (action.type) {
    // Config actions
    case 'SET_GENRE': {
      const preset = GENRE_PRESETS.find((p) => p.id === action.genre);
      if (preset && action.genre !== 'custom') {
        return {
          ...state,
          config: {
            ...state.config,
            genre: action.genre,
            conditions: {
              story: preset.story,
              image: preset.image,
              video: preset.video,
              sound: preset.sound,
            },
          },
        };
      }
      return {
        ...state,
        config: { ...state.config, genre: action.genre },
      };
    }

    case 'SET_TARGET_DURATION':
      return {
        ...state,
        config: { ...state.config, targetDuration: action.duration },
      };

    case 'SET_SOURCE_TEXT':
      return {
        ...state,
        config: { ...state.config, sourceText: action.text },
      };

    case 'SET_CONDITIONS':
      return {
        ...state,
        config: {
          ...state.config,
          conditions: { ...state.config.conditions, ...action.conditions },
        },
      };

    case 'SET_GUIDES':
      return {
        ...state,
        config: {
          ...state.config,
          guides: { ...state.config.guides, ...action.guides },
        },
      };

    // UI actions
    case 'TOGGLE_CONDITIONS':
      return {
        ...state,
        ui: { ...state.ui, showConditions: !state.ui.showConditions },
      };

    case 'TOGGLE_GUIDES':
      return {
        ...state,
        ui: { ...state.ui, showGuides: !state.ui.showGuides },
      };

    // Manga images actions
    case 'ADD_MANGA_FILES':
      return {
        ...state,
        mangaImageFiles: [...state.mangaImageFiles, ...action.files],
      };

    case 'SET_CONVERTED_IMAGES':
      return {
        ...state,
        mangaImages: action.images,
      };

    case 'CLEAR_MANGA_IMAGES':
      return {
        ...state,
        mangaImages: [],
        mangaImageFiles: [],
      };

    // Processing actions
    case 'START_GENERATING':
      return {
        ...state,
        processing: { ...state.processing, isGenerating: true },
      };

    case 'FINISH_GENERATING':
      return {
        ...state,
        processing: { ...state.processing, isGenerating: false },
        result: action.result,
      };

    case 'GENERATION_ERROR':
      return {
        ...state,
        processing: { ...state.processing, isGenerating: false },
      };

    case 'START_SPLITTING':
      return {
        ...state,
        processing: { ...state.processing, isSplitting: true },
      };

    case 'FINISH_SPLITTING':
      return {
        ...state,
        processing: { ...state.processing, isSplitting: false },
        result: state.result
          ? { ...state.result, scenes: action.scenes }
          : { scenes: action.scenes, voicePrompts: [] },
      };

    case 'SPLITTING_ERROR':
      return {
        ...state,
        processing: { ...state.processing, isSplitting: false },
      };

    // Result actions
    case 'UPDATE_SCENES':
      return {
        ...state,
        result: state.result
          ? { ...state.result, scenes: action.scenes }
          : { scenes: action.scenes, voicePrompts: [] },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
