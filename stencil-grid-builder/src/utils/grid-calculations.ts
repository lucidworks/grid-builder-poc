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
 * @module grid-calculations
 */

import { DOMCache } from "./dom-cache";
import { GridConfig } from "../types/grid-config";

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
 *
 * **Cache key format**: `${instanceId}-${canvasId}-h` for horizontal grid sizes
 * **Instance isolation**: Each grid-builder instance gets its own cache namespace
 *
 * **Why instance-aware**:
 * - Multiple instances on same page can have different container widths for same canvasId
 * - Prevents cache collisions when instances share canvasIds
 * - Supports Storybook story switching (each story is a new instance)
 *
 * **Cleared on**:
 * - Canvas container resize (via ResizeObserver)
 * - Viewport changes (desktop ↔ mobile)
 * - Component unmount (disconnectedCallback)
 */
const gridSizeCache = new Map<string, number>();

/**
 * Clear the grid size cache for all canvases or a specific instance
 *
 * **When to call**:
 * - Canvas container is resized (via ResizeObserver)
 * - Viewport changes (desktop ↔ mobile)
 * - Canvas is added/removed from DOM
 * - Component unmounts (clear only that instance's cache)
 *
 * **Instance-specific clearing**:
 * If instanceId provided, only clears cache entries for that instance.
 * Useful when unmounting a specific grid-builder instance.
 *
 * **Why needed**:
 * Cached grid sizes become stale when container widths change. This ensures
 * fresh calculations on next access.
 *
 * **Performance note**:
 * Clearing cache is cheap (O(1) for all, O(n) for instance-specific where n = cache size).
 * The cost is in recalculation, which happens lazily on next access.
 * @param instanceId - Optional instance ID to clear only that instance's cache
 * @example
 * ```typescript
 * // Clear all caches (all instances)
 * resizeObserver.observe(canvasElement);
 * resizeCallback = () => {
 *   clearGridSizeCache();
 *   // All instances will recalculate on next render
 * };
 *
 * // Clear only specific instance's cache (on unmount)
 * disconnectedCallback() {
 *   clearGridSizeCache(this.config?.instanceId);
 *   // Only this instance's cache is cleared
 * }
 * ```
 */
export function clearGridSizeCache(instanceId?: string) {
  if (instanceId) {
    // Clear only cache entries for this instance
    const prefix = `${instanceId}-`;
    for (const key of gridSizeCache.keys()) {
      if (key.startsWith(prefix)) {
        gridSizeCache.delete(key);
      }
    }
  } else {
    // Clear all (backward compatibility, window resize, etc.)
    gridSizeCache.clear();
  }
}

/**
 * Pre-populate grid size cache with known container width
 *
 * **Purpose**: Set cache value BEFORE triggering re-render to avoid reading DOM during transient state
 *
 * **Use case**: ResizeObserver gives us correct width via entry.contentRect.width.
 * By pre-calculating and caching this value before triggering re-render, we ensure
 * grid calculations never read clientWidth=0 during StencilJS re-render cycle.
 *
 * **Why needed**:
 * When ResizeObserver fires and we trigger re-render (renderVersion++), the DOM enters
 * a transient state where clientWidth returns 0. By pre-populating cache with the correct
 * value from ResizeObserver, we bypass DOM reads entirely during re-render.
 *
 * **Implementation**:
 * Uses same calculation logic as getGridSizeHorizontal() but accepts width parameter
 * instead of reading from DOM.
 * @param canvasId - Canvas element ID for cache key
 * @param containerWidth - Width from ResizeObserver entry.contentRect.width
 * @param config - Optional GridConfig for customization (gridSizePercent, min/max, instanceId)
 * @example
 * ```typescript
 * // In ResizeObserver callback
 * this.resizeObserver = new ResizeObserver((entries) => {
 *   for (const entry of entries) {
 *     const width = entry.contentRect.width;
 *
 *     // Pre-populate cache before triggering re-render
 *     setGridSizeCache(this.canvasId, width, this.config);
 *
 *     // Now trigger re-render - calculations will use cached value
 *     this.renderVersion++;
 *   }
 * });
 * ```
 */
