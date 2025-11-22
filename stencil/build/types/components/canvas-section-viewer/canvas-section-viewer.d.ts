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
import { GridItem } from '../../services/state-manager';
import { GridConfig } from '../../types/grid-config';
import { ComponentDefinition } from '../../types/component-definition';
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
export declare class CanvasSectionViewer {
    /**
     * Canvas ID for identification
     *
     * **Format**: 'canvas1', 'hero-section', etc.
     * **Purpose**: Element ID and data attribute
     */
    canvasId: string;
    /**
     * Items to render in this canvas
     *
     * **Required**: Array of GridItem objects
     * **Source**: Passed from grid-viewer component
     *
     * **Unlike canvas-section**: Items passed via props, not from global state
     */
    items: GridItem[];
    /**
     * Current viewport mode
     *
     * **Required**: 'desktop' | 'mobile'
     * **Source**: Passed from grid-viewer component
     *
     * **Purpose**: Determines which layout to render for each item
     */
    currentViewport: 'desktop' | 'mobile';
    /**
     * Grid configuration options
     *
     * **Optional**: Customizes grid system behavior
     * **Passed from**: grid-viewer component
     */
    config?: GridConfig;
    /**
     * Component registry (from parent grid-viewer)
     *
     * **Source**: grid-viewer component
     * **Structure**: Map<type, ComponentDefinition>
     * **Purpose**: Pass to grid-item-wrapper for dynamic rendering
     */
    componentRegistry?: Map<string, ComponentDefinition>;
    /**
     * Background color for this canvas
     *
     * **Optional**: Canvas background color
     * **Default**: '#ffffff'
     */
    backgroundColor?: string;
    /**
     * Render version counter (forces re-renders)
     *
     * **Purpose**: Trigger re-renders when grid calculations change
     * **Incremented on**: ResizeObserver events
     * **Passed to**: grid-item-wrapper as prop
     */
    renderVersion: number;
    /**
     * Calculated canvas height based on content
     *
     * **Purpose**: Dynamic canvas height that fits all items
     * **Calculated from**: Item positions (bottom-most item determines height)
     * **Recalculated when**: Items change, viewport changes, or resize occurs
     */
    calculatedHeight: number;
    /**
     * Grid container DOM reference
     *
     * **Used for**: ResizeObserver monitoring
     */
    private gridContainerRef;
    /**
     * ResizeObserver instance
     *
     * **Monitors**: gridContainerRef size changes
     * **Callback**: Clears grid cache, increments renderVersion
     * **Cleanup**: disconnectedCallback() disconnects observer
     */
    private resizeObserver;
    /**
     * Component did load lifecycle hook
     *
     * **Called**: After first render (DOM available)
     * **Purpose**: Setup ResizeObserver and calculate initial height
     */
    componentDidLoad(): void;
    /**
     * Component did update lifecycle hook
     *
     * **Called**: After props change
     * **Purpose**: Ensure ResizeObserver is setup
     */
    componentDidUpdate(): void;
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up ResizeObserver
     */
    disconnectedCallback(): void;
    /**
     * Watch items prop for changes
     *
     * **Purpose**: Recalculate canvas height when items change
     */
    handleItemsChange(): void;
    /**
     * Watch currentViewport prop for changes
     *
     * **Purpose**: Recalculate canvas height when viewport changes
     */
    handleViewportChange(): void;
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
    private updateCanvasHeight;
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
    private setupResizeObserver;
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
    render(): any;
}
