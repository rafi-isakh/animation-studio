import type {
  ImageSplitterState,
  MangaPage,
  MangaPanel,
  ProcessingStatus,
  ReadingDirection,
  ProcessingStats,
} from './types';

// Action types
export type ImageSplitterAction =
  | { type: 'ADD_PAGES'; pages: MangaPage[] }
  | { type: 'REMOVE_PAGE'; id: string }
  | { type: 'UPDATE_PAGE_STATUS'; id: string; status: ProcessingStatus }
  | { type: 'SET_PAGE_PANELS'; id: string; panels: MangaPanel[] }
  | { type: 'SET_READING_DIRECTION'; direction: ReadingDirection }
  | { type: 'START_PROCESSING'; total: number }
  | { type: 'INCREMENT_PROGRESS' }
  | { type: 'FINISH_PROCESSING'; stats: ProcessingStats }
  | { type: 'RESET_STATS' }
  | { type: 'RESET' };

// Initial state
export const initialState: ImageSplitterState = {
  pages: [],
  isProcessing: false,
  progress: { current: 0, total: 0 },
  readingDirection: 'rtl',
  processingStats: null,
};

// Reducer function
export function imageSplitterReducer(
  state: ImageSplitterState,
  action: ImageSplitterAction
): ImageSplitterState {
  switch (action.type) {
    case 'ADD_PAGES':
      return {
        ...state,
        pages: [...state.pages, ...action.pages],
        processingStats: null, // Reset stats when new files are added
      };

    case 'REMOVE_PAGE':
      return {
        ...state,
        pages: state.pages.filter((p) => p.id !== action.id),
      };

    case 'UPDATE_PAGE_STATUS':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.id ? { ...p, status: action.status } : p
        ),
      };

    case 'SET_PAGE_PANELS':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.id
            ? { ...p, panels: action.panels, status: 'completed' as ProcessingStatus }
            : p
        ),
      };

    case 'SET_READING_DIRECTION':
      return {
        ...state,
        readingDirection: action.direction,
      };

    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        progress: { current: 0, total: action.total },
        processingStats: null,
      };

    case 'INCREMENT_PROGRESS':
      return {
        ...state,
        progress: {
          ...state.progress,
          current: state.progress.current + 1,
        },
      };

    case 'FINISH_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        processingStats: action.stats,
      };

    case 'RESET_STATS':
      return {
        ...state,
        processingStats: null,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
