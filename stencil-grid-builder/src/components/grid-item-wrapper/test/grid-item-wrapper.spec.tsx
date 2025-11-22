// Mock ResizeObserver BEFORE importing GridItemWrapper
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

(global as any).ResizeObserver = jest.fn(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { GridItemWrapper } from '../grid-item-wrapper';
import { gridState, reset, setActiveCanvas } from '../../../services/state-manager';

describe('grid-item-wrapper - Active Canvas', () => {
  const mockItem = {
    id: 'item-1',
    canvasId: 'canvas1',
    type: 'header',
    name: 'Header Item',
    layouts: {
      desktop: { x: 1, y: 1, width: 10, height: 6 },
      mobile: { x: 1, y: 1, width: 14, height: 5, customized: false },
    },
    config: {},
    zIndex: 1,
  };

  const mockComponentRegistry = new Map([
    [
      'header',
      {
        type: 'header',
        name: 'Header',
        icon: '📄',
        defaultSize: { width: 10, height: 6 },
        render: (_item: any) => <div>Header Component</div>,
      },
    ],
  ]);

  beforeEach(() => {
    reset();
    jest.clearAllMocks();
  });

  describe('Canvas Activation on Click', () => {
    it('should call setActiveCanvas when item is clicked', async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Initially no canvas is active
      expect(gridState.activeCanvasId).toBeNull();

      // Click the item
      const itemElement = page.root.querySelector('.grid-item') as HTMLElement as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Canvas should be activated
      expect(gridState.activeCanvasId).toBe('canvas1');
    });

    it('should activate correct canvas when clicking items on different canvases', async () => {
      const item1 = { ...mockItem, id: 'item-1', canvasId: 'canvas1' };
      const item2 = { ...mockItem, id: 'item-2', canvasId: 'canvas2' };

      const page1 = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={item1}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      const page2 = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={item2}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page1.waitForChanges();
      await page2.waitForChanges();

      // Click item on canvas1
      const item1Element = page1.root.querySelector('.grid-item') as HTMLElement as HTMLElement;
      if (item1Element) {
        item1Element.click();
        await page1.waitForChanges();
      }
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Click item on canvas2
      const item2Element = page2.root.querySelector('.grid-item') as HTMLElement as HTMLElement;
      if (item2Element) {
        item2Element.click();
        await page2.waitForChanges();
      }
      expect(gridState.activeCanvasId).toBe('canvas2');
    });

    it('should set active canvas before updating selection state', async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      const callOrder: string[] = [];

      // Track when activeCanvasId is set
      const originalActiveCanvasId = gridState.activeCanvasId;
      Object.defineProperty(gridState, 'activeCanvasId', {
        get: () => originalActiveCanvasId,
        set: (value) => {
          callOrder.push('setActiveCanvas');
          Object.defineProperty(gridState, 'activeCanvasId', {
            value,
            writable: true,
            configurable: true,
          });
        },
        configurable: true,
      });

      // Track when selectedItemId is set
      const originalSelectedItemId = gridState.selectedItemId;
      Object.defineProperty(gridState, 'selectedItemId', {
        get: () => originalSelectedItemId,
        set: (value) => {
          callOrder.push('setSelection');
          Object.defineProperty(gridState, 'selectedItemId', {
            value,
            writable: true,
            configurable: true,
          });
        },
        configurable: true,
      });

      const itemElement = page.root.querySelector('.grid-item') as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // activeCanvasId should be set before selectedItemId
      expect(callOrder[0]).toBe('setActiveCanvas');
      expect(callOrder[1]).toBe('setSelection');
    });

    it('should not activate canvas in viewer mode', async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
            viewerMode={true}
          />
        ),
      });

      await page.waitForChanges();

      expect(gridState.activeCanvasId).toBeNull();

      const itemElement = page.root.querySelector('.grid-item') as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Canvas should NOT be activated in viewer mode
      expect(gridState.activeCanvasId).toBeNull();
    });

    it('should activate canvas even when item is already selected', async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Select the item first
      gridState.selectedItemId = 'item-1';
      gridState.selectedCanvasId = 'canvas1';

      // Activate a different canvas
      setActiveCanvas('canvas2');
      expect(gridState.activeCanvasId).toBe('canvas2');

      // Click the item again
      const itemElement = page.root.querySelector('.grid-item') as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Should switch active canvas back to canvas1
      expect(gridState.activeCanvasId).toBe('canvas1');
    });

    it('should not activate canvas when clicking drag handle', async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      expect(gridState.activeCanvasId).toBeNull();

      // Try to click drag handle (click should be ignored)
      const dragHandle = page.root.querySelector('.drag-handle') as HTMLElement;
      if (dragHandle) {
        dragHandle.click();
        await page.waitForChanges();
      }

      // Canvas should NOT be activated when clicking control elements
      expect(gridState.activeCanvasId).toBeNull();
    });

    it('should not activate canvas when item was just dragged', async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Simulate drag by setting wasDragged flag
      (page.rootInstance as any).wasDragged = true;

      const itemElement = page.root.querySelector('.grid-item') as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Canvas should NOT be activated if item was just dragged
      expect(gridState.activeCanvasId).toBeNull();
    });
  });

  describe('Canvas Activation with Selection', () => {
    it('should activate canvas and select item in single click', async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      expect(gridState.activeCanvasId).toBeNull();
      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();

      const itemElement = page.root.querySelector('.grid-item') as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // All three should be set
      expect(gridState.activeCanvasId).toBe('canvas1');
      expect(gridState.selectedItemId).toBe('item-1');
      expect(gridState.selectedCanvasId).toBe('canvas1');
    });

    it('should handle rapid canvas switching via item clicks', async () => {
      const item1 = { ...mockItem, id: 'item-1', canvasId: 'canvas1' };
      const item2 = { ...mockItem, id: 'item-2', canvasId: 'canvas2' };
      const item3 = { ...mockItem, id: 'item-3', canvasId: 'canvas3' };

      const page1 = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper item={item1} componentRegistry={mockComponentRegistry} />
        ),
      });

      const page2 = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper item={item2} componentRegistry={mockComponentRegistry} />
        ),
      });

      const page3 = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper item={item3} componentRegistry={mockComponentRegistry} />
        ),
      });

      // Click item1
      (page1.root.querySelector('.grid-item') as HTMLElement)?.click();
      await page1.waitForChanges();
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Click item2
      (page2.root.querySelector('.grid-item') as HTMLElement)?.click();
      await page2.waitForChanges();
      expect(gridState.activeCanvasId).toBe('canvas2');

      // Click item3
      (page3.root.querySelector('.grid-item') as HTMLElement)?.click();
      await page3.waitForChanges();
      expect(gridState.activeCanvasId).toBe('canvas3');

      // Click item1 again
      (page1.root.querySelector('.grid-item') as HTMLElement)?.click();
      await page1.waitForChanges();
      expect(gridState.activeCanvasId).toBe('canvas1');
    });
  });

  describe('Event Emission', () => {
    it('should emit item-click event after setting active canvas', async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.root.addEventListener('item-click', eventSpy);

      const itemElement = page.root.querySelector('.grid-item') as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        itemId: 'item-1',
        canvasId: 'canvas1',
      });

      // Canvas should also be activated
      expect(gridState.activeCanvasId).toBe('canvas1');
    });
  });
});
