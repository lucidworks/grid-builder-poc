/**
 * Undo/Redo Commands
 * ===================
 *
 * Concrete Command implementations for grid operations. Each command class
 * encapsulates a specific user action with the ability to undo and redo.
 *
 * ## Problem
 *
 * The Command pattern requires concrete implementations for each undoable operation.
 * Each command must:
 * - Capture enough state to reverse the operation (undo)
 * - Capture enough state to reapply the operation (redo)
 * - Be self-contained (no external dependencies)
 * - Handle edge cases (canvas switching, index preservation)
 *
 * ## Solution
 *
 * Four concrete command classes covering all grid operations:
 *
 * 1. **AddItemCommand**: Adding new items to canvas
 * 2. **DeleteItemCommand**: Removing items with index preservation
 * 3. **MoveItemCommand**: Dragging items (same or different canvas)
 * 4. **ResizeCommand**: (Not yet implemented - resize operations not tracked)
 *
 * ## Key Design Patterns
 *
 * ### Deep Cloning Strategy
 *
 * **Why deep clone**: Prevent mutations from affecting command snapshots
 *
 * ```typescript
 * this.item = JSON.parse(JSON.stringify(item));
 * ```
 *
 * **When to clone**:
 * - ✅ Constructor: Capture initial state
 * - ✅ redo(): Create fresh copy for state mutation
 * - ❌ undo(): Usually work with existing state references
 *
 * **Trade-offs**:
 * - ✅ Simple and reliable
 * - ✅ No reference bugs
 * - ❌ Higher memory usage (~1-5 KB per command)
 * - ❌ Slower than structural sharing
 *
 * ### Index Preservation Pattern
 *
 * **Why preserve index**: Undo delete should restore item at original position
 *
 * ```typescript
 * class DeleteItemCommand {
 *   private itemIndex: number;  // Capture index before deletion
 *
 *   undo() {
 *     canvas.items.splice(this.itemIndex, 0, item);  // Restore at index
 *   }
 * }
 * ```
 *
 * **Important for**:
 * - Visual consistency (item appears in same spot)
 * - Z-index order (items render in array order)
 * - User expectations (undo puts things back exactly)
 *
 * ### Selection State Management
 *
 * **Pattern**: Clear selection when deleting selected item
 *
 * ```typescript
 * if (gridState.selectedItemId === itemId) {
 *   gridState.selectedItemId = null;
 *   gridState.selectedCanvasId = null;
 * }
 * ```
 *
 * **Why needed**:
 * - Prevents dangling references to deleted items
 * - Avoids errors when accessing selectedItemId
 * - Matches user expectations (deleted item can't be selected)
 *
 * ### Cross-Canvas Move Support
 *
 * **Challenge**: Items can be dragged between canvases
 *
 * **Solution**: Track source and target canvas IDs
 *
 * ```typescript
 * class MoveItemCommand {
 *   sourceCanvasId: string;
 *   targetCanvasId: string;
 *
 *   undo() {
 *     // Move from target back to source
 *     removeFrom(targetCanvasId);
 *     addTo(sourceCanvasId, sourceIndex);  // Restore position
 *   }
 * }
 * ```
 *
 * ## Command Lifecycle
 *
 * **Typical flow**:
 * ```
 * 1. User performs action (drag, delete, etc.)
 * 2. Operation completes (state already updated)
 * 3. Create command with before/after snapshots
 * 4. pushCommand(command) → adds to history
 * 5. User presses Ctrl+Z
 * 6. command.undo() → reverses operation
 * 7. User presses Ctrl+Y
 * 8. command.redo() → reapplies operation
 * ```
 *
 * **Important**: Commands are created AFTER the operation completes,
 * not before. The constructor captures the final state.
 *
 * ## Extracting These Patterns
 *
 * To create new command types:
 *
 * ```typescript
 * export class MyCommand implements Command {
 *   // Capture state needed for undo/redo
 *   private beforeState: any;
 *   private afterState: any;
 *
 *   constructor(params) {
 *     // Deep clone to prevent mutations
 *     this.beforeState = JSON.parse(JSON.stringify(before));
 *     this.afterState = JSON.parse(JSON.stringify(after));
 *   }
 *
 *   undo(): void {
 *     // Restore before state
 *     restoreState(this.beforeState);
 *     gridState.canvases = { ...gridState.canvases };  // Trigger reactivity
 *   }
 *
 *   redo(): void {
 *     // Apply after state
 *     restoreState(this.afterState);
 *     gridState.canvases = { ...gridState.canvases };
 *   }
 * }
 * ```
 *
 * **Guidelines**:
 * - Always deep clone state in constructor
 * - Always trigger reactivity (`gridState.canvases = { ...gridState.canvases }`)
 * - Handle null cases (canvas/item not found)
 * - Clear selection if needed
 * - Preserve array indices for positional restore
 *
 * @module undo-redo-commands
 */
