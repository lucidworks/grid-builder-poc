import { r as registerInstance, h, e as Host, d as getElement } from './index-CoCbyscT.js';
import { c as createDebugLogger, a as createStore } from './debug-BAq8PPFJ.js';
import { V as VirtualRendererService } from './virtual-renderer-CMNhlZbw.js';

const gridViewerCss = "@charset \"UTF-8\";:host{--grid-viewer-primary-color:#007bff;--grid-viewer-canvas-bg:#ffffff;--grid-viewer-font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\",\n    \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif;display:block;width:100%;height:100%;font-family:var(--grid-viewer-font-family)}.grid-viewer-container{width:100%;height:100%;background:var(--grid-viewer-canvas-bg);overflow:auto}.canvas-area{width:100%;height:100%;overflow-y:auto;overflow-x:hidden}.canvases-container{display:flex;flex-direction:column;gap:0;width:100%;min-height:100%}";

const debug = createDebugLogger("grid-viewer");
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
                    const width = this.hostElement.offsetWidth ||
                        ((_b = (_a = entry.borderBoxSize) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.inlineSize) ||
                        entry.contentRect.width;
                    // Skip viewport switching if width is 0 or very small (container not yet laid out)
                    // This prevents premature switching to mobile before CSS layout is complete
                    if (width < 100) {
                        debug.log(`📱 [Viewer] Skipping viewport switch - container not yet laid out (width: ${Math.round(width)}px)`);
                        return;
                    }
                    // Determine target viewport based on container width
                    const targetViewport = width < 768 ? "mobile" : "desktop";
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
        var _a;
        // Validate required props
        if (!this.components || this.components.length === 0) {
            console.error("GridViewer: components prop is required");
            return;
        }
        // Build component registry
        this.componentRegistry = new Map(this.components.map((comp) => [comp.type, comp]));
        // Validate unique component types
        if (this.componentRegistry.size !== this.components.length) {
            debug.warn("GridViewer: Duplicate component types detected");
        }
        // Initialize local viewer state store with editing-only fields set to null
        // This allows grid-item-wrapper to access these fields without defensive guards
        // while maintaining viewer mode as display-only (no actual selection/editing)
        const initialViewerState = {
            canvases: {},
            currentViewport: "desktop",
            selectedItemId: null, // Always null in viewer mode (no selection)
            selectedCanvasId: null, // Always null in viewer mode (no selection)
            activeCanvasId: null, // Always null in viewer mode (no active canvas)
        };
        // Restore initial state if provided
        if (this.initialState) {
            // Handle both ViewerState and GridExport formats
            if ("viewport" in this.initialState) {
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
        // Create virtual renderer if enabled (Performance for large layouts)
        if (((_a = this.config) === null || _a === void 0 ? void 0 : _a.enableVirtualRendering) !== false) {
            this.virtualRendererInstance = new VirtualRendererService();
        }
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
        this.componentRegistry = new Map(newComponents.map((comp) => [comp.type, comp]));
    }
    /**
     * Watch initialState prop for changes
     *
     * **Purpose**: Update viewer state when initialState prop changes
     */
    handleInitialStateChange(newState) {
        if (newState) {
            // Handle both ViewerState and GridExport formats
            if ("viewport" in newState) {
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
            host.style.setProperty("--grid-viewer-primary-color", theme.primaryColor);
        }
        if (theme.canvasBackground) {
            host.style.setProperty("--grid-viewer-canvas-bg", theme.canvasBackground);
        }
        if (theme.fontFamily) {
            host.style.setProperty("--grid-viewer-font-family", theme.fontFamily);
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
        return (h(Host, { key: 'b2242c7e1bafae7bbe6ceba267df77aad7d01482', ref: (el) => (this.el = el) }, h("div", { key: '63206fee7bb4776226a850deb870510ba07d055d', class: "grid-viewer-container" }, h("div", { key: '0d43d0b4c19096958b5c4d0f37ab7ce7dd8533f6', class: "canvas-area" }, h("div", { key: '3d0c54c70018495b35ab34bf512ae0c2645d80f5', class: "canvases-container" }, canvasIds.map((canvasId) => {
            var _a, _b;
            return (h("canvas-section-viewer", { key: canvasId, canvasId: canvasId, config: this.config, componentRegistry: this.componentRegistry, items: this.viewerState.state.canvases[canvasId].items, currentViewport: this.viewerState.state.currentViewport, backgroundColor: (_b = (_a = this.canvasMetadata) === null || _a === void 0 ? void 0 : _a[canvasId]) === null || _b === void 0 ? void 0 : _b.backgroundColor, virtualRendererInstance: this.virtualRendererInstance, stateInstance: this.viewerState.state }));
        }))))));
    }
    get hostElement() { return getElement(this); }
    static get watchers() { return {
        "components": ["handleComponentsChange"],
        "initialState": ["handleInitialStateChange"]
    }; }
};
GridViewer.style = gridViewerCss;

export { GridViewer as grid_viewer };
//# sourceMappingURL=grid-viewer.entry.esm.js.map
