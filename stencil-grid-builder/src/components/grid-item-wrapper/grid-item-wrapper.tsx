/**
 * Grid Item Wrapper Component (Library Version)
 * ===============================================
 *
 * Individual grid item container with dynamic component rendering from registry.
 * This is the library version that uses ComponentDefinition.render() for flexibility.
 *
 * ## Key Differences from POC
 *
 * **Dynamic component rendering**:
 * - POC: Hardcoded switch statement with 8 component types
 * - Library: Uses ComponentDefinition.render() from component registry
 * - Consumer defines all component types
 * - Library just calls the render function
 *
 * **Removed POC-specific**:
 * - componentTemplates import (hardcoded component data)
 * - Fixed component type switch statement
 * - Hardcoded icon/title from templates
 *
 * **Added library features**:
 * - Component registry lookup
 * - Fallback for unknown component types
 * - Pass GridConfig to grid calculations
 * @module grid-item-wrapper
 */

import { Component, h, Listen, Prop, State, Watch } from "@stencil/core";

// Internal imports
import { GridItem, DEFAULT_BREAKPOINTS } from "../../services/state-manager";
import { UndoRedoManager } from "../../services/undo-redo";
import { MoveItemCommand } from "../../services/undo-redo-commands";
import { VirtualRendererService } from "../../services/virtual-renderer";
import { EventManager } from "../../services/event-manager";
import { DragHandler } from "../../utils/drag-handler";
import { ResizeHandler } from "../../utils/resize-handler";
import { DOMCache } from "../../utils/dom-cache";
import { gridToPixelsX, gridToPixelsY } from "../../utils/grid-calculations";
import {
  getEffectiveLayout,
  shouldAutoStack,
  calculateAutoStackLayout,
} from "../../utils/breakpoint-utils";
import { GridConfig } from "../../types/grid-config";
import { createDebugLogger } from "../../utils/debug";
import { ComponentRegistry } from "../../services/component-registry";
import { GridErrorAdapter } from "../../services/grid-error-adapter";
import { deepClone } from "../../utils/object-utils";

const debug = createDebugLogger("grid-item-wrapper");

/**
 * GridItemWrapper Component
 * ==========================
 *
 * Library component wrapping individual grid items with drag/resize/selection.
 *
 * **Tag**: `<grid-item-wrapper>`
 * **Shadow DOM**: Disabled (required for interact.js compatibility)
 * **Dynamic rendering**: Uses ComponentDefinition.render() from registry
 */
@Component({
  tag: "grid-item-wrapper",
  styleUrl: "grid-item-wrapper.scss",
  shadow: false,
})
export class GridItemWrapper {
  /**
   * Grid item data (position, size, type, etc.)
   *
   * **Source**: Parent canvas-section component
   * **Contains**: id, canvasId, type, name, layouts (desktop/mobile), zIndex, config
   */
  @Prop() item!: GridItem;

  /**
   * Render version (force re-render trigger)
   *
   * **Source**: Parent canvas-section (incremented on resize)
   * **Purpose**: Force grid calculation refresh when container resizes
   */
  @Prop() renderVersion?: number;

  /**
   * Grid configuration options
   *
   * **Optional**: Customizes grid system behavior
   * **Passed from**: grid-builder → canvas-section → grid-item-wrapper
   * **Used for**: Grid size calculations with constraints
   */
  @Prop() config?: GridConfig;

  /**
   * Component registry (from parent grid-builder)
   *
   * **Source**: grid-builder component (built from components prop)
   * **Structure**: ComponentRegistry service instance
   * **Purpose**: Look up component definitions for dynamic rendering
   *
   * **Instance-based architecture**: Each grid-builder instance has its own
   * registry, supporting multiple grids with different component sets on the
   * same page. Prop drilling (3 levels) is the correct pattern for this use case.
   */
  @Prop() componentRegistry?: ComponentRegistry;

  /**
   * Deletion hook (from parent grid-builder)
   *
   * **Source**: grid-builder component (from beforeDeleteHook prop)
   * **Purpose**: Allow host app to intercept deletion requests
   *
   * **Hook behavior**:
   * - Called before deleting a component
   * - Receives context with item data
   * - Returns true/false or Promise<boolean>
   * - If false, deletion is cancelled
   * - If true, deletion proceeds
   *
   * **Default**: If not provided, components delete immediately
   */
  @Prop() beforeDeleteHook?: (context: any) => boolean | Promise<boolean>;

  /**
   * Theme configuration (from parent grid-builder)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Access theme.selectionColor for component selection styling
   *
   * **Fallback chain for selection color**:
   * 1. ComponentDefinition.selectionColor (per-component override)
   * 2. theme.selectionColor (global theme default)
   * 3. "#f59e0b" (hardcoded fallback - amber/gold)
   *
   * **Why passed**: grid-item-wrapper doesn't have access to global theme,
   * so must be passed through component tree
   */
  @Prop() theme?: any;

  /**
   * Viewer mode flag
   *
   * **Purpose**: Disable editing features for rendering-only mode
   * **Default**: false (editing enabled)
   *
   * **When true**:
   * - ❌ No drag-and-drop handlers
   * - ❌ No resize handles
   * - ❌ No item header (drag handle)
   * - ❌ No delete button
   * - ❌ No selection state
   * - ✅ Only renders component content
   *
   * **Use case**: grid-viewer component for display-only mode
   */
  @Prop() viewerMode?: boolean = false;

  /**
   * Current viewport (for viewer mode)
   *
   * **Purpose**: Determine which layout to render (desktop or mobile)
   * **Source**: grid-viewer → canvas-section-viewer → grid-item-wrapper
   * **Used by**: render() to select appropriate layout
   *
   * **Note**: When in builder mode (viewerMode=false), this is ignored
   * and gridState.currentViewport is used instead. When in viewer mode
   * (viewerMode=true), this prop is required.
   */
  @Prop() currentViewport?: string;

  /**
   * Breakpoint configuration (for viewer mode)
   *
   * **Purpose**: Define responsive breakpoints and layout modes
   * **Source**: grid-viewer → canvas-section-viewer → grid-item-wrapper
   * **Used by**: render() to determine auto-stacking and layout inheritance
   *
   * **Note**: When in builder mode (viewerMode=false), this is ignored
   * and stateInstance.breakpoints is used instead. When in viewer mode
   * (viewerMode=true), this prop is optional (defaults to DEFAULT_BREAKPOINTS).
   */
  @Prop() breakpoints?: any; // BreakpointConfig

  /**
   * Virtual renderer service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   * **Optional for viewer mode** (grid-viewer doesn't need it)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated services
   */
  @Prop() virtualRendererInstance?: VirtualRendererService;

  /**
   * Event manager service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   * **Optional for viewer mode** (grid-viewer doesn't need it)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated services
   */
  @Prop() eventManagerInstance?: EventManager;

  /**
   * State manager instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   * **Optional for viewer mode** (grid-viewer doesn't need it)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated state
   * **Used by**: DragHandler, ResizeHandler for accessing canvases and viewport
   */
  @Prop() stateInstance?: any;

  /**
   * Undo/Redo manager service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   * **Optional for viewer mode** (grid-viewer doesn't need it)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated undo/redo stacks
   * **Used by**: handleItemUpdate() for pushing move/resize commands to undo stack
   */
  @Prop() undoRedoManagerInstance?: UndoRedoManager;