import { GridItem } from './state-manager';
import { Command } from './undo-redo';
/**
 * AddItemCommand
 * ==============
 *
 * Captures the addition of a new grid item to a canvas, enabling undo/redo
 * for create operations.
 *
 * ## Use Cases
 *
 * - User drops component from palette onto canvas
 * - Programmatic item creation (stress tests, templates)
 * - Duplicating existing items
 *
 * ## Command Lifecycle
 *
 * **Creation**: After item already added to canvas
 * ```typescript
 * // 1. Add item to canvas (operation completes)
 * addItemToCanvas('canvas1', newItem);
 *
 * // 2. Create command for undo (captures final state)
 * const command = new AddItemCommand('canvas1', newItem);
 * pushCommand(command);
 * ```
 *
 * **Undo**: Remove the item from canvas
 * ```typescript
 * command.undo(); // Item disappears from canvas
 * ```
 *
 * **Redo**: Re-add the item to canvas
 * ```typescript
 * command.redo(); // Item reappears in canvas
 * ```
 *
 * ## Deep Cloning Strategy
 *
 * **Constructor**: Captures item state with deep clone
 * ```typescript
 * this.item = JSON.parse(JSON.stringify(item));
 * ```
 *
 * **Why needed**:
 * - Prevents mutations from affecting command's snapshot
 * - Item might be modified after command creation
 * - Ensures redo restores exact original state
 *
 * **Redo cloning**: Creates fresh copy for state mutation
 * ```typescript
 * const itemCopy = JSON.parse(JSON.stringify(this.item));
 * canvas.items.push(itemCopy);
 * ```
 *
 * **Why redo also clones**:
 * - Multiple redo calls shouldn't share references
 * - Prevents undo/redo from affecting each other
 * - Safe state isolation
 *
 * ## Edge Cases
 *
 * - **Canvas deleted**: redo() returns early if canvas not found
 * - **Item modified**: Command stores original state, not current
 * - **Selection**: undo() automatically clears selection via helper
 *
 * @example
 * ```typescript
 * // After palette drop
 * const newItem: GridItem = {
 *   id: generateItemId(),
 *   canvasId: 'canvas1',
 *   type: 'header',
 *   name: 'Header',
 *   layouts: { desktop: { x: 5, y: 5, width: 20, height: 8 }, ... },
 *   zIndex: gridState.canvases['canvas1'].zIndexCounter++
 * };
 *
 * addItemToCanvas('canvas1', newItem);
 * pushCommand(new AddItemCommand('canvas1', newItem));
 * ```
 */
