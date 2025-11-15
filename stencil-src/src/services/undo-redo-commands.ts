/**
 * Undo/Redo Commands
 * Concrete command implementations for grid operations
 */

import { GridItem, gridState } from './state-manager';
import { Command } from './undo-redo';

/**
 * AddItemCommand
 * Captures the addition of a new item to a canvas
 */
export class AddItemCommand implements Command {
  private item: GridItem;
  private canvasId: string;

  constructor(canvasId: string, item: GridItem) {
    this.canvasId = canvasId;
    // Deep clone the item to capture its state at time of creation
    this.item = JSON.parse(JSON.stringify(item));
  }

  undo(): void {
    // Remove the item from the canvas
    const canvas = gridState.canvases[this.canvasId];
    if (!canvas) {
      return;
    }

    canvas.items = canvas.items.filter((i) => i.id !== this.item.id);
    gridState.canvases = { ...gridState.canvases };

    // Clear selection if this item was selected
    if (gridState.selectedItemId === this.item.id) {
      gridState.selectedItemId = null;
      gridState.selectedCanvasId = null;
    }
  }

  redo(): void {
    // Re-add the item to the canvas
    const canvas = gridState.canvases[this.canvasId];
    if (!canvas) {
      return;
    }

    // Use the cloned item state
    const itemCopy = JSON.parse(JSON.stringify(this.item));
    canvas.items.push(itemCopy);
    gridState.canvases = { ...gridState.canvases };
  }
}

/**
 * DeleteItemCommand
 * Captures the deletion of an item from a canvas
 */
export class DeleteItemCommand implements Command {
  private item: GridItem;
  private canvasId: string;
  private itemIndex: number;

  constructor(canvasId: string, item: GridItem, itemIndex: number) {
    this.canvasId = canvasId;
    // Deep clone the item to capture its state before deletion
    this.item = JSON.parse(JSON.stringify(item));
    this.itemIndex = itemIndex;
  }

  undo(): void {
    // Re-add the item to its original position
    const canvas = gridState.canvases[this.canvasId];
    if (!canvas) {
      return;
    }

    const itemCopy = JSON.parse(JSON.stringify(this.item));
    // Insert at original index if possible, otherwise push to end
    if (this.itemIndex >= 0 && this.itemIndex <= canvas.items.length) {
      canvas.items.splice(this.itemIndex, 0, itemCopy);
    } else {
      canvas.items.push(itemCopy);
    }
    gridState.canvases = { ...gridState.canvases };
  }

  redo(): void {
    // Remove the item again
    const canvas = gridState.canvases[this.canvasId];
    if (!canvas) {
      return;
    }

    canvas.items = canvas.items.filter((i) => i.id !== this.item.id);
    gridState.canvases = { ...gridState.canvases };

    // Clear selection if this item was selected
    if (gridState.selectedItemId === this.item.id) {
      gridState.selectedItemId = null;
      gridState.selectedCanvasId = null;
    }
  }
}

/**
 * MoveItemCommand
 * Captures the movement of an item within or between canvases
 */
export class MoveItemCommand implements Command {
  private itemId: string;
  private sourceCanvasId: string;
  private targetCanvasId: string;
  private sourcePosition: { x: number; y: number };
  private targetPosition: { x: number; y: number };
  private sourceIndex: number;

  constructor(
    itemId: string,
    sourceCanvasId: string,
    targetCanvasId: string,
    sourcePosition: { x: number; y: number },
    targetPosition: { x: number; y: number },
    sourceIndex: number
  ) {
    this.itemId = itemId;
    this.sourceCanvasId = sourceCanvasId;
    this.targetCanvasId = targetCanvasId;
    this.sourcePosition = { ...sourcePosition };
    this.targetPosition = { ...targetPosition };
    this.sourceIndex = sourceIndex;
  }

  undo(): void {
    // Find the item in target canvas
    const targetCanvas = gridState.canvases[this.targetCanvasId];
    const item = targetCanvas?.items.find((i) => i.id === this.itemId);
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
    const sourceCanvas = gridState.canvases[this.sourceCanvasId];
    if (!sourceCanvas) {
      return;
    }

    if (this.sourceIndex >= 0 && this.sourceIndex <= sourceCanvas.items.length) {
      sourceCanvas.items.splice(this.sourceIndex, 0, item);
    } else {
      sourceCanvas.items.push(item);
    }

    gridState.canvases = { ...gridState.canvases };
  }

  redo(): void {
    // Find the item in source canvas
    const sourceCanvas = gridState.canvases[this.sourceCanvasId];
    const item = sourceCanvas?.items.find((i) => i.id === this.itemId);
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
    const targetCanvas = gridState.canvases[this.targetCanvasId];
    if (!targetCanvas) {
      return;
    }

    targetCanvas.items.push(item);

    gridState.canvases = { ...gridState.canvases };
  }
}
