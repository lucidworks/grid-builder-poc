/**
 * Grid Builder Event Types
 * ==========================
 *
 * Type definitions for all events emitted by the grid builder.
 * Used for event subscriptions via GridBuilderAPI.on() / .off()
 */
import { GridItem } from '../services/state-manager';
/**
 * Component Added Event
 * ======================
 *
 * Fired when a component is added to a canvas.
 *
 * **Triggers**:
 * - User drags component from palette
 * - Programmatic add via API.addComponent()
 * - Undo delete operation
 * - Import/restore state
 *
 * **Use cases**:
 * - Track component usage (analytics)
 * - Validate component placement
 * - Auto-configure new components
 * - Sync with external systems
 *
 * @example
 * ```typescript
 * api.on('componentAdded', (event) => {
 *   analytics.track('Component Added', {
 *     type: event.item.type,
 *     canvasId: event.canvasId,
 *     position: event.item.layouts.desktop
 *   });
 * });
 * ```
 */
export interface ComponentAddedEvent {
    /** Canvas ID where component was added */
    canvasId: string;
    /** Complete GridItem object for added component */
    item: GridItem;
}
/**
 * Component Deleted Event
 * ========================
 *
 * Fired when a component is removed from a canvas.
 *
 * **Triggers**:
 * - User deletes component (Delete key or button)
 * - Programmatic delete via API.deleteComponent()
 * - Undo add operation
 * - Clear canvas
 *
 * **Use cases**:
 * - Track deletions (analytics)
 * - Cleanup associated resources
 * - Warn before destructive action
 * - Sync with external systems
 *
 * @example
 * ```typescript
 * api.on('componentDeleted', (event) => {
 *   // Cleanup resources
 *   if (event.item.type === 'video') {
 *     videoPlayerManager.cleanup(event.itemId);
 *   }
 *
 *   analytics.track('Component Deleted', {
 *     type: event.item.type,
 *     canvasId: event.canvasId
 *   });
 * });
 * ```
 */
export interface ComponentDeletedEvent {
    /** Canvas ID where component was deleted from */
    canvasId: string;
    /** ID of deleted component */
    itemId: string;
    /** Complete GridItem snapshot before deletion (for undo) */
    item: GridItem;
}
/**
 * Component Dragged Event
 * ========================
 *
 * Fired after a drag operation completes.
 *
 * **Triggers**:
 * - User finishes dragging component (mouse/touch up)
 * - NOT fired during drag (only on end)
 *
 * **Use cases**:
 * - Track repositioning (analytics)
 * - Validate new position
 * - Auto-align with other components
 * - Detect cross-canvas moves
 *
 * @example
 * ```typescript
 * api.on('componentDragged', (event) => {
 *   const distance = Math.sqrt(
 *     Math.pow(event.newPosition.x - event.oldPosition.x, 2) +
 *     Math.pow(event.newPosition.y - event.oldPosition.y, 2)
 *   );
 *
 *   analytics.track('Component Dragged', {
 *     itemId: event.itemId,
 *     distance,
 *     crossCanvas: event.canvasId !== event.item.canvasId
 *   });
 * });
 * ```
 */
export interface ComponentDraggedEvent {
    /** Canvas ID where component ended (may differ from start if cross-canvas drag) */
    canvasId: string;
    /** ID of dragged component */
    itemId: string;
    /** Component state after drag */
    item: GridItem;
    /** Position before drag (grid units) */
    oldPosition: {
        x: number;
        y: number;
    };
    /** Position after drag (grid units) */
    newPosition: {
        x: number;
        y: number;
    };
}
/**
 * Component Resized Event
 * ========================
 *
 * Fired after a resize operation completes.
 *
 * **Triggers**:
 * - User finishes resizing component (mouse/touch up on resize handle)
 * - NOT fired during resize (only on end)
 *
 * **Use cases**:
 * - Track resize operations (analytics)
 * - Validate new size
 * - Auto-adjust content layout
 * - Detect size constraints violations
 *
 * @example
 * ```typescript
 * api.on('componentResized', (event) => {
 *   const oldArea = event.oldSize.width * event.oldSize.height;
 *   const newArea = event.newSize.width * event.newSize.height;
 *   const percentChange = ((newArea - oldArea) / oldArea) * 100;
 *
 *   analytics.track('Component Resized', {
 *     itemId: event.itemId,
 *     type: event.item.type,
 *     percentChange: percentChange.toFixed(1)
 *   });
 * });
 * ```
 */
