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
 * ========================
 *
 * StencilJS store instance providing reactive state management.
 *
 * **Exports**:
 * - `state`: Reactive state proxy (mutate to trigger updates)
 * - `onChange`: Subscribe to state changes
 * - `dispose`: Cleanup subscriptions (typically not needed)
 *
 * **Usage in components**:
 * ```typescript
 * import { gridState } from './state-manager';
 *
 * // Component automatically re-renders when state changes
 * render() {
 *   const items = gridState.canvases['canvas1'].items;
 *   return items.map(item => <div>{item.name}</div>);
 * }
 * ```
 */
const { state, onChange, dispose } = createStore(initialState);
/**
 * Reset state to initial demo configuration
 *
 * **When to call**:
 * - User clicks "Reset" button
 * - Starting fresh demo
 * - Test cleanup (afterEach hooks)
 *
 * **What it resets**:
 * - Restores all 3 demo canvases with original items
 * - Clears selection state
 * - Resets viewport to desktop
 * - Shows grid
 * - Resets item ID counter to 10
 *
 * **Deep clone pattern**:
 * Uses `JSON.parse(JSON.stringify())` to create independent copy
 * of initial state. Prevents mutations from affecting initialState.
 *
 * **Why reset ID counter to 10**:
 * Initial state has items 1-10 prepopulated. Starting at 10 ensures
 * new items get IDs 11, 12, 13... without conflicts.
 *
 * @example
 * ```typescript
 * // Reset button handler
 * handleReset() {
 *   if (confirm('Reset to initial state?')) {
 *     reset();
 *     console.log('State reset to demo configuration');
 *   }
 * }
 * ```
 */
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
 * ================
 *
 * CRUD operations for managing grid items and canvases.
 * All mutations use spread pattern to trigger reactivity.
 */
/**
 * Add item to canvas
 *
 * **Use cases**:
 * - Dropping component from palette
 * - Undo delete operation
 * - Duplicating existing item
 * - Programmatic item creation
 *
 * **Reactivity pattern**:
 * 1. Push item to canvas.items array
 * 2. Spread canvases object to trigger update
 * 3. Components automatically re-render
 *
 * **Z-index assignment**:
 * Item should have `zIndex: canvas.zIndexCounter++` before calling.
 * This function doesn't assign z-index automatically.
 *
 * **Safety**: No-op if canvas doesn't exist
 *
 * @param canvasId - Target canvas ID
 * @param item - GridItem to add (should have zIndex assigned)
 *
 * @example
 * ```typescript
 * // Add new item from palette drop
 * const newItem: GridItem = {
 *   id: generateItemId(),
 *   canvasId: 'canvas1',
 *   type: 'header',
 *   name: 'Header',
 *   layouts: {
 *     desktop: { x: 5, y: 5, width: 20, height: 8 },
 *     mobile: { x: null, y: null, width: null, height: null, customized: false }
 *   },
 *   zIndex: gridState.canvases['canvas1'].zIndexCounter++
 * };
 * addItemToCanvas('canvas1', newItem);
 * ```
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
 *
 * **Use cases**:
 * - User deletes item (Delete key or button)
 * - Undo add operation
 * - Clearing canvas
 *
 * **Filter pattern**:
 * Creates new array without the item, preserving array order.
 * Reassignment triggers reactivity.
 *
 * **Index preservation**:
 * Array order maintained for z-index rendering.
 * Other items' indexes shift down by 1.
 *
 * **Safety**: No-op if canvas or item doesn't exist
 *
 * @param canvasId - Canvas containing the item
 * @param itemId - Item ID to remove
 *
 * @example
 * ```typescript
 * // Delete selected item
 * if (gridState.selectedItemId && gridState.selectedCanvasId) {
 *   removeItemFromCanvas(
 *     gridState.selectedCanvasId,
 *     gridState.selectedItemId
 *   );
 *   deselectItem(); // Clear selection
 * }
 * ```
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
 * Update item properties in canvas
 *
 * **Use cases**:
 * - After drag operation (update position)
 * - After resize operation (update dimensions)
 * - Changing item name or type
 * - Bringing item to front (update zIndex)
 *
 * **Partial updates**:
 * Uses `Partial<GridItem>` to allow updating subset of properties.
 * Object.assign merges updates into existing item.
 *
 * **Typical update patterns**:
 * ```typescript
 * // Update position after drag
 * updateItem(canvasId, itemId, {
 *   layouts: { ...item.layouts, desktop: { x: 10, y: 5, width: 20, height: 8 } }
 * });
 *
 * // Bring to front
 * updateItem(canvasId, itemId, {
 *   zIndex: gridState.canvases[canvasId].zIndexCounter++
 * });
 * ```
 *
 * **Safety**: No-op if canvas or item doesn't exist
 *
 * @param canvasId - Canvas containing the item
 * @param itemId - Item ID to update
 * @param updates - Partial GridItem with properties to update
 *
 * @example
 * ```typescript
 * // After drag end
 * const item = getItem('canvas1', 'item-3');
 * if (item) {
 *   item.layouts.desktop.x = newX;
 *   item.layouts.desktop.y = newY;
 *   updateItem('canvas1', 'item-3', item);
 * }
 * ```
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
 *
 * **Use cases**:
 * - Reading item data before update
 * - Validation checks
 * - Getting item for undo/redo snapshots
 * - Checking if item exists
 *
 * **Read-only**: Returns reference to item in state.
 * To modify, use `updateItem()` to trigger reactivity.
 *
 * **Safety**: Returns null if canvas or item doesn't exist
 *
 * @param canvasId - Canvas containing the item
 * @param itemId - Item ID to retrieve
 * @returns GridItem or null if not found
 *
 * @example
 * ```typescript
 * // Check item before operation
 * const item = getItem('canvas1', 'item-3');
 * if (item) {
 *   console.log(`Item at (${item.layouts.desktop.x}, ${item.layouts.desktop.y})`);
 * }
 *
 * // Create snapshot for undo
 * const snapshot = JSON.parse(JSON.stringify(getItem(canvasId, itemId)));
 * ```
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
 *
 * **Use cases**:
 * - Dragging item across canvas boundaries
 * - Reorganizing multi-section layouts
 * - Undo move operation
 *
 * **Operation flow**:
 * 1. Find item in source canvas
 * 2. Remove from source canvas items array
 * 3. Update item's canvasId property
 * 4. Add to destination canvas items array
 * 5. Trigger reactivity with spread
 *
 * **Important**: Item keeps its existing zIndex.
 * May want to update with destination canvas's zIndexCounter.
 *
 * **Position handling**:
 * Item keeps its grid coordinates. Caller should validate/adjust
 * position fits within destination canvas bounds.
 *
 * **Safety**: No-op if either canvas doesn't exist or item not found
 *
 * @param fromCanvasId - Source canvas ID
 * @param toCanvasId - Destination canvas ID
 * @param itemId - Item to move
 *
 * @example
 * ```typescript
 * // Move item on cross-canvas drag
 * handleDragEnd(event) {
 *   const targetCanvasId = event.dropTarget.id;
 *   if (targetCanvasId !== item.canvasId) {
 *     moveItemToCanvas(item.canvasId, targetCanvasId, item.id);
 *
 *     // Optionally update z-index for new canvas
 *     const canvas = gridState.canvases[targetCanvasId];
 *     updateItem(targetCanvasId, item.id, {
 *       zIndex: canvas.zIndexCounter++
 *     });
 *   }
 * }
 * ```
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
 * ID counter for generating unique item IDs
 *
 * **Starts at 10**: Initial state has items 1-10 prepopulated
 * **Increments**: Each call to generateItemId() returns next ID
 * **Format**: 'item-N' where N is the counter value
 */
