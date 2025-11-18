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

import {
  deselectItem,
  generateItemId,
  getItem as getItemFromState,
  GridItem,
  gridState,
  GridState,
  reset as resetState,
  selectItem as selectItemInState,
} from './state-manager';
import {
  AddItemCommand,
  MoveItemCommand,
  RemoveItemCommand,
  SetCanvasBackgroundCommand,
  SetViewportCommand,
  ToggleGridCommand,
  UpdateItemCommand,
} from './undo-redo-commands';
import {
  canRedo as canRedoInternal,
  canUndo as canUndoInternal,
  clearHistory as clearHistoryInternal,
  pushCommand,
  redo as redoInternal,
  undo as undoInternal,
} from './undo-redo';
import {
  CanvasBackgroundChangedEvent,
  GridBuilderEventMap,
  GridVisibilityChangedEvent,
  ItemAddedEvent,
  ItemMovedEvent,
  ItemRemovedEvent,
  ItemUpdatedEvent,
  SelectionChangedEvent,
  StateChangedEvent,
  ViewportChangedEvent,
} from '../types/events';

/**
 * Event listener function type
 */
type EventListener<K extends keyof GridBuilderEventMap> = (event: GridBuilderEventMap[K]) => void;

/**
 * Event emitter for grid builder events
 *
 * Uses a Map of event name → Set of listeners for efficient
 * listener management and notification
 */
class EventEmitter {
  private listeners: Map<keyof GridBuilderEventMap, Set<EventListener<any>>> = new Map();

