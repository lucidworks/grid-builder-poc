/**
 * Grid Viewer - Rendering-Only Component
 * ========================================
 *
 * Lightweight component for rendering grid layouts without editing functionality.
 * Designed to be used in viewer apps where layouts are created in grid-builder
 * and displayed in grid-viewer.
 *
 * ## Design Philosophy
 *
 * **Separation of concerns**:
 * - Builder app: grid-builder with full editing (~150KB with interact.js)
 * - Viewer app: grid-viewer for display only (~30KB, 80% smaller)
 * - Same component definitions, different rendering modes
 *
 * **Export/Import workflow**:
 * ```typescript
 * // Builder App → Export layout
 * const builder = document.querySelector('grid-builder');
 * const exportData = await builder.exportState();
 * await saveToAPI(exportData);
 *
 * // Viewer App → Import and display layout
 * const layout = await loadFromAPI();
 * const viewer = document.querySelector('grid-viewer');
 * viewer.initialState = layout;
 * ```
 *
 * ## What's Excluded from Viewer
 *
 * **No editing features**:
 * - ❌ No drag-and-drop (no interact.js)
 * - ❌ No component palette
 * - ❌ No config panel
 * - ❌ No item selection
 * - ❌ No resize handles
 * - ❌ No undo/redo
 *
 * **Only rendering features**:
 * - ✅ Responsive layouts (desktop/mobile)
 * - ✅ Container-based viewport switching
 * - ✅ Virtual rendering for performance
 * - ✅ Theme customization
 * - ✅ Component registry for dynamic rendering
 *
 * ## Bundle Size Impact
 *
 * **Builder**: ~150KB (includes interact.js ~45KB)
 * **Viewer**: ~30KB (no interact.js, no editing logic)
 * **Reduction**: 80% smaller bundle
 * @module grid-viewer
 */

import { Component, Element, h, Host, Prop, State, Watch } from "@stencil/core";

// Type imports
import { ComponentDefinition } from "../../types/component-definition";
import { GridConfig } from "../../types/grid-config";
import { GridBuilderTheme } from "../../types/theme";
import { ComponentRegistry } from "../../services/component-registry";
import { GridExport } from "../../types/grid-export";

// Service imports - only rendering-related, no editing
import {
  ViewerState,
  DEFAULT_BREAKPOINTS,
  normalizeBreakpoints,
} from "../../services/state-manager";
import { createStore } from "@stencil/store";
import { createDebugLogger } from "../../utils/debug";
import { VirtualRendererService } from "../../services/virtual-renderer";
import { getViewportForWidth } from "../../utils/breakpoint-utils";
import { sharedStateRegistry } from "../../services/shared-state-registry";

const debug = createDebugLogger("grid-viewer");

/**
 * GridViewer Component
 * ====================
 *
 * Rendering-only grid component for displaying layouts created in grid-builder.
 *
 * **Tag**: `<grid-viewer>`
 * **Shadow DOM**: Disabled (consistent with grid-builder)
 * **Reactivity**: Uses local store OR shared store (via apiKey prop)
 *
 * **Key differences from grid-builder**:
 * - No interact.js dependency (80% bundle size reduction)
 * - No palette, config panel, or editing UI
 * - Simplified state (no selection, no z-index tracking)
 * - Rendering-only canvas sections
 *
 * **Multi-instance sharing**:
 * - **Local mode** (default): Each instance has independent state
 * - **Shared mode** (with apiKey): Multiple instances share layout data
 * - Same SharedStateRegistry pattern as grid-builder
 * - Use case: Multi-device preview (mobile + tablet + desktop side-by-side)
 */
@Component({
  tag: "grid-viewer",
  styleUrl: "grid-viewer.scss",
  shadow: false, // Light DOM for consistency with grid-builder
})
export class GridViewer {
  /**
   * Component definitions registry
   *
   * **Required prop**: Array of ComponentDefinition objects
   * **Purpose**: Defines how to render each component type
   *
   * **Must match builder definitions**: Same component types as used in builder
   *
   * **Example**:
   * ```typescript
   * const components = [
   *   {
   *     type: 'header',
   *     name: 'Header',
   *     icon: '📄',
   *     render: ({ itemId, config }) => (
   *       <my-header itemId={itemId} config={config} />
   *     )
   *   }
   * ];
   * ```
   */
  @Prop() components!: ComponentDefinition[];

