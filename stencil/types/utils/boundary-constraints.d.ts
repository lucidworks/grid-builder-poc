/**
 * Boundary Constraints Utility
 * =============================
 *
 * Utilities for constraining component placement and sizing within canvas boundaries.
 * Ensures components stay fully within canvas and handles size fitting when needed.
 *
 * ## Problem
 *
 * Components can be placed or dragged such that they extend beyond canvas boundaries:
 * - Dropped from palette outside canvas bounds
 * - Dragged beyond edges
 * - Default size larger than canvas
 *
 * ## Solution
 *
 * Provides constraint functions that:
 * 1. Validate component can fit within canvas (respecting minSize)
 * 2. Adjust size to fit canvas if needed (respecting minSize/maxSize)
 * 3. Constrain position to keep component fully within bounds
 *
 * @module boundary-constraints
 */
import { ComponentDefinition } from '../types/component-definition';
/**
 * Canvas dimensions in grid units
 *
 * **Standard canvas size**:
 * - Width: 50 units (100% width, 2% per unit)
 * - Height: Unlimited (grows with content)
 */
export declare const CANVAS_WIDTH_UNITS = 50;
/**
 * Component size after constraint validation
 */
export interface ConstrainedSize {
    /** Width in grid units (may be adjusted from default) */
    width: number;
    /** Height in grid units (may be adjusted from default) */
    height: number;
    /** Whether size was adjusted to fit */
    wasAdjusted: boolean;
}
/**
 * Component position and size after boundary constraints
 */
export interface ConstrainedPlacement {
    /** X position in grid units */
    x: number;
    /** Y position in grid units */
    y: number;
    /** Width in grid units */
    width: number;
    /** Height in grid units */
    height: number;
    /** Whether position was adjusted */
    positionAdjusted: boolean;
    /** Whether size was adjusted */
    sizeAdjusted: boolean;
}
/**
 * Validate if component can fit within canvas
 *
 * Checks if component's minimum size is smaller than or equal to canvas size.
 * If component's minSize > canvas size, placement should be rejected.
 *
 * @param definition - Component definition with min/max size constraints
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns true if component can fit, false if too large
 *
 * @example
 * ```typescript
 * const hugeComponent = {
 *   type: 'huge-widget',
 *   minSize: { width: 60, height: 10 } // 60 > 50 canvas width
 * };
 *
 * if (!canComponentFitCanvas(hugeComponent)) {
 *   console.warn('Component too large for canvas');
 *   return; // Don't allow placement
 * }
 * ```
 */
export declare function canComponentFitCanvas(definition: ComponentDefinition, canvasWidth?: number): boolean;
/**
 * Constrain component size to fit within canvas
 *
 * Adjusts component size if default size exceeds canvas bounds,
 * while respecting min/max size constraints.
 *
 * **Size adjustment rules**:
 * 1. If defaultSize fits, use it
 * 2. If defaultSize > canvas, shrink to canvas size
 * 3. Never shrink below minSize
 * 4. Never grow beyond maxSize
 *
 * **Width constraint**: Canvas width (50 units)
 * **Height constraint**: None (canvas height grows with content)
 *
 * @param definition - Component definition
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained size and adjustment flag
 *
 * @example
 * ```typescript
 * const wideComponent = {
 *   type: 'banner',
 *   defaultSize: { width: 60, height: 10 }, // Too wide
 *   minSize: { width: 20, height: 5 }
 * };
 *
 * const size = constrainSizeToCanvas(wideComponent);
 * // { width: 50, height: 10, wasAdjusted: true }
 * ```
 */
export declare function constrainSizeToCanvas(definition: ComponentDefinition, canvasWidth?: number): ConstrainedSize;
/**
 * Constrain component position to keep it fully within canvas bounds
 *
 * Adjusts position so component stays completely inside canvas.
 * Snaps to edges if component would extend beyond boundaries.
 *
 * **Boundary rules**:
 * - Left edge: x >= 0
 * - Right edge: x + width <= canvasWidth
 * - Top edge: y >= 0
 * - Bottom edge: No constraint (canvas height grows)
 *
 * @param x - Desired x position in grid units
 * @param y - Desired y position in grid units
 * @param width - Component width in grid units
 * @param height - Component height in grid units
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained placement
 *
 * @example
 * ```typescript
 * // Component would extend beyond right edge
 * const placement = constrainPositionToCanvas(45, 10, 20, 10);
 * // { x: 30, y: 10, width: 20, height: 10, positionAdjusted: true, sizeAdjusted: false }
 * // Adjusted from 45 to 30 so (30 + 20 = 50) stays within canvas
 * ```
 */
export declare function constrainPositionToCanvas(x: number, y: number, width: number, height: number, canvasWidth?: number): ConstrainedPlacement;
/**
 * Apply full boundary constraints to component placement
 *
 * Complete constraint pipeline:
 * 1. Check if component can fit (validate minSize <= canvas)
 * 2. Adjust size to fit canvas (if needed)
 * 3. Constrain position to keep within bounds
 *
 * **Returns null if component cannot fit** (minSize > canvas)
 *
 * @param definition - Component definition
 * @param x - Desired x position in grid units
 * @param y - Desired y position in grid units
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained placement, or null if component too large
 *
 * @example
 * ```typescript
 * const definition = {
 *   type: 'widget',
 *   defaultSize: { width: 60, height: 10 },
 *   minSize: { width: 20, height: 5 }
 * };
 *
 * const placement = applyBoundaryConstraints(definition, 45, 10);
 * // {
 * //   x: 0,              // Adjusted from 45 to fit
 * //   y: 10,             // No Y adjustment needed
 * //   width: 50,         // Shrunk from 60 to fit canvas
 * //   height: 10,        // No height adjustment
 * //   positionAdjusted: true,
 * //   sizeAdjusted: true
 * // }
 * ```
 */
export declare function applyBoundaryConstraints(definition: ComponentDefinition, x: number, y: number, canvasWidth?: number): ConstrainedPlacement | null;
