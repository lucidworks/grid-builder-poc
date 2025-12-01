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
import { GridExport } from "../../types/grid-export";

// Service imports - only rendering-related, no editing
import { ViewerState } from "../../services/state-manager";
import { createStore } from "@stencil/store";
import { createDebugLogger } from "../../utils/debug";
import { VirtualRendererService } from "../../services/virtual-renderer";

const debug = createDebugLogger("grid-viewer");

/**
 * GridViewer Component
 * ====================
 *
 * Rendering-only grid component for displaying layouts created in grid-builder.
 *
 * **Tag**: `<grid-viewer>`
 * **Shadow DOM**: Disabled (consistent with grid-builder)
 * **Reactivity**: Uses local store for viewer state
 *
 * **Key differences from grid-builder**:
 * - No interact.js dependency (80% bundle size reduction)
 * - No palette, config panel, or editing UI
 * - Simplified state (no selection, no z-index tracking)
 * - Rendering-only canvas sections
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
   * Component registry (internal state)
   *
   * **Purpose**: Map component type → definition for lookup
   * **Built from**: components prop
   */
  @State() private componentRegistry: Map<string, ComponentDefinition> =
    new Map();

  /**
   * Local viewer state store
   *
   * **Purpose**: Minimal state for rendering (no editing state)
   * **Structure**: ViewerState with canvases and currentViewport
   */
  private viewerState!: { state: ViewerState };

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
    // Validate required props
    if (!this.components || this.components.length === 0) {
      console.error("GridViewer: components prop is required");
      return;
    }

    // Build component registry
    this.componentRegistry = new Map(
      this.components.map((comp) => [comp.type, comp]),
    );

    // Validate unique component types
    if (this.componentRegistry.size !== this.components.length) {
      debug.warn("GridViewer: Duplicate component types detected");
    }

    // Initialize local viewer state store with editing-only fields set to null
    // This allows grid-item-wrapper to access these fields without defensive guards
    // while maintaining viewer mode as display-only (no actual selection/editing)
    const initialViewerState: ViewerState = {
      canvases: {},
      currentViewport: "desktop",
      selectedItemId: null, // Always null in viewer mode (no selection)
      selectedCanvasId: null, // Always null in viewer mode (no selection)
      activeCanvasId: null, // Always null in viewer mode (no active canvas)
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
   * **Purpose**: Clean up ResizeObserver
   */
  disconnectedCallback() {
    // Cleanup ResizeObserver
    if (this.viewportResizeObserver) {
      this.viewportResizeObserver.disconnect();
    }
  }

  /**
   * Watch components prop for changes
   *
   * **Purpose**: Rebuild component registry when components prop changes
   */
  @Watch("components")
  handleComponentsChange(newComponents: ComponentDefinition[]) {
    this.componentRegistry = new Map(
      newComponents.map((comp) => [comp.type, comp]),
    );
  }

  /**
   * Watch initialState prop for changes
   *
   * **Purpose**: Update viewer state when initialState prop changes
   */
  @Watch("initialState")
  handleInitialStateChange(newState: Partial<ViewerState> | GridExport) {
    if (newState) {
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

        // Determine target viewport based on container width
        const targetViewport = width < 768 ? "mobile" : "desktop";

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
