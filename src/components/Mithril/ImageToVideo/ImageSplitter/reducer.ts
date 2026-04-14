import type {
  ImageSplitterState,
  MangaPage,
  MangaPanel,
  ProcessingStatus,
  ReadingDirection,
  ProcessingStats,
} from './types';

function normalizePanelLabels(panels: MangaPanel[]): MangaPanel[] {
  return panels.map((panel, idx) => ({
    ...panel,
    label: String(idx + 1),
  }));
}

// Action types
export type ImageSplitterAction =
  | { type: 'ADD_PAGES'; pages: MangaPage[] }
  | { type: 'REMOVE_PAGE'; id: string }
  | { type: 'UPDATE_PAGE_STATUS'; id: string; status: ProcessingStatus }
  | { type: 'SET_PAGE_PANELS'; id: string; panels: MangaPanel[]; previewUrl?: string }
  | { type: 'SET_PAGE_INDEX'; id: string; pageIndex: number }
  | { type: 'SET_PAGE_DIMENSIONS'; id: string; width: number; height: number }
  | { type: 'SET_ACTIVE_PAGE'; id: string | null }
  | { type: 'ADD_PANEL'; pageId: string; panel: MangaPanel }
  | { type: 'DELETE_PANEL'; pageId: string; panelId: string }
  | { type: 'UPDATE_PANEL'; pageId: string; panelId: string; panel: Partial<MangaPanel> }
  | { type: 'UPDATE_PANEL_STORYBOARD'; pageId: string; panelId: string; text: string }
  | { type: 'SET_READING_DIRECTION'; direction: ReadingDirection }
  | { type: 'START_PROCESSING'; total: number }
  | { type: 'INCREMENT_PROGRESS' }
  | { type: 'FINISH_PROCESSING'; stats: ProcessingStats }
  | { type: 'RESET_STATS' }
  | { type: 'RESET_PAGE_ANALYSIS'; pageId: string }
  | { type: 'RESET_ANALYZED_DATA' }
  | { type: 'RESET' };

// Initial state
export const initialState: ImageSplitterState = {
  pages: [],
  isProcessing: false,
  progress: { current: 0, total: 0 },
  readingDirection: 'rtl',
  processingStats: null,
  activePageId: null,
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
        activePageId: state.activePageId || (action.pages.length > 0 ? action.pages[0].id : null),
      };

    case 'REMOVE_PAGE':
      return {
        ...state,
        pages: state.pages.filter((p) => p.id !== action.id),
        activePageId: state.activePageId === action.id
          ? (state.pages.length > 1 ? state.pages.find(p => p.id !== action.id)?.id || null : null)
          : state.activePageId,
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
            ? {
                ...p,
                panels: normalizePanelLabels(action.panels),
                status: action.panels.length > 0 ? ('completed' as ProcessingStatus) : ('pending' as ProcessingStatus),
                // Update previewUrl with S3 URL if provided (preserves blob URL if not)
                ...(action.previewUrl ? { previewUrl: action.previewUrl } : {}),
              }
            : p
        ),
      };

    case 'SET_PAGE_INDEX':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.id ? { ...p, pageIndex: action.pageIndex } : p
        ),
      };

    case 'SET_PAGE_DIMENSIONS':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.id ? { ...p, width: action.width, height: action.height } : p
        ),
      };

    case 'SET_ACTIVE_PAGE':
      return {
        ...state,
        activePageId: action.id,
      };

    case 'ADD_PANEL':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId
            ? {
                ...p,
                panels: normalizePanelLabels([...p.panels, action.panel]),
                status: 'completed' as ProcessingStatus,
              }
            : p
        ),
      };

    case 'DELETE_PANEL':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId
            ? {
                ...p,
                panels: normalizePanelLabels(
                  p.panels.filter((panel) => panel.id !== action.panelId)
                ),
                status: p.panels.length > 1 ? ('completed' as ProcessingStatus) : ('pending' as ProcessingStatus),
              }
            : p
        ),
      };

    case 'RESET_PAGE_ANALYSIS':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId
            ? {
                ...p,
                panels: [],
                status: 'pending' as ProcessingStatus,
                jobId: undefined,
              }
            : p
        ),
      };

    case 'UPDATE_PANEL':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId
            ? {
                ...p,
                panels: p.panels.map((panel) =>
                  panel.id === action.panelId ? { ...panel, ...action.panel } : panel
                ),
              }
            : p
        ),
      };

    case 'UPDATE_PANEL_STORYBOARD':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId
            ? {
                ...p,
                panels: p.panels.map((panel) =>
                  panel.id === action.panelId
                    ? { ...panel, storyboard: { text: action.text } }
                    : panel
                ),
              }
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

    case 'RESET_ANALYZED_DATA':
      return {
        ...state,
        pages: state.pages.map((p) => ({
          ...p,
          panels: [],
          status: 'pending' as ProcessingStatus,
          jobId: undefined,
        })),
        isProcessing: false,
        progress: { current: 0, total: 0 },
        processingStats: null,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
