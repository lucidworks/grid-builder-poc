/**
 * Config Panel Component (Library Version)
 * =========================================
 *
 * Configuration panel with auto-generated forms and custom panel support.
 * This is the library version that uses ComponentDefinition for flexibility.
 *
 * ## Key Features
 *
 * **Auto-generated forms**:
 * - Reads ComponentDefinition.configSchema
 * - Generates form fields automatically (text, number, select, checkbox, color)
 * - Live preview of changes
 * - Revert on cancel
 *
 * **Custom panels**:
 * - Uses ComponentDefinition.renderConfigPanel() if provided
 * - Consumer has full control over config UI
 * - Library provides onChange, onSave, onCancel callbacks
 *
 * **Basic fields** (always available):
 * - Component name (item.name)
 * - Z-index controls (bring to front, send to back, etc.)
 * @module config-panel
 */

import { Component, h, Listen, Prop, State, Watch } from "@stencil/core";

// Internal imports
import { gridState } from "../../../services/state-manager";
import {
  ComponentDefinition,
  ConfigField,
} from "../../../types/component-definition";
import { GridBuilderAPI } from "../../../services/grid-builder-api";

/**
 * ConfigPanel Component
 * =====================
 *
 * Library component providing configuration panel with auto-generated and custom forms.
 *
 * **Tag**: `<config-panel>`
 * **Shadow DOM**: Disabled (for consistency with other components)
 */
@Component({
  tag: "config-panel",
  styleUrl: "config-panel.scss",
  shadow: false,
})
export class ConfigPanel {
  /**
   * Grid Builder API instance
   *
   * **Source**: Parent component (e.g., blog-app)
   * **Purpose**: Access grid state and subscribe to events
   * **Required**: Component won't work without valid API reference
   */
  @Prop() api?: GridBuilderAPI;

  /**
   * Component registry (from parent grid-builder)
   *
   * **Source**: grid-builder component
   * **Purpose**: Look up component definitions for config forms
   */
  @Prop() componentRegistry?: Map<string, ComponentDefinition>;

  /**
   * Panel open state
   */
  @State() isOpen: boolean = false;

  /**
   * Selected item ID
   */
  @State() selectedItemId: string | null = null;

  /**
   * Selected canvas ID
   */
  @State() selectedCanvasId: string | null = null;

  /**
   * Component name (editable)
   */
  @State() componentName: string = "";

  /**
   * Component config (editable)
   */
  @State() componentConfig: Record<string, any> = {};

  /**
   * Original state for cancel functionality
   */
  private originalState: {
    name: string;
    zIndex: number;
    config: Record<string, any>;
  } | null = null;

  /**
   * Flag to track if we've subscribed to events
   */
  private eventsSubscribed: boolean = false;

  /**
   * Callback for itemRemoved event (stored for unsubscribe)
   */
  private handleItemRemoved = (event: {
    itemId: string;
    canvasId: string;
  }) => {
    console.log("🔔 config-panel received itemRemoved event", {
      eventItemId: event.itemId,
      selectedItemId: this.selectedItemId,
      isOpen: this.isOpen,
      shouldClose:
        this.isOpen &&
        this.selectedItemId &&
        event.itemId === this.selectedItemId,
    });

    // Close panel if the deleted item is the currently selected one
    if (
      this.isOpen &&
      this.selectedItemId &&
      event.itemId === this.selectedItemId
    ) {
      console.log("  ✅ Closing panel because selected item was deleted");
      this.closePanel();
    } else {
      console.log(
        "  ℹ️ Not closing panel - different item or panel already closed",
      );
    }
  };

  /**
   * Ensure event subscription is set up (lazy initialization)
   */
  private ensureEventSubscription() {
    if (this.eventsSubscribed || !this.api) {
      return;
    }

    // Subscribe to itemRemoved events via API
    this.api.on("itemRemoved", this.handleItemRemoved);
    this.eventsSubscribed = true;
    console.log("  ✅ Config panel: Subscribed to itemRemoved event");
  }

  /**
   * Watch for API prop changes
   */
  @Watch("api")
  handleApiChange(newApi: GridBuilderAPI) {
    console.log("📋 config-panel API prop changed", {
      hasNewApi: !!newApi,
    });

    // When API becomes available, ensure event subscription
    if (newApi && !this.eventsSubscribed) {
      this.ensureEventSubscription();
    }
  }

