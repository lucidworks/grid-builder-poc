import { r as registerInstance, h } from './index-CoCbyscT.js';
import { g as gridState } from './state-manager-BtBFePO6.js';
import './debug-BAq8PPFJ.js';

const configPanelCss = "config-panel .config-panel{position:fixed;z-index:2000;top:0;right:-400px;display:flex;width:400px;height:100vh;flex-direction:column;background:white;box-shadow:-2px 0 8px rgba(0, 0, 0, 0.15);transition:right 0.3s ease}config-panel .config-panel.open{right:0}config-panel .config-panel-header{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid #ddd}config-panel .config-panel-header h2{margin:0;color:#333;font-size:18px}config-panel .config-panel-close{display:flex;width:32px;height:32px;align-items:center;justify-content:center;padding:0;border:none;border-radius:4px;background:transparent;color:#999;cursor:pointer;font-size:24px;transition:all 0.2s}config-panel .config-panel-close:hover{background:#f5f5f5;color:#333}config-panel .config-panel-body{flex:1;padding:20px;overflow-y:auto}config-panel .config-section{margin-bottom:24px}config-panel .config-section h3{margin:0 0 16px 0;color:#333;font-size:14px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase}config-panel .config-section .no-config{color:#999;font-size:13px;font-style:italic}config-panel .config-field{margin-bottom:20px}config-panel .config-field label{display:block;margin-bottom:8px;color:#333;font-size:13px;font-weight:600}config-panel .config-field input[type=text],config-panel .config-field input[type=number],config-panel .config-field input[type=color],config-panel .config-field select,config-panel .config-field textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;transition:border-color 0.2s}config-panel .config-field input[type=text]:focus,config-panel .config-field input[type=number]:focus,config-panel .config-field input[type=color]:focus,config-panel .config-field select:focus,config-panel .config-field textarea:focus{border-color:#4a90e2;outline:none}config-panel .config-field input[type=color]{height:40px;padding:4px}config-panel .config-field textarea{font-family:inherit;resize:vertical}config-panel .config-field.config-field-checkbox label{display:flex;align-items:center;cursor:pointer;gap:8px}config-panel .config-field.config-field-checkbox label input[type=checkbox]{width:auto;margin:0;cursor:pointer}config-panel .config-field .field-error{margin:4px 0 0 0;color:#f44;font-size:12px}config-panel .z-index-controls{display:grid;gap:8px;grid-template-columns:1fr 1fr}config-panel .z-index-btn{padding:10px 12px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px;font-weight:500;text-align:center;transition:all 0.2s}config-panel .z-index-btn:hover{border-color:#4a90e2;background:#f5f5f5;color:#4a90e2}config-panel .config-panel-footer{display:flex;justify-content:flex-end;padding:20px;border-top:1px solid #ddd;gap:10px}config-panel .config-panel-footer button{padding:10px 20px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s}config-panel .config-panel-footer button:hover{background:#f5f5f5}config-panel .config-panel-footer button.primary{border-color:#4a90e2;background:#4a90e2;color:white}config-panel .config-panel-footer button.primary:hover{border-color:#357abd;background:#357abd}";

const ConfigPanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Panel open state
         */
        this.isOpen = false;
        /**
         * Selected item ID
         */
        this.selectedItemId = null;
        /**
         * Selected canvas ID
         */
        this.selectedCanvasId = null;
        /**
         * Component name (editable)
         */
        this.componentName = "";
        /**
         * Component config (editable)
         */
        this.componentConfig = {};
        /**
         * Original state for cancel functionality
         */
        this.originalState = null;
        /**
         * Flag to track if we've subscribed to events
         */
        this.eventsSubscribed = false;
        /**
         * Callback for itemRemoved event (stored for unsubscribe)
         */
        this.handleItemRemoved = (event) => {
            console.log("🔔 config-panel received itemRemoved event", {
                eventItemId: event.itemId,
                selectedItemId: this.selectedItemId,
                isOpen: this.isOpen,
                shouldClose: this.isOpen &&
                    this.selectedItemId &&
                    event.itemId === this.selectedItemId,
            });
            // Close panel if the deleted item is the currently selected one
            if (this.isOpen &&
                this.selectedItemId &&
                event.itemId === this.selectedItemId) {
                console.log("  ✅ Closing panel because selected item was deleted");
                this.closePanel();
            }
            else {
                console.log("  ℹ️ Not closing panel - different item or panel already closed");
            }
        };
        /**
         * Open config panel for item
         */
        this.openPanel = (itemId, canvasId) => {
            var _a;
            this.selectedItemId = itemId;
            this.selectedCanvasId = canvasId;
            // Get item from state
            const item = this.getSelectedItem();
            if (!item) {
                return;
            }
            // Get component definition
            const definition = (_a = this.componentRegistry) === null || _a === void 0 ? void 0 : _a.get(item.type);
            // Save original state for cancel functionality
            this.originalState = {
                name: item.name || (definition === null || definition === void 0 ? void 0 : definition.name) || item.type,
                zIndex: item.zIndex,
                config: item.config ? Object.assign({}, item.config) : {},
            };
            // Populate form
            this.componentName = this.originalState.name;
            this.componentConfig = Object.assign({}, this.originalState.config);
            // Update selection in state
            gridState.selectedItemId = itemId;
            gridState.selectedCanvasId = canvasId;
            // Open panel
            this.isOpen = true;
        };
        /**
         * Close config panel (revert changes)
         */
        this.closePanel = () => {
            // Revert changes on cancel
            if (this.selectedItemId && this.selectedCanvasId && this.originalState) {
                const canvas = gridState.canvases[this.selectedCanvasId];
                const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
                if (itemIndex !== undefined && itemIndex !== -1) {
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { name: this.originalState.name, zIndex: this.originalState.zIndex, config: this.originalState.config });
                    gridState.canvases = Object.assign({}, gridState.canvases);
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
         * Handle component name input
         */
        this.handleNameInput = (e) => {
            const target = e.target;
            this.componentName = target.value;
            // Apply changes immediately (live preview)
            if (this.selectedItemId && this.selectedCanvasId) {
                const canvas = gridState.canvases[this.selectedCanvasId];
                const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
                if (itemIndex !== undefined && itemIndex !== -1) {
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { name: this.componentName });
                    gridState.canvases = Object.assign({}, gridState.canvases);
                }
            }
        };
        /**
         * Handle config field change
         */
        this.handleConfigChange = (fieldName, value) => {
            // Update local config state
            this.componentConfig = Object.assign(Object.assign({}, this.componentConfig), { [fieldName]: value });
            // Apply changes immediately (live preview)
            if (this.selectedItemId && this.selectedCanvasId) {
                const canvas = gridState.canvases[this.selectedCanvasId];
                const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
                if (itemIndex !== undefined && itemIndex !== -1) {
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { config: this.componentConfig });
                    gridState.canvases = Object.assign({}, gridState.canvases);
                }
            }
        };
        /**
         * Z-index control methods
         */
        this.bringToFront = () => {
            if (!this.selectedItemId || !this.selectedCanvasId)
                return;
            const canvas = gridState.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1)
                return;
            const newZIndex = ++canvas.zIndexCounter;
            canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { zIndex: newZIndex });
            gridState.canvases = Object.assign({}, gridState.canvases);
        };
        this.bringForward = () => {
            if (!this.selectedItemId || !this.selectedCanvasId)
                return;
            const canvas = gridState.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1)
                return;
            const item = canvas.items[itemIndex];
            const itemsAbove = canvas.items.filter((i) => i.zIndex > item.zIndex);
            if (itemsAbove.length > 0) {
                const nextZIndex = Math.min(...itemsAbove.map((i) => i.zIndex));
                const itemAboveIndex = canvas.items.findIndex((i) => i.zIndex === nextZIndex);
                if (itemAboveIndex !== -1) {
                    const temp = item.zIndex;
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, item), { zIndex: nextZIndex });
                    canvas.items[itemAboveIndex] = Object.assign(Object.assign({}, canvas.items[itemAboveIndex]), { zIndex: temp });
                    gridState.canvases = Object.assign({}, gridState.canvases);
                }
            }
        };
        this.sendBackward = () => {
            if (!this.selectedItemId || !this.selectedCanvasId)
                return;
            const canvas = gridState.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1)
                return;
            const item = canvas.items[itemIndex];
            const itemsBelow = canvas.items.filter((i) => i.zIndex < item.zIndex);
            if (itemsBelow.length > 0) {
                const prevZIndex = Math.max(...itemsBelow.map((i) => i.zIndex));
                const itemBelowIndex = canvas.items.findIndex((i) => i.zIndex === prevZIndex);
                if (itemBelowIndex !== -1) {
                    const temp = item.zIndex;
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, item), { zIndex: prevZIndex });
                    canvas.items[itemBelowIndex] = Object.assign(Object.assign({}, canvas.items[itemBelowIndex]), { zIndex: temp });
                    gridState.canvases = Object.assign({}, gridState.canvases);
                }
            }
        };
        this.sendToBack = () => {
            if (!this.selectedItemId || !this.selectedCanvasId)
                return;
            const canvas = gridState.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1)
                return;
            const minZIndex = Math.min(...canvas.items.map((i) => i.zIndex));
            const newZIndex = Math.max(1, minZIndex - 1);
            if (minZIndex <= 1) {
                const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);
                canvas.items = sortedItems.map((itm, index) => (Object.assign(Object.assign({}, itm), { zIndex: itm.id === this.selectedItemId ? 1 : index + 2 })));
            }
            else {
                canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { zIndex: newZIndex });
            }
            gridState.canvases = Object.assign({}, gridState.canvases);
        };
    }
    /**
     * Ensure event subscription is set up (lazy initialization)
     */
    ensureEventSubscription() {
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
    handleApiChange(newApi) {
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
    handleItemClick(event) {
        const { itemId, canvasId } = event.detail;
        this.openPanel(itemId, canvasId);
    }
    /**
     * Component lifecycle: Subscribe to itemRemoved event
     */
    componentDidLoad() {
        console.log("📋 config-panel componentDidLoad - subscribing to itemRemoved event");
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
        var _a;
        const panelClasses = {
            "config-panel": true,
            open: this.isOpen,
        };
        // Get component definition for the selected item
        const item = this.getSelectedItem();
        const definition = item ? (_a = this.componentRegistry) === null || _a === void 0 ? void 0 : _a.get(item.type) : null;
        return (h("div", { key: '90905625c28f4be4e5ca57d34b1c5d0777167b58', class: panelClasses }, h("div", { key: 'd97b748e5ba95ab2a7a92afa9eb876c54688e14f', class: "config-panel-header" }, h("h2", { key: '20d41fa8a9e000baaa707f8cc2a1c255ea65bd26' }, "Component Settings"), h("button", { key: '7a7d11aca051d3e80774535b63b4c6e1982c7503', class: "config-panel-close", onClick: () => this.closePanel() }, "\u00D7")), h("div", { key: '139ea33093c166139757ea89ef6c8a04a3c4fd97', class: "config-panel-body" }, h("div", { key: 'c0677b35a33c947a7c1b899e19df48138e50721a', class: "config-field" }, h("label", { key: '0d40350047b8ae11199bdc65fd1284fdb4dae348', htmlFor: "componentName" }, "Component Name"), h("input", { key: '5975c6d35c7106d5f211a301127314ebc2d90297', type: "text", id: "componentName", value: this.componentName, onInput: (e) => this.handleNameInput(e), placeholder: "Enter component name" })), definition && this.renderConfigFields(definition), h("div", { key: '51fa4e565c44fdc4f350f9fa01fd080bdd54e49a', class: "config-field" }, h("label", { key: '86e5bcb28704c57e09fba49e31c419641e4d1c87' }, "Layer Order"), h("div", { key: '9b7d4ba80d44920e66142d3f41da61abc266da18', class: "z-index-controls" }, h("button", { key: '44a2d89dc993ef4d487afebf82cf3484e386f747', class: "z-index-btn", onClick: () => this.bringToFront(), title: "Bring to Front" }, "\u2B06\uFE0F To Front"), h("button", { key: 'b4c39f0933b8d6c88b06d3783f2084461b934ebe', class: "z-index-btn", onClick: () => this.bringForward(), title: "Bring Forward" }, "\u2191 Forward"), h("button", { key: '07c6b15a55de78ec63584c8b6d37c722259a0659', class: "z-index-btn", onClick: () => this.sendBackward(), title: "Send Backward" }, "\u2193 Backward"), h("button", { key: '2a53bb77544d2051d60506e211f9762b286b88f9', class: "z-index-btn", onClick: () => this.sendToBack(), title: "Send to Back" }, "\u2B07\uFE0F To Back")))), h("div", { key: '34be3a477c24789c7c0f27ace99c47a6b3b1d1a4', class: "config-panel-footer" }, h("button", { key: '2163d71f19469457eb603a66594e900899789a69', onClick: () => this.closePanel() }, "Cancel"), h("button", { key: '8662e5791335c6b3a69e0510a559fce0371fc21a', class: "primary", onClick: () => this.saveConfig() }, "Save"))));
    }
    /**
     * Render config fields (custom or auto-generated)
     */
    renderConfigFields(definition) {
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
            return (h("div", { class: "config-section" }, h("h3", null, "Component Configuration"), definition.configSchema.map((field) => this.renderConfigField(field))));
        }
        // No config available
        return (h("div", { class: "config-section" }, h("p", { class: "no-config" }, "No configuration options available for this component.")));
    }
    /**
     * Render a single config field from schema
     */
    renderConfigField(field) {
        var _a, _b, _c;
        const value = (_b = (_a = this.componentConfig[field.name]) !== null && _a !== void 0 ? _a : field.defaultValue) !== null && _b !== void 0 ? _b : "";
        switch (field.type) {
            case "text":
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("input", { type: "text", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value), placeholder: field.placeholder })));
            case "number":
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("input", { type: "number", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, Number(e.target.value)), min: field.min, max: field.max, step: field.step })));
            case "select":
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("select", { id: field.name, onChange: (e) => this.handleConfigChange(field.name, e.target.value) }, (_c = field.options) === null || _c === void 0 ? void 0 : _c.map((option) => {
                    // Handle both string and object options
                    const optionValue = typeof option === "string" ? option : option.value;
                    const optionLabel = typeof option === "string" ? option : option.label;
                    return (h("option", { key: optionValue, value: optionValue, selected: value === optionValue }, optionLabel));
                }))));
            case "checkbox":
                return (h("div", { class: "config-field config-field-checkbox", key: field.name }, h("label", { htmlFor: field.name }, h("input", { type: "checkbox", id: field.name, checked: !!value, onChange: (e) => this.handleConfigChange(field.name, e.target.checked) }), field.label)));
            case "color":
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("input", { type: "color", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value) })));
            case "textarea":
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("textarea", { id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value), placeholder: field.placeholder, rows: field.rows || 3 })));
            default:
                return (h("div", { class: "config-field", key: field.name }, h("label", null, field.label), h("p", { class: "field-error" }, "Unknown field type: ", field.type)));
        }
    }
    /**
     * Get selected item from state
     */
    getSelectedItem() {
        if (!this.selectedItemId || !this.selectedCanvasId) {
            return null;
        }
        const canvas = gridState.canvases[this.selectedCanvasId];
        return canvas === null || canvas === void 0 ? void 0 : canvas.items.find((i) => i.id === this.selectedItemId);
    }
    static get watchers() { return {
        "api": ["handleApiChange"]
    }; }
};
ConfigPanel.style = configPanelCss;

export { ConfigPanel as config_panel };
//# sourceMappingURL=config-panel.entry.esm.js.map
