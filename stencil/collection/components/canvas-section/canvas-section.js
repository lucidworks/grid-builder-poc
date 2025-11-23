/**
 * Canvas Section Component
 * ========================
 *
 * Individual canvas dropzone with grid background and item rendering.
 * This is a library component designed to work with the grid-builder component.
 *
 * ## Purpose
 *
 * Provides a single canvas section with:
 * - **Dropzone**: Accepts palette items and grid items via interact.js
 * - **Grid background**: Visual 2% horizontal × 20px vertical grid
 * - **Item rendering**: Renders all items on this canvas
 * - **ResizeObserver**: Invalidates grid cache on resize
 *
 * ## Key Differences from POC
 *
 * **Removed POC-specific features**:
 * - Section controls (background color picker, clear button, delete button)
 * - Section header with number
 * - Confirm dialogs
 * - section-delete events
 *
 * **Library-specific features**:
 * - Clean canvas without UI controls
 * - Grid background based on GridConfig
 * - Designed to be used inside grid-builder component
 *
 * ## Dropzone Behavior
 *
 * **Accepts two types of drops**:
 *
 * ### 1. Palette Item (Create New)
 * ```typescript
 * new CustomEvent('canvas-drop', {
 *   detail: { canvasId, componentType, x, y },
 *   bubbles: true,
 *   composed: true
 * })
 * ```
 *
 * ### 2. Grid Item (Cross-Canvas Move)
 * ```typescript
 * new CustomEvent('canvas-move', {
 *   detail: { itemId, sourceCanvasId, targetCanvasId, x, y },
 *   bubbles: true,
 *   composed: true
 * })
 * ```
 *
 * ## Grid Background
 *
 * **CSS grid pattern**:
 * - Horizontal: 2% of container width (responsive)
 * - Vertical: 20px (fixed)
 * - Color: rgba(0,0,0,0.05)
 * - Toggleable via gridState.showGrid
 *
 * ## Performance
 *
 * **ResizeObserver**: Clears grid cache on container resize
 * **Virtual rendering**: Items use VirtualRenderer for lazy loading
 * **Render version**: Forces item recalculation on resize
 *
 * @module canvas-section
 */
import { h } from "@stencil/core";
import interact from "interactjs";
// Internal imports
import { gridState, onChange, setActiveCanvas } from "../../services/state-manager";
import { clearGridSizeCache, gridToPixelsX, gridToPixelsY, getGridSizeVertical } from "../../utils/grid-calculations";
import { calculateCanvasHeight } from "../../utils/canvas-height-calculator";
/**
 * CanvasSection Component
 * =======================
 *
 * Library component providing individual canvas dropzone.
 *
 * **Tag**: `<canvas-section>`
 * **Shadow DOM**: Disabled (required for interact.js compatibility)
 * **Reactivity**: Listens to gridState changes via StencilJS store
 */
