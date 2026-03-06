import {
  PanelEditorState,
  PanelEditorAction,
  AspectRatio,
  ProcessingStatus,
} from './types';

// Initial state
export const initialState: PanelEditorState = {
  fileLibrary: {},
  panels: [],
  config: {
    targetAspectRatio: AspectRatio.Portrait, // Default to 9:16
  },
  isProcessing: false,
  progress: { current: 0, total: 0 },
};

// Reducer function
export function panelEditorReducer(
  state: PanelEditorState,
  action: PanelEditorAction
): PanelEditorState {
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
      const removed = state.panels.find((p) => p.id === action.id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
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
      // Revoke object URLs
      state.panels.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return { ...state, panels: [] };
    }

    case 'RESET_STATE': {
      // Revoke all object URLs
      state.panels.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return { ...initialState };
    }

    default:
      return state;
  }
}
