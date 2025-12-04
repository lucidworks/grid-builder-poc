/**
 * Unit tests for extracted helper methods from grid-builder.tsx
 *
 * These tests verify the refactored keyboard and canvas event handler helper methods
 * that were extracted to reduce cyclomatic complexity in componentDidLoad().
 *
 * Testing Approach:
 * - Tests focus on individual method logic in isolation
 * - Mock dependencies and state as needed
 * - Verify method behavior without full component lifecycle
 */

import { GridBuilder } from "./grid-builder";

describe("GridBuilder Helper Methods", () => {
  let component: GridBuilder;

  beforeEach(() => {
    // Create minimal instance for testing helper methods
    component = new GridBuilder();

    // Mock stateManager with minimal required state
    component.stateManager = {
      state: {
        canvases: {},
        selectedItemId: null,
        selectedCanvasId: null,
        currentViewport: "desktop",
      },
      onChange: jest.fn(),
      dispose: jest.fn(),
    } as any;

    // Mock undoRedoManager
    component.undoRedoManager = {
      push: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      canUndo: jest.fn(),
      canRedo: jest.fn(),
      dispose: jest.fn(),
    } as any;

    // Mock eventManagerInstance
    component.eventManagerInstance = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
    } as any;

    // Mock api
    component.api = {
      deleteComponent: jest.fn().mockResolvedValue(true),
      undo: jest.fn(),
      redo: jest.fn(),
    } as any;
  });

  // ============================================================================
  // Keyboard Handler Helper Tests
  // ============================================================================

  describe("Keyboard Handler Helpers", () => {
    describe("isUndoShortcut", () => {
      it("should return true for Ctrl+Z", () => {
        const event = new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
        });
        expect(component.isUndoShortcut(event)).toBe(true);
      });

      it("should return true for Cmd+Z (Mac)", () => {
        const event = new KeyboardEvent("keydown", {
          key: "z",
          metaKey: true,
        });
        expect(component.isUndoShortcut(event)).toBe(true);
      });

      it("should return false for Ctrl+Shift+Z", () => {
        const event = new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          shiftKey: true,
        });
        expect(component.isUndoShortcut(event)).toBe(false);
      });

      it("should return false for just Z key", () => {
        const event = new KeyboardEvent("keydown", {
          key: "z",
        });
        expect(component.isUndoShortcut(event)).toBe(false);
      });
    });

    describe("isRedoShortcut", () => {
      it("should return true for Ctrl+Shift+Z", () => {
        const event = new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          shiftKey: true,
        });
        expect(component.isRedoShortcut(event)).toBe(true);
      });

      it("should return true for Ctrl+Y", () => {
        const event = new KeyboardEvent("keydown", {
          key: "y",
          ctrlKey: true,
        });
        expect(component.isRedoShortcut(event)).toBe(true);
      });

      it("should return true for Cmd+Shift+Z (Mac)", () => {
        const event = new KeyboardEvent("keydown", {
          key: "z",
          metaKey: true,
          shiftKey: true,
        });
        expect(component.isRedoShortcut(event)).toBe(true);
      });

      it("should return false for just Z key", () => {
        const event = new KeyboardEvent("keydown", {
          key: "z",
        });
        expect(component.isRedoShortcut(event)).toBe(false);
      });
    });

    describe("isDeleteKey", () => {
      it("should return true for Delete key", () => {
        const event = new KeyboardEvent("keydown", {
          key: "Delete",
        });
        expect(component.isDeleteKey(event)).toBe(true);
      });

      it("should return true for Backspace key", () => {
        const event = new KeyboardEvent("keydown", {
          key: "Backspace",
        });
        expect(component.isDeleteKey(event)).toBe(true);
      });

      it("should return false for other keys", () => {
        const event = new KeyboardEvent("keydown", {
          key: "a",
        });
        expect(component.isDeleteKey(event)).toBe(false);
      });
    });

    describe("isArrowKey", () => {
      it("should return true for ArrowUp", () => {
        const event = new KeyboardEvent("keydown", {
          key: "ArrowUp",
        });
        expect(component.isArrowKey(event)).toBe(true);
      });

      it("should return true for ArrowDown", () => {
        const event = new KeyboardEvent("keydown", {
          key: "ArrowDown",
        });
        expect(component.isArrowKey(event)).toBe(true);
      });

      it("should return true for ArrowLeft", () => {
        const event = new KeyboardEvent("keydown", {
          key: "ArrowLeft",
        });
        expect(component.isArrowKey(event)).toBe(true);
      });

      it("should return true for ArrowRight", () => {
        const event = new KeyboardEvent("keydown", {
          key: "ArrowRight",
        });
        expect(component.isArrowKey(event)).toBe(true);
      });

      it("should return false for other keys", () => {
        const event = new KeyboardEvent("keydown", {
          key: "a",
        });
        expect(component.isArrowKey(event)).toBe(false);
      });
    });

    describe("hasSelection", () => {
      it("should return true when both itemId and canvasId are set", () => {
        component.stateManager.state.selectedItemId = "item-1";
        component.stateManager.state.selectedCanvasId = "canvas1";

        expect(component.hasSelection()).toBe(true);
      });

      it("should return false when itemId is null", () => {
        component.stateManager.state.selectedItemId = null;
        component.stateManager.state.selectedCanvasId = "canvas1";

        expect(component.hasSelection()).toBe(false);
      });

      it("should return false when canvasId is null", () => {
        component.stateManager.state.selectedItemId = "item-1";
        component.stateManager.state.selectedCanvasId = null;

        expect(component.hasSelection()).toBe(false);
      });

      it("should return false when both are null", () => {
        component.stateManager.state.selectedItemId = null;
        component.stateManager.state.selectedCanvasId = null;

        expect(component.hasSelection()).toBe(false);
      });
    });

    describe("calculateNudgeDelta", () => {
      it("should return correct delta for ArrowUp", () => {
        const result = component.calculateNudgeDelta("ArrowUp");
        expect(result).toEqual({ deltaX: 0, deltaY: -1 });
      });

      it("should return correct delta for ArrowDown", () => {
        const result = component.calculateNudgeDelta("ArrowDown");
        expect(result).toEqual({ deltaX: 0, deltaY: 1 });
      });

      it("should return correct delta for ArrowLeft", () => {
        const result = component.calculateNudgeDelta("ArrowLeft");
        expect(result).toEqual({ deltaX: -1, deltaY: 0 });
      });

      it("should return correct delta for ArrowRight", () => {
        const result = component.calculateNudgeDelta("ArrowRight");
        expect(result).toEqual({ deltaX: 1, deltaY: 0 });
      });

      it("should return zero delta for unknown keys", () => {
        const result = component.calculateNudgeDelta("Enter");
        expect(result).toEqual({ deltaX: 0, deltaY: 0 });
      });
    });

    describe("applyNudgeWithConstraints", () => {
      it("should constrain to left boundary", () => {
        const layout = { x: 0, y: 10, width: 20, height: 10 };
        const delta = { deltaX: -5, deltaY: 0 };

        const result = component.applyNudgeWithConstraints(layout, delta);
        expect(result.x).toBe(0); // Should not go negative
        expect(result.y).toBe(10);
      });

      it("should constrain to top boundary", () => {
        const layout = { x: 10, y: 0, width: 20, height: 10 };
        const delta = { deltaX: 0, deltaY: -5 };

        const result = component.applyNudgeWithConstraints(layout, delta);
        expect(result.x).toBe(10);
        expect(result.y).toBe(0); // Should not go negative
      });

      it("should constrain to right boundary", () => {
        const layout = { x: 90, y: 10, width: 20, height: 10 };
        const delta = { deltaX: 15, deltaY: 0 };

        const result = component.applyNudgeWithConstraints(layout, delta);
        expect(result.x).toBe(80); // maxX = 100 - 20 = 80
        expect(result.y).toBe(10);
      });

      it("should allow movement within boundaries", () => {
        const layout = { x: 50, y: 50, width: 20, height: 10 };
        const delta = { deltaX: 5, deltaY: -3 };

        const result = component.applyNudgeWithConstraints(layout, delta);
        expect(result.x).toBe(55);
        expect(result.y).toBe(47);
      });

      it("should handle zero delta", () => {
        const layout = { x: 50, y: 50, width: 20, height: 10 };
        const delta = { deltaX: 0, deltaY: 0 };

        const result = component.applyNudgeWithConstraints(layout, delta);
        expect(result.x).toBe(50);
        expect(result.y).toBe(50);
      });
    });
  });

  // ============================================================================
  // Canvas Event Handler Helper Tests
  // ============================================================================

  describe("Canvas Event Handler Helpers", () => {
    describe("validateCanvasMoveSource", () => {
      it("should return validation object when canvas and item exist", () => {
        const mockItem = { id: "item-1", canvasId: "canvas1" };
        component.stateManager.state.canvases = {
          canvas1: {
            items: [mockItem],
            zIndexCounter: 1,
          },
        };

        const result = component.validateCanvasMoveSource("canvas1", "item-1");
        expect(result).not.toBeNull();
        expect(result?.item).toBe(mockItem);
        expect(result?.itemIndex).toBe(0);
      });

      it("should return null when canvas does not exist", () => {
        component.stateManager.state.canvases = {};

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        const result = component.validateCanvasMoveSource(
          "nonexistent",
          "item-1",
        );

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          "Source canvas not found:",
          "nonexistent",
        );

        consoleSpy.mockRestore();
      });

      it("should return null when item does not exist in canvas", () => {
        component.stateManager.state.canvases = {
          canvas1: {
            items: [],
            zIndexCounter: 1,
          },
        };

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        const result = component.validateCanvasMoveSource("canvas1", "item-1");

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          "Item not found in source canvas:",
          "item-1",
        );

        consoleSpy.mockRestore();
      });

      it("should find item at correct index", () => {
        const item1 = { id: "item-1", canvasId: "canvas1" };
        const item2 = { id: "item-2", canvasId: "canvas1" };
        const item3 = { id: "item-3", canvasId: "canvas1" };

        component.stateManager.state.canvases = {
          canvas1: {
            items: [item1, item2, item3],
            zIndexCounter: 1,
          },
        };

        const result = component.validateCanvasMoveSource("canvas1", "item-2");
        expect(result?.itemIndex).toBe(1);
        expect(result?.item).toBe(item2);
      });
    });
  });
});
