import { c as createStore } from './index-28d0c3f6.js';

/**
 * State Manager
 * ==============
 *
 * Centralized reactive state management for the grid builder using StencilJS Store.
 * Manages grid items, canvases, layouts, selection state, and viewport configuration
 * with automatic component re-renders on state changes.
 *
 * ## Problem
 *
 * Complex interactive applications need:
 * - Centralized state accessible across all components
 * - Automatic UI updates when state changes
 * - Type-safe state mutations
 * - Undo/redo support (requires state snapshots)
 * - Desktop + mobile layout management
 * - Selection tracking across multiple canvases
 *
 * Without centralized state:
 * - Props drilling through component hierarchies
 * - Manual event subscriptions and cleanup
 * - Synchronization issues between components
 * - Difficult undo/redo implementation
 *
 * ## Solution
 *
 * Use @stencil/store for reactive state management with:
 * 1. **Single source of truth**: All state in one store
 * 2. **Automatic reactivity**: Components re-render on state changes
 * 3. **Type safety**: Full TypeScript support
 * 4. **Simple API**: Direct property access (no actions/reducers)
 * 5. **Lightweight**: ~1KB, built into StencilJS
 *
 * ## Architecture Decisions
 *
 * ### Why @stencil/store vs Redux/Zustand?
 *
 * **@stencil/store chosen because**:
 * - ✅ Native StencilJS integration (zero setup)
 * - ✅ Automatic component subscriptions (no manual connect/subscribe)
 * - ✅ Simple mutation API (direct property assignment)
 * - ✅ Tiny bundle size (~1KB)
 * - ✅ Full TypeScript support
 * - ✅ Perfect for component-scoped state
 *
 * **Redux would add**:
 * - ❌ Boilerplate (actions, reducers, dispatch)
 * - ❌ Bundle size (~15KB min)
 * - ❌ Learning curve (middleware, selectors)
 * - ❌ Manual component subscriptions
 *
 * **Zustand would work but**:
 * - ⚠️ External dependency (not StencilJS native)
 * - ⚠️ Manual subscriptions in StencilJS
 * - ⚠️ Less TypeScript integration
 *
 * ### Dual Layout System (Desktop + Mobile)
 *
 * Each grid item has TWO layout configurations:
 *
 * **Desktop Layout** (always present):
 * - Primary layout with full positioning data
 * - x, y, width, height in grid units
 * - Never null, always has values
 *
 * **Mobile Layout** (optional/auto-generated):
 * - x, y, width, height can be null
 * - `customized: false` → auto-generated from desktop layout
 * - `customized: true` → user manually positioned in mobile view
 *
 * **Why dual layouts**:
 * - Different screen sizes need different layouts
 * - Mobile can auto-adapt OR be manually customized
 * - Single item definition works across viewports
 *
 * **Auto-generation strategy**:
 * ```typescript
 * // When mobile layout is null (not customized):
 * // - Full width items (span entire mobile viewport)
 * // - Stacked vertically
 * // - Responsive heights
 *
 * // When mobile.customized = true:
 * // - Use explicit mobile.x, mobile.y, mobile.width, mobile.height
 * // - Ignore desktop layout
 * ```
 *
 * ### State Mutation Pattern
 *
 * **Immutable spread pattern** for reactivity:
 * ```typescript
 * // ❌ Wrong: Direct mutation doesn't trigger updates
 * canvas.items.push(newItem);
 *
 * // ✅ Correct: Spread triggers reactivity
 * canvas.items.push(newItem);
 * state.canvases = { ...state.canvases };
 * ```
 *
 * **Why this pattern**:
 * - StencilJS store detects reference changes
 * - Object spread creates new reference
 * - Components automatically re-render
 * - Simple and performant
 *
 * ### Z-Index Management
 *
 * **Per-canvas z-index tracking**:
 * - Each canvas has `zIndexCounter` (monotonically increasing)
 * - New items get `zIndexCounter++`
 * - Ensures unique z-index per canvas
 * - Higher z-index = rendered on top
 *
 * **Why per-canvas**:
 * - Items in different canvases don't overlap
 * - Simplifies z-index calculations
 * - Prevents z-index conflicts
 * - Independent stacking contexts
 *
 * **Bringing to front**:
 * ```typescript
 * item.zIndex = canvas.zIndexCounter++;
 * state.canvases = { ...state.canvases }; // Trigger update
 * ```
 *
 * ## State Structure
 *
 * ```typescript
 * {
 *   canvases: {
 *     'canvas1': {
 *       items: [GridItem, GridItem, ...],
 *       zIndexCounter: 5,
 *       backgroundColor: '#ffffff'
 *     },
 *     'canvas2': { ... },
 *     ...
 *   },
 *   selectedItemId: 'item-3' | null,
 *   selectedCanvasId: 'canvas1' | null,
 *   currentViewport: 'desktop' | 'mobile',
 *   showGrid: true | false
 * }
 * ```
 *
 * ## Performance Characteristics
 *
 * **State access**: O(1) - direct property access
 * **State updates**: O(n) - spread operation copies references
 * **Component re-renders**: Only components consuming changed state
 * **Memory**: Lightweight (~1KB store + actual state data)
 *
 * **Optimization**: Immutable updates only copy top-level references,
 * not deep clones. Child objects remain same reference if unchanged.
 *
 * ## Integration with Undo/Redo
 *
 * State structure supports undo/redo via snapshots:
 * ```typescript
 * // Save snapshot
 * const snapshot = JSON.parse(JSON.stringify(state.canvases));
 *
 * // Restore snapshot
 * state.canvases = JSON.parse(JSON.stringify(snapshot));
 * ```
 *
 * Deep cloning required because:
 * - Prevents mutations from affecting history
 * - Ensures independent state snapshots
 * - Simple and reliable (no ref tracking)
 *
 * ## Extracting This Pattern
 *
 * To adapt for other frameworks:
 *
 * **React + Zustand**:
 * ```typescript
 * import create from 'zustand';
 *
 * const useStore = create<GridState>((set) => ({
 *   ...initialState,
 *   addItem: (canvasId, item) => set((state) => ({
 *     canvases: {
 *       ...state.canvases,
 *       [canvasId]: {
 *         ...state.canvases[canvasId],
 *         items: [...state.canvases[canvasId].items, item]
 *       }
 *     }
 *   }))
 * }));
 * ```
 *
 * **Vue + Pinia**:
 * ```typescript
 * import { defineStore } from 'pinia';
 *
 * export const useGridStore = defineStore('grid', {
 *   state: () => initialState,
 *   actions: {
 *     addItem(canvasId, item) {
 *       this.canvases[canvasId].items.push(item);
 *     }
 *   }
 * });
 * ```
 *
 * **Angular + NgRx**:
 * ```typescript
 * export const addItem = createAction(
 *   '[Grid] Add Item',
 *   props<{ canvasId: string; item: GridItem }>()
 * );
 *
 * export const gridReducer = createReducer(
 *   initialState,
 *   on(addItem, (state, { canvasId, item }) => ({
 *     ...state,
 *     canvases: {
 *       ...state.canvases,
 *       [canvasId]: {
 *         ...state.canvases[canvasId],
 *         items: [...state.canvases[canvasId].items, item]
 *       }
 *     }
 *   }))
 * );
 * ```
 *
 * @module state-manager
 */
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

//# sourceMappingURL=state-manager-9d34a2f0.js.map