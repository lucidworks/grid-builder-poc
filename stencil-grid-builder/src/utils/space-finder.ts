/**
 * Space Finding Utility
 * =====================
 *
 * Collision detection and smart positioning algorithms for finding
 * available space on canvas when adding components via click-to-add.
 *
 * ## Key Algorithms
 *
 * **Collision Detection (AABB)**:
 * - Axis-Aligned Bounding Box collision test
 * - Two rectangles DON'T collide if:
 * - One is completely to the left of the other
 * - One is completely to the right of the other
 * - One is completely above the other
 * - One is completely below the other
 * - If none of these are true, they collide
 *
 * **Smart Space Finding (Hybrid Strategy)**:
 * 1. Empty canvas → center horizontally (x = (50 - width) / 2, y = 2)
 * 2. Try top-left (2, 2) → return if no collision
 * 3. Scan grid top-to-bottom, left-to-right → return first free space
 * 4. No space found → place at bottom (below all items)
 *
 * ## Performance
 *
 * - Collision check: O(1) - constant time comparison
 * - Find free space: O(n × m) where n = items, m = grid scan area
 * - Typical canvas (10 items): ~50-100ms for full grid scan
 * - Early exit optimization: Returns immediately on first free space
 * @module space-finder
 */

import { gridState, GridState } from "../services/state-manager";

/**
 * Canvas width in grid units
 * Canvas is 50 units wide (2% per unit = 100% total)
 */
export const CANVAS_WIDTH_UNITS = 50;

/**
 * Maximum Y coordinate to scan for free space
 * Prevents infinite loops - canvas will auto-expand if needed
 */
const MAX_SCAN_Y = 200;

/**
 * Default top margin when placing components
 */
const DEFAULT_TOP_MARGIN = 2;

/**
 * Default left margin when placing components
 */
const DEFAULT_LEFT_MARGIN = 2;

/**
 * Default spacing between components when placing at bottom
 */
const DEFAULT_BOTTOM_SPACING = 2;

/**
 * Check if two grid items collide (overlap)
 *
 * Uses AABB (Axis-Aligned Bounding Box) collision detection.
 * Two rectangles collide if they overlap on both axes.
 *
 * **Algorithm**:
 * - Check if rectangles are completely separated on X axis
 * - Check if rectangles are completely separated on Y axis
 * - If separated on either axis → no collision
 * - Otherwise → collision
 *
 * **Edge cases**:
 * - Touching edges (no gap) is considered NOT colliding
 * - Actual overlap (one pixel or more) is colliding
 *
 * **Examples**:
 * ```typescript
 * // No collision (separated horizontally)
 * checkCollision(
 * { x: 0, y: 0, width: 10, height: 10 },
 * { x: 15, y: 0, width: 10, height: 10 }
 * ); // false
 *
 * // No collision (touching edges)
 * checkCollision(
 * { x: 0, y: 0, width: 10, height: 10 },
 * { x: 10, y: 0, width: 10, height: 10 }
 * ); // false (item1 ends at 10, item2 starts at 10 = touching, not overlapping)
 *
 * // Collision (overlapping)
 * checkCollision(
 * { x: 0, y: 0, width: 10, height: 10 },
 * { x: 5, y: 5, width: 10, height: 10 }
 * ); // true (actual overlap)
 * ```
 * @param item1 - First rectangle (x, y, width, height)
 * @param item2 - Second rectangle (x, y, width, height)
 * @returns true if rectangles overlap, false if separated or just touching
 */
export function checkCollision(
  item1: { x: number; y: number; width: number; height: number },
  item2: { x: number; y: number; width: number; height: number },
): boolean {
  // Check if completely separated horizontally (or just touching)
  if (item1.x + item1.width <= item2.x || item2.x + item2.width <= item1.x) {
    return false;
  }

  // Check if completely separated vertically (or just touching)
  if (item1.y + item1.height <= item2.y || item2.y + item2.height <= item1.y) {
    return false;
  }

  // Not separated on either axis → actual overlap/collision
  return true;
}

/**
 * Get centered horizontal position for component
 *
 * Centers component horizontally on canvas, with top margin.
 * Used for first component on empty canvas.
 *
 * **Formula**: x = (CANVAS_WIDTH_UNITS - width) / 2
 *
 * **Examples**:
 * ```typescript
 * getCenteredPosition(10); // width=10 → x=20 (centered)
 * getCenteredPosition(20); // width=20 → x=15 (centered)
 * getCenteredPosition(50); // width=50 → x=0 (full width)
 * ```
 * @param width - Component width in grid units
 * @returns Position { x, y } centered horizontally
 */
export function getCenteredPosition(width: number): { x: number; y: number } {
  const x = Math.floor((CANVAS_WIDTH_UNITS - width) / 2);
  return { x, y: DEFAULT_TOP_MARGIN };
}