  /**
   * DOM cache service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   * **Optional for viewer mode** (grid-viewer doesn't need it)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated DOM caches
   * **Used by**: DragHandler, ResizeHandler for fast canvas element lookups
   */
  @Prop() domCacheInstance?: DOMCache;

  /**
   * Error adapter service instance (passed from grid-builder)
   *
   * **Required for editing mode** (grid-builder provides this)
   * **Optional for viewer mode** (grid-viewer doesn't need it)
   *
   * **Source**: grid-builder → canvas-section → grid-item-wrapper
   * **Purpose**: Support multiple grid-builder instances with isolated error handling
   * **Used by**: Error boundary for handling component render errors
   *
   * **Error isolation strategy**:
   * - Item-level errors (component render failures) are caught by error boundary
   * - Error adapter converts to GridErrorEventDetail and emits to EventManager
   * - Other grid items continue functioning (isolation achieved)
   * - Fallback UI shown for failed item (graceful degradation)
   */
  @Prop() errorAdapterInstance?: GridErrorAdapter;

  /**
   * All items in the canvas (for viewer mode auto-layout)
   *
   * **Purpose**: Calculate mobile auto-layout positions
   * **Source**: grid-viewer → canvas-section-viewer → grid-item-wrapper
   * **Used by**: render() to calculate stacked positions in mobile viewport
   *
   * **Note**: When in builder mode (viewerMode=false), this is ignored
   * and gridState.canvases is used instead. When in viewer mode
   * (viewerMode=true), this prop is required for mobile auto-layout.
   */
  @Prop() canvasItems?: GridItem[];

  /**
   * Selection state (reactive)
   *
   * **Managed by**: updateComponentState()
   * **Updated on**: componentWillLoad, componentWillUpdate
   * **Triggers**: Visual selection styles (.selected class)
   */
  @State() isSelected: boolean = false;

  /**
   * Visibility state (virtual rendering)
   *
   * **Managed by**: IntersectionObserver callback
   * **Initial value**: false (don't render content yet)
   * **Triggered by**: Observer callback or manual check for initially-visible items
   * **Controls**: Whether component content renders or placeholder shows
   *
   * **Note**: Virtual renderer checks if element is initially in viewport
   * and triggers callback immediately to prevent "Loading..." on visible items.
   * Off-screen items stay false until scrolled into view (virtual rendering).
   */
  @State() isVisible: boolean = false;

  /**
   * Item DOM element reference
   */
  private itemRef: HTMLElement;

  /**
   * Drag handler instance
   */
  private dragHandler: DragHandler;

  /**
   * Resize handler instance
   */
  private resizeHandler: ResizeHandler;

  /**
   * Item snapshot (for undo/redo)
   */
  private itemSnapshot: GridItem | null = null;

  /**
   * Track whether item was dragged (to prevent click event on drag end)
   */
  private wasDragged: boolean = false;

  /**
   * Track whether item is currently being dragged or resized
   *
   * **Purpose**: Prevent snapshot updates during active operations
   * **Why needed**: componentWillUpdate fires during drag/resize, which would
   * capture intermediate states instead of initial state for undo/redo
   * **Set by**: DragHandler/ResizeHandler at operation start
   * **Cleared by**: DragHandler/ResizeHandler at operation end
   */
  private isOperating: boolean = false;

  /**
   * Component will load lifecycle hook
   */
  componentWillLoad() {
    this.updateComponentState();

    // Set initial visibility BEFORE first render
    // When virtual rendering is disabled (e.g., Storybook), render immediately
    if (this.config?.enableVirtualRendering === false) {
      this.isVisible = true;
    }
    // When virtual rendering is enabled (default), isVisible starts as false
    // and will be updated by IntersectionObserver callback in componentDidLoad
  }

  /**
   * Component will update lifecycle hook
   */
  componentWillUpdate() {
    this.updateComponentState();
  }

  /**
   * Update component state (selection and snapshot)
   */
  private updateComponentState() {
    // Skip in viewer mode (no state management needed)
    if (this.viewerMode) {
      this.isSelected = false;
      return;
    }

    // Update selection state
    const selectedItemId = this.stateInstance.selectedItemId;
    this.isSelected = selectedItemId === this.item.id;

    // Capture item snapshot for undo/redo
    // IMPORTANT: Only capture when NOT actively dragging/resizing
    // During drag/resize, componentWillUpdate fires on state changes, which would
    // capture intermediate states instead of initial state, breaking undo/redo
    if (!this.isOperating) {
      this.captureItemSnapshot();
    }
  }

  /**
   * Component did load lifecycle hook
   */
  componentDidLoad() {
    // Skip if component was hidden (renderComponent returned null)
    if (!this.itemRef) {
      return;
    }

    // Set up virtual rendering observer (both builder and viewer modes)
    // Virtual rendering improves performance for long pages with many components
    // Can be disabled via config for Storybook or testing scenarios
    //
    // IMPORTANT: Defer observer setup to avoid state change during componentDidLoad()
    // The IntersectionObserver callback fires immediately if the element is in viewport,
    // which would cause a state change and trigger Stencil warning about extra re-renders.
    // Using requestAnimationFrame defers setup until after lifecycle completes.
    requestAnimationFrame(() => {
      if (
        this.config?.enableVirtualRendering !== false &&
        this.virtualRendererInstance
      ) {
        // Virtual rendering enabled (default behavior)
        this.virtualRendererInstance.observe(
          this.itemRef,
          this.item.id,
          (isVisible) => {
            this.isVisible = isVisible;
          },
        );
      } else {
        // Virtual rendering disabled or no instance (viewer mode) - render immediately
        this.isVisible = true;
      }
    });

    // Inject component content into custom wrapper's content slot if needed
    this.injectComponentContent();

    // Skip drag/resize handlers in viewer mode
    if (!this.viewerMode) {
      // Get component definition for min/max size constraints
      const componentDefinition = this.componentRegistry?.get(this.item.type);

      // Get the header element for drag handler
      const headerElement = this.itemRef.querySelector(
        ".grid-item-header",
      ) as HTMLElement;

      // Initialize drag and resize handlers
      // Pass header element for drag (instead of whole item)
      this.dragHandler = new DragHandler(
        this.itemRef,
        this.item,
        this.stateInstance,
        this.handleItemUpdate,
        this.domCacheInstance,
        this.config,
        headerElement,
        () => {
          this.wasDragged = true;
        },
        // Operation state callbacks (prevent snapshot corruption during drag/resize)
        () => {
          this.isOperating = true;
        },
        () => {
          this.isOperating = false;
        },
      );
      this.resizeHandler = new ResizeHandler(
        this.itemRef,
        this.item,
        this.stateInstance,
        this.handleItemUpdate,
        this.domCacheInstance,
        componentDefinition,
        this.config,
        // Operation state callbacks (prevent snapshot corruption during drag/resize)
        () => {
          this.isOperating = true;
        },
        () => {
          this.isOperating = false;
        },
      );
    }
  }

  /**
   * Component did update lifecycle hook
   */
  componentDidUpdate() {
    // Skip if component was hidden (renderComponent returned null)
    if (!this.itemRef) {
      return;
    }

    // Re-inject component content if custom wrapper re-rendered
    this.injectComponentContent();
  }

