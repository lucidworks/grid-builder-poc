import { h, proxyCustomElement, HTMLElement } from '@stencil/core/internal/client';
import { d as defineCustomElement$f } from './blog-article2.js';
import { d as defineCustomElement$e } from './blog-article-drag-clone2.js';
import { d as defineCustomElement$d } from './blog-button2.js';
import { d as defineCustomElement$c } from './blog-button-drag-clone2.js';
import { d as defineCustomElement$b } from './blog-header2.js';
import { d as defineCustomElement$a } from './blog-header-drag-clone2.js';
import { d as defineCustomElement$9 } from './blog-image2.js';
import { d as defineCustomElement$8 } from './blog-image-drag-clone2.js';
import { d as defineCustomElement$7 } from './custom-palette-item2.js';
import { d as defineCustomElement$6 } from './dashboard-widget2.js';
import { d as defineCustomElement$5 } from './dashboard-widget-drag-clone2.js';
import { d as defineCustomElement$4 } from './image-gallery2.js';
import { d as defineCustomElement$3 } from './image-gallery-drag-clone2.js';
import { d as defineCustomElement$2 } from './live-data2.js';
import { d as defineCustomElement$1 } from './live-data-drag-clone2.js';

/**
 * Component Definitions for Blog Layout Builder Demo
 * ===================================================
 *
 * This file demonstrates how to define custom components for the grid-builder library.
 * Each ComponentDefinition tells the library how to render, size, and display your components.
 *
 * Key Library Features Demonstrated:
 * ----------------------------------
 *
 * 1. **Component Type Registration** (`type` property)
 *    - Unique identifier for each component type
 *    - Used by the library to look up component definitions
 *    - Example: 'blog-header', 'blog-article', 'blog-button'
 *
 * 2. **Default Sizing** (`defaultSize` property)
 *    - Initial size when component is dropped onto canvas
 *    - Units are in grid units (default: 50 units = 100% width)
 *    - Example: { width: 50, height: 5 } = full width, 5 units tall
 *
 * 3. **Size Constraints** (`minSize`, `maxSize` properties)
 *    - Enforce minimum/maximum component dimensions
 *    - Prevents components from being resized too small or too large
 *    - If omitted, library uses defaults (100px min width, 80px min height)
 *
 * 4. **Custom Selection Colors** (`selectionColor` property)
 *    - Override default blue selection outline
 *    - Helps visually distinguish component types
 *    - Applied when component is selected
 *
 * 5. **Custom Palette Items** (`renderPaletteItem` property)
 *    - Override default palette item rendering
 *    - Return HTML string for custom palette appearance
 *    - Library injects this into the component palette sidebar
 *
 * 6. **Custom Drag Clones** (`renderDragClone` property)
 *    - Override default drag preview during palette drag
 *    - Return HTML string for custom drag appearance
 *    - Library creates this element during drag operations
 *
 * 7. **Component Rendering** (`render` property)
 *    - Function that returns the actual component to render
 *    - Receives config data from grid state
 *    - Uses JSX to return Stencil components or standard HTML
 */
/**
 * Categorized Component Groups
 * =============================
 *
 * Multiple Palette Pattern Demonstration:
 * - Components grouped by category
 * - Each category can be rendered in its own <component-palette>
 * - All palettes drag to the same canvases
 * - Enables collapsible sections and better organization
 */
