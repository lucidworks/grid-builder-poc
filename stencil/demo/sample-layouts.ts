/**
 * Sample Layouts - Multi-Breakpoint Layout Utilities
 * ====================================================
 *
 * Helper functions for creating multi-breakpoint grid layouts for Storybook demos.
 * Provides predefined layouts showcasing different breakpoint configurations.
 *
 * ## Available Layouts
 *
 * 1. **Default (2 breakpoints)**: mobile + desktop (backwards compatible)
 * 2. **Three breakpoints**: mobile + tablet + desktop
 * 3. **Five breakpoints**: xs + sm + md + lg + xl (Bootstrap-style)
 *
 * ## Usage
 *
 * ```typescript
 * import { create3BreakpointLayout, BREAKPOINTS_3 } from './sample-layouts';
 *
 * const layout = create3BreakpointLayout();
 * <grid-builder
 *   breakpoints={BREAKPOINTS_3}
 *   initialState={{ canvases: { canvas1: { items: layout } } }}
 * />
 * ```
 * @module sample-layouts
 */

import { BreakpointConfig } from "../services/state-manager";

/**
 * Default 2-breakpoint configuration (backwards compatible)
 *
 * **Mobile-first approach**: mobile stacks vertically, desktop manual positioning
 */
export const BREAKPOINTS_2: BreakpointConfig = {
  mobile: {
    minWidth: 0,
    layoutMode: "stack",
  },
  desktop: {
    minWidth: 768,
    layoutMode: "manual",
  },
};

/**
 * 3-breakpoint configuration with tablet
 *
 * **Layout modes**:
 * - mobile: Auto-stack full-width
 * - tablet: Inherit from desktop (saves configuration effort)
 * - desktop: Manual positioning
 */
