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
 *   canvasId="hero-section"
 *   items={items}
 *   currentViewport="desktop"
 *   config={gridConfig}
 *   componentRegistry={registry}
 * />
 * ```
 *
 * ## Performance
 *
 * **ResizeObserver**: Clears grid cache on container resize
 * **Virtual rendering**: Items use VirtualRenderer for lazy loading
 * **Render version**: Forces item recalculation on resize
 *
 * @module canvas-section-viewer
 */

import { Component, h, Prop, State } from '@stencil/core';

// Internal imports - no interact.js
import { GridItem } from '../../services/state-manager';
import { clearGridSizeCache } from '../../utils/grid-calculations';
import { GridConfig } from '../../types/grid-config';
import { ComponentDefinition } from '../../types/component-definition';

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
  tag: 'canvas-section-viewer',
  styleUrl: 'canvas-section-viewer.scss',
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
  @Prop() currentViewport!: 'desktop' | 'mobile';

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
   * **Purpose**: Setup ResizeObserver
   */
  componentDidLoad() {
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
   * Setup ResizeObserver for grid cache invalidation
   *
   * **Purpose**: Detect container size changes and force grid recalculation
   *
   * **Observer callback**:
   * 1. Clear grid size cache (grid-calculations.ts)
   * 2. Increment renderVersion (triggers item re-renders)
   *
   * **Why needed**:
   * - Grid calculations cached for performance
   * - Cache based on container width (responsive 2% units)
   * - Container resize invalidates cache
   * - Items need to recalculate positions with new dimensions
   */
  private setupResizeObserver = () => {
    if (!this.gridContainerRef || this.resizeObserver) {
      return;
    }

    // Watch for canvas container size changes
    this.resizeObserver = new ResizeObserver(() => {
      // Clear grid size cache when container resizes
      clearGridSizeCache();

      // Force re-render to update item positions
      this.renderVersion++;
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
    return (
      <div class="canvas-section-viewer" data-canvas-id={this.canvasId}>
        <div
          class="grid-container"
          id={this.canvasId}
          data-canvas-id={this.canvasId}
          style={{
            backgroundColor: this.backgroundColor || '#ffffff',
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
              viewerMode={true}
              currentViewport={this.currentViewport}
              canvasItems={this.items}
            />
          ))}
        </div>
      </div>
    );
  }
}
