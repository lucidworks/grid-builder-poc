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
import { Canvas } from '../../services/state-manager';
import { GridConfig } from '../../types/grid-config';
import { ComponentDefinition } from '../../types/component-definition';
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
export declare class CanvasSection {
    /**
     * Canvas ID for state management
     *
     * **Format**: 'canvas1', 'canvas2', etc.
     * **Purpose**: Key for accessing canvas data in gridState.canvases
     * **Required**: Component won't render without valid canvasId
     */
    canvasId: string;
    /**
     * Grid configuration options
     *
     * **Optional**: Customizes grid system behavior
     * **Passed from**: grid-builder component
     * **Used for**: Grid size calculations, constraints
     */
    config?: GridConfig;
    /**
     * Component registry (from parent grid-builder)
     *
     * **Source**: grid-builder component (built from components prop)
     * **Structure**: Map<type, ComponentDefinition>
     * **Purpose**: Pass to grid-item-wrapper for dynamic rendering
     */
    componentRegistry?: Map<string, ComponentDefinition>;
    /**
     * Background color for this canvas
     *
     * **Host app responsibility**: Pass canvas styling from host app
     * **Library does NOT store**: backgroundColor is presentation concern
     * **Optional**: Defaults to '#ffffff'
     *
     * @example
     * ```tsx
     * <canvas-section
     *   canvasId="hero-section"
     *   backgroundColor="#f0f4f8"
     * />
     * ```
     */
    backgroundColor?: string;
    /**
     * Canvas title (from canvasMetadata)
     *
     * **Optional**: Display title for this section
     * **Renders as**: Rotated tab on right side, outside section bounds
     * **Builder mode only**: Title tabs visible in builder, not viewer
     * **Source**: Passed from grid-builder via canvasMetadata[canvasId].title
     *
     * @example
     * ```tsx
     * <canvas-section
     *   canvasId="hero-section"
     *   canvasTitle="Hero Section"
     * />
     * ```
     */
    canvasTitle?: string;
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
    isActive?: boolean;
    /**
     * Deletion hook (from parent grid-builder)
     *
     * **Source**: grid-builder component (from onBeforeDelete prop)
     * **Purpose**: Pass through to grid-item-wrapper for deletion interception
     * **Optional**: If not provided, components delete immediately
     */
    onBeforeDelete?: (context: any) => boolean | Promise<boolean>;
    /**
     * Canvas state (reactive)
     *
     * **Source**: gridState.canvases[canvasId]
     * **Updates**: componentWillLoad, componentWillUpdate, onChange subscription
     * **Contains**: items array, zIndexCounter (NO backgroundColor - that's a prop now)
     */
    canvas: Canvas;
    /**
     * Render version counter (forces re-renders)
     *
     * **Purpose**: Trigger re-renders when grid calculations change
     * **Incremented on**: ResizeObserver events, state changes
     * **Passed to**: grid-item-wrapper as prop
     * **Why needed**: Grid calculations cached, need to recalculate on resize
     */
    renderVersion: number;
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
    private calculatedHeight;
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
    private isDropTarget;
    /**
     * Grid container DOM reference
     *
     * **Used for**:
     * - interact.js dropzone setup
     * - ResizeObserver monitoring
     * - Position calculations (getBoundingClientRect)
     */
    private gridContainerRef;
    /**
     * Dropzone initialization flag
     *
     * **Prevents**: Multiple dropzone setups on same element
     * **Set in**: initializeDropzone()
     * **Checked in**: initializeDropzone(), disconnectedCallback()
     */
    private dropzoneInitialized;
    /**
     * ResizeObserver instance
     *
     * **Monitors**: gridContainerRef size changes
     * **Callback**: Clears grid cache, increments renderVersion
     * **Cleanup**: disconnectedCallback() disconnects observer
     */
    private resizeObserver;
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
    componentWillLoad(): void;
    /**
     * Component will update lifecycle hook
     *
     * **Called**: Before each re-render
     * **Purpose**: Ensure canvas reference is fresh from state
     */
    componentWillUpdate(): void;
    /**
     * Component did load lifecycle hook
     *
     * **Called**: After first render (DOM available)
     * **Purpose**: Initialize interact.js dropzone and ResizeObserver
     */
    componentDidLoad(): void;
    /**
     * Disconnected callback (cleanup)
     *
     * **Called**: When component removed from DOM
     * **Purpose**: Clean up interact.js and ResizeObserver
     */
    disconnectedCallback(): void;
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
    handleCanvasIdChange(newCanvasId: string, oldCanvasId: string): void;
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
    handleConfigChange(newConfig: GridConfig, oldConfig: GridConfig): void;
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
    handleIsActiveChange(newIsActive: boolean, oldIsActive: boolean): void;
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
    private setupCanvasClickListener;
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
    private setupResizeObserver;
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
    private initializeDropzone;
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
    render(): any;
}
