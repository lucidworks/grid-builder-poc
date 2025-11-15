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
const gridSizeCache = new Map<string, number>();

/**
 * Clear grid size cache
 * Call this when canvas containers are resized
 */
export function clearGridSizeCache() {
  gridSizeCache.clear();
}

/**
 * Calculate horizontal grid size (responsive, based on container width)
 * Uses cache to avoid repeated DOM queries
 */
export function getGridSizeHorizontal(canvasId: string, forceRecalc: boolean = false): number {
  const cacheKey = `${canvasId}-h`;

  if (!forceRecalc && gridSizeCache.has(cacheKey)) {
    return gridSizeCache.get(cacheKey)!;
  }

  const container = document.getElementById(canvasId);
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
export function getGridSizeVertical(): number {
  return GRID_SIZE_VERTICAL;
}

/**
 * Convert grid units to pixels for horizontal values (x, width)
 * Uses percentage calculation to match CSS background grid
 */
export function gridToPixelsX(gridUnits: number, canvasId: string): number {
  const container = document.getElementById(canvasId);
  if (!container) {
    console.warn(`Canvas container not found: ${canvasId}`);
    return 0;
  }

  const percentage = gridUnits * GRID_SIZE_HORIZONTAL_PERCENT;
  return Math.round(container.clientWidth * percentage);
}

/**
 * Convert grid units to pixels for vertical values (y, height)
 * Uses fixed 20px grid size
 */
export function gridToPixelsY(gridUnits: number): number {
  return gridUnits * GRID_SIZE_VERTICAL;
}

/**
 * Convert pixels to grid units for horizontal values (x, width)
 */
export function pixelsToGridX(pixels: number, canvasId: string): number {
  const container = document.getElementById(canvasId);
  if (!container) {
    console.warn(`Canvas container not found: ${canvasId}`);
    return 0;
  }

  const percentage = pixels / container.clientWidth;
  return Math.round(percentage / GRID_SIZE_HORIZONTAL_PERCENT);
}

/**
 * Convert pixels to grid units for vertical values (y, height)
 */
export function pixelsToGridY(pixels: number): number {
  return Math.round(pixels / GRID_SIZE_VERTICAL);
}
