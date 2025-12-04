/**
 * Breakpoint Utilities
 * ======================
 *
 * Utilities for multi-breakpoint responsive layout management.
 * Handles viewport detection, layout resolution, auto-stacking, and inheritance.
 *
 * ## Core Functions
 *
 * 1. **getViewportForWidth()** - Determine which breakpoint matches container width
 * 2. **getEffectiveLayout()** - Resolve actual layout to render (with fallback/inheritance)
 * 3. **shouldAutoStack()** - Check if breakpoint uses auto-stacking
 * 4. **calculateAutoStackLayout()** - Calculate stacked y-position for items
 * 5. **initializeLayouts()** - Create default layouts for all breakpoints
 *
 * ## Layout Resolution Algorithm
 *
 * For any given breakpoint, determine which layout to render:
 *
 * 1. If item has layout for breakpoint AND `customized: true` → use it
 * 2. If breakpoint has `layoutMode: 'inherit'` → follow `inheritFrom` chain
 * 3. Otherwise → find nearest customized breakpoint by width distance
 * 4. Ultimate fallback → largest breakpoint (typically 'desktop')
 *
 * ## Performance
 *
 * - Viewport detection: O(n) where n = number of breakpoints (3-5 typically)
 * - Layout resolution: O(n log n) for sorting, ~10-15 comparisons worst case
 * - Auto-stack calculation: O(m) where m = number of items in canvas
 * @module breakpoint-utils
 */

import { BreakpointConfig, LayoutConfig } from "../services/state-manager";

/**
 * Get viewport name for container width
 *
 * Determines which breakpoint applies based on container width using
 * mobile-first approach (largest matching minWidth wins).
 *
 * **Algorithm**:
 * 1. Sort breakpoints by minWidth (largest to smallest)
 * 2. Return first breakpoint where width >= minWidth
 * 3. If no match, return smallest breakpoint
 *
 * **Examples**:
 * ```typescript
 * const breakpoints = {
 * mobile: { minWidth: 0 },
 * tablet: { minWidth: 768 },
 * desktop: { minWidth: 1024 }
 * };
 *
 * getViewportForWidth(500, breakpoints);  // 'mobile'
 * getViewportForWidth(800, breakpoints);  // 'tablet'
 * getViewportForWidth(1200, breakpoints); // 'desktop'
 * ```
 * @param width - Container width in pixels
 * @param breakpoints - Breakpoint configuration
 * @returns Breakpoint name that matches width
 */
export function getViewportForWidth(
  width: number,
  breakpoints: BreakpointConfig,
): string {
  const sorted = Object.entries(breakpoints).sort(
    ([, a], [, b]) => b.minWidth - a.minWidth,
  ); // Largest to smallest

  for (const [name, def] of sorted) {
    if (width >= def.minWidth) return name;
  }

  // Fallback to smallest breakpoint (should never happen if 0px breakpoint exists)
  return sorted[sorted.length - 1][0];
}

/**
 * Get effective layout with inheritance/fallback
 *
 * Resolves which layout to actually render for a given breakpoint,
 * handling customization, inheritance, and fallback logic.
 *
 * **Resolution Priority**:
 * 1. If layout exists and `customized: true` → use it
 * 1.5. If `layoutMode: 'stack'` and layout has values → use it, but sourceBreakpoint = nearest customized
 * 2. If `layoutMode: 'inherit'` and `inheritFrom` defined → recursively resolve
 * 3. Otherwise → find nearest customized breakpoint by width
 * 4. Ultimate fallback → largest breakpoint
 *
 * **Example (inheritance)**:
 * ```typescript
 * const item = {
 * layouts: {
 * desktop: { x: 10, y: 10, width: 20, height: 10, customized: true },
 * tablet: { x: null, y: null, width: null, height: null, customized: false }
 * }
 * };
 *
 * const breakpoints = {
 * tablet: { minWidth: 768, layoutMode: 'inherit', inheritFrom: 'desktop' },
 * desktop: { minWidth: 1024, layoutMode: 'manual' }
 * };
 *
 * const result = getEffectiveLayout(item, 'tablet', breakpoints);
 * // Returns: { layout: desktop layout, sourceBreakpoint: 'desktop' }
 * ```
 *
 * **Example (stack mode with reference breakpoint)**:
 * ```typescript
 * const item = {
 * layouts: {
 * desktop: { x: 10, y: 20, width: 20, height: 10, customized: true },
 * mobile: { x: 0, y: 0, width: 50, height: 10, customized: false }
 * }
 * };
 *
 * const breakpoints = {
 * mobile: { minWidth: 0, layoutMode: 'stack' },
 * desktop: { minWidth: 768, layoutMode: 'manual' }
 * };
 *
 * const result = getEffectiveLayout(item, 'mobile', breakpoints);
 * // Returns: { layout: mobile layout, sourceBreakpoint: 'desktop' }
 * // sourceBreakpoint = 'desktop' so stacking order uses desktop's y-position
 * ```
 * @param item - Grid item with layouts
 * @param targetBreakpoint - Breakpoint name to get layout for
 * @param breakpoints - Breakpoint configuration
 * @returns Object with resolved layout and source breakpoint name
 */
