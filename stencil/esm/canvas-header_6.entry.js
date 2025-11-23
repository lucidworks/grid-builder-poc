import { r as registerInstance, c as createEvent, h, H as Host, a as getElement } from './index-CC73Dkup.js';
import { b as blogComponentDefinitions } from './component-definitions-B_TAa9Yi.js';
import { i as interact } from './interact.min-BKH_Whl_.js';
import { s as state, m as moveItemToCanvas, a as setActiveCanvas, b as updateItemsBatch, d as deleteItemsBatch, e as addItemsBatch, g as generateItemId, c as createStore } from './state-manager-BIPn53sA.js';
import { a as createDebugLogger, v as virtualRenderer, b as applyBoundaryConstraints, M as MoveItemCommand, u as undoRedo, d as undoRedoState, R as RemoveCanvasCommand, A as AddCanvasCommand, B as BatchUpdateConfigCommand, e as BatchDeleteCommand, f as BatchAddCommand, c as constrainPositionToCanvas, C as CANVAS_WIDTH_UNITS } from './boundary-constraints-C3OHvTXO.js';
import { e as eventManager } from './event-manager-C411GiWR.js';
import { p as pixelsToGridX, f as pixelsToGridY } from './grid-calculations-CcbD7Svb.js';

const canvasHeaderCss = ".canvas-header{position:relative;display:flex;align-items:center;justify-content:flex-end;padding:0;margin:0;gap:8px;}.canvas-header:not(:first-of-type){margin-top:var(--canvas-header-overlay-margin, -28px);}.canvas-header .canvas-title{display:inline-flex;align-items:center;padding:6px 12px;border-radius:4px;margin:0;background:#4a90e2;box-shadow:0 1px 3px rgba(74, 144, 226, 0.2);color:white;cursor:pointer;font-size:13px;font-weight:500;text-transform:none;transition:all 0.15s}.canvas-header .canvas-title:hover{background:#357abd;box-shadow:0 2px 6px rgba(74, 144, 226, 0.3)}.canvas-header .canvas-actions{display:flex;align-items:center;gap:6px}.canvas-header .canvas-actions .delete-canvas-btn{display:flex;width:28px;height:28px;align-items:center;justify-content:center;padding:0;border:1px solid #dee2e6;border-radius:4px;background:white;color:#dc3545;cursor:pointer;font-size:20px;font-weight:300;line-height:1;transition:all 0.15s}.canvas-header .canvas-actions .delete-canvas-btn:hover{border-color:#dc3545;background:rgba(220, 53, 69, 0.1);transform:scale(1.1)}.canvas-header .canvas-actions .delete-canvas-btn:active{transform:scale(1)}";

const CanvasHeader = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.headerClick = createEvent(this, "headerClick");
        this.deleteClick = createEvent(this, "deleteClick");
        /**
         * Whether this section can be deleted
         *
         * **Purpose**: Control delete button visibility
         * **Default**: true
         * **Note**: Default sections (hero, articles, footer) should set to false
         */
        this.isDeletable = true;
        /**
         * Handle title click
         */
        this.handleTitleClick = () => {
            this.headerClick.emit({ canvasId: this.canvasId });
        };
        /**
         * Handle delete button click
         */
        this.handleDeleteClick = () => {
            this.deleteClick.emit({ canvasId: this.canvasId });
        };
    }
    /**
     * Render component template
     */
    render() {
        return (h("div", { key: 'c44e288f10ce16098fe519cbc4354254cb110012', class: "canvas-header", "data-canvas-id": this.canvasId }, h("div", { key: '73701d3d053fead4e623db300a10abeda0e1b513', class: "canvas-actions" }, h("span", { key: '031ebb4279bfe6b5aed68b486a3fe2295fdf54f9', class: "canvas-title", onClick: this.handleTitleClick }, this.sectionTitle), this.isDeletable && (h("button", { key: 'e6399922d59ff07d03a32c0ecb61b89886b49240', class: "delete-canvas-btn", title: "Delete this section", onClick: this.handleDeleteClick }, "\u00D7")))));
    }
};
CanvasHeader.style = canvasHeaderCss;

const confirmationModalCss = "confirmation-modal .confirmation-overlay{position:fixed;z-index:10000;top:0;right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease-out;background:rgba(0, 0, 0, 0.5)}confirmation-modal .confirmation-modal{width:90%;max-width:400px;border-radius:8px;animation:slideUp 0.2s ease-out;background:white;box-shadow:0 4px 20px rgba(0, 0, 0, 0.15)}confirmation-modal .modal-header{padding:20px 24px;border-bottom:1px solid #e9ecef}confirmation-modal .modal-header .modal-title{margin:0;color:#212529;font-size:18px;font-weight:600}confirmation-modal .modal-body{padding:24px}confirmation-modal .modal-body .modal-message{margin:0;color:#495057;font-size:14px;line-height:1.5}confirmation-modal .modal-footer{display:flex;justify-content:flex-end;padding:16px 24px;border-top:1px solid #e9ecef;gap:12px}confirmation-modal .modal-footer button{padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.15s}confirmation-modal .modal-footer button.cancel-btn{background:#f8f9fa;color:#495057}confirmation-modal .modal-footer button.cancel-btn:hover{background:#e9ecef}confirmation-modal .modal-footer button.confirm-btn{background:#dc3545;color:white}confirmation-modal .modal-footer button.confirm-btn:hover{background:#c82333}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}";

const ConfirmationModal = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.confirm = createEvent(this, "confirm");
        this.cancel = createEvent(this, "cancel");
        /**
         * Modal open/closed state
         * Controlled by parent component (blog-app)
         */
        this.isOpen = false;
        /**
         * Modal content (title and message)
         * Passed from parent when showing confirmation
         */
        this.data = null;
        /**
         * Handle Confirm Button Click
         * ----------------------------
         * Fires confirm event → Parent resolves Promise(true) → Library deletes component
         */
        this.handleConfirm = () => {
            this.confirm.emit();
        };
        /**
         * Handle Cancel Button Click
         * ---------------------------
         * Fires cancel event → Parent resolves Promise(false) → Library cancels deletion
         */
        this.handleCancel = () => {
            this.cancel.emit();
        };
    }
    render() {
        if (!this.isOpen || !this.data) {
            return null;
        }
        return (h("div", { class: "confirmation-overlay", onClick: this.handleCancel }, h("div", { class: "confirmation-modal", onClick: (e) => e.stopPropagation() }, h("div", { class: "modal-header" }, h("h2", { class: "modal-title" }, this.data.title)), h("div", { class: "modal-body" }, h("p", { class: "modal-message" }, this.data.message)), h("div", { class: "modal-footer" }, h("button", { class: "cancel-btn", onClick: this.handleCancel }, "Cancel"), h("button", { class: "confirm-btn", onClick: this.handleConfirm }, "Delete")))));
    }
};
ConfirmationModal.style = confirmationModalCss;

