/**
 * Shared State Registry
 * =====================
 *
 * Singleton registry that manages shared data stores across grid-builder instances.
 * Instances with the same API key share layout data (canvases) while maintaining
 * independent view state (viewport, selection).
 *
 * ## Purpose
 *
 * Enable multi-instance scenarios where users can see the same layout rendered
 * at different viewports simultaneously (e.g., mobile/tablet/desktop side-by-side).
 * When a component is moved in one instance, all instances sharing the same API
 * key update automatically.
 *
 * ## Architecture
 *
 * **Shared per API key:**
 * - Canvas data (items, positions, layouts, z-index)
 * - Undo/redo stack (shared history across instances)
 *
 * **Independent per instance:**
 * - Current viewport (mobile, tablet, desktop)
 * - Selection state (selectedItemId, activeCanvasId)
 * - Display preferences (showGrid, breakpoints)
 *
 * ## Reference Counting
 *
 * The registry uses reference counting to automatically clean up shared stores
 * when the last instance with a given API key disconnects:
 *
 * ```typescript
 * // First instance creates shared store
 * registry.addInstance('myApiKey', 'instance-1'); // refCount = 1
 *
 * // Second instance reuses shared store
 * registry.addInstance('myApiKey', 'instance-2'); // refCount = 2
 *
 * // First instance disconnects
 * registry.removeInstance('myApiKey', 'instance-1'); // refCount = 1, store kept
 *
 * // Last instance disconnects
 * registry.removeInstance('myApiKey', 'instance-2'); // refCount = 0, store disposed
 * ```
 *
 * ## Usage Example
 *
 * ```typescript
 * // Grid-builder instance 1 (mobile view)
 * const store1 = sharedStateRegistry.getOrCreate('demo', {
 * canvases: { canvas1: { items: [], zIndexCounter: 0 } }
 * });
 * sharedStateRegistry.addInstance('demo', 'instance-1');
 *
 * // Grid-builder instance 2 (desktop view)
 * const store2 = sharedStateRegistry.getOrCreate('demo'); // Reuses store1
 * sharedStateRegistry.addInstance('demo', 'instance-2');
 *
 * // Both instances share the same canvases data
 * store1.state.canvases === store2.state.canvases // true
 * ```
 * @module shared-state-registry
 */

import { createStore } from "@stencil/store";
import { UndoRedoManager } from "./undo-redo";
import { createDebugLogger } from "../utils/debug";

const debug = createDebugLogger("shared-state-registry");

/**
 * Shared data state structure (shared across instances with same API key)
 *
 * This represents the **data model** - the actual layout configuration that
 * should be synchronized across all instances.
 */
export interface SharedDataState {
  /**
   * Canvas data (items, positions, layouts)
   *
   * All grid items with their positions, sizes, and responsive layouts.
   * This is the primary data that gets shared across instances.
   */
  canvases: Record<string, any>;
}

/**
 * Shared store entry
 *
 * Internal registry entry containing the shared store, undo manager,
 * and reference count for a given API key.
 */
interface SharedStoreEntry {
  /**
   * Shared data store (@stencil/store instance)
   */
  store: {
    state: SharedDataState;
    onChange: (key: string, callback: Function) => () => void;
    dispose: () => void;
  };

  /**
   * Undo/redo manager for this API key
   *
   * One undo stack per API key - all instances sharing the key
   * share the same undo/redo history.
   */
  undoManager: UndoRedoManager;

  /**
   * Reference count - number of instances using this shared store
   *
   * When refCount reaches 0, the store and undo manager are disposed.
   */
  refCount: number;

  /**
   * Instance IDs tracked for debugging
   */
  instanceIds: Set<string>;
}

/**
 * Shared State Registry Class
 * ============================
 *
 * Manages shared data stores across grid-builder instances.
 *
 * **Key Responsibilities:**
 * 1. Create and manage shared stores per API key
 * 2. Reference counting for automatic cleanup
 * 3. Provide undo/redo manager per API key
 * 4. Track instance lifecycle for debugging
 */
