/**
 * Grid Builder API Types
 * =======================
 *
 * API interface exposed to plugins and external code for interacting with the grid builder.
 * Provides methods for event subscriptions, state access, and programmatic operations.
 */
import { GridItem, GridState } from '../services/state-manager';
import { UndoRedoState } from '../services/undo-redo';
/**
 * Event callback type for grid builder events
 *
 * **Generic event structure**: All events pass an object with relevant data
 * **Unsubscribe pattern**: Store callback reference to unsubscribe later
 */
export type EventCallback<T = any> = (data: T) => void;
/**
 * Grid Builder API Interface
 * ============================
 *
 * Main API exposed to plugins and external code for interacting with the grid builder.
 * Provides full access to state, operations, and events.
 *
 * **Typical usage**: Plugins receive API in init() method
 * ```typescript
 * class MyPlugin implements GridBuilderPlugin {
 *   private api: GridBuilderAPI;
 *
 *   init(api: GridBuilderAPI) {
 *     this.api = api;
 *
 *     // Subscribe to events
 *     api.on('componentAdded', this.handleComponentAdded);
 *
 *     // Programmatic operations
 *     const state = api.getState();
 *     console.log(`Currently ${state.canvases.canvas1.items.length} items`);
 *   }
 *
 *   destroy() {
 *     // Unsubscribe from events
 *     this.api.off('componentAdded', this.handleComponentAdded);
 *   }
 * }
 * ```
 *
 * **Example: Analytics Plugin**
 * ```typescript
 * export class AnalyticsPlugin implements GridBuilderPlugin {
 *   name = 'analytics';
 *   private api: GridBuilderAPI;
 *
 *   init(api: GridBuilderAPI) {
 *     this.api = api;
 *
 *     // Track component additions
 *     api.on('componentAdded', (e) => {
 *       analytics.track('Component Added', {
 *         type: e.item.type,
 *         canvasId: e.canvasId
 *       });
 *     });
 *
 *     // Track component deletes
 *     api.on('componentDeleted', (e) => {
 *       analytics.track('Component Deleted', {
 *         itemId: e.itemId
 *       });
 *     });
 *   }
 *
 *   destroy() {
 *     // Cleanup if needed
 *   }
 * }
 * ```
 */
