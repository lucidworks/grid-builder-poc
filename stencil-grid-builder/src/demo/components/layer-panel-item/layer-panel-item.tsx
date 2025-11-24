/**
 * Layer Panel Item Component
 * ==========================
 *
 * Individual item in the layer panel representing a grid item.
 * Displays item name, type icon, and provides drag handle for reordering.
 *
 * ## Features
 *
 * - **Visual feedback**: Shows active/selected state
 * - **Drag handle**: Reorder items by z-index
 * - **Click to select**: Activates item in builder
 * - **Type icon**: Visual identifier for component type
 *
 * ## Usage
 *
 * ```typescript
 * <layer-panel-item
 *   itemId="item-123"
 *   canvasId="canvas1"
 *   name="Header Component"
 *   type="header"
 *   zIndex={5}
 *   isActive={false}
 * />
 * ```
 *
 * @module layer-panel-item
 */

import { Component, h, Prop, Event, EventEmitter, Element } from '@stencil/core';

@Component({
  tag: 'layer-panel-item',
  styleUrl: 'layer-panel-item.scss',
  shadow: false,
})
export class LayerPanelItem {
  @Element() hostElement: HTMLElement;

  /**
   * Unique ID of the grid item this represents
   */
  @Prop() itemId!: string;

  /**
   * Canvas ID containing this item
   */
  @Prop() canvasId!: string;

  /**
   * Display name of the item
   */
  @Prop() name!: string;

  /**
   * Component type (for icon display)
   */
  @Prop() type!: string;

  /**
   * Current z-index value
   */
  @Prop() zIndex!: number;

  /**
   * Whether this item is currently active/selected
   */
  @Prop() isActive?: boolean = false;

  /**
   * Emitted when user clicks on this item
   */
  @Event() layerItemSelect: EventEmitter<{ itemId: string; canvasId: string }>;

  /**
   * Emitted when user starts dragging this item for reordering
   */
  @Event() layerItemDragStart: EventEmitter<{
    itemId: string;
    canvasId: string;
    zIndex: number;
  }>;

  /**
   * Emitted when user drops this item at a new position
   */
  @Event() layerItemDrop: EventEmitter<{
    itemId: string;
    canvasId: string;
    oldZIndex: number;
    newZIndex: number;
  }>;

  /**
   * Component did load - initialize drag functionality
   */
  componentDidLoad() {
    this.initializeDrag();
  }

  /**
   * Initialize drag-to-reorder functionality
   *
   * Uses HTML5 drag and drop for list reordering.
   * Emits events for parent layer-panel to handle z-index updates.
   *
   * @private
   */
  private initializeDrag = () => {
    // Make the entire item draggable
    this.hostElement.setAttribute('draggable', 'true');

    // Drag start: store data and add visual feedback
    this.hostElement.addEventListener('dragstart', (e: DragEvent) => {
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
          itemId: this.itemId,
          canvasId: this.canvasId,
          zIndex: this.zIndex,
        }));
      }

      // Add visual feedback
      this.hostElement.classList.add('dragging');

      // Emit drag start event
      this.layerItemDragStart.emit({
        itemId: this.itemId,
        canvasId: this.canvasId,
        zIndex: this.zIndex,
      });
    });

    // Drag end: clean up
    this.hostElement.addEventListener('dragend', () => {
      this.hostElement.classList.remove('dragging', 'drop-above', 'drop-below', 'drop-target');
    });

    // Drag over: show drop indicator
    this.hostElement.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault(); // Allow drop
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }

      // Show drop indicator based on cursor position
      const rect = this.hostElement.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const dropAbove = e.clientY < midpoint;

      this.hostElement.classList.remove('drop-above', 'drop-below');
      this.hostElement.classList.add('drop-target', dropAbove ? 'drop-above' : 'drop-below');
    });

    // Drag leave: remove drop indicator
    this.hostElement.addEventListener('dragleave', () => {
      this.hostElement.classList.remove('drop-target', 'drop-above', 'drop-below');
    });

    // Drop: handle the drop
    this.hostElement.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Calculate drop position (above or below this item)
      const rect = this.hostElement.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const dropAbove = e.clientY < midpoint;

      // Emit drop event with target information
      // The parent layer-panel will handle the actual state update
      const dropEvent = new CustomEvent('layer-item-dropped', {
        detail: {
          targetItemId: this.itemId,
          targetCanvasId: this.canvasId,
          targetZIndex: this.zIndex,
          dropAbove,
        },
        bubbles: true,
        composed: true,
      });
      this.hostElement.dispatchEvent(dropEvent);

      // Clean up visual feedback
      this.hostElement.classList.remove('drop-above', 'drop-below', 'drop-target');
    });
  };

  /**
   * Handle click to select this item
   */
  private handleClick = () => {
    if (!this.isActive) {
      this.layerItemSelect.emit({
        itemId: this.itemId,
        canvasId: this.canvasId,
      });
    }
  };

  /**
   * Cleanup on unmount
   * Note: HTML5 drag and drop event listeners are automatically cleaned up
   */
  disconnectedCallback() {
    // No manual cleanup needed for HTML5 drag and drop
  }

  /**
   * Get icon for component type
   *
   * Maps component types to emoji icons for visual identification.
   * Fallback to generic icon for unknown types.
   *
   * @private
   */
  private getTypeIcon(): string {
    const iconMap: { [key: string]: string } = {
      header: '📄',
      text: '📝',
      image: '🖼️',
      button: '🔘',
      gallery: '🖼️',
      dashboard: '📊',
      livedata: '📈',
      card: '🃏',
      list: '📋',
    };

    return iconMap[this.type] || '📦';
  }

  render() {
    const itemClasses = {
      'layer-item': true,
      'layer-item--active': this.isActive,
    };

    return (
      <div class={itemClasses} onClick={this.handleClick}>
        <div class="layer-item__drag-handle" title="Drag to reorder">
          ⋮⋮
        </div>
        <div class="layer-item__icon">{this.getTypeIcon()}</div>
        <div class="layer-item__info">
          <div class="layer-item__name">{this.name}</div>
          <div class="layer-item__meta">
            {this.type} · z:{this.zIndex}
          </div>
        </div>
      </div>
    );
  }
}