  /**
   * Grid configuration options
   *
   * **Optional prop**: Grid system configuration
   * **Default**: Standard 2% grid with 10px-50px constraints
   *
   * **Should match builder config**: Use same config as builder for consistent rendering
   */
  @Prop() config?: GridConfig;

  /**
   * Visual theme customization
   *
   * **Optional prop**: Customizes colors, fonts, and styling
   * **Default**: Bootstrap-inspired blue theme
   */
  @Prop() theme?: GridBuilderTheme;

  /**
   * Breakpoint configuration for responsive layouts
   *
   * **Optional prop**: Define custom responsive breakpoints
   * **Default**: `{ mobile: { minWidth: 0, layoutMode: 'stack' }, desktop: { minWidth: 768, layoutMode: 'manual' } }`
   * **Backwards compatible**: Existing desktop/mobile behavior maintained by default
   *
   * **Should match builder config**: Use same breakpoints as builder for consistent behavior
   *
   * **Examples**:
   *
   * 1. **Simple format** (min-width only):
   * ```typescript
   * <grid-viewer breakpoints={{ mobile: 0, desktop: 768 }}></grid-viewer>
   * ```
   *
   * 2. **Full format** (3 breakpoints with layout modes):
   * ```typescript
   * <grid-viewer breakpoints={{
   *   mobile: { minWidth: 0, layoutMode: 'stack' },
   *   tablet: { minWidth: 768, layoutMode: 'inherit', inheritFrom: 'desktop' },
   *   desktop: { minWidth: 1024, layoutMode: 'manual' }
   * }}></grid-viewer>
   * ```
   */
  @Prop() breakpoints?: any; // BreakpointConfig | SimpleBreakpointConfig

  /**
   * Initial state to display
   *
   * **Optional prop**: Layout data to render
   * **Accepts**: ViewerState or GridExport (both compatible)
   *
   * **From builder export**:
   * ```typescript
   * const exportData = await builder.exportState();
   * viewer.initialState = exportData; // Type-safe!
   * ```
   *
   * **From API**:
   * ```typescript
   * const layout = await fetch('/api/layouts/123').then(r => r.json());
   * viewer.initialState = layout;
   * ```
   */
  @Prop() initialState?: Partial<ViewerState> | GridExport;

  /**
   * Canvas metadata storage (host app responsibility)
   *
   * **Optional prop**: Store canvas-level presentation metadata
   * **Purpose**: Host app owns canvas metadata (titles, colors, settings)
   *
   * **Structure**: Record<canvasId, any>
   *
   * **Example**:
   * ```typescript
   * const canvasMetadata = {
   *   'hero-section': {
   *     backgroundColor: '#f0f4f8',
   *     customSettings: { ... }
   *   }
   * };
   * ```
   */
  @Prop() canvasMetadata?: Record<string, any>;

  /**
   * API key for shared state across multiple instances
   *
   * **Optional prop**: Enables multi-instance sharing
   * **Purpose**: Multiple grid-viewer instances with same apiKey share layout data
   *
   * **Use cases**:
   * - Multi-device preview (mobile + tablet + desktop views side-by-side)
   * - Collaborative viewing (multiple users viewing same layout)
   * - Live updates across instances
   *
   * **Shared data**: Canvas items and layouts
   * **Instance-specific**: Current viewport (each instance can show different viewport)
   *
   * **Example**:
   * ```typescript
   * // Instance 1: Mobile view
   * <grid-viewer apiKey="demo-layout" breakpoints={{ mobile: 0, desktop: 768 }}></grid-viewer>
   *
   * // Instance 2: Desktop view (shares data with Instance 1)
   * <grid-viewer apiKey="demo-layout" breakpoints={{ mobile: 0, desktop: 768 }}></grid-viewer>
   * ```
   *
   * **Default**: undefined (local-only mode, no sharing)
   */
  @Prop() apiKey?: string;

