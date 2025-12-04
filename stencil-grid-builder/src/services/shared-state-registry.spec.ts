/**
 * Shared State Registry - Unit Tests
 * ===================================
 *
 * Comprehensive test suite for multi-instance shared state management.
 * Tests reference counting, state isolation, and proper disposal.
 *
 * ## Why SharedStateRegistry is a Singleton
 *
 * Unlike StateManager (which is instantiated per grid-builder), SharedStateRegistry
 * is intentionally a module-level singleton to enable cross-instance coordination.
 *
 * **Multi-instance scenario**:
 * - Instance 1: apiKey="demo", displays mobile viewport
 * - Instance 2: apiKey="demo", displays desktop viewport
 * - Instance 3: apiKey="other", displays tablet viewport
 *
 * **Registry coordinates**:
 * - Instances 1 & 2 share canvases data (same API key)
 * - Instance 3 has separate canvases data (different API key)
 * - Reference counting: when Instance 1 & 2 disconnect, "demo" data is disposed
 *
 * This is the Stencil-y pattern: module-level service for cross-component state.
 */

import { sharedStateRegistry } from "./shared-state-registry";
import { UndoRedoManager } from "./undo-redo";

describe("SharedStateRegistry", () => {
  beforeEach(() => {
    // Clear all shared states before each test
    sharedStateRegistry.clear();
  });

  afterEach(() => {
    // Cleanup after each test
    sharedStateRegistry.clear();
  });

  // ==========================================
  // Cross-Instance Coordination Tests
  // ==========================================

  describe("Cross-Instance Coordination", () => {
    it("should provide shared registry across all grid-builder instances", () => {
      // Simulate two instances accessing the registry
      const entry1 = sharedStateRegistry.getOrCreate("test-key");
      entry1.store.state.canvases = {
        canvas1: { items: [], zIndexCounter: 1 },
      };

      // Second instance gets same shared store
      const entry2 = sharedStateRegistry.getOrCreate("test-key");

      expect(entry1).toBe(entry2);
      expect(entry2.store.state.canvases).toHaveProperty("canvas1");
    });
  });

  // ==========================================
  // Shared Data Creation Tests
  // ==========================================

  describe("Shared Data Creation", () => {
    it("should create new shared data for new API key", () => {
      const entry = sharedStateRegistry.getOrCreate("api-key-1");

      expect(entry).toBeDefined();
      expect(entry.store.state.canvases).toEqual({});
      expect(entry.refCount).toBe(0);
      expect(entry.undoManager).toBeInstanceOf(UndoRedoManager);
    });

    it("should return existing shared data for same API key", () => {
      const entry1 = sharedStateRegistry.getOrCreate("api-key-1");
      const entry2 = sharedStateRegistry.getOrCreate("api-key-1");

      expect(entry1).toBe(entry2);
    });

    it("should create separate shared data for different API keys", () => {
      const entry1 = sharedStateRegistry.getOrCreate("api-key-1");
      const entry2 = sharedStateRegistry.getOrCreate("api-key-2");

      expect(entry1).not.toBe(entry2);
      expect(entry1.store.state).not.toBe(entry2.store.state);
    });

    it("should initialize canvases with provided initial state", () => {
      const initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 1 },
          canvas2: { items: [], zIndexCounter: 1 },
        },
      };

      const entry = sharedStateRegistry.getOrCreate("test-key", initialState);

      expect(entry.store.state.canvases).toEqual(initialState.canvases);
    });

    it("should ignore initial state for existing API key", () => {
      const initialState1 = {
        canvases: { canvas1: { items: [], zIndexCounter: 1 } },
      };
      const initialState2 = {
        canvases: { canvas2: { items: [], zIndexCounter: 2 } },
      };

      const entry1 = sharedStateRegistry.getOrCreate("test-key", initialState1);
      const entry2 = sharedStateRegistry.getOrCreate("test-key", initialState2);

      // Should use initial state from first call only
      expect(entry1).toBe(entry2);
      expect(entry2.store.state.canvases).toEqual(initialState1.canvases);
      expect(entry2.store.state.canvases).not.toEqual(initialState2.canvases);
    });
  });

  // ==========================================
  // Reference Counting Tests
  // ==========================================

  describe("Reference Counting", () => {
    it("should increment reference count on addInstance", () => {
      const entry = sharedStateRegistry.getOrCreate("api-key-1");
      expect(entry.refCount).toBe(0);

      sharedStateRegistry.addInstance("api-key-1", "instance-1");
      expect(entry.refCount).toBe(1);

      sharedStateRegistry.addInstance("api-key-1", "instance-2");
      expect(entry.refCount).toBe(2);

      sharedStateRegistry.addInstance("api-key-1", "instance-3");
      expect(entry.refCount).toBe(3);
    });

    it("should decrement reference count on removeInstance", () => {
      sharedStateRegistry.getOrCreate("api-key-1");
      sharedStateRegistry.addInstance("api-key-1", "instance-1");
      sharedStateRegistry.addInstance("api-key-1", "instance-2");
      sharedStateRegistry.addInstance("api-key-1", "instance-3");

      const entry = sharedStateRegistry.get("api-key-1");
      expect(entry.refCount).toBe(3);

      sharedStateRegistry.removeInstance("api-key-1", "instance-1");
      expect(entry.refCount).toBe(2);
    });

    it("should remove shared data when reference count reaches 0", () => {
      sharedStateRegistry.getOrCreate("api-key-1");
      sharedStateRegistry.addInstance("api-key-1", "instance-1");

      let entry = sharedStateRegistry.get("api-key-1");
      expect(entry).toBeDefined();

      sharedStateRegistry.removeInstance("api-key-1", "instance-1");

      entry = sharedStateRegistry.get("api-key-1");
      expect(entry).toBeUndefined();
    });

    it("should handle multiple add/remove cycles correctly", () => {
      sharedStateRegistry.getOrCreate("api-key-1");
      sharedStateRegistry.addInstance("api-key-1", "instance-1");
      sharedStateRegistry.addInstance("api-key-1", "instance-2");
      sharedStateRegistry.addInstance("api-key-1", "instance-3");

      let entry = sharedStateRegistry.get("api-key-1");
      expect(entry.refCount).toBe(3);

      sharedStateRegistry.removeInstance("api-key-1", "instance-1");
      sharedStateRegistry.removeInstance("api-key-1", "instance-2");

      entry = sharedStateRegistry.get("api-key-1");
      expect(entry.refCount).toBe(1);

      sharedStateRegistry.removeInstance("api-key-1", "instance-3");

      entry = sharedStateRegistry.get("api-key-1");
      expect(entry).toBeUndefined();
    });

    it("should handle addInstance for non-existent key gracefully", () => {
      // Should warn but not throw
      expect(() => {
        sharedStateRegistry.addInstance("non-existent", "instance-1");
      }).not.toThrow();
    });

    it("should handle removeInstance for non-existent key gracefully", () => {
      // Should warn but not throw
      expect(() => {
        sharedStateRegistry.removeInstance("non-existent", "instance-1");
      }).not.toThrow();
    });

    it("should maintain separate reference counts for different keys", () => {
      sharedStateRegistry.getOrCreate("key-1");
      sharedStateRegistry.getOrCreate("key-2");

      sharedStateRegistry.addInstance("key-1", "instance-1");
      sharedStateRegistry.addInstance("key-1", "instance-2");
      sharedStateRegistry.addInstance("key-2", "instance-3");

      const entry1 = sharedStateRegistry.get("key-1");
      const entry2 = sharedStateRegistry.get("key-2");

      expect(entry1.refCount).toBe(2);
      expect(entry2.refCount).toBe(1);
    });

    it("should track instance IDs correctly", () => {
      sharedStateRegistry.getOrCreate("test-key");
      sharedStateRegistry.addInstance("test-key", "instance-1");
      sharedStateRegistry.addInstance("test-key", "instance-2");

      const entry = sharedStateRegistry.get("test-key");
      expect(entry.instanceIds.has("instance-1")).toBe(true);
      expect(entry.instanceIds.has("instance-2")).toBe(true);
      expect(entry.instanceIds.size).toBe(2);

      sharedStateRegistry.removeInstance("test-key", "instance-1");
      expect(entry.instanceIds.has("instance-1")).toBe(false);
      expect(entry.instanceIds.has("instance-2")).toBe(true);
      expect(entry.instanceIds.size).toBe(1);
    });
  });

  // ==========================================
  // Undo/Redo Manager Tests
  // ==========================================

  describe("Undo/Redo Manager", () => {
    it("should create undo manager with shared data", () => {
      const entry = sharedStateRegistry.getOrCreate("api-key-1");

      expect(entry.undoManager).toBeDefined();
      expect(entry.undoManager).toBeInstanceOf(UndoRedoManager);
    });

    it("should return same undo manager for same API key", () => {
      const entry1 = sharedStateRegistry.getOrCreate("api-key-1");
      const entry2 = sharedStateRegistry.getOrCreate("api-key-1");

      expect(entry1.undoManager).toBe(entry2.undoManager);
    });

    it("should clear undo history when shared data is disposed", () => {
      sharedStateRegistry.getOrCreate("api-key-1");
      sharedStateRegistry.addInstance("api-key-1", "instance-1");

      const entry = sharedStateRegistry.get("api-key-1");
      const undoManager = entry.undoManager;

      // Add mock command to history
      const mockCommand = {
        execute: jest.fn(),
        undo: jest.fn(),
        redo: jest.fn(),
        getDescription: () => "Mock Command",
      };
      undoManager.push(mockCommand);

      expect(undoManager.getUndoStackSize()).toBe(1);

      // Remove last instance (should dispose)
      sharedStateRegistry.removeInstance("api-key-1", "instance-1");

      // Entry should be gone
      const disposedEntry = sharedStateRegistry.get("api-key-1");
      expect(disposedEntry).toBeUndefined();
    });

    it("should create separate undo managers for different API keys", () => {
      const entry1 = sharedStateRegistry.getOrCreate("key-1");
      const entry2 = sharedStateRegistry.getOrCreate("key-2");

      expect(entry1.undoManager).not.toBe(entry2.undoManager);
    });
  });

  // ==========================================
  // Data Isolation Tests
  // ==========================================

  describe("Data Isolation", () => {
    it("should isolate canvases between different API keys", () => {
      const entry1 = sharedStateRegistry.getOrCreate("key-1");
      const entry2 = sharedStateRegistry.getOrCreate("key-2");

      entry1.store.state.canvases = {
        canvas1: { items: [], zIndexCounter: 1 },
      };

      entry2.store.state.canvases = {
        canvas2: { items: [], zIndexCounter: 1 },
      };

      expect(entry1.store.state.canvases).toHaveProperty("canvas1");
      expect(entry1.store.state.canvases).not.toHaveProperty("canvas2");
      expect(entry2.store.state.canvases).toHaveProperty("canvas2");
      expect(entry2.store.state.canvases).not.toHaveProperty("canvas1");
    });

    it("should share canvases for same API key", () => {
      const entry1 = sharedStateRegistry.getOrCreate("key-1");
      const entry2 = sharedStateRegistry.getOrCreate("key-1");

      entry1.store.state.canvases = {
        canvas1: { items: [], zIndexCounter: 1 },
      };

      // Both entries should see the same canvases
      expect(entry2.store.state.canvases).toHaveProperty("canvas1");
      expect(entry1.store.state.canvases).toBe(entry2.store.state.canvases);
    });

    it("should reflect changes made through any entry", () => {
      const entry1 = sharedStateRegistry.getOrCreate("key-1");
      const entry2 = sharedStateRegistry.getOrCreate("key-1");

      entry1.store.state.canvases.canvas1 = { items: [], zIndexCounter: 1 };

      // Change should be visible through entry2
      expect(entry2.store.state.canvases.canvas1).toBeDefined();
      expect(entry2.store.state.canvases.canvas1.zIndexCounter).toBe(1);

      entry2.store.state.canvases.canvas1.zIndexCounter = 5;

      // Change should be visible through entry1
      expect(entry1.store.state.canvases.canvas1.zIndexCounter).toBe(5);
    });
  });

  // ==========================================
  // Multi-Instance Scenarios
  // ==========================================

  describe("Multi-Instance Scenarios", () => {
    it("should support 3 instances sharing same data", () => {
      const entry1 = sharedStateRegistry.getOrCreate("demo-key");
      const entry2 = sharedStateRegistry.getOrCreate("demo-key");
      const entry3 = sharedStateRegistry.getOrCreate("demo-key");

      expect(entry1).toBe(entry2);
      expect(entry2).toBe(entry3);

      sharedStateRegistry.addInstance("demo-key", "instance-1");
      sharedStateRegistry.addInstance("demo-key", "instance-2");
      sharedStateRegistry.addInstance("demo-key", "instance-3");

      const entry = sharedStateRegistry.get("demo-key");
      expect(entry.refCount).toBe(3);
    });

    it("should maintain data after partial instance removals", () => {
      sharedStateRegistry.getOrCreate("demo-key");
      sharedStateRegistry.addInstance("demo-key", "instance-1");
      sharedStateRegistry.addInstance("demo-key", "instance-2");
      sharedStateRegistry.addInstance("demo-key", "instance-3");

      const entry = sharedStateRegistry.get("demo-key");
      entry.store.state.canvases.canvas1 = { items: [], zIndexCounter: 1 };

      // Remove 2 instances, 1 remains
      sharedStateRegistry.removeInstance("demo-key", "instance-1");
      sharedStateRegistry.removeInstance("demo-key", "instance-2");

      const remainingEntry = sharedStateRegistry.get("demo-key");
      expect(remainingEntry).toBeDefined();
      expect(remainingEntry.refCount).toBe(1);
      expect(remainingEntry.store.state.canvases.canvas1).toBeDefined();
    });

    it("should clean up data after all instances removed", () => {
      sharedStateRegistry.getOrCreate("demo-key");
      sharedStateRegistry.addInstance("demo-key", "instance-1");
      sharedStateRegistry.addInstance("demo-key", "instance-2");
      sharedStateRegistry.addInstance("demo-key", "instance-3");

      sharedStateRegistry.removeInstance("demo-key", "instance-1");
      sharedStateRegistry.removeInstance("demo-key", "instance-2");
      sharedStateRegistry.removeInstance("demo-key", "instance-3");

      const entry = sharedStateRegistry.get("demo-key");
      expect(entry).toBeUndefined();
    });

    it("should handle mixed API keys with multiple instances each", () => {
      // 3 instances for key-1
      sharedStateRegistry.getOrCreate("key-1");
      sharedStateRegistry.addInstance("key-1", "instance-1");
      sharedStateRegistry.addInstance("key-1", "instance-2");
      sharedStateRegistry.addInstance("key-1", "instance-3");

      // 2 instances for key-2
      sharedStateRegistry.getOrCreate("key-2");
      sharedStateRegistry.addInstance("key-2", "instance-4");
      sharedStateRegistry.addInstance("key-2", "instance-5");

      const entry1 = sharedStateRegistry.get("key-1");
      const entry2 = sharedStateRegistry.get("key-2");

      expect(entry1.refCount).toBe(3);
      expect(entry2.refCount).toBe(2);

      // Remove all key-1 instances
      sharedStateRegistry.removeInstance("key-1", "instance-1");
      sharedStateRegistry.removeInstance("key-1", "instance-2");
      sharedStateRegistry.removeInstance("key-1", "instance-3");

      // key-1 should be gone, key-2 should remain
      expect(sharedStateRegistry.get("key-1")).toBeUndefined();
      expect(sharedStateRegistry.get("key-2")).toBeDefined();
      expect(sharedStateRegistry.get("key-2").refCount).toBe(2);
    });
  });

  // ==========================================
  // Edge Cases
  // ==========================================

  describe("Edge Cases", () => {
    it("should handle empty API key", () => {
      const entry1 = sharedStateRegistry.getOrCreate("");
      const entry2 = sharedStateRegistry.getOrCreate("");

      expect(entry1).toBe(entry2);
    });

    it("should handle API keys with special characters", () => {
      const specialKeys = [
        "key-with-dashes",
        "key.with.dots",
        "key_with_underscores",
        "key:with:colons",
        "key/with/slashes",
      ];

      specialKeys.forEach((key) => {
        const entry = sharedStateRegistry.getOrCreate(key);
        expect(entry).toBeDefined();
      });
    });

    it("should handle very long API keys", () => {
      const longKey = "a".repeat(1000);
      const entry = sharedStateRegistry.getOrCreate(longKey);

      expect(entry).toBeDefined();
    });

    it("should handle rapid create/dispose cycles", () => {
      for (let i = 0; i < 100; i++) {
        sharedStateRegistry.getOrCreate("cycle-key");
        sharedStateRegistry.addInstance("cycle-key", `instance-${i}`);
        sharedStateRegistry.removeInstance("cycle-key", `instance-${i}`);
      }

      const entry = sharedStateRegistry.get("cycle-key");
      expect(entry).toBeUndefined();
    });

    it("should handle over-removing gracefully", () => {
      sharedStateRegistry.getOrCreate("over-release-key");
      sharedStateRegistry.addInstance("over-release-key", "instance-1");
      sharedStateRegistry.removeInstance("over-release-key", "instance-1");

      // Over-remove should not throw (entry already disposed)
      expect(() => {
        sharedStateRegistry.removeInstance("over-release-key", "instance-1");
      }).not.toThrow();
      expect(() => {
        sharedStateRegistry.removeInstance("over-release-key", "instance-2");
      }).not.toThrow();
    });
  });

  // ==========================================
  // Undo/Redo Introspection Tests
  // ==========================================

  describe("Undo/Redo Introspection", () => {
    it("should provide access to undo manager", () => {
      const entry = sharedStateRegistry.getOrCreate("test-key");

      expect(entry.undoManager).toBeDefined();
      expect(entry.undoManager.getUndoStackSize).toBeDefined();
      expect(entry.undoManager.getRedoStackSize).toBeDefined();
    });

    it("should track undo/redo stack sizes", () => {
      const entry = sharedStateRegistry.getOrCreate("test-key");
      const undoManager = entry.undoManager;

      expect(undoManager.getUndoStackSize()).toBe(0);
      expect(undoManager.getRedoStackSize()).toBe(0);

      // Add mock command
      const mockCommand = {
        execute: jest.fn(),
        undo: jest.fn(),
        redo: jest.fn(),
        getDescription: () => "Test Command",
      };
      undoManager.push(mockCommand);

      expect(undoManager.getUndoStackSize()).toBe(1);
      expect(undoManager.getRedoStackSize()).toBe(0);
    });
  });

  // ==========================================
  // Debug Info Tests
  // ==========================================

  describe("Debug Info", () => {
    it("should provide debug info for all registered stores", () => {
      sharedStateRegistry.getOrCreate("key-1");
      sharedStateRegistry.addInstance("key-1", "instance-1");
      sharedStateRegistry.addInstance("key-1", "instance-2");

      sharedStateRegistry.getOrCreate("key-2");
      sharedStateRegistry.addInstance("key-2", "instance-3");

      const debugInfo = sharedStateRegistry.getDebugInfo();

      expect(debugInfo["key-1"]).toEqual({
        refCount: 2,
        instanceIds: ["instance-1", "instance-2"],
        canvasCount: 0,
        undoStackSize: 0,
        redoStackSize: 0,
      });

      expect(debugInfo["key-2"]).toEqual({
        refCount: 1,
        instanceIds: ["instance-3"],
        canvasCount: 0,
        undoStackSize: 0,
        redoStackSize: 0,
      });
    });

    it("should include canvas count in debug info", () => {
      const entry = sharedStateRegistry.getOrCreate("test-key");
      entry.store.state.canvases = {
        canvas1: { items: [], zIndexCounter: 1 },
        canvas2: { items: [], zIndexCounter: 1 },
        canvas3: { items: [], zIndexCounter: 1 },
      };

      const debugInfo = sharedStateRegistry.getDebugInfo();

      expect(debugInfo["test-key"].canvasCount).toBe(3);
    });
  });

  // ==========================================
  // Clear Tests
  // ==========================================

  describe("Clear", () => {
    it("should clear all shared stores", () => {
      sharedStateRegistry.getOrCreate("key-1");
      sharedStateRegistry.getOrCreate("key-2");
      sharedStateRegistry.getOrCreate("key-3");

      expect(Object.keys(sharedStateRegistry.getDebugInfo())).toHaveLength(3);

      sharedStateRegistry.clear();

      expect(Object.keys(sharedStateRegistry.getDebugInfo())).toHaveLength(0);
      expect(sharedStateRegistry.get("key-1")).toBeUndefined();
      expect(sharedStateRegistry.get("key-2")).toBeUndefined();
      expect(sharedStateRegistry.get("key-3")).toBeUndefined();
    });
  });
});
