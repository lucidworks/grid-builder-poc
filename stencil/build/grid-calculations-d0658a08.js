/**
 * DOM Cache Utility
 * Cache DOM queries for performance
 *
 * Purpose: Reduce repeated document.getElementById() calls
 * which can be slow when called frequently during drag/resize operations
 */
/**
 * DOM Cache for canvas containers and frequently accessed elements
 */
class DOMCache {
    constructor() {
        this.canvases = new Map();
    }
    /**
     * Get canvas element by ID (cached)
     * Falls back to document.getElementById if not cached
     */
    getCanvas(canvasId) {
        // Check cache first
        if (this.canvases.has(canvasId)) {
            return this.canvases.get(canvasId);
        }
        // Query DOM and cache
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            this.canvases.set(canvasId, canvas);
        }
        return canvas;
    }
    /**
     * Invalidate cache for a specific canvas
     * Call this when canvas is removed or replaced
     */
    invalidate(canvasId) {
        this.canvases.delete(canvasId);
    }
    /**
     * Clear entire cache
     * Call this on major DOM restructuring
     */
    clear() {
        this.canvases.clear();
    }
}
// Export singleton instance
const domCache = new DOMCache();

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
/** Fixed vertical grid size in pixels - provides consistent vertical spacing */
const GRID_SIZE_VERTICAL = 20;
/**
 * Horizontal grid size as percentage of container width
 * 0.02 = 2% = 50 grid units across full width
 */
const GRID_SIZE_HORIZONTAL_PERCENT = 0.02;
/**
 * Grid size cache to avoid repeated DOM queries
 * Key format: `${canvasId}-h` for horizontal grid sizes
 * Cleared on canvas resize events
 */
const gridSizeCache = new Map();
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
function clearGridSizeCache() {
    gridSizeCache.clear();
}
/**
 * Get the horizontal grid size for a specific canvas
 *
 * **Calculation**: `containerWidth * 2%` = size of one horizontal grid unit in pixels
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
 * **Extracting this pattern**:
 * To adapt for your project:
 * 1. Adjust `GRID_SIZE_HORIZONTAL_PERCENT` for different grid densities
 * 2. Consider using viewport width instead of container width for full-page grids
 * 3. Add separate caches for different viewports if needed
 *
 * @param canvasId - The canvas element ID to calculate grid size for
 * @param forceRecalc - Set true to bypass cache and force fresh calculation
 * @returns Size of one horizontal grid unit in pixels
 *
 * @example
 * ```typescript
 * // First call - calculates from DOM
 * const size1 = getGridSizeHorizontal('canvas1'); // → 20 (at 1000px width)
 *
 * // Second call - returns cached value
 * const size2 = getGridSizeHorizontal('canvas1'); // → 20 (no DOM read)
 *
 * // Force recalculation
 * const size3 = getGridSizeHorizontal('canvas1', true); // → recalculates
 * ```
 */
function getGridSizeHorizontal(canvasId, forceRecalc = false) {
    const cacheKey = `${canvasId}-h`;
    if (!forceRecalc && gridSizeCache.has(cacheKey)) {
        return gridSizeCache.get(cacheKey);
    }
    // Use DOM cache instead of getElementById
    const container = domCache.getCanvas(canvasId);
    if (!container) {
        console.warn(`Canvas container not found: ${canvasId}`);
        return 0;
    }
    const size = container.clientWidth * GRID_SIZE_HORIZONTAL_PERCENT;
    gridSizeCache.set(cacheKey, size);
    return size;
}
/**
 * Calculate vertical grid size (fixed 20px)
 */
function getGridSizeVertical() {
    return GRID_SIZE_VERTICAL;
}
/**
 * Convert grid units to pixels for horizontal values (x, width)
 * Uses percentage calculation to match CSS background grid
 */
function gridToPixelsX(gridUnits, canvasId) {
    // Use cached grid size for better performance
    const gridSize = getGridSizeHorizontal(canvasId);
    return Math.round(gridUnits * gridSize);
}
/**
 * Convert grid units to pixels for vertical values (y, height)
 * Uses fixed 20px grid size
 */
function gridToPixelsY(gridUnits) {
    return gridUnits * GRID_SIZE_VERTICAL;
}
/**
 * Convert pixels to grid units for horizontal values (x, width)
 */
function pixelsToGridX(pixels, canvasId) {
    // Use cached grid size for better performance
    const gridSize = getGridSizeHorizontal(canvasId);
    if (gridSize === 0) {
        return 0;
    }
    return Math.round(pixels / gridSize);
}
/**
 * Convert pixels to grid units for vertical values (y, height)
 */
function pixelsToGridY(pixels) {
    return Math.round(pixels / GRID_SIZE_VERTICAL);
}

export { pixelsToGridY as a, gridToPixelsY as b, clearGridSizeCache as c, domCache as d, getGridSizeHorizontal as e, getGridSizeVertical as f, gridToPixelsX as g, pixelsToGridX as p };

//# sourceMappingURL=grid-calculations-d0658a08.js.map