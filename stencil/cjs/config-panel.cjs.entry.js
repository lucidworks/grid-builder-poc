'use strict';

var index = require('./index-DAu61QiP.js');
var eventManager = require('./event-manager-Zxtu6BvC.js');
var stateManager = require('./state-manager-qdr9_6qb.js');

const configPanelCss = "config-panel .config-panel{position:fixed;z-index:2000;top:0;right:-400px;display:flex;width:400px;height:100vh;flex-direction:column;background:white;box-shadow:-2px 0 8px rgba(0, 0, 0, 0.15);transition:right 0.3s ease}config-panel .config-panel.open{right:0}config-panel .config-panel-header{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid #ddd}config-panel .config-panel-header h2{margin:0;color:#333;font-size:18px}config-panel .config-panel-close{display:flex;width:32px;height:32px;align-items:center;justify-content:center;padding:0;border:none;border-radius:4px;background:transparent;color:#999;cursor:pointer;font-size:24px;transition:all 0.2s}config-panel .config-panel-close:hover{background:#f5f5f5;color:#333}config-panel .config-panel-body{flex:1;padding:20px;overflow-y:auto}config-panel .config-section{margin-bottom:24px}config-panel .config-section h3{margin:0 0 16px 0;color:#333;font-size:14px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase}config-panel .config-section .no-config{color:#999;font-size:13px;font-style:italic}config-panel .config-field{margin-bottom:20px}config-panel .config-field label{display:block;margin-bottom:8px;color:#333;font-size:13px;font-weight:600}config-panel .config-field input[type=text],config-panel .config-field input[type=number],config-panel .config-field input[type=color],config-panel .config-field select,config-panel .config-field textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;transition:border-color 0.2s}config-panel .config-field input[type=text]:focus,config-panel .config-field input[type=number]:focus,config-panel .config-field input[type=color]:focus,config-panel .config-field select:focus,config-panel .config-field textarea:focus{border-color:#4a90e2;outline:none}config-panel .config-field input[type=color]{height:40px;padding:4px}config-panel .config-field textarea{font-family:inherit;resize:vertical}config-panel .config-field.config-field-checkbox label{display:flex;align-items:center;cursor:pointer;gap:8px}config-panel .config-field.config-field-checkbox label input[type=checkbox]{width:auto;margin:0;cursor:pointer}config-panel .config-field .field-error{margin:4px 0 0 0;color:#f44;font-size:12px}config-panel .z-index-controls{display:grid;gap:8px;grid-template-columns:1fr 1fr}config-panel .z-index-btn{padding:10px 12px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px;font-weight:500;text-align:center;transition:all 0.2s}config-panel .z-index-btn:hover{border-color:#4a90e2;background:#f5f5f5;color:#4a90e2}config-panel .config-panel-footer{display:flex;justify-content:flex-end;padding:20px;border-top:1px solid #ddd;gap:10px}config-panel .config-panel-footer button{padding:10px 20px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s}config-panel .config-panel-footer button:hover{background:#f5f5f5}config-panel .config-panel-footer button.primary{border-color:#4a90e2;background:#4a90e2;color:white}config-panel .config-panel-footer button.primary:hover{border-color:#357abd;background:#357abd}";

