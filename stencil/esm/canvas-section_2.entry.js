import { r as registerInstance, h, a as getElement } from './index-CC73Dkup.js';
import { i as interact } from './interact.min-BKH_Whl_.js';
import { a as setActiveCanvas, s as state, o as onChange } from './state-manager-BIPn53sA.js';
import { c as clearGridSizeCache, b as gridToPixelsX, g as gridToPixelsY, a as getGridSizeVertical } from './grid-calculations-CcbD7Svb.js';
import { a as calculateCanvasHeight } from './canvas-height-calculator-BZ7Vvnp6.js';

const canvasSectionCss = ".canvas-section{position:relative;display:flex;width:100%;margin:0;padding:0;flex-direction:column}.grid-container{position:relative;width:100%;background-image:linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);transition:background-color 0.2s}.grid-container.hide-grid{background-image:none}.grid-container.active{outline:2px solid var(--primary-color, #007bff);outline-offset:-2px;box-shadow:0 0 0 1px rgba(0, 123, 255, 0.3)}.grid-container.drop-target:not(.active){outline:3px dashed var(--primary-color, #007bff);outline-offset:-3px;box-shadow:0 0 0 3px color-mix(in srgb, var(--primary-color) 25%, transparent), inset 0 0 30px color-mix(in srgb, var(--primary-color) 15%, transparent);background-color:color-mix(in srgb, var(--primary-color) 8%, transparent)}.canvas-title{opacity:0.3;transition:opacity 0.2s ease}.canvas-header:has(+canvas-section .grid-container.active) .canvas-title{opacity:1}";

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
        this.canvas = state.canvases[this.canvasId];
        // Calculate initial height
        this.calculatedHeight = calculateCanvasHeight(this.canvasId, this.config);
        // Subscribe to state changes
        onChange('canvases', () => {
            try {
                if (this.canvasId && state.canvases[this.canvasId]) {
                    this.canvas = state.canvases[this.canvasId];
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
        this.canvas = state.canvases[this.canvasId];
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
        this.canvas = state.canvases[newCanvasId];
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
        const showGrid = state.showGrid;
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
    static get watchers() { return {
        "canvasId": ["handleCanvasIdChange"],
        "config": ["handleConfigChange"],
        "isActive": ["handleIsActiveChange"]
    }; }
};
CanvasSection.style = canvasSectionCss;

const componentPaletteCss = ".palette{width:250px;padding:20px;border-right:1px solid #ddd;background:white;overflow-y:auto}.palette h2{margin-bottom:20px;color:#333;font-size:18px}.palette-chromeless{padding-top:10px}.palette-empty{color:#999;font-size:13px;font-style:italic}.palette-item{padding:15px;border-radius:4px;margin-bottom:10px;background:#4a90e2;color:white;cursor:move;font-weight:500;text-align:center;transition:transform 0.2s, box-shadow 0.2s;user-select:none;touch-action:none;}.palette-item:hover{box-shadow:0 4px 8px rgba(0, 0, 0, 0.1);transform:translateY(-2px)}.palette-item.dragging-from-palette{opacity:0.5}.dragging-clone{position:fixed;z-index:10000;pointer-events:none}";

const ComponentPalette = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Show palette header (title)
         *
         * **Optional prop**: Controls whether the "Components" header is displayed
         * **Default**: true (shows header for backward compatibility)
         *
         * **Use cases**:
         * - `showHeader={true}` (default): Standard palette with "Components" title
         * - `showHeader={false}`: Chromeless mode - just the component list
         *
         * **Chromeless mode benefits**:
         * - Embed palette in custom layouts
         * - Add your own headers/titles
         * - Integrate into existing UI structures
         * - More flexible component placement
         *
         * **Example - Chromeless with custom wrapper**:
         * ```typescript
         * <div class="my-custom-sidebar">
         *   <h3 class="my-title">Available Components</h3>
         *   <p class="my-description">Drag to add</p>
         *   <component-palette
         *     components={componentDefinitions}
         *     showHeader={false}
         *   />
         * </div>
         * ```
         *
         * @default true
         */
        this.showHeader = true;
        /**
         * Currently dragging component type
         *
         * **Internal state**: Tracks which palette item is being dragged
         * **Used for**: Adding 'dragging-from-palette' class to the dragged item
         * **Pattern**: Replaces classList manipulation with reactive state
         *
         * **Value**:
         * - null: No item is being dragged
         * - string: The component type of the item being dragged
         */
        this.draggingItemType = null;
        /**
         * Initialize drag functionality for palette items
         *
         * **Called from**: componentDidLoad, componentDidUpdate
         * **Purpose**: Attach interact.js drag handlers to all `.palette-item` elements
         *
         * ## Drag Lifecycle
         *
         * **Three phases**:
         * 1. **start**: Create drag clone, store metadata
         * 2. **move**: Update clone position
         * 3. **end**: Clean up clone
         *
         * ## interact.js Configuration
         *
         * **Options**:
         * - `inertia: false` - No momentum after release (precise control)
         * - `autoScroll: false` - Manual scroll handling (prevents conflicts)
         *
         * **Why these settings**:
         * - Inertia would interfere with drop detection
         * - Auto-scroll conflicts with canvas scroll handling
         * - Simpler, more predictable behavior
         *
         * ## Drag Clone Storage Pattern
         *
         * **Stores on event.target**:
         * ```typescript
         * (event.target as any)._dragClone = dragClone;
         * (event.target as any)._halfWidth = halfWidth;
         * (event.target as any)._halfHeight = halfHeight;
         * ```
         *
         * **Why store on target**:
         * - Available in move/end events
         * - No closure needed
         * - Automatic cleanup when element removed
         * - Per-element isolation (multiple drags)
         *
         * @private
         */
        this.initializePaletteItems = () => {
            // IMPORTANT: Scope to only palette items within THIS component instance
            // Multiple component-palette instances may exist (Content, Interactive, Media categories)
            // Using document.querySelectorAll would find ALL palette items, causing
            // drag handlers from one palette to try accessing component definitions from another
            const paletteItems = this.hostElement.querySelectorAll('.palette-item');
            paletteItems.forEach((element) => {
                // Check if already initialized to prevent duplicate handlers
                if (element._dragInitialized) {
                    return;
                }
                interact(element).draggable({
                    inertia: false,
                    autoScroll: false,
                    listeners: {
                        /**
                         * Drag start event handler
                         *
                         * **Triggered**: User begins dragging palette item
                         * **Purpose**: Create visual drag clone with correct sizing
                         *
                         * ## Operations
                         *
                         * 1. **Add visual feedback**: `.dragging-from-palette` class
                         * 2. **Get component metadata**: Type and definition from components prop
                         * 3. **Calculate component size**: Convert grid units to pixels
                         * 4. **Create drag clone**: Fixed-position element following cursor
                         * 5. **Center cursor**: Offset by half dimensions
                         * 6. **Store references**: Clone and dimensions on event.target
                         *
                         * ## Sizing Strategy
                         *
                         * **Uses ComponentDefinition.defaultSize**:
                         * ```typescript
                         * const defaultSize = definition.defaultSize || { width: 10, height: 6 };
                         * const widthPx = gridToPixelsX(defaultSize.width, 'canvas1', this.config);
                         * const heightPx = gridToPixelsY(defaultSize.height);
                         * ```
                         *
                         * **Fallback**: 10 units wide × 6 units tall if not specified
                         *
                         * ## Clone Styling
                         *
                         * **Key styles**:
                         * - `position: fixed` - Relative to viewport (follows scroll)
                         * - `pointer-events: none` - Doesn't block drop detection
                         * - `z-index: 10000` - Above all other elements
                         * - `background: rgba(74, 144, 226, 0.9)` - Semi-transparent blue
                         *
                         * ## Cursor Centering
                         *
                         * **Formula**:
                         * ```typescript
                         * left = clientX - halfWidth
                         * top = clientY - halfHeight
                         * ```
                         *
                         * @param event - interact.js drag start event
                         */
                        start: (event) => {
                            // Get the .palette-item element (in case event.target is a nested child)
                            const paletteItem = event.target.closest('.palette-item');
                            if (!paletteItem) {
                                console.warn('Could not find .palette-item element');
                                return;
                            }
                            // Get component type and find definition
                            const componentType = paletteItem.getAttribute('data-component-type');
                            // Set dragging state (replaces classList.add)
                            this.draggingItemType = componentType;
                            // Store original palette item position for snap-back animation
                            const paletteRect = paletteItem.getBoundingClientRect();
                            paletteItem._originalPosition = {
                                left: paletteRect.left,
                                top: paletteRect.top,
                            };
                            paletteItem._dropWasValid = false; // Flag to track if drop occurred
                            const definition = this.components.find((c) => c.type === componentType);
                            if (!definition) {
                                console.warn(`Component definition not found for type: ${componentType}`);
                                return;
                            }
                            // Calculate actual component size from definition (or use default)
                            const defaultSize = definition.defaultSize || { width: 10, height: 6 };
                            // Get first available canvas ID from gridState for size calculation
                            const gridState = window.gridState;
                            const canvasIds = (gridState === null || gridState === void 0 ? void 0 : gridState.canvases) ? Object.keys(gridState.canvases) : [];
                            const canvasId = canvasIds.length > 0 ? canvasIds[0] : null;
                            // Calculate size - if no canvas exists yet, use fallback calculation
                            let widthPx;
                            let heightPx;
                            if (canvasId) {
                                // Use actual canvas for accurate sizing
                                widthPx = gridToPixelsX(defaultSize.width, canvasId, this.config);
                                heightPx = gridToPixelsY(defaultSize.height);
                            }
                            else {
                                // Fallback: estimate size based on default grid settings (2% of 1000px = 20px per unit)
                                const estimatedGridSize = 20; // Approximate default grid size
                                widthPx = defaultSize.width * estimatedGridSize;
                                heightPx = defaultSize.height * estimatedGridSize;
                            }
                            const halfWidth = widthPx / 2;
                            const halfHeight = heightPx / 2;
                            // Create drag clone container with base styling
                            const dragClone = document.createElement('div');
                            dragClone.className = 'dragging-clone';
                            dragClone.style.position = 'fixed';
                            dragClone.style.left = event.clientX - halfWidth + 'px';
                            dragClone.style.top = event.clientY - halfHeight + 'px';
                            dragClone.style.width = widthPx + 'px';
                            dragClone.style.height = heightPx + 'px';
                            dragClone.style.overflow = 'hidden'; // Clip content to size
                            dragClone.style.pointerEvents = 'none';
                            dragClone.style.zIndex = '10000';
                            dragClone.style.border = '2px solid rgba(74, 144, 226, 0.5)';
                            dragClone.style.borderRadius = '4px';
                            dragClone.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                            dragClone.style.cursor = 'grabbing';
                            // Render custom drag clone JSX
                            const vNode = definition.renderDragClone();
                            // Extract tag name from vNode (Stencil's JSX returns vNode with $tag$ property)
                            const tagName = vNode.$tag$;
                            // Create the drag clone element (Stencil will auto-hydrate)
                            const contentElement = document.createElement(tagName);
                            // Copy any props from vNode to element
                            if (vNode.$attrs$) {
                                Object.keys(vNode.$attrs$).forEach(key => {
                                    contentElement.setAttribute(key, vNode.$attrs$[key]);
                                });
                            }
                            dragClone.appendChild(contentElement);
                            document.body.appendChild(dragClone);
                            // Store clone reference, half dimensions, and default size for move/drop events
                            paletteItem._dragClone = dragClone;
                            paletteItem._halfWidth = halfWidth;
                            paletteItem._halfHeight = halfHeight;
                            paletteItem._defaultWidth = defaultSize.width;
                            paletteItem._defaultHeight = defaultSize.height;
                        },
                        /**
                         * Drag move event handler
                         *
                         * **Triggered**: Every mousemove while dragging (high frequency)
                         * **Purpose**: Update drag clone position to follow cursor
                         *
                         * ## Performance Optimization
                         *
                         * **Only style updates**: No layout/reflow
                         * ```typescript
                         * dragClone.style.left = event.clientX - halfWidth + 'px';
                         * dragClone.style.top = event.clientY - halfHeight + 'px';
                         * ```
                         *
                         * **Why fast**:
                         * - Changes `left/top` only (no width/height/padding)
                         * - `position: fixed` + `pointer-events: none` avoids reflow
                         * - No DOM queries (uses stored reference)
                         * - Runs at ~60fps even with 100+ items on canvas
                         *
                         * @param event - interact.js drag move event
                         */
                        move: (event) => {
                            const paletteItem = event.target.closest('.palette-item');
                            if (!paletteItem)
                                return;
                            const dragClone = paletteItem._dragClone;
                            const halfWidth = paletteItem._halfWidth;
                            const halfHeight = paletteItem._halfHeight;
                            if (dragClone) {
                                dragClone.style.left = event.clientX - halfWidth + 'px';
                                dragClone.style.top = event.clientY - halfHeight + 'px';
                            }
                        },
                        /**
                         * Drag end event handler
                         *
                         * **Triggered**: User releases mouse button
                         * **Purpose**: Clean up drag clone and visual state
                         *
                         * ## Cleanup Operations
                         *
                         * 1. **Remove visual class**: `.dragging-from-palette`
                         * 2. **Remove drag clone**: `dragClone.remove()` from DOM
                         * 3. **Delete references**: Clean up element properties
                         *
                         * ## Memory Management
                         *
                         * **Deletes stored properties**:
                         * ```typescript
                         * delete (event.target as any)._dragClone;
                         * delete (event.target as any)._halfWidth;
                         * delete (event.target as any)._halfHeight;
                         * ```
                         *
                         * **Why important**:
                         * - Prevents memory leaks
                         * - Allows garbage collection of clone element
                         * - Clean state for next drag
                         *
                         * @param event - interact.js drag end event
                         */
                        end: (event) => {
                            // Clear dragging state (replaces classList.remove)
                            this.draggingItemType = null;
                            const paletteItem = event.target.closest('.palette-item');
                            if (!paletteItem)
                                return;
                            const dragClone = paletteItem._dragClone;
                            const dropWasValid = paletteItem._dropWasValid;
                            const originalPos = paletteItem._originalPosition;
                            if (dragClone) {
                                if (!dropWasValid && originalPos) {
                                    // Invalid drop - animate back to palette
                                    dragClone.style.transition = 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
                                    dragClone.style.left = originalPos.left + 'px';
                                    dragClone.style.top = originalPos.top + 'px';
                                    dragClone.style.opacity = '0';
                                    // Remove after animation completes
                                    setTimeout(() => {
                                        dragClone.remove();
                                    }, 300);
                                }
                                else {
                                    // Valid drop - remove immediately
                                    dragClone.remove();
                                }
                                // Cleanup
                                delete paletteItem._dragClone;
                                delete paletteItem._halfWidth;
                                delete paletteItem._halfHeight;
                                delete paletteItem._dropWasValid;
                                delete paletteItem._originalPosition;
                            }
                        },
                    },
                });
                // Mark as initialized
                element._dragInitialized = true;
            });
        };
    }
    /**
     * Watch for components prop changes
     *
     * **When triggered**: Parent passes updated component definitions
     * **Actions**: Reinitialize drag handlers for new/changed palette items
     *
     * **Why needed**:
     * - Component list may change dynamically (add/remove components)
     * - New items need drag handlers attached
     * - More efficient than componentDidUpdate (only runs on prop change)
     */
    handleComponentsChange(newComponents, oldComponents) {
        // Skip if components reference hasn't changed
        if (newComponents === oldComponents)
            return;
        // Skip if not yet mounted (componentDidLoad will handle initialization)
        if (!oldComponents)
            return;
        // Reinitialize palette items with new component list
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
            this.initializePaletteItems();
        });
    }
    /**
     * Watch for config prop changes
     *
     * **When triggered**: Parent passes updated GridConfig
     * **Actions**: Config changes affect drag clone sizing
     *
     * **Note**: Config stored in closure by initializePaletteItems
     * Will be used on next drag start, no immediate action needed
     */
    handleConfigChange(newConfig, oldConfig) {
        // Skip if config reference hasn't changed
        if (newConfig === oldConfig)
            return;
        // Config changes are rare but affect drag clone sizing
        // No immediate action needed - next drag will use new config
        // If we want to be explicit, could reinitialize handlers:
        // requestAnimationFrame(() => this.initializePaletteItems());
    }
    /**
     * Component did load lifecycle hook
     *
     * **Called**: After first render (DOM available)
     * **Purpose**: Initialize drag functionality on palette items
     *
     * **Why after render**:
     * - Needs DOM elements to exist
     * - Queries `.palette-item` elements
     * - Attaches interact.js drag handlers
     *
     * **One-time setup**:
     * - Only runs once after mount
     * - Doesn't re-run on state changes
     * - Drag handlers persist across re-renders
     */
    componentDidLoad() {
        this.initializePaletteItems();
    }
    /**
     * Component did update lifecycle hook
     *
     * **Called**: After props change and re-render
     * **Purpose**: Re-initialize drag handlers if components changed
     *
     * **Why needed**:
     * - New palette items need drag handlers
     * - Components prop may change dynamically
     * - Ensures all items are draggable
     */
    componentDidUpdate() {
        this.initializePaletteItems();
    }
    /**
     * Render component template
     *
     * **Reactive**: Re-runs when components prop changes
     * **Pure**: No side effects, only returns JSX
     *
     * **Component rendering**:
     * - Maps over components prop
     * - Renders each as draggable palette item
     * - Uses icon and name from definition
     *
     * **Data attributes**:
     * - `data-component-type`: Used by drag handlers to identify component
     * - `key`: React-style key for list rendering
     */
    render() {
        const paletteClasses = {
            palette: true,
            'palette-chromeless': !this.showHeader,
        };
        if (!this.components || this.components.length === 0) {
            return (h("div", { class: paletteClasses }, this.showHeader && h("h2", null, "Components"), h("p", { class: "palette-empty" }, "No components available")));
        }
        return (h("div", { class: paletteClasses }, this.showHeader && h("h2", null, "Components"), this.components.map((component) => {
            // Class binding with reactive state
            const itemClasses = {
                'palette-item': true,
                'dragging-from-palette': this.draggingItemType === component.type,
            };
            return (h("div", { class: itemClasses, "data-component-type": component.type, key: component.type }, component.renderPaletteItem
                ? component.renderPaletteItem({
                    componentType: component.type,
                    name: component.name,
                    icon: component.icon,
                })
                : `${component.icon} ${component.name}`));
        })));
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Called**: When component is removed from DOM
     * **Purpose**: Clean up interact.js instances to prevent memory leaks
     *
     * ## Cleanup Process
     *
     * 1. **Query all palette items**: Find all elements with `.palette-item` class
     * 2. **Remove interact.js**: Call `interact(element).unset()` on each
     * 3. **Clear flags**: Remove `_dragInitialized` marker
     *
     * ## Why Important
     *
     * **Without cleanup**:
     * - interact.js event listeners persist after unmount
     * - Memory leaks accumulate with mount/unmount cycles
     * - References prevent garbage collection
     *
     * **With cleanup**:
     * - All event listeners removed
     * - Elements can be garbage collected
     * - Clean state for future mounts
     *
     * ## Pattern Match
     *
     * This follows the same cleanup pattern as:
     * - canvas-section.tsx: Cleans up dropzone interact instance
     * - grid-item-wrapper.tsx: Cleans up drag/resize handlers
     */
    disconnectedCallback() {
        // Cleanup interact.js on all palette items (scoped to this instance)
        const paletteItems = this.hostElement.querySelectorAll('.palette-item');
        paletteItems.forEach((element) => {
            if (element._dragInitialized) {
                interact(element).unset();
                delete element._dragInitialized;
            }
        });
    }
    get hostElement() { return getElement(this); }
    static get watchers() { return {
        "components": ["handleComponentsChange"],
        "config": ["handleConfigChange"]
    }; }
};
ComponentPalette.style = componentPaletteCss;

export { CanvasSection as canvas_section, ComponentPalette as component_palette };
//# sourceMappingURL=canvas-section.component-palette.entry.js.map
