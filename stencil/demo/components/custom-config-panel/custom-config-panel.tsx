/**
 * Custom Config Panel (Demo Component)
 * ======================================
 *
 * Custom configuration panel for the blog demo app.
 * Demonstrates how to create an external config panel that works alongside grid-builder.
 *
 * **Key Features**:
 * - Custom styling to match blog theme (purple gradient)
 * - Auto-close when selected item is deleted (via itemRemoved event)
 * - Uses manual event listeners for item-click events (Stencil @Listen doesn't work for custom events)
 * - Receives GridBuilderAPI as a prop from parent component
 * - Demonstrates proper event subscription/unsubscription pattern
 *
 * **API Access Pattern**:
 * - Parent (blog-app) stores API on component instance via api-ref={{ target: this, key: 'api' }}
 * - Parent passes API to this component via api prop
 * - This allows multiple grid-builder instances without window pollution
 */

import { Component, h, State, Prop, Watch } from "@stencil/core";
import { blogComponentDefinitions } from "../../component-definitions";
import { GridBuilderAPI } from "../../../types/api";

@Component({
  tag: "custom-config-panel",
  styleUrl: "custom-config-panel.scss",
  shadow: false,
})
export class CustomConfigPanel {
  /**
   * Grid Builder API (accessed from window.gridBuilderAPI or passed as prop)
   *
   * **Source**: window.gridBuilderAPI (set by grid-builder component)
   * **Purpose**: Access grid state and methods
   * **Required**: Component won't work without valid API reference
   */
  @Prop() api?: GridBuilderAPI;

  /**
   * Panel open/closed state
   */
  @State() isOpen: boolean = false;

  /**
   * Currently selected item ID
   */
  @State() selectedItemId: string | null = null;

  /**
   * Currently selected canvas ID
   */
  @State() selectedCanvasId: string | null = null;

  /**
   * Component config (temporary edit state)
   */
  @State() componentConfig: Record<string, any> = {};

  /**
   * Component name (temporary edit state)
   */
  @State() componentName: string = "";

  /**
   * Original state for cancel functionality
   */
  private originalState: {
    name: string;
    zIndex: number;
    config: Record<string, any>;
  } | null = null;

  /**
   * Component registry (from blog component definitions)
   */
  private componentRegistry: Map<string, any> = new Map();

  /**
   * Flag to track if we've subscribed to events
   */
  private eventsSubscribed: boolean = false;

  /**
   * Callback for itemRemoved event (stored for unsubscribe)
   */
  private handleItemRemoved = (event: { itemId: string; canvasId: string }) => {
    console.log("🎨 custom-config-panel received itemRemoved event", {
      eventItemId: event.itemId,
      selectedItemId: this.selectedItemId,
      isOpen: this.isOpen,
    });

    // Close panel if the deleted item is the currently selected one
    if (
      this.isOpen &&
      this.selectedItemId &&
      event.itemId === this.selectedItemId
    ) {
      console.log(
        "  ✅ Custom panel: Closing because selected item was deleted",
      );
      this.closePanel();
    }
  };

  /**
   * Get API (from prop or window)
   */
  private getAPI(): GridBuilderAPI | null {
    // Use prop if provided, otherwise try window
    return this.api || (window as any).gridBuilderAPI || null;
  }

  /**
   * Ensure event subscription is set up (lazy initialization)
   */
  private ensureEventSubscription() {
    if (this.eventsSubscribed) {
      return;
    }

    const api = this.getAPI();
    if (!api) {
      return; // API not ready yet, will try again later
    }

    // Subscribe to itemRemoved events via API
    api.on("itemRemoved", this.handleItemRemoved);
    this.eventsSubscribed = true;
    console.log("  ✅ Custom panel: Subscribed to itemRemoved event");
  }

  /**
   * Watch for API prop changes
   */
  @Watch("api")
  handleApiChange(newApi: GridBuilderAPI, oldApi: GridBuilderAPI) {
    console.log("🎨 custom-config-panel API prop changed", {
      hadOldApi: !!oldApi,
      hasNewApi: !!newApi,
      newApiType: typeof newApi,
    });

    // When API becomes available, ensure event subscription
    if (newApi && !this.eventsSubscribed) {
      this.ensureEventSubscription();
    }
  }

