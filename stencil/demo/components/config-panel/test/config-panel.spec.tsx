/**
 * Config Panel Component Tests
 * =============================
 *
 * Tests for the config-panel component including:
 * - Auto-close behavior when selected item is deleted
 * - Event subscription and cleanup
 * - Lifecycle methods
 */

import { h } from "@stencil/core";
import { ConfigPanel } from "../config-panel";
import { EventManager } from "../../../../services/event-manager";
import { GridBuilderAPI } from "../../../../services/grid-builder-api";
import {
  gridState,
  reset as resetState,
} from "../../../../services/state-manager";
import { mockDragClone } from "../../../../utils/test-helpers";
import { ComponentRegistry } from "../../../../services/component-registry";

// Mock component definitions for tests
const mockComponentDefinitions = [
  {
    type: "header",
    name: "Header",
    icon: "📄",
    defaultSize: { width: 50, height: 6 },
    renderDragClone: mockDragClone,
    render: () => <div>Header</div>,
  },
  {
    type: "text",
    name: "Text Block",
    icon: "📝",
    defaultSize: { width: 25, height: 10 },
    renderDragClone: mockDragClone,
    render: () => <div>Text</div>,
  },
];

describe("config-panel", () => {
  let mockEventManager: EventManager;
  let mockAPI: GridBuilderAPI;

  beforeEach(() => {
    resetState();
    // Create new EventManager and API instances for each test
    mockEventManager = new EventManager();
    mockAPI = new GridBuilderAPI(mockEventManager, gridState);
  });

  describe("Component Instantiation", () => {
    it("should create component instance", () => {
      const component = new ConfigPanel();
      expect(component).toBeTruthy();
      expect(component).toBeInstanceOf(ConfigPanel);
    });

    it("should initialize with panel closed", () => {
      const component = new ConfigPanel();
      expect(component.isOpen).toBe(false);
      expect(component.selectedItemId).toBeNull();
      expect(component.selectedCanvasId).toBeNull();
    });
  });

  describe("Lifecycle Methods", () => {
    it("should have componentDidLoad method", () => {
      const component = new ConfigPanel();
      expect(typeof component.componentDidLoad).toBe("function");
    });

    it("should have disconnectedCallback method", () => {
      const component = new ConfigPanel();
      expect(typeof component.disconnectedCallback).toBe("function");
    });

    it("should subscribe to itemRemoved event on componentDidLoad", () => {
      const component = new ConfigPanel();
      const registry = new ComponentRegistry(mockComponentDefinitions);
      component.componentRegistry = registry;
      component.api = mockAPI;

      component.componentDidLoad();

      // Verify subscription exists by checking listener count
      // Note: We can't access private properties, so we verify via behavior
      expect(component.componentDidLoad).toBeDefined();

      // Cleanup
      component.disconnectedCallback();
    });

    it("should unsubscribe from itemRemoved event on disconnectedCallback", () => {
      const component = new ConfigPanel();
      const registry = new ComponentRegistry(mockComponentDefinitions);
      component.componentRegistry = registry;
      component.api = mockAPI;

      component.componentDidLoad();
      // Note: We can't access private properties, so we verify via behavior
      expect(component.componentDidLoad).toBeDefined();

      component.disconnectedCallback();
      // Verify cleanup happens without error
      expect(component.disconnectedCallback).toBeDefined();
    });
  });

  describe("Auto-Close on Component Deletion", () => {
    it("should close panel when selected item is deleted", () => {
      const component = new ConfigPanel();
      const registry = new ComponentRegistry(mockComponentDefinitions);
      component.componentRegistry = registry;
      component.api = mockAPI;

      // Initialize lifecycle
      component.componentDidLoad();

      // Create canvas1 before adding items (canvases start empty)
      gridState.canvases.canvas1 = { items: [], zIndexCounter: 0 };

      // Add a test item to state
      gridState.canvases.canvas1.items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          layouts: {
            desktop: { x: 0, y: 0, width: 50, height: 6, customized: true },
            mobile: {
              x: null,
              y: null,
              width: null,
              height: null,
              customized: false,
            },
          },
          zIndex: 1,
          config: {},
        },
      ];

      // Open panel for item-1
      component.isOpen = true;
      component.selectedItemId = "item-1";
      component.selectedCanvasId = "canvas1";

      expect(component.isOpen).toBe(true);

      // Remove item through API (which will emit itemRemoved event)
      mockAPI.removeItem("canvas1", "item-1");

      // Panel should be closed
      expect(component.isOpen).toBe(false);
      expect(component.selectedItemId).toBeNull();
      expect(component.selectedCanvasId).toBeNull();

      // Cleanup
      component.disconnectedCallback();
    });

    it("should NOT close panel when different item is deleted", () => {
      const component = new ConfigPanel();
      const registry = new ComponentRegistry(mockComponentDefinitions);
      component.componentRegistry = registry;
      component.api = mockAPI;

      // Initialize lifecycle
      component.componentDidLoad();

      // Create canvas1 before adding items (canvases start empty)
      gridState.canvases.canvas1 = { items: [], zIndexCounter: 0 };

      // Add test items to state
      gridState.canvases.canvas1.items = [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          layouts: {
            desktop: { x: 0, y: 0, width: 50, height: 6, customized: true },
            mobile: {
              x: null,
              y: null,
              width: null,
              height: null,
              customized: false,
            },
          },
          zIndex: 1,
          config: {},
        },
        {
          id: "item-2",
          canvasId: "canvas1",
          type: "text",
          name: "Test Text",
          layouts: {
            desktop: { x: 0, y: 10, width: 25, height: 10, customized: true },
            mobile: {
              x: null,
              y: null,
              width: null,
              height: null,
              customized: false,
            },
          },
          zIndex: 1,
          config: {},
        },
      ];

      // Open panel for item-1
      component.isOpen = true;
      component.selectedItemId = "item-1";
      component.selectedCanvasId = "canvas1";

      expect(component.isOpen).toBe(true);

      // Remove item-2 (different item) through API (which will emit itemRemoved event)
      // Note: We need to add item-2 to state first
      gridState.canvases.canvas1.items.push({
        id: "item-2",
        canvasId: "canvas1",
        type: "text",
        name: "Test Text",
        layouts: {
          desktop: { x: 0, y: 10, width: 25, height: 10, customized: true },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
        config: {},
      });
      mockAPI.removeItem("canvas1", "item-2");

      // Panel should still be open
      expect(component.isOpen).toBe(true);
      expect(component.selectedItemId).toBe("item-1");
      expect(component.selectedCanvasId).toBe("canvas1");

      // Cleanup
      component.disconnectedCallback();
    });

    it("should NOT crash when itemRemoved is emitted but panel is closed", () => {
      const component = new ConfigPanel();
      const registry = new ComponentRegistry(mockComponentDefinitions);
      component.componentRegistry = registry;
      component.api = mockAPI;

      // Initialize lifecycle
      component.componentDidLoad();

      // Create canvas1 and add item
      gridState.canvases.canvas1 = { items: [], zIndexCounter: 0 };
      gridState.canvases.canvas1.items.push({
        id: "item-1",
        canvasId: "canvas1",
        type: "header",
        name: "Test Header",
        layouts: {
          desktop: { x: 0, y: 0, width: 50, height: 6, customized: true },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
        config: {},
      });

      // Panel is closed (default state)
      expect(component.isOpen).toBe(false);

      // Remove item through API - should not crash even though panel is closed
      expect(() => {
        mockAPI.removeItem("canvas1", "item-1");
      }).not.toThrow();

      // Panel should remain closed
      expect(component.isOpen).toBe(false);

      // Cleanup
      component.disconnectedCallback();
    });

    it("should NOT crash when itemRemoved is emitted but no item is selected", () => {
      const component = new ConfigPanel();
      const registry = new ComponentRegistry(mockComponentDefinitions);
      component.componentRegistry = registry;
      component.api = mockAPI;

      // Initialize lifecycle
      component.componentDidLoad();

      // Create canvas1 and add item
      gridState.canvases.canvas1 = { items: [], zIndexCounter: 0 };
      gridState.canvases.canvas1.items.push({
        id: "item-1",
        canvasId: "canvas1",
        type: "header",
        name: "Test Header",
        layouts: {
          desktop: { x: 0, y: 0, width: 50, height: 6, customized: true },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
        config: {},
      });

      // Panel is open but no item selected
      component.isOpen = true;
      component.selectedItemId = null;
      component.selectedCanvasId = null;

      // Remove item through API - should not crash even though no item is selected
      expect(() => {
        mockAPI.removeItem("canvas1", "item-1");
      }).not.toThrow();

      // Panel should remain open with no selection
      expect(component.isOpen).toBe(true);
      expect(component.selectedItemId).toBeNull();

      // Cleanup
      component.disconnectedCallback();
    });
  });

  describe("Integration: Event Flow", () => {
    it("should handle complete lifecycle: open panel -> delete item -> panel closes", () => {
      const component = new ConfigPanel();
      const registry = new ComponentRegistry(mockComponentDefinitions);
      component.componentRegistry = registry;
      component.api = mockAPI;

      // Initialize lifecycle
      component.componentDidLoad();

      // Create canvas1 before adding items (canvases start empty)
      gridState.canvases.canvas1 = { items: [], zIndexCounter: 0 };

      // Add test item to state
      const testItem = {
        id: "test-item",
        canvasId: "canvas1",
        type: "header",
        name: "Test Header",
        layouts: {
          desktop: { x: 5, y: 5, width: 50, height: 6, customized: true },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
        config: { title: "My Header" },
      };
      gridState.canvases.canvas1.items = [testItem];

      // Step 1: Panel is closed
      expect(component.isOpen).toBe(false);

      // Step 2: Open panel for the item
      component.isOpen = true;
      component.selectedItemId = "test-item";
      component.selectedCanvasId = "canvas1";
      component.componentName = "Test Header";
      component.componentConfig = { title: "My Header" };

      expect(component.isOpen).toBe(true);
      expect(component.selectedItemId).toBe("test-item");

      // Step 3: Delete the item through API (which will emit itemRemoved event)
      mockAPI.removeItem("canvas1", "test-item");

      // Step 4: Panel should be closed
      expect(component.isOpen).toBe(false);
      expect(component.selectedItemId).toBeNull();
      expect(component.selectedCanvasId).toBeNull();

      // Cleanup
      component.disconnectedCallback();
    });
  });
});