export interface ComponentResizedEvent {
    /** Canvas ID containing component */
    canvasId: string;
    /** ID of resized component */
    itemId: string;
    /** Component state after resize */
    item: GridItem;
    /** Size before resize (grid units) */
    oldSize: {
        width: number;
        height: number;
    };
    /** Size after resize (grid units) */
    newSize: {
        width: number;
        height: number;
    };
}
/**
 * Component Selected Event
 * =========================
 *
 * Fired when a component is selected.
 *
 * **Triggers**:
 * - User clicks component
 * - Programmatic selection via API
 * - Keyboard navigation
 *
 * **Use cases**:
 * - Track selections (analytics)
 * - Show custom selection UI
 * - Enable contextual actions
 * - Update config panel
 *
 * @example
 * ```typescript
 * api.on('componentSelected', (event) => {
 *   // Show custom selection indicator
 *   const canvas = api.getCanvasElement(event.canvasId);
 *   const indicator = document.createElement('div');
 *   indicator.id = 'custom-selection-indicator';
 *   indicator.textContent = `Selected: ${event.item.name}`;
 *   canvas?.appendChild(indicator);
 * });
 * ```
 */
export interface ComponentSelectedEvent {
    /** Canvas ID containing selected component */
    canvasId: string;
    /** ID of selected component */
    itemId: string;
    /** Complete GridItem object for selected component */
    item: GridItem;
}
/**
 * Component Deselected Event
 * ===========================
 *
 * Fired when component selection is cleared.
 *
 * **Triggers**:
 * - User clicks canvas background
 * - Escape key pressed
 * - Component deleted while selected
 * - New component selected (fires before componentSelected)
 *
 * **Use cases**:
 * - Remove custom selection UI
 * - Close config panels
 * - Clear selection state in plugins
 *
 * @example
 * ```typescript
 * api.on('componentDeselected', () => {
 *   // Remove custom selection indicator
 *   const indicator = document.getElementById('custom-selection-indicator');
 *   indicator?.remove();
 * });
 * ```
 */
export interface ComponentDeselectedEvent {
    /** ID of deselected component (null if nothing was selected) */
    previousItemId: string | null;
    /** Canvas ID of deselected component (null if nothing was selected) */
    previousCanvasId: string | null;
}
/**
 * Config Changed Event
 * =====================
 *
 * Fired when component configuration is saved.
 *
 * **Triggers**:
 * - User saves config panel changes
 * - Programmatic config update via API.updateConfig()
 * - Undo/redo config change
 *
 * **Use cases**:
 * - Track config changes (analytics)
 * - Validate configuration
 * - Sync with external systems
 * - Trigger dependent updates
 *
 * @example
 * ```typescript
 * api.on('configChanged', (event) => {
 *   // Track what changed
 *   const changedFields = Object.keys(event.newConfig).filter(
 *     key => event.newConfig[key] !== event.oldConfig?.[key]
 *   );
 *
 *   analytics.track('Config Changed', {
 *     itemId: event.itemId,
 *     type: event.item.type,
 *     changedFields
 *   });
 * });
 * ```
 */
