// Mock ResizeObserver BEFORE importing CanvasSection
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

(global as any).ResizeObserver = jest.fn(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

import { h } from "@stencil/core";
import { newSpecPage } from "@stencil/core/testing";
import { CanvasSection } from "../canvas-section";
import { reset } from "../../../services/state-manager";

// Create mock instances for instance-based architecture
const createMockStateInstance = () => ({
  canvases: {
    canvas1: { items: [], zIndexCounter: 1 },
    canvas2: { items: [], zIndexCounter: 1 },
    canvas3: { items: [], zIndexCounter: 1 },
  },
  activeCanvasId: null,
  showGrid: true,
  currentViewport: "desktop",
  selectedItemId: null,
  selectedCanvasId: null,
});

const createMockVirtualRendererInstance = () => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
});

const createMockUndoRedoManagerInstance = () => ({
  push: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  canUndo: jest.fn(() => false),
  canRedo: jest.fn(() => false),
});

const createMockEventManagerInstance = () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
});

const createMockOnStateChange = () => {
  const callbacks: Record<string, Function[]> = {};
  return jest.fn((key: string, callback: Function) => {
    if (!callbacks[key]) callbacks[key] = [];
    callbacks[key].push(callback);
  });
};

describe("canvas-section - Active Canvas", () => {
  let mockStateInstance: any;
  let mockVirtualRendererInstance: any;
  let mockUndoRedoManagerInstance: any;
  let mockEventManagerInstance: any;
  let mockOnStateChange: any;

  beforeEach(() => {
    reset();
    jest.clearAllMocks();
    mockStateInstance = createMockStateInstance();
    mockVirtualRendererInstance = createMockVirtualRendererInstance();
    mockUndoRedoManagerInstance = createMockUndoRedoManagerInstance();
    mockEventManagerInstance = createMockEventManagerInstance();
    mockOnStateChange = createMockOnStateChange();
  });

  // Helper function to create spec page with instance props
  const createCanvasSectionPage = async (canvasId: string = "canvas1") => {
    const page = await newSpecPage({
      components: [CanvasSection],
      template: () => (
        <canvas-section
          canvasId={canvasId}
          virtualRendererInstance={mockVirtualRendererInstance}
          undoRedoManagerInstance={mockUndoRedoManagerInstance}
          eventManagerInstance={mockEventManagerInstance}
          stateInstance={mockStateInstance}
          onStateChange={mockOnStateChange}
        />
      ),
    });

    return page;
  };

  describe("isActive Prop", () => {
    it("should render with active class when isActive is true", async () => {
      const page = await createCanvasSectionPage("canvas1");

      page.root.isActive = true;
      await page.waitForChanges();

      const gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(true);
    });

    it("should render without active class when isActive is false", async () => {
      const page = await createCanvasSectionPage("canvas1");

      page.root.isActive = false;
      await page.waitForChanges();

      const gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(false);
    });

    it("should default to inactive when isActive prop not provided", async () => {
      const page = await createCanvasSectionPage("canvas1");

      const gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(false);
    });

    it("should update active class when isActive prop changes", async () => {
      const page = await createCanvasSectionPage("canvas1");

      page.root.isActive = false;
      await page.waitForChanges();

      let gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(false);

      page.root.isActive = true;
      await page.waitForChanges();

      gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(true);
    });

    it("should toggle active class multiple times", async () => {
      const page = await createCanvasSectionPage("canvas1");

      // Start inactive
      page.root.isActive = false;
      await page.waitForChanges();
      let gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(false);

      // Activate
      page.root.isActive = true;
      await page.waitForChanges();
      gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(true);

      // Deactivate
      page.root.isActive = false;
      await page.waitForChanges();
      gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(false);

      // Reactivate
      page.root.isActive = true;
      await page.waitForChanges();
      gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(true);
    });
  });

  describe("Canvas Activation Events", () => {
    it("should emit canvas-activated event when canvas background is clicked", async () => {
      const page = await createCanvasSectionPage("canvas1");

      await page.waitForChanges();

      const eventSpy = jest.fn();
      const gridContainer = page.root.querySelector(".grid-container");
      gridContainer.addEventListener("canvas-activated", eventSpy);

      // Click the grid container directly (not a child element)
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: gridContainer,
        enumerable: true,
      });
      gridContainer.dispatchEvent(clickEvent);
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({ canvasId: "canvas1" });
    });

    it("should emit canvas-click event for backward compatibility", async () => {
      const page = await createCanvasSectionPage("canvas1");

      await page.waitForChanges();

      const eventSpy = jest.fn();
      const gridContainer = page.root.querySelector(".grid-container");
      gridContainer.addEventListener("canvas-click", eventSpy);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: gridContainer,
        enumerable: true,
      });
      gridContainer.dispatchEvent(clickEvent);
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({ canvasId: "canvas1" });
    });

    it("should call setActiveCanvas when canvas background is clicked", async () => {
      const page = await createCanvasSectionPage("canvas2");

      await page.waitForChanges();

      expect(mockStateInstance.activeCanvasId).toBeNull();

      const gridContainer = page.root.querySelector(".grid-container");
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: gridContainer,
        enumerable: true,
      });
      gridContainer.dispatchEvent(clickEvent);
      await page.waitForChanges();

      expect(mockStateInstance.activeCanvasId).toBe("canvas2");
    });

    it("should not emit events when clicking on child elements", async () => {
      const page = await createCanvasSectionPage("canvas1");

      await page.waitForChanges();

      const activatedEventSpy = jest.fn();
      const clickEventSpy = jest.fn();
      const gridContainer = page.root.querySelector(".grid-container");
      gridContainer.addEventListener("canvas-activated", activatedEventSpy);
      gridContainer.addEventListener("canvas-click", clickEventSpy);

      // Create a child element
      const childElement = document.createElement("div");
      gridContainer.appendChild(childElement);

      // Click the child element (not the grid container itself)
      // The click will bubble up, but event.target will be the child
      childElement.click();
      await page.waitForChanges();

      expect(activatedEventSpy).not.toHaveBeenCalled();
      expect(clickEventSpy).not.toHaveBeenCalled();
    });

    it("should emit events with correct canvasId for different canvases", async () => {
      const page = await createCanvasSectionPage("canvas1");

      await page.waitForChanges();

      const eventSpy = jest.fn();
      const container = page.root.querySelector(".grid-container");
      container.addEventListener("canvas-activated", eventSpy);

      // Click canvas1 directly
      (container as HTMLElement).click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].detail.canvasId).toBe("canvas1");

      // Change to canvas3
      page.root.canvasId = "canvas3";
      await page.waitForChanges();

      // Click again (same container, just changed canvasId)
      eventSpy.mockClear();
      (container as HTMLElement).click();
      await page.waitForChanges();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].detail.canvasId).toBe("canvas3");
    });
  });

  describe("CSS Classes and Styling", () => {
    it("should always have grid-container class", async () => {
      const page = await createCanvasSectionPage("canvas1");

      const gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("grid-container")).toBe(true);
    });

    it("should combine active class with other classes", async () => {
      const page = await createCanvasSectionPage("canvas1");

      page.root.isActive = true;
      await page.waitForChanges();

      const gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("grid-container")).toBe(true);
      expect(gridContainer.classList.contains("active")).toBe(true);
    });

    it("should maintain other classes when active state changes", async () => {
      // Start with hide-grid class
      mockStateInstance.showGrid = false;

      const page = await createCanvasSectionPage("canvas1");

      let gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("hide-grid")).toBe(true);
      expect(gridContainer.classList.contains("active")).toBe(false);

      // Add active class
      page.root.isActive = true;
      await page.waitForChanges();

      gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("hide-grid")).toBe(true);
      expect(gridContainer.classList.contains("active")).toBe(true);

      // Remove active class
      page.root.isActive = false;
      await page.waitForChanges();

      gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("hide-grid")).toBe(true);
      expect(gridContainer.classList.contains("active")).toBe(false);
    });
  });

  describe("Integration with State", () => {
    it("should update global state when clicked", async () => {
      const page = await createCanvasSectionPage("canvas2");

      await page.waitForChanges();

      // Initially no canvas is active
      expect(mockStateInstance.activeCanvasId).toBeNull();

      // Click the canvas
      const gridContainer = page.root.querySelector(".grid-container");
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: gridContainer,
        enumerable: true,
      });
      gridContainer.dispatchEvent(clickEvent);
      await page.waitForChanges();

      // Canvas2 should now be active in global state
      expect(mockStateInstance.activeCanvasId).toBe("canvas2");
    });

    it("should reflect external state changes via isActive prop", async () => {
      const page = await createCanvasSectionPage("canvas1");

      await page.waitForChanges();

      // External code sets canvas as active
      mockStateInstance.activeCanvasId = "canvas1";

      // Component should be told it's active via prop
      page.root.isActive = true;
      await page.waitForChanges();

      const gridContainer = page.root.querySelector(".grid-container");
      expect(gridContainer.classList.contains("active")).toBe(true);
    });
  });
});
