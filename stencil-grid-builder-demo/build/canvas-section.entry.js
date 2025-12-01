import { r as registerInstance, h } from './index-CoCbyscT.js';
import { i as interact } from './interact.min-DWbYNq4G.js';
import { s as setGridSizeCache, a as gridToPixelsX, b as gridToPixelsY, g as getGridSizeVertical } from './grid-calculations-C87xQzOc.js';
import { c as calculateCanvasHeight } from './canvas-height-calculator-DZUgHSLe.js';
import './state-manager-BtBFePO6.js';
import './debug-BAq8PPFJ.js';

const canvasSectionCss = ".canvas-section{position:relative;display:flex;width:100%;margin:0;padding:0;flex-direction:column}.grid-container{position:relative;width:100%;background-image:linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);transition:background-color 0.2s}.grid-container.hide-grid{background-image:none}.grid-container.active{outline:2px solid var(--primary-color, #007bff);outline-offset:-2px;box-shadow:0 0 0 1px rgba(0, 123, 255, 0.3)}.grid-container.drop-target:not(.active){outline:3px dashed var(--primary-color, #007bff);outline-offset:-3px;box-shadow:0 0 0 3px color-mix(in srgb, var(--primary-color) 25%, transparent), inset 0 0 30px color-mix(in srgb, var(--primary-color) 15%, transparent);background-color:color-mix(in srgb, var(--primary-color) 8%, transparent)}.canvas-title{opacity:0.3;transition:opacity 0.2s ease}.canvas-header:has(+canvas-section .grid-container.active) .canvas-title{opacity:1}@keyframes canvas-highlight-pulse{0%,100%{box-shadow:0 0 0 0 var(--primary-color, #f59e0b);opacity:1}50%{box-shadow:0 0 0 4px var(--primary-color, #f59e0b);opacity:0.7}}.canvas-highlight{animation:canvas-highlight-pulse 600ms ease-out}@keyframes position-indicator-fade{0%{opacity:0.8}70%{opacity:0.8}100%{opacity:0}}.position-indicator{position:absolute;border:2px dashed var(--primary-color, #007bff);opacity:0.8;pointer-events:none;z-index:9999;animation:position-indicator-fade 800ms ease-out forwards}";

