// External libraries (alphabetical)
import { Component, h, Host, Listen, State } from '@stencil/core';
import interact from 'interactjs';

// Internal imports (alphabetical)
import { componentTemplates } from '../../data/component-templates';
import { addItemToCanvas, generateItemId, gridState, removeItemFromCanvas } from '../../services/state-manager';
import { pushCommand, redo, undo } from '../../services/undo-redo';
import { AddItemCommand, DeleteItemCommand, MoveItemCommand } from '../../services/undo-redo-commands';
import { pixelsToGridX, pixelsToGridY } from '../../utils/grid-calculations';
import { VirtualRenderer } from '../../utils/virtual-rendering';

@Component({
  tag: 'grid-builder-app',
  styleUrl: 'grid-builder-app.scss',
  shadow: false, // Use light DOM for compatibility with interact.js
})
export class GridBuilderApp {
  @State() itemCount: number = 0;
  @State() showErrorHeading: boolean = false;
  @State() errorHeadingText: string = '';

  componentWillLoad() {
    // Expose interact to global scope before child components load
    // This ensures drag/resize handlers in grid-item-wrapper can initialize
    (window as any).interact = interact;

    // Initial item count
    this.updateItemCount();
  }

  componentWillUpdate() {
    // Update item count when state changes
    this.updateItemCount();
  }

  componentDidLoad() {
    // Initialize item count
    this.updateItemCount();

    // Initialize performance monitor (from shared library)
    if ((window as any).PerformanceMonitor) {
      (window as any).perfMonitor = new (window as any).PerformanceMonitor('stencil');
    }

    // Initialize global VirtualRenderer for lazy-loading complex components
    (window as any).virtualRenderer = new VirtualRenderer();

    // Add debug helper to inspect all interactables
    (window as any).debugInteractables = () => {
      const interactables = (interact as any).interactables.list;
      console.log('Total interactables:', interactables.length);
      interactables.forEach((interactable: any, index: number) => {
        console.log(`Interactable ${index}:`, {
          target: interactable.target,
          actions: interactable._actions,
          options: interactable.options,
        });
      });
    };

    // Set up keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleKeyboard);
  }