const ConfigPanel = class {
    constructor(hostRef) {
        index.registerInstance(this, hostRef);
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
        this.componentName = '';
        /**
         * Component config (editable)
         */
        this.componentConfig = {};
        /**
         * Original state for cancel functionality
         */
        this.originalState = null;
        /**
         * Callback for componentDeleted event (stored for unsubscribe)
         */
        this.handleComponentDeleted = (event) => {
            console.log('🔔 config-panel received componentDeleted event', {
                eventItemId: event.itemId,
                selectedItemId: this.selectedItemId,
                isOpen: this.isOpen,
                shouldClose: this.isOpen && this.selectedItemId && event.itemId === this.selectedItemId,
            });
            // Close panel if the deleted item is the currently selected one
            if (this.isOpen && this.selectedItemId && event.itemId === this.selectedItemId) {
                console.log('  ✅ Closing panel because selected item was deleted');
                this.closePanel();
            }
            else {
                console.log('  ℹ️ Not closing panel - different item or panel already closed');
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
            stateManager.state.selectedItemId = itemId;
            stateManager.state.selectedCanvasId = canvasId;
            // Open panel
            this.isOpen = true;
        };
        /**
         * Close config panel (revert changes)
         */
        this.closePanel = () => {
            // Revert changes on cancel
            if (this.selectedItemId && this.selectedCanvasId && this.originalState) {
                const canvas = stateManager.state.canvases[this.selectedCanvasId];
                const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
                if (itemIndex !== undefined && itemIndex !== -1) {
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { name: this.originalState.name, zIndex: this.originalState.zIndex, config: this.originalState.config });
                    stateManager.state.canvases = Object.assign({}, stateManager.state.canvases);
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
         * Handle component name input
         */
        this.handleNameInput = (e) => {
            const target = e.target;
            this.componentName = target.value;
            // Apply changes immediately (live preview)
            if (this.selectedItemId && this.selectedCanvasId) {
                const canvas = stateManager.state.canvases[this.selectedCanvasId];
                const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
                if (itemIndex !== undefined && itemIndex !== -1) {
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { name: this.componentName });
                    stateManager.state.canvases = Object.assign({}, stateManager.state.canvases);
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
                const canvas = stateManager.state.canvases[this.selectedCanvasId];
                const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
                if (itemIndex !== undefined && itemIndex !== -1) {
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { config: this.componentConfig });
                    stateManager.state.canvases = Object.assign({}, stateManager.state.canvases);
                }
            }
        };
        /**
         * Z-index control methods
         */
        this.bringToFront = () => {
            if (!this.selectedItemId || !this.selectedCanvasId)
                return;
            const canvas = stateManager.state.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1)
                return;
            const newZIndex = ++canvas.zIndexCounter;
            canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { zIndex: newZIndex });
            stateManager.state.canvases = Object.assign({}, stateManager.state.canvases);
        };
        this.bringForward = () => {
            if (!this.selectedItemId || !this.selectedCanvasId)
                return;
            const canvas = stateManager.state.canvases[this.selectedCanvasId];
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
                    stateManager.state.canvases = Object.assign({}, stateManager.state.canvases);
                }
            }
        };
        this.sendBackward = () => {
            if (!this.selectedItemId || !this.selectedCanvasId)
                return;
            const canvas = stateManager.state.canvases[this.selectedCanvasId];
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
                    stateManager.state.canvases = Object.assign({}, stateManager.state.canvases);
                }
            }
        };
        this.sendToBack = () => {
            if (!this.selectedItemId || !this.selectedCanvasId)
                return;
            const canvas = stateManager.state.canvases[this.selectedCanvasId];
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
            stateManager.state.canvases = Object.assign({}, stateManager.state.canvases);
        };
    }
    /**
     * Listen for item-click events to open panel
     */
    handleItemClick(event) {
        const { itemId, canvasId } = event.detail;
        this.openPanel(itemId, canvasId);
    }
    /**
     * Component lifecycle: Subscribe to componentDeleted event
     */
    componentDidLoad() {
        console.log('📋 config-panel componentDidLoad - subscribing to componentDeleted event');
        // Subscribe to componentDeleted events to auto-close panel when selected item is deleted
        eventManager.eventManager.on('componentDeleted', this.handleComponentDeleted);
        console.log('  ✅ Subscribed to componentDeleted event');
    }
    /**
     * Component lifecycle: Cleanup event subscriptions
     */
    disconnectedCallback() {
        eventManager.eventManager.off('componentDeleted', this.handleComponentDeleted);
    }
    /**
     * Render component template
     */
    render() {
        var _a;
        const panelClasses = {
            'config-panel': true,
            open: this.isOpen,
        };
        // Get component definition for the selected item
        const item = this.getSelectedItem();
        const definition = item ? (_a = this.componentRegistry) === null || _a === void 0 ? void 0 : _a.get(item.type) : null;
        return (index.h("div", { key: '3e5fd83240ded1a4349bcac00d2b345247bda24e', class: panelClasses }, index.h("div", { key: 'ec8de14c8c645ed443f796a77171a73bda875cc8', class: "config-panel-header" }, index.h("h2", { key: 'a50de8dd21505b522538f750dc346458309001af' }, "Component Settings"), index.h("button", { key: '76f5f56a695324622c11efb3e268a669a7d9d09e', class: "config-panel-close", onClick: () => this.closePanel() }, "\u00D7")), index.h("div", { key: 'ef941c6b822cd87d3c6da816ee687c9e70eb9c87', class: "config-panel-body" }, index.h("div", { key: '2ae59b75f7c62ee63a45ed5fae178bc86a0a8072', class: "config-field" }, index.h("label", { key: '08a196eebe2e4865745fb77bd0d2fae095ef9eba', htmlFor: "componentName" }, "Component Name"), index.h("input", { key: '8743f004ba5e96e3933f6be73c99cf70211833bf', type: "text", id: "componentName", value: this.componentName, onInput: (e) => this.handleNameInput(e), placeholder: "Enter component name" })), definition && this.renderConfigFields(definition), index.h("div", { key: '08d641940c32f3ac449bd149dfacf257fcc92643', class: "config-field" }, index.h("label", { key: '726d3915434560ae1a4141eea18fdb0ea7182c85' }, "Layer Order"), index.h("div", { key: 'f12aaec6bb9ff048d5458cff44845f5c791e70f4', class: "z-index-controls" }, index.h("button", { key: 'c8d59929325b3234b543c7488dec3742c92075fe', class: "z-index-btn", onClick: () => this.bringToFront(), title: "Bring to Front" }, "\u2B06\uFE0F To Front"), index.h("button", { key: '86fc308f3d6468aa926ad6c6fe4c5b622cd01bed', class: "z-index-btn", onClick: () => this.bringForward(), title: "Bring Forward" }, "\u2191 Forward"), index.h("button", { key: '8737d359c67c5cf1c8980d9d2a2d26db41e6413f', class: "z-index-btn", onClick: () => this.sendBackward(), title: "Send Backward" }, "\u2193 Backward"), index.h("button", { key: 'db59b047a3c53c9fcfcb2e11079c9951bd76d783', class: "z-index-btn", onClick: () => this.sendToBack(), title: "Send to Back" }, "\u2B07\uFE0F To Back")))), index.h("div", { key: '740be28e6383bcd9a27d5e80a1df63f11fb584e0', class: "config-panel-footer" }, index.h("button", { key: '950fe10ad2bbeace92af640b908c936a3ef73d46', onClick: () => this.closePanel() }, "Cancel"), index.h("button", { key: 'ba3d4dcdfe20b53a7c3a32b9f4b5de075332fb2b', class: "primary", onClick: () => this.saveConfig() }, "Save"))));
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
            return (index.h("div", { class: "config-section" }, index.h("h3", null, "Component Configuration"), definition.configSchema.map((field) => this.renderConfigField(field))));
        }
        // No config available
        return (index.h("div", { class: "config-section" }, index.h("p", { class: "no-config" }, "No configuration options available for this component.")));
    }
    /**
     * Render a single config field from schema
     */
    renderConfigField(field) {
        var _a, _b, _c;
        const value = (_b = (_a = this.componentConfig[field.name]) !== null && _a !== void 0 ? _a : field.defaultValue) !== null && _b !== void 0 ? _b : '';
        switch (field.type) {
            case 'text':
                return (index.h("div", { class: "config-field", key: field.name }, index.h("label", { htmlFor: field.name }, field.label), index.h("input", { type: "text", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value), placeholder: field.placeholder })));
            case 'number':
                return (index.h("div", { class: "config-field", key: field.name }, index.h("label", { htmlFor: field.name }, field.label), index.h("input", { type: "number", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, Number(e.target.value)), min: field.min, max: field.max, step: field.step })));
            case 'select':
                return (index.h("div", { class: "config-field", key: field.name }, index.h("label", { htmlFor: field.name }, field.label), index.h("select", { id: field.name, onChange: (e) => this.handleConfigChange(field.name, e.target.value) }, (_c = field.options) === null || _c === void 0 ? void 0 : _c.map((option) => {
                    // Handle both string and object options
                    const optionValue = typeof option === 'string' ? option : option.value;
                    const optionLabel = typeof option === 'string' ? option : option.label;
                    return (index.h("option", { key: optionValue, value: optionValue, selected: value === optionValue }, optionLabel));
                }))));
            case 'checkbox':
                return (index.h("div", { class: "config-field config-field-checkbox", key: field.name }, index.h("label", { htmlFor: field.name }, index.h("input", { type: "checkbox", id: field.name, checked: !!value, onChange: (e) => this.handleConfigChange(field.name, e.target.checked) }), field.label)));
            case 'color':
                return (index.h("div", { class: "config-field", key: field.name }, index.h("label", { htmlFor: field.name }, field.label), index.h("input", { type: "color", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value) })));
            case 'textarea':
                return (index.h("div", { class: "config-field", key: field.name }, index.h("label", { htmlFor: field.name }, field.label), index.h("textarea", { id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value), placeholder: field.placeholder, rows: field.rows || 3 })));
            default:
                return (index.h("div", { class: "config-field", key: field.name }, index.h("label", null, field.label), index.h("p", { class: "field-error" }, "Unknown field type: ", field.type)));
        }
    }
    /**
     * Get selected item from state
     */
    getSelectedItem() {
        if (!this.selectedItemId || !this.selectedCanvasId) {
            return null;
        }
        const canvas = stateManager.state.canvases[this.selectedCanvasId];
        return canvas === null || canvas === void 0 ? void 0 : canvas.items.find((i) => i.id === this.selectedItemId);
    }
};
ConfigPanel.style = configPanelCss;

exports.config_panel = ConfigPanel;
//# sourceMappingURL=config-panel.entry.cjs.js.map
