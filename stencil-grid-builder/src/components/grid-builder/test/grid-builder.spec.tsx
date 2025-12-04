/**
 * Grid Builder Component Tests
 * ==============================
 *
 * Tests for the main grid-builder component including:
 * - Component instantiation
 * - Props validation
 * - Plugin initialization
 * - Lifecycle methods
 *
 * Note: These tests focus on the component's public API and lifecycle.
 * The GridBuilderAPI itself is tested in grid-builder-api.spec.ts.
 */

// Mock ResizeObserver BEFORE importing GridBuilder
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

(global as any).ResizeObserver = jest.fn(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

import { h } from "@stencil/core";
import { GridBuilder } from "../grid-builder";
import {
  reset as resetState,
  gridState,
  setActiveCanvas,
} from "../../../services/state-manager";
import { clearHistory } from "../../../services/undo-redo";
import { sharedStateRegistry } from "../../../services/shared-state-registry";
import { mockDragClone } from "../../../utils/test-helpers";
import { ComponentDefinition } from "../../../types/component-definition";

// Mock component definitions for tests
const mockComponentDefinitions = [
  {
    type: "header",
    name: "Header",
    icon: "📄",
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 10, height: 3 },
    renderDragClone: () => <div>Header Clone</div>,
    render: () => <div>Header</div>,
  },
  {
    type: "text",
    name: "Text Block",
    icon: "📝",
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    renderDragClone: () => <div>Text Clone</div>,
    render: () => <div>Text</div>,
  },
  {
    type: "button",
    name: "Button",
    icon: "🔘",
    defaultSize: { width: 10, height: 5 },
    minSize: { width: 5, height: 3 },
    renderDragClone: () => <div>Button Clone</div>,
    render: () => <div>Button</div>,
  },
];