  @Listen('canvas-drop', { target: 'document' })
  handleCanvasDrop(event: CustomEvent) {
    const { canvasId, componentType, x, y } = event.detail;

    try {
      // Get template for the component type
      const template = componentTemplates[componentType];
      if (!template) {
        throw new Error(`Unknown component type: ${componentType}`);
      }

      // Convert pixel coordinates to grid units
      const gridX = pixelsToGridX(x, canvasId);
      const gridY = pixelsToGridY(y);

      // Get canvas to determine next z-index
      const canvas = gridState.canvases[canvasId];
      if (!canvas) {
        throw new Error(`Canvas not found: ${canvasId}`);
      }

      // Create new item
      const newItem = {
        id: generateItemId(),
        canvasId,
        type: componentType,
        name: template.title,
        layouts: {
          desktop: {
            x: gridX,
            y: gridY,
            width: 10, // Default 10 grid units wide
            height: 6, // Default 6 grid units tall
          },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: canvas.zIndexCounter++,
      };

      // Add item to canvas
      addItemToCanvas(canvasId, newItem);

      // Push undo command
      pushCommand(new AddItemCommand(canvasId, newItem));

      // Trigger update
      gridState.canvases = { ...gridState.canvases };
    } catch (e) {
      this.showErrorHeading = true;
      this.errorHeadingText = `Error adding component: ${e.message || e}`;
      setTimeout(() => {
        this.showErrorHeading = false;
      }, 5000); // Auto-dismiss after 5 seconds
    }
  }

  @Listen('item-delete', { target: 'document' })
  handleItemDelete(event: CustomEvent) {
    const { itemId, canvasId } = event.detail;

    // Find the item and its index before deletion
    const canvas = gridState.canvases[canvasId];
    if (!canvas) {
      return;
    }

    const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
    const item = canvas.items[itemIndex];
    if (!item) {
      return;
    }

    // Push undo command before deleting
    pushCommand(new DeleteItemCommand(canvasId, item, itemIndex));

    // Delete the item
    removeItemFromCanvas(canvasId, itemId);
    gridState.canvases = { ...gridState.canvases };
  }

  @Listen('canvas-move', { target: 'document' })
  handleCanvasMove(event: CustomEvent) {
    const { itemId, sourceCanvasId, targetCanvasId, x, y } = event.detail;

    // Find the item in the source canvas
    const sourceCanvas = gridState.canvases[sourceCanvasId];
    const sourceIndex = sourceCanvas.items.findIndex((i) => i.id === itemId);
    const item = sourceCanvas.items[sourceIndex];

    if (!item) {
      return;
    }

    // Capture source position
    const sourcePosition = {
      x: item.layouts.desktop.x,
      y: item.layouts.desktop.y,
    };

    // Convert pixel position to grid units
    const gridX = pixelsToGridX(x, targetCanvasId);
    const gridY = pixelsToGridY(y);

    // Capture target position
    const targetPosition = {
      x: gridX,
      y: gridY,
    };

    // Push undo command before moving
    pushCommand(
      new MoveItemCommand(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, sourceIndex)
    );

    // Update item's canvas ID and position
    item.canvasId = targetCanvasId;
    item.layouts.desktop.x = gridX;
    item.layouts.desktop.y = gridY;

    // Remove from source canvas
    sourceCanvas.items = sourceCanvas.items.filter((i) => i.id !== itemId);

    // Add to target canvas
    const targetCanvas = gridState.canvases[targetCanvasId];
    targetCanvas.items.push(item);

    // Trigger update
    gridState.canvases = { ...gridState.canvases };
  }

  render() {
    const canvasIds = Object.keys(gridState.canvases);

    return (
      <Host>
        {/* Error Notification */}
        {this.showErrorHeading && (
          <div class="error-notification">
            <span class="error-icon">⚠️</span>
            <span class="error-text">{this.errorHeadingText}</span>
            <button class="error-dismiss" onClick={() => (this.showErrorHeading = false)}>
              ×
            </button>
          </div>
        )}

        <div class="app">
          {/* Component Palette */}
          <component-palette />

          {/* Main Canvas */}
          <div class="canvas">
            <div class="canvas-header">
              <h1>Grid Builder POC - StencilJS Variant</h1>
              <p>
                Drag components from the palette into the page sections below. Build your page layout section by
                section.
              </p>

              <div class="controls">
                {/* Viewport Toggle */}
                <div class="viewport-toggle">
                  <button
                    class={{
                      'viewport-btn': true,
                      active: gridState.currentViewport === 'desktop',
                    }}
                    onClick={() => this.handleViewportChange('desktop')}
                  >
                    🖥️ Desktop
                  </button>
                  <button
                    class={{
                      'viewport-btn': true,
                      active: gridState.currentViewport === 'mobile',
                    }}
                    onClick={() => this.handleViewportChange('mobile')}
                  >
                    📱 Mobile
                  </button>
                </div>

                <button class={{ active: gridState.showGrid }} onClick={() => this.handleGridToggle()}>
                  {gridState.showGrid ? 'Show Grid' : 'Hide Grid'}
                </button>

                <button onClick={() => this.handleExportState()}>Export State</button>

                <button onClick={() => this.handleAddSection()}>➕ Add Section</button>

                <button onClick={() => this.handleStressTest()}>🚀 Stress Test</button>

                {/* Item Count */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: '12px',
                    padding: '6px 12px',
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>{this.itemCount} items</span>
                </div>

                {/* Version Switcher */}
                <div class="version-switcher">
                  <span class="version-switcher-label">Version:</span>
                  <select onChange={(e) => (window.location.href = (e.target as HTMLSelectElement).value)}>
                    <option value="../left-top/">Left/Top</option>
                    <option value="../transform/">Transform 🧪</option>
                    <option value="../masonry/">Masonry 🧪</option>
                    <option value="../virtual/">Virtual 🧪</option>
                    <option value="../stencil/" selected>
                      StencilJS 🧪
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Canvas Sections */}
            <div
              class={{
                'canvases-container': true,
                'mobile-view': gridState.currentViewport === 'mobile',
              }}
            >
              {canvasIds.map((canvasId, index) => (
                <canvas-section canvasId={canvasId} sectionNumber={index + 1} key={canvasId} />
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <config-panel />
      </Host>
    );
  }

  private updateItemCount = () => {
    this.itemCount = Object.values(gridState.canvases).reduce((sum, canvas) => sum + canvas.items.length, 0);
  };

  private handleKeyboard = (e: KeyboardEvent) => {
    console.log('Keyboard event:', e.key, 'selectedItemId:', gridState.selectedItemId);

    // Arrow keys for nudging - handle first to prevent page scrolling
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      if (gridState.selectedItemId && gridState.selectedCanvasId) {
        e.preventDefault(); // Prevent page scrolling
        console.log('Arrow key pressed, nudging item:', e.key);

        const canvas = gridState.canvases[gridState.selectedCanvasId];
        const item = canvas?.items.find((i) => i.id === gridState.selectedItemId);

        if (item) {
          const currentViewport = gridState.currentViewport;
          const layout = item.layouts[currentViewport];
          const nudgeAmount = e.shiftKey ? 10 : 1; // Shift key for larger nudges (10 units vs 1 unit)

          switch (e.key) {
            case 'ArrowUp':
              layout.y = Math.max(0, layout.y - nudgeAmount);
              break;
            case 'ArrowDown':
              layout.y = layout.y + nudgeAmount;
              break;
            case 'ArrowLeft':
              layout.x = Math.max(0, layout.x - nudgeAmount);
              break;
            case 'ArrowRight':
              layout.x = layout.x + nudgeAmount;
              break;
          }

          // If in mobile view, mark as customized
          if (currentViewport === 'mobile') {
            item.layouts.mobile.customized = true;
          }

          // Trigger re-render
          gridState.canvases = { ...gridState.canvases };
        }
        return; // Item selected - handled the arrow key, don't do anything else
      }
      // No item selected - allow normal page scrolling (don't return)
    }

    // Undo (Ctrl+Z or Cmd+Z)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }

    // Redo (Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
      return;
    }

    // Delete key (Delete on Windows/Linux, Backspace on Mac)
    if ((e.key === 'Delete' || e.key === 'Backspace') && gridState.selectedItemId) {
      console.log('Deleting item:', gridState.selectedItemId);
      e.preventDefault(); // Prevent browser back navigation
      this.handleDeleteSelected();
    }

    // Escape key
    if (e.key === 'Escape') {
      console.log('Escape pressed, clearing selection');
      gridState.selectedItemId = null;
      gridState.selectedCanvasId = null;
      // Trigger re-render by updating canvases reference
      const canvases = gridState.canvases;
      gridState.canvases = { ...canvases };
      console.log('Canvases updated to trigger re-render');
    }
  };

  private handleDeleteSelected = () => {
    if (!gridState.selectedItemId || !gridState.selectedCanvasId) {
      return;
    }

    const canvas = gridState.canvases[gridState.selectedCanvasId];
    if (!canvas) {
      return;
    }

    // Find the item and its index before deletion
    const itemIndex = canvas.items.findIndex((i) => i.id === gridState.selectedItemId);
    const item = canvas.items[itemIndex];
    if (!item) {
      return;
    }

    // Push undo command before deleting
    pushCommand(new DeleteItemCommand(gridState.selectedCanvasId, item, itemIndex));

    // Delete the item
    canvas.items = canvas.items.filter((i) => i.id !== gridState.selectedItemId);
    gridState.selectedItemId = null;
    gridState.selectedCanvasId = null;

    // Trigger update
    gridState.canvases = { ...gridState.canvases };
  };

  private handleViewportChange = (viewport: 'desktop' | 'mobile') => {
    /**
     * Viewport switching with automatic read/write batching:
     *
     * 1. Setting currentViewport triggers re-render of all grid-item-wrapper components
     * 2. Each component's render() calls gridToPixelsX() which uses getGridSizeHorizontal()
     * 3. Grid size caching ensures container.clientWidth is only read once per canvas
     * 4. All subsequent components use the cached grid size (no DOM reads)
     * 5. StencilJS automatically batches all resulting DOM writes
     *
     * Result: With 100+ items, only 1 DOM read per canvas instead of 100+,
     * and all style updates are batched by StencilJS for a single reflow
     */
    gridState.currentViewport = viewport;
  };

  private handleGridToggle = () => {
    gridState.showGrid = !gridState.showGrid;
  };

  private handleExportState = () => {
    const state = {
      canvases: gridState.canvases,
      currentViewport: gridState.currentViewport,
      timestamp: new Date().toISOString(),
    };

    console.log('Grid State:', state);
    alert(`Grid state exported to console!\n\nTotal Items: ${this.itemCount}\nViewport: ${gridState.currentViewport}`);
  };

  private handleAddSection = () => {
    // Add new section logic
    const canvasIds = Object.keys(gridState.canvases);
    const nextId = canvasIds.length + 1;
    const newCanvasId = `canvas${nextId}`;

    gridState.canvases = {
      ...gridState.canvases,
      [newCanvasId]: {
        items: [],
        zIndexCounter: 1,
        backgroundColor: '#ffffff',
      },
    };

    alert(`Section ${nextId} added!`);
  };

  private handleStressTest = () => {
    // Prompt for number of items
    const input = prompt('How many items to add? (1-1000)', '100');
    if (!input) {
      return;
    }

    const count = parseInt(input, 10);
    if (isNaN(count) || count < 1 || count > 1000) {
      alert('Please enter a number between 1 and 1000');
      return;
    }

    // Get available component types
    const componentTypes = Object.keys(componentTemplates);
    const canvasIds = Object.keys(gridState.canvases);

    // Add items
    for (let i = 0; i < count; i++) {
      // Random component type
      const componentType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
      const template = componentTemplates[componentType];

      // Random canvas
      const canvasId = canvasIds[Math.floor(Math.random() * canvasIds.length)];
      const canvas = gridState.canvases[canvasId];

      // Random position (0-40 grid units horizontally, 0-100 grid units vertically)
      const gridX = Math.floor(Math.random() * 40);
      const gridY = Math.floor(Math.random() * 100);

      // Create new item
      const newItem = {
        id: generateItemId(),
        canvasId,
        type: componentType,
        name: `${template.title} ${i + 1}`,
        layouts: {
          desktop: {
            x: gridX,
            y: gridY,
            width: 10, // Default 10 grid units wide
            height: 6, // Default 6 grid units tall
          },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: canvas.zIndexCounter++,
      };

      // Add item to canvas (without pushing undo command to avoid history bloat)
      addItemToCanvas(canvasId, newItem);
    }

    // Trigger single update after all items added
    gridState.canvases = { ...gridState.canvases };

    alert(`Added ${count} items!`);
  };
}