  /**
   * Inject component content into custom wrapper's content slot
   *
   * **Purpose**: For custom wrappers, find the content slot div and inject component
   * **Called from**: componentDidLoad, componentDidUpdate
   * **Why needed**: Custom wrapper JSX renders, then we inject content into its slot
   */
  private injectComponentContent() {
    // Only for custom wrappers
    const definition = this.componentRegistry?.get(this.item.type);
    if (!definition?.renderItemWrapper || !this.itemRef) return;

    // Find the content slot
    const contentSlotId = `${this.item.id}-content`;
    const contentSlot = this.itemRef.querySelector(`#${contentSlotId}`);
    if (!contentSlot) return;

    // Check if already injected
    if (contentSlot.hasAttribute("data-content-injected")) return;

    // Render and inject component content
    const componentContent = this.renderComponent();

    // Clear any existing content
    contentSlot.innerHTML = "";

    if (componentContent instanceof HTMLElement) {
      contentSlot.appendChild(componentContent);
    } else {
      // For Stencil vNodes, we need to use a workaround
      // Create a temporary container and let Stencil render into it
      const tempContainer = document.createElement("div");
      contentSlot.appendChild(tempContainer);

      // This is a limitation - vNodes can't be manually appended
      // The custom wrapper should handle rendering the component directly
      // For now, we'll just set a placeholder
      tempContainer.textContent = "[Component Content]";
    }

    // Mark as injected
    contentSlot.setAttribute("data-content-injected", "true");
  }

  /**
   * Disconnected callback (cleanup)
   */
  disconnectedCallback() {
    // Cleanup handlers
    if (this.dragHandler) {
      this.dragHandler.destroy();
    }
    if (this.resizeHandler) {
      this.resizeHandler.destroy();
    }

    // Cleanup virtual renderer
    if (this.itemRef && this.virtualRendererInstance) {
      this.virtualRendererInstance.unobserve(this.itemRef, this.item.id);
    }
  }

  /**
   * Watch for item prop changes
   *
   * **When triggered**: Parent passes updated item data
   * **Actions**:
   * - Update component state (selection, snapshot)
   * - Reinitialize drag/resize handlers with new item data
   * - Preserve handlers if already initialized
   */
  @Watch("item")
  handleItemChange(newItem: GridItem, oldItem: GridItem) {
    // Skip if item reference hasn't actually changed
    if (newItem === oldItem) return;

    debug.log("📦 Item prop changed:", {
      itemId: newItem.id,
      oldId: oldItem?.id,
    });

    // Update component state
    this.updateComponentState();

    // Update drag/resize handlers with new item data
    if (!this.viewerMode && this.dragHandler && this.resizeHandler) {
      // Handlers are already initialized, they'll use the updated this.item reference
      // No need to destroy and recreate - they reference this.item internally
      debug.log("  ✅ Handlers updated with new item reference");
    }
  }

  /**
   * Watch for renderVersion prop changes
   *
   * **When triggered**: Parent increments renderVersion (e.g., on container resize)
   * **Purpose**: Force component re-render to recalculate grid positions
   * **Note**: This is a force-update mechanism, actual recalculation happens in render()
   */
  @Watch("renderVersion")
  handleRenderVersionChange(newVersion: number, oldVersion: number) {
    // Skip if version hasn't changed (undefined → undefined)
    if (newVersion === oldVersion) return;

    debug.log("🔄 RenderVersion changed:", {
      oldVersion,
      newVersion,
      itemId: this.item.id,
    });

    // No action needed - the prop change itself triggers re-render
    // Grid calculations will be re-executed in render()
  }

  /**
   * Watch for config prop changes
   *
   * **When triggered**: Parent passes updated GridConfig
   * **Actions**: Reinitialize drag/resize handlers with new config
   * **Note**: Config changes are rare (e.g., user changes grid settings)
   */
  @Watch("config")
  handleConfigChange(newConfig: GridConfig, oldConfig: GridConfig) {
    // Skip if config reference hasn't changed
    if (newConfig === oldConfig) return;

    debug.log("⚙️ Config prop changed:", {
      itemId: this.item.id,
      oldConfig,
      newConfig,
    });

    // Reinitialize handlers with new config
    if (!this.viewerMode && this.itemRef) {
      // Cleanup old handlers
      if (this.dragHandler) {
        this.dragHandler.destroy();
      }
      if (this.resizeHandler) {
        this.resizeHandler.destroy();
      }

      // Recreate handlers with new config
      const componentDefinition = this.componentRegistry?.get(this.item.type);
      const headerElement = this.itemRef.querySelector(
        ".grid-item-header",
      ) as HTMLElement;

      this.dragHandler = new DragHandler(
        this.itemRef,
        this.item,
        this.stateInstance,
        this.handleItemUpdate,
        this.domCacheInstance,
        newConfig,
        headerElement,
        () => {
          this.wasDragged = true;
        },
        // Operation state callbacks (prevent snapshot corruption during drag/resize)
        () => {
          this.isOperating = true;
        },
        () => {
          this.isOperating = false;
        },
      );
      this.resizeHandler = new ResizeHandler(
        this.itemRef,
        this.item,
        this.stateInstance,
        this.handleItemUpdate,
        this.domCacheInstance,
        componentDefinition,
        newConfig,
        // Operation state callbacks (prevent snapshot corruption during drag/resize)
        () => {
          this.isOperating = true;
        },
        () => {
          this.isOperating = false;
        },
      );

      debug.log("  ✅ Handlers reinitialized with new config");
    }
  }

  /**
   * Watch for currentViewport prop changes (viewer mode only)
   *
   * **When triggered**: Viewport switches between desktop/mobile in viewer mode
   * **Purpose**: Force re-render to use appropriate layout
   * **Note**: Only relevant in viewerMode=true
   */
  @Watch("currentViewport")
  handleViewportChange(
    newViewport: "desktop" | "mobile",
    oldViewport: "desktop" | "mobile",
  ) {
    // Skip if viewport hasn't changed
    if (newViewport === oldViewport) return;

    // Only relevant in viewer mode
    if (!this.viewerMode) return;

    debug.log("📱 Viewport prop changed (viewer mode):", {
      oldViewport,
      newViewport,
      itemId: this.item.id,
    });

    // No action needed - the prop change itself triggers re-render
    // render() will use the new viewport to select layout
  }

  /**
   * Listen for item-delete events from custom wrapper components
   * This is the PUBLIC API for custom wrappers to request item deletion
   * We intercept these and re-dispatch as internal 'grid-item:delete' events
   */
  @Listen("item-delete")
  handleItemDeleteEvent(event: CustomEvent) {
    debug.log("🔴 @Listen(item-delete) - from custom wrapper", {
      eventTarget: event.target,
      itemId: this.item.id,
    });

    // Stop the public event from bubbling
    event.stopPropagation();

    // Re-dispatch as internal event that grid-builder listens for
    const deleteEvent = new CustomEvent("grid-item:delete", {
      detail: { itemId: this.item.id, canvasId: this.item.canvasId },
      bubbles: true,
      composed: true,
    });
    debug.log("  📤 Re-dispatching as grid-item:delete");
    this.itemRef.dispatchEvent(deleteEvent);
  }

  /**
   * Listen for item-bring-to-front events from custom wrapper components
   */
  @Listen("item-bring-to-front")
  handleItemBringToFrontEvent(event: CustomEvent) {
    event.stopPropagation();

    // Skip in viewer mode (no editing support)
    if (this.viewerMode) return;

    const canvas = this.stateInstance.canvases[this.item.canvasId];
    if (!canvas) return;

    const maxZ = Math.max(...canvas.items.map((i) => i.zIndex));
    const newItems = canvas.items.map((item) =>
      item.id === this.item.id ? { ...item, zIndex: maxZ + 1 } : item,
    );
    this.stateInstance.canvases = {
      ...this.stateInstance.canvases,
      [this.item.canvasId]: { ...canvas, items: newItems },
    };
  }

