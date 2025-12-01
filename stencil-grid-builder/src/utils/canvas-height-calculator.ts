/**
 * Canvas Height Calculator
 * =========================
 *
 * Utility for calculating dynamic canvas heights based on content.
 *
 * ## Purpose
 *
 * Automatically calculates canvas height to fit all items with a bottom margin:
 * - Finds the bottommost item in the canvas
 * - Adds configurable grid-based margin (default: 5 grid units)
 * - Converts to pixels for rendering
 * - Returns 0 for empty canvases (CSS min-height will apply)
 *
 * ## Design Philosophy
 *
 * **Content-driven heights**:
 * - Canvas height adapts to content in real-time
 * - Shrinks when items removed or moved up
 * - Grows when items added or moved down
 * - Always maintains consistent bottom margin
 *
 * **Grid-based margin**:
 * - Uses grid units instead of pixels for consistent proportions
 * - Desktop: 5 units ≈ 100px (2% grid)
 * - Mobile: 5 units ≈ 100px (fixed 20px grid)
 * - Scales naturally with canvas resize
 *
 * ## Usage
 *
 * ```typescript
 * import { calculateCanvasHeight } from './canvas-height-calculator';
 *
 * const height = calculateCanvasHeight('canvas1');
 * canvas.style.height = height > 0 ? `${height}px` : '';
 * ```
 * @module canvas-height-calculator
 */

import { gridState, GridState } from "../services/state-manager";
import { gridToPixelsY } from "./grid-calculations";
import { GridConfig } from "../types/grid-config";

/**
 * Default bottom margin in grid units
 *
 * **Value**: 5 grid units
 * **Approximate pixels**:
 * - Desktop: ~100px (with 2% grid = 20px per unit)
 * - Mobile: 100px (with fixed 20px grid)
 *
 * **Why 5 units**:
 * - Provides comfortable spacing for new item placement
 * - Not too large (wastes space) or too small (cramped)
 * - Aligns with grid for visual consistency
 *
 * **Override**: Can be customized via GridConfig.canvasBottomMargin
 */
const DEFAULT_BOTTOM_MARGIN_GRID_UNITS = 5;

/**
 * Calculate canvas height from items array
 *
 * **Reusable core logic**: Works with any items array (not tied to global state)
 *
 * **Algorithm**:
 * 1. Find bottommost item (max of `y + height` for all items)
 * 2. Add bottom margin (configurable via GridConfig.canvasBottomMargin, default 5 grid units)
 * 3. Convert to pixels using current grid size
 * 4. Return pixel height (or 0 if no items)
 *
 * **Example calculation**:
 * ```
 * Items:
 * - Item 1: y=2, height=6  → bottom=8
 * - Item 2: y=10, height=4 → bottom=14 (bottommost)
 * - Item 3: y=5, height=3  → bottom=8
 *
 * Bottommost: 14 grid units
 * + Margin: 5 grid units (default)
 * = Total: 19 grid units
 * × Grid size: 20px
 * = Height: 380px
 * ```
 * @param items - Array of grid items
 * @param viewport - Current viewport ('desktop' | 'mobile')
 * @param config - Optional grid configuration (for custom bottom margin)
 * @returns Canvas height in pixels (0 if no items)
 */
export function calculateCanvasHeightFromItems(
  items: any[],
  viewport: "desktop" | "mobile",
  config?: GridConfig,
): number {
  if (!items || items.length === 0) {
    // Empty canvas - return 0 (CSS min-height will apply)
    return 0;
  }

  // Find bottommost item position
  let bottommostY = 0;

  for (const item of items) {
    const layout = item.layouts[viewport];

    // Handle auto-layout mobile items (y and height may be null)
    const y = layout.y ?? 0;
    const height = layout.height ?? 0;

    const itemBottom = y + height;
    if (itemBottom > bottommostY) {
      bottommostY = itemBottom;
    }
  }

  // Get bottom margin from config or use default
  const bottomMargin =
    config?.canvasBottomMargin ?? DEFAULT_BOTTOM_MARGIN_GRID_UNITS;

  // Add bottom margin in grid units
  const totalGridUnits = bottommostY + bottomMargin;

  // Convert to pixels
  const heightPx = gridToPixelsY(totalGridUnits, config);

  return heightPx;
}

/**
 * Calculate canvas height based on content (from global state)
 *
 * **For grid-builder**: Uses global gridState
 *
 * **Algorithm**:
 * 1. Get all items in the specified canvas from gridState
 * 2. Delegate to calculateCanvasHeightFromItems for calculation
 *
 * **Current viewport handling**:
 * - Uses `gridState.currentViewport` to determine which layout to read
 * - Desktop viewport: reads `item.layouts.desktop`
 * - Mobile viewport: reads `item.layouts.mobile` (with auto-layout fallback)
 *
 * **Empty canvas behavior**:
 * - Returns 0 when no items present
 * - CSS `min-height` will apply as fallback (configurable via GridConfig.canvasMinHeight)
 * - Prevents canvas from collapsing completely
 *
 * **Bottom margin**:
 * - Configurable via GridConfig.canvasBottomMargin (default: 5 grid units)
 * @param canvasId - Canvas identifier
 * @param config - Optional grid configuration (for custom bottom margin)
 * @returns Canvas height in pixels (0 if empty)
 * @example
 * ```typescript
 * // Calculate height for canvas with 3 items (default margin)
 * const height = calculateCanvasHeight('canvas1');
 * // Returns: 380 (if bottommost item at y=14, height=4, + 5 grid units margin)
 *
 * // Empty canvas
 * const emptyHeight = calculateCanvasHeight('canvas2');
 * // Returns: 0 (CSS min-height will apply)
 *
 * // Custom bottom margin
 * const heightCustom = calculateCanvasHeight('canvas1', { canvasBottomMargin: 10 });
 * // Returns: 480 (if bottommost item at y=14, height=4, + 10 grid units margin)
 * ```
 */
export function calculateCanvasHeight(
  canvasId: string,
  config?: GridConfig,
  state?: GridState,
): number {
  // Get canvas from state (use instance state if available, fall back to global)
  const stateToUse = state || gridState;
  const canvas = stateToUse.canvases[canvasId];
  if (!canvas || !canvas.items || canvas.items.length === 0) {
    // Empty canvas - return 0 (CSS min-height will apply)
    return 0;
  }

  // Get current viewport
  const viewport = stateToUse.currentViewport || "desktop";

  // Delegate to reusable function
  return calculateCanvasHeightFromItems(canvas.items, viewport, config);
}
