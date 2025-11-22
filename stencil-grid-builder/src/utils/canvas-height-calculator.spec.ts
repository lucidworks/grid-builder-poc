import { calculateCanvasHeight, calculateCanvasHeightFromItems } from './canvas-height-calculator';
import { gridState, reset } from '../services/state-manager';

// Mock grid-calculations
jest.mock('./grid-calculations', () => ({
  gridToPixelsY: jest.fn((gridUnits: number) => gridUnits * 20), // Mock: 20px per grid unit
}));

describe('canvas-height-calculator', () => {
  beforeEach(() => {
    reset();
    jest.clearAllMocks();
  });

  describe('calculateCanvasHeightFromItems', () => {
    it('should return 0 for empty items array', () => {
      const height = calculateCanvasHeightFromItems([], 'desktop');
      expect(height).toBe(0);
    });

    it('should return 0 when items is null', () => {
      const height = calculateCanvasHeightFromItems(null as any, 'desktop');
      expect(height).toBe(0);
    });

    it('should return 0 when items is undefined', () => {
      const height = calculateCanvasHeightFromItems(undefined as any, 'desktop');
      expect(height).toBe(0);
    });

    it('should calculate height for single item', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6 },
            mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
          },
        },
      ];

      // Item at y=2, height=6 → bottom=8
      // + 5 grid units margin = 13 grid units
      // × 20px per unit = 260px
      const height = calculateCanvasHeightFromItems(items, 'desktop');
      expect(height).toBe(260); // (8 + 5) * 20
    });

    it('should find the bottommost item', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6 }, // bottom=8
            mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
          },
        },
        {
          id: 'item-2',
          canvasId: 'canvas1',
          type: 'article',
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 4 }, // bottom=14 (bottommost)
            mobile: { x: 0, y: 10, width: 14, height: 4, customized: false },
          },
        },
        {
          id: 'item-3',
          canvasId: 'canvas1',
          type: 'button',
          layouts: {
            desktop: { x: 0, y: 5, width: 10, height: 3 }, // bottom=8
            mobile: { x: 0, y: 5, width: 14, height: 3, customized: false },
          },
        },
      ];

      // Bottommost: 14 grid units
      // + 5 grid units margin = 19 grid units
      // × 20px per unit = 380px
      const height = calculateCanvasHeightFromItems(items, 'desktop');
      expect(height).toBe(380); // (14 + 5) * 20
    });

    it('should use desktop layout when viewport is desktop', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6 }, // bottom=8
            mobile: { x: 0, y: 10, width: 14, height: 3 }, // bottom=13 (ignored)
          },
        },
      ];

      const height = calculateCanvasHeightFromItems(items, 'desktop');
      expect(height).toBe(260); // (8 + 5) * 20
    });

    it('should use mobile layout when viewport is mobile', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6 }, // bottom=8 (ignored)
            mobile: { x: 0, y: 10, width: 14, height: 3 }, // bottom=13
          },
        },
      ];

      const height = calculateCanvasHeightFromItems(items, 'mobile');
      expect(height).toBe(360); // (13 + 5) * 20
    });

    it('should handle auto-layout mobile items with null y', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
        },
      ];

      // Null y and height should be treated as 0
      // bottom = 0 + 0 = 0
      // + 5 grid units margin = 5 grid units
      // × 20px per unit = 100px
      const height = calculateCanvasHeightFromItems(items, 'mobile');
      expect(height).toBe(100); // (0 + 5) * 20
    });

    it('should handle auto-layout mobile items with null height', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6 },
            mobile: { x: 0, y: 5, width: 14, height: null, customized: false },
          },
        },
      ];

      // y=5, height=null → bottom=5
      // + 5 grid units margin = 10 grid units
      // × 20px per unit = 200px
      const height = calculateCanvasHeightFromItems(items, 'mobile');
      expect(height).toBe(200); // (5 + 5) * 20
    });

    it('should add 5 grid units margin to bottommost item', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 10 }, // bottom=20
            mobile: { x: 0, y: 10, width: 14, height: 10, customized: false },
          },
        },
      ];

      // Bottom: 20 grid units
      // + 5 grid units margin = 25 grid units
      // × 20px per unit = 500px
      const height = calculateCanvasHeightFromItems(items, 'desktop');
      expect(height).toBe(500); // (20 + 5) * 20
    });

    it('should use custom bottom margin from config', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 10 }, // bottom=20
            mobile: { x: 0, y: 10, width: 14, height: 10, customized: false },
          },
        },
      ];

      // Bottom: 20 grid units
      // + 10 grid units custom margin = 30 grid units
      // × 20px per unit = 600px
      const config = { canvasBottomMargin: 10 };
      const height = calculateCanvasHeightFromItems(items, 'desktop', config);
      expect(height).toBe(600); // (20 + 10) * 20
    });

    it('should use custom bottom margin of 0', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 10 }, // bottom=20
            mobile: { x: 0, y: 10, width: 14, height: 10, customized: false },
          },
        },
      ];

      // Bottom: 20 grid units
      // + 0 grid units margin = 20 grid units
      // × 20px per unit = 400px
      const config = { canvasBottomMargin: 0 };
      const height = calculateCanvasHeightFromItems(items, 'desktop', config);
      expect(height).toBe(400); // (20 + 0) * 20
    });

    it('should use custom bottom margin of 15 grid units', () => {
      const items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          layouts: {
            desktop: { x: 0, y: 5, width: 10, height: 8 }, // bottom=13
            mobile: { x: 0, y: 5, width: 14, height: 8, customized: false },
          },
        },
      ];

      // Bottom: 13 grid units
      // + 15 grid units custom margin = 28 grid units
      // × 20px per unit = 560px
      const config = { canvasBottomMargin: 15 };
      const height = calculateCanvasHeightFromItems(items, 'desktop', config);
      expect(height).toBe(560); // (13 + 15) * 20
    });
  });

  describe('calculateCanvasHeight (from global state)', () => {
    it('should return 0 when canvas does not exist', () => {
      const height = calculateCanvasHeight('nonexistent-canvas');
      expect(height).toBe(0);
    });

    it('should return 0 when canvas has no items', () => {
      gridState.canvases = {
        'canvas1': {
          items: [],
          zIndexCounter: 1,
        },
      };

      const height = calculateCanvasHeight('canvas1');
      expect(height).toBe(0);
    });

    it('should return 0 when canvas items is null', () => {
      gridState.canvases = {
        'canvas1': {
          items: null as any,
          zIndexCounter: 1,
        },
      };

      const height = calculateCanvasHeight('canvas1');
      expect(height).toBe(0);
    });

    it('should calculate height from gridState items', () => {
      gridState.canvases = {
        'canvas1': {
          items: [
            {
              id: 'item-1',
              canvasId: 'canvas1',
              type: 'header',
              name: 'Header',
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6 },
                mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      gridState.currentViewport = 'desktop';

      // Item at y=2, height=6 → bottom=8
      // + 5 grid units margin = 13 grid units
      // × 20px per unit = 260px
      const height = calculateCanvasHeight('canvas1');
      expect(height).toBe(260); // (8 + 5) * 20
    });

    it('should use currentViewport from gridState', () => {
      gridState.canvases = {
        'canvas1': {
          items: [
            {
              id: 'item-1',
              canvasId: 'canvas1',
              type: 'header',
              name: 'Header',
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6 }, // bottom=8
                mobile: { x: 0, y: 10, width: 14, height: 3, customized: false }, // bottom=13
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };

      // Desktop viewport
      gridState.currentViewport = 'desktop';
      let height = calculateCanvasHeight('canvas1');
      expect(height).toBe(260); // (8 + 5) * 20

      // Mobile viewport
      gridState.currentViewport = 'mobile';
      height = calculateCanvasHeight('canvas1');
      expect(height).toBe(360); // (13 + 5) * 20
    });

    it('should default to desktop viewport when currentViewport is not set', () => {
      gridState.canvases = {
        'canvas1': {
          items: [
            {
              id: 'item-1',
              canvasId: 'canvas1',
              type: 'header',
              name: 'Header',
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6 },
                mobile: { x: 0, y: 10, width: 14, height: 3, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      gridState.currentViewport = null as any;

      const height = calculateCanvasHeight('canvas1');
      expect(height).toBe(260); // Uses desktop (8 + 5) * 20
    });

    it('should handle multiple items and find bottommost', () => {
      gridState.canvases = {
        'canvas1': {
          items: [
            {
              id: 'item-1',
              canvasId: 'canvas1',
              type: 'header',
              name: 'Header',
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6 },
                mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
              },
              config: {},
              zIndex: 1,
            },
            {
              id: 'item-2',
              canvasId: 'canvas1',
              type: 'article',
              name: 'Article',
              layouts: {
                desktop: { x: 0, y: 15, width: 10, height: 8 }, // bottom=23 (bottommost)
                mobile: { x: 0, y: 10, width: 14, height: 4, customized: false },
              },
              config: {},
              zIndex: 2,
            },
          ],
          zIndexCounter: 3,
        },
      };
      gridState.currentViewport = 'desktop';

      // Bottommost: 23 grid units
      // + 5 grid units margin = 28 grid units
      // × 20px per unit = 560px
      const height = calculateCanvasHeight('canvas1');
      expect(height).toBe(560); // (23 + 5) * 20
    });

    it('should work with different canvas IDs', () => {
      gridState.canvases = {
        'hero-section': {
          items: [
            {
              id: 'item-1',
              canvasId: 'hero-section',
              type: 'header',
              name: 'Header',
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6 },
                mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
        'footer-section': {
          items: [
            {
              id: 'item-2',
              canvasId: 'footer-section',
              type: 'footer',
              name: 'Footer',
              layouts: {
                desktop: { x: 0, y: 5, width: 10, height: 4 },
                mobile: { x: 0, y: 5, width: 14, height: 3, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      gridState.currentViewport = 'desktop';

      const heroHeight = calculateCanvasHeight('hero-section');
      expect(heroHeight).toBe(260); // (8 + 5) * 20

      const footerHeight = calculateCanvasHeight('footer-section');
      expect(footerHeight).toBe(280); // (5 + 4 + 5) * 20 = (9 + 5) * 20 = 280
    });

    it('should use custom bottom margin from config', () => {
      gridState.canvases = {
        'canvas1': {
          items: [
            {
              id: 'item-1',
              canvasId: 'canvas1',
              type: 'header',
              name: 'Header',
              layouts: {
                desktop: { x: 0, y: 10, width: 10, height: 10 }, // bottom=20
                mobile: { x: 0, y: 10, width: 14, height: 10, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      gridState.currentViewport = 'desktop';

      // Bottom: 20 grid units
      // + 10 grid units custom margin = 30 grid units
      // × 20px per unit = 600px
      const config = { canvasBottomMargin: 10 };
      const height = calculateCanvasHeight('canvas1', config);
      expect(height).toBe(600); // (20 + 10) * 20
    });
  });

  describe('Integration', () => {
    it('should delegate calculateCanvasHeight to calculateCanvasHeightFromItems', () => {
      gridState.canvases = {
        'canvas1': {
          items: [
            {
              id: 'item-1',
              canvasId: 'canvas1',
              type: 'header',
              name: 'Header',
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6 },
                mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      gridState.currentViewport = 'desktop';

      const heightFromState = calculateCanvasHeight('canvas1');
      const heightFromItems = calculateCanvasHeightFromItems(
        gridState.canvases['canvas1'].items,
        'desktop'
      );

      expect(heightFromState).toBe(heightFromItems);
    });
  });
});
