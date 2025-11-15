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
 * Initial State with prepopulated demo items
 */
const initialState: GridState = {
  canvases: {
    canvas1: {
      items: [
        // Hero section demo items
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Header',
          layouts: {
            desktop: { x: 2, y: 2, width: 20, height: 6 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 1,
        },
        {
          id: 'item-2',
          canvasId: 'canvas1',
          type: 'text',
          name: 'Text',
          layouts: {
            desktop: { x: 2, y: 9, width: 20, height: 5 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 2,
        },
        {
          id: 'item-3',
          canvasId: 'canvas1',
          type: 'button',
          name: 'Button',
          layouts: {
            desktop: { x: 2, y: 15, width: 9, height: 4 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 3,
        },
        {
          id: 'item-4',
          canvasId: 'canvas1',
          type: 'image',
          name: 'Image',
          layouts: {
            desktop: { x: 23, y: 2, width: 15, height: 12 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 4,
        },
      ],
      zIndexCounter: 5,
      backgroundColor: '#ffffff',
    },
    canvas2: {
      items: [
        // Content section demo items
        {
          id: 'item-5',
          canvasId: 'canvas2',
          type: 'header',
          name: 'Header',
          layouts: {
            desktop: { x: 2, y: 2, width: 18, height: 4 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 1,
        },
        {
          id: 'item-6',
          canvasId: 'canvas2',
          type: 'text',
          name: 'Text',
          layouts: {
            desktop: { x: 2, y: 7, width: 18, height: 8 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 2,
        },
        {
          id: 'item-7',
          canvasId: 'canvas2',
          type: 'video',
          name: 'Video',
          layouts: {
            desktop: { x: 21, y: 2, width: 17, height: 13 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 3,
        },
      ],
      zIndexCounter: 4,
      backgroundColor: '#f5f5f5',
    },
    canvas3: {
      items: [
        // Footer section demo items
        {
          id: 'item-8',
          canvasId: 'canvas3',
          type: 'text',
          name: 'Text',
          layouts: {
            desktop: { x: 2, y: 2, width: 15, height: 5 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 1,
        },
        {
          id: 'item-9',
          canvasId: 'canvas3',
          type: 'button',
          name: 'Button',
          layouts: {
            desktop: { x: 18, y: 2, width: 8, height: 4 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 2,
        },
        {
          id: 'item-10',
          canvasId: 'canvas3',
          type: 'button',
          name: 'Button',
          layouts: {
            desktop: { x: 27, y: 2, width: 8, height: 4 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 3,
        },
      ],
      zIndexCounter: 4,
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

// Wrap reset to also reset the ID counter and restore initial state
export function reset() {
  itemIdCounter = 10; // Reset to 10 to account for prepopulated items

  // Restore initial state with prepopulated items
  state.canvases = JSON.parse(JSON.stringify(initialState.canvases));
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
let itemIdCounter = 10; // Start at 10 to account for prepopulated items (item-1 through item-10)
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
