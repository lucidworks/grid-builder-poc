import { newSpecPage } from '@stencil/core/testing';
import { gridState, reset } from '../../services/state-manager';
import * as gridCalculations from '../../utils/grid-calculations';
import { CanvasSection } from './canvas-section';

describe('canvas-section', () => {
  let mockResizeObserver: jest.Mock;
  let resizeCallback: ResizeObserverCallback;
  let clearGridSizeCacheSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset state before each test using the reset function
    reset();

    // Spy on clearGridSizeCache
    clearGridSizeCacheSpy = jest.spyOn(gridCalculations, 'clearGridSizeCache');

    // Mock ResizeObserver
    mockResizeObserver = jest.fn((callback) => {
      resizeCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    global.ResizeObserver = mockResizeObserver as any;
  });

  afterEach(() => {
    // Restore spy
    if (clearGridSizeCacheSpy) {
      clearGridSizeCacheSpy.mockRestore();
    }
  });

  it('should render without errors', async () => {
    const page = await newSpecPage({
      components: [CanvasSection],
      html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
    });
    expect(page.root).toBeTruthy();
  });

  it('should render section header with correct title', async () => {
    const page = await newSpecPage({
      components: [CanvasSection],
      html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
    });

    const header = page.root.querySelector('.canvas-item-header h3');
    expect(header.textContent).toBe('Section 1');
  });

  it('should render grid container with correct id', async () => {
    const page = await newSpecPage({
      components: [CanvasSection],
      html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
    });

    const gridContainer = page.root.querySelector('.grid-container');
    expect(gridContainer).toBeTruthy();
    expect(gridContainer.id).toBe('canvas1');
  });

  it('should render canvas controls (color picker, clear, delete)', async () => {
    const page = await newSpecPage({
      components: [CanvasSection],
      html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
    });

    const colorPicker = page.root.querySelector('.canvas-bg-color');
    const clearBtn = page.root.querySelector('.clear-canvas-btn');
    const deleteBtn = page.root.querySelector('.delete-section-btn');

    expect(colorPicker).toBeTruthy();
    expect(clearBtn).toBeTruthy();
    expect(deleteBtn).toBeTruthy();
  });

  it('should apply background color from state', async () => {
    gridState.canvases.canvas1.backgroundColor = '#ff0000';

    const page = await newSpecPage({
      components: [CanvasSection],
      html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
    });

    const colorPicker = page.root.querySelector('.canvas-bg-color') as HTMLInputElement;
    expect(colorPicker.value).toBe('#ff0000');
  });

  it('should hide grid when showGrid is false', async () => {
    gridState.showGrid = false;

    const page = await newSpecPage({
      components: [CanvasSection],
      html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
    });

    const gridContainer = page.root.querySelector('.grid-container');
    expect(gridContainer.classList.contains('hide-grid')).toBe(true);
  });

  it('should show grid when showGrid is true', async () => {
    gridState.showGrid = true;

    const page = await newSpecPage({
      components: [CanvasSection],
      html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
    });

    const gridContainer = page.root.querySelector('.grid-container');
    expect(gridContainer.classList.contains('hide-grid')).toBe(false);
  });

  it('should render grid items from state', async () => {
    gridState.canvases.canvas1.items = [
      {
        id: 'item-1',
        canvasId: 'canvas1',
        type: 'header',
        name: 'Test Header',
        layouts: {
          desktop: { x: 0, y: 0, width: 200, height: 100 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 1,
      },
    ];

    const page = await newSpecPage({
      components: [CanvasSection],
      html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
    });

    const gridItemWrappers = page.root.querySelectorAll('grid-item-wrapper');
    expect(gridItemWrappers.length).toBe(1);
  });

  describe('ResizeObserver Integration', () => {
    it('should setup ResizeObserver on componentDidLoad', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
      });

      // Get component instance
      const component = page.rootInstance as CanvasSection;

      // Trigger componentDidLoad manually (in tests this may not happen automatically)
      if (component.componentDidLoad) {
        await component.componentDidLoad();
      }

      // ResizeObserver should be created
      expect(mockResizeObserver).toHaveBeenCalled();
    });

    it('should clear grid cache when canvas resizes', async () => {
      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
      });

      const component = page.rootInstance as CanvasSection;

      if (component.componentDidLoad) {
        await component.componentDidLoad();
      }

      // Simulate resize event
      if (resizeCallback) {
        const mockEntries: ResizeObserverEntry[] = [
          {
            target: page.root.querySelector('.grid-container') as HTMLElement,
            contentRect: {} as DOMRectReadOnly,
            borderBoxSize: [] as any,
            contentBoxSize: [] as any,
            devicePixelContentBoxSize: [] as any,
          },
        ];

        resizeCallback(mockEntries, {} as ResizeObserver);

        // Grid cache should be cleared
        expect(clearGridSizeCacheSpy).toHaveBeenCalled();
      }
    });

    it('should disconnect ResizeObserver on disconnectedCallback', async () => {
      const mockDisconnect = jest.fn();

      mockResizeObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      global.ResizeObserver = mockResizeObserver as any;

      const page = await newSpecPage({
        components: [CanvasSection],
        html: `<canvas-section canvas-id="canvas1" section-number="1"></canvas-section>`,
      });

      const component = page.rootInstance as CanvasSection;

      if (component.componentDidLoad) {
        await component.componentDidLoad();
      }

      // Trigger disconnectedCallback
      if (component.disconnectedCallback) {
        component.disconnectedCallback();
      }

      // ResizeObserver should be disconnected
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