export declare class AddItemCommand implements Command {
    /** Deep clone of item at creation time */
    private item;
    /** Canvas ID where item was added */
    private canvasId;
    /**
     * Capture item addition operation
     *
     * **Important**: Call AFTER item added to canvas (not before)
     *
     * **Deep clones item**: Prevents future mutations from affecting snapshot
     *
     * @param canvasId - Canvas where item was added
     * @param item - Item that was added (will be deep cloned)
     */
    constructor(canvasId: string, item: GridItem);
    /**
     * Undo: Remove the item from canvas
     *
     * **Side effects**:
     * - Item removed from canvas.items array
     * - Selection cleared if this item was selected
     * - Triggers component re-render
     *
     * **Delegates to**: removeItemFromCanvas helper for DRY
     */
    undo(): void;
    /**
     * Redo: Re-add the item to canvas
     *
     * **Fresh clone**: Creates new copy to prevent reference sharing
     *
     * **Appends to end**: Doesn't preserve original index (acceptable for add)
     *
     * **Side effects**:
     * - Item added to end of canvas.items array
     * - Triggers component re-render
     *
     * **Safety**: No-op if canvas not found (e.g., canvas was deleted)
     */
    redo(): void;
}
/**
 * DeleteItemCommand
 * ==================
 *
 * Captures the deletion of a grid item from a canvas, enabling undo/redo
 * for delete operations with index preservation.
 *
 * ## Use Cases
 *
 * - User deletes item with Delete key
 * - Delete button clicked
 * - Programmatic item removal
 * - Clearing canvas sections
 *
 * ## Index Preservation Pattern
 *
 * **Critical feature**: Restores deleted item at its ORIGINAL array position
 *
 * **Why important**:
 * - Visual consistency (item appears in same spot)
 * - Z-index order (items render in array order)
 * - User expectations (undo puts things back exactly)
 *
 * **Implementation**:
 * ```typescript
 * constructor(canvasId, item, itemIndex) {
 *   this.itemIndex = itemIndex;  // Capture before deletion!
 * }
 *
 * undo() {
 *   canvas.items.splice(this.itemIndex, 0, itemCopy);  // Restore at index
 * }
 * ```
 *
 * ## Command Lifecycle
 *
 * **Creation**: BEFORE deleting item (to capture index)
 * ```typescript
 * // 1. Get item and its index BEFORE deletion
 * const item = getItem('canvas1', 'item-5');
 * const index = gridState.canvases['canvas1'].items.indexOf(item);
 *
 * // 2. Create command (captures item and index)
 * const command = new DeleteItemCommand('canvas1', item, index);
 *
 * // 3. Perform deletion
 * removeItemFromCanvas('canvas1', 'item-5');
 *
 * // 4. Push command for undo
 * pushCommand(command);
 * ```
 *
 * **Undo**: Restore item at original position
 * ```typescript
 * command.undo(); // Item reappears at exact original position
 * ```
 *
 * **Redo**: Delete item again
 * ```typescript
 * command.redo(); // Item disappears (and selection cleared if selected)
 * ```
 *
 * ## Deep Cloning Strategy
 *
 * **Constructor**: Captures complete item state before deletion
 * ```typescript
 * this.item = JSON.parse(JSON.stringify(item));
 * ```
 *
 * **Why needed**:
 * - Item will be deleted from state immediately after
 * - Reference would become invalid after deletion
 * - Must preserve complete state for restoration
 *
 * **Undo cloning**: Creates fresh copy for state insertion
 * ```typescript
 * const itemCopy = JSON.parse(JSON.stringify(this.item));
 * canvas.items.splice(this.itemIndex, 0, itemCopy);
 * ```
 *
 * ## Selection State Handling
 *
 * **Redo behavior**: Delegates to removeItemFromCanvas helper
 *
 * **Helper automatically**:
 * - Clears selectedItemId if this item was selected
 * - Clears selectedCanvasId
 * - Prevents dangling references
 *
 * ## Edge Cases
 *
 * - **Canvas deleted**: undo() returns early if canvas not found
 * - **Invalid index**: Falls back to push() if index out of bounds
 * - **Item modified before delete**: Command stores pre-deletion state
 * - **Multiple deletes**: Each command independently tracks its item
 *
 * @example
 * ```typescript
 * // Handle Delete key press
 * handleDeleteKey() {
 *   if (!gridState.selectedItemId || !gridState.selectedCanvasId) {
 *     return;
 *   }
 *
 *   const item = getItem(gridState.selectedCanvasId, gridState.selectedItemId);
 *   const canvas = gridState.canvases[gridState.selectedCanvasId];
 *   const index = canvas.items.indexOf(item);
 *
 *   // Create command before deleting
 *   const command = new DeleteItemCommand(
 *     gridState.selectedCanvasId,
 *     item,
 *     index
 *   );
 *
 *   // Perform deletion
 *   removeItemFromCanvas(gridState.selectedCanvasId, gridState.selectedItemId);
 *
 *   // Enable undo
 *   pushCommand(command);
 * }
 * ```
 */
