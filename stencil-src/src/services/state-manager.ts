import { createStore } from '@stencil/store';

/**
 * Grid Item Interface
 */
export interface GridItem {
  id: string;
  canvasId: string;
  type: string;
  name: string;
  layouts: {
    desktop: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    mobile: {
      x: number | null;
      y: number | null;
      width: number | null;
      height: number | null;
      customized: boolean;
    };
  };
  zIndex: number;
}

/**
 * Canvas Interface
 */
export interface Canvas {
  items: GridItem[];
  zIndexCounter: number;
  backgroundColor: string;
}

/**
 * Grid State Interface
 */
export interface GridState {
  canvases: Record<string, Canvas>;
  selectedItemId: string | null;
  selectedCanvasId: string | null;
  currentViewport: 'desktop' | 'mobile';
  showGrid: boolean;
}

/**
 * Initial State
 */
const initialState: GridState = {
  canvases: {
    canvas1: {
      items: [],
      zIndexCounter: 1,
      backgroundColor: '#ffffff',
    },
    canvas2: {
      items: [],
      zIndexCounter: 1,
      backgroundColor: '#f5f5f5',
    },
    canvas3: {
      items: [],
      zIndexCounter: 1,
      backgroundColor: '#ffffff',
    },
  },
  selectedItemId: null,
  selectedCanvasId: null,
  currentViewport: 'desktop',
  showGrid: true,
};

/**
 * Global Grid State Store
 */
const { state, onChange, dispose } = createStore<GridState>(initialState);

// Wrap reset to also reset the ID counter and properly clear arrays
export function reset() {
  itemIdCounter = 0;

  // Manually reset state to ensure arrays are properly cleared
  state.canvases = {
    canvas1: {
      items: [],
      zIndexCounter: 1,
      backgroundColor: '#ffffff',
    },
    canvas2: {
      items: [],
      zIndexCounter: 1,
      backgroundColor: '#f5f5f5',
    },
    canvas3: {
      items: [],
      zIndexCounter: 1,
      backgroundColor: '#ffffff',
    },
  };
  state.selectedItemId = null;
  state.selectedCanvasId = null;
  state.currentViewport = 'desktop';
  state.showGrid = true;
}

export { state as gridState, onChange, dispose };

/**
 * Helper Functions
 */

/**
 * Add item to canvas
 */
export function addItemToCanvas(canvasId: string, item: GridItem) {
  const canvas = state.canvases[canvasId];
  if (!canvas) {
    return;
  }

  canvas.items.push(item);
  state.canvases = { ...state.canvases }; // Trigger update
}

/**
 * Remove item from canvas
 */
export function removeItemFromCanvas(canvasId: string, itemId: string) {
  const canvas = state.canvases[canvasId];
  if (!canvas) {
    return;
  }

  canvas.items = canvas.items.filter((item) => item.id !== itemId);
  state.canvases = { ...state.canvases }; // Trigger update
}

/**
 * Update item in canvas
 */
export function updateItem(canvasId: string, itemId: string, updates: Partial<GridItem>) {
  const canvas = state.canvases[canvasId];
  if (!canvas) {
    return;
  }

  const item = canvas.items.find((i) => i.id === itemId);
  if (!item) {
    return;
  }

  Object.assign(item, updates);
  state.canvases = { ...state.canvases }; // Trigger update
}

/**
 * Get item by ID
 */
export function getItem(canvasId: string, itemId: string): GridItem | null {
  const canvas = state.canvases[canvasId];
  if (!canvas) {
    return null;
  }

  return canvas.items.find((i) => i.id === itemId) || null;
}

/**
 * Move item to different canvas
 */
export function moveItemToCanvas(fromCanvasId: string, toCanvasId: string, itemId: string) {
  const fromCanvas = state.canvases[fromCanvasId];
  const toCanvas = state.canvases[toCanvasId];

  if (!fromCanvas || !toCanvas) {
    return;
  }

  const item = fromCanvas.items.find((i) => i.id === itemId);
  if (!item) {
    return;
  }

  // Remove from old canvas
  fromCanvas.items = fromCanvas.items.filter((i) => i.id !== itemId);

  // Update item's canvasId
  item.canvasId = toCanvasId;

  // Add to new canvas
  toCanvas.items.push(item);

  state.canvases = { ...state.canvases }; // Trigger update
}

/**
 * Generate unique item ID
 */
let itemIdCounter = 0;
export function generateItemId(): string {
  return `item-${++itemIdCounter}`;
}

/**
 * Select item
 */
export function selectItem(itemId: string, canvasId: string) {
  state.selectedItemId = itemId;
  state.selectedCanvasId = canvasId;
}

/**
 * Deselect item
 */
export function deselectItem() {
  state.selectedItemId = null;
  state.selectedCanvasId = null;
}