  /**
   * Listen for item-send-to-back events from custom wrapper components
   */
  @Listen("item-send-to-back")
  handleItemSendToBackEvent(event: CustomEvent) {
    event.stopPropagation();

    // Skip in viewer mode (no editing support)
    if (this.viewerMode) return;

    const canvas = this.stateInstance.canvases[this.item.canvasId];
    if (!canvas) return;

    const minZ = Math.min(...canvas.items.map((i) => i.zIndex));
    const newItems = canvas.items.map((item) =>
      item.id === this.item.id ? { ...item, zIndex: minZ - 1 } : item,
    );
    this.stateInstance.canvases = {
      ...this.stateInstance.canvases,
      [this.item.canvasId]: { ...canvas, items: newItems },
    };
  }

  /**
   * Render component content (dynamic component from registry)
   *
   * **Dynamic rendering via ComponentDefinition.render()**:
   * - Lookup component definition by type in registry
   * - Call definition.render({ itemId, config })
   * - Consumer controls what gets rendered
   * - Library just provides the wrapper
   *
   * **Virtual rendering guard**:
   * - Only render when isVisible = true
   * - Show placeholder while loading
   * - Performance optimization
   *
   * **Fallback for unknown types**:
   * - If no registry provided: "Component registry not available"
   * - If type not in registry:
   *   1. Check config.hideUnknownComponents → hide completely (return null)
   *   2. Check config.renderUnknownComponent → use custom renderer
   *   3. Otherwise → show default error: "Unknown component type: {type}"
   * - Prevents crashes, helps debugging
   */
  private renderComponent() {
    // Virtual rendering: only render component content when visible
    if (!this.isVisible) {
      return <div class="component-placeholder">Loading...</div>;
    }

    // Check if component registry is available
    if (!this.componentRegistry) {
      console.error(
        `GridItemWrapper: componentRegistry not provided for item ${this.item.id}`,
      );
      return (
        <div class="component-error">Component registry not available</div>
      );
    }

    // Look up component definition from registry
    const definition = this.componentRegistry.get(this.item.type);

    if (!definition) {
      // Unknown component type - handle according to config options

      // Option 1: Hide unknown components completely
      if (this.config?.hideUnknownComponents) {
        debug.log(
          `GridItemWrapper: Hiding unknown component type "${this.item.type}" (hideUnknownComponents=true)`,
        );
        return null; // Don't render anything
      }

      // Option 2: Use custom unknown component renderer
      if (this.config?.renderUnknownComponent) {
        debug.log(
          `GridItemWrapper: Rendering custom unknown component for type "${this.item.type}"`,
        );
        const customRenderer = this.config.renderUnknownComponent({
          type: this.item.type,
          itemId: this.item.id,
        });

        // Handle both HTMLElement and JSX returns
        if (customRenderer instanceof HTMLElement) {
          return (
            <div
              ref={(el) =>
                el && !el.hasChildNodes() && el.appendChild(customRenderer)
              }
            />
          );
        }
        return customRenderer;
      }

      // Option 3: Default error display
      console.error(
        `GridItemWrapper: Unknown component type "${this.item.type}" for item ${this.item.id}`,
      );
      return (
        <div class="component-error">
          Unknown component type: {this.item.type}
        </div>
      );
    }

    // Call component definition's render function
    // Pass itemId and config so component can look up state and use config
    const rendered = definition.render({
      itemId: this.item.id,
      config: this.item.config,
    });

    // If render returns a DOM element (HTMLElement), wrap it in a div for Stencil
    // This handles cases where consumer uses document.createElement()
    if (rendered instanceof HTMLElement) {
      return (
        <div
          class="component-wrapper"
          ref={(el) => el && !el.hasChildNodes() && el.appendChild(rendered)}
        />
      );
    }

    // Otherwise return the vNode directly (JSX)
    return rendered;
  }

  /**
   * Render component template
   *
   * **Layout selection and auto-layout**:
   * - Desktop: Use desktop layout
   * - Mobile (not customized): Auto-stack full-width
   * - Mobile (customized): Use custom mobile layout
   *
   * **Grid to pixel conversion**:
   * - Horizontal: gridToPixelsX(units, canvasId, config)
   * - Vertical: gridToPixelsY(units)
   * - Responsive width, fixed height
   *
   * **Transform-based positioning**:
   * - GPU-accelerated translate()
   * - Better performance than top/left
   * - Sub-pixel accuracy
   *
   * **Dynamic component rendering**:
   * - Look up definition from registry
   * - Use definition.icon and definition.name for header
   * - Call definition.render() for content
   *
   * **Accessibility (ARIA-describedby)**:
   * - Provides contextual hints for screen reader users
   * - Describes available keyboard interactions
   * - Hidden visually with .sr-only class
   * - Only rendered in builder mode (not viewer mode)
   *
   * **Hidden component handling**:
   * - If renderComponent() returns null (hideUnknownComponents mode), don't render wrapper
   * - This makes hidden components completely invisible and non-interactive
   */
  render() {
    // Step 1: Check if component content should render (early exit for hidden components)
    const componentContent = this.renderComponent();
    if (componentContent === null) {
      return null;
    }

    // Step 2: Capture item/canvas IDs for delete handler (prevents stale closure issues)
    const itemIdForDelete = this.item.id;
    const canvasIdForDelete = this.item.canvasId;

    // Step 3: Get viewport and breakpoints configuration
    const { currentViewport, breakpoints } = this.getViewportAndBreakpoints();

    // Step 4: Calculate effective layout with auto-stacking
    const actualLayout = this.calculateEffectiveLayoutWithStacking(
      currentViewport,
      breakpoints,
    );

    // Step 5: Compute selection state
    const selectedItemId = this.stateInstance.selectedItemId;
    const isSelected = !this.viewerMode && selectedItemId === this.item.id;

    // Step 6: Build item CSS classes
    const itemClasses = {
      "grid-item": true,
      selected: isSelected,
      "with-animations": this.config?.enableAnimations ?? true,
    };

    // Step 7: Get component display information (icon, name, colors)
    const { definition, icon, displayName, selectionColor, backgroundColor } =
      this.getComponentDisplayInfo();

    // Step 8: Build item style object (transform, dimensions, colors)
    const itemStyle = this.buildItemStyle(
      actualLayout,
      selectionColor,
      backgroundColor,
    );

    // Step 9: Generate unique IDs for ARIA and content slot
    const contentSlotId = `${this.item.id}-content`;
    const descriptionId = `${this.item.id}-description`;

    // Step 10: Generate ARIA description text (only in builder mode)
    const ariaDescription = !this.viewerMode
      ? "Use arrow keys to nudge position, drag header to move, resize handles to change size, Delete to remove. Drag components from palette to add new items."
      : null;

    // Step 11: Render custom wrapper if provided, otherwise default wrapper
    if (definition?.renderItemWrapper) {
      return this.renderCustomWrapper(
        definition,
        itemClasses,
        itemStyle,
        isSelected,
        displayName,
        icon,
        contentSlotId,
        descriptionId,
        ariaDescription,
      );
    }

    // Step 12: Render default wrapper
    return this.renderDefaultWrapper(
      componentContent,
      itemClasses,
      itemStyle,
      isSelected,
      displayName,
      icon,
      contentSlotId,
      descriptionId,
      ariaDescription,
      itemIdForDelete,
      canvasIdForDelete,
    );
  }

