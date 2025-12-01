/**
 * Canvas Section Component
 * ========================
 *
 * Individual canvas dropzone with grid background and item rendering.
 * This is a library component designed to work with the grid-builder component.
 *
 * ## Purpose
 *
 * Provides a single canvas section with:
 * - **Dropzone**: Accepts palette items and grid items via interact.js
 * - **Grid background**: Visual 2% horizontal × 20px vertical grid
 * - **Item rendering**: Renders all items on this canvas
 * - **ResizeObserver**: Invalidates grid cache on resize
 *
 * ## Key Differences from POC
 *
 * **Removed POC-specific features**:
 * - Section controls (background color picker, clear button, delete button)
 * - Section header with number
 * - Confirm dialogs
 * - section-delete events
 *
 * **Library-specific features**:
 * - Clean canvas without UI controls
 * - Grid background based on GridConfig
 * - Designed to be used inside grid-builder component
 *
 * ## Dropzone Behavior
 *
 * **Accepts two types of drops**:
 *
 * ### 1. Palette Item (Create New)
 * ```typescript
 * new CustomEvent('canvas-drop', {
 * detail: { canvasId, componentType, x, y },
 * bubbles: true,
 * composed: true
 * })
 * ```
 *
 * ### 2. Grid Item (Cross-Canvas Move)
 * ```typescript
 * new CustomEvent('canvas-move', {
 * detail: { itemId, sourceCanvasId, targetCanvasId, x, y },
 * bubbles: true,
 * composed: true
 * })
 * ```
 *
 * ## Grid Background
 *
 * **CSS grid pattern**:
 * - Horizontal: 2% of container width (responsive)
 * - Vertical: 20px (fixed)
 * - Color: rgba(0,0,0,0.05)
 * - Toggleable via gridState.showGrid
 *
 * ## Performance
 *
 * **ResizeObserver**: Clears grid cache on container resize
 * **Virtual rendering**: Items use VirtualRenderer for lazy loading
 * **Render version**: Forces item recalculation on resize
 * @module canvas-section
 */

import { Component, h, Prop, State, Watch } from "@stencil/core";
import interact from "interactjs";

// Internal imports
import {
  Canvas,
  GridItem,
} from "../../services/state-manager";
import {
  setGridSizeCache,
  gridToPixelsX,
  gridToPixelsY,
  getGridSizeVertical,
} from "../../utils/grid-calculations";
import { calculateCanvasHeight } from "../../utils/canvas-height-calculator";
import { GridConfig } from "../../types/grid-config";
import { ComponentDefinition } from "../../types/component-definition";
import { DeletionHook } from "../../types/deletion-hook";
import { VirtualRendererService } from "../../services/virtual-renderer";
import { EventManager } from "../../services/event-manager";
import { UndoRedoManager } from "../../services/undo-redo";
import { DOMCache } from "../../utils/dom-cache";

/**
 * CanvasSection Component
 * =======================
 *
 * Library component providing individual canvas dropzone.
 *
 * **Tag**: `<canvas-section>`
 * **Shadow DOM**: Disabled (required for interact.js compatibility)
 * **Reactivity**: Listens to gridState changes via StencilJS store
 */
@Component({
  tag: "canvas-section",
  styleUrl: "canvas-section.scss",
  shadow: false, // Light DOM required for interact.js
})
export class CanvasSection {
  /**
   * Canvas ID for state management
   *
   * **Format**: 'canvas1', 'canvas2', etc.
   * **Purpose**: Key for accessing canvas data in gridState.canvases
   * **Required**: Component won't render without valid canvasId
   */
  @Prop() canvasId!: string;

  /**
   * Grid configuration options
   *
   * **Optional**: Customizes grid system behavior
   * **Passed from**: grid-builder component
   * **Used for**: Grid size calculations, constraints
   */
  @Prop() config?: GridConfig;

  /**
   * Component registry (from parent grid-builder)
   *
   * **Source**: grid-builder component (built from components prop)
   * **Structure**: Map<type, ComponentDefinition>
   * **Purpose**: Pass to grid-item-wrapper for dynamic rendering
   */
  @Prop() componentRegistry?: Map<string, ComponentDefinition>;

  /**
   * Background color for this canvas
   *
   * **Host app responsibility**: Pass canvas styling from host app
   * **Library does NOT store**: backgroundColor is presentation concern
   * **Optional**: Defaults to '#ffffff'
   * @example
   * ```tsx
   * <canvas-section
   *   canvasId="hero-section"
   *   backgroundColor="#f0f4f8"
   * />
   * ```
   */
  @Prop() backgroundColor?: string;

