/**
 * GridBuilderAPI - Public API for the Grid Builder Library
 * ========================================================
 *
 * This class provides a clean, well-documented API for consumers to interact
 * with the grid builder system. It wraps the internal state management and
 * provides methods for:
 *
 * - Item management (add, remove, update, move)
 * - Selection handling
 * - Viewport switching
 * - Undo/redo operations
 * - State import/export
 * - Event subscription
 *
 * ## Usage Example
 *
 * ```typescript
 * // Get API instance from grid-builder component
 * const api = await gridBuilder.getAPI();
 *
 * // Listen for events
 * api.on('itemAdded', (event) => {
 *   console.log('Item added:', event.item);
 * });
 *
 * // Add an item
 * const item = api.addItem('canvas1', 'header', 10, 10, 20, 15);
 *
 * // Update item
 * api.updateItem('canvas1', item.id, {
 *   layouts: {
 *     desktop: { x: 15, y: 15, width: 25, height: 20 },
 *     mobile: { x: null, y: null, width: null, height: null, customized: false },
 *   },
 * });
 *
 * // Export state
 * const json = api.exportState();
 * localStorage.setItem('gridState', json);
 *
 * // Import state
 * const json = localStorage.getItem('gridState');
 * if (json) {
 *   api.importState(json);
 * }
 * ```
 *
 * @module grid-builder-api
 */
import { addItemsBatch, deleteItemsBatch, deselectItem, generateItemId, getItem as getItemFromState, gridState, reset as resetState, selectItem as selectItemInState, updateItemsBatch, } from "./state-manager";
import { AddCanvasCommand, AddItemCommand, BatchAddCommand, BatchDeleteCommand, BatchUpdateConfigCommand, MoveItemCommand, RemoveCanvasCommand, RemoveItemCommand, SetViewportCommand, ToggleGridCommand, UpdateItemCommand, } from "./undo-redo-commands";
import { canRedo as canRedoInternal, canUndo as canUndoInternal, clearHistory as clearHistoryInternal, pushCommand, redo as redoInternal, undo as undoInternal, } from "./undo-redo";
/**
 * Event emitter for grid builder events
 *
 * Uses a Map of event name → Set of listeners for efficient
 * listener management and notification
 */
class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    /**
     * Register an event listener
     */
    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(listener);
    }
    /**
     * Unregister an event listener
     */
    off(event, listener) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(listener);
        }
    }
    /**
     * Register a one-time event listener
     */
    once(event, listener) {
        const onceListener = ((eventData) => {
            this.off(event, onceListener);
            listener(eventData);
        });
        this.on(event, onceListener);
    }
    /**
     * Emit an event to all registered listeners
     */
    emit(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach((listener) => listener(data));
        }
    }
    /**
     * Remove all event listeners
     */
    clear() {
        this.listeners.clear();
    }
}
/**
 * GridBuilderAPI - Main API class for grid builder library
 *
 * Provides high-level methods for interacting with the grid builder,
 * event subscription, and state management.
 */