  /**
   * Capture item snapshot for undo/redo
   */
  private captureItemSnapshot = () => {
    this.itemSnapshot = deepClone(this.item);
  };

  /**
   * handleItemUpdate Helper Methods
   * ================================
   *
   * These methods were extracted from handleItemUpdate() to reduce cyclomatic complexity
   * and improve testability. Each method has a single responsibility and is documented
   * with numbered steps.
   */

  /**
   * Detect operation type (drag, resize, or both)
   *
   * **Purpose**: Compare snapshot with updated item to determine operation type
   *
   * **Implementation Steps**:
   * 1. Get layouts from snapshot and updated item for current viewport
   * 2. Check if position changed (drag)
   * 3. Check if size changed (resize)
   * 4. Check if canvas changed (cross-canvas drag)
   * 5. Determine isDrag (position or canvas changed)
   * 6. Determine isResize (size changed)
   * 7. Return operation type flags
   *
   * **Why this is needed**:
   * - Consolidates change detection logic
   * - Supports undo/redo command creation
   * - Enables conditional event emission
   * @param snapshot - Item snapshot from drag/resize start
   * @param updatedItem - Updated item from drag/resize end
   * @param currentViewport - Current viewport name
   * @returns Operation type flags: { isDrag, isResize }
   */
  private detectOperationType(
    snapshot: GridItem,
    updatedItem: GridItem,
    currentViewport: string,
  ): { isDrag: boolean; isResize: boolean } {
    // Step 1: Get layouts for comparison
    const snapshotLayout = snapshot.layouts[currentViewport];
    const updatedLayout = updatedItem.layouts[currentViewport];

    // Step 2: Check if position changed (drag)
    const positionOnlyChanged =
      (snapshotLayout.x !== updatedLayout.x ||
        snapshotLayout.y !== updatedLayout.y) &&
      snapshotLayout.width === updatedLayout.width &&
      snapshotLayout.height === updatedLayout.height;

    // Step 3: Check if size changed (resize)
    const sizeChanged =
      snapshotLayout.width !== updatedLayout.width ||
      snapshotLayout.height !== updatedLayout.height;

    // Step 4: Check if canvas changed (cross-canvas drag)
    const canvasChanged = snapshot.canvasId !== updatedItem.canvasId;

    // Step 5-6: Determine operation type
    const isDrag = positionOnlyChanged || canvasChanged;
    const isResize = sizeChanged;

    // Step 7: Return operation type flags
    return { isDrag, isResize };
  }

  /**
   * Handle cross-canvas z-index assignment
   *
   * **Purpose**: Assign appropriate z-index when item moves to different canvas
   *
   * **Implementation Steps**:
   * 1. Get source canvas from state
   * 2. Find item index in source canvas
   * 3. Get source z-index from snapshot
   * 4. Check if canvas changed
   * 5. If changed, assign new z-index from target canvas counter
   * 6. Update item's z-index
   * 7. Return z-index values
   *
   * **Why this is needed**:
   * - Each canvas has its own z-index counter
   * - Cross-canvas moves need new z-index assignment
   * - Prevents z-index conflicts between canvases
   * @param snapshot - Item snapshot from drag/resize start
   * @param updatedItem - Updated item from drag/resize end
   * @returns Z-index values: { sourceIndex, sourceZIndex, targetZIndex }
   */
  private handleCrossCanvasZIndex(
    snapshot: GridItem,
    updatedItem: GridItem,
  ): { sourceIndex: number; sourceZIndex: number; targetZIndex: number } {
    // Step 1-2: Find source canvas and item index
    const canvases = this.stateInstance.canvases;
    const sourceCanvas = canvases[snapshot.canvasId];
    const sourceIndex =
      sourceCanvas?.items.findIndex((i: any) => i.id === this.item.id) || 0;

    // Step 3: Get source z-index from snapshot
    const sourceZIndex = snapshot.zIndex;
    let targetZIndex = sourceZIndex; // Step 4: Default to same z-index

    // Step 4-6: If moving to different canvas, assign new z-index
    if (snapshot.canvasId !== updatedItem.canvasId) {
      const targetCanvas = canvases[updatedItem.canvasId];
      if (targetCanvas) {
        targetZIndex = targetCanvas.zIndexCounter++;
        updatedItem.zIndex = targetZIndex;
      }
    }

    // Step 7: Return z-index values
    return { sourceIndex, sourceZIndex, targetZIndex };
  }

  /**
   * Push undo/redo command for drag/resize operation
   *
   * **Purpose**: Create and push MoveItemCommand with all required parameters
   *
   * **Implementation Steps**:
   * 1. Get current viewport from state
   * 2. Get layouts from snapshot and updated item
   * 3. Create MoveItemCommand with all parameters
   * 4. Include size tracking for resize operations
   * 5. Include customized flags for both layouts
   * 6. Push command to undo/redo manager
   *
   * **Why this is needed**:
   * - Consolidates complex command creation logic
   * - Supports both drag and resize operations
   * - Enables viewport-specific undo/redo
   * @param snapshot - Item snapshot from drag/resize start
   * @param updatedItem - Updated item from drag/resize end
   * @param sourceIndex - Item index in source canvas
   * @param sourceZIndex - Z-index in source canvas
   * @param targetZIndex - Z-index in target canvas
   * @param isResize - Whether operation includes resize
   */
  private pushUndoRedoCommand(
    snapshot: GridItem,
    updatedItem: GridItem,
    sourceIndex: number,
    sourceZIndex: number,
    targetZIndex: number,
    isResize: boolean,
  ): void {
    if (!this.undoRedoManagerInstance) {
      return;
    }

    // Step 1: Get current viewport
    const currentViewport = this.stateInstance.currentViewport;

    // Step 2: Get layouts from snapshot and updated item
    const currentLayout = snapshot.layouts[currentViewport];
    const updatedLayout = updatedItem.layouts[currentViewport];

    // Step 3-6: Create and push MoveItemCommand
    this.undoRedoManagerInstance.push(
      new MoveItemCommand(
        updatedItem.id,
        snapshot.canvasId,
        updatedItem.canvasId,
        {
          x: currentLayout.x,
          y: currentLayout.y,
        },
        {
          x: updatedLayout.x,
          y: updatedLayout.y,
        },
        sourceIndex,
        sourceZIndex,
        targetZIndex,
        // Include size for resize tracking
        isResize
          ? {
              width: currentLayout.width,
              height: currentLayout.height,
            }
          : undefined,
        isResize
          ? {
              width: updatedLayout.width,
              height: updatedLayout.height,
            }
          : undefined,
        currentLayout.customized ?? false,
        updatedLayout.customized ?? false,
        this.stateInstance,
        currentViewport,
      ),
    );
  }

  /**
   * Update item in state (immutable update)
   *
   * **Purpose**: Update item in state array without mutating existing state
   *
   * **Implementation Steps**:
   * 1. Get canvases from state
   * 2. Find item index in current canvas
   * 3. Create new items array (map with replacement)
   * 4. Create new canvas object with new items
   * 5. Create new canvases object with new canvas
   * 6. Update state with new canvases
   *
   * **Why this is needed**:
   * - Maintains immutability for reactive state
   * - Triggers re-render with new state
   * - Prevents stale state issues
   * @param updatedItem - Updated item from drag/resize end
   */
  private updateItemInState(updatedItem: GridItem): void {
    // Step 1: Get canvases from state
    const canvases = this.stateInstance.canvases;
    const canvas = canvases[this.item.canvasId];

    // Step 2: Find item index in current canvas
    const itemIndex = canvas.items.findIndex((i: any) => i.id === this.item.id);

    if (itemIndex !== -1) {
      // Step 3: Create new items array (immutable update)
      const newItems = canvas.items.map((item: any, i: any) =>
        i === itemIndex ? updatedItem : item,
      );

      // Step 4: Create new canvas with new items array
      const newCanvas = { ...canvas, items: newItems };

      // Step 5: Create new canvases object
      const newCanvases = { ...canvases, [this.item.canvasId]: newCanvas };

      // Step 6: Update state
      this.stateInstance.canvases = newCanvases;
    }
  }