export class CanvasSection {
    constructor() {
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
         *   opacity: 1;
         * }
         * ```
         *
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
            this.gridContainerRef.addEventListener('click', (event) => {
                // Only fire if clicking directly on the grid container
                // (not on a grid item or other child element)
                if (event.target === this.gridContainerRef) {
                    // Set this canvas as active
                    setActiveCanvas(this.canvasId);
                    // Emit canvas-activated event
                    const canvasActivatedEvent = new CustomEvent('canvas-activated', {
                        detail: {
                            canvasId: this.canvasId,
                        },
                        bubbles: true,
                        composed: true,
                    });
                    this.gridContainerRef.dispatchEvent(canvasActivatedEvent);
                    // Emit canvas-click event (backward compatibility)
                    const canvasClickEvent = new CustomEvent('canvas-click', {
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
         * Setup ResizeObserver for grid cache invalidation
         *
         * **Purpose**: Detect container size changes and force grid recalculation
         *
         * **Observer callback**:
         * 1. Clear grid size cache (grid-calculations.ts)
         * 2. Increment renderVersion (triggers item re-renders)
         *
         * **Why needed**:
         * - Grid calculations cached for performance
         * - Cache based on container width (responsive 2% units)
         * - Container resize invalidates cache
         * - Items need to recalculate positions with new dimensions
         */
        this.setupResizeObserver = () => {
            if (!this.gridContainerRef) {
                return;
            }
            // Watch for canvas container size changes
            this.resizeObserver = new ResizeObserver(() => {
                // Clear grid size cache when container resizes
                clearGridSizeCache();
                // Force re-render to update item positions
                this.renderVersion++;
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
                accept: '.palette-item, .grid-item, .grid-item-header',
                overlap: 'pointer',
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
                        const paletteItem = droppedElement.closest('.palette-item');
                        if (paletteItem) {
                            droppedElement = paletteItem;
                        }
                        const isPaletteItem = droppedElement.classList.contains('palette-item');
                        // Mark palette item drop as valid (for snap-back animation)
                        if (isPaletteItem) {
                            droppedElement._dropWasValid = true;
                        }
                        // Check if it's a grid item or grid item header (drag handle)
                        const isGridItemHeader = droppedElement.classList.contains('grid-item-header');
                        const isGridItem = droppedElement.classList.contains('grid-item');
                        // If it's the header, find the parent grid-item
                        const gridItem = isGridItemHeader
                            ? droppedElement.closest('.grid-item')
                            : droppedElement;
                        if (isPaletteItem) {
                            // Dropping from palette - create new item
                            const componentType = droppedElement.getAttribute('data-component-type');
                            // Get stored dimensions from palette drag handler (or fall back to 10×6 default)
                            const defaultWidth = droppedElement._defaultWidth || 10;
                            const defaultHeight = droppedElement._defaultHeight || 6;
                            const widthPx = gridToPixelsX(defaultWidth, this.canvasId, this.config);
                            const heightPx = gridToPixelsY(defaultHeight);
                            const halfWidth = widthPx / 2;
                            const halfHeight = heightPx / 2;
                            // Get drop position relative to grid container (cursor-centered)
                            const rect = this.gridContainerRef.getBoundingClientRect();
                            const x = event.dragEvent.clientX - rect.left - halfWidth;
                            const y = event.dragEvent.clientY - rect.top - halfHeight;
                            // Dispatch custom event for grid-builder to handle
                            const dropEvent = new CustomEvent('canvas-drop', {
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
                            const sourceCanvasId = gridItem.getAttribute('data-canvas-id');
                            // Only process cross-canvas moves
                            if (sourceCanvasId !== this.canvasId) {
                                // Get element's position (already positioned by drag handler)
                                const droppedRect = gridItem.getBoundingClientRect();
                                const rect = this.gridContainerRef.getBoundingClientRect();
                                // Calculate position relative to target canvas
                                const x = droppedRect.left - rect.left;
                                const y = droppedRect.top - rect.top;
                                // Dispatch custom event for cross-canvas move
                                const moveEvent = new CustomEvent('canvas-move', {
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
        this.canvas = gridState.canvases[this.canvasId];
        // Calculate initial height
        this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config);
        // Subscribe to state changes
        onChange('canvases', () => {
            try {
                if (this.canvasId && gridState.canvases[this.canvasId]) {
                    this.canvas = gridState.canvases[this.canvasId];
                    this.renderVersion++; // Force re-render
                    // Recalculate canvas height based on content
                    this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config);
                }
            }
            catch (error) {
                console.debug('Canvas section state update skipped:', error);
            }
        });
        // Subscribe to viewport changes (desktop ↔ mobile)
        onChange('currentViewport', () => {
            // Recalculate height for new viewport layout
            this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config);
        });
        // Subscribe to grid visibility changes
        onChange('showGrid', () => {
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
        this.canvas = gridState.canvases[this.canvasId];
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
        this.canvas = gridState.canvases[newCanvasId];
        // Recalculate canvas height for new canvas
        this.calculatedHeight = calculateCanvasHeight(newCanvasId, this.config);
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
        // Recalculate canvas height with new config
        this.calculatedHeight = calculateCanvasHeight(this.canvasId, newConfig);
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
        var _a, _b, _c;
        const showGrid = gridState.showGrid;
        const verticalGridSize = getGridSizeVertical(this.config);
        // Calculate min-height from config (default 20 grid units)
        const minHeightGridUnits = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.canvasMinHeight) !== null && _b !== void 0 ? _b : 20;
        const minHeightPx = gridToPixelsY(minHeightGridUnits, this.config);
        return (h("div", { key: 'bc5192c7b62094bddee28fd3160dea812c1c9529', class: "canvas-section", "data-canvas-id": this.canvasId }, h("div", { key: '56d6c915ceb7053236f5fa240b64d6dd60cfce11', class: {
                'grid-container': true,
                'hide-grid': !showGrid,
                'active': this.isActive,
                'drop-target': this.isDropTarget,
            }, id: this.canvasId, "data-canvas-id": this.canvasId, style: Object.assign({ backgroundColor: this.backgroundColor || '#ffffff', backgroundSize: `2% ${verticalGridSize}px`, minHeight: `${minHeightPx}px` }, (this.calculatedHeight > 0 ? { height: `${this.calculatedHeight}px` } : {})), ref: (el) => (this.gridContainerRef = el) }, (_c = this.canvas) === null || _c === void 0 ? void 0 : _c.items.map((item) => (h("grid-item-wrapper", { key: item.id, item: item, renderVersion: this.renderVersion, config: this.config, componentRegistry: this.componentRegistry, onBeforeDelete: this.onBeforeDelete }))))));
    }
    static get is() { return "canvas-section"; }
    static get originalStyleUrls() {
        return {
            "$": ["canvas-section.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["canvas-section.css"]
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
                    "text": "Canvas ID for state management\n\n**Format**: 'canvas1', 'canvas2', etc.\n**Purpose**: Key for accessing canvas data in gridState.canvases\n**Required**: Component won't render without valid canvasId"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "canvas-id"
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
                    "text": "Grid configuration options\n\n**Optional**: Customizes grid system behavior\n**Passed from**: grid-builder component\n**Used for**: Grid size calculations, constraints"
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
                    "text": "Component registry (from parent grid-builder)\n\n**Source**: grid-builder component (built from components prop)\n**Structure**: Map<type, ComponentDefinition>\n**Purpose**: Pass to grid-item-wrapper for dynamic rendering"
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
                    "tags": [{
                            "name": "example",
                            "text": "```tsx\n<canvas-section\n  canvasId=\"hero-section\"\n  backgroundColor=\"#f0f4f8\"\n/>\n```"
                        }],
                    "text": "Background color for this canvas\n\n**Host app responsibility**: Pass canvas styling from host app\n**Library does NOT store**: backgroundColor is presentation concern\n**Optional**: Defaults to '#ffffff'"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "background-color"
            },
            "canvasTitle": {
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
                    "tags": [{
                            "name": "example",
                            "text": "```tsx\n<canvas-section\n  canvasId=\"hero-section\"\n  canvasTitle=\"Hero Section\"\n/>\n```"
                        }],
                    "text": "Canvas title (from canvasMetadata)\n\n**Optional**: Display title for this section\n**Renders as**: Rotated tab on right side, outside section bounds\n**Builder mode only**: Title tabs visible in builder, not viewer\n**Source**: Passed from grid-builder via canvasMetadata[canvasId].title"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "canvas-title"
            },
            "isActive": {
                "type": "boolean",
                "mutable": false,
                "complexType": {
                    "original": "boolean",
                    "resolved": "boolean",
                    "references": {}
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [{
                            "name": "example",
                            "text": "```tsx\n<canvas-section\n  canvasId=\"hero-section\"\n  isActive={gridState.activeCanvasId === 'hero-section'}\n/>\n```"
                        }],
                    "text": "Whether this canvas is currently active\n\n**Purpose**: Indicate which canvas is currently focused/active\n**Source**: Computed from gridState.activeCanvasId in grid-builder\n**Default**: false\n**Visual effect**: Applies 'active' CSS class to grid-container\n\n**Canvas becomes active when**:\n- User clicks item on canvas\n- User clicks canvas background\n- User starts dragging item on canvas\n- User starts resizing item on canvas\n- Programmatically via api.setActiveCanvas()\n\n**Consumer styling hook**:\nConsumer can style active canvas via CSS:\n```css\n.grid-container.active .canvas-title {\n  opacity: 1;\n}\n```"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "is-active",
                "defaultValue": "false"
            },
            "onBeforeDelete": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "(context: any) => boolean | Promise<boolean>",
                    "resolved": "(context: any) => boolean | Promise<boolean>",
                    "references": {
                        "Promise": {
                            "location": "global",
                            "id": "global::Promise"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Deletion hook (from parent grid-builder)\n\n**Source**: grid-builder component (from onBeforeDelete prop)\n**Purpose**: Pass through to grid-item-wrapper for deletion interception\n**Optional**: If not provided, components delete immediately"
                },
                "getter": false,
                "setter": false
            }
        };
    }
    static get states() {
        return {
            "canvas": {},
            "renderVersion": {},
            "calculatedHeight": {},
            "isDropTarget": {}
        };
    }
    static get watchers() {
        return [{
                "propName": "canvasId",
                "methodName": "handleCanvasIdChange"
            }, {
                "propName": "config",
                "methodName": "handleConfigChange"
            }, {
                "propName": "isActive",
                "methodName": "handleIsActiveChange"
            }];
    }
}
//# sourceMappingURL=canvas-section.js.map