export declare class DeleteItemCommand implements Command {
    /** Deep clone of item before deletion */
    private item;
    /** Canvas ID where item was deleted from */
    private canvasId;
    /** Original array index for position restoration */
    private itemIndex;
    /**
     * Capture item deletion operation
     *
     * **Important**: Call BEFORE deleting item (to capture index)
     *
     * **Deep clones item**: Preserves state before deletion
     *
     * **Captures index**: Critical for restoring at original position
     *
     * @param canvasId - Canvas containing the item
     * @param item - Item being deleted (will be deep cloned)
     * @param itemIndex - Original array index (call indexOf before deletion!)
     */
    constructor(canvasId: string, item: GridItem, itemIndex: number);
    /**
     * Undo: Restore item at original position
     *
     * **Index preservation**: Uses splice to insert at exact original position
     *
     * **Fallback**: Appends to end if index invalid (defensive coding)
     *
     * **Fresh clone**: Creates new copy to prevent reference sharing
     *
     * **Side effects**:
     * - Item restored to canvas.items array at original index
     * - Other items shift to make room
     * - Z-index order maintained (items render in array order)
     * - Triggers component re-render
     *
     * **Safety**: No-op if canvas not found
     */
    undo(): void;
    /**
     * Redo: Delete item again
     *
     * **Delegates to helper**: Uses removeItemFromCanvas for consistency
     *
     * **Automatic selection clearing**: Helper clears selection if this item selected
     *
     * **Side effects**:
     * - Item removed from canvas.items array
     * - Selection cleared if this item was selected
     * - Triggers component re-render
     *
     * **Delegates to**: removeItemFromCanvas helper for DRY
     */
    redo(): void;
}
/**
 * MoveItemCommand
 * ===============
 *
 * Captures the movement of a grid item within the same canvas or across canvases,
 * enabling undo/redo for drag operations with position and index preservation.
 *
 * ## Use Cases
 *
 * - User drags item to new position in same canvas
 * - User drags item across canvas boundaries (cross-canvas move)
 * - Programmatic item repositioning
 * - Layout reorganization
 *
 * ## Cross-Canvas Move Support
 *
 * **Challenge**: Items can be dragged between different canvases
 *
 * **Solution**: Track both source and target canvas IDs
 *
 * **Same-canvas move**:
 * ```typescript
 * sourceCanvasId === targetCanvasId
 * // Only position changes, no canvas transfer
 * ```
 *
 * **Cross-canvas move**:
 * ```typescript
 * sourceCanvasId !== targetCanvasId
 * // Item removed from source, added to target
 * // Position updated to target coordinates
 * ```
 *
 * ## Position Tracking
 *
 * **Dual position capture**:
 * - `sourcePosition`: { x, y } before drag
 * - `targetPosition`: { x, y } after drag
 *
 * **Why both needed**:
 * - Undo must restore original position
 * - Redo must restore final position
 * - Positions are in grid coordinates (not pixels)
 *
 * ## Index Preservation Pattern
 *
 * **Critical for undo**: Restore item at original array position in source canvas
 *
 * **Why important**:
 * - Maintains visual z-order consistency
 * - Restores exact pre-drag state
 * - Items render in array order
 *
 * **Implementation**:
 * ```typescript
 * // Capture source index before move
 * const sourceIndex = sourceCanvas.items.indexOf(item);
 *
 * // Restore at index on undo
 * sourceCanvas.items.splice(sourceIndex, 0, item);
 * ```
 *
 * ## Command Lifecycle
 *
 * **Creation**: BEFORE drag operation (capture source state)
 * ```typescript
 * // 1. Capture state before drag starts
 * const sourceIndex = canvas.items.indexOf(item);
 * const sourcePos = { x: item.layouts.desktop.x, y: item.layouts.desktop.y };
 *
 * // 2. Drag completes (position updated in DOM)
 * // ...
 *
 * // 3. Create command with before/after state
 * const command = new MoveItemCommand(
 *   item.id,
 *   sourceCanvasId,
 *   targetCanvasId,  // May be same as source
 *   sourcePos,
 *   targetPos,       // New position after drag
 *   sourceIndex
 * );
 *
 * // 4. Push command for undo
 * pushCommand(command);
 * ```
 *
 * **Undo**: Move back to source at original position
 * ```typescript
 * command.undo();
 * // Item returns to source canvas at original index
 * // Position restored to sourcePosition
 * ```
 *
 * **Redo**: Move to target at new position
 * ```typescript
 * command.redo();
 * // Item moves to target canvas (appended to end)
 * // Position updated to targetPosition
 * ```
 *
 * ## State Mutation Pattern
 *
 * **Unlike Add/Delete**: Does NOT deep clone item
 *
 * **Why reference-based**:
 * - Same item object moves between canvases
 * - Only position properties mutated
 * - Efficient (no serialization overhead)
 * - Item identity preserved (same ID, zIndex, etc.)
 *
 * **What gets cloned**:
 * ```typescript
 * // Only position objects cloned (shallow)
 * this.sourcePosition = { ...sourcePosition };
 * this.targetPosition = { ...targetPosition };
 * ```
 *
 * ## Position Coordinates
 *
 * **Uses desktop layout**: `item.layouts.desktop.x/y`
 *
 * **Why desktop**:
 * - Drag handler operates on desktop coordinates
 * - Mobile layout auto-generated or separately customized
 * - Single source of truth for command
 *
 * **Grid units**: Positions stored in grid units (not pixels)
 *
 * ## Canvas Mutation Flow
 *
 * **Undo sequence** (target → source):
 * 1. Find item in target canvas
 * 2. Remove from target.items array
 * 3. Update item.canvasId to source
 * 4. Update item position to sourcePosition
 * 5. Insert at sourceIndex in source.items
 * 6. Trigger reactivity
 *
 * **Redo sequence** (source → target):
 * 1. Find item in source canvas
 * 2. Remove from source.items array
 * 3. Update item.canvasId to target
 * 4. Update item position to targetPosition
 * 5. Append to target.items (no index preservation for redo)
 * 6. Trigger reactivity
 *
 * ## Edge Cases
 *
 * - **Canvas deleted**: Both undo/redo return early if canvas not found
 * - **Item not found**: Returns early (defensive coding)
 * - **Same position move**: Creates valid command (user expectation)
 * - **Invalid source index**: Fallback to append (defensive)
 *
 * @example
 * ```typescript
 * // After drag end event
 * handleDragEnd(event) {
 *   const item = getItem(sourceCanvasId, itemId);
 *   const sourceIndex = gridState.canvases[sourceCanvasId].items.indexOf(item);
 *
 *   const command = new MoveItemCommand(
 *     itemId,
 *     sourceCanvasId,
 *     targetCanvasId,  // Detected from drop target
 *     { x: oldX, y: oldY },  // Captured on drag start
 *     { x: newX, y: newY },  // Calculated from drop position
 *     sourceIndex
 *   );
 *
 *   pushCommand(command);
 * }
 * ```
 */