export function getEffectiveLayout(
  item: any, // GridItem type
  targetBreakpoint: string,
  breakpoints: BreakpointConfig,
): { layout: LayoutConfig; sourceBreakpoint: string } {
  const layout = item.layouts[targetBreakpoint];
  const breakpointDef = breakpoints[targetBreakpoint];

  // Priority 1: If customized, use it
  if (layout?.customized) {
    return { layout, sourceBreakpoint: targetBreakpoint };
  }

  // Priority 1.5: If layoutMode='stack' and layout has valid values, use it (for auto-stacking)
  // This ensures stack-mode layouts with customized: false are returned so auto-stacking can be applied
  // Only use it if layout has valid dimensions (not all null)
  if (
    breakpointDef?.layoutMode === "stack" &&
    layout &&
    (layout.x !== null ||
      layout.y !== null ||
      layout.width !== null ||
      layout.height !== null)
  ) {
    // Find the reference breakpoint for visual ordering (nearest customized or largest manual)
    const targetWidth = breakpointDef?.minWidth ?? 0;
    const sorted = Object.keys(breakpoints)
      .filter((name) => item.layouts[name]?.customized)
      .sort(
        (a, b) =>
          Math.abs(breakpoints[a].minWidth - targetWidth) -
          Math.abs(breakpoints[b].minWidth - targetWidth),
      );

    let referenceBreakpoint = targetBreakpoint;
    if (sorted.length > 0) {
      // Use nearest customized breakpoint as reference for visual ordering
      referenceBreakpoint = sorted[0];
    } else {
      // Fallback to largest breakpoint
      const largest = Object.entries(breakpoints).sort(
        ([, a], [, b]) => b.minWidth - a.minWidth,
      )[0][0];
      referenceBreakpoint = largest;
    }

    return { layout, sourceBreakpoint: referenceBreakpoint };
  }

  // Priority 2: If layoutMode='inherit', follow inheritFrom chain
  if (breakpointDef?.layoutMode === "inherit" && breakpointDef.inheritFrom) {
    const inheritedFrom = breakpointDef.inheritFrom;
    if (item.layouts[inheritedFrom]) {
      return getEffectiveLayout(item, inheritedFrom, breakpoints);
    }
  }

  // Priority 3: Find nearest customized breakpoint by width
  const targetWidth = breakpointDef?.minWidth ?? 0;
  const sorted = Object.keys(breakpoints)
    .filter((name) => item.layouts[name]?.customized)
    .sort(
      (a, b) =>
        Math.abs(breakpoints[a].minWidth - targetWidth) -
        Math.abs(breakpoints[b].minWidth - targetWidth),
    );

  if (sorted.length > 0) {
    return {
      layout: item.layouts[sorted[0]],
      sourceBreakpoint: sorted[0],
    };
  }

  // Priority 4: Fallback to largest breakpoint
  const largest = Object.entries(breakpoints).sort(
    ([, a], [, b]) => b.minWidth - a.minWidth,
  )[0][0];

  return {
    layout: item.layouts[largest],
    sourceBreakpoint: largest,
  };
}