const customConfigPanelCss = ".custom-config-panel{position:fixed;right:0;bottom:0;width:400px;max-width:90vw;max-height:80vh;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px 0 0 0;box-shadow:0 -4px 20px rgba(0, 0, 0, 0.15);display:flex;flex-direction:column;z-index:1000;transform:translateY(100%);transition:transform 0.3s ease-in-out;overflow:hidden}.custom-config-panel.panel-open{transform:translateY(0)}.custom-panel-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:rgba(255, 255, 255, 0.1);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255, 255, 255, 0.2)}.custom-panel-header .header-content{display:flex;align-items:center;gap:12px;color:#ffffff}.custom-panel-header .header-content .component-icon{font-size:24px;line-height:1}.custom-panel-header .header-content h2{margin:0;font-size:20px;font-weight:600;color:#ffffff}.custom-panel-header .close-btn{background:rgba(255, 255, 255, 0.2);border:none;color:#ffffff;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all 0.2s ease}.custom-panel-header .close-btn:hover{background:rgba(255, 255, 255, 0.3);transform:scale(1.1)}.custom-panel-header .close-btn:active{transform:scale(0.95)}.custom-panel-body{flex:1;overflow-y:auto;padding:24px;background:#ffffff}.custom-panel-body .config-section{margin-bottom:24px}.custom-panel-body .config-section:last-child{margin-bottom:0}.custom-panel-body .config-section .section-label{display:block;font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}.custom-panel-body .config-section.info-section{background:#f9fafb;border-radius:8px;padding:16px}.custom-panel-body .config-section.info-section .info-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e5e7eb}.custom-panel-body .config-section.info-section .info-row:last-child{border-bottom:none;padding-bottom:0}.custom-panel-body .config-section.info-section .info-row:first-child{padding-top:0}.custom-panel-body .config-section.info-section .info-row .info-label{font-size:13px;font-weight:500;color:#6b7280}.custom-panel-body .config-section.info-section .info-row .info-value{font-size:13px;color:#1f2937;font-family:\"Monaco\", \"Menlo\", monospace;background:#ffffff;padding:4px 8px;border-radius:4px}.custom-panel-body .config-field{margin-bottom:16px}.custom-panel-body .config-field:last-child{margin-bottom:0}.custom-panel-body .config-field .field-label{display:block;font-size:13px;font-weight:500;color:#4b5563;margin-bottom:6px}.custom-panel-body .text-input{width:100%;padding:10px 12px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;color:#1f2937;transition:all 0.2s ease}.custom-panel-body .text-input:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102, 126, 234, 0.1)}.custom-panel-body .text-input:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}.custom-panel-body .text-input::placeholder{color:#9ca3af}.custom-panel-body .select-input{width:100%;padding:10px 12px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;color:#1f2937;background:#ffffff;cursor:pointer;transition:all 0.2s ease}.custom-panel-body .select-input:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102, 126, 234, 0.1)}.custom-panel-body .checkbox-label{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none}.custom-panel-body .checkbox-label input[type=checkbox]{width:18px;height:18px;cursor:pointer;accent-color:#667eea}.custom-panel-body .checkbox-label .checkbox-text{font-size:14px;color:#4b5563}.custom-panel-body .color-input-wrapper{display:flex;align-items:center;gap:12px}.custom-panel-body .color-input-wrapper .color-input{width:60px;height:40px;border:2px solid #e5e7eb;border-radius:6px;cursor:pointer;transition:all 0.2s ease}.custom-panel-body .color-input-wrapper .color-input:hover{border-color:#667eea}.custom-panel-body .color-input-wrapper .color-value{font-size:13px;font-family:\"Monaco\", \"Menlo\", monospace;color:#6b7280;background:#f9fafb;padding:8px 12px;border-radius:4px}.custom-panel-body .no-config-message{text-align:center;color:#9ca3af;font-size:14px;padding:24px;margin:0}.custom-panel-body .field-error{color:#ef4444;font-size:13px;margin:0;padding:8px;background:#fef2f2;border-radius:4px}.custom-panel-footer{display:flex;gap:12px;padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb}.custom-panel-footer .btn{flex:1;padding:12px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease;text-transform:uppercase;letter-spacing:0.5px}.custom-panel-footer .btn:active{transform:translateY(1px)}.custom-panel-footer .btn.btn-secondary{background:#ffffff;color:#6b7280;border:2px solid #e5e7eb}.custom-panel-footer .btn.btn-secondary:hover{background:#f9fafb;border-color:#d1d5db}.custom-panel-footer .btn.btn-primary{background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:#ffffff;box-shadow:0 4px 6px rgba(102, 126, 234, 0.3)}.custom-panel-footer .btn.btn-primary:hover{box-shadow:0 6px 12px rgba(102, 126, 234, 0.4);transform:translateY(-2px)}.custom-panel-footer .btn.btn-primary:active{transform:translateY(0);box-shadow:0 2px 4px rgba(102, 126, 234, 0.3)}@media (max-width: 768px){.custom-config-panel{width:100%;max-width:100vw;max-height:70vh;border-radius:12px 12px 0 0}}";

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
    static get watchers() { return {
        "api": ["handleApiChange"]
    }; }
};
CustomConfigPanel.style = customConfigPanelCss;

const gridBuilderCss = ":host{--grid-builder-primary-color:#007bff;--grid-builder-palette-bg:#f5f5f5;--grid-builder-canvas-bg:#ffffff;--grid-builder-grid-line-color:rgba(0, 0, 0, 0.1);--grid-builder-selection-color:#007bff;--grid-builder-resize-handle-color:#007bff;--grid-builder-font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\",\n    \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif;display:block;width:100%;height:100%;font-family:var(--grid-builder-font-family)}.grid-builder-container{position:relative;display:flex;width:100%;height:100%}.palette-area{width:250px;flex-shrink:0;border-right:1px solid #ddd;background:var(--grid-builder-palette-bg);overflow-y:auto}.canvas-area{position:relative;flex:1;background:var(--grid-builder-canvas-bg);overflow-y:auto}.canvases-container{display:flex;flex-direction:column;min-height:100%;gap:0;}.config-area{position:fixed;z-index:1000;right:0;bottom:0;display:none;width:350px;max-height:60%;border:1px solid #ddd;border-radius:8px 8px 0 0;background:white;box-shadow:0 -2px 10px rgba(0, 0, 0, 0.1)}.config-area.visible{display:block}";