export declare class MoveItemCommand implements Command {
    /** Item ID (reference to item, not deep clone) */
    private itemId;
    /** Canvas ID where item started */
    private sourceCanvasId;
    /** Canvas ID where item ended (may equal source for same-canvas move) */
    private targetCanvasId;
    /** Position before drag (grid coordinates) */
    private sourcePosition;
    /** Position after drag (grid coordinates) */
    private targetPosition;
    /** Size before operation (grid units) - optional for resize tracking */
    private sourceSize?;
    /** Size after operation (grid units) - optional for resize tracking */
    private targetSize?;
    /** Original array index in source canvas (for undo restoration) */
    private sourceIndex;
    /**
     * Capture item move operation
     *
     * **Important**: Item should already be at target position
     *
     * **Shallow position clone**: Prevents mutation of passed objects
     *
     * **No item clone**: Uses reference-based approach (item ID tracking)
     *
     * **Resize support**: Optional size parameters track width/height changes
     *
     * @param itemId - ID of moved item
     * @param sourceCanvasId - Canvas where item started
     * @param targetCanvasId - Canvas where item ended
     * @param sourcePosition - Position before drag (will be shallow cloned)
     * @param targetPosition - Position after drag (will be shallow cloned)
     * @param sourceIndex - Original array index in source canvas
     * @param sourceSize - Optional: Size before operation (for resize tracking)
     * @param targetSize - Optional: Size after operation (for resize tracking)
     */
    constructor(itemId: string, sourceCanvasId: string, targetCanvasId: string, sourcePosition: {
        x: number;
        y: number;
    }, targetPosition: {
        x: number;
        y: number;
    }, sourceIndex: number, sourceSize?: {
        width: number;
        height: number;
    }, targetSize?: {
        width: number;
        height: number;
    });
    /**
     * Undo: Move item back to source canvas at original position
     *
     * **Cross-canvas handling**:
     * - Removes from target canvas
     * - Updates canvasId back to source
     * - Restores source position
     * - Inserts at original index in source
     *
     * **Index preservation**: Uses splice to restore exact array position
     *
     * **Fallback**: Appends to end if index invalid (defensive)
     *
     * **Side effects**:
     * - Item removed from target canvas
     * - Item added to source canvas at original index
     * - Item position updated to sourcePosition
     * - Item canvasId updated to sourceCanvasId
     * - Triggers component re-render
     *
     * **Safety**: Returns early if canvas or item not found
     */
    undo(): void;
    /**
     * Redo: Move item to target canvas at final position
     *
     * **Cross-canvas handling**:
     * - Removes from source canvas
     * - Updates canvasId to target
     * - Restores target position
     * - Appends to target canvas (no index preservation for redo)
     *
     * **No index preservation for redo**: Appends to end of target array
     * (undo needs original index, redo doesn't)
     *
     * **Side effects**:
     * - Item removed from source canvas
     * - Item added to end of target canvas
     * - Item position updated to targetPosition
     * - Item canvasId updated to targetCanvasId
     * - Triggers component re-render
     *
     * **Safety**: Returns early if canvas or item not found
     */
    redo(): void;
}
/**
 * UpdateItemCommand - Update item properties
 *
 * Records old item state and applies updates
 */
