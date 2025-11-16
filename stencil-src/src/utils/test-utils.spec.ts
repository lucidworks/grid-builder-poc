import { newSpecPage } from '@stencil/core/testing';
import { gridState } from '../services/state-manager';
import {
  createMockCanvas,
  createTestItem,
  createTestItems,
  dispatchCustomEvent,
  getTextContent,
  hasClass,
  resetGridState,
  setupGlobalMocks,
  waitFor,
} from './test-utils';

describe('test-utils', () => {
  describe('setupGlobalMocks', () => {
    it('should create IntersectionObserver mock', () => {
      setupGlobalMocks();
      expect((global as any).IntersectionObserver).toBeDefined();

      const observer = new (global as any).IntersectionObserver();
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    it('should create interact.js mock', () => {
      setupGlobalMocks();
      expect((global as any).interact).toBeDefined();
      expect((window as any).interact).toBeDefined();

      const interactable = (global as any).interact();
      expect(interactable.draggable).toBeDefined();
      expect(interactable.resizable).toBeDefined();
      expect(interactable.dropzone).toBeDefined();
    });
  });

  describe('resetGridState', () => {
    it('should reset state to defaults', () => {
      // Modify state
      gridState.canvases = {
        canvas1: { items: [createTestItem()], zIndexCounter: 5, backgroundColor: '#000000' },
        canvas2: { items: [], zIndexCounter: 1, backgroundColor: '#ffffff' },
      };
      gridState.selectedItemId = 'item-1';
      gridState.selectedCanvasId = 'canvas1';
      gridState.currentViewport = 'mobile';
      gridState.showGrid = false;

      // Reset
      resetGridState();

      // Verify defaults
      expect(Object.keys(gridState.canvases)).toEqual(['canvas1']);
      expect(gridState.canvases.canvas1.items).toEqual([]);
      expect(gridState.canvases.canvas1.zIndexCounter).toBe(1);
      expect(gridState.canvases.canvas1.backgroundColor).toBe('#ffffff');
      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();
      expect(gridState.currentViewport).toBe('desktop');
      expect(gridState.showGrid).toBe(true);
    });
  });

  describe('createTestItem', () => {
    it('should create item with default values', () => {
      const item = createTestItem();

      expect(item.id).toBe('item-1');
      expect(item.canvasId).toBe('canvas1');
      expect(item.type).toBe('header');
      expect(item.name).toBe('Test Header');
      expect(item.zIndex).toBe(1);
      expect(item.layouts.desktop).toEqual({ x: 100, y: 100, width: 200, height: 150 });
      expect(item.layouts.mobile.customized).toBe(false);
    });

    it('should allow overriding defaults', () => {
      const item = createTestItem({
        id: 'custom-id',
        type: 'button',
        name: 'Custom Name',
        zIndex: 10,
      });

      expect(item.id).toBe('custom-id');
      expect(item.type).toBe('button');
      expect(item.name).toBe('Custom Name');
      expect(item.zIndex).toBe(10);
      // Should still have default layout
      expect(item.layouts.desktop.x).toBe(100);
    });
  });

  describe('createTestItems', () => {
    it('should create multiple items', () => {
      const items = createTestItems(3);

      expect(items.length).toBe(3);
      expect(items[0].id).toBe('item-1');
      expect(items[1].id).toBe('item-2');
      expect(items[2].id).toBe('item-3');
    });

    it('should create items with incremental positions', () => {
      const items = createTestItems(3);

      expect(items[0].layouts.desktop.x).toBe(10);
      expect(items[1].layouts.desktop.x).toBe(15);
      expect(items[2].layouts.desktop.x).toBe(20);
    });

    it('should allow base overrides', () => {
      const items = createTestItems(2, { type: 'button', canvasId: 'canvas2' });

      expect(items[0].type).toBe('button');
      expect(items[0].canvasId).toBe('canvas2');
      expect(items[1].type).toBe('button');
      expect(items[1].canvasId).toBe('canvas2');
    });
  });

  describe('createMockCanvas', () => {
    it('should create canvas element with correct id', async () => {
      const page = await newSpecPage({
        components: [],
        html: '<div></div>',
      });

      const canvas = createMockCanvas(page, 'test-canvas', 1200);

      expect(canvas.id).toBe('test-canvas');
      expect(canvas.clientWidth).toBe(1200);
    });

    it('should use default values', async () => {
      const page = await newSpecPage({
        components: [],
        html: '<div></div>',
      });

      const canvas = createMockCanvas(page);

      expect(canvas.id).toBe('canvas1');
      expect(canvas.clientWidth).toBe(1000);
    });
  });

  describe('dispatchCustomEvent', () => {
    it('should dispatch event with detail', () => {
      const element = document.createElement('div');
      const handler = jest.fn();
      element.addEventListener('test-event', handler);

      dispatchCustomEvent(element, 'test-event', { foo: 'bar' });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual({ foo: 'bar' });
    });

    it('should create bubbling event by default', () => {
      const parent = document.createElement('div');
      const child = document.createElement('div');
      parent.appendChild(child);

      const handler = jest.fn();
      parent.addEventListener('test-event', handler);

      dispatchCustomEvent(child, 'test-event', {});

      expect(handler).toHaveBeenCalled();
    });

    it('should work with Document element', () => {
      const handler = jest.fn();
      document.addEventListener('test-event', handler);

      dispatchCustomEvent(document, 'test-event', { key: 'value' });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual({ key: 'value' });

      document.removeEventListener('test-event', handler);
    });
  });

  describe('waitFor', () => {
    it('should resolve when condition becomes true', async () => {
      let value = false;
      setTimeout(() => {
        value = true;
      }, 100);

      await waitFor(() => value, 500, 10);
      expect(value).toBe(true);
    });

    it('should timeout if condition never becomes true', async () => {
      await expect(waitFor(() => false, 100, 10)).rejects.toThrow('Condition not met within 100ms');
    });

    it('should work with async conditions', async () => {
      let value = false;
      setTimeout(() => {
        value = true;
      }, 100);

      await waitFor(async () => value, 500, 10);
      expect(value).toBe(true);
    });
  });

  describe('getTextContent', () => {
    it('should return trimmed text content', () => {
      const element = document.createElement('div');
      element.textContent = '  Hello World  ';

      expect(getTextContent(element)).toBe('Hello World');
    });

    it('should return empty string for null element', () => {
      expect(getTextContent(null)).toBe('');
    });
  });

  describe('hasClass', () => {
    it('should return true if element has class', () => {
      const element = document.createElement('div');
      element.className = 'foo bar';

      expect(hasClass(element, 'foo')).toBe(true);
      expect(hasClass(element, 'bar')).toBe(true);
    });

    it('should return false if element does not have class', () => {
      const element = document.createElement('div');
      element.className = 'foo';

      expect(hasClass(element, 'bar')).toBe(false);
    });

    it('should return false for null element', () => {
      expect(hasClass(null, 'foo')).toBe(false);
    });
  });
});