  /**
   * Canvas title (from canvasMetadata)
   *
   * **Optional**: Display title for this section
   * **Renders as**: Rotated tab on right side, outside section bounds
   * **Builder mode only**: Title tabs visible in builder, not viewer
   * **Source**: Passed from grid-builder via canvasMetadata[canvasId].title
   * @example
   * ```tsx
   * <canvas-section
   *   canvasId="hero-section"
   *   canvasTitle="Hero Section"
   * />
   * ```
   */
  @Prop() canvasTitle?: string;

  /**
   * Whether this canvas is currently active
   *
   * **Purpose**: Indicate which canvas is currently focused/active
   * **Source**: Computed from gridState.activeCanvasId in grid-builder
   * **Default**: false
   * **Visual effect**: Applies 'active' CSS class to grid-container
   *
   * **Canvas becomes active when**:
   * - User clicks item on canvas
   * - User clicks canvas background
   * - User starts dragging item on canvas
   * - User starts resizing item on canvas
   * - Programmatically via api.setActiveCanvas()
   *
   * **Consumer styling hook**:
   * Consumer can style active canvas via CSS:
   * ```css
   * .grid-container.active .canvas-title {
   * opacity: 1;
   * }
   * ```
   * @example
   * ```tsx
   * <canvas-section
   *   canvasId="hero-section"
   *   isActive={gridState.activeCanvasId === 'hero-section'}
   * />
   * ```
   */
  @Prop() isActive?: boolean = false;

  /**
   * Deletion hook (from parent grid-builder)
   *
   * **Source**: grid-builder component (from onBeforeDelete prop)
   * **Purpose**: Pass through to grid-item-wrapper for deletion interception
   * **Optional**: If not provided, components delete immediately
   */
  @Prop() onBeforeDelete?: DeletionHook;

  /**
   * Virtual renderer service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated services
   */
  @Prop() virtualRendererInstance?: VirtualRendererService;

  /**
   * Undo/Redo manager service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated undo/redo stacks
   */
  @Prop() undoRedoManagerInstance?: UndoRedoManager;

  /**
   * Event manager service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated services
   */
  @Prop() eventManagerInstance?: EventManager;

  /**
   * State manager instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated state
   * **Used by**: DragHandler, ResizeHandler for accessing canvases and viewport
   */
  @Prop() stateInstance?: any;

  /**
   * State change subscription function (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   *
   * **Source**: grid-builder (this.stateManager.onChange)
   * **Purpose**: Subscribe to instance-specific state changes for reactivity
   *
   * **Usage**:
   * ```typescript
   * onStateChange={(key, callback) => this.stateManager.onChange(key, callback)}
   * ```
   */
  @Prop() onStateChange?: (key: string, callback: Function) => void;

  /**
   * DOM cache service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated DOM caches
   * **Used by**: DragHandler, ResizeHandler for fast canvas element lookups
   */
  @Prop() domCacheInstance?: DOMCache;

  /**
   * Theme configuration (from parent grid-builder)
   *
   * **Optional prop**: Theme for selection colors
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Pass theme.selectionColor to grid-item-wrapper for component selection styling
   */
  @Prop() theme?: any;

  /**
   * Canvas state (reactive)
   *
   * **Source**: gridState.canvases[canvasId]
   * **Updates**: componentWillLoad, componentWillUpdate, onChange subscription
   * **Contains**: items array, zIndexCounter (NO backgroundColor - that's a prop now)
   */
  @State() canvas: Canvas;

  /**
   * Render version counter (forces re-renders)
   *
   * **Purpose**: Trigger re-renders when grid calculations change
   * **Incremented on**: ResizeObserver events, state changes
   * **Passed to**: grid-item-wrapper as prop
   * **Why needed**: Grid calculations cached, need to recalculate on resize
   */
  @State() renderVersion: number = 0;

  /**
   * Calculated canvas height (content-based)
   *
   * **Purpose**: Dynamic canvas height based on bottommost item
   * **Calculation**: `(bottommost item y + height) + 5 grid units margin`
   * **Updates**: Real-time on item add/move/delete/resize
   * **Minimum**: 0 (CSS min-height: 400px will apply)
   *
   * **Formula**:
   * ```
   * calculatedHeight = gridToPixelsY(maxItemBottom + 5)
   * ```
   *
   * **Applied in render**:
   * ```typescript
   * style={{ height: calculatedHeight > 0 ? `${calculatedHeight}px` : undefined }}
   * ```
   */
  @State() private calculatedHeight: number = 0;