  /**
   * Unique instance identifier for multi-instance scenarios
   *
   * **Optional prop**: Auto-generated if not provided
   * **Purpose**: Track individual instances in SharedStateRegistry
   *
   * **Auto-generation**: If not provided, generates: `grid-viewer-{timestamp}-{random}`
   *
   * **Only relevant when**: apiKey is provided (shared mode)
   * **Ignored when**: apiKey is undefined (local-only mode)
   */
  @Prop() instanceId?: string;

  /**
   * Component registry (internal state)
   *
   * **Purpose**: Map component type → definition for lookup
   * **Built from**: components prop
   */
  @State() private componentRegistry: ComponentRegistry =
    new ComponentRegistry();

  /**
   * Local viewer state store
   *
   * **Purpose**: Minimal state for rendering (no editing state)
   * **Structure**: ViewerState with canvases and currentViewport
   *
   * **Mode**: Local-only when apiKey is undefined, instance-specific when apiKey is provided
   */
  private viewerState!: { state: ViewerState };

  /**
   * Shared data store (only when apiKey is provided)
   *
   * **Purpose**: Reference to shared canvases data from SharedStateRegistry
   * **Mode**: Only populated when apiKey is provided
   *
   * **Lifecycle**:
   * - Created in componentWillLoad if apiKey is provided
   * - Shared across all instances with same apiKey
   * - Disposed by registry when last instance disconnects
   */
  private sharedDataStore?: { state: { canvases: Record<string, any> } };

  /**
   * Resolved instance identifier (auto-generated if not provided)
   *
   * **Purpose**: Unique ID for this viewer instance (for reference counting)
   * **Generated**: `grid-viewer-{timestamp}-{random}` if instanceId prop not provided
   *
   * **Only used when**: apiKey is provided (shared mode)
   */
  private resolvedInstanceId?: string;

  /**
   * Host element reference
   */
  @Element() private hostElement!: HTMLElement;

  /**
   * ResizeObserver for container-based viewport switching
   *
   * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
   * **Breakpoint**: 768px (container width, not window width)
   */
  private viewportResizeObserver?: ResizeObserver;

  /**
   * Virtual renderer service instance (passed from grid-builder)
   *
   * **Optional**: Created if config.enableVirtualRendering !== false
   * **Purpose**: Lazy loading of grid items for better performance with large layouts
   */
  private virtualRendererInstance?: VirtualRendererService;

