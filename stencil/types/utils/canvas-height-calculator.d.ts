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
 *
 * @module canvas-height-calculator
 */
import { GridConfig } from '../types/grid-config';
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
 *
 * @param items - Array of grid items
 * @param viewport - Current viewport ('desktop' | 'mobile')
 * @param config - Optional grid configuration (for custom bottom margin)
 * @returns Canvas height in pixels (0 if no items)
 */
export declare function calculateCanvasHeightFromItems(items: any[], viewport: 'desktop' | 'mobile', config?: GridConfig): number;
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
 *
 * @param canvasId - Canvas identifier
 * @param config - Optional grid configuration (for custom bottom margin)
 * @returns Canvas height in pixels (0 if empty)
 *
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
export declare function calculateCanvasHeight(canvasId: string, config?: GridConfig): number;