export declare class UpdateItemCommand implements Command {
    private canvasId;
    private itemId;
    private oldItem;
    private updates;
    constructor(canvasId: string, itemId: string, oldItem: GridItem, updates: Partial<GridItem>);
    undo(): void;
    redo(): void;
}
/**
 * RemoveItemCommand - Remove item from canvas
 *
 * Stores removed item for restoration
 */
export declare class RemoveItemCommand implements Command {
    private canvasId;
    private item;
    constructor(canvasId: string, item: GridItem);
    undo(): void;
    redo(): void;
}
/**
 * SetViewportCommand - Change current viewport
 *
 * Stores old and new viewport states
 */
export declare class SetViewportCommand implements Command {
    private oldViewport;
    private newViewport;
    constructor(oldViewport: 'desktop' | 'mobile', newViewport: 'desktop' | 'mobile');
    undo(): void;
    redo(): void;
}
/**
 * ToggleGridCommand - Toggle grid visibility
 *
 * Stores old and new visibility states
 */
export declare class ToggleGridCommand implements Command {
    private oldValue;
    private newValue;
    constructor(oldValue: boolean, newValue: boolean);
    undo(): void;
    redo(): void;
}
/**
 * BatchAddCommand - Add multiple items in a single batch operation
 *
 * **Performance benefit**: 1 undo/redo command for N items instead of N commands.
 * Reduces undo stack size and provides atomic undo/redo for batch operations.
 *
 * **Use cases**:
 * - Stress test (add 100+ items at once)
 * - Template application (add multiple pre-configured items)
 * - Undo batch delete operation
 * - Import from file (restore multiple items)
 *
 * **Undo behavior**:
 * - Deletes all items in a single batch operation
 * - Single state update, single re-render
 *
 * **Redo behavior**:
 * - Re-adds all items with original IDs and properties
 * - Maintains z-index and positioning
 * - Single state update, single re-render
 */
export declare class BatchAddCommand implements Command {
    private itemsData;
    constructor(itemIds: string[]);
    undo(): void;
    redo(): void;
}
/**
 * BatchDeleteCommand - Delete multiple items in a single batch operation
 *
 * **Performance benefit**: 1 undo/redo command for N items instead of N commands.
 *
 * **Use cases**:
 * - Clear canvas (delete all items)
 * - Delete selection group
 * - Undo batch add operation
 * - Bulk cleanup operations
 *
 * **Undo behavior**:
 * - Re-adds all items with original properties and positions
 * - Maintains z-index and canvas placement
 * - Single state update, single re-render
 *
 * **Redo behavior**:
 * - Deletes all items in a single batch operation
 * - Single state update, single re-render
 */
