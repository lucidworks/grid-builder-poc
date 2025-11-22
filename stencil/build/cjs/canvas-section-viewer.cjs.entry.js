'use strict';

var index = require('./index-DAu61QiP.js');
var gridCalculations = require('./grid-calculations-DX57Rz04.js');
var canvasHeightCalculator = require('./canvas-height-calculator-DwPWMelm.js');
require('./state-manager-qdr9_6qb.js');

const canvasSectionViewerCss = "@charset \"UTF-8\";.canvas-section-viewer{display:block;width:100%;margin:0;padding:0;}.canvas-section-viewer .grid-container{position:relative;width:100%;background-color:#ffffff;background-image:none !important;overflow:visible}";

const CanvasSectionViewer = class {
    constructor(hostRef) {
        index.registerInstance(this, hostRef);
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
            this.calculatedHeight = canvasHeightCalculator.calculateCanvasHeightFromItems(this.items, this.currentViewport, this.config);
        };
        /**
         * Setup ResizeObserver for grid cache invalidation
         *
         * **Purpose**: Detect container size changes and force grid recalculation
         *
         * **Observer callback**:
         * 1. Clear grid size cache (grid-calculations.ts)
         * 2. Increment renderVersion (triggers item re-renders)
         * 3. Recalculate canvas height
         *
         * **Why needed**:
         * - Grid calculations cached for performance
         * - Cache based on container width (responsive 2% units)
         * - Container resize invalidates cache
         * - Items need to recalculate positions with new dimensions
         */
        this.setupResizeObserver = () => {
            if (!this.gridContainerRef || this.resizeObserver) {
                return;
            }
            // Watch for canvas container size changes
            this.resizeObserver = new ResizeObserver(() => {
                // Clear grid size cache when container resizes
                gridCalculations.clearGridSizeCache();
                // Recalculate canvas height
                this.updateCanvasHeight();
                // Force re-render to update item positions
                this.renderVersion++;
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
        const minHeightPx = gridCalculations.gridToPixelsY(minHeightGridUnits, this.config);
        return (index.h("div", { key: '7495c19c52cea505cccd6a6832aeddd80ebdc2c9', class: "canvas-section-viewer", "data-canvas-id": this.canvasId }, index.h("div", { key: 'bb581573c4d122e06d6942f450d670bb1234d578', class: "grid-container", id: this.canvasId, "data-canvas-id": this.canvasId, style: {
                backgroundColor: this.backgroundColor || '#ffffff',
                minHeight: `${minHeightPx}px`,
                height: this.calculatedHeight > 0 ? `${this.calculatedHeight}px` : undefined,
            }, ref: (el) => (this.gridContainerRef = el) }, (_c = this.items) === null || _c === void 0 ? void 0 : _c.map((item) => (index.h("grid-item-wrapper", { key: item.id, item: item, renderVersion: this.renderVersion, config: this.config, componentRegistry: this.componentRegistry, viewerMode: true, currentViewport: this.currentViewport, canvasItems: this.items }))))));
    }
    static get watchers() { return {
        "items": ["handleItemsChange"],
        "currentViewport": ["handleViewportChange"]
    }; }
};
CanvasSectionViewer.style = canvasSectionViewerCss;

exports.canvas_section_viewer = CanvasSectionViewer;
//# sourceMappingURL=canvas-section-viewer.entry.cjs.js.map