  componentDidLoad() {
    console.log(
      "🎨 custom-config-panel componentDidLoad - setting up component registry",
    );
    const api = this.getAPI();
    console.log("  🔧 API status:", {
      apiExists: !!api,
      apiType: typeof api,
      fromProp: !!this.api,
      fromWindow: !!(window as any).gridBuilderAPI,
    });

    // Build component registry from blog component definitions
    // This doesn't depend on the API being available
    this.componentRegistry = new Map(
      blogComponentDefinitions.map((def) => [def.type, def]),
    );

    // Try to subscribe to events (will retry on first item click if API not ready)
    this.ensureEventSubscription();

    // Listen for item-click events
    // Note: Stencil's @Listen decorator doesn't work reliably for custom events on document
    // so we use manual event listeners instead
    document.addEventListener(
      "item-click",
      this.handleItemClick as EventListener,
    );
    console.log("  ✅ Custom panel: Listening for item-click events");
  }

  disconnectedCallback() {
    console.log("🎨 custom-config-panel disconnectedCallback - cleaning up");

    // Unsubscribe from itemRemoved events
    const api = this.getAPI();
    if (api && this.eventsSubscribed) {
      api.off("itemRemoved", this.handleItemRemoved);
      this.eventsSubscribed = false;
    }

    // Remove item-click event listener
    document.removeEventListener(
      "item-click",
      this.handleItemClick as EventListener,
    );
  }

  /**
   * Handle item-click events from the document
   */
  private handleItemClick = (event: CustomEvent) => {
    console.log("🎨 custom-config-panel handleItemClick called", event.detail);

    // Ensure event subscription is set up (retry if it failed in componentDidLoad)
    this.ensureEventSubscription();

    const { itemId, canvasId } = event.detail;
    this.selectedItemId = itemId;
    this.selectedCanvasId = canvasId;

    // Get item from API
    const api = this.getAPI();
    console.log("  🔧 API exists:", !!api);

    const item = api?.getItem(itemId);
    console.log("  🔧 Item retrieved:", !!item, item);

    if (!item) {
      console.log("  ❌ No item found - exiting");
      return;
    }

    // Get component definition
    const definition = this.componentRegistry.get(item.type);
    console.log("  🔧 Definition found:", !!definition, definition?.name);

    // Save original state for cancel functionality
    this.originalState = {
      name: item.name || definition?.name || item.type,
      zIndex: item.zIndex,
      config: item.config ? { ...item.config } : {},
    };

    // Populate form
    this.componentName = this.originalState.name;
    this.componentConfig = { ...this.originalState.config };

    // Open panel
    console.log("  🚪 Opening panel - setting isOpen = true");
    this.isOpen = true;
    console.log("  ✅ Panel should now be open, isOpen =", this.isOpen);
  };