class SharedStateRegistry {
  /**
   * Registry map: API key → shared store entry
   */
  private stores: Map<string, SharedStoreEntry> = new Map();

  /**
   * Get or create shared store for given API key
   *
   * **First call** (new API key):
   * - Creates new shared data store
   * - Initializes with provided initialState (or defaults)
   * - Creates undo/redo manager
   * - Sets refCount = 0 (caller must call addInstance)
   *
   * **Subsequent calls** (existing API key):
   * - Returns existing shared store
   * - Ignores initialState parameter
   * - Reuses existing undo/redo manager
   * @param apiKey - Unique identifier for shared store
   * @param initialState - Initial state (only used on first call)
   * @returns Shared store entry
   */
  getOrCreate(
    apiKey: string,
    initialState?: Partial<SharedDataState>,
  ): SharedStoreEntry {
    if (!this.stores.has(apiKey)) {
      debug.log(`📦 Creating new shared store for API key: ${apiKey}`);

      // Create shared data store using @stencil/store
      const { state, onChange, dispose } = createStore<SharedDataState>({
        canvases: initialState?.canvases || {},
      });

      // Create undo/redo manager for this API key
      const undoManager = new UndoRedoManager();

      // Store entry with refCount = 0 (caller must call addInstance)
      const entry: SharedStoreEntry = {
        store: { state, onChange, dispose },
        undoManager,
        refCount: 0,
        instanceIds: new Set(),
      };

      this.stores.set(apiKey, entry);

      debug.log(`✅ Shared store created for ${apiKey}`);
      return entry;
    }

    debug.log(`♻️ Reusing existing shared store for API key: ${apiKey}`);
    return this.stores.get(apiKey)!;
  }

  /**
   * Add instance to reference count
   *
   * **Call this when:**
   * - Grid-builder instance initializes with this API key
   * - Grid-viewer instance initializes with this API key
   *
   * **Effect:**
   * - Increments refCount
   * - Tracks instanceId for debugging
   * - Prevents store disposal while instances are active
   * @param apiKey - API key of shared store
   * @param instanceId - Unique instance identifier
   */
  addInstance(apiKey: string, instanceId: string): void {
    const entry = this.stores.get(apiKey);
    if (!entry) {
      console.warn(
        `SharedStateRegistry: Attempted to add instance ${instanceId} to non-existent API key ${apiKey}`,
      );
      return;
    }

    entry.refCount++;
    entry.instanceIds.add(instanceId);

    debug.log(
      `➕ Instance added to ${apiKey}: ${instanceId} (refCount: ${entry.refCount})`,
    );
  }

  /**
   * Remove instance from reference count
   *
   * **Call this when:**
   * - Grid-builder instance disconnects (disconnectedCallback)
   * - Grid-viewer instance disconnects
   *
   * **Effect:**
   * - Decrements refCount
   * - Removes instanceId from tracking
   * - **Auto-disposes store when refCount reaches 0**
   * @param apiKey - API key of shared store
   * @param instanceId - Unique instance identifier
   */
  removeInstance(apiKey: string, instanceId: string): void {
    const entry = this.stores.get(apiKey);
    if (!entry) {
      console.warn(
        `SharedStateRegistry: Attempted to remove instance ${instanceId} from non-existent API key ${apiKey}`,
      );
      return;
    }

    entry.refCount--;
    entry.instanceIds.delete(instanceId);

    debug.log(
      `➖ Instance removed from ${apiKey}: ${instanceId} (refCount: ${entry.refCount})`,
    );

    // Auto-cleanup when last instance disconnects
    if (entry.refCount <= 0) {
      debug.log(
        `🗑️ Last instance disconnected, disposing shared store for ${apiKey}`,
      );
      this.dispose(apiKey);
    }
  }

