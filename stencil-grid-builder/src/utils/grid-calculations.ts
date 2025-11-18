/**
 * Grid Calculations Utility
 * ========================
 *
 * Core system for converting between pixel coordinates and grid units in the drag-and-drop
 * grid builder. This module provides pure functions with performance optimizations through
 * intelligent caching.
 *
 * ## Grid System Architecture
 *
 * The grid uses a hybrid approach combining responsive and fixed sizing:
 *
 * ### Horizontal Grid (Responsive)
 * - **Size**: 2% of container width (50 units across full width)
 * - **Behavior**: Scales proportionally with canvas width changes
 * - **Use case**: Enables responsive layouts that adapt to different screen sizes
 * - **Example**: At 1000px width, each grid unit = 20px (1000 * 0.02)
 *
 * ### Vertical Grid (Fixed)
 * - **Size**: Fixed 20px per grid unit
 * - **Behavior**: Remains constant regardless of viewport size
 * - **Use case**: Provides consistent vertical spacing and predictable heights
 * - **Rationale**: Vertical scrolling is unlimited, so fixed sizing provides better UX
 *
 * ## Performance Optimization Strategy
 *
 * ### Grid Size Caching
 * The horizontal grid size is calculated from DOM elements (container.clientWidth),
 * which is an expensive operation. To minimize performance impact:
 *
 * 1. **First access**: Calculate once per canvas and cache the result
 * 2. **Subsequent access**: Return cached value (no DOM reads)
 * 3. **Cache invalidation**: Clear when canvas resizes (via ResizeObserver)
 *
 * **Performance Impact**:
 * - Without caching: 100 items = 100+ DOM reads during viewport switch
 * - With caching: 100 items = 1 DOM read per canvas during viewport switch
 * - Prevents layout thrashing and reduces reflows
 *
 * ### DOM Caching Integration
 * Uses `domCache` utility to avoid repeated `getElementById` calls, providing
 * a second layer of performance optimization.
 *
 * ## Usage Examples
 *
 * ```typescript
 * // Convert grid position to pixels for rendering
 * const pixelX = gridToPixelsX(10, 'canvas1'); // Grid unit 10 → pixels
 * const pixelY = gridToPixelsY(5);              // Grid unit 5 → 100px
 *
 * // Convert mouse position to grid coordinates
 * const gridX = pixelsToGridX(250, 'canvas1');  // Pixels → grid units
 * const gridY = pixelsToGridY(120);             // 120px → 6 grid units
 *
 * // Clear cache on canvas resize
 * resizeObserver.observe(canvasContainer);
 * resizeObserver.addEventListener(() => clearGridSizeCache());
 * ```
 *
 * @module grid-calculations
 */

import { domCache } from './dom-cache';
import { GridConfig } from '../types/grid-config';

/** Fixed vertical grid size in pixels - provides consistent vertical spacing */
const GRID_SIZE_VERTICAL = 20;

/**
 * Horizontal grid size as percentage of container width
 * 0.02 = 2% = 50 grid units across full width
 */
const GRID_SIZE_HORIZONTAL_PERCENT = 0.02;

/**
 * Default minimum grid size in pixels
 * Prevents grid from becoming too small on tiny screens
 */
const DEFAULT_MIN_GRID_SIZE = 10;

/**
 * Default maximum grid size in pixels
 * Prevents grid from becoming too large on huge screens
 */
const DEFAULT_MAX_GRID_SIZE = 50;

/**
 * Grid size cache to avoid repeated DOM queries
 * Key format: `${canvasId}-h` for horizontal grid sizes
 * Cleared on canvas resize events
 */
const gridSizeCache = new Map<string, number>();

/**
 * Clear the grid size cache for all canvases
 *
 * **When to call**:
 * - Canvas container is resized (via ResizeObserver)
 * - Viewport changes (desktop ↔ mobile)
 * - Canvas is added/removed from DOM
 *
 * **Why needed**:
 * Cached grid sizes become stale when container widths change. This ensures
 * fresh calculations on next access.
 *
 * **Performance note**:
 * Clearing cache is cheap (O(1)). The cost is in recalculation, which happens
 * lazily on next access.
 *
 * @example
 * ```typescript
 * resizeObserver.observe(canvasElement);
 * resizeCallback = () => {
 *   clearGridSizeCache();
 *   // Components will recalculate on next render
 * };
 * ```
 */
