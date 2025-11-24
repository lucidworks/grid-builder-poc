/**
 * TypeScript Window Interface Extensions
 * =========================================
 *
 * This module extends the global Window interface with custom properties used in
 * the grid-builder library. These properties are attached to window for debugging,
 * testing, and global state inspection.
 *
 * ## Why Window Extensions
 *
 * The library attaches certain objects to the window for:
 * - **Debugging**: Inspect state in browser console
 * - **Testing**: Access internal services from test suites
 * - **Plugins**: Allow plugins to access library APIs
 * - **Performance monitoring**: Optional performance tracking
 *
 * ## Usage
 *
 * These types enable TypeScript autocomplete and type-checking:
 *
 * ```typescript
 * // Before: Type error
 * (window as any).gridState.canvases; // ❌ No autocomplete, any type
 *
 * // After: Type-safe
 * window.gridState?.canvases; // ✅ Full autocomplete and type checking
 * ```
 *
 * ## Properties Defined
 *
 * - **interact**: interact.js library (loaded via CDN)
 * - **gridState**: Reactive state store (@stencil/store)
 * - **virtualRenderer**: Virtual rendering service (IntersectionObserver-based)
 * - **perfMonitor**: Optional performance monitoring (debugging tool)
 * - **eventManager**: Event bus for plugin communication
 */

import type interact from "interactjs";
import type { VirtualRendererService } from "../services/virtual-renderer";
import type { EventManager } from "../services/event-manager";

/**
 * Grid State interface
 *
 * Reactive state store structure from state-manager.ts
 */
export interface WindowGridState {
  /** Canvas data indexed by canvas ID */
  canvases: {
    [canvasId: string]: {
      /** Array of grid items in this canvas */
      items: any[];

      /** Current z-index counter for layering */
      zIndexCounter: number;
    };
  };

  /** Current viewport mode (desktop or mobile) */
  currentViewport?: "desktop" | "mobile";

  /** Currently selected item IDs */
  selectedItems?: string[];

  /** Whether grid lines are visible */
  showGrid?: boolean;

  /** Currently active canvas ID (for keyboard shortcuts) */
  activeCanvasId?: string | null;
}

/**
 * Performance Monitor interface
 *
 * Optional debugging tool for tracking operation performance
 */
export interface PerfMonitor {
  /** Start tracking an operation */
  startOperation(name: string): void;

  /** End tracking an operation and log duration */
  endOperation(name: string): void;

  /** Get performance metrics */
  getMetrics(): {
    [operationName: string]: {
      count: number;
      totalTime: number;
      avgTime: number;
      minTime: number;
      maxTime: number;
    };
  };

  /** Reset all metrics */
  reset(): void;

  /** Enable/disable performance monitoring */
  enabled: boolean;
}

/**
 * Extend the global Window interface
 *
 * Makes library properties available on window object with full TypeScript support
 */
declare global {
  interface Window {
    /**
     * Interact.js library
     *
     * Loaded via CDN script tag in demo HTML
     * Used by drag-handler.ts and resize-handler.ts
     * @see https://interactjs.io/
     */
    interact?: typeof interact;

    /**
     * Grid reactive state
     * @stencil/store reactive state object
     * Attached to window for debugging and plugin access
     *
     * **Warning**: Modifying this directly can break undo/redo
     * **Use**: state-manager.ts exported functions instead
     */
    gridState?: WindowGridState;

    /**
     * Virtual renderer service
     *
     * IntersectionObserver-based lazy rendering service
     * Attached to window for component access
     * @see virtual-renderer.ts
     */
    virtualRenderer?: VirtualRendererService;

    /**
     * Performance monitor
     *
     * Optional debugging tool for tracking drag/resize performance
     * Only available when explicitly enabled
     *
     * **Usage**:
     * ```typescript
     * if (window.perfMonitor) {
     *   window.perfMonitor.startOperation('drag');
     *   // ... perform drag ...
     *   window.perfMonitor.endOperation('drag');
     * }
     * ```
     */
    perfMonitor?: PerfMonitor;

    /**
     * Event manager service
     *
     * Global event bus for component and plugin communication
     * Attached to window for plugin access
     * @see event-manager.ts
     */
    eventManager?: EventManager;
  }
}

// This empty export makes this file a module
export {};
