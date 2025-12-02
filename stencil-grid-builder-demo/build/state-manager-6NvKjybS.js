import { c as createDebugLogger, a as createStore } from './debug-BAq8PPFJ.js';

/**
 * Input Validation Utilities
 * ===========================
 *
 * Validates grid item data structure and bounds to prevent corrupt state.
 * Used for defensive programming in state-manager operations.
 *
 * ## Design Philosophy
 *
 * **Non-blocking validation**:
 * - All validation functions return results with warnings
 * - State operations proceed even if validation fails
 * - Warnings logged via debug utility (dev-only, tree-shaken in production)
 *
 * **What validation protects against**:
 * - State corruption (invalid layouts causing render errors)
 * - Layout integrity violations (out-of-bounds positions)
 * - Data persistence issues (malformed items in export)
 * - Undo/redo stack corruption (invalid snapshots)
 *
 * **What validation does NOT protect against**:
 * - XSS attacks (handled by API documentation in ComponentDefinition)
 * - Authentication/authorization (not library's responsibility)
 * - Network attacks (library is client-side only)
 *
 * ## Validation Rules
 *
 * **Desktop Layout**:
 * - x ≥ 0 (left boundary)
 * - y ≥ 0 (top boundary)
 * - width: 1-50 units (2%-100% of canvas)
 * - height: 1-100 units (20px-2000px typically)
 *
 * **Mobile Layout**:
 * - Same bounds as desktop if values present
 * - May be auto-generated (customized: false)
 *
 * **Item Properties**:
 * - id: non-empty string
 * - canvasId: non-empty string
 * - type: non-empty string
 * - zIndex: finite number
 *
 * @module validation
 */
/**
 * Grid layout bounds configuration
 */
const LAYOUT_BOUNDS = {
    x: { min: 0, max: Infinity },
    y: { min: 0, max: Infinity },
    width: { min: 1, max: 50 }, // 50 units = 100% canvas width
    height: { min: 1, max: 100 }, // Reasonable maximum height
};
/**
 * Validate a single layout object (desktop or mobile)
 *
 * **Checks**:
 * - All required properties present (x, y, width, height)
 * - All values are finite numbers
 * - Values within valid bounds
 *
 * @param layout - Layout object to validate
 * @param layoutType - 'desktop' or 'mobile' (for error messages)
 * @returns ValidationResult with errors if any
 */
