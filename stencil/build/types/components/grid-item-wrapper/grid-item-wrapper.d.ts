/**
 * Grid Item Wrapper Component (Library Version)
 * ===============================================
 *
 * Individual grid item container with dynamic component rendering from registry.
 * This is the library version that uses ComponentDefinition.render() for flexibility.
 *
 * ## Key Differences from POC
 *
 * **Dynamic component rendering**:
 * - POC: Hardcoded switch statement with 8 component types
 * - Library: Uses ComponentDefinition.render() from component registry
 * - Consumer defines all component types
 * - Library just calls the render function
 *
 * **Removed POC-specific**:
 * - componentTemplates import (hardcoded component data)
 * - Fixed component type switch statement
 * - Hardcoded icon/title from templates
 *
 * **Added library features**:
 * - Component registry lookup
 * - Fallback for unknown component types
 * - Pass GridConfig to grid calculations
 *
 * @module grid-item-wrapper
 */
import { GridItem } from '../../services/state-manager';
import { GridConfig } from '../../types/grid-config';
import { ComponentDefinition } from '../../types/component-definition';
/**
 * GridItemWrapper Component
 * ==========================
 *
 * Library component wrapping individual grid items with drag/resize/selection.
 *
 * **Tag**: `<grid-item-wrapper>`
 * **Shadow DOM**: Disabled (required for interact.js compatibility)
 * **Dynamic rendering**: Uses ComponentDefinition.render() from registry
 */