let itemIdCounter = 10; // Start at 10 to account for prepopulated items (item-1 through item-10)
/**
 * Generate unique item ID
 *
 * **Use cases**:
 * - Creating new item from palette drop
 * - Duplicating existing item
 * - Any programmatic item creation
 *
 * **Uniqueness guarantee**:
 * Monotonically increasing counter ensures no collisions.
 * Even after delete, IDs never reused.
 *
 * **Format**: Returns 'item-N' (e.g., 'item-11', 'item-12')
 *
 * **Thread safety**: Not thread-safe, but not an issue in
 * single-threaded JavaScript environment.
 *
 * @returns Unique item ID string
 *
 * @example
 * ```typescript
 * // Create new item from palette drop
 * const newItem: GridItem = {
 *   id: generateItemId(), // 'item-11'
 *   canvasId: 'canvas1',
 *   type: 'button',
 *   name: 'Button',
 *   layouts: { ... },
 *   zIndex: gridState.canvases['canvas1'].zIndexCounter++
 * };
 * ```
 */
function generateItemId() {
    return `item-${++itemIdCounter}`;
}
/**
 * Select item and set active canvas
 *
 * **Use cases**:
 * - User clicks item
 * - After creating new item (auto-select)
 * - Keyboard navigation
 *
 * **Visual effects**:
 * - Selected item gets visual highlight (via CSS)
 * - Resize/drag handles appear
 * - Item can be deleted with Delete key
 *
 * **State changes**:
 * - `selectedItemId` = itemId
 * - `selectedCanvasId` = canvasId
 * - Components re-render with selection styles
 *
 * **Single selection**: Selecting new item automatically deselects previous
 *
 * @param itemId - Item to select
 * @param canvasId - Canvas containing the item
 *
 * @example
 * ```typescript
 * // Handle item click
 * handleItemClick(item: GridItem) {
 *   selectItem(item.id, item.canvasId);
 * }
 *
 * // Auto-select after creating item
 * const newItem = createNewItem();
 * addItemToCanvas('canvas1', newItem);
 * selectItem(newItem.id, 'canvas1');
 * ```
 */
function selectItem(itemId, canvasId) {
    state.selectedItemId = itemId;
    state.selectedCanvasId = canvasId;
}
/**
 * Deselect currently selected item
 *
 * **Use cases**:
 * - User clicks canvas background
 * - After deleting selected item
 * - Escape key pressed
 * - Starting drag operation
 *
 * **Visual effects**:
 * - Selection highlight removed
 * - Resize/drag handles hidden
 * - Item no longer delete-able with Delete key
 *
 * **State changes**:
 * - `selectedItemId` = null
 * - `selectedCanvasId` = null
 * - Components re-render without selection styles
 *
 * **Safety**: Safe to call even if nothing selected
 *
 * @example
 * ```typescript
 * // Handle canvas click (deselect)
 * handleCanvasClick(event) {
 *   if (event.target === canvasElement) {
 *     deselectItem();
 *   }
 * }
 *
 * // After deleting item
 * removeItemFromCanvas(canvasId, itemId);
 * deselectItem();
 * ```
 */
function deselectItem() {
    state.selectedItemId = null;
    state.selectedCanvasId = null;
}

export { addItemToCanvas as a, generateItemId as g, onChange as o, removeItemFromCanvas as r, state as s };

//# sourceMappingURL=state-manager-b0e7f282.js.map