  /**
   * Component will load lifecycle
   *
   * **Purpose**: Initialize component registry and viewer state
   */
  componentWillLoad() {
    // Configure breakpoints first (needed for state initialization)
    const breakpointsConfig = this.breakpoints
      ? normalizeBreakpoints(this.breakpoints)
      : DEFAULT_BREAKPOINTS;

    debug.log("GridViewer: Breakpoints configured", breakpointsConfig);

    // Normalize apiKey: empty string becomes undefined (local-only mode)
    const normalizedApiKey = this.apiKey?.trim() || undefined;

    // Validate required props
    if (!this.components || this.components.length === 0) {
      console.error("GridViewer: components prop is required");
      // Still initialize viewerState/sharedStore to prevent render/watcher errors
      if (normalizedApiKey) {
        // Shared mode even without components
        this.resolvedInstanceId =
          this.instanceId ||
          `grid-viewer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const registryEntry = sharedStateRegistry.getOrCreate(normalizedApiKey, {
          canvases: {},
        });
        this.sharedDataStore = registryEntry.store;
        sharedStateRegistry.addInstance(normalizedApiKey, this.resolvedInstanceId);

        this.viewerState = createStore<ViewerState>({
          canvases: this.sharedDataStore.state.canvases,
          currentViewport: "desktop",
          selectedItemId: null,
          selectedCanvasId: null,
          activeCanvasId: null,
          breakpoints: breakpointsConfig,
        });
      } else {
        // Local mode without components
        this.viewerState = createStore<ViewerState>({
          canvases: {},
          currentViewport: "desktop",
          selectedItemId: null,
          selectedCanvasId: null,
          activeCanvasId: null,
          breakpoints: breakpointsConfig,
        });
      }
      return;
    }

    // Build component registry
    this.componentRegistry = new ComponentRegistry(this.components);

    // Validate unique component types
    if (this.componentRegistry.size() !== this.components.length) {
      debug.warn("GridViewer: Duplicate component types detected");
    }

    if (normalizedApiKey) {
      // **Shared mode**: Multi-instance coordination via SharedStateRegistry
      debug.log(
        `GridViewer: Initializing in shared mode (apiKey: ${normalizedApiKey})`,
      );

      // Generate or use provided instanceId
      this.resolvedInstanceId =
        this.instanceId ||
        `grid-viewer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      debug.log(`GridViewer: Instance ID: ${this.resolvedInstanceId}`);

      // Prepare initial canvas data
      let initialCanvases: Record<string, any> = {};
      if (this.initialState) {
        if ("viewport" in this.initialState) {
          // GridExport format
          initialCanvases = this.initialState.canvases as Record<string, any>;
        } else if (this.initialState.canvases) {
          // ViewerState format
          initialCanvases = this.initialState.canvases;
        }
      }

      // Get or create shared data store from registry
      const registryEntry = sharedStateRegistry.getOrCreate(normalizedApiKey, {
        canvases: initialCanvases,
      });
      this.sharedDataStore = registryEntry.store;

      // Register this instance for reference counting
      sharedStateRegistry.addInstance(
        normalizedApiKey,
        this.resolvedInstanceId,
      );
      debug.log(
        `GridViewer: Registered with SharedStateRegistry (apiKey: ${normalizedApiKey}, instanceId: ${this.resolvedInstanceId})`,
      );

      // Create instance-specific store for view state (viewport, selection)
      // Note: selection fields are always null in viewer mode
      const initialViewport =
        this.initialState && "viewport" in this.initialState
          ? this.initialState.viewport
          : (this.initialState as Partial<ViewerState>)?.currentViewport ||
            "desktop";

      this.viewerState = createStore<ViewerState>({
        canvases: this.sharedDataStore.state.canvases, // Reference to shared data
        currentViewport: initialViewport,
        selectedItemId: null, // Always null in viewer mode
        selectedCanvasId: null, // Always null in viewer mode
        activeCanvasId: null, // Always null in viewer mode
        breakpoints: breakpointsConfig,
      });

      debug.log(
        `GridViewer: Shared mode initialized (canvases: ${Object.keys(this.sharedDataStore.state.canvases).length})`,
      );
    } else {
      // **Local-only mode**: No sharing, backward compatible behavior
      debug.log("GridViewer: Initializing in local-only mode (no apiKey)");

      // Initialize local viewer state store with editing-only fields set to null
      // This allows grid-item-wrapper to access these fields without defensive guards
      // while maintaining viewer mode as display-only (no actual selection/editing)
      const initialViewerState: ViewerState = {
        canvases: {},
        currentViewport: "desktop",
        selectedItemId: null, // Always null in viewer mode (no selection)
        selectedCanvasId: null, // Always null in viewer mode (no selection)
        activeCanvasId: null, // Always null in viewer mode (no active canvas)
        breakpoints: breakpointsConfig,
      };

      // Restore initial state if provided
      if (this.initialState) {
        // Handle both ViewerState and GridExport formats
        if ("viewport" in this.initialState) {
          // GridExport format
          initialViewerState.currentViewport = this.initialState.viewport;
          initialViewerState.canvases = this.initialState.canvases as Record<
            string,
            any
          >;
        } else {
          // ViewerState format
          Object.assign(initialViewerState, this.initialState);
        }
      }

      // Create local store (not global like grid-builder)
      this.viewerState = createStore<ViewerState>(initialViewerState);

      debug.log(
        `GridViewer: Local mode initialized (canvases: ${Object.keys(this.viewerState.state.canvases).length})`,
      );
    }

    // Create virtual renderer if enabled (Performance for large layouts)
    if (this.config?.enableVirtualRendering !== false) {
      this.virtualRendererInstance = new VirtualRendererService();
    }
  }

  /**
   * Component did load lifecycle
   *
   * **Purpose**: Apply theme and setup viewport switching
   */
  componentDidLoad() {
    // Apply theme
    if (this.theme) {
      this.applyTheme(this.theme);
    }

    // Setup container-based viewport switching
    this.setupViewportResizeObserver();
  }

  /**
   * Disconnected callback (cleanup)
   *
   * **Purpose**: Clean up ResizeObserver and unregister from SharedStateRegistry
   */
  disconnectedCallback() {
    // Cleanup ResizeObserver
    if (this.viewportResizeObserver) {
      this.viewportResizeObserver.disconnect();
    }

    // Unregister from SharedStateRegistry (if in shared mode)
    // This decrements the reference count and may trigger disposal if this was the last instance
    const normalizedApiKey = this.apiKey?.trim() || undefined;
    if (normalizedApiKey && this.resolvedInstanceId) {
      sharedStateRegistry.removeInstance(
        normalizedApiKey,
        this.resolvedInstanceId,
      );
      debug.log(
        `GridViewer: Unregistered from SharedStateRegistry (apiKey: ${normalizedApiKey}, instanceId: ${this.resolvedInstanceId})`,
      );
    }
  }

  /**
   * Watch components prop for changes
   *
   * **Purpose**: Rebuild component registry when components prop changes
   */
  @Watch("components")
  handleComponentsChange(newComponents: ComponentDefinition[]) {
    this.componentRegistry = new ComponentRegistry(newComponents);
  }

  /**
   * Watch initialState prop for changes
   *
   * **Purpose**: Update viewer state when initialState prop changes
   *
   * **Shared mode behavior**:
   * - Updates shared data store for canvases (affects all instances with same apiKey)
   * - Updates instance-specific store for viewport (only affects this instance)
   *
   * **Local mode behavior**:
   * - Updates local store directly (backward compatible)
   */
  @Watch("initialState")
  handleInitialStateChange(newState: Partial<ViewerState> | GridExport) {
    // Guard: Skip if viewerState not yet initialized (componentWillLoad not complete)
    if (!newState || !this.viewerState) return;

    const normalizedApiKey = this.apiKey?.trim() || undefined;

    if (normalizedApiKey && this.sharedDataStore) {
      // **Shared mode**: Update shared data store and instance store separately
      debug.log(
        `GridViewer: Updating state in shared mode (apiKey: ${normalizedApiKey})`,
      );

      // Handle both ViewerState and GridExport formats
      if ("viewport" in newState) {
        // GridExport format
        this.viewerState.state.currentViewport = newState.viewport;
        // Update shared canvases data (affects all instances)
        this.sharedDataStore.state.canvases = newState.canvases as Record<
          string,
          any
        >;
        // Re-sync reference in viewerState (since we replaced the object)
        this.viewerState.state.canvases = this.sharedDataStore.state.canvases;
      } else {
        // ViewerState format
        // Update viewport (instance-specific)
        if (newState.currentViewport) {
          this.viewerState.state.currentViewport = newState.currentViewport;
        }
        // Update canvases (shared data)
        if (newState.canvases) {
          this.sharedDataStore.state.canvases = newState.canvases;
          // Re-sync reference in viewerState (since we replaced the object)
          this.viewerState.state.canvases = this.sharedDataStore.state.canvases;
        }
        // Note: selection fields (selectedItemId, selectedCanvasId, activeCanvasId)
        // are ignored in viewer mode (always null)
      }
    } else {
      // **Local mode**: Update local store directly (backward compatible)
      debug.log("GridViewer: Updating state in local mode");

      // Handle both ViewerState and GridExport formats
      if ("viewport" in newState) {
        // GridExport format
        this.viewerState.state.currentViewport = newState.viewport;
        this.viewerState.state.canvases = newState.canvases as Record<
          string,
          any
        >;
      } else {
        // ViewerState format
        Object.assign(this.viewerState.state, newState);
      }
    }
  }

  /**
   * Apply theme via CSS variables
   *
   * **Purpose**: Apply theme customization to host element
   * **Implementation**: Set CSS custom properties on :host
   */
  private applyTheme(theme: GridBuilderTheme) {
    const host = this.el;
    if (!host) return;

    // Apply predefined theme properties
    if (theme.primaryColor) {
      host.style.setProperty("--grid-viewer-primary-color", theme.primaryColor);
    }
    if (theme.canvasBackground) {
      host.style.setProperty("--grid-viewer-canvas-bg", theme.canvasBackground);
    }
    if (theme.fontFamily) {
      host.style.setProperty("--grid-viewer-font-family", theme.fontFamily);
    }

    // Apply custom properties
    if (theme.customProperties) {
      Object.entries(theme.customProperties).forEach(([key, value]) => {
        host.style.setProperty(key, value);
      });
    }
  }

  /**
   * Setup ResizeObserver for container-based viewport switching
   *
   * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
   * **Breakpoint**: 768px (container width, not window viewport)
   *
   * **Reused from grid-builder**: Same implementation for consistency
   */
  private setupViewportResizeObserver = () => {
    if (!this.hostElement) {
      return;
    }

    // Watch for grid-viewer container size changes
    this.viewportResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Get container width directly from the element
        // Note: We use offsetWidth instead of entry.contentRect.width because
        // the grid-viewer uses Light DOM and contentRect returns 0 for elements with height: 100%
        const width =
          this.hostElement.offsetWidth ||
          entry.borderBoxSize?.[0]?.inlineSize ||
          entry.contentRect.width;

        // Skip viewport switching if width is 0 or very small (container not yet laid out)
        // This prevents premature switching to mobile before CSS layout is complete
        if (width < 100) {
          debug.log(
            `📱 [Viewer] Skipping viewport switch - container not yet laid out (width: ${Math.round(width)}px)`,
          );
          return;
        }

        // Determine target viewport from breakpoints config
        const breakpoints = this.viewerState.state.breakpoints;
        const targetViewport = getViewportForWidth(width, breakpoints);

        // Only update if viewport changed
        if (this.viewerState.state.currentViewport !== targetViewport) {
          debug.log(
            `📱 [Viewer] Container-based viewport switch: ${this.viewerState.state.currentViewport} → ${targetViewport} (width: ${Math.round(width)}px)`,
          );
          this.viewerState.state.currentViewport = targetViewport;
        }
      }
    });

    this.viewportResizeObserver.observe(this.hostElement);
  };

  /**
   * Reference to host element
   */
  private el?: HTMLElement;

  /**
   * Render component template
   *
   * **Purpose**: Render canvases with items (no palette, no config panel)
   *
   * **Structure**:
   * - Host element with theme classes
   * - Canvas area with sections
   * - No palette (viewing only)
   * - No config panel (viewing only)
   */
  render() {
    // Guard against missing viewerState (e.g., components prop not provided)
    if (!this.viewerState) {
      return <Host></Host>;
    }

    const canvasIds = Object.keys(this.viewerState.state.canvases);

    return (
      <Host ref={(el) => (this.el = el)}>
        <div class="grid-viewer-container">
          {/* Canvas Area Only (no palette, no config panel) */}
          <div class="canvas-area">
            <div class="canvases-container">
              {canvasIds.map((canvasId) => (
                <canvas-section-viewer
                  key={canvasId}
                  canvasId={canvasId}
                  config={this.config}
                  componentRegistry={this.componentRegistry}
                  items={this.viewerState.state.canvases[canvasId].items}
                  currentViewport={this.viewerState.state.currentViewport}
                  breakpoints={this.viewerState.state.breakpoints}
                  backgroundColor={
                    this.canvasMetadata?.[canvasId]?.backgroundColor
                  }
                  virtualRendererInstance={this.virtualRendererInstance}
                  stateInstance={this.viewerState.state}
                />
              ))}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
