import { s as state } from './state-manager-b0e7f282.js';

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
 *
 * @param canvasId - Canvas containing the item
 * @param itemId - Item to remove
 *
 * @example
 * ```typescript
 * // Used internally by commands
 * undo() {
 *   removeItemFromCanvas(this.canvasId, this.item.id);
 * }
 * ```
 *
 * @private
 */
function removeItemFromCanvas(canvasId, itemId) {
    const canvas = state.canvases[canvasId];
    if (!canvas) {
        return;
    }
    canvas.items = canvas.items.filter((i) => i.id !== itemId);
    state.canvases = Object.assign({}, state.canvases);
    // Clear selection if this item was selected
    if (state.selectedItemId === itemId) {
        state.selectedItemId = null;
        state.selectedCanvasId = null;
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
class AddItemCommand {
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
        const canvas = state.canvases[this.canvasId];
        if (!canvas) {
            return;
        }
        // Use the cloned item state
        const itemCopy = JSON.parse(JSON.stringify(this.item));
        canvas.items.push(itemCopy);
        state.canvases = Object.assign({}, state.canvases);
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
class DeleteItemCommand {
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
        const canvas = state.canvases[this.canvasId];
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
        state.canvases = Object.assign({}, state.canvases);
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
 * Captures the movement of an item within or between canvases
 */
class MoveItemCommand {
    constructor(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, sourceIndex) {
        this.itemId = itemId;
        this.sourceCanvasId = sourceCanvasId;
        this.targetCanvasId = targetCanvasId;
        this.sourcePosition = Object.assign({}, sourcePosition);
        this.targetPosition = Object.assign({}, targetPosition);
        this.sourceIndex = sourceIndex;
    }
    undo() {
        // Find the item in target canvas
        const targetCanvas = state.canvases[this.targetCanvasId];
        const item = targetCanvas === null || targetCanvas === void 0 ? void 0 : targetCanvas.items.find((i) => i.id === this.itemId);
        if (!item) {
            return;
        }
        // Remove from target canvas
        targetCanvas.items = targetCanvas.items.filter((i) => i.id !== this.itemId);
        // Update item's position and canvasId back to source
        item.canvasId = this.sourceCanvasId;
        item.layouts.desktop.x = this.sourcePosition.x;
        item.layouts.desktop.y = this.sourcePosition.y;
        // Add back to source canvas at original index
        const sourceCanvas = state.canvases[this.sourceCanvasId];
        if (!sourceCanvas) {
            return;
        }
        if (this.sourceIndex >= 0 && this.sourceIndex <= sourceCanvas.items.length) {
            sourceCanvas.items.splice(this.sourceIndex, 0, item);
        }
        else {
            sourceCanvas.items.push(item);
        }
        state.canvases = Object.assign({}, state.canvases);
    }
    redo() {
        // Find the item in source canvas
        const sourceCanvas = state.canvases[this.sourceCanvasId];
        const item = sourceCanvas === null || sourceCanvas === void 0 ? void 0 : sourceCanvas.items.find((i) => i.id === this.itemId);
        if (!item) {
            return;
        }
        // Remove from source canvas
        sourceCanvas.items = sourceCanvas.items.filter((i) => i.id !== this.itemId);
        // Update item's position and canvasId to target
        item.canvasId = this.targetCanvasId;
        item.layouts.desktop.x = this.targetPosition.x;
        item.layouts.desktop.y = this.targetPosition.y;
        // Add to target canvas
        const targetCanvas = state.canvases[this.targetCanvasId];
        if (!targetCanvas) {
            return;
        }
        targetCanvas.items.push(item);
        state.canvases = Object.assign({}, state.canvases);
    }
}

export { AddItemCommand as A, DeleteItemCommand as D, MoveItemCommand as M };

//# sourceMappingURL=undo-redo-commands-6dcc86c6.js.map