const debug$1 = createDebugLogger('grid-builder');
const GridBuilder = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Custom API exposure configuration
         *
         * **Optional prop**: Control where and how the Grid Builder API is exposed
         * **Default**: `{ target: window, key: 'gridBuilderAPI' }`
         * **Purpose**: Allows multiple grid-builder instances and flexible API access patterns
         *
         * **Options**:
         * 1. **Custom key on window** (multiple instances):
         * ```typescript
         * <grid-builder api-ref={{ key: 'gridAPI1' }}></grid-builder>
         * <grid-builder api-ref={{ key: 'gridAPI2' }}></grid-builder>
         * // Access: window.gridAPI1, window.gridAPI2
         * ```
         *
         * 2. **Custom storage object**:
         * ```typescript
         * const myStore = {};
         * <grid-builder api-ref={{ target: myStore, key: 'api' }}></grid-builder>
         * // Access: myStore.api
         * ```
         *
         * 3. **Disable automatic exposure** (use ref instead):
         * ```typescript
         * <grid-builder api-ref={null}></grid-builder>
         * // Access via ref: <grid-builder ref={el => this.api = el?.api}></grid-builder>
         * ```
         */
        this.apiRef = { target: undefined, key: 'gridBuilderAPI' };
        /**
         * Component registry (internal state)
         *
         * **Purpose**: Map component type → definition for lookup
         * **Built from**: components prop
         * **Used by**: grid-item-wrapper for dynamic rendering
         *
         * **Structure**: `{ 'header': ComponentDefinition, 'text': ComponentDefinition, ... }`
         */
        this.componentRegistry = new Map();
        /**
         * Initialized plugins (internal state)
         *
         * **Purpose**: Track plugin instances for cleanup
         * **Lifecycle**: Set in componentDidLoad, cleared in disconnectedCallback
         */
        this.initializedPlugins = [];
        /**
         * Setup ResizeObserver for container-based viewport switching
         *
         * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
         * **Breakpoint**: 768px (container width, not window viewport)
         *
         * **Observer callback**:
         * 1. Get container width from ResizeObserver entry
         * 2. Determine target viewport (mobile if < 768px, desktop otherwise)
         * 3. Update gridState.currentViewport if changed
         *
         * **Why container-based**:
         * - More flexible than window.resize (e.g., sidebar layouts, embedded widgets)
         * - Grid-builder can be embedded at any size
         * - Multiple instances can have different viewports on same page
         *
         * **Debouncing**: Not needed - ResizeObserver is already efficient
         */
        this.setupViewportResizeObserver = () => {
            if (!this.hostElement) {
                return;
            }
            // Watch for grid-builder container size changes
            this.viewportResizeObserver = new ResizeObserver((entries) => {
                var _a, _b;
                for (const entry of entries) {
                    // Get container width (use borderBoxSize for better accuracy)
                    const width = ((_b = (_a = entry.borderBoxSize) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.inlineSize) || entry.contentRect.width;
                    // Determine target viewport based on container width
                    const targetViewport = width < 768 ? 'mobile' : 'desktop';
                    // Only update if viewport changed
                    if (state.currentViewport !== targetViewport) {
                        debug$1.log(`📱 Container-based viewport switch: ${state.currentViewport} → ${targetViewport} (width: ${Math.round(width)}px)`);
                        state.currentViewport = targetViewport;
                    }
                }
            });
            this.viewportResizeObserver.observe(this.hostElement);
        };
    }
    /**
     * Component will load lifecycle
     *
     * **Purpose**: Validate props and initialize component registry
     *
     * **Validation**:
     * - Components prop is required
     * - Each component must have unique type
     * - Basic structure validation
     *
     * **Registry building**:
     * - Convert array to Map for O(1) lookups
     * - Key = component type, Value = ComponentDefinition
     *
     * **Initial state restoration**:
     * - If initialState provided, merge into gridState
     * - Otherwise use empty canvases
     */
    /**
     * Handle item deletion from grid-item-wrapper
     * Internal event dispatched by grid-item-wrapper after user clicks delete
     */
    handleGridItemDelete(event) {
        var _a;
        debug$1.log('🗑️ @Listen(grid-item:delete) in grid-builder', {
            detail: event.detail,
        });
        const { itemId } = event.detail;
        if (itemId) {
            debug$1.log('  ✅ Deleting item via API (with undo support):', itemId);
            // Use API method instead of direct deleteItemsBatch to enable undo/redo
            (_a = this.api) === null || _a === void 0 ? void 0 : _a.deleteComponent(itemId);
        }
    }
    componentWillLoad() {
        // Validate required props
        if (!this.components || this.components.length === 0) {
            console.error('GridBuilder: components prop is required');
            return;
        }
        // Build component registry
        this.componentRegistry = new Map(this.components.map(comp => [comp.type, comp]));
        // Validate unique component types
        if (this.componentRegistry.size !== this.components.length) {
            console.warn('GridBuilder: Duplicate component types detected');
        }
        // Expose interact.js globally (required for drag/drop handlers)
        window.interact = interact;
        // Restore initial state if provided
        if (this.initialState) {
            Object.assign(state, this.initialState);
        }
    }
    /**
     * Component did load lifecycle
     *
     * **Purpose**: Initialize global dependencies and plugins
     *
     * **Initialization sequence**:
     * 1. Expose virtualRenderer singleton globally
     * 2. Create GridBuilderAPI instance
     * 3. Initialize plugins via plugin.init(api)
     * 4. Apply theme via CSS variables
     * 5. Expose debug helpers
     */
    componentDidLoad() {
        var _a, _b, _c, _d, _e;
        // Expose virtualRenderer singleton globally (for debugging)
        window.virtualRenderer = virtualRenderer;
        // Create GridBuilderAPI instance
        this.api = this.createAPI();
        // Expose API based on apiRef configuration
        debug$1.log('🔧 grid-builder exposing API', {
            hasApiRef: !!this.apiRef,
            apiRefKey: (_a = this.apiRef) === null || _a === void 0 ? void 0 : _a.key,
            hasTarget: !!((_b = this.apiRef) === null || _b === void 0 ? void 0 : _b.target),
            targetType: typeof ((_c = this.apiRef) === null || _c === void 0 ? void 0 : _c.target),
            apiCreated: !!this.api,
        });
        if (this.apiRef && this.apiRef.key) {
            const target = this.apiRef.target || window;
            debug$1.log('  📤 Setting API on target', {
                key: this.apiRef.key,
                isWindow: target === window,
                targetKeys: Object.keys(target).slice(0, 10), // Show first 10 keys
            });
            target[this.apiRef.key] = this.api;
            debug$1.log('  ✅ API set on target -', {
                key: this.apiRef.key,
                apiNowExists: !!target[this.apiRef.key],
            });
        }
        // Initialize plugins
        if (this.plugins && this.plugins.length > 0) {
            this.initializedPlugins = this.plugins.filter(plugin => {
                try {
                    plugin.init(this.api);
                    debug$1.log(`GridBuilder: Initialized plugin "${plugin.name}"`);
                    return true;
                }
                catch (e) {
                    console.error(`GridBuilder: Failed to initialize plugin "${plugin.name}":`, e);
                    return false;
                }
            });
        }
        // Apply theme
        if (this.theme) {
            this.applyTheme(this.theme);
        }
        // Configure event debouncing
        const debounceDelay = (_e = (_d = this.config) === null || _d === void 0 ? void 0 : _d.eventDebounceDelay) !== null && _e !== void 0 ? _e : 300;
        eventManager.setDebounceDelay(debounceDelay);
        debug$1.log(`GridBuilder: Event debounce delay set to ${debounceDelay}ms`);
        // Debug helper
        window.debugInteractables = () => {
            const interactables = interact.interactables.list;
            debug$1.log('Total interactables:', interactables.length);
            interactables.forEach((interactable, index) => {
                debug$1.log(`Interactable ${index}:`, {
                    target: interactable.target,
                    actions: interactable._actions,
                    options: interactable.options,
                });
            });
        };
        // Setup canvas drop event handler for palette items
        this.canvasDropHandler = (event) => {
            var _a;
            const customEvent = event;
            const { canvasId, componentType, x, y } = customEvent.detail;
            debug$1.log('🎯 canvas-drop event received:', { canvasId, componentType, x, y });
            // Get component definition to determine default size
            const definition = this.componentRegistry.get(componentType);
            if (!definition) {
                console.warn(`Component definition not found for type: ${componentType}`);
                return;
            }
            // Convert pixel position to grid units
            const gridX = pixelsToGridX(x, canvasId, this.config);
            const gridY = pixelsToGridY(y, this.config);
            debug$1.log('  Converting to grid units (before constraints):', {
                gridX,
                gridY,
                defaultWidth: definition.defaultSize.width,
                defaultHeight: definition.defaultSize.height
            });
            // Apply boundary constraints (validate, adjust size, constrain position)
            const constrained = applyBoundaryConstraints(definition, gridX, gridY);
            if (!constrained) {
                console.warn(`Cannot place component "${definition.name}" - minimum size exceeds canvas width`);
                return;
            }
            debug$1.log('  After boundary constraints:', constrained);
            // Use existing addComponent API method with constrained values
            const newItem = (_a = this.api) === null || _a === void 0 ? void 0 : _a.addComponent(canvasId, componentType, {
                x: constrained.x,
                y: constrained.y,
                width: constrained.width,
                height: constrained.height,
            });
            debug$1.log('  Created item:', newItem);
        };
        this.hostElement.addEventListener('canvas-drop', this.canvasDropHandler);
        // Setup canvas move event handler for cross-canvas moves
        this.canvasMoveHandler = (event) => {
            const customEvent = event;
            const { itemId, sourceCanvasId, targetCanvasId, x, y } = customEvent.detail;
            debug$1.log('🔄 canvas-move event received:', { itemId, sourceCanvasId, targetCanvasId, x, y });
            // 1. Get item from source canvas
            const sourceCanvas = state.canvases[sourceCanvasId];
            if (!sourceCanvas) {
                console.error('Source canvas not found:', sourceCanvasId);
                return;
            }
            const itemIndex = sourceCanvas.items.findIndex(i => i.id === itemId);
            if (itemIndex === -1) {
                console.error('Item not found in source canvas:', itemId);
                return;
            }
            const item = sourceCanvas.items[itemIndex];
            // 2. Capture state BEFORE move (for undo)
            const sourcePosition = {
                x: item.layouts.desktop.x,
                y: item.layouts.desktop.y
            };
            // 3. Convert drop position (pixels) to grid units for target canvas
            let gridX = pixelsToGridX(x, targetCanvasId, this.config);
            let gridY = pixelsToGridY(y, this.config);
            // 4. Constrain position to target canvas boundaries
            const constrained = constrainPositionToCanvas(gridX, gridY, item.layouts.desktop.width, item.layouts.desktop.height, CANVAS_WIDTH_UNITS);
            gridX = constrained.x;
            gridY = constrained.y;
            const targetPosition = { x: gridX, y: gridY };
            // 5. Update item position in desktop layout
            item.layouts.desktop.x = gridX;
            item.layouts.desktop.y = gridY;
            // 6. Move item between canvases (updates canvasId, removes from source, adds to target)
            moveItemToCanvas(sourceCanvasId, targetCanvasId, itemId);
            // 7. Assign new z-index in target canvas
            const targetCanvas = state.canvases[targetCanvasId];
            item.zIndex = targetCanvas.zIndexCounter++;
            state.canvases = Object.assign({}, state.canvases); // Trigger reactivity
            // 8. Set target canvas as active
            setActiveCanvas(targetCanvasId);
            // 9. Update selection state if item was selected
            if (state.selectedItemId === itemId) {
                state.selectedCanvasId = targetCanvasId;
            }
            // 10. Create undo/redo command
            const command = new MoveItemCommand(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, itemIndex);
            undoRedo.push(command);
            // 11. Emit events for plugins
            eventManager.emit('componentMoved', {
                item,
                sourceCanvasId,
                targetCanvasId,
                position: targetPosition
            });
            eventManager.emit('canvasActivated', { canvasId: targetCanvasId });
            debug$1.log('✅ Cross-canvas move completed:', {
                itemId,
                from: sourceCanvasId,
                to: targetCanvasId,
                position: targetPosition
            });
        };
        this.hostElement.addEventListener('canvas-move', this.canvasMoveHandler);
        // Setup canvas activated event handler
        this.canvasActivatedHandler = (event) => {
            const customEvent = event;
            const { canvasId } = customEvent.detail;
            debug$1.log('🎨 canvas-activated event received:', { canvasId });
            // Emit plugin event
            eventManager.emit('canvasActivated', { canvasId });
        };
        this.hostElement.addEventListener('canvas-activated', this.canvasActivatedHandler);
        // Setup keyboard shortcuts
        this.keyboardHandler = (event) => {
            var _a, _b;
            // Get modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
            const isUndo = (event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey;
            const isRedo = (event.metaKey || event.ctrlKey) && ((event.key === 'z' && event.shiftKey) || // Ctrl/Cmd+Shift+Z
                event.key === 'y' // Ctrl/Cmd+Y
            );
            // Handle undo/redo
            if (isUndo) {
                debug$1.log('⌨️ Keyboard: Undo triggered');
                event.preventDefault();
                (_a = this.api) === null || _a === void 0 ? void 0 : _a.undo();
                return;
            }
            if (isRedo) {
                debug$1.log('⌨️ Keyboard: Redo triggered');
                event.preventDefault();
                (_b = this.api) === null || _b === void 0 ? void 0 : _b.redo();
                return;
            }
            // Handle arrow key nudging (only if component is selected)
            if (!state.selectedItemId || !state.selectedCanvasId) {
                return;
            }
            const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
            if (!isArrowKey) {
                return;
            }
            event.preventDefault();
            // Get selected item
            const canvas = state.canvases[state.selectedCanvasId];
            if (!canvas) {
                return;
            }
            const item = canvas.items.find(i => i.id === state.selectedItemId);
            if (!item) {
                return;
            }
            // Get current viewport layout
            const viewport = state.currentViewport;
            const layout = item.layouts[viewport];
            // Calculate nudge amount (1 grid unit in each direction)
            const nudgeAmount = 1;
            let deltaX = 0;
            let deltaY = 0;
            switch (event.key) {
                case 'ArrowUp':
                    deltaY = -1;
                    break;
                case 'ArrowDown':
                    deltaY = nudgeAmount;
                    break;
                case 'ArrowLeft':
                    deltaX = -1;
                    break;
                case 'ArrowRight':
                    deltaX = nudgeAmount;
                    break;
            }
            debug$1.log('⌨️ Keyboard: Nudging component', {
                key: event.key,
                deltaX,
                deltaY,
                itemId: item.id,
            });
            // Capture old position for undo
            const oldX = layout.x;
            const oldY = layout.y;
            // Update position with boundary checks
            const newX = Math.max(0, layout.x + deltaX);
            const newY = Math.max(0, layout.y + deltaY);
            // Check right boundary (100 grid units = 100%)
            const maxX = 100 - layout.width;
            const constrainedX = Math.min(newX, maxX);
            const constrainedY = newY; // No vertical limit
            // Only update if position actually changed
            if (oldX === constrainedX && oldY === constrainedY) {
                return; // No change, don't create undo command
            }
            // Update item layout (mutate in place to preserve all properties like 'customized')
            layout.x = constrainedX;
            layout.y = constrainedY;
            // Create undo command for nudge
            const nudgeCommand = new MoveItemCommand(item.id, state.selectedCanvasId, state.selectedCanvasId, { x: oldX, y: oldY }, { x: constrainedX, y: constrainedY }, canvas.items.findIndex(i => i.id === item.id));
            undoRedo.push(nudgeCommand);
            // Trigger state update
            state.canvases = Object.assign({}, state.canvases);
            // Emit event
            eventManager.emit('componentDragged', {
                itemId: item.id,
                canvasId: state.selectedCanvasId,
                position: { x: constrainedX, y: constrainedY },
            });
        };
        document.addEventListener('keydown', this.keyboardHandler);
        // Setup container-based viewport switching
        this.setupViewportResizeObserver();
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up resources when component unmounts
     *
     * **Cleanup sequence**:
     * 1. Remove event listeners
     * 2. Destroy all plugins
     * 3. Clear global references
     */
    disconnectedCallback() {
        // Remove event listeners
        if (this.canvasDropHandler) {
            this.hostElement.removeEventListener('canvas-drop', this.canvasDropHandler);
        }
        if (this.canvasMoveHandler) {
            this.hostElement.removeEventListener('canvas-move', this.canvasMoveHandler);
        }
        if (this.canvasActivatedHandler) {
            this.hostElement.removeEventListener('canvas-activated', this.canvasActivatedHandler);
        }
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        // Cleanup ResizeObserver
        if (this.viewportResizeObserver) {
            this.viewportResizeObserver.disconnect();
        }
        // Destroy plugins
        if (this.initializedPlugins.length > 0) {
            this.initializedPlugins.forEach(plugin => {
                try {
                    plugin.destroy();
                    debug$1.log(`GridBuilder: Destroyed plugin "${plugin.name}"`);
                }
                catch (e) {
                    console.error(`GridBuilder: Failed to destroy plugin "${plugin.name}":`, e);
                }
            });
            this.initializedPlugins = [];
        }
        // Clear global references
        delete window.virtualRenderer;
        // Clear API from storage location if it was set
        if (this.apiRef && this.apiRef.key) {
            const target = this.apiRef.target || window;
            delete target[this.apiRef.key];
        }
    }
    /**
     * Watch components prop for changes
     *
     * **Purpose**: Rebuild component registry when components prop changes
     */
    handleComponentsChange(newComponents) {
        this.componentRegistry = new Map(newComponents.map(comp => [comp.type, comp]));
    }
    /**
     * Create GridBuilderAPI instance
     *
     * **Purpose**: Provide API to plugins and external code
     * **Returns**: GridBuilderAPI implementation
     *
     * **Implementation**: Full API with event system integration
     */
    createAPI() {
        return {
            // ======================
            // Event Subscriptions
            // ======================
            on: (eventName, callback) => {
                eventManager.on(eventName, callback);
            },
            off: (eventName, callback) => {
                eventManager.off(eventName, callback);
            },
            // ======================
            // State Access (Read)
            // ======================
            getState: () => state,
            getItems: (canvasId) => {
                var _a;
                return ((_a = state.canvases[canvasId]) === null || _a === void 0 ? void 0 : _a.items) || [];
            },
            getItem: (itemId) => {
                // Search across all canvases
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const item = canvas.items.find((i) => i.id === itemId);
                    if (item) {
                        return item;
                    }
                }
                return null;
            },
            // ======================
            // Programmatic Operations
            // ======================
            addComponent: (canvasId, componentType, position, config) => {
                const canvas = state.canvases[canvasId];
                if (!canvas) {
                    console.error(`Canvas not found: ${canvasId}`);
                    return null;
                }
                // Create new item
                const newItem = {
                    id: generateItemId(),
                    canvasId,
                    name: componentType,
                    type: componentType,
                    zIndex: ++canvas.zIndexCounter,
                    layouts: {
                        desktop: Object.assign({}, position),
                        mobile: { x: 0, y: 0, width: 50, height: position.height, customized: false },
                    },
                    config: config || {},
                };
                // Add to canvas
                canvas.items.push(newItem);
                state.canvases = Object.assign({}, state.canvases);
                // Add to undo/redo history
                undoRedo.push(new BatchAddCommand([newItem.id]));
                // Emit event
                eventManager.emit('componentAdded', { item: newItem, canvasId });
                return newItem.id;
            },
            deleteComponent: (itemId) => {
                // Find and delete item across all canvases
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
                    if (itemIndex !== -1) {
                        // Add to undo/redo history BEFORE deletion (need state for undo)
                        undoRedo.push(new BatchDeleteCommand([itemId]));
                        // Delete item
                        canvas.items.splice(itemIndex, 1);
                        state.canvases = Object.assign({}, state.canvases);
                        // Deselect if deleted item was selected
                        if (state.selectedItemId === itemId) {
                            state.selectedItemId = null;
                            state.selectedCanvasId = null;
                        }
                        // Emit event
                        eventManager.emit('componentDeleted', { itemId, canvasId });
                        return true;
                    }
                }
                return false;
            },
            updateConfig: (itemId, config) => {
                // Find and update item across all canvases
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
                    if (itemIndex !== -1) {
                        const item = canvas.items[itemIndex];
                        const newConfig = Object.assign(Object.assign({}, item.config), config);
                        // Create undo command BEFORE making changes
                        const batchUpdate = [{
                                itemId,
                                canvasId,
                                updates: { config: newConfig },
                            }];
                        undoRedo.push(new BatchUpdateConfigCommand(batchUpdate));
                        // Merge config
                        canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { config: newConfig });
                        state.canvases = Object.assign({}, state.canvases);
                        // Emit event
                        eventManager.emit('configChanged', { itemId, canvasId, config });
                        return true;
                    }
                }
                return false;
            },
            // ======================
            // Batch Operations
            // ======================
            addComponentsBatch: (components) => {
                // Convert API format to state-manager format
                const partialItems = components.map(({ canvasId, type, position, config }) => ({
                    canvasId,
                    type,
                    name: type,
                    layouts: {
                        desktop: Object.assign({}, position),
                        mobile: { x: 0, y: 0, width: 50, height: position.height, customized: false },
                    },
                    config: config || {},
                }));
                // Use state-manager batch operation (single state update)
                const itemIds = addItemsBatch(partialItems);
                // Add to undo/redo history
                undoRedo.push(new BatchAddCommand(itemIds));
                // Emit batch event
                const createdItems = itemIds.map(id => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(id);
                    return item ? { item, canvasId: item.canvasId } : null;
                }).filter(Boolean);
                eventManager.emit('componentsBatchAdded', { items: createdItems });
                return itemIds;
            },
            deleteComponentsBatch: (itemIds) => {
                // Store deleted items for event
                const deletedItems = itemIds.map(itemId => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(itemId);
                    return item ? { itemId, canvasId: item.canvasId } : null;
                }).filter(Boolean);
                // Add to undo/redo history BEFORE deletion (need state for undo)
                undoRedo.push(new BatchDeleteCommand(itemIds));
                // Use state-manager batch operation (single state update)
                deleteItemsBatch(itemIds);
                // Clear selection if any deleted item was selected
                if (state.selectedItemId && itemIds.includes(state.selectedItemId)) {
                    state.selectedItemId = null;
                    state.selectedCanvasId = null;
                }
                // Emit batch event
                eventManager.emit('componentsBatchDeleted', { items: deletedItems });
            },
            updateConfigsBatch: (updates) => {
                // Convert to state-manager format (need canvasId)
                const batchUpdates = updates.map(({ itemId, config }) => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(itemId);
                    if (!item) {
                        console.warn(`Item ${itemId} not found for config update`);
                        return null;
                    }
                    return {
                        itemId,
                        canvasId: item.canvasId,
                        updates: { config: Object.assign(Object.assign({}, item.config), config) },
                    };
                }).filter(Boolean);
                // Add to undo/redo history
                undoRedo.push(new BatchUpdateConfigCommand(batchUpdates));
                // Use state-manager batch operation (single state update)
                updateItemsBatch(batchUpdates);
                // Emit batch event
                const updatedItems = batchUpdates.map(({ itemId, canvasId, updates }) => ({
                    itemId,
                    canvasId,
                    config: updates.config,
                }));
                eventManager.emit('configsBatchChanged', { items: updatedItems });
            },
            // ======================
            // Canvas Access
            // ======================
            getCanvasElement: (canvasId) => {
                return document.getElementById(canvasId);
            },
            // ======================
            // Undo/Redo Operations
            // ======================
            undo: () => {
                undoRedo.undo();
                // Emit event after undo
                eventManager.emit('undoExecuted', {});
            },
            redo: () => {
                undoRedo.redo();
                // Emit event after redo
                eventManager.emit('redoExecuted', {});
            },
            canUndo: () => {
                return undoRedo.canUndo();
            },
            canRedo: () => {
                return undoRedo.canRedo();
            },
            undoRedoState: undoRedoState,
            // ======================
            // Canvas Management
            // ======================
            addCanvas: (canvasId) => {
                // Create and execute command
                const command = new AddCanvasCommand(canvasId);
                undoRedo.push(command);
                command.redo();
            },
            removeCanvas: (canvasId) => {
                // Create and execute command
                const command = new RemoveCanvasCommand(canvasId);
                undoRedo.push(command);
                command.redo();
            },
            setActiveCanvas: (canvasId) => {
                setActiveCanvas(canvasId);
                eventManager.emit('canvasActivated', { canvasId });
            },
            getActiveCanvas: () => {
                return state.activeCanvasId;
            },
        };
    }
    /**
     * Apply theme via CSS variables
     *
     * **Purpose**: Apply theme customization to host element
     * **Implementation**: Set CSS custom properties on :host
     */
    applyTheme(theme) {
        const host = this.el;
        if (!host)
            return;
        // Apply predefined theme properties
        if (theme.primaryColor) {
            host.style.setProperty('--grid-builder-primary-color', theme.primaryColor);
        }
        if (theme.paletteBackground) {
            host.style.setProperty('--grid-builder-palette-bg', theme.paletteBackground);
        }
        if (theme.canvasBackground) {
            host.style.setProperty('--grid-builder-canvas-bg', theme.canvasBackground);
        }
        if (theme.gridLineColor) {
            host.style.setProperty('--grid-builder-grid-line-color', theme.gridLineColor);
        }
        if (theme.selectionColor) {
            host.style.setProperty('--grid-builder-selection-color', theme.selectionColor);
        }
        if (theme.resizeHandleColor) {
            host.style.setProperty('--grid-builder-resize-handle-color', theme.resizeHandleColor);
        }
        if (theme.fontFamily) {
            host.style.setProperty('--grid-builder-font-family', theme.fontFamily);
        }
        // Apply custom properties
        if (theme.customProperties) {
            Object.entries(theme.customProperties).forEach(([key, value]) => {
                host.style.setProperty(key, value);
            });
        }
    }
    /**
     * Export current state to JSON-serializable format
     *
     * **Purpose**: Export grid layout for saving or transferring to viewer app
     *
     * **Use Cases**:
     * - Save layout to database/localStorage
     * - Transfer layout to viewer app via API
     * - Create layout templates/presets
     * - Backup/restore functionality
     *
     * **Example - Save to API**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const exportData = await builder.exportState();
     * await fetch('/api/layouts', {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify(exportData)
     * });
     * ```
     *
     * **Example - Save to localStorage**:
     * ```typescript
     * const exportData = await builder.exportState();
     * localStorage.setItem('grid-layout', JSON.stringify(exportData));
     * ```
     *
     * @returns Promise<GridExport> - JSON-serializable export object
     */
    async exportState() {
        // Build export data from current gridState
        const exportData = {
            version: '1.0.0',
            canvases: {},
            viewport: state.currentViewport,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
        // Export each canvas with its items
        for (const canvasId in state.canvases) {
            const canvas = state.canvases[canvasId];
            exportData.canvases[canvasId] = {
                items: canvas.items.map(item => ({
                    id: item.id,
                    canvasId: item.canvasId,
                    type: item.type,
                    name: item.name,
                    layouts: {
                        desktop: Object.assign({}, item.layouts.desktop),
                        mobile: Object.assign({}, item.layouts.mobile),
                    },
                    zIndex: item.zIndex,
                    config: Object.assign({}, item.config), // Deep copy to avoid mutations
                })),
            };
        }
        return exportData;
    }
    /**
     * Import state from JSON-serializable format
     *
     * **Purpose**: Restore previously exported grid state
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const savedState = JSON.parse(localStorage.getItem('grid-layout'));
     * await builder.importState(savedState);
     * ```
     *
     * @param state - GridExport or partial GridState object
     */
    async importState(state$1) {
        // Import grid state
        Object.assign(state, state$1);
    }
    /**
     * Get current grid state
     *
     * **Purpose**: Direct access to grid state for reading
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const state = await builder.getState();
     * console.log('Current viewport:', state.currentViewport);
     * ```
     *
     * @returns Promise<GridState> - Current grid state
     */
    async getState() {
        return state;
    }
    /**
     * Add a new canvas programmatically
     *
     * **Purpose**: Create new section/canvas in the grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.addCanvas('new-section');
     * ```
     *
     * @param canvasId - Unique canvas identifier
     */
    async addCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.addCanvas(canvasId);
    }
    /**
     * Remove a canvas programmatically
     *
     * **Purpose**: Delete section/canvas from the grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.removeCanvas('old-section');
     * ```
     *
     * @param canvasId - Canvas identifier to remove
     */
    async removeCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.removeCanvas(canvasId);
    }
    /**
     * Set active canvas programmatically
     *
     * **Purpose**: Activate a specific canvas for focused editing
     *
     * **Use cases**:
     * - Focus specific section after adding items
     * - Programmatic navigation between sections
     * - Show canvas-specific settings panel
     *
     * **Events triggered**: 'canvasActivated'
     *
     * @param canvasId - Canvas to activate
     *
     * @example
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.setActiveCanvas('canvas2');
     * ```
     */
    async setActiveCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.setActiveCanvas(canvasId);
    }
    /**
     * Get currently active canvas ID
     *
     * **Purpose**: Check which canvas is currently active/focused
     *
     * @returns Promise<string | null> - Active canvas ID or null if none active
     *
     * @example
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const activeId = await builder.getActiveCanvas();
     * if (activeId === 'canvas1') {
     *   console.log('Canvas 1 is active');
     * }
     * ```
     */
    async getActiveCanvas() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.getActiveCanvas()) || null;
    }
    /**
     * Undo last action
     *
     * **Purpose**: Revert last user action (move, resize, add, delete, etc.)
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.undo();
     * ```
     */
    async undo() {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.undo();
    }
    /**
     * Redo last undone action
     *
     * **Purpose**: Re-apply last undone action
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.redo();
     * ```
     */
    async redo() {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.redo();
    }
    /**
     * Check if undo is available
     *
     * **Purpose**: Determine if there are actions to undo
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const canUndo = await builder.canUndo();
     * undoButton.disabled = !canUndo;
     * ```
     *
     * @returns Promise<boolean> - True if undo is available
     */
    async canUndo() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.canUndo()) || false;
    }
    /**
     * Check if redo is available
     *
     * **Purpose**: Determine if there are actions to redo
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const canRedo = await builder.canRedo();
     * redoButton.disabled = !canRedo;
     * ```
     *
     * @returns Promise<boolean> - True if redo is available
     */
    async canRedo() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.canRedo()) || false;
    }
    /**
     * Add a component programmatically
     *
     * **Purpose**: Add new component to canvas without dragging from palette
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const itemId = await builder.addComponent('canvas1', 'header', {
     *   x: 10, y: 10, width: 30, height: 6
     * }, { title: 'My Header' });
     * ```
     *
     * @param canvasId - Canvas to add component to
     * @param componentType - Component type from registry
     * @param position - Grid position and size
     * @param config - Optional component configuration
     * @returns Promise<string | null> - New item ID or null if failed
     */
    async addComponent(canvasId, componentType, position, config) {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.addComponent(canvasId, componentType, position, config)) || null;
    }
    /**
     * Delete a component programmatically
     *
     * **Purpose**: Remove component from grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const success = await builder.deleteComponent('item-123');
     * ```
     *
     * @param itemId - Item ID to delete
     * @returns Promise<boolean> - True if deleted successfully
     */
    async deleteComponent(itemId) {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.deleteComponent(itemId)) || false;
    }
    /**
     * Update component configuration
     *
     * **Purpose**: Update component properties/config
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const success = await builder.updateConfig('item-123', {
     *   title: 'Updated Title',
     *   color: '#ff0000'
     * });
     * ```
     *
     * @param itemId - Item ID to update
     * @param config - Configuration updates
     * @returns Promise<boolean> - True if updated successfully
     */
    async updateConfig(itemId, config) {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.updateConfig(itemId, config)) || false;
    }
    /**
     * Render component template
     *
     * **Purpose**: Render main UI structure
     *
     * **Structure**:
     * - Host element with theme classes
     * - Component palette (sidebar or custom)
     * - Canvas area with sections
     *
     * **Note**: Actual rendering delegates to child components:
     * - <component-palette> or custom ComponentPalette
     * - <canvas-section> for each canvas
     *
     * **Config Panel**: Users should implement their own config panels
     * - See custom-config-panel in demo for reference implementation
     * - Listen to 'item-click' events to show your config UI
     */
    render() {
        const canvasIds = Object.keys(state.canvases);
        return (h(Host, { key: '41f88f4f0486a63bbbe473fb738b3ac2ae21ecc9', ref: (el) => this.el = el }, h("div", { key: 'dbcda54b31a36ee34522ef697892dd4628d717b3', class: "grid-builder-container" }, h("div", { key: '9a59401dd27a47b88558a791b80a084f4ac90e7e', class: "palette-area" }, h("component-palette", { key: '3b83fa7ec7e23bf61a64b4361d39368c3a028b08', components: this.components, config: this.config })), h("div", { key: 'e7366c25649d47699d8e0e5816656d04280abc68', class: "canvas-area" }, h("div", { key: '99ee6f4776120765eaa81a09f166af999deab27d', class: "canvases-container" }, canvasIds.map((canvasId) => {
            var _a, _b, _c, _d;
            return (h("canvas-section", { key: canvasId, canvasId: canvasId, isActive: state.activeCanvasId === canvasId, config: this.config, componentRegistry: this.componentRegistry, backgroundColor: (_b = (_a = this.canvasMetadata) === null || _a === void 0 ? void 0 : _a[canvasId]) === null || _b === void 0 ? void 0 : _b.backgroundColor, canvasTitle: (_d = (_c = this.canvasMetadata) === null || _c === void 0 ? void 0 : _c[canvasId]) === null || _d === void 0 ? void 0 : _d.title, onBeforeDelete: this.onBeforeDelete }));
        }))))));
    }
    get hostElement() { return getElement(this); }
    static get watchers() { return {
        "components": ["handleComponentsChange"]
    }; }
};
GridBuilder.style = gridBuilderCss;