const CanvasSection = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Whether this canvas is currently active
         *
         * **Purpose**: Indicate which canvas is currently focused/active
         * **Source**: Computed from gridState.activeCanvasId in grid-builder
         * **Default**: false
         * **Visual effect**: Applies 'active' CSS class to grid-container
         *
         * **Canvas becomes active when**:
         * - User clicks item on canvas
         * - User clicks canvas background
         * - User starts dragging item on canvas
         * - User starts resizing item on canvas
         * - Programmatically via api.setActiveCanvas()
         *
         * **Consumer styling hook**:
         * Consumer can style active canvas via CSS:
         * ```css
         * .grid-container.active .canvas-title {
         * opacity: 1;
         * }
         * ```
         * @example
         * ```tsx
         * <canvas-section
         *   canvasId="hero-section"
         *   isActive={gridState.activeCanvasId === 'hero-section'}
         * />
         * ```
         */
        this.isActive = false;
        /**
         * Render version counter (forces re-renders)
         *
         * **Purpose**: Trigger re-renders when grid calculations change
         * **Incremented on**: ResizeObserver events, state changes
         * **Passed to**: grid-item-wrapper as prop
         * **Why needed**: Grid calculations cached, need to recalculate on resize
         */
        this.renderVersion = 0;
        /**
         * Calculated canvas height (content-based)
         *
         * **Purpose**: Dynamic canvas height based on bottommost item
         * **Calculation**: `(bottommost item y + height) + 5 grid units margin`
         * **Updates**: Real-time on item add/move/delete/resize
         * **Minimum**: 0 (CSS min-height: 400px will apply)
         *
         * **Formula**:
         * ```
         * calculatedHeight = gridToPixelsY(maxItemBottom + 5)
         * ```
         *
         * **Applied in render**:
         * ```typescript
         * style={{ height: calculatedHeight > 0 ? `${calculatedHeight}px` : undefined }}
         * ```
         */
        this.calculatedHeight = 0;
        /**
         * Drop target state
         *
         * **Internal state**: Tracks whether this canvas is currently a valid drop target
         * **Used for**: Adding 'drop-target' class for visual feedback during drag operations
         * **Pattern**: Replaces classList manipulation with reactive state
         *
         * **Value**:
         * - false: No drag is over this canvas
         * - true: A draggable element is currently over this canvas
         */
        this.isDropTarget = false;
        /**
         * Dropzone initialization flag
         *
         * **Prevents**: Multiple dropzone setups on same element
         * **Set in**: initializeDropzone()
         * **Checked in**: initializeDropzone(), disconnectedCallback()
         */
        this.dropzoneInitialized = false;
        /**
         * Setup canvas click listener for background selection
         *
         * **Purpose**: Detect clicks on canvas background (not on grid items)
         *
         * **Event dispatch**:
         * - Only fires when clicking empty canvas area
         * - Does not fire when clicking grid items
         * - Bubbles up to grid-builder for host app to handle
         *
         * **Custom event**:
         * ```typescript
         * new CustomEvent('canvas-click', {
         *   detail: { canvasId },
         *   bubbles: true,
         *   composed: true
         * })
         * ```
         *
         * **Use case**: Host app can show canvas settings panel when canvas selected
         */
        this.setupCanvasClickListener = () => {
            if (!this.gridContainerRef) {
                return;
            }
            this.gridContainerRef.addEventListener("click", (event) => {
                // Only fire if clicking directly on the grid container
                // (not on a grid item or other child element)
                if (event.target === this.gridContainerRef) {
                    // Set this canvas as active
                    this.stateInstance.activeCanvasId = this.canvasId;
                    // Emit canvas-activated event
                    const canvasActivatedEvent = new CustomEvent("canvas-activated", {
                        detail: {
                            canvasId: this.canvasId,
                        },
                        bubbles: true,
                        composed: true,
                    });
                    this.gridContainerRef.dispatchEvent(canvasActivatedEvent);
                    // Emit canvas-click event (backward compatibility)
                    const canvasClickEvent = new CustomEvent("canvas-click", {
                        detail: {
                            canvasId: this.canvasId,
                        },
                        bubbles: true,
                        composed: true,
                    });
                    this.gridContainerRef.dispatchEvent(canvasClickEvent);
                }
            });
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
         * 3. Increment renderVersion (triggers item re-renders with cached correct value)
         *
         * **Why this approach**:
         * - ResizeObserver provides accurate width via entry.contentRect
         * - Pre-populating cache bypasses DOM reads during re-render
         * - Prevents reading clientWidth=0 during StencilJS transient DOM state
         * - Grid calculations hit cache instead of reading DOM
         */
        this.setupResizeObserver = () => {
            if (!this.gridContainerRef) {
                return;
            }
            // Watch for canvas container size changes
            this.resizeObserver = new ResizeObserver((entries) => {
                // Use requestAnimationFrame to ensure layout is complete before recalculating
                // This prevents reading containerWidth=0 during StencilJS re-render cycle
                requestAnimationFrame(() => {
                    for (const entry of entries) {
                        // Get width from ResizeObserver entry (more reliable than clientWidth during re-render)
                        const width = entry.contentRect.width;
                        // Only proceed if container is laid out (width > 100px)
                        if (width > 100) {
                            // Pre-populate cache with correct value BEFORE triggering re-render
                            // This ensures grid calculations never read clientWidth=0 during re-render
                            setGridSizeCache(this.canvasId, width, this.config);
                            // Force re-render to update item positions
                            // Grid calculations will now use the cached correct value
                            this.renderVersion++;
                        }
                    }
                });
            });
            this.resizeObserver.observe(this.gridContainerRef);
        };
        /**
         * Initialize interact.js dropzone
         *
         * **Called from**: componentDidLoad (after DOM available)
         * **Purpose**: Setup dropzone to receive palette items and grid items
         *
         * ## Dropzone Configuration
         *
         * **Accept pattern**: `.palette-item, .grid-item`
         * - `.palette-item` - New components from palette
         * - `.grid-item` - Existing items for cross-canvas moves
         *
         * **Overlap mode**: `'pointer'`
         * - Drop detection based on cursor position
         * - More intuitive than element overlap
         *
         * ## Drop Event Handling
         *
         * ### 1. Palette Item Drop (Create New)
         *
         * **Component type extraction**:
         * ```typescript
         * const componentType = droppedElement.getAttribute('data-component-type');
         * ```
         *
         * **Position calculation**:
         * - Get component's defaultSize from definition
         * - Calculate half dimensions for cursor-centering
         * - Subtract half dimensions from cursor position
         *
         * **Custom event dispatch**:
         * ```typescript
         * dispatchEvent(new CustomEvent('canvas-drop', {
         *   detail: { canvasId, componentType, x, y },
         *   bubbles: true,
         *   composed: true
         * }));
         * ```
         *
         * ### 2. Grid Item Drop (Cross-Canvas Move)
         *
         * **Only process cross-canvas moves**:
         * - Same-canvas moves handled by drag handler
         * - Prevents duplicate events
         *
         * **Position calculation**:
         * - Use element's bounding rect (already positioned by drag handler)
         * - Calculate position relative to target canvas
         *
         * **Custom event dispatch**:
         * ```typescript
         * dispatchEvent(new CustomEvent('canvas-move', {
         *   detail: { itemId, sourceCanvasId, targetCanvasId, x, y },
         *   bubbles: true,
         *   composed: true
         * }));
         * ```
         */
        this.initializeDropzone = () => {
            if (!this.gridContainerRef || this.dropzoneInitialized) {
                return;
            }
            const interactable = interact(this.gridContainerRef);
            interactable.dropzone({
                accept: ".palette-item, .grid-item, .grid-item-header",
                overlap: "pointer",
                listeners: {
                    dragenter: (_event) => {
                        // Add visual feedback when drag enters canvas (replaces classList.add)
                        this.isDropTarget = true;
                    },
                    dragleave: (_event) => {
                        // Remove visual feedback when drag leaves canvas (replaces classList.remove)
                        this.isDropTarget = false;
                    },
                    drop: (event) => {
                        // Remove visual feedback on successful drop (replaces classList.remove)
                        this.isDropTarget = false;
                        let droppedElement = event.relatedTarget;
                        // If dropped element is inside a palette item, get the palette item
                        const paletteItem = droppedElement.closest(".palette-item");
                        if (paletteItem) {
                            droppedElement = paletteItem;
                        }
                        const isPaletteItem = droppedElement.classList.contains("palette-item");
                        // Mark palette item drop as valid (for snap-back animation)
                        if (isPaletteItem) {
                            droppedElement._dropWasValid = true;
                        }
                        // Check if it's a grid item or grid item header (drag handle)
                        const isGridItemHeader = droppedElement.classList.contains("grid-item-header");
                        const isGridItem = droppedElement.classList.contains("grid-item");
                        // If it's the header, find the parent grid-item
                        const gridItem = isGridItemHeader
                            ? droppedElement.closest(".grid-item")
                            : droppedElement;
                        if (isPaletteItem) {
                            // Dropping from palette - create new item
                            const componentType = droppedElement.getAttribute("data-component-type");
                            // Get stored dimensions from palette drag handler (or fall back to 10×6 default)
                            const defaultWidth = droppedElement._defaultWidth || 10;
                            const defaultHeight = droppedElement._defaultHeight || 6;
                            const widthPx = gridToPixelsX(defaultWidth, this.canvasId, this.config);
                            const heightPx = gridToPixelsY(defaultHeight, this.config);
                            const halfWidth = widthPx / 2;
                            const halfHeight = heightPx / 2;
                            // Get drop position relative to grid container (cursor-centered)
                            const rect = this.gridContainerRef.getBoundingClientRect();
                            const x = event.dragEvent.clientX - rect.left - halfWidth;
                            const y = event.dragEvent.clientY - rect.top - halfHeight;
                            // Dispatch custom event for grid-builder to handle
                            const dropEvent = new CustomEvent("canvas-drop", {
                                detail: {
                                    canvasId: this.canvasId,
                                    componentType,
                                    x,
                                    y,
                                },
                                bubbles: true,
                                composed: true,
                            });
                            this.gridContainerRef.dispatchEvent(dropEvent);
                        }
                        else if (isGridItem || isGridItemHeader) {
                            // Moving existing grid item to different canvas
                            const itemId = gridItem.id;
                            const sourceCanvasId = gridItem.getAttribute("data-canvas-id");
                            // Only process cross-canvas moves
                            if (sourceCanvasId !== this.canvasId) {
                                // Get element's position (already positioned by drag handler)
                                const droppedRect = gridItem.getBoundingClientRect();
                                const rect = this.gridContainerRef.getBoundingClientRect();
                                // Calculate position relative to target canvas
                                const x = droppedRect.left - rect.left;
                                const y = droppedRect.top - rect.top;
                                // Dispatch custom event for cross-canvas move
                                const moveEvent = new CustomEvent("canvas-move", {
                                    detail: {
                                        itemId,
                                        sourceCanvasId,
                                        targetCanvasId: this.canvasId,
                                        x,
                                        y,
                                    },
                                    bubbles: true,
                                    composed: true,
                                });
                                this.gridContainerRef.dispatchEvent(moveEvent);
                            }
                        }
                    },
                },
            });
            this.dropzoneInitialized = true;
        };
    }
    /**
     * Component will load lifecycle hook
     *
     * **Called**: Before first render
     * **Purpose**: Load initial canvas state and subscribe to changes
     *
     * **Operations**:
     * 1. Load canvas from global state
     * 2. Subscribe to 'canvases' state changes
     * 3. Update local canvas state on changes
     * 4. Increment renderVersion to trigger item re-renders
     */
    componentWillLoad() {
        // Initial load
        this.canvas = this.stateInstance.canvases[this.canvasId];
        // Calculate initial height
        this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config, this.stateInstance);
        // Subscribe to state changes
        this.onStateChange("canvases", () => {
            try {
                if (this.canvasId && this.stateInstance.canvases[this.canvasId]) {
                    this.canvas = this.stateInstance.canvases[this.canvasId];
                    this.renderVersion++; // Force re-render
                    // Recalculate canvas height based on content
                    this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config, this.stateInstance);
                }
            }
            catch (error) {
                console.debug("Canvas section state update skipped:", error);
            }
        });
        // Subscribe to viewport changes (desktop ↔ mobile)
        this.onStateChange("currentViewport", () => {
            // Recalculate height for new viewport layout
            this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config, this.stateInstance);
        });
        // Subscribe to grid visibility changes
        this.onStateChange("showGrid", () => {
            // Force re-render to update grid visibility class
            this.renderVersion++;
        });
    }
    /**
     * Component will update lifecycle hook
     *
     * **Called**: Before each re-render
     * **Purpose**: Ensure canvas reference is fresh from state
     */
    componentWillUpdate() {
        this.canvas = this.stateInstance.canvases[this.canvasId];
    }
    /**
     * Component did load lifecycle hook
     *
     * **Called**: After first render (DOM available)
     * **Purpose**: Initialize interact.js dropzone and ResizeObserver
     */
    componentDidLoad() {
        this.initializeDropzone();
        this.setupResizeObserver();
        this.setupCanvasClickListener();
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Called**: When component removed from DOM
     * **Purpose**: Clean up interact.js and ResizeObserver
     */
    disconnectedCallback() {
        // Cleanup interact.js
        if (this.gridContainerRef && this.dropzoneInitialized) {
            interact(this.gridContainerRef).unset();
        }
        // Cleanup ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    /**
     * Watch for canvasId prop changes
     *
     * **When triggered**: Parent changes which canvas this component displays
     * **Actions**: Reload canvas data from state, recalculate height
     *
     * **Why needed**:
     * - Canvas ID is the key to access state
     * - Changing canvas ID means displaying different canvas
     * - Must reload items, metadata, and recalculate layout
     *
     * **Note**: This is rare in practice - usually canvas IDs are static
     */
    handleCanvasIdChange(newCanvasId, oldCanvasId) {
        // Skip if canvas ID hasn't changed
        if (newCanvasId === oldCanvasId)
            return;
        // Reload canvas data from state
        this.canvas = this.stateInstance.canvases[newCanvasId];
        // Recalculate canvas height for new canvas
        this.calculatedHeight = calculateCanvasHeight(newCanvasId, this.config, this.stateInstance);
        // Reinitialize dropzone with new canvas ID
        // (dropzone needs to know which canvas it belongs to)
        if (this.gridContainerRef && this.dropzoneInitialized) {
            interact(this.gridContainerRef).unset();
            this.dropzoneInitialized = false;
            this.initializeDropzone();
        }
    }
    /**
     * Watch for config prop changes
     *
     * **When triggered**: Parent passes updated GridConfig
     * **Actions**: Recalculate canvas height with new grid settings
     *
     * **Why needed**:
     * - Grid calculations depend on config (min/max grid size, etc.)
     * - Canvas height calculation uses grid-to-pixels conversions
     * - Config changes affect layout calculations
     */
    handleConfigChange(newConfig, oldConfig) {
        // Skip if config reference hasn't changed
        if (newConfig === oldConfig)
            return;
        // Recalculate canvas height with new config (use instance state if available)
        this.calculatedHeight = calculateCanvasHeight(this.canvasId, newConfig, this.stateInstance);
        // Force re-render to update item positions with new grid size
        this.renderVersion++;
    }
    /**
     * Watch for isActive prop changes
     *
     * **When triggered**: Active canvas changes in grid-builder
     * **Purpose**: Apply/remove 'active' CSS class for styling
     *
     * **Note**: No action needed - the prop change triggers re-render
     * and the render() method applies the 'active' class based on this.isActive
     *
     * **Visual feedback**:
     * - Active canvas may have highlighted border
     * - Canvas title may be un-dimmed
     * - Host app can style via `.grid-container.active` selector
     */
    handleIsActiveChange(newIsActive, oldIsActive) {
        // Skip if active state hasn't changed
        if (newIsActive === oldIsActive)
            return;
        // No action needed - render() will apply/remove 'active' class
        // This watcher is just for documentation and potential future enhancements
    }
    /**
     * Render component template
     *
     * **Structure**:
     * - Grid container with background
     * - Dynamic class for grid visibility
     * - Background color from canvas state
     * - Item rendering loop
     *
     * **Grid background**:
     * - CSS linear gradients (2% horizontal, 20px vertical)
     * - Toggleable via gridState.showGrid
     * - Hidden when .hide-grid class applied
     *
     * **Item rendering**:
     * - Maps over canvas.items
     * - Renders grid-item-wrapper for each item
     * - Passes renderVersion to force recalculation
     */
    render() {
        var _a, _b, _c, _d, _e, _f;
        const showGrid = this.stateInstance.showGrid;
        const verticalGridSize = getGridSizeVertical(this.config);
        // Calculate min-height from config (default 20 grid units)
        const minHeightGridUnits = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.canvasMinHeight) !== null && _b !== void 0 ? _b : 20;
        const minHeightPx = gridToPixelsY(minHeightGridUnits, this.config);
        return (h("div", { key: 'a91b9a4b1d7508f9f1d71df384c8e8f54b447207', class: "canvas-section", "data-canvas-id": this.canvasId }, h("div", { key: '21b75c285247f8cbf4aaabf5e630ef7c51fcf607', class: {
                "grid-container": true,
                "hide-grid": !showGrid,
                active: this.isActive,
                "drop-target": this.isDropTarget,
            }, id: this.canvasId, role: "region", "aria-label": this.canvasTitle || `Canvas ${this.canvasId}`, "data-canvas-id": this.canvasId, style: Object.assign({ backgroundColor: this.backgroundColor || "#ffffff", backgroundSize: `2% ${verticalGridSize}px`, backgroundImage: showGrid
                    ? `linear-gradient(${((_c = this.theme) === null || _c === void 0 ? void 0 : _c.gridLineColor) || "rgba(0, 0, 0, 0.05)"} 1px, transparent 1px), linear-gradient(90deg, ${((_d = this.theme) === null || _d === void 0 ? void 0 : _d.gridLineColor) || "rgba(0, 0, 0, 0.05)"} 1px, transparent 1px)`
                    : "none", minHeight: `${minHeightPx}px`, ["--primary-color"]: ((_e = this.theme) === null || _e === void 0 ? void 0 : _e.primaryColor) || "#007bff" }, (this.calculatedHeight > 0
                ? { height: `${this.calculatedHeight}px` }
                : {})), ref: (el) => (this.gridContainerRef = el) }, (_f = this.canvas) === null || _f === void 0 ? void 0 : _f.items.map((item) => (h("grid-item-wrapper", { key: item.id, item: item, renderVersion: this.renderVersion, config: this.config, componentRegistry: this.componentRegistry, onBeforeDelete: this.onBeforeDelete, virtualRendererInstance: this.virtualRendererInstance, eventManagerInstance: this.eventManagerInstance, undoRedoManagerInstance: this.undoRedoManagerInstance, stateInstance: this.stateInstance, domCacheInstance: this.domCacheInstance, theme: this.theme }))))));
    }
    static get watchers() { return {
        "canvasId": ["handleCanvasIdChange"],
        "config": ["handleConfigChange"],
        "isActive": ["handleIsActiveChange"]
    }; }
};
CanvasSection.style = canvasSectionCss;

export { CanvasSection as canvas_section };
//# sourceMappingURL=canvas-section.entry.esm.js.map
