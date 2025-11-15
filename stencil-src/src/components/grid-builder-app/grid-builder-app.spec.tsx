import { gridState, reset } from '../../services/state-manager';
import { GridBuilderApp } from './grid-builder-app';

describe('grid-builder-app', () => {
  let gridBuilderApp: GridBuilderApp;

  beforeEach(() => {
    // Reset state before each test using custom reset function
    reset();

    // Create a component instance directly
    gridBuilderApp = new GridBuilderApp();
  });

  it('should create component instance', () => {
    expect(gridBuilderApp).toBeTruthy();
  });

  it('should initialize with correct default state', () => {
    expect(gridState.currentViewport).toBe('desktop');
    expect(gridState.showGrid).toBe(true);
    expect(Object.keys(gridState.canvases).length).toBe(3);
  });

  it('should calculate item count correctly with prepopulated items', () => {
    gridBuilderApp.componentWillLoad();
    // 4 items in canvas1 + 3 items in canvas2 + 3 items in canvas3 = 10 total
    expect(gridBuilderApp.itemCount).toBe(10);
  });

  it('should calculate item count correctly with items', () => {
    // Replace canvas1 items with 2 test items
    gridState.canvases.canvas1.items = [
      { id: 'item-1', canvasId: 'canvas1', type: 'header', name: 'Header', layouts: {}, zIndex: 1 } as any,
      { id: 'item-2', canvasId: 'canvas1', type: 'text', name: 'Text', layouts: {}, zIndex: 2 } as any,
    ];

    gridBuilderApp.componentWillUpdate();
    // 2 items in canvas1 + 3 items in canvas2 + 3 items in canvas3 = 8 total
    expect(gridBuilderApp.itemCount).toBe(8);
  });

  it('should update item count when more items are added', () => {
    // Initially should be 10 (prepopulated)
    gridBuilderApp.componentWillLoad();
    expect(gridBuilderApp.itemCount).toBe(10);

    // Replace items in canvas1 and canvas2
    gridState.canvases.canvas1.items = [
      { id: 'item-1', canvasId: 'canvas1', type: 'header', name: 'Header', layouts: {}, zIndex: 1 } as any,
    ];
    gridState.canvases.canvas2.items = [
      { id: 'item-2', canvasId: 'canvas2', type: 'text', name: 'Text', layouts: {}, zIndex: 1 } as any,
    ];

    gridBuilderApp.componentWillUpdate();
    // 1 item in canvas1 + 1 item in canvas2 + 3 items in canvas3 = 5 total
    expect(gridBuilderApp.itemCount).toBe(5);
  });
});
