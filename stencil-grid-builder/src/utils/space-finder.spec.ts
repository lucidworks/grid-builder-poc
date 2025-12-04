/**
 * Space Finding Utility Tests
 * ============================
 *
 * Comprehensive tests for collision detection and smart positioning algorithms.
 *
 * **Test Coverage**:
 * - Collision detection (AABB algorithm)
 * - Centered positioning for empty canvas
 * - Bottom positioning fallback
 * - Free space finding (hybrid strategy)
 * - Edge cases and boundary conditions
 */

import {
  checkCollision,
  findFreeSpace,
  getCenteredPosition,
  getBottomPosition,
  CANVAS_WIDTH_UNITS,
} from "./space-finder";
import { gridState, reset } from "../services/state-manager";

describe("space-finder", () => {
  beforeEach(() => {
    reset();
  });

  describe("checkCollision", () => {
    it("should detect no collision when items are separated horizontally", () => {
      const item1 = { x: 0, y: 0, width: 10, height: 10 };
      const item2 = { x: 15, y: 0, width: 10, height: 10 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(false);
    });

    it("should detect no collision when items are separated vertically", () => {
      const item1 = { x: 0, y: 0, width: 10, height: 10 };
      const item2 = { x: 0, y: 15, width: 10, height: 10 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(false);
    });

    it("should detect collision when items overlap", () => {
      const item1 = { x: 0, y: 0, width: 10, height: 10 };
      const item2 = { x: 5, y: 5, width: 10, height: 10 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(true);
    });

    it("should detect collision when one item is inside another", () => {
      const item1 = { x: 0, y: 0, width: 20, height: 20 };
      const item2 = { x: 5, y: 5, width: 5, height: 5 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(true);
    });

    it("should detect no collision when items are touching but not overlapping", () => {
      // Items are adjacent (edge-to-edge) but not overlapping
      const item1 = { x: 0, y: 0, width: 10, height: 10 };
      const item2 = { x: 10, y: 0, width: 10, height: 10 };

      const result = checkCollision(item1, item2);

      // item1.x + width = 10, item2.x = 10
      // So item1.x + width <= item2.x is true → no collision
      expect(result).toBe(false);
    });

    it("should detect collision when items overlap by 1 unit", () => {
      const item1 = { x: 0, y: 0, width: 10, height: 10 };
      const item2 = { x: 9, y: 0, width: 10, height: 10 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(true);
    });

    it("should detect collision when items overlap at corners", () => {
      const item1 = { x: 0, y: 0, width: 10, height: 10 };
      const item2 = { x: 9, y: 9, width: 10, height: 10 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(true);
    });

    it("should detect no collision when items are diagonal but not overlapping", () => {
      const item1 = { x: 0, y: 0, width: 5, height: 5 };
      const item2 = { x: 10, y: 10, width: 5, height: 5 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(false);
    });

    it("should handle zero-width or zero-height items", () => {
      const item1 = { x: 0, y: 0, width: 0, height: 10 };
      const item2 = { x: 0, y: 0, width: 10, height: 10 };

      const result = checkCollision(item1, item2);

      // item1.x + width = 0, item2.x = 0
      // So item1.x + width <= item2.x is true → no collision
      expect(result).toBe(false);
    });

    it("should handle items with same position and size (complete overlap)", () => {
      const item1 = { x: 5, y: 5, width: 10, height: 10 };
      const item2 = { x: 5, y: 5, width: 10, height: 10 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(true);
    });

    it("should handle floating point positions", () => {
      const item1 = { x: 0.5, y: 0.5, width: 10.5, height: 10.5 };
      const item2 = { x: 5.5, y: 5.5, width: 10.5, height: 10.5 };

      const result = checkCollision(item1, item2);

      expect(result).toBe(true);
    });
  });

  describe("getCenteredPosition", () => {
    it("should center a 10-unit wide component", () => {
      const result = getCenteredPosition(10);

      // (50 - 10) / 2 = 20
      expect(result).toEqual({ x: 20, y: 2 });
    });

    it("should center a 20-unit wide component", () => {
      const result = getCenteredPosition(20);

      // (50 - 20) / 2 = 15
      expect(result).toEqual({ x: 15, y: 2 });
    });

    it("should center a 50-unit wide component (full width)", () => {
      const result = getCenteredPosition(50);

      // (50 - 50) / 2 = 0
      expect(result).toEqual({ x: 0, y: 2 });
    });

    it("should center a 1-unit wide component", () => {
      const result = getCenteredPosition(1);

      // (50 - 1) / 2 = 24.5 → floor to 24
      expect(result).toEqual({ x: 24, y: 2 });
    });

    it("should use default top margin of 2", () => {
      const result = getCenteredPosition(10);

      expect(result.y).toBe(2);
    });

    it("should handle odd-width canvases correctly", () => {
      // Canvas is 50 units (even), component is 11 (odd)
      const result = getCenteredPosition(11);

      // (50 - 11) / 2 = 19.5 → floor to 19
      expect(result).toEqual({ x: 19, y: 2 });
    });
  });

  describe("getBottomPosition", () => {
    it("should return (0, 0) for empty canvas", () => {
      gridState.canvases = {
        canvas1: { items: [], zIndexCounter: 1 },
      };

      const result = getBottomPosition("canvas1");

      expect(result).toEqual({ x: 0, y: 0 });
    });

    it("should return (0, 0) for non-existent canvas", () => {
      const result = getBottomPosition("non-existent");

      expect(result).toEqual({ x: 0, y: 0 });
    });

    it("should place below single item with spacing", () => {
      gridState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: { x: 0, y: 0, width: 10, height: 6, customized: true },
                mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
              },
              zIndex: 1,
              config: {},
            },
          ],
          zIndexCounter: 2,
        },
      };

      const result = getBottomPosition("canvas1");

      // Bottom of item-1: y=0, height=6 → bottom at 6
      // Add spacing: 6 + 2 = 8
      expect(result).toEqual({ x: 0, y: 8 });
    });

    it("should place below bottommost item when multiple items exist", () => {
      gridState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: { x: 0, y: 0, width: 10, height: 6, customized: true },
                mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
              },
              zIndex: 1,
              config: {},
            },
            {
              id: "item-2",
              canvasId: "canvas1",
              type: "text",
              name: "Text",
              layouts: {
                desktop: {
                  x: 0,
                  y: 10,
                  width: 10,
                  height: 8,
                  customized: true,
                },
                mobile: {
                  x: 0,
                  y: 10,
                  width: 50,
                  height: 8,
                  customized: false,
                },
              },
              zIndex: 2,
              config: {},
            },
            {
              id: "item-3",
              canvasId: "canvas1",
              type: "button",
              name: "Button",
              layouts: {
                desktop: {
                  x: 20,
                  y: 5,
                  width: 10,
                  height: 5,
                  customized: true,
                },
                mobile: {
                  x: 0,
                  y: 20,
                  width: 50,
                  height: 5,
                  customized: false,
                },
              },
              zIndex: 3,
              config: {},
            },
          ],
          zIndexCounter: 4,
        },
      };

      const result = getBottomPosition("canvas1");

      // Item-1 bottom: 0 + 6 = 6
      // Item-2 bottom: 10 + 8 = 18 (bottommost)
      // Item-3 bottom: 5 + 5 = 10
      // Add spacing: 18 + 2 = 20
      expect(result).toEqual({ x: 0, y: 20 });
    });

    it("should always place at left edge (x=0)", () => {
      gridState.canvases = {
        canvas1: {
          items: [
            {
              id: "item-1",
              canvasId: "canvas1",
              type: "header",
              name: "Header",
              layouts: {
                desktop: {
                  x: 30,
                  y: 0,
                  width: 10,
                  height: 6,
                  customized: true,
                },
                mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
              },
              zIndex: 1,
              config: {},
            },
          ],
          zIndexCounter: 2,
        },
      };

      const result = getBottomPosition("canvas1");

      expect(result.x).toBe(0);
    });
  });

  describe("findFreeSpace", () => {
    beforeEach(() => {
      gridState.canvases = {
        canvas1: { items: [], zIndexCounter: 1 },
      };
    });

    it("should return null for non-existent canvas", () => {
      const result = findFreeSpace("non-existent", 10, 6);

      expect(result).toBeNull();
    });

    it("should center component on empty canvas", () => {
      const result = findFreeSpace("canvas1", 10, 6);

      // Centered: (50 - 10) / 2 = 20
      expect(result).toEqual({ x: 20, y: 2 });
    });

    it("should return top-left when available", () => {
      // Add item far from top-left
      gridState.canvases.canvas1.items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Header",
          layouts: {
            desktop: { x: 20, y: 20, width: 10, height: 6, customized: true },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          zIndex: 1,
          config: {},
        },
      ];

      const result = findFreeSpace("canvas1", 10, 6);

      // Top-left (2, 2) should be free
      expect(result).toEqual({ x: 2, y: 2 });
    });

    it("should find free space via grid scan when top-left is occupied", () => {
      // Occupy top-left
      gridState.canvases.canvas1.items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Header",
          layouts: {
            desktop: { x: 0, y: 0, width: 15, height: 8, customized: true },
            mobile: { x: 0, y: 0, width: 50, height: 8, customized: false },
          },
          zIndex: 1,
          config: {},
        },
      ];

      const result = findFreeSpace("canvas1", 10, 6);

      // Should find space not colliding with item-1
      expect(result).not.toBeNull();
      if (result) {
        const testPos = { ...result, width: 10, height: 6 };
        const hasCollision = checkCollision(
          testPos,
          gridState.canvases.canvas1.items[0].layouts.desktop,
        );
        expect(hasCollision).toBe(false);
      }
    });

    it("should find space between existing items", () => {
      gridState.canvases.canvas1.items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Header",
          layouts: {
            desktop: { x: 0, y: 0, width: 10, height: 6, customized: true },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          zIndex: 1,
          config: {},
        },
        {
          id: "item-2",
          canvasId: "canvas1",
          type: "text",
          name: "Text",
          layouts: {
            desktop: { x: 0, y: 10, width: 10, height: 6, customized: true },
            mobile: { x: 0, y: 10, width: 50, height: 6, customized: false },
          },
          zIndex: 2,
          config: {},
        },
      ];

      const result = findFreeSpace("canvas1", 5, 3);

      // Should find space (e.g., between items or to the right)
      expect(result).not.toBeNull();
      if (result) {
        const testPos = { ...result, width: 5, height: 3 };
        gridState.canvases.canvas1.items.forEach((item) => {
          const hasCollision = checkCollision(testPos, item.layouts.desktop);
          expect(hasCollision).toBe(false);
        });
      }
    });

    it("should place at bottom when no free space found in grid scan", () => {
      // Fill top rows completely (simulate full canvas)
      const items = [];
      for (let y = 0; y < 20; y += 6) {
        for (let x = 0; x < CANVAS_WIDTH_UNITS; x += 10) {
          items.push({
            id: `item-${items.length}`,
            canvasId: "canvas1",
            type: "header",
            name: "Header",
            layouts: {
              desktop: { x, y, width: 10, height: 6 },
              mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
            },
            zIndex: items.length + 1,
            config: {},
          });
        }
      }
      gridState.canvases.canvas1.items = items;

      const result = findFreeSpace("canvas1", 10, 6);

      // Should place at bottom
      expect(result).not.toBeNull();
      if (result) {
        // Should be at left edge
        expect(result.x).toBe(0);
        // Should be below all items
        const bottomY = Math.max(
          ...items.map(
            (item) => item.layouts.desktop.y + item.layouts.desktop.height,
          ),
        );
        expect(result.y).toBeGreaterThanOrEqual(bottomY);
      }
    });

    it("should respect component width constraints", () => {
      gridState.canvases.canvas1.items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Header",
          layouts: {
            desktop: { x: 0, y: 0, width: 30, height: 6, customized: true },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          zIndex: 1,
          config: {},
        },
      ];

      // Large component (width=25)
      const result = findFreeSpace("canvas1", 25, 6);

      expect(result).not.toBeNull();
      if (result) {
        // Should fit within canvas bounds
        expect(result.x + 25).toBeLessThanOrEqual(CANVAS_WIDTH_UNITS);
      }
    });

    it("should handle full-width components", () => {
      const result = findFreeSpace("canvas1", 50, 6);

      expect(result).not.toBeNull();
      if (result) {
        // Full-width must start at x=0
        expect(result.x).toBe(0);
      }
    });

    it("should not overlap with any existing items", () => {
      gridState.canvases.canvas1.items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Header",
          layouts: {
            desktop: { x: 5, y: 5, width: 10, height: 6, customized: true },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          zIndex: 1,
          config: {},
        },
        {
          id: "item-2",
          canvasId: "canvas1",
          type: "text",
          name: "Text",
          layouts: {
            desktop: { x: 20, y: 8, width: 15, height: 8, customized: true },
            mobile: { x: 0, y: 10, width: 50, height: 8, customized: false },
          },
          zIndex: 2,
          config: {},
        },
      ];

      const result = findFreeSpace("canvas1", 10, 6);

      expect(result).not.toBeNull();
      if (result) {
        const testPos = { ...result, width: 10, height: 6 };
        gridState.canvases.canvas1.items.forEach((item) => {
          const hasCollision = checkCollision(testPos, item.layouts.desktop);
          expect(hasCollision).toBe(false);
        });
      }
    });

    it("should handle small components efficiently", () => {
      gridState.canvases.canvas1.items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Header",
          layouts: {
            desktop: { x: 2, y: 2, width: 20, height: 6, customized: true },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          zIndex: 1,
          config: {},
        },
      ];

      // Small component (2×2)
      const result = findFreeSpace("canvas1", 2, 2);

      expect(result).not.toBeNull();
      if (result) {
        // Should find space easily (many options available)
        const testPos = { ...result, width: 2, height: 2 };
        const hasCollision = checkCollision(
          testPos,
          gridState.canvases.canvas1.items[0].layouts.desktop,
        );
        expect(hasCollision).toBe(false);
      }
    });
  });
});
