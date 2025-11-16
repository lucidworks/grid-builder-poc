/**
 * Grid Calculations Utility
 * Pure functions for grid coordinate conversions
 *
 * Grid System:
 * - Horizontal: 2% responsive grid (50 units across full width)
 * - Vertical: Fixed 20px grid
 */

import { domCache } from './dom-cache';

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
export function getGridSizeVertical(): number {
  return GRID_SIZE_VERTICAL;
}

/**
 * Convert grid units to pixels for horizontal values (x, width)
 * Uses percentage calculation to match CSS background grid
 */
export function gridToPixelsX(gridUnits: number, canvasId: string): number {
  // Use cached grid size for better performance
  const gridSize = getGridSizeHorizontal(canvasId);
  return Math.round(gridUnits * gridSize);
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
export function pixelsToGridY(pixels: number): number {
  return Math.round(pixels / GRID_SIZE_VERTICAL);
}