export interface ConfigChangedEvent {
    /** Canvas ID containing component */
    canvasId: string;
    /** ID of component whose config changed */
    itemId: string;
    /** Component state after config change */
    item: GridItem;
    /** Configuration before change (for undo) */
    oldConfig: Record<string, any>;
    /** Configuration after change */
    newConfig: Record<string, any>;
}
/**
 * Drag Start Event
 * =================
 *
 * Fired when drag operation begins.
 *
 * **Triggers**:
 * - User starts dragging component (mouse/touch down + move)
 * - Fires ONCE at start (not continuously during drag)
 *
 * **Use cases**:
 * - Start performance monitoring
 * - Show drag preview/ghost
 * - Disable other interactions
 * - Track drag start time
 *
 * @example
 * ```typescript
 * let dragStartTime: number;
 *
 * api.on('dragStart', (event) => {
 *   dragStartTime = Date.now();
 *   console.log(`Started dragging ${event.item.type}`);
 * });
 *
 * api.on('dragEnd', () => {
 *   const duration = Date.now() - dragStartTime;
 *   console.log(`Drag took ${duration}ms`);
 * });
 * ```
 */
export interface DragStartEvent {
    /** Canvas ID where drag started */
    canvasId: string;
    /** ID of component being dragged */
    itemId: string;
    /** Component being dragged */
    item: GridItem;
    /** Starting position (grid units) */
    position: {
        x: number;
        y: number;
    };
}
/**
 * Drag End Event
 * ===============
 *
 * Fired when drag operation ends.
 *
 * **Triggers**:
 * - User finishes dragging (mouse/touch up)
 * - Fires ONCE at end (after position updated)
 *
 * **Note**: Also fires 'componentDragged' event with position details
 *
 * **Use cases**:
 * - Stop performance monitoring
 * - Hide drag preview/ghost
 * - Re-enable interactions
 * - Calculate drag metrics
 *
 * @example
 * ```typescript
 * api.on('dragEnd', (event) => {
 *   console.log(`Dropped ${event.item.type} at (${event.position.x}, ${event.position.y})`);
 * });
 * ```
 */
export interface DragEndEvent {
    /** Canvas ID where drag ended */
    canvasId: string;
    /** ID of dragged component */
    itemId: string;
    /** Component after drag */
    item: GridItem;
    /** Final position (grid units) */
    position: {
        x: number;
        y: number;
    };
}
/**
 * Resize Start Event
 * ===================
 *
 * Fired when resize operation begins.
 *
 * **Triggers**:
 * - User starts resizing (mouse/touch down on resize handle + move)
 * - Fires ONCE at start (not continuously during resize)
 *
 * **Use cases**:
 * - Start performance monitoring
 * - Show resize preview
 * - Disable other interactions
 * - Track resize start time
 *
 * @example
 * ```typescript
 * let resizeStartTime: number;
 *
 * api.on('resizeStart', (event) => {
 *   resizeStartTime = Date.now();
 *   console.log(`Started resizing ${event.item.type} from ${event.size.width}×${event.size.height}`);
 * });
 * ```
 */
export interface ResizeStartEvent {
    /** Canvas ID containing component */
    canvasId: string;
    /** ID of component being resized */
    itemId: string;
    /** Component being resized */
    item: GridItem;
    /** Starting size (grid units) */
    size: {
        width: number;
        height: number;
    };
}
/**
 * Resize End Event
 * =================
 *
 * Fired when resize operation ends.
 *
 * **Triggers**:
 * - User finishes resizing (mouse/touch up on handle)
 * - Fires ONCE at end (after size updated)
 *
 * **Note**: Also fires 'componentResized' event with size details
 *
 * **Use cases**:
 * - Stop performance monitoring
 * - Hide resize preview
 * - Re-enable interactions
 * - Calculate resize metrics
 *
 * @example
 * ```typescript
 * api.on('resizeEnd', (event) => {
 *   const area = event.size.width * event.size.height;
 *   console.log(`Resized to ${event.size.width}×${event.size.height} (${area} grid units²)`);
 * });
 * ```
 */
