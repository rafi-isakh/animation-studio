import type {
  StoryboardEditorState,
  Scene,
  VoicePrompt,
  Asset,
  AspectRatio,
  Continuity,
  ViewMode,
  ProjectData,
} from './types';

// Action types
export type StoryboardEditorAction =
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STORYBOARD_DATA'; payload: Scene[] }
  | { type: 'SET_VOICE_PROMPTS'; payload: VoicePrompt[] }
  | { type: 'SET_ASSETS'; payload: Asset[] }
  | { type: 'ADD_ASSETS'; payload: Asset[] }
  | { type: 'UPDATE_ASSET_TAGS'; payload: { id: string; tags: string } }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'SET_TARGET_DURATION'; payload: string }
  | { type: 'SET_ASPECT_RATIO'; payload: AspectRatio }
  | { type: 'UPDATE_CLIP'; payload: { sceneIdx: number; clipIdx: number; clip: Continuity } }
  | { type: 'LOAD_PROJECT'; payload: ProjectData }
  | { type: 'RESET' };

// Initial state
export const initialState: StoryboardEditorState = {
  storyboardData: [],
  voicePrompts: [],
  assets: [],
  targetDuration: '03:00',
  aspectRatio: '16:9',
  ui: {
    view: 'table',
    loading: false,
  },
};

// Reducer function
export function storyboardEditorReducer(
  state: StoryboardEditorState,
  action: StoryboardEditorAction
): StoryboardEditorState {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        ui: { ...state.ui, view: action.payload },
      };

    case 'SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, loading: action.payload },
      };

    case 'SET_STORYBOARD_DATA':
      return {
        ...state,
        storyboardData: action.payload,
      };

    case 'SET_VOICE_PROMPTS':
      return {
        ...state,
        voicePrompts: action.payload,
      };

    case 'SET_ASSETS':
      return {
        ...state,
        assets: action.payload,
      };

    case 'ADD_ASSETS':
      return {
        ...state,
        assets: [...state.assets, ...action.payload],
      };

    case 'UPDATE_ASSET_TAGS':
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.payload.id ? { ...a, tags: action.payload.tags } : a
        ),
      };

    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.payload),
      };

    case 'SET_TARGET_DURATION':
      return {
        ...state,
        targetDuration: action.payload,
      };

    case 'SET_ASPECT_RATIO':
      return {
        ...state,
        aspectRatio: action.payload,
      };

    case 'UPDATE_CLIP': {
      const { sceneIdx, clipIdx, clip } = action.payload;
      const newData = [...state.storyboardData];
      newData[sceneIdx] = {
        ...newData[sceneIdx],
        clips: newData[sceneIdx].clips.map((c, i) => (i === clipIdx ? clip : c)),
      };
      return {
        ...state,
        storyboardData: newData,
      };
    }

    case 'LOAD_PROJECT':
      return {
        ...state,
        storyboardData: action.payload.storyboardData || [],
        voicePrompts: action.payload.voicePrompts || [],
        assets: action.payload.assets || [],
        targetDuration: action.payload.targetDuration || '03:00',
        aspectRatio: action.payload.aspectRatio || '16:9',
        ui: {
          ...state.ui,
          view: (action.payload.storyboardData || []).length > 0 ? 'generator' : 'table',
        },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
