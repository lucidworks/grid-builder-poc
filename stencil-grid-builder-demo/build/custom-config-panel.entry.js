import { r as registerInstance, h } from './index-CoCbyscT.js';
import { b as blogComponentDefinitions } from './component-definitions-ZVTe1Mmn.js';

const customConfigPanelCss = ".custom-config-panel{position:fixed;right:0;bottom:0;width:400px;max-width:90vw;max-height:80vh;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px 0 0 0;box-shadow:0 -4px 20px rgba(0, 0, 0, 0.15);display:flex;flex-direction:column;z-index:1000;transform:translateY(100%);transition:transform 0.3s ease-in-out;overflow:hidden}.custom-config-panel.panel-open{transform:translateY(0)}.custom-panel-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:rgba(255, 255, 255, 0.1);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255, 255, 255, 0.2)}.custom-panel-header .header-content{display:flex;align-items:center;gap:12px;color:#ffffff}.custom-panel-header .header-content .component-icon{font-size:24px;line-height:1}.custom-panel-header .header-content h2{margin:0;font-size:20px;font-weight:600;color:#ffffff}.custom-panel-header .close-btn{background:rgba(255, 255, 255, 0.2);border:none;color:#ffffff;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all 0.2s ease}.custom-panel-header .close-btn:hover{background:rgba(255, 255, 255, 0.3);transform:scale(1.1)}.custom-panel-header .close-btn:active{transform:scale(0.95)}.custom-panel-body{flex:1;overflow-y:auto;padding:24px;background:#ffffff}.custom-panel-body .config-section{margin-bottom:24px}.custom-panel-body .config-section:last-child{margin-bottom:0}.custom-panel-body .config-section .section-label{display:block;font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}.custom-panel-body .config-section.info-section{background:#f9fafb;border-radius:8px;padding:16px}.custom-panel-body .config-section.info-section .info-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e5e7eb}.custom-panel-body .config-section.info-section .info-row:last-child{border-bottom:none;padding-bottom:0}.custom-panel-body .config-section.info-section .info-row:first-child{padding-top:0}.custom-panel-body .config-section.info-section .info-row .info-label{font-size:13px;font-weight:500;color:#6b7280}.custom-panel-body .config-section.info-section .info-row .info-value{font-size:13px;color:#1f2937;font-family:\"Monaco\", \"Menlo\", monospace;background:#ffffff;padding:4px 8px;border-radius:4px}.custom-panel-body .config-field{margin-bottom:16px}.custom-panel-body .config-field:last-child{margin-bottom:0}.custom-panel-body .config-field .field-label{display:block;font-size:13px;font-weight:500;color:#4b5563;margin-bottom:6px}.custom-panel-body .text-input{width:100%;padding:10px 12px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;color:#1f2937;transition:all 0.2s ease}.custom-panel-body .text-input:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102, 126, 234, 0.1)}.custom-panel-body .text-input:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}.custom-panel-body .text-input::placeholder{color:#9ca3af}.custom-panel-body .textarea-input{width:100%;padding:10px 12px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;color:#1f2937;font-family:inherit;line-height:1.5;min-height:80px;resize:vertical;transition:all 0.2s ease}.custom-panel-body .textarea-input:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102, 126, 234, 0.1)}.custom-panel-body .textarea-input:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}.custom-panel-body .textarea-input::placeholder{color:#9ca3af}.custom-panel-body .select-input{width:100%;padding:10px 12px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;color:#1f2937;background:#ffffff;cursor:pointer;transition:all 0.2s ease}.custom-panel-body .select-input:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102, 126, 234, 0.1)}.custom-panel-body .checkbox-label{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none}.custom-panel-body .checkbox-label input[type=checkbox]{width:18px;height:18px;cursor:pointer;accent-color:#667eea}.custom-panel-body .checkbox-label .checkbox-text{font-size:14px;color:#4b5563}.custom-panel-body .color-input-wrapper{display:flex;align-items:center;gap:12px}.custom-panel-body .color-input-wrapper .color-input{width:60px;height:40px;border:2px solid #e5e7eb;border-radius:6px;cursor:pointer;transition:all 0.2s ease}.custom-panel-body .color-input-wrapper .color-input:hover{border-color:#667eea}.custom-panel-body .color-input-wrapper .color-value{font-size:13px;font-family:\"Monaco\", \"Menlo\", monospace;color:#6b7280;background:#f9fafb;padding:8px 12px;border-radius:4px}.custom-panel-body .no-config-message{text-align:center;color:#9ca3af;font-size:14px;padding:24px;margin:0}.custom-panel-body .field-error{color:#ef4444;font-size:13px;margin:0;padding:8px;background:#fef2f2;border-radius:4px}.custom-panel-footer{display:flex;gap:12px;padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb}.custom-panel-footer .btn{flex:1;padding:12px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease;text-transform:uppercase;letter-spacing:0.5px}.custom-panel-footer .btn:active{transform:translateY(1px)}.custom-panel-footer .btn.btn-secondary{background:#ffffff;color:#6b7280;border:2px solid #e5e7eb}.custom-panel-footer .btn.btn-secondary:hover{background:#f9fafb;border-color:#d1d5db}.custom-panel-footer .btn.btn-primary{background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:#ffffff;box-shadow:0 4px 6px rgba(102, 126, 234, 0.3)}.custom-panel-footer .btn.btn-primary:hover{box-shadow:0 6px 12px rgba(102, 126, 234, 0.4);transform:translateY(-2px)}.custom-panel-footer .btn.btn-primary:active{transform:translateY(0);box-shadow:0 2px 4px rgba(102, 126, 234, 0.3)}@media (max-width: 768px){.custom-config-panel{width:100%;max-width:100vw;max-height:70vh;border-radius:12px 12px 0 0}}";

const CustomConfigPanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
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
        this.componentName = "";
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
            console.log("🎨 custom-config-panel received itemRemoved event", {
                eventItemId: event.itemId,
                selectedItemId: this.selectedItemId,
                isOpen: this.isOpen,
            });
            // Close panel if the deleted item is the currently selected one
            if (this.isOpen &&
                this.selectedItemId &&
                event.itemId === this.selectedItemId) {
                console.log("  ✅ Custom panel: Closing because selected item was deleted");
                this.closePanel();
            }
        };
        /**
         * Handle item-click events from the document
         */
        this.handleItemClick = (event) => {
            console.log("🎨 custom-config-panel handleItemClick called", event.detail);
            // Ensure event subscription is set up (retry if it failed in componentDidLoad)
            this.ensureEventSubscription();
            const { itemId, canvasId } = event.detail;
            this.selectedItemId = itemId;
            this.selectedCanvasId = canvasId;
            // Get item from API
            const api = this.getAPI();
            console.log("  🔧 API exists:", !!api);
            const item = api === null || api === void 0 ? void 0 : api.getItem(itemId);
            console.log("  🔧 Item retrieved:", !!item, item);
            if (!item) {
                console.log("  ❌ No item found - exiting");
                return;
            }
            // Get component definition
            const definition = this.componentRegistry.get(item.type);
            console.log("  🔧 Definition found:", !!definition, definition === null || definition === void 0 ? void 0 : definition.name);
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
            console.log("  🚪 Opening panel - setting isOpen = true");
            this.isOpen = true;
            console.log("  ✅ Panel should now be open, isOpen =", this.isOpen);
        };
        /**
         * Close panel and revert changes
         */
        this.closePanel = () => {
            // Revert changes on cancel by restoring original state
            const api = this.getAPI();
            if (this.selectedItemId &&
                this.selectedCanvasId &&
                this.originalState &&
                api) {
                // Revert config changes
                api.updateConfig(this.selectedItemId, this.originalState.config);
                // Revert name changes
                const state = api.getState();
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const itemIndex = canvas.items.findIndex((i) => i.id === this.selectedItemId);
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
            this.componentName = "";
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
            this.componentName = "";
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
                    const itemIndex = canvas.items.findIndex((i) => i.id === this.selectedItemId);
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
        api.on("itemRemoved", this.handleItemRemoved);
        this.eventsSubscribed = true;
        console.log("  ✅ Custom panel: Subscribed to itemRemoved event");
    }
    /**
     * Watch for API prop changes
     */
    handleApiChange(newApi, oldApi) {
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
        console.log("🎨 custom-config-panel componentDidLoad - setting up component registry");
        const api = this.getAPI();
        console.log("  🔧 API status:", {
            apiExists: !!api,
            apiType: typeof api,
            fromProp: !!this.api,
            fromWindow: !!window.gridBuilderAPI,
        });
        // Build component registry from blog component definitions
        // This doesn't depend on the API being available
        this.componentRegistry = new Map(blogComponentDefinitions.map((def) => [def.type, def]));
        // Try to subscribe to events (will retry on first item click if API not ready)
        this.ensureEventSubscription();
        // Listen for item-click events
        // Note: Stencil's @Listen decorator doesn't work reliably for custom events on document
        // so we use manual event listeners instead
        document.addEventListener("item-click", this.handleItemClick);
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
        document.removeEventListener("item-click", this.handleItemClick);
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
            "custom-config-panel": true,
            "panel-open": this.isOpen,
        };
        return (h("div", { class: panelClasses }, h("div", { class: "custom-panel-header" }, h("div", { class: "header-content" }, h("span", { class: "component-icon" }, definition.icon), h("h2", null, "Edit Component")), h("button", { class: "close-btn", onClick: () => this.closePanel(), title: "Close" }, "\u2715")), h("div", { class: "custom-panel-body" }, h("div", { class: "config-section" }, h("label", { class: "section-label" }, "Component Name"), h("input", { type: "text", class: "text-input", value: this.componentName, placeholder: "Enter component name", onInput: (e) => this.handleNameChange(e) })), h("div", { class: "config-section info-section" }, h("div", { class: "info-row" }, h("span", { class: "info-label" }, "Type:"), h("span", { class: "info-value" }, definition.name)), h("div", { class: "info-row" }, h("span", { class: "info-label" }, "ID:"), h("span", { class: "info-value" }, item.id))), definition.configSchema && definition.configSchema.length > 0 ? (h("div", { class: "config-section" }, h("label", { class: "section-label" }, "Configuration"), definition.configSchema.map((field) => (h("div", { class: "config-field", key: field.name }, h("label", { class: "field-label" }, field.label), this.renderConfigField(field)))))) : (h("div", { class: "config-section" }, h("p", { class: "no-config-message" }, "No configuration options available for this component.")))), h("div", { class: "custom-panel-footer" }, h("button", { class: "btn btn-secondary", onClick: () => this.closePanel() }, "Cancel"), h("button", { class: "btn btn-primary", onClick: () => this.saveConfig() }, "Save Changes"))));
    }
    /**
     * Render a single config field
     */
    renderConfigField(field) {
        var _a, _b, _c;
        const value = (_b = (_a = this.componentConfig[field.name]) !== null && _a !== void 0 ? _a : field.defaultValue) !== null && _b !== void 0 ? _b : "";
        switch (field.type) {
            case "text":
                return (h("input", { type: "text", class: "text-input", value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value), placeholder: field.placeholder }));
            case "textarea":
                return (h("textarea", { class: "textarea-input", value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value), placeholder: field.placeholder, rows: field.rows || 3 }));
            case "number":
                return (h("input", { type: "number", class: "text-input", value: value, onInput: (e) => this.handleConfigChange(field.name, Number(e.target.value)), min: field.min, max: field.max, step: field.step }));
            case "select":
                return (h("select", { class: "select-input", onChange: (e) => this.handleConfigChange(field.name, e.target.value) }, (_c = field.options) === null || _c === void 0 ? void 0 : _c.map((option) => {
                    const optionValue = typeof option === "string" ? option : option.value;
                    const optionLabel = typeof option === "string" ? option : option.label;
                    return (h("option", { key: optionValue, value: optionValue, selected: value === optionValue }, optionLabel));
                })));
            case "checkbox":
                return (h("label", { class: "checkbox-label" }, h("input", { type: "checkbox", checked: !!value, onChange: (e) => this.handleConfigChange(field.name, e.target.checked) }), h("span", { class: "checkbox-text" }, field.label)));
            case "color":
                return (h("div", { class: "color-input-wrapper" }, h("input", { type: "color", class: "color-input", value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value) }), h("span", { class: "color-value" }, value)));
            default:
                return h("p", { class: "field-error" }, "Unknown field type: ", field.type);
        }
    }
    static get watchers() { return {
        "api": ["handleApiChange"]
    }; }
};
CustomConfigPanel.style = customConfigPanelCss;

export { CustomConfigPanel as custom_config_panel };
//# sourceMappingURL=custom-config-panel.entry.esm.js.map
