import { r as registerInstance, h } from './index-ebe9feb4.js';
import { c as componentTemplates } from './component-templates-e71f1a8f.js';
import { s as state } from './state-manager-b0e7f282.js';
import './index-28d0c3f6.js';

const configPanelCss = "config-panel .config-panel{position:fixed;z-index:1050;top:0;right:-400px;display:flex;width:400px;height:100vh;flex-direction:column;background:white;box-shadow:-2px 0 8px rgba(0, 0, 0, 0.15);transition:right 0.3s ease}config-panel .config-panel.open{right:0}config-panel .config-panel-header{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid #dee2e6}config-panel .config-panel-header h2{margin:0;color:#212529;font-size:18px}config-panel .config-panel-close{display:flex;width:32px;height:32px;align-items:center;justify-content:center;padding:0;border:none;border-radius:4px;background:transparent;color:#6c757d;cursor:pointer;font-size:28px;transition:all 0.2s ease}config-panel .config-panel-close:hover{background:#f8f9fa;color:#212529}config-panel .config-panel-body{flex:1;padding:20px;overflow-y:auto}config-panel .config-field{margin-bottom:20px}config-panel .config-field label{display:block;margin-bottom:8px;color:#212529;font-size:14px;font-weight:600}config-panel .config-field input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #dee2e6;border-radius:4px;font-size:14px;transition:border-color 0.2s ease}config-panel .config-field input:focus{border-color:#4a90e2;outline:none}config-panel .z-index-controls{display:grid;gap:8px;grid-template-columns:1fr 1fr}config-panel .z-index-btn{padding:10px 12px;border:1px solid #dee2e6;border-radius:4px;background:white;cursor:pointer;font-size:13px;font-weight:500;text-align:center;transition:all 0.2s ease}config-panel .z-index-btn:hover{border-color:#4a90e2;background:#f8f9fa;color:#4a90e2}config-panel .config-panel-footer{display:flex;justify-content:flex-end;padding:20px;border-top:1px solid #dee2e6;gap:10px}config-panel .config-panel-footer button{padding:10px 20px;border:1px solid #dee2e6;border-radius:4px;background:white;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.2s ease}config-panel .config-panel-footer button:hover{background:#f8f9fa}config-panel .config-panel-footer button.primary{border-color:#4a90e2;background:#4a90e2;color:white}config-panel .config-panel-footer button.primary:hover{border-color:#357abd;background:#357abd}";

const ConfigPanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        // Store original state for cancel functionality
        this.originalState = null;
        this.openPanel = (itemId, canvasId) => {
            this.selectedItemId = itemId;
            this.selectedCanvasId = canvasId;
            // Get item from state
            const canvas = state.canvases[canvasId];
            const item = canvas === null || canvas === void 0 ? void 0 : canvas.items.find((i) => i.id === itemId);
            if (!item) {
                return;
            }
            // Save original state for cancel functionality
            const template = componentTemplates[item.type];
            this.originalState = {
                name: item.name || template.title,
                zIndex: item.zIndex,
            };
            // Populate form
            this.componentName = this.originalState.name;
            // Update selection in state
            state.selectedItemId = itemId;
            state.selectedCanvasId = canvasId;
            // Open panel
            this.isOpen = true;
        };
        this.closePanel = () => {
            // Revert changes on cancel
            if (this.selectedItemId && this.selectedCanvasId && this.originalState) {
                const canvas = state.canvases[this.selectedCanvasId];
                const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
                if (itemIndex !== undefined && itemIndex !== -1) {
                    // Create new item reference to restore original state
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { name: this.originalState.name, zIndex: this.originalState.zIndex });
                    state.canvases = Object.assign({}, state.canvases); // Trigger update
                }
            }
            this.isOpen = false;
            // Don't clear selection - let it persist for keyboard shortcuts
            // gridState.selectedItemId = null;
            // gridState.selectedCanvasId = null;
            // Clear component state
            this.selectedItemId = null;
            this.selectedCanvasId = null;
            this.componentName = '';
            this.originalState = null;
        };
        this.saveConfig = () => {
            // Changes are already applied live, so just close without reverting
            this.isOpen = false;
            // Don't clear selection - let it persist for keyboard shortcuts
            // gridState.selectedItemId = null;
            // gridState.selectedCanvasId = null;
            // Clear component state
            this.selectedItemId = null;
            this.selectedCanvasId = null;
            this.componentName = '';
            this.originalState = null;
        };
        this.bringToFront = () => {
            if (!this.selectedItemId || !this.selectedCanvasId) {
                return;
            }
            const canvas = state.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1) {
                return;
            }
            // Increment canvas z-index counter and assign to item
            const newZIndex = ++canvas.zIndexCounter;
            canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { zIndex: newZIndex });
            state.canvases = Object.assign({}, state.canvases); // Trigger update
        };
        this.bringForward = () => {
            if (!this.selectedItemId || !this.selectedCanvasId) {
                return;
            }
            const canvas = state.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1) {
                return;
            }
            const item = canvas.items[itemIndex];
            // Find items with z-index greater than current
            const itemsAbove = canvas.items.filter((i) => i.zIndex > item.zIndex);
            if (itemsAbove.length > 0) {
                // Get the lowest z-index above this item
                const nextZIndex = Math.min(...itemsAbove.map((i) => i.zIndex));
                // Swap z-indexes
                const itemAboveIndex = canvas.items.findIndex((i) => i.zIndex === nextZIndex);
                if (itemAboveIndex !== -1) {
                    const temp = item.zIndex;
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, item), { zIndex: nextZIndex });
                    canvas.items[itemAboveIndex] = Object.assign(Object.assign({}, canvas.items[itemAboveIndex]), { zIndex: temp });
                    state.canvases = Object.assign({}, state.canvases); // Trigger update
                }
            }
        };
        this.sendBackward = () => {
            if (!this.selectedItemId || !this.selectedCanvasId) {
                return;
            }
            const canvas = state.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1) {
                return;
            }
            const item = canvas.items[itemIndex];
            // Find items with z-index less than current
            const itemsBelow = canvas.items.filter((i) => i.zIndex < item.zIndex);
            if (itemsBelow.length > 0) {
                // Get the highest z-index below this item
                const prevZIndex = Math.max(...itemsBelow.map((i) => i.zIndex));
                // Swap z-indexes
                const itemBelowIndex = canvas.items.findIndex((i) => i.zIndex === prevZIndex);
                if (itemBelowIndex !== -1) {
                    const temp = item.zIndex;
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, item), { zIndex: prevZIndex });
                    canvas.items[itemBelowIndex] = Object.assign(Object.assign({}, canvas.items[itemBelowIndex]), { zIndex: temp });
                    state.canvases = Object.assign({}, state.canvases); // Trigger update
                }
            }
        };
        this.sendToBack = () => {
            if (!this.selectedItemId || !this.selectedCanvasId) {
                return;
            }
            const canvas = state.canvases[this.selectedCanvasId];
            const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
            if (itemIndex === undefined || itemIndex === -1) {
                return;
            }
            // Find the lowest z-index
            const minZIndex = Math.min(...canvas.items.map((i) => i.zIndex));
            const newZIndex = Math.max(1, minZIndex - 1);
            // If the item is already at the back, reorder all z-indexes
            if (minZIndex <= 1) {
                // Sort items by current z-index
                const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);
                // Reassign z-indexes starting from 1, with this item first
                canvas.items = sortedItems.map((itm, index) => (Object.assign(Object.assign({}, itm), { zIndex: itm.id === this.selectedItemId ? 1 : index + 2 })));
            }
            else {
                canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { zIndex: newZIndex });
            }
            state.canvases = Object.assign({}, state.canvases); // Trigger update
        };
        this.handleNameInput = (e) => {
            const target = e.target;
            this.componentName = target.value;
            // Apply changes immediately (live preview)
            if (this.selectedItemId && this.selectedCanvasId) {
                const canvas = state.canvases[this.selectedCanvasId];
                const itemIndex = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.selectedItemId);
                if (itemIndex !== undefined && itemIndex !== -1) {
                    // Create new item reference for Stencil to detect change
                    canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { name: this.componentName });
                    state.canvases = Object.assign({}, state.canvases); // Trigger update
                }
            }
        };
        this.isOpen = false;
        this.selectedItemId = null;
        this.selectedCanvasId = null;
        this.componentName = '';
    }
    handleItemClick(event) {
        const { itemId, canvasId } = event.detail;
        this.openPanel(itemId, canvasId);
    }
    render() {
        const panelClasses = {
            'config-panel': true,
            open: this.isOpen,
        };
        return (h("div", { class: panelClasses }, h("div", { class: "config-panel-header" }, h("h2", null, "Component Settings"), h("button", { class: "config-panel-close", onClick: () => this.closePanel() }, "\u00D7")), h("div", { class: "config-panel-body" }, h("div", { class: "config-field" }, h("label", { htmlFor: "componentName" }, "Component Name"), h("input", { type: "text", id: "componentName", value: this.componentName, onInput: (e) => this.handleNameInput(e), placeholder: "Enter component name" })), h("div", { class: "config-field" }, h("label", null, "Layer Order"), h("div", { class: "z-index-controls" }, h("button", { class: "z-index-btn", onClick: () => this.bringToFront(), title: "Bring to Front" }, "\u2B06\uFE0F To Front"), h("button", { class: "z-index-btn", onClick: () => this.bringForward(), title: "Bring Forward" }, "\u2191 Forward"), h("button", { class: "z-index-btn", onClick: () => this.sendBackward(), title: "Send Backward" }, "\u2193 Backward"), h("button", { class: "z-index-btn", onClick: () => this.sendToBack(), title: "Send to Back" }, "\u2B07\uFE0F To Back")))), h("div", { class: "config-panel-footer" }, h("button", { onClick: () => this.closePanel() }, "Cancel"), h("button", { class: "primary", onClick: () => this.saveConfig() }, "Save"))));
    }
};
ConfigPanel.style = configPanelCss;

export { ConfigPanel as config_panel };

//# sourceMappingURL=config-panel.entry.js.map