export function clearGridSizeCache() {
  gridSizeCache.clear();
}

/**
 * Get the horizontal grid size for a specific canvas
 *
 * **Calculation**: `containerWidth * gridSizePercent` = size of one horizontal grid unit in pixels
 * **Min/Max constraints**: Applied from GridConfig (default: 10px-50px)
 *
 * **Caching behavior**:
 * - First call: Reads `container.clientWidth` from DOM and caches result
 * - Subsequent calls: Returns cached value (no DOM access)
 * - After resize: Cache cleared, recalculates on next call
 *
 * **Why responsive**:
 * Horizontal grid scales with container to support:
 * - Responsive layouts (desktop/mobile)
 * - Variable canvas widths
 * - Fluid grid-based designs
 *
 * **GridConfig customization**:
 * - `gridSizePercent`: Grid unit as % of width (default: 2% = 50 units per 100% width)
 * - `minGridSize`: Minimum size in pixels (default: 10px, prevents too small on mobile)
 * - `maxGridSize`: Maximum size in pixels (default: 50px, prevents too large on desktop)
 *
 * @param canvasId - The canvas element ID to calculate grid size for
 * @param config - Optional GridConfig for customization
 * @param forceRecalc - Set true to bypass cache and force fresh calculation
 * @returns Size of one horizontal grid unit in pixels (constrained by min/max)
 *
 * @example
 * ```typescript
 * // Default config (2% grid, 10px-50px)
 * const size1 = getGridSizeHorizontal('canvas1'); // → 20 (at 1000px width)
 *
 * // Custom config (3% grid, 15px-60px)
 * const size2 = getGridSizeHorizontal('canvas1', {
 *   gridSizePercent: 3,
 *   minGridSize: 15,
 *   maxGridSize: 60
 * }); // → 30 (at 1000px width)
 *
 * // Force recalculation
 * const size3 = getGridSizeHorizontal('canvas1', undefined, true);
 * ```
 */
export function getGridSizeHorizontal(
  canvasId: string,
  config?: GridConfig,
  forceRecalc: boolean = false
): number {
  const cacheKey = `${canvasId}-h`;

  if (!forceRecalc && gridSizeCache.has(cacheKey)) {
    return gridSizeCache.get(cacheKey)!;
  }

  // Use DOM cache instead of getElementById
  const container = domCache.getCanvas(canvasId);
  if (!container) {
    console.warn(`Canvas container not found: ${canvasId}`);
    return 0;
  }

  // Get grid size percent from config or use default
  // Config gridSizePercent is whole number (2 = 2%), default is already decimal (0.02)
  const gridSizePercent = config?.gridSizePercent ? config.gridSizePercent / 100 : GRID_SIZE_HORIZONTAL_PERCENT;

  // Calculate raw grid size
  const rawSize = container.clientWidth * gridSizePercent;

  // Apply min/max constraints from config or use defaults
  const minSize = config?.minGridSize ?? DEFAULT_MIN_GRID_SIZE;
  const maxSize = config?.maxGridSize ?? DEFAULT_MAX_GRID_SIZE;
  const size = Math.max(minSize, Math.min(maxSize, rawSize));

  gridSizeCache.set(cacheKey, size);
  return size;
}

/**
 * Get the vertical grid size (constant)
 *
 * **Why fixed**:
 * Unlike horizontal grid, vertical uses fixed 20px sizing because:
 * - Vertical scrolling is infinite (no container height limit)
 * - Provides predictable, consistent heights across all viewports
 * - Simplifies calculations (no container dependency)
 * - Better UX for vertical spacing
 *
 * @returns Fixed vertical grid size (20px)
 *
 * @example
 * ```typescript
 * const vSize = getGridSizeVertical(); // → 20 (always)
 * ```
 */
export function getGridSizeVertical(): number {
  return GRID_SIZE_VERTICAL;
}

