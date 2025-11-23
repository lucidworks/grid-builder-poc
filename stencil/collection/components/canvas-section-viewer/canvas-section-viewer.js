/**
 * Canvas Section Viewer - Rendering-Only Canvas
 * ==============================================
 *
 * Simplified canvas component for displaying grid layouts without editing features.
 * Used in grid-viewer component for rendering-only mode.
 *
 * ## Key Differences from canvas-section
 *
 * **Excluded from viewer**:
 * - ❌ No interact.js dropzone
 * - ❌ No drag-and-drop handling
 * - ❌ No grid lines (cleaner output)
 * - ❌ No state subscription (items passed via props)
 *
 * **Included in viewer**:
 * - ✅ ResizeObserver for grid cache invalidation
 * - ✅ Item rendering with grid-item-wrapper
 * - ✅ Background color support
 * - ✅ Responsive layout calculations
 *
 * ## Props-Based Architecture
 *
 * **No global state**: All data passed via props
 * ```typescript
 * <canvas-section-viewer
 *   canvasId="hero-section"
 *   items={items}
 *   currentViewport="desktop"
 *   config={gridConfig}
 *   componentRegistry={registry}
 * />
 * ```
 *
 * ## Performance
 *
 * **ResizeObserver**: Clears grid cache on container resize
 * **Virtual rendering**: Items use VirtualRenderer for lazy loading
 * **Render version**: Forces item recalculation on resize
 *
 * @module canvas-section-viewer
 */
import { h } from "@stencil/core";
import { clearGridSizeCache, gridToPixelsY } from "../../utils/grid-calculations";
import { calculateCanvasHeightFromItems } from "../../utils/canvas-height-calculator";
/**
 * CanvasSectionViewer Component
 * ==============================
 *
 * Rendering-only canvas component for grid-viewer.
 *
 * **Tag**: `<canvas-section-viewer>`
 * **Shadow DOM**: Disabled (consistent with canvas-section)
 * **Reactivity**: Props-based (no global state subscription)
 */
export class CanvasSectionViewer {
    constructor() {
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
                clearGridSizeCache();
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
        const minHeightPx = gridToPixelsY(minHeightGridUnits, this.config);
        return (h("div", { key: '7495c19c52cea505cccd6a6832aeddd80ebdc2c9', class: "canvas-section-viewer", "data-canvas-id": this.canvasId }, h("div", { key: 'bb581573c4d122e06d6942f450d670bb1234d578', class: "grid-container", id: this.canvasId, "data-canvas-id": this.canvasId, style: {
                backgroundColor: this.backgroundColor || '#ffffff',
                minHeight: `${minHeightPx}px`,
                height: this.calculatedHeight > 0 ? `${this.calculatedHeight}px` : undefined,
            }, ref: (el) => (this.gridContainerRef = el) }, (_c = this.items) === null || _c === void 0 ? void 0 : _c.map((item) => (h("grid-item-wrapper", { key: item.id, item: item, renderVersion: this.renderVersion, config: this.config, componentRegistry: this.componentRegistry, viewerMode: true, currentViewport: this.currentViewport, canvasItems: this.items }))))));
    }
    static get is() { return "canvas-section-viewer"; }
    static get originalStyleUrls() {
        return {
            "$": ["canvas-section-viewer.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["canvas-section-viewer.css"]
        };
    }
    static get properties() {
        return {
            "canvasId": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Canvas ID for identification\n\n**Format**: 'canvas1', 'hero-section', etc.\n**Purpose**: Element ID and data attribute"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "canvas-id"
            },
            "items": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "GridItem[]",
                    "resolved": "GridItem[]",
                    "references": {
                        "GridItem": {
                            "location": "import",
                            "path": "../../services/state-manager",
                            "id": "src/services/state-manager.ts::GridItem"
                        }
                    }
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Items to render in this canvas\n\n**Required**: Array of GridItem objects\n**Source**: Passed from grid-viewer component\n\n**Unlike canvas-section**: Items passed via props, not from global state"
                },
                "getter": false,
                "setter": false
            },
            "currentViewport": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "'desktop' | 'mobile'",
                    "resolved": "\"desktop\" | \"mobile\"",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Current viewport mode\n\n**Required**: 'desktop' | 'mobile'\n**Source**: Passed from grid-viewer component\n\n**Purpose**: Determines which layout to render for each item"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "current-viewport"
            },
            "config": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "GridConfig",
                    "resolved": "GridConfig",
                    "references": {
                        "GridConfig": {
                            "location": "import",
                            "path": "../../types/grid-config",
                            "id": "src/types/grid-config.ts::GridConfig"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Grid configuration options\n\n**Optional**: Customizes grid system behavior\n**Passed from**: grid-viewer component"
                },
                "getter": false,
                "setter": false
            },
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
                            "path": "../../types/component-definition",
                            "id": "src/types/component-definition.ts::ComponentDefinition"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Component registry (from parent grid-viewer)\n\n**Source**: grid-viewer component\n**Structure**: Map<type, ComponentDefinition>\n**Purpose**: Pass to grid-item-wrapper for dynamic rendering"
                },
                "getter": false,
                "setter": false
            },
            "backgroundColor": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Background color for this canvas\n\n**Optional**: Canvas background color\n**Default**: '#ffffff'"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "background-color"
            }
        };
    }
    static get states() {
        return {
            "renderVersion": {},
            "calculatedHeight": {}
        };
    }
    static get watchers() {
        return [{
                "propName": "items",
                "methodName": "handleItemsChange"
            }, {
                "propName": "currentViewport",
                "methodName": "handleViewportChange"
            }];
    }
}
//# sourceMappingURL=canvas-section-viewer.js.map
