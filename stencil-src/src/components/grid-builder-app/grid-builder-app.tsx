import { Component, h, Host, Listen, State } from '@stencil/core';
// Use the standard interactjs package import
import interact from 'interactjs';
import { componentTemplates } from '../../data/component-templates';
import { addItemToCanvas, generateItemId, gridState, removeItemFromCanvas } from '../../services/state-manager';
import { pushCommand, redo, undo } from '../../services/undo-redo';
import { AddItemCommand, DeleteItemCommand, MoveItemCommand } from '../../services/undo-redo-commands';
import { pixelsToGridX, pixelsToGridY } from '../../utils/grid-calculations';
import { VirtualRenderer } from '../../utils/virtual-rendering';

@Component({
  tag: 'grid-builder-app',
  styleUrl: 'grid-builder-app.css',
  shadow: false, // Use light DOM for compatibility with interact.js
})
export class GridBuilderApp {
  @State() itemCount: number = 0;

  componentWillLoad() {
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

    // Expose interact to global scope for debugging
    (window as any).interact = interact;

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
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleKeyboard.bind(this));
  }

  @Listen('canvas-drop', { target: 'document' })
  handleCanvasDrop(event: CustomEvent) {
    const { canvasId, componentType, x, y } = event.detail;

    // Get template for the component type
    const template = componentTemplates[componentType];
    if (!template) {
      console.error('Unknown component type:', componentType);
      return;
    }

    // Convert pixel coordinates to grid units
    const gridX = pixelsToGridX(x, canvasId);
    const gridY = pixelsToGridY(y);

    // Get canvas to determine next z-index
    const canvas = gridState.canvases[canvasId];
    if (!canvas) {
      console.error('Canvas not found:', canvasId);
      return;
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
  }

  @Listen('item-delete', { target: 'document' })
  handleItemDelete(event: CustomEvent) {
    const { itemId, canvasId } = event.detail;

    // Find the item and its index before deletion
    const canvas = gridState.canvases[canvasId];
    if (!canvas) { return; }

    const itemIndex = canvas.items.findIndex(i => i.id === itemId);
    const item = canvas.items[itemIndex];
    if (!item) { return; }

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
    const sourceIndex = sourceCanvas.items.findIndex(i => i.id === itemId);
    const item = sourceCanvas.items[sourceIndex];

    if (!item) { return; }

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
    sourceCanvas.items = sourceCanvas.items.filter(i => i.id !== itemId);

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
                  <select onChange={e => (window.location.href = (e.target as HTMLSelectElement).value)}>
                    <option value="../left-top/">Left/Top</option>
                    <option value="../transform/">Transform 🧪</option>
                    <option value="../masonry/">Masonry 🧪</option>
                    <option value="../virtual/">Virtual 🧪</option>
                    <option value="../stencil/" selected={true}>
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

  private updateItemCount() {
    this.itemCount = Object.values(gridState.canvases).reduce((sum, canvas) => sum + canvas.items.length, 0);
  }

  private handleKeyboard(e: KeyboardEvent) {
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

    // Delete key
    if (e.key === 'Delete' && gridState.selectedItemId) {
      this.handleDeleteSelected();
    }

    // Escape key
    if (e.key === 'Escape') {
      gridState.selectedItemId = null;
      gridState.selectedCanvasId = null;
    }
  }

  private handleDeleteSelected() {
    if (!gridState.selectedItemId || !gridState.selectedCanvasId) { return; }

    const canvas = gridState.canvases[gridState.selectedCanvasId];
    if (!canvas) { return; }

    // Find the item and its index before deletion
    const itemIndex = canvas.items.findIndex(item => item.id === gridState.selectedItemId);
    const item = canvas.items[itemIndex];
    if (!item) { return; }

    // Push undo command before deleting
    pushCommand(new DeleteItemCommand(gridState.selectedCanvasId, item, itemIndex));

    // Delete the item
    canvas.items = canvas.items.filter(item => item.id !== gridState.selectedItemId);
    gridState.selectedItemId = null;
    gridState.selectedCanvasId = null;

    // Trigger update
    gridState.canvases = { ...gridState.canvases };
  }

  private handleViewportChange(viewport: 'desktop' | 'mobile') {
    gridState.currentViewport = viewport;
  }

  private handleGridToggle() {
    gridState.showGrid = !gridState.showGrid;
  }

  private handleExportState() {
    const state = {
      canvases: gridState.canvases,
      currentViewport: gridState.currentViewport,
      timestamp: new Date().toISOString(),
    };

    console.log('Grid State:', state);
    alert(`Grid state exported to console!\n\nTotal Items: ${this.itemCount}\nViewport: ${gridState.currentViewport}`);
  }

  private handleAddSection() {
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
  }

  private handleStressTest() {
    // Prompt for number of items
    const input = prompt('How many items to add? (1-1000)', '100');
    if (!input) { return; }

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
  }
}