// Content category - text-based components
const contentComponents = [
    {
        type: 'blog-header',
        name: 'Blog Header',
        icon: '📰',
        defaultSize: { width: 50, height: 5 },
        minSize: { width: 20, height: 3 },
        maxSize: { width: 50, height: 10 },
        selectionColor: '#3b82f6',
        renderPaletteItem: ({ componentType, name, icon }) => (h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => h("blog-header-drag-clone", null),
        render: ({ config }) => (h("blog-header", { headerTitle: (config === null || config === void 0 ? void 0 : config.title) || 'Default Header', subtitle: config === null || config === void 0 ? void 0 : config.subtitle })),
    },
    {
        type: 'blog-article',
        name: 'Blog Article',
        icon: '📝',
        defaultSize: { width: 25, height: 10 },
        selectionColor: '#10b981',
        renderPaletteItem: ({ componentType, name, icon }) => (h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => h("blog-article-drag-clone", null),
        render: ({ config }) => (h("blog-article", { content: (config === null || config === void 0 ? void 0 : config.content) || 'Article content goes here', author: config === null || config === void 0 ? void 0 : config.author, date: config === null || config === void 0 ? void 0 : config.date })),
    },
    {
        type: 'blog-image',
        name: 'Blog Image',
        icon: '🖼️',
        defaultSize: { width: 45, height: 20 },
        minSize: { width: 10, height: 8 },
        selectionColor: '#8b5cf6',
        renderPaletteItem: ({ componentType, name, icon }) => (h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => h("blog-image-drag-clone", null),
        configSchema: [
            {
                name: 'src',
                label: 'Image URL',
                type: 'text',
                defaultValue: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                placeholder: 'Enter image URL',
            },
            {
                name: 'alt',
                label: 'Alt Text',
                type: 'text',
                defaultValue: 'Placeholder image',
                placeholder: 'Enter alt text for accessibility',
            },
            {
                name: 'caption',
                label: 'Caption',
                type: 'text',
                defaultValue: '',
                placeholder: 'Optional caption (max 2 lines)',
            },
            {
                name: 'objectFit',
                label: 'Fit Mode',
                type: 'select',
                defaultValue: 'contain',
                options: [
                    { value: 'contain', label: 'Contain (show all, no crop)' },
                    { value: 'cover', label: 'Cover (fill, may crop)' },
                ],
            },
        ],
        render: ({ config }) => (h("blog-image", { src: (config === null || config === void 0 ? void 0 : config.src) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', alt: (config === null || config === void 0 ? void 0 : config.alt) || 'Placeholder image', caption: config === null || config === void 0 ? void 0 : config.caption, objectFit: (config === null || config === void 0 ? void 0 : config.objectFit) || 'contain' })),
    },
];
// Interactive category - buttons and CTAs
const interactiveComponents = [
    {
        type: 'blog-button',
        name: 'Blog Button',
        icon: '🔘',
        defaultSize: { width: 20, height: 3 },
        minSize: { width: 10, height: 2 },
        maxSize: { width: 30, height: 5 },
        selectionColor: '#ef4444',
        renderPaletteItem: ({ componentType, name, icon }) => (h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => h("blog-button-drag-clone", null),
        render: ({ config }) => (h("blog-button", { label: (config === null || config === void 0 ? void 0 : config.label) || 'Click me!', variant: (config === null || config === void 0 ? void 0 : config.variant) || 'primary', href: config === null || config === void 0 ? void 0 : config.href })),
    },
];
// Media category - galleries, dashboards, and live data
const mediaComponents = [
    {
        type: 'image-gallery',
        name: 'Image Gallery',
        icon: '🖼️',
        defaultSize: { width: 30, height: 12 },
        minSize: { width: 15, height: 8 },
        selectionColor: '#8b5cf6',
        renderPaletteItem: ({ componentType, name, icon }) => (h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => h("image-gallery-drag-clone", null),
        configSchema: [
            {
                name: 'imageCount',
                label: 'Number of Images',
                type: 'select',
                defaultValue: '6',
                options: [
                    { value: '3', label: '3 images' },
                    { value: '6', label: '6 images' },
                    { value: '9', label: '9 images' },
                    { value: '12', label: '12 images' },
                ],
            },
        ],
        render: ({ config }) => (h("image-gallery", { imageCount: parseInt((config === null || config === void 0 ? void 0 : config.imageCount) || '6') })),
    },
    {
        type: 'dashboard-widget',
        name: 'Dashboard',
        icon: '📊',
        defaultSize: { width: 25, height: 10 },
        minSize: { width: 15, height: 8 },
        selectionColor: '#ec4899',
        renderPaletteItem: ({ componentType, name, icon }) => (h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => h("dashboard-widget-drag-clone", null),
        render: () => h("dashboard-widget", null),
    },
    {
        type: 'live-data',
        name: 'Live Data',
        icon: '📡',
        defaultSize: { width: 20, height: 10 },
        minSize: { width: 15, height: 8 },
        selectionColor: '#06b6d4',
        renderPaletteItem: ({ componentType, name, icon }) => (h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => h("live-data-drag-clone", null),
        render: () => h("live-data", null),
    },
];
// All components combined (for grid-builder registration)
const blogComponentDefinitions = [
    ...contentComponents,
    ...interactiveComponents,
    ...mediaComponents,
];

const customConfigPanelCss = ".custom-config-panel{position:fixed;right:0;bottom:0;width:400px;max-width:90vw;max-height:80vh;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px 0 0 0;box-shadow:0 -4px 20px rgba(0, 0, 0, 0.15);display:flex;flex-direction:column;z-index:1000;transform:translateY(100%);transition:transform 0.3s ease-in-out;overflow:hidden}.custom-config-panel.panel-open{transform:translateY(0)}.custom-panel-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:rgba(255, 255, 255, 0.1);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255, 255, 255, 0.2)}.custom-panel-header .header-content{display:flex;align-items:center;gap:12px;color:#ffffff}.custom-panel-header .header-content .component-icon{font-size:24px;line-height:1}.custom-panel-header .header-content h2{margin:0;font-size:20px;font-weight:600;color:#ffffff}.custom-panel-header .close-btn{background:rgba(255, 255, 255, 0.2);border:none;color:#ffffff;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all 0.2s ease}.custom-panel-header .close-btn:hover{background:rgba(255, 255, 255, 0.3);transform:scale(1.1)}.custom-panel-header .close-btn:active{transform:scale(0.95)}.custom-panel-body{flex:1;overflow-y:auto;padding:24px;background:#ffffff}.custom-panel-body .config-section{margin-bottom:24px}.custom-panel-body .config-section:last-child{margin-bottom:0}.custom-panel-body .config-section .section-label{display:block;font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}.custom-panel-body .config-section.info-section{background:#f9fafb;border-radius:8px;padding:16px}.custom-panel-body .config-section.info-section .info-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e5e7eb}.custom-panel-body .config-section.info-section .info-row:last-child{border-bottom:none;padding-bottom:0}.custom-panel-body .config-section.info-section .info-row:first-child{padding-top:0}.custom-panel-body .config-section.info-section .info-row .info-label{font-size:13px;font-weight:500;color:#6b7280}.custom-panel-body .config-section.info-section .info-row .info-value{font-size:13px;color:#1f2937;font-family:\"Monaco\", \"Menlo\", monospace;background:#ffffff;padding:4px 8px;border-radius:4px}.custom-panel-body .config-field{margin-bottom:16px}.custom-panel-body .config-field:last-child{margin-bottom:0}.custom-panel-body .config-field .field-label{display:block;font-size:13px;font-weight:500;color:#4b5563;margin-bottom:6px}.custom-panel-body .text-input{width:100%;padding:10px 12px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;color:#1f2937;transition:all 0.2s ease}.custom-panel-body .text-input:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102, 126, 234, 0.1)}.custom-panel-body .text-input:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}.custom-panel-body .text-input::placeholder{color:#9ca3af}.custom-panel-body .select-input{width:100%;padding:10px 12px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;color:#1f2937;background:#ffffff;cursor:pointer;transition:all 0.2s ease}.custom-panel-body .select-input:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102, 126, 234, 0.1)}.custom-panel-body .checkbox-label{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none}.custom-panel-body .checkbox-label input[type=checkbox]{width:18px;height:18px;cursor:pointer;accent-color:#667eea}.custom-panel-body .checkbox-label .checkbox-text{font-size:14px;color:#4b5563}.custom-panel-body .color-input-wrapper{display:flex;align-items:center;gap:12px}.custom-panel-body .color-input-wrapper .color-input{width:60px;height:40px;border:2px solid #e5e7eb;border-radius:6px;cursor:pointer;transition:all 0.2s ease}.custom-panel-body .color-input-wrapper .color-input:hover{border-color:#667eea}.custom-panel-body .color-input-wrapper .color-value{font-size:13px;font-family:\"Monaco\", \"Menlo\", monospace;color:#6b7280;background:#f9fafb;padding:8px 12px;border-radius:4px}.custom-panel-body .no-config-message{text-align:center;color:#9ca3af;font-size:14px;padding:24px;margin:0}.custom-panel-body .field-error{color:#ef4444;font-size:13px;margin:0;padding:8px;background:#fef2f2;border-radius:4px}.custom-panel-footer{display:flex;gap:12px;padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb}.custom-panel-footer .btn{flex:1;padding:12px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease;text-transform:uppercase;letter-spacing:0.5px}.custom-panel-footer .btn:active{transform:translateY(1px)}.custom-panel-footer .btn.btn-secondary{background:#ffffff;color:#6b7280;border:2px solid #e5e7eb}.custom-panel-footer .btn.btn-secondary:hover{background:#f9fafb;border-color:#d1d5db}.custom-panel-footer .btn.btn-primary{background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:#ffffff;box-shadow:0 4px 6px rgba(102, 126, 234, 0.3)}.custom-panel-footer .btn.btn-primary:hover{box-shadow:0 6px 12px rgba(102, 126, 234, 0.4);transform:translateY(-2px)}.custom-panel-footer .btn.btn-primary:active{transform:translateY(0);box-shadow:0 2px 4px rgba(102, 126, 234, 0.3)}@media (max-width: 768px){.custom-config-panel{width:100%;max-width:100vw;max-height:70vh;border-radius:12px 12px 0 0}}";

const CustomConfigPanel = /*@__PURE__*/ proxyCustomElement(class CustomConfigPanel extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
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
    static get style() { return customConfigPanelCss; }
}, [256, "custom-config-panel", {
        "api": [16],
        "isOpen": [32],
        "selectedItemId": [32],
        "selectedCanvasId": [32],
        "componentConfig": [32],
        "componentName": [32]
    }, undefined, {
        "api": ["handleApiChange"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-config-panel", "blog-article", "blog-article-drag-clone", "blog-button", "blog-button-drag-clone", "blog-header", "blog-header-drag-clone", "blog-image", "blog-image-drag-clone", "custom-palette-item", "dashboard-widget", "dashboard-widget-drag-clone", "image-gallery", "image-gallery-drag-clone", "live-data", "live-data-drag-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-config-panel":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, CustomConfigPanel);
            }
            break;
        case "blog-article":
            if (!customElements.get(tagName)) {
                defineCustomElement$f();
            }
            break;
        case "blog-article-drag-clone":
            if (!customElements.get(tagName)) {
                defineCustomElement$e();
            }
            break;
        case "blog-button":
            if (!customElements.get(tagName)) {
                defineCustomElement$d();
            }
            break;
        case "blog-button-drag-clone":
            if (!customElements.get(tagName)) {
                defineCustomElement$c();
            }
            break;
        case "blog-header":
            if (!customElements.get(tagName)) {
                defineCustomElement$b();
            }
            break;
        case "blog-header-drag-clone":
            if (!customElements.get(tagName)) {
                defineCustomElement$a();
            }
            break;
        case "blog-image":
            if (!customElements.get(tagName)) {
                defineCustomElement$9();
            }
            break;
        case "blog-image-drag-clone":
            if (!customElements.get(tagName)) {
                defineCustomElement$8();
            }
            break;
        case "custom-palette-item":
            if (!customElements.get(tagName)) {
                defineCustomElement$7();
            }
            break;
        case "dashboard-widget":
            if (!customElements.get(tagName)) {
                defineCustomElement$6();
            }
            break;
        case "dashboard-widget-drag-clone":
            if (!customElements.get(tagName)) {
                defineCustomElement$5();
            }
            break;
        case "image-gallery":
            if (!customElements.get(tagName)) {
                defineCustomElement$4();
            }
            break;
        case "image-gallery-drag-clone":
            if (!customElements.get(tagName)) {
                defineCustomElement$3();
            }
            break;
        case "live-data":
            if (!customElements.get(tagName)) {
                defineCustomElement$2();
            }
            break;
        case "live-data-drag-clone":
            if (!customElements.get(tagName)) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { CustomConfigPanel as C, blogComponentDefinitions as b, contentComponents as c, defineCustomElement as d, interactiveComponents as i, mediaComponents as m };
//# sourceMappingURL=custom-config-panel2.js.map

//# sourceMappingURL=custom-config-panel2.js.map