import { Component, h, Prop, State } from '@stencil/core';
// Use the standard interactjs package import
import interact from 'interactjs';
import { Canvas, GridItem, gridState, onChange } from '../../services/state-manager';
import { gridToPixelsX, gridToPixelsY } from '../../utils/grid-calculations';

@Component({
  tag: 'canvas-section',
  styleUrl: 'canvas-section.css',
  shadow: false, // Use light DOM for compatibility with interact.js
})
export class CanvasSection {
  @Prop() canvasId!: string;
  @Prop() sectionNumber!: number;

  @State() canvas: Canvas;
  @State() renderVersion: number = 0; // Force re-render when this changes

  private gridContainerRef: HTMLElement;
  private dropzoneInitialized: boolean = false;

  componentWillLoad() {
    // Initial load
    this.canvas = gridState.canvases[this.canvasId];

    // Subscribe to state changes
    onChange('canvases', () => {
      // Guard against accessing properties when component is not fully initialized
      try {
        if (this.canvasId && gridState.canvases[this.canvasId]) {
          this.canvas = gridState.canvases[this.canvasId];
          this.renderVersion++; // Force re-render
        }
      } catch (e) {
        // Component may not be fully initialized yet (e.g., during test setup)
      }
    });
  }

  componentWillUpdate() {
    // Update canvas reference when state changes
    this.canvas = gridState.canvases[this.canvasId];
  }

  componentDidLoad() {
    this.initializeDropzone();
  }

  disconnectedCallback() {
    // Cleanup interact.js
    if (this.gridContainerRef && this.dropzoneInitialized) {
      interact(this.gridContainerRef).unset();
    }
  }

  render() {
    const showGrid = gridState.showGrid;
    const backgroundColor = this.canvas?.backgroundColor || '#ffffff';

    return (
      <div class="canvas-item" data-canvas-id={this.canvasId}>
        <div class="canvas-item-header">
          <h3>Section {this.sectionNumber}</h3>
          <div class="canvas-controls">
            <label>
              <input
                type="color"
                class="canvas-bg-color"
                value={backgroundColor}
                onInput={e => this.handleColorChange(e)}
              />
            </label>
            <button class="clear-canvas-btn" onClick={() => this.handleClearCanvas()}>
              Clear
            </button>
            <button class="delete-section-btn" onClick={() => this.handleDeleteSection()} title="Delete Section">
              🗑️
            </button>
          </div>
        </div>
        <div class="grid-builder">
          <div
            class={{
              'grid-container': true,
              'hide-grid': !showGrid,
            }}
            id={this.canvasId}
            data-canvas-id={this.canvasId}
            style={{
              backgroundColor,
            }}
            ref={el => (this.gridContainerRef = el)}
          >
            {/* Grid items will be rendered here by grid-item-wrapper components */}
            {this.canvas?.items.map((item: GridItem) => (
              <grid-item-wrapper key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  private initializeDropzone() {
    if (!this.gridContainerRef || this.dropzoneInitialized) {
      return;
    }

    const interactable = interact(this.gridContainerRef);

    // @ts-ignore - Using modular interact.js types
    const result = interactable.dropzone({
      accept: '.palette-item, .grid-item', // Accept both palette items and grid items
      overlap: 'pointer', // Use pointer position instead of element overlap

      checker: (_dragEvent: any, _event: any, dropped: boolean) => {
        return dropped;
      },

      ondrop: (event: any) => {
        const droppedElement = event.relatedTarget;
        const isPaletteItem = droppedElement.classList.contains('palette-item');
        const isGridItem = droppedElement.classList.contains('grid-item');

        if (isPaletteItem) {
          // Dropping from palette - create new item
          const componentType = droppedElement.getAttribute('data-component-type');

          // Calculate half dimensions for centering (default: 10 units wide, 6 units tall)
          const defaultWidth = 10;
          const defaultHeight = 6;
          const widthPx = gridToPixelsX(defaultWidth, this.canvasId);
          const heightPx = gridToPixelsY(defaultHeight);
          const halfWidth = widthPx / 2;
          const halfHeight = heightPx / 2;

          // Get drop position relative to grid container
          const rect = this.gridContainerRef.getBoundingClientRect();
          const x = event.dragEvent.clientX - rect.left - halfWidth;
          const y = event.dragEvent.clientY - rect.top - halfHeight;

          // Dispatch custom event for grid-builder-app to handle
          const dropEvent = new CustomEvent('canvas-drop', {
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
        } else if (isGridItem) {
          // Moving existing grid item to different canvas
          const itemId = droppedElement.id;
          const sourceCanvasId = droppedElement.getAttribute('data-canvas-id');

          // Only process if moving to a different canvas
          if (sourceCanvasId !== this.canvasId) {
            // For cross-canvas moves, get the element's actual screen position
            // (the drag handler has already positioned it during the drag)
            const droppedRect = droppedElement.getBoundingClientRect();
            const rect = this.gridContainerRef.getBoundingClientRect();

            // Use the element's top-left corner relative to the target canvas
            const x = droppedRect.left - rect.left;
            const y = droppedRect.top - rect.top;

            // Dispatch custom event for moving item between canvases
            const moveEvent = new CustomEvent('canvas-move', {
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
    });

    this.dropzoneInitialized = true;
  }

  private handleColorChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const color = target.value;

    // Update state
    this.canvas.backgroundColor = color;
    gridState.canvases = { ...gridState.canvases }; // Trigger update

    // Also update DOM directly for immediate feedback
    if (this.gridContainerRef) {
      this.gridContainerRef.style.backgroundColor = color;
    }
  }

  private handleClearCanvas() {
    if (confirm(`Are you sure you want to clear all items from this section?`)) {
      // Clear items from state
      this.canvas.items = [];
      gridState.canvases = { ...gridState.canvases }; // Trigger update

      // Clear selection if on this canvas
      if (gridState.selectedCanvasId === this.canvasId) {
        gridState.selectedItemId = null;
        gridState.selectedCanvasId = null;
      }

      // Reset canvas height
      if (this.gridContainerRef) {
        this.gridContainerRef.style.minHeight = '400px';
      }
    }
  }

  private handleDeleteSection() {
    if (this.canvas.items.length > 0) {
      if (!confirm(`This section has ${this.canvas.items.length} items. Are you sure you want to delete it?`)) {
        return;
      }
    }

    // Dispatch custom event for grid-builder-app to handle
    const deleteEvent = new CustomEvent('section-delete', {
      detail: { canvasId: this.canvasId },
      bubbles: true,
      composed: true,
    });
    this.gridContainerRef.dispatchEvent(deleteEvent);
  }
}
