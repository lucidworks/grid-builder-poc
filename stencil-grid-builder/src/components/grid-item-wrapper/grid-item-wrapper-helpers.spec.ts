/**
 * Unit tests for extracted helper methods from grid-item-wrapper.tsx
 *
 * These tests verify the refactored helper methods that were extracted
 * to reduce cyclomatic complexity in render() and handleItemUpdate().
 *
 * Testing Approach:
 * - Tests focus on individual method logic in isolation
 * - Mock minimal dependencies as needed
 * - Verify method behavior without full component lifecycle
 */

import { GridItemWrapper } from "./grid-item-wrapper";
import { DEFAULT_BREAKPOINTS } from "../../services/state-manager";

describe("GridItemWrapper Helper Methods", () => {
  let component: any;
  let mockItem: any;
  let mockState: any;

  beforeEach(() => {
    // Create minimal component instance for testing helper methods
    mockItem = {
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

    mockState = {
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
      breakpoints: DEFAULT_BREAKPOINTS,
    };

    // Create minimal component instance directly (avoid full lifecycle)
    component = new GridItemWrapper();
    component.item = mockItem;
    component.stateInstance = mockState;
    component.viewerMode = false;
  });

  // ============================================================================
  // getViewportAndBreakpoints Tests
  // ============================================================================

  describe("getViewportAndBreakpoints", () => {
    it("should return viewport and breakpoints from state in builder mode", () => {
      component.viewerMode = false;
      component.stateInstance.currentViewport = "mobile";
      component.stateInstance.breakpoints = DEFAULT_BREAKPOINTS;

      const result = component.getViewportAndBreakpoints();

      expect(result.currentViewport).toBe("mobile");
      expect(result.breakpoints).toEqual(DEFAULT_BREAKPOINTS);
    });

    it("should return viewport and breakpoints from props in viewer mode", () => {
      component.viewerMode = true;
      component.currentViewport = "desktop";
      component.breakpoints = DEFAULT_BREAKPOINTS;

      const result = component.getViewportAndBreakpoints();

      expect(result.currentViewport).toBe("desktop");
      expect(result.breakpoints).toEqual(DEFAULT_BREAKPOINTS);
    });

    it("should use default viewport when not provided", () => {
      component.viewerMode = false;
      component.stateInstance.currentViewport = undefined;

      const result = component.getViewportAndBreakpoints();

      expect(result.currentViewport).toBe("desktop");
    });

    it("should use DEFAULT_BREAKPOINTS when not provided", () => {
      component.viewerMode = false;
      component.stateInstance.breakpoints = undefined;

      const result = component.getViewportAndBreakpoints();

      expect(result.breakpoints).toEqual(DEFAULT_BREAKPOINTS);
    });
  });

  // ============================================================================
  // calculateEffectiveLayoutWithStacking Tests
  // ============================================================================

  describe("calculateEffectiveLayoutWithStacking", () => {
    it("should return desktop layout without stacking", () => {
      const result = component.calculateEffectiveLayoutWithStacking(
        "desktop",
        DEFAULT_BREAKPOINTS,
      );

      expect(result.x).toBe(10);
      expect(result.y).toBe(10);
      expect(result.width).toBe(20);
      expect(result.height).toBe(10);
    });

    it("should return mobile layout without stacking when customized", () => {
      component.item.layouts.mobile.customized = true;

      const result = component.calculateEffectiveLayoutWithStacking(
        "mobile",
        DEFAULT_BREAKPOINTS,
      );

      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
      expect(result.width).toBe(15);
      expect(result.height).toBe(8);
    });

    it("should apply auto-stacking for mobile when not customized", () => {
      component.viewerMode = false;
      component.item.layouts.mobile.customized = false;

      const result = component.calculateEffectiveLayoutWithStacking(
        "mobile",
        DEFAULT_BREAKPOINTS,
      );

      // Auto-stacking should produce full-width layout
      expect(result.width).toBeGreaterThan(0);
    });

    it("should use canvasItems prop in viewer mode for stacking", () => {
      component.viewerMode = true;
      component.canvasItems = [mockItem];
      component.item.layouts.mobile.customized = false;

      const result = component.calculateEffectiveLayoutWithStacking(
        "mobile",
        DEFAULT_BREAKPOINTS,
      );

      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // getComponentDisplayInfo Tests
  // ============================================================================

  describe("getComponentDisplayInfo", () => {
    beforeEach(() => {
      component.componentRegistry = {
        get: jest.fn().mockReturnValue({
          icon: "🧪",
          name: "Test Component",
          selectionColor: "#00ff00",
          configSchema: [{ name: "backgroundColor", defaultValue: "#ffffff" }],
        }),
      } as any;
    });

    it("should return component display information from registry", () => {
      const result = component.getComponentDisplayInfo();

      expect(result.icon).toBe("🧪");
      expect(result.displayName).toBe("Test Item");
      expect(result.selectionColor).toBe("#00ff00");
      expect(result.backgroundColor).toBe("#ffffff"); // Uses schema defaultValue
      expect(result.definition).toBeDefined();
    });

    it("should use fallback icon when definition not found", () => {
      component.componentRegistry.get = jest.fn().mockReturnValue(null);

      const result = component.getComponentDisplayInfo();

      expect(result.icon).toBe("?");
    });

    it("should use definition name when item name not provided", () => {
      component.item.name = undefined;

      const result = component.getComponentDisplayInfo();

      expect(result.displayName).toBe("Test Component");
    });

    it("should use item type as fallback for displayName", () => {
      component.item.name = undefined;
      component.componentRegistry.get = jest.fn().mockReturnValue({});

      const result = component.getComponentDisplayInfo();

      expect(result.displayName).toBe("test");
    });

    it("should use theme selectionColor when definition doesn't provide it", () => {
      component.componentRegistry.get = jest.fn().mockReturnValue({});
      component.theme = { selectionColor: "#0000ff" };

      const result = component.getComponentDisplayInfo();

      expect(result.selectionColor).toBe("#0000ff");
    });

    it("should use hardcoded fallback for selectionColor", () => {
      component.componentRegistry.get = jest.fn().mockReturnValue({});
      component.theme = undefined;

      const result = component.getComponentDisplayInfo();

      expect(result.selectionColor).toBe("#f59e0b");
    });

    it("should extract backgroundColor from item config", () => {
      component.item.config = { backgroundColor: "#abcdef" };

      const result = component.getComponentDisplayInfo();

      expect(result.backgroundColor).toBe("#abcdef");
    });

    it("should use schema default for backgroundColor", () => {
      component.item.config = {};

      const result = component.getComponentDisplayInfo();

      expect(result.backgroundColor).toBe("#ffffff");
    });
  });

  // ============================================================================
  // buildItemStyle Tests
  // ============================================================================

  describe("buildItemStyle", () => {
    beforeEach(() => {
      // Mock DOM cache to return a container element
      component.domCacheInstance = {
        getCanvas: jest.fn().mockReturnValue({
          clientWidth: 1000,
          clientHeight: 800,
        }),
        clear: jest.fn(),
      } as any;
    });

    it("should build style object with transform", () => {
      const layout = { x: 10, y: 20, width: 30, height: 40 };

      const result = component.buildItemStyle(layout, "#ff0000", "#00ff00");

      expect(result.transform).toContain("translate(");
      expect(result.transform).toContain("px");
    });

    it("should include width and height in pixels", () => {
      const layout = { x: 10, y: 20, width: 30, height: 40 };

      const result = component.buildItemStyle(layout, "#ff0000", "#00ff00");

      expect(result.width).toContain("px");
      expect(result.height).toContain("px");
    });

    it("should include zIndex as string", () => {
      const layout = { x: 10, y: 20, width: 30, height: 40 };

      const result = component.buildItemStyle(layout, "#ff0000", "#00ff00");

      expect(result.zIndex).toBe("1");
    });

    it("should include CSS custom properties", () => {
      const layout = { x: 10, y: 20, width: 30, height: 40 };

      const result = component.buildItemStyle(layout, "#ff0000", "#00ff00");

      expect(result["--selection-color"]).toBe("#ff0000");
      expect(result["--animation-duration"]).toContain("ms");
    });

    it("should include background color", () => {
      const layout = { x: 10, y: 20, width: 30, height: 40 };

      const result = component.buildItemStyle(layout, "#ff0000", "#00ff00");

      expect(result.background).toBe("#00ff00");
    });

    it("should use default animation duration when not configured", () => {
      component.config = undefined;
      const layout = { x: 10, y: 20, width: 30, height: 40 };

      const result = component.buildItemStyle(layout, "#ff0000", "#00ff00");

      expect(result["--animation-duration"]).toBe("100ms");
    });

    it("should use config animation duration when provided", () => {
      component.config = { animationDuration: 250 };
      const layout = { x: 10, y: 20, width: 30, height: 40 };

      const result = component.buildItemStyle(layout, "#ff0000", "#00ff00");

      expect(result["--animation-duration"]).toBe("250ms");
    });
  });

  // ============================================================================
  // detectOperationType Tests
  // ============================================================================

  describe("detectOperationType", () => {
    let snapshot: any;
    let updatedItem: any;

    beforeEach(() => {
      snapshot = {
        id: "test-item",
        canvasId: "canvas1",
        zIndex: 1,
        layouts: {
          desktop: { x: 10, y: 10, width: 20, height: 10, customized: false },
        },
      };

      updatedItem = {
        id: "test-item",
        canvasId: "canvas1",
        zIndex: 1,
        layouts: {
          desktop: { x: 15, y: 20, width: 20, height: 10, customized: true },
        },
      };
    });

    it("should detect drag when position changed but size unchanged", () => {
      const result = component.detectOperationType(
        snapshot,
        updatedItem,
        "desktop",
      );

      expect(result.isDrag).toBe(true);
      expect(result.isResize).toBe(false);
    });

    it("should detect resize when size changed", () => {
      updatedItem.layouts.desktop.x = 10; // Same position
      updatedItem.layouts.desktop.y = 10;
      updatedItem.layouts.desktop.width = 30; // Changed size

      const result = component.detectOperationType(
        snapshot,
        updatedItem,
        "desktop",
      );

      expect(result.isDrag).toBe(false);
      expect(result.isResize).toBe(true);
    });

    it("should detect resize only when both position and size changed", () => {
      // When both position and size change, it's classified as just resize
      // because resize operations (e.g., from top/left) can also move the item
      updatedItem.layouts.desktop.width = 30; // Changed size

      const result = component.detectOperationType(
        snapshot,
        updatedItem,
        "desktop",
      );

      expect(result.isDrag).toBe(false); // Position change is part of resize
      expect(result.isResize).toBe(true);
    });

    it("should detect drag when canvas changed", () => {
      updatedItem.canvasId = "canvas2";
      updatedItem.layouts.desktop.x = 10; // Same position
      updatedItem.layouts.desktop.y = 10;

      const result = component.detectOperationType(
        snapshot,
        updatedItem,
        "desktop",
      );

      expect(result.isDrag).toBe(true);
      expect(result.isResize).toBe(false);
    });

    it("should detect no operation when nothing changed", () => {
      updatedItem.layouts.desktop.x = 10;
      updatedItem.layouts.desktop.y = 10;

      const result = component.detectOperationType(
        snapshot,
        updatedItem,
        "desktop",
      );

      expect(result.isDrag).toBe(false);
      expect(result.isResize).toBe(false);
    });
  });

  // ============================================================================
  // handleCrossCanvasZIndex Tests
  // ============================================================================

  describe("handleCrossCanvasZIndex", () => {
    let snapshot: any;
    let updatedItem: any;

    beforeEach(() => {
      snapshot = {
        id: "test-item",
        canvasId: "canvas1",
        zIndex: 5,
      };

      updatedItem = {
        id: "test-item",
        canvasId: "canvas1",
        zIndex: 5,
      };

      mockState.canvases.canvas2 = {
        items: [],
        zIndexCounter: 10,
      };
    });

    it("should return same z-index when canvas unchanged", () => {
      const result = component.handleCrossCanvasZIndex(snapshot, updatedItem);

      expect(result.sourceZIndex).toBe(5);
      expect(result.targetZIndex).toBe(5);
      expect(result.sourceIndex).toBe(0);
    });

    it("should assign new z-index when canvas changed", () => {
      updatedItem.canvasId = "canvas2";

      const result = component.handleCrossCanvasZIndex(snapshot, updatedItem);

      expect(result.sourceZIndex).toBe(5);
      expect(result.targetZIndex).toBe(10);
      expect(updatedItem.zIndex).toBe(10);
    });

    it("should increment target canvas zIndexCounter", () => {
      updatedItem.canvasId = "canvas2";
      const initialCounter = mockState.canvases.canvas2.zIndexCounter;

      component.handleCrossCanvasZIndex(snapshot, updatedItem);

      expect(mockState.canvases.canvas2.zIndexCounter).toBe(initialCounter + 1);
    });

    it("should find source item index", () => {
      mockState.canvases.canvas1.items = [
        { id: "other-item" },
        { id: "test-item" },
        { id: "another-item" },
      ];

      const result = component.handleCrossCanvasZIndex(snapshot, updatedItem);

      expect(result.sourceIndex).toBe(1);
    });

    it("should handle missing source canvas gracefully", () => {
      snapshot.canvasId = "nonexistent-canvas";

      const result = component.handleCrossCanvasZIndex(snapshot, updatedItem);

      expect(result.sourceIndex).toBe(0);
      expect(result.sourceZIndex).toBe(5);
    });
  });

  // ============================================================================
  // pushUndoRedoCommand Tests
  // ============================================================================

  describe("pushUndoRedoCommand", () => {
    let snapshot: any;
    let updatedItem: any;
    let mockUndoRedoManager: any;

    beforeEach(() => {
      snapshot = {
        id: "test-item",
        canvasId: "canvas1",
        zIndex: 1,
        layouts: {
          desktop: { x: 10, y: 10, width: 20, height: 10, customized: false },
        },
      };

      updatedItem = {
        id: "test-item",
        canvasId: "canvas1",
        zIndex: 1,
        layouts: {
          desktop: { x: 15, y: 20, width: 20, height: 10, customized: true },
        },
      };

      mockUndoRedoManager = {
        push: jest.fn(),
      };

      component.undoRedoManagerInstance = mockUndoRedoManager;
    });

    it("should push MoveItemCommand for drag operation", () => {
      component.pushUndoRedoCommand(snapshot, updatedItem, 0, 1, 1, false);

      expect(mockUndoRedoManager.push).toHaveBeenCalled();
      const call = mockUndoRedoManager.push.mock.calls[0][0];
      expect(call.constructor.name).toBe("MoveItemCommand");
    });

    it("should include size parameters for resize operation", () => {
      updatedItem.layouts.desktop.width = 30;

      component.pushUndoRedoCommand(snapshot, updatedItem, 0, 1, 1, true);

      expect(mockUndoRedoManager.push).toHaveBeenCalled();
    });

    it("should not push command when undo manager not available", () => {
      component.undoRedoManagerInstance = undefined;

      component.pushUndoRedoCommand(snapshot, updatedItem, 0, 1, 1, false);

      // Should not throw error
      expect(mockUndoRedoManager.push).not.toHaveBeenCalled();
    });

    it("should use current viewport from state", () => {
      mockState.currentViewport = "mobile";
      snapshot.layouts.mobile = { x: 5, y: 5, width: 15, height: 8 };
      updatedItem.layouts.mobile = { x: 10, y: 10, width: 15, height: 8 };

      component.pushUndoRedoCommand(snapshot, updatedItem, 0, 1, 1, false);

      expect(mockUndoRedoManager.push).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // updateItemInState Tests
  // ============================================================================

  describe("updateItemInState", () => {
    let updatedItem: any;

    beforeEach(() => {
      updatedItem = {
        ...mockItem,
        layouts: {
          desktop: { x: 15, y: 20, width: 20, height: 10, customized: true },
        },
      };
    });

    it("should update item in state immutably", () => {
      const originalCanvases = mockState.canvases;

      component.updateItemInState(updatedItem);

      expect(mockState.canvases).not.toBe(originalCanvases);
      expect(mockState.canvases.canvas1.items[0]).toBe(updatedItem);
    });

    it("should preserve other items in canvas", () => {
      mockState.canvases.canvas1.items = [
        mockItem,
        { id: "other-item", canvasId: "canvas1" },
      ];

      component.updateItemInState(updatedItem);

      expect(mockState.canvases.canvas1.items).toHaveLength(2);
      expect(mockState.canvases.canvas1.items[1].id).toBe("other-item");
    });

    it("should handle item not found gracefully", () => {
      component.item.id = "nonexistent-item";

      expect(() => {
        component.updateItemInState(updatedItem);
      }).not.toThrow();
    });

    it("should create new items array", () => {
      const originalItems = mockState.canvases.canvas1.items;

      component.updateItemInState(updatedItem);

      expect(mockState.canvases.canvas1.items).not.toBe(originalItems);
    });
  });

  // ============================================================================
  // emitChangeEvents Tests
  // ============================================================================

  describe("emitChangeEvents", () => {
    let updatedItem: any;
    let mockEventManager: any;

    beforeEach(() => {
      updatedItem = {
        id: "test-item",
        canvasId: "canvas1",
        layouts: {
          desktop: { x: 15, y: 20, width: 20, height: 10 },
        },
      };

      mockEventManager = {
        emit: jest.fn(),
      };

      component.eventManagerInstance = mockEventManager;
    });

    it("should emit componentDragged event when isDrag is true", () => {
      component.emitChangeEvents(updatedItem, "desktop", true, false);

      expect(mockEventManager.emit).toHaveBeenCalledWith("componentDragged", {
        itemId: "test-item",
        canvasId: "canvas1",
        position: { x: 15, y: 20 },
      });
    });

    it("should emit componentResized event when isResize is true", () => {
      component.emitChangeEvents(updatedItem, "desktop", false, true);

      expect(mockEventManager.emit).toHaveBeenCalledWith("componentResized", {
        itemId: "test-item",
        canvasId: "canvas1",
        size: { width: 20, height: 10 },
      });
    });

    it("should emit both events when both flags are true", () => {
      component.emitChangeEvents(updatedItem, "desktop", true, true);

      expect(mockEventManager.emit).toHaveBeenCalledTimes(2);
      expect(mockEventManager.emit).toHaveBeenCalledWith(
        "componentDragged",
        expect.any(Object),
      );
      expect(mockEventManager.emit).toHaveBeenCalledWith(
        "componentResized",
        expect.any(Object),
      );
    });

    it("should not emit events when both flags are false", () => {
      component.emitChangeEvents(updatedItem, "desktop", false, false);

      expect(mockEventManager.emit).not.toHaveBeenCalled();
    });

    it("should not emit events when event manager not available", () => {
      component.eventManagerInstance = undefined;

      expect(() => {
        component.emitChangeEvents(updatedItem, "desktop", true, true);
      }).not.toThrow();
    });

    it("should use mobile layout when viewport is mobile", () => {
      updatedItem.layouts.mobile = { x: 5, y: 10, width: 15, height: 8 };

      component.emitChangeEvents(updatedItem, "mobile", true, false);

      expect(mockEventManager.emit).toHaveBeenCalledWith("componentDragged", {
        itemId: "test-item",
        canvasId: "canvas1",
        position: { x: 5, y: 10 },
      });
    });
  });
});
