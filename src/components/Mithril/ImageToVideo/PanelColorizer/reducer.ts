import {
  PanelColorizerState,
  PanelColorizerAction,
  AspectRatio,
} from './types';

// Initial state
export const initialState: PanelColorizerState = {
  fileLibrary: {},
  panels: [],
  referenceImages: [],
  globalPrompt: '',
  config: {
    targetAspectRatio: AspectRatio.Portrait, // Default to 9:16
  },
  isProcessing: false,
  progress: { current: 0, total: 0 },
};

// Reducer function
export function panelColorizerReducer(
  state: PanelColorizerState,
  action: PanelColorizerAction
): PanelColorizerState {
  switch (action.type) {
    case 'ADD_FILES_TO_LIBRARY': {
      const newLib = { ...state.fileLibrary };
      action.files.forEach((f) => {
        newLib[f.name] = f;
      });
      return { ...state, fileLibrary: newLib };
    }

    case 'ADD_PANELS': {
      return { ...state, panels: [...state.panels, ...action.panels] };
    }

    case 'REMOVE_PANEL': {
      return {
        ...state,
        panels: state.panels.filter((p) => p.id !== action.id),
      };
    }

    case 'UPDATE_PANEL': {
      return {
        ...state,
        panels: state.panels.map((p) =>
          p.id === action.id ? { ...p, ...action.updates } : p
        ),
      };
    }

    case 'SET_REFERENCE_IMAGES': {
      // Revoke old preview URLs
      state.referenceImages.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
      return { ...state, referenceImages: action.images };
    }

    case 'ADD_REFERENCE_IMAGES': {
      return { ...state, referenceImages: [...state.referenceImages, ...action.images] };
    }

    case 'REMOVE_REFERENCE_IMAGE': {
      const img = state.referenceImages.find((i) => i.id === action.id);
      if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
      return {
        ...state,
        referenceImages: state.referenceImages.filter((i) => i.id !== action.id),
      };
    }

    case 'SET_GLOBAL_PROMPT': {
      return { ...state, globalPrompt: action.prompt };
    }

    case 'SET_CONFIG': {
      return { ...state, config: { ...state.config, ...action.config } };
    }

    case 'SET_PROCESSING': {
      return { ...state, isProcessing: action.isProcessing };
    }

    case 'SET_PROGRESS': {
      return { ...state, progress: action.progress };
    }

    case 'CLEAR_PANELS': {
      state.panels.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return { ...state, panels: [] };
    }

    case 'RESET_STATE': {
      state.panels.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      state.referenceImages.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
      return { ...initialState };
    }

    default:
      return state;
  }
}
