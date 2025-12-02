import { g as gridState, c as updateItem, e as addItemToCanvas, d as deleteItemsBatch, u as updateItemsBatch } from './state-manager-6NvKjybS.js';
import { c as createDebugLogger } from './debug-BAq8PPFJ.js';

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
 * private itemIndex: number;  // Capture index before deletion
 *
 * undo() {
 * canvas.items.splice(this.itemIndex, 0, item);  // Restore at index
 * }
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
 * gridState.selectedItemId = null;
 * gridState.selectedCanvasId = null;
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
 * sourceCanvasId: string;
 * targetCanvasId: string;
 *
 * undo() {
 * // Move from target back to source
 * removeFrom(targetCanvasId);
 * addTo(sourceCanvasId, sourceIndex);  // Restore position
 * }
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
 * // Capture state needed for undo/redo
 * private beforeState: any;
 * private afterState: any;
 *
 * constructor(params) {
 * // Deep clone to prevent mutations
 * this.beforeState = JSON.parse(JSON.stringify(before));
 * this.afterState = JSON.parse(JSON.stringify(after));
 * }
 *
 * undo(): void {
 * // Restore before state
 * restoreState(this.beforeState);
 * gridState.canvases = { ...gridState.canvases };  // Trigger reactivity
 * }
 *
 * redo(): void {
 * // Apply after state
 * restoreState(this.afterState);
 * gridState.canvases = { ...gridState.canvases };
 * }
 * }
 * ```
 *
 * **Guidelines**:
 * - Always deep clone state in constructor
 * - Always trigger reactivity (`gridState.canvases = { ...gridState.canvases }`)
 * - Handle null cases (canvas/item not found)
 * - Clear selection if needed
 * - Preserve array indices for positional restore
 * @module undo-redo-commands
 */
const debug = createDebugLogger("undo-redo-commands");
/**
 * Helper function to remove an item from a canvas and clear selection
 *
 * **Responsibilities**:
 * - Remove item from canvas items array
 * - Trigger state reactivity (spread pattern)
 * - Clear selection if deleted item was selected
 *
 * **Used by**:
 * - AddItemCommand.undo() - Remove just-added item
 * - DeleteItemCommand.redo() - Remove item again
 * - MoveItemCommand (implicitly via filter)
 *
 * **Why helper function**:
 * - DRY principle (used in multiple commands)
 * - Encapsulates selection clearing logic
 * - Consistent behavior across commands
 *
 * **Selection clearing**:
 * Prevents dangling references and UI errors when selected item deleted.
 * @param canvasId - Canvas containing the item
 * @param itemId - Item to remove
 * @example
 * ```typescript
 * // Used internally by commands
 * undo() {
 *   removeItemFromCanvas(this.canvasId, this.item.id);
 * }
 * ```
 */
function removeItemFromCanvas(canvasId, itemId) {
    const canvas = gridState.canvases[canvasId];
    if (!canvas) {
        return;
    }
    canvas.items = canvas.items.filter((i) => i.id !== itemId);
    gridState.canvases = Object.assign({}, gridState.canvases);
    // Clear selection if this item was selected
    if (gridState.selectedItemId === itemId) {
        gridState.selectedItemId = null;
        gridState.selectedCanvasId = null;
    }
}
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
class AddItemCommand {
    /**
     * Capture item addition operation
     *
     * **Important**: Call AFTER item added to canvas (not before)
     *
     * **Deep clones item**: Prevents future mutations from affecting snapshot
     * @param canvasId - Canvas where item was added
     * @param item - Item that was added (will be deep cloned)
     */
    constructor(canvasId, item) {
        this.canvasId = canvasId;
        // Deep clone the item to capture its state at time of creation
        this.item = JSON.parse(JSON.stringify(item));
    }
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
    undo() {
        // Remove the item from the canvas
        removeItemFromCanvas(this.canvasId, this.item.id);
    }
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
    redo() {
        // Re-add the item to the canvas
        const canvas = gridState.canvases[this.canvasId];
        if (!canvas) {
            return;
        }
        // Use the cloned item state
        const itemCopy = JSON.parse(JSON.stringify(this.item));
        canvas.items.push(itemCopy);
        gridState.canvases = Object.assign({}, gridState.canvases);
    }
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
 * this.itemIndex = itemIndex;  // Capture before deletion!
 * }
 *
 * undo() {
 * canvas.items.splice(this.itemIndex, 0, itemCopy);  // Restore at index
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
class DeleteItemCommand {
    /**
     * Capture item deletion operation
     *
     * **Important**: Call BEFORE deleting item (to capture index)
     *
     * **Deep clones item**: Preserves state before deletion
     *
     * **Captures index**: Critical for restoring at original position
     * @param canvasId - Canvas containing the item
     * @param item - Item being deleted (will be deep cloned)
     * @param itemIndex - Original array index (call indexOf before deletion!)
     */
    constructor(canvasId, item, itemIndex) {
        this.canvasId = canvasId;
        // Deep clone the item to capture its state before deletion
        this.item = JSON.parse(JSON.stringify(item));
        this.itemIndex = itemIndex;
    }
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
    undo() {
        // Re-add the item to its original position
        const canvas = gridState.canvases[this.canvasId];
        if (!canvas) {
            return;
        }
        const itemCopy = JSON.parse(JSON.stringify(this.item));
        // Insert at original index if possible, otherwise push to end
        if (this.itemIndex >= 0 && this.itemIndex <= canvas.items.length) {
            canvas.items.splice(this.itemIndex, 0, itemCopy);
        }
        else {
            canvas.items.push(itemCopy);
        }
        gridState.canvases = Object.assign({}, gridState.canvases);
    }
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
    redo() {
        // Remove the item again
        removeItemFromCanvas(this.canvasId, this.item.id);
    }
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
 * item.id,
 * sourceCanvasId,
 * targetCanvasId,  // May be same as source
 * sourcePos,
 * targetPos,       // New position after drag
 * sourceIndex
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
class MoveItemCommand {
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
     * **Z-index handling**:
     * - Same canvas: sourceZIndex === targetZIndex (no change)
     * - Cross-canvas: targetZIndex assigned from targetCanvas.zIndexCounter++
     * @param itemId - ID of moved item
     * @param sourceCanvasId - Canvas where item started
     * @param targetCanvasId - Canvas where item ended
     * @param sourcePosition - Position before drag (will be shallow cloned)
     * @param targetPosition - Position after drag (will be shallow cloned)
     * @param sourceIndex - Original array index in source canvas
     * @param sourceZIndex - Z-index in source canvas (for undo restoration)
     * @param targetZIndex - Z-index in target canvas (assigned during move)
     * @param sourceSize - Optional: Size before operation (for resize tracking)
     * @param targetSize - Optional: Size after operation (for resize tracking)
     */
    constructor(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, sourceIndex, sourceZIndex, targetZIndex, sourceSize, targetSize) {
        this.itemId = itemId;
        this.sourceCanvasId = sourceCanvasId;
        this.targetCanvasId = targetCanvasId;
        this.sourcePosition = Object.assign({}, sourcePosition);
        this.targetPosition = Object.assign({}, targetPosition);
        this.sourceIndex = sourceIndex;
        this.sourceZIndex = sourceZIndex;
        this.targetZIndex = targetZIndex;
        this.sourceSize = sourceSize ? Object.assign({}, sourceSize) : undefined;
        this.targetSize = targetSize ? Object.assign({}, targetSize) : undefined;
    }
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
    undo() {
        debug.log("🔙 MoveItemCommand.undo()", {
            itemId: this.itemId,
            sourceCanvasId: this.sourceCanvasId,
            targetCanvasId: this.targetCanvasId,
            sourcePosition: this.sourcePosition,
            targetPosition: this.targetPosition,
        });
        // Find the item in target canvas first
        let targetCanvas = gridState.canvases[this.targetCanvasId];
        let item = targetCanvas === null || targetCanvas === void 0 ? void 0 : targetCanvas.items.find((i) => i.id === this.itemId);
        // If target canvas doesn't exist or item not found there, search all canvases
        // This handles the case where the target canvas was deleted
        if (!item) {
            for (const canvasId in gridState.canvases) {
                const canvas = gridState.canvases[canvasId];
                item = canvas.items.find((i) => i.id === this.itemId);
                if (item) {
                    targetCanvas = canvas;
                    break;
                }
            }
        }
        if (!item || !targetCanvas) {
            console.warn("  ❌ Item or canvas not found, aborting undo");
            return;
        }
        debug.log("  📍 Found item, current position:", {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
        });
        // Remove from current canvas (wherever it is)
        targetCanvas.items = targetCanvas.items.filter((i) => i.id !== this.itemId);
        // Update item's position, z-index, and canvasId back to source
        item.canvasId = this.sourceCanvasId;
        item.layouts.desktop.x = this.sourcePosition.x;
        item.layouts.desktop.y = this.sourcePosition.y;
        item.zIndex = this.sourceZIndex;
        debug.log("  ✅ Updated item position and z-index to:", {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
            zIndex: item.zIndex,
        });
        // Restore size if it was tracked (for resize operations)
        if (this.sourceSize) {
            item.layouts.desktop.width = this.sourceSize.width;
            item.layouts.desktop.height = this.sourceSize.height;
        }
        // Add back to source canvas at original index
        const sourceCanvas = gridState.canvases[this.sourceCanvasId];
        if (!sourceCanvas) {
            console.warn("  ❌ Source canvas not found, aborting undo");
            return;
        }
        if (this.sourceIndex >= 0 &&
            this.sourceIndex <= sourceCanvas.items.length) {
            sourceCanvas.items.splice(this.sourceIndex, 0, item);
        }
        else {
            sourceCanvas.items.push(item);
        }
        // Trigger state update
        gridState.canvases = Object.assign({}, gridState.canvases);
        // Clear any inline transform style that might be persisting from drag handler
        // This ensures the component re-renders with the correct position from state
        const element = document.getElementById(this.itemId);
        if (element) {
            debug.log("  🎨 Clearing inline transform style");
            element.style.transform = "";
        }
        debug.log("  ✅ Undo complete");
    }
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
    redo() {
        debug.log("🔜 MoveItemCommand.redo()", {
            itemId: this.itemId,
            sourceCanvasId: this.sourceCanvasId,
            targetCanvasId: this.targetCanvasId,
            sourcePosition: this.sourcePosition,
            targetPosition: this.targetPosition,
        });
        // Find the item in source canvas
        const sourceCanvas = gridState.canvases[this.sourceCanvasId];
        const item = sourceCanvas === null || sourceCanvas === void 0 ? void 0 : sourceCanvas.items.find((i) => i.id === this.itemId);
        if (!item) {
            console.warn("  ❌ Item not found, aborting redo");
            return;
        }
        debug.log("  📍 Found item, current position:", {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
        });
        // Remove from source canvas
        sourceCanvas.items = sourceCanvas.items.filter((i) => i.id !== this.itemId);
        // Update item's position, z-index, and canvasId to target
        item.canvasId = this.targetCanvasId;
        item.layouts.desktop.x = this.targetPosition.x;
        item.layouts.desktop.y = this.targetPosition.y;
        item.zIndex = this.targetZIndex;
        debug.log("  ✅ Updated item position and z-index to:", {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
            zIndex: item.zIndex,
        });
        // Restore size if it was tracked (for resize operations)
        if (this.targetSize) {
            item.layouts.desktop.width = this.targetSize.width;
            item.layouts.desktop.height = this.targetSize.height;
        }
        // Add to target canvas
        const targetCanvas = gridState.canvases[this.targetCanvasId];
        if (!targetCanvas) {
            console.warn("  ❌ Target canvas not found, aborting redo");
            return;
        }
        targetCanvas.items.push(item);
        // Trigger state update
        gridState.canvases = Object.assign({}, gridState.canvases);
        // Clear any inline transform style that might be persisting from drag handler
        // This ensures the component re-renders with the correct position from state
        const element = document.getElementById(this.itemId);
        if (element) {
            debug.log("  🎨 Clearing inline transform style");
            element.style.transform = "";
        }
        debug.log("  ✅ Redo complete");
    }
}
/**
 * UpdateItemCommand - Update item properties
 *
 * Records old item state and applies updates
 */
class UpdateItemCommand {
    constructor(canvasId, itemId, oldItem, updates) {
        this.canvasId = canvasId;
        this.itemId = itemId;
        this.oldItem = oldItem;
        this.updates = updates;
    }
    undo() {
        updateItem(this.canvasId, this.itemId, this.oldItem);
    }
    redo() {
        updateItem(this.canvasId, this.itemId, this.updates);
    }
}
/**
 * RemoveItemCommand - Remove item from canvas
 *
 * Stores removed item for restoration
 */
class RemoveItemCommand {
    constructor(canvasId, item) {
        this.canvasId = canvasId;
        this.item = item;
    }
    undo() {
        addItemToCanvas(this.canvasId, this.item);
    }
    redo() {
        removeItemFromCanvas(this.canvasId, this.item.id);
    }
}
/**
 * SetViewportCommand - Change current viewport
 *
 * Stores old and new viewport states
 */
class SetViewportCommand {
    constructor(oldViewport, newViewport) {
        this.oldViewport = oldViewport;
        this.newViewport = newViewport;
    }
    undo() {
        gridState.currentViewport = this.oldViewport;
    }
    redo() {
        gridState.currentViewport = this.newViewport;
    }
}
/**
 * ToggleGridCommand - Toggle grid visibility
 *
 * Stores old and new visibility states
 */
class ToggleGridCommand {
    constructor(oldValue, newValue) {
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
    undo() {
        gridState.showGrid = this.oldValue;
    }
    redo() {
        gridState.showGrid = this.newValue;
    }
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
class BatchAddCommand {
    constructor(itemIds) {
        // Store full item data for redo (deep clone to prevent mutations)
        this.itemsData = itemIds
            .map((id) => {
            const item = Object.values(gridState.canvases)
                .flatMap((canvas) => canvas.items)
                .find((i) => i.id === id);
            return item ? JSON.parse(JSON.stringify(item)) : null;
        })
            .filter(Boolean);
    }
    undo() {
        // Delete all items in one batch
        const itemIds = this.itemsData.map((item) => item.id);
        deleteItemsBatch(itemIds);
    }
    redo() {
        // Re-add all items (addItemsBatch will generate new IDs, so we need custom logic)
        const updatedCanvases = Object.assign({}, gridState.canvases);
        for (const itemData of this.itemsData) {
            const canvas = updatedCanvases[itemData.canvasId];
            if (canvas) {
                // Check if item already exists (prevent duplicates)
                const exists = canvas.items.some((i) => i.id === itemData.id);
                if (!exists) {
                    canvas.items.push(itemData);
                }
            }
        }
        gridState.canvases = updatedCanvases;
    }
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
class BatchDeleteCommand {
    constructor(itemIds) {
        // Store full item data for undo (deep clone to prevent mutations)
        this.itemsData = itemIds
            .map((id) => {
            const item = Object.values(gridState.canvases)
                .flatMap((canvas) => canvas.items)
                .find((i) => i.id === id);
            return item ? JSON.parse(JSON.stringify(item)) : null;
        })
            .filter(Boolean);
    }
    undo() {
        // Re-add all items (same logic as BatchAddCommand.redo)
        const updatedCanvases = Object.assign({}, gridState.canvases);
        for (const itemData of this.itemsData) {
            const canvas = updatedCanvases[itemData.canvasId];
            if (canvas) {
                // Check if item already exists (prevent duplicates)
                const exists = canvas.items.some((i) => i.id === itemData.id);
                if (!exists) {
                    canvas.items.push(itemData);
                }
            }
        }
        gridState.canvases = updatedCanvases;
    }
    redo() {
        // Delete all items in one batch
        const itemIds = this.itemsData.map((item) => item.id);
        deleteItemsBatch(itemIds);
    }
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
class BatchUpdateConfigCommand {
    constructor(updates) {
        // Store old and new state for each item (deep clone to prevent mutations)
        this.updates = updates
            .map(({ itemId, canvasId, updates: itemUpdates }) => {
            const canvas = gridState.canvases[canvasId];
            const item = canvas === null || canvas === void 0 ? void 0 : canvas.items.find((i) => i.id === itemId);
            if (!item) {
                return null;
            }
            return {
                itemId,
                canvasId,
                oldItem: JSON.parse(JSON.stringify(item)),
                newItem: JSON.parse(JSON.stringify(Object.assign(Object.assign({}, item), itemUpdates))),
            };
        })
            .filter(Boolean);
    }
    undo() {
        // Restore old configs
        const batchUpdates = this.updates.map(({ itemId, canvasId, oldItem }) => ({
            itemId,
            canvasId,
            updates: oldItem,
        }));
        updateItemsBatch(batchUpdates);
    }
    redo() {
        // Apply new configs
        const batchUpdates = this.updates.map(({ itemId, canvasId, newItem }) => ({
            itemId,
            canvasId,
            updates: newItem,
        }));
        updateItemsBatch(batchUpdates);
    }
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
 * 'section-1': { title: 'Hero Section', backgroundColor: '#f0f4f8' }
 * };
 *
 * // Create canvas in library (just placement state)
 * const cmd = new AddCanvasCommand('section-1');
 * pushCommand(cmd); // Add to undo/redo stack
 * cmd.redo(); // Creates canvas with items: [], zIndexCounter: 1
 *
 * // Host app listens to event and syncs its own state
 * api.on('canvasAdded', (event) => {
 * // Host app can now add its own metadata
 * });
 * ```
 *
 * **Why this separation**:
 * - Library focuses on layout (items, positions, z-index)
 * - Host app owns presentation (styling, titles, metadata)
 * - Different apps can use library with different data models
 */
