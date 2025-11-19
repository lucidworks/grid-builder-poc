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
 *
 * @module grid-item-wrapper
 */

import { Component, h, Listen, Prop, State } from '@stencil/core';

// Internal imports
import { GridItem, gridState, updateItem } from '../../services/state-manager';
import { pushCommand } from '../../services/undo-redo';
import { MoveItemCommand } from '../../services/undo-redo-commands';
import { virtualRenderer } from '../../services/virtual-renderer';
import { eventManager } from '../../services/event-manager';
import { DragHandler } from '../../utils/drag-handler';
import { ResizeHandler } from '../../utils/resize-handler';
import { gridToPixelsX, gridToPixelsY } from '../../utils/grid-calculations';
import { GridConfig } from '../../types/grid-config';
import { ComponentDefinition } from '../../types/component-definition';

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
  tag: 'grid-item-wrapper',
  styleUrl: 'grid-item-wrapper.scss',
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
   * **Structure**: Map<type, ComponentDefinition>
   * **Purpose**: Look up component definitions for dynamic rendering
   *
   * **Note**: This is passed as a workaround since StencilJS doesn't have
   * good support for context/provide-inject patterns. In a production app,
   * consider using a global registry or context provider.
   */
  @Prop() componentRegistry?: Map<string, ComponentDefinition>;

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
   * **Initial value**: false (item not visible)
   * **Becomes true**: When scrolled into viewport
   * **Controls**: Whether component content renders or placeholder shows
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
   * Component will load lifecycle hook
   */
  componentWillLoad() {
    this.updateComponentState();
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
    // Update selection state
    this.isSelected = gridState.selectedItemId === this.item.id;

    // Capture item snapshot for undo/redo
    this.captureItemSnapshot();
  }

  /**
   * Component did load lifecycle hook
   */
  componentDidLoad() {
    // Get component definition for min/max size constraints
    const componentDefinition = this.componentRegistry?.get(this.item.type);

    // Get the header element for drag handler
    const headerElement = this.itemRef.querySelector('.grid-item-header') as HTMLElement;

    // Initialize drag and resize handlers
    // Pass header element for drag (instead of whole item)
    this.dragHandler = new DragHandler(
      this.itemRef,
      this.item,
      this.handleItemUpdate,
      headerElement,
      () => {
        this.wasDragged = true;
      }
    );
    this.resizeHandler = new ResizeHandler(this.itemRef, this.item, this.handleItemUpdate, componentDefinition);

    // Set up virtual rendering observer
    virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
      this.isVisible = isVisible;
    });
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
    if (this.itemRef) {
      virtualRenderer.unobserve(this.itemRef, this.item.id);
    }
  }

  /**
   * Listen for item-delete events from custom wrapper components
   * This is the PUBLIC API for custom wrappers to request item deletion
   * We intercept these and re-dispatch as internal 'grid-item:delete' events
   */
  @Listen('item-delete')
  handleItemDeleteEvent(event: CustomEvent) {
    console.log('🔴 @Listen(item-delete) - from custom wrapper', {
      eventTarget: event.target,
      itemId: this.item.id,
    });

    // Stop the public event from bubbling
    event.stopPropagation();

    // Re-dispatch as internal event that grid-builder listens for
    const deleteEvent = new CustomEvent('grid-item:delete', {
      detail: { itemId: this.item.id, canvasId: this.item.canvasId },
      bubbles: true,
      composed: true,
    });
    console.log('  📤 Re-dispatching as grid-item:delete');
    this.itemRef.dispatchEvent(deleteEvent);
  }

  /**
   * Listen for item-bring-to-front events from custom wrapper components
   */
  @Listen('item-bring-to-front')
  handleItemBringToFrontEvent(event: CustomEvent) {
    event.stopPropagation();
    const canvas = gridState.canvases[this.item.canvasId];
    if (!canvas) return;

    const maxZ = Math.max(...canvas.items.map((i) => i.zIndex));
    updateItem(this.item.canvasId, this.item.id, { zIndex: maxZ + 1 });
  }

  /**
   * Listen for item-send-to-back events from custom wrapper components
   */
  @Listen('item-send-to-back')
  handleItemSendToBackEvent(event: CustomEvent) {
    event.stopPropagation();
    const canvas = gridState.canvases[this.item.canvasId];
    if (!canvas) return;

    const minZ = Math.min(...canvas.items.map((i) => i.zIndex));
    updateItem(this.item.canvasId, this.item.id, { zIndex: minZ - 1 });
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
   * - If type not in registry: "Unknown component type: {type}"
   * - Prevents crashes, helps debugging
   */
  private renderComponent() {
    // Virtual rendering: only render component content when visible
    if (!this.isVisible) {
      return <div class="component-placeholder">Loading...</div>;
    }

    // Check if component registry is available
    if (!this.componentRegistry) {
      console.error(`GridItemWrapper: componentRegistry not provided for item ${this.item.id}`);
      return <div class="component-error">Component registry not available</div>;
    }

    // Look up component definition from registry
    const definition = this.componentRegistry.get(this.item.type);

    if (!definition) {
      console.error(`GridItemWrapper: Unknown component type "${this.item.type}" for item ${this.item.id}`);
      return <div class="component-error">Unknown component type: {this.item.type}</div>;
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
      return <div ref={(el) => el && el.appendChild(rendered)} />;
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
   */
  render() {
    const currentViewport = gridState.currentViewport;
    const layout = this.item.layouts[currentViewport];

    // For mobile viewport, calculate auto-layout if not customized
    let actualLayout = layout;
    if (currentViewport === 'mobile' && !this.item.layouts.mobile.customized) {
      // Auto-layout for mobile: stack components vertically at full width
      const canvas = gridState.canvases[this.item.canvasId];
      const itemIndex = canvas?.items.findIndex((i) => i.id === this.item.id) ?? 0;

      // Calculate Y position by summing heights of all previous items
      let yPosition = 0;
      if (canvas && itemIndex > 0) {
        for (let i = 0; i < itemIndex; i++) {
          const prevItem = canvas.items[i];
          yPosition += prevItem.layouts.desktop.height || 6;
        }
      }

      actualLayout = {
        x: 0, // Full left
        y: yPosition,
        width: 50, // Full width (50 units = 100%)
        height: this.item.layouts.desktop.height || 6,
      };
    }

    // Compute selection directly from gridState
    const isSelected = gridState.selectedItemId === this.item.id;

    const itemClasses = {
      'grid-item': true,
      selected: isSelected,
    };

    // Convert grid units to pixels (with GridConfig support)
    const xPixels = gridToPixelsX(actualLayout.x, this.item.canvasId, this.config);
    const yPixels = gridToPixelsY(actualLayout.y);
    const widthPixels = gridToPixelsX(actualLayout.width, this.item.canvasId, this.config);
    const heightPixels = gridToPixelsY(actualLayout.height);

    const itemStyle = {
      transform: `translate(${xPixels}px, ${yPixels}px)`,
      width: `${widthPixels}px`,
      height: `${heightPixels}px`,
      zIndex: this.item.zIndex.toString(),
    };

    // Get component definition for icon and name
    const definition = this.componentRegistry?.get(this.item.type);
    const icon = definition?.icon || '�';
    const displayName = this.item.name || definition?.name || this.item.type;

    // Generate unique content slot ID for custom wrapper
    const contentSlotId = `${this.item.id}-content`;

    // Check if custom item wrapper is provided
    if (definition?.renderItemWrapper) {
      const customWrapperHTML = definition.renderItemWrapper({
        itemId: this.item.id,
        componentType: this.item.type,
        name: displayName,
        icon: icon,
        isSelected: isSelected,
        contentSlotId: contentSlotId,
      });

      return (
        <div
          class={itemClasses}
          id={this.item.id}
          data-canvas-id={this.item.canvasId}
          data-component-name={displayName}
          style={itemStyle}
          onClick={(e) => this.handleClick(e)}
          ref={(el) => {
            this.itemRef = el;
            if (el && !el.hasAttribute('data-custom-chrome-initialized')) {
              // Set innerHTML after ref is set
              el.innerHTML = customWrapperHTML;
              el.setAttribute('data-custom-chrome-initialized', 'true');

              // Render component content into the content slot
              const contentSlot = el.querySelector(`#${contentSlotId}`);
              if (contentSlot) {
                const componentContent = this.renderComponent();
                if (componentContent instanceof HTMLElement) {
                  contentSlot.appendChild(componentContent);
                } else {
                  // For Stencil vNodes, we need to render them manually
                  // This is a simplified approach - Stencil will handle this in the default case
                  contentSlot.textContent = '';
                }
              }
            }
          }}
        >
          {/* Resize Handles (8 points) */}
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

    // Default item wrapper
    return (
      <div
        class={itemClasses}
        id={this.item.id}
        data-canvas-id={this.item.canvasId}
        data-component-name={displayName}
        style={itemStyle}
        onClick={(e) => this.handleClick(e)}
        ref={(el) => (this.itemRef = el)}
      >
        {/* Drag Handle */}
        <div class="drag-handle" />

        {/* Item Header */}
        <div class="grid-item-header">
          {icon} {displayName}
        </div>

        {/* Item Content */}
        <div class="grid-item-content" id={contentSlotId}>
          {this.renderComponent()}
        </div>

        {/* Item Controls */}
        <div class="grid-item-controls">
          <button class="grid-item-control-btn bring-to-front" onClick={() => this.handleBringToFront()} title="Bring to Front">
            ⬆️
          </button>
          <button class="grid-item-control-btn send-to-back" onClick={() => this.handleSendToBack()} title="Send to Back">
            ⬇️
          </button>
          <button class="grid-item-delete" onClick={() => this.handleDelete()}>
            ×
          </button>
        </div>

        {/* Resize Handles (8 points) */}
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
   * Capture item snapshot for undo/redo
   */
  private captureItemSnapshot = () => {
    this.itemSnapshot = JSON.parse(JSON.stringify(this.item));
  };

  /**
   * Handle item update (called by drag/resize handlers)
   */
  private handleItemUpdate = (updatedItem: GridItem) => {
    // Check if position or canvas changed (for undo/redo)
    let isDrag = false;
    let isResize = false;

    if (this.itemSnapshot) {
      const snapshot = this.itemSnapshot;
      const positionOnlyChanged =
        (snapshot.layouts.desktop.x !== updatedItem.layouts.desktop.x ||
          snapshot.layouts.desktop.y !== updatedItem.layouts.desktop.y) &&
        snapshot.layouts.desktop.width === updatedItem.layouts.desktop.width &&
        snapshot.layouts.desktop.height === updatedItem.layouts.desktop.height;
      const sizeChanged =
        snapshot.layouts.desktop.width !== updatedItem.layouts.desktop.width ||
        snapshot.layouts.desktop.height !== updatedItem.layouts.desktop.height;
      const canvasChanged = snapshot.canvasId !== updatedItem.canvasId;

      isDrag = positionOnlyChanged || canvasChanged;
      isResize = sizeChanged;

      if (isDrag || isResize) {
        // Find source canvas and index
        const sourceCanvas = gridState.canvases[snapshot.canvasId];
        const sourceIndex = sourceCanvas?.items.findIndex((i) => i.id === this.item.id) || 0;

        // Push undo command before updating state
        pushCommand(
          new MoveItemCommand(
            updatedItem.id,
            snapshot.canvasId,
            updatedItem.canvasId,
            {
              x: snapshot.layouts.desktop.x,
              y: snapshot.layouts.desktop.y,
            },
            {
              x: updatedItem.layouts.desktop.x,
              y: updatedItem.layouts.desktop.y,
            },
            sourceIndex
          )
        );
      }
    }

    // Update item in state (triggers re-render)
    const canvas = gridState.canvases[this.item.canvasId];
    const itemIndex = canvas.items.findIndex((i) => i.id === this.item.id);
    if (itemIndex !== -1) {
      canvas.items[itemIndex] = updatedItem;
      gridState.canvases = { ...gridState.canvases };
    }

    // Emit events for plugins
    if (isDrag) {
      eventManager.emit('componentDragged', {
        itemId: updatedItem.id,
        canvasId: updatedItem.canvasId,
        position: {
          x: updatedItem.layouts.desktop.x,
          y: updatedItem.layouts.desktop.y,
        },
      });
    }
    if (isResize) {
      eventManager.emit('componentResized', {
        itemId: updatedItem.id,
        canvasId: updatedItem.canvasId,
        size: {
          width: updatedItem.layouts.desktop.width,
          height: updatedItem.layouts.desktop.height,
        },
      });
    }
  };

  /**
   * Handle click event (selection and config panel)
   */
  private handleClick = (e: MouseEvent) => {
    // Don't open config panel if item was just dragged
    if (this.wasDragged) {
      // Reset flag after a small delay to allow this click event to finish
      setTimeout(() => {
        this.wasDragged = false;
      }, 10);
      return;
    }

    // Don't open config panel if clicking on drag handle, resize handle, or control buttons
    const target = e.target as HTMLElement;
    if (
      target.classList.contains('drag-handle') ||
      target.closest('.drag-handle') ||
      target.classList.contains('resize-handle') ||
      target.closest('.resize-handle') ||
      target.classList.contains('grid-item-delete') ||
      target.classList.contains('grid-item-control-btn')
    ) {
      return;
    }

    // Set selection state immediately
    gridState.selectedItemId = this.item.id;
    gridState.selectedCanvasId = this.item.canvasId;

    // Emit selection event for plugins
    eventManager.emit('componentSelected', {
      itemId: this.item.id,
      canvasId: this.item.canvasId,
    });

    // Dispatch event to open config panel
    const event = new CustomEvent('item-click', {
      detail: { itemId: this.item.id, canvasId: this.item.canvasId },
      bubbles: true,
      composed: true,
    });
    this.itemRef.dispatchEvent(event);
  };

  /**
   * Handle bring to front (increase z-index)
   */
  private handleBringToFront = () => {
    console.log('⬆️ handleBringToFront', { itemId: this.item.id, currentZ: this.item.zIndex });
    const canvas = gridState.canvases[this.item.canvasId];
    if (!canvas) {
      console.log('  ❌ Canvas not found');
      return;
    }

    const maxZ = Math.max(...canvas.items.map((i) => i.zIndex));
    console.log('  📊 Max Z-index:', maxZ, '→ New Z:', maxZ + 1);
    updateItem(this.item.canvasId, this.item.id, { zIndex: maxZ + 1 });
  };

  /**
   * Handle send to back (decrease z-index)
   */
  private handleSendToBack = () => {
    console.log('⬇️ handleSendToBack', { itemId: this.item.id, currentZ: this.item.zIndex });
    const canvas = gridState.canvases[this.item.canvasId];
    if (!canvas) {
      console.log('  ❌ Canvas not found');
      return;
    }

    const minZ = Math.min(...canvas.items.map((i) => i.zIndex));
    console.log('  📊 Min Z-index:', minZ, '→ New Z:', minZ - 1);
    updateItem(this.item.canvasId, this.item.id, { zIndex: minZ - 1 });
  };

  /**
   * Handle delete from default wrapper button
   * Dispatches internal 'grid-item:delete' event directly to grid-builder
   */
  private handleDelete = () => {
    console.log('🗑️ handleDelete (default wrapper button)', {
      itemId: this.item.id,
      canvasId: this.item.canvasId,
    });
    const event = new CustomEvent('grid-item:delete', {
      detail: { itemId: this.item.id, canvasId: this.item.canvasId },
      bubbles: true,
      composed: true,
    });
    console.log('  📤 Dispatching grid-item:delete (internal event)');
    this.itemRef.dispatchEvent(event);
  };
}