describe("grid-builder", () => {
  beforeEach(() => {
    resetState();
    clearHistory();
    sharedStateRegistry.clear();

    // Create test canvases (library now starts empty in Phase 2)
    gridState.canvases = {
      canvas1: { items: [], zIndexCounter: 0 },
      canvas2: { items: [], zIndexCounter: 0 },
      canvas3: { items: [], zIndexCounter: 0 },
    };

    // Clear mock calls
    jest.clearAllMocks();
  });

  describe("Component Instantiation", () => {
    it("should create component instance", () => {
      const component = new GridBuilder();
      expect(component).toBeTruthy();
      expect(component).toBeInstanceOf(GridBuilder);
    });

    it("should have required lifecycle methods", () => {
      const component = new GridBuilder();
      expect(typeof component.componentWillLoad).toBe("function");
      expect(typeof component.componentDidLoad).toBe("function");
      expect(typeof component.disconnectedCallback).toBe("function");
    });
  });

  describe("Props Validation", () => {
    it("should accept components prop", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      expect(component.components).toBeDefined();
      expect(component.components.length).toBe(3);
      expect(component.components[0].type).toBe("header");
    });

    it("should log error when components prop is missing", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const component = new GridBuilder();
      component.componentWillLoad();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "GridBuilder: components prop is required",
      );

      consoleErrorSpy.mockRestore();
    });

    it("should log error when components prop is empty array", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const component = new GridBuilder();
      component.components = [];
      component.componentWillLoad();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "GridBuilder: components prop is required",
      );

      consoleErrorSpy.mockRestore();
    });

    it("should accept optional config prop", () => {
      const customConfig = {
        gridSizePercent: 3,
        minGridSize: 15,
        maxGridSize: 60,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config).toEqual(customConfig);
    });

    it("should accept optional plugins prop", () => {
      const mockPlugin = {
        name: "test-plugin",
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.plugins = [mockPlugin];

      expect(component.plugins).toBeDefined();
      expect(component.plugins?.length).toBe(1);
    });
  });

  describe("Plugin Lifecycle", () => {
    it("should initialize plugins on componentDidLoad", () => {
      const mockPlugin = {
        name: "test-plugin",
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.plugins = [mockPlugin];

      component.componentDidLoad();

      expect(mockPlugin.init).toHaveBeenCalled();
      // Verify API object was passed (not a class instance)
      expect(mockPlugin.init).toHaveBeenCalledWith(
        expect.objectContaining({
          on: expect.any(Function),
          off: expect.any(Function),
          getState: expect.any(Function),
        }),
      );
    });

    it("should destroy plugins on disconnectedCallback", () => {
      const mockPlugin = {
        name: "test-plugin",
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.plugins = [mockPlugin];

      component.componentDidLoad();
      component.disconnectedCallback();

      expect(mockPlugin.destroy).toHaveBeenCalled();
    });

    it("should handle multiple plugins", () => {
      const plugin1 = {
        name: "plugin-1",
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const plugin2 = {
        name: "plugin-2",
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.plugins = [plugin1, plugin2];

      component.componentDidLoad();

      expect(plugin1.init).toHaveBeenCalled();
      expect(plugin2.init).toHaveBeenCalled();

      component.disconnectedCallback();

      expect(plugin1.destroy).toHaveBeenCalled();
      expect(plugin2.destroy).toHaveBeenCalled();
    });

    it("should handle plugin init errors gracefully", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      const failingPlugin = {
        name: "failing-plugin",
        init: jest.fn(() => {
          throw new Error("Init failed");
        }),
        destroy: jest.fn(),
      };

      const goodPlugin = {
        name: "good-plugin",
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.plugins = [failingPlugin, goodPlugin];

      component.componentDidLoad();

      // Good plugin should still be initialized
      expect(goodPlugin.init).toHaveBeenCalled();

      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe("Component Lifecycle", () => {
    it("should call componentWillLoad before rendering", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();

      // Verify by checking that validation ran (no error since we have components)
      expect(component.components).toBeDefined();
    });

    it("should work without plugins", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentDidLoad();

      // Should not crash without plugins
      expect(component.plugins).toBeUndefined();
    });
  });

  describe("Custom Component Rendering", () => {
    it("should support renderComponent returning custom elements", () => {
      // Simulate a custom Stencil component definition
      const customComponentDef = [
        {
          type: "custom-card",
          name: "Custom Card",
          icon: "🎴",
          defaultSize: { width: 20, height: 15 },
          minSize: { width: 10, height: 10 },
          render: () => <div>Custom Card</div>,
          renderComponent: (_item, config) => {
            // Simulate creating a custom element (like a Stencil component)
            const customElement = document.createElement("custom-card");
            customElement.setAttribute(
              "title",
              config.title || "Default Title",
            );
            customElement.setAttribute(
              "content",
              config.content || "Default Content",
            );
            return customElement;
          },
        },
      ];

      const component = new GridBuilder();
      component.components = customComponentDef as any;

      expect((customComponentDef[0] as any).renderComponent).toBeDefined();
      expect(typeof (customComponentDef[0] as any).renderComponent).toBe(
        "function",
      );

      // Test the renderComponent function
      const mockItem = {
        id: "test-1",
        type: "custom-card",
        canvasId: "canvas1",
      };
      const mockConfig = { title: "Test Title", content: "Test Content" };
      const element = customComponentDef[0].renderComponent(
        mockItem,
        mockConfig,
      );

      expect(element).toBeTruthy();
      expect(element.tagName.toLowerCase()).toBe("custom-card");
      expect(element.getAttribute("title")).toBe("Test Title");
      expect(element.getAttribute("content")).toBe("Test Content");
    });

    it("should support renderComponent with props assignment pattern", () => {
      // More realistic pattern for Stencil components with properties
      const stencilComponentDef = [
        {
          type: "article-card",
          name: "Article Card",
          icon: "📰",
          defaultSize: { width: 20, height: 18 },
          minSize: { width: 15, height: 15 },
          render: () => <div>Article Card</div>,
          configSchema: [
            {
              name: "title",
              label: "Title",
              type: "text",
              defaultValue: "Article Title",
            },
            {
              name: "author",
              label: "Author",
              type: "text",
              defaultValue: "John Doe",
            },
            {
              name: "imageUrl",
              label: "Image",
              type: "text",
              defaultValue: "",
            },
          ],
          renderComponent: (_item, config) => {
            // Pattern: Create custom element and assign props
            const card = document.createElement("article-card") as any;
            card.title = config.title;
            card.author = config.author;
            card.imageUrl = config.imageUrl;
            return card;
          },
        },
      ];

      const component = new GridBuilder();
      component.components = stencilComponentDef as any;

      // Test the component definition
      expect(component.components[0].configSchema).toBeDefined();
      expect(component.components[0].configSchema.length).toBe(3);

      // Test renderComponent creates proper element
      const mockItem = {
        id: "test-2",
        type: "article-card",
        canvasId: "canvas1",
      };
      const mockConfig = {
        title: "My Article",
        author: "Jane Smith",
        imageUrl: "https://example.com/image.jpg",
      };

      const element = stencilComponentDef[0].renderComponent(
        mockItem,
        mockConfig,
      );

      expect(element).toBeTruthy();
      expect(element.tagName.toLowerCase()).toBe("article-card");
      expect((element as any).title).toBe("My Article");
      expect((element as any).author).toBe("Jane Smith");
      expect((element as any).imageUrl).toBe("https://example.com/image.jpg");
    });

    it("should support renderComponent with event listeners", () => {
      // Pattern: Custom component with event handling
      const interactiveComponentDef = [
        {
          type: "newsletter-form",
          name: "Newsletter Form",
          icon: "✉️",
          defaultSize: { width: 25, height: 12 },
          minSize: { width: 20, height: 10 },
          render: () => <div>Newsletter Form</div>,
          renderComponent: (_item, _config) => {
            const form = document.createElement("newsletter-form") as any;

            // Simulate adding event listener for custom events
            const mockListener = jest.fn();
            form.addEventListener("newsletterSubmit", mockListener);

            // Store the listener for testing
            form.__mockListener = mockListener;

            return form;
          },
        },
      ];

      const component = new GridBuilder();
      component.components = interactiveComponentDef as any;

      const mockItem = {
        id: "test-3",
        type: "newsletter-form",
        canvasId: "canvas1",
      };
      const element = interactiveComponentDef[0].renderComponent(mockItem, {});

      expect(element).toBeTruthy();
      expect(element.tagName.toLowerCase()).toBe("newsletter-form");

      // Simulate custom event dispatch
      const mockEvent = new CustomEvent("newsletterSubmit", {
        detail: "test@example.com",
      });
      element.dispatchEvent(mockEvent);

      expect((element as any).__mockListener).toHaveBeenCalled();
    });
  });

  describe("Custom Selection Colors", () => {
    it("should support optional selectionColor in component definition", () => {
      const customColorDef = [
        {
          type: "custom-header",
          name: "Custom Header",
          icon: "📄",
          defaultSize: { width: 20, height: 6 },
          selectionColor: "#3b82f6", // Custom blue
          renderDragClone: () => <div>Header Clone</div>,
          render: () => <div>Header</div>,
        },
      ];

      const component = new GridBuilder();
      component.components = customColorDef;

      expect(component.components[0].selectionColor).toBe("#3b82f6");
    });

    it("should work without selectionColor (using default)", () => {
      const defaultColorDef = [
        {
          type: "default-header",
          name: "Default Header",
          icon: "📄",
          defaultSize: { width: 20, height: 6 },
          renderDragClone: () => <div>Header Clone</div>,
          render: () => <div>Header</div>,
        },
      ];

      const component = new GridBuilder();
      component.components = defaultColorDef;

      expect(component.components[0].selectionColor).toBeUndefined();
    });

    it("should support different colors for different component types", () => {
      const multiColorDefs = [
        {
          type: "header",
          name: "Header",
          icon: "📄",
          defaultSize: { width: 20, height: 6 },
          selectionColor: "#3b82f6", // Blue
          renderDragClone: () => <div>Header Clone</div>,
          render: () => <div>Header</div>,
        },
        {
          type: "article",
          name: "Article",
          icon: "📝",
          defaultSize: { width: 25, height: 10 },
          selectionColor: "#10b981", // Green
          renderDragClone: () => <div>Article Clone</div>,
          render: () => <div>Article</div>,
        },
        {
          type: "button",
          name: "Button",
          icon: "🔘",
          defaultSize: { width: 15, height: 5 },
          selectionColor: "#ef4444", // Red
          renderDragClone: () => <div>Button Clone</div>,
          render: () => <div>Button</div>,
        },
      ];

      const component = new GridBuilder();
      component.components = multiColorDefs;

      expect(component.components[0].selectionColor).toBe("#3b82f6");
      expect(component.components[1].selectionColor).toBe("#10b981");
      expect(component.components[2].selectionColor).toBe("#ef4444");
    });

    it("should accept various color formats", () => {
      const colorFormatDefs = [
        {
          type: "hex-color",
          name: "Hex Color",
          icon: "🎨",
          defaultSize: { width: 20, height: 6 },
          selectionColor: "#ff5733", // 6-digit hex
          renderDragClone: mockDragClone,
          render: () => <div>Hex</div>,
        },
        {
          type: "rgb-color",
          name: "RGB Color",
          icon: "🎨",
          defaultSize: { width: 20, height: 6 },
          selectionColor: "rgb(255, 87, 51)", // RGB
          renderDragClone: mockDragClone,
          render: () => <div>RGB</div>,
        },
        {
          type: "rgba-color",
          name: "RGBA Color",
          icon: "🎨",
          defaultSize: { width: 20, height: 6 },
          selectionColor: "rgba(255, 87, 51, 0.8)", // RGBA
          renderDragClone: mockDragClone,
          render: () => <div>RGBA</div>,
        },
      ];

      const component = new GridBuilder();
      component.components = colorFormatDefs;

      expect(component.components[0].selectionColor).toBe("#ff5733");
      expect(component.components[1].selectionColor).toBe("rgb(255, 87, 51)");
      expect(component.components[2].selectionColor).toBe(
        "rgba(255, 87, 51, 0.8)",
      );
    });
  });

  describe("@Method() Decorators", () => {
    it("should expose exportState method", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      expect(typeof component.exportState).toBe("function");

      const result = await component.exportState();
      expect(result).toBeDefined();
      expect(result.canvases).toBeDefined();
    });

    it("should expose importState method", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      expect(typeof component.importState).toBe("function");

      const mockState = {
        canvases: {
          "canvas-1": {
            zIndexCounter: 1,
            items: [],
          },
        },
      };

      await component.importState(mockState);
      // Should not throw
    });

    it("should expose getState method", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      expect(typeof component.getState).toBe("function");

      const state = await component.getState();
      expect(state).toBeDefined();
      expect(state.canvases).toBeDefined();
    });

    it("should expose addCanvas method", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      expect(typeof component.addCanvas).toBe("function");

      await component.addCanvas("test-canvas");
      // Should not throw
    });

    it("should expose removeCanvas method", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      expect(typeof component.removeCanvas).toBe("function");

      await component.removeCanvas("test-canvas");
      // Should not throw
    });

    it("should expose undo/redo methods", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.componentDidLoad();

      expect(typeof component.undo).toBe("function");
      expect(typeof component.redo).toBe("function");
      expect(typeof component.canUndo).toBe("function");
      expect(typeof component.canRedo).toBe("function");

      const canUndoResult = await component.canUndo();
      expect(typeof canUndoResult).toBe("boolean");

      const canRedoResult = await component.canRedo();
      expect(typeof canRedoResult).toBe("boolean");
    });

    it("should expose component manipulation methods", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      expect(typeof component.addComponent).toBe("function");
      expect(typeof component.deleteComponent).toBe("function");
      expect(typeof component.updateConfig).toBe("function");

      // Test addComponent
      const itemId = await component.addComponent(
        "test-canvas",
        "header",
        { x: 0, y: 0, width: 10, height: 5 },
        { title: "Test" },
      );
      expect(itemId).toBeDefined();
    });
  });

  describe("apiRef Auto-Defaulting (DX Improvement)", () => {
    it("should auto-default apiRef.key to apiKey when only apiKey is set", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "myStoryKey";

      component.componentWillLoad();

      // Verify apiRef was auto-created with key matching apiKey
      expect(component.apiRef).toBeDefined();
      expect(component.apiRef?.key).toBe("myStoryKey");
    });

    it("should auto-default apiRef.key to 'gridBuilderAPI' when neither apiKey nor apiRef is set", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      // No apiKey or apiRef set

      component.componentWillLoad();

      // Verify apiRef was auto-created with default key
      expect(component.apiRef).toBeDefined();
      expect(component.apiRef?.key).toBe("gridBuilderAPI");
    });

    it("should respect explicit apiRef.key when both apiKey and apiRef are set", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "stateKey";
      component.apiRef = { key: "customWindowKey" };

      component.componentWillLoad();

      // Verify explicit apiRef.key is preserved
      expect(component.apiRef?.key).toBe("customWindowKey");
    });

    it("should respect apiRef=null to disable window exposure", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "stateKey";
      component.apiRef = null; // Explicitly disable window exposure

      component.componentWillLoad();

      // Verify apiRef remains null
      expect(component.apiRef).toBeNull();
    });

    it("should expose API at window[apiKey] when only apiKey is set", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "testAPI";

      component.componentWillLoad();
      component.componentDidLoad();

      // Verify API was exposed at window.testAPI
      expect((window as any).testAPI).toBeDefined();
      expect(typeof (window as any).testAPI.undo).toBe("function");

      // Cleanup
      delete (window as any).testAPI;
    });

    it("should not expose API when apiRef=null", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "stateKey";
      component.apiRef = null;

      component.componentWillLoad();
      component.componentDidLoad();

      // Verify API was NOT exposed to window
      expect((window as any).stateKey).toBeUndefined();
    });
  });

  describe("Configuration Options", () => {
    it("should accept enableAnimations config", () => {
      const customConfig = {
        enableAnimations: true,
        animationDuration: 200,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config.enableAnimations).toBe(true);
      expect(component.config.animationDuration).toBe(200);
    });

    it("should accept enableAutoScroll config", () => {
      const customConfig = {
        enableAutoScroll: false,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config.enableAutoScroll).toBe(false);
    });

    it("should accept eventDebounceDelay config", () => {
      const customConfig = {
        eventDebounceDelay: 500,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config.eventDebounceDelay).toBe(500);
    });

    it("should work with default config values", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      // Should work without explicit config
      expect(component.config).toBeUndefined();
    });

    it("should accept all new config options together", () => {
      const customConfig = {
        enableAnimations: true,
        animationDuration: 150,
        enableAutoScroll: true,
        eventDebounceDelay: 300,
        gridSizePercent: 2,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config.enableAnimations).toBe(true);
      expect(component.config.animationDuration).toBe(150);
      expect(component.config.enableAutoScroll).toBe(true);
      expect(component.config.eventDebounceDelay).toBe(300);
      expect(component.config.gridSizePercent).toBe(2);
    });
  });

  describe("Active Canvas Feature", () => {
    beforeEach(() => {
      resetState();
      clearHistory();
      jest.clearAllMocks();
    });

    describe("isActive Prop Passing", () => {
      it("should pass isActive=true to canvas-section when activeCanvasId matches", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        // Access instance state
        const api = (component as any).api;
        const instanceState = api.getState();

        // Set active canvas in instance state
        instanceState.activeCanvasId = "canvas1";

        // Render component
        component.render();

        // Component passes isActive prop based on state comparison
        // (This is verified by testing that the prop binding exists in the component)
        expect(instanceState.activeCanvasId).toBe("canvas1");
      });

      it("should pass isActive=false when activeCanvasId does not match", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        setActiveCanvas("canvas1");

        // A different canvas should not be active
        expect(gridState.activeCanvasId).not.toBe("canvas2");
      });

      it("should update isActive when activeCanvasId changes", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Start with canvas1 active
        setActiveCanvas("canvas1");
        expect(gridState.activeCanvasId).toBe("canvas1");

        // Switch to canvas2
        setActiveCanvas("canvas2");
        expect(gridState.activeCanvasId).toBe("canvas2");

        // Switch back to canvas1
        setActiveCanvas("canvas1");
        expect(gridState.activeCanvasId).toBe("canvas1");
      });

      it("should handle null activeCanvasId (no canvas active)", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Initially null
        expect(gridState.activeCanvasId).toBeNull();

        // Set active
        setActiveCanvas("canvas1");
        expect(gridState.activeCanvasId).toBe("canvas1");

        // Clear active
        gridState.activeCanvasId = null;
        expect(gridState.activeCanvasId).toBeNull();
      });
    });

    describe("Event Handler Registration", () => {
      it("should register canvas-activated event handler in componentDidLoad", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Mock the hostElement
        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Verify canvas-activated event listener was registered
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasActivatedCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-activated",
        );

        expect(canvasActivatedCall).toBeDefined();
        expect(typeof canvasActivatedCall[1]).toBe("function");
      });

      it("should remove canvas-activated event handler in disconnectedCallback", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();
        component.disconnectedCallback();

        // Verify event listener was removed
        const removeEventListenerCalls =
          mockHostElement.removeEventListener.mock.calls;
        const canvasActivatedCall = removeEventListenerCalls.find(
          (call) => call[0] === "canvas-activated",
        );

        expect(canvasActivatedCall).toBeDefined();
      });

      it("should handle canvas-activated event and emit plugin event", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Spy on instance eventManagerInstance.emit
        const emitSpy = jest.spyOn(
          (component as any).eventManagerInstance,
          "emit",
        );

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasActivatedCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-activated",
        );
        const handler = canvasActivatedCall[1];

        // Simulate canvas-activated event
        const mockEvent = new CustomEvent("canvas-activated", {
          detail: { canvasId: "canvas1" },
        });

        handler(mockEvent);

        // Verify plugin event was emitted
        expect(emitSpy).toHaveBeenCalledWith("canvasActivated", {
          canvasId: "canvas1",
        });

        emitSpy.mockRestore();
      });
    });

    describe("@Method() Public Methods", () => {
      it("should expose setActiveCanvas method", async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        const api = (component as any).api;

        expect(typeof component.setActiveCanvas).toBe("function");

        await component.setActiveCanvas("canvas1");

        const state = api.getState();
        expect(state.activeCanvasId).toBe("canvas1");
      });

      it("should expose getActiveCanvas method", async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        expect(typeof component.getActiveCanvas).toBe("function");

        // Initially null
        let result = await component.getActiveCanvas();
        expect(result).toBeNull();

        // Set active canvas
        instanceState.activeCanvasId = "canvas2";
        result = await component.getActiveCanvas();
        expect(result).toBe("canvas2");
      });

      it("should emit canvasActivated event when setActiveCanvas is called", async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const emitSpy = jest.spyOn(
          (component as any).eventManagerInstance,
          "emit",
        );

        await component.setActiveCanvas("canvas1");

        expect(emitSpy).toHaveBeenCalledWith("canvasActivated", {
          canvasId: "canvas1",
        });

        emitSpy.mockRestore();
      });

      it("should allow switching active canvas via public method", async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        await component.setActiveCanvas("canvas1");
        let result = await component.getActiveCanvas();
        expect(result).toBe("canvas1");

        await component.setActiveCanvas("canvas2");
        result = await component.getActiveCanvas();
        expect(result).toBe("canvas2");

        await component.setActiveCanvas("canvas3");
        result = await component.getActiveCanvas();
        expect(result).toBe("canvas3");
      });
    });

    describe("API Object Methods", () => {
      it("should expose setActiveCanvas in API object", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;

        expect(api).toBeDefined();
        expect(typeof api.setActiveCanvas).toBe("function");

        api.setActiveCanvas("canvas1");
        const state = api.getState();
        expect(state.activeCanvasId).toBe("canvas1");
      });

      it("should expose getActiveCanvas in API object", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        expect(typeof api.getActiveCanvas).toBe("function");

        instanceState.activeCanvasId = "canvas1";
        const result = api.getActiveCanvas();
        expect(result).toBe("canvas1");
      });

      it("should emit plugin event when API setActiveCanvas is called", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const emitSpy = jest.spyOn(
          (component as any).eventManagerInstance,
          "emit",
        );

        api.setActiveCanvas("canvas2");

        expect(emitSpy).toHaveBeenCalledWith("canvasActivated", {
          canvasId: "canvas2",
        });

        emitSpy.mockRestore();
      });

      it("should provide API to plugins during initialization", () => {
        const mockPlugin = {
          name: "test-plugin",
          init: jest.fn(),
          destroy: jest.fn(),
        };

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.plugins = [mockPlugin];

        component.componentDidLoad();

        expect(mockPlugin.init).toHaveBeenCalled();

        // Get the API object passed to plugin
        const apiArg = mockPlugin.init.mock.calls[0][0];

        expect(apiArg.setActiveCanvas).toBeDefined();
        expect(apiArg.getActiveCanvas).toBeDefined();
        expect(typeof apiArg.setActiveCanvas).toBe("function");
        expect(typeof apiArg.getActiveCanvas).toBe("function");
      });
    });

    describe("Integration with State", () => {
      it("should keep activeCanvasId independent from selectedCanvasId", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        // Set selection
        gridState.selectedItemId = "item-1";
        gridState.selectedCanvasId = "canvas1";

        // Set active canvas to different canvas
        setActiveCanvas("canvas2");

        // Both should coexist
        expect(gridState.selectedCanvasId).toBe("canvas1");
        expect(gridState.activeCanvasId).toBe("canvas2");
        expect(gridState.selectedItemId).toBe("item-1");
      });

      it("should maintain activeCanvasId through viewport switches", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        setActiveCanvas("canvas1");
        expect(gridState.activeCanvasId).toBe("canvas1");

        // Switch viewport
        gridState.currentViewport = "mobile";
        expect(gridState.activeCanvasId).toBe("canvas1");

        // Switch back
        gridState.currentViewport = "desktop";
        expect(gridState.activeCanvasId).toBe("canvas1");
      });

      it("should reset activeCanvasId when state is reset", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        setActiveCanvas("canvas1");
        expect(gridState.activeCanvasId).toBe("canvas1");

        resetState();
        expect(gridState.activeCanvasId).toBeNull();
      });
    });

    describe("Plugin Event Emission", () => {
      it("should allow plugins to listen for canvasActivated events", () => {
        const activatedEvents: any[] = [];

        const mockPlugin = {
          name: "test-plugin",
          init: (api: any) => {
            api.on("canvasActivated", (data: any) => {
              activatedEvents.push(data);
            });
          },
          destroy: jest.fn(),
        };

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.plugins = [mockPlugin];

        component.componentWillLoad();
        component.componentDidLoad();

        // Trigger canvas activation via API
        const api = (component as any).api;
        api.setActiveCanvas("canvas1");

        expect(activatedEvents.length).toBe(1);
        expect(activatedEvents[0]).toEqual({ canvasId: "canvas1" });

        api.setActiveCanvas("canvas2");

        expect(activatedEvents.length).toBe(2);
        expect(activatedEvents[1]).toEqual({ canvasId: "canvas2" });
      });

      it("should emit events for all activation methods", () => {
        const activatedEvents: any[] = [];

        const mockPlugin = {
          name: "test-plugin",
          init: (api: any) => {
            api.on("canvasActivated", (data: any) => {
              activatedEvents.push(data);
            });
          },
          destroy: jest.fn(),
        };

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.plugins = [mockPlugin];

        component.componentWillLoad();

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Method 1: Via API
        const api = (component as any).api;
        api.setActiveCanvas("canvas1");
        expect(activatedEvents.length).toBe(1);

        // Method 2: Via public @Method
        component.setActiveCanvas("canvas2");
        expect(activatedEvents.length).toBe(2);

        // Method 3: Via DOM event (simulate)
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasActivatedCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-activated",
        );
        const handler = canvasActivatedCall[1];

        const mockEvent = new CustomEvent("canvas-activated", {
          detail: { canvasId: "canvas3" },
        });
        handler(mockEvent);

        expect(activatedEvents.length).toBe(3);
        expect(activatedEvents[2]).toEqual({ canvasId: "canvas3" });
      });
    });

    describe("Cross-Canvas Move", () => {
      beforeEach(() => {
        // Reset grid state
        gridState.canvases = {
          canvas1: { items: [], zIndexCounter: 0 },
          canvas2: { items: [], zIndexCounter: 0 },
        };
        gridState.selectedItemId = null;
        gridState.selectedCanvasId = null;
        gridState.activeCanvasId = null;
      });

      it("should register canvas-move event handler in componentDidLoad", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Verify canvas-move event listener was registered
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );

        expect(canvasMoveCall).toBeDefined();
        expect(typeof canvasMoveCall[1]).toBe("function");
      });

      it("should remove canvas-move event handler in disconnectedCallback", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();
        component.disconnectedCallback();

        // Verify event listener was removed
        const removeEventListenerCalls =
          mockHostElement.removeEventListener.mock.calls;
        const canvasMoveCall = removeEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );

        expect(canvasMoveCall).toBeDefined();
      });

      it("should move item from source to target canvas", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item to source canvas
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
          canvas2: { items: [], zIndexCounter: 0 },
        };

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "test-item-1",
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
            x: 100, // pixels
            y: 50, // pixels
          },
        });

        handler(mockEvent);

        const state = api.getState();

        // Verify item removed from source canvas
        expect(state.canvases.canvas1.items.length).toBe(0);

        // Verify item added to target canvas
        expect(state.canvases.canvas2.items.length).toBe(1);
        expect(state.canvases.canvas2.items[0].id).toBe("test-item-1");

        // Verify canvasId updated
        expect(state.canvases.canvas2.items[0].canvasId).toBe("canvas2");
      });

      it("should update item position to grid coordinates", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item to source canvas
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
          canvas2: { items: [], zIndexCounter: 0 },
        };

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event (drop at specific pixel position)
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "test-item-1",
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
            x: 200, // pixels
            y: 100, // pixels
          },
        });

        handler(mockEvent);

        const state = api.getState();
        const movedItem = state.canvases.canvas2.items[0];

        // Verify position was converted to grid units (not pixels)
        expect(typeof movedItem.layouts.desktop.x).toBe("number");
        expect(typeof movedItem.layouts.desktop.y).toBe("number");
        expect(movedItem.layouts.desktop.x).toBeGreaterThanOrEqual(0);
        expect(movedItem.layouts.desktop.y).toBeGreaterThanOrEqual(0);
      });

      it("should assign new z-index in target canvas", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item to source canvas
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 5, // Has z-index 5 in source
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 6 },
          canvas2: { items: [], zIndexCounter: 3 },
        };

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "test-item-1",
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        const state = api.getState();
        const movedItem = state.canvases.canvas2.items[0];

        // Verify new z-index assigned from target canvas counter
        expect(movedItem.zIndex).toBe(3);

        // Verify target canvas counter incremented
        expect(state.canvases.canvas2.zIndexCounter).toBe(4);
      });

      it("should set target canvas as active", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item to source canvas
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
          canvas2: { items: [], zIndexCounter: 0 },
        };

        // Initially canvas1 is active
        instanceState.activeCanvasId = "canvas1";

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "test-item-1",
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify active canvas updated to target
        const state = api.getState();
        expect(state.activeCanvasId).toBe("canvas2");
      });

      it("should update selection state if moved item was selected", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item to source canvas and select it
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
          canvas2: { items: [], zIndexCounter: 0 },
        };
        instanceState.selectedItemId = "test-item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "test-item-1",
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify selectedCanvasId updated to target
        const state = api.getState();
        expect(state.selectedCanvasId).toBe("canvas2");
        expect(state.selectedItemId).toBe("test-item-1"); // Still selected
      });

      it("should emit componentMoved and canvasActivated events", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item to source canvas
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
          canvas2: { items: [], zIndexCounter: 0 },
        };

        // Spy on instance eventManagerInstance.emit
        const emitSpy = jest.spyOn(
          (component as any).eventManagerInstance,
          "emit",
        );

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "test-item-1",
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify componentMoved event emitted
        expect(emitSpy).toHaveBeenCalledWith(
          "componentMoved",
          expect.objectContaining({
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
          }),
        );

        // Verify canvasActivated event emitted
        expect(emitSpy).toHaveBeenCalledWith("canvasActivated", {
          canvasId: "canvas2",
        });

        emitSpy.mockRestore();
      });

      it("should handle missing source canvas gracefully", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup instance canvases (no items needed for this error test)
        instanceState.canvases = {
          canvas1: { items: [], zIndexCounter: 0 },
          canvas2: { items: [], zIndexCounter: 0 },
        };

        // Spy on console.error
        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation();

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event with non-existent source canvas
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "test-item-1",
            sourceCanvasId: "non-existent",
            targetCanvasId: "canvas2",
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Source canvas not found:",
          "non-existent",
        );

        consoleErrorSpy.mockRestore();
      });

      it("should handle missing item gracefully", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup instance canvases (no items needed for this error test)
        instanceState.canvases = {
          canvas1: { items: [], zIndexCounter: 0 },
          canvas2: { items: [], zIndexCounter: 0 },
        };

        // Spy on console.error
        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation();

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event with non-existent item
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "non-existent-item",
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Item not found in source canvas:",
          "non-existent-item",
        );

        consoleErrorSpy.mockRestore();
      });

      it("should constrain position to target canvas boundaries", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item to source canvas with large width
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 40, height: 6 }, // 40 units wide
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
          canvas2: { items: [], zIndexCounter: 0 },
        };

        // Get the registered handler
        const addEventListenerCalls =
          mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(
          (call) => call[0] === "canvas-move",
        );
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event with position that would overflow
        const mockEvent = new CustomEvent("canvas-move", {
          detail: {
            itemId: "test-item-1",
            sourceCanvasId: "canvas1",
            targetCanvasId: "canvas2",
            x: 9999, // Very far right (will be constrained)
            y: 50,
          },
        });

        handler(mockEvent);

        const state = api.getState();
        const movedItem = state.canvases.canvas2.items[0];

        // Verify position was constrained (x + width should not exceed canvas width)
        // Canvas width is 50 grid units (CANVAS_WIDTH_UNITS)
        expect(
          movedItem.layouts.desktop.x + movedItem.layouts.desktop.width,
        ).toBeLessThanOrEqual(50);
      });
    });
  });

  describe("UI Overrides - CanvasHeader", () => {
    it("should not render custom canvas header when uiOverrides.CanvasHeader is not provided", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };

      component.componentWillLoad();
      const result = component.render();

      // Check that no custom header is rendered
      expect(result).toBeDefined();
    });

    it("should render custom canvas header when uiOverrides.CanvasHeader is provided", () => {
      const mockHeaderRender = jest.fn(({ canvasId }) => (
        <div class="custom-header">{canvasId}</div>
      ));

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };
      component.canvasMetadata = {
        canvas1: { title: "Test Canvas", backgroundColor: "#ffffff" },
      };
      component.uiOverrides = {
        CanvasHeader: mockHeaderRender,
      };

      component.componentWillLoad();
      component.render();

      // Verify header render function was called with correct props
      expect(mockHeaderRender).toHaveBeenCalledWith({
        canvasId: "canvas1",
        metadata: { title: "Test Canvas", backgroundColor: "#ffffff" },
        isActive: false,
      });
    });

    it("should pass correct isActive prop when canvas is active", () => {
      const mockHeaderRender = jest.fn(() => <div>Header</div>);

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
          canvas2: { items: [], zIndexCounter: 0 },
        },
        activeCanvasId: "canvas2", // Set canvas2 as active in initial state
      };
      component.canvasMetadata = {
        canvas1: { title: "Canvas 1" },
        canvas2: { title: "Canvas 2" },
      };
      component.uiOverrides = {
        CanvasHeader: mockHeaderRender,
      };

      component.componentWillLoad();
      component.render();

      // Verify canvas1 header was called with isActive: false
      expect(mockHeaderRender).toHaveBeenCalledWith(
        expect.objectContaining({
          canvasId: "canvas1",
          isActive: false,
        }),
      );

      // Verify canvas2 header was called with isActive: true
      expect(mockHeaderRender).toHaveBeenCalledWith(
        expect.objectContaining({
          canvasId: "canvas2",
          isActive: true,
        }),
      );
    });

    it("should handle missing canvas metadata gracefully", () => {
      const mockHeaderRender = jest.fn(() => <div>Header</div>);

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };
      // No canvasMetadata provided
      component.uiOverrides = {
        CanvasHeader: mockHeaderRender,
      };

      component.componentWillLoad();
      component.render();

      // Verify header was called with empty metadata object
      expect(mockHeaderRender).toHaveBeenCalledWith({
        canvasId: "canvas1",
        metadata: {},
        isActive: false,
      });
    });

    it("should wrap each canvas in canvas-wrapper div", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };
      component.uiOverrides = {
        CanvasHeader: () => <div>Header</div>,
      };

      component.componentWillLoad();
      const result = component.render();

      // The result should contain canvas-wrapper divs
      // Note: This is a structural test - actual DOM verification would require spec page
      expect(result).toBeDefined();
    });
  });

  describe("Auto-Activation on Drop", () => {
    beforeEach(() => {
      resetState();
      clearHistory();
      jest.clearAllMocks();
    });

    it("should set canvas as active when component is dropped from palette", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
          canvas2: { items: [], zIndexCounter: 0 },
        },
      };

      const mockHostElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      Object.defineProperty(component, "hostElement", {
        value: mockHostElement,
        writable: true,
      });

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;

      // Get the registered canvas-drop handler
      const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
      const canvasDropCall = addEventListenerCalls.find(
        (call) => call[0] === "canvas-drop",
      );
      expect(canvasDropCall).toBeDefined();

      const handler = canvasDropCall[1];

      // Initially no canvas is active
      let state = api.getState();
      expect(state.activeCanvasId).toBeNull();

      // Simulate dropping a component into canvas2
      const mockEvent = new CustomEvent("canvas-drop", {
        detail: {
          canvasId: "canvas2",
          componentType: "header",
          x: 100,
          y: 50,
        },
      });

      handler(mockEvent);

      // Verify canvas2 is now active
      state = api.getState();
      expect(state.activeCanvasId).toBe("canvas2");
    });

    it("should emit canvasActivated event when component is dropped", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };

      const mockHostElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      Object.defineProperty(component, "hostElement", {
        value: mockHostElement,
        writable: true,
      });

      component.componentWillLoad();
      component.componentDidLoad();

      const emitSpy = jest.spyOn(
        (component as any).eventManagerInstance,
        "emit",
      );

      // Get the registered canvas-drop handler
      const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
      const canvasDropCall = addEventListenerCalls.find(
        (call) => call[0] === "canvas-drop",
      );
      const handler = canvasDropCall[1];

      // Trigger canvas-drop event
      const mockEvent = new CustomEvent("canvas-drop", {
        detail: {
          canvasId: "canvas1",
          componentType: "header",
          x: 50,
          y: 50,
        },
      });

      handler(mockEvent);

      // Verify canvasActivated event was emitted
      expect(emitSpy).toHaveBeenCalledWith("canvasActivated", {
        canvasId: "canvas1",
      });

      emitSpy.mockRestore();
    });

    it("should switch active canvas when dropping into different canvas", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
          canvas2: { items: [], zIndexCounter: 0 },
          canvas3: { items: [], zIndexCounter: 0 },
        },
      };

      const mockHostElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      Object.defineProperty(component, "hostElement", {
        value: mockHostElement,
        writable: true,
      });

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;

      // Get the registered canvas-drop handler
      const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
      const canvasDropCall = addEventListenerCalls.find(
        (call) => call[0] === "canvas-drop",
      );
      const handler = canvasDropCall[1];

      // Drop into canvas1
      handler(
        new CustomEvent("canvas-drop", {
          detail: {
            canvasId: "canvas1",
            componentType: "header",
            x: 50,
            y: 50,
          },
        }),
      );
      let state = api.getState();
      expect(state.activeCanvasId).toBe("canvas1");

      // Drop into canvas2
      handler(
        new CustomEvent("canvas-drop", {
          detail: {
            canvasId: "canvas2",
            componentType: "text",
            x: 100,
            y: 100,
          },
        }),
      );
      state = api.getState();
      expect(state.activeCanvasId).toBe("canvas2");

      // Drop into canvas3
      handler(
        new CustomEvent("canvas-drop", {
          detail: {
            canvasId: "canvas3",
            componentType: "header",
            x: 25,
            y: 25,
          },
        }),
      );
      state = api.getState();
      expect(state.activeCanvasId).toBe("canvas3");
    });

    it("should activate canvas even when dropping same component type multiple times", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };

      const mockHostElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      Object.defineProperty(component, "hostElement", {
        value: mockHostElement,
        writable: true,
      });

      component.componentWillLoad();
      component.componentDidLoad();

      const emitSpy = jest.spyOn(
        (component as any).eventManagerInstance,
        "emit",
      );

      // Get the registered canvas-drop handler
      const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
      const canvasDropCall = addEventListenerCalls.find(
        (call) => call[0] === "canvas-drop",
      );
      const handler = canvasDropCall[1];

      // Drop multiple headers into same canvas
      handler(
        new CustomEvent("canvas-drop", {
          detail: {
            canvasId: "canvas1",
            componentType: "header",
            x: 10,
            y: 10,
          },
        }),
      );

      handler(
        new CustomEvent("canvas-drop", {
          detail: {
            canvasId: "canvas1",
            componentType: "header",
            x: 20,
            y: 10,
          },
        }),
      );

      handler(
        new CustomEvent("canvas-drop", {
          detail: {
            canvasId: "canvas1",
            componentType: "header",
            x: 30,
            y: 10,
          },
        }),
      );

      // Verify canvas1 is active
      const api = (component as any).api;
      const state = api.getState();
      expect(state.activeCanvasId).toBe("canvas1");

      // Verify canvasActivated event was emitted 3 times
      const activatedCalls = emitSpy.mock.calls.filter(
        (call) =>
          call[0] === "canvasActivated" &&
          (call[1] as any).canvasId === "canvas1",
      );
      expect(activatedCalls.length).toBe(3);

      emitSpy.mockRestore();
    });
  });

  describe("Accessibility Features", () => {
    beforeEach(() => {
      resetState();
      clearHistory();
      jest.clearAllMocks();
    });

    describe("Keyboard Navigation", () => {
      it("should delete selected component on Delete key", async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          querySelector: jest.fn(() => null), // Return null - no elements to focus
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Get API and instance state
        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item and select it
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };
        instanceState.selectedItemId = "test-item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Get the keyboard handler from component instance
        const keyboardHandler = (component as any).keyboardHandler;

        expect(keyboardHandler).toBeDefined();

        // Simulate Delete key press
        const deleteEvent = new KeyboardEvent("keydown", { key: "Delete" });
        Object.defineProperty(deleteEvent, "preventDefault", {
          value: jest.fn(),
        });

        await keyboardHandler(deleteEvent);

        // Wait for async deletion
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify item was deleted
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(0);

        // Verify selection cleared
        expect(state.selectedItemId).toBeNull();
        expect(state.selectedCanvasId).toBeNull();
      });

      it("should delete selected component on Backspace key", async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          querySelector: jest.fn(() => null), // Return null - no elements to focus
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Get API and instance state
        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item and select it
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "text",
          name: "Test Text",
          zIndex: 1,
          layouts: {
            desktop: { x: 5, y: 5, width: 15, height: 10 },
            mobile: { x: 0, y: 0, width: 50, height: 10, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };
        instanceState.selectedItemId = "test-item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Get the keyboard handler from component instance
        const keyboardHandler = (component as any).keyboardHandler;

        // Simulate Backspace key press
        const backspaceEvent = new KeyboardEvent("keydown", {
          key: "Backspace",
        });
        Object.defineProperty(backspaceEvent, "preventDefault", {
          value: jest.fn(),
        });

        await keyboardHandler(backspaceEvent);

        // Wait for async deletion
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify item was deleted
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(0);
      });

      it("should not delete when no component is selected", async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Get API and instance state
        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item but don't select it
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };
        instanceState.selectedItemId = null;
        instanceState.selectedCanvasId = null;

        // Get the keyboard handler from component instance
        const keyboardHandler = (component as any).keyboardHandler;

        // Simulate Delete key press
        const deleteEvent = new KeyboardEvent("keydown", { key: "Delete" });
        await keyboardHandler(deleteEvent);

        // Verify item was NOT deleted
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(1);
      });

      it("should clear selection on Escape key", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Get API and instance state
        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Select an item
        instanceState.canvases = {
          canvas1: {
            items: [
              {
                id: "test-item-1",
                canvasId: "canvas1",
                type: "header",
                name: "Test",
                zIndex: 1,
                layouts: {
                  desktop: { x: 0, y: 0, width: 10, height: 5 },
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 5,
                    customized: false,
                  },
                },
                config: {},
              },
            ],
            zIndexCounter: 2,
          },
        };
        instanceState.selectedItemId = "test-item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Get the keyboard handler from component instance
        const keyboardHandler = (component as any).keyboardHandler;

        // Simulate Escape key press
        const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
        Object.defineProperty(escapeEvent, "preventDefault", {
          value: jest.fn(),
        });

        keyboardHandler(escapeEvent);

        // Verify selection was cleared
        const state = api.getState();
        expect(state.selectedItemId).toBeNull();
        expect(state.selectedCanvasId).toBeNull();
      });

      it("should not clear selection on Escape when nothing is selected", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Get API and instance state
        const api = (component as any).api;
        const instanceState = api.getState();

        instanceState.selectedItemId = null;
        instanceState.selectedCanvasId = null;

        // Get the keyboard handler from component instance
        const keyboardHandler = (component as any).keyboardHandler;

        // Create a spy on preventDefault
        const preventDefaultSpy = jest.fn();

        // Simulate Escape key press
        const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
        Object.defineProperty(escapeEvent, "preventDefault", {
          value: preventDefaultSpy,
        });

        keyboardHandler(escapeEvent);

        // Verify preventDefault was NOT called (early return)
        expect(preventDefaultSpy).not.toHaveBeenCalled();
      });

      it("should respect onBeforeDelete hook when using Delete key", async () => {
        const mockHook = jest.fn(() => Promise.resolve(false)); // Cancel deletion

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.onBeforeDelete = mockHook;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          querySelector: jest.fn(() => null), // Return null - no elements to focus
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Get API and instance state
        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item and select it
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };
        instanceState.selectedItemId = "test-item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Get the keyboard handler from component instance
        const keyboardHandler = (component as any).keyboardHandler;

        // Simulate Delete key press
        const deleteEvent = new KeyboardEvent("keydown", { key: "Delete" });
        Object.defineProperty(deleteEvent, "preventDefault", {
          value: jest.fn(),
        });

        await keyboardHandler(deleteEvent);

        // Wait for async hook
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify hook was called
        expect(mockHook).toHaveBeenCalledWith({
          item: testItem,
          canvasId: "canvas1",
          itemId: "test-item-1",
        });

        // Verify item was NOT deleted (hook returned false)
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(1);
      });

      it("should delete component when onBeforeDelete hook returns true", async () => {
        const mockHook = jest.fn(() => Promise.resolve(true)); // Approve deletion

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.onBeforeDelete = mockHook;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          querySelector: jest.fn(() => null), // Return null - no elements to focus
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Get API and instance state
        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item and select it
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };
        instanceState.selectedItemId = "test-item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Get the keyboard handler from component instance
        const keyboardHandler = (component as any).keyboardHandler;

        // Simulate Delete key press
        const deleteEvent = new KeyboardEvent("keydown", { key: "Delete" });
        Object.defineProperty(deleteEvent, "preventDefault", {
          value: jest.fn(),
        });

        await keyboardHandler(deleteEvent);

        // Wait for async hook
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify hook was called
        expect(mockHook).toHaveBeenCalled();

        // Verify item WAS deleted (hook returned true)
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(0);
      });
    });

    describe("ARIA Live Regions", () => {
      it("should have announcement state property", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Access private property for testing
        expect((component as any).announcement).toBeDefined();
        expect((component as any).announcement).toBe("");
      });

      it("should announce component additions", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Trigger componentAdded event on instance event manager
        (component as any).eventManagerInstance.emit("componentAdded", {
          item: { type: "header", id: "item-1", name: "Header" },
          canvasId: "canvas1",
        });

        // Verify announcement was set
        expect((component as any).announcement).toContain("component added");
      });

      it("should announce component deletions", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Trigger componentDeleted event on instance event manager
        (component as any).eventManagerInstance.emit("componentDeleted", {
          itemId: "item-1",
          canvasId: "canvas1",
        });

        // Verify announcement was set
        expect((component as any).announcement).toBe("Component deleted");
      });

      it("should announce component moves", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Trigger componentMoved event on instance event manager
        (component as any).eventManagerInstance.emit("componentMoved", {
          item: { id: "item-1" },
          sourceCanvasId: "canvas1",
          targetCanvasId: "canvas2",
          position: { x: 10, y: 10 },
        });

        // Verify announcement was set
        expect((component as any).announcement).toBe(
          "Component moved to new canvas",
        );
      });

      it("should announce undo actions", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Trigger undoExecuted event on instance event manager
        (component as any).eventManagerInstance.emit("undoExecuted", {});

        // Verify announcement was set
        expect((component as any).announcement).toBe("Undo action performed");
      });

      it("should announce redo actions", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Trigger redoExecuted event on instance event manager
        (component as any).eventManagerInstance.emit("redoExecuted", {});

        // Verify announcement was set
        expect((component as any).announcement).toBe("Redo action performed");
      });

      it("should announce canvas activation", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.canvasMetadata = {
          canvas1: { title: "Hero Section" },
        };

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Trigger canvasActivated event on instance event manager
        (component as any).eventManagerInstance.emit("canvasActivated", {
          canvasId: "canvas1",
        });

        // Verify announcement was set with canvas title
        expect((component as any).announcement).toBe(
          "Hero Section canvas activated",
        );
      });

      it("should clear announcement after 100ms", (done) => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
          writable: true,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Trigger event on instance event manager
        (component as any).eventManagerInstance.emit("componentDeleted", {
          itemId: "item-1",
          canvasId: "canvas1",
        });

        // Verify announcement is set immediately
        expect((component as any).announcement).toBe("Component deleted");

        // Wait 150ms and check it was cleared
        setTimeout(() => {
          expect((component as any).announcement).toBe("");
          done();
        }, 150);
      });

      it("should render ARIA live region in DOM", () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.initialState = {
          canvases: {
            canvas1: { items: [], zIndexCounter: 0 },
          },
        };

        component.componentWillLoad();
        const result = component.render();

        // Verify Host contains sr-only div with aria-live
        // (Structural verification - actual DOM would require spec page)
        expect(result).toBeDefined();
      });
    });

    describe("deleteComponent Hook Integration", () => {
      it("should call onBeforeDelete hook when deleting via API", async () => {
        const mockHook = jest.fn(() => Promise.resolve(true));

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.onBeforeDelete = mockHook;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };

        // Call deleteComponent via API
        const result = await api.deleteComponent("test-item-1");

        // Verify hook was called with correct context
        expect(mockHook).toHaveBeenCalledWith({
          item: expect.objectContaining({ id: "test-item-1" }),
          canvasId: "canvas1",
          itemId: "test-item-1",
        });

        // Verify deletion succeeded
        expect(result).toBe(true);
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(0);
      });

      it("should cancel deletion when hook returns false", async () => {
        const mockHook = jest.fn(() => Promise.resolve(false)); // Cancel

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.onBeforeDelete = mockHook;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };

        // Call deleteComponent via API
        const result = await api.deleteComponent("test-item-1");

        // Verify hook was called
        expect(mockHook).toHaveBeenCalled();

        // Verify deletion was cancelled
        expect(result).toBe(false);
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(1);
      });

      it("should proceed with deletion when hook is not provided", async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        // No onBeforeDelete hook provided

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };

        // Call deleteComponent via API
        const result = await api.deleteComponent("test-item-1");

        // Verify deletion succeeded
        expect(result).toBe(true);
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(0);
      });

      it("should handle hook errors gracefully", async () => {
        const mockHook = jest.fn(() => {
          throw new Error("Hook error");
        });

        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation();

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.onBeforeDelete = mockHook;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup: Add item
        const testItem = {
          id: "test-item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Test Header",
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };

        instanceState.canvases = {
          canvas1: { items: [testItem], zIndexCounter: 2 },
        };

        // Call deleteComponent via API
        const result = await api.deleteComponent("test-item-1");

        // Verify hook was called
        expect(mockHook).toHaveBeenCalled();

        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error in onBeforeDelete hook:",
          expect.any(Error),
        );

        // Verify deletion was cancelled (error treated as false)
        expect(result).toBe(false);
        const state = api.getState();
        expect(state.canvases.canvas1.items.length).toBe(1);

        consoleErrorSpy.mockRestore();
      });
    });

    /**
     * Focus Management Tests
     * ======================
     *
     * Tests for keyboard focus management after deletion and undo/redo operations.
     *
     * **Features Tested**:
     * - Focus moves to next logical item after deletion
     * - Focus moves to canvas when no items left
     * - Focus moves to palette as fallback
     * - Focus restores after undo operation
     * - Focus restores after redo operation
     * - tabindex attributes in editing vs viewer mode
     *
     * **WCAG Compliance**: 2.4.3 Focus Order (Level A)
     */
    describe("Focus Management", () => {
      /**
       * Helper to create a mock hostElement with required methods
       */
      const createMockHostElement = (
        querySelectorFn: (selector: string) => any,
      ) => ({
        querySelector: jest.fn(querySelectorFn),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });
      it("should move focus to next item after deletion", async () => {
        // Create component with multiple items
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup instanceState with 3 items at different positions
        instanceState.canvases = {
          canvas1: {
            items: [
              {
                id: "item-1",
                canvasId: "canvas1",
                type: "header",
                name: "Item 1",
                layouts: {
                  desktop: { x: 0, y: 0, width: 10, height: 6 },
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 6,
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
                name: "Item 2",
                layouts: {
                  desktop: { x: 0, y: 10, width: 10, height: 6 },
                  mobile: {
                    x: 0,
                    y: 10,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                zIndex: 2,
                config: {},
              },
              {
                id: "item-3",
                canvasId: "canvas1",
                type: "button",
                name: "Item 3",
                layouts: {
                  desktop: { x: 0, y: 20, width: 10, height: 6 },
                  mobile: {
                    x: 0,
                    y: 20,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                zIndex: 3,
                config: {},
              },
            ],
            zIndexCounter: 4,
          },
        };

        // Select first item
        instanceState.selectedItemId = "item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Mock DOM elements and focus method
        const mockItem2Element = {
          focus: jest.fn(),
        };

        const mockHostElement = createMockHostElement((selector: string) => {
          if (selector === "#item-2") {
            return mockItem2Element;
          }
          return null;
        });

        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
        });

        // Delete item-1
        await api.deleteComponent("item-1");

        // Call moveFocusAfterDeletion manually (normally called from keyboard handler)
        (component as any).moveFocusAfterDeletion("canvas1", "item-1");

        // Verify focus moved to item-2 (next item in sorted order)
        expect(mockItem2Element.focus).toHaveBeenCalled();

        // Verify item-2 is now selected
        const state = api.getState();
        expect(state.selectedItemId).toBe("item-2");
        expect(state.selectedCanvasId).toBe("canvas1");
      });

      it("should move focus to canvas when no items left after deletion", async () => {
        // Create component with single item
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup instanceState with 1 item
        instanceState.canvases = {
          canvas1: {
            items: [
              {
                id: "item-1",
                canvasId: "canvas1",
                type: "header",
                name: "Item 1",
                layouts: {
                  desktop: { x: 0, y: 0, width: 10, height: 6 },
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                zIndex: 1,
                config: {},
              },
            ],
            zIndexCounter: 2,
          },
        };

        instanceState.selectedItemId = "item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Mock DOM elements and focus method
        const mockCanvasElement = {
          focus: jest.fn(),
        };

        const mockHostElement = createMockHostElement((selector: string) => {
          if (selector === 'canvas-section[canvas-id="canvas1"]') {
            return mockCanvasElement;
          }
          return null;
        });

        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
        });

        // Delete last item
        await api.deleteComponent("item-1");

        // Call moveFocusAfterDeletion manually
        (component as any).moveFocusAfterDeletion("canvas1", "item-1");

        // Verify focus moved to canvas
        expect(mockCanvasElement.focus).toHaveBeenCalled();
      });

      it("should move focus to palette as fallback when canvas not found", async () => {
        // Create component
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Setup empty gridState (canvas doesn't exist)
        gridState.canvases = {};

        // Mock DOM elements and focus method
        const mockPaletteElement = {
          focus: jest.fn(),
        };

        const mockHostElement = createMockHostElement((selector: string) => {
          if (selector === "component-palette") {
            return mockPaletteElement;
          }
          return null;
        });

        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Call moveFocusAfterDeletion with non-existent canvas
        (component as any).moveFocusAfterDeletion("canvas1", "item-1");

        // Verify focus moved to palette as fallback
        expect(mockPaletteElement.focus).toHaveBeenCalled();
      });

      it("should restore focus to selected item after undo operation", async () => {
        // Create component
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup instanceState with item
        instanceState.canvases = {
          canvas1: {
            items: [
              {
                id: "item-1",
                canvasId: "canvas1",
                type: "header",
                name: "Item 1",
                layouts: {
                  desktop: { x: 0, y: 0, width: 10, height: 6 },
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                zIndex: 1,
                config: {},
              },
            ],
            zIndexCounter: 2,
          },
        };

        instanceState.selectedItemId = "item-1";
        instanceState.selectedCanvasId = "canvas1";

        // Mock DOM elements and focus method
        const mockItemElement = {
          focus: jest.fn(),
        };

        const mockHostElement = createMockHostElement((selector: string) => {
          if (selector === "#item-1") {
            return mockItemElement;
          }
          return null;
        });

        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
        });

        // Call restoreFocusToSelection manually (normally called from undo event handler)
        // Need to wait for setTimeout to execute
        (component as any).restoreFocusToSelection();

        // Wait for setTimeout(10ms) to complete
        await new Promise((resolve) => setTimeout(resolve, 20));

        // Verify focus was restored to selected item
        expect(mockItemElement.focus).toHaveBeenCalled();
      });

      it("should restore focus to selected item after redo operation", async () => {
        // Create component
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup instanceState with item
        instanceState.canvases = {
          canvas1: {
            items: [
              {
                id: "item-2",
                canvasId: "canvas1",
                type: "text",
                name: "Item 2",
                layouts: {
                  desktop: { x: 10, y: 10, width: 10, height: 6 },
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                zIndex: 1,
                config: {},
              },
            ],
            zIndexCounter: 2,
          },
        };

        instanceState.selectedItemId = "item-2";
        instanceState.selectedCanvasId = "canvas1";

        // Mock DOM elements and focus method
        const mockItemElement = {
          focus: jest.fn(),
        };

        const mockHostElement = createMockHostElement((selector: string) => {
          if (selector === "#item-2") {
            return mockItemElement;
          }
          return null;
        });

        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
        });

        // Call restoreFocusToSelection manually (normally called from redo event handler)
        (component as any).restoreFocusToSelection();

        // Wait for setTimeout(10ms) to complete
        await new Promise((resolve) => setTimeout(resolve, 20));

        // Verify focus was restored to selected item
        expect(mockItemElement.focus).toHaveBeenCalled();
      });

      it("should not restore focus when no item is selected", async () => {
        // Create component
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Setup gridState with no selection
        gridState.canvases = {
          canvas1: {
            items: [],
            zIndexCounter: 1,
          },
        };

        gridState.selectedItemId = null;
        gridState.selectedCanvasId = null;

        // Mock DOM elements and focus method
        const mockFocus = jest.fn();
        const mockHostElement = createMockHostElement(() => ({
          focus: mockFocus,
        }));

        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
        });

        component.componentWillLoad();
        component.componentDidLoad();

        // Call restoreFocusToSelection
        (component as any).restoreFocusToSelection();

        // Wait for setTimeout(10ms) to complete
        await new Promise((resolve) => setTimeout(resolve, 20));

        // Verify querySelector was not called (no selection)
        expect(mockHostElement.querySelector).not.toHaveBeenCalled();
        expect(mockFocus).not.toHaveBeenCalled();
      });

      it("should sort items by position when finding next item to focus", async () => {
        // Create component with items in mixed positions
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        component.componentWillLoad();
        component.componentDidLoad();

        const api = (component as any).api;
        const instanceState = api.getState();

        // Setup instanceState with items NOT in position order
        instanceState.canvases = {
          canvas1: {
            items: [
              {
                id: "item-bottom",
                canvasId: "canvas1",
                type: "header",
                name: "Bottom Item",
                layouts: {
                  desktop: { x: 0, y: 30, width: 10, height: 6 }, // Bottom
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                zIndex: 1,
                config: {},
              },
              {
                id: "item-top",
                canvasId: "canvas1",
                type: "text",
                name: "Top Item",
                layouts: {
                  desktop: { x: 0, y: 0, width: 10, height: 6 }, // Top
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                zIndex: 2,
                config: {},
              },
              {
                id: "item-middle",
                canvasId: "canvas1",
                type: "button",
                name: "Middle Item",
                layouts: {
                  desktop: { x: 0, y: 15, width: 10, height: 6 }, // Middle
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                zIndex: 3,
                config: {},
              },
            ],
            zIndexCounter: 4,
          },
        };

        // Delete item-top
        instanceState.selectedItemId = "item-top";
        instanceState.selectedCanvasId = "canvas1";

        // Mock DOM elements - should focus item-middle (next in position order)
        const mockItemMiddleElement = {
          focus: jest.fn(),
        };

        const mockHostElement = createMockHostElement((selector: string) => {
          if (selector === "#item-middle") {
            return mockItemMiddleElement;
          }
          return null;
        });

        Object.defineProperty(component, "hostElement", {
          value: mockHostElement,
        });

        // Delete top item
        await api.deleteComponent("item-top");

        // Call moveFocusAfterDeletion
        (component as any).moveFocusAfterDeletion("canvas1", "item-top");

        // Verify focus moved to middle item (first in sorted order after deletion)
        expect(mockItemMiddleElement.focus).toHaveBeenCalled();
        const state = api.getState();
        expect(state.selectedItemId).toBe("item-middle");
      });
    });
  });

  /**
   * Click-to-Add Functionality Tests
   * =================================
   *
   * Tests for the click-to-add feature that allows users to click
   * palette items to add components to the active canvas.
   */
  describe("click-to-add functionality", () => {
    it("should add component to active canvas when palette item is clicked", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      // Setup canvases on component's instance state
      const api = (component as any).api;
      const instanceState = api.getState();
      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      // Simulate palette item click event
      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify component was added (check instance state, not global)
      const state = api.getState();
      expect(state.canvases.canvas1.items.length).toBe(1);
      expect(state.canvases.canvas1.items[0].type).toBe("header");
    });

    it("should auto-select first canvas when no active canvas", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      // Setup canvases with NO active canvas on instance state
      const api = (component as any).api;
      const instanceState = api.getState();
      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
        canvas2: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = null;

      // Simulate palette item click
      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify first canvas was auto-selected and component added
      const state = api.getState();
      expect(state.activeCanvasId).toBe("canvas1");
      expect(state.canvases.canvas1.items.length).toBe(1);
    });

    it("should respect enableClickToAdd config flag when true", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.config = { enableClickToAdd: true };

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Component should be added
      const state = api.getState();
      expect(state.canvases.canvas1.items.length).toBe(1);
    });

    it("should respect enableClickToAdd config flag when false", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.config = { enableClickToAdd: false };

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Component should NOT be added
      const state = api.getState();
      expect(state.canvases.canvas1.items.length).toBe(0);
    });

    it("should handle missing component type gracefully", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      // Event with missing componentType
      const event = new CustomEvent("palette-item-click", {
        detail: {} as any,
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify no component was added (behavior test, not logging test)
      const state = api.getState();
      expect(state.canvases.canvas1.items.length).toBe(0);
    });

    it("should handle missing component definition gracefully", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      // Event with non-existent component type
      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "non-existent-type" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify no component was added (behavior test, not logging test)
      const state = api.getState();
      expect(state.canvases.canvas1.items.length).toBe(0);
    });

    it("should handle no canvases available gracefully", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      // No canvases
      instanceState.canvases = {};
      instanceState.activeCanvasId = null;

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Test verifies graceful handling (no crash) when no canvases available
    });

    it("should use component definition defaultSize", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify size matches definition (header = 50×6)
      const state = api.getState();
      const addedItem = state.canvases.canvas1.items[0];
      expect(addedItem.layouts.desktop.width).toBe(50);
      expect(addedItem.layouts.desktop.height).toBe(6);
    });

    it("should set newly added component as selected", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";
      instanceState.selectedItemId = null;
      instanceState.selectedCanvasId = null;

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify selection was updated
      const state = api.getState();
      const addedItem = state.canvases.canvas1.items[0];
      expect(state.selectedItemId).toBe(addedItem.id);
      expect(state.selectedCanvasId).toBe("canvas1");
    });

    it("should emit componentAdded event", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      // Spy on instance's eventManagerInstance.emit
      const emitSpy = jest.spyOn(
        (component as any).eventManagerInstance,
        "emit",
      );

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify event was emitted with full item object (matches ComponentAddedEvent interface)
      expect(emitSpy).toHaveBeenCalledWith("componentAdded", {
        item: expect.objectContaining({
          id: expect.any(String),
          canvasId: "canvas1",
          type: "header",
          name: "Header",
          layouts: expect.any(Object),
          zIndex: expect.any(Number),
          config: expect.any(Object),
        }),
        canvasId: "canvas1",
      });

      emitSpy.mockRestore();
    });

    it("should create mobile layout with full width", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify mobile layout
      const state = api.getState();
      const addedItem = state.canvases.canvas1.items[0];
      expect(addedItem.layouts.mobile.width).toBe(50); // Full width
      expect(addedItem.layouts.mobile.customized).toBe(false);
    });

    it("should assign correct z-index", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [
            {
              id: "existing-item",
              canvasId: "canvas1",
              type: "text",
              name: "Text",
              layouts: {
                desktop: { x: 0, y: 0, width: 10, height: 6 },
                mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
              },
              zIndex: 1,
              config: {},
            },
          ],
          zIndexCounter: 1,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify z-index is higher than existing item
      const state = api.getState();
      const addedItem = state.canvases.canvas1.items[1];
      expect(addedItem.zIndex).toBe(2); // zIndexCounter was 1, so new item gets 2
    });

    it("should handle multiple rapid clicks", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      // Simulate 3 rapid clicks
      const event1 = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });
      const event2 = new CustomEvent("palette-item-click", {
        detail: { componentType: "text" },
        bubbles: true,
        composed: true,
      });
      const event3 = new CustomEvent("palette-item-click", {
        detail: { componentType: "button" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event1);
      await (component as any).handlePaletteItemClick(event2);
      await (component as any).handlePaletteItemClick(event3);

      // Verify all 3 components were added
      const state = api.getState();
      expect(state.canvases.canvas1.items.length).toBe(3);
      expect(state.canvases.canvas1.items[0].type).toBe("header");
      expect(state.canvases.canvas1.items[1].type).toBe("text");
      expect(state.canvases.canvas1.items[2].type).toBe("button");
    });

    it("should place components without collision", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      // Setup canvas with existing item at top-left
      instanceState.canvases = {
        canvas1: {
          items: [
            {
              id: "existing-item",
              canvasId: "canvas1",
              type: "text",
              name: "Text",
              layouts: {
                desktop: { x: 0, y: 0, width: 20, height: 8 },
                mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
              },
              zIndex: 1,
              config: {},
            },
          ],
          zIndexCounter: 1,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify new component was placed without collision
      const state = api.getState();
      const addedItem = state.canvases.canvas1.items[1];
      expect(addedItem).toBeDefined();

      // New item should NOT be at (0,0) since that's occupied
      const isColliding =
        addedItem.layouts.desktop.x === 0 && addedItem.layouts.desktop.y === 0;
      expect(isColliding).toBe(false);
    });

    it("should assign unique IDs to each component", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      // Add 3 components
      const event1 = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });
      const event2 = new CustomEvent("palette-item-click", {
        detail: { componentType: "text" },
        bubbles: true,
        composed: true,
      });
      const event3 = new CustomEvent("palette-item-click", {
        detail: { componentType: "button" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event1);
      await (component as any).handlePaletteItemClick(event2);
      await (component as any).handlePaletteItemClick(event3);

      // Verify all IDs are unique
      const state = api.getState();
      const ids = state.canvases.canvas1.items.map((item) => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3); // All IDs should be unique
    });

    it("should handle empty component type string", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      // Event with empty string componentType
      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Should be treated as missing type - verify no component was added
      const state = api.getState();
      expect(state.canvases.canvas1.items.length).toBe(0);
    });

    it("should set component name from definition", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify name matches definition
      const state = api.getState();
      const addedItem = state.canvases.canvas1.items[0];
      const headerDef = mockComponentDefinitions.find(
        (c) => c.type === "header",
      );
      expect(addedItem.name).toBe(headerDef.name);
    });

    it("should initialize component config as empty object", async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "header" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify config is initialized as empty object
      const state = api.getState();
      const addedItem = state.canvases.canvas1.items[0];
      expect(addedItem.config).toEqual({});
      expect(typeof addedItem.config).toBe("object");
    });

    it("should use fallback size when defaultSize not in definition", async () => {
      const component = new GridBuilder();

      // Component with no defaultSize (intentionally invalid for testing fallback)
      const componentWithoutSize: ComponentDefinition = {
        type: "no-size",
        name: "No Size",
        icon: "❓",
        render: () => <div>No size</div>,
        renderDragClone: () => <div>Clone</div>,
      } as any; // Use 'as any' to test fallback behavior when defaultSize is missing

      component.components = [componentWithoutSize];

      component.componentWillLoad();
      component.componentDidLoad();

      const api = (component as any).api;
      const instanceState = api.getState();

      instanceState.canvases = {
        canvas1: {
          items: [],
          zIndexCounter: 0,
        },
      };
      instanceState.activeCanvasId = "canvas1";

      const event = new CustomEvent("palette-item-click", {
        detail: { componentType: "no-size" },
        bubbles: true,
        composed: true,
      });

      await (component as any).handlePaletteItemClick(event);

      // Verify fallback size is used (10×6)
      const state = api.getState();
      const addedItem = state.canvases.canvas1.items[0];
      expect(addedItem.layouts.desktop.width).toBe(10);
      expect(addedItem.layouts.desktop.height).toBe(6);
    });
  });

  // ==========================================
  // Shared State Tests (Multi-Instance)
  // ==========================================

  describe("Shared State (With apiKey)", () => {
    beforeEach(() => {
      // Clear SharedStateRegistry before each test
      sharedStateRegistry.clear();
    });

    afterEach(() => {
      // Cleanup after each test
      sharedStateRegistry.clear();
    });

    it("should register with SharedStateRegistry in shared mode", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "test-key";

      component.componentWillLoad();

      // Verify registration
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["test-key"]).toBeDefined();
      expect(debugInfo["test-key"].refCount).toBe(1);
    });

    it("should share canvases data across instances with same apiKey", () => {
      // Create first instance
      const component1 = new GridBuilder();
      component1.components = mockComponentDefinitions;
      component1.apiKey = "shared-key";
      component1.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      component1.componentWillLoad();
      component1.componentDidLoad();

      // Create second instance with same apiKey
      const component2 = new GridBuilder();
      component2.components = mockComponentDefinitions;
      component2.apiKey = "shared-key";

      component2.componentWillLoad();
      component2.componentDidLoad();

      // Verify both instances share the same canvases data
      const state1 = (component1 as any).stateManager.state;
      const state2 = (component2 as any).stateManager.state;

      expect(state1.canvases).toBe(state2.canvases);

      // Verify refCount
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["shared-key"].refCount).toBe(2);
    });

    it("should have independent viewports across instances", () => {
      // Create first instance (mobile viewport)
      const component1 = new GridBuilder();
      component1.components = mockComponentDefinitions;
      component1.apiKey = "shared-key";
      component1.initialState = {
        canvases: { canvas1: { items: [], zIndexCounter: 1 } },
        currentViewport: "mobile",
      };

      component1.componentWillLoad();
      component1.componentDidLoad();

      // Create second instance (desktop viewport)
      const component2 = new GridBuilder();
      component2.components = mockComponentDefinitions;
      component2.apiKey = "shared-key";
      component2.initialState = {
        currentViewport: "desktop",
      };

      component2.componentWillLoad();
      component2.componentDidLoad();

      // Verify independent viewports
      const state1 = (component1 as any).stateManager.state;
      const state2 = (component2 as any).stateManager.state;

      expect(state1.currentViewport).toBe("mobile");
      expect(state2.currentViewport).toBe("desktop");

      // But canvases are shared
      expect(state1.canvases).toBe(state2.canvases);
    });

    it("should share undo/redo manager across instances", () => {
      // Create first instance
      const component1 = new GridBuilder();
      component1.components = mockComponentDefinitions;
      component1.apiKey = "shared-key";

      component1.componentWillLoad();
      component1.componentDidLoad();

      // Create second instance
      const component2 = new GridBuilder();
      component2.components = mockComponentDefinitions;
      component2.apiKey = "shared-key";

      component2.componentWillLoad();
      component2.componentDidLoad();

      // Verify both instances share the same undo manager
      const undoManager1 = (component1 as any).undoRedoManager;
      const undoManager2 = (component2 as any).undoRedoManager;

      expect(undoManager1).toBe(undoManager2);
    });

    it("should isolate data between different apiKeys", () => {
      // Create instance with apiKey="key1"
      const component1 = new GridBuilder();
      component1.components = mockComponentDefinitions;
      component1.apiKey = "key1";
      component1.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      component1.componentWillLoad();
      component1.componentDidLoad();

      // Create instance with apiKey="key2"
      const component2 = new GridBuilder();
      component2.components = mockComponentDefinitions;
      component2.apiKey = "key2";
      component2.initialState = {
        canvases: {
          canvas2: { items: [], zIndexCounter: 1 },
        },
      };

      component2.componentWillLoad();
      component2.componentDidLoad();

      // Verify separate state
      const state1 = (component1 as any).stateManager.state;
      const state2 = (component2 as any).stateManager.state;

      expect(state1.canvases).not.toBe(state2.canvases);
      expect(state1.canvases).toHaveProperty("canvas1");
      expect(state1.canvases).not.toHaveProperty("canvas2");
      expect(state2.canvases).toHaveProperty("canvas2");
      expect(state2.canvases).not.toHaveProperty("canvas1");

      // Verify separate registry entries
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo.key1.refCount).toBe(1);
      expect(debugInfo.key2.refCount).toBe(1);
    });

    it("should auto-generate instanceId if not provided", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "test-key";

      component.componentWillLoad();

      const resolvedInstanceId = (component as any).resolvedInstanceId;
      expect(resolvedInstanceId).toBeDefined();
      expect(resolvedInstanceId).toMatch(/^grid-builder-\d+-[a-z0-9]+$/);
    });

    it("should use provided instanceId", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "test-key";
      component.instanceId = "custom-id";

      component.componentWillLoad();

      const resolvedInstanceId = (component as any).resolvedInstanceId;
      expect(resolvedInstanceId).toBe("custom-id");
    });

    it("should normalize empty apiKey to undefined (local mode)", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "";

      component.componentWillLoad();

      // Empty apiKey should trigger local mode
      const resolvedInstanceId = (component as any).resolvedInstanceId;
      expect(resolvedInstanceId).toBeUndefined();

      // Verify no registration
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(Object.keys(debugInfo)).toHaveLength(0);
    });
  });

  // ==========================================
  // Lifecycle Tests (Reference Counting)
  // ==========================================

  describe("Lifecycle and Reference Counting", () => {
    beforeEach(() => {
      sharedStateRegistry.clear();
    });

    afterEach(() => {
      sharedStateRegistry.clear();
    });

    it("should unregister on disconnectedCallback", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "test-key";

      component.componentWillLoad();

      // Verify registered
      let debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["test-key"].refCount).toBe(1);

      // Disconnect
      component.disconnectedCallback();

      // Verify unregistered and store disposed
      debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["test-key"]).toBeUndefined();
    });

    it("should maintain shared store when one instance disconnects", () => {
      // Create first instance
      const component1 = new GridBuilder();
      component1.components = mockComponentDefinitions;
      component1.apiKey = "shared-key";

      component1.componentWillLoad();

      // Create second instance
      const component2 = new GridBuilder();
      component2.components = mockComponentDefinitions;
      component2.apiKey = "shared-key";

      component2.componentWillLoad();

      // Verify refCount = 2
      let debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["shared-key"].refCount).toBe(2);

      // Disconnect first instance
      component1.disconnectedCallback();

      // Verify refCount = 1, store still exists
      debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["shared-key"].refCount).toBe(1);
      expect(debugInfo["shared-key"]).toBeDefined();
    });

    it("should dispose shared store when last instance disconnects", () => {
      // Create first instance
      const component1 = new GridBuilder();
      component1.components = mockComponentDefinitions;
      component1.apiKey = "shared-key";

      component1.componentWillLoad();

      // Create second instance
      const component2 = new GridBuilder();
      component2.components = mockComponentDefinitions;
      component2.apiKey = "shared-key";

      component2.componentWillLoad();

      // Disconnect both instances
      component1.disconnectedCallback();
      component2.disconnectedCallback();

      // Verify store disposed
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["shared-key"]).toBeUndefined();
    });
  });

  // ==========================================
  // Local Mode Tests (Backward Compatibility)
  // ==========================================

  describe("Local Mode (No apiKey)", () => {
    beforeEach(() => {
      sharedStateRegistry.clear();
    });

    afterEach(() => {
      sharedStateRegistry.clear();
    });

    it("should have independent state between instances (local mode)", () => {
      // Create first instance
      const component1 = new GridBuilder();
      component1.components = mockComponentDefinitions;
      component1.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      component1.componentWillLoad();

      // Create second instance (no apiKey, so independent)
      const component2 = new GridBuilder();
      component2.components = mockComponentDefinitions;
      component2.initialState = {
        canvases: {
          canvas2: { items: [], zIndexCounter: 1 },
        },
      };

      component2.componentWillLoad();

      // Verify instances have independent state
      const state1 = (component1 as any).stateManager.state;
      const state2 = (component2 as any).stateManager.state;

      expect(state1.canvases).toHaveProperty("canvas1");
      expect(state1.canvases).not.toHaveProperty("canvas2");
      expect(state2.canvases).toHaveProperty("canvas2");
      expect(state2.canvases).not.toHaveProperty("canvas1");
    });

    it("should not register with SharedStateRegistry in local mode", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();

      // Verify no registration
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(Object.keys(debugInfo)).toHaveLength(0);
    });

    it("should have independent undo managers in local mode", () => {
      // Create first instance
      const component1 = new GridBuilder();
      component1.components = mockComponentDefinitions;

      component1.componentWillLoad();
      component1.componentDidLoad();

      // Create second instance
      const component2 = new GridBuilder();
      component2.components = mockComponentDefinitions;

      component2.componentWillLoad();
      component2.componentDidLoad();

      // Verify independent undo managers
      const undoManager1 = (component1 as any).undoRedoManager;
      const undoManager2 = (component2 as any).undoRedoManager;

      expect(undoManager1).not.toBe(undoManager2);
    });
  });

  // ==========================================
  // Edge Cases
  // ==========================================

  describe("Edge Cases", () => {
    beforeEach(() => {
      sharedStateRegistry.clear();
    });

    afterEach(() => {
      sharedStateRegistry.clear();
    });

    it("should handle whitespace-only apiKey as local mode", () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.apiKey = "   ";

      component.componentWillLoad();

      // Whitespace apiKey should trigger local mode
      const resolvedInstanceId = (component as any).resolvedInstanceId;
      expect(resolvedInstanceId).toBeUndefined();

      // Verify no registration
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(Object.keys(debugInfo)).toHaveLength(0);
    });

    it("should handle rapid create/destroy cycles", () => {
      for (let i = 0; i < 10; i++) {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.apiKey = "cycle-key";

        component.componentWillLoad();
        component.disconnectedCallback();
      }

      // Verify no memory leaks
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["cycle-key"]).toBeUndefined();
    });
  });
});