  /**
   * Listen for item-click events to open panel
   */
  @Listen("item-click", { target: "document" })
  handleItemClick(event: CustomEvent) {
    const { itemId, canvasId } = event.detail;
    this.openPanel(itemId, canvasId);
  }

  /**
   * Component lifecycle: Subscribe to itemRemoved event
   */
  componentDidLoad() {
    console.log(
      "📋 config-panel componentDidLoad - subscribing to itemRemoved event",
    );
    // Try to subscribe to events (will retry on first item click if API not ready)
    this.ensureEventSubscription();
  }

  /**
   * Component lifecycle: Cleanup event subscriptions
   */
  disconnectedCallback() {
    if (this.api && this.eventsSubscribed) {
      this.api.off("itemRemoved", this.handleItemRemoved);
      this.eventsSubscribed = false;
    }
  }

  /**
   * Render component template
   */
  render() {
    const panelClasses = {
      "config-panel": true,
      open: this.isOpen,
    };

    // Get component definition for the selected item
    const item = this.getSelectedItem();
    const definition = item ? this.componentRegistry?.get(item.type) : null;

    return (
      <div class={panelClasses}>
        <div class="config-panel-header">
          <h2>Component Settings</h2>
          <button class="config-panel-close" onClick={() => this.closePanel()}>
            ×
          </button>
        </div>

        <div class="config-panel-body">
          {/* Component Name Field */}
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

          {/* Custom Config Panel or Auto-Generated Form */}
          {definition && this.renderConfigFields(definition)}

          {/* Z-Index Controls */}
          <div class="config-field">
            <label>Layer Order</label>
            <div class="z-index-controls">
              <button
                class="z-index-btn"
                onClick={() => this.bringToFront()}
                title="Bring to Front"
              >
                ⬆️ To Front
              </button>
              <button
                class="z-index-btn"
                onClick={() => this.bringForward()}
                title="Bring Forward"
              >
                ↑ Forward
              </button>
              <button
                class="z-index-btn"
                onClick={() => this.sendBackward()}
                title="Send Backward"
              >
                ↓ Backward
              </button>
              <button
                class="z-index-btn"
                onClick={() => this.sendToBack()}
                title="Send to Back"
              >
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

  /**
   * Render config fields (custom or auto-generated)
   */
  private renderConfigFields(definition: ComponentDefinition) {
    // If component provides custom config panel, use it
    if (definition.renderConfigPanel) {
      return definition.renderConfigPanel({
        config: this.componentConfig,
        onChange: this.handleConfigChange,
        onSave: this.saveConfig,
        onCancel: this.closePanel,
      });
    }

    // Otherwise, auto-generate form from configSchema
    if (definition.configSchema && definition.configSchema.length > 0) {
      return (
        <div class="config-section">
          <h3>Component Configuration</h3>
          {definition.configSchema.map((field) =>
            this.renderConfigField(field),
          )}
        </div>
      );
    }

    // No config available
    return (
      <div class="config-section">
        <p class="no-config">
          No configuration options available for this component.
        </p>
      </div>
    );
  }

  /**
   * Render a single config field from schema
   */
  private renderConfigField(field: ConfigField) {
    const value = this.componentConfig[field.name] ?? field.defaultValue ?? "";

    switch (field.type) {
      case "text":
        return (
          <div class="config-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              type="text"
              id={field.name}
              value={value}
              onInput={(e) =>
                this.handleConfigChange(
                  field.name,
                  (e.target as HTMLInputElement).value,
                )
              }
              placeholder={field.placeholder}
            />
          </div>
        );

      case "number":
        return (
          <div class="config-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              type="number"
              id={field.name}
              value={value}
              onInput={(e) =>
                this.handleConfigChange(
                  field.name,
                  Number((e.target as HTMLInputElement).value),
                )
              }
              min={field.min}
              max={field.max}
              step={field.step}
            />
          </div>
        );

      case "select":
        return (
          <div class="config-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <select
              id={field.name}
              onChange={(e) =>
                this.handleConfigChange(
                  field.name,
                  (e.target as HTMLSelectElement).value,
                )
              }
            >
              {field.options?.map((option) => {
                // Handle both string and object options
                const optionValue =
                  typeof option === "string" ? option : option.value;
                const optionLabel =
                  typeof option === "string" ? option : option.label;
                return (
                  <option
                    key={optionValue}
                    value={optionValue}
                    selected={value === optionValue}
                  >
                    {optionLabel}
                  </option>
                );
              })}
            </select>
          </div>
        );

      case "checkbox":
        return (
          <div class="config-field config-field-checkbox" key={field.name}>
            <label htmlFor={field.name}>
              <input
                type="checkbox"
                id={field.name}
                checked={!!value}
                onChange={(e) =>
                  this.handleConfigChange(
                    field.name,
                    (e.target as HTMLInputElement).checked,
                  )
                }
              />
              {field.label}
            </label>
          </div>
        );

      case "color":
        return (
          <div class="config-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              type="color"
              id={field.name}
              value={value}
              onInput={(e) =>
                this.handleConfigChange(
                  field.name,
                  (e.target as HTMLInputElement).value,
                )
              }
            />
          </div>
        );

      case "textarea":
        return (
          <div class="config-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <textarea
              id={field.name}
              value={value}
              onInput={(e) =>
                this.handleConfigChange(
                  field.name,
                  (e.target as HTMLTextAreaElement).value,
                )
              }
              placeholder={field.placeholder}
              rows={field.rows || 3}
            />
          </div>
        );

      default:
        return (
          <div class="config-field" key={field.name}>
            <label>{field.label}</label>
            <p class="field-error">Unknown field type: {field.type}</p>
          </div>
        );
    }
  }

  /**
   * Get selected item from state
   */
  private getSelectedItem() {
    if (!this.selectedItemId || !this.selectedCanvasId) {
      return null;
    }

    const canvas = gridState.canvases[this.selectedCanvasId];
    return canvas?.items.find((i) => i.id === this.selectedItemId);
  }

  /**
   * Open config panel for item
   */
  private openPanel = (itemId: string, canvasId: string) => {
    this.selectedItemId = itemId;
    this.selectedCanvasId = canvasId;

    // Get item from state
    const item = this.getSelectedItem();
    if (!item) {
      return;
    }

    // Get component definition
    const definition = this.componentRegistry?.get(item.type);

    // Save original state for cancel functionality
    this.originalState = {
      name: item.name || definition?.name || item.type,
      zIndex: item.zIndex,
      config: item.config ? { ...item.config } : {},
    };

    // Populate form
    this.componentName = this.originalState.name;
    this.componentConfig = { ...this.originalState.config };

    // Update selection in state
    gridState.selectedItemId = itemId;
    gridState.selectedCanvasId = canvasId;

    // Open panel
    this.isOpen = true;
  };

  /**
   * Close config panel (revert changes)
   */
  private closePanel = () => {
    // Revert changes on cancel
    if (this.selectedItemId && this.selectedCanvasId && this.originalState) {
      const canvas = gridState.canvases[this.selectedCanvasId];
      const itemIndex = canvas?.items.findIndex(
        (i) => i.id === this.selectedItemId,
      );
      if (itemIndex !== undefined && itemIndex !== -1) {
        canvas.items[itemIndex] = {
          ...canvas.items[itemIndex],
          name: this.originalState.name,
          zIndex: this.originalState.zIndex,
          config: this.originalState.config,
        };
        gridState.canvases = { ...gridState.canvases };
      }
    }

    this.isOpen = false;
    this.selectedItemId = null;
    this.selectedCanvasId = null;
    this.componentName = "";
    this.componentConfig = {};
    this.originalState = null;
  };

  /**
   * Save config changes
   */
  private saveConfig = () => {
    // Changes are already applied live, so just close without reverting
    this.isOpen = false;
    this.selectedItemId = null;
    this.selectedCanvasId = null;
    this.componentName = "";
    this.componentConfig = {};
    this.originalState = null;
  };

  /**
   * Handle component name input
   */
  private handleNameInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.componentName = target.value;

    // Apply changes immediately (live preview)
    if (this.selectedItemId && this.selectedCanvasId) {
      const canvas = gridState.canvases[this.selectedCanvasId];
      const itemIndex = canvas?.items.findIndex(
        (i) => i.id === this.selectedItemId,
      );
      if (itemIndex !== undefined && itemIndex !== -1) {
        canvas.items[itemIndex] = {
          ...canvas.items[itemIndex],
          name: this.componentName,
        };
        gridState.canvases = { ...gridState.canvases };
      }
    }
  };

  /**
   * Handle config field change
   */
  private handleConfigChange = (fieldName: string, value: any) => {
    // Update local config state
    this.componentConfig = { ...this.componentConfig, [fieldName]: value };

    // Apply changes immediately (live preview)
    if (this.selectedItemId && this.selectedCanvasId) {
      const canvas = gridState.canvases[this.selectedCanvasId];
      const itemIndex = canvas?.items.findIndex(
        (i) => i.id === this.selectedItemId,
      );
      if (itemIndex !== undefined && itemIndex !== -1) {
        canvas.items[itemIndex] = {
          ...canvas.items[itemIndex],
          config: this.componentConfig,
        };
        gridState.canvases = { ...gridState.canvases };
      }
    }
  };

  /**
   * Z-index control methods
   */
  private bringToFront = () => {
    if (!this.selectedItemId || !this.selectedCanvasId) return;
    const canvas = gridState.canvases[this.selectedCanvasId];
    const itemIndex = canvas?.items.findIndex(
      (i) => i.id === this.selectedItemId,
    );
    if (itemIndex === undefined || itemIndex === -1) return;

    const newZIndex = ++canvas.zIndexCounter;
    canvas.items[itemIndex] = { ...canvas.items[itemIndex], zIndex: newZIndex };
    gridState.canvases = { ...gridState.canvases };
  };

  private bringForward = () => {
    if (!this.selectedItemId || !this.selectedCanvasId) return;
    const canvas = gridState.canvases[this.selectedCanvasId];
    const itemIndex = canvas?.items.findIndex(
      (i) => i.id === this.selectedItemId,
    );
    if (itemIndex === undefined || itemIndex === -1) return;

    const item = canvas.items[itemIndex];
    const itemsAbove = canvas.items.filter((i) => i.zIndex > item.zIndex);
    if (itemsAbove.length > 0) {
      const nextZIndex = Math.min(...itemsAbove.map((i) => i.zIndex));
      const itemAboveIndex = canvas.items.findIndex(
        (i) => i.zIndex === nextZIndex,
      );
      if (itemAboveIndex !== -1) {
        const temp = item.zIndex;
        canvas.items[itemIndex] = { ...item, zIndex: nextZIndex };
        canvas.items[itemAboveIndex] = {
          ...canvas.items[itemAboveIndex],
          zIndex: temp,
        };
        gridState.canvases = { ...gridState.canvases };
      }
    }
  };

  private sendBackward = () => {
    if (!this.selectedItemId || !this.selectedCanvasId) return;
    const canvas = gridState.canvases[this.selectedCanvasId];
    const itemIndex = canvas?.items.findIndex(
      (i) => i.id === this.selectedItemId,
    );
    if (itemIndex === undefined || itemIndex === -1) return;

    const item = canvas.items[itemIndex];
    const itemsBelow = canvas.items.filter((i) => i.zIndex < item.zIndex);
    if (itemsBelow.length > 0) {
      const prevZIndex = Math.max(...itemsBelow.map((i) => i.zIndex));
      const itemBelowIndex = canvas.items.findIndex(
        (i) => i.zIndex === prevZIndex,
      );
      if (itemBelowIndex !== -1) {
        const temp = item.zIndex;
        canvas.items[itemIndex] = { ...item, zIndex: prevZIndex };
        canvas.items[itemBelowIndex] = {
          ...canvas.items[itemBelowIndex],
          zIndex: temp,
        };
        gridState.canvases = { ...gridState.canvases };
      }
    }
  };

  private sendToBack = () => {
    if (!this.selectedItemId || !this.selectedCanvasId) return;
    const canvas = gridState.canvases[this.selectedCanvasId];
    const itemIndex = canvas?.items.findIndex(
      (i) => i.id === this.selectedItemId,
    );
    if (itemIndex === undefined || itemIndex === -1) return;

    const minZIndex = Math.min(...canvas.items.map((i) => i.zIndex));
    const newZIndex = Math.max(1, minZIndex - 1);

    if (minZIndex <= 1) {
      const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);
      canvas.items = sortedItems.map((itm, index) => ({
        ...itm,
        zIndex: itm.id === this.selectedItemId ? 1 : index + 2,
      }));
    } else {
      canvas.items[itemIndex] = {
        ...canvas.items[itemIndex],
        zIndex: newZIndex,
      };
    }

    gridState.canvases = { ...gridState.canvases };
  };
}
