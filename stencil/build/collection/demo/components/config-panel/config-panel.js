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
 *
 * @module config-panel
 */
import { h } from "@stencil/core";
// Internal imports
import { eventManager } from "../../../services/event-manager";
import { gridState } from "../../../services/state-manager";
/**
 * ConfigPanel Component
 * =====================
 *
 * Library component providing configuration panel with auto-generated and custom forms.
 *
 * **Tag**: `<config-panel>`
 * **Shadow DOM**: Disabled (for consistency with other components)
 */
export class ConfigPanel {
    constructor() {
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
        eventManager.on('componentDeleted', this.handleComponentDeleted);
        console.log('  ✅ Subscribed to componentDeleted event');
    }
    /**
     * Component lifecycle: Cleanup event subscriptions
     */
    disconnectedCallback() {
        eventManager.off('componentDeleted', this.handleComponentDeleted);
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
        return (h("div", { key: '52b2ecd551004067b06330ea5839785de02a8cd3', class: panelClasses }, h("div", { key: '661d6ba0066e7c656ea4ea74774bf457ab59d0e5', class: "config-panel-header" }, h("h2", { key: '1019f65d5458dc24e52a156cfe6769c0d1673314' }, "Component Settings"), h("button", { key: '6c5a7c5a333ae28552efd0d1a8018446b3dba951', class: "config-panel-close", onClick: () => this.closePanel() }, "\u00D7")), h("div", { key: '8f57fb76f0555c96fd35018d6222e889bc3b3898', class: "config-panel-body" }, h("div", { key: '4118aee32af74c90a2f166c36d701c825782810b', class: "config-field" }, h("label", { key: 'b936c28c7876bcd34b2685474a6fc73d005e7c06', htmlFor: "componentName" }, "Component Name"), h("input", { key: '7eb341db95aa1dff588e291e6b6b2debd56dc748', type: "text", id: "componentName", value: this.componentName, onInput: (e) => this.handleNameInput(e), placeholder: "Enter component name" })), definition && this.renderConfigFields(definition), h("div", { key: 'af76c8b525d70a8d1b2e6f3fa60635a959457d9d', class: "config-field" }, h("label", { key: '7116f72ebd474a052bf04b3ed115e4b0463ecac4' }, "Layer Order"), h("div", { key: 'b93caa73c1304cac3cfca6d58a52de0d53ac0890', class: "z-index-controls" }, h("button", { key: 'b0fd3ff3455069f539681a6a521248c8d0f6d0f0', class: "z-index-btn", onClick: () => this.bringToFront(), title: "Bring to Front" }, "\u2B06\uFE0F To Front"), h("button", { key: 'b0da4193c5ba400149014a3769fbe7eea8f06559', class: "z-index-btn", onClick: () => this.bringForward(), title: "Bring Forward" }, "\u2191 Forward"), h("button", { key: 'b6eda279841adb228be85c20ed662506fe2e7c84', class: "z-index-btn", onClick: () => this.sendBackward(), title: "Send Backward" }, "\u2193 Backward"), h("button", { key: '0135901b5bb6fc61b73047e4df894cda0c3f10dc', class: "z-index-btn", onClick: () => this.sendToBack(), title: "Send to Back" }, "\u2B07\uFE0F To Back")))), h("div", { key: '3d9afe05e042359a2c86257b62d43963da8a1902', class: "config-panel-footer" }, h("button", { key: 'eee93819521c968005ba70d1476a093323895c40', onClick: () => this.closePanel() }, "Cancel"), h("button", { key: 'f13b1c0cf2722a3b577f9728560837bc7b79e3c1', class: "primary", onClick: () => this.saveConfig() }, "Save"))));
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
        const value = (_b = (_a = this.componentConfig[field.name]) !== null && _a !== void 0 ? _a : field.defaultValue) !== null && _b !== void 0 ? _b : '';
        switch (field.type) {
            case 'text':
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("input", { type: "text", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value), placeholder: field.placeholder })));
            case 'number':
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("input", { type: "number", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, Number(e.target.value)), min: field.min, max: field.max, step: field.step })));
            case 'select':
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("select", { id: field.name, onChange: (e) => this.handleConfigChange(field.name, e.target.value) }, (_c = field.options) === null || _c === void 0 ? void 0 : _c.map((option) => {
                    // Handle both string and object options
                    const optionValue = typeof option === 'string' ? option : option.value;
                    const optionLabel = typeof option === 'string' ? option : option.label;
                    return (h("option", { key: optionValue, value: optionValue, selected: value === optionValue }, optionLabel));
                }))));
            case 'checkbox':
                return (h("div", { class: "config-field config-field-checkbox", key: field.name }, h("label", { htmlFor: field.name }, h("input", { type: "checkbox", id: field.name, checked: !!value, onChange: (e) => this.handleConfigChange(field.name, e.target.checked) }), field.label)));
            case 'color':
                return (h("div", { class: "config-field", key: field.name }, h("label", { htmlFor: field.name }, field.label), h("input", { type: "color", id: field.name, value: value, onInput: (e) => this.handleConfigChange(field.name, e.target.value) })));
            case 'textarea':
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
    static get is() { return "config-panel"; }
    static get originalStyleUrls() {
        return {
            "$": ["config-panel.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["config-panel.css"]
        };
    }
    static get properties() {
        return {
            "componentRegistry": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "Map<string, ComponentDefinition>",
                    "resolved": "Map<string, ComponentDefinition>",
                    "references": {
                        "Map": {
                            "location": "global",
                            "id": "global::Map"
                        },
                        "ComponentDefinition": {
                            "location": "import",
                            "path": "../../../types/component-definition",
                            "id": "src/types/component-definition.ts::ComponentDefinition"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Component registry (from parent grid-builder)\n\n**Source**: grid-builder component\n**Purpose**: Look up component definitions for config forms"
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
            "componentName": {},
            "componentConfig": {}
        };
    }
    static get listeners() {
        return [{
                "name": "item-click",
                "method": "handleItemClick",
                "target": "document",
                "capture": false,
                "passive": false
            }];
    }
}
//# sourceMappingURL=config-panel.js.map
