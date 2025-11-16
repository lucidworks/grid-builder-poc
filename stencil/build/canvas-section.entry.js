import { r as registerInstance, h } from './index-ebe9feb4.js';
import { i as interact_min } from './interact.min-bef33ec6.js';
import { s as state, o as onChange } from './state-manager-b0e7f282.js';
import { c as clearGridSizeCache, g as gridToPixelsX, b as gridToPixelsY } from './grid-calculations-e64c8272.js';
import './index-28d0c3f6.js';

const canvasSectionCss = ".canvas-item{position:relative;display:flex;width:100%;flex-direction:column}.canvas-item-header{position:absolute;z-index:1000;top:10px;right:10px;display:flex;align-items:center;padding:8px 12px;border-radius:4px;background:rgba(255, 255, 255, 0.95);box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);color:#666;font-size:12px;gap:10px;opacity:0.7;transition:opacity 0.2s}.canvas-item:hover .canvas-item-header{opacity:1}.canvas-item-header h3{margin:0;color:#999;font-size:11px;letter-spacing:0.5px;text-transform:uppercase}.canvas-controls{display:flex;align-items:center;gap:8px}.canvas-controls label{display:flex;align-items:center;color:#999;cursor:pointer;font-size:11px;gap:4px}.canvas-bg-color{width:30px;height:24px;border:1px solid #ddd;border-radius:3px;cursor:pointer}.clear-canvas-btn,.delete-section-btn{padding:4px 10px;border:1px solid #ddd;border-radius:3px;background:white;color:#666;cursor:pointer;font-size:11px;transition:all 0.2s}.clear-canvas-btn:hover{border-color:#4a90e2;background:#f5f5f5;color:#4a90e2}.delete-section-btn{padding:4px 8px}.delete-section-btn:hover{border-color:#dc3545;background:#fee}.grid-builder{width:100%;padding:0;border-radius:0;margin-bottom:0;background:transparent}.grid-container{position:relative;width:100%;min-height:400px;background-image:linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);background-size:2% 20px;transition:background-color 0.2s}.grid-container.hide-grid{background-image:none}";

