/**
 * Canvas Height Calculator Tests (Instance-Based)
 * =================================================
 *
 * Tests the same functionality using explicit state instances.
 *
 * **Test Coverage**:
 * - calculateCanvasHeightFromItems (pure function) - no state needed
 * - calculateCanvasHeight with instance state - explicit state parameter
 * - Integration tests - instance state delegation
 * - All tests use explicit `testState` parameter
 */

import {
  calculateCanvasHeight,
  calculateCanvasHeightFromItems,
} from "./canvas-height-calculator";
import { GridState } from "../services/state-manager";

// Mock grid-calculations
jest.mock("./grid-calculations", () => ({
  gridToPixelsY: jest.fn((gridUnits: number) => gridUnits * 20), // Mock: 20px per grid unit
}));

describe("canvas-height-calculator (instance-based)", () => {
  let testState: GridState;

  beforeEach(() => {
    // Create isolated test state (no global)
    testState = {
      canvases: {},
      currentViewport: "desktop",
      selectedItemId: null,
      selectedCanvasId: null,
      activeCanvasId: null,
      showGrid: true,
      breakpoints: {
        mobile: { minWidth: 0, layoutMode: "stack" },
        desktop: { minWidth: 768, layoutMode: "manual" },
      },
    };
    jest.clearAllMocks();
  });

  describe("calculateCanvasHeightFromItems", () => {
    // calculateCanvasHeightFromItems is pure function, no state needed - same tests as original

    it("should return 0 for empty items array", () => {
      const height = calculateCanvasHeightFromItems([], "desktop");
      expect(height).toBe(0);
    });

    it("should return 0 when items is null", () => {
      const height = calculateCanvasHeightFromItems(null as any, "desktop");
      expect(height).toBe(0);
    });

    it("should return 0 when items is undefined", () => {
      const height = calculateCanvasHeightFromItems(
        undefined as any,
        "desktop",
      );
      expect(height).toBe(0);
    });

    it("should calculate height for single item", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6, customized: true },
            mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
          },
        },
      ];

      // Item at y=2, height=6 → bottom=8
      // + 5 grid units margin = 13 grid units
      // × 20px per unit = 260px
      const height = calculateCanvasHeightFromItems(items, "desktop");
      expect(height).toBe(260); // (8 + 5) * 20
    });

    it("should find the bottommost item", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6, customized: true }, // bottom=8
            mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
          },
        },
        {
          id: "item-2",
          canvasId: "canvas1",
          type: "article",
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 4, customized: true }, // bottom=14 (bottommost)
            mobile: { x: 0, y: 10, width: 14, height: 4, customized: false },
          },
        },
        {
          id: "item-3",
          canvasId: "canvas1",
          type: "button",
          layouts: {
            desktop: { x: 0, y: 5, width: 10, height: 3, customized: true }, // bottom=8
            mobile: { x: 0, y: 5, width: 14, height: 3, customized: false },
          },
        },
      ];

      // Bottommost: 14 grid units
      // + 5 grid units margin = 19 grid units
      // × 20px per unit = 380px
      const height = calculateCanvasHeightFromItems(items, "desktop");
      expect(height).toBe(380); // (14 + 5) * 20
    });

    it("should use desktop layout when viewport is desktop", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6, customized: true }, // bottom=8
            mobile: { x: 0, y: 10, width: 14, height: 3 }, // bottom=13 (ignored)
          },
        },
      ];

      const height = calculateCanvasHeightFromItems(items, "desktop");
      expect(height).toBe(260); // (8 + 5) * 20
    });

    it("should use mobile layout when viewport is mobile", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6, customized: true }, // bottom=8 (ignored)
            mobile: { x: 0, y: 10, width: 14, height: 3 }, // bottom=13
          },
        },
      ];

      const height = calculateCanvasHeightFromItems(items, "mobile");
      expect(height).toBe(360); // (13 + 5) * 20
    });

    it("should handle auto-layout mobile items with null y", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6, customized: true },
            mobile: {
              x: null,
              y: null,
              width: null,
              height: null,
              customized: false,
            },
          },
        },
      ];

      // Null y and height should be treated as 0
      // bottom = 0 + 0 = 0
      // + 5 grid units margin = 5 grid units
      // × 20px per unit = 100px
      const height = calculateCanvasHeightFromItems(items, "mobile");
      expect(height).toBe(100); // (0 + 5) * 20
    });

    it("should handle auto-layout mobile items with null height", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 2, width: 10, height: 6, customized: true },
            mobile: { x: 0, y: 5, width: 14, height: null, customized: false },
          },
        },
      ];

      // y=5, height=null → bottom=5
      // + 5 grid units margin = 10 grid units
      // × 20px per unit = 200px
      const height = calculateCanvasHeightFromItems(items, "mobile");
      expect(height).toBe(200); // (5 + 5) * 20
    });

    it("should add 5 grid units margin to bottommost item", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 10, customized: true }, // bottom=20
            mobile: { x: 0, y: 10, width: 14, height: 10, customized: false },
          },
        },
      ];

      // Bottom: 20 grid units
      // + 5 grid units margin = 25 grid units
      // × 20px per unit = 500px
      const height = calculateCanvasHeightFromItems(items, "desktop");
      expect(height).toBe(500); // (20 + 5) * 20
    });

    it("should use custom bottom margin from config", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 10, customized: true }, // bottom=20
            mobile: { x: 0, y: 10, width: 14, height: 10, customized: false },
          },
        },
      ];

      // Bottom: 20 grid units
      // + 10 grid units custom margin = 30 grid units
      // × 20px per unit = 600px
      const config = { canvasBottomMargin: 10 };
      const height = calculateCanvasHeightFromItems(items, "desktop", config);
      expect(height).toBe(600); // (20 + 10) * 20
    });

    it("should use custom bottom margin of 0", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 10, customized: true }, // bottom=20
            mobile: { x: 0, y: 10, width: 14, height: 10, customized: false },
          },
        },
      ];

      // Bottom: 20 grid units
      // + 0 grid units margin = 20 grid units
      // × 20px per unit = 400px
      const config = { canvasBottomMargin: 0 };
      const height = calculateCanvasHeightFromItems(items, "desktop", config);
      expect(height).toBe(400); // (20 + 0) * 20
    });

    it("should use custom bottom margin of 15 grid units", () => {
      const items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          layouts: {
            desktop: { x: 0, y: 5, width: 10, height: 8, customized: true }, // bottom=13
            mobile: { x: 0, y: 5, width: 14, height: 8, customized: false },
          },
        },
      ];

      // Bottom: 13 grid units
      // + 15 grid units custom margin = 28 grid units
      // × 20px per unit = 560px
      const config = { canvasBottomMargin: 15 };
      const height = calculateCanvasHeightFromItems(items, "desktop", config);
      expect(height).toBe(560); // (13 + 15) * 20
    });
  });

  describe("calculateCanvasHeight (from instance state)", () => {
    it("should return 0 when canvas does not exist", () => {
      // Pass testState explicitly (instance-based)
      const height = calculateCanvasHeight(
        "nonexistent-canvas",
        undefined,
        testState,
      );
      expect(height).toBe(0);
    });

    it("should return 0 when canvas has no items", () => {
      testState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 1,
        },
      };

      // Pass testState explicitly (instance-based)
      const height = calculateCanvasHeight("canvas1", undefined, testState);
      expect(height).toBe(0);
    });

    it("should return 0 when canvas items is null", () => {
      testState.canvases = {
        canvas1: {
          items: null as any,
          zIndexCounter: 1,
        },
      };

      // Pass testState explicitly (instance-based)
      const height = calculateCanvasHeight("canvas1", undefined, testState);
      expect(height).toBe(0);
    });

    it("should calculate height from testState items", () => {
      testState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6, customized: true },
                mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      testState.currentViewport = "desktop";

      // Item at y=2, height=6 → bottom=8
      // + 5 grid units margin = 13 grid units
      // × 20px per unit = 260px
      // Pass testState explicitly (instance-based)
      const height = calculateCanvasHeight("canvas1", undefined, testState);
      expect(height).toBe(260); // (8 + 5) * 20
    });

    it("should use currentViewport from testState", () => {
      testState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6, customized: true }, // bottom=8
                mobile: {
                  x: 0,
                  y: 10,
                  width: 14,
                  height: 3,
                  customized: false,
                }, // bottom=13
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };

      // Desktop viewport
      testState.currentViewport = "desktop";
      let height = calculateCanvasHeight("canvas1", undefined, testState);
      expect(height).toBe(260); // (8 + 5) * 20

      // Mobile viewport
      testState.currentViewport = "mobile";
      height = calculateCanvasHeight("canvas1", undefined, testState);
      expect(height).toBe(360); // (13 + 5) * 20
    });

    it("should default to desktop viewport when currentViewport is not set", () => {
      testState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6, customized: true },
                mobile: {
                  x: 0,
                  y: 10,
                  width: 14,
                  height: 3,
                  customized: false,
                },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      testState.currentViewport = null as any;

      // Pass testState explicitly (instance-based)
      const height = calculateCanvasHeight("canvas1", undefined, testState);
      expect(height).toBe(260); // Uses desktop (8 + 5) * 20
    });

    it("should handle multiple items and find bottommost", () => {
      testState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6, customized: true },
                mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
              },
              config: {},
              zIndex: 1,
            },
            {
              id: "item-2",
              canvasId: "canvas1",
              type: "article",
              name: "Article",
              layouts: {
                desktop: {
                  x: 0,
                  y: 15,
                  width: 10,
                  height: 8,
                  customized: true,
                }, // bottom=23 (bottommost)
                mobile: {
                  x: 0,
                  y: 10,
                  width: 14,
                  height: 4,
                  customized: false,
                },
              },
              config: {},
              zIndex: 2,
            },
          ],
          zIndexCounter: 3,
        },
      };
      testState.currentViewport = "desktop";

      // Bottommost: 23 grid units
      // + 5 grid units margin = 28 grid units
      // × 20px per unit = 560px
      // Pass testState explicitly (instance-based)
      const height = calculateCanvasHeight("canvas1", undefined, testState);
      expect(height).toBe(560); // (23 + 5) * 20
    });

    it("should work with different canvas IDs", () => {
      testState.canvases = {
        "hero-section": {
          items: [
            {
              id: "item-1",
              canvasId: "hero-section",
              type: "header",
              name: "Header",
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6, customized: true },
                mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
        "footer-section": {
          items: [
            {
              id: "item-2",
              canvasId: "footer-section",
              type: "footer",
              name: "Footer",
              layouts: {
                desktop: { x: 0, y: 5, width: 10, height: 4, customized: true },
                mobile: { x: 0, y: 5, width: 14, height: 3, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      testState.currentViewport = "desktop";

      // Pass testState explicitly (instance-based)
      const heroHeight = calculateCanvasHeight(
        "hero-section",
        undefined,
        testState,
      );
      expect(heroHeight).toBe(260); // (8 + 5) * 20

      const footerHeight = calculateCanvasHeight(
        "footer-section",
        undefined,
        testState,
      );
      expect(footerHeight).toBe(280); // (5 + 4 + 5) * 20 = (9 + 5) * 20 = 280
    });

    it("should use custom bottom margin from config", () => {
      testState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: {
                  x: 0,
                  y: 10,
                  width: 10,
                  height: 10,
                  customized: true,
                }, // bottom=20
                mobile: {
                  x: 0,
                  y: 10,
                  width: 14,
                  height: 10,
                  customized: false,
                },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      testState.currentViewport = "desktop";

      // Bottom: 20 grid units
      // + 10 grid units custom margin = 30 grid units
      // × 20px per unit = 600px
      const config = { canvasBottomMargin: 10 };
      // Pass testState explicitly (instance-based)
      const height = calculateCanvasHeight("canvas1", config, testState);
      expect(height).toBe(600); // (20 + 10) * 20
    });
  });

  describe("Integration", () => {
    it("should delegate calculateCanvasHeight to calculateCanvasHeightFromItems", () => {
      testState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: { x: 0, y: 2, width: 10, height: 6, customized: true },
                mobile: { x: 0, y: 2, width: 14, height: 5, customized: false },
              },
              config: {},
              zIndex: 1,
            },
          ],
          zIndexCounter: 2,
        },
      };
      testState.currentViewport = "desktop";

      // Pass testState explicitly (instance-based)
      const heightFromState = calculateCanvasHeight(
        "canvas1",
        undefined,
        testState,
      );
      const heightFromItems = calculateCanvasHeightFromItems(
        testState.canvases.canvas1.items,
        "desktop",
      );

      expect(heightFromState).toBe(heightFromItems);
    });
  });
});