  /**
   * Emit change events for plugins
   *
   * **Purpose**: Emit componentDragged or componentResized events based on operation type
   *
   * **Implementation Steps**:
   * 1. Check if event manager exists
   * 2. Get current layout from updated item
   * 3. If drag, emit componentDragged event
   * 4. If resize, emit componentResized event
   *
   * **Why this is needed**:
   * - Notifies plugins about drag/resize operations
   * - Enables external state synchronization
   * - Supports analytics and logging
   * @param updatedItem - Updated item from drag/resize end
   * @param currentViewport - Current viewport name
   * @param isDrag - Whether operation was a drag
   * @param isResize - Whether operation was a resize
   */
  private emitChangeEvents(
    updatedItem: GridItem,
    currentViewport: string,
    isDrag: boolean,
    isResize: boolean,
  ): void {
    // Step 1: Check if event manager exists
    if (!this.eventManagerInstance) {
      return;
    }

    // Step 2: Get current layout for event data
    const currentLayout =
      updatedItem.layouts[currentViewport as "desktop" | "mobile"];

    // Step 3: If drag, emit componentDragged event
    if (isDrag) {
      this.eventManagerInstance.emit("componentDragged", {
        itemId: updatedItem.id,
        canvasId: updatedItem.canvasId,
        position: {
          x: currentLayout.x,
          y: currentLayout.y,
        },
      });
    }

    // Step 4: If resize, emit componentResized event
    if (isResize) {
      this.eventManagerInstance.emit("componentResized", {
        itemId: updatedItem.id,
        canvasId: updatedItem.canvasId,
        size: {
          width: currentLayout.width,
          height: currentLayout.height,
        },
      });
    }
  }

  /**
   * Handle item update (called by drag/resize handlers)
   *
   * **Purpose**: Coordinate item state updates, undo/redo tracking, and event emission
   *
   * **Implementation Steps**:
   * 1. Get current viewport for operation tracking
   * 2. Initialize operation type flags
   * 3. If snapshot exists, detect operation type
   * 4. If operation detected, handle z-index and push undo command
   * 5. Update item in state (triggers re-render)
   * 6. Emit events for plugins
   *
   * **Why this is needed**:
   * - Centralizes all post-drag/resize state updates
   * - Ensures undo/redo tracking captures correct snapshots
   * - Maintains immutable state updates
   * - Notifies plugins about changes
   * @param updatedItem - Updated item from drag/resize handler
   */
  private handleItemUpdate = (updatedItem: GridItem) => {
    // Step 1: Get current viewport for operation tracking
    const currentViewport = this.stateInstance.currentViewport || "desktop";

    // Step 2: Initialize operation type flags
    let isDrag = false;
    let isResize = false;

    // Step 3: If snapshot exists, detect operation type
    if (this.itemSnapshot) {
      const snapshot = this.itemSnapshot;

      // Step 3a: Determine if this was a drag or resize operation
      ({ isDrag, isResize } = this.detectOperationType(
        snapshot,
        updatedItem,
        currentViewport,
      ));

      // Step 4: If operation detected, handle z-index and push undo command
      if (isDrag || isResize) {
        // Step 4a: Handle cross-canvas z-index assignment
        const { sourceIndex, sourceZIndex, targetZIndex } =
          this.handleCrossCanvasZIndex(snapshot, updatedItem);

        // Step 4b: Push undo/redo command
        this.pushUndoRedoCommand(
          snapshot,
          updatedItem,
          sourceIndex,
          sourceZIndex,
          targetZIndex,
          isResize,
        );
      }
    }

    // Step 5: Update item in state (triggers re-render)
    this.updateItemInState(updatedItem);

    // Step 6: Emit events for plugins
    this.emitChangeEvents(updatedItem, currentViewport, isDrag, isResize);
  };

  /**
   * Handle click event (selection and config panel)
   */
  private handleClick = (e: MouseEvent) => {
    // Skip click handling in viewer mode
    if (this.viewerMode) {
      debug.log("  ⏭️ Skipping - viewer mode");
      return;
    }

    // Don't open config panel if item was just dragged
    if (this.wasDragged) {
      debug.log("  ⏭️ Skipping - was dragged");
      // Reset flag after a small delay to allow this click event to finish
      setTimeout(() => {
        this.wasDragged = false;
      }, 10);
      return;
    }

    // Don't open config panel if clicking on drag handle, resize handle, or control buttons
    const target = e.target as HTMLElement;
    if (
      target.classList.contains("drag-handle") ||
      target.closest(".drag-handle") ||
      target.classList.contains("resize-handle") ||
      target.closest(".resize-handle") ||
      target.classList.contains("grid-item-delete") ||
      target.classList.contains("grid-item-control-btn")
    ) {
      debug.log("  ⏭️ Skipping - clicked on control element");
      return;
    }

    debug.log("  ✅ Proceeding with click handling");

    // Set selection state immediately
    this.stateInstance.selectedItemId = this.item.id;
    this.stateInstance.selectedCanvasId = this.item.canvasId;

    // Set this canvas as active
    this.stateInstance.activeCanvasId = this.item.canvasId;

    // Emit canvas activation event
    this.eventManagerInstance.emit("canvasActivated", {
      canvasId: this.item.canvasId,
    });

    // Emit selection event for plugins
    this.eventManagerInstance.emit("componentSelected", {
      itemId: this.item.id,
      canvasId: this.item.canvasId,
    });

    // Dispatch event to open config panel
    debug.log("  📤 Dispatching item-click event", {
      itemId: this.item.id,
      canvasId: this.item.canvasId,
      hasItemRef: !!this.itemRef,
    });
    const event = new CustomEvent("item-click", {
      detail: { itemId: this.item.id, canvasId: this.item.canvasId },
      bubbles: true,
      composed: true,
    });
    this.itemRef.dispatchEvent(event);
    debug.log("  ✅ item-click event dispatched");
  };

  /**
   * Handle delete from default wrapper button
   * Calls deletion hook if provided, then dispatches delete event if approved
   * @param itemId - Item ID captured at render time
   * @param canvasId - Canvas ID captured at render time
   */
  private handleDelete = async (itemId: string, canvasId: string) => {
    debug.log("🗑️ handleDelete (default wrapper button)", {
      itemId,
      canvasId,
    });

    // Dispatch deletion event directly
    // The deletion hook (beforeDeleteHook) is called by grid-builder's API deleteComponent method,
    // not here - this prevents double-modal issue where user sees two confirmation dialogs
    const event = new CustomEvent("grid-item:delete", {
      detail: { itemId, canvasId },
      bubbles: true,
      composed: true,
    });
    debug.log("  📤 Dispatching grid-item:delete (internal event)");
    this.itemRef.dispatchEvent(event);
  };

  /**
   * Render Method Helper Methods
   * ============================
   *
   * These methods were extracted from render() to reduce cyclomatic complexity
   * and improve testability. Each method has a single responsibility and is documented
   * with numbered steps.
   */

