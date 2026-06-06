import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'TEXT' | 'IMAGE' | 'QRCODE' | 'BARCODE';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  face: 'front' | 'back';
  
  // Specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  wordWrap?: boolean;
  autoFit?: boolean;
  
  src?: string; // For images
  qrPayload?: string; // Original QR/Barcode payload
  barcodeFormat?: string;
  
  mappedColumn?: string; // For Excel Data Mapping
  maskType?: 'NONE' | 'CIRCLE' | 'OVAL' | 'RECTANGLE' | 'ROUNDED_RECTANGLE' | 'HEXAGON';
}

interface HistoryState {
  elements: CanvasElement[];
  backgroundUrlFront: string | null;
  backgroundUrlBack: string | null;
}

interface EditorState {
  // UI State
  activePanel: 'templates' | 'elements' | 'text' | 'images' | 'layers' | null;
  selectedElementId: string | null;
  zoomLevel: number;
  activeFace: 'front' | 'back';
  
  // Canvas Data
  elements: CanvasElement[];
  backgroundUrlFront: string | null;
  backgroundUrlBack: string | null;
  canvasSize: { width: number; height: number };
  activeTemplateId: string | null;
  activeTemplateName: string | null;

  // History
  past: HistoryState[];
  future: HistoryState[];

  // UI Actions
  setActivePanel: (panel: EditorState['activePanel']) => void;
  setElements: (elements: CanvasElement[]) => void;
  setSelectedElementId: (id: string | null) => void;
  setZoomLevel: (zoom: number) => void;
  setActiveFace: (face: 'front' | 'back') => void;

  // History Actions
  undo: () => void;
  redo: () => void;

  // Canvas Actions
  addElement: (type: ElementType, payload?: Partial<CanvasElement>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  reorderElement: (id: string, direction: 'up' | 'down') => void;
  setBackgroundImage: (url: string | null, face: 'front' | 'back') => void;
  
  // Template Actions
  exportToJSON: () => string;
  loadFromJSON: (json: string) => void;
  setActiveTemplate: (id: string | null, name: string | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  const saveHistory = () => {
    const { elements, backgroundUrlFront, backgroundUrlBack, past } = get();
    // Keep max 50 history states
    const newPast = [...past, { elements, backgroundUrlFront, backgroundUrlBack }];
    if (newPast.length > 50) newPast.shift();
    set({ past: newPast, future: [] });
  };

  return {
    activePanel: 'elements',
    selectedElementId: null,
    zoomLevel: 100,
    activeFace: 'front',
    
    elements: [],
    backgroundUrlFront: null,
    backgroundUrlBack: null,
    canvasSize: { width: 638, height: 1013 }, // Standard ID Card size at 300DPI
    activeTemplateId: null,
    activeTemplateName: null,

    past: [],
    future: [],

    setActivePanel: (panel) => set({ activePanel: panel }),
    setElements: (elements) => {
      saveHistory();
      set({ elements });
    },
    setSelectedElementId: (id) => set({ selectedElementId: id }),
    setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
    setActiveFace: (face) => set({ activeFace: face, selectedElementId: null }),

    undo: () => {
      const { past, future, elements, backgroundUrlFront, backgroundUrlBack } = get();
      if (past.length === 0) return;
      
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      set({
        past: newPast,
        future: [{ elements, backgroundUrlFront, backgroundUrlBack }, ...future],
        elements: previous.elements,
        backgroundUrlFront: previous.backgroundUrlFront,
        backgroundUrlBack: previous.backgroundUrlBack,
        selectedElementId: null,
      });
    },

    redo: () => {
      const { past, future, elements, backgroundUrlFront, backgroundUrlBack } = get();
      if (future.length === 0) return;
      
      const next = future[0];
      const newFuture = future.slice(1);
      
      set({
        past: [...past, { elements, backgroundUrlFront, backgroundUrlBack }],
        future: newFuture,
        elements: next.elements,
        backgroundUrlFront: next.backgroundUrlFront,
        backgroundUrlBack: next.backgroundUrlBack,
        selectedElementId: null,
      });
    },

    addElement: (type, payload) => {
      saveHistory();
      const { elements, activeFace } = get();
      const newElement: CanvasElement = {
        id: uuidv4(),
        type,
        x: payload?.x ?? 50,
        y: payload?.y ?? 50,
        width: payload?.width ?? 200,
        height: payload?.height ?? 100,
        rotation: payload?.rotation ?? 0,
        zIndex: elements.length,
        face: payload?.face ?? activeFace,
        text: payload?.text ?? (type === 'TEXT' ? 'Double click to edit' : undefined),
        fontSize: payload?.fontSize ?? 32,
        fontFamily: payload?.fontFamily ?? 'Arial',
        fill: payload?.fill ?? '#000000',
        wordWrap: payload?.wordWrap ?? false,
        autoFit: payload?.autoFit ?? false,
        src: payload?.src,
        qrPayload: payload?.qrPayload,
        barcodeFormat: payload?.barcodeFormat ?? 'CODE128',
        ...payload,
      };
      set({ elements: [...elements, newElement] });
    },

    updateElement: (id, updates) => {
      saveHistory();
      const { elements } = get();
      set({
        elements: elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      });
    },

    removeElement: (id) => {
      saveHistory();
      const { elements, selectedElementId } = get();
      set({
        elements: elements.filter((el) => el.id !== id),
        selectedElementId: selectedElementId === id ? null : selectedElementId,
      });
    },

    duplicateElement: (id) => {
      saveHistory();
      const { elements } = get();
      const target = elements.find((el) => el.id === id);
      if (!target) return;

      const newElement: CanvasElement = {
        ...target,
        id: uuidv4(),
        x: target.x + 20,
        y: target.y + 20,
        zIndex: elements.length,
      };

      set({ elements: [...elements, newElement], selectedElementId: newElement.id });
    },

    reorderElement: (id, direction) => {
      saveHistory();
      const { elements } = get();
      
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1) return;

      const newElements = [...elements];
      if (direction === 'up' && index < elements.length - 1) {
        [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      } else if (direction === 'down' && index > 0) {
        [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      }

      const reordered = newElements.map((el, i) => ({ ...el, zIndex: i }));
      set({ elements: reordered });
    },

    setBackgroundImage: (url, face) => {
      saveHistory();
      if (face === 'front') {
        set({ backgroundUrlFront: url });
      } else {
        set({ backgroundUrlBack: url });
      }
    },

    exportToJSON: () => {
      const state = get();
      return JSON.stringify({
        elements: state.elements,
        backgroundUrlFront: state.backgroundUrlFront,
        backgroundUrlBack: state.backgroundUrlBack,
        canvasSize: state.canvasSize,
      }, null, 2);
    },

    loadFromJSON: (json) => {
      try {
        const parsed = JSON.parse(json);
        if (parsed.elements && parsed.canvasSize) {
          
          const bgFront = parsed.backgroundUrlFront ?? parsed.backgroundUrl ?? null;
          const bgBack = parsed.backgroundUrlBack ?? null;

          const migratedElements = parsed.elements.map((el: CanvasElement) => ({
            ...el,
            face: el.face || 'front'
          }));

          set({
            elements: migratedElements,
            backgroundUrlFront: bgFront,
            backgroundUrlBack: bgBack,
            canvasSize: parsed.canvasSize,
            selectedElementId: null,
            past: [],
            future: [],
          });
        }
      } catch (e) {
        console.error('Failed to parse JSON', e);
      }
    },

    setActiveTemplate: (id, name) => set({ activeTemplateId: id, activeTemplateName: name }),
  };
});
