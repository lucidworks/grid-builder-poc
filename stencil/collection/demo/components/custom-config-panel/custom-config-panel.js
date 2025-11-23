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
import { h } from "@stencil/core";
import { blogComponentDefinitions } from "../../component-definitions";
export class CustomConfigPanel {
    constructor() {
        /**
         * Panel open/closed state
         */
        this.isOpen = false;
        /**
         * Currently selected item ID
         */
        this.selectedItemId = null;
        /**
         * Currently selected canvas ID
         */
        this.selectedCanvasId = null;
        /**
         * Component config (temporary edit state)
         */
        this.componentConfig = {};
        /**
         * Component name (temporary edit state)
         */
        this.componentName = '';
        /**
         * Original state for cancel functionality
         */
        this.originalState = null;
        /**
         * Component registry (from blog component definitions)
         */
        this.componentRegistry = new Map();
        /**
         * Flag to track if we've subscribed to events
         */
        this.eventsSubscribed = false;
        /**
         * Callback for itemRemoved event (stored for unsubscribe)
         */
        this.handleItemRemoved = (event) => {
            console.log('🎨 custom-config-panel received itemRemoved event', {
                eventItemId: event.itemId,
                selectedItemId: this.selectedItemId,
                isOpen: this.isOpen,
            });
            // Close panel if the deleted item is the currently selected one
            if (this.isOpen && this.selectedItemId && event.itemId === this.selectedItemId) {
                console.log('  ✅ Custom panel: Closing because selected item was deleted');
                this.closePanel();
            }
        };
        /**
         * Handle item-click events from the document
         */
        this.handleItemClick = (event) => {
            console.log('🎨 custom-config-panel handleItemClick called', event.detail);
            // Ensure event subscription is set up (retry if it failed in componentDidLoad)
            this.ensureEventSubscription();
            const { itemId, canvasId } = event.detail;
            this.selectedItemId = itemId;
            this.selectedCanvasId = canvasId;
            // Get item from API
            const api = this.getAPI();
            console.log('  🔧 API exists:', !!api);
            const item = api === null || api === void 0 ? void 0 : api.getItem(itemId);
            console.log('  🔧 Item retrieved:', !!item, item);
            if (!item) {
                console.log('  ❌ No item found - exiting');
                return;
            }
            // Get component definition
            const definition = this.componentRegistry.get(item.type);
            console.log('  🔧 Definition found:', !!definition, definition === null || definition === void 0 ? void 0 : definition.name);
            // Save original state for cancel functionality
            this.originalState = {
                name: item.name || (definition === null || definition === void 0 ? void 0 : definition.name) || item.type,
                zIndex: item.zIndex,
                config: item.config ? Object.assign({}, item.config) : {},
            };
            // Populate form
            this.componentName = this.originalState.name;
            this.componentConfig = Object.assign({}, this.originalState.config);
            // Open panel
            console.log('  🚪 Opening panel - setting isOpen = true');
            this.isOpen = true;
            console.log('  ✅ Panel should now be open, isOpen =', this.isOpen);
        };
        /**
         * Close panel and revert changes
         */
        this.closePanel = () => {
            // Revert changes on cancel by restoring original state
            const api = this.getAPI();
            if (this.selectedItemId && this.selectedCanvasId && this.originalState && api) {
                // Revert config changes
                api.updateConfig(this.selectedItemId, this.originalState.config);
                // Revert name changes
                const state = api.getState();
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const itemIndex = canvas.items.findIndex(i => i.id === this.selectedItemId);
                    if (itemIndex !== -1) {
                        canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { name: this.originalState.name });
                        // Trigger reactivity
                        state.canvases = Object.assign({}, state.canvases);
                        break;
                    }
                }
            }
            this.isOpen = false;
            this.selectedItemId = null;
            this.selectedCanvasId = null;
            this.componentName = '';
            this.componentConfig = {};
            this.originalState = null;
        };
        /**
         * Save config changes
         */
        this.saveConfig = () => {
            // Changes are already applied live, so just close without reverting
            this.isOpen = false;
            this.selectedItemId = null;
            this.selectedCanvasId = null;
            this.componentName = '';
            this.componentConfig = {};
            this.originalState = null;
        };
        /**
         * Handle component name change
         */
        this.handleNameChange = (event) => {
            const value = event.target.value;
            this.componentName = value;
            // Update the item name (live preview)
            const api = this.getAPI();
            if (this.selectedItemId && api) {
                // Get the full state to access canvases
                const state = api.getState();
                // Find and update the item across all canvases
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const itemIndex = canvas.items.findIndex(i => i.id === this.selectedItemId);
                    if (itemIndex !== -1) {
                        // Update the name property
                        canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { name: value });
                        // Trigger reactivity by reassigning canvases object
                        state.canvases = Object.assign({}, state.canvases);
                        break;
                    }
                }
            }
        };
        /**
         * Handle config field change
         */
        this.handleConfigChange = (fieldName, value) => {
            // Update local config state
            this.componentConfig = Object.assign(Object.assign({}, this.componentConfig), { [fieldName]: value });
            // Apply changes immediately (live preview) via API
            const api = this.getAPI();
            if (this.selectedItemId && api) {
                api.updateConfig(this.selectedItemId, this.componentConfig);
            }
        };
    }
    /**
     * Get API (from prop or window)
     */
    getAPI() {
        // Use prop if provided, otherwise try window
        return this.api || window.gridBuilderAPI || null;
    }
    /**
     * Ensure event subscription is set up (lazy initialization)
     */
    ensureEventSubscription() {
        if (this.eventsSubscribed) {
            return;
        }
        const api = this.getAPI();
        if (!api) {
            return; // API not ready yet, will try again later
        }
        // Subscribe to itemRemoved events via API
        api.on('itemRemoved', this.handleItemRemoved);
        this.eventsSubscribed = true;
        console.log('  ✅ Custom panel: Subscribed to itemRemoved event');
    }
    /**
     * Watch for API prop changes
     */
    handleApiChange(newApi, oldApi) {
        console.log('🎨 custom-config-panel API prop changed', {
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
        console.log('🎨 custom-config-panel componentDidLoad - setting up component registry');
        const api = this.getAPI();
        console.log('  🔧 API status:', {
            apiExists: !!api,
            apiType: typeof api,
            fromProp: !!this.api,
            fromWindow: !!window.gridBuilderAPI,
        });
        // Build component registry from blog component definitions
        // This doesn't depend on the API being available
        this.componentRegistry = new Map(blogComponentDefinitions.map(def => [def.type, def]));
        // Try to subscribe to events (will retry on first item click if API not ready)
        this.ensureEventSubscription();
        // Listen for item-click events
        // Note: Stencil's @Listen decorator doesn't work reliably for custom events on document
        // so we use manual event listeners instead
        document.addEventListener('item-click', this.handleItemClick);
        console.log('  ✅ Custom panel: Listening for item-click events');
    }
    disconnectedCallback() {
        console.log('🎨 custom-config-panel disconnectedCallback - cleaning up');
        // Unsubscribe from itemRemoved events
        const api = this.getAPI();
        if (api && this.eventsSubscribed) {
            api.off('itemRemoved', this.handleItemRemoved);
            this.eventsSubscribed = false;
        }
        // Remove item-click event listener
        document.removeEventListener('item-click', this.handleItemClick);
    }
    render() {
        if (!this.isOpen) {
            return null;
        }
        // Get item from API
        const api = this.getAPI();
        const item = api === null || api === void 0 ? void 0 : api.getItem(this.selectedItemId);
        if (!item) {
            return null;
        }
        const definition = this.componentRegistry.get(item.type);
        if (!definition) {
            return null;
        }
        const panelClasses = {
            'custom-config-panel': true,
            'panel-open': this.isOpen,
        };
        return (h("div", { class: panelClasses }, h("div", { class: "custom-panel-header" }, h("div", { class: "header-content" }, h("span", { class: "component-icon" }, definition.icon), h("h2", null, "Edit Component")), h("button", { class: "close-btn", onClick: () => this.closePanel(), title: "Close" }, "\u2715")), h("div", { class: "custom-panel-body" }, h("div", { class: "config-section" }, h("label", { class: "section-label" }, "Component Name"), h("input", { type: "text", class: "text-input", value: this.componentName, placeholder: "Enter component name", onInput: (e) => this.handleNameChange(e) })), h("div", { class: "config-section info-section" }, h("div", { class: "info-row" }, h("span", { class: "info-label" }, "Type:"), h("span", { class: "info-value" }, definition.name)), h("div", { class: "info-row" }, h("span", { class: "info-label" }, "ID:"), h("span", { class: "info-value" }, item.id))), definition.configSchema && definition.configSchema.length > 0 ? (h("div", { class: "config-section" }, h("label", { class: "section-label" }, "Configuration"), definition.configSchema.map((field) => (h("div", { class: "config-field", key: field.name }, h("label", { class: "field-label" }, field.label), this.renderConfigField(field)))))) : (h("div", { class: "config-section" }, h("p", { class: "no-config-message" }, "No configuration options available for this component.")))), h("div", { class: "custom-panel-footer" }, h("button", { class: "btn btn-secondary", onClick: () => this.closePanel() }, "Cancel"), h("button", { class: "btn btn-primary", onClick: () => this.saveConfig() }, "Save Changes"))));
    }
    /**
     * Render a single config field
     */
    renderConfigField(field) {
        var _a, _b, _c;
        const value = (_b = (_a = this.componentConfig[field.name]) !== null && _a !== void 0 ? _a : field.defaultValue) !== null && _b !== void 0 ? _b : '';
        switch (field.type) {
            case 'text':
            case 'textarea':
                return (h("input", { type: "text", class: "text-input", value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value), placeholder: field.placeholder }));
            case 'number':
                return (h("input", { type: "number", class: "text-input", value: value, onInput: (e) => this.handleConfigChange(field.name, Number(e.target.value)), min: field.min, max: field.max, step: field.step }));
            case 'select':
                return (h("select", { class: "select-input", onChange: (e) => this.handleConfigChange(field.name, e.target.value) }, (_c = field.options) === null || _c === void 0 ? void 0 : _c.map((option) => {
                    const optionValue = typeof option === 'string' ? option : option.value;
                    const optionLabel = typeof option === 'string' ? option : option.label;
                    return (h("option", { key: optionValue, value: optionValue, selected: value === optionValue }, optionLabel));
                })));
            case 'checkbox':
                return (h("label", { class: "checkbox-label" }, h("input", { type: "checkbox", checked: !!value, onChange: (e) => this.handleConfigChange(field.name, e.target.checked) }), h("span", { class: "checkbox-text" }, field.label)));
            case 'color':
                return (h("div", { class: "color-input-wrapper" }, h("input", { type: "color", class: "color-input", value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value) }), h("span", { class: "color-value" }, value)));
            default:
                return h("p", { class: "field-error" }, "Unknown field type: ", field.type);
        }
    }
    static get is() { return "custom-config-panel"; }
    static get originalStyleUrls() {
        return {
            "$": ["custom-config-panel.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["custom-config-panel.css"]
        };
    }
    static get properties() {
        return {
            "api": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "GridBuilderAPI",
                    "resolved": "GridBuilderAPI",
                    "references": {
                        "GridBuilderAPI": {
                            "location": "import",
                            "path": "../../../types/api",
                            "id": "src/types/api.ts::GridBuilderAPI"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Grid Builder API (accessed from window.gridBuilderAPI or passed as prop)\n\n**Source**: window.gridBuilderAPI (set by grid-builder component)\n**Purpose**: Access grid state and methods\n**Required**: Component won't work without valid API reference"
                },
                "getter": false,
                "setter": false
            }
        };
    }
    static get states() {
        return {
            "isOpen": {},
            "selectedItemId": {},
            "selectedCanvasId": {},
            "componentConfig": {},
            "componentName": {}
        };
    }
    static get watchers() {
        return [{
                "propName": "api",
                "methodName": "handleApiChange"
            }];
    }
}
//# sourceMappingURL=custom-config-panel.js.map
