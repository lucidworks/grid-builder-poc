/**
 * Canvas Section Viewer - Rendering-Only Canvas
 * ==============================================
 *
 * Simplified canvas component for displaying grid layouts without editing features.
 * Used in grid-viewer component for rendering-only mode.
 *
 * ## Key Differences from canvas-section
 *
 * **Excluded from viewer**:
 * - ❌ No interact.js dropzone
 * - ❌ No drag-and-drop handling
 * - ❌ No grid lines (cleaner output)
 * - ❌ No state subscription (items passed via props)
 *
 * **Included in viewer**:
 * - ✅ ResizeObserver for grid cache invalidation
 * - ✅ Item rendering with grid-item-wrapper
 * - ✅ Background color support
 * - ✅ Responsive layout calculations
 *
 * ## Props-Based Architecture
 *
 * **No global state**: All data passed via props
 * ```typescript
 * <canvas-section-viewer
 * canvasId="hero-section"
 * items={items}
 * currentViewport="desktop"
 * config={gridConfig}
 * componentRegistry={registry}
 * />
 * ```
 *
 * ## Performance
 *
 * **ResizeObserver**: Clears grid cache on container resize
 * **Virtual rendering**: Items use VirtualRenderer for lazy loading
 * **Render version**: Forces item recalculation on resize
 * @module canvas-section-viewer
 */

import { Component, h, Prop, State, Watch } from "@stencil/core";

// Internal imports - no interact.js
import { GridItem } from "../../services/state-manager";
import {
  setGridSizeCache,
  gridToPixelsY,
} from "../../utils/grid-calculations";
import { calculateCanvasHeightFromItems } from "../../utils/canvas-height-calculator";
import { GridConfig } from "../../types/grid-config";
import { ComponentDefinition } from "../../types/component-definition";

/**
 * CanvasSectionViewer Component
 * ==============================
 *
 * Rendering-only canvas component for grid-viewer.
 *
 * **Tag**: `<canvas-section-viewer>`
 * **Shadow DOM**: Disabled (consistent with canvas-section)
 * **Reactivity**: Props-based (no global state subscription)
 */
@Component({
  tag: "canvas-section-viewer",
  styleUrl: "canvas-section-viewer.scss",
  shadow: false, // Light DOM for consistency
})
export class CanvasSectionViewer {
  /**
   * Canvas ID for identification
   *
   * **Format**: 'canvas1', 'hero-section', etc.
   * **Purpose**: Element ID and data attribute
   */
  @Prop() canvasId!: string;

  /**
   * Items to render in this canvas
   *
   * **Required**: Array of GridItem objects
   * **Source**: Passed from grid-viewer component
   *
   * **Unlike canvas-section**: Items passed via props, not from global state
   */
  @Prop() items!: GridItem[];

  /**
   * Current viewport mode
   *
   * **Required**: 'desktop' | 'mobile'
   * **Source**: Passed from grid-viewer component
   *
   * **Purpose**: Determines which layout to render for each item
   */
  @Prop() currentViewport!: "desktop" | "mobile";

  /**
   * Grid configuration options
   *
   * **Optional**: Customizes grid system behavior
   * **Passed from**: grid-viewer component
   */
  @Prop() config?: GridConfig;

  /**
   * Component registry (from parent grid-viewer)
   *
   * **Source**: grid-viewer component
   * **Structure**: Map<type, ComponentDefinition>
   * **Purpose**: Pass to grid-item-wrapper for dynamic rendering
   */
  @Prop() componentRegistry?: Map<string, ComponentDefinition>;

  /**
   * Background color for this canvas
   *
   * **Optional**: Canvas background color
   * **Default**: '#ffffff'
   */
  @Prop() backgroundColor?: string;

  /**
   * Render version counter (forces re-renders)
   *
   * **Purpose**: Trigger re-renders when grid calculations change
   * **Incremented on**: ResizeObserver events
   * **Passed to**: grid-item-wrapper as prop
   */
  @State() renderVersion: number = 0;

  /**
   * Calculated canvas height based on content
   *
   * **Purpose**: Dynamic canvas height that fits all items
   * **Calculated from**: Item positions (bottom-most item determines height)
   * **Recalculated when**: Items change, viewport changes, or resize occurs
   */
  @State() calculatedHeight: number = 400;

  /**
   * Grid container DOM reference
   *
   * **Used for**: ResizeObserver monitoring
   */
  private gridContainerRef: HTMLElement;

  /**
   * ResizeObserver instance
   *
   * **Monitors**: gridContainerRef size changes
   * **Callback**: Clears grid cache, increments renderVersion
   * **Cleanup**: disconnectedCallback() disconnects observer
   */
  private resizeObserver: ResizeObserver;

  /**
   * Component did load lifecycle hook
   *
   * **Called**: After first render (DOM available)
   * **Purpose**: Setup ResizeObserver and calculate initial height
   */
  componentDidLoad() {
    // Calculate initial canvas height
    this.updateCanvasHeight();

    this.setupResizeObserver();
  }

