import { Component, h, Listen, State } from '@stencil/core';
import { componentTemplates } from '../../data/component-templates';
import { gridState } from '../../services/state-manager';

@Component({
  tag: 'config-panel',
  styleUrl: 'config-panel.css',
  shadow: false,
})
export class ConfigPanel {
  @State() isOpen: boolean = false;
  @State() selectedItemId: string | null = null;
  @State() selectedCanvasId: string | null = null;
  @State() componentName: string = '';

  @Listen('item-click', { target: 'document' })
  handleItemClick(event: CustomEvent) {
    const { itemId, canvasId } = event.detail;
    this.openPanel(itemId, canvasId);
  }

  render() {
    const panelClasses = {
      'config-panel': true,
      open: this.isOpen,
    };

    return (
      <div class={panelClasses}>
        <div class="config-panel-header">
          <h2>Component Settings</h2>
          <button class="config-panel-close" onClick={() => this.closePanel()}>
            ×
          </button>
        </div>

        <div class="config-panel-body">
          <div class="config-field">
            <label htmlFor="componentName">Component Name</label>
            <input
              type="text"
              id="componentName"
              value={this.componentName}
              onInput={(e) => this.handleNameInput(e)}
              placeholder="Enter component name"
            />
          </div>

          <div class="config-field">
            <label>Layer Order</label>
            <div class="z-index-controls">
              <button class="z-index-btn" onClick={() => this.bringToFront()} title="Bring to Front">
                ⬆️ To Front
              </button>
              <button class="z-index-btn" onClick={() => this.bringForward()} title="Bring Forward">
                ↑ Forward
              </button>
              <button class="z-index-btn" onClick={() => this.sendBackward()} title="Send Backward">
                ↓ Backward
              </button>
              <button class="z-index-btn" onClick={() => this.sendToBack()} title="Send to Back">
                ⬇️ To Back
              </button>
            </div>
          </div>
        </div>

        <div class="config-panel-footer">
          <button onClick={() => this.closePanel()}>Cancel</button>
          <button class="primary" onClick={() => this.saveConfig()}>
            Save
          </button>
        </div>
      </div>
    );
  }

  private openPanel(itemId: string, canvasId: string) {
    this.selectedItemId = itemId;
    this.selectedCanvasId = canvasId;

    // Get item from state
    const canvas = gridState.canvases[canvasId];
    const item = canvas?.items.find((i) => i.id === itemId);
    if (!item) {
      return;
    }

    // Populate form
    const template = componentTemplates[item.type];
    this.componentName = item.name || template.title;

    // Update selection in state
    gridState.selectedItemId = itemId;
    gridState.selectedCanvasId = canvasId;

    // Open panel
    this.isOpen = true;
  }

  private closePanel() {
    this.isOpen = false;

    // Clear selection
    gridState.selectedItemId = null;
    gridState.selectedCanvasId = null;

    // Clear component state
    this.selectedItemId = null;
    this.selectedCanvasId = null;
    this.componentName = '';
  }

  private saveConfig() {
    if (!this.selectedItemId || !this.selectedCanvasId) {
      return;
    }

    const canvas = gridState.canvases[this.selectedCanvasId];
    const item = canvas?.items.find((i) => i.id === this.selectedItemId);
    if (!item) {
      return;
    }

    const newName = this.componentName.trim();
    if (newName) {
      item.name = newName;
      gridState.canvases = { ...gridState.canvases }; // Trigger update
    }

    this.closePanel();
  }

  private bringToFront() {
    if (!this.selectedItemId || !this.selectedCanvasId) {
      return;
    }

    const canvas = gridState.canvases[this.selectedCanvasId];
    const item = canvas?.items.find((i) => i.id === this.selectedItemId);
    if (!item) {
      return;
    }

    // Increment canvas z-index counter and assign to item
    item.zIndex = ++canvas.zIndexCounter;
    gridState.canvases = { ...gridState.canvases }; // Trigger update
  }

  private bringForward() {
    if (!this.selectedItemId || !this.selectedCanvasId) {
      return;
    }

    const canvas = gridState.canvases[this.selectedCanvasId];
    const item = canvas?.items.find((i) => i.id === this.selectedItemId);
    if (!item) {
      return;
    }

    // Find items with z-index greater than current
    const itemsAbove = canvas.items.filter((i) => i.zIndex > item.zIndex);
    if (itemsAbove.length > 0) {
      // Get the lowest z-index above this item
      const nextZIndex = Math.min(...itemsAbove.map((i) => i.zIndex));
      // Swap z-indexes
      const itemAbove = canvas.items.find((i) => i.zIndex === nextZIndex);
      if (itemAbove) {
        const temp = item.zIndex;
        item.zIndex = itemAbove.zIndex;
        itemAbove.zIndex = temp;
        gridState.canvases = { ...gridState.canvases }; // Trigger update
      }
    }
  }

  private sendBackward() {
    if (!this.selectedItemId || !this.selectedCanvasId) {
      return;
    }

    const canvas = gridState.canvases[this.selectedCanvasId];
    const item = canvas?.items.find((i) => i.id === this.selectedItemId);
    if (!item) {
      return;
    }

    // Find items with z-index less than current
    const itemsBelow = canvas.items.filter((i) => i.zIndex < item.zIndex);
    if (itemsBelow.length > 0) {
      // Get the highest z-index below this item
      const prevZIndex = Math.max(...itemsBelow.map((i) => i.zIndex));
      // Swap z-indexes
      const itemBelow = canvas.items.find((i) => i.zIndex === prevZIndex);
      if (itemBelow) {
        const temp = item.zIndex;
        item.zIndex = itemBelow.zIndex;
        itemBelow.zIndex = temp;
        gridState.canvases = { ...gridState.canvases }; // Trigger update
      }
    }
  }

  private sendToBack() {
    if (!this.selectedItemId || !this.selectedCanvasId) {
      return;
    }

    const canvas = gridState.canvases[this.selectedCanvasId];
    const item = canvas?.items.find((i) => i.id === this.selectedItemId);
    if (!item) {
      return;
    }

    // Find the lowest z-index
    const minZIndex = Math.min(...canvas.items.map((i) => i.zIndex));
    item.zIndex = Math.max(1, minZIndex - 1);

    // If the item is already at the back, reorder all z-indexes
    if (minZIndex <= 1) {
      // Sort items by current z-index
      const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);

      // Reassign z-indexes starting from 1, with this item first
      sortedItems.forEach((itm, index) => {
        itm.zIndex = itm.id === this.selectedItemId ? 1 : index + 2;
      });
    }

    gridState.canvases = { ...gridState.canvases }; // Trigger update
  }

  private handleNameInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.componentName = target.value;
  }
}
