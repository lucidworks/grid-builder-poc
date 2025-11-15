import { newSpecPage } from '@stencil/core/testing';
import { gridState, reset } from '../../services/state-manager';
import { CanvasSection } from './canvas-section';

describe('canvas-section', () => {
  beforeEach(() => {
    // Reset state before each test using the reset function
    reset();
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
});