/**
 * Get position at bottom of canvas (below all items)
 *
 * Places component at canvas bottom with spacing margin.
 * Used as fallback when no free space found in grid scan.
 *
 * **Algorithm**:
 * 1. Find bottommost item (max y + height)
 * 2. Add spacing margin (2 grid units)
 * 3. Return position at left edge (x=0)
 *
 * **Examples**:
 * ```typescript
 * // Canvas with items at y=0-10, y=15-20
 * getBottomPosition('canvas1');
 * // Returns { x: 0, y: 22 } (20 + 2 spacing)
 *
 * // Empty canvas
 * getBottomPosition('canvas1');
 * // Returns { x: 0, y: 0 }
 * ```
 * @param canvasId - Canvas ID to check
 * @param state - Optional state instance (falls back to global gridState)
 * @returns Position { x, y } at canvas bottom
 */
export function getBottomPosition(
  canvasId: string,
  state?: GridState,
): { x: number; y: number } {
  const stateToUse = state || gridState;
  const canvas = stateToUse.canvases[canvasId];

  // Empty canvas → start at top
  if (!canvas || canvas.items.length === 0) {
    return { x: 0, y: 0 };
  }

  // Find bottommost Y coordinate
  const bottomY = Math.max(
    ...canvas.items.map(
      (item) => item.layouts.desktop.y + item.layouts.desktop.height,
    ),
  );

  // Place below with spacing
  return { x: 0, y: bottomY + DEFAULT_BOTTOM_SPACING };
}

/**
 * Find first available free space on canvas for component
 *
 * Uses hybrid strategy:
 * 1. **Empty canvas** → center horizontally
 * 2. **Try top-left** (2, 2) → return if no collision
 * 3. **Scan grid** → top-to-bottom, left-to-right for first free space
 * 4. **Fallback** → place at canvas bottom
 *
 * **Grid Scanning**:
 * - Starts at top-left (0, 0)
 * - Scans row by row (y=0 to MAX_SCAN_Y)
 * - Each row scans left to right (x=0 to CANVAS_WIDTH_UNITS - width)
 * - Returns immediately on first free space (early exit optimization)
 * - Limited to 200 vertical units (canvas auto-expands if needed)
 *
 * **Performance**:
 * - Empty canvas: O(1) - instant return
 * - Top-left free: O(n) - check all items once
 * - Grid scan: O(n × m) - worst case 200 × 50 = 10,000 checks
 * - Each check: O(n) collision tests against all items
 * - Typical (10 items): ~50-100ms for full scan
 * - Early exit: Usually finds space in first few rows
 *
 * **Examples**:
 * ```typescript
 * // Empty canvas → center
 * findFreeSpace('canvas1', 10, 6);
 * // Returns { x: 20, y: 2 } (centered)
 *
 * // Top-left free
 * findFreeSpace('canvas1', 10, 6);
 * // Returns { x: 2, y: 2 } (preferred position)
 *
 * // Top-left occupied, scan finds space at (15, 5)
 * findFreeSpace('canvas1', 10, 6);
 * // Returns { x: 15, y: 5 }
 *
 * // No space found (canvas full)
 * findFreeSpace('canvas1', 10, 6);
 * // Returns { x: 0, y: 25 } (bottom position)
 * ```
 * @param canvasId - Canvas ID to search
 * @param width - Component width in grid units
 * @param height - Component height in grid units
 * @param state - Optional state instance (falls back to global gridState)
 * @returns Position { x, y } or null if canvas doesn't exist
 */
export function findFreeSpace(
  canvasId: string,
  width: number,
  height: number,
  state?: GridState,
): { x: number; y: number } | null {
  const stateToUse = state || gridState;
  const canvas = stateToUse.canvases[canvasId];

  // Canvas doesn't exist
  if (!canvas) {
    return null;
  }

  // Empty canvas → center horizontally
  if (canvas.items.length === 0) {
    return getCenteredPosition(width);
  }

  // Try top-left position (preferred)
  // But only if component fits within canvas bounds at this position
  const fitsAtTopLeft = DEFAULT_LEFT_MARGIN + width <= CANVAS_WIDTH_UNITS;

  if (fitsAtTopLeft) {
    const topLeft = {
      x: DEFAULT_LEFT_MARGIN,
      y: DEFAULT_TOP_MARGIN,
      width,
      height,
    };

    const hasCollisionAtTopLeft = canvas.items.some((item) => {
      return checkCollision(topLeft, item.layouts.desktop);
    });

    if (!hasCollisionAtTopLeft) {
      return { x: DEFAULT_LEFT_MARGIN, y: DEFAULT_TOP_MARGIN };
    }
  }

  // Scan grid for free space (top-to-bottom, left-to-right)
  for (let y = 0; y < MAX_SCAN_Y; y += 1) {
    for (let x = 0; x <= CANVAS_WIDTH_UNITS - width; x += 1) {
      const testPos = { x, y, width, height };

      // Check collision with all existing items
      const collisions = canvas.items.map((item) => {
        const collision = checkCollision(testPos, item.layouts.desktop);
        return { itemId: item.id, itemType: item.type, collision };
      });

      const hasCollision = collisions.some((c) => c.collision);

      // Found free space → return immediately (early exit)
      if (!hasCollision) {
        return { x, y };
      }
    }
  }

  // No free space found → place at bottom (canvas will auto-expand)
  return getBottomPosition(canvasId, stateToUse);
}
