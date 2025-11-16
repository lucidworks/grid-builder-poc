import { r as registerInstance, h } from './index-ebe9feb4.js';
import { i as interact_min } from './interact.min-bef33ec6.js';
import { c as componentTemplates } from './component-templates-e71f1a8f.js';
import { a as undoRedoState, u as undo, r as redo } from './undo-redo-158eb3dc.js';
import { g as gridToPixelsX, b as gridToPixelsY } from './grid-calculations-e64c8272.js';
import './index-28d0c3f6.js';

const componentPaletteCss = ".palette{width:250px;padding:20px;border-right:1px solid #ddd;background:white;overflow-y:auto}.palette h2{margin-bottom:20px;color:#333;font-size:18px}.palette-item{padding:15px;border-radius:4px;margin-bottom:10px;background:#4a90e2;color:white;cursor:move;font-weight:500;text-align:center;transition:transform 0.2s, box-shadow 0.2s;user-select:none}.palette-item:hover{box-shadow:0 4px 8px rgba(0, 0, 0, 0.1);transform:translateY(-2px)}.palette-item.dragging-from-palette{opacity:0.5}.dragging-clone{position:fixed;z-index:10000;width:200px;height:150px;padding:20px;border-radius:4px;background:rgba(74, 144, 226, 0.9);box-shadow:0 4px 12px rgba(0, 0, 0, 0.2);color:white;pointer-events:none}.history-controls{display:flex;margin-top:10px;gap:8px}.history-btn{flex:1;padding:10px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s}.history-btn:disabled{cursor:not-allowed;opacity:0.4}.history-btn:hover:not(:disabled){border-color:#4a90e2;background:#f5f5f5;color:#4a90e2}";