  /**
   * Get shared store (without creating if missing)
   *
   * **Use case:** Check if API key already has a shared store
   * @param apiKey - API key to look up
   * @returns Shared store entry or undefined
   */
  get(apiKey: string): SharedStoreEntry | undefined {
    return this.stores.get(apiKey);
  }

  /**
   * Dispose shared store for given API key
   *
   * **Cleanup:**
   * - Disposes @stencil/store instance
   * - Clears undo/redo history
   * - Removes from registry
   *
   * **Usually called automatically** by removeInstance when refCount = 0.
   * Can also be called manually for explicit cleanup.
   * @param apiKey - API key to dispose
   */
  dispose(apiKey: string): void {
    const entry = this.stores.get(apiKey);
    if (!entry) {
      return;
    }

    debug.log(`🗑️ Disposing shared store for ${apiKey}`);

    // Dispose @stencil/store
    entry.store.dispose();

    // Clear undo/redo history
    entry.undoManager.clearHistory();

    // Remove from registry
    this.stores.delete(apiKey);

    debug.log(`✅ Shared store disposed for ${apiKey}`);
  }

  /**
   * Get debug information about all registered stores
   *
   * **Returns:**
   * ```typescript
   * {
   * 'api-key-1': {
   * refCount: 2,
   * instanceIds: ['instance-1', 'instance-2'],
   * canvasCount: 1
   * }
   * }
   * ```
   * @returns Debug info object
   */
  getDebugInfo(): Record<string, any> {
    const info: Record<string, any> = {};

    this.stores.forEach((entry, apiKey) => {
      info[apiKey] = {
        refCount: entry.refCount,
        instanceIds: Array.from(entry.instanceIds),
        canvasCount: Object.keys(entry.store.state.canvases).length,
        undoStackSize: entry.undoManager.getUndoStackSize(),
        redoStackSize: entry.undoManager.getRedoStackSize(),
      };
    });

    return info;
  }

  /**
   * Clear all shared stores (for testing)
   *
   * **Warning:** This disposes ALL shared stores regardless of refCount.
   * Only use in test cleanup or complete app reset.
   */
  clear(): void {
    debug.log("🧹 Clearing all shared stores");

    this.stores.forEach((_, apiKey) => {
      this.dispose(apiKey);
    });

    this.stores.clear();
  }
}

/**
 * Module-level singleton instance for cross-instance coordination
 *
 * **Why a singleton?**
 *
 * Unlike StateManager (instantiated per grid-builder), SharedStateRegistry
 * is intentionally a module-level singleton to enable cross-instance coordination.
 *
 * **Multi-instance scenario**:
 * ```
 * Page with 3 grid-builders:
 * ┌─────────────────┐
 * │ Instance 1      │─┐
 * │ apiKey: "demo"  │ │
 * └─────────────────┘ │
 *                     ├──> SharedStateRegistry (one for entire page)
 * ┌─────────────────┐ │    ├─ "demo" → { refCount: 2, canvases: {...} }
 * │ Instance 2      │─┤    └─ "other" → { refCount: 1, canvases: {...} }
 * │ apiKey: "demo"  │ │
 * └─────────────────┘ │
 *                     │
 * ┌─────────────────┐ │
 * │ Instance 3      │─┘
 * │ apiKey: "other" │
 * └─────────────────┘
 * ```
 *
 * **Why not dependency injection?**
 * - Instances 1 & 2 need to share the SAME registry for reference counting
 * - If each had their own registry, they wouldn't know about each other
 * - Module-level singleton ensures all instances coordinate through one registry
 *
 * **This is the Stencil-y pattern**: Module-level service for cross-component state,
 * similar to how @stencil/store creates module-level reactive stores.
 *
 * Export single registry instance for the entire application.
 * All grid-builder and grid-viewer instances use this shared registry.
 */
export const sharedStateRegistry = new SharedStateRegistry();
