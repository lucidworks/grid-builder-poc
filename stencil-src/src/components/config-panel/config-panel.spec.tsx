import { newSpecPage } from '@stencil/core/testing';
import { GridItem, gridState } from '../../services/state-manager';
import { ConfigPanel } from './config-panel';

describe('config-panel', () => {
  let testItem: GridItem;

  beforeEach(() => {
    // Reset state before each test
    gridState.canvases = {
      canvas1: {
        items: [],
        zIndexCounter: 1,
        backgroundColor: '#ffffff',
      },
    };
    gridState.selectedItemId = null;
    gridState.selectedCanvasId = null;

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

    gridState.canvases.canvas1.items.push(testItem);
  });

  it('should render without errors', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });
    expect(page.root).toBeTruthy();
  });

  it('should be closed by default', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    const panel = page.root.querySelector('.config-panel');
    expect(panel.classList.contains('open')).toBe(false);
  });

  it('should render header with title and close button', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    const header = page.root.querySelector('.config-panel-header');
    const title = header.querySelector('h2');
    const closeBtn = header.querySelector('.config-panel-close');

    expect(header).toBeTruthy();
    expect(title.textContent).toBe('Component Settings');
    expect(closeBtn).toBeTruthy();
  });

  it('should render component name input field', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    const nameInput = page.root.querySelector('#componentName') as HTMLInputElement;
    expect(nameInput).toBeTruthy();
    expect(nameInput.type).toBe('text');
  });

  it('should render z-index control buttons', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    const zIndexBtns = page.root.querySelectorAll('.z-index-btn');
    expect(zIndexBtns.length).toBe(4);
  });

  it('should render footer with cancel and save buttons', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    const footer = page.root.querySelector('.config-panel-footer');
    const buttons = footer.querySelectorAll('button');

    expect(footer).toBeTruthy();
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe('Cancel');
    expect(buttons[1].textContent).toBe('Save');
  });

  it('should have primary class on save button', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    const footer = page.root.querySelector('.config-panel-footer');
    const saveBtn = footer.querySelectorAll('button')[1];

    expect(saveBtn.classList.contains('primary')).toBe(true);
  });

  it('should open panel when item-click event is dispatched', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    // Dispatch item-click event
    const event = new CustomEvent('item-click', {
      detail: { itemId: 'item-1', canvasId: 'canvas1' },
      bubbles: true,
    });
    document.dispatchEvent(event);

    await page.waitForChanges();

    const panel = page.root.querySelector('.config-panel');
    expect(panel.classList.contains('open')).toBe(true);
  });

  it('should populate component name when opening panel', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    // Dispatch item-click event
    const event = new CustomEvent('item-click', {
      detail: { itemId: 'item-1', canvasId: 'canvas1' },
      bubbles: true,
    });
    document.dispatchEvent(event);

    await page.waitForChanges();

    const nameInput = page.root.querySelector('#componentName') as HTMLInputElement;
    expect(nameInput.value).toBe('Test Header');
  });

  it('should update gridState selection when opening panel', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    // Dispatch item-click event
    const event = new CustomEvent('item-click', {
      detail: { itemId: 'item-1', canvasId: 'canvas1' },
      bubbles: true,
    });
    document.dispatchEvent(event);

    await page.waitForChanges();

    expect(gridState.selectedItemId).toBe('item-1');
    expect(gridState.selectedCanvasId).toBe('canvas1');
  });

  it('should close panel and clear selection when close button clicked', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: `<config-panel></config-panel>`,
    });

    // Open panel first
    const openEvent = new CustomEvent('item-click', {
      detail: { itemId: 'item-1', canvasId: 'canvas1' },
      bubbles: true,
    });
    document.dispatchEvent(openEvent);
    await page.waitForChanges();

    // Close panel
    const closeBtn = page.root.querySelector('.config-panel-close') as HTMLButtonElement;
    closeBtn.click();
    await page.waitForChanges();

    const panel = page.root.querySelector('.config-panel');
    expect(panel.classList.contains('open')).toBe(false);
    expect(gridState.selectedItemId).toBe(null);
    expect(gridState.selectedCanvasId).toBe(null);
  });
});