export declare class BatchDeleteCommand implements Command {
    private itemsData;
    constructor(itemIds: string[]);
    undo(): void;
    redo(): void;
}
/**
 * BatchUpdateConfigCommand - Update multiple item configs in a single batch
 *
 * **Performance benefit**: 1 undo/redo command for N config updates instead of N commands.
 *
 * **Use cases**:
 * - Theme changes (update colors for all headers)
 * - Bulk property changes (set all text sizes to 16px)
 * - Template application (apply preset configs)
 * - Undo/redo bulk config changes
 *
 * **Undo behavior**:
 * - Restores all old configs in a single batch operation
 * - Single state update, single re-render
 *
 * **Redo behavior**:
 * - Applies all new configs in a single batch operation
 * - Single state update, single re-render
 */
export declare class BatchUpdateConfigCommand implements Command {
    private updates;
    constructor(updates: Array<{
        itemId: string;
        canvasId: string;
        updates: Partial<GridItem>;
    }>);
    undo(): void;
    redo(): void;
}
/**
 * AddCanvasCommand
 * =================
 *
 * Undoable command for adding a canvas to the grid.
 *
 * **Pattern**: Host app owns canvas metadata, library manages item placement
 *
 * **Library responsibility** (what this command does):
 * - Create canvas in gridState.canvases with empty items array
 * - Initialize zIndexCounter for item stacking
 * - Track operation in undo/redo
 *
 * **Host app responsibility** (what this command does NOT do):
 * - Store canvas title, backgroundColor, or other metadata
 * - Host app maintains its own canvas metadata separately
 * - Host app listens to canvasAdded event to sync its state
 *
 * **Integration pattern**:
 * ```typescript
 * // Host app maintains canvas metadata
 * const canvasMetadata = {
 *   'section-1': { title: 'Hero Section', backgroundColor: '#f0f4f8' }
 * };
 *
 * // Create canvas in library (just placement state)
 * const cmd = new AddCanvasCommand('section-1');
 * pushCommand(cmd); // Add to undo/redo stack
 * cmd.redo(); // Creates canvas with items: [], zIndexCounter: 1
 *
 * // Host app listens to event and syncs its own state
 * api.on('canvasAdded', (event) => {
 *   // Host app can now add its own metadata
 * });
 * ```
 *
 * **Why this separation**:
 * - Library focuses on layout (items, positions, z-index)
 * - Host app owns presentation (styling, titles, metadata)
 * - Different apps can use library with different data models
 *
 * @module undo-redo-commands
 */
export declare class AddCanvasCommand implements Command {
    description: string;
    private canvasId;
    constructor(canvasId: string);
    undo(): void;
    redo(): void;
}
/**
 * RemoveCanvasCommand
 * ====================
 *
 * Undoable command for removing a canvas from the grid.
 *
 * **Critical**: Snapshots canvas items and zIndexCounter before removal
 *
 * **Library responsibility** (what this command does):
 * - Snapshot canvas items array and zIndexCounter
 * - Remove canvas from gridState.canvases
 * - Restore canvas with all items on undo
 *
 * **Host app responsibility** (what this command does NOT do):
 * - Store canvas title, backgroundColor, or metadata
 * - Host app must listen to canvasRemoved event
 * - Host app must manage its own metadata undo/redo separately
 *
 * **Integration pattern**:
 * ```typescript
 * // Host app listens to events and manages its own metadata
 * api.on('canvasRemoved', (event) => {
 *   // Host app removes its own metadata
 *   delete canvasMetadata[event.canvasId];
 * });
 *
 * api.on('canvasAdded', (event) => {
 *   // On undo of remove, host app restores metadata
 *   if (wasUndoOperation) {
 *     canvasMetadata[event.canvasId] = savedMetadata;
 *   }
 * });
 *
 * // Remove canvas
 * const cmd = new RemoveCanvasCommand('section-1');
 * pushCommand(cmd);
 * cmd.redo(); // Removes canvas from library
 * ```
 *
 * **Edge case handling**:
 * - Canvas doesn't exist: command becomes no-op
 * - Canvas has items: all items removed with canvas
 * - Undo restores items with original layouts and zIndex
 *
 * @module undo-redo-commands
 */
export declare class RemoveCanvasCommand implements Command {
    description: string;
    private canvasId;
    private canvasSnapshot;
    constructor(canvasId: string);
    undo(): void;
    redo(): void;
}
