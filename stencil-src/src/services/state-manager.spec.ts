import {
  addItemToCanvas,
  deselectItem,
  generateItemId,
  getItem,
  gridState,
  moveItemToCanvas,
  removeItemFromCanvas,
  reset,
  selectItem,
  updateItem,
} from './state-manager';

describe('state-manager', () => {
  beforeEach(() => {
    // Reset state before each test
    reset();
  });

  describe('Initial State', () => {
    it('should have three canvases', () => {
      expect(Object.keys(gridState.canvases)).toHaveLength(3);
      expect(gridState.canvases.canvas1).toBeDefined();
      expect(gridState.canvases.canvas2).toBeDefined();
      expect(gridState.canvases.canvas3).toBeDefined();
    });

    it('should have desktop as default viewport', () => {
      expect(gridState.currentViewport).toBe('desktop');
    });

    it('should show grid by default', () => {
      expect(gridState.showGrid).toBe(true);
    });

    it('should have no item selected', () => {
      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();
    });

    it('should have empty items in each canvas', () => {
      expect(gridState.canvases.canvas1.items).toHaveLength(0);
      expect(gridState.canvases.canvas2.items).toHaveLength(0);
      expect(gridState.canvases.canvas3.items).toHaveLength(0);
    });
  });

  describe('generateItemId', () => {
    it('should generate unique sequential IDs', () => {
      const id1 = generateItemId();
      const id2 = generateItemId();
      const id3 = generateItemId();

      expect(id1).toBe('item-1');
      expect(id2).toBe('item-2');
      expect(id3).toBe('item-3');
    });
  });

  describe('addItemToCanvas', () => {
    it('should add item to canvas', () => {
      const item = {
        id: 'test-1',
        canvasId: 'canvas1',
        type: 'text',
        name: 'Test Item',
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 1,
      };

      addItemToCanvas('canvas1', item);

      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0]).toEqual(item);
    });

    it('should not add item to non-existent canvas', () => {
      const item = {
        id: 'test-1',
        canvasId: 'canvas99',
        type: 'text',
        name: 'Test Item',
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 1,
      };

      addItemToCanvas('canvas99', item);

      // Should not throw error, just silently fail
      expect(gridState.canvases.canvas1.items).toHaveLength(0);
    });
  });

  describe('removeItemFromCanvas', () => {
    beforeEach(() => {
      const item = {
        id: 'test-1',
        canvasId: 'canvas1',
        type: 'text',
        name: 'Test Item',
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 1,
      };
      addItemToCanvas('canvas1', item);
    });

    it('should remove item from canvas', () => {
      expect(gridState.canvases.canvas1.items).toHaveLength(1);

      removeItemFromCanvas('canvas1', 'test-1');

      expect(gridState.canvases.canvas1.items).toHaveLength(0);
    });

    it('should not affect other items', () => {
      const item2 = {
        id: 'test-2',
        canvasId: 'canvas1',
        type: 'text',
        name: 'Test Item 2',
        layouts: {
          desktop: { x: 10, y: 0, width: 10, height: 6 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 2,
      };
      addItemToCanvas('canvas1', item2);

      removeItemFromCanvas('canvas1', 'test-1');

      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0].id).toBe('test-2');
    });

    it('should handle removing non-existent item', () => {
      removeItemFromCanvas('canvas1', 'non-existent');

      expect(gridState.canvases.canvas1.items).toHaveLength(1);
    });
  });

  describe('updateItem', () => {
    beforeEach(() => {
      const item = {
        id: 'test-1',
        canvasId: 'canvas1',
        type: 'text',
        name: 'Test Item',
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 1,
      };
      addItemToCanvas('canvas1', item);
    });

    it('should update item properties', () => {
      updateItem('canvas1', 'test-1', { name: 'Updated Name' });

      const item = gridState.canvases.canvas1.items[0];
      expect(item.name).toBe('Updated Name');
    });

    it('should update nested properties', () => {
      updateItem('canvas1', 'test-1', {
        layouts: {
          desktop: { x: 5, y: 5, width: 15, height: 10 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
      });

      const item = gridState.canvases.canvas1.items[0];
      expect(item.layouts.desktop.x).toBe(5);
      expect(item.layouts.desktop.width).toBe(15);
    });

    it('should handle non-existent item', () => {
      updateItem('canvas1', 'non-existent', { name: 'Updated' });

      // Should not throw error
      expect(gridState.canvases.canvas1.items[0].name).toBe('Test Item');
    });
  });

  describe('getItem', () => {
    beforeEach(() => {
      const item = {
        id: 'test-1',
        canvasId: 'canvas1',
        type: 'text',
        name: 'Test Item',
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 1,
      };
      addItemToCanvas('canvas1', item);
    });

    it('should get item by id', () => {
      const item = getItem('canvas1', 'test-1');

      expect(item).toBeDefined();
      expect(item?.id).toBe('test-1');
      expect(item?.name).toBe('Test Item');
    });

    it('should return null for non-existent item', () => {
      const item = getItem('canvas1', 'non-existent');

      expect(item).toBeNull();
    });

    it('should return null for non-existent canvas', () => {
      const item = getItem('canvas99', 'test-1');

      expect(item).toBeNull();
    });
  });

  describe('moveItemToCanvas', () => {
    beforeEach(() => {
      const item = {
        id: 'test-1',
        canvasId: 'canvas1',
        type: 'text',
        name: 'Test Item',
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 1,
      };
      addItemToCanvas('canvas1', item);
    });

    it('should move item to different canvas', () => {
      moveItemToCanvas('canvas1', 'canvas2', 'test-1');

      expect(gridState.canvases.canvas1.items).toHaveLength(0);
      expect(gridState.canvases.canvas2.items).toHaveLength(1);
      expect(gridState.canvases.canvas2.items[0].id).toBe('test-1');
    });

    it('should update item canvasId', () => {
      moveItemToCanvas('canvas1', 'canvas2', 'test-1');

      const item = gridState.canvases.canvas2.items[0];
      expect(item.canvasId).toBe('canvas2');
    });

    it('should handle non-existent item', () => {
      moveItemToCanvas('canvas1', 'canvas2', 'non-existent');

      // Should not throw error
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas2.items).toHaveLength(0);
    });

    it('should handle non-existent canvas', () => {
      moveItemToCanvas('canvas99', 'canvas2', 'test-1');

      // Should not throw error
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
    });
  });

  describe('selectItem', () => {
    it('should select an item', () => {
      selectItem('test-1', 'canvas1');

      expect(gridState.selectedItemId).toBe('test-1');
      expect(gridState.selectedCanvasId).toBe('canvas1');
    });
  });

  describe('deselectItem', () => {
    it('should deselect item', () => {
      selectItem('test-1', 'canvas1');
      deselectItem();

      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();
    });
  });
});