  /**
   * Get viewport and breakpoints configuration
   *
   * **Purpose**: Determine current viewport and breakpoints based on viewer/builder mode
   *
   * **Implementation Steps**:
   * 1. Check if in viewer mode
   * 2. Get currentViewport from appropriate source (prop or state)
   * 3. Get breakpoints from appropriate source (prop or state)
   * 4. Return viewport and breakpoints
   *
   * **Why this is needed**:
   * - Viewer mode uses props (currentViewport, breakpoints)
   * - Builder mode uses state (stateInstance.currentViewport, stateInstance.breakpoints)
   * - Consolidates ternary logic into single method
   * @returns Viewport and breakpoints configuration
   */
  private getViewportAndBreakpoints(): {
    currentViewport: string;
    breakpoints: any;
  } {
    // Step 1: Check if in viewer mode
    // Step 2: Get currentViewport from appropriate source
    const currentViewport = this.viewerMode
      ? this.currentViewport || "desktop"
      : this.stateInstance.currentViewport || "desktop";

    // Step 3: Get breakpoints from appropriate source
    const breakpoints = this.viewerMode
      ? this.breakpoints || DEFAULT_BREAKPOINTS
      : this.stateInstance.breakpoints || DEFAULT_BREAKPOINTS;

    // Step 4: Return viewport and breakpoints
    return { currentViewport, breakpoints };
  }

  /**
   * Calculate effective layout with auto-stacking
   *
   * **Purpose**: Get layout for current viewport with auto-stacking applied if needed
   *
   * **Implementation Steps**:
   * 1. Get effective layout (with inheritance/fallback)
   * 2. Check if auto-stacking should be applied
   * 3. If yes, get canvas items from appropriate source
   * 4. Calculate stacked layout
   * 5. Return actual layout
   *
   * **Why this is needed**:
   * - Mobile viewport may use auto-stacking if not customized
   * - Desktop viewport uses manual positioning
   * - Viewer and builder modes have different data sources
   * @param currentViewport - Current viewport name
   * @param breakpoints - Breakpoints configuration
   * @returns Layout object with x, y, width, height
   */
  private calculateEffectiveLayoutWithStacking(
    currentViewport: string,
    breakpoints: any,
  ): any {
    // Step 1: Get effective layout (with inheritance/fallback)
    const { layout, sourceBreakpoint } = getEffectiveLayout(
      this.item,
      currentViewport,
      breakpoints,
    );

    // Step 2: Check if auto-stacking should be applied
    let actualLayout = layout;
    if (shouldAutoStack(currentViewport, breakpoints) && !layout.customized) {
      // Step 3: Get canvas items from appropriate source
      const canvasItems = this.viewerMode
        ? this.canvasItems || []
        : this.stateInstance.canvases[this.item.canvasId]?.items || [];

      // Step 4: Calculate stacked layout
      actualLayout = calculateAutoStackLayout(
        this.item,
        canvasItems,
        sourceBreakpoint,
      );
    }

    // Step 5: Return actual layout
    return actualLayout;
  }

  /**
   * Get component display information
   *
   * **Purpose**: Extract icon, name, selection color, and background color from component definition
   *
   * **Implementation Steps**:
   * 1. Get component definition from registry
   * 2. Extract icon (fallback to "?")
   * 3. Extract display name (item.name → definition.name → item.type)
   * 4. Calculate selection color (definition → theme → hardcoded fallback)
   * 5. Extract backgroundColor from config or schema default
   * 6. Return display info object
   *
   * **Why this is needed**:
   * - Consolidates all definition-based lookups
   * - Implements fallback chain for missing values
   * - Reduces render() complexity
   * @returns Display information object
   */
  private getComponentDisplayInfo(): {
    definition: any;
    icon: string;
    displayName: string;
    selectionColor: string;
    backgroundColor: string;
  } {
    // Step 1: Get component definition from registry
    const definition = this.componentRegistry?.get(this.item.type);

    // Step 2: Extract icon (fallback to "?")
    const icon = definition?.icon || "?";

    // Step 3: Extract display name (fallback chain)
    const displayName = this.item.name || definition?.name || this.item.type;

    // Step 4: Calculate selection color (fallback chain)
    // 1. Component-specific override (ComponentDefinition.selectionColor)
    // 2. Theme default (theme.selectionColor)
    // 3. Hardcoded fallback (amber/gold)
    const selectionColor =
      definition?.selectionColor || this.theme?.selectionColor || "#f59e0b";

    // Step 5: Extract backgroundColor from config or schema default
    const backgroundColorField = definition?.configSchema?.find(
      (f) => f.name === "backgroundColor",
    );
    const backgroundColor =
      this.item.config?.backgroundColor ||
      backgroundColorField?.defaultValue ||
      "transparent";

    // Step 6: Return display info object
    return {
      definition,
      icon,
      displayName,
      selectionColor,
      backgroundColor,
    };
  }

  /**
   * Build item style object
   *
   * **Purpose**: Convert layout to pixel values and build CSS style object
   *
   * **Implementation Steps**:
   * 1. Convert grid units to pixels (x, y, width, height)
   * 2. Build style object with transform, dimensions, z-index
   * 3. Add CSS custom properties (selection color, animation duration)
   * 4. Add background color
   * 5. Return style object
   *
   * **Why this is needed**:
   * - Consolidates pixel conversion logic
   * - Builds complete style object in one place
   * - Reduces render() complexity
   * @param layout - Layout object with grid units
   * @param selectionColor - Selection color for CSS variable
   * @param backgroundColor - Background color for item
   * @returns CSS style object
   */
  private buildItemStyle(
    layout: any,
    selectionColor: string,
    backgroundColor: string,
  ): any {
    // Step 1: Convert grid units to pixels (with GridConfig support)
    const xPixels = gridToPixelsX(layout.x, this.item.canvasId, this.config);
    const yPixels = gridToPixelsY(layout.y, this.config);
    const widthPixels = gridToPixelsX(
      layout.width,
      this.item.canvasId,
      this.config,
    );
    const heightPixels = gridToPixelsY(layout.height, this.config);

    // Step 2-4: Build style object
    return {
      transform: `translate(${xPixels}px, ${yPixels}px)`,
      width: `${widthPixels}px`,
      height: `${heightPixels}px`,
      zIndex: this.item.zIndex.toString(),
      "--selection-color": selectionColor,
      "--animation-duration": `${this.config?.animationDuration ?? 100}ms`,
      // Apply backgroundColor from config to .grid-item so it fills to edges
      background: backgroundColor,
    };
  }

