/**
 * Component Palette Component (Library Version)
 * ===============================================
 *
 * Draggable component library providing visual component selection and drag-and-drop
 * functionality for adding new items to canvases.
 *
 * ## Key Differences from POC
 *
 * **Removed POC-specific features**:
 * - Hardcoded componentTemplates import
 * - Undo/redo UI controls (will be plugin/UI override)
 * - Complex/simple categorization (consumer can provide via props)
 *
 * **Library-specific features**:
 * - Renders from ComponentDefinition[] prop
 * - Clean component list without hardcoded data
 * - Fully customizable via props
 * - Chromeless mode for flexible embedding
 *
 * ## Component-Driven Design
 *
 * **Standard mode with header**:
 * ```typescript
 * <component-palette components={componentDefinitions} />
 * ```
 *
 * **Chromeless mode (no header)**:
 * ```typescript
 * <component-palette
 *   components={componentDefinitions}
 *   showHeader={false}
 * />
 * ```
 *
 * **Consumer provides**:
 * - Component types (via ComponentDefinition[])
 * - Icons, names, default sizes
 * - All visual content
 * - Optional: Header visibility preference
 *
 * **Library provides**:
 * - Drag initiation infrastructure
 * - Visual drag clone
 * - Cursor-centered positioning
 * - interact.js integration
 * - Flexible header display (chromeless mode)
 *
 * ## Drag Clone Strategy
 *
 * **Why create clone**:
 * - Original palette item stays in place
 * - Visual feedback at correct size
 * - Cursor centered on component (UX polish)
 * - Doesn't interfere with drop detection
 *
 * **Clone sizing**:
 * ```typescript
 * // Uses ComponentDefinition.defaultSize (or fallback 10×6)
 * const defaultSize = definition.defaultSize || { width: 10, height: 6 };
 * const widthPx = gridToPixelsX(defaultSize.width, 'canvas1', this.config);
 * const heightPx = gridToPixelsY(defaultSize.height);
 *
 * // Center cursor in clone
 * clone.style.left = event.clientX - halfWidth + 'px';
 * clone.style.top = event.clientY - halfHeight + 'px';
 * ```
 *
 * **Why half dimensions**:
 * - Centers cursor in dragged element
 * - Better visual alignment with drop target
 * - Matches user expectations from other tools
 *
 * ## Data Transfer Pattern
 *
 * **Component type stored in**:
 * - `data-component-type` attribute on palette item
 * - Read in `start` event: `event.target.getAttribute('data-component-type')`
 * - Canvas retrieves from dropzone event
 *
 * **Why data attribute**:
 * - Standard HTML pattern
 * - Accessible in event handlers
 * - No global state needed
 * - Works with interact.js events
 *
 * ## Performance Characteristics
 *
 * **Drag clone creation**: ~1-2ms (DOM creation + styling)
 * **Drag move**: <1ms (style updates only, no layout)
 * **Drag end**: <1ms (remove clone)
 * **Re-renders**: Only on components prop changes
 *
 * **Optimization**: Drag clone uses `position: fixed` + `pointer-events: none`
 * to avoid triggering layout recalculations during drag.
 *
 * @module component-palette
 */
import { ComponentDefinition } from '../../types/component-definition';
import { GridConfig } from '../../types/grid-config';
/**
 * ComponentPalette Component
 * ===========================
 *
 * Library component providing draggable component palette UI.
 *
 * **Tag**: `<component-palette>`
 * **Shadow DOM**: Disabled (for consistency with other components)
 * **Reactivity**: Re-renders when components prop changes
 *
 * ## Usage Patterns
 *
 * **Pattern 1: Default (inside grid-builder)**
 * ```typescript
 * // Palette automatically rendered by grid-builder
 * <grid-builder components={componentDefinitions} />
 * ```
 *
 * **Pattern 2: Independent placement**
 * ```typescript
 * // Place palette anywhere in your app
 * <div class="my-layout">
 *   <aside class="sidebar">
 *     <component-palette
 *       components={componentDefinitions}
 *       config={gridConfig}
 *     />
 *   </aside>
 *   <main>
 *     <grid-builder
 *       components={componentDefinitions}
 *       config={gridConfig}
 *       uiOverrides={{
 *         ComponentPalette: () => null  // Hide default palette
 *       }}
 *     />
 *   </main>
 * </div>
 * ```
 *
 * **Pattern 3: Custom wrapper component**
 * ```typescript
 * // Wrap in your own component for styling
 * @Component({ tag: 'my-palette-sidebar' })
 * export class MyPaletteSidebar {
 *   @Prop() components: ComponentDefinition[];
 *
 *   render() {
 *     return (
 *       <div class="custom-sidebar">
 *         <h3>Components</h3>
 *         <component-palette components={this.components} />
 *       </div>
 *     );
 *   }
 * }
 * ```
 *
 * ## Key Features
 *
 * - **Self-contained**: Works independently of grid-builder
 * - **Drag/drop ready**: Uses interact.js for drag functionality
 * - **Flexible placement**: Can be rendered anywhere in DOM
 * - **Works across boundaries**: Drag from palette to any canvas-section
 */
export declare class ComponentPalette {
    /**
     * Host element reference
     *
     * **Used for**: Scoping querySelectorAll to only palette items in this instance
     */
    hostElement: HTMLElement;
    /**
     * Component definitions to render in palette
     *
     * **Required prop**: Array of ComponentDefinition objects
     * **Source**: Passed from grid-builder component
     *
     * **Each definition provides**:
     * - type: Unique identifier for component
     * - name: Display name in palette
     * - icon: Visual identifier (emoji recommended)
     * - defaultSize: Size when dropped (for drag clone sizing)
     *
     * **Example**:
     * ```typescript
     * const components = [
     *   {
     *     type: 'header',
     *     name: 'Header',
     *     icon: '📄',
     *     defaultSize: { width: 20, height: 8 },
     *     render: ({ itemId, config }) => <my-header itemId={itemId} config={config} />
     *   }
     * ];
     * ```
     */
    components: ComponentDefinition[];
    /**
     * Grid configuration options
     *
     * **Optional prop**: Customizes grid system behavior
     * **Passed from**: grid-builder component
     * **Used for**: Drag clone sizing (gridToPixelsX/Y calculations)
     */
    config?: GridConfig;
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
    showHeader?: boolean;
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
    draggingItemType: string | null;
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
    handleComponentsChange(newComponents: ComponentDefinition[], oldComponents: ComponentDefinition[]): void;
    /**
     * Watch for config prop changes
     *
     * **When triggered**: Parent passes updated GridConfig
     * **Actions**: Config changes affect drag clone sizing
     *
     * **Note**: Config stored in closure by initializePaletteItems
     * Will be used on next drag start, no immediate action needed
     */
    handleConfigChange(newConfig: GridConfig, oldConfig: GridConfig): void;
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
    componentDidLoad(): void;
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
    componentDidUpdate(): void;
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
    render(): any;
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
    private initializePaletteItems;
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
    disconnectedCallback(): void;
}
