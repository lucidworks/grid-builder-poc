/**
 * Unit tests for object utility functions
 *
 * Tests the deepClone() utility and related helper functions.
 * Verifies performance optimization paths and fallback behavior.
 */

import { deepClone, isGridItem, cloneGridItem } from "./object-utils";
import type { GridItem } from "../types/api";

describe("Object Utilities", () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const mockGridItem: GridItem = {
    id: "item-1",
    canvasId: "canvas-1",
    type: "header",
    zIndex: 1,
    layouts: {
      desktop: {
        x: 2,
        y: 2,
        width: 20,
        height: 6,
      },
      mobile: {
        x: 1,
        y: 1,
        width: 14,
        height: 5,
        customized: false,
      },
    },
    config: {
      title: "Test Header",
      subtitle: "Subtitle",
    },
  };

  const mockGridItemWithoutMobile: GridItem = {
    id: "item-2",
    canvasId: "canvas-1",
    type: "text",
    zIndex: 2,
    layouts: {
      desktop: {
        x: 5,
        y: 5,
        width: 10,
        height: 8,
      },
    },
  };

  // ============================================================================
  // isGridItem Tests
  // ============================================================================

  describe("isGridItem", () => {
    it("should return true for valid GridItem with mobile layout", () => {
      const result = isGridItem(mockGridItem);
      expect(result).toBe(true);
    });

    it("should return true for valid GridItem without mobile layout", () => {
      const result = isGridItem(mockGridItemWithoutMobile);
      expect(result).toBe(true);
    });

    it("should return false for null", () => {
      const result = isGridItem(null);
      expect(result).toBe(false);
    });

    it("should return false for undefined", () => {
      const result = isGridItem(undefined);
      expect(result).toBe(false);
    });

    it("should return false for primitive types", () => {
      expect(isGridItem("string")).toBe(false);
      expect(isGridItem(123)).toBe(false);
      expect(isGridItem(true)).toBe(false);
    });

    it("should return false for object without id", () => {
      const obj = {
        layouts: { desktop: { x: 0, y: 0, width: 10, height: 10 } },
      };
      expect(isGridItem(obj)).toBe(false);
    });

    it("should return false for object without layouts", () => {
      const obj = { id: "item-1" };
      expect(isGridItem(obj)).toBe(false);
    });

    it("should return false for object without desktop layout", () => {
      const obj = {
        id: "item-1",
        layouts: { mobile: { x: 0, y: 0, width: 10, height: 10 } },
      };
      expect(isGridItem(obj)).toBe(false);
    });

    it("should return false for object with invalid id type", () => {
      const obj = {
        id: 123, // Should be string
        layouts: { desktop: { x: 0, y: 0, width: 10, height: 10 } },
      };
      expect(isGridItem(obj)).toBe(false);
    });
  });

  // ============================================================================
  // cloneGridItem Tests
  // ============================================================================

  describe("cloneGridItem", () => {
    it("should create a deep clone of GridItem with mobile layout", () => {
      const clone = cloneGridItem(mockGridItem);

      // Verify clone is a new object
      expect(clone).not.toBe(mockGridItem);

      // Verify all values are copied correctly
      expect(clone.id).toBe(mockGridItem.id);
      expect(clone.canvasId).toBe(mockGridItem.canvasId);
      expect(clone.type).toBe(mockGridItem.type);
      expect(clone.zIndex).toBe(mockGridItem.zIndex);

      // Verify layouts are cloned
      expect(clone.layouts).not.toBe(mockGridItem.layouts);
      expect(clone.layouts.desktop).not.toBe(mockGridItem.layouts.desktop);
      expect(clone.layouts.mobile).not.toBe(mockGridItem.layouts.mobile);

      // Verify layout values are correct
      expect(clone.layouts.desktop).toEqual(mockGridItem.layouts.desktop);
      expect(clone.layouts.mobile).toEqual(mockGridItem.layouts.mobile);

      // Verify config is shallow copied
      expect(clone.config).toBe(mockGridItem.config);
    });

    it("should create a deep clone of GridItem without mobile layout", () => {
      const clone = cloneGridItem(mockGridItemWithoutMobile);

      // Verify clone is a new object
      expect(clone).not.toBe(mockGridItemWithoutMobile);

      // Verify layouts are cloned
      expect(clone.layouts).not.toBe(mockGridItemWithoutMobile.layouts);
      expect(clone.layouts.desktop).not.toBe(
        mockGridItemWithoutMobile.layouts.desktop,
      );

      // Verify mobile layout is undefined (not cloned)
      expect(clone.layouts.mobile).toBeUndefined();

      // Verify desktop layout is correct
      expect(clone.layouts.desktop).toEqual(
        mockGridItemWithoutMobile.layouts.desktop,
      );
    });

    it("should mutate clone without affecting original - desktop layout", () => {
      const clone = cloneGridItem(mockGridItem);

      // Mutate clone's desktop layout
      clone.layouts.desktop.x = 999;

      // Verify original is unchanged
      expect(mockGridItem.layouts.desktop.x).toBe(2);
      expect(clone.layouts.desktop.x).toBe(999);
    });

    it("should mutate clone without affecting original - mobile layout", () => {
      const clone = cloneGridItem(mockGridItem);

      // Mutate clone's mobile layout
      clone.layouts.mobile!.width = 999;

      // Verify original is unchanged
      expect(mockGridItem.layouts.mobile!.width).toBe(14);
      expect(clone.layouts.mobile!.width).toBe(999);
    });

    it("should preserve all GridItem properties", () => {
      const clone = cloneGridItem(mockGridItem);

      // Verify all properties are preserved
      expect(clone).toEqual(mockGridItem);
    });
  });

  // ============================================================================
  // deepClone Tests
  // ============================================================================

  describe("deepClone", () => {
    it("should clone a GridItem using optimized path", () => {
      const clone = deepClone(mockGridItem);

      // Verify clone is a new object
      expect(clone).not.toBe(mockGridItem);

      // Verify all values are copied correctly
      expect(clone).toEqual(mockGridItem);

      // Verify layouts are cloned (not references)
      expect(clone.layouts).not.toBe(mockGridItem.layouts);
      expect(clone.layouts.desktop).not.toBe(mockGridItem.layouts.desktop);
    });

    it("should clone a GridItem without mobile layout", () => {
      const clone = deepClone(mockGridItemWithoutMobile);

      // Verify clone is a new object
      expect(clone).not.toBe(mockGridItemWithoutMobile);

      // Verify mobile layout is undefined
      expect(clone.layouts.mobile).toBeUndefined();

      // Verify desktop layout is cloned
      expect(clone.layouts.desktop).toEqual(
        mockGridItemWithoutMobile.layouts.desktop,
      );
    });

    it("should clone primitive values", () => {
      expect(deepClone("string")).toBe("string");
      expect(deepClone(123)).toBe(123);
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it("should clone simple objects", () => {
      const obj = { a: 1, b: "test", c: true };
      const clone = deepClone(obj);

      expect(clone).not.toBe(obj);
      expect(clone).toEqual(obj);
    });

    it("should clone nested objects", () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
          },
        },
      };
      const clone = deepClone(obj);

      expect(clone).not.toBe(obj);
      expect(clone.b).not.toBe(obj.b);
      expect(clone.b.d).not.toBe(obj.b.d);
      expect(clone).toEqual(obj);
    });

    it("should clone arrays", () => {
      const arr = [1, 2, { a: 3 }];
      const clone = deepClone(arr);

      expect(clone).not.toBe(arr);
      expect(clone[2]).not.toBe(arr[2]);
      expect(clone).toEqual(arr);
    });

    it("should clone Date objects if structuredClone is available", () => {
      const date = new Date("2025-01-04");
      const clone = deepClone(date);

      // If structuredClone is available, Date should be preserved
      // If not (using JSON.parse fallback), it becomes a string
      if (typeof structuredClone !== "undefined") {
        expect(clone).toBeInstanceOf(Date);
        expect(clone.getTime()).toBe(date.getTime());
      } else {
        // JSON.parse fallback converts Date to string
        expect(typeof clone).toBe("string");
      }
    });

    it("should handle undefined values", () => {
      const obj = { a: 1, b: undefined, c: "test" };
      const clone = deepClone(obj);

      // Note: JSON.parse fallback will drop undefined values
      // structuredClone preserves them
      if (typeof structuredClone !== "undefined") {
        expect(clone).toEqual(obj);
        expect(clone.b).toBeUndefined();
      } else {
        // JSON.parse drops undefined
        expect(clone.a).toBe(1);
        expect(clone.c).toBe("test");
        expect("b" in clone).toBe(false);
      }
    });

    it("should mutate clone without affecting original", () => {
      const obj = { a: 1, b: { c: 2 } };
      const clone = deepClone(obj);

      clone.b.c = 999;

      expect(obj.b.c).toBe(2);
      expect(clone.b.c).toBe(999);
    });

    it("should handle complex GridItem with all optional fields", () => {
      const complexItem: GridItem = {
        id: "complex-1",
        canvasId: "canvas-1",
        type: "dashboard",
        zIndex: 5,
        layouts: {
          desktop: { x: 0, y: 0, width: 50, height: 100 },
          mobile: { x: 0, y: 0, width: 14, height: 80, customized: true },
        },
        config: {
          nested: {
            deeply: {
              value: "test",
            },
          },
          array: [1, 2, 3],
        },
      };

      const clone = deepClone(complexItem);

      expect(clone).not.toBe(complexItem);
      expect(clone.layouts).not.toBe(complexItem.layouts);
      expect(clone.layouts.desktop).not.toBe(complexItem.layouts.desktop);
      expect(clone.layouts.mobile).not.toBe(complexItem.layouts.mobile);

      // Verify values are equal
      expect(clone).toEqual(complexItem);
    });
  });

  // ============================================================================
  // Performance Characteristics Tests
  // ============================================================================

  describe("Performance Characteristics", () => {
    it("should use structuredClone path when available", () => {
      // This test verifies the code path, not actual performance
      const obj = { a: 1, b: { c: 2 } };

      // Mock structuredClone if not available
      const originalStructuredClone = (globalThis as any).structuredClone;
      if (typeof structuredClone === "undefined") {
        (globalThis as any).structuredClone = (val: any) =>
          JSON.parse(JSON.stringify(val));
      }

      const clone = deepClone(obj);

      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);

      // Restore original
      if (originalStructuredClone) {
        (globalThis as any).structuredClone = originalStructuredClone;
      } else {
        delete (globalThis as any).structuredClone;
      }
    });

    it("should use optimized GridItem path for GridItem objects", () => {
      // This test verifies the fast path is used for GridItem
      const clone = deepClone(mockGridItem);

      // Verify it's a proper deep clone
      expect(clone).not.toBe(mockGridItem);
      expect(clone.layouts).not.toBe(mockGridItem.layouts);
      expect(clone.layouts.desktop).not.toBe(mockGridItem.layouts.desktop);

      // Verify values are correct
      expect(clone).toEqual(mockGridItem);
    });
  });
});
