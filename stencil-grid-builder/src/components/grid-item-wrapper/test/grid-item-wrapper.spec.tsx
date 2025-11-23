// Mock ResizeObserver BEFORE importing GridItemWrapper
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
import { GridItemWrapper } from "../grid-item-wrapper";
import {
  gridState,
  reset,
  setActiveCanvas,
} from "../../../services/state-manager";
import { domCache } from "../../../utils/dom-cache";
import { mockDragClone } from "../../../utils/test-helpers";

describe("grid-item-wrapper - Active Canvas", () => {
  const mockItem = {
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

  const mockComponentRegistry = new Map([
    [
      "header",
      {
        type: "header",
        name: "Header",
        icon: "📄",
        defaultSize: { width: 10, height: 6 },
        renderDragClone: mockDragClone,
        render: (_item: any) => <div>Header Component</div>,
      },
    ],
  ]);

  beforeEach(() => {
    reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any canvas elements added to global document
    const canvases = document.querySelectorAll(".grid-container");
    canvases.forEach((canvas) => canvas.remove());

    // Clear domCache to prevent stale references
    domCache.clear();
  });

  describe("Canvas Activation on Click", () => {
    it("should call setActiveCanvas when item is clicked", async () => {
      // Add canvas to global document (domCache uses document.getElementById)
      const canvas = document.createElement("div");
      canvas.id = "canvas1";
      canvas.className = "grid-container";
      Object.defineProperty(canvas, "clientWidth", {
        value: 1000,
        configurable: true,
      });
      document.body.appendChild(canvas);

      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Initially no canvas is active
      expect(gridState.activeCanvasId).toBeNull();

      // Click the item
      const itemElement = page.root.querySelector(
        ".grid-item",
      ) as HTMLElement as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Canvas should be activated
      expect(gridState.activeCanvasId).toBe("canvas1");
    });

    it("should activate correct canvas when clicking items on different canvases", async () => {
      // Add canvas elements to global document (domCache uses document.getElementById)
      const canvas1 = document.createElement("div");
      canvas1.id = "canvas1";
      canvas1.className = "grid-container";
      Object.defineProperty(canvas1, "clientWidth", {
        value: 1000,
        configurable: true,
      });
      document.body.appendChild(canvas1);

      const canvas2 = document.createElement("div");
      canvas2.id = "canvas2";
      canvas2.className = "grid-container";
      Object.defineProperty(canvas2, "clientWidth", {
        value: 1000,
        configurable: true,
      });
      document.body.appendChild(canvas2);

      // Create first item with canvas1
      const item1 = JSON.parse(
        JSON.stringify({ ...mockItem, id: "item-1", canvasId: "canvas1" }),
      );
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={item1}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Click item - should activate canvas1
      const itemElement = page.root.querySelector(".grid-item") as HTMLElement;
      expect(itemElement).toBeTruthy();
      itemElement.click();
      await page.waitForChanges();
      expect(gridState.activeCanvasId).toBe("canvas1");

      // Change item to canvas2
      const item2 = JSON.parse(
        JSON.stringify({ ...mockItem, id: "item-2", canvasId: "canvas2" }),
      );
      page.root.item = item2;
      await page.waitForChanges();

      // Click again - should activate canvas2
      const itemElement2 = page.root.querySelector(".grid-item") as HTMLElement;
      expect(itemElement2).toBeTruthy();
      itemElement2.click();
      await page.waitForChanges();
      expect(gridState.activeCanvasId).toBe("canvas2");
    });

    it("should set both active canvas and selection state on click", async () => {
      // Add canvas to global document (domCache uses document.getElementById)
      const canvas = document.createElement("div");
      canvas.id = "canvas1";
      canvas.className = "grid-container";
      Object.defineProperty(canvas, "clientWidth", {
        value: 1000,
        configurable: true,
      });
      document.body.appendChild(canvas);

      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Initially nothing is selected or active
      expect(gridState.activeCanvasId).toBeNull();
      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();

      const itemElement = page.root.querySelector(".grid-item") as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Both active canvas and selection should be set
      expect(gridState.activeCanvasId).toBe("canvas1");
      expect(gridState.selectedItemId).toBe("item-1");
      expect(gridState.selectedCanvasId).toBe("canvas1");
    });

    it("should not activate canvas in viewer mode", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
            viewerMode={true}
          />
        ),
      });

      await page.waitForChanges();

      expect(gridState.activeCanvasId).toBeNull();

      const itemElement = page.root.querySelector(".grid-item") as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Canvas should NOT be activated in viewer mode
      expect(gridState.activeCanvasId).toBeNull();
    });

    it("should activate canvas even when item is already selected", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Select the item first
      gridState.selectedItemId = "item-1";
      gridState.selectedCanvasId = "canvas1";

      // Activate a different canvas
      setActiveCanvas("canvas2");
      expect(gridState.activeCanvasId).toBe("canvas2");

      // Click the item again
      const itemElement = page.root.querySelector(".grid-item") as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Should switch active canvas back to canvas1
      expect(gridState.activeCanvasId).toBe("canvas1");
    });

    it("should not activate canvas when clicking drag handle", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      expect(gridState.activeCanvasId).toBeNull();

      // Try to click drag handle (click should be ignored)
      const dragHandle = page.root.querySelector(".drag-handle") as HTMLElement;
      if (dragHandle) {
        dragHandle.click();
        await page.waitForChanges();
      }

      // Canvas should NOT be activated when clicking control elements
      expect(gridState.activeCanvasId).toBeNull();
    });

    it("should not activate canvas when item was just dragged", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Simulate drag by setting wasDragged flag
      (page.rootInstance as any).wasDragged = true;

      const itemElement = page.root.querySelector(".grid-item") as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // Canvas should NOT be activated if item was just dragged
      expect(gridState.activeCanvasId).toBeNull();
    });
  });

  describe("Canvas Activation with Selection", () => {
    it("should activate canvas and select item in single click", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      expect(gridState.activeCanvasId).toBeNull();
      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();

      const itemElement = page.root.querySelector(".grid-item") as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      // All three should be set
      expect(gridState.activeCanvasId).toBe("canvas1");
      expect(gridState.selectedItemId).toBe("item-1");
      expect(gridState.selectedCanvasId).toBe("canvas1");
    });

    it("should handle rapid canvas switching via item clicks", async () => {
      // Add canvas elements to global document (domCache uses document.getElementById)
      const canvas1 = document.createElement("div");
      canvas1.id = "canvas1";
      canvas1.className = "grid-container";
      Object.defineProperty(canvas1, "clientWidth", {
        value: 1000,
        configurable: true,
      });
      document.body.appendChild(canvas1);

      const canvas2 = document.createElement("div");
      canvas2.id = "canvas2";
      canvas2.className = "grid-container";
      Object.defineProperty(canvas2, "clientWidth", {
        value: 1000,
        configurable: true,
      });
      document.body.appendChild(canvas2);

      const canvas3 = document.createElement("div");
      canvas3.id = "canvas3";
      canvas3.className = "grid-container";
      Object.defineProperty(canvas3, "clientWidth", {
        value: 1000,
        configurable: true,
      });
      document.body.appendChild(canvas3);

      // Use a single page and change the item prop to simulate switching between canvases
      const item1 = JSON.parse(
        JSON.stringify({ ...mockItem, id: "item-1", canvasId: "canvas1" }),
      );
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={item1}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Click item1
      (page.root.querySelector(".grid-item") as HTMLElement)?.click();
      await page.waitForChanges();
      expect(gridState.activeCanvasId).toBe("canvas1");

      // Change to item2 (canvas2)
      page.root.item = JSON.parse(
        JSON.stringify({ ...mockItem, id: "item-2", canvasId: "canvas2" }),
      );
      await page.waitForChanges();
      (page.root.querySelector(".grid-item") as HTMLElement)?.click();
      await page.waitForChanges();
      expect(gridState.activeCanvasId).toBe("canvas2");

      // Change to item3 (canvas3)
      page.root.item = JSON.parse(
        JSON.stringify({ ...mockItem, id: "item-3", canvasId: "canvas3" }),
      );
      await page.waitForChanges();
      (page.root.querySelector(".grid-item") as HTMLElement)?.click();
      await page.waitForChanges();
      expect(gridState.activeCanvasId).toBe("canvas3");

      // Change back to item1
      page.root.item = JSON.parse(
        JSON.stringify({ ...mockItem, id: "item-1", canvasId: "canvas1" }),
      );
      await page.waitForChanges();
      (page.root.querySelector(".grid-item") as HTMLElement)?.click();
      await page.waitForChanges();
      expect(gridState.activeCanvasId).toBe("canvas1");
    });
  });

  describe("Event Emission", () => {
    it("should emit item-click event after setting active canvas", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      const eventSpy = jest.fn();
      page.root.addEventListener("item-click", eventSpy);

      const itemElement = page.root.querySelector(".grid-item") as HTMLElement;
      if (itemElement) {
        itemElement.click();
        await page.waitForChanges();
      }

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail).toEqual({
        itemId: "item-1",
        canvasId: "canvas1",
      });

      // Canvas should also be activated
      expect(gridState.activeCanvasId).toBe("canvas1");
    });
  });

  describe("Virtual Rendering Configuration", () => {
    // Mock virtualRenderer to track calls
    let mockVirtualRendererObserve: jest.SpyInstance;
    let mockVirtualRendererUnobserve: jest.SpyInstance;

    beforeEach(async () => {
      // Dynamically import and mock virtualRenderer
      const virtualRendererModule = await import(
        "../../../services/virtual-renderer"
      );
      mockVirtualRendererObserve = jest
        .spyOn(virtualRendererModule.virtualRenderer, "observe")
        .mockImplementation(() => {});
      mockVirtualRendererUnobserve = jest
        .spyOn(virtualRendererModule.virtualRenderer, "unobserve")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      mockVirtualRendererObserve.mockRestore();
      mockVirtualRendererUnobserve.mockRestore();
    });

    it("should render immediately when enableVirtualRendering is false", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
            config={{ enableVirtualRendering: false }}
          />
        ),
      });

      await page.waitForChanges();

      // Should NOT call virtualRenderer.observe when disabled
      expect(mockVirtualRendererObserve).not.toHaveBeenCalled();

      // Component should be visible immediately
      expect((page.rootInstance as any).isVisible).toBe(true);

      // Should render component content, not placeholder
      const content = page.root.querySelector(".grid-item-content");
      expect(content).toBeTruthy();
      expect(content.textContent).toContain("Header Component");
    });

    it("should use virtual rendering when enableVirtualRendering is true", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
            config={{ enableVirtualRendering: true }}
          />
        ),
      });

      await page.waitForChanges();

      // Should call virtualRenderer.observe when enabled
      expect(mockVirtualRendererObserve).toHaveBeenCalled();
      expect(mockVirtualRendererObserve).toHaveBeenCalledWith(
        expect.any(Object), // itemRef element
        "item-1", // item.id
        expect.any(Function), // callback
      );
    });

    it("should use virtual rendering by default (backward compatibility)", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
            config={{}} // No enableVirtualRendering specified
          />
        ),
      });

      await page.waitForChanges();

      // Should call virtualRenderer.observe when undefined (default behavior)
      expect(mockVirtualRendererObserve).toHaveBeenCalled();
      expect(mockVirtualRendererObserve).toHaveBeenCalledWith(
        expect.any(Object),
        "item-1",
        expect.any(Function),
      );
    });

    it("should use virtual rendering when config is not provided", async () => {
      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
          />
        ),
      });

      await page.waitForChanges();

      // Should call virtualRenderer.observe when config is undefined (default behavior)
      expect(mockVirtualRendererObserve).toHaveBeenCalled();
      expect(mockVirtualRendererObserve).toHaveBeenCalledWith(
        expect.any(Object),
        "item-1",
        expect.any(Function),
      );
    });

    it("should render placeholder when virtual rendering is enabled and not visible", async () => {
      // Mock observe to NOT trigger visibility callback (component stays invisible)
      mockVirtualRendererObserve.mockImplementation(() => {
        // Don't call the visibility callback, leaving isVisible = false
      });

      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
            config={{ enableVirtualRendering: true }}
          />
        ),
      });

      await page.waitForChanges();

      // Should call virtualRenderer.observe
      expect(mockVirtualRendererObserve).toHaveBeenCalled();

      // Component should NOT be visible yet
      expect((page.rootInstance as any).isVisible).toBe(false);

      // Should render placeholder, not actual component
      const content = page.root.querySelector(".grid-item-content");
      expect(content).toBeTruthy();
      const placeholder = content.querySelector(".component-placeholder");
      expect(placeholder).toBeTruthy();
      expect(placeholder.textContent).toContain("Loading...");
    });

    it("should render actual content when virtual rendering makes item visible", async () => {
      let visibilityCallback: (isVisible: boolean) => void;

      // Mock observe to capture the visibility callback
      mockVirtualRendererObserve.mockImplementation((_el, _id, callback) => {
        visibilityCallback = callback;
      });

      const page = await newSpecPage({
        components: [GridItemWrapper],
        template: () => (
          <grid-item-wrapper
            item={mockItem}
            componentRegistry={mockComponentRegistry}
            config={{ enableVirtualRendering: true }}
          />
        ),
      });

      await page.waitForChanges();

      // Initially should show placeholder
      expect((page.rootInstance as any).isVisible).toBe(false);
      let content = page.root.querySelector(".grid-item-content");
      expect(content.querySelector(".component-placeholder")).toBeTruthy();

      // Trigger visibility callback (simulate item entering viewport)
      visibilityCallback(true);
      await page.waitForChanges();

      // Now should render actual component
      expect((page.rootInstance as any).isVisible).toBe(true);
      content = page.root.querySelector(".grid-item-content");
      expect(content.textContent).toContain("Header Component");
      expect(content.querySelector(".component-placeholder")).toBeFalsy();
    });
  });
});
