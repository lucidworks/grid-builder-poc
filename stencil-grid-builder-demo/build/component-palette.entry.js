import { r as registerInstance, h, d as getElement } from './index-CoCbyscT.js';
import { i as interact } from './interact.min-DWbYNq4G.js';
import { a as gridToPixelsX, b as gridToPixelsY } from './grid-calculations-C87xQzOc.js';

const componentPaletteCss = ".palette{width:250px;padding:20px;border-right:1px solid #ddd;background:white;overflow-y:visible;}.palette h2{margin-bottom:20px;color:#333;font-size:18px}.palette-chromeless{padding-top:10px}.palette-empty{color:#999;font-size:13px;font-style:italic}.palette-item{margin-bottom:10px;cursor:move;user-select:none;touch-action:none;}.palette-item:not(:has(>div)){padding:15px;border-radius:4px;background:#4a90e2;color:white;font-weight:500;text-align:center;transition:transform 0.2s, box-shadow 0.2s}.palette-item:hover{box-shadow:0 4px 8px rgba(0, 0, 0, 0.1);transform:translateY(-2px)}.palette-item.dragging-from-palette{opacity:0.5}.dragging-clone{position:fixed;z-index:10000;pointer-events:none}";

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
         * <h3 class="my-title">Available Components</h3>
         * <p class="my-description">Drag to add</p>
         * <component-palette
         * components={componentDefinitions}
         * showHeader={false}
         * />
         * </div>
         * ```
         * @default true
         */
        this.showHeader = true;
        /**
         * Custom label for this palette instance
         *
         * **Optional prop**: Provides a descriptive label for this specific palette
         * **Default**: "Component palette"
         * **Used for**: ARIA label on toolbar container
         *
         * **Use case - Multiple palettes**:
         * When multiple component palettes exist on the same page (e.g., categorized palettes),
         * provide unique labels for screen reader users:
         *
         * ```typescript
         * <component-palette
         * components={contentComponents}
         * paletteLabel="Content components"
         * />
         * <component-palette
         * components={mediaComponents}
         * paletteLabel="Media components"
         * />
         * <component-palette
         * components={interactiveComponents}
         * paletteLabel="Interactive components"
         * />
         * ```
         *
         * **Accessibility benefit**:
         * - Screen readers announce: "Content components, toolbar"
         * - Users can navigate between palettes by their distinct labels
         * - Each palette has unique ARIA IDs to avoid conflicts
         * @default "Component palette"
         */
        this.paletteLabel = "Component palette";
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
         * Unique ID for this palette instance
         *
         * **Internal state**: Ensures unique ARIA IDs when multiple palettes exist
         * **Generated**: Once on component load (timestamp + random)
         * **Used for**: Creating unique `id` attributes for help text and aria-describedby
         *
         * **Why needed**:
         * - Multiple palettes on same page would create duplicate IDs (invalid HTML)
         * - Each palette needs unique `palette-help-{id}` for aria-describedby
         * - Prevents ARIA reference conflicts
         *
         * **Example HTML output**:
         * ```html
         * <!-- Palette 1 -->
         * <div role="toolbar" aria-label="Content components">
         *   <div id="palette-help-1234567890" class="sr-only">...</div>
         *   <div aria-describedby="palette-help-1234567890">...</div>
         * </div>
         *
         * <!-- Palette 2 -->
         * <div role="toolbar" aria-label="Media components">
         *   <div id="palette-help-0987654321" class="sr-only">...</div>
         *   <div aria-describedby="palette-help-0987654321">...</div>
         * </div>
         * ```
         */
        this.paletteId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
         */
        this.initializePaletteItems = () => {
            // IMPORTANT: Scope to only palette items within THIS component instance
            // Multiple component-palette instances may exist (Content, Interactive, Media categories)
            // Using document.querySelectorAll would find ALL palette items, causing
            // drag handlers from one palette to try accessing component definitions from another
            const paletteItems = this.hostElement.querySelectorAll(".palette-item");
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
                         * @param event - interact.js drag start event
                         */
                        start: (event) => {
                            var _a;
                            // Get the .palette-item element (in case event.target is a nested child)
                            const paletteItem = event.target.closest(".palette-item");
                            if (!paletteItem) {
                                console.warn("Could not find .palette-item element");
                                return;
                            }
                            // Get component type and find definition
                            const componentType = paletteItem.getAttribute("data-component-type");
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
                            const defaultSize = definition.defaultSize || {
                                width: 10,
                                height: 6,
                            };
                            // Get first available canvas ID from grid-builder API instance for size calculation
                            // Use targetGridBuilderId to access the correct instance (supports multiple grid-builders)
                            const apiKey = this.targetGridBuilderId || 'gridBuilderAPI';
                            const api = window[apiKey];
                            const state = (_a = api === null || api === void 0 ? void 0 : api.getState) === null || _a === void 0 ? void 0 : _a.call(api);
                            const canvasIds = (state === null || state === void 0 ? void 0 : state.canvases)
                                ? Object.keys(state.canvases)
                                : [];
                            const canvasId = canvasIds.length > 0 ? canvasIds[0] : null;
                            // Calculate size - if no canvas exists yet, use fallback calculation
                            let widthPx;
                            let heightPx;
                            if (canvasId) {
                                // Use actual canvas for accurate sizing
                                widthPx = gridToPixelsX(defaultSize.width, canvasId, this.config);
                                heightPx = gridToPixelsY(defaultSize.height, this.config);
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
                            const dragClone = document.createElement("div");
                            dragClone.className = "dragging-clone";
                            dragClone.style.position = "fixed";
                            dragClone.style.left = event.clientX - halfWidth + "px";
                            dragClone.style.top = event.clientY - halfHeight + "px";
                            dragClone.style.width = widthPx + "px";
                            dragClone.style.height = heightPx + "px";
                            dragClone.style.overflow = "hidden"; // Clip content to size
                            dragClone.style.pointerEvents = "none";
                            dragClone.style.zIndex = "10000";
                            dragClone.style.border = "2px solid rgba(74, 144, 226, 0.5)";
                            dragClone.style.borderRadius = "4px";
                            dragClone.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                            dragClone.style.cursor = "grabbing";
                            // Render custom drag clone (supports both VNode and HTMLElement)
                            const cloneContent = definition.renderDragClone();
                            // Check if it's a real DOM element (from document.createElement)
                            if (cloneContent instanceof HTMLElement) {
                                // Direct DOM element - just append it
                                dragClone.appendChild(cloneContent);
                            }
                            else {
                                // Stencil VNode - extract tag and create element
                                const vNode = cloneContent;
                                const tagName = vNode.$tag$;
                                // Create the drag clone element (components are pre-loaded in blog-app.tsx)
                                const contentElement = document.createElement(tagName);
                                // Copy any props from vNode to element
                                if (vNode.$attrs$) {
                                    Object.keys(vNode.$attrs$).forEach((key) => {
                                        contentElement.setAttribute(key, vNode.$attrs$[key]);
                                    });
                                }
                                dragClone.appendChild(contentElement);
                            }
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
                         * @param event - interact.js drag move event
                         */
                        move: (event) => {
                            const paletteItem = event.target.closest(".palette-item");
                            if (!paletteItem)
                                return;
                            const dragClone = paletteItem._dragClone;
                            const halfWidth = paletteItem._halfWidth;
                            const halfHeight = paletteItem._halfHeight;
                            if (dragClone) {
                                dragClone.style.left = event.clientX - halfWidth + "px";
                                dragClone.style.top = event.clientY - halfHeight + "px";
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
                         * @param event - interact.js drag end event
                         */
                        end: (event) => {
                            // Clear dragging state (replaces classList.remove)
                            this.draggingItemType = null;
                            const paletteItem = event.target.closest(".palette-item");
                            if (!paletteItem)
                                return;
                            const dragClone = paletteItem._dragClone;
                            const dropWasValid = paletteItem._dropWasValid;
                            const originalPos = paletteItem._originalPosition;
                            if (dragClone) {
                                if (!dropWasValid && originalPos) {
                                    // Invalid drop - animate back to palette
                                    dragClone.style.transition =
                                        "all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)";
                                    dragClone.style.left = originalPos.left + "px";
                                    dragClone.style.top = originalPos.top + "px";
                                    dragClone.style.opacity = "0";
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
        /**
         * Handle palette item click (for click-to-add feature)
         *
         * **Triggered**: User clicks on palette item
         * **Purpose**: Emit event for grid-builder to add component to active canvas
         *
         * ## Implementation
         *
         * 1. **Check if enabled**: Only proceed if `config.enableClickToAdd !== false`
         * 2. **Prevent drag conflict**: Don't trigger if currently dragging
         * 3. **Get component type**: From `data-component-type` attribute
         * 4. **Dispatch event**: Bubble up to grid-builder
         *
         * ## Event Details
         *
         * **Event name**: `palette-item-click`
         * **Event detail**: `{ componentType: string }`
         * **Bubbles**: true (so grid-builder can listen)
         * **Composed**: true (crosses shadow DOM boundaries)
         *
         * ## Accessibility
         *
         * **Keyboard support**: Enter/Space keys also trigger (via handlePaletteItemKeyDown)
         * **Screen reader**: Uses aria-label to announce action
         * **Focus**: Palette items are focusable (tabindex=0)
         *
         * **Example event listener** (in grid-builder):
         * ```typescript
         * @Listen('palette-item-click')
         * handlePaletteClick(event: CustomEvent<{ componentType: string }>) {
         * const { componentType } = event.detail;
         * this.addComponentToActiveCanvas(componentType);
         * }
         * ```
         * @param event - Mouse click event
         */
        this.handlePaletteItemClick = (event) => {
            var _a, _b;
            // Check if click-to-add is enabled (default: true)
            const enableClickToAdd = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.enableClickToAdd) !== null && _b !== void 0 ? _b : true;
            if (!enableClickToAdd) {
                return;
            }
            // Don't trigger click if currently dragging
            if (this.draggingItemType) {
                return;
            }
            // Get the palette item element (in case event.target is a nested child)
            const paletteItem = event.target.closest(".palette-item");
            if (!paletteItem) {
                return;
            }
            // Get component type from data attribute
            const componentType = paletteItem.getAttribute("data-component-type");
            if (!componentType) {
                console.warn("handlePaletteItemClick: Component type not found");
                return;
            }
            // Dispatch event for grid-builder to handle
            // Include targetGridBuilderId for multi-instance routing
            const clickEvent = new CustomEvent("palette-item-click", {
                detail: {
                    componentType,
                    targetGridBuilderId: this.targetGridBuilderId,
                },
                bubbles: true,
                composed: true,
            });
            this.hostElement.dispatchEvent(clickEvent);
        };
        /**
         * Handle palette item keyboard interaction (for accessibility)
         *
         * **Triggered**: User presses key on focused palette item
         * **Purpose**: Enable keyboard users to add components via Enter/Space
         *
         * ## Implementation
         *
         * **Supported keys**:
         * - Enter: Add component (same as click)
         * - Space: Add component (same as click)
         *
         * **Behavior**:
         * - Prevents default scrolling on Space
         * - Calls handlePaletteItemClick for consistency
         *
         * ## Accessibility Impact
         *
         * **Benefits**:
         * - Keyboard-only users can add components
         * - Screen reader users can navigate and activate palette items
         * - Matches standard button behavior (Enter/Space activation)
         *
         * **WCAG Compliance**:
         * - 2.1.1 Keyboard (Level A): All functionality available via keyboard
         * - 2.1.3 Keyboard (No Exception) (Level AAA): Enhanced keyboard access
         * @param event - Keyboard event
         */
        this.handlePaletteItemKeyDown = (event) => {
            var _a, _b;
            // Check if click-to-add is enabled (default: true)
            const enableClickToAdd = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.enableClickToAdd) !== null && _b !== void 0 ? _b : true;
            if (!enableClickToAdd) {
                return;
            }
            // Handle Enter and Space keys
            if (event.key === "Enter" || event.key === " ") {
                // Prevent default Space behavior (page scroll)
                event.preventDefault();
                // Trigger the same handler as click
                this.handlePaletteItemClick(event);
            }
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
        var _a;
        const paletteClasses = {
            palette: true,
            "palette-chromeless": !this.showHeader,
        };
        // Generate unique ID for this palette instance's help text
        const helpTextId = `palette-help-${this.paletteId}`;
        if (!this.components || this.components.length === 0) {
            return (h("div", { class: paletteClasses }, this.showHeader && h("h2", null, "Components"), h("p", { class: "palette-empty", role: "status", "aria-live": "polite" }, "No components available")));
        }
        return (h("div", { class: paletteClasses, role: "toolbar", "aria-label": this.paletteLabel, "aria-orientation": "vertical" }, h("div", { id: helpTextId, class: "sr-only" }, ((_a = this.config) === null || _a === void 0 ? void 0 : _a.enableClickToAdd) !== false
            ? "Click or press Enter/Space to add component to active canvas, or drag to position on any canvas"
            : "Drag component to canvas to add"), this.showHeader && h("h2", { id: "palette-heading" }, "Components"), this.components.map((component) => {
            var _a;
            // Class binding with reactive state
            const itemClasses = {
                "palette-item": true,
                "palette-item-custom": !!component.renderPaletteItem,
                "dragging-from-palette": this.draggingItemType === component.type,
            };
            // Improved aria-label with interaction methods
            const ariaLabel = ((_a = this.config) === null || _a === void 0 ? void 0 : _a.enableClickToAdd) !== false
                ? `${component.name} component. Click to add to active canvas or drag to position`
                : `${component.name} component. Drag to canvas`;
            return (h("div", { class: itemClasses, "data-component-type": component.type, key: component.type, role: "button", tabindex: 0, "aria-label": ariaLabel, "aria-describedby": helpTextId, "aria-pressed": this.draggingItemType === component.type ? "true" : "false", onClick: (e) => this.handlePaletteItemClick(e), onKeyDown: (e) => this.handlePaletteItemKeyDown(e) }, component.renderPaletteItem
                ? (() => {
                    const rendered = component.renderPaletteItem({
                        componentType: component.type,
                        name: component.name,
                        icon: component.icon,
                    });
                    // If render returns a DOM element (HTMLElement), wrap it in a div
                    // This handles cases where consumer uses document.createElement()
                    if (rendered instanceof HTMLElement) {
                        return (h("div", { ref: (el) => el &&
                                !el.hasChildNodes() &&
                                el.appendChild(rendered) }));
                    }
                    // Otherwise return the vNode directly (JSX)
                    return rendered;
                })()
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
        const paletteItems = this.hostElement.querySelectorAll(".palette-item");
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

export { ComponentPalette as component_palette };
//# sourceMappingURL=component-palette.entry.esm.js.map