  /**
   * Register an event listener
   */
  on<K extends keyof GridBuilderEventMap>(event: K, listener: EventListener<K>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Unregister an event listener
   */
  off<K extends keyof GridBuilderEventMap>(event: K, listener: EventListener<K>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Register a one-time event listener
   */
  once<K extends keyof GridBuilderEventMap>(event: K, listener: EventListener<K>): void {
    const onceListener = ((eventData: GridBuilderEventMap[K]) => {
      this.off(event, onceListener);
      listener(eventData);
    }) as EventListener<K>;

    this.on(event, onceListener);
  }

  /**
   * Emit an event to all registered listeners
   */
  emit<K extends keyof GridBuilderEventMap>(event: K, data: GridBuilderEventMap[K]): void {
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
  getState(): GridState {
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
  getCanvas(canvasId: string) {
    return gridState.canvases[canvasId] || null;
  }

  /**
   * Get a specific item from a canvas
   *
   * @param canvasId - Canvas ID
   * @param itemId - Item ID
   * @returns Grid item or null if not found
   */
  getItem(canvasId: string, itemId: string): GridItem | null {
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
  getGridVisibility(): boolean {
    return gridState.showGrid;
  }

  /**
   * Get currently selected item
   *
   * @returns Object with itemId and canvasId, or null if nothing selected
   */
  getSelectedItem(): { itemId: string; canvasId: string } | null {
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
  addItem(
    canvasId: string,
    componentType: string,
    x: number,
    y: number,
    width: number,
    height: number,
    config?: Record<string, any>
  ): GridItem {
    const item: GridItem = {
      id: generateItemId(),
      canvasId,
      type: componentType,
      name: componentType,
      layouts: {
        desktop: { x, y, width, height },
        mobile: { x: null, y: null, width: null, height: null, customized: false },
      },
      zIndex: gridState.canvases[canvasId]?.zIndexCounter || 1,
      config: config || {},
    };

    const command = new AddItemCommand(canvasId, item);
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit('itemAdded', { item, canvasId } as ItemAddedEvent);

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
  removeItem(canvasId: string, itemId: string): void {
    const item = getItemFromState(canvasId, itemId);
    if (!item) {
      return;
    }

    const command = new RemoveItemCommand(canvasId, item);
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit('itemRemoved', { itemId, canvasId } as ItemRemovedEvent);
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
  updateItem(canvasId: string, itemId: string, updates: Partial<GridItem>): void {
    const oldItem = getItemFromState(canvasId, itemId);
    if (!oldItem) {
      return;
    }

    const command = new UpdateItemCommand(canvasId, itemId, oldItem, updates);
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit('itemUpdated', { itemId, canvasId, updates } as ItemUpdatedEvent);
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
  moveItem(fromCanvasId: string, toCanvasId: string, itemId: string): void {
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

    const command = new MoveItemCommand(
      itemId,
      fromCanvasId,
      toCanvasId,
      sourcePosition,
      targetPosition,
      sourceIndex
    );
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit('itemMoved', { itemId, fromCanvasId, toCanvasId } as ItemMovedEvent);
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
  selectItem(itemId: string, canvasId: string): void {
    selectItemInState(itemId, canvasId);
    this.eventEmitter.emit('selectionChanged', { itemId, canvasId } as SelectionChangedEvent);
  }

  /**
   * Deselect the currently selected item
   *
   * @emits selectionChanged
   */
  deselectItem(): void {
    deselectItem();
    this.eventEmitter.emit('selectionChanged', { itemId: null, canvasId: null } as SelectionChangedEvent);
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
  setViewport(viewport: 'desktop' | 'mobile'): void {
    const oldViewport = gridState.currentViewport;
    const command = new SetViewportCommand(oldViewport, viewport);
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit('viewportChanged', { oldViewport, newViewport: viewport } as ViewportChangedEvent);
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
  toggleGrid(visible: boolean): void {
    const oldValue = gridState.showGrid;
    const command = new ToggleGridCommand(oldValue, visible);
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit('gridVisibilityChanged', { visible } as GridVisibilityChangedEvent);
  }

  /**
   * Set canvas background color
   *
   * This operation is undoable.
   *
   * @param canvasId - Canvas ID
   * @param color - CSS color string (hex, rgb, etc.)
   *
   * @emits canvasBackgroundChanged
   */
  setCanvasBackground(canvasId: string, color: string): void {
    const canvas = gridState.canvases[canvasId];
    if (!canvas) {
      return;
    }

    const oldColor = canvas.backgroundColor;
    const command = new SetCanvasBackgroundCommand(canvasId, oldColor, color);
    command.redo(); // Execute command first
    pushCommand(command); // Then add to history

    this.eventEmitter.emit('canvasBackgroundChanged', { canvasId, color } as CanvasBackgroundChangedEvent);
  }

  // ============================================================================
  // Undo/Redo Methods
  // ============================================================================

  /**
   * Undo the last action
   *
   * @emits stateChanged
   */
  undo(): void {
    undoInternal();
    this.eventEmitter.emit('stateChanged', {} as StateChangedEvent);
  }

  /**
   * Redo the last undone action
   *
   * @emits stateChanged
   */
  redo(): void {
    redoInternal();
    this.eventEmitter.emit('stateChanged', {} as StateChangedEvent);
  }

  /**
   * Check if undo is available
   *
   * @returns True if undo is available
   */
  canUndo(): boolean {
    return canUndoInternal();
  }

  /**
   * Check if redo is available
   *
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
   *
   * @returns JSON string representation of grid state
   *
   * @example
   * ```typescript
   * const json = api.exportState();
   * localStorage.setItem('gridState', json);
   * ```
   */
  exportState(): string {
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
  importState(json: string): void {
    const newState = JSON.parse(json);

    // Replace state properties
    Object.assign(gridState, newState);

    // Clear undo/redo history (imported state is new baseline)
    clearHistoryInternal();

    this.eventEmitter.emit('stateChanged', {} as StateChangedEvent);
  }

  /**
   * Reset grid to initial state
   *
   * Clears all canvases, resets viewport to desktop, shows grid.
   * This operation clears undo/redo history.
   *
   * @emits stateChanged
   */
  reset(): void {
    resetState();
    clearHistoryInternal();
    this.eventEmitter.emit('stateChanged', {} as StateChangedEvent);
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
  on<K extends keyof GridBuilderEventMap>(event: K, listener: EventListener<K>): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unregister an event listener
   *
   * @param event - Event name
   * @param listener - Event handler function to remove
   */
  off<K extends keyof GridBuilderEventMap>(event: K, listener: EventListener<K>): void {
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
  once<K extends keyof GridBuilderEventMap>(event: K, listener: EventListener<K>): void {
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
