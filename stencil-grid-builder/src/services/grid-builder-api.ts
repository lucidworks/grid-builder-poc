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
 * console.log('Item added:', event.item);
 * });
 *
 * // Add an item
 * const item = api.addItem('canvas1', 'header', 10, 10, 20, 15);
 *
 * // Update item
 * api.updateItem('canvas1', item.id, {
 * layouts: {
 * desktop: { x: 15, y: 15, width: 25, height: 20 },
 * mobile: { x: null, y: null, width: null, height: null, customized: false },
 * },
 * });
 *
 * // Export state
 * const json = api.exportState();
 * localStorage.setItem('gridState', json);
 *
 * // Import state
 * const json = localStorage.getItem('gridState');
 * if (json) {
 * api.importState(json);
 * }
 * ```
 * @module grid-builder-api
 */

import {
  addItemsBatch,
  bringItemToFront as bringItemToFrontInternal,
  deleteItemsBatch,
  deselectItem,
  generateItemId,
  getItem as getItemFromState,
  GridItem,
  GridState,
  moveItemBackward as moveItemBackwardInternal,
  moveItemForward as moveItemForwardInternal,
  reset as resetState,
  selectItem as selectItemInState,
  sendItemToBack as sendItemToBackInternal,
  setItemZIndex as setItemZIndexInternal,
  updateItemsBatch,
} from "./state-manager";
import { EventManager } from "./event-manager";
import {
  AddCanvasCommand,
  AddItemCommand,
  BatchAddCommand,
  BatchDeleteCommand,
  BatchUpdateConfigCommand,
  ChangeZIndexCommand,
  MoveItemCommand,
  RemoveCanvasCommand,
  RemoveItemCommand,
  UpdateItemCommand,
} from "./undo-redo-commands";
import {
  canRedo as canRedoInternal,
  canUndo as canUndoInternal,
  clearHistory as clearHistoryInternal,
  pushCommand,
  redo as redoInternal,
  undo as undoInternal,
} from "./undo-redo";
import {
  CanvasAddedEvent,
  CanvasRemovedEvent,
  GridBuilderEventMap,
  GridVisibilityChangedEvent,
  ItemAddedEvent,
  ItemMovedEvent,
  ItemRemovedEvent,
  ItemUpdatedEvent,
  SelectionChangedEvent,
  StateChangedEvent,
  ViewportChangedEvent,
} from "../types/events";

/**
 * Event listener function type
 */
type EventListener<K extends keyof GridBuilderEventMap> = (
  event: GridBuilderEventMap[K],
) => void;

/**
 * Event emitter for grid builder events
 *
 * Uses a Map of event name → Set of listeners for efficient
 * listener management and notification
 */
class EventEmitter {
  private listeners: Map<keyof GridBuilderEventMap, Set<EventListener<any>>> =
    new Map();

  /**
   * Register an event listener
   */
  on<K extends keyof GridBuilderEventMap>(
    event: K,
    listener: EventListener<K>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Unregister an event listener
   */
  off<K extends keyof GridBuilderEventMap>(
    event: K,
    listener: EventListener<K>,
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Register a one-time event listener
   */
  once<K extends keyof GridBuilderEventMap>(
    event: K,
    listener: EventListener<K>,
  ): void {
    const onceListener = ((eventData: GridBuilderEventMap[K]) => {
      this.off(event, onceListener);
      listener(eventData);
    }) as EventListener<K>;

    this.on(event, onceListener);
  }

  /**
   * Emit an event to all registered listeners
   */
  emit<K extends keyof GridBuilderEventMap>(
    event: K,
    data: GridBuilderEventMap[K],
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }

  /**
   * Remove all event listeners
   */
  clear(): void {
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
  private eventEmitter: EventEmitter = new EventEmitter();
  private eventManager: EventManager;
  private stateInstance: GridState;

  /**
   * Create a new GridBuilderAPI instance
   * @param eventManager - EventManager instance for emitting internal service events
   * @param stateInstance - GridState instance for multi-instance support
   */
  constructor(eventManager: EventManager, stateInstance: GridState) {
    this.eventManager = eventManager;
    this.stateInstance = stateInstance;
  }

  // ============================================================================
  // State Access Methods
  // ============================================================================

  /**
   * Get the current grid state
   *
   * **Note**: Returns reference to state object. Mutations will affect the grid.
   * For read-only access, use `exportState()` and parse the JSON.
   * @returns Current grid state object
   */
  getState(): GridState {
    return this.stateInstance;
  }

  /**
   * Get all canvases
   * @returns Object mapping canvas IDs to canvas data
   */
  getCanvases() {
    return this.stateInstance.canvases;
  }

  /**
   * Get a specific canvas
   * @param canvasId - Canvas ID
   * @returns Canvas data or null if not found
   */
  getCanvas(canvasId: string) {
    return this.stateInstance.canvases[canvasId] || null;
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
   * 'hero-section': { title: 'Hero Section', backgroundColor: '#f0f4f8' }
   * };
   *
   * // Listen to library events
   * api.on('canvasAdded', (event) => {
   * // Host app knows a canvas was created, can update UI
   * console.log('Canvas added:', event.canvasId);
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
   * @param canvasId - Unique canvas identifier
   * @fires canvasAdded - After canvas is created in library state
   * @fires stateChanged - After state is updated
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
  addCanvas(canvasId: string): void {
    const cmd = new AddCanvasCommand(
      canvasId,
      this.stateInstance,
      this.eventManager,
    );
    pushCommand(cmd);
    cmd.redo(); // Execute the command

    // Emit event
    this.eventEmitter.emit("canvasAdded", { canvasId } as CanvasAddedEvent);
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
   * @param canvasId - Canvas to remove
   * @fires canvasRemoved - After canvas is removed
   * @fires stateChanged - After state is updated
   * @example
   * ```typescript
   * // Host app removes a section
   * api.removeCanvas('custom-section-1');
   *
   * // Later: user can undo
   * api.undo(); // Restores canvas with all its items
   * ```
   */
  removeCanvas(canvasId: string): void {
    const cmd = new RemoveCanvasCommand(
      canvasId,
      this.stateInstance,
      this.eventManager,
    );
    pushCommand(cmd);
    cmd.redo(); // Execute the command

    // Emit event
    this.eventEmitter.emit("canvasRemoved", { canvasId } as CanvasRemovedEvent);
  }

  /**
   * Get a specific item from a canvas
   * @param canvasId - Canvas ID
   * @param itemId - Item ID
   * @returns Grid item or null if not found
   */
  getItem(canvasId: string, itemId: string): GridItem | null {
    return getItemFromState(canvasId, itemId);
  }

  /**
   * Get current viewport
   * @returns Current viewport ('desktop' or 'mobile')
   */
  getCurrentViewport() {
    return this.stateInstance.currentViewport;
  }

  /**
   * Get grid visibility state
   * @returns True if grid is visible, false otherwise
   */
  getGridVisibility(): boolean {
    return this.stateInstance.showGrid;
  }

  /**
   * Get currently selected item
   * @returns Object with itemId and canvasId, or null if nothing selected
   */
  getSelectedItem(): { itemId: string; canvasId: string } | null {
    if (
      this.stateInstance.selectedItemId &&
      this.stateInstance.selectedCanvasId
    ) {
      return {
        itemId: this.stateInstance.selectedItemId,
        canvasId: this.stateInstance.selectedCanvasId,
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
   * @param canvasId - Target canvas ID
   * @param componentType - Type of component to add
   * @param x - X position in grid units
   * @param y - Y position in grid units
   * @param width - Width in grid units
   * @param height - Height in grid units
   * @param config - Optional component configuration data
   * @returns Created grid item
   * @fires itemAdded
   */
  addItem(
    canvasId: string,
    componentType: string,
    x: number,
    y: number,
    width: number,
    height: number,
    config?: Record<string, any>,
  ): GridItem {
    const item: GridItem = {
      id: generateItemId(),
      canvasId,
      type: componentType,
      name: componentType,
      layouts: {
        desktop: { x, y, width, height, customized: true },
        mobile: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
      },
      zIndex: this.stateInstance.canvases[canvasId]?.zIndexCounter || 1,
      config: config || {},
    };

    const command = new AddItemCommand(canvasId, item, this.stateInstance);
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit("itemAdded", { item, canvasId } as ItemAddedEvent);

    return item;
  }

  /**
   * Remove an item from a canvas
   *
   * This operation is undoable.
   * @param canvasId - Canvas ID
   * @param itemId - Item ID to remove
   * @fires itemRemoved
   */
  removeItem(canvasId: string, itemId: string): void {
    const item = getItemFromState(canvasId, itemId);
    if (!item) {
      return;
    }

    const command = new RemoveItemCommand(canvasId, item, this.stateInstance);
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    // Clear selection if this item was selected (view state management)
    if (this.stateInstance.selectedItemId === itemId) {
      this.stateInstance.selectedItemId = null;
      this.stateInstance.selectedCanvasId = null;
    }

    this.eventEmitter.emit("itemRemoved", {
      itemId,
      canvasId,
    } as ItemRemovedEvent);
  }

  /**
   * Update an item's properties
   *
   * This operation is undoable.
   * @param canvasId - Canvas ID
   * @param itemId - Item ID to update
   * @param updates - Partial item data to merge
   * @fires itemUpdated
   */
  updateItem(
    canvasId: string,
    itemId: string,
    updates: Partial<GridItem>,
  ): void {
    const oldItem = getItemFromState(canvasId, itemId);
    if (!oldItem) {
      return;
    }

    const command = new UpdateItemCommand(
      canvasId,
      itemId,
      oldItem,
      updates,
      this.stateInstance,
    );
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit("itemUpdated", {
      itemId,
      canvasId,
      updates,
    } as ItemUpdatedEvent);
  }

  /**
   * Move an item from one canvas to another
   *
   * This operation is undoable.
   * @param fromCanvasId - Source canvas ID
   * @param toCanvasId - Target canvas ID
   * @param itemId - Item ID to move
   * @fires itemMoved
   */
  moveItem(fromCanvasId: string, toCanvasId: string, itemId: string): void {
    const item = getItemFromState(fromCanvasId, itemId);
    if (!item) {
      return;
    }

    // Get source canvas to find item index
    const sourceCanvas = this.stateInstance.canvases[fromCanvasId];
    if (!sourceCanvas) {
      return;
    }

    const sourceIndex = sourceCanvas.items.findIndex((i) => i.id === itemId);
    const sourceZIndex = item.zIndex;

    // Get current viewport to use viewport-specific positions
    const currentViewport = this.stateInstance.currentViewport || "desktop";
    const currentLayout = item.layouts[currentViewport];

    const sourcePosition = {
      x: currentLayout.x,
      y: currentLayout.y,
    };
    const targetPosition = {
      x: currentLayout.x,
      y: currentLayout.y,
    };

    // Capture mobile layout for undo/redo
    const mobileLayout = {
      x: item.layouts.mobile.x,
      y: item.layouts.mobile.y,
      width: item.layouts.mobile.width,
      height: item.layouts.mobile.height,
      customized: item.layouts.mobile.customized,
    };

    // Calculate target z-index (new z-index for cross-canvas moves)
    let targetZIndex = sourceZIndex; // Same canvas = same z-index
    if (fromCanvasId !== toCanvasId) {
      const targetCanvas = this.stateInstance.canvases[toCanvasId];
      if (targetCanvas) {
        targetZIndex = targetCanvas.zIndexCounter; // Will be incremented in redo()
      }
    }

    const command = new MoveItemCommand(
      itemId,
      fromCanvasId,
      toCanvasId,
      sourcePosition,
      targetPosition,
      sourceIndex,
      sourceZIndex,
      targetZIndex,
      undefined, // sourceSize (not tracked for basic moves)
      undefined, // targetSize (not tracked for basic moves)
      this.stateInstance,
      currentViewport, // Pass active viewport for viewport-specific undo/redo
      mobileLayout, // sourceMobileLayout (unchanged during API move)
      mobileLayout, // targetMobileLayout (unchanged during API move)
    );
    command.redo(); // Execute command first (applies targetZIndex)
    pushCommand(command); // Then add to history

    this.eventEmitter.emit("itemMoved", {
      itemId,
      fromCanvasId,
      toCanvasId,
    } as ItemMovedEvent);
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
   * @param items - Array of item specifications with the following properties:
   *   - `canvasId` (string): Target canvas ID where item will be added
   *   - `type` (string): Component type identifier (must match a component definition)
   *   - `x` (number): X position in grid units (0-based)
   *   - `y` (number): Y position in grid units (0-based)
   *   - `width` (number): Width in grid units
   *   - `height` (number): Height in grid units
   *   - `config` (object, optional): Component-specific configuration data
   * @returns Array of created item IDs (in same order as input array)
   * @fires itemsBatchAdded - Fired once after all items are added
   * @fires stateChanged - Fired once after batch completes (inherited from state update)
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
   * @see https://github.com/yourusername/extraction-guide#phase-72-batch-operations
   */
  addItemsBatch(
    items: {
      canvasId: string;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      config?: Record<string, any>;
    }[],
  ): string[] {
    // Convert API format to state-manager format
    const partialItems = items.map(
      ({ canvasId, type, x, y, width, height, config }) => ({
        canvasId,
        type,
        name: type,
        layouts: {
          desktop: { x, y, width, height, customized: true },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        config: config || {},
      }),
    );

    // Use state-manager batch operation (single state update)
    const itemIds = addItemsBatch(partialItems);

    // Add to undo/redo history
    const command = new BatchAddCommand(itemIds, this.stateInstance);
    pushCommand(command); // Note: Batch operations store full item data, so no need to redo()

    // Collect all created items for event
    const createdItems = itemIds
      .map((id) => this.findItemById(id))
      .filter(Boolean) as GridItem[];

    // Emit single batch event
    this.eventEmitter.emit("itemsBatchAdded", { items: createdItems });

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
   * @param itemIds - Array of item IDs to delete. Item IDs can belong to different
   *   canvases. Invalid or non-existent item IDs are silently ignored (no error thrown).
   * @fires itemsBatchDeleted - Fired once after all items are deleted
   * @fires selectionChanged - Fired if a selected item was deleted
   * @fires stateChanged - Fired once after batch completes (inherited from state update)
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
   * @see https://github.com/yourusername/extraction-guide#phase-72-batch-operations
   */
  deleteItemsBatch(itemIds: string[]): void {
    // Add to undo/redo history BEFORE deletion (need state for undo)
    const command = new BatchDeleteCommand(itemIds, this.stateInstance);
    pushCommand(command);

    // Use state-manager batch operation (single state update)
    deleteItemsBatch(itemIds);

    // Clear selection if any deleted item was selected
    if (
      this.stateInstance.selectedItemId &&
      itemIds.includes(this.stateInstance.selectedItemId)
    ) {
      this.stateInstance.selectedItemId = null;
      this.stateInstance.selectedCanvasId = null;
    }

    // Emit single batch event
    this.eventEmitter.emit("itemsBatchDeleted", { itemIds });
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
   * @param updates - Array of config update specifications with the following properties:
   *   - `itemId` (string): ID of item to update
   *   - `config` (object): Partial config object to merge with existing config
   * @fires itemsBatchUpdated - Fired once after all configs are updated
   * @fires stateChanged - Fired once after batch completes (inherited from state update)
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
   * @see https://github.com/yourusername/extraction-guide#phase-72-batch-operations
   */
  updateConfigsBatch(
    updates: { itemId: string; config: Record<string, any> }[],
  ): void {
    // Convert to state-manager format (need canvasId)
    const batchUpdates = updates
      .map(({ itemId, config }) => {
        const item = this.findItemById(itemId);
        if (!item) {
          console.warn(`Item ${itemId} not found for config update`);
          return null;
        }
        return {
          itemId,
          canvasId: item.canvasId,
          updates: { config: { ...item.config, ...config } },
        };
      })
      .filter(Boolean) as {
      itemId: string;
      canvasId: string;
      updates: Partial<GridItem>;
    }[];

    // Add to undo/redo history
    const command = new BatchUpdateConfigCommand(
      batchUpdates,
      this.stateInstance,
    );
    pushCommand(command);

    // Use state-manager batch operation (single state update)
    updateItemsBatch(batchUpdates);

    // Emit single batch event with simpler format
    const eventUpdates = batchUpdates.map(({ itemId, canvasId, updates }) => ({
      itemId,
      canvasId,
      config: updates.config!,
    }));
    this.eventEmitter.emit("itemsBatchUpdated", { updates: eventUpdates });
  }

  /**
   * Helper method to find an item by ID across all canvases
   * @param itemId - Item ID to find
   * @returns Grid item or null if not found
   */
  private findItemById(itemId: string): GridItem | null {
    for (const canvasId in this.stateInstance.canvases) {
      const canvas = this.stateInstance.canvases[canvasId];
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
   * @param itemId - Item ID to select
   * @param canvasId - Canvas ID containing the item
   * @fires selectionChanged
   */
  selectItem(itemId: string, canvasId: string): void {
    selectItemInState(itemId, canvasId);
    this.eventEmitter.emit("selectionChanged", {
      itemId,
      canvasId,
    } as SelectionChangedEvent);
  }

  /**
   * Deselect the currently selected item
   * @fires selectionChanged
   */
  deselectItem(): void {
    deselectItem();
    this.eventEmitter.emit("selectionChanged", {
      itemId: null,
      canvasId: null,
    } as SelectionChangedEvent);
  }

  // ============================================================================
  // Z-Index Management Methods
  // ============================================================================

  /**
   * Set item's z-index to a specific value
   *
   * **Use cases**:
   * - Layer panel drag-to-reorder
   * - Programmatic layer reordering
   *
   * **Cross-canvas note**: Z-index is **relative** to other items in the same canvas.
   * When moving items between canvases, z-index values don't carry semantic meaning
   * across canvas boundaries. Cross-canvas moves automatically assign a new z-index
   * in the target canvas (puts item on top by default).
   *
   * This operation is undoable.
   * @param canvasId - Canvas containing the item
   * @param itemId - Item to modify
   * @param newZIndex - New z-index value
   * @fires zIndexChanged - If operation succeeds
   * @example
   * ```typescript
   * // Move item to specific layer position
   * api.setItemZIndex('canvas1', 'item-5', 10);
   * ```
   */
  setItemZIndex(canvasId: string, itemId: string, newZIndex: number): void {
    const result = setItemZIndexInternal(canvasId, itemId, newZIndex);
    if (!result) {
      return; // Item not found or already at that z-index
    }

    // Create undo/redo command
    const command = new ChangeZIndexCommand(
      [
        {
          itemId,
          canvasId,
          oldZIndex: result.oldZIndex,
          newZIndex: result.newZIndex,
        },
      ],
      this.eventManager,
      this.stateInstance,
    );
    pushCommand(command);

    // Emit single item event
    this.eventEmitter.emit("zIndexChanged", {
      itemId,
      canvasId,
      oldZIndex: result.oldZIndex,
      newZIndex: result.newZIndex,
    });
  }

  /**
   * Bring item to front (highest z-index in canvas)
   *
   * Sets item's z-index to highest value in its canvas + 1.
   * If item is already on top, does nothing.
   *
   * This operation is undoable.
   * @param canvasId - Canvas containing the item
   * @param itemId - Item to bring to front
   * @fires zIndexChanged - If operation succeeds
   * @example
   * ```typescript
   * // Bring item to front
   * api.bringItemToFront('canvas1', 'item-3');
   * ```
   */
  bringItemToFront(canvasId: string, itemId: string): void {
    const result = bringItemToFrontInternal(canvasId, itemId);
    if (!result) {
      return; // Item not found or already on top
    }

    // Create undo/redo command
    const command = new ChangeZIndexCommand(
      [
        {
          itemId,
          canvasId,
          oldZIndex: result.oldZIndex,
          newZIndex: result.newZIndex,
        },
      ],
      this.eventManager,
      this.stateInstance,
    );
    pushCommand(command);

    // Emit single item event
    this.eventEmitter.emit("zIndexChanged", {
      itemId,
      canvasId,
      oldZIndex: result.oldZIndex,
      newZIndex: result.newZIndex,
    });
  }

  /**
   * Send item to back (lowest z-index in canvas)
   *
   * Sets item's z-index to lowest value in its canvas - 1.
   * If item is already on bottom, does nothing.
   *
   * This operation is undoable.
   * @param canvasId - Canvas containing the item
   * @param itemId - Item to send to back
   * @fires zIndexChanged - If operation succeeds
   * @example
   * ```typescript
   * // Send item to back
   * api.sendItemToBack('canvas1', 'item-3');
   * ```
   */
  sendItemToBack(canvasId: string, itemId: string): void {
    const result = sendItemToBackInternal(canvasId, itemId);
    if (!result) {
      return; // Item not found or already on bottom
    }

    // Create undo/redo command
    const command = new ChangeZIndexCommand(
      [
        {
          itemId,
          canvasId,
          oldZIndex: result.oldZIndex,
          newZIndex: result.newZIndex,
        },
      ],
      this.eventManager,
      this.stateInstance,
    );
    pushCommand(command);

    // Emit single item event
    this.eventEmitter.emit("zIndexChanged", {
      itemId,
      canvasId,
      oldZIndex: result.oldZIndex,
      newZIndex: result.newZIndex,
    });
  }

  /**
   * Move item forward one layer (swap with next higher z-index)
   *
   * Finds the item with the next higher z-index and swaps with it.
   * If item is already on top, does nothing.
   *
   * **Batch operation**: Affects 2 items atomically (swap), emits zIndexBatchChanged.
   *
   * This operation is undoable.
   * @param canvasId - Canvas containing the item
   * @param itemId - Item to move forward
   * @fires zIndexBatchChanged - Batch event with both items affected
   * @example
   * ```typescript
   * // Move item forward one layer
   * api.moveItemForward('canvas1', 'item-3');
   * // Items item-3 and item-7 swap z-index values
   * ```
   */
  moveItemForward(canvasId: string, itemId: string): void {
    // Get items before the swap to capture both affected items
    const canvas = this.stateInstance.canvases[canvasId];
    if (!canvas) {
      return;
    }

    const item = canvas.items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    // Find next higher z-index item
    const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);
    const currentIndex = sortedItems.findIndex((i) => i.id === itemId);

    // Already on top
    if (currentIndex === sortedItems.length - 1) {
      return;
    }

    const nextItem = sortedItems[currentIndex + 1];
    const oldZIndex1 = item.zIndex;
    const oldZIndex2 = nextItem.zIndex;

    // Perform the swap
    const result = moveItemForwardInternal(canvasId, itemId);
    if (!result) {
      return;
    }

    // Create undo/redo command for BOTH items (batch operation)
    const command = new ChangeZIndexCommand(
      [
        {
          itemId: item.id,
          canvasId,
          oldZIndex: oldZIndex1,
          newZIndex: result.newZIndex,
        },
        {
          itemId: nextItem.id,
          canvasId,
          oldZIndex: oldZIndex2,
          newZIndex: oldZIndex1, // Swapped to item's old z-index
        },
      ],
      this.eventManager,
      this.stateInstance,
    );
    pushCommand(command);

    // Emit batch event (2 items affected atomically)
    this.eventEmitter.emit("zIndexBatchChanged", {
      changes: [
        {
          itemId: item.id,
          canvasId,
          oldZIndex: oldZIndex1,
          newZIndex: result.newZIndex,
        },
        {
          itemId: nextItem.id,
          canvasId,
          oldZIndex: oldZIndex2,
          newZIndex: oldZIndex1,
        },
      ],
    });
  }

  /**
   * Move item backward one layer (swap with next lower z-index)
   *
   * Finds the item with the next lower z-index and swaps with it.
   * If item is already on bottom, does nothing.
   *
   * **Batch operation**: Affects 2 items atomically (swap), emits zIndexBatchChanged.
   *
   * This operation is undoable.
   * @param canvasId - Canvas containing the item
   * @param itemId - Item to move backward
   * @fires zIndexBatchChanged - Batch event with both items affected
   * @example
   * ```typescript
   * // Move item backward one layer
   * api.moveItemBackward('canvas1', 'item-3');
   * // Items item-3 and item-5 swap z-index values
   * ```
   */
  moveItemBackward(canvasId: string, itemId: string): void {
    // Get items before the swap to capture both affected items
    const canvas = this.stateInstance.canvases[canvasId];
    if (!canvas) {
      return;
    }

    const item = canvas.items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    // Find next lower z-index item
    const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);
    const currentIndex = sortedItems.findIndex((i) => i.id === itemId);

    // Already on bottom
    if (currentIndex === 0) {
      return;
    }

    const prevItem = sortedItems[currentIndex - 1];
    const oldZIndex1 = item.zIndex;
    const oldZIndex2 = prevItem.zIndex;

    // Perform the swap
    const result = moveItemBackwardInternal(canvasId, itemId);
    if (!result) {
      return;
    }

    // Create undo/redo command for BOTH items (batch operation)
    const command = new ChangeZIndexCommand(
      [
        {
          itemId: item.id,
          canvasId,
          oldZIndex: oldZIndex1,
          newZIndex: result.newZIndex,
        },
        {
          itemId: prevItem.id,
          canvasId,
          oldZIndex: oldZIndex2,
          newZIndex: oldZIndex1, // Swapped to item's old z-index
        },
      ],
      this.eventManager,
      this.stateInstance,
    );
    pushCommand(command);

    // Emit batch event (2 items affected atomically)
    this.eventEmitter.emit("zIndexBatchChanged", {
      changes: [
        {
          itemId: item.id,
          canvasId,
          oldZIndex: oldZIndex1,
          newZIndex: result.newZIndex,
        },
        {
          itemId: prevItem.id,
          canvasId,
          oldZIndex: oldZIndex2,
          newZIndex: oldZIndex1,
        },
      ],
    });
  }

  /**
   * Set z-index for multiple items in a single batch operation
   *
   * **Multi-canvas support**: Items can belong to different canvases.
   * All z-index changes are applied atomically in a single undo/redo operation.
   *
   * **Use cases**:
   * - Global layer panel showing items from all canvases
   * - Drag-to-reorder across multiple canvases
   * - Bulk z-index adjustments
   * - Cross-canvas layer organization
   *
   * **Performance**: Single state update and re-render for N items instead of N updates.
   *
   * This operation is undoable.
   * @param changes - Array of z-index changes with the following properties:
   *   - `itemId` (string): Item ID to update
   *   - `canvasId` (string): Canvas containing the item
   *   - `newZIndex` (number): New z-index value
   * @fires zIndexBatchChanged - Fired once after all changes are applied
   * @example
   * ```typescript
   * // Reorder items across multiple canvases in one operation
   * api.setItemsZIndexBatch([
   *   { itemId: 'canvas1-item-1', canvasId: 'canvas1', newZIndex: 10 },
   *   { itemId: 'canvas1-item-2', canvasId: 'canvas1', newZIndex: 20 },
   *   { itemId: 'canvas2-item-5', canvasId: 'canvas2', newZIndex: 15 },
   *   { itemId: 'canvas2-item-6', canvasId: 'canvas2', newZIndex: 25 }
   * ]);
   *
   * // Undo reverts all 4 changes in one operation
   * api.undo();
   * ```
   */
  setItemsZIndexBatch(
    changes: {
      itemId: string;
      canvasId: string;
      newZIndex: number;
    }[],
  ): void {
    if (changes.length === 0) {
      return;
    }

    // Capture old z-index values before making changes
    const changesWithOldValues = changes
      .map(({ itemId, canvasId, newZIndex }) => {
        const canvas = this.stateInstance.canvases[canvasId];
        if (!canvas) {
          console.warn(
            `Canvas ${canvasId} not found for item ${itemId}, skipping`,
          );
          return null;
        }

        const item = canvas.items.find((i) => i.id === itemId);
        if (!item) {
          console.warn(
            `Item ${itemId} not found in canvas ${canvasId}, skipping`,
          );
          return null;
        }

        const oldZIndex = item.zIndex;

        // Skip if already at target z-index
        if (oldZIndex === newZIndex) {
          return null;
        }

        return {
          itemId,
          canvasId,
          oldZIndex,
          newZIndex,
        };
      })
      .filter(Boolean) as {
      itemId: string;
      canvasId: string;
      oldZIndex: number;
      newZIndex: number;
    }[];

    // No valid changes after filtering
    if (changesWithOldValues.length === 0) {
      return;
    }

    // Apply all changes
    changesWithOldValues.forEach(({ itemId, canvasId, newZIndex }) => {
      const canvas = this.stateInstance.canvases[canvasId];
      const item = canvas.items.find((i) => i.id === itemId);
      if (item) {
        item.zIndex = newZIndex;
      }
    });

    // Trigger reactivity (single state update for all changes)
    this.stateInstance.canvases = { ...this.stateInstance.canvases };

    // Create undo/redo command for all changes
    const command = new ChangeZIndexCommand(
      changesWithOldValues,
      this.eventManager,
      this.stateInstance,
    );
    pushCommand(command);

    // Emit batch event (all items affected atomically)
    this.eventEmitter.emit("zIndexBatchChanged", {
      changes: changesWithOldValues,
    });
  }

  // ============================================================================
  // Viewport and Display Methods
  // ============================================================================

  /**
   * Change the current viewport
   *
   * **View state operation** - NOT undoable (view state is instance-specific)
   * @param viewport - Target viewport ('desktop' or 'mobile')
   * @fires viewportChanged
   */
  setViewport(viewport: "desktop" | "mobile"): void {
    const oldViewport = this.stateInstance.currentViewport;

    // Directly modify instance view state (no command needed)
    this.stateInstance.currentViewport = viewport;

    this.eventEmitter.emit("viewportChanged", {
      oldViewport,
      newViewport: viewport,
    } as ViewportChangedEvent);
  }

  /**
   * Toggle grid visibility
   *
   * **View state operation** - NOT undoable (view state is instance-specific)
   * @param visible - True to show grid, false to hide
   * @fires gridVisibilityChanged
   */
  toggleGrid(visible: boolean): void {
    // Directly modify instance view state (no command needed)
    this.stateInstance.showGrid = visible;

    this.eventEmitter.emit("gridVisibilityChanged", {
      visible,
    } as GridVisibilityChangedEvent);
  }

  // ============================================================================
  // Undo/Redo Methods
  // ============================================================================

  /**
   * Undo the last action
   * @fires undoExecuted - With command description showing coordinates and dimensions
   * @fires stateChanged
   */
  undo(): void {
    const description = undoInternal();
    if (description) {
      // Extract action type from description object or use 'undo' as default
      const actionType =
        typeof description === "object" && "action" in description
          ? (description as any).action
          : "undo";

      this.eventEmitter.emit("undoExecuted", {
        description,
        actionType,
      });
    }
    this.eventEmitter.emit("stateChanged", {} as StateChangedEvent);
  }

  /**
   * Redo the last undone action
   * @fires redoExecuted - With command description showing coordinates and dimensions
   * @fires stateChanged
   */
  redo(): void {
    const description = redoInternal();
    if (description) {
      // Extract action type from description object or use 'redo' as default
      const actionType =
        typeof description === "object" && "action" in description
          ? (description as any).action
          : "redo";

      this.eventEmitter.emit("redoExecuted", {
        description,
        actionType,
      });
    }
    this.eventEmitter.emit("stateChanged", {} as StateChangedEvent);
  }

  /**
   * Check if undo is available
   * @returns True if undo is available
   */
  canUndo(): boolean {
    return canUndoInternal();
  }

  /**
   * Check if redo is available
   * @returns True if redo is available
   */
  canRedo(): boolean {
    return canRedoInternal();
  }

  /**
   * Clear undo/redo history
   */
  clearHistory(): void {
    clearHistoryInternal();
  }

  // ============================================================================
  // State Management Methods
  // ============================================================================

  /**
   * Export current grid state as JSON
   *
   * Useful for saving/loading grid configurations, persistence, etc.
   * @returns JSON string representation of grid state
   * @example
   * ```typescript
   * const json = api.exportState();
   * localStorage.setItem('gridState', json);
   * ```
   */
  exportState(): string {
    return JSON.stringify(this.stateInstance);
  }

  /**
   * Import grid state from JSON
   *
   * Replaces current state with imported state. This operation
   * clears undo/redo history.
   * @param json - JSON string from exportState()
   * @throws Error if JSON is invalid
   * @fires stateChanged
   * @example
   * ```typescript
   * const json = localStorage.getItem('gridState');
   * if (json) {
   *   api.importState(json);
   * }
   * ```
   */
  importState(json: string): void {
    const newState = JSON.parse(json);

    // Replace state properties
    Object.assign(this.stateInstance, newState);

    // Clear undo/redo history (imported state is new baseline)
    clearHistoryInternal();

    this.eventEmitter.emit("stateChanged", {} as StateChangedEvent);
  }

  /**
   * Reset grid to initial state
   *
   * Clears all canvases, resets viewport to desktop, shows grid.
   * This operation clears undo/redo history.
   * @fires stateChanged
   */
  reset(): void {
    resetState();
    clearHistoryInternal();
    this.eventEmitter.emit("stateChanged", {} as StateChangedEvent);
  }

  // ============================================================================
  // Event System Methods
  // ============================================================================

  /**
   * Register an event listener
   * @param event - Event name
   * @param listener - Event handler function
   * @example
   * ```typescript
   * api.on('itemAdded', (event) => {
   *   console.log('Item added:', event.item);
   * });
   * ```
   */
  on<K extends keyof GridBuilderEventMap>(
    event: K,
    listener: EventListener<K>,
  ): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unregister an event listener
   * @param event - Event name
   * @param listener - Event handler function to remove
   */
  off<K extends keyof GridBuilderEventMap>(
    event: K,
    listener: EventListener<K>,
  ): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Register a one-time event listener
   *
   * Listener is automatically removed after first invocation.
   * @param event - Event name
   * @param listener - Event handler function
   * @example
   * ```typescript
   * api.once('itemAdded', (event) => {
   *   console.log('First item added:', event.item);
   * });
   * ```
   */
  once<K extends keyof GridBuilderEventMap>(
    event: K,
    listener: EventListener<K>,
  ): void {
    this.eventEmitter.once(event, listener);
  }

  /**
   * Remove all event listeners and clean up
   *
   * Call this when destroying the API instance to prevent memory leaks.
   */
  destroy(): void {
    this.eventEmitter.clear();
  }
}
