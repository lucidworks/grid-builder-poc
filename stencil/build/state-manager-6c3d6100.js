import { c as createStore } from './index-28d0c3f6.js';

/**
 * Initial State with prepopulated demo items
 */
const initialState = {
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
const { state, onChange, dispose } = createStore(initialState);
// Wrap reset to also reset the ID counter and restore initial state
function reset() {
    itemIdCounter = 10; // Reset to 10 to account for prepopulated items
    // Restore initial state with prepopulated items
    state.canvases = JSON.parse(JSON.stringify(initialState.canvases));
    state.selectedItemId = null;
    state.selectedCanvasId = null;
    state.currentViewport = 'desktop';
    state.showGrid = true;
}
/**
 * Helper Functions
 */
/**
 * Add item to canvas
 */
function addItemToCanvas(canvasId, item) {
    const canvas = state.canvases[canvasId];
    if (!canvas) {
        return;
    }
    canvas.items.push(item);
    state.canvases = Object.assign({}, state.canvases); // Trigger update
}
/**
 * Remove item from canvas
 */
function removeItemFromCanvas(canvasId, itemId) {
    const canvas = state.canvases[canvasId];
    if (!canvas) {
        return;
    }
    canvas.items = canvas.items.filter((item) => item.id !== itemId);
    state.canvases = Object.assign({}, state.canvases); // Trigger update
}
/**
 * Update item in canvas
 */
function updateItem(canvasId, itemId, updates) {
    const canvas = state.canvases[canvasId];
    if (!canvas) {
        return;
    }
    const item = canvas.items.find((i) => i.id === itemId);
    if (!item) {
        return;
    }
    Object.assign(item, updates);
    state.canvases = Object.assign({}, state.canvases); // Trigger update
}
/**
 * Get item by ID
 */
function getItem(canvasId, itemId) {
    const canvas = state.canvases[canvasId];
    if (!canvas) {
        return null;
    }
    return canvas.items.find((i) => i.id === itemId) || null;
}
/**
 * Move item to different canvas
 */
function moveItemToCanvas(fromCanvasId, toCanvasId, itemId) {
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
    state.canvases = Object.assign({}, state.canvases); // Trigger update
}
/**
 * Generate unique item ID
 */
let itemIdCounter = 10; // Start at 10 to account for prepopulated items (item-1 through item-10)
function generateItemId() {
    return `item-${++itemIdCounter}`;
}
/**
 * Select item
 */
function selectItem(itemId, canvasId) {
    state.selectedItemId = itemId;
    state.selectedCanvasId = canvasId;
}
/**
 * Deselect item
 */
function deselectItem() {
    state.selectedItemId = null;
    state.selectedCanvasId = null;
}

export { addItemToCanvas as a, generateItemId as g, onChange as o, removeItemFromCanvas as r, state as s };

//# sourceMappingURL=state-manager-6c3d6100.js.map