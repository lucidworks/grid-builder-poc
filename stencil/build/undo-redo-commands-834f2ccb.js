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
 * Captures the addition of a new item to a canvas
 */
class AddItemCommand {
    constructor(canvasId, item) {
        this.canvasId = canvasId;
        // Deep clone the item to capture its state at time of creation
        this.item = JSON.parse(JSON.stringify(item));
    }
    undo() {
        // Remove the item from the canvas
        removeItemFromCanvas(this.canvasId, this.item.id);
    }
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
 * Captures the deletion of an item from a canvas
 */
class DeleteItemCommand {
    constructor(canvasId, item, itemIndex) {
        this.canvasId = canvasId;
        // Deep clone the item to capture its state before deletion
        this.item = JSON.parse(JSON.stringify(item));
        this.itemIndex = itemIndex;
    }
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

//# sourceMappingURL=undo-redo-commands-834f2ccb.js.map