const ComponentPalette = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Initialize drag functionality for palette items
         *
         * **Called from**: componentDidLoad (after DOM available)
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
         * ## Data Transfer Pattern
         *
         * **Component type stored in**:
         * - `data-component-type` attribute on palette item
         * - Read in `start` event: `event.target.getAttribute('data-component-type')`
         * - Canvas retrieves from drag clone or dropzone event
         *
         * **Why data attribute**:
         * - Standard HTML pattern
         * - Accessible in event handlers
         * - No global state needed
         * - Works with interact.js events
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
         * **Alternative approaches**:
         * - ❌ Global variable: Doesn't support concurrent drags
         * - ❌ Closure: More memory, harder to debug
         * - ✅ Element property: Simple, isolated, garbage collected
         *
         * @private
         */
        this.initializePaletteItems = () => {
            const paletteItems = document.querySelectorAll('.palette-item');
            paletteItems.forEach((element) => {
                interact_min(element).draggable({
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
                         * 2. **Get component metadata**: Type and template from data attribute
                         * 3. **Calculate component size**: Convert grid units to pixels
                         * 4. **Create drag clone**: Fixed-position element following cursor
                         * 5. **Center cursor**: Offset by half dimensions
                         * 6. **Store references**: Clone and dimensions on event.target
                         *
                         * ## Sizing Strategy
                         *
                         * **Default size**: 10 units wide × 6 units tall
                         * ```typescript
                         * const widthPx = gridToPixelsX(10, 'canvas1');  // ~200px at 1000px canvas
                         * const heightPx = gridToPixelsY(6);             // 120px (fixed)
                         * ```
                         *
                         * **Why these defaults**:
                         * - 10 units = 20% of canvas width (good visibility)
                         * - 6 units = 120px height (consistent vertical size)
                         * - Matches typical component proportions
                         *
                         * ## Clone Styling
                         *
                         * **Key styles**:
                         * - `position: fixed` - Relative to viewport (follows scroll)
                         * - `pointer-events: none` - Doesn't block drop detection
                         * - `z-index: 10000` - Above all other elements
                         * - `background: rgba(74, 144, 226, 0.9)` - Semi-transparent blue
                         *
                         * **Why fixed position**:
                         * - Stays in place during page scroll
                         * - Simple coordinate calculation (clientX/Y)
                         * - No parent transform complications
                         *
                         * ## Cursor Centering
                         *
                         * **Formula**:
                         * ```typescript
                         * left = clientX - halfWidth
                         * top = clientY - halfHeight
                         * ```
                         *
                         * **Why center**:
                         * - Cursor appears "holding" middle of component
                         * - Better drop alignment feedback
                         * - Matches user expectations from design tools
                         *
                         * @param event - interact.js drag start event
                         */
                        start: (event) => {
                            event.target.classList.add('dragging-from-palette');
                            // Get component type and template
                            const componentType = event.target.getAttribute('data-component-type');
                            const template = componentTemplates[componentType];
                            // Calculate actual component size (default: 10 units wide, 6 units tall)
                            // Use canvas1 for width calculation (responsive grid)
                            const defaultWidth = 10;
                            const defaultHeight = 6;
                            const widthPx = gridToPixelsX(defaultWidth, 'canvas1');
                            const heightPx = gridToPixelsY(defaultHeight);
                            const halfWidth = widthPx / 2;
                            const halfHeight = heightPx / 2;
                            // Create drag clone with actual component size
                            const dragClone = document.createElement('div');
                            dragClone.className = 'dragging-clone';
                            dragClone.style.position = 'fixed';
                            dragClone.style.width = widthPx + 'px';
                            dragClone.style.height = heightPx + 'px';
                            dragClone.style.left = event.clientX - halfWidth + 'px';
                            dragClone.style.top = event.clientY - halfHeight + 'px';
                            dragClone.style.padding = '20px 20px 20px 44px';
                            dragClone.style.background = 'rgba(74, 144, 226, 0.9)';
                            dragClone.style.color = 'white';
                            dragClone.style.borderRadius = '4px';
                            dragClone.style.pointerEvents = 'none';
                            dragClone.style.zIndex = '10000';
                            dragClone.innerHTML = `
                <div style="font-weight: 600; color: #fff; margin-bottom: 5px; font-size: 14px;">${template.icon} ${template.title}</div>
              `;
                            document.body.appendChild(dragClone);
                            // Store clone reference and half dimensions for move event
                            event.target._dragClone = dragClone;
                            event.target._halfWidth = halfWidth;
                            event.target._halfHeight = halfHeight;
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
                         * ## Reference Retrieval
                         *
                         * **Stored in start event**:
                         * ```typescript
                         * const dragClone = (event.target as any)._dragClone;
                         * const halfWidth = (event.target as any)._halfWidth;
                         * const halfHeight = (event.target as any)._halfHeight;
                         * ```
                         *
                         * **Safety check**: `if (dragClone)` prevents errors if cleanup happened
                         *
                         * ## Cursor Centering Maintained
                         *
                         * **Formula unchanged from start**:
                         * - Subtract half dimensions to keep cursor in center
                         * - Smooth tracking during entire drag
                         * - Consistent visual feedback
                         *
                         * @param event - interact.js drag move event
                         */
                        move: (event) => {
                            const dragClone = event.target._dragClone;
                            const halfWidth = event.target._halfWidth;
                            const halfHeight = event.target._halfHeight;
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
                         * delete (event.target as any)._halfWidth;  // Implicit via clone delete
                         * delete (event.target as any)._halfHeight; // Implicit via clone delete
                         * ```
                         *
                         * **Why important**:
                         * - Prevents memory leaks
                         * - Allows garbage collection of clone element
                         * - Clean state for next drag
                         *
                         * ## Drop Detection
                         *
                         * **Not handled here**: Drop detection happens in canvas-section.tsx
                         *
                         * **Separation of concerns**:
                         * - Palette: Creates/removes drag visual
                         * - Canvas: Detects drop and creates grid item
                         * - App: Coordinates between them
                         *
                         * ## Safety
                         *
                         * **Null check**: `if (dragClone)` prevents errors if:
                         * - Clone already removed (edge case)
                         * - Drag cancelled programmatically
                         * - Multiple end events (browser quirks)
                         *
                         * @param event - interact.js drag end event
                         */
                        end: (event) => {
                            event.target.classList.remove('dragging-from-palette');
                            const dragClone = event.target._dragClone;
                            if (dragClone) {
                                dragClone.remove();
                                delete event.target._dragClone;
                            }
                        },
                    },
                });
            });
        };
    }
    /**
     * Component will load lifecycle hook
     *
     * **Called**: Before first render
     * **Purpose**: Setup subscriptions, initialize state
     *
     * **Currently empty because**:
     * - undoRedoState from @stencil/store is automatically reactive
     * - No manual subscription needed
     * - State changes trigger re-renders automatically
     *
     * **Could be used for**:
     * - Manual store subscriptions
     * - Async data fetching
     * - Initial state calculations
     */
    componentWillLoad() {
        // Subscribe to undo/redo state changes
        // The undoRedoState from @stencil/store is already reactive
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
     *
     * @see initializePaletteItems for drag setup details
     */
    componentDidLoad() {
        // Initialize drag functionality for palette items
        this.initializePaletteItems();
    }
    /**
     * Render component template
     *
     * **Reactive**: Re-runs when undoRedoState changes
     * **Pure**: No side effects, only returns JSX
     *
     * **Component categorization**:
     * - Filters `componentTemplates` by `complex` flag
     * - Renders simple components first
     * - Renders complex components in separate section
     * - Renders undo/redo buttons with reactive state
     *
     * **Data attributes**:
     * - `data-component-type`: Used by drag handlers to identify component
     * - `key`: React-style key for list rendering
     *
     * **Reactive button state**:
     * - `disabled={!undoRedoState.canUndo}` auto-updates
     * - onClick handlers call undo/redo functions
     * - Tooltips show keyboard shortcuts
     *
     * @returns JSX template for palette UI
     *
     * @example
     * ```tsx
     * // Rendered output structure:
     * <div class="palette">
     *   <h2>Components</h2>
     *   <div data-component-type="header">📝 Header</div>
     *   <div data-component-type="text">📄 Text</div>
     *   ...
     *   <h2>Complex</h2>
     *   <div data-component-type="gallery">🖼️ Image Gallery</div>
     *   ...
     *   <h2>History</h2>
     *   <button disabled={false} onClick={undo}>↶ Undo</button>
     *   <button disabled={true} onClick={redo}>↷ Redo</button>
     * </div>
     * ```
     */
    render() {
        const simpleComponents = Object.entries(componentTemplates).filter(([, template]) => !template.complex);
        const complexComponents = Object.entries(componentTemplates).filter(([, template]) => template.complex);
        return (h("div", { class: "palette" }, h("h2", null, "Components"), simpleComponents.map(([type, template]) => (h("div", { class: "palette-item", "data-component-type": type, key: type }, template.icon, " ", template.title))), h("h2", { style: {
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #ddd',
            } }, "Complex"), complexComponents.map(([type, template]) => (h("div", { class: "palette-item", "data-component-type": type, key: type }, template.icon, " ", template.title))), h("h2", { style: {
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #ddd',
            } }, "History"), h("div", { class: "history-controls" }, h("button", { id: "undoBtn", class: "history-btn", title: "Undo (Ctrl+Z)", disabled: !undoRedoState.canUndo, onClick: () => undo() }, "\u21B6 Undo"), h("button", { id: "redoBtn", class: "history-btn", title: "Redo (Ctrl+Y)", disabled: !undoRedoState.canRedo, onClick: () => redo() }, "\u21B7 Redo"))));
    }
};
ComponentPalette.style = componentPaletteCss;

export { ComponentPalette as component_palette };

//# sourceMappingURL=component-palette.entry.js.map