/**
 * Convert grid units to pixels for horizontal positioning and sizing
 *
 * **Use cases**:
 * - Converting item `x` position from grid coordinates to CSS left/transform
 * - Converting item `width` from grid units to CSS width
 * - Rendering grid items at correct horizontal positions
 *
 * **Performance**:
 * Uses cached grid size via `getGridSizeHorizontal()` to avoid DOM reads
 *
 * **Rounding**:
 * Uses `Math.round()` to prevent subpixel rendering issues
 *
 * @param gridUnits - Number of grid units
 * @param canvasId - Canvas ID for responsive grid size calculation
 * @param config - Optional GridConfig for customization
 * @returns Pixel value
 *
 * @example
 * ```typescript
 * // Item at grid position x=10 (default 2% grid)
 * const leftPx = gridToPixelsX(10, 'canvas1'); // → 200px (at 1000px container)
 *
 * // Item with grid width=15 (custom 3% grid)
 * const widthPx = gridToPixelsX(15, 'canvas1', { gridSizePercent: 3 }); // → 450px
 * ```
 */
export function gridToPixelsX(gridUnits: number, canvasId: string, config?: GridConfig): number {
  // Use cached grid size for better performance
  const gridSize = getGridSizeHorizontal(canvasId, config);
  return Math.round(gridUnits * gridSize);
}

/**
 * Convert grid units to pixels for vertical positioning and sizing
 *
 * **Use cases**:
 * - Converting item `y` position from grid coordinates to CSS top/transform
 * - Converting item `height` from grid units to CSS height
 * - Calculating vertical spacing
 *
 * **Why no canvas ID**:
 * Vertical grid is fixed (20px), so no container-specific calculation needed
 *
 * @param gridUnits - Number of grid units
 * @returns Pixel value (gridUnits * 20)
 *
 * @example
 * ```typescript
 * // Item at grid position y=5
 * const topPx = gridToPixelsY(5); // → 100px
 *
 * // Item with grid height=8
 * const heightPx = gridToPixelsY(8); // → 160px
 * ```
 */
export function gridToPixelsY(gridUnits: number): number {
  return gridUnits * GRID_SIZE_VERTICAL;
}

/**
 * Convert pixel coordinates to grid units for horizontal values
 *
 * **Use cases**:
 * - Converting mouse/drop position to grid coordinates
 * - Snapping dragged items to grid
 * - Calculating item positions after drag
 *
 * **Rounding**:
 * Uses `Math.round()` to snap to nearest grid unit (implements grid snapping)
 *
 * **Safety**:
 * Returns 0 if grid size is 0 (container not found/initialized)
 *
 * @param pixels - Pixel value to convert
 * @param canvasId - Canvas ID for responsive grid size calculation
 * @param config - Optional GridConfig for customization
 * @returns Number of grid units (rounded)
 *
 * @example
 * ```typescript
 * // Mouse drop at 250px (default 2% grid)
 * const gridX = pixelsToGridX(250, 'canvas1'); // → 13 (at 1000px container)
 *
 * // After drag, element at 371px (custom 3% grid)
 * const snappedX = pixelsToGridX(371, 'canvas1', { gridSizePercent: 3 }); // → 12
 * ```
 */
export function pixelsToGridX(pixels: number, canvasId: string, config?: GridConfig): number {
  // Use cached grid size for better performance
  const gridSize = getGridSizeHorizontal(canvasId, config);
  if (gridSize === 0) {
    return 0;
  }
  return Math.round(pixels / gridSize);
}

/**
 * Convert pixel coordinates to grid units for vertical values
 *
 * **Use cases**:
 * - Converting mouse Y position to grid coordinates
 * - Snapping vertical positions to grid
 * - Calculating vertical offsets
 *
 * **Rounding**:
 * Implements automatic grid snapping via `Math.round()`
 *
 * @param pixels - Pixel value to convert
 * @returns Number of grid units (rounded)
 *
 * @example
 * ```typescript
 * // Mouse at 127px vertically
 * const gridY = pixelsToGridY(127); // → 6 (rounded from 6.35)
 *
 * // Element height 165px
 * const gridHeight = pixelsToGridY(165); // → 8 (rounded from 8.25)
 * ```
 */
export function pixelsToGridY(pixels: number): number {
  return Math.round(pixels / GRID_SIZE_VERTICAL);
}