class AddCanvasCommand {
    constructor(canvasId, stateInstance, eventManagerInstance) {
        this.description = "Add Canvas";
        this.canvasId = canvasId;
        this.stateInstance = stateInstance;
        this.eventManagerInstance = eventManagerInstance;
    }
    undo() {
        debug.log("🔙 AddCanvasCommand.undo() - removing canvas:", this.canvasId);
        // Remove canvas from instance state
        delete this.stateInstance.canvases[this.canvasId];
        // Trigger state change for reactivity
        this.stateInstance.canvases = Object.assign({}, this.stateInstance.canvases);
        // Emit event so host app can sync its metadata
        debug.log("  📢 Emitting canvasRemoved event for:", this.canvasId);
        this.eventManagerInstance.emit("canvasRemoved", { canvasId: this.canvasId });
    }
    redo() {
        // Add canvas to instance state (minimal - just item placement management)
        this.stateInstance.canvases[this.canvasId] = {
            zIndexCounter: 1,
            items: [],
        };
        // Trigger state change for reactivity
        this.stateInstance.canvases = Object.assign({}, this.stateInstance.canvases);
        // Emit event so host app can sync its metadata
        this.eventManagerInstance.emit("canvasAdded", { canvasId: this.canvasId });
    }
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
 * // Host app removes its own metadata
 * delete canvasMetadata[event.canvasId];
 * });
 *
 * api.on('canvasAdded', (event) => {
 * // On undo of remove, host app restores metadata
 * if (wasUndoOperation) {
 * canvasMetadata[event.canvasId] = savedMetadata;
 * }
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
 */
class RemoveCanvasCommand {
    constructor(canvasId, stateInstance, eventManagerInstance) {
        this.description = "Remove Canvas";
        this.canvasSnapshot = null;
        this.canvasId = canvasId;
        this.stateInstance = stateInstance;
        this.eventManagerInstance = eventManagerInstance;
        // Snapshot canvas state (deep clone to prevent mutations)
        const canvas = this.stateInstance.canvases[canvasId];
        if (canvas) {
            this.canvasSnapshot = JSON.parse(JSON.stringify(canvas));
        }
    }
    undo() {
        // Restore canvas from snapshot (just layout state, no metadata)
        if (this.canvasSnapshot) {
            this.stateInstance.canvases[this.canvasId] = JSON.parse(JSON.stringify(this.canvasSnapshot));
            // Trigger state change for reactivity
            this.stateInstance.canvases = Object.assign({}, this.stateInstance.canvases);
            // Emit event so host app can sync its metadata
            this.eventManagerInstance.emit("canvasAdded", { canvasId: this.canvasId });
        }
    }
    redo() {
        // Remove canvas from instance state
        delete this.stateInstance.canvases[this.canvasId];
        // Trigger state change for reactivity
        this.stateInstance.canvases = Object.assign({}, this.stateInstance.canvases);
        // Emit event so host app can sync its metadata
        this.eventManagerInstance.emit("canvasRemoved", { canvasId: this.canvasId });
    }
}
/**
 * Change Z-Index Command
 * ======================
 *
 * Handles undo/redo for z-index changes (layer reordering).
 * Supports both single-item changes and multi-item swaps.
 *
 * **Use cases**:
 * - Layer panel drag-to-reorder (swap with other item)
 * - Bring to front / send to back (single item)
 * - Move forward / move backward (swap with adjacent item)
 * - Direct z-index assignment (single item)
 *
 * **What it captures**:
 * - Array of z-index changes (supports cascading/swap operations)
 * - Each change: { itemId, canvasId, oldZIndex, newZIndex }
 *
 * **Why array-based**:
 * - Move forward/backward swaps z-index with adjacent item (2 items affected)
 * - Drag-to-reorder can shuffle multiple items
 * - Undo must atomically restore all affected items
 *
 * **Operation**:
 * - Updates all items' zIndex properties in single undo/redo operation
 * - Maintains canvas zIndexCounter
 * - Triggers reactivity once for UI updates
 * - Emits events for layer panel to update
 *
 * **Instance-based architecture**:
 * - Accepts optional stateInstance parameter for multi-instance support
 * - Falls back to singleton gridState if not provided (backward compatibility)
 * - Operates on instance state instead of global singleton
 *
 * **Example usage**:
 * ```typescript
 * // Instance-based (multi-grid support)
 * const cmd = new ChangeZIndexCommand(
 *   changes,
 *   eventManager,
 *   stateInstance
 * );
 *
 * // Singleton-based (backward compatibility)
 * const cmd = new ChangeZIndexCommand(changes, eventManager);
 * ```
 *
 * **Edge case handling**:
 * - Item doesn't exist: skips that item (doesn't fail entire command)
 * - Canvas doesn't exist: skips that item
 * - Undo restores exact z-index values for all items
 * - Maintains visual layer order across all affected items
 */
class ChangeZIndexCommand {
    constructor(changes, eventManager, stateInstance) {
        this.changes = changes;
        this.eventManager = eventManager;
        this.stateInstance = stateInstance || null;
        // Descriptive message for command history
        if (changes.length === 1) {
            const change = changes[0];
            this.description = `Change Z-Index (${change.oldZIndex} → ${change.newZIndex})`;
        }
        else {
            this.description = `Reorder ${changes.length} Layers`;
        }
    }
    undo() {
        // Get the state to operate on (instance or singleton)
        const state = this.stateInstance || gridState;
        // Restore old z-index for all affected items
        this.changes.forEach((change) => {
            const canvas = state.canvases[change.canvasId];
            const item = canvas === null || canvas === void 0 ? void 0 : canvas.items.find((i) => i.id === change.itemId);
            if (item) {
                item.zIndex = change.oldZIndex;
                debug.log(`Undo z-index change: ${change.itemId} from ${change.newZIndex} to ${change.oldZIndex}`);
            }
        });
        // Trigger reactivity
        state.canvases = Object.assign({}, state.canvases);
        // Emit single event (batch or individual based on change count)
        if (this.changes.length === 1) {
            const change = this.changes[0];
            this.eventManager.emit("zIndexChanged", {
                itemId: change.itemId,
                canvasId: change.canvasId,
                oldZIndex: change.newZIndex, // Swapped for undo
                newZIndex: change.oldZIndex,
            });
        }
        else {
            // Emit batch event for atomic update
            this.eventManager.emit("zIndexBatchChanged", {
                changes: this.changes.map((change) => ({
                    itemId: change.itemId,
                    canvasId: change.canvasId,
                    oldZIndex: change.newZIndex, // Swapped for undo
                    newZIndex: change.oldZIndex,
                })),
            });
        }
    }
    redo() {
        // Get the state to operate on (instance or singleton)
        const state = this.stateInstance || gridState;
        // Reapply new z-index for all affected items
        this.changes.forEach((change) => {
            const canvas = state.canvases[change.canvasId];
            const item = canvas === null || canvas === void 0 ? void 0 : canvas.items.find((i) => i.id === change.itemId);
            if (item) {
                item.zIndex = change.newZIndex;
                debug.log(`Redo z-index change: ${change.itemId} from ${change.oldZIndex} to ${change.newZIndex}`);
            }
        });
        // Trigger reactivity
        state.canvases = Object.assign({}, state.canvases);
        // Emit single event (batch or individual based on change count)
        if (this.changes.length === 1) {
            const change = this.changes[0];
            this.eventManager.emit("zIndexChanged", {
                itemId: change.itemId,
                canvasId: change.canvasId,
                oldZIndex: change.oldZIndex,
                newZIndex: change.newZIndex,
            });
        }
        else {
            // Emit batch event for atomic update
            this.eventManager.emit("zIndexBatchChanged", {
                changes: this.changes.map((change) => ({
                    itemId: change.itemId,
                    canvasId: change.canvasId,
                    oldZIndex: change.oldZIndex,
                    newZIndex: change.newZIndex,
                })),
            });
        }
    }
}

/**
 * Boundary Constraints Utility
 * =============================
 *
 * Utilities for constraining component placement and sizing within canvas boundaries.
 * Ensures components stay fully within canvas and handles size fitting when needed.
 *
 * ## Problem
 *
 * Components can be placed or dragged such that they extend beyond canvas boundaries:
 * - Dropped from palette outside canvas bounds
 * - Dragged beyond edges
 * - Default size larger than canvas
 *
 * ## Solution
 *
 * Provides constraint functions that:
 * 1. Validate component can fit within canvas (respecting minSize)
 * 2. Adjust size to fit canvas if needed (respecting minSize/maxSize)
 * 3. Constrain position to keep component fully within bounds
 * @module boundary-constraints
 */
/**
 * Canvas dimensions in grid units
 *
 * **Standard canvas size**:
 * - Width: 50 units (100% width, 2% per unit)
 * - Height: Unlimited (grows with content)
 */
const CANVAS_WIDTH_UNITS = 50;
/**
 * Validate if component can fit within canvas
 *
 * Checks if component's minimum size is smaller than or equal to canvas size.
 * If component's minSize > canvas size, placement should be rejected.
 * @param definition - Component definition with min/max size constraints
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns true if component can fit, false if too large
 * @example
 * ```typescript
 * const hugeComponent = {
 *   type: 'huge-widget',
 *   minSize: { width: 60, height: 10 } // 60 > 50 canvas width
 * };
 *
 * if (!canComponentFitCanvas(hugeComponent)) {
 *   console.warn('Component too large for canvas');
 *   return; // Don't allow placement
 * }
 * ```
 */
function canComponentFitCanvas(definition, canvasWidth = CANVAS_WIDTH_UNITS) {
    var _a;
    // Get minimum size (or use default minimums if not specified)
    const minWidth = ((_a = definition.minSize) === null || _a === void 0 ? void 0 : _a.width) || 0;
    // Check if minimum size fits within canvas
    // Height is unlimited, so only check width
    return minWidth <= canvasWidth;
}
/**
 * Constrain component size to fit within canvas
 *
 * Adjusts component size if default size exceeds canvas bounds,
 * while respecting min/max size constraints.
 *
 * **Size adjustment rules**:
 * 1. If defaultSize fits, use it
 * 2. If defaultSize > canvas, shrink to canvas size
 * 3. Never shrink below minSize
 * 4. Never grow beyond maxSize
 *
 * **Width constraint**: Canvas width (50 units)
 * **Height constraint**: None (canvas height grows with content)
 * @param definition - Component definition
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained size and adjustment flag
 * @example
 * ```typescript
 * const wideComponent = {
 *   type: 'banner',
 *   defaultSize: { width: 60, height: 10 }, // Too wide
 *   minSize: { width: 20, height: 5 }
 * };
 *
 * const size = constrainSizeToCanvas(wideComponent);
 * // { width: 50, height: 10, wasAdjusted: true }
 * ```
 */
function constrainSizeToCanvas(definition, canvasWidth = CANVAS_WIDTH_UNITS) {
    var _a, _b, _c, _d;
    const defaultWidth = definition.defaultSize.width;
    const defaultHeight = definition.defaultSize.height;
    const minWidth = ((_a = definition.minSize) === null || _a === void 0 ? void 0 : _a.width) || 0;
    const maxWidth = ((_b = definition.maxSize) === null || _b === void 0 ? void 0 : _b.width) || Infinity;
    let width = defaultWidth;
    let height = defaultHeight;
    let wasAdjusted = false;
    // Constrain width to canvas
    if (width > canvasWidth) {
        width = canvasWidth;
        wasAdjusted = true;
    }
    // Respect minSize
    if (width < minWidth) {
        width = minWidth;
    }
    // Respect maxSize
    if (width > maxWidth) {
        width = maxWidth;
    }
    // Height is not constrained by canvas (canvas grows vertically)
    // but still respect min/max if specified
    const minHeight = ((_c = definition.minSize) === null || _c === void 0 ? void 0 : _c.height) || 0;
    const maxHeight = ((_d = definition.maxSize) === null || _d === void 0 ? void 0 : _d.height) || Infinity;
    if (height < minHeight) {
        height = minHeight;
    }
    if (height > maxHeight) {
        height = maxHeight;
    }
    return { width, height, wasAdjusted };
}
/**
 * Constrain component position to keep it fully within canvas bounds
 *
 * Adjusts position so component stays completely inside canvas.
 * Snaps to edges if component would extend beyond boundaries.
 *
 * **Boundary rules**:
 * - Left edge: x >= 0
 * - Right edge: x + width <= canvasWidth
 * - Top edge: y >= 0
 * - Bottom edge: No constraint (canvas height grows)
 * @param x - Desired x position in grid units
 * @param y - Desired y position in grid units
 * @param width - Component width in grid units
 * @param height - Component height in grid units
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained placement
 * @example
 * ```typescript
 * // Component would extend beyond right edge
 * const placement = constrainPositionToCanvas(45, 10, 20, 10);
 * // { x: 30, y: 10, width: 20, height: 10, positionAdjusted: true, sizeAdjusted: false }
 * // Adjusted from 45 to 30 so (30 + 20 = 50) stays within canvas
 * ```
 */
function constrainPositionToCanvas(x, y, width, height, canvasWidth = CANVAS_WIDTH_UNITS) {
    let newX = x;
    let newY = y;
    let positionAdjusted = false;
    // Constrain left edge
    if (newX < 0) {
        newX = 0;
        positionAdjusted = true;
    }
    // Constrain right edge
    if (newX + width > canvasWidth) {
        newX = canvasWidth - width;
        positionAdjusted = true;
    }
    // Constrain top edge
    if (newY < 0) {
        newY = 0;
        positionAdjusted = true;
    }
    // No bottom edge constraint - canvas grows vertically
    // Ensure position doesn't go negative after adjustment
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    return {
        x: newX,
        y: newY,
        width,
        height,
        positionAdjusted,
        sizeAdjusted: false,
    };
}
/**
 * Apply full boundary constraints to component placement
 *
 * Complete constraint pipeline:
 * 1. Check if component can fit (validate minSize <= canvas)
 * 2. Adjust size to fit canvas (if needed)
 * 3. Constrain position to keep within bounds
 *
 * **Returns null if component cannot fit** (minSize > canvas)
 * @param definition - Component definition
 * @param x - Desired x position in grid units
 * @param y - Desired y position in grid units
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained placement, or null if component too large
 * @example
 * ```typescript
 * const definition = {
 *   type: 'widget',
 *   defaultSize: { width: 60, height: 10 },
 *   minSize: { width: 20, height: 5 }
 * };
 *
 * const placement = applyBoundaryConstraints(definition, 45, 10);
 * // {
 * //   x: 0,              // Adjusted from 45 to fit
 * //   y: 10,             // No Y adjustment needed
 * //   width: 50,         // Shrunk from 60 to fit canvas
 * //   height: 10,        // No height adjustment
 * //   positionAdjusted: true,
 * //   sizeAdjusted: true
 * // }
 * ```
 */
function applyBoundaryConstraints(definition, x, y, canvasWidth = CANVAS_WIDTH_UNITS) {
    var _a;
    // 1. Validate component can fit
    if (!canComponentFitCanvas(definition, canvasWidth)) {
        console.warn(`Component "${definition.name}" minSize (${(_a = definition.minSize) === null || _a === void 0 ? void 0 : _a.width}) ` +
            `exceeds canvas width (${canvasWidth}). Placement rejected.`);
        return null;
    }
    // 2. Adjust size to fit canvas
    const constrainedSize = constrainSizeToCanvas(definition, canvasWidth);
    // 3. Constrain position to keep within bounds
    const constrainedPlacement = constrainPositionToCanvas(x, y, constrainedSize.width, constrainedSize.height, canvasWidth);
    // Combine size and position adjustments
    return Object.assign(Object.assign({}, constrainedPlacement), { sizeAdjusted: constrainedSize.wasAdjusted });
}

export { AddCanvasCommand as A, BatchUpdateConfigCommand as B, CANVAS_WIDTH_UNITS as C, MoveItemCommand as M, RemoveCanvasCommand as R, applyBoundaryConstraints as a, ChangeZIndexCommand as b, constrainPositionToCanvas as c, BatchDeleteCommand as d, BatchAddCommand as e };
//# sourceMappingURL=boundary-constraints-C3wJWX8q.js.map

//# sourceMappingURL=boundary-constraints-C3wJWX8q.js.map