/**
 * Check if breakpoint uses auto-stacking
 *
 * Determines whether items should stack vertically based on breakpoint's layoutMode.
 *
 * **Returns true when**:
 * - Breakpoint has `layoutMode: 'stack'`
 * - Example: Mobile breakpoints often use auto-stacking
 *
 * **Returns false when**:
 * - Breakpoint has `layoutMode: 'manual'` (default)
 * - Breakpoint has `layoutMode: 'inherit'`
 * - Breakpoint definition not found
 *
 * **Usage**:
 * ```typescript
 * if (shouldAutoStack(currentViewport, breakpoints) && !layout.customized) {
 * // Calculate stacked y-position
 * actualLayout = calculateAutoStackLayout(...);
 * }
 * ```
 * @param breakpoint - Breakpoint name to check
 * @param breakpoints - Breakpoint configuration
 * @returns true if breakpoint uses auto-stacking, false otherwise
 */
export function shouldAutoStack(
  breakpoint: string,
  breakpoints: BreakpointConfig,
): boolean {
  const def = breakpoints[breakpoint];
  return def?.layoutMode === "stack";
}

/**
 * Calculate auto-stacked layout for an item
 *
 * Used when `layoutMode: 'stack'` and `customized: false`.
 * Calculates cumulative y-position by summing heights of all previous items
 * in visual order (sorted by y-position, then z-index of source breakpoint).
 *
 * **Stacking Algorithm**:
 * 1. Sort items by source breakpoint's y-position (ascending)
 * 2. For items with same y-position, sort by z-index (ascending)
 * 3. Calculate cumulative heights in that order
 * ```
 * item1.y = 0
 * item2.y = item1.height
 * item3.y = item1.height + item2.height
 * item4.y = item1.height + item2.height + item3.height
 * ```
 *
 * **Output Layout**:
 * - x: 0 (left edge)
 * - y: cumulative height of all previous items (in visual order)
 * - width: 50 (full width, 50 grid units = 100% of 50-unit canvas)
 * - height: source breakpoint's height (maintains aspect ratio)
 * - customized: false
 *
 * **Example**:
 * ```typescript
 * const items = [
 * { id: '1', zIndex: 1, layouts: { desktop: { y: 10, height: 10 } } },
 * { id: '2', zIndex: 2, layouts: { desktop: { y: 0, height: 15 } } },  // Stacks first (y=0)
 * { id: '3', zIndex: 3, layouts: { desktop: { y: 10, height: 8 } } }   // Stacks second (y=10, z=1)
 * ];
 *
 * // Visual order: item2 (y=0), item1 (y=10, z=1), item3 (y=10, z=3)
 * calculateAutoStackLayout(items[2], items, 'desktop');
 * // Returns: { x: 0, y: 25, width: 50, height: 8, customized: false }
 * //           (y = item2.height + item1.height = 15 + 10)
 * ```
 * @param item - Grid item to calculate layout for
 * @param canvasItems - All items in canvas (for cumulative height calculation)
 * @param sourceBreakpoint - Breakpoint to use for height reference and visual order
 * @returns Calculated auto-stack layout
 */
export function calculateAutoStackLayout(
  item: any, // GridItem type
  canvasItems: any[], // GridItem[] type
  sourceBreakpoint: string,
): LayoutConfig {
  // Sort items by visual order in source breakpoint (y-position, then z-index)
  const sortedItems = [...canvasItems].sort((a, b) => {
    const aLayout = a.layouts[sourceBreakpoint];
    const bLayout = b.layouts[sourceBreakpoint];
    const aY = aLayout?.y ?? 0;
    const bY = bLayout?.y ?? 0;

    // Primary sort: y-position
    if (aY !== bY) {
      return aY - bY;
    }

    // Secondary sort: z-index (lower z-index stacks first)
    const aZ = a.zIndex ?? 0;
    const bZ = b.zIndex ?? 0;
    return aZ - bZ;
  });

  const itemIndex = sortedItems.findIndex((i) => i.id === item.id);

  // Calculate cumulative y-position from previous items (in visual order)
  let yPosition = 0;
  if (itemIndex > 0) {
    for (let i = 0; i < itemIndex; i++) {
      const prevItem = sortedItems[i];
      const prevLayout = prevItem.layouts[sourceBreakpoint];
      yPosition += prevLayout?.height ?? 6; // Fallback to 6 grid units
    }
  }

  // Use source breakpoint's height
  const sourceLayout = item.layouts[sourceBreakpoint];

  return {
    x: 0,
    y: yPosition,
    width: 50, // Full width (50 units = 100% of 50-unit canvas)
    height: sourceLayout?.height ?? 6,
    customized: false,
  };
}