  /**
   * Drop target state
   *
   * **Internal state**: Tracks whether this canvas is currently a valid drop target
   * **Used for**: Adding 'drop-target' class for visual feedback during drag operations
   * **Pattern**: Replaces classList manipulation with reactive state
   *
   * **Value**:
   * - false: No drag is over this canvas
   * - true: A draggable element is currently over this canvas
   */
  @State() private isDropTarget: boolean = false;

  /**
   * Grid container DOM reference
   *
   * **Used for**:
   * - interact.js dropzone setup
   * - ResizeObserver monitoring
   * - Position calculations (getBoundingClientRect)
   */
  private gridContainerRef: HTMLElement;

  /**
   * Dropzone initialization flag
   *
   * **Prevents**: Multiple dropzone setups on same element
   * **Set in**: initializeDropzone()
   * **Checked in**: initializeDropzone(), disconnectedCallback()
   */
  private dropzoneInitialized: boolean = false;

  /**
   * ResizeObserver instance
   *
   * **Monitors**: gridContainerRef size changes
   * **Callback**: Clears grid cache, increments renderVersion
   * **Cleanup**: disconnectedCallback() disconnects observer
   */
  private resizeObserver: ResizeObserver;

  /**
   * Component will load lifecycle hook
   *
   * **Called**: Before first render
   * **Purpose**: Load initial canvas state and subscribe to changes
   *
   * **Operations**:
   * 1. Load canvas from global state
   * 2. Subscribe to 'canvases' state changes
   * 3. Update local canvas state on changes
   * 4. Increment renderVersion to trigger item re-renders
   */
  componentWillLoad() {
    // Initial load
    this.canvas = this.stateInstance.canvases[this.canvasId];

    // Calculate initial height
    this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config, this.stateInstance);

    // Subscribe to state changes
    this.onStateChange("canvases", () => {
      try {
        if (this.canvasId && this.stateInstance.canvases[this.canvasId]) {
          this.canvas = this.stateInstance.canvases[this.canvasId];
          this.renderVersion++; // Force re-render

          // Recalculate canvas height based on content
          this.calculatedHeight = calculateCanvasHeight(
            this.canvasId,
            this.config,
            this.stateInstance,
          );
        }
      } catch (error) {
        console.debug("Canvas section state update skipped:", error);
      }
    });

