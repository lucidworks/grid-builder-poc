import { r as registerInstance, h } from './index-CoCbyscT.js';
import { s as setGridSizeCache, b as gridToPixelsY } from './grid-calculations-C87xQzOc.js';
import { a as calculateCanvasHeightFromItems } from './canvas-height-calculator-nUbKtEPu.js';
import './state-manager-6NvKjybS.js';
import './debug-BAq8PPFJ.js';

const canvasSectionViewerCss = "@charset \"UTF-8\";.canvas-section-viewer{display:block;width:100%;margin:0;padding:0;}.canvas-section-viewer .grid-container{position:relative;width:100%;background-color:#ffffff;background-image:none !important;overflow:visible}";

const CanvasSectionViewer = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Render version counter (forces re-renders)
         *
         * **Purpose**: Trigger re-renders when grid calculations change
         * **Incremented on**: ResizeObserver events
         * **Passed to**: grid-item-wrapper as prop
         */
        this.renderVersion = 0;
        /**
         * Calculated canvas height based on content
         *
         * **Purpose**: Dynamic canvas height that fits all items
         * **Calculated from**: Item positions (bottom-most item determines height)
         * **Recalculated when**: Items change, viewport changes, or resize occurs
         */
        this.calculatedHeight = 400;
        /**
         * Update canvas height based on current items and viewport
         *
         * **Purpose**: Calculate dynamic height that fits all items
         * **Called when**:
         * - Component loads
         * - Items prop changes
         * - Viewport prop changes
         * - Canvas resizes
         */
        this.updateCanvasHeight = () => {
            if (!this.items || !this.currentViewport) {
                return;
            }
            this.calculatedHeight = calculateCanvasHeightFromItems(this.items, this.currentViewport, this.config);
        };
        /**
         * Setup ResizeObserver for grid cache pre-population
         *
         * **Purpose**: Detect container size changes and pre-populate cache before re-render
         *
         * **Critical Implementation Detail**:
         * Instead of clearing cache and triggering re-render (which causes clientWidth=0 during
         * DOM transient state), we PRE-POPULATE the cache with the correct value from ResizeObserver,
         * THEN trigger re-render. This ensures grid calculations never read stale/zero values.
         *
         * **Observer callback**:
         * 1. Get width from entry.contentRect.width (reliable during re-render)
         * 2. Pre-calculate and cache correct grid size using setGridSizeCache()
         * 3. Recalculate canvas height
         * 4. Increment renderVersion (triggers item re-renders with cached correct value)
         *
         * **Why this approach**:
         * - ResizeObserver provides accurate width via entry.contentRect
         * - Pre-populating cache bypasses DOM reads during re-render
         * - Prevents reading clientWidth=0 during StencilJS transient DOM state
         * - Grid calculations hit cache instead of reading DOM
         */
        this.setupResizeObserver = () => {
            if (!this.gridContainerRef || this.resizeObserver) {
                return;
            }
            // Watch for canvas container size changes
            this.resizeObserver = new ResizeObserver((entries) => {
                // Use requestAnimationFrame to ensure layout is complete before recalculating
                // This prevents reading containerWidth=0 during StencilJS re-render cycle
                requestAnimationFrame(() => {
                    for (const entry of entries) {
                        const width = entry.contentRect.width;
                        // Only proceed if container is laid out (width > 100px)
                        if (width > 100) {
                            // Pre-populate cache with correct value BEFORE triggering re-render
                            // This ensures grid calculations never read clientWidth=0 during re-render
                            setGridSizeCache(this.canvasId, width, this.config);
                            // Recalculate canvas height
                            this.updateCanvasHeight();
                            // Force re-render to update item positions
                            // Grid calculations will now use the cached correct value
                            this.renderVersion++;
                        }
                    }
                });
            });
            this.resizeObserver.observe(this.gridContainerRef);
        };
    }
    /**
     * Component did load lifecycle hook
     *
     * **Called**: After first render (DOM available)
     * **Purpose**: Setup ResizeObserver and calculate initial height
     */
    componentDidLoad() {
        // Calculate initial canvas height
        this.updateCanvasHeight();
        this.setupResizeObserver();
    }
    /**
     * Component did update lifecycle hook
     *
     * **Called**: After props change
     * **Purpose**: Ensure ResizeObserver is setup
     */
    componentDidUpdate() {
        // Ensure ResizeObserver is setup (in case gridContainerRef changed)
        if (!this.resizeObserver && this.gridContainerRef) {
            this.setupResizeObserver();
        }
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up ResizeObserver
     */
    disconnectedCallback() {
        // Cleanup ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    /**
     * Watch items prop for changes
     *
     * **Purpose**: Recalculate canvas height when items change
     */
    handleItemsChange() {
        this.updateCanvasHeight();
    }
    /**
     * Watch currentViewport prop for changes
     *
     * **Purpose**: Recalculate canvas height when viewport changes
     */
    handleViewportChange() {
        this.updateCanvasHeight();
    }
    /**
     * Render canvas template
     *
     * **Structure**:
     * - Canvas wrapper
     * - Grid container (no grid background lines)
     * - Item rendering loop
     *
     * **No grid background**: Cleaner output for viewer
     * **No dropzone**: Rendering-only, no drag-and-drop
     */
    render() {
        var _a, _b, _c;
        // Calculate min-height from config (default 20 grid units)
        const minHeightGridUnits = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.canvasMinHeight) !== null && _b !== void 0 ? _b : 20;
        const minHeightPx = gridToPixelsY(minHeightGridUnits, this.config);
        return (h("div", { key: 'dbdd2acf1f7edc8ef20380cf5a48888a39682b6f', class: "canvas-section-viewer", "data-canvas-id": this.canvasId }, h("div", { key: '2f0a930011607d645700c48b907517520b281051', class: "grid-container", id: this.canvasId, "data-canvas-id": this.canvasId, style: {
                backgroundColor: this.backgroundColor || "#ffffff",
                minHeight: `${minHeightPx}px`,
                height: this.calculatedHeight > 0
                    ? `${this.calculatedHeight}px`
                    : undefined,
            }, ref: (el) => (this.gridContainerRef = el) }, (_c = this.items) === null || _c === void 0 ? void 0 : _c.map((item) => (h("grid-item-wrapper", { key: item.id, item: item, renderVersion: this.renderVersion, config: this.config, componentRegistry: this.componentRegistry, viewerMode: true, currentViewport: this.currentViewport, canvasItems: this.items, virtualRendererInstance: this.virtualRendererInstance, stateInstance: this.stateInstance }))))));
    }
    static get watchers() { return {
        "items": ["handleItemsChange"],
        "currentViewport": ["handleViewportChange"]
    }; }
};
CanvasSectionViewer.style = canvasSectionViewerCss;

export { CanvasSectionViewer as canvas_section_viewer };
//# sourceMappingURL=canvas-section-viewer.entry.esm.js.map
