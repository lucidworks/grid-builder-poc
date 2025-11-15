import { Component, h, Prop, State } from '@stencil/core';
import { componentTemplates } from '../../data/component-templates';
import { GridItem, gridState } from '../../services/state-manager';
import { pushCommand } from '../../services/undo-redo';
import { MoveItemCommand } from '../../services/undo-redo-commands';
import { DragHandler } from '../../utils/drag-handler';
import { gridToPixelsX, gridToPixelsY } from '../../utils/grid-calculations';
import { ResizeHandler } from '../../utils/resize-handler';

@Component({
  tag: 'grid-item-wrapper',
  styleUrl: 'grid-item-wrapper.css',
  shadow: false, // Use light DOM for compatibility with interact.js
})
export class GridItemWrapper {
  @Prop() item!: GridItem;

  @State() isSelected: boolean = false;

  private itemRef: HTMLElement;
  private dragHandler: DragHandler;
  private resizeHandler: ResizeHandler;
  private itemSnapshot: GridItem | null = null;

  componentWillLoad() {
    // Initial selection state
    this.isSelected = gridState.selectedItemId === this.item.id;

    // Store snapshot for undo/redo before operations
    this.captureItemSnapshot();
  }

  componentWillUpdate() {
    // Update selection state when state changes
    this.isSelected = gridState.selectedItemId === this.item.id;

    // Capture new snapshot after state update
    this.captureItemSnapshot();
  }

  componentDidLoad() {
    // Initialize drag and resize handlers
    this.dragHandler = new DragHandler(this.itemRef, this.item, this.handleItemUpdate.bind(this));
    this.resizeHandler = new ResizeHandler(this.itemRef, this.item, this.handleItemUpdate.bind(this));

    // If complex component, observe with global VirtualRenderer
    const template = componentTemplates[this.item.type];
    if (template?.complex && (window as any).virtualRenderer) {
      (window as any).virtualRenderer.observe(this.itemRef, this.item.id, this.item.type);
    }
  }

  disconnectedCallback() {
    // Cleanup handlers
    if (this.dragHandler) {
      this.dragHandler.destroy();
    }
    if (this.resizeHandler) {
      this.resizeHandler.destroy();
    }

    // Unobserve from VirtualRenderer
    if ((window as any).virtualRenderer) {
      (window as any).virtualRenderer.unobserve(this.item.id);
    }
  }

  render() {
    const template = componentTemplates[this.item.type];
    const currentViewport = gridState.currentViewport;
    const layout = this.item.layouts[currentViewport];

    // For mobile viewport, use desktop layout if not customized
    const actualLayout =
      currentViewport === 'mobile' && !this.item.layouts.mobile.customized ? this.item.layouts.desktop : layout;

    const itemClasses = {
      'grid-item': true,
      selected: this.isSelected,
    };

    // Convert grid units to pixels
    const xPixels = gridToPixelsX(actualLayout.x, this.item.canvasId);
    const yPixels = gridToPixelsY(actualLayout.y);
    const widthPixels = gridToPixelsX(actualLayout.width, this.item.canvasId);
    const heightPixels = gridToPixelsY(actualLayout.height);

    const itemStyle = {
      transform: `translate(${xPixels}px, ${yPixels}px)`,
      width: `${widthPixels}px`,
      height: `${heightPixels}px`,
      zIndex: this.item.zIndex.toString(),
    };

    return (
      <div
        class={itemClasses}
        id={this.item.id}
        data-canvas-id={this.item.canvasId}
        data-component-name={this.item.name || template.title}
        style={itemStyle}
        onClick={e => this.handleClick(e)}
        ref={el => (this.itemRef = el)}
      >
        {/* Drag Handle */}
        <div class="drag-handle"/>

        {/* Item Header */}
        <div class="grid-item-header">
          {template.icon} {this.item.name || template.title}
        </div>

        {/* Item Content */}
        <div class="grid-item-content" id={`${this.item.id}-content`}>
          {template.complex ? (
            <div class="loading-placeholder">Loading...</div>
          ) : (
            
            <div innerHTML={template.content}/>
          )}
        </div>

        {/* Item Controls */}
        <div class="grid-item-controls">
          <button class="grid-item-control-btn" onClick={() => this.handleBringToFront()} title="Bring to Front">
            ⬆️
          </button>
          <button class="grid-item-control-btn" onClick={() => this.handleSendToBack()} title="Send to Back">
            ⬇️
          </button>
          <button class="grid-item-delete" onClick={() => this.handleDelete()}>
            ×
          </button>
        </div>

        {/* Resize Handles (8 points) */}
        <div class="resize-handle nw"/>
        <div class="resize-handle ne"/>
        <div class="resize-handle sw"/>
        <div class="resize-handle se"/>
        <div class="resize-handle n"/>
        <div class="resize-handle s"/>
        <div class="resize-handle e"/>
        <div class="resize-handle w"/>
      </div>
    );
  }