const gridViewerCss = "@charset \"UTF-8\";:host{--grid-viewer-primary-color:#007bff;--grid-viewer-canvas-bg:#ffffff;--grid-viewer-font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\",\n    \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif;display:block;width:100%;height:100%;font-family:var(--grid-viewer-font-family)}.grid-viewer-container{width:100%;height:100%;background:var(--grid-viewer-canvas-bg);overflow:auto}.canvas-area{width:100%;height:100%;overflow-y:auto;overflow-x:hidden}.canvases-container{display:flex;flex-direction:column;gap:0;width:100%;min-height:100%}";

const debug = createDebugLogger('grid-viewer');
const GridViewer = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Component registry (internal state)
         *
         * **Purpose**: Map component type → definition for lookup
         * **Built from**: components prop
         */
        this.componentRegistry = new Map();
        /**
         * Setup ResizeObserver for container-based viewport switching
         *
         * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
         * **Breakpoint**: 768px (container width, not window viewport)
         *
         * **Reused from grid-builder**: Same implementation for consistency
         */
        this.setupViewportResizeObserver = () => {
            if (!this.hostElement) {
                return;
            }
            // Watch for grid-viewer container size changes
            this.viewportResizeObserver = new ResizeObserver((entries) => {
                var _a, _b;
                for (const entry of entries) {
                    // Get container width directly from the element
                    // Note: We use offsetWidth instead of entry.contentRect.width because
                    // the grid-viewer uses Light DOM and contentRect returns 0 for elements with height: 100%
                    const width = this.hostElement.offsetWidth || ((_b = (_a = entry.borderBoxSize) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.inlineSize) || entry.contentRect.width;
                    // Skip viewport switching if width is 0 or very small (container not yet laid out)
                    // This prevents premature switching to mobile before CSS layout is complete
                    if (width < 100) {
                        debug.log(`📱 [Viewer] Skipping viewport switch - container not yet laid out (width: ${Math.round(width)}px)`);
                        return;
                    }
                    // Determine target viewport based on container width
                    const targetViewport = width < 768 ? 'mobile' : 'desktop';
                    // Only update if viewport changed
                    if (this.viewerState.state.currentViewport !== targetViewport) {
                        debug.log(`📱 [Viewer] Container-based viewport switch: ${this.viewerState.state.currentViewport} → ${targetViewport} (width: ${Math.round(width)}px)`);
                        this.viewerState.state.currentViewport = targetViewport;
                    }
                }
            });
            this.viewportResizeObserver.observe(this.hostElement);
        };
    }
    /**
     * Component will load lifecycle
     *
     * **Purpose**: Initialize component registry and viewer state
     */
    componentWillLoad() {
        // Validate required props
        if (!this.components || this.components.length === 0) {
            console.error('GridViewer: components prop is required');
            return;
        }
        // Build component registry
        this.componentRegistry = new Map(this.components.map(comp => [comp.type, comp]));
        // Validate unique component types
        if (this.componentRegistry.size !== this.components.length) {
            console.warn('GridViewer: Duplicate component types detected');
        }
        // Initialize local viewer state store
        const initialViewerState = {
            canvases: {},
            currentViewport: 'desktop',
        };
        // Restore initial state if provided
        if (this.initialState) {
            // Handle both ViewerState and GridExport formats
            if ('viewport' in this.initialState) {
                // GridExport format
                initialViewerState.currentViewport = this.initialState.viewport;
                initialViewerState.canvases = this.initialState.canvases;
            }
            else {
                // ViewerState format
                Object.assign(initialViewerState, this.initialState);
            }
        }
        // Create local store (not global like grid-builder)
        this.viewerState = createStore(initialViewerState);
    }
    /**
     * Component did load lifecycle
     *
     * **Purpose**: Apply theme and setup viewport switching
     */
    componentDidLoad() {
        // Apply theme
        if (this.theme) {
            this.applyTheme(this.theme);
        }
        // Setup container-based viewport switching
        this.setupViewportResizeObserver();
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up ResizeObserver
     */
    disconnectedCallback() {
        // Cleanup ResizeObserver
        if (this.viewportResizeObserver) {
            this.viewportResizeObserver.disconnect();
        }
    }
    /**
     * Watch components prop for changes
     *
     * **Purpose**: Rebuild component registry when components prop changes
     */
    handleComponentsChange(newComponents) {
        this.componentRegistry = new Map(newComponents.map(comp => [comp.type, comp]));
    }
    /**
     * Watch initialState prop for changes
     *
     * **Purpose**: Update viewer state when initialState prop changes
     */
    handleInitialStateChange(newState) {
        if (newState) {
            // Handle both ViewerState and GridExport formats
            if ('viewport' in newState) {
                // GridExport format
                this.viewerState.state.currentViewport = newState.viewport;
                this.viewerState.state.canvases = newState.canvases;
            }
            else {
                // ViewerState format
                Object.assign(this.viewerState.state, newState);
            }
        }
    }
    /**
     * Apply theme via CSS variables
     *
     * **Purpose**: Apply theme customization to host element
     * **Implementation**: Set CSS custom properties on :host
     */
    applyTheme(theme) {
        const host = this.el;
        if (!host)
            return;
        // Apply predefined theme properties
        if (theme.primaryColor) {
            host.style.setProperty('--grid-viewer-primary-color', theme.primaryColor);
        }
        if (theme.canvasBackground) {
            host.style.setProperty('--grid-viewer-canvas-bg', theme.canvasBackground);
        }
        if (theme.fontFamily) {
            host.style.setProperty('--grid-viewer-font-family', theme.fontFamily);
        }
        // Apply custom properties
        if (theme.customProperties) {
            Object.entries(theme.customProperties).forEach(([key, value]) => {
                host.style.setProperty(key, value);
            });
        }
    }
    /**
     * Render component template
     *
     * **Purpose**: Render canvases with items (no palette, no config panel)
     *
     * **Structure**:
     * - Host element with theme classes
     * - Canvas area with sections
     * - No palette (viewing only)
     * - No config panel (viewing only)
     */
    render() {
        const canvasIds = Object.keys(this.viewerState.state.canvases);
        return (h(Host, { key: '243907a7615c3c4eb7263383337b26d9131236d0', ref: (el) => this.el = el }, h("div", { key: '8d4eb74201dc529163348967d25a05f031b088b1', class: "grid-viewer-container" }, h("div", { key: '287bcfbbf3b430201f239f83da3fd4afc1c6df6d', class: "canvas-area" }, h("div", { key: 'd72dda890861e7de3bf25983d0c082b6c758a424', class: "canvases-container" }, canvasIds.map((canvasId) => {
            var _a, _b;
            return (h("canvas-section-viewer", { key: canvasId, canvasId: canvasId, config: this.config, componentRegistry: this.componentRegistry, items: this.viewerState.state.canvases[canvasId].items, currentViewport: this.viewerState.state.currentViewport, backgroundColor: (_b = (_a = this.canvasMetadata) === null || _a === void 0 ? void 0 : _a[canvasId]) === null || _b === void 0 ? void 0 : _b.backgroundColor }));
        }))))));
    }
    get hostElement() { return getElement(this); }
    static get watchers() { return {
        "components": ["handleComponentsChange"],
        "initialState": ["handleInitialStateChange"]
    }; }
};
GridViewer.style = gridViewerCss;

