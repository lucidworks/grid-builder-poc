/**
 * Plugin System Tests - Simplified
 * ==================================
 *
 * Tests for plugin registration, lifecycle, and hook invocation.
 */

import { GridBuilderAPI } from "../services/grid-builder-api";
import { reset as resetState, gridState } from "../services/state-manager";
import { clearHistory } from "../services/undo-redo";

/**
 * Mock Logger Plugin
 */
class MockLoggerPlugin {
  name = "mock-logger";
  version = "1.0.0";
  api: GridBuilderAPI | null = null;
  initCalled = false;
  destroyCalled = false;
  events: { type: string; data: any }[] = [];

  init(api: GridBuilderAPI): void {
    this.api = api;
    this.initCalled = true;

    api.on("itemAdded", (event) => {
      this.events.push({ type: "itemAdded", data: event });
    });
    api.on("itemRemoved", (event) => {
      this.events.push({ type: "itemRemoved", data: event });
    });
  }

  destroy(): void {
    this.destroyCalled = true;
  }

  getEventCount(type: string): number {
    return this.events.filter((e) => e.type === type).length;
  }
}

describe("Plugin System - Standalone", () => {
  beforeEach(() => {
    resetState();
    clearHistory();

    // Create test canvases (library now starts empty in Phase 2)
    gridState.canvases = {
      canvas1: { items: [], zIndexCounter: 0 },
      canvas2: { items: [], zIndexCounter: 0 },
      canvas3: { items: [], zIndexCounter: 0 },
    };
  });

  describe("Plugin Interface Implementation", () => {
    it("should create plugin with required properties", () => {
      const plugin = new MockLoggerPlugin();

      expect(plugin.name).toBe("mock-logger");
      expect(plugin.version).toBe("1.0.0");
      expect(typeof plugin.init).toBe("function");
      expect(typeof plugin.destroy).toBe("function");
    });

    it("should call init with API instance", () => {
      const plugin = new MockLoggerPlugin();
      const mockAPI = new GridBuilderAPI();

      plugin.init(mockAPI);

      expect(plugin.initCalled).toBe(true);
      expect(plugin.api).toBe(mockAPI);
    });

    it("should subscribe to events during init", () => {
      const plugin = new MockLoggerPlugin();
      const mockAPI = new GridBuilderAPI();

      plugin.init(mockAPI);

      // Add an item
      mockAPI.addItem("canvas1", "header", 0, 0, 10, 10);

      expect(plugin.getEventCount("itemAdded")).toBe(1);
    });

    it("should call destroy when cleanup needed", () => {
      const plugin = new MockLoggerPlugin();
      const mockAPI = new GridBuilderAPI();

      plugin.init(mockAPI);
      plugin.destroy();

      expect(plugin.destroyCalled).toBe(true);
    });
  });

  describe("Plugin Event Subscriptions", () => {
    it("should receive itemAdded events", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      api.addItem("canvas1", "header", 0, 0, 10, 10);

      expect(plugin.getEventCount("itemAdded")).toBe(1);
      expect(plugin.events[0].type).toBe("itemAdded");
      expect(plugin.events[0].data.item.type).toBe("header");
    });

    it("should receive itemRemoved events", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      const item = api.addItem("canvas1", "header", 0, 0, 10, 10);
      plugin.events = []; // Clear add event

      api.removeItem("canvas1", item.id);

      expect(plugin.getEventCount("itemRemoved")).toBe(1);
      expect(plugin.events[0].data.itemId).toBe(item.id);
    });
  });

  describe("Plugin API Access", () => {
    it("should allow plugins to access grid state", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      const state = plugin.api?.getState();
      expect(state).toBeDefined();
      expect(state?.canvases).toBeDefined();
    });

    it("should allow plugins to modify grid state", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      const item = plugin.api?.addItem("canvas1", "header", 0, 0, 10, 10);

      expect(item).toBeDefined();
      expect(item?.type).toBe("header");
    });

    it("should allow plugins to use undo/redo", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      // Add item (undo history is shared across API instances)
      api.addItem("canvas1", "header", 0, 0, 10, 10);
      expect(api.canUndo()).toBe(true);

      // Undo via API
      api.undo();
      const canvas = api.getCanvas("canvas1");
      expect(canvas?.items.length).toBe(0);

      // Redo via API
      expect(api.canRedo()).toBe(true);
      api.redo();
      expect(canvas?.items.length).toBe(1);
    });
  });

  describe("Plugin Batch Operations", () => {
    it("should allow plugins to use addItemsBatch", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      const itemIds = plugin.api?.addItemsBatch([
        {
          canvasId: "canvas1",
          type: "header",
          x: 0,
          y: 0,
          width: 10,
          height: 6,
        },
        {
          canvasId: "canvas1",
          type: "text",
          x: 0,
          y: 10,
          width: 10,
          height: 6,
        },
      ]);

      expect(itemIds).toBeDefined();
      expect(itemIds?.length).toBe(2);

      const canvas = api.getCanvas("canvas1");
      expect(canvas?.items.length).toBe(2);
    });

    it("should allow plugins to use deleteItemsBatch", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      const itemIds = plugin.api?.addItemsBatch([
        {
          canvasId: "canvas1",
          type: "header",
          x: 0,
          y: 0,
          width: 10,
          height: 6,
        },
        {
          canvasId: "canvas1",
          type: "text",
          x: 0,
          y: 10,
          width: 10,
          height: 6,
        },
      ]);

      plugin.api?.deleteItemsBatch(itemIds || []);

      const canvas = api.getCanvas("canvas1");
      expect(canvas?.items.length).toBe(0);
    });

    it("should allow plugins to use updateConfigsBatch", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      const itemIds = plugin.api?.addItemsBatch([
        {
          canvasId: "canvas1",
          type: "header",
          x: 0,
          y: 0,
          width: 10,
          height: 6,
          config: { text: "Old" },
        },
      ]);

      plugin.api?.updateConfigsBatch([
        { itemId: itemIds![0], config: { text: "New" } },
      ]);

      const canvas = api.getCanvas("canvas1");
      const item = canvas?.items.find((i) => i.id === itemIds![0]);
      expect(item?.config?.text).toBe("New");
    });

    it("should receive batch events from batch operations", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      // Subscribe to batch events
      const batchEvents: any[] = [];
      plugin.api?.on("itemsBatchAdded", (event) => {
        batchEvents.push({ type: "batchAdded", data: event });
      });

      plugin.api?.addItemsBatch([
        {
          canvasId: "canvas1",
          type: "header",
          x: 0,
          y: 0,
          width: 10,
          height: 6,
        },
        {
          canvasId: "canvas1",
          type: "text",
          x: 0,
          y: 10,
          width: 10,
          height: 6,
        },
      ]);

      expect(batchEvents.length).toBe(1);
      expect(batchEvents[0].type).toBe("batchAdded");
    });

    it("should allow batch operations with undo/redo", () => {
      const plugin = new MockLoggerPlugin();
      const api = new GridBuilderAPI();

      plugin.init(api);

      plugin.api?.addItemsBatch([
        {
          canvasId: "canvas1",
          type: "header",
          x: 0,
          y: 0,
          width: 10,
          height: 6,
        },
        {
          canvasId: "canvas1",
          type: "text",
          x: 0,
          y: 10,
          width: 10,
          height: 6,
        },
      ]);

      expect(api.canUndo()).toBe(true);

      // Undo batch add
      api.undo();
      const canvas1 = api.getCanvas("canvas1");
      expect(canvas1?.items.length).toBe(0);

      // Redo batch add
      api.redo();
      const canvas2 = api.getCanvas("canvas1");
      expect(canvas2?.items.length).toBe(2);
    });
  });
});