  private captureItemSnapshot() {
    // Deep clone the item to capture its state before drag/resize
    this.itemSnapshot = JSON.parse(JSON.stringify(this.item));
  }

  private handleItemUpdate(updatedItem: GridItem) {
    // Called by drag/resize handlers at end of operation

    // Check if position or canvas changed (for undo/redo)
    if (this.itemSnapshot) {
      const snapshot = this.itemSnapshot;
      const positionChanged =
        snapshot.layouts.desktop.x !== updatedItem.layouts.desktop.x ||
        snapshot.layouts.desktop.y !== updatedItem.layouts.desktop.y ||
        snapshot.layouts.desktop.width !== updatedItem.layouts.desktop.width ||
        snapshot.layouts.desktop.height !== updatedItem.layouts.desktop.height;
      const canvasChanged = snapshot.canvasId !== updatedItem.canvasId;

      if (positionChanged || canvasChanged) {
        // Find source canvas and index
        const sourceCanvas = gridState.canvases[snapshot.canvasId];
        const sourceIndex = sourceCanvas?.items.findIndex(i => i.id === this.item.id) || 0;

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
    const itemIndex = canvas.items.findIndex(i => i.id === this.item.id);
    if (itemIndex !== -1) {
      canvas.items[itemIndex] = updatedItem;
      gridState.canvases = { ...gridState.canvases }; // Trigger update
    }
  }

  private handleClick(e: MouseEvent) {
    // Don't open config panel if clicking on drag handle, resize handle, or control buttons
    const target = e.target as HTMLElement;
    if (
      target.classList.contains('drag-handle') ||
      target.closest('.drag-handle') ||
      target.classList.contains('resize-handle') ||
      target.classList.contains('grid-item-delete') ||
      target.classList.contains('grid-item-control-btn')
    ) {
      return;
    }

    // Dispatch event to open config panel
    const event = new CustomEvent('item-click', {
      detail: { itemId: this.item.id, canvasId: this.item.canvasId },
      bubbles: true,
      composed: true,
    });
    this.itemRef.dispatchEvent(event);
  }

  private handleBringToFront() {
    const canvas = gridState.canvases[this.item.canvasId];
    const maxZ = Math.max(...canvas.items.map(i => i.zIndex));
    this.item.zIndex = maxZ + 1;
    gridState.canvases = { ...gridState.canvases }; // Trigger update
  }

  private handleSendToBack() {
    const canvas = gridState.canvases[this.item.canvasId];
    const minZ = Math.min(...canvas.items.map(i => i.zIndex));
    this.item.zIndex = minZ - 1;
    gridState.canvases = { ...gridState.canvases }; // Trigger update
  }

  private handleDelete() {
    // Dispatch event to grid-builder-app to handle
    const event = new CustomEvent('item-delete', {
      detail: { itemId: this.item.id, canvasId: this.item.canvasId },
      bubbles: true,
      composed: true,
    });
    this.itemRef.dispatchEvent(event);
  }
}