const CanvasSection = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Dropzone initialization flag
         *
         * **Prevents**: Multiple dropzone setups on same element
         * **Set in**: initializeDropzone()
         * **Checked in**: initializeDropzone(), disconnectedCallback()
         */
        this.dropzoneInitialized = false;
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
         *
         * **Resize triggers**:
         * - Browser window resize
         * - Sidebar expand/collapse
         * - DevTools open/close
         * - Mobile orientation change
         * - Zoom level change
         *
         * **Performance impact**:
         * - ResizeObserver: ~1-2ms per event
         * - clearGridSizeCache(): O(1) flag set
         * - renderVersion++: ~5-20ms re-render (varies by item count)
         * - Total: ~7-23ms per resize (acceptable)
         *
         * **Safety**: Returns early if gridContainerRef not available
         *
         * @private
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
         * - Matches design tool behavior
         *
         * **Checker function**: `(dragEvent, event, dropped) => dropped`
         * - Returns true if drop should be accepted
         * - Currently accepts all drops (could add validation)
         *
         * ## Drop Event Handling
         *
         * **Two drop scenarios**:
         *
         * ### 1. Palette Item Drop (Create New)
         *
         * **Detection**:
         * ```typescript
         * const isPaletteItem = droppedElement.classList.contains('palette-item');
         * ```
         *
         * **Component type extraction**:
         * ```typescript
         * const componentType = droppedElement.getAttribute('data-component-type');
         * ```
         *
         * **Position calculation**:
         * ```typescript
         * // Get half dimensions (default: 10 units × 6 units)
         * const widthPx = gridToPixelsX(10, canvasId);
         * const heightPx = gridToPixelsY(6);
         * const halfWidth = widthPx / 2;
         * const halfHeight = heightPx / 2;
         *
         * // Calculate position (cursor-centered)
         * const rect = gridContainerRef.getBoundingClientRect();
         * const x = event.dragEvent.clientX - rect.left - halfWidth;
         * const y = event.dragEvent.clientY - rect.top - halfHeight;
         * ```
         *
         * **Why subtract half dimensions**:
         * - Centers item on cursor position
         * - Matches drag clone visual (cursor in center)
         * - Better UX (item appears where user expects)
         *
         * **Custom event dispatch**:
         * ```typescript
         * dispatchEvent(new CustomEvent('canvas-drop', {
         *   detail: { canvasId, componentType, x, y },
         *   bubbles: true,    // Event reaches parent
         *   composed: true    // Event crosses shadow DOM
         * }));
         * ```
         *
         * ### 2. Grid Item Drop (Cross-Canvas Move)
         *
         * **Detection**:
         * ```typescript
         * const isGridItem = droppedElement.classList.contains('grid-item');
         * const sourceCanvasId = droppedElement.getAttribute('data-canvas-id');
         * if (sourceCanvasId !== this.canvasId) { ... }
         * ```
         *
         * **Only process cross-canvas moves**:
         * - Same-canvas moves handled by drag handler directly
         * - No need for canvas coordination
         * - Prevents duplicate events
         *
         * **Position calculation**:
         * ```typescript
         * // Item already positioned by drag handler
         * const droppedRect = droppedElement.getBoundingClientRect();
         * const rect = gridContainerRef.getBoundingClientRect();
         *
         * // Use element's current screen position
         * const x = droppedRect.left - rect.left;
         * const y = droppedRect.top - rect.top;
         * ```
         *
         * **Why different from palette**:
         * - Grid item already has position from drag handler
         * - Use element's bounding rect, not cursor position
         * - Preserves visual position during move
         * - More accurate for cross-canvas transfers
         *
         * **Custom event dispatch**:
         * ```typescript
         * dispatchEvent(new CustomEvent('canvas-move', {
         *   detail: { itemId, sourceCanvasId, targetCanvasId, x, y },
         *   bubbles: true,
         *   composed: true
         * }));
         * ```
         *
         * ## Initialization Guard
         *
         * **Early return conditions**:
         * - `!gridContainerRef` - DOM not ready
         * - `dropzoneInitialized` - Already setup
         *
         * **Prevents**:
         * - Multiple dropzone setups on same element
         * - Errors from missing DOM element
         * - Duplicate event handlers
         *
         * **Sets flag**: `this.dropzoneInitialized = true` after setup
         *
         * @private
         */
        this.initializeDropzone = () => {
            if (!this.gridContainerRef || this.dropzoneInitialized) {
                return;
            }
            const interactable = interact_min(this.gridContainerRef);
            interactable.dropzone({
                accept: '.palette-item, .grid-item',
                overlap: 'pointer',
                checker: (_dragEvent, _event, dropped) => {
                    return dropped;
                },
                ondrop: (event) => {
                    const droppedElement = event.relatedTarget;
                    const isPaletteItem = droppedElement.classList.contains('palette-item');
                    const isGridItem = droppedElement.classList.contains('grid-item');
                    if (isPaletteItem) {
                        // Dropping from palette - create new item
                        const componentType = droppedElement.getAttribute('data-component-type');
                        // Calculate half dimensions for centering (default: 10 units wide, 6 units tall)
                        const defaultWidth = 10;
                        const defaultHeight = 6;
                        const widthPx = gridToPixelsX(defaultWidth, this.canvasId);
                        const heightPx = gridToPixelsY(defaultHeight);
                        const halfWidth = widthPx / 2;
                        const halfHeight = heightPx / 2;
                        // Get drop position relative to grid container
                        const rect = this.gridContainerRef.getBoundingClientRect();
                        const x = event.dragEvent.clientX - rect.left - halfWidth;
                        const y = event.dragEvent.clientY - rect.top - halfHeight;
                        // Dispatch custom event for grid-builder-app to handle
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
                    else if (isGridItem) {
                        // Moving existing grid item to different canvas
                        const itemId = droppedElement.id;
                        const sourceCanvasId = droppedElement.getAttribute('data-canvas-id');
                        // Only process if moving to a different canvas
                        if (sourceCanvasId !== this.canvasId) {
                            // For cross-canvas moves, get the element's actual screen position
                            // (the drag handler has already positioned it during the drag)
                            const droppedRect = droppedElement.getBoundingClientRect();
                            const rect = this.gridContainerRef.getBoundingClientRect();
                            // Use the element's top-left corner relative to the target canvas
                            const x = droppedRect.left - rect.left;
                            const y = droppedRect.top - rect.top;
                            // Dispatch custom event for moving item between canvases
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
            });
            this.dropzoneInitialized = true;
        };
        /**
         * Handle background color change
         *
         * **Triggered by**: User selects color from color picker input
         *
         * ## Dual Update Pattern
         *
         * **1. State update** (reactivity):
         * ```typescript
         * this.canvas.backgroundColor = color;
         * gridState.canvases = { ...gridState.canvases };
         * ```
         *
         * **Why spread**: Triggers StencilJS reactivity
         * - Object reference change detected
         * - Components re-render
         * - Persists color in state
         *
         * **2. DOM update** (immediate feedback):
         * ```typescript
         * this.gridContainerRef.style.backgroundColor = color;
         * ```
         *
         * **Why needed**:
         * - State update triggers async re-render
         * - User sees delay (~16ms) without DOM update
         * - Direct style update provides instant visual feedback
         * - Better UX (no flash of old color)
         *
         * ## Event Handling
         *
         * **Input type**: `type="color"` (native HTML5 color picker)
         * **Event**: `onInput` (fires during color selection)
         * **Value**: `e.target.value` (hex color string, e.g., '#ff0000')
         *
         * **Why onInput vs onChange**:
         * - onInput fires immediately during selection
         * - onChange only fires on blur (after closing picker)
         * - Better real-time feedback
         *
         * @param e - Input event from color picker
         *
         * @example
         * ```typescript
         * // User selects red (#ff0000)
         * handleColorChange(event)
         * // → State updated: canvas.backgroundColor = '#ff0000'
         * // → DOM updated: container.style.backgroundColor = '#ff0000'
         * // → Visual feedback instant, state persisted
         * ```
         *
         * @private
         */
        this.handleColorChange = (e) => {
            const target = e.target;
            const color = target.value;
            // Update state
            this.canvas.backgroundColor = color;
            state.canvases = Object.assign({}, state.canvases); // Trigger update
            // Also update DOM directly for immediate feedback
            if (this.gridContainerRef) {
                this.gridContainerRef.style.backgroundColor = color;
            }
        };
        /**
         * Handle clear canvas (delete all items)
         *
         * **Triggered by**: User clicks "Clear" button
         *
         * ## Confirmation Dialog
         *
         * **Pattern**:
         * ```typescript
         * if (confirm('Are you sure you want to clear all items from this section?'))
         * ```
         *
         * **Why needed**:
         * - Prevents accidental clears
         * - Destructive operation (cannot undo via undo/redo)
         * - Standard UX pattern for dangerous actions
         *
         * **Native confirm**:
         * - Blocks execution until user responds
         * - Simple and reliable
         * - No dependencies needed
         * - Could be replaced with custom modal for better UX
         *
         * ## Clear Operations
         *
         * **1. Clear items array**:
         * ```typescript
         * this.canvas.items = [];
         * gridState.canvases = { ...gridState.canvases };
         * ```
         *
         * **Why assignment vs splice**:
         * - Assignment creates new array reference
         * - Triggers reactivity
         * - Simpler than splice(0, items.length)
         *
         * **2. Clear selection** (if on this canvas):
         * ```typescript
         * if (gridState.selectedCanvasId === this.canvasId) {
         *   gridState.selectedItemId = null;
         *   gridState.selectedCanvasId = null;
         * }
         * ```
         *
         * **Why needed**:
         * - Selected item no longer exists after clear
         * - Prevents dangling reference
         * - Avoids errors when accessing selectedItemId
         *
         * **3. Reset container height**:
         * ```typescript
         * this.gridContainerRef.style.minHeight = '400px';
         * ```
         *
         * **Why needed**:
         * - Canvas may have grown with many items
         * - Empty canvas should return to default height
         * - Provides visual feedback (canvas shrinks)
         * - 400px = comfortable minimum workspace
         *
         * ## No Undo Support
         *
         * **Note**: Clear operation NOT added to undo history
         * - Too destructive for standard undo
         * - Would require full state snapshot
         * - Confirmation dialog is safety mechanism
         * - Could be enhanced to support undo if needed
         *
         * @example
         * ```typescript
         * // User clicks "Clear" on canvas with 5 items
         * handleClearCanvas()
         * // → Dialog: "Are you sure you want to clear all items from this section?"
         * // → User confirms
         * // → Items cleared: canvas.items = []
         * // → Selection cleared: selectedItemId = null
         * // → Height reset: container.style.minHeight = '400px'
         * ```
         *
         * @private
         */
        this.handleClearCanvas = () => {
            if (confirm(`Are you sure you want to clear all items from this section?`)) {
                // Clear items from state
                this.canvas.items = [];
                state.canvases = Object.assign({}, state.canvases); // Trigger update
                // Clear selection if on this canvas
                if (state.selectedCanvasId === this.canvasId) {
                    state.selectedItemId = null;
                    state.selectedCanvasId = null;
                }
                // Reset canvas height
                if (this.gridContainerRef) {
                    this.gridContainerRef.style.minHeight = '400px';
                }
            }
        };
        /**
         * Handle delete section
         *
         * **Triggered by**: User clicks delete button (🗑️)
         *
         * ## Confirmation Dialog
         *
         * **Conditional confirmation**:
         * ```typescript
         * if (canvas.items.length > 0) {
         *   if (!confirm(`This section has ${items.length} items. Are you sure?`))
         *     return;
         * }
         * ```
         *
         * **Confirmation only if items exist**:
         * - Empty section can be deleted without confirmation
         * - Section with items requires confirmation
         * - Shows item count for context
         *
         * **Early return on cancel**:
         * - Prevents event dispatch
         * - No state changes
         * - Operation fully cancelled
         *
         * ## Custom Event Dispatch
         *
         * **Pattern**:
         * ```typescript
         * dispatchEvent(new CustomEvent('section-delete', {
         *   detail: { canvasId },
         *   bubbles: true,
         *   composed: true
         * }));
         * ```
         *
         * **Why custom event**:
         * - Canvas doesn't manage global state
         * - App coordinates section deletion
         * - Decouples canvas from app logic
         * - Testable (can spy on events)
         *
         * **Event details**:
         * - `canvasId`: Which section to delete
         * - `bubbles: true`: Event reaches parent
         * - `composed: true`: Event crosses shadow DOM
         *
         * ## App Coordination
         *
         * **grid-builder-app.tsx handles**:
         * 1. Receives 'section-delete' event
         * 2. Removes canvas from gridState.canvases
         * 3. Clears selection if on deleted canvas
         * 4. Updates canvas numbering
         * 5. Re-renders canvas list
         *
         * **Why delegate to app**:
         * - App owns canvas collection state
         * - Single responsibility (canvas = UI, app = state)
         * - Easier to test and maintain
         * - Follows React/StencilJS patterns
         *
         * ## No Undo Support
         *
         * **Note**: Section deletion NOT added to undo history
         * - Very destructive operation
         * - Would require full section snapshot
         * - Confirmation dialog is safety mechanism
         * - Could be enhanced to support undo if needed
         *
         * @example
         * ```typescript
         * // User clicks delete on section with 3 items
         * handleDeleteSection()
         * // → Dialog: "This section has 3 items. Are you sure you want to delete it?"
         * // → User confirms
         * // → Event dispatched: { detail: { canvasId: 'canvas2' } }
         * // → App receives event, deletes canvas from state
         * // → Section removed from DOM
         * ```
         *
         * @private
         */
        this.handleDeleteSection = () => {
            if (this.canvas.items.length > 0) {
                if (!confirm(`This section has ${this.canvas.items.length} items. Are you sure you want to delete it?`)) {
                    return;
                }
            }
            // Dispatch custom event for grid-builder-app to handle
            const deleteEvent = new CustomEvent('section-delete', {
                detail: { canvasId: this.canvasId },
                bubbles: true,
                composed: true,
            });
            this.gridContainerRef.dispatchEvent(deleteEvent);
        };
        this.canvasId = undefined;
        this.sectionNumber = undefined;
        this.canvas = undefined;
        this.renderVersion = 0;
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
     *
     * **Error handling**:
     * - Try/catch guards against rapid mount/unmount in tests
     * - Checks canvasId and canvas existence before update
     * - Logs debug message if update skipped
     *
     * **Why try/catch**:
     * - Tests may mount components before state fully initialized
     * - Component may be unmounting while state update fires
     * - Prevents test failures from timing issues
     */
    componentWillLoad() {
        // Initial load
        this.canvas = state.canvases[this.canvasId];
        // Subscribe to state changes
        onChange('canvases', () => {
            // Guard against accessing properties when component is not fully initialized
            try {
                if (this.canvasId && state.canvases[this.canvasId]) {
                    this.canvas = state.canvases[this.canvasId];
                    this.renderVersion++; // Force re-render
                }
            }
            catch (error) {
                // Component may not be fully initialized yet (e.g., during test setup)
                // This can happen during rapid component mounting/unmounting in tests
                console.debug('Canvas section state update skipped:', error);
            }
        });
    }
    /**
     * Component will update lifecycle hook
     *
     * **Called**: Before each re-render
     * **Purpose**: Ensure canvas reference is fresh from state
     *
     * **Why needed**:
     * - State may have changed since last render
     * - Local canvas reference might be stale
     * - Ensures render uses latest data
     *
     * **Complements**: onChange subscription in componentWillLoad
     */
    componentWillUpdate() {
        // Update canvas reference when state changes
        this.canvas = state.canvases[this.canvasId];
    }
    /**
     * Component did load lifecycle hook
     *
     * **Called**: After first render (DOM available)
     * **Purpose**: Initialize interact.js dropzone and ResizeObserver
     *
     * **Why after render**:
     * - Needs gridContainerRef to be assigned (happens during render)
     * - interact.js requires actual DOM element
     * - ResizeObserver requires element to observe
     *
     * **One-time setup**:
     * - Only runs once after mount
     * - Handlers persist across re-renders
     * - Cleanup in disconnectedCallback
     */
    componentDidLoad() {
        this.initializeDropzone();
        this.setupResizeObserver();
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Called**: When component removed from DOM
     * **Purpose**: Clean up interact.js and ResizeObserver
     *
     * **Cleanup operations**:
     * 1. Unset interact.js dropzone if initialized
     * 2. Disconnect ResizeObserver if created
     *
     * **Why important**:
     * - Prevents memory leaks
     * - Removes event listeners
     * - Stops observation of removed elements
     * - Standard web component lifecycle pattern
     *
     * **Safety checks**:
     * - Verifies gridContainerRef exists before interact unset
     * - Verifies dropzoneInitialized before interact unset
     * - Verifies resizeObserver exists before disconnect
     */
    disconnectedCallback() {
        // Cleanup interact.js
        if (this.gridContainerRef && this.dropzoneInitialized) {
            interact_min(this.gridContainerRef).unset();
        }
        // Cleanup ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    /**
     * Render component template
     *
     * **Reactive**: Re-runs when canvas state or renderVersion changes
     * **Pure**: No side effects, only returns JSX
     *
     * ## Template Structure
     *
     * **Outer container** (`.canvas-item`):
     * - Section wrapper with canvas ID
     * - Contains header and grid builder
     *
     * **Header** (`.canvas-item-header`):
     * - Section number (h3)
     * - Controls container:
     *   - Color picker (background color)
     *   - Clear button (clear all items)
     *   - Delete button (delete section)
     *
     * **Grid builder** (`.grid-builder`):
     * - Grid container (`.grid-container`):
     *   - Dynamic class: `.hide-grid` when showGrid = false
     *   - Background color from canvas state
     *   - Ref assigned to gridContainerRef
     *   - Item rendering loop
     *
     * ## Grid Container Classes
     *
     * **Dynamic class binding**:
     * ```tsx
     * class={{
     *   'grid-container': true,      // Always present
     *   'hide-grid': !showGrid       // Conditional
     * }}
     * ```
     *
     * **CSS grid visibility**:
     * - `.grid-container`: Shows grid background
     * - `.grid-container.hide-grid`: Hides grid background
     * - Controlled by `gridState.showGrid` toggle
     *
     * ## Item Rendering Loop
     *
     * **Mapping pattern**:
     * ```tsx
     * {this.canvas?.items.map((item: GridItem) => (
     *   <grid-item-wrapper
     *     key={item.id}
     *     item={item}
     *     renderVersion={this.renderVersion}
     *   />
     * ))}
     * ```
     *
     * **Optional chaining** (`.canvas?.items`):
     * - Guards against undefined canvas during mounting
     * - Returns empty array if canvas not loaded
     * - Prevents "Cannot read property 'items' of undefined"
     *
     * **Props passed to wrapper**:
     * - `key={item.id}`: React-style key for efficient diffing
     * - `item={item}`: Full GridItem data
     * - `renderVersion={this.renderVersion}`: Triggers recalculation
     *
     * ## Background Color Binding
     *
     * **Inline style**:
     * ```tsx
     * style={{ backgroundColor }}
     * ```
     *
     * **Value source**: `this.canvas?.backgroundColor || '#ffffff'`
     * - Reads from canvas state
     * - Falls back to white if undefined
     * - Reactive: updates when canvas.backgroundColor changes
     *
     * **Also updated directly** in handleColorChange for immediate feedback
     *
     * @returns JSX template for canvas section
     *
     * @example
     * ```tsx
     * // Rendered output structure:
     * <div class="canvas-item" data-canvas-id="canvas1">
     *   <div class="canvas-item-header">
     *     <h3>Section 1</h3>
     *     <div class="canvas-controls">
     *       <input type="color" value="#ffffff" />
     *       <button>Clear</button>
     *       <button>🗑️</button>
     *     </div>
     *   </div>
     *   <div class="grid-builder">
     *     <div class="grid-container" style="background-color: #ffffff">
     *       <grid-item-wrapper item={...} renderVersion={0} />
     *       <grid-item-wrapper item={...} renderVersion={0} />
     *       ...
     *     </div>
     *   </div>
     * </div>
     * ```
     */
    render() {
        var _a, _b;
        const showGrid = state.showGrid;
        const backgroundColor = ((_a = this.canvas) === null || _a === void 0 ? void 0 : _a.backgroundColor) || '#ffffff';
        return (h("div", { class: "canvas-item", "data-canvas-id": this.canvasId }, h("div", { class: "canvas-item-header" }, h("h3", null, "Section ", this.sectionNumber), h("div", { class: "canvas-controls" }, h("label", null, h("input", { type: "color", class: "canvas-bg-color", value: backgroundColor, onInput: (e) => this.handleColorChange(e) })), h("button", { class: "clear-canvas-btn", onClick: () => this.handleClearCanvas() }, "Clear"), h("button", { class: "delete-section-btn", onClick: () => this.handleDeleteSection(), title: "Delete Section" }, "\uD83D\uDDD1\uFE0F"))), h("div", { class: "grid-builder" }, h("div", { class: {
                'grid-container': true,
                'hide-grid': !showGrid,
            }, id: this.canvasId, "data-canvas-id": this.canvasId, style: {
                backgroundColor,
            }, ref: (el) => (this.gridContainerRef = el) }, (_b = this.canvas) === null || _b === void 0 ? void 0 : _b.items.map((item) => (h("grid-item-wrapper", { key: item.id, item: item, renderVersion: this.renderVersion })))))));
    }
};
CanvasSection.style = canvasSectionCss;

export { CanvasSection as canvas_section };

//# sourceMappingURL=canvas-section.entry.js.map