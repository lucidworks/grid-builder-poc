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
 * Pure functions for grid coordinate conversions
 *
 * Grid System:
 * - Horizontal: 2% responsive grid (50 units across full width)
 * - Vertical: Fixed 20px grid
 */
const GRID_SIZE_VERTICAL = 20; // Fixed 20px vertical grid
const GRID_SIZE_HORIZONTAL_PERCENT = 0.02; // 2% horizontal grid
// Grid size cache - avoid recalculating on every operation
const gridSizeCache = new Map();
/**
 * Clear grid size cache
 * Call this when canvas containers are resized
 */
function clearGridSizeCache() {
    gridSizeCache.clear();
}
/**
 * Calculate horizontal grid size (responsive, based on container width)
 * Uses cache to avoid repeated DOM queries
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

//# sourceMappingURL=grid-calculations-54c868d5.js.map