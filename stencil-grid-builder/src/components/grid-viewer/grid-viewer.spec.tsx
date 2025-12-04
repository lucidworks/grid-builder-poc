/**
 * Grid Viewer Component - Unit Tests
 * ===================================
 *
 * Tests for grid-viewer component with focus on:
 * - Local mode (backward compatibility)
 * - Shared mode (multi-instance coordination)
 * - SharedStateRegistry integration
 * - Reference counting lifecycle
 */

// Mock ResizeObserver BEFORE importing GridViewer
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

(global as any).ResizeObserver = jest.fn(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

import { newSpecPage } from "@stencil/core/testing";
import { GridViewer } from "./grid-viewer";
import { sharedStateRegistry } from "../../services/shared-state-registry";
import { ComponentDefinition } from "../../types/component-definition";
import { h } from "@stencil/core";

// Mock component definitions for testing
const mockComponents: ComponentDefinition[] = [
  {
    type: "header",
    name: "Header",
    icon: "📄",
    defaultSize: { width: 20, height: 6 },
    render: ({ config }) => <div class="mock-header">{config?.text}</div>,
    renderDragClone: () => <div class="mock-header-clone">Header</div>,
  },
  {
    type: "text",
    name: "Text",
    icon: "📝",
    defaultSize: { width: 15, height: 8 },
    render: ({ config }) => <div class="mock-text">{config?.content}</div>,
    renderDragClone: () => <div class="mock-text-clone">Text</div>,
  },
];

describe("GridViewer", () => {
  beforeEach(() => {
    // Clear SharedStateRegistry before each test
    sharedStateRegistry.clear();
  });

  afterEach(() => {
    // Cleanup after each test
    sharedStateRegistry.clear();
  });

  // ==========================================
  // Local Mode Tests (Backward Compatibility)
  // ==========================================

  describe("Local Mode (No apiKey)", () => {
    it("should render in local mode without apiKey", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer></grid-viewer>`,
      });

      page.root.components = mockComponents;
      page.root.initialState = {
        canvases: {
          canvas1: {
            items: [
              {
                id: "item-1",
                canvasId: "canvas1",
                type: "header",
                name: "Test Header",
                zIndex: 1,
                layouts: {
                  desktop: {
                    x: 10,
                    y: 10,
                    width: 20,
                    height: 6,
                    customized: true,
                  },
                  mobile: {
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 6,
                    customized: false,
                  },
                },
                config: { text: "Test" },
              },
            ],
            zIndexCounter: 2,
          },
        },
        currentViewport: "desktop",
      };

      await page.waitForChanges();

      expect(page.root).toBeTruthy();
      expect(page.rootInstance.apiKey).toBeUndefined();
    });

    it("should have independent state between instances (local mode)", async () => {
      // Create first instance
      const page1 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer></grid-viewer>`,
      });

      page1.root.components = mockComponents;
      page1.root.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      await page1.waitForChanges();

      // Create second instance (no apiKey, so independent)
      const page2 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer></grid-viewer>`,
      });

      page2.root.components = mockComponents;
      page2.root.initialState = {
        canvases: {
          canvas2: { items: [], zIndexCounter: 1 },
        },
      };

      await page2.waitForChanges();

      // Verify instances have independent state
      const state1 = (page1.rootInstance as any).viewerState.state;
      const state2 = (page2.rootInstance as any).viewerState.state;

      expect(state1.canvases).toHaveProperty("canvas1");
      expect(state1.canvases).not.toHaveProperty("canvas2");
      expect(state2.canvases).toHaveProperty("canvas2");
      expect(state2.canvases).not.toHaveProperty("canvas1");
    });

    it("should not register with SharedStateRegistry in local mode", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer></grid-viewer>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Verify no registration
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(Object.keys(debugInfo)).toHaveLength(0);
    });

    it("should handle initialState prop updates in local mode", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer></grid-viewer>`,
      });

      page.root.components = mockComponents;
      page.root.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
        currentViewport: "desktop",
      };

      await page.waitForChanges();

      // Update initialState
      page.root.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
          canvas2: { items: [], zIndexCounter: 1 },
        },
        currentViewport: "mobile",
      };

      await page.waitForChanges();

      const state = (page.rootInstance as any).viewerState.state;
      expect(state.canvases).toHaveProperty("canvas2");
      expect(state.currentViewport).toBe("mobile");
    });
  });

  // ==========================================
  // Shared Mode Tests (Multi-Instance)
  // ==========================================

  describe("Shared Mode (With apiKey)", () => {
    it("should register with SharedStateRegistry in shared mode", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="test-key"></grid-viewer>`,
      });

      page.root.components = mockComponents;
      page.root.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      await page.waitForChanges();

      // Verify registration
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["test-key"]).toBeDefined();
      expect(debugInfo["test-key"].refCount).toBe(1);
      expect(debugInfo["test-key"].canvasCount).toBe(1);
    });

    it("should share canvases data across instances with same apiKey", async () => {
      // Create first instance
      const page1 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page1.root.components = mockComponents;
      page1.root.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      await page1.waitForChanges();

      // Create second instance with same apiKey
      const page2 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page2.root.components = mockComponents;
      await page2.waitForChanges();

      // Verify both instances share the same canvases data
      const sharedStore1 = (page1.rootInstance as any).sharedDataStore;
      const sharedStore2 = (page2.rootInstance as any).sharedDataStore;

      expect(sharedStore1).toBe(sharedStore2);
      expect(sharedStore1.state.canvases).toBe(sharedStore2.state.canvases);

      // Verify refCount
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["shared-key"].refCount).toBe(2);
    });

    it("should have independent viewports across instances", async () => {
      // Create first instance (mobile viewport)
      const page1 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page1.root.components = mockComponents;
      page1.root.initialState = {
        canvases: { canvas1: { items: [], zIndexCounter: 1 } },
        currentViewport: "mobile",
      };

      await page1.waitForChanges();

      // Create second instance (desktop viewport)
      const page2 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page2.root.components = mockComponents;
      page2.root.initialState = {
        currentViewport: "desktop",
      };

      await page2.waitForChanges();

      // Verify independent viewports
      const state1 = (page1.rootInstance as any).viewerState.state;
      const state2 = (page2.rootInstance as any).viewerState.state;

      expect(state1.currentViewport).toBe("mobile");
      expect(state2.currentViewport).toBe("desktop");

      // But canvases are shared
      expect(state1.canvases).toBe(state2.canvases);
    });

    it("should isolate data between different apiKeys", async () => {
      // Create instance with apiKey="key1"
      const page1 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="key1"></grid-viewer>`,
      });

      page1.root.components = mockComponents;
      page1.root.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      await page1.waitForChanges();

      // Create instance with apiKey="key2"
      const page2 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="key2"></grid-viewer>`,
      });

      page2.root.components = mockComponents;
      page2.root.initialState = {
        canvases: {
          canvas2: { items: [], zIndexCounter: 1 },
        },
      };

      await page2.waitForChanges();

      // Verify separate shared stores
      const sharedStore1 = (page1.rootInstance as any).sharedDataStore;
      const sharedStore2 = (page2.rootInstance as any).sharedDataStore;

      expect(sharedStore1).not.toBe(sharedStore2);
      expect(sharedStore1.state.canvases).toHaveProperty("canvas1");
      expect(sharedStore1.state.canvases).not.toHaveProperty("canvas2");
      expect(sharedStore2.state.canvases).toHaveProperty("canvas2");
      expect(sharedStore2.state.canvases).not.toHaveProperty("canvas1");

      // Verify separate registry entries
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["key1"].refCount).toBe(1);
      expect(debugInfo["key2"].refCount).toBe(1);
    });

    it("should auto-generate instanceId if not provided", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="test-key"></grid-viewer>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const resolvedInstanceId = (page.rootInstance as any).resolvedInstanceId;
      expect(resolvedInstanceId).toBeDefined();
      expect(resolvedInstanceId).toMatch(/^grid-viewer-\d+-[a-z0-9]+$/);
    });

    it("should use provided instanceId", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="test-key" instance-id="custom-id"></grid-viewer>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const resolvedInstanceId = (page.rootInstance as any).resolvedInstanceId;
      expect(resolvedInstanceId).toBe("custom-id");
    });

    it("should normalize empty apiKey to undefined (local mode)", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key=""></grid-viewer>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Empty apiKey should trigger local mode
      const sharedStore = (page.rootInstance as any).sharedDataStore;
      expect(sharedStore).toBeUndefined();

      // Verify no registration
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(Object.keys(debugInfo)).toHaveLength(0);
    });
  });

  // ==========================================
  // Lifecycle Tests (Reference Counting)
  // ==========================================

  describe("Lifecycle and Reference Counting", () => {
    it("should unregister on disconnectedCallback", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="test-key"></grid-viewer>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Verify registered
      let debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["test-key"].refCount).toBe(1);

      // Disconnect
      page.root.disconnectedCallback();

      // Verify unregistered and store disposed
      debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["test-key"]).toBeUndefined();
    });

    it("should maintain shared store when one instance disconnects", async () => {
      // Create first instance
      const page1 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page1.root.components = mockComponents;
      await page1.waitForChanges();

      // Create second instance
      const page2 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page2.root.components = mockComponents;
      await page2.waitForChanges();

      // Verify refCount = 2
      let debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["shared-key"].refCount).toBe(2);

      // Disconnect first instance
      page1.root.disconnectedCallback();

      // Verify refCount = 1, store still exists
      debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["shared-key"].refCount).toBe(1);
      expect(debugInfo["shared-key"]).toBeDefined();
    });

    it("should dispose shared store when last instance disconnects", async () => {
      // Create first instance
      const page1 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page1.root.components = mockComponents;
      await page1.waitForChanges();

      // Create second instance
      const page2 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page2.root.components = mockComponents;
      await page2.waitForChanges();

      // Disconnect both instances
      page1.root.disconnectedCallback();
      page2.root.disconnectedCallback();

      // Verify store disposed
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["shared-key"]).toBeUndefined();
    });
  });

  // ==========================================
  // Props Update Tests
  // ==========================================

  describe("Props Updates in Shared Mode", () => {
    it("should update shared data when initialState changes (shared mode)", async () => {
      // Create two instances with same apiKey
      const page1 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page1.root.components = mockComponents;
      page1.root.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      await page1.waitForChanges();

      const page2 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page2.root.components = mockComponents;
      await page2.waitForChanges();

      // Update initialState in first instance
      page1.root.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
          canvas2: { items: [], zIndexCounter: 1 },
        },
      };

      await page1.waitForChanges();

      // Verify both instances see the update
      const sharedStore = (page2.rootInstance as any).sharedDataStore;
      expect(sharedStore.state.canvases).toHaveProperty("canvas2");
    });

    it("should update instance viewport independently (shared mode)", async () => {
      const page1 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page1.root.components = mockComponents;
      page1.root.initialState = {
        canvases: { canvas1: { items: [], zIndexCounter: 1 } },
        currentViewport: "desktop",
      };

      await page1.waitForChanges();

      const page2 = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="shared-key"></grid-viewer>`,
      });

      page2.root.components = mockComponents;
      page2.root.initialState = {
        currentViewport: "mobile",
      };

      await page2.waitForChanges();

      // Update viewport in first instance
      page1.root.initialState = {
        currentViewport: "mobile",
      };

      await page1.waitForChanges();

      // Verify first instance viewport changed
      const state1 = (page1.rootInstance as any).viewerState.state;
      expect(state1.currentViewport).toBe("mobile");

      // Verify second instance viewport unchanged
      const state2 = (page2.rootInstance as any).viewerState.state;
      expect(state2.currentViewport).toBe("mobile");
    });

    it("should handle GridExport format in shared mode", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="test-key"></grid-viewer>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      page.root.initialState = {
        viewport: "desktop",
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
        },
      };

      await page.waitForChanges();

      const sharedStore = (page.rootInstance as any).sharedDataStore;
      const instanceState = (page.rootInstance as any).viewerState.state;

      expect(sharedStore.state.canvases).toHaveProperty("canvas1");
      expect(instanceState.currentViewport).toBe("desktop");
    });
  });

  // ==========================================
  // Edge Cases
  // ==========================================

  describe("Edge Cases", () => {
    it("should handle whitespace-only apiKey as local mode", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="   "></grid-viewer>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Whitespace apiKey should trigger local mode
      const sharedStore = (page.rootInstance as any).sharedDataStore;
      expect(sharedStore).toBeUndefined();

      // Verify no registration
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(Object.keys(debugInfo)).toHaveLength(0);
    });

    it("should handle missing components prop gracefully", async () => {
      const page = await newSpecPage({
        components: [GridViewer],
        html: `<grid-viewer api-key="test-key"></grid-viewer>`,
      });

      // Don't set components prop
      await page.waitForChanges();

      // Should not crash, but may log error
      expect(page.root).toBeTruthy();
    });

    it("should handle rapid create/destroy cycles", async () => {
      for (let i = 0; i < 10; i++) {
        const page = await newSpecPage({
          components: [GridViewer],
          html: `<grid-viewer api-key="cycle-key"></grid-viewer>`,
        });

        page.root.components = mockComponents;
        await page.waitForChanges();

        page.root.disconnectedCallback();
      }

      // Verify no memory leaks
      const debugInfo = sharedStateRegistry.getDebugInfo();
      expect(debugInfo["cycle-key"]).toBeUndefined();
    });
  });
});
