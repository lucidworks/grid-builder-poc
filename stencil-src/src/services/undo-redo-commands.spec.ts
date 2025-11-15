import { GridItem, gridState, reset } from './state-manager';
import { AddItemCommand, DeleteItemCommand, MoveItemCommand } from './undo-redo-commands';

// Helper function to create a test item
function createTestItem(id: string, canvasId: string, x: number = 0, y: number = 0): GridItem {
  return {
    id,
    canvasId,
    type: 'text',
    name: `Test Item ${id}`,
    layouts: {
      desktop: { x, y, width: 10, height: 6 },
      mobile: { x: null, y: null, width: null, height: null, customized: false },
    },
    zIndex: 1,
  };
}

describe('undo-redo-commands', () => {
  beforeEach(() => {
    // Reset state before each test
    reset();
  });

  describe('AddItemCommand', () => {
    it('should undo item addition by removing it', () => {
      const item = createTestItem('item-1', 'canvas1');
      const command = new AddItemCommand('canvas1', item);

      // Add item to canvas
      gridState.canvases.canvas1.items.push(item);
      expect(gridState.canvases.canvas1.items).toHaveLength(1);

      // Undo should remove it
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(0);
    });

    it('should redo item addition', () => {
      const item = createTestItem('item-1', 'canvas1');
      const command = new AddItemCommand('canvas1', item);

      // Redo should add the item
      command.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0].id).toBe('item-1');
    });

    it('should clear selection when undoing if item was selected', () => {
      const item = createTestItem('item-1', 'canvas1');
      const command = new AddItemCommand('canvas1', item);

      // Add item and select it
      gridState.canvases.canvas1.items.push(item);
      gridState.selectedItemId = 'item-1';
      gridState.selectedCanvasId = 'canvas1';

      // Undo should clear selection
      command.undo();
      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();
    });

    it('should not clear selection when undoing if different item was selected', () => {
      const item1 = createTestItem('item-1', 'canvas1');
      const item2 = createTestItem('item-2', 'canvas1');
      const command = new AddItemCommand('canvas1', item1);

      // Add both items and select item2
      gridState.canvases.canvas1.items.push(item1, item2);
      gridState.selectedItemId = 'item-2';
      gridState.selectedCanvasId = 'canvas1';

      // Undo should not clear selection
      command.undo();
      expect(gridState.selectedItemId).toBe('item-2');
      expect(gridState.selectedCanvasId).toBe('canvas1');
    });

    it('should handle undo/redo for non-existent canvas gracefully', () => {
      const item = createTestItem('item-1', 'canvas99');
      const command = new AddItemCommand('canvas99', item);

      // Should not throw error
      command.undo();
      command.redo();
    });

    it('should preserve item state across undo/redo', () => {
      const item = createTestItem('item-1', 'canvas1', 5, 10);
      const command = new AddItemCommand('canvas1', item);

      command.redo();
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.x).toBe(5);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.y).toBe(10);

      command.undo();
      command.redo();
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.x).toBe(5);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.y).toBe(10);
    });
  });

  describe('DeleteItemCommand', () => {
    it('should undo item deletion by re-adding it', () => {
      const item = createTestItem('item-1', 'canvas1');
      const command = new DeleteItemCommand('canvas1', item, 0);

      // Undo should re-add the item
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0].id).toBe('item-1');
    });

    it('should redo item deletion by removing it again', () => {
      const item = createTestItem('item-1', 'canvas1');
      const command = new DeleteItemCommand('canvas1', item, 0);

      // First undo to add the item
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);

      // Redo should remove it
      command.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(0);
    });

    it('should restore item at original index when undoing', () => {
      const item1 = createTestItem('item-1', 'canvas1');
      const item2 = createTestItem('item-2', 'canvas1');
      const item3 = createTestItem('item-3', 'canvas1');

      // Set up canvas with items 1 and 3, simulating item 2 was at index 1
      gridState.canvases.canvas1.items = [item1, item3];
      const command = new DeleteItemCommand('canvas1', item2, 1);

      // Undo should restore item2 at index 1
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(3);
      expect(gridState.canvases.canvas1.items[0].id).toBe('item-1');
      expect(gridState.canvases.canvas1.items[1].id).toBe('item-2');
      expect(gridState.canvases.canvas1.items[2].id).toBe('item-3');
    });

    it('should handle invalid index by appending to end', () => {
      const item1 = createTestItem('item-1', 'canvas1');
      const item2 = createTestItem('item-2', 'canvas1');

      gridState.canvases.canvas1.items = [item1];
      const command = new DeleteItemCommand('canvas1', item2, -1);

      // Undo with invalid index should append to end
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(2);
      expect(gridState.canvases.canvas1.items[1].id).toBe('item-2');
    });

    it('should clear selection when redoing if item was selected', () => {
      const item = createTestItem('item-1', 'canvas1');
      const command = new DeleteItemCommand('canvas1', item, 0);

      // Undo to add item, then select it
      command.undo();
      gridState.selectedItemId = 'item-1';
      gridState.selectedCanvasId = 'canvas1';

      // Redo should clear selection
      command.redo();
      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();
    });

    it('should handle undo/redo for non-existent canvas gracefully', () => {
      const item = createTestItem('item-1', 'canvas99');
      const command = new DeleteItemCommand('canvas99', item, 0);

      // Should not throw error
      command.undo();
      command.redo();
    });

    it('should preserve item state across undo/redo', () => {
      const item = createTestItem('item-1', 'canvas1', 15, 20);
      const command = new DeleteItemCommand('canvas1', item, 0);

      command.undo();
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.x).toBe(15);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.y).toBe(20);

      command.redo();
      command.undo();
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.x).toBe(15);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.y).toBe(20);
    });
  });

  describe('MoveItemCommand', () => {
    it('should undo item move by restoring to source position', () => {
      const item = createTestItem('item-1', 'canvas2', 10, 10);
      gridState.canvases.canvas2.items.push(item);

      const command = new MoveItemCommand('item-1', 'canvas1', 'canvas2', { x: 0, y: 0 }, { x: 10, y: 10 }, 0);

      // Undo should move item back to canvas1
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas2.items).toHaveLength(0);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.x).toBe(0);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.y).toBe(0);
    });

    it('should redo item move to target position', () => {
      const item = createTestItem('item-1', 'canvas1', 0, 0);
      gridState.canvases.canvas1.items.push(item);

      const command = new MoveItemCommand('item-1', 'canvas1', 'canvas2', { x: 0, y: 0 }, { x: 10, y: 10 }, 0);

      // Redo should move item to canvas2
      command.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(0);
      expect(gridState.canvases.canvas2.items).toHaveLength(1);
      expect(gridState.canvases.canvas2.items[0].layouts.desktop.x).toBe(10);
      expect(gridState.canvases.canvas2.items[0].layouts.desktop.y).toBe(10);
    });

    it('should handle move within same canvas', () => {
      const item = createTestItem('item-1', 'canvas1', 0, 0);
      gridState.canvases.canvas1.items.push(item);

      const command = new MoveItemCommand('item-1', 'canvas1', 'canvas1', { x: 0, y: 0 }, { x: 20, y: 20 }, 0);

      // Redo should update position
      command.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.x).toBe(20);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.y).toBe(20);

      // Undo should restore position
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.x).toBe(0);
      expect(gridState.canvases.canvas1.items[0].layouts.desktop.y).toBe(0);
    });

    it('should restore item at original index when undoing', () => {
      const item1 = createTestItem('item-1', 'canvas1');
      const item2 = createTestItem('item-2', 'canvas2');
      const item3 = createTestItem('item-3', 'canvas1');

      gridState.canvases.canvas1.items = [item1, item3];
      gridState.canvases.canvas2.items = [item2];

      const command = new MoveItemCommand(
        'item-2',
        'canvas1',
        'canvas2',
        { x: 5, y: 5 },
        { x: 10, y: 10 },
        1 // Original index in canvas1
      );

      // Undo should restore item2 to index 1 in canvas1
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(3);
      expect(gridState.canvases.canvas1.items[0].id).toBe('item-1');
      expect(gridState.canvases.canvas1.items[1].id).toBe('item-2');
      expect(gridState.canvases.canvas1.items[2].id).toBe('item-3');
    });

    it('should handle invalid source index by appending to end', () => {
      const item = createTestItem('item-1', 'canvas2');
      gridState.canvases.canvas2.items = [item];

      const command = new MoveItemCommand(
        'item-1',
        'canvas1',
        'canvas2',
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        -1 // Invalid index
      );

      // Undo with invalid index should append to end
      command.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
    });

    it('should handle non-existent item gracefully', () => {
      const command = new MoveItemCommand('non-existent', 'canvas1', 'canvas2', { x: 0, y: 0 }, { x: 10, y: 10 }, 0);

      // Should not throw error
      command.undo();
      command.redo();
    });

    it('should handle non-existent canvas gracefully', () => {
      const item = createTestItem('item-1', 'canvas1');
      gridState.canvases.canvas1.items = [item];

      const command = new MoveItemCommand('item-1', 'canvas99', 'canvas88', { x: 0, y: 0 }, { x: 10, y: 10 }, 0);

      // Should not throw error
      command.redo();
      command.undo();
    });

    it('should update canvasId when moving between canvases', () => {
      const item = createTestItem('item-1', 'canvas1', 0, 0);
      gridState.canvases.canvas1.items.push(item);

      const command = new MoveItemCommand('item-1', 'canvas1', 'canvas2', { x: 0, y: 0 }, { x: 10, y: 10 }, 0);

      // After redo, item should have canvas2 as canvasId
      command.redo();
      expect(gridState.canvases.canvas2.items[0].canvasId).toBe('canvas2');

      // After undo, item should have canvas1 as canvasId
      command.undo();
      expect(gridState.canvases.canvas1.items[0].canvasId).toBe('canvas1');
    });

    it('should preserve other item properties during move', () => {
      const item = createTestItem('item-1', 'canvas1', 0, 0);
      item.name = 'Special Item';
      item.type = 'header';
      item.zIndex = 99;
      gridState.canvases.canvas1.items.push(item);

      const command = new MoveItemCommand('item-1', 'canvas1', 'canvas2', { x: 0, y: 0 }, { x: 10, y: 10 }, 0);

      command.redo();
      const movedItem = gridState.canvases.canvas2.items[0];
      expect(movedItem.name).toBe('Special Item');
      expect(movedItem.type).toBe('header');
      expect(movedItem.zIndex).toBe(99);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle sequence of add, delete, move commands', () => {
      // Add item1 to canvas1
      const item1 = createTestItem('item-1', 'canvas1', 0, 0);
      const addCmd = new AddItemCommand('canvas1', item1);
      addCmd.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);

      // Move item1 to canvas2
      const moveCmd = new MoveItemCommand('item-1', 'canvas1', 'canvas2', { x: 0, y: 0 }, { x: 10, y: 10 }, 0);
      moveCmd.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(0);
      expect(gridState.canvases.canvas2.items).toHaveLength(1);

      // Delete item1 from canvas2
      const deleteCmd = new DeleteItemCommand('canvas2', item1, 0);
      deleteCmd.redo();
      expect(gridState.canvases.canvas2.items).toHaveLength(0);

      // Undo delete
      deleteCmd.undo();
      expect(gridState.canvases.canvas2.items).toHaveLength(1);

      // Undo move
      moveCmd.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas2.items).toHaveLength(0);

      // Undo add
      addCmd.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(0);
    });

    it('should handle multiple undo/redo cycles', () => {
      const item = createTestItem('item-1', 'canvas1');
      const command = new AddItemCommand('canvas1', item);

      // Multiple redo/undo cycles
      for (let i = 0; i < 3; i++) {
        command.redo();
        expect(gridState.canvases.canvas1.items).toHaveLength(1);

        command.undo();
        expect(gridState.canvases.canvas1.items).toHaveLength(0);
      }
    });

    it('should maintain state consistency across multiple commands', () => {
      const item1 = createTestItem('item-1', 'canvas1', 0, 0);
      const item2 = createTestItem('item-2', 'canvas1', 5, 5);

      const add1 = new AddItemCommand('canvas1', item1);
      const add2 = new AddItemCommand('canvas1', item2);

      add1.redo();
      add2.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(2);

      add2.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0].id).toBe('item-1');

      add1.undo();
      expect(gridState.canvases.canvas1.items).toHaveLength(0);

      add1.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0].id).toBe('item-1');

      add2.redo();
      expect(gridState.canvases.canvas1.items).toHaveLength(2);
    });
  });
});