export interface ResizeEndEvent {
    /** Canvas ID containing component */
    canvasId: string;
    /** ID of resized component */
    itemId: string;
    /** Component after resize */
    item: GridItem;
    /** Final size (grid units) */
    size: {
        width: number;
        height: number;
    };
}
/**
 * Viewport Changed Event
 * =======================
 *
 * Fired when viewport mode switches (desktop ↔ mobile).
 *
 * **Triggers**:
 * - User clicks viewport toggle button
 * - Programmatic viewport change
 *
 * **Use cases**:
 * - Track viewport usage (analytics)
 * - Adjust plugin UI for viewport
 * - Warn about mobile layout customization
 * - Update external preview
 *
 * @example
 * ```typescript
 * api.on('viewportChanged', (event) => {
 *   console.log(`Switched from ${event.oldViewport} to ${event.newViewport}`);
 *
 *   // Update plugin UI
 *   if (event.newViewport === 'mobile') {
 *     pluginPanel.classList.add('mobile-mode');
 *   } else {
 *     pluginPanel.classList.remove('mobile-mode');
 *   }
 * });
 * ```
 */
export interface ViewportChangedEvent {
    /** Viewport before change */
    oldViewport: 'desktop' | 'mobile';
    /** Viewport after change */
    newViewport: 'desktop' | 'mobile';
}
/**
 * Undo Event
 * ===========
 *
 * Fired when undo operation is performed.
 *
 * **Triggers**:
 * - User presses Ctrl+Z / Cmd+Z
 * - Undo button clicked
 * - Programmatic undo via API
 *
 * **Use cases**:
 * - Track undo usage (analytics)
 * - Sync undo with external systems
 * - Update custom UI state
 *
 * @example
 * ```typescript
 * api.on('undo', (event) => {
 *   console.log(`Undid: ${event.description}`);
 *   statusBar.showMessage(`Undid ${event.description}`);
 * });
 * ```
 */
export interface UndoEvent {
    /** Human-readable description of undone action */
    description: string;
    /** Action type ('add', 'delete', 'drag', 'resize', 'config', etc.) */
    actionType: string;
}
/**
 * Redo Event
 * ===========
 *
 * Fired when redo operation is performed.
 *
 * **Triggers**:
 * - User presses Ctrl+Shift+Z / Cmd+Shift+Z
 * - Redo button clicked
 * - Programmatic redo via API
 *
 * **Use cases**:
 * - Track redo usage (analytics)
 * - Sync redo with external systems
 * - Update custom UI state
 *
 * @example
 * ```typescript
 * api.on('redo', (event) => {
 *   console.log(`Redid: ${event.description}`);
 *   statusBar.showMessage(`Redid ${event.description}`);
 * });
 * ```
 */
export interface RedoEvent {
    /** Human-readable description of redone action */
    description: string;
    /** Action type ('add', 'delete', 'drag', 'resize', 'config', etc.) */
    actionType: string;
}
/**
 * Components Batch Added Event
 * =============================
 *
 * Fired when multiple components are added in single batch operation.
 *
 * **Triggers**:
 * - API.addComponentsBatch() called
 * - Template/preset loading
 * - Import saved layout
 *
 * **Use cases**:
 * - Track batch operations (analytics)
 * - Show batch progress
 * - Optimize bulk operations
 *
 * @example
 * ```typescript
 * api.on('componentsBatchAdded', (event) => {
 *   console.log(`Added ${event.items.length} components in batch`);
 *   statusBar.showMessage(`Loaded template with ${event.items.length} components`);
 * });
 * ```
 */
