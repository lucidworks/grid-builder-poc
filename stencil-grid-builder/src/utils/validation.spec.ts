/**
 * Validation Utility Tests
 * ========================
 *
 * Comprehensive test coverage for input validation functions.
 * Tests cover valid inputs, boundary conditions, and invalid data.
 */

import {
  validateLayout,
  validateGridItem,
  validateItemUpdates,
} from "./validation";

describe("validation utilities", () => {
  describe("validateLayout", () => {
    it("should validate a valid desktop layout", () => {
      const layout = { x: 10, y: 5, width: 20, height: 8 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate a valid mobile layout", () => {
      const layout = { x: 0, y: 0, width: 50, height: 10 };
      const result = validateLayout(layout, "mobile");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject missing layout", () => {
      const result = validateLayout(null, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "desktop layout is missing or undefined",
      );
    });

    it("should reject layout with missing properties", () => {
      const layout = { x: 10, y: 5 }; // Missing width and height
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("width"))).toBe(true);
      expect(result.errors.some((e) => e.includes("height"))).toBe(true);
    });

    it("should reject negative x coordinate", () => {
      const layout = { x: -5, y: 0, width: 20, height: 8 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "desktop layout.x must be >= 0, got: -5",
      );
    });

    it("should reject negative y coordinate", () => {
      const layout = { x: 0, y: -10, width: 20, height: 8 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "desktop layout.y must be >= 0, got: -10",
      );
    });

    it("should reject width below minimum (1)", () => {
      const layout = { x: 0, y: 0, width: 0, height: 8 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "desktop layout.width must be between 1-50, got: 0",
      );
    });

    it("should reject width above maximum (50)", () => {
      const layout = { x: 0, y: 0, width: 100, height: 8 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "desktop layout.width must be between 1-50, got: 100",
      );
    });

    it("should reject height below minimum (1)", () => {
      const layout = { x: 0, y: 0, width: 20, height: 0 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "desktop layout.height must be between 1-100, got: 0",
      );
    });

    it("should reject height above maximum (100)", () => {
      const layout = { x: 0, y: 0, width: 20, height: 150 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "desktop layout.height must be between 1-100, got: 150",
      );
    });

    it("should reject non-numeric properties", () => {
      const layout = { x: "10", y: 5, width: 20, height: 8 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("layout.x"))).toBe(true);
    });

    it("should reject Infinity values", () => {
      const layout = { x: Infinity, y: 5, width: 20, height: 8 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("finite number"))).toBe(
        true,
      );
    });

    it("should reject NaN values", () => {
      const layout = { x: 10, y: NaN, width: 20, height: 8 };
      const result = validateLayout(layout, "desktop");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("layout.y"))).toBe(true);
    });
  });

  describe("validateGridItem", () => {
    const validItem = {
      id: "item-1",
      canvasId: "canvas1",
      type: "header",
      zIndex: 1,
      layouts: {
        desktop: { x: 10, y: 5, width: 20, height: 8 },
        mobile: { x: 0, y: 0, width: 50, height: 8, customized: false },
      },
      config: {},
    };

    it("should validate a complete valid item", () => {
      const result = validateGridItem(validItem);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject null item", () => {
      const result = validateGridItem(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Item is null or undefined");
    });

    it("should reject undefined item", () => {
      const result = validateGridItem(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Item is null or undefined");
    });

    it("should reject item with empty id", () => {
      const item = { ...validItem, id: "" };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Item.id"))).toBe(true);
    });

    it("should reject item with empty canvasId", () => {
      const item = { ...validItem, canvasId: "   " };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Item.canvasId"))).toBe(
        true,
      );
    });

    it("should reject item with empty type", () => {
      const item = { ...validItem, type: "" };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Item.type"))).toBe(true);
    });

    it("should reject item with non-numeric zIndex", () => {
      const item = { ...validItem, zIndex: "1" };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Item.zIndex"))).toBe(true);
    });

    it("should reject item with Infinity zIndex", () => {
      const item = { ...validItem, zIndex: Infinity };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Item.zIndex"))).toBe(true);
    });

    it("should reject item with missing layouts", () => {
      const item = { ...validItem, layouts: null };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Item.layouts must be an object");
    });

    it("should reject item with invalid desktop layout", () => {
      const item = {
        ...validItem,
        layouts: {
          desktop: { x: -10, y: 5, width: 20, height: 8 },
          mobile: { x: 0, y: 0, width: 50, height: 8 },
        },
      };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("desktop"))).toBe(true);
    });

    it("should reject item with invalid mobile layout", () => {
      const item = {
        ...validItem,
        layouts: {
          desktop: { x: 10, y: 5, width: 20, height: 8 },
          mobile: { x: 0, y: 0, width: 100, height: 8 }, // width too large
        },
      };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("mobile"))).toBe(true);
    });

    it("should validate item with no mobile layout", () => {
      const item = {
        ...validItem,
        layouts: {
          desktop: { x: 10, y: 5, width: 20, height: 8 },
        },
      };
      const result = validateGridItem(item);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should collect multiple errors", () => {
      const item = {
        id: "",
        canvasId: "",
        type: "",
        zIndex: NaN,
        layouts: {
          desktop: { x: -5, y: -10, width: 0, height: 0 },
        },
      };
      const result = validateGridItem(item);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(8); // Multiple errors
    });
  });

  describe("validateItemUpdates", () => {
    it("should validate valid updates object", () => {
      const updates = {
        layouts: {
          desktop: { x: 15, y: 10, width: 25, height: 10 },
        },
      };
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate updates with config", () => {
      const updates = {
        config: { title: "New Title", color: "#ff0000" },
      };
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate updates with zIndex", () => {
      const updates = { zIndex: 5 };
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject null updates", () => {
      const result = validateItemUpdates(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Updates must be an object");
    });

    it("should reject non-object updates", () => {
      const result = validateItemUpdates("invalid");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Updates must be an object");
    });

    it("should reject non-object layouts", () => {
      const updates = { layouts: "invalid" };
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Updates.layouts must be an object");
    });

    it("should reject invalid desktop layout in updates", () => {
      const updates = {
        layouts: {
          desktop: { x: -5, y: 0, width: 20, height: 8 },
        },
      };
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("desktop"))).toBe(true);
    });

    it("should reject invalid mobile layout in updates", () => {
      const updates = {
        layouts: {
          mobile: { x: 0, y: 0, width: 100, height: 8 },
        },
      };
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("mobile"))).toBe(true);
    });

    it("should reject non-numeric zIndex", () => {
      const updates = { zIndex: "5" };
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Updates.zIndex"))).toBe(
        true,
      );
    });

    it("should reject non-object config", () => {
      const updates = { config: "invalid" };
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Updates.config"))).toBe(
        true,
      );
    });

    it("should allow empty updates object", () => {
      const updates = {};
      const result = validateItemUpdates(updates);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
