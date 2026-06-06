import React, { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type {
  StudentRecord,
  ColumnMapping,
  Template,
  Toast,
  AppSettings,
  PageId,
  GenerationReport,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';

/* ─── State Shape ─────────────────────────────────────── */
export interface AppState {
  // Data
  students: StudentRecord[];
  columns: string[];
  columnMapping: ColumnMapping;

  // Photos
  photoFolder: string;
  photoFiles: string[];
  matchedPhotos: Map<string, string>; // studentId -> filePath
  missingPhotos: string[];

  // Templates
  templates: Template[];
  activeTemplate: Template | null;
  activeCardSide: 'front' | 'back';
  selectedElementId: string | null;

  // Navigation
  currentPage: PageId;
  previewIndex: number;

  // Export
  isGenerating: boolean;
  generationProgress: number;
  generationReport: GenerationReport | null;

  // Settings
  settings: AppSettings;

  // UI
  toasts: Toast[];
  sidebarCollapsed: boolean;
  isLoading: boolean;
}

export const initialState: AppState = {
  students: [],
  columns: [],
  columnMapping: {},
  photoFolder: '',
  photoFiles: [],
  matchedPhotos: new Map(),
  missingPhotos: [],
  templates: [],
  activeTemplate: null,
  activeCardSide: 'front',
  selectedElementId: null,
  currentPage: 'dashboard',
  previewIndex: 0,
  isGenerating: false,
  generationProgress: 0,
  generationReport: null,
  settings: DEFAULT_SETTINGS,
  toasts: [],
  sidebarCollapsed: false,
  isLoading: false,
};

/* ─── Actions ─────────────────────────────────────────── */
export type AppAction =
  | { type: 'SET_STUDENTS'; payload: StudentRecord[] }
  | { type: 'SET_COLUMNS'; payload: string[] }
  | { type: 'SET_COLUMN_MAPPING'; payload: ColumnMapping }
  | { type: 'SET_PHOTO_FOLDER'; payload: string }
  | { type: 'SET_PHOTO_FILES'; payload: string[] }
  | { type: 'SET_MATCHED_PHOTOS'; payload: Map<string, string> }
  | { type: 'SET_MISSING_PHOTOS'; payload: string[] }
  | { type: 'SET_TEMPLATES'; payload: Template[] }
  | { type: 'SET_ACTIVE_TEMPLATE'; payload: Template | null }
  | { type: 'UPDATE_ACTIVE_TEMPLATE'; payload: Partial<Template> }
  | { type: 'SET_ACTIVE_CARD_SIDE'; payload: 'front' | 'back' }
  | { type: 'SET_SELECTED_ELEMENT'; payload: string | null }
  | { type: 'SET_CURRENT_PAGE'; payload: PageId }
  | { type: 'SET_PREVIEW_INDEX'; payload: number }
  | { type: 'SET_IS_GENERATING'; payload: boolean }
  | { type: 'SET_GENERATION_PROGRESS'; payload: number }
  | { type: 'SET_GENERATION_REPORT'; payload: GenerationReport | null }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LOADING'; payload: boolean };

/* ─── Reducer ─────────────────────────────────────────── */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STUDENTS':
      return { ...state, students: action.payload };
    case 'SET_COLUMNS':
      return { ...state, columns: action.payload };
    case 'SET_COLUMN_MAPPING':
      return { ...state, columnMapping: action.payload };
    case 'SET_PHOTO_FOLDER':
      return { ...state, photoFolder: action.payload };
    case 'SET_PHOTO_FILES':
      return { ...state, photoFiles: action.payload };
    case 'SET_MATCHED_PHOTOS':
      return { ...state, matchedPhotos: action.payload };
    case 'SET_MISSING_PHOTOS':
      return { ...state, missingPhotos: action.payload };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'SET_ACTIVE_TEMPLATE':
      return { ...state, activeTemplate: action.payload };
    case 'UPDATE_ACTIVE_TEMPLATE':
      return {
        ...state,
        activeTemplate: state.activeTemplate
          ? { ...state.activeTemplate, ...action.payload }
          : null,
      };
    case 'SET_ACTIVE_CARD_SIDE':
      return { ...state, activeCardSide: action.payload };
    case 'SET_SELECTED_ELEMENT':
      return { ...state, selectedElementId: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_PREVIEW_INDEX':
      return { ...state, previewIndex: action.payload };
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_GENERATION_PROGRESS':
      return { ...state, generationProgress: action.payload };
    case 'SET_GENERATION_REPORT':
      return { ...state, generationReport: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

/* ─── Context ─────────────────────────────────────────── */
interface AppContextType {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
