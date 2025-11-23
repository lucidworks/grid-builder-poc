import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';
import { i as interact } from './interact.min.js';
import { b as gridToPixelsX, g as gridToPixelsY } from './grid-calculations.js';

const componentPaletteCss = ".palette{width:250px;padding:20px;border-right:1px solid #ddd;background:white;overflow-y:auto}.palette h2{margin-bottom:20px;color:#333;font-size:18px}.palette-chromeless{padding-top:10px}.palette-empty{color:#999;font-size:13px;font-style:italic}.palette-item{padding:15px;border-radius:4px;margin-bottom:10px;background:#4a90e2;color:white;cursor:move;font-weight:500;text-align:center;transition:transform 0.2s, box-shadow 0.2s;user-select:none;touch-action:none;}.palette-item:hover{box-shadow:0 4px 8px rgba(0, 0, 0, 0.1);transform:translateY(-2px)}.palette-item.dragging-from-palette{opacity:0.5}.dragging-clone{position:fixed;z-index:10000;pointer-events:none}";

const ComponentPalette = /*@__PURE__*/ proxyCustomElement(class ComponentPalette extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
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
    get hostElement() { return this; }
    static get watchers() { return {
        "components": ["handleComponentsChange"],
        "config": ["handleConfigChange"]
    }; }
    static get style() { return componentPaletteCss; }
}, [256, "component-palette", {
        "components": [16],
        "config": [16],
        "showHeader": [4, "show-header"],
        "draggingItemType": [32]
    }, undefined, {
        "components": ["handleComponentsChange"],
        "config": ["handleConfigChange"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["component-palette"];
    components.forEach(tagName => { switch (tagName) {
        case "component-palette":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, ComponentPalette);
            }
            break;
    } });
}

export { ComponentPalette as C, defineCustomElement as d };
//# sourceMappingURL=component-palette2.js.map

//# sourceMappingURL=component-palette2.js.map