function validateLayout(layout, layoutType) {
    const errors = [];
    // Check required properties
    if (!layout) {
        errors.push(`${layoutType} layout is missing or undefined`);
        return { valid: false, errors };
    }
    // Check numeric properties
    const numericProps = ["x", "y", "width", "height"];
    for (const prop of numericProps) {
        if (typeof layout[prop] !== "number" || !Number.isFinite(layout[prop])) {
            errors.push(`${layoutType} layout.${prop} must be a finite number, got: ${layout[prop]}`);
        }
    }
    // Check bounds
    if (Number.isFinite(layout.x) && layout.x < LAYOUT_BOUNDS.x.min) {
        errors.push(`${layoutType} layout.x must be >= ${LAYOUT_BOUNDS.x.min}, got: ${layout.x}`);
    }
    if (Number.isFinite(layout.y) && layout.y < LAYOUT_BOUNDS.y.min) {
        errors.push(`${layoutType} layout.y must be >= ${LAYOUT_BOUNDS.y.min}, got: ${layout.y}`);
    }
    if (Number.isFinite(layout.width) &&
        (layout.width < LAYOUT_BOUNDS.width.min ||
            layout.width > LAYOUT_BOUNDS.width.max)) {
        errors.push(`${layoutType} layout.width must be between ${LAYOUT_BOUNDS.width.min}-${LAYOUT_BOUNDS.width.max}, got: ${layout.width}`);
    }
    if (Number.isFinite(layout.height) &&
        (layout.height < LAYOUT_BOUNDS.height.min ||
            layout.height > LAYOUT_BOUNDS.height.max)) {
        errors.push(`${layoutType} layout.height must be between ${LAYOUT_BOUNDS.height.min}-${LAYOUT_BOUNDS.height.max}, got: ${layout.height}`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validate a complete grid item structure
 *
 * **Checks**:
 * - Required properties: id, canvasId, type, zIndex, layouts
 * - String properties are non-empty
 * - zIndex is finite number
 * - Desktop layout is valid
 * - Mobile layout is valid (if present)
 *
 * **Usage**:
 * ```typescript
 * const result = validateGridItem(item);
 * if (!result.valid) {
 *   debug.warn('Invalid item:', { itemId: item.id, errors: result.errors });
 * }
 * ```
 *
 * @param item - Grid item to validate
 * @returns ValidationResult with errors if any
 */
function validateGridItem(item) {
    const errors = [];
    // Check required properties exist
    if (!item) {
        errors.push("Item is null or undefined");
        return { valid: false, errors };
    }
    // Validate id
    if (typeof item.id !== "string" || item.id.trim() === "") {
        errors.push(`Item.id must be a non-empty string, got: ${item.id}`);
    }
    // Validate canvasId
    if (typeof item.canvasId !== "string" || item.canvasId.trim() === "") {
        errors.push(`Item.canvasId must be a non-empty string, got: ${item.canvasId}`);
    }
    // Validate type
    if (typeof item.type !== "string" || item.type.trim() === "") {
        errors.push(`Item.type must be a non-empty string, got: ${item.type}`);
    }
    // Validate zIndex
    if (typeof item.zIndex !== "number" || !Number.isFinite(item.zIndex)) {
        errors.push(`Item.zIndex must be a finite number, got: ${item.zIndex} (type: ${typeof item.zIndex})`);
    }
    // Validate layouts object
    if (!item.layouts || typeof item.layouts !== "object") {
        errors.push("Item.layouts must be an object");
        return { valid: false, errors };
    }
    // Validate desktop layout (required)
    const desktopResult = validateLayout(item.layouts.desktop, "desktop");
    if (!desktopResult.valid) {
        errors.push(...desktopResult.errors);
    }
    // Validate mobile layout (optional, but if present must be valid)
    if (item.layouts.mobile) {
        const mobileResult = validateLayout(item.layouts.mobile, "mobile");
        if (!mobileResult.valid) {
            errors.push(...mobileResult.errors);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validate item update object (partial updates)
 *
 * **Checks**:
 * - If layout updates present, validate layout structure
 * - If zIndex update present, validate it's a finite number
 * - If config update present, validate it's an object
 *
 * **Usage**:
 * ```typescript
 * const result = validateItemUpdates(updates);
 * if (!result.valid) {
 *   debug.warn('Invalid updates:', { itemId, errors: result.errors });
 * }
 * ```
 *
 * @param updates - Partial item updates to validate
 * @returns ValidationResult with errors if any
 */
function validateItemUpdates(updates) {
    const errors = [];
    if (!updates || typeof updates !== "object") {
        errors.push("Updates must be an object");
        return { valid: false, errors };
    }
    // Validate layouts if present
    if (updates.layouts) {
        if (typeof updates.layouts !== "object") {
            errors.push("Updates.layouts must be an object");
        }
        else {
            // Validate desktop layout if present
            if (updates.layouts.desktop) {
                const desktopResult = validateLayout(updates.layouts.desktop, "desktop");
                if (!desktopResult.valid) {
                    errors.push(...desktopResult.errors);
                }
            }
            // Validate mobile layout if present
            if (updates.layouts.mobile) {
                const mobileResult = validateLayout(updates.layouts.mobile, "mobile");
                if (!mobileResult.valid) {
                    errors.push(...mobileResult.errors);
                }
            }
        }
    }
    // Validate zIndex if present
    if ("zIndex" in updates &&
        (typeof updates.zIndex !== "number" || !Number.isFinite(updates.zIndex))) {
        errors.push(`Updates.zIndex must be a finite number, got: ${updates.zIndex}`);
    }
    // Validate config if present (must be object, but any shape is allowed)
    if ("config" in updates && typeof updates.config !== "object") {
        errors.push(`Updates.config must be an object, got: ${typeof updates.config}`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}

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
 * canvases: {
 * 'canvas1': {
 * items: [GridItem, GridItem, ...],
 * zIndexCounter: 5,
 * backgroundColor: '#ffffff'
 * },
 * 'canvas2': { ... },
 * ...
 * },
 * selectedItemId: 'item-3' | null,
 * selectedCanvasId: 'canvas1' | null,
 * currentViewport: 'desktop' | 'mobile',
 * showGrid: true | false
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
 * ...initialState,
 * addItem: (canvasId, item) => set((state) => ({
 * canvases: {
 * ...state.canvases,
 * [canvasId]: {
 * ...state.canvases[canvasId],
 * items: [...state.canvases[canvasId].items, item]
 * }
 * }
 * }))
 * }));
 * ```
 *
 * **Vue + Pinia**:
 * ```typescript
 * import { defineStore } from 'pinia';
 *
 * export const useGridStore = defineStore('grid', {
 * state: () => initialState,
 * actions: {
 * addItem(canvasId, item) {
 * this.canvases[canvasId].items.push(item);
 * }
 * }
 * });
 * ```
 *
 * **Angular + NgRx**:
 * ```typescript
 * export const addItem = createAction(
 * '[Grid] Add Item',
 * props<{ canvasId: string; item: GridItem }>()
 * );
 *
 * export const gridReducer = createReducer(
 * initialState,
 * on(addItem, (state, { canvasId, item }) => ({
 * ...state,
 * canvases: {
 * ...state.canvases,
 * [canvasId]: {
 * ...state.canvases[canvasId],
 * items: [...state.canvases[canvasId].items, item]
 * }
 * }
 * }))
 * );
 * ```
 * @module state-manager
 */
/**
 * Initial State Configuration
 * ============================
 *
 * Default empty state for new StateManager instances.
 * Library starts with NO canvases by default.
 *
 * **Why completely empty**:
 * - Prevents state pollution between instances
 * - Ensures each grid-builder instance starts fresh
 * - Avoids "Unknown component type" errors
 * - Each instance builds its own canvas structure
 */
const defaultInitialState = {
    canvases: {},
    selectedItemId: null,
    selectedCanvasId: null,
    activeCanvasId: null,
    currentViewport: "desktop",
    showGrid: true,
};
/**
 * Debug logger for validation warnings
 */
const debug = createDebugLogger("state-manager");
/**
 * StateManager Class
 * ==================
 *
 * Instance-based state management for grid builder.
 * Each grid-builder component can create its own StateManager instance.
 *
 * ## Architecture
 *
 * **Before (Singleton)**:
 * - Single global state shared by all grid-builder instances
 * - Multiple instances pollute each other's state
 * - Storybook stories contaminate each other
 *
 * **After (Instance-based)**:
 * - Each grid-builder creates its own StateManager
 * - Isolated state per instance
 * - Multiple grid-builders on same page work independently
 *
 * ## Usage
 *
 * **New code (instance-based)**:
 * ```typescript
 * // In grid-builder component
 * componentWillLoad() {
 *   this.stateManager = new StateManager();
 *   this.state = this.stateManager.state;
 * }
 * ```
 *
 * **Legacy code (backward compatible)**:
 * ```typescript
 * // Still works via singleton export
 * import { gridState } from './state-manager';
 * const items = gridState.canvases['canvas1'].items;
 * ```
 *
 * ## Instance State
 *
 * Each instance has:
 * - Independent reactive state (StencilJS store)
 * - Own item ID counter (no collision between instances)
 * - Own change listeners
 * - Own lifecycle (dispose() cleanup)
 */
class StateManager {
    /**
     * Create new StateManager instance
     *
     * @param initialState - Optional custom initial state (for import/restore)
     * @example
     * ```typescript
     * // Empty state (default)
     * const manager = new StateManager();
     *
     * // Restore from saved state
     * const savedState = JSON.parse(localStorage.getItem('grid-state'));
     * const manager = new StateManager(savedState);
     * ```
     */
    constructor(initialState) {
        /**
         * Item ID counter for generating unique IDs
         *
         * **Starts at 0**: Each instance has independent counter
         * **Increments**: Each generateItemId() call returns next ID
         * **Format**: 'item-N' where N is the counter value
         */
        this.itemIdCounter = 0;
        // Merge custom initial state with defaults
        const fullInitialState = Object.assign(Object.assign({}, defaultInitialState), initialState);
        // Create StencilJS reactive store
        const { state, onChange, dispose } = createStore(fullInitialState);
        this.state = state;
        this.onChange = onChange;
        this.dispose = dispose;
        // Store initial state for reset() (deep clone to prevent mutations)
        this.initialState = JSON.parse(JSON.stringify(fullInitialState));
    }
    /**
     * Reset state to initial empty configuration
     *
     * **When to call**:
     * - User clicks "Reset" button
     * - Starting fresh
     * - Test cleanup (afterEach hooks)
     *
     * **What it resets**:
     * - Clears all items from all canvases
     * - Resets z-index counters
     * - Clears selection state
     * - Resets viewport to desktop
     * - Shows grid
     * - Resets item ID counter to 0
     *
     * **Deep clone pattern**:
     * Uses `JSON.parse(JSON.stringify())` to create independent copy
     * of initial state. Prevents mutations from affecting initialState.
     * @example
     * ```typescript
     * // Reset button handler
     * handleReset() {
     *   if (confirm('Reset to initial state?')) {
     *     this.stateManager.reset();
     *     console.log('State reset to empty');
     *   }
     * }
     * ```
     */
    reset() {
        this.itemIdCounter = 0;
        // Restore initial state (deep clone to prevent mutations)
        this.state.canvases = JSON.parse(JSON.stringify(this.initialState.canvases));
        this.state.selectedItemId = this.initialState.selectedItemId;
        this.state.selectedCanvasId = this.initialState.selectedCanvasId;
        this.state.activeCanvasId = this.initialState.activeCanvasId;
        this.state.currentViewport = this.initialState.currentViewport;
        this.state.showGrid = this.initialState.showGrid;
    }
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
     * @param canvasId - Target canvas ID
     * @param item - GridItem to add (should have zIndex assigned)
     * @example
     * ```typescript
     * // Add new item from palette drop
     * const newItem: GridItem = {
     *   id: stateManager.generateItemId(),
     *   canvasId: 'canvas1',
     *   type: 'header',
     *   name: 'Header',
     *   layouts: {
     *     desktop: { x: 5, y: 5, width: 20, height: 8 },
     *     mobile: { x: null, y: null, width: null, height: null, customized: false }
     *   },
     *   zIndex: stateManager.state.canvases['canvas1'].zIndexCounter++
     * };
     * stateManager.addItemToCanvas('canvas1', newItem);
     * ```
     */
    addItemToCanvas(canvasId, item) {
        const canvas = this.state.canvases[canvasId];
        if (!canvas) {
            return;
        }
        // Validate item structure (dev-only, tree-shaken in production)
        const validation = validateGridItem(item);
        if (!validation.valid) {
            debug.warn("⚠️ [addItemToCanvas] with validation issues:", {
                itemId: item.id,
                canvasId,
                errors: validation.errors,
            });
        }
        canvas.items.push(item);
        this.state.canvases = Object.assign({}, this.state.canvases); // Trigger update
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
   * @param canvasId - Canvas containing the item
   * @param itemId - Item ID to remove
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
    removeItemFromCanvas(canvasId, itemId) {
        const canvas = this.state.canvases[canvasId];
        if (!canvas) {
            return;
        }
        canvas.items = canvas.items.filter((item) => item.id !== itemId);
        this.state.canvases = Object.assign({}, this.state.canvases); // Trigger update
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
     * layouts: { ...item.layouts, desktop: { x: 10, y: 5, width: 20, height: 8 } }
     * });
     *
     * // Bring to front
     * updateItem(canvasId, itemId, {
     * zIndex: gridState.canvases[canvasId].zIndexCounter++
     * });
     * ```
     *
     * **Safety**: No-op if canvas or item doesn't exist
     * @param canvasId - Canvas containing the item
     * @param itemId - Item ID to update
     * @param updates - Partial GridItem with properties to update
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
    updateItem(canvasId, itemId, updates) {
        const canvas = this.state.canvases[canvasId];
        if (!canvas) {
            return;
        }
        const item = canvas.items.find((i) => i.id === itemId);
        if (!item) {
            return;
        }
        // Validate updates (dev-only, tree-shaken in production)
        const validation = validateItemUpdates(updates);
        if (!validation.valid) {
            debug.warn("⚠️ [updateItem] with validation issues:", {
                itemId,
                canvasId,
                updates,
                errors: validation.errors,
            });
        }
        Object.assign(item, updates);
        this.state.canvases = Object.assign({}, this.state.canvases); // Trigger update
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
   * @param canvasId - Canvas containing the item
   * @param itemId - Item ID to retrieve
   * @returns GridItem or null if not found
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
    getItem(canvasId, itemId) {
        const canvas = this.state.canvases[canvasId];
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
   * @param fromCanvasId - Source canvas ID
   * @param toCanvasId - Destination canvas ID
   * @param itemId - Item to move
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
    moveItemToCanvas(fromCanvasId, toCanvasId, itemId) {
        const fromCanvas = this.state.canvases[fromCanvasId];
        const toCanvas = this.state.canvases[toCanvasId];
        if (!fromCanvas || !toCanvas) {
            return;
        }
        const item = fromCanvas.items.find((i) => i.id === itemId);
        if (!item) {
            return;
        }
        // Validate item before moving (dev-only, tree-shaken in production)
        const validation = validateGridItem(item);
        if (!validation.valid) {
            debug.warn("⚠️ [moveItemToCanvas] with validation issues:", {
                itemId,
                fromCanvasId,
                toCanvasId,
                errors: validation.errors,
            });
        }
        // Remove from old canvas
        fromCanvas.items = fromCanvas.items.filter((i) => i.id !== itemId);
        // Update item's canvasId
        item.canvasId = toCanvasId;
        // Add to new canvas
        toCanvas.items.push(item);
        this.state.canvases = Object.assign({}, this.state.canvases); // Trigger update
    }
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
     * @returns Unique item ID string
     * @example
     * ```typescript
     * // Create new item from palette drop
     * const newItem: GridItem = {
     *   id: stateManager.generateItemId(), // 'item-11'
     *   canvasId: 'canvas1',
     *   type: 'button',
     *   name: 'Button',
     *   layouts: { ... },
     *   zIndex: stateManager.state.canvases['canvas1'].zIndexCounter++
     * };
     * ```
     */
    generateItemId() {
        return `item-${++this.itemIdCounter}`;
    }
    /**
     * Set z-index for an item
     *
     * **Use cases**:
     * - Layer panel drag-to-reorder
     * - Bring to front / send to back operations
     * - Manual z-index adjustment
     *
     * **Operation flow**:
     * 1. Find item in canvas
     * 2. Store old z-index for undo/redo
     * 3. Update item's zIndex property
     * 4. Update canvas zIndexCounter if needed
     * 5. Trigger reactivity
     * 6. Return old/new values for undo/redo
     *
     * **Safety**: Returns null if canvas or item doesn't exist
     * @param canvasId - Canvas containing the item
     * @param itemId - Item ID to update
     * @param newZIndex - New z-index value
     * @returns Object with old and new z-index, or null if not found
     */
    setItemZIndex(canvasId, itemId, newZIndex) {
        const canvas = this.state.canvases[canvasId];
        if (!canvas) {
            return null;
        }
        const item = canvas.items.find((i) => i.id === itemId);
        if (!item) {
            return null;
        }
        const oldZIndex = item.zIndex;
        // Update z-index
        item.zIndex = newZIndex;
        // Update counter if needed (maintain monotonically increasing counter)
        if (newZIndex >= canvas.zIndexCounter) {
            canvas.zIndexCounter = newZIndex + 1;
        }
        // Trigger reactivity
        this.state.canvases = Object.assign({}, this.state.canvases);
        return { oldZIndex, newZIndex };
    }
    /**
     * Move item forward in z-index (one layer up)
     *
     * **Use cases**:
     * - Layer panel "move up" button
     * - Keyboard shortcut (e.g., Ctrl+Up)
     * - Context menu "Bring forward"
     *
     * **Operation**:
     * Finds next higher z-index and swaps with that item.
     * If already on top, does nothing.
     * @param canvasId - Canvas containing the item
     * @param itemId - Item ID to move forward
     * @returns Object with old and new z-index, or null if not found/already on top
     */
    moveItemForward(canvasId, itemId) {
        const canvas = this.state.canvases[canvasId];
        if (!canvas) {
            return null;
        }
        const item = canvas.items.find((i) => i.id === itemId);
        if (!item) {
            return null;
        }
        // Find next higher z-index
        const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedItems.findIndex((i) => i.id === itemId);
        // Already on top
        if (currentIndex === sortedItems.length - 1) {
            return null;
        }
        const nextItem = sortedItems[currentIndex + 1];
        const oldZIndex = item.zIndex;
        const newZIndex = nextItem.zIndex;
        // Swap z-index values
        item.zIndex = newZIndex;
        nextItem.zIndex = oldZIndex;
        // Trigger reactivity
        this.state.canvases = Object.assign({}, this.state.canvases);
        return { oldZIndex, newZIndex };
    }
    /**
     * Move item backward in z-index (one layer down)
     *
     * **Use cases**:
     * - Layer panel "move down" button
     * - Keyboard shortcut (e.g., Ctrl+Down)
     * - Context menu "Send backward"
     *
     * **Operation**:
     * Finds next lower z-index and swaps with that item.
     * If already on bottom, does nothing.
     * @param canvasId - Canvas containing the item
     * @param itemId - Item ID to move backward
     * @returns Object with old and new z-index, or null if not found/already on bottom
     */
    moveItemBackward(canvasId, itemId) {
        const canvas = this.state.canvases[canvasId];
        if (!canvas) {
            return null;
        }
        const item = canvas.items.find((i) => i.id === itemId);
        if (!item) {
            return null;
        }
        // Find next lower z-index
        const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedItems.findIndex((i) => i.id === itemId);
        // Already on bottom
        if (currentIndex === 0) {
            return null;
        }
        const prevItem = sortedItems[currentIndex - 1];
        const oldZIndex = item.zIndex;
        const newZIndex = prevItem.zIndex;
        // Swap z-index values
        item.zIndex = newZIndex;
        prevItem.zIndex = oldZIndex;
        // Trigger reactivity
        this.state.canvases = Object.assign({}, this.state.canvases);
        return { oldZIndex, newZIndex };
    }
    /**
     * Bring item to front (highest z-index)
     *
     * **Use cases**:
     * - Layer panel "bring to front" button
     * - Context menu "Bring to front"
     * - Double-click to bring to front
     *
     * **Operation**:
     * Sets z-index to highest value in canvas + 1
     * @param canvasId - Canvas containing the item
     * @param itemId - Item ID to bring to front
     * @returns Object with old and new z-index, or null if not found/already on top
     */
    bringItemToFront(canvasId, itemId) {
        const canvas = this.state.canvases[canvasId];
        if (!canvas) {
            return null;
        }
        const item = canvas.items.find((i) => i.id === itemId);
        if (!item) {
            return null;
        }
        const oldZIndex = item.zIndex;
        const maxZIndex = Math.max(...canvas.items.map((i) => i.zIndex));
        // Already on top
        if (oldZIndex === maxZIndex) {
            return null;
        }
        const newZIndex = canvas.zIndexCounter++;
        item.zIndex = newZIndex;
        // Trigger reactivity
        this.state.canvases = Object.assign({}, this.state.canvases);
        return { oldZIndex, newZIndex };
    }
    /**
     * Send item to back (lowest z-index)
     *
     * **Use cases**:
     * - Layer panel "send to back" button
     * - Context menu "Send to back"
     *
     * **Operation**:
     * Sets z-index to lowest value in canvas - 1
     * @param canvasId - Canvas containing the item
     * @param itemId - Item ID to send to back
     * @returns Object with old and new z-index, or null if not found/already on bottom
     */
    sendItemToBack(canvasId, itemId) {
        const canvas = this.state.canvases[canvasId];
        if (!canvas) {
            return null;
        }
        const item = canvas.items.find((i) => i.id === itemId);
        if (!item) {
            return null;
        }
        const oldZIndex = item.zIndex;
        const minZIndex = Math.min(...canvas.items.map((i) => i.zIndex));
        // Already on bottom
        if (oldZIndex === minZIndex) {
            return null;
        }
        const newZIndex = minZIndex - 1;
        item.zIndex = newZIndex;
        // Trigger reactivity
        this.state.canvases = Object.assign({}, this.state.canvases);
        return { oldZIndex, newZIndex };
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
     * @param itemId - Item to select
     * @param canvasId - Canvas containing the item
     */
    selectItem(itemId, canvasId) {
        this.state.selectedItemId = itemId;
        this.state.selectedCanvasId = canvasId;
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
     */
    deselectItem() {
        this.state.selectedItemId = null;
        this.state.selectedCanvasId = null;
    }
    /**
     * Set active canvas
     *
     * **Use cases**:
     * - User clicks item on canvas → activate that canvas
     * - User clicks canvas background → activate that canvas
     * - User starts dragging item → activate canvas containing item
     * - User starts resizing item → activate canvas containing item
     * - Programmatic canvas focus (e.g., after adding item)
     *
     * **Visual effects**:
     * - Canvas title opacity changes (consumer-controlled CSS)
     * - Canvas border/highlight applied
     * - Canvas-specific settings panel shown
     *
     * **State changes**:
     * - `activeCanvasId` = canvasId
     * - Components re-render with isActive prop
     * - 'canvasActivated' event emitted
     *
     * **Reactivity**: Direct assignment (no spread needed for primitive)
     * @param canvasId - Canvas ID to activate
     */
    setActiveCanvas(canvasId) {
        this.state.activeCanvasId = canvasId;
    }
    /**
     * Clear active canvas
     *
     * **Use cases**:
     * - Reset application state
     * - Close all panels
     * - Deactivate all canvases
     *
     * **Visual effects**:
     * - All canvas titles return to inactive state
     * - No canvas highlighted
     * - Canvas settings panel hidden
     *
     * **State changes**:
     * - `activeCanvasId` = null
     * - Components re-render without active state
     *
     * **Safety**: Safe to call even if no canvas active
     */
    clearActiveCanvas() {
        this.state.activeCanvasId = null;
    }
    /**
     * Add multiple items in a single batch
     *
     * **Performance benefit**: 1000 items added in ~10ms with single re-render
     * vs ~200-500ms with 1000 individual add calls and 1000 re-renders.
     *
     * **Use cases**:
     * - Stress testing (adding 100-1000 items)
     * - Template/preset loading (page templates with many components)
     * - Undo batch delete
     * - Import from saved layout
     *
     * **Reactivity pattern**:
     * 1. Clone canvases object
     * 2. Add all items to cloned canvases
     * 3. Single state assignment triggers single re-render
     * 4. Single undo/redo command for entire batch
     * @param items - Array of partial GridItem specs (missing id, zIndex auto-assigned)
     * @returns Array of created item IDs
     */
    addItemsBatch(items) {
        const itemIds = [];
        const updatedCanvases = Object.assign({}, this.state.canvases);
        for (const itemData of items) {
            const id = this.generateItemId();
            const canvasId = itemData.canvasId;
            const canvas = updatedCanvases[canvasId];
            if (!canvas) {
                console.warn(`Canvas ${canvasId} not found, skipping item`);
                continue;
            }
            const newItem = {
                id,
                canvasId,
                type: itemData.type || "unknown",
                name: itemData.name || "Unnamed",
                layouts: itemData.layouts || {
                    desktop: { x: 0, y: 0, width: 20, height: 10 },
                    mobile: {
                        x: null,
                        y: null,
                        width: null,
                        height: null,
                        customized: false,
                    },
                },
                zIndex: canvas.zIndexCounter++,
                config: itemData.config || {},
            };
            // Validate item before adding (dev-only, tree-shaken in production)
            const validation = validateGridItem(newItem);
            if (!validation.valid) {
                debug.warn("⚠️ [addItemsBatch] with validation issues:", {
                    itemId: id,
                    canvasId,
                    errors: validation.errors,
                });
            }
            canvas.items.push(newItem);
            itemIds.push(id);
        }
        // Single state update triggers single re-render
        this.state.canvases = updatedCanvases;
        return itemIds;
    }
    /**
     * Delete multiple items in a single batch
     *
     * **Performance benefit**: 1000 items deleted in ~5ms with single re-render
     * vs ~100-200ms with 1000 individual delete calls and 1000 re-renders.
     *
     * **Use cases**:
     * - Clear canvas (delete all)
     * - Delete selection group
     * - Undo batch add
     * - Cleanup operations
     *
     * **Reactivity pattern**:
     * 1. Clone canvases object
     * 2. Filter out all items from cloned canvases
     * 3. Single state assignment triggers single re-render
     * 4. Single undo/redo command for entire batch
     * @param itemIds - Array of item IDs to delete
     */
    deleteItemsBatch(itemIds) {
        const itemIdSet = new Set(itemIds);
        const updatedCanvases = Object.assign({}, this.state.canvases);
        // Filter out items from all canvases
        for (const canvasId in updatedCanvases) {
            updatedCanvases[canvasId] = Object.assign(Object.assign({}, updatedCanvases[canvasId]), { items: updatedCanvases[canvasId].items.filter((item) => !itemIdSet.has(item.id)) });
        }
        // Single state update triggers single re-render
        this.state.canvases = updatedCanvases;
    }
    /**
     * Update multiple item configs in a single batch
     *
     * **Performance benefit**: 1000 items updated in ~8ms with single re-render
     * vs ~150-300ms with 1000 individual update calls and 1000 re-renders.
     *
     * **Use cases**:
     * - Theme changes (update colors for all items)
     * - Bulk property changes
     * - Undo batch config change
     * - Template application
     *
     * **Reactivity pattern**:
     * 1. Clone canvases object
     * 2. Apply all updates to cloned canvases
     * 3. Single state assignment triggers single re-render
     * 4. Single undo/redo command for entire batch
     * @param updates - Array of { itemId, canvasId, updates } objects
     */
    updateItemsBatch(updates) {
        const updatedCanvases = Object.assign({}, this.state.canvases);
        for (const { itemId, canvasId, updates: itemUpdates } of updates) {
            const canvas = updatedCanvases[canvasId];
            if (!canvas) {
                console.warn(`Canvas ${canvasId} not found, skipping item ${itemId}`);
                continue;
            }
            const item = canvas.items.find((i) => i.id === itemId);
            if (!item) {
                console.warn(`Item ${itemId} not found in canvas ${canvasId}`);
                continue;
            }
            Object.assign(item, itemUpdates);
        }
        // Single state update triggers single re-render
        this.state.canvases = updatedCanvases;
    }
}
/**
 * Backward Compatibility Layer
 * ==============================
 *
 * Singleton instance and helper function exports for backward compatibility.
 */
// Create singleton instance (for backward compatibility only)
const defaultManager = new StateManager();
// Export singleton state (backward compatible)
const gridState = defaultManager.state;
const state = defaultManager.state; // Alternative export name
const onChange = defaultManager.onChange;
// Export singleton instance methods as standalone functions (backward compatible)
const reset = () => defaultManager.reset();
const addItemToCanvas = (canvasId, item) => defaultManager.addItemToCanvas(canvasId, item);
const removeItemFromCanvas = (canvasId, itemId) => defaultManager.removeItemFromCanvas(canvasId, itemId);
const updateItem = (canvasId, itemId, updates) => defaultManager.updateItem(canvasId, itemId, updates);
const getItem = (canvasId, itemId) => defaultManager.getItem(canvasId, itemId);
const moveItemToCanvas = (fromCanvasId, toCanvasId, itemId) => defaultManager.moveItemToCanvas(fromCanvasId, toCanvasId, itemId);
const generateItemId = () => defaultManager.generateItemId();
const setItemZIndex = (canvasId, itemId, newZIndex) => defaultManager.setItemZIndex(canvasId, itemId, newZIndex);
const moveItemForward = (canvasId, itemId) => defaultManager.moveItemForward(canvasId, itemId);
const moveItemBackward = (canvasId, itemId) => defaultManager.moveItemBackward(canvasId, itemId);
const bringItemToFront = (canvasId, itemId) => defaultManager.bringItemToFront(canvasId, itemId);
const sendItemToBack = (canvasId, itemId) => defaultManager.sendItemToBack(canvasId, itemId);
const selectItem = (itemId, canvasId) => defaultManager.selectItem(itemId, canvasId);
const deselectItem = () => defaultManager.deselectItem();
const setActiveCanvas = (canvasId) => defaultManager.setActiveCanvas(canvasId);
const clearActiveCanvas = () => defaultManager.clearActiveCanvas();
const addItemsBatch = (items) => defaultManager.addItemsBatch(items);
const deleteItemsBatch = (itemIds) => defaultManager.deleteItemsBatch(itemIds);
const updateItemsBatch = (updates) => defaultManager.updateItemsBatch(updates);

export { StateManager as S, addItemsBatch as a, generateItemId as b, updateItem as c, deleteItemsBatch as d, addItemToCanvas as e, selectItem as f, gridState as g, setActiveCanvas as s, updateItemsBatch as u };
//# sourceMappingURL=state-manager-6NvKjybS.js.map

//# sourceMappingURL=state-manager-6NvKjybS.js.map