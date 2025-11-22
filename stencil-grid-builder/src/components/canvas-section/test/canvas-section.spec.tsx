// Mock ResizeObserver BEFORE importing CanvasSection
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

(global as any).ResizeObserver = jest.fn(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

import { newSpecPage } from '@stencil/core/testing';
import { CanvasSection } from '../canvas-section';
import { gridState, reset, setActiveCanvas } from '../../../services/state-manager';

describe('canvas-section - Active Canvas', () => {
  beforeEach(() => {
    reset();
    jest.clearAllMocks();
  });

  describe('isActive Prop', () => {
    it('should render with active class when isActive is true', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      page.root.isActive = true;
      await page.waitForChanges();

      const gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(true);
    });

    it('should render without active class when isActive is false', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      page.root.isActive = false;
      await page.waitForChanges();

      const gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(false);
    });

    it('should default to inactive when isActive prop not provided', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      const gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(false);
    });

    it('should update active class when isActive prop changes', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      page.root.isActive = false;
      await page.waitForChanges();

      let gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(false);

      page.root.isActive = true;
      await page.waitForChanges();

      gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(true);
    });

    it('should toggle active class multiple times', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      // Start inactive
      page.root.isActive = false;
      await page.waitForChanges();
      let gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(false);

      // Activate
      page.root.isActive = true;
      await page.waitForChanges();
      gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(true);

      // Deactivate
      page.root.isActive = false;
      await page.waitForChanges();
      gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(false);

      // Reactivate
      page.root.isActive = true;
      await page.waitForChanges();
      gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(true);
    });
  });

  describe('Canvas Activation Events', () => {
    it('should emit canvas-activated event when canvas background is clicked', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      await page.waitForChanges();

      const eventSpy = jest.fn();
      const gridContainer = page.root.querySelector('.grid-container');
      gridContainer.addEventListener('canvas-activated', eventSpy);

      // Click the grid container directly (not a child element)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        value: gridContainer,
        enumerable: true,
      });
      gridContainer.dispatchEvent(clickEvent);
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({ canvasId: 'canvas1' });
    });

    it('should emit canvas-click event for backward compatibility', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      await page.waitForChanges();

      const eventSpy = jest.fn();
      const gridContainer = page.root.querySelector('.grid-container');
      gridContainer.addEventListener('canvas-click', eventSpy);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        value: gridContainer,
        enumerable: true,
      });
      gridContainer.dispatchEvent(clickEvent);
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({ canvasId: 'canvas1' });
    });

    it('should call setActiveCanvas when canvas background is clicked', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas2"></canvas-section>`,
      });

      await page.waitForChanges();

      expect(gridState.activeCanvasId).toBeNull();

      const gridContainer = page.root.querySelector('.grid-container');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        value: gridContainer,
        enumerable: true,
      });
      gridContainer.dispatchEvent(clickEvent);
      await page.waitForChanges();

      expect(gridState.activeCanvasId).toBe('canvas2');
    });

    it('should not emit events when clicking on child elements', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      await page.waitForChanges();

      const activatedEventSpy = jest.fn();
      const clickEventSpy = jest.fn();
      const gridContainer = page.root.querySelector('.grid-container');
      gridContainer.addEventListener('canvas-activated', activatedEventSpy);
      gridContainer.addEventListener('canvas-click', clickEventSpy);

      // Create a child element
      const childElement = document.createElement('div');
      gridContainer.appendChild(childElement);

      // Click the child element (not the grid container itself)
      // The click will bubble up, but event.target will be the child
      childElement.click();
      await page.waitForChanges();

      expect(activatedEventSpy).not.toHaveBeenCalled();
      expect(clickEventSpy).not.toHaveBeenCalled();
    });

    it('should emit events with correct canvasId for different canvases', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      await page.waitForChanges();

      const eventSpy = jest.fn();
      const container = page.root.querySelector('.grid-container');
      container.addEventListener('canvas-activated', eventSpy);

      // Click canvas1 directly
      container.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].detail.canvasId).toBe('canvas1');

      // Change to canvas3
      page.root.canvasId = 'canvas3';
      await page.waitForChanges();

      // Click again (same container, just changed canvasId)
      eventSpy.mockClear();
      container.click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].detail.canvasId).toBe('canvas3');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should always have grid-container class', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      const gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('grid-container')).toBe(true);
    });

    it('should combine active class with other classes', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      page.root.isActive = true;
      await page.waitForChanges();

      const gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('grid-container')).toBe(true);
      expect(gridContainer.classList.contains('active')).toBe(true);
    });

    it('should maintain other classes when active state changes', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      // Start with hide-grid class
      gridState.showGrid = false;
      await page.waitForChanges();

      let gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('hide-grid')).toBe(true);
      expect(gridContainer.classList.contains('active')).toBe(false);

      // Add active class
      page.root.isActive = true;
      await page.waitForChanges();

      gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('hide-grid')).toBe(true);
      expect(gridContainer.classList.contains('active')).toBe(true);

      // Remove active class
      page.root.isActive = false;
      await page.waitForChanges();

      gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('hide-grid')).toBe(true);
      expect(gridContainer.classList.contains('active')).toBe(false);
    });
  });

  describe('Integration with State', () => {
    it('should update global state when clicked', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas2"></canvas-section>`,
      });

      await page.waitForChanges();

      // Initially no canvas is active
      expect(gridState.activeCanvasId).toBeNull();

      // Click the canvas
      const gridContainer = page.root.querySelector('.grid-container');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: gridContainer, enumerable: true });
      gridContainer.dispatchEvent(clickEvent);
      await page.waitForChanges();

      // Canvas2 should now be active in global state
      expect(gridState.activeCanvasId).toBe('canvas2');
    });

    it('should reflect external state changes via isActive prop', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1"></canvas-section>`,
      });

      await page.waitForChanges();

      // External code sets canvas as active
      setActiveCanvas('canvas1');

      // Component should be told it's active via prop
      page.root.isActive = true;
      await page.waitForChanges();

      const gridContainer = page.root.querySelector('.grid-container');
      expect(gridContainer.classList.contains('active')).toBe(true);
    });
  });
});