export function setGridSizeCache(
  canvasId: string,
  containerWidth: number,
  config?: GridConfig,
): void {
  // Build cache key (same logic as getGridSizeHorizontal)
  const cacheKey = config?.instanceId
    ? `${config.instanceId}-${canvasId}-h`
    : `${canvasId}-h`;

  // Get grid size percent from config or use default
  const gridSizePercent = config?.gridSizePercent
    ? config.gridSizePercent / 100
    : GRID_SIZE_HORIZONTAL_PERCENT;

  // Calculate raw grid size from provided width
  const rawSize = containerWidth * gridSizePercent;

  // Apply min/max constraints from config or use defaults
  const minSize = config?.minGridSize ?? DEFAULT_MIN_GRID_SIZE;
  const maxSize = config?.maxGridSize ?? DEFAULT_MAX_GRID_SIZE;
  const size = Math.max(minSize, Math.min(maxSize, rawSize));

  // Set in cache
  gridSizeCache.set(cacheKey, size);
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
 * @param canvasId - The canvas element ID to calculate grid size for
 * @param config - Optional GridConfig for customization
 * @param forceRecalc - Set true to bypass cache and force fresh calculation
 * @returns Size of one horizontal grid unit in pixels (constrained by min/max)
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
  forceRecalc: boolean = false,
  domCacheInstance?: DOMCache,
): number {
  // Instance-aware cache key: ${instanceId}-${canvasId}-h
  // Fallback to ${canvasId}-h for backward compatibility if no instanceId
  const cacheKey = config?.instanceId
    ? `${config.instanceId}-${canvasId}-h`
    : `${canvasId}-h`;

  if (!forceRecalc && gridSizeCache.has(cacheKey)) {
    return gridSizeCache.get(cacheKey)!;
  }

  // Use DOM cache instance if provided, otherwise create temporary instance
  const cache = domCacheInstance || new DOMCache();
  const container = cache.getCanvas(canvasId);
  if (!container) {
    console.warn(`Canvas container not found: ${canvasId}`);
    return 0;
  }

  // Get grid size percent from config or use default
  // Config gridSizePercent is whole number (2 = 2%), default is already decimal (0.02)
  const gridSizePercent = config?.gridSizePercent
    ? config.gridSizePercent / 100
    : GRID_SIZE_HORIZONTAL_PERCENT;

  // Calculate raw grid size
  const rawSize = container.clientWidth * gridSizePercent;

  // Apply min/max constraints from config or use defaults
  const minSize = config?.minGridSize ?? DEFAULT_MIN_GRID_SIZE;
  const maxSize = config?.maxGridSize ?? DEFAULT_MAX_GRID_SIZE;
  const size = Math.max(minSize, Math.min(maxSize, rawSize));

  // Don't cache if container not laid out yet (prevents caching 0-width or tiny containers)
  // Critical for initial load: canvas element exists in DOM but CSS layout hasn't happened yet
  // ResizeObserver will fire when layout completes, then we'll cache the correct value
  if (container.clientWidth > 100) {
    gridSizeCache.set(cacheKey, size);
  }

  return size;
}

/**
 * Get the vertical grid size
 *
 * **Configurable vertical grid**:
 * Unlike horizontal grid, vertical uses fixed sizing (default 20px) because:
 * - Vertical scrolling is infinite (no container height limit)
 * - Provides predictable, consistent heights across all viewports
 * - Simplifies calculations (no container dependency)
 * - Better UX for vertical spacing
 * @param config Optional GridConfig with verticalGridSize
 * @returns Vertical grid size in pixels (config.verticalGridSize || 20)
 * @example
 * ```typescript
 * const vSize = getGridSizeVertical(); // → 20 (default)
 * const vSize2 = getGridSizeVertical({ verticalGridSize: 25 }); // → 25
 * ```
 */
export function getGridSizeVertical(config?: GridConfig): number {
  return config?.verticalGridSize ?? GRID_SIZE_VERTICAL;
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
 * @param gridUnits - Number of grid units
 * @param canvasId - Canvas ID for responsive grid size calculation
 * @param config - Optional GridConfig for customization
 * @returns Pixel value
 * @example
 * ```typescript
 * // Item at grid position x=10 (default 2% grid)
 * const leftPx = gridToPixelsX(10, 'canvas1'); // → 200px (at 1000px container)
 *
 * // Item with grid width=15 (custom 3% grid)
 * const widthPx = gridToPixelsX(15, 'canvas1', { gridSizePercent: 3 }); // → 450px
 * ```
 */
export function gridToPixelsX(
  gridUnits: number,
  canvasId: string,
  config?: GridConfig,
): number {
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
 * **Configurable vertical grid**:
 * Uses config.verticalGridSize (default 20px) for calculation
 * @param gridUnits - Number of grid units
 * @param config - Optional GridConfig with verticalGridSize
 * @returns Pixel value (gridUnits * verticalGridSize)
 * @example
 * ```typescript
 * // Item at grid position y=5 (default 20px)
 * const topPx = gridToPixelsY(5); // → 100px
 *
 * // Item with grid height=8 (custom 25px)
 * const heightPx = gridToPixelsY(8, { verticalGridSize: 25 }); // → 200px
 * ```
 */
export function gridToPixelsY(gridUnits: number, config?: GridConfig): number {
  return gridUnits * getGridSizeVertical(config);
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
 * @param pixels - Pixel value to convert
 * @param canvasId - Canvas ID for responsive grid size calculation
 * @param config - Optional GridConfig for customization
 * @returns Number of grid units (rounded)
 * @example
 * ```typescript
 * // Mouse drop at 250px (default 2% grid)
 * const gridX = pixelsToGridX(250, 'canvas1'); // → 13 (at 1000px container)
 *
 * // After drag, element at 371px (custom 3% grid)
 * const snappedX = pixelsToGridX(371, 'canvas1', { gridSizePercent: 3 }); // → 12
 * ```
 */
export function pixelsToGridX(
  pixels: number,
  canvasId: string,
  config?: GridConfig,
): number {
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
 * @param pixels - Pixel value to convert
 * @param config - Optional GridConfig with verticalGridSize
 * @returns Number of grid units (rounded)
 * @example
 * ```typescript
 * // Mouse at 127px vertically (default 20px grid)
 * const gridY = pixelsToGridY(127); // → 6 (rounded from 6.35)
 *
 * // Element height 165px (custom 25px grid)
 * const gridHeight = pixelsToGridY(165, { verticalGridSize: 25 }); // → 7 (rounded from 6.6)
 * ```
 */
export function pixelsToGridY(pixels: number, config?: GridConfig): number {
  return Math.round(pixels / getGridSizeVertical(config));
}