const sectionEditorPanelCss = "section-editor-panel .section-editor-overlay{position:fixed;z-index:10000;top:0;right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease-out;background:rgba(0, 0, 0, 0.5)}section-editor-panel .section-editor-panel{width:90%;max-width:440px;border-radius:12px;animation:slideUp 0.2s ease-out;background:white;box-shadow:0 8px 32px rgba(0, 0, 0, 0.12)}section-editor-panel .panel-header{display:flex;align-items:center;justify-content:space-between;padding:28px 32px 24px;border-bottom:1px solid #e9ecef}section-editor-panel .panel-header .panel-title{margin:0;color:#212529;font-size:20px;font-weight:600;letter-spacing:-0.02em}section-editor-panel .panel-header .close-btn{display:flex;width:32px;height:32px;align-items:center;justify-content:center;padding:0;border:none;border-radius:6px;background:transparent;color:#6c757d;cursor:pointer;font-size:24px;font-weight:300;line-height:1;transition:all 0.15s}section-editor-panel .panel-header .close-btn:hover{background:#f8f9fa;color:#212529}section-editor-panel .panel-header .close-btn:active{transform:scale(0.95)}section-editor-panel .panel-body{padding:32px}section-editor-panel .panel-body .form-group{margin-bottom:28px}section-editor-panel .panel-body .form-group:last-child{margin-bottom:0}section-editor-panel .panel-body .form-group label{display:block;margin-bottom:10px;color:#495057;font-size:13px;font-weight:600;letter-spacing:0.01em;text-transform:uppercase}section-editor-panel .panel-body .form-group .section-title-input{width:100%;box-sizing:border-box;padding:12px 16px;border:1.5px solid #e1e4e8;border-radius:8px;background:#f8f9fa;color:#212529;font-size:15px;transition:all 0.2s}section-editor-panel .panel-body .form-group .section-title-input:hover{background:white;border-color:#cbd3da}section-editor-panel .panel-body .form-group .section-title-input:focus{border-color:#4a90e2;background:white;box-shadow:0 0 0 3px rgba(74, 144, 226, 0.08);outline:none}section-editor-panel .panel-body .form-group .section-title-input::placeholder{color:#adb5bd}section-editor-panel .panel-body .form-group .color-picker-wrapper{display:flex;align-items:stretch;gap:14px}section-editor-panel .panel-body .form-group .color-picker-wrapper .section-color-input{width:64px;height:48px;padding:6px;border:1.5px solid #e1e4e8;border-radius:8px;cursor:pointer;transition:all 0.2s}section-editor-panel .panel-body .form-group .color-picker-wrapper .section-color-input:hover{border-color:#4a90e2;box-shadow:0 2px 8px rgba(74, 144, 226, 0.15)}section-editor-panel .panel-body .form-group .color-picker-wrapper .section-color-input:focus{border-color:#4a90e2;box-shadow:0 0 0 3px rgba(74, 144, 226, 0.08);outline:none}section-editor-panel .panel-body .form-group .color-picker-wrapper .color-hex-input{flex:1;padding:12px 16px;border:1.5px solid #e1e4e8;border-radius:8px;background:#f8f9fa;color:#495057;font-family:\"SF Mono\", \"Monaco\", \"Courier New\", monospace;font-size:14px;transition:all 0.2s}section-editor-panel .panel-body .form-group .color-picker-wrapper .color-hex-input:hover{background:white;border-color:#cbd3da}section-editor-panel .panel-body .form-group .color-picker-wrapper .color-hex-input:focus{border-color:#4a90e2;background:white;box-shadow:0 0 0 3px rgba(74, 144, 226, 0.08);outline:none}section-editor-panel .panel-body .form-group .color-picker-wrapper .color-hex-input::placeholder{color:#adb5bd}section-editor-panel .panel-footer{display:flex;align-items:center;justify-content:space-between;padding:24px 32px 28px;border-top:1px solid #e9ecef}section-editor-panel .panel-footer .footer-actions{display:flex;gap:12px}section-editor-panel .panel-footer button{padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s}section-editor-panel .panel-footer button:active{transform:translateY(1px)}section-editor-panel .panel-footer .delete-btn{padding:12px 16px;margin-right:16px;border:1.5px solid #dc3545;background:transparent;color:#dc3545;font-weight:500}section-editor-panel .panel-footer .delete-btn:hover{background:#fff5f5;border-color:#c82333;color:#c82333}section-editor-panel .panel-footer .delete-btn:active{background:#ffe5e5}section-editor-panel .panel-footer .cancel-btn{border:1.5px solid #e1e4e8;background:white;color:#495057}section-editor-panel .panel-footer .cancel-btn:hover{border-color:#cbd3da;background:#f8f9fa}section-editor-panel .panel-footer .cancel-btn:active{background:#e9ecef}section-editor-panel .panel-footer .save-btn{background:#4a90e2;color:white;box-shadow:0 2px 8px rgba(74, 144, 226, 0.2)}section-editor-panel .panel-footer .save-btn:hover{background:#357abd;box-shadow:0 4px 12px rgba(74, 144, 226, 0.25);transform:translateY(-1px)}section-editor-panel .panel-footer .save-btn:active{background:#2a5f8f;box-shadow:0 1px 4px rgba(74, 144, 226, 0.2);transform:translateY(0)}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}";

const SectionEditorPanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.closePanel = createEvent(this, "closePanel");
        this.updateSection = createEvent(this, "updateSection");
        this.previewColorChange = createEvent(this, "previewColorChange");
        this.previewTitleChange = createEvent(this, "previewTitleChange");
        this.deleteSection = createEvent(this, "deleteSection");
        /**
         * Panel open/closed state
         * Controlled by parent component (blog-app)
         */
        this.isOpen = false;
        /**
         * Section data being edited
         * Passed from parent when user clicks section header
         */
        this.sectionData = null;
        /**
         * Internal editing state
         * These track user's changes before saving
         */
        this.editedTitle = '';
        this.editedColor = '';
        /**
         * Original values when modal opened
         * Used to revert on cancel
         */
        this.originalColor = '';
        this.originalTitle = '';
        this.handleClose = () => {
            // Revert to original values on cancel
            if (this.sectionData) {
                this.previewColorChange.emit({
                    canvasId: this.sectionData.canvasId,
                    backgroundColor: this.originalColor,
                });
                this.previewTitleChange.emit({
                    canvasId: this.sectionData.canvasId,
                    title: this.originalTitle,
                });
            }
            this.closePanel.emit();
        };
        this.handleSave = () => {
            if (this.sectionData) {
                this.updateSection.emit({
                    canvasId: this.sectionData.canvasId,
                    title: this.editedTitle,
                    backgroundColor: this.editedColor,
                });
                this.closePanel.emit();
            }
        };
        this.handleDelete = () => {
            if (this.sectionData) {
                this.deleteSection.emit({
                    canvasId: this.sectionData.canvasId,
                });
                this.closePanel.emit();
            }
        };
        this.handleTitleInput = (e) => {
            this.editedTitle = e.target.value;
            // Emit preview event for live title update
            if (this.sectionData) {
                this.previewTitleChange.emit({
                    canvasId: this.sectionData.canvasId,
                    title: this.editedTitle,
                });
            }
        };
        this.handleColorInput = (e) => {
            this.editedColor = e.target.value;
            // Emit preview event for live color update
            if (this.sectionData) {
                this.previewColorChange.emit({
                    canvasId: this.sectionData.canvasId,
                    backgroundColor: this.editedColor,
                });
            }
        };
    }
    handleSectionDataChange(newData) {
        if (newData) {
            this.editedTitle = newData.title;
            this.editedColor = newData.backgroundColor;
            // Store original values for revert on cancel
            this.originalColor = newData.backgroundColor;
            this.originalTitle = newData.title;
        }
    }
    componentWillLoad() {
        if (this.sectionData) {
            this.editedTitle = this.sectionData.title;
            this.editedColor = this.sectionData.backgroundColor;
            // Store original values for revert on cancel
            this.originalColor = this.sectionData.backgroundColor;
            this.originalTitle = this.sectionData.title;
        }
    }
    render() {
        if (!this.isOpen || !this.sectionData) {
            return null;
        }
        return (h("div", { class: "section-editor-overlay", onClick: this.handleClose }, h("div", { class: "section-editor-panel", onClick: (e) => e.stopPropagation() }, h("div", { class: "panel-header" }, h("h2", { class: "panel-title" }, "Edit Section"), h("button", { class: "close-btn", onClick: this.handleClose, title: "Close" }, "\u00D7")), h("div", { class: "panel-body" }, h("div", { class: "form-group" }, h("label", { htmlFor: "section-title" }, "Section Name"), h("input", { type: "text", id: "section-title", class: "section-title-input", value: this.editedTitle, onInput: this.handleTitleInput, placeholder: "Enter section name" })), h("div", { class: "form-group" }, h("label", { htmlFor: "section-color" }, "Background Color"), h("div", { class: "color-picker-wrapper" }, h("input", { type: "color", id: "section-color", class: "section-color-input", value: this.editedColor, onInput: this.handleColorInput }), h("input", { type: "text", class: "color-hex-input", value: this.editedColor, onInput: this.handleColorInput, placeholder: "#ffffff" })))), h("div", { class: "panel-footer" }, h("button", { class: "delete-btn", onClick: this.handleDelete }, "Delete Section"), h("div", { class: "footer-actions" }, h("button", { class: "cancel-btn", onClick: this.handleClose }, "Cancel"), h("button", { class: "save-btn", onClick: this.handleSave }, "Save Changes"))))));
    }
    static get watchers() { return {
        "sectionData": ["handleSectionDataChange"]
    }; }
};
SectionEditorPanel.style = sectionEditorPanelCss;

export { CanvasHeader as canvas_header, ConfirmationModal as confirmation_modal, CustomConfigPanel as custom_config_panel, GridBuilder as grid_builder, GridViewer as grid_viewer, SectionEditorPanel as section_editor_panel };
//# sourceMappingURL=canvas-header.confirmation-modal.custom-config-panel.grid-builder.grid-viewer.section-editor-panel.entry.js.map
