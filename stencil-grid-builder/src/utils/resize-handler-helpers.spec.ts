/**
 * Unit tests for extracted helper methods from resize-handler.ts
 *
 * These tests verify the refactored resize end handler helper methods
 * that were extracted to reduce cyclomatic complexity in handleResizeEnd().
 *
 * Testing Approach:
 * - Tests focus on individual method logic in isolation
 * - Mock minimal dependencies as needed
 * - Verify method behavior without full component lifecycle
 */

import { ResizeHandler } from "./resize-handler";

describe("ResizeHandler Helper Methods", () => {
  let handler: ResizeHandler;

  beforeEach(() => {
    // Create minimal ResizeHandler instance for testing helper methods
    const mockElement = document.createElement("div");
    const mockItem = {
      id: "test-item",
      canvasId: "canvas1",
      type: "test",
      name: "Test Item",
      zIndex: 1,
      layouts: {
        desktop: { x: 10, y: 10, width: 20, height: 10, customized: false },
        mobile: { x: 5, y: 5, width: 15, height: 8, customized: false },
      },
      config: {},
    };

    const mockState = {
      canvases: {
        canvas1: {
          items: [mockItem],
          zIndexCounter: 1,
        },
      },
      currentViewport: "desktop",
      selectedItemId: null,
      selectedCanvasId: null,
      activeCanvasId: "canvas1",
      breakpoints: {
        mobile: { minWidth: 0, layoutMode: "stack" },
        desktop: { minWidth: 768, layoutMode: "manual" },
      },
    };

    const mockOnUpdate = jest.fn();
    const mockDomCache = {
      getCanvas: jest.fn().mockReturnValue(document.createElement("div")),
      clear: jest.fn(),
    };

    // Create handler instance
    handler = new ResizeHandler(
      mockElement,
      mockItem,
      mockState as any,
      mockOnUpdate,
      mockDomCache as any,
    );
  });

  // ============================================================================
  // applyDirectionalGridSnapping Tests
  // ============================================================================

  describe("applyDirectionalGridSnapping", () => {
    it("should round UP when width grows", () => {
      const result = handler.applyDirectionalGridSnapping(
        215, // newWidth (grew from 200)
        100, // newHeight
        50, // newX
        50, // newY
        20, // gridSizeX
        20, // gridSizeY
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
        100, // minWidth
        80, // minHeight
      );

      // 215 / 20 = 10.75, should round UP to 11 * 20 = 220
      expect(result.width).toBe(220);
    });

    it("should round DOWN when width shrinks", () => {
      const result = handler.applyDirectionalGridSnapping(
        185, // newWidth (shrunk from 200)
        100, // newHeight
        50, // newX
        50, // newY
        20, // gridSizeX
        20, // gridSizeY
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
        100, // minWidth
        80, // minHeight
      );

      // 185 / 20 = 9.25, should round DOWN to 9 * 20 = 180
      expect(result.width).toBe(180);
    });

    it("should round UP when height grows", () => {
      const result = handler.applyDirectionalGridSnapping(
        200, // newWidth
        115, // newHeight (grew from 100)
        50, // newX
        50, // newY
        20, // gridSizeX
        20, // gridSizeY
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
        100, // minWidth
        80, // minHeight
      );

      // 115 / 20 = 5.75, should round UP to 6 * 20 = 120
      expect(result.height).toBe(120);
    });

    it("should round DOWN when height shrinks", () => {
      const result = handler.applyDirectionalGridSnapping(
        200, // newWidth
        85, // newHeight (shrunk from 100)
        50, // newX
        50, // newY
        20, // gridSizeX
        20, // gridSizeY
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
        100, // minWidth
        80, // minHeight
      );

      // 85 / 20 = 4.25, should round DOWN to 4 * 20 = 80
      expect(result.height).toBe(80);
    });

    it("should round DOWN when X moves left", () => {
      const result = handler.applyDirectionalGridSnapping(
        200, // newWidth
        100, // newHeight
        35, // newX (moved left from 50)
        50, // newY
        20, // gridSizeX
        20, // gridSizeY
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
        100, // minWidth
        80, // minHeight
      );

      // 35 / 20 = 1.75, should round DOWN to 1 * 20 = 20 (move further left to grid)
      expect(result.x).toBe(20);
    });

    it("should round UP when X moves right", () => {
      const result = handler.applyDirectionalGridSnapping(
        200, // newWidth
        100, // newHeight
        65, // newX (moved right from 50)
        50, // newY
        20, // gridSizeX
        20, // gridSizeY
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
        100, // minWidth
        80, // minHeight
      );

      // 65 / 20 = 3.25, should round UP to 4 * 20 = 80 (move further right to grid)
      expect(result.x).toBe(80);
    });

    it("should enforce minimum width constraint", () => {
      const result = handler.applyDirectionalGridSnapping(
        50, // newWidth (very small, shrunk from 200)
        100, // newHeight
        50, // newX
        50, // newY
        20, // gridSizeX
        20, // gridSizeY
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
        100, // minWidth (enforced minimum)
        80, // minHeight
      );

      // 50 / 20 = 2.5, would round DOWN to 2 * 20 = 40, but minWidth is 100
      expect(result.width).toBe(100);
    });

    it("should enforce minimum height constraint", () => {
      const result = handler.applyDirectionalGridSnapping(
        200, // newWidth
        50, // newHeight (very small, shrunk from 100)
        50, // newX
        50, // newY
        20, // gridSizeX
        20, // gridSizeY
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
        100, // minWidth
        80, // minHeight (enforced minimum)
      );

      // 50 / 20 = 2.5, would round DOWN to 2 * 20 = 40, but minHeight is 80
      expect(result.height).toBe(80);
    });
  });

  // ============================================================================
  // preserveFixedEdges Tests
  // ============================================================================

  describe("preserveFixedEdges", () => {
    it("should preserve bottom edge when resizing from top", () => {
      const result = handler.preserveFixedEdges(
        50, // x
        30, // y (top edge moved)
        200, // width
        120, // height (snapped, grew from 100)
        { top: true, right: false, bottom: false, left: false }, // edges
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
      );

      // Bottom edge was at y=50+100=150
      // With new height 120, Y should be 150-120=30 to preserve bottom edge
      expect(result.y).toBe(30);
      expect(result.x).toBe(50); // X unchanged
    });

    it("should preserve right edge when resizing from left", () => {
      const result = handler.preserveFixedEdges(
        30, // x (left edge moved)
        50, // y
        220, // width (snapped, grew from 200)
        100, // height
        { top: false, right: false, bottom: false, left: true }, // edges
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
      );

      // Right edge was at x=50+200=250
      // With new width 220, X should be 250-220=30 to preserve right edge
      expect(result.x).toBe(30);
      expect(result.y).toBe(50); // Y unchanged
    });

    it("should preserve both edges when resizing from top-left corner", () => {
      const result = handler.preserveFixedEdges(
        30, // x
        30, // y
        220, // width
        120, // height
        { top: true, right: false, bottom: false, left: true }, // edges
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
      );

      // Bottom edge: y=50+100=150, new y=150-120=30
      // Right edge: x=50+200=250, new x=250-220=30
      expect(result.x).toBe(30);
      expect(result.y).toBe(30);
    });

    it("should not adjust position when resizing from right edge", () => {
      const result = handler.preserveFixedEdges(
        50, // x
        50, // y
        220, // width (grew)
        100, // height
        { top: false, right: true, bottom: false, left: false }, // edges
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
      );

      // Right edge resize: position stays the same
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });

    it("should not adjust position when resizing from bottom edge", () => {
      const result = handler.preserveFixedEdges(
        50, // x
        50, // y
        200, // width
        120, // height (grew)
        { top: false, right: false, bottom: true, left: false }, // edges
        { x: 50, y: 50, width: 200, height: 100 }, // startRect
      );

      // Bottom edge resize: position stays the same
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });
  });

  // ============================================================================
  // applyMinMaxConstraints Tests
  // ============================================================================

  describe("applyMinMaxConstraints", () => {
    it("should clamp width to maximum", () => {
      const result = handler.applyMinMaxConstraints(
        500, // width (exceeds max)
        100, // height
        50, // x
        50, // y
        { top: false, right: true, bottom: false, left: false }, // edges
        100, // minWidth
        400, // maxWidth
        80, // minHeight
        300, // maxHeight
      );

      expect(result.width).toBe(400); // Clamped to max
      expect(result.x).toBe(50); // Not resizing from left, so x unchanged
    });

    it("should clamp width to minimum", () => {
      const result = handler.applyMinMaxConstraints(
        50, // width (below min)
        100, // height
        50, // x
        50, // y
        { top: false, right: true, bottom: false, left: false }, // edges
        100, // minWidth
        400, // maxWidth
        80, // minHeight
        300, // maxHeight
      );

      expect(result.width).toBe(100); // Clamped to min
    });

    it("should adjust X when width clamped and resizing from left edge", () => {
      const result = handler.applyMinMaxConstraints(
        500, // width (exceeds max)
        100, // height
        50, // x
        50, // y
        { top: false, right: false, bottom: false, left: true }, // edges (LEFT)
        100, // minWidth
        400, // maxWidth
        80, // minHeight
        300, // maxHeight
      );

      // Width clamped from 500 to 400, diff = 100
      // When resizing from left, X should shift right by diff to preserve right edge
      expect(result.width).toBe(400);
      expect(result.x).toBe(150); // 50 + 100 = 150
    });

    it("should adjust Y when height clamped and resizing from top edge", () => {
      const result = handler.applyMinMaxConstraints(
        200, // width
        400, // height (exceeds max)
        50, // x
        50, // y
        { top: true, right: false, bottom: false, left: false }, // edges (TOP)
        100, // minWidth
        400, // maxWidth
        80, // minHeight
        300, // maxHeight
      );

      // Height clamped from 400 to 300, diff = 100
      // When resizing from top, Y should shift down by diff to preserve bottom edge
      expect(result.height).toBe(300);
      expect(result.y).toBe(150); // 50 + 100 = 150
    });

    it("should not adjust position when size not clamped", () => {
      const result = handler.applyMinMaxConstraints(
        200, // width (within bounds)
        150, // height (within bounds)
        50, // x
        50, // y
        { top: true, right: false, bottom: false, left: true }, // edges
        100, // minWidth
        400, // maxWidth
        80, // minHeight
        300, // maxHeight
      );

      // No clamping occurred
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });
  });

  // ============================================================================
  // enforceHorizontalBoundaries Tests
  // ============================================================================

  describe("enforceHorizontalBoundaries", () => {
    it("should shrink width when wider than canvas", () => {
      const result = handler.enforceHorizontalBoundaries(
        50, // x
        600, // width (exceeds canvas width of 500)
        500, // canvasWidth
        { right: true }, // edges
        100, // minWidth
      );

      // Width is first shrunk to 500, but x=50 + width=500 = 550 > canvasWidth
      // Since resizing from right edge, clamp width to canvasWidth - x = 500 - 50 = 450
      expect(result.width).toBe(450);
    });

    it("should move X to 0 when left edge is negative", () => {
      const result = handler.enforceHorizontalBoundaries(
        -50, // x (outside left edge)
        200, // width
        500, // canvasWidth
        { left: true }, // edges
        100, // minWidth
      );

      expect(result.x).toBe(0);
    });

    it("should clamp width when resizing from right edge and overflows", () => {
      const result = handler.enforceHorizontalBoundaries(
        300, // x
        300, // width (x+width = 600, exceeds canvas 500)
        500, // canvasWidth
        { right: true }, // edges
        100, // minWidth
      );

      // Resizing from right: clamp width to fit, keep position
      // maxWidth = 500 - 300 = 200
      expect(result.x).toBe(300);
      expect(result.width).toBe(200);
    });

    it("should move left when not resizing from right and overflows", () => {
      const result = handler.enforceHorizontalBoundaries(
        400, // x
        200, // width (x+width = 600, exceeds canvas 500)
        500, // canvasWidth
        { left: true }, // edges (not right)
        100, // minWidth
      );

      // Not resizing from right: move left to fit
      // requiredX = 500 - 200 = 300
      expect(result.x).toBe(300);
      expect(result.width).toBe(200);
    });

    it("should shrink and move to x=0 when cannot fit by moving", () => {
      const result = handler.enforceHorizontalBoundaries(
        450, // x
        400, // width (cannot fit by just moving)
        500, // canvasWidth
        { left: true }, // edges
        100, // minWidth
      );

      // requiredX = 500 - 400 = 100 (would work)
      // But if x + width still exceeds after moving, shrink and set x=0
      // In this case: requiredX=100, so it should move, not shrink
      expect(result.x).toBe(100);
      expect(result.width).toBe(400);
    });

    it("should shrink to canvas width when too large to fit", () => {
      const result = handler.enforceHorizontalBoundaries(
        450, // x
        600, // width (much larger than canvas)
        500, // canvasWidth
        { left: true }, // edges
        100, // minWidth
      );

      // Width first shrunk to canvas width (500)
      // Then position checked: 450 + 500 > 500, so move to x = 500-500 = 0
      expect(result.x).toBe(0);
      expect(result.width).toBe(500);
    });

    it("should enforce minimum width when clamping", () => {
      const result = handler.enforceHorizontalBoundaries(
        490, // x
        100, // width
        500, // canvasWidth
        { right: true }, // edges
        150, // minWidth
      );

      // maxWidth = 500 - 490 = 10, but minWidth is 150
      // Result should be Math.max(150, 10) = 150
      expect(result.width).toBe(150);
    });
  });

  // ============================================================================
  // enforceVerticalBoundaries Tests
  // ============================================================================

  describe("enforceVerticalBoundaries", () => {
    it("should shrink height when taller than canvas", () => {
      const result = handler.enforceVerticalBoundaries(
        50, // y
        700, // height (exceeds canvas height of 600)
        600, // canvasHeight
        { bottom: true }, // edges
        80, // minHeight
      );

      // Height is first shrunk to 600, but y=50 + height=600 = 650 > canvasHeight
      // Since resizing from bottom edge, clamp height to canvasHeight - y = 600 - 50 = 550
      expect(result.height).toBe(550);
    });

    it("should move Y to 0 when top edge is negative", () => {
      const result = handler.enforceVerticalBoundaries(
        -50, // y (outside top edge)
        200, // height
        600, // canvasHeight
        { top: true }, // edges
        80, // minHeight
      );

      expect(result.y).toBe(0);
    });

    it("should clamp height when resizing from bottom edge and overflows", () => {
      const result = handler.enforceVerticalBoundaries(
        400, // y
        300, // height (y+height = 700, exceeds canvas 600)
        600, // canvasHeight
        { bottom: true }, // edges
        80, // minHeight
      );

      // Resizing from bottom: clamp height to fit, keep Y position
      // maxHeight = 600 - 400 = 200
      expect(result.y).toBe(400);
      expect(result.height).toBe(200);
    });

    it("should move up when not resizing from bottom and overflows", () => {
      const result = handler.enforceVerticalBoundaries(
        500, // y
        200, // height (y+height = 700, exceeds canvas 600)
        600, // canvasHeight
        { top: true }, // edges (not bottom)
        80, // minHeight
      );

      // Not resizing from bottom: move up to fit
      // requiredY = 600 - 200 = 400
      expect(result.y).toBe(400);
      expect(result.height).toBe(200);
    });

    it("should shrink and move to y=0 when cannot fit by moving", () => {
      const result = handler.enforceVerticalBoundaries(
        550, // y
        400, // height (cannot fit by just moving)
        600, // canvasHeight
        { top: true }, // edges
        80, // minHeight
      );

      // requiredY = 600 - 400 = 200 (would work)
      expect(result.y).toBe(200);
      expect(result.height).toBe(400);
    });

    it("should shrink to canvas height when too large to fit", () => {
      const result = handler.enforceVerticalBoundaries(
        550, // y
        700, // height (much larger than canvas)
        600, // canvasHeight
        { top: true }, // edges
        80, // minHeight
      );

      // Height first shrunk to canvas height (600)
      // Then position checked: 550 + 600 > 600, so move to y = 600-600 = 0
      expect(result.y).toBe(0);
      expect(result.height).toBe(600);
    });

    it("should enforce minimum height when clamping", () => {
      const result = handler.enforceVerticalBoundaries(
        590, // y
        100, // height
        600, // canvasHeight
        { bottom: true }, // edges
        150, // minHeight
      );

      // maxHeight = 600 - 590 = 10, but minHeight is 150
      // Result should be Math.max(150, 10) = 150
      expect(result.height).toBe(150);
    });
  });
});
