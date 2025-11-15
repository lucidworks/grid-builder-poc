import {
  clearGridSizeCache,
  getGridSizeHorizontal,
  getGridSizeVertical,
  gridToPixelsX,
  gridToPixelsY,
  pixelsToGridX,
  pixelsToGridY,
} from './grid-calculations';

// Mock canvas element with specific width
function createMockCanvas(id: string, width: number): HTMLElement {
  const element = document.createElement('div');
  element.id = id;
  Object.defineProperty(element, 'clientWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
  document.body.appendChild(element);
  return element;
}

describe('grid-calculations', () => {
  let mockCanvas: HTMLElement;

  beforeEach(() => {
    // Clear cache before each test
    clearGridSizeCache();
    // Remove any existing mock canvases
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up DOM
    if (mockCanvas && mockCanvas.parentNode) {
      mockCanvas.parentNode.removeChild(mockCanvas);
    }
  });

  describe('clearGridSizeCache', () => {
    it('should clear the grid size cache', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      // Call getGridSizeHorizontal to populate cache
      const size1 = getGridSizeHorizontal('canvas1');
      expect(size1).toBe(20); // 1000 * 0.02 = 20

      // Change canvas width
      Object.defineProperty(mockCanvas, 'clientWidth', {
        value: 2000,
        writable: true,
        configurable: true,
      });

      // Without clearing cache, should return cached value
      const size2 = getGridSizeHorizontal('canvas1');
      expect(size2).toBe(20); // Still cached

      // After clearing cache, should return new value
      clearGridSizeCache();
      const size3 = getGridSizeHorizontal('canvas1');
      expect(size3).toBe(40); // 2000 * 0.02 = 40
    });
  });

  describe('getGridSizeHorizontal', () => {
    it('should calculate horizontal grid size as 2% of container width', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);
      const gridSize = getGridSizeHorizontal('canvas1');
      expect(gridSize).toBe(20); // 1000 * 0.02 = 20
    });

    it('should cache grid size for performance', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      // First call
      const size1 = getGridSizeHorizontal('canvas1');

      // Change width (cached value should be returned)
      Object.defineProperty(mockCanvas, 'clientWidth', {
        value: 2000,
        writable: true,
        configurable: true,
      });

      const size2 = getGridSizeHorizontal('canvas1');
      expect(size2).toBe(size1); // Should return cached value
    });

    it('should recalculate when forceRecalc is true', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      const size1 = getGridSizeHorizontal('canvas1');
      expect(size1).toBe(20);

      // Change width
      Object.defineProperty(mockCanvas, 'clientWidth', {
        value: 2000,
        writable: true,
        configurable: true,
      });

      const size2 = getGridSizeHorizontal('canvas1', true);
      expect(size2).toBe(40); // 2000 * 0.02 = 40
    });

    it('should return 0 for non-existent canvas', () => {
      const gridSize = getGridSizeHorizontal('non-existent');
      expect(gridSize).toBe(0);
    });

    it('should work with different canvas IDs', () => {
      // @ts-expect-error: Canvas objects are used for DOM setup
      const _canvas1 = createMockCanvas('canvas1', 1000);
      const _canvas2 = createMockCanvas('canvas2', 2000);

      expect(getGridSizeHorizontal('canvas1')).toBe(20);
      expect(getGridSizeHorizontal('canvas2')).toBe(40);

      // Clean up second canvas
      _canvas2.parentNode?.removeChild(_canvas2);
    });
  });

  describe('getGridSizeVertical', () => {
    it('should return fixed 20px grid size', () => {
      expect(getGridSizeVertical()).toBe(20);
    });

    it('should always return same value', () => {
      expect(getGridSizeVertical()).toBe(getGridSizeVertical());
    });
  });

  describe('gridToPixelsX', () => {
    it('should convert grid units to pixels horizontally', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      // 10 grid units = 10 * 2% = 20% = 200px
      expect(gridToPixelsX(10, 'canvas1')).toBe(200);

      // 25 grid units = 25 * 2% = 50% = 500px
      expect(gridToPixelsX(25, 'canvas1')).toBe(500);
    });

    it('should round to nearest integer', () => {
      mockCanvas = createMockCanvas('canvas1', 999);

      // 10 grid units = 10 * 2% * 999 = 199.8, rounds to 200
      expect(gridToPixelsX(10, 'canvas1')).toBe(200);
    });

    it('should handle 0 grid units', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);
      expect(gridToPixelsX(0, 'canvas1')).toBe(0);
    });

    it('should handle full width (50 grid units)', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      // 50 grid units = 50 * 2% = 100% = 1000px
      expect(gridToPixelsX(50, 'canvas1')).toBe(1000);
    });

    it('should return 0 for non-existent canvas', () => {
      expect(gridToPixelsX(10, 'non-existent')).toBe(0);
    });

    it('should handle different canvas widths', () => {
      // @ts-expect-error: Canvas objects are used for DOM setup
      const _canvas1 = createMockCanvas('canvas1', 1000);
      const _canvas2 = createMockCanvas('canvas2', 2000);

      expect(gridToPixelsX(10, 'canvas1')).toBe(200); // 10% of 1000
      expect(gridToPixelsX(10, 'canvas2')).toBe(400); // 10% of 2000

      // Clean up
      _canvas2.parentNode?.removeChild(_canvas2);
    });
  });

  describe('gridToPixelsY', () => {
    it('should convert grid units to pixels vertically', () => {
      // 10 grid units = 10 * 20px = 200px
      expect(gridToPixelsY(10)).toBe(200);

      // 5 grid units = 5 * 20px = 100px
      expect(gridToPixelsY(5)).toBe(100);
    });

    it('should handle 0 grid units', () => {
      expect(gridToPixelsY(0)).toBe(0);
    });

    it('should handle large grid units', () => {
      expect(gridToPixelsY(100)).toBe(2000);
    });

    it('should handle fractional grid units', () => {
      // 2.5 grid units = 2.5 * 20px = 50px
      expect(gridToPixelsY(2.5)).toBe(50);
    });
  });

  describe('pixelsToGridX', () => {
    it('should convert pixels to grid units horizontally', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      // 200px = 20% of 1000px = 20% / 2% = 10 grid units
      expect(pixelsToGridX(200, 'canvas1')).toBe(10);

      // 500px = 50% of 1000px = 50% / 2% = 25 grid units
      expect(pixelsToGridX(500, 'canvas1')).toBe(25);
    });

    it('should round to nearest integer', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      // 199px = 19.9% of 1000px = 19.9% / 2% = 9.95, rounds to 10
      expect(pixelsToGridX(199, 'canvas1')).toBe(10);

      // 201px = 20.1% of 1000px = 20.1% / 2% = 10.05, rounds to 10
      expect(pixelsToGridX(201, 'canvas1')).toBe(10);
    });

    it('should handle 0 pixels', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);
      expect(pixelsToGridX(0, 'canvas1')).toBe(0);
    });

    it('should handle full width', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      // 1000px = 100% of 1000px = 100% / 2% = 50 grid units
      expect(pixelsToGridX(1000, 'canvas1')).toBe(50);
    });

    it('should return 0 for non-existent canvas', () => {
      expect(pixelsToGridX(200, 'non-existent')).toBe(0);
    });

    it('should handle different canvas widths', () => {
      // @ts-expect-error: Canvas objects are used for DOM setup
      const _canvas1 = createMockCanvas('canvas1', 1000);
      const _canvas2 = createMockCanvas('canvas2', 2000);

      // 200px in canvas1 (1000px) = 10 grid units
      expect(pixelsToGridX(200, 'canvas1')).toBe(10);

      // 400px in canvas2 (2000px) = 10 grid units
      expect(pixelsToGridX(400, 'canvas2')).toBe(10);

      // Clean up
      _canvas2.parentNode?.removeChild(_canvas2);
    });
  });

  describe('pixelsToGridY', () => {
    it('should convert pixels to grid units vertically', () => {
      // 200px = 200 / 20 = 10 grid units
      expect(pixelsToGridY(200)).toBe(10);

      // 100px = 100 / 20 = 5 grid units
      expect(pixelsToGridY(100)).toBe(5);
    });

    it('should round to nearest integer', () => {
      // 199px = 199 / 20 = 9.95, rounds to 10
      expect(pixelsToGridY(199)).toBe(10);

      // 201px = 201 / 20 = 10.05, rounds to 10
      expect(pixelsToGridY(201)).toBe(10);

      // 210px = 210 / 20 = 10.5, rounds to 11 (standard rounding)
      expect(pixelsToGridY(210)).toBe(11);
    });

    it('should handle 0 pixels', () => {
      expect(pixelsToGridY(0)).toBe(0);
    });

    it('should handle large pixel values', () => {
      expect(pixelsToGridY(2000)).toBe(100);
    });
  });

  describe('Round-trip Conversions', () => {
    it('should round-trip grid to pixels to grid (horizontal)', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      const gridUnits = 10;
      const pixels = gridToPixelsX(gridUnits, 'canvas1');
      const backToGrid = pixelsToGridX(pixels, 'canvas1');

      expect(backToGrid).toBe(gridUnits);
    });

    it('should round-trip grid to pixels to grid (vertical)', () => {
      const gridUnits = 10;
      const pixels = gridToPixelsY(gridUnits);
      const backToGrid = pixelsToGridY(pixels);

      expect(backToGrid).toBe(gridUnits);
    });

    it('should round-trip pixels to grid to pixels (horizontal)', () => {
      mockCanvas = createMockCanvas('canvas1', 1000);

      const pixels = 200;
      const gridUnits = pixelsToGridX(pixels, 'canvas1');
      const backToPixels = gridToPixelsX(gridUnits, 'canvas1');

      expect(backToPixels).toBe(pixels);
    });

    it('should round-trip pixels to grid to pixels (vertical)', () => {
      const pixels = 200;
      const gridUnits = pixelsToGridY(pixels);
      const backToPixels = gridToPixelsY(gridUnits);

      expect(backToPixels).toBe(pixels);
    });

    it('should maintain precision across multiple canvas sizes', () => {
      const canvases = [
        createMockCanvas('canvas1', 1000),
        createMockCanvas('canvas2', 1500),
        createMockCanvas('canvas3', 2000),
      ];

      canvases.forEach(canvas => {
        const gridUnits = 25; // Quarter width
        const pixels = gridToPixelsX(gridUnits, canvas.id);
        const backToGrid = pixelsToGridX(pixels, canvas.id);
        expect(backToGrid).toBe(gridUnits);
      });

      // Clean up
      canvases.slice(1).forEach(c => c.parentNode?.removeChild(c));
    });
  });
});