export interface GridBuilderAPI {
    /**
     * Subscribe to grid builder event
     *
     * **Use cases**:
     * - Track user actions (analytics)
     * - Sync with external systems
     * - Custom validation/workflows
     * - Performance monitoring
     *
     * **Event types**: See events.ts for full list
     * - 'componentAdded' - When component dropped on canvas
     * - 'componentDeleted' - When component removed
     * - 'componentDragged' - After drag completes
     * - 'componentResized' - After resize completes
     * - 'componentSelected' - When component selected
     * - 'componentDeselected' - When selection cleared
     * - 'configChanged' - After config panel save
     * - 'dragStart' - When drag begins
     * - 'dragEnd' - When drag ends
     * - 'resizeStart' - When resize begins
     * - 'resizeEnd' - When resize ends
     * - 'viewportChanged' - When desktop/mobile toggle
     * - 'undo' - When undo performed
     * - 'redo' - When redo performed
     *
     * **Unsubscribe pattern**: Must unsubscribe in plugin.destroy()
     * ```typescript
     * // Subscribe
     * const callback = (e) => console.log('Added:', e);
     * api.on('componentAdded', callback);
     *
     * // Unsubscribe (in destroy)
     * api.off('componentAdded', callback);
     * ```
     *
     * @param eventName - Event to subscribe to
     * @param callback - Function called when event fires
     *
     * @example
     * ```typescript
     * // Track all component additions
     * api.on('componentAdded', (event) => {
     *   console.log(`Added ${event.item.type} to ${event.canvasId}`);
     * });
     *
     * // Monitor performance of drag operations
     * let dragStartTime: number;
     * api.on('dragStart', () => {
     *   dragStartTime = Date.now();
     * });
     * api.on('dragEnd', () => {
     *   const duration = Date.now() - dragStartTime;
     *   console.log(`Drag took ${duration}ms`);
     * });
     * ```
     */
    on<T = any>(eventName: string, callback: EventCallback<T>): void;
    /**
     * Unsubscribe from grid builder event
     *
     * **CRITICAL**: Must unsubscribe in plugin.destroy() to prevent memory leaks
     *
     * **Requirements**:
     * - Must pass EXACT same callback reference used in on()
     * - Callback stored as property or bound method
     *
     * **Common mistake**:
     * ```typescript
     * // ❌ Wrong: Different callback reference
     * api.on('componentAdded', (e) => console.log(e));
     * api.off('componentAdded', (e) => console.log(e)); // Won't unsubscribe!
     *
     * // ✅ Correct: Same callback reference
     * const callback = (e) => console.log(e);
     * api.on('componentAdded', callback);
     * api.off('componentAdded', callback); // Unsubscribes successfully
     * ```
     *
     * @param eventName - Event to unsubscribe from
     * @param callback - Exact callback reference used in on()
     *
     * @example
     * ```typescript
     * class MyPlugin implements GridBuilderPlugin {
     *   private api: GridBuilderAPI;
     *   private handleAdd = (e) => console.log('Added:', e);
     *
     *   init(api: GridBuilderAPI) {
     *     this.api = api;
     *     api.on('componentAdded', this.handleAdd);
     *   }
     *
     *   destroy() {
     *     // Unsubscribe using same reference
     *     this.api.off('componentAdded', this.handleAdd);
     *   }
     * }
     * ```
     */
    off<T = any>(eventName: string, callback: EventCallback<T>): void;
    /**
     * Get current grid builder state
     *
     * **Returns**: Full GridState object (canvases, selection, viewport, etc.)
     * **Read-only**: For reading state. Use API methods to mutate.
     *
     * **Use cases**:
     * - Save/export layout to JSON
     * - Check current viewport mode
     * - Count items per canvas
     * - Custom validation logic
     *
     * @returns Current grid state
     *
     * @example
     * ```typescript
     * // Save state to localStorage
     * const state = api.getState();
     * localStorage.setItem('grid-state', JSON.stringify(state));
     *
     * // Count total items
     * const state = api.getState();
     * const totalItems = Object.values(state.canvases)
     *   .reduce((sum, canvas) => sum + canvas.items.length, 0);
     * console.log(`Total items: ${totalItems}`);
     * ```
     */
    getState(): GridState;
    /**
     * Get all items in specific canvas
     *
     * **Returns**: Array of GridItem objects in canvas
     * **Sorted**: Items in DOM render order
     *
     * **Use cases**:
     * - Iterate over canvas items
     * - Count items per canvas
     * - Filter items by type
     * - Export canvas layout
     *
     * @param canvasId - Canvas to get items from
     * @returns Array of items or empty array if canvas not found
     *
     * @example
     * ```typescript
     * // Count headers in canvas1
     * const items = api.getItems('canvas1');
     * const headerCount = items.filter(item => item.type === 'header').length;
     * console.log(`${headerCount} headers in canvas1`);
     *
     * // Export canvas to JSON
     * const items = api.getItems('canvas2');
     * const exportData = items.map(item => ({
     *   type: item.type,
     *   position: item.layouts.desktop
     * }));
     * ```
     */
    getItems(canvasId: string): GridItem[];
    /**
     * Get specific item by ID
     *
     * **Returns**: GridItem or null if not found
     * **Note**: Searches across ALL canvases (item IDs are globally unique)
     *
     * **Use cases**:
     * - Check if item exists
     * - Get item before operation
     * - Read item properties
     * - Validation checks
     *
     * @param itemId - Item ID to find
     * @returns GridItem or null if not found
     *
     * @example
     * ```typescript
     * // Check item exists before operation
     * const item = api.getItem('item-5');
     * if (item) {
     *   console.log(`Item at (${item.layouts.desktop.x}, ${item.layouts.desktop.y})`);
     * } else {
     *   console.error('Item not found');
     * }
     *
     * // Validate item type
     * const item = api.getItem('item-3');
     * if (item?.type === 'video') {
     *   console.log('This is a video component');
     * }
     * ```
     */
    getItem(itemId: string): GridItem | null;
    /**
     * Add component programmatically
     *
     * **Use cases**:
     * - Add component via plugin
     * - Template/preset loading
     * - Import from saved layout
     * - Programmatic page building
     *
     * **Coordinates**: x/y in grid units (not pixels)
     * **Auto-generates**:
     * - Unique item ID
     * - z-index assignment
     * - Mobile layout (if not provided)
     *
     * **Events triggered**: 'componentAdded'
     *
     * @param canvasId - Target canvas
     * @param componentType - Component type (must match registered definition)
     * @param position - Position in grid units
     * @param config - Optional initial configuration
     * @returns Created item ID or null if failed
     *
     * @example
     * ```typescript
     * // Add header to canvas1
     * const itemId = api.addComponent('canvas1', 'header', {
     *   x: 5,
     *   y: 2,
     *   width: 20,
     *   height: 8
     * }, {
     *   text: 'Welcome!',
     *   level: 'H1',
     *   color: '#000000'
     * });
     *
     * if (itemId) {
     *   console.log(`Created ${itemId}`);
     * }
     * ```
     */
    addComponent(canvasId: string, componentType: string, position: {
        x: number;
        y: number;
        width: number;
        height: number;
    }, config?: Record<string, any>): string | null;
    /**
     * Delete component programmatically
     *
     * **Use cases**:
     * - Delete via plugin
     * - Cleanup operations
     * - Conditional deletions
     * - Undo add operation
     *
     * **Events triggered**: 'componentDeleted'
     * **Deselects**: If deleting selected item
     *
     * @param itemId - Item to delete
     * @returns true if deleted, false if item not found
     *
     * @example
     * ```typescript
     * // Delete all headers in canvas1
     * const items = api.getItems('canvas1');
     * const headers = items.filter(item => item.type === 'header');
     * headers.forEach(item => {
     *   api.deleteComponent(item.id);
     * });
     * ```
     */
    deleteComponent(itemId: string): boolean;
    /**
     * Update component configuration
     *
     * **Use cases**:
     * - Change config via plugin
     * - Bulk property updates
     * - Theme changes
     * - Programmatic editing
     *
     * **Triggers**: Component re-render with new config
     * **Events triggered**: 'configChanged'
     *
     * @param itemId - Item to update
     * @param config - New configuration (merged with existing)
     * @returns true if updated, false if item not found
     *
     * @example
     * ```typescript
     * // Change all header colors to blue
     * const items = api.getItems('canvas1');
     * const headers = items.filter(item => item.type === 'header');
     * headers.forEach(item => {
     *   api.updateConfig(item.id, { color: 'blue' });
     * });
     * ```
     */
    updateConfig(itemId: string, config: Record<string, any>): boolean;
    /**
     * Add multiple components in single operation
     *
     * **Performance**: 1000 items in ~10ms with 1 re-render
     * **Atomicity**: All-or-nothing operation (single undo/redo)
     *
     * **Use cases**:
     * - Template loading (many components at once)
     * - Import saved layouts
     * - Stress testing
     * - Bulk operations
     *
     * **Events triggered**: Single 'componentsBatchAdded' event with all items
     *
     * @param components - Array of component specs (without id/zIndex)
     * @returns Array of created item IDs
     *
     * @example
     * ```typescript
     * // Load template with 50 components
     * const template = [
     *   {
     *     canvasId: 'canvas1',
     *     type: 'header',
     *     position: { x: 0, y: 0, width: 50, height: 10 },
     *     config: { text: 'Hero Header' }
     *   },
     *   {
     *     canvasId: 'canvas1',
     *     type: 'text',
     *     position: { x: 0, y: 12, width: 25, height: 15 },
     *     config: { text: 'Lorem ipsum...' }
     *   },
     *   // ... 48 more components
     * ];
     *
     * const itemIds = api.addComponentsBatch(template);
     * console.log(`Added ${itemIds.length} components in single operation`);
     * ```
     */
    addComponentsBatch(components: Array<{
        canvasId: string;
        type: string;
        position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        config?: Record<string, any>;
    }>): string[];
    /**
     * Delete multiple components in single operation
     *
     * **Performance**: 1000 items in ~5ms with 1 re-render
     * **Atomicity**: All-or-nothing operation (single undo/redo)
     *
     * **Use cases**:
     * - Clear entire canvas
     * - Delete selection group
     * - Bulk cleanup
     * - Undo batch add
     *
     * **Events triggered**: Single 'componentsBatchDeleted' event with all item IDs
     *
     * @param itemIds - Array of item IDs to delete
     *
     * @example
     * ```typescript
     * // Clear entire canvas1
     * const items = api.getItems('canvas1');
     * const itemIds = items.map(item => item.id);
     * api.deleteComponentsBatch(itemIds);
     * console.log('Canvas1 cleared');
     * ```
     */
    deleteComponentsBatch(itemIds: string[]): void;
    /**
     * Update multiple component configs in single operation
     *
     * **Performance**: 1000 items in ~8ms with 1 re-render
     * **Atomicity**: All-or-nothing operation (single undo/redo)
     *
     * **Use cases**:
     * - Theme changes (update all component colors)
     * - Bulk property updates
     * - Template application
     * - Undo batch config change
     *
     * **Events triggered**: Single 'configsBatchChanged' event with all updates
     *
     * @param updates - Array of { itemId, config } objects
     *
     * @example
     * ```typescript
     * // Change all headers to dark theme
     * const items = api.getItems('canvas1');
     * const headerUpdates = items
     *   .filter(item => item.type === 'header')
     *   .map(item => ({
     *     itemId: item.id,
     *     config: {
     *       color: '#ffffff',
     *       backgroundColor: '#000000'
     *     }
     *   }));
     *
     * api.updateConfigsBatch(headerUpdates);
     * console.log(`Updated ${headerUpdates.length} headers to dark theme`);
     * ```
     */
    updateConfigsBatch(updates: Array<{
        itemId: string;
        config: Record<string, any>;
    }>): void;
    /**
     * Get canvas DOM element reference
     *
     * **Use cases**:
     * - Measure canvas dimensions
     * - Add custom overlays
     * - Custom drag/drop implementations
     * - Direct DOM manipulation (use cautiously)
     *
     * **Warning**: Avoid direct DOM manipulation when possible.
     * Prefer API methods to maintain reactivity.
     *
     * @param canvasId - Canvas to get element for
     * @returns HTMLElement or null if not found
     *
     * @example
     * ```typescript
     * // Measure canvas dimensions
     * const canvas = api.getCanvasElement('canvas1');
     * if (canvas) {
     *   const rect = canvas.getBoundingClientRect();
     *   console.log(`Canvas is ${rect.width}px × ${rect.height}px`);
     * }
     *
     * // Add custom overlay
     * const canvas = api.getCanvasElement('canvas2');
     * if (canvas) {
     *   const overlay = document.createElement('div');
     *   overlay.className = 'custom-overlay';
     *   canvas.appendChild(overlay);
     * }
     * ```
     */
    getCanvasElement(canvasId: string): HTMLElement | null;
    /**
     * Undo last operation
     *
     * **Use cases**:
     * - Implement undo button
     * - Keyboard shortcut (Ctrl+Z)
     * - Programmatic undo
     *
     * **Undoable operations**:
     * - Add/delete components
     * - Move/resize components
     * - Config changes
     * - Add/remove canvases
     *
     * @example
     * ```typescript
     * // Undo button handler
     * handleUndo() {
     *   api.undo();
     * }
     * ```
     */
    undo(): void;
    /**
     * Redo last undone operation
     *
     * **Use cases**:
     * - Implement redo button
     * - Keyboard shortcut (Ctrl+Y)
     * - Programmatic redo
     *
     * @example
     * ```typescript
     * // Redo button handler
     * handleRedo() {
     *   api.redo();
     * }
     * ```
     */
    redo(): void;
    /**
     * Check if undo is available
     *
     * **Use cases**:
     * - Enable/disable undo button
     * - Check before undo operation
     *
     * @returns true if undo stack has operations
     *
     * @example
     * ```typescript
     * // Enable/disable undo button
     * <button disabled={!api.canUndo()} onClick={() => api.undo()}>
     *   Undo
     * </button>
     * ```
     */
    canUndo(): boolean;
    /**
     * Check if redo is available
     *
     * **Use cases**:
     * - Enable/disable redo button
     * - Check before redo operation
     *
     * @returns true if redo stack has operations
     *
     * @example
     * ```typescript
     * // Enable/disable redo button
     * <button disabled={!api.canRedo()} onClick={() => api.redo()}>
     *   Redo
     * </button>
     * ```
     */
    canRedo(): boolean;
    /**
     * Reactive undo/redo state for button updates
     *
     * **Reactive**: StencilJS components automatically re-render when state changes
     * **Use instead of**: canUndo() and canRedo() functions for reactive UIs
     *
     * **Use cases**:
     * - Enable/disable undo/redo buttons reactively
     * - Show/hide undo/redo UI based on availability
     * - Display in status bars
     *
     * **Properties**:
     * - canUndo: boolean - Whether undo is available
     * - canRedo: boolean - Whether redo is available
     *
     * @example
     * ```typescript
     * // Reactive undo/redo buttons (updates automatically)
     * <button
     *   disabled={!api.undoRedoState.canUndo}
     *   onClick={() => api.undo()}>
     *   Undo
     * </button>
     * <button
     *   disabled={!api.undoRedoState.canRedo}
     *   onClick={() => api.redo()}>
     *   Redo
     * </button>
     * ```
     */
    undoRedoState: UndoRedoState;
    /**
     * Add new canvas programmatically
     *
     * **Use cases**:
     * - Dynamic canvas creation
     * - Template loading
     * - User adds section via UI
     *
     * **Library responsibility**:
     * - Create canvas in gridState with empty items array
     * - Initialize zIndexCounter
     * - Track operation in undo/redo
     *
     * **Host app responsibility**:
     * - Listen to 'canvasAdded' event
     * - Add canvas metadata (title, backgroundColor, etc.)
     *
     * **Events triggered**: 'canvasAdded'
     *
     * @param canvasId - Unique canvas identifier
     *
     * @example
     * ```typescript
     * // Add new section
     * api.addCanvas('hero-section-2');
     *
     * // Host app syncs metadata
     * api.on('canvasAdded', (event) => {
     *   canvasMetadata[event.canvasId] = {
     *     title: 'New Section',
     *     backgroundColor: '#f5f5f5'
     *   };
     * });
     * ```
     */
    addCanvas(canvasId: string): void;
    /**
     * Remove canvas programmatically
     *
     * **Use cases**:
     * - Delete section via UI
     * - Template cleanup
     * - Conditional canvas removal
     *
     * **Library responsibility**:
     * - Snapshot canvas items and zIndexCounter
     * - Remove canvas from gridState
     * - Track operation in undo/redo (restores items on undo)
     *
     * **Host app responsibility**:
     * - Listen to 'canvasRemoved' event
     * - Remove canvas metadata
     * - Clean up any dynamically injected headers/UI
     *
     * **Events triggered**: 'canvasRemoved'
     *
     * @param canvasId - Canvas to remove
     *
     * @example
     * ```typescript
     * // Remove section
     * api.removeCanvas('hero-section-2');
     *
     * // Host app syncs metadata
     * api.on('canvasRemoved', (event) => {
     *   delete canvasMetadata[event.canvasId];
     *   removeCanvasHeader(event.canvasId);
     * });
     * ```
     */
    removeCanvas(canvasId: string): void;
    /**
     * Set active canvas programmatically
     *
     * **Use cases**:
     * - Focus specific section for editing
     * - Programmatic navigation between sections
     * - Highlight canvas after adding items
     * - Show canvas-specific settings panel
     *
     * **Library responsibility**:
     * - Update gridState.activeCanvasId
     * - Pass isActive prop to canvas-section components
     * - Apply 'active' CSS class to active canvas
     * - Emit 'canvasActivated' event
     *
     * **Host app responsibility**:
     * - Listen to 'canvasActivated' event (optional)
     * - Update canvas-specific UI (settings panel, etc.)
     * - Apply custom styling via CSS (title opacity, etc.)
     *
     * **Automatic activation**: Canvas automatically activates when user:
     * - Clicks item on canvas
     * - Clicks canvas background
     * - Starts dragging item
     * - Starts resizing item
     *
     * **Events triggered**: 'canvasActivated'
     *
     * @param canvasId - Canvas to activate
     *
     * @example
     * ```typescript
     * // Activate canvas after adding item
     * const itemId = api.addComponent('canvas2', 'header', { x: 1, y: 1, width: 20, height: 6 });
     * api.setActiveCanvas('canvas2');
     *
     * // Listen to activation events
     * api.on('canvasActivated', ({ canvasId }) => {
     *   showCanvasSettings(canvasId);
     * });
     * ```
     */
    setActiveCanvas(canvasId: string): void;
    /**
     * Get currently active canvas ID
     *
     * **Use cases**:
     * - Check which canvas is currently active
     * - Conditional UI rendering based on active canvas
     * - State synchronization
     *
     * **Returns**:
     * - Canvas ID string if a canvas is active
     * - `null` if no canvas is active
     *
     * @returns Canvas ID or null if none active
     *
     * @example
     * ```typescript
     * const activeId = api.getActiveCanvas();
     * if (activeId === 'canvas1') {
     *   // Show canvas1-specific settings
     * }
     * ```
     */
    getActiveCanvas(): string | null;
}