export declare class GridItemWrapper {
    /**
     * Grid item data (position, size, type, etc.)
     *
     * **Source**: Parent canvas-section component
     * **Contains**: id, canvasId, type, name, layouts (desktop/mobile), zIndex, config
     */
    item: GridItem;
    /**
     * Render version (force re-render trigger)
     *
     * **Source**: Parent canvas-section (incremented on resize)
     * **Purpose**: Force grid calculation refresh when container resizes
     */
    renderVersion?: number;
    /**
     * Grid configuration options
     *
     * **Optional**: Customizes grid system behavior
     * **Passed from**: grid-builder → canvas-section → grid-item-wrapper
     * **Used for**: Grid size calculations with constraints
     */
    config?: GridConfig;
    /**
     * Component registry (from parent grid-builder)
     *
     * **Source**: grid-builder component (built from components prop)
     * **Structure**: Map<type, ComponentDefinition>
     * **Purpose**: Look up component definitions for dynamic rendering
     *
     * **Note**: This is passed as a workaround since StencilJS doesn't have
     * good support for context/provide-inject patterns. In a production app,
     * consider using a global registry or context provider.
     */
    componentRegistry?: Map<string, ComponentDefinition>;
    /**
     * Deletion hook (from parent grid-builder)
     *
     * **Source**: grid-builder component (from onBeforeDelete prop)
     * **Purpose**: Allow host app to intercept deletion requests
     *
     * **Hook behavior**:
     * - Called before deleting a component
     * - Receives context with item data
     * - Returns true/false or Promise<boolean>
     * - If false, deletion is cancelled
     * - If true, deletion proceeds
     *
     * **Default**: If not provided, components delete immediately
     */
    onBeforeDelete?: (context: any) => boolean | Promise<boolean>;
    /**
     * Viewer mode flag
     *
     * **Purpose**: Disable editing features for rendering-only mode
     * **Default**: false (editing enabled)
     *
     * **When true**:
     * - ❌ No drag-and-drop handlers
     * - ❌ No resize handles
     * - ❌ No item header (drag handle)
     * - ❌ No delete button
     * - ❌ No selection state
     * - ✅ Only renders component content
     *
     * **Use case**: grid-viewer component for display-only mode
     */
    viewerMode?: boolean;
    /**
     * Current viewport (for viewer mode)
     *
     * **Purpose**: Determine which layout to render (desktop or mobile)
     * **Source**: grid-viewer → canvas-section-viewer → grid-item-wrapper
     * **Used by**: render() to select appropriate layout
     *
     * **Note**: When in builder mode (viewerMode=false), this is ignored
     * and gridState.currentViewport is used instead. When in viewer mode
     * (viewerMode=true), this prop is required.
     */
    currentViewport?: 'desktop' | 'mobile';
    /**
     * All items in the canvas (for viewer mode auto-layout)
     *
     * **Purpose**: Calculate mobile auto-layout positions
     * **Source**: grid-viewer → canvas-section-viewer → grid-item-wrapper
     * **Used by**: render() to calculate stacked positions in mobile viewport
     *
     * **Note**: When in builder mode (viewerMode=false), this is ignored
     * and gridState.canvases is used instead. When in viewer mode
     * (viewerMode=true), this prop is required for mobile auto-layout.
     */
    canvasItems?: GridItem[];
    /**
     * Selection state (reactive)
     *
     * **Managed by**: updateComponentState()
     * **Updated on**: componentWillLoad, componentWillUpdate
     * **Triggers**: Visual selection styles (.selected class)
     */
    isSelected: boolean;
    /**
     * Visibility state (virtual rendering)
     *
     * **Managed by**: IntersectionObserver callback
     * **Initial value**: false (don't render content yet)
     * **Triggered by**: Observer callback or manual check for initially-visible items
     * **Controls**: Whether component content renders or placeholder shows
     *
     * **Note**: Virtual renderer checks if element is initially in viewport
     * and triggers callback immediately to prevent "Loading..." on visible items.
     * Off-screen items stay false until scrolled into view (virtual rendering).
     */
    isVisible: boolean;
    /**
     * Item DOM element reference
     */
    private itemRef;
    /**
     * Drag handler instance
     */
    private dragHandler;
    /**
     * Resize handler instance
     */
    private resizeHandler;
    /**
     * Item snapshot (for undo/redo)
     */
    private itemSnapshot;
    /**
     * Track whether item was dragged (to prevent click event on drag end)
     */
    private wasDragged;
    /**
     * Component will load lifecycle hook
     */
    componentWillLoad(): void;
    /**
     * Component will update lifecycle hook
     */
    componentWillUpdate(): void;
    /**
     * Update component state (selection and snapshot)
     */
    private updateComponentState;
    /**
     * Component did load lifecycle hook
     */
    componentDidLoad(): void;
    /**
     * Component did update lifecycle hook
     */
    componentDidUpdate(): void;
    /**
     * Inject component content into custom wrapper's content slot
     *
     * **Purpose**: For custom wrappers, find the content slot div and inject component
     * **Called from**: componentDidLoad, componentDidUpdate
     * **Why needed**: Custom wrapper JSX renders, then we inject content into its slot
     */
    private injectComponentContent;
    /**
     * Disconnected callback (cleanup)
     */
    disconnectedCallback(): void;
    /**
     * Watch for item prop changes
     *
     * **When triggered**: Parent passes updated item data
     * **Actions**:
     * - Update component state (selection, snapshot)
     * - Reinitialize drag/resize handlers with new item data
     * - Preserve handlers if already initialized
     */
    handleItemChange(newItem: GridItem, oldItem: GridItem): void;
    /**
     * Watch for renderVersion prop changes
     *
     * **When triggered**: Parent increments renderVersion (e.g., on container resize)
     * **Purpose**: Force component re-render to recalculate grid positions
     * **Note**: This is a force-update mechanism, actual recalculation happens in render()
     */
    handleRenderVersionChange(newVersion: number, oldVersion: number): void;
    /**
     * Watch for config prop changes
     *
     * **When triggered**: Parent passes updated GridConfig
     * **Actions**: Reinitialize drag/resize handlers with new config
     * **Note**: Config changes are rare (e.g., user changes grid settings)
     */
    handleConfigChange(newConfig: GridConfig, oldConfig: GridConfig): void;
    /**
     * Watch for currentViewport prop changes (viewer mode only)
     *
     * **When triggered**: Viewport switches between desktop/mobile in viewer mode
     * **Purpose**: Force re-render to use appropriate layout
     * **Note**: Only relevant in viewerMode=true
     */
    handleViewportChange(newViewport: 'desktop' | 'mobile', oldViewport: 'desktop' | 'mobile'): void;
    /**
     * Listen for item-delete events from custom wrapper components
     * This is the PUBLIC API for custom wrappers to request item deletion
     * We intercept these and re-dispatch as internal 'grid-item:delete' events
     */
    handleItemDeleteEvent(event: CustomEvent): void;
    /**
     * Listen for item-bring-to-front events from custom wrapper components
     */
    handleItemBringToFrontEvent(event: CustomEvent): void;
    /**
     * Listen for item-send-to-back events from custom wrapper components
     */
    handleItemSendToBackEvent(event: CustomEvent): void;
    /**
     * Render component content (dynamic component from registry)
     *
     * **Dynamic rendering via ComponentDefinition.render()**:
     * - Lookup component definition by type in registry
     * - Call definition.render({ itemId, config })
     * - Consumer controls what gets rendered
     * - Library just provides the wrapper
     *
     * **Virtual rendering guard**:
     * - Only render when isVisible = true
     * - Show placeholder while loading
     * - Performance optimization
     *
     * **Fallback for unknown types**:
     * - If no registry provided: "Component registry not available"
     * - If type not in registry: "Unknown component type: {type}"
     * - Prevents crashes, helps debugging
     */
    private renderComponent;
    /**
     * Render component template
     *
     * **Layout selection and auto-layout**:
     * - Desktop: Use desktop layout
     * - Mobile (not customized): Auto-stack full-width
     * - Mobile (customized): Use custom mobile layout
     *
     * **Grid to pixel conversion**:
     * - Horizontal: gridToPixelsX(units, canvasId, config)
     * - Vertical: gridToPixelsY(units)
     * - Responsive width, fixed height
     *
     * **Transform-based positioning**:
     * - GPU-accelerated translate()
     * - Better performance than top/left
     * - Sub-pixel accuracy
     *
     * **Dynamic component rendering**:
     * - Look up definition from registry
     * - Use definition.icon and definition.name for header
     * - Call definition.render() for content
     */
    render(): any;
    /**
     * Capture item snapshot for undo/redo
     */
    private captureItemSnapshot;
    /**
     * Handle item update (called by drag/resize handlers)
     */
    private handleItemUpdate;
    /**
     * Handle click event (selection and config panel)
     */
    private handleClick;
    /**
     * Handle delete from default wrapper button
     * Calls deletion hook if provided, then dispatches delete event if approved
     */
    private handleDelete;
}
