// Mock IntersectionObserver and interact.js BEFORE imports
(global as any).IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

(global as any).interact = jest.fn(() => ({
  draggable: jest.fn().mockReturnThis(),
  resizable: jest.fn().mockReturnThis(),
  unset: jest.fn(),
}));

import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { GridItem, gridState } from '../../services/state-manager';
import { GridItemWrapper } from './grid-item-wrapper';

describe('grid-item-wrapper', () => {
  let testItem: GridItem;

  beforeEach(() => {
    // Mock window.interact
    (window as any).interact = (global as any).interact;

    // Reset state before each test
    gridState.canvases = {
      canvas1: {
        items: [],
        zIndexCounter: 1,
        backgroundColor: '#ffffff',
      },
    };
    gridState.selectedItemId = null;
    gridState.currentViewport = 'desktop';

    // Create test item
    testItem = {
      id: 'item-1',
      canvasId: 'canvas1',
      type: 'header',
      name: 'Test Header',
      layouts: {
        desktop: { x: 100, y: 100, width: 200, height: 150 },
        mobile: { x: null, y: null, width: null, height: null, customized: false },
      },
      zIndex: 1,
    };
  });

  it('should render without errors', async () => {
    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });
    expect(page.root).toBeTruthy();
  });

  it('should render grid item with correct id', async () => {
    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    const gridItem = page.root.querySelector('.grid-item');
    expect(gridItem).toBeTruthy();
    expect(gridItem.id).toBe('item-1');
  });

  it('should apply correct transform and dimensions from layout', async () => {
    // Create a spec page with an empty document first
    const page = await newSpecPage({
      components: [GridItemWrapper],
      html: '<div></div>',
      supportsShadowDom: false,
    });

    // Create and add mock canvas container BEFORE rendering the component
    const mockCanvas = page.doc.createElement('div');
    mockCanvas.id = 'canvas1';
    // Mock clientWidth since JSDOM doesn't compute layout
    Object.defineProperty(mockCanvas, 'clientWidth', {
      value: 1000,
      writable: true,
      configurable: true,
    });
    page.body.appendChild(mockCanvas);

    // Now render the component with the canvas available
    page.root.innerHTML = '';
    const wrapper = page.doc.createElement('grid-item-wrapper') as any;
    wrapper.item = testItem;
    page.root.appendChild(wrapper);
    await page.waitForChanges();

    const gridItem = wrapper.querySelector('.grid-item') as HTMLElement;
    // With 1000px canvas width: x=100 units * 2% * 1000px = 2000px, y=100 units * 20px = 2000px
    expect(gridItem.style.transform).toBe('translate(2000px, 2000px)');
    // width=200 units * 2% * 1000px = 4000px, height=150 units * 20px = 3000px
    expect(gridItem.style.width).toBe('4000px');
    expect(gridItem.style.height).toBe('3000px');
  });

  it('should apply correct z-index', async () => {
    testItem.zIndex = 5;

    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    const gridItem = page.root.querySelector('.grid-item') as HTMLElement;
    expect(gridItem.style.zIndex).toBe('5');
  });

  it('should render item header with icon and name', async () => {
    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    const header = page.root.querySelector('.grid-item-header');
    expect(header).toBeTruthy();
    expect(header.textContent).toContain('Test Header');
  });

  it('should render drag handle', async () => {
    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    const dragHandle = page.root.querySelector('.drag-handle');
    expect(dragHandle).toBeTruthy();
  });

  it('should render 8 resize handles', async () => {
    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    const resizeHandles = page.root.querySelectorAll('.resize-handle');
    expect(resizeHandles.length).toBe(8);
  });

  it('should render control buttons (bring to front, send to back, delete)', async () => {
    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    const controls = page.root.querySelectorAll('.grid-item-control-btn');
    const deleteBtn = page.root.querySelector('.grid-item-delete');

    expect(controls.length).toBe(2);
    expect(deleteBtn).toBeTruthy();
  });

  it('should add selected class when item is selected', async () => {
    gridState.selectedItemId = 'item-1';

    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    await page.waitForChanges();

    const gridItem = page.root.querySelector('.grid-item');
    expect(gridItem.classList.contains('selected')).toBe(true);
  });

  it('should not have selected class when item is not selected', async () => {
    gridState.selectedItemId = 'other-item';

    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    const gridItem = page.root.querySelector('.grid-item');
    expect(gridItem.classList.contains('selected')).toBe(false);
  });

  it('should render loading placeholder initially (virtual rendering)', async () => {
    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    // With virtual rendering, components start as not visible and show loading placeholder
    const content = page.root.querySelector('.grid-item-content');
    expect(content).toBeTruthy();
    expect(content.textContent).toContain('Loading...');
  });

  it('should show loading placeholder with correct class', async () => {
    const page = await newSpecPage({
      components: [GridItemWrapper],
      template: () => <grid-item-wrapper item={testItem} />,
    });

    // Should have component-placeholder class
    const placeholder = page.root.querySelector('.component-placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder.textContent).toContain('Loading...');
  });

  it('should use auto-layout for mobile viewport when not customized', async () => {
    gridState.currentViewport = 'mobile';

    // Add test item to canvas so auto-layout can find it
    gridState.canvases.canvas1.items = [testItem];

    // Create page with empty document first
    const page = await newSpecPage({
      components: [GridItemWrapper],
      html: '<div></div>',
      supportsShadowDom: false,
    });

    // Create mock canvas container
    const mockCanvas = page.doc.createElement('div');
    mockCanvas.id = 'canvas1';
    Object.defineProperty(mockCanvas, 'clientWidth', {
      value: 1000,
      writable: true,
      configurable: true,
    });
    page.body.appendChild(mockCanvas);

    // Render component
    page.root.innerHTML = '';
    const wrapper = page.doc.createElement('grid-item-wrapper') as any;
    wrapper.item = testItem;
    page.root.appendChild(wrapper);
    await page.waitForChanges();

    const gridItem = wrapper.querySelector('.grid-item') as HTMLElement;
    // Should use auto-layout: full width (x:0) and stacked vertically (y:0 for first item)
    expect(gridItem.style.transform).toBe('translate(0px, 0px)');
    // Should be full width (50 grid units * 20px = 1000px for 1000px container)
    expect(gridItem.style.width).toBe('1000px');
    // Should keep desktop height (150 grid units * 20px = 3000px)
    expect(gridItem.style.height).toBe('3000px');
  });
});