    // Subscribe to viewport changes (desktop ↔ mobile)
    this.onStateChange("currentViewport", () => {
      // Recalculate height for new viewport layout
      this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config, this.stateInstance);
    });

    // Subscribe to grid visibility changes
    this.onStateChange("showGrid", () => {
      // Force re-render to update grid visibility class
      this.renderVersion++;
    });
  }

  /**
   * Component will update lifecycle hook
   *
   * **Called**: Before each re-render
   * **Purpose**: Ensure canvas reference is fresh from state
   */
  componentWillUpdate() {
    this.canvas = this.stateInstance.canvases[this.canvasId];
  }

  /**
   * Component did load lifecycle hook
   *
   * **Called**: After first render (DOM available)
   * **Purpose**: Initialize interact.js dropzone and ResizeObserver
   */
  componentDidLoad() {
    this.initializeDropzone();
    this.setupResizeObserver();
    this.setupCanvasClickListener();
  }

  /**
   * Disconnected callback (cleanup)
   *
   * **Called**: When component removed from DOM
   * **Purpose**: Clean up interact.js and ResizeObserver
   */
  disconnectedCallback() {
    // Cleanup interact.js
    if (this.gridContainerRef && this.dropzoneInitialized) {
      interact(this.gridContainerRef).unset();
    }

    // Cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Watch for canvasId prop changes
   *
   * **When triggered**: Parent changes which canvas this component displays
   * **Actions**: Reload canvas data from state, recalculate height
   *
   * **Why needed**:
   * - Canvas ID is the key to access state
   * - Changing canvas ID means displaying different canvas
   * - Must reload items, metadata, and recalculate layout
   *
   * **Note**: This is rare in practice - usually canvas IDs are static
   */
  @Watch("canvasId")
  handleCanvasIdChange(newCanvasId: string, oldCanvasId: string) {
    // Skip if canvas ID hasn't changed
    if (newCanvasId === oldCanvasId) return;

    // Reload canvas data from state
    this.canvas = this.stateInstance.canvases[newCanvasId];

    // Recalculate canvas height for new canvas
    this.calculatedHeight = calculateCanvasHeight(newCanvasId, this.config, this.stateInstance);

    // Reinitialize dropzone with new canvas ID
    // (dropzone needs to know which canvas it belongs to)
    if (this.gridContainerRef && this.dropzoneInitialized) {
      interact(this.gridContainerRef).unset();
      this.dropzoneInitialized = false;
      this.initializeDropzone();
    }
  }

  /**
   * Watch for config prop changes
   *
   * **When triggered**: Parent passes updated GridConfig
   * **Actions**: Recalculate canvas height with new grid settings
   *
   * **Why needed**:
   * - Grid calculations depend on config (min/max grid size, etc.)
   * - Canvas height calculation uses grid-to-pixels conversions
   * - Config changes affect layout calculations
   */
  @Watch("config")
  handleConfigChange(newConfig: GridConfig, oldConfig: GridConfig) {
    // Skip if config reference hasn't changed
    if (newConfig === oldConfig) return;

    // Recalculate canvas height with new config (use instance state if available)
    this.calculatedHeight = calculateCanvasHeight(this.canvasId, newConfig, this.stateInstance);

    // Force re-render to update item positions with new grid size
    this.renderVersion++;
  }

  /**
   * Watch for isActive prop changes
   *
   * **When triggered**: Active canvas changes in grid-builder
   * **Purpose**: Apply/remove 'active' CSS class for styling
   *
   * **Note**: No action needed - the prop change triggers re-render
   * and the render() method applies the 'active' class based on this.isActive
   *
   * **Visual feedback**:
   * - Active canvas may have highlighted border
   * - Canvas title may be un-dimmed
   * - Host app can style via `.grid-container.active` selector
   */
  @Watch("isActive")
  handleIsActiveChange(newIsActive: boolean, oldIsActive: boolean) {
    // Skip if active state hasn't changed
    if (newIsActive === oldIsActive) return;

    // No action needed - render() will apply/remove 'active' class
    // This watcher is just for documentation and potential future enhancements
  }

  /**
   * Setup canvas click listener for background selection
   *
   * **Purpose**: Detect clicks on canvas background (not on grid items)
   *
   * **Event dispatch**:
   * - Only fires when clicking empty canvas area
   * - Does not fire when clicking grid items
   * - Bubbles up to grid-builder for host app to handle
   *
   * **Custom event**:
   * ```typescript
   * new CustomEvent('canvas-click', {
   *   detail: { canvasId },
   *   bubbles: true,
   *   composed: true
   * })
   * ```
   *
   * **Use case**: Host app can show canvas settings panel when canvas selected
   */
  private setupCanvasClickListener = () => {
    if (!this.gridContainerRef) {
      return;
    }

    this.gridContainerRef.addEventListener("click", (event: MouseEvent) => {
      // Only fire if clicking directly on the grid container
      // (not on a grid item or other child element)
      if (event.target === this.gridContainerRef) {
        // Set this canvas as active
        this.stateInstance.activeCanvasId = this.canvasId;

        // Emit canvas-activated event
        const canvasActivatedEvent = new CustomEvent("canvas-activated", {
          detail: {
            canvasId: this.canvasId,
          },
          bubbles: true,
          composed: true,
        });
        this.gridContainerRef.dispatchEvent(canvasActivatedEvent);

        // Emit canvas-click event (backward compatibility)
        const canvasClickEvent = new CustomEvent("canvas-click", {
          detail: {
            canvasId: this.canvasId,
          },
          bubbles: true,
          composed: true,
        });
        this.gridContainerRef.dispatchEvent(canvasClickEvent);
      }
    });
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
   * 3. Increment renderVersion (triggers item re-renders with cached correct value)
   *
   * **Why this approach**:
   * - ResizeObserver provides accurate width via entry.contentRect
   * - Pre-populating cache bypasses DOM reads during re-render
   * - Prevents reading clientWidth=0 during StencilJS transient DOM state
   * - Grid calculations hit cache instead of reading DOM
   */
  private setupResizeObserver = () => {
    if (!this.gridContainerRef) {
      return;
    }

    // Watch for canvas container size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to ensure layout is complete before recalculating
      // This prevents reading containerWidth=0 during StencilJS re-render cycle
      requestAnimationFrame(() => {
        for (const entry of entries) {
          // Get width from ResizeObserver entry (more reliable than clientWidth during re-render)
          const width = entry.contentRect.width;

          // Only proceed if container is laid out (width > 100px)
          if (width > 100) {
            // Pre-populate cache with correct value BEFORE triggering re-render
            // This ensures grid calculations never read clientWidth=0 during re-render
            setGridSizeCache(this.canvasId, width, this.config);

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
   * Initialize interact.js dropzone
   *
   * **Called from**: componentDidLoad (after DOM available)
   * **Purpose**: Setup dropzone to receive palette items and grid items
   *
   * ## Dropzone Configuration
   *
   * **Accept pattern**: `.palette-item, .grid-item`
   * - `.palette-item` - New components from palette
   * - `.grid-item` - Existing items for cross-canvas moves
   *
   * **Overlap mode**: `'pointer'`
   * - Drop detection based on cursor position
   * - More intuitive than element overlap
   *
   * ## Drop Event Handling
   *
   * ### 1. Palette Item Drop (Create New)
   *
   * **Component type extraction**:
   * ```typescript
   * const componentType = droppedElement.getAttribute('data-component-type');
   * ```
   *
   * **Position calculation**:
   * - Get component's defaultSize from definition
   * - Calculate half dimensions for cursor-centering
   * - Subtract half dimensions from cursor position
   *
   * **Custom event dispatch**:
   * ```typescript
   * dispatchEvent(new CustomEvent('canvas-drop', {
   *   detail: { canvasId, componentType, x, y },
   *   bubbles: true,
   *   composed: true
   * }));
   * ```
   *
   * ### 2. Grid Item Drop (Cross-Canvas Move)
   *
   * **Only process cross-canvas moves**:
   * - Same-canvas moves handled by drag handler
   * - Prevents duplicate events
   *
   * **Position calculation**:
   * - Use element's bounding rect (already positioned by drag handler)
   * - Calculate position relative to target canvas
   *
   * **Custom event dispatch**:
   * ```typescript
   * dispatchEvent(new CustomEvent('canvas-move', {
   *   detail: { itemId, sourceCanvasId, targetCanvasId, x, y },
   *   bubbles: true,
   *   composed: true
   * }));
   * ```
   */
  private initializeDropzone = () => {
    if (!this.gridContainerRef || this.dropzoneInitialized) {
      return;
    }

    const interactable = interact(this.gridContainerRef);

    interactable.dropzone({
      accept: ".palette-item, .grid-item, .grid-item-header",
      overlap: "pointer",

      listeners: {
        dragenter: (_event: any) => {
          // Add visual feedback when drag enters canvas (replaces classList.add)
          this.isDropTarget = true;
        },

        dragleave: (_event: any) => {
          // Remove visual feedback when drag leaves canvas (replaces classList.remove)
          this.isDropTarget = false;
        },

        drop: (event: any) => {
          // Remove visual feedback on successful drop (replaces classList.remove)
          this.isDropTarget = false;
          let droppedElement = event.relatedTarget;

          // If dropped element is inside a palette item, get the palette item
          const paletteItem = droppedElement.closest(".palette-item");
          if (paletteItem) {
            droppedElement = paletteItem;
          }

          const isPaletteItem =
            droppedElement.classList.contains("palette-item");

          // Mark palette item drop as valid (for snap-back animation)
          if (isPaletteItem) {
            (droppedElement as any)._dropWasValid = true;
          }

          // Check if it's a grid item or grid item header (drag handle)
          const isGridItemHeader =
            droppedElement.classList.contains("grid-item-header");
          const isGridItem = droppedElement.classList.contains("grid-item");

          // If it's the header, find the parent grid-item
          const gridItem = isGridItemHeader
            ? droppedElement.closest(".grid-item")
            : droppedElement;

          if (isPaletteItem) {
            // Dropping from palette - create new item
            const componentType = droppedElement.getAttribute(
              "data-component-type",
            );

            // Get stored dimensions from palette drag handler (or fall back to 10×6 default)
            const defaultWidth = (droppedElement as any)._defaultWidth || 10;
            const defaultHeight = (droppedElement as any)._defaultHeight || 6;
            const widthPx = gridToPixelsX(
              defaultWidth,
              this.canvasId,
              this.config,
            );
            const heightPx = gridToPixelsY(defaultHeight, this.config);
            const halfWidth = widthPx / 2;
            const halfHeight = heightPx / 2;

            // Get drop position relative to grid container (cursor-centered)
            const rect = this.gridContainerRef.getBoundingClientRect();
            const x = event.dragEvent.clientX - rect.left - halfWidth;
            const y = event.dragEvent.clientY - rect.top - halfHeight;

            // Dispatch custom event for grid-builder to handle
            const dropEvent = new CustomEvent("canvas-drop", {
              detail: {
                canvasId: this.canvasId,
                componentType,
                x,
                y,
              },
              bubbles: true,
              composed: true,
            });
            this.gridContainerRef.dispatchEvent(dropEvent);
          } else if (isGridItem || isGridItemHeader) {
            // Moving existing grid item to different canvas
            const itemId = gridItem.id;
            const sourceCanvasId = gridItem.getAttribute("data-canvas-id");

            // Only process cross-canvas moves
            if (sourceCanvasId !== this.canvasId) {
              // Get element's position (already positioned by drag handler)
              const droppedRect = gridItem.getBoundingClientRect();
              const rect = this.gridContainerRef.getBoundingClientRect();

              // Calculate position relative to target canvas
              const x = droppedRect.left - rect.left;
              const y = droppedRect.top - rect.top;

              // Dispatch custom event for cross-canvas move
              const moveEvent = new CustomEvent("canvas-move", {
                detail: {
                  itemId,
                  sourceCanvasId,
                  targetCanvasId: this.canvasId,
                  x,
                  y,
                },
                bubbles: true,
                composed: true,
              });
              this.gridContainerRef.dispatchEvent(moveEvent);
            }
          }
        },
      },
    });

    this.dropzoneInitialized = true;
  };

  /**
   * Render component template
   *
   * **Structure**:
   * - Grid container with background
   * - Dynamic class for grid visibility
   * - Background color from canvas state
   * - Item rendering loop
   *
   * **Grid background**:
   * - CSS linear gradients (2% horizontal, 20px vertical)
   * - Toggleable via gridState.showGrid
   * - Hidden when .hide-grid class applied
   *
   * **Item rendering**:
   * - Maps over canvas.items
   * - Renders grid-item-wrapper for each item
   * - Passes renderVersion to force recalculation
   */
  render() {
    const showGrid = this.stateInstance.showGrid;
    const verticalGridSize = getGridSizeVertical(this.config);

    // Calculate min-height from config (default 20 grid units)
    const minHeightGridUnits = this.config?.canvasMinHeight ?? 20;
    const minHeightPx = gridToPixelsY(minHeightGridUnits, this.config);

    return (
      <div class="canvas-section" data-canvas-id={this.canvasId}>
        <div
          class={{
            "grid-container": true,
            "hide-grid": !showGrid,
            active: this.isActive,
            "drop-target": this.isDropTarget,
          }}
          id={this.canvasId}
          role="region"
          aria-label={this.canvasTitle || `Canvas ${this.canvasId}`}
          data-canvas-id={this.canvasId}
          style={{
            backgroundColor: this.backgroundColor || "#ffffff",
            backgroundSize: `2% ${verticalGridSize}px`,
            backgroundImage: showGrid
              ? `linear-gradient(${this.theme?.gridLineColor || "rgba(0, 0, 0, 0.05)"} 1px, transparent 1px), linear-gradient(90deg, ${this.theme?.gridLineColor || "rgba(0, 0, 0, 0.05)"} 1px, transparent 1px)`
              : "none",
            minHeight: `${minHeightPx}px`,
            ["--primary-color" as any]: this.theme?.primaryColor || "#007bff",
            ...(this.calculatedHeight > 0
              ? { height: `${this.calculatedHeight}px` }
              : {}),
          }}
          ref={(el) => (this.gridContainerRef = el)}
        >
          {/* Grid items rendered by grid-item-wrapper components */}
          {this.canvas?.items.map((item: GridItem) => (
            <grid-item-wrapper
              key={item.id}
              item={item}
              renderVersion={this.renderVersion}
              config={this.config}
              componentRegistry={this.componentRegistry}
              onBeforeDelete={this.onBeforeDelete}
              virtualRendererInstance={this.virtualRendererInstance}
              eventManagerInstance={this.eventManagerInstance}
              undoRedoManagerInstance={this.undoRedoManagerInstance}
              stateInstance={this.stateInstance}
              domCacheInstance={this.domCacheInstance}
              theme={this.theme}
            />
          ))}
        </div>
      </div>
    );
  }
}