  /**
   * Component did update lifecycle hook
   *
   * **Called**: After props change
   * **Purpose**: Ensure ResizeObserver is setup
   */
  componentDidUpdate() {
    // Ensure ResizeObserver is setup (in case gridContainerRef changed)
    if (!this.resizeObserver && this.gridContainerRef) {
      this.setupResizeObserver();
    }
  }

  /**
   * Disconnected callback (cleanup)
   *
   * **Purpose**: Clean up ResizeObserver
   */
  disconnectedCallback() {
    // Cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Watch items prop for changes
   *
   * **Purpose**: Recalculate canvas height when items change
   */
  @Watch("items")
  handleItemsChange() {
    this.updateCanvasHeight();
  }

  /**
   * Watch currentViewport prop for changes
   *
   * **Purpose**: Recalculate canvas height when viewport changes
   */
  @Watch("currentViewport")
  handleViewportChange() {
    this.updateCanvasHeight();
  }

  /**
   * Update canvas height based on current items and viewport
   *
   * **Purpose**: Calculate dynamic height that fits all items
   * **Called when**:
   * - Component loads
   * - Items prop changes
   * - Viewport prop changes
   * - Canvas resizes
   */
  private updateCanvasHeight = () => {
    if (!this.items || !this.currentViewport) {
      return;
    }

    this.calculatedHeight = calculateCanvasHeightFromItems(
      this.items,
      this.currentViewport,
      this.config,
    );
  };

  /**
   * Setup ResizeObserver for grid cache pre-population
   *
   * **Purpose**: Detect container size changes and pre-populate cache before re-render
   *
   * **Critical Implementation Detail**:
   * Instead of clearing cache and triggering re-render (which causes clientWidth=0 during
   * DOM transient state), we PRE-POPULATE the cache with the correct value from ResizeObserver,
   * THEN trigger re-render. This ensures grid calculations never read stale/zero values.
   *
   * **Observer callback**:
   * 1. Get width from entry.contentRect.width (reliable during re-render)
   * 2. Pre-calculate and cache correct grid size using setGridSizeCache()
   * 3. Recalculate canvas height
   * 4. Increment renderVersion (triggers item re-renders with cached correct value)
   *
   * **Why this approach**:
   * - ResizeObserver provides accurate width via entry.contentRect
   * - Pre-populating cache bypasses DOM reads during re-render
   * - Prevents reading clientWidth=0 during StencilJS transient DOM state
   * - Grid calculations hit cache instead of reading DOM
   */
  private setupResizeObserver = () => {
    if (!this.gridContainerRef || this.resizeObserver) {
      return;
    }

    // Watch for canvas container size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to ensure layout is complete before recalculating
      // This prevents reading containerWidth=0 during StencilJS re-render cycle
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const width = entry.contentRect.width;

          // Only proceed if container is laid out (width > 100px)
          if (width > 100) {
            // Pre-populate cache with correct value BEFORE triggering re-render
            // This ensures grid calculations never read clientWidth=0 during re-render
            setGridSizeCache(this.canvasId, width, this.config);

            // Recalculate canvas height
            this.updateCanvasHeight();

            // Force re-render to update item positions
            // Grid calculations will now use the cached correct value
            this.renderVersion++;
          }
        }
      });
    });

    this.resizeObserver.observe(this.gridContainerRef);
  };

  /**
   * Render canvas template
   *
   * **Structure**:
   * - Canvas wrapper
   * - Grid container (no grid background lines)
   * - Item rendering loop
   *
   * **No grid background**: Cleaner output for viewer
   * **No dropzone**: Rendering-only, no drag-and-drop
   */
  render() {
    // Calculate min-height from config (default 20 grid units)
    const minHeightGridUnits = this.config?.canvasMinHeight ?? 20;
    const minHeightPx = gridToPixelsY(minHeightGridUnits, this.config);

    return (
      <div class="canvas-section-viewer" data-canvas-id={this.canvasId}>
        <div
          class="grid-container"
          id={this.canvasId}
          data-canvas-id={this.canvasId}
          style={{
            backgroundColor: this.backgroundColor || "#ffffff",
            minHeight: `${minHeightPx}px`,
            height:
              this.calculatedHeight > 0
                ? `${this.calculatedHeight}px`
                : undefined,
          }}
          ref={(el) => (this.gridContainerRef = el)}
        >
          {/* Grid items rendered by grid-item-wrapper components */}
          {this.items?.map((item: GridItem) => (
            <grid-item-wrapper
              key={item.id}
              item={item}
              renderVersion={this.renderVersion}
              config={this.config}
              componentRegistry={this.componentRegistry}
              viewerMode
              currentViewport={this.currentViewport}
              canvasItems={this.items}
            />
          ))}
        </div>
      </div>
    );
  }
}