export interface ComponentsBatchAddedEvent {
    /** Array of all added GridItem objects */
    items: GridItem[];
}
/**
 * Components Batch Deleted Event
 * ===============================
 *
 * Fired when multiple components are deleted in single batch operation.
 *
 * **Triggers**:
 * - API.deleteComponentsBatch() called
 * - Clear canvas
 * - Bulk cleanup
 *
 * **Use cases**:
 * - Track batch deletions (analytics)
 * - Warn before destructive batch action
 * - Cleanup resources
 *
 * @example
 * ```typescript
 * api.on('componentsBatchDeleted', (event) => {
 *   console.log(`Deleted ${event.itemIds.length} components in batch`);
 *
 *   // Cleanup resources
 *   event.itemIds.forEach(itemId => {
 *     resourceManager.cleanup(itemId);
 *   });
 * });
 * ```
 */
export interface ComponentsBatchDeletedEvent {
    /** Array of deleted item IDs */
    itemIds: string[];
}
/**
 * Configs Batch Changed Event
 * ============================
 *
 * Fired when multiple component configs are updated in single batch operation.
 *
 * **Triggers**:
 * - API.updateConfigsBatch() called
 * - Theme changes
 * - Bulk property updates
 *
 * **Use cases**:
 * - Track batch config changes (analytics)
 * - Optimize bulk updates
 * - Sync with external systems
 *
 * @example
 * ```typescript
 * api.on('configsBatchChanged', (event) => {
 *   console.log(`Updated configs for ${event.updates.length} components`);
 *   statusBar.showMessage(`Applied theme to ${event.updates.length} components`);
 * });
 * ```
 */
export interface ConfigsBatchChangedEvent {
    /** Array of { itemId, oldConfig, newConfig } update records */
    updates: Array<{
        itemId: string;
        oldConfig: Record<string, any>;
        newConfig: Record<string, any>;
    }>;
}
/**
 * Event Map
 * ==========
 *
 * Type-safe mapping of event names to event data types.
 * Used internally for type checking event subscriptions.
 *
 * **Example usage**:
 * ```typescript
 * api.on<ComponentAddedEvent>('componentAdded', (event) => {
 *   // event is typed as ComponentAddedEvent
 *   console.log(event.item.type);
 * });
 * ```
 */
export interface EventMap {
    componentAdded: ComponentAddedEvent;
    componentDeleted: ComponentDeletedEvent;
    componentDragged: ComponentDraggedEvent;
    componentResized: ComponentResizedEvent;
    componentSelected: ComponentSelectedEvent;
    componentDeselected: ComponentDeselectedEvent;
    configChanged: ConfigChangedEvent;
    dragStart: DragStartEvent;
    dragEnd: DragEndEvent;
    resizeStart: ResizeStartEvent;
    resizeEnd: ResizeEndEvent;
    viewportChanged: ViewportChangedEvent;
    undo: UndoEvent;
    redo: RedoEvent;
    componentsBatchAdded: ComponentsBatchAddedEvent;
    componentsBatchDeleted: ComponentsBatchDeletedEvent;
    configsBatchChanged: ConfigsBatchChangedEvent;
}
/**
 * GridBuilderAPI Event Types
 * ============================
 *
 * Additional event types used by the GridBuilderAPI.
 * These follow a different naming convention (item* vs component*)
 * for consistency with the API method names.
 */
/** Fired when an item is added to a canvas */
export interface ItemAddedEvent {
    canvasId: string;
    item: GridItem;
}
/** Fired when an item is removed from a canvas */
export interface ItemRemovedEvent {
    canvasId: string;
    itemId: string;
}
/** Fired when an item is updated */
export interface ItemUpdatedEvent {
    canvasId: string;
    itemId: string;
    updates: Partial<GridItem>;
}
/** Fired when an item is moved between canvases */
export interface ItemMovedEvent {
    itemId: string;
    fromCanvasId: string;
    toCanvasId: string;
}
/** Fired when item selection changes */
export interface SelectionChangedEvent {
    itemId: string | null;
    canvasId: string | null;
}
/** Fired when grid visibility changes */
export interface GridVisibilityChangedEvent {
    visible: boolean;
}
/**
 * Canvas Added Event
 * ===================
 *
 * Fired when a canvas is added to the library state.
 *
 * **Library emits**: canvasId only (no metadata)
 * **Host app responsibility**: Manage canvas metadata (title, colors, etc.) separately
 *
 * @example
 * ```typescript
 * // Host app maintains canvas metadata
 * const canvasMetadata = {};
 *
 * api.on('canvasAdded', (event) => {
 *   // Host app can add its own metadata
 *   canvasMetadata[event.canvasId] = {
 *     title: 'New Section',
 *     backgroundColor: '#f5f5f5'
 *   };
 * });
 * ```
 */
