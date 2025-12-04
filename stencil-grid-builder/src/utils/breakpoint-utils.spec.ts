/**
 * Breakpoint Utilities - Unit Tests
 * ==================================
 *
 * Comprehensive test suite for multi-breakpoint responsive utilities.
 * Tests mobile-first viewport detection, layout inheritance, auto-stacking,
 * and layout initialization logic.
 */

import {
  getViewportForWidth,
  getEffectiveLayout,
  shouldAutoStack,
  calculateAutoStackLayout,
  initializeLayouts,
} from "./breakpoint-utils";
import {
  BreakpointConfig,
  GridItem,
  LayoutConfig,
} from "../services/state-manager";

describe("Breakpoint Utilities", () => {
  // ==========================================
  // Test Data - Breakpoint Configurations
  // ==========================================

  const BREAKPOINTS_2: BreakpointConfig = {
    mobile: {
      minWidth: 0,
      layoutMode: "stack",
    },
    desktop: {
      minWidth: 768,
      layoutMode: "manual",
    },
  };

  const BREAKPOINTS_3: BreakpointConfig = {
    mobile: {
      minWidth: 0,
      layoutMode: "stack",
    },
    tablet: {
      minWidth: 768,
      layoutMode: "inherit",
      inheritFrom: "desktop",
    },
    desktop: {
      minWidth: 1024,
      layoutMode: "manual",
    },
  };

  const BREAKPOINTS_5: BreakpointConfig = {
    xs: {
      minWidth: 0,
      layoutMode: "stack",
    },
    sm: {
      minWidth: 576,
      layoutMode: "stack",
    },
    md: {
      minWidth: 768,
      layoutMode: "inherit",
      inheritFrom: "xl",
    },
    lg: {
      minWidth: 992,
      layoutMode: "inherit",
      inheritFrom: "xl",
    },
    xl: {
      minWidth: 1200,
      layoutMode: "manual",
    },
  };

  // ==========================================
  // getViewportForWidth Tests
  // ==========================================

  describe("getViewportForWidth", () => {
    it("should return largest matching viewport for 2 breakpoints (mobile)", () => {
      const result = getViewportForWidth(400, BREAKPOINTS_2);
      expect(result).toBe("mobile");
    });

    it("should return largest matching viewport for 2 breakpoints (desktop)", () => {
      const result = getViewportForWidth(800, BREAKPOINTS_2);
      expect(result).toBe("desktop");
    });

    it("should return largest matching viewport for 2 breakpoints (exact boundary)", () => {
      const result = getViewportForWidth(768, BREAKPOINTS_2);
      expect(result).toBe("desktop"); // 768 >= 768 matches desktop
    });

    it("should return largest matching viewport for 3 breakpoints (mobile)", () => {
      const result = getViewportForWidth(500, BREAKPOINTS_3);
      expect(result).toBe("mobile");
    });

    it("should return largest matching viewport for 3 breakpoints (tablet)", () => {
      const result = getViewportForWidth(900, BREAKPOINTS_3);
      expect(result).toBe("tablet");
    });

    it("should return largest matching viewport for 3 breakpoints (desktop)", () => {
      const result = getViewportForWidth(1200, BREAKPOINTS_3);
      expect(result).toBe("desktop");
    });

    it("should return largest matching viewport for 5 breakpoints (xs)", () => {
      const result = getViewportForWidth(400, BREAKPOINTS_5);
      expect(result).toBe("xs");
    });

    it("should return largest matching viewport for 5 breakpoints (sm)", () => {
      const result = getViewportForWidth(650, BREAKPOINTS_5);
      expect(result).toBe("sm");
    });

    it("should return largest matching viewport for 5 breakpoints (md)", () => {
      const result = getViewportForWidth(850, BREAKPOINTS_5);
      expect(result).toBe("md");
    });

    it("should return largest matching viewport for 5 breakpoints (lg)", () => {
      const result = getViewportForWidth(1100, BREAKPOINTS_5);
      expect(result).toBe("lg");
    });

    it("should return largest matching viewport for 5 breakpoints (xl)", () => {
      const result = getViewportForWidth(1400, BREAKPOINTS_5);
      expect(result).toBe("xl");
    });

    it("should handle width exactly at breakpoint boundary", () => {
      const result = getViewportForWidth(1200, BREAKPOINTS_5);
      expect(result).toBe("xl"); // 1200 >= 1200 matches xl
    });

    it("should handle empty breakpoint config gracefully", () => {
      // Edge case: empty config (should never happen in practice)
      const emptyConfig: BreakpointConfig = {};
      expect(() => getViewportForWidth(1000, emptyConfig)).toThrow();
    });

    it("should prefer larger viewport when multiple match", () => {
      // At 800px, both mobile (0) and tablet (768) match
      // Should return tablet as it has larger minWidth
      const result = getViewportForWidth(800, BREAKPOINTS_3);
      expect(result).toBe("tablet");
    });
  });

  // ==========================================
  // getEffectiveLayout Tests
  // ==========================================

  describe("getEffectiveLayout", () => {
    const createTestItem = (
      layouts: Record<string, Partial<LayoutConfig>>,
    ): GridItem => {
      const fullLayouts: Record<string, LayoutConfig> = {};

      // Fill in defaults for each provided layout
      Object.keys(layouts).forEach((key) => {
        fullLayouts[key] = {
          x: layouts[key].x ?? null,
          y: layouts[key].y ?? null,
          width: layouts[key].width ?? null,
          height: layouts[key].height ?? null,
          customized: layouts[key].customized ?? false,
        };
      });

      return {
        id: "test-item",
        canvasId: "canvas1",
        type: "test",
        name: "Test",
        zIndex: 1,
        layouts: fullLayouts,
        config: {},
      };
    };

    it("should return customized layout directly (Priority 1)", () => {
      const item = createTestItem({
        desktop: { x: 10, y: 20, width: 30, height: 40, customized: true },
      });

      const result = getEffectiveLayout(item, "desktop", BREAKPOINTS_2);

      expect(result).toEqual({
        layout: {
          x: 10,
          y: 20,
          width: 30,
          height: 40,
          customized: true,
        },
        sourceBreakpoint: "desktop",
      });
    });

    it("should follow inherit chain to desktop (Priority 2)", () => {
      const item = createTestItem({
        mobile: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        tablet: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        desktop: { x: 15, y: 25, width: 35, height: 45, customized: true },
      });

      // Tablet inherits from desktop
      const result = getEffectiveLayout(item, "tablet", BREAKPOINTS_3);

      expect(result).toEqual({
        layout: {
          x: 15,
          y: 25,
          width: 35,
          height: 45,
          customized: true,
        },
        sourceBreakpoint: "desktop",
      });
    });

    it("should use nearest breakpoint by width when no inherit (Priority 3)", () => {
      const item = createTestItem({
        xs: { x: 1, y: 1, width: 10, height: 10, customized: true },
        sm: { x: null, y: null, width: null, height: null, customized: false },
        md: { x: null, y: null, width: null, height: null, customized: false },
        lg: { x: null, y: null, width: null, height: null, customized: false },
        xl: { x: 50, y: 50, width: 50, height: 50, customized: true },
      });

      // Breakpoints without inherit chain - should use nearest by width
      // For sm (576), nearest customized is xs (0) since it's closer than xl (1200)
      const breakpointsNoInherit: BreakpointConfig = {
        xs: { minWidth: 0, layoutMode: "manual" },
        sm: { minWidth: 576, layoutMode: "manual" },
        md: { minWidth: 768, layoutMode: "manual" },
        lg: { minWidth: 992, layoutMode: "manual" },
        xl: { minWidth: 1200, layoutMode: "manual" },
      };

      const result = getEffectiveLayout(item, "sm", breakpointsNoInherit);

      expect(result).toEqual({
        layout: {
          x: 1,
          y: 1,
          width: 10,
          height: 10,
          customized: true,
        },
        sourceBreakpoint: "xs",
      });
    });

    it("should fallback to largest manual breakpoint (Priority 4)", () => {
      const item = createTestItem({
        mobile: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        tablet: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        desktop: { x: 20, y: 30, width: 40, height: 50, customized: true },
      });

      // Mobile has no customized layout and no inherit chain
      // Should fallback to largest manual breakpoint (desktop)
      const result = getEffectiveLayout(item, "mobile", BREAKPOINTS_3);

      expect(result).toEqual({
        layout: {
          x: 20,
          y: 30,
          width: 40,
          height: 50,
          customized: true,
        },
        sourceBreakpoint: "desktop",
      });
    });

    it("should handle multi-level inherit chain (md → xl)", () => {
      const item = createTestItem({
        xs: { x: null, y: null, width: null, height: null, customized: false },
        sm: { x: null, y: null, width: null, height: null, customized: false },
        md: { x: null, y: null, width: null, height: null, customized: false },
        lg: { x: null, y: null, width: null, height: null, customized: false },
        xl: { x: 100, y: 100, width: 100, height: 100, customized: true },
      });

      // md inherits from xl (configured in BREAKPOINTS_5)
      const result = getEffectiveLayout(item, "md", BREAKPOINTS_5);

      expect(result).toEqual({
        layout: {
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          customized: true,
        },
        sourceBreakpoint: "xl",
      });
    });

    it("should return null layout when no valid layout found", () => {
      const item = createTestItem({
        mobile: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
      });

      const singleBreakpoint: BreakpointConfig = {
        mobile: { minWidth: 0, layoutMode: "stack" },
      };

      const result = getEffectiveLayout(item, "mobile", singleBreakpoint);

      expect(result).toEqual({
        layout: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        sourceBreakpoint: "mobile",
      });
    });

    it("should throw stack overflow with circular inherit chain (edge case)", () => {
      const item = createTestItem({
        a: { x: null, y: null, width: null, height: null, customized: false },
        b: { x: null, y: null, width: null, height: null, customized: false },
      });

      // Create circular inherit: a → b → a
      const circularConfig: BreakpointConfig = {
        a: { minWidth: 0, layoutMode: "inherit", inheritFrom: "b" },
        b: { minWidth: 768, layoutMode: "inherit", inheritFrom: "a" },
      };

      // Current implementation doesn't protect against circular inheritance
      // This is an edge case that shouldn't occur with proper configuration
      expect(() => getEffectiveLayout(item, "a", circularConfig)).toThrow();
    });

    describe("Inheritance with customized flag", () => {
      it("should inherit from desktop when tablet is NOT customized", () => {
        const item = createTestItem({
          desktop: { x: 10, y: 20, width: 30, height: 40, customized: true },
          tablet: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        });

        // Tablet should inherit desktop layout (customized: false)
        const result = getEffectiveLayout(item, "tablet", BREAKPOINTS_3);

        expect(result).toEqual({
          layout: {
            x: 10,
            y: 20,
            width: 30,
            height: 40,
            customized: true,
          },
          sourceBreakpoint: "desktop",
        });
      });

      it("should NOT inherit from desktop when tablet IS customized", () => {
        const item = createTestItem({
          desktop: { x: 10, y: 20, width: 30, height: 40, customized: true },
          tablet: { x: 5, y: 15, width: 25, height: 35, customized: true },
        });

        // Tablet should use its own layout (customized: true)
        const result = getEffectiveLayout(item, "tablet", BREAKPOINTS_3);

        expect(result).toEqual({
          layout: {
            x: 5,
            y: 15,
            width: 25,
            height: 35,
            customized: true,
          },
          sourceBreakpoint: "tablet",
        });
      });

      it("should inherit updated desktop layout when tablet is NOT customized", () => {
        // Simulate desktop layout change (user moved item on desktop)
        const itemBeforeChange = createTestItem({
          desktop: { x: 10, y: 20, width: 30, height: 40, customized: true },
          tablet: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        });

        const itemAfterChange = createTestItem({
          desktop: { x: 50, y: 60, width: 70, height: 80, customized: true },
          tablet: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        });

        // Before change: tablet inherits old desktop layout
        const resultBefore = getEffectiveLayout(
          itemBeforeChange,
          "tablet",
          BREAKPOINTS_3,
        );
        expect(resultBefore.layout).toEqual({
          x: 10,
          y: 20,
          width: 30,
          height: 40,
          customized: true,
        });

        // After change: tablet inherits NEW desktop layout
        const resultAfter = getEffectiveLayout(
          itemAfterChange,
          "tablet",
          BREAKPOINTS_3,
        );
        expect(resultAfter.layout).toEqual({
          x: 50,
          y: 60,
          width: 70,
          height: 80,
          customized: true,
        });
      });

      it("should NOT inherit updated desktop layout when tablet IS customized", () => {
        // Simulate desktop layout change (user moved item on desktop)
        const itemBeforeChange = createTestItem({
          desktop: { x: 10, y: 20, width: 30, height: 40, customized: true },
          tablet: { x: 5, y: 15, width: 25, height: 35, customized: true },
        });

        const itemAfterChange = createTestItem({
          desktop: { x: 50, y: 60, width: 70, height: 80, customized: true },
          tablet: { x: 5, y: 15, width: 25, height: 35, customized: true },
        });

        // Before change: tablet uses its own layout
        const resultBefore = getEffectiveLayout(
          itemBeforeChange,
          "tablet",
          BREAKPOINTS_3,
        );
        expect(resultBefore.layout).toEqual({
          x: 5,
          y: 15,
          width: 25,
          height: 35,
          customized: true,
        });

        // After desktop change: tablet STILL uses its own layout (unchanged)
        const resultAfter = getEffectiveLayout(
          itemAfterChange,
          "tablet",
          BREAKPOINTS_3,
        );
        expect(resultAfter.layout).toEqual({
          x: 5,
          y: 15,
          width: 25,
          height: 35,
          customized: true,
        });
      });

      it("should inherit from xl when md/lg are NOT customized (5-breakpoint)", () => {
        const item = createTestItem({
          xs: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
          sm: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
          md: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
          lg: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
          xl: { x: 100, y: 200, width: 300, height: 400, customized: true },
        });

        // Both md and lg inherit from xl
        const mdResult = getEffectiveLayout(item, "md", BREAKPOINTS_5);
        const lgResult = getEffectiveLayout(item, "lg", BREAKPOINTS_5);

        expect(mdResult).toEqual({
          layout: {
            x: 100,
            y: 200,
            width: 300,
            height: 400,
            customized: true,
          },
          sourceBreakpoint: "xl",
        });

        expect(lgResult).toEqual({
          layout: {
            x: 100,
            y: 200,
            width: 300,
            height: 400,
            customized: true,
          },
          sourceBreakpoint: "xl",
        });
      });

      it("should use own layout when md is customized but lg is not (5-breakpoint)", () => {
        const item = createTestItem({
          xs: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
          sm: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
          md: { x: 50, y: 60, width: 70, height: 80, customized: true },
          lg: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
          xl: { x: 100, y: 200, width: 300, height: 400, customized: true },
        });

        // md uses its own customized layout
        const mdResult = getEffectiveLayout(item, "md", BREAKPOINTS_5);
        expect(mdResult).toEqual({
          layout: {
            x: 50,
            y: 60,
            width: 70,
            height: 80,
            customized: true,
          },
          sourceBreakpoint: "md",
        });

        // lg still inherits from xl (not from md)
        const lgResult = getEffectiveLayout(item, "lg", BREAKPOINTS_5);
        expect(lgResult).toEqual({
          layout: {
            x: 100,
            y: 200,
            width: 300,
            height: 400,
            customized: true,
          },
          sourceBreakpoint: "xl",
        });
      });

      it("should handle user customizing inherited breakpoint (transition from inherited to independent)", () => {
        // BEFORE: User drags item on tablet → becomes customized
        const beforeCustomization = createTestItem({
          desktop: { x: 10, y: 20, width: 30, height: 40, customized: true },
          tablet: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        });

        // Tablet inherits desktop
        const beforeResult = getEffectiveLayout(
          beforeCustomization,
          "tablet",
          BREAKPOINTS_3,
        );
        expect(beforeResult.sourceBreakpoint).toBe("desktop");

        // AFTER: User manually positions tablet → customized: true
        const afterCustomization = createTestItem({
          desktop: { x: 10, y: 20, width: 30, height: 40, customized: true },
          tablet: { x: 5, y: 15, width: 25, height: 35, customized: true },
        });

        // Tablet now uses its own layout
        const afterResult = getEffectiveLayout(
          afterCustomization,
          "tablet",
          BREAKPOINTS_3,
        );
        expect(afterResult).toEqual({
          layout: {
            x: 5,
            y: 15,
            width: 25,
            height: 35,
            customized: true,
          },
          sourceBreakpoint: "tablet",
        });
      });
    });
  });

  // ==========================================
  // shouldAutoStack Tests
  // ==========================================

  describe("shouldAutoStack", () => {
    it("should return true for stack mode", () => {
      const result = shouldAutoStack("mobile", BREAKPOINTS_2);
      expect(result).toBe(true);
    });

    it("should return false for manual mode", () => {
      const result = shouldAutoStack("desktop", BREAKPOINTS_2);
      expect(result).toBe(false);
    });

    it("should return false for inherit mode (direct check)", () => {
      // Tablet has layoutMode: 'inherit', not 'stack'
      const result = shouldAutoStack("tablet", BREAKPOINTS_3);
      expect(result).toBe(false);
    });

    it("should return true for xs (stack)", () => {
      const result = shouldAutoStack("xs", BREAKPOINTS_5);
      expect(result).toBe(true);
    });

    it("should return true for sm (stack)", () => {
      const result = shouldAutoStack("sm", BREAKPOINTS_5);
      expect(result).toBe(true);
    });

    it("should return false for md (inherit, not stack)", () => {
      const result = shouldAutoStack("md", BREAKPOINTS_5);
      expect(result).toBe(false);
    });

    it("should return false for xl (manual)", () => {
      const result = shouldAutoStack("xl", BREAKPOINTS_5);
      expect(result).toBe(false);
    });

    it("should return false for undefined breakpoint", () => {
      const result = shouldAutoStack("nonexistent", BREAKPOINTS_2);
      expect(result).toBe(false);
    });

    it("should return false when layoutMode is undefined (defaults to manual)", () => {
      const noModeConfig: BreakpointConfig = {
        desktop: {
          minWidth: 768,
          // layoutMode omitted, should default to manual (not stack)
        },
      };

      const result = shouldAutoStack("desktop", noModeConfig);
      expect(result).toBe(false);
    });
  });

  // ==========================================
  // calculateAutoStackLayout Tests
  // ==========================================

  describe("calculateAutoStackLayout", () => {
    const createItemWithLayout = (
      id: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ): GridItem => ({
      id,
      canvasId: "canvas1",
      type: "test",
      name: "Test",
      zIndex: 1,
      layouts: {
        desktop: { x, y, width, height, customized: true },
        mobile: { x: 0, y: 0, width: 50, height, customized: false },
      },
      config: {},
    });

    it("should return y=0 for first item (index 0)", () => {
      const items = [
        createItemWithLayout("item-1", 0, 0, 20, 10),
        createItemWithLayout("item-2", 0, 10, 20, 8),
      ];

      const result = calculateAutoStackLayout(items[0], items, "desktop");

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 10,
        customized: false,
      });
    });

    it("should calculate cumulative y for second item", () => {
      const items = [
        createItemWithLayout("item-1", 0, 0, 20, 10), // height=10
        createItemWithLayout("item-2", 0, 10, 20, 8),
      ];

      const result = calculateAutoStackLayout(items[1], items, "desktop");

      expect(result).toEqual({
        x: 0,
        y: 10, // Previous item height
        width: 50,
        height: 8,
        customized: false,
      });
    });

    it("should calculate cumulative y for third item", () => {
      const items = [
        createItemWithLayout("item-1", 0, 0, 20, 10), // height=10
        createItemWithLayout("item-2", 0, 10, 20, 8), // height=8
        createItemWithLayout("item-3", 0, 20, 20, 6),
      ];

      const result = calculateAutoStackLayout(items[2], items, "desktop");

      expect(result).toEqual({
        x: 0,
        y: 18, // 10 + 8
        width: 50,
        height: 6,
        customized: false,
      });
    });

    it("should handle items with varying heights", () => {
      const items = [
        createItemWithLayout("item-1", 0, 0, 20, 5),
        createItemWithLayout("item-2", 0, 5, 20, 12),
        createItemWithLayout("item-3", 0, 17, 20, 3),
        createItemWithLayout("item-4", 0, 20, 20, 15),
      ];

      const result = calculateAutoStackLayout(items[3], items, "desktop");

      expect(result).toEqual({
        x: 0,
        y: 20, // 5 + 12 + 3
        width: 50,
        height: 15,
        customized: false,
      });
    });

    it("should use default height=6 when layout height is null", () => {
      const itemWithNullHeight: GridItem = {
        id: "item-1",
        canvasId: "canvas1",
        type: "test",
        name: "Test",
        zIndex: 1,
        layouts: {
          desktop: { x: 0, y: 0, width: 20, height: null, customized: true },
          mobile: { x: 0, y: 0, width: 50, height: null, customized: false },
        },
        config: {},
      };

      const items = [itemWithNullHeight];

      const result = calculateAutoStackLayout(items[0], items, "desktop");

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 6, // Default fallback height (from sourceBreakpoint desktop which is also null)
        customized: false,
      });
    });

    it("should sort items by visual order (y-position, then z-index) in source breakpoint", () => {
      // Items arranged out of visual order in array
      const items: GridItem[] = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "test",
          name: "Test",
          zIndex: 2,
          layouts: {
            desktop: { x: 0, y: 20, width: 20, height: 10, customized: true }, // Visual position: 3rd (y=20, z=2)
            mobile: { x: 0, y: 0, width: 50, height: 10, customized: false },
          },
          config: {},
        },
        {
          id: "item-2",
          canvasId: "canvas1",
          type: "test",
          name: "Test",
          zIndex: 1,
          layouts: {
            desktop: { x: 0, y: 0, width: 20, height: 15, customized: true }, // Visual position: 1st (y=0, z=1)
            mobile: { x: 0, y: 0, width: 50, height: 15, customized: false },
          },
          config: {},
        },
        {
          id: "item-3",
          canvasId: "canvas1",
          type: "test",
          name: "Test",
          zIndex: 1,
          layouts: {
            desktop: { x: 0, y: 20, width: 20, height: 8, customized: true }, // Visual position: 2nd (y=20, z=1)
            mobile: { x: 0, y: 0, width: 50, height: 8, customized: false },
          },
          config: {},
        },
      ];

      // Visual order should be: item-2 (y=0), item-3 (y=20, z=1), item-1 (y=20, z=2)
      // Stack heights: item-2: y=0, item-3: y=15, item-1: y=23

      const result1 = calculateAutoStackLayout(items[0], items, "desktop");
      expect(result1).toEqual({
        x: 0,
        y: 23, // item-2 (15) + item-3 (8)
        width: 50,
        height: 10,
        customized: false,
      });

      const result2 = calculateAutoStackLayout(items[1], items, "desktop");
      expect(result2).toEqual({
        x: 0,
        y: 0, // First in visual order
        width: 50,
        height: 15,
        customized: false,
      });

      const result3 = calculateAutoStackLayout(items[2], items, "desktop");
      expect(result3).toEqual({
        x: 0,
        y: 15, // item-2 (15)
        width: 50,
        height: 8,
        customized: false,
      });
    });
  });

  // ==========================================
  // initializeLayouts Tests
  // ==========================================

  describe("initializeLayouts", () => {
    const baseLayout = {
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      customized: true,
    };

    it("should create layouts for all breakpoints in config", () => {
      const result = initializeLayouts(BREAKPOINTS_2, baseLayout);

      const keys = Object.keys(result).sort();
      expect(keys).toEqual(["desktop", "mobile"]);
      expect(result).toHaveProperty("desktop");
      expect(result).toHaveProperty("mobile");
    });

    it("should set customized=true for manual breakpoints", () => {
      const result = initializeLayouts(BREAKPOINTS_2, baseLayout);

      expect(result.desktop).toEqual({
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        customized: true,
      });
    });

    it("should set customized=false for stack breakpoints", () => {
      const result = initializeLayouts(BREAKPOINTS_2, baseLayout);

      expect(result.mobile).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 40, // Preserves height from baseLayout
        customized: false,
      });
    });

    it("should set customized=false for inherit breakpoints", () => {
      const result = initializeLayouts(BREAKPOINTS_3, baseLayout);

      expect(result.tablet).toEqual({
        x: null,
        y: null,
        width: null,
        height: null,
        customized: false,
      });
    });

    it("should create layouts for all 5 breakpoints", () => {
      const result = initializeLayouts(BREAKPOINTS_5, baseLayout);

      const keys = Object.keys(result).sort();
      expect(keys).toEqual(["lg", "md", "sm", "xl", "xs"]);
      expect(result).toHaveProperty("xs");
      expect(result).toHaveProperty("sm");
      expect(result).toHaveProperty("md");
      expect(result).toHaveProperty("lg");
      expect(result).toHaveProperty("xl");
    });

    it("should set xl as manual (customized=true)", () => {
      const result = initializeLayouts(BREAKPOINTS_5, baseLayout);

      expect(result.xl).toEqual({
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        customized: true,
      });
    });

    it("should set xs and sm as stack (customized=false, x=0, y=0, width=50)", () => {
      const result = initializeLayouts(BREAKPOINTS_5, baseLayout);

      expect(result.xs).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 40,
        customized: false,
      });

      expect(result.sm).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 40,
        customized: false,
      });
    });

    it("should set md and lg as inherit (customized=false, all null)", () => {
      const result = initializeLayouts(BREAKPOINTS_5, baseLayout);

      expect(result.md).toEqual({
        x: null,
        y: null,
        width: null,
        height: null,
        customized: false,
      });

      expect(result.lg).toEqual({
        x: null,
        y: null,
        width: null,
        height: null,
        customized: false,
      });
    });

    it("should handle breakpoints without layoutMode (defaults to manual)", () => {
      const noModeConfig: BreakpointConfig = {
        desktop: {
          minWidth: 768,
          // layoutMode omitted
        },
      };

      const result = initializeLayouts(noModeConfig, baseLayout);

      expect(result.desktop).toEqual({
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        customized: true, // Defaults to manual behavior
      });
    });

    it("should preserve baseLayout values for manual breakpoints", () => {
      const customBase = {
        x: 5,
        y: 15,
        width: 25,
        height: 35,
        customized: true,
      };

      const result = initializeLayouts(BREAKPOINTS_2, customBase);

      expect(result.desktop).toEqual(customBase);
    });

    it("should always use x=0, y=0, width=50 for stack breakpoints regardless of baseLayout", () => {
      const customBase = {
        x: 999,
        y: 888,
        width: 777,
        height: 35,
        customized: true,
      };

      const result = initializeLayouts(BREAKPOINTS_2, customBase);

      expect(result.mobile).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 35, // Only height is preserved
        customized: false,
      });
    });
  });
});