  /**
   * Close panel and revert changes
   */
  private closePanel = () => {
    // Revert changes on cancel by restoring original state
    const api = this.getAPI();
    if (
      this.selectedItemId &&
      this.selectedCanvasId &&
      this.originalState &&
      api
    ) {
      // Revert config changes
      api.updateConfig(this.selectedItemId, this.originalState.config);

      // Revert name changes
      const state = api.getState();
      for (const canvasId in state.canvases) {
        const canvas = state.canvases[canvasId];
        const itemIndex = canvas.items.findIndex(
          (i) => i.id === this.selectedItemId,
        );
        if (itemIndex !== -1) {
          canvas.items[itemIndex] = {
            ...canvas.items[itemIndex],
            name: this.originalState.name,
          };
          // Trigger reactivity
          state.canvases = { ...state.canvases };
          break;
        }
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
   * Handle component name change
   */
  private handleNameChange = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    this.componentName = value;

    // Update the item name (live preview)
    const api = this.getAPI();
    if (this.selectedItemId && api) {
      // Get the full state to access canvases
      const state = api.getState();

      // Find and update the item across all canvases
      for (const canvasId in state.canvases) {
        const canvas = state.canvases[canvasId];
        const itemIndex = canvas.items.findIndex(
          (i) => i.id === this.selectedItemId,
        );
        if (itemIndex !== -1) {
          // Update the name property
          canvas.items[itemIndex] = {
            ...canvas.items[itemIndex],
            name: value,
          };
          // Trigger reactivity by reassigning canvases object
          state.canvases = { ...state.canvases };
          break;
        }
      }
    }
  };

  /**
   * Handle config field change
   */
  private handleConfigChange = (fieldName: string, value: any) => {
    // Update local config state
    this.componentConfig = { ...this.componentConfig, [fieldName]: value };

    // Apply changes immediately (live preview) via API
    const api = this.getAPI();
    if (this.selectedItemId && api) {
      api.updateConfig(this.selectedItemId, this.componentConfig);
    }
  };

  render() {
    if (!this.isOpen) {
      return null;
    }

    // Get item from API
    const api = this.getAPI();
    const item = api?.getItem(this.selectedItemId);
    if (!item) {
      return null;
    }

    const definition = this.componentRegistry.get(item.type);
    if (!definition) {
      return null;
    }

    const panelClasses = {
      "custom-config-panel": true,
      "panel-open": this.isOpen,
    };

    return (
      <div class={panelClasses}>
        <div class="custom-panel-header">
          <div class="header-content">
            <span class="component-icon">{definition.icon}</span>
            <h2>Edit Component</h2>
          </div>
          <button
            class="close-btn"
            onClick={() => this.closePanel()}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div class="custom-panel-body">
          {/* Component Name */}
          <div class="config-section">
            <label class="section-label">Component Name</label>
            <input
              type="text"
              class="text-input"
              value={this.componentName}
              placeholder="Enter component name"
              onInput={(e) => this.handleNameChange(e)}
            />
          </div>

          {/* Component Type Info */}
          <div class="config-section info-section">
            <div class="info-row">
              <span class="info-label">Type:</span>
              <span class="info-value">{definition.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ID:</span>
              <span class="info-value">{item.id}</span>
            </div>
          </div>

          {/* Config Fields */}
          {definition.configSchema && definition.configSchema.length > 0 ? (
            <div class="config-section">
              <label class="section-label">Configuration</label>
              {definition.configSchema.map((field: any) => (
                <div class="config-field" key={field.name}>
                  <label class="field-label">{field.label}</label>
                  {this.renderConfigField(field)}
                </div>
              ))}
            </div>
          ) : (
            <div class="config-section">
              <p class="no-config-message">
                No configuration options available for this component.
              </p>
            </div>
          )}
        </div>

        <div class="custom-panel-footer">
          <button class="btn btn-secondary" onClick={() => this.closePanel()}>
            Cancel
          </button>
          <button class="btn btn-primary" onClick={() => this.saveConfig()}>
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render a single config field
   */
  private renderConfigField(field: any) {
    const value = this.componentConfig[field.name] ?? field.defaultValue ?? "";

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            class="text-input"
            value={value}
            onInput={(e) =>
              this.handleConfigChange(
                field.name,
                (e.target as HTMLInputElement).value,
              )
            }
            placeholder={field.placeholder}
          />
        );

      case "textarea":
        return (
          <textarea
            class="textarea-input"
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
        );

      case "number":
        return (
          <input
            type="number"
            class="text-input"
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
        );

      case "select":
        return (
          <select
            class="select-input"
            onChange={(e) =>
              this.handleConfigChange(
                field.name,
                (e.target as HTMLSelectElement).value,
              )
            }
          >
            {field.options?.map((option: any) => {
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
        );

      case "checkbox":
        return (
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) =>
                this.handleConfigChange(
                  field.name,
                  (e.target as HTMLInputElement).checked,
                )
              }
            />
            <span class="checkbox-text">{field.label}</span>
          </label>
        );

      case "color":
        return (
          <div class="color-input-wrapper">
            <input
              type="color"
              class="color-input"
              value={value}
              onInput={(e) =>
                this.handleConfigChange(
                  field.name,
                  (e.target as HTMLInputElement).value,
                )
              }
            />
            <span class="color-value">{value}</span>
          </div>
        );

      default:
        return <p class="field-error">Unknown field type: {field.type}</p>;
    }
  }
}