export const BREAKPOINTS_3: BreakpointConfig = {
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

/**
 * 5-breakpoint configuration (Bootstrap-style)
 *
 * **Breakpoint names**: xs, sm, md, lg, xl
 * **Layout strategy**:
 * - xs/sm: Auto-stack (mobile-first)
 * - md/lg: Inherit from xl (tablet/desktop inherit from largest)
 * - xl: Manual positioning (widest viewport)
 */
export const BREAKPOINTS_5: BreakpointConfig = {
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

/**
 * Create default 2-breakpoint layout (backwards compatible)
 *
 * Creates a sample grid with 6 items demonstrating mobile/desktop responsiveness.
 *
 * **Desktop layout**: 2-column grid with various component sizes
 * **Mobile layout**: Auto-stacked full-width
 * @returns Array of grid items with 2-breakpoint layouts
 */
export function create2BreakpointLayout() {
  return [
    {
      id: "item-1",
      canvasId: "canvas1",
      type: "header",
      name: "Header",
      zIndex: 1,
      layouts: {
        desktop: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false, // Auto-stacked
        },
      },
      config: {},
    },
    {
      id: "item-2",
      canvasId: "canvas1",
      type: "text-block",
      name: "Text Block",
      zIndex: 2,
      layouts: {
        desktop: {
          x: 0,
          y: 8,
          width: 24,
          height: 10,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-3",
      canvasId: "canvas1",
      type: "image",
      name: "Image",
      zIndex: 3,
      layouts: {
        desktop: {
          x: 26,
          y: 8,
          width: 24,
          height: 10,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-4",
      canvasId: "canvas1",
      type: "button",
      name: "Button",
      zIndex: 4,
      layouts: {
        desktop: {
          x: 0,
          y: 20,
          width: 15,
          height: 4,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 4,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-5",
      canvasId: "canvas1",
      type: "gallery",
      name: "Gallery",
      zIndex: 5,
      layouts: {
        desktop: {
          x: 0,
          y: 26,
          width: 50,
          height: 12,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 16,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-6",
      canvasId: "canvas1",
      type: "footer",
      name: "Footer",
      zIndex: 6,
      layouts: {
        desktop: {
          x: 0,
          y: 40,
          width: 50,
          height: 6,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false,
        },
      },
      config: {},
    },
  ];
}

/**
 * Create 3-breakpoint layout with tablet
 *
 * Creates a sample grid demonstrating mobile/tablet/desktop responsiveness.
 *
 * **Desktop/Tablet layout**: 3-column grid (tablet inherits from desktop)
 * **Mobile layout**: Auto-stacked full-width
 * @returns Array of grid items with 3-breakpoint layouts
 */
export function create3BreakpointLayout() {
  return [
    {
      id: "item-1",
      canvasId: "canvas1",
      type: "header",
      name: "Header",
      zIndex: 1,
      layouts: {
        desktop: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: true,
        },
        tablet: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false, // Inherits from desktop
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false, // Auto-stacked
        },
      },
      config: {},
    },
    {
      id: "item-2",
      canvasId: "canvas1",
      type: "text-block",
      name: "Text Block",
      zIndex: 2,
      layouts: {
        desktop: {
          x: 0,
          y: 8,
          width: 16,
          height: 10,
          customized: true,
        },
        tablet: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-3",
      canvasId: "canvas1",
      type: "image",
      name: "Image",
      zIndex: 3,
      layouts: {
        desktop: {
          x: 17,
          y: 8,
          width: 16,
          height: 10,
          customized: true,
        },
        tablet: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-4",
      canvasId: "canvas1",
      type: "button",
      name: "Button",
      zIndex: 4,
      layouts: {
        desktop: {
          x: 34,
          y: 8,
          width: 16,
          height: 10,
          customized: true,
        },
        tablet: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-5",
      canvasId: "canvas1",
      type: "gallery",
      name: "Gallery",
      zIndex: 5,
      layouts: {
        desktop: {
          x: 0,
          y: 20,
          width: 50,
          height: 12,
          customized: true,
        },
        tablet: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 16,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-6",
      canvasId: "canvas1",
      type: "footer",
      name: "Footer",
      zIndex: 6,
      layouts: {
        desktop: {
          x: 0,
          y: 34,
          width: 50,
          height: 6,
          customized: true,
        },
        tablet: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false,
        },
      },
      config: {},
    },
  ];
}

/**
 * Create 5-breakpoint layout (Bootstrap-style)
 *
 * Creates a sample grid demonstrating xs/sm/md/lg/xl responsiveness.
 *
 * **xl/lg/md layout**: 4-column grid (md/lg inherit from xl)
 * **sm layout**: Auto-stacked full-width
 * **xs layout**: Auto-stacked full-width
 * @returns Array of grid items with 5-breakpoint layouts
 */
export function create5BreakpointLayout() {
  return [
    {
      id: "item-1",
      canvasId: "canvas1",
      type: "header",
      name: "Header",
      zIndex: 1,
      layouts: {
        xl: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: true,
        },
        lg: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false, // Inherits from xl
        },
        md: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false, // Inherits from xl
        },
        sm: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false, // Auto-stacked
        },
        xs: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false, // Auto-stacked
        },
      },
      config: {},
    },
    {
      id: "item-2",
      canvasId: "canvas1",
      type: "text-block",
      name: "Text Block",
      zIndex: 2,
      layouts: {
        xl: {
          x: 0,
          y: 8,
          width: 12,
          height: 10,
          customized: true,
        },
        lg: {
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
        sm: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
        xs: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-3",
      canvasId: "canvas1",
      type: "image",
      name: "Image",
      zIndex: 3,
      layouts: {
        xl: {
          x: 13,
          y: 8,
          width: 12,
          height: 10,
          customized: true,
        },
        lg: {
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
        sm: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
        xs: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-4",
      canvasId: "canvas1",
      type: "button",
      name: "Button",
      zIndex: 4,
      layouts: {
        xl: {
          x: 26,
          y: 8,
          width: 12,
          height: 10,
          customized: true,
        },
        lg: {
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
        sm: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false,
        },
        xs: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-5",
      canvasId: "canvas1",
      type: "card",
      name: "Card",
      zIndex: 5,
      layouts: {
        xl: {
          x: 38,
          y: 8,
          width: 12,
          height: 10,
          customized: true,
        },
        lg: {
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
        sm: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
        xs: {
          x: 0,
          y: 0,
          width: 50,
          height: 10,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-6",
      canvasId: "canvas1",
      type: "gallery",
      name: "Gallery",
      zIndex: 6,
      layouts: {
        xl: {
          x: 0,
          y: 20,
          width: 50,
          height: 12,
          customized: true,
        },
        lg: {
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
        sm: {
          x: 0,
          y: 0,
          width: 50,
          height: 16,
          customized: false,
        },
        xs: {
          x: 0,
          y: 0,
          width: 50,
          height: 16,
          customized: false,
        },
      },
      config: {},
    },
    {
      id: "item-7",
      canvasId: "canvas1",
      type: "footer",
      name: "Footer",
      zIndex: 7,
      layouts: {
        xl: {
          x: 0,
          y: 34,
          width: 50,
          height: 6,
          customized: true,
        },
        lg: {
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
        sm: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false,
        },
        xs: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: false,
        },
      },
      config: {},
    },
  ];
}

/**
 * Create customized mobile layout example
 *
 * Demonstrates manually customizing mobile layouts instead of auto-stacking.
 * Useful for showcasing the `customized: true` flag.
 *
 * **Desktop layout**: 2-column grid
 * **Mobile layout**: Custom 2-column layout (not auto-stacked)
 * @returns Array of grid items with custom mobile layouts
 */
export function createCustomMobileLayout() {
  return [
    {
      id: "item-1",
      canvasId: "canvas1",
      type: "header",
      name: "Header",
      zIndex: 1,
      layouts: {
        desktop: {
          x: 0,
          y: 0,
          width: 50,
          height: 6,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 0,
          width: 50,
          height: 8,
          customized: true, // Custom mobile layout
        },
      },
      config: {},
    },
    {
      id: "item-2",
      canvasId: "canvas1",
      type: "image",
      name: "Image Left",
      zIndex: 2,
      layouts: {
        desktop: {
          x: 0,
          y: 8,
          width: 24,
          height: 12,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 10,
          width: 24,
          height: 12,
          customized: true, // Left column on mobile
        },
      },
      config: {},
    },
    {
      id: "item-3",
      canvasId: "canvas1",
      type: "image",
      name: "Image Right",
      zIndex: 3,
      layouts: {
        desktop: {
          x: 26,
          y: 8,
          width: 24,
          height: 12,
          customized: true,
        },
        mobile: {
          x: 26,
          y: 10,
          width: 24,
          height: 12,
          customized: true, // Right column on mobile
        },
      },
      config: {},
    },
    {
      id: "item-4",
      canvasId: "canvas1",
      type: "footer",
      name: "Footer",
      zIndex: 4,
      layouts: {
        desktop: {
          x: 0,
          y: 22,
          width: 50,
          height: 6,
          customized: true,
        },
        mobile: {
          x: 0,
          y: 24,
          width: 50,
          height: 6,
          customized: true,
        },
      },
      config: {},
    },
  ];
}
