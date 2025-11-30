import { DragHandler } from "./drag-handler";
import { gridState, reset, setActiveCanvas } from "../services/state-manager";
import { GridItem } from "../services/state-manager";

// Mock interact.js
jest.mock("interactjs", () => {
  const mockInteractable = {
    draggable: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    unset: jest.fn(),
  };

  const interact = jest.fn(() => mockInteractable);
  (interact as any).mockInteractable = mockInteractable;

  return interact;
});

describe("DragHandler - Active Canvas", () => {
  let mockItem: GridItem;
  let mockElement: HTMLElement;
  let onUpdateCallback: jest.Mock;
  let handler: DragHandler;

  beforeEach(() => {
    reset();

    mockItem = {
      id: "item-1",
      canvasId: "canvas1",
      type: "header",
      name: "Header Item",
      layouts: {
        desktop: { x: 1, y: 1, width: 10, height: 6 },
        mobile: { x: 1, y: 1, width: 14, height: 5, customized: false },
      },
      config: {},
      zIndex: 1,
    };

    mockElement = document.createElement("div");
    mockElement.id = "item-1";
    mockElement.style.transform = "translate(20px, 20px)";
    mockElement.style.width = "200px";
    mockElement.style.height = "120px";

    onUpdateCallback = jest.fn();

    // Clear mocks
    const interact = require("interactjs");
    interact.mockClear();
    interact.mockInteractable.draggable.mockClear();
    interact.mockInteractable.on.mockClear();

    // Make interact available on window (drag-handler checks window.interact)
    window.interact = interact;
  });

  afterEach(() => {
    if (handler) {
      handler.destroy();
    }
    // Cleanup window.interact
    delete window.interact;
  });

  describe("Constructor and Initialization", () => {
    it("should create handler with item canvasId", () => {
      handler = new DragHandler(mockElement, mockItem, gridState, onUpdateCallback, {});

      // Handler stores the item's canvasId
      expect((handler as any).item.canvasId).toBe("canvas1");
    });

    it("should work with different canvas IDs", () => {
      const item1 = { ...mockItem, id: "item-1", canvasId: "canvas1" };
      const item2 = { ...mockItem, id: "item-2", canvasId: "canvas2" };
      const item3 = { ...mockItem, id: "item-3", canvasId: "canvas3" };

      const element1 = document.createElement("div");
      element1.id = "item-1";
      element1.style.transform = "translate(0px, 0px)";

      const element2 = document.createElement("div");
      element2.id = "item-2";
      element2.style.transform = "translate(0px, 0px)";

      const element3 = document.createElement("div");
      element3.id = "item-3";
      element3.style.transform = "translate(0px, 0px)";

      const handler1 = new DragHandler(element1, item1, gridState, jest.fn(), {});
      const handler2 = new DragHandler(element2, item2, gridState, jest.fn(), {});
      const handler3 = new DragHandler(element3, item3, gridState, jest.fn(), {});

      expect((handler1 as any).item.canvasId).toBe("canvas1");
      expect((handler2 as any).item.canvasId).toBe("canvas2");
      expect((handler3 as any).item.canvasId).toBe("canvas3");

      handler1.destroy();
      handler2.destroy();
      handler3.destroy();
    });

    it("should register draggable with interact.js", () => {
      const interact = require("interactjs");

      handler = new DragHandler(mockElement, mockItem, gridState, onUpdateCallback, {});

      expect(interact).toHaveBeenCalledWith(mockElement);
      expect(interact.mockInteractable.draggable).toHaveBeenCalled();
    });
  });

  describe("Integration with State Manager", () => {
    it("should use setActiveCanvas function from state-manager", () => {
      // This test verifies the integration point exists
      // Actual behavior is tested in integration tests

      // Set active canvas via state-manager
      setActiveCanvas("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas1");

      // Clear it
      setActiveCanvas("canvas2");
      expect(gridState.activeCanvasId).toBe("canvas2");
    });

    it("should maintain activeCanvasId independent from selectedCanvasId", () => {
      // Set selection
      gridState.selectedItemId = "item-2";
      gridState.selectedCanvasId = "canvas2";

      handler = new DragHandler(mockElement, mockItem, gridState, onUpdateCallback, {});

      // Set active canvas
      setActiveCanvas("canvas1");

      // Both should coexist
      expect(gridState.activeCanvasId).toBe("canvas1");
      expect(gridState.selectedCanvasId).toBe("canvas2");
      expect(gridState.selectedItemId).toBe("item-2");
    });
  });

  describe("Cleanup and Destruction", () => {
    it("should cleanup interact.js on destroy", () => {
      const interact = require("interactjs");

      handler = new DragHandler(mockElement, mockItem, gridState, onUpdateCallback, {});
      handler.destroy();

      expect(interact.mockInteractable.unset).toHaveBeenCalled();
    });

    it("should handle multiple destroy calls", () => {
      handler = new DragHandler(mockElement, mockItem, gridState, onUpdateCallback, {});

      handler.destroy();
      handler.destroy(); // Should not throw

      expect(true).toBe(true); // Test passes if no error thrown
    });
  });

  describe("Configuration Options", () => {
    it("should accept drag handle element", () => {
      const handleElement = document.createElement("div");
      handleElement.className = "drag-handle";

      handler = new DragHandler(
        mockElement,
        mockItem,
        gridState,
        onUpdateCallback,
        {},
        handleElement,
      );

      expect(handler).toBeDefined();
    });

    it("should work without drag handle element", () => {
      handler = new DragHandler(mockElement, mockItem, gridState, onUpdateCallback, {});

      expect(handler).toBeDefined();
    });
  });
});