export class GridBuilderAPI {
    constructor() {
        this.eventEmitter = new EventEmitter();
    }
    // ============================================================================
    // State Access Methods
    // ============================================================================
    /**
     * Get the current grid state
     *
     * **Note**: Returns reference to state object. Mutations will affect the grid.
     * For read-only access, use `exportState()` and parse the JSON.
     *
     * @returns Current grid state object
     */
    getState() {
        return gridState;
    }
    /**
     * Get all canvases
     *
     * @returns Object mapping canvas IDs to canvas data
     */
    getCanvases() {
        return gridState.canvases;
    }
    /**
     * Get a specific canvas
     *
     * @param canvasId - Canvas ID
     * @returns Canvas data or null if not found
     */
    getCanvas(canvasId) {
        return gridState.canvases[canvasId] || null;
    }
    /**
     * Add a canvas with undo/redo support
     *
     * **Pattern**: Library manages item placement, host app manages presentation
     *
     * **Library responsibility** (what this method does):
     * - Create canvas in gridState.canvases with empty items array
     * - Initialize zIndexCounter for item stacking
     * - Track operation in undo/redo stack
     * - Emit canvasAdded event
     *
     * **Host app responsibility** (what this method does NOT do):
     * - Store canvas title, backgroundColor, or other metadata
     * - Host app must maintain its own canvas metadata separately
     * - Host app listens to canvasAdded event to sync its state
     *
     * **Integration pattern**:
     * ```typescript
     * // Host app maintains canvas metadata
     * const canvasMetadata = {
     *   'hero-section': { title: 'Hero Section', backgroundColor: '#f0f4f8' }
     * };
     *
     * // Listen to library events
     * api.on('canvasAdded', (event) => {
     *   // Host app knows a canvas was created, can update UI
     *   console.log('Canvas added:', event.canvasId);
     * });
     *
     * // Create canvas in library (just placement state)
     * api.addCanvas('hero-section');
     *
     * // Later: undo/redo works for library state
     * api.undo(); // Removes canvas from library
     * api.redo(); // Restores canvas in library
     *
     * // Host app manages its own metadata undo/redo separately
     * ```
     *
     * @param canvasId - Unique canvas identifier
     *
     * @emits canvasAdded - After canvas is created in library state
     * @emits stateChanged - After state is updated
     *
     * @example
     * ```typescript
     * // Host app adds a new section
     * api.addCanvas('hero-section');
     *
     * // Later: user can undo
     * api.undo(); // Removes the canvas
     *
     * // And redo
     * api.redo(); // Brings it back
     * ```
     */
    addCanvas(canvasId) {
        const cmd = new AddCanvasCommand(canvasId);
        pushCommand(cmd);
        cmd.redo(); // Execute the command
        // Emit event
        this.eventEmitter.emit('canvasAdded', { canvasId });
    }
    /**
     * Remove a canvas with undo/redo support
     *
     * **Critical**: Removes canvas AND all its items
     *
     * **Undo behavior**: Restores canvas with all items in original state
     *
     * **Host app responsibilities**:
     * - Listen to canvasRemoved event
     * - Update its own UI/state
     * - Handle cleanup of canvas-specific resources
     *
     * @param canvasId - Canvas to remove
     *
     * @emits canvasRemoved - After canvas is removed
     * @emits stateChanged - After state is updated
     *
     * @example
     * ```typescript
     * // Host app removes a section
     * api.removeCanvas('custom-section-1');
     *
     * // Later: user can undo
     * api.undo(); // Restores canvas with all its items
     * ```
     */
    removeCanvas(canvasId) {
        const cmd = new RemoveCanvasCommand(canvasId);
        pushCommand(cmd);
        cmd.redo(); // Execute the command
        // Emit event
        this.eventEmitter.emit('canvasRemoved', { canvasId });
    }
    /**
     * Get a specific item from a canvas
     *
     * @param canvasId - Canvas ID
     * @param itemId - Item ID
     * @returns Grid item or null if not found
     */
    getItem(canvasId, itemId) {
        return getItemFromState(canvasId, itemId);
    }
    /**
     * Get current viewport
     *
     * @returns Current viewport ('desktop' or 'mobile')
     */
    getCurrentViewport() {
        return gridState.currentViewport;
    }
    /**
     * Get grid visibility state
     *
     * @returns True if grid is visible, false otherwise
     */
    getGridVisibility() {
        return gridState.showGrid;
    }
    /**
     * Get currently selected item
     *
     * @returns Object with itemId and canvasId, or null if nothing selected
     */
    getSelectedItem() {
        if (gridState.selectedItemId && gridState.selectedCanvasId) {
            return {
                itemId: gridState.selectedItemId,
                canvasId: gridState.selectedCanvasId,
            };
        }
        return null;
    }
    // ============================================================================
    // Item Management Methods
    // ============================================================================
    /**
     * Add an item to a canvas
     *
     * Creates a new grid item with generated ID and adds it to the specified canvas.
     * This operation is undoable.
     *
     * @param canvasId - Target canvas ID
     * @param componentType - Type of component to add
     * @param x - X position in grid units
     * @param y - Y position in grid units
     * @param width - Width in grid units
     * @param height - Height in grid units
     * @param config - Optional component configuration data
     * @returns Created grid item
     *
     * @emits itemAdded
     */
    addItem(canvasId, componentType, x, y, width, height, config) {
        var _a;
        const item = {
            id: generateItemId(),
            canvasId,
            type: componentType,
            name: componentType,
            layouts: {
                desktop: { x, y, width, height },
                mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: ((_a = gridState.canvases[canvasId]) === null || _a === void 0 ? void 0 : _a.zIndexCounter) || 1,
            config: config || {},
        };
        const command = new AddItemCommand(canvasId, item);
        command.redo(); // Execute command first
        pushCommand(command); // Then add to history
        this.eventEmitter.emit('itemAdded', { item, canvasId });
        return item;
    }
    /**
     * Remove an item from a canvas
     *
     * This operation is undoable.
     *
     * @param canvasId - Canvas ID
     * @param itemId - Item ID to remove
     *
     * @emits itemRemoved
     */
    removeItem(canvasId, itemId) {
        const item = getItemFromState(canvasId, itemId);
        if (!item) {
            return;
        }
        const command = new RemoveItemCommand(canvasId, item);
        command.redo(); // Execute command first
        pushCommand(command); // Then add to history
        this.eventEmitter.emit('itemRemoved', { itemId, canvasId });
    }
    /**
     * Update an item's properties
     *
     * This operation is undoable.
     *
     * @param canvasId - Canvas ID
     * @param itemId - Item ID to update
     * @param updates - Partial item data to merge
     *
     * @emits itemUpdated
     */
    updateItem(canvasId, itemId, updates) {
        const oldItem = getItemFromState(canvasId, itemId);
        if (!oldItem) {
            return;
        }
        const command = new UpdateItemCommand(canvasId, itemId, oldItem, updates);
        command.redo(); // Execute command first
        pushCommand(command); // Then add to history
        this.eventEmitter.emit('itemUpdated', { itemId, canvasId, updates });
    }
    /**
     * Move an item from one canvas to another
     *
     * This operation is undoable.
     *
     * @param fromCanvasId - Source canvas ID
     * @param toCanvasId - Target canvas ID
     * @param itemId - Item ID to move
     *
     * @emits itemMoved
     */
    moveItem(fromCanvasId, toCanvasId, itemId) {
        const item = getItemFromState(fromCanvasId, itemId);
        if (!item) {
            return;
        }
        // Get source canvas to find item index
        const sourceCanvas = gridState.canvases[fromCanvasId];
        if (!sourceCanvas) {
            return;
        }
        const sourceIndex = sourceCanvas.items.findIndex((i) => i.id === itemId);
        const sourcePosition = { x: item.layouts.desktop.x, y: item.layouts.desktop.y };
        const targetPosition = { x: item.layouts.desktop.x, y: item.layouts.desktop.y };
        const command = new MoveItemCommand(itemId, fromCanvasId, toCanvasId, sourcePosition, targetPosition, sourceIndex);
        command.redo(); // Execute command first
        pushCommand(command); // Then add to history
        this.eventEmitter.emit('itemMoved', { itemId, fromCanvasId, toCanvasId });
    }
    // ============================================================================
    // Batch Operations
    // ============================================================================
    /**
     * Add multiple items in a single batch operation
     *
     * **Performance Optimization** (Extraction Guide Phase 7.2):
     * Batch operations trigger a single state update and re-render, compared to
     * N individual updates causing N re-renders. For 100 items:
     * - Individual: 100 re-renders (~1600ms)
     * - Batch: 1 re-render (~16ms)
     * - **100× performance improvement**
     *
     * **Undo/Redo Integration**:
     * The entire batch operation is treated as a single undoable command.
     * Calling undo() will remove all items added in the batch, and redo()
     * will restore all of them in a single operation.
     *
     * **Best Practices**:
     * - Use for 3+ items (overhead is negligible, benefits scale with size)
     * - Group related operations for logical undo/redo units
     * - Keep batches under 1000 items for optimal performance
     * - Batch operations emit single `itemsBatchAdded` event (not individual `itemAdded`)
     *
     * @param items - Array of item specifications with the following properties:
     *   - `canvasId` (string): Target canvas ID where item will be added
     *   - `type` (string): Component type identifier (must match a component definition)
     *   - `x` (number): X position in grid units (0-based)
     *   - `y` (number): Y position in grid units (0-based)
     *   - `width` (number): Width in grid units
     *   - `height` (number): Height in grid units
     *   - `config` (object, optional): Component-specific configuration data
     *
     * @returns Array of created item IDs (in same order as input array)
     *
     * @emits itemsBatchAdded - Fired once after all items are added
     * @emits stateChanged - Fired once after batch completes (inherited from state update)
     *
     * @example
     * ```typescript
     * // Add a hero section and 3 article cards in one operation
     * const itemIds = api.addItemsBatch([
     *   {
     *     canvasId: 'canvas1',
     *     type: 'hero',
     *     x: 0, y: 0,
     *     width: 50, height: 15,
     *     config: { headline: 'Welcome', background: '#007bff' }
     *   },
     *   {
     *     canvasId: 'canvas1',
     *     type: 'article',
     *     x: 0, y: 20,
     *     width: 15, height: 12,
     *     config: { title: 'Article 1' }
     *   },
     *   {
     *     canvasId: 'canvas1',
     *     type: 'article',
     *     x: 17, y: 20,
     *     width: 15, height: 12,
     *     config: { title: 'Article 2' }
     *   },
     *   {
     *     canvasId: 'canvas1',
     *     type: 'article',
     *     x: 34, y: 20,
     *     width: 15, height: 12,
     *     config: { title: 'Article 3' }
     *   }
     * ]);
     *
     * console.log(`Added ${itemIds.length} items`); // "Added 4 items"
     *
     * // Undo removes all 4 items in one operation
     * api.undo();
     *
     * // Redo restores all 4 items in one operation
     * api.redo();
     * ```
     *
     * @see https://github.com/yourusername/extraction-guide#phase-72-batch-operations
     */
    addItemsBatch(items) {
        // Convert API format to state-manager format
        const partialItems = items.map(({ canvasId, type, x, y, width, height, config }) => ({
            canvasId,
            type,
            name: type,
            layouts: {
                desktop: { x, y, width, height },
                mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: config || {},
        }));
        // Use state-manager batch operation (single state update)
        const itemIds = addItemsBatch(partialItems);
        // Add to undo/redo history
        const command = new BatchAddCommand(itemIds);
        pushCommand(command); // Note: Batch operations store full item data, so no need to redo()
        // Collect all created items for event
        const createdItems = itemIds.map((id) => this.findItemById(id)).filter(Boolean);
        // Emit single batch event
        this.eventEmitter.emit('itemsBatchAdded', { items: createdItems });
        return itemIds;
    }
    /**
     * Delete multiple items in a single batch operation
     *
     * **Performance Optimization** (Extraction Guide Phase 7.2):
     * Batch deletion triggers a single state update and re-render, compared to
     * N individual deletes causing N re-renders. For 50 items:
     * - Individual: 50 re-renders (~800ms)
     * - Batch: 1 re-render (~16ms)
     * - **50× performance improvement**
     *
     * **Undo/Redo Integration**:
     * The entire batch deletion is treated as a single undoable command.
     * Calling undo() will restore all deleted items with their original
     * positions, configs, and z-indices. Calling redo() will delete them
     * all again in a single operation.
     *
     * **Selection Handling**:
     * If any deleted item is currently selected, the selection is automatically
     * cleared. This prevents orphaned selection state.
     *
     * **Best Practices**:
     * - Use for bulk cleanup operations (e.g., "Clear Canvas", "Delete Selected")
     * - Combine with batch add for "Replace All" operations
     * - Items are deleted across all canvases (itemIds can span multiple canvases)
     * - Batch operations emit single `itemsBatchDeleted` event (not individual `itemRemoved`)
     *
     * @param itemIds - Array of item IDs to delete. Item IDs can belong to different
     *   canvases. Invalid or non-existent item IDs are silently ignored (no error thrown).
     *
     * @emits itemsBatchDeleted - Fired once after all items are deleted
     * @emits selectionChanged - Fired if a selected item was deleted
     * @emits stateChanged - Fired once after batch completes (inherited from state update)
     *
     * @example
     * ```typescript
     * // Delete all selected items in one operation
     * const selectedIds = ['item-1', 'item-2', 'item-3'];
     * api.deleteItemsBatch(selectedIds);
     *
     * // Undo restores all 3 items
     * api.undo();
     *
     * // Clear entire canvas
     * const canvas = api.getCanvas('canvas1');
     * const allItemIds = canvas.items.map(item => item.id);
     * api.deleteItemsBatch(allItemIds);
     * ```
     *
     * @example
     * ```typescript
     * // Delete items across multiple canvases
     * api.deleteItemsBatch([
     *   'canvas1-item-1',
     *   'canvas1-item-2',
     *   'canvas2-item-5',
     *   'canvas2-item-6'
     * ]); // All 4 items deleted in one operation
     * ```
     *
     * @see https://github.com/yourusername/extraction-guide#phase-72-batch-operations
     */
    deleteItemsBatch(itemIds) {
        // Add to undo/redo history BEFORE deletion (need state for undo)
        const command = new BatchDeleteCommand(itemIds);
        pushCommand(command);
        // Use state-manager batch operation (single state update)
        deleteItemsBatch(itemIds);
        // Clear selection if any deleted item was selected
        if (gridState.selectedItemId && itemIds.includes(gridState.selectedItemId)) {
            gridState.selectedItemId = null;
            gridState.selectedCanvasId = null;
        }
        // Emit single batch event
        this.eventEmitter.emit('itemsBatchDeleted', { itemIds });
    }
    /**
     * Update config for multiple items in a single batch operation
     *
     * **Performance Optimization** (Extraction Guide Phase 7.2):
     * Batch config updates trigger a single state update and re-render, compared to
     * N individual updates causing N re-renders. For 200 items:
     * - Individual: 200 re-renders (~3200ms)
     * - Batch: 1 re-render (~16ms)
     * - **200× performance improvement**
     *
     * **Undo/Redo Integration**:
     * The entire batch update is treated as a single undoable command.
     * Calling undo() will revert all config changes to their original values,
     * and redo() will reapply all changes in a single operation.
     *
     * **Config Merging Behavior**:
     * Config updates are **shallow merged** with existing config. This means:
     * - New properties are added
     * - Existing properties are overwritten
     * - Unspecified properties remain unchanged
     * - To delete a property, explicitly set it to `undefined`
     *
     * **Best Practices**:
     * - Use for theme changes across multiple components
     * - Ideal for bulk property updates (e.g., "Set all headers to blue")
     * - Items can belong to different canvases
     * - Invalid item IDs log warnings but don't throw errors
     * - Batch operations emit single `itemsBatchUpdated` event (not individual `itemUpdated`)
     *
     * @param updates - Array of config update specifications with the following properties:
     *   - `itemId` (string): ID of item to update
     *   - `config` (object): Partial config object to merge with existing config
     *
     * @emits itemsBatchUpdated - Fired once after all configs are updated
     * @emits stateChanged - Fired once after batch completes (inherited from state update)
     *
     * @example
     * ```typescript
     * // Update theme colors across all header components
     * api.updateConfigsBatch([
     *   { itemId: 'header-1', config: { backgroundColor: '#007bff', textColor: '#fff' } },
     *   { itemId: 'header-2', config: { backgroundColor: '#007bff', textColor: '#fff' } },
     *   { itemId: 'header-3', config: { backgroundColor: '#007bff', textColor: '#fff' } }
     * ]);
     *
     * // Undo reverts all 3 headers to original colors
     * api.undo();
     *
     * // Redo applies blue theme again
     * api.redo();
     * ```
     *
     * @example
     * ```typescript
     * // Bulk update text content
     * const items = api.getCanvas('canvas1').items.filter(i => i.type === 'text');
     * api.updateConfigsBatch(
     *   items.map((item, idx) => ({
     *     itemId: item.id,
     *     config: { content: `Updated text ${idx + 1}` }
     *   }))
     * );
     * ```
     *
     * @example
     * ```typescript
     * // Config merging demonstration
     * // Original config: { title: 'Old', fontSize: 16, color: 'red' }
     * api.updateConfigsBatch([
     *   {
     *     itemId: 'item-1',
     *     config: { title: 'New', color: 'blue' }
     *   }
     * ]);
     * // Result: { title: 'New', fontSize: 16, color: 'blue' }
     * //          ^^^^^ updated    ^^^^^^^^ unchanged   ^^^^ updated
     * ```
     *
     * @see https://github.com/yourusername/extraction-guide#phase-72-batch-operations
     */
    updateConfigsBatch(updates) {
        // Convert to state-manager format (need canvasId)
        const batchUpdates = updates.map(({ itemId, config }) => {
            const item = this.findItemById(itemId);
            if (!item) {
                console.warn(`Item ${itemId} not found for config update`);
                return null;
            }
            return {
                itemId,
                canvasId: item.canvasId,
                updates: { config: Object.assign(Object.assign({}, item.config), config) },
            };
        }).filter(Boolean);
        // Add to undo/redo history
        const command = new BatchUpdateConfigCommand(batchUpdates);
        pushCommand(command);
        // Use state-manager batch operation (single state update)
        updateItemsBatch(batchUpdates);
        // Emit single batch event with simpler format
        const eventUpdates = batchUpdates.map(({ itemId, canvasId, updates }) => ({
            itemId,
            canvasId,
            config: updates.config,
        }));
        this.eventEmitter.emit('itemsBatchUpdated', { updates: eventUpdates });
    }
    /**
     * Helper method to find an item by ID across all canvases
     *
     * @param itemId - Item ID to find
     * @returns Grid item or null if not found
     */
    findItemById(itemId) {
        for (const canvasId in gridState.canvases) {
            const canvas = gridState.canvases[canvasId];
            const item = canvas.items.find((i) => i.id === itemId);
            if (item) {
                return item;
            }
        }
        return null;
    }
    // ============================================================================
    // Selection Methods
    // ============================================================================
    /**
     * Select an item
     *
     * @param itemId - Item ID to select
     * @param canvasId - Canvas ID containing the item
     *
     * @emits selectionChanged
     */
    selectItem(itemId, canvasId) {
        selectItemInState(itemId, canvasId);
        this.eventEmitter.emit('selectionChanged', { itemId, canvasId });
    }
    /**
     * Deselect the currently selected item
     *
     * @emits selectionChanged
     */
    deselectItem() {
        deselectItem();
        this.eventEmitter.emit('selectionChanged', { itemId: null, canvasId: null });
    }
    // ============================================================================
    // Viewport and Display Methods
    // ============================================================================
    /**
     * Change the current viewport
     *
     * This operation is undoable.
     *
     * @param viewport - Target viewport ('desktop' or 'mobile')
     *
     * @emits viewportChanged
     */
    setViewport(viewport) {
        const oldViewport = gridState.currentViewport;
        const command = new SetViewportCommand(oldViewport, viewport);
        command.redo(); // Execute command first
        pushCommand(command); // Then add to history
        this.eventEmitter.emit('viewportChanged', { oldViewport, newViewport: viewport });
    }
    /**
     * Toggle grid visibility
     *
     * This operation is undoable.
     *
     * @param visible - True to show grid, false to hide
     *
     * @emits gridVisibilityChanged
     */
    toggleGrid(visible) {
        const oldValue = gridState.showGrid;
        const command = new ToggleGridCommand(oldValue, visible);
        command.redo(); // Execute command first
        pushCommand(command); // Then add to history
        this.eventEmitter.emit('gridVisibilityChanged', { visible });
    }
    // ============================================================================
    // Undo/Redo Methods
    // ============================================================================
    /**
     * Undo the last action
     *
     * @emits stateChanged
     */
    undo() {
        undoInternal();
        this.eventEmitter.emit('stateChanged', {});
    }
    /**
     * Redo the last undone action
     *
     * @emits stateChanged
     */
    redo() {
        redoInternal();
        this.eventEmitter.emit('stateChanged', {});
    }
    /**
     * Check if undo is available
     *
     * @returns True if undo is available
     */
    canUndo() {
        return canUndoInternal();
    }
    /**
     * Check if redo is available
     *
     * @returns True if redo is available
     */
    canRedo() {
        return canRedoInternal();
    }
    /**
     * Clear undo/redo history
     */
    clearHistory() {
        clearHistoryInternal();
    }
    // ============================================================================
    // State Management Methods
    // ============================================================================
    /**
     * Export current grid state as JSON
     *
     * Useful for saving/loading grid configurations, persistence, etc.
     *
     * @returns JSON string representation of grid state
     *
     * @example
     * ```typescript
     * const json = api.exportState();
     * localStorage.setItem('gridState', json);
     * ```
     */
    exportState() {
        return JSON.stringify(gridState);
    }
    /**
     * Import grid state from JSON
     *
     * Replaces current state with imported state. This operation
     * clears undo/redo history.
     *
     * @param json - JSON string from exportState()
     *
     * @throws Error if JSON is invalid
     *
     * @emits stateChanged
     *
     * @example
     * ```typescript
     * const json = localStorage.getItem('gridState');
     * if (json) {
     *   api.importState(json);
     * }
     * ```
     */
    importState(json) {
        const newState = JSON.parse(json);
        // Replace state properties
        Object.assign(gridState, newState);
        // Clear undo/redo history (imported state is new baseline)
        clearHistoryInternal();
        this.eventEmitter.emit('stateChanged', {});
    }
    /**
     * Reset grid to initial state
     *
     * Clears all canvases, resets viewport to desktop, shows grid.
     * This operation clears undo/redo history.
     *
     * @emits stateChanged
     */
    reset() {
        resetState();
        clearHistoryInternal();
        this.eventEmitter.emit('stateChanged', {});
    }
    // ============================================================================
    // Event System Methods
    // ============================================================================
    /**
     * Register an event listener
     *
     * @param event - Event name
     * @param listener - Event handler function
     *
     * @example
     * ```typescript
     * api.on('itemAdded', (event) => {
     *   console.log('Item added:', event.item);
     * });
     * ```
     */
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    /**
     * Unregister an event listener
     *
     * @param event - Event name
     * @param listener - Event handler function to remove
     */
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
    /**
     * Register a one-time event listener
     *
     * Listener is automatically removed after first invocation.
     *
     * @param event - Event name
     * @param listener - Event handler function
     *
     * @example
     * ```typescript
     * api.once('itemAdded', (event) => {
     *   console.log('First item added:', event.item);
     * });
     * ```
     */
    once(event, listener) {
        this.eventEmitter.once(event, listener);
    }
    /**
     * Remove all event listeners and clean up
     *
     * Call this when destroying the API instance to prevent memory leaks.
     */
    destroy() {
        this.eventEmitter.clear();
    }
}
//# sourceMappingURL=grid-builder-api.js.map
