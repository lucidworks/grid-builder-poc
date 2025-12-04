/**
 * Unit tests for extracted helper methods from grid-viewer.tsx
 *
 * These tests verify the refactored helper methods that were extracted
 * to reduce cyclomatic complexity in componentWillLoad() and handleInitialStateChange().
 *
 * Testing Approach:
 * - Tests focus on individual method logic in isolation
 * - Mock minimal dependencies as needed
 * - Verify method behavior without full component lifecycle
 */

import { GridViewer } from "./grid-viewer";
import { DEFAULT_BREAKPOINTS } from "../../services/state-manager";
import { ComponentRegistry } from "../../services/component-registry";

describe("GridViewer Helper Methods", () => {
  let component: any;

  beforeEach(() => {
    // Create minimal component instance for testing helper methods
    component = new GridViewer();
  });

  // ============================================================================
  // validateComponents Tests
  // ============================================================================

  describe("validateComponents", () => {
    it("should return true when components prop is valid", () => {
      component.components = [
        { type: "test", name: "Test", icon: "🧪", render: () => null },
      ];

      const result = component.validateComponents(
        undefined,
        DEFAULT_BREAKPOINTS,
      );

      expect(result).toBe(true);
    });

    it("should return false when components prop is empty array", () => {
      component.components = [];

      const result = component.validateComponents(
        undefined,
        DEFAULT_BREAKPOINTS,
      );

      expect(result).toBe(false);
      expect(component.viewerState).toBeDefined();
    });

    it("should return false when components prop is undefined", () => {
      component.components = undefined;

      const result = component.validateComponents(
        undefined,
        DEFAULT_BREAKPOINTS,
      );

      expect(result).toBe(false);
      expect(component.viewerState).toBeDefined();
    });

    it("should initialize local mode state when invalid and no apiKey", () => {
      component.components = [];

      const result = component.validateComponents(
        undefined,
        DEFAULT_BREAKPOINTS,
      );

      expect(result).toBe(false);
      expect(component.viewerState).toBeDefined();
      expect(component.viewerState.state.canvases).toEqual({});
      expect(component.viewerState.state.currentViewport).toBe("desktop");
      expect(component.sharedDataStore).toBeUndefined();
    });

    it("should initialize shared mode state when invalid and apiKey provided", () => {
      component.components = [];
      component.instanceId = "test-instance";

      const result = component.validateComponents(
        "test-api-key",
        DEFAULT_BREAKPOINTS,
      );

      expect(result).toBe(false);
      expect(component.viewerState).toBeDefined();
      expect(component.sharedDataStore).toBeDefined();
      expect(component.resolvedInstanceId).toBe("test-instance");
    });
  });

  // ============================================================================
  // buildComponentRegistry Tests
  // ============================================================================

  describe("buildComponentRegistry", () => {
    it("should build component registry from components prop", () => {
      component.components = [
        { type: "test1", name: "Test 1", icon: "🧪", render: () => null },
        { type: "test2", name: "Test 2", icon: "🔬", render: () => null },
      ];

      component.buildComponentRegistry();

      expect(component.componentRegistry).toBeInstanceOf(ComponentRegistry);
      expect(component.componentRegistry.size()).toBe(2);
    });

    it("should handle duplicate component types (size mismatch)", () => {
      component.components = [
        { type: "test", name: "Test 1", icon: "🧪", render: () => null },
        { type: "test", name: "Test 2", icon: "🔬", render: () => null }, // Duplicate type
      ];

      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      component.buildComponentRegistry();

      // Registry should deduplicate (size = 1, not 2)
      expect(component.componentRegistry.size()).toBe(1);
      // Note: The warning logic is commented out in implementation, so no warn expected

      warnSpy.mockRestore();
    });
  });

  // ============================================================================
  // initializeSharedMode Tests
  // ============================================================================

  describe("initializeSharedMode", () => {
    beforeEach(() => {
      component.components = [
        { type: "test", name: "Test", icon: "🧪", render: () => null },
      ];
    });

    it("should generate instance ID when not provided", () => {
      component.instanceId = undefined;

      component.initializeSharedMode("test-api-key", DEFAULT_BREAKPOINTS);

      expect(component.resolvedInstanceId).toBeDefined();
      expect(component.resolvedInstanceId).toContain("grid-viewer-");
    });

    it("should use provided instance ID", () => {
      component.instanceId = "my-custom-id";

      component.initializeSharedMode("test-api-key", DEFAULT_BREAKPOINTS);

      expect(component.resolvedInstanceId).toBe("my-custom-id");
    });

    it("should create shared data store and viewer state", () => {
      component.initializeSharedMode("test-api-key", DEFAULT_BREAKPOINTS);

      expect(component.sharedDataStore).toBeDefined();
      expect(component.viewerState).toBeDefined();
      expect(component.viewerState.state.currentViewport).toBe("desktop");
    });

    it("should extract canvas data from GridExport format", () => {
      component.initialState = {
        viewport: "mobile",
        canvases: {
          canvas1: { items: [] },
        },
      };

      // Use unique API key to avoid registry conflicts
      const uniqueApiKey = `test-api-key-${Date.now()}-gridexport`;
      component.initializeSharedMode(uniqueApiKey, DEFAULT_BREAKPOINTS);

      expect(component.sharedDataStore.state.canvases).toEqual({
        canvas1: { items: [] },
      });
      expect(component.viewerState.state.currentViewport).toBe("mobile");
    });

    it("should extract canvas data from ViewerState format", () => {
      component.initialState = {
        currentViewport: "mobile",
        canvases: {
          canvas1: { items: [] },
        },
      };

      // Use unique API key to avoid registry conflicts
      const uniqueApiKey = `test-api-key-${Date.now()}-viewerstate`;
      component.initializeSharedMode(uniqueApiKey, DEFAULT_BREAKPOINTS);

      expect(component.sharedDataStore.state.canvases).toEqual({
        canvas1: { items: [] },
      });
      expect(component.viewerState.state.currentViewport).toBe("mobile");
    });

    it("should initialize with empty canvases when no initialState", () => {
      component.initialState = undefined;

      component.initializeSharedMode("test-api-key", DEFAULT_BREAKPOINTS);

      expect(component.sharedDataStore.state.canvases).toEqual({});
    });
  });

  // ============================================================================
  // initializeLocalMode Tests
  // ============================================================================

  describe("initializeLocalMode", () => {
    it("should create local viewer state with default values", () => {
      component.initializeLocalMode(DEFAULT_BREAKPOINTS);

      expect(component.viewerState).toBeDefined();
      expect(component.viewerState.state.currentViewport).toBe("desktop");
      expect(component.viewerState.state.canvases).toEqual({});
      expect(component.viewerState.state.selectedItemId).toBeNull();
      expect(component.viewerState.state.breakpoints).toEqual(
        DEFAULT_BREAKPOINTS,
      );
    });

    it("should restore state from GridExport format", () => {
      component.initialState = {
        viewport: "mobile",
        canvases: {
          canvas1: { items: [] },
        },
      };

      component.initializeLocalMode(DEFAULT_BREAKPOINTS);

      expect(component.viewerState.state.currentViewport).toBe("mobile");
      expect(component.viewerState.state.canvases).toEqual({
        canvas1: { items: [] },
      });
    });

    it("should restore state from ViewerState format", () => {
      component.initialState = {
        currentViewport: "mobile",
        canvases: {
          canvas1: { items: [] },
        },
      };

      component.initializeLocalMode(DEFAULT_BREAKPOINTS);

      expect(component.viewerState.state.currentViewport).toBe("mobile");
      expect(component.viewerState.state.canvases).toEqual({
        canvas1: { items: [] },
      });
    });

    it("should not create shared data store in local mode", () => {
      component.initializeLocalMode(DEFAULT_BREAKPOINTS);

      expect(component.sharedDataStore).toBeUndefined();
    });
  });

  // ============================================================================
  // createVirtualRenderer Tests
  // ============================================================================

  describe("createVirtualRenderer", () => {
    it("should create virtual renderer when enabled (default)", () => {
      component.config = undefined; // Default behavior

      component.createVirtualRenderer();

      expect(component.virtualRendererInstance).toBeDefined();
    });

    it("should create virtual renderer when explicitly enabled", () => {
      component.config = { enableVirtualRendering: true };

      component.createVirtualRenderer();

      expect(component.virtualRendererInstance).toBeDefined();
    });

    it("should not create virtual renderer when disabled", () => {
      component.config = { enableVirtualRendering: false };

      component.createVirtualRenderer();

      expect(component.virtualRendererInstance).toBeUndefined();
    });
  });

  // ============================================================================
  // updateSharedModeState Tests
  // ============================================================================

  describe("updateSharedModeState", () => {
    beforeEach(() => {
      // Initialize shared mode state first
      component.components = [
        { type: "test", name: "Test", icon: "🧪", render: () => null },
      ];
      component.initializeSharedMode("test-api-key", DEFAULT_BREAKPOINTS);
    });

    it("should update state from GridExport format", () => {
      const newState = {
        viewport: "mobile",
        canvases: {
          canvas2: { items: [{ id: "item1" }] },
        },
      };

      component.updateSharedModeState(newState, "test-api-key");

      expect(component.viewerState.state.currentViewport).toBe("mobile");
      expect(component.sharedDataStore.state.canvases).toEqual({
        canvas2: { items: [{ id: "item1" }] },
      });
      // Verify reference is synced
      expect(component.viewerState.state.canvases).toBe(
        component.sharedDataStore.state.canvases,
      );
    });

    it("should update state from ViewerState format - viewport only", () => {
      const newState = {
        currentViewport: "mobile",
      };

      component.updateSharedModeState(newState, "test-api-key");

      expect(component.viewerState.state.currentViewport).toBe("mobile");
    });

    it("should update state from ViewerState format - canvases only", () => {
      const newState = {
        canvases: {
          canvas3: { items: [] },
        },
      };

      component.updateSharedModeState(newState, "test-api-key");

      expect(component.sharedDataStore.state.canvases).toEqual({
        canvas3: { items: [] },
      });
      // Verify reference is synced
      expect(component.viewerState.state.canvases).toBe(
        component.sharedDataStore.state.canvases,
      );
    });

    it("should update state from ViewerState format - both viewport and canvases", () => {
      const newState = {
        currentViewport: "mobile",
        canvases: {
          canvas4: { items: [] },
        },
      };

      component.updateSharedModeState(newState, "test-api-key");

      expect(component.viewerState.state.currentViewport).toBe("mobile");
      expect(component.sharedDataStore.state.canvases).toEqual({
        canvas4: { items: [] },
      });
    });
  });

  // ============================================================================
  // updateLocalModeState Tests
  // ============================================================================

  describe("updateLocalModeState", () => {
    beforeEach(() => {
      // Initialize local mode state first
      component.components = [
        { type: "test", name: "Test", icon: "🧪", render: () => null },
      ];
      component.initializeLocalMode(DEFAULT_BREAKPOINTS);
    });

    it("should update state from GridExport format", () => {
      const newState = {
        viewport: "mobile",
        canvases: {
          canvas2: { items: [{ id: "item1" }] },
        },
      };

      component.updateLocalModeState(newState);

      expect(component.viewerState.state.currentViewport).toBe("mobile");
      expect(component.viewerState.state.canvases).toEqual({
        canvas2: { items: [{ id: "item1" }] },
      });
    });

    it("should update state from ViewerState format using Object.assign", () => {
      const newState = {
        currentViewport: "mobile",
        canvases: {
          canvas3: { items: [] },
        },
      };

      component.updateLocalModeState(newState);

      expect(component.viewerState.state.currentViewport).toBe("mobile");
      expect(component.viewerState.state.canvases).toEqual({
        canvas3: { items: [] },
      });
    });

    it("should preserve other state fields when updating", () => {
      // Set initial state
      component.viewerState.state.selectedItemId = null;
      component.viewerState.state.breakpoints = DEFAULT_BREAKPOINTS;

      const newState = {
        currentViewport: "mobile",
      };

      component.updateLocalModeState(newState);

      expect(component.viewerState.state.currentViewport).toBe("mobile");
      expect(component.viewerState.state.selectedItemId).toBeNull();
      expect(component.viewerState.state.breakpoints).toEqual(
        DEFAULT_BREAKPOINTS,
      );
    });
  });
});