  /**
   * Render custom wrapper path
   *
   * **Purpose**: Render JSX for custom wrapper case
   *
   * **Implementation Steps**:
   * 1. Call definition.renderItemWrapper() with context
   * 2. Build wrapper div with classes and attributes
   * 3. Add ARIA description if not in viewer mode
   * 4. Wrap custom JSX in error boundary (if available)
   * 5. Add resize handles
   * 6. Return complete wrapper JSX
   *
   * **Why this is needed**:
   * - Separates custom wrapper logic from render()
   * - Reduces cyclomatic complexity
   * - Easier to test and maintain
   * @param definition - Component definition
   * @param itemClasses - CSS classes for item
   * @param itemStyle - CSS style object
   * @param isSelected - Selection state
   * @param displayName - Display name for component
   * @param icon - Icon for component
   * @param contentSlotId - ID for content slot
   * @param descriptionId - ID for ARIA description
   * @param ariaDescription - ARIA description text
   * @returns JSX for custom wrapper
   */
  private renderCustomWrapper(
    definition: any,
    itemClasses: any,
    itemStyle: any,
    isSelected: boolean,
    displayName: string,
    icon: string,
    contentSlotId: string,
    descriptionId: string,
    ariaDescription: string | null,
  ): any {
    // Step 1: Call definition.renderItemWrapper() with context
    const customWrapper = definition.renderItemWrapper({
      itemId: this.item.id,
      componentType: this.item.type,
      name: displayName,
      icon,
      isSelected,
      contentSlotId,
    });

    // Step 2-6: Build and return complete wrapper JSX
    return (
      <div
        class={itemClasses}
        id={this.item.id}
        tabindex={this.viewerMode ? undefined : 0}
        aria-selected={isSelected ? "true" : "false"}
        aria-describedby={ariaDescription ? descriptionId : undefined}
        data-canvas-id={this.item.canvasId}
        data-component-name={displayName}
        data-viewer-mode={this.viewerMode ? "true" : "false"}
        style={itemStyle}
        onClick={(e) => this.handleClick(e)}
        ref={(el) => (this.itemRef = el)}
      >
        {/* Step 3: ARIA description (hidden, only for screen readers) */}
        {ariaDescription && (
          <div id={descriptionId} class="sr-only">
            {ariaDescription}
          </div>
        )}

        {/* Step 4: Error boundary wraps custom wrapper for item-level error isolation */}
        {this.errorAdapterInstance ? (
          <error-boundary
            {...this.errorAdapterInstance.createErrorBoundaryConfig(
              "grid-item-wrapper",
              {
                itemId: this.item.id,
                canvasId: this.item.canvasId,
                componentType: this.item.type,
              },
            )}
          >
            {/* Custom wrapper JSX - renders securely */}
            {customWrapper}
          </error-boundary>
        ) : (
          /* Custom wrapper JSX - renders securely */
          customWrapper
        )}

        {/* Step 5: Resize Handles (8 points) */}
        <div class="resize-handle nw" />
        <div class="resize-handle ne" />
        <div class="resize-handle sw" />
        <div class="resize-handle se" />
        <div class="resize-handle n" />
        <div class="resize-handle s" />
        <div class="resize-handle e" />
        <div class="resize-handle w" />
      </div>
    );
  }

  /**
   * Render default wrapper path
   *
   * **Purpose**: Render JSX for default wrapper case
   *
   * **Implementation Steps**:
   * 1. Build wrapper div with classes and attributes
   * 2. Add ARIA description if not in viewer mode
   * 3. Add editing UI (drag handle, header, controls) if not in viewer mode
   * 4. Wrap component content in error boundary (if available)
   * 5. Add resize handles if not in viewer mode
   * 6. Return complete wrapper JSX
   *
   * **Why this is needed**:
   * - Separates default wrapper logic from render()
   * - Reduces cyclomatic complexity
   * - Easier to test and maintain
   * @param componentContent - Rendered component content
   * @param itemClasses - CSS classes for item
   * @param itemStyle - CSS style object
   * @param isSelected - Selection state
   * @param displayName - Display name for component
   * @param icon - Icon for component
   * @param contentSlotId - ID for content slot
   * @param descriptionId - ID for ARIA description
   * @param ariaDescription - ARIA description text
   * @param itemIdForDelete - Item ID for delete handler
   * @param canvasIdForDelete - Canvas ID for delete handler
   * @returns JSX for default wrapper
   */
  private renderDefaultWrapper(
    componentContent: any,
    itemClasses: any,
    itemStyle: any,
    isSelected: boolean,
    displayName: string,
    icon: string,
    contentSlotId: string,
    descriptionId: string,
    ariaDescription: string | null,
    itemIdForDelete: string,
    canvasIdForDelete: string,
  ): any {
    // Step 1-6: Build and return complete wrapper JSX
    return (
      <div
        class={itemClasses}
        id={this.item.id}
        role="group"
        aria-label={`${displayName} component`}
        tabindex={this.viewerMode ? undefined : 0}
        aria-selected={isSelected ? "true" : "false"}
        aria-describedby={ariaDescription ? descriptionId : undefined}
        data-canvas-id={this.item.canvasId}
        data-component-name={displayName}
        data-viewer-mode={this.viewerMode ? "true" : "false"}
        style={itemStyle}
        onClick={(e) => this.handleClick(e)}
        ref={(el) => (this.itemRef = el)}
      >
        {/* Step 2: ARIA description (hidden, only for screen readers) */}
        {ariaDescription && (
          <div id={descriptionId} class="sr-only">
            {ariaDescription}
          </div>
        )}

        {/* Step 3: Editing UI (hidden in viewer mode) */}
        {!this.viewerMode && [
          /* Drag Handle */
          <div
            class="drag-handle"
            key="drag-handle"
            aria-label={`Drag ${displayName}`}
            role="button"
            aria-grabbed={false}
          />,

          /* Item Header */
          <div
            class="grid-item-header"
            key="header"
            aria-label={`${displayName} component header`}
          >
            {icon} {displayName}
          </div>,

          /* Item Controls */
          <div class="grid-item-controls" key="controls">
            <button
              class="grid-item-delete"
              aria-label={`Delete ${displayName} component`}
              onClick={() =>
                this.handleDelete(itemIdForDelete, canvasIdForDelete)
              }
            >
              ×
            </button>
          </div>,
        ]}

        {/* Step 4: Item Content (always rendered) */}
        {/* Error boundary wraps component content for item-level error isolation */}
        {this.errorAdapterInstance ? (
          <error-boundary
            {...this.errorAdapterInstance.createErrorBoundaryConfig(
              "grid-item-wrapper",
              {
                itemId: this.item.id,
                canvasId: this.item.canvasId,
                componentType: this.item.type,
              },
            )}
          >
            <div
              class="grid-item-content"
              id={contentSlotId}
              data-component-type={this.item.type}
            >
              {componentContent}
            </div>
          </error-boundary>
        ) : (
          <div
            class="grid-item-content"
            id={contentSlotId}
            data-component-type={this.item.type}
          >
            {componentContent}
          </div>
        )}

        {/* Step 5: Resize Handles (hidden in viewer mode) */}
        {!this.viewerMode && [
          <div
            class="resize-handle nw"
            key="resize-nw"
            role="slider"
            aria-label="Resize top-left corner"
            tabindex={-1}
          />,
          <div
            class="resize-handle ne"
            key="resize-ne"
            role="slider"
            aria-label="Resize top-right corner"
            tabindex={-1}
          />,
          <div
            class="resize-handle sw"
            key="resize-sw"
            role="slider"
            aria-label="Resize bottom-left corner"
            tabindex={-1}
          />,
          <div
            class="resize-handle se"
            key="resize-se"
            role="slider"
            aria-label="Resize bottom-right corner"
            tabindex={-1}
          />,
          <div
            class="resize-handle n"
            key="resize-n"
            role="slider"
            aria-label="Resize top edge"
            tabindex={-1}
          />,
          <div
            class="resize-handle s"
            key="resize-s"
            role="slider"
            aria-label="Resize bottom edge"
            tabindex={-1}
          />,
          <div
            class="resize-handle e"
            key="resize-e"
            role="slider"
            aria-label="Resize right edge"
            tabindex={-1}
          />,
          <div
            class="resize-handle w"
            key="resize-w"
            role="slider"
            aria-label="Resize left edge"
            tabindex={-1}
          />,
        ]}
      </div>
    );
  }
}
