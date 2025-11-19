import { GridBuilderAPI } from './grid-builder-api';
import { gridState, reset as resetState } from './state-manager';
import { clearHistory } from './undo-redo';

describe('GridBuilderAPI', () => {
  let api: GridBuilderAPI;

  beforeEach(() => {
    // Reset state before each test
    resetState();
    clearHistory();

    // Create new API instance
    api = new GridBuilderAPI();
  });

  afterEach(() => {
    // Clean up event listeners
    api.destroy();
  });

  describe('State Access Methods', () => {
    describe('getState', () => {
      it('should return current grid state', () => {
        const state = api.getState();

        expect(state).toBe(gridState);
        expect(state.currentViewport).toBe('desktop');
        expect(state.showGrid).toBe(true);
      });
    });

    describe('getCanvases', () => {
      it('should return all canvases', () => {
        const canvases = api.getCanvases();

        expect(Object.keys(canvases)).toHaveLength(3);
        expect(canvases.canvas1).toBeDefined();
        expect(canvases.canvas2).toBeDefined();
        expect(canvases.canvas3).toBeDefined();
      });
    });

    describe('getCanvas', () => {
      it('should return specific canvas', () => {
        const canvas = api.getCanvas('canvas1');

        expect(canvas).toBeDefined();
        expect(canvas?.items).toEqual([]);
        expect(canvas?.zIndexCounter).toBe(1);
      });

      it('should return null for non-existent canvas', () => {
        const canvas = api.getCanvas('non-existent');

        expect(canvas).toBeNull();
      });
    });

    describe('getItem', () => {
      beforeEach(() => {
        // Add test item
        const item = {
          id: 'test-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          layouts: {
            desktop: { x: 0, y: 0, width: 10, height: 6 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 1,
        };
        gridState.canvases.canvas1.items.push(item);
      });

      it('should return specific item', () => {
        const item = api.getItem('canvas1', 'test-1');

        expect(item).toBeDefined();
        expect(item?.id).toBe('test-1');
        expect(item?.type).toBe('header');
      });

      it('should return null for non-existent item', () => {
        const item = api.getItem('canvas1', 'non-existent');

        expect(item).toBeNull();
      });

      it('should return null for non-existent canvas', () => {
        const item = api.getItem('non-existent', 'test-1');

        expect(item).toBeNull();
      });
    });

    describe('getCurrentViewport', () => {
      it('should return current viewport', () => {
        const viewport = api.getCurrentViewport();

        expect(viewport).toBe('desktop');
      });
    });

    describe('getGridVisibility', () => {
      it('should return grid visibility state', () => {
        const visible = api.getGridVisibility();

        expect(visible).toBe(true);
      });
    });

    describe('getSelectedItem', () => {
      it('should return null when no item selected', () => {
        const selection = api.getSelectedItem();

        expect(selection).toBeNull();
      });

      it('should return selected item info', () => {
        gridState.selectedItemId = 'test-1';
        gridState.selectedCanvasId = 'canvas1';

        const selection = api.getSelectedItem();

        expect(selection).toEqual({
          itemId: 'test-1',
          canvasId: 'canvas1',
        });
      });
    });
  });

  describe('Item Management Methods', () => {
    describe('addItem', () => {
      it('should add item to canvas', () => {
        const item = api.addItem('canvas1', 'header', 10, 10, 20, 15);

        expect(item).toBeDefined();
        expect(item.canvasId).toBe('canvas1');
        expect(item.type).toBe('header');
        expect(item.name).toBe('header');
        expect(item.layouts.desktop).toEqual({
          x: 10,
          y: 10,
          width: 20,
          height: 15,
        });
        expect(gridState.canvases.canvas1.items).toHaveLength(1);
      });

      it('should generate unique item ID', () => {
        const item1 = api.addItem('canvas1', 'header', 0, 0, 10, 10);
        const item2 = api.addItem('canvas1', 'text', 0, 0, 10, 10);

        expect(item1.id).toBe('item-1');
        expect(item2.id).toBe('item-2');
      });

      it('should dispatch itemAdded event', (done) => {
        api.on('itemAdded', (event) => {
          expect(event.item.type).toBe('header');
          expect(event.canvasId).toBe('canvas1');
          done();
        });

        api.addItem('canvas1', 'header', 0, 0, 10, 10);
      });
    });

    describe('removeItem', () => {
      let itemId: string;

      beforeEach(() => {
        const item = api.addItem('canvas1', 'header', 0, 0, 10, 10);
        itemId = item.id;
      });

      it('should remove item from canvas', () => {
        api.removeItem('canvas1', itemId);

        expect(gridState.canvases.canvas1.items).toHaveLength(0);
      });

      it('should dispatch itemRemoved event', (done) => {
        api.on('itemRemoved', (event) => {
          expect(event.itemId).toBe(itemId);
          expect(event.canvasId).toBe('canvas1');
          done();
        });

        api.removeItem('canvas1', itemId);
      });

      it('should handle removing non-existent item', () => {
        expect(() => {
          api.removeItem('canvas1', 'non-existent');
        }).not.toThrow();
      });
    });

    describe('updateItem', () => {
      let itemId: string;

      beforeEach(() => {
        const item = api.addItem('canvas1', 'header', 0, 0, 10, 10);
        itemId = item.id;
      });

      it('should update item properties', () => {
        api.updateItem('canvas1', itemId, {
          layouts: {
            desktop: { x: 5, y: 5, width: 15, height: 12 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
        });

        const item = api.getItem('canvas1', itemId);
        expect(item?.layouts.desktop.x).toBe(5);
        expect(item?.layouts.desktop.width).toBe(15);
      });

      it('should dispatch itemUpdated event', (done) => {
        api.on('itemUpdated', (event) => {
          expect(event.itemId).toBe(itemId);
          expect(event.canvasId).toBe('canvas1');
          done();
        });

        api.updateItem('canvas1', itemId, { name: 'Updated Header' });
      });
    });

    describe('moveItem', () => {
      let itemId: string;

      beforeEach(() => {
        const item = api.addItem('canvas1', 'header', 0, 0, 10, 10);
        itemId = item.id;
      });

      it('should move item to different canvas', () => {
        api.moveItem('canvas1', 'canvas2', itemId);

        expect(gridState.canvases.canvas1.items).toHaveLength(0);
        expect(gridState.canvases.canvas2.items).toHaveLength(1);
        expect(gridState.canvases.canvas2.items[0].id).toBe(itemId);
      });

      it('should update item canvasId', () => {
        api.moveItem('canvas1', 'canvas2', itemId);

        const item = api.getItem('canvas2', itemId);
        expect(item?.canvasId).toBe('canvas2');
      });

      it('should dispatch itemMoved event', (done) => {
        api.on('itemMoved', (event) => {
          expect(event.itemId).toBe(itemId);
          expect(event.fromCanvasId).toBe('canvas1');
          expect(event.toCanvasId).toBe('canvas2');
          done();
        });

        api.moveItem('canvas1', 'canvas2', itemId);
      });
    });
  });

  describe('Selection Methods', () => {
    let itemId: string;

    beforeEach(() => {
      const item = api.addItem('canvas1', 'header', 0, 0, 10, 10);
      itemId = item.id;
    });

    describe('selectItem', () => {
      it('should select an item', () => {
        api.selectItem(itemId, 'canvas1');

        expect(gridState.selectedItemId).toBe(itemId);
        expect(gridState.selectedCanvasId).toBe('canvas1');
      });

      it('should dispatch selectionChanged event', (done) => {
        api.on('selectionChanged', (event) => {
          expect(event.itemId).toBe(itemId);
          expect(event.canvasId).toBe('canvas1');
          done();
        });

        api.selectItem(itemId, 'canvas1');
      });
    });

    describe('deselectItem', () => {
      beforeEach(() => {
        api.selectItem(itemId, 'canvas1');
      });

      it('should deselect item', () => {
        api.deselectItem();

        expect(gridState.selectedItemId).toBeNull();
        expect(gridState.selectedCanvasId).toBeNull();
      });

      it('should dispatch selectionChanged event', (done) => {
        api.on('selectionChanged', (event) => {
          expect(event.itemId).toBeNull();
          expect(event.canvasId).toBeNull();
          done();
        });

        api.deselectItem();
      });
    });
  });

  describe('Viewport and Display Methods', () => {
    describe('setViewport', () => {
      it('should change viewport', () => {
        api.setViewport('mobile');

        expect(gridState.currentViewport).toBe('mobile');
      });

      it('should dispatch viewportChanged event', (done) => {
        api.on('viewportChanged', (event) => {
          expect(event.newViewport).toBe('mobile');
          done();
        });

        api.setViewport('mobile');
      });
    });

    describe('toggleGrid', () => {
      it('should toggle grid visibility', () => {
        api.toggleGrid(false);
        expect(gridState.showGrid).toBe(false);

        api.toggleGrid(true);
        expect(gridState.showGrid).toBe(true);
      });

      it('should dispatch gridVisibilityChanged event', (done) => {
        api.on('gridVisibilityChanged', (event) => {
          expect(event.visible).toBe(false);
          done();
        });

        api.toggleGrid(false);
      });
    });

  });

  describe('Undo/Redo Methods', () => {
    beforeEach(() => {
      api.addItem('canvas1', 'header', 0, 0, 10, 10);
    });

    describe('undo', () => {
      it('should undo last action', () => {
        expect(gridState.canvases.canvas1.items).toHaveLength(1);

        api.undo();

        expect(gridState.canvases.canvas1.items).toHaveLength(0);
      });

      it('should dispatch stateChanged event', (done) => {
        api.on('stateChanged', () => {
          done();
        });

        api.undo();
      });
    });

    describe('redo', () => {
      it('should redo undone action', () => {
        api.undo();
        expect(gridState.canvases.canvas1.items).toHaveLength(0);

        api.redo();

        expect(gridState.canvases.canvas1.items).toHaveLength(1);
      });

      it('should dispatch stateChanged event', (done) => {
        api.undo();

        api.on('stateChanged', () => {
          done();
        });

        api.redo();
      });
    });

    describe('canUndo', () => {
      it('should return true when undo available', () => {
        expect(api.canUndo()).toBe(true);
      });

      it('should return false when no undo available', () => {
        api.undo();
        expect(api.canUndo()).toBe(false);
      });
    });

    describe('canRedo', () => {
      it('should return false when no redo available', () => {
        expect(api.canRedo()).toBe(false);
      });

      it('should return true when redo available', () => {
        api.undo();
        expect(api.canRedo()).toBe(true);
      });
    });

    describe('clearHistory', () => {
      it('should clear undo/redo history', () => {
        api.clearHistory();

        expect(api.canUndo()).toBe(false);
        expect(api.canRedo()).toBe(false);
      });
    });
  });

  describe('State Management Methods', () => {
    describe('exportState', () => {
      it('should export grid state as JSON', () => {
        api.addItem('canvas1', 'header', 0, 0, 10, 10);

        const json = api.exportState();
        const state = JSON.parse(json);

        expect(state.canvases.canvas1.items).toHaveLength(1);
        expect(state.currentViewport).toBe('desktop');
      });
    });

    describe('importState', () => {
      it('should import grid state from JSON', () => {
        const originalState = {
          canvases: {
            canvas1: {
              items: [
                {
                  id: 'imported-1',
                  canvasId: 'canvas1',
                  type: 'header',
                  name: 'Imported Header',
                  layouts: {
                    desktop: { x: 5, y: 5, width: 10, height: 10 },
                    mobile: { x: null, y: null, width: null, height: null, customized: false },
                  },
                  zIndex: 1,
                },
              ],
              zIndexCounter: 2,
            },
            canvas2: { items: [], zIndexCounter: 1 },
            canvas3: { items: [], zIndexCounter: 1 },
          },
          selectedItemId: null,
          selectedCanvasId: null,
          currentViewport: 'mobile' as const,
          showGrid: false,
        };

        api.importState(JSON.stringify(originalState));

        expect(gridState.canvases.canvas1.items).toHaveLength(1);
        expect(gridState.canvases.canvas1.items[0].id).toBe('imported-1');
        expect(gridState.canvases.canvas1.zIndexCounter).toBe(2);
        expect(gridState.currentViewport).toBe('mobile');
        expect(gridState.showGrid).toBe(false);
      });

      it('should dispatch stateChanged event', (done) => {
        const state = {
          canvases: {
            canvas1: { items: [], zIndexCounter: 1 },
            canvas2: { items: [], zIndexCounter: 1 },
            canvas3: { items: [], zIndexCounter: 1 },
          },
          selectedItemId: null,
          selectedCanvasId: null,
          currentViewport: 'desktop' as const,
          showGrid: true,
        };

        api.on('stateChanged', () => {
          done();
        });

        api.importState(JSON.stringify(state));
      });
    });

    describe('reset', () => {
      it('should reset to initial state', () => {
        api.addItem('canvas1', 'header', 0, 0, 10, 10);
        api.setViewport('mobile');
        api.toggleGrid(false);

        api.reset();

        expect(gridState.canvases.canvas1.items).toHaveLength(0);
        expect(gridState.currentViewport).toBe('desktop');
        expect(gridState.showGrid).toBe(true);
      });

      it('should dispatch stateChanged event', (done) => {
        api.on('stateChanged', () => {
          done();
        });

        api.reset();
      });
    });
  });

  describe('Event System', () => {
    describe('on', () => {
      it('should register event listener', () => {
        const listener = jest.fn();
        api.on('itemAdded', listener);

        api.addItem('canvas1', 'header', 0, 0, 10, 10);

        expect(listener).toHaveBeenCalledTimes(1);
      });

      it('should support multiple listeners for same event', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();

        api.on('itemAdded', listener1);
        api.on('itemAdded', listener2);

        api.addItem('canvas1', 'header', 0, 0, 10, 10);

        expect(listener1).toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
      });
    });

    describe('off', () => {
      it('should unregister event listener', () => {
        const listener = jest.fn();
        api.on('itemAdded', listener);

        api.off('itemAdded', listener);

        api.addItem('canvas1', 'header', 0, 0, 10, 10);

        expect(listener).not.toHaveBeenCalled();
      });

      it('should not affect other listeners', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();

        api.on('itemAdded', listener1);
        api.on('itemAdded', listener2);

        api.off('itemAdded', listener1);

        api.addItem('canvas1', 'header', 0, 0, 10, 10);

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
      });
    });

    describe('once', () => {
      it('should register one-time event listener', () => {
        const listener = jest.fn();
        api.once('itemAdded', listener);

        api.addItem('canvas1', 'header', 0, 0, 10, 10);
        api.addItem('canvas1', 'text', 0, 0, 10, 10);

        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    describe('destroy', () => {
      it('should remove all event listeners', () => {
        const listener = jest.fn();
        api.on('itemAdded', listener);

        api.destroy();

        api.addItem('canvas1', 'header', 0, 0, 10, 10);

        expect(listener).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent canvas gracefully', () => {
      expect(() => {
        api.addItem('non-existent', 'header', 0, 0, 10, 10);
      }).not.toThrow();
    });

    it('should handle invalid JSON in importState', () => {
      expect(() => {
        api.importState('invalid json');
      }).toThrow();
    });
  });
});