/**
 * Initialize layouts for new item across all breakpoints
 *
 * Creates initial layout configurations for all breakpoints when adding a new item.
 * Largest breakpoint gets the base layout with `customized: true`,
 * others get defaults based on their layoutMode.
 *
 * **Algorithm**:
 * 1. Sort breakpoints by minWidth (largest to smallest)
 * 2. Largest breakpoint = base layout with `customized: true`
 * 3. For each other breakpoint:
 * - `layoutMode: 'stack'` → auto-stack defaults (x:0, y:0, width:50, height from base)
 * - `layoutMode: 'inherit'` → null values (will inherit on render)
 * - `layoutMode: 'manual'` → copy base layout with `customized: false`
 *
 * **Example (2-breakpoint)**:
 * ```typescript
 * const breakpoints = {
 * mobile: { minWidth: 0, layoutMode: 'stack' },
 * desktop: { minWidth: 768, layoutMode: 'manual' }
 * };
 *
 * const baseLayout = { x: 5, y: 2, width: 20, height: 8, customized: true };
 *
 * const layouts = initializeLayouts(breakpoints, baseLayout);
 * // Returns:
 * // {
 * //   desktop: { x: 5, y: 2, width: 20, height: 8, customized: true },
 * //   mobile: { x: 0, y: 0, width: 50, height: 8, customized: false }
 * // }
 * ```
 *
 * **Example (3-breakpoint with inheritance)**:
 * ```typescript
 * const breakpoints = {
 * mobile: { minWidth: 0, layoutMode: 'stack' },
 * tablet: { minWidth: 768, layoutMode: 'inherit', inheritFrom: 'desktop' },
 * desktop: { minWidth: 1024, layoutMode: 'manual' }
 * };
 *
 * const layouts = initializeLayouts(breakpoints, baseLayout);
 * // Returns:
 * // {
 * //   desktop: { x: 5, y: 2, width: 20, height: 8, customized: true },
 * //   tablet: { x: null, y: null, width: null, height: null, customized: false },
 * //   mobile: { x: 0, y: 0, width: 50, height: 8, customized: false }
 * // }
 * ```
 * @param breakpoints - Breakpoint configuration
 * @param baseLayout - Base layout to use for largest breakpoint
 * @returns Object mapping breakpoint names to LayoutConfig
 */
export function initializeLayouts(
  breakpoints: BreakpointConfig,
  baseLayout: LayoutConfig,
): Record<string, LayoutConfig> {
  const layouts: Record<string, LayoutConfig> = {};

  // Find largest breakpoint (typically 'desktop')
  const sortedNames = Object.entries(breakpoints)
    .sort(([, a], [, b]) => b.minWidth - a.minWidth)
    .map(([name]) => name);

  const largestName = sortedNames[0];

  // Largest = fully customized manual layout
  layouts[largestName] = { ...baseLayout, customized: true };

  // Others = default based on layoutMode
  for (const name of sortedNames.slice(1)) {
    const def = breakpoints[name];

    if (def.layoutMode === "stack") {
      // Stack mode: auto-calculate on render
      layouts[name] = {
        x: 0,
        y: 0,
        width: 50,
        height: baseLayout.height,
        customized: false,
      };
    } else if (def.layoutMode === "inherit") {
      // Inherit mode: use null to trigger inheritance
      layouts[name] = {
        x: null,
        y: null,
        width: null,
        height: null,
        customized: false,
      };
    } else {
      // Manual mode: copy from largest
      layouts[name] = {
        ...baseLayout,
        customized: false,
      };
    }
  }

  return layouts;
}
