import { s as state } from './state-manager-6c3d6100.js';

/**
 * Undo/Redo Commands
 * Concrete command implementations for grid operations
 */
/**
 * Helper function to remove an item from a canvas and clear selection if needed
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
        const canvas = state.canvases[this.canvasId];
        if (!canvas) {
            return;
        }
        canvas.items = canvas.items.filter((i) => i.id !== this.item.id);
        state.canvases = Object.assign({}, state.canvases);
        // Clear selection if this item was selected
        if (state.selectedItemId === this.item.id) {
            state.selectedItemId = null;
            state.selectedCanvasId = null;
        }
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

//# sourceMappingURL=undo-redo-commands-d4c50da1.js.map