export interface CanvasAddedEvent {
    canvasId: string;
}
/**
 * Canvas Removed Event
 * =====================
 *
 * Fired when a canvas is removed from the library state.
 *
 * **Library emits**: canvasId only
 * **Host app responsibility**: Clean up canvas metadata on removal
 *
 * @example
 * ```typescript
 * api.on('canvasRemoved', (event) => {
 *   // Host app removes its own metadata
 *   delete canvasMetadata[event.canvasId];
 * });
 * ```
 */
export interface CanvasRemovedEvent {
    canvasId: string;
}
/** Generic state change event */
export interface StateChangedEvent {
}
/**
 * GridBuilderAPI Event Map
 * ==========================
 *
 * Type-safe mapping of event names to event data types for GridBuilderAPI.
 */
/**
 * Items Batch Added Event
 * =========================
 *
 * Fired when multiple items are added in a single batch operation via GridBuilderAPI.
 *
 * @example
 * ```typescript
 * api.on('itemsBatchAdded', (event) => {
 *   console.log(`Added ${event.items.length} items in batch`);
 * });
 * ```
 */
export interface ItemsBatchAddedEvent {
    /** Array of all added GridItem objects */
    items: GridItem[];
}
/**
 * Items Batch Deleted Event
 * ===========================
 *
 * Fired when multiple items are deleted in a single batch operation via GridBuilderAPI.
 *
 * @example
 * ```typescript
 * api.on('itemsBatchDeleted', (event) => {
 *   console.log(`Deleted ${event.itemIds.length} items in batch`);
 * });
 * ```
 */
export interface ItemsBatchDeletedEvent {
    /** Array of deleted item IDs */
    itemIds: string[];
}
/**
 * Items Batch Updated Event
 * ===========================
 *
 * Fired when multiple item configs are updated in a single batch operation via GridBuilderAPI.
 *
 * @example
 * ```typescript
 * api.on('itemsBatchUpdated', (event) => {
 *   console.log(`Updated ${event.updates.length} items in batch`);
 * });
 * ```
 */
export interface ItemsBatchUpdatedEvent {
    /** Array of { itemId, config } update records */
    updates: Array<{
        itemId: string;
        canvasId: string;
        config: Record<string, any>;
    }>;
}
export interface GridBuilderEventMap {
    itemAdded: ItemAddedEvent;
    itemRemoved: ItemRemovedEvent;
    itemUpdated: ItemUpdatedEvent;
    itemMoved: ItemMovedEvent;
    itemsBatchAdded: ItemsBatchAddedEvent;
    itemsBatchDeleted: ItemsBatchDeletedEvent;
    itemsBatchUpdated: ItemsBatchUpdatedEvent;
    selectionChanged: SelectionChangedEvent;
    canvasAdded: CanvasAddedEvent;
    canvasRemoved: CanvasRemovedEvent;
    viewportChanged: ViewportChangedEvent;
    gridVisibilityChanged: GridVisibilityChangedEvent;
    stateChanged: StateChangedEvent;
}
/**
 * Event name type (union of all event names)
 *
 * **Use cases**:
 * - Type-safe event name parameters
 * - Autocomplete for event names
 * - Compile-time validation
 */
export type EventName = keyof EventMap;
