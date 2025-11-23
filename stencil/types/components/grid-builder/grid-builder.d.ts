/**
 * Grid Builder - Main Library Component
 * =======================================
 *
 * Main entry point for the grid builder library. Accepts component definitions,
 * configuration, and customization options via props to create a fully functional
 * drag-and-drop page builder.
 *
 * ## Library Design Philosophy
 *
 * **Consumer-driven configuration**:
 * - Library provides infrastructure (drag/drop, undo/redo, state management)
 * - Consumer provides content (component types, initial layout, styling)
 * - Clean separation of concerns
 * - Maximum flexibility
 *
 * **Props-based API**:
 * ```typescript
 * <grid-builder
 *   components={componentDefinitions}     // Required: Component type registry
 *   config={gridConfig}                   // Optional: Grid system config
 *   theme={gridTheme}                     // Optional: Visual customization
 *   plugins={pluginInstances}             // Optional: Plugin extensions
 *   uiOverrides={customUIComponents}      // Optional: Custom UI rendering
 *   initialState={savedState}             // Optional: Restore saved layout
 * />
 * ```
 *
 * ## Component Lifecycle
 *
 * **Initialization flow**:
 * 1. componentWillLoad: Validate props, set defaults, restore initial state
 * 2. componentDidLoad: Initialize plugins, setup global dependencies, attach event listeners
 * 3. render: Render UI structure (palette, canvases, config panel)
 * 4. disconnectedCallback: Cleanup plugins, remove listeners, dispose resources
 *
 * **State management**:
 * - Uses global gridState from state-manager.ts
 * - Components subscribe via StencilJS reactivity
 * - Plugins access via GridBuilderAPI
 * - Clean separation of library vs consumer state
 *
 * @module grid-builder
 */
import { ComponentDefinition } from '../../types/component-definition';
import { GridConfig } from '../../types/grid-config';
import { GridBuilderTheme } from '../../types/theme';
import { GridBuilderPlugin } from '../../types/plugin';
import { UIComponentOverrides } from '../../types/ui-overrides';
import { DeletionHook } from '../../types/deletion-hook';
import { GridExport } from '../../types/grid-export';
import { GridState } from '../../services/state-manager';
/**
 * GridBuilder Component
 * ======================
 *
 * Main library component providing complete grid builder functionality.
 *
 * **Tag**: `<grid-builder>`
 * **Shadow DOM**: Disabled (required for interact.js compatibility)
 * **Reactivity**: Listens to gridState changes via StencilJS store
 */
export declare class GridBuilder {
    /**
     * Component definitions registry
     *
     * **Required prop**: Array of ComponentDefinition objects
     * **Purpose**: Defines available component types (header, text, button, etc.)
     *
     * **Each definition includes**:
     * - type: Unique identifier (e.g., 'header', 'text-block')
     * - name: Display name in palette
     * - icon: Visual identifier (emoji recommended)
     * - defaultSize: Initial size when dropped
     * - render: Function returning component to render
     * - configSchema: Optional auto-generated config form
     * - renderConfigPanel: Optional custom config UI
     * - Lifecycle hooks: onVisible, onHidden for virtual rendering
     *
     * **Example**:
     * ```typescript
     * const components = [
     *   {
     *     type: 'header',
     *     name: 'Header',
     *     icon: '📄',
     *     defaultSize: { width: 20, height: 8 },
     *     render: ({ itemId, config }) => (
     *       <my-header itemId={itemId} config={config} />
     *     ),
     *     configSchema: [
     *       { name: 'text', label: 'Text', type: 'text', defaultValue: 'Header' }
     *     ]
     *   }
     * ];
     * ```
     */
    components: ComponentDefinition[];
    /**
     * Grid configuration options
     *
     * **Optional prop**: Customizes grid system behavior
     * **Default**: Standard 2% grid with 10px-50px constraints
     *
     * **Configuration options**:
     * - gridSizePercent: Grid unit as % of width (default: 2)
     * - minGridSize: Minimum size in pixels (default: 10)
     * - maxGridSize: Maximum size in pixels (default: 50)
     * - snapToGrid: Enable snap-to-grid (default: true)
     * - showGridLines: Show visual grid (default: true)
     * - minItemSize: Minimum item dimensions (default: { width: 5, height: 4 })
     * - virtualRenderMargin: Pre-render margin (default: '20%')
     *
     * **Example**:
     * ```typescript
     * const config = {
     *   gridSizePercent: 3,           // 3% grid (33 units per 100%)
     *   minGridSize: 15,              // 15px minimum
     *   maxGridSize: 60,              // 60px maximum
     *   snapToGrid: true,
     *   virtualRenderMargin: '30%'    // Aggressive pre-loading
     * };
     * ```
     */
    config?: GridConfig;
    /**
     * Visual theme customization
     *
     * **Optional prop**: Customizes colors, fonts, and styling
     * **Default**: Bootstrap-inspired blue theme
     *
     * **Theme options**:
     * - primaryColor: Accent color (default: '#007bff')
     * - paletteBackground: Palette sidebar color (default: '#f5f5f5')
     * - canvasBackground: Canvas background (default: '#ffffff')
     * - gridLineColor: Grid line color (default: 'rgba(0,0,0,0.1)')
     * - selectionColor: Selection outline (default: '#007bff')
     * - resizeHandleColor: Resize handle color (default: '#007bff')
     * - fontFamily: UI font (default: system font stack)
     * - customProperties: CSS variables for advanced theming
     *
     * **Example**:
     * ```typescript
     * const theme = {
     *   primaryColor: '#ff6b6b',        // Brand red
     *   paletteBackground: '#fff5f5',   // Light red
     *   customProperties: {
     *     '--text-color': '#ffffff',
     *     '--border-radius': '8px'
     *   }
     * };
     * ```
     */
    theme?: GridBuilderTheme;
    /**
     * Plugin instances for extending functionality
     *
     * **Optional prop**: Array of GridBuilderPlugin instances
     * **Purpose**: Add custom features, analytics, integrations
     *
     * **Plugin lifecycle**:
     * 1. Library calls plugin.init(api) on componentDidLoad
     * 2. Plugin subscribes to events, adds UI, etc.
     * 3. Library calls plugin.destroy() on disconnectedCallback
     *
     * **Example**:
     * ```typescript
     * class AnalyticsPlugin implements GridBuilderPlugin {
     *   name = 'analytics';
     *
     *   init(api: GridBuilderAPI) {
     *     api.on('componentAdded', (e) => {
     *       analytics.track('Component Added', { type: e.item.type });
     *     });
     *   }
     *
     *   destroy() {
     *     // Cleanup
     *   }
     * }
     *
     * const plugins = [new AnalyticsPlugin()];
     * ```
     */
    plugins?: GridBuilderPlugin[];
    /**
     * Custom UI component overrides
     *
     * **Optional prop**: Replace default UI components
     * **Purpose**: Fully customize visual appearance
     *
     * **Overridable components**:
     * - ConfigPanel: Configuration panel UI
     * - ComponentPalette: Component palette sidebar
     * - Toolbar: Top toolbar with controls
     *
     * **Example**:
     * ```typescript
     * const uiOverrides = {
     *   Toolbar: (props) => (
     *     <div class="my-toolbar">
     *       <button onClick={props.onUndo}>Undo</button>
     *       <button onClick={props.onRedo}>Redo</button>
     *     </div>
     *   )
     * };
     * ```
     */
    uiOverrides?: UIComponentOverrides;
    /**
     * Initial state to restore
     *
     * **Optional prop**: Restore saved layout
     * **Purpose**: Load previously saved grid state
     *
     * **State structure**: Same as gridState (canvases, viewport, etc.)
     *
     * **Example**:
     * ```typescript
     * const savedState = JSON.parse(localStorage.getItem('grid-state'));
     * <grid-builder initialState={savedState} ... />
     * ```
     */
    initialState?: Partial<GridState>;
    /**
     * Canvas metadata storage (host app responsibility)
     *
     * **Optional prop**: Store canvas-level presentation metadata
     * **Purpose**: Host app owns canvas metadata (titles, colors, settings)
     *
     * **Separation of concerns**:
     * - Library owns placement state (items, layouts, zIndex)
     * - Host app owns presentation state (colors, titles, custom metadata)
     *
     * **Structure**: Record<canvasId, any>
     *
     * **Example**:
     * ```typescript
     * const canvasMetadata = {
     *   'hero-section': {
     *     title: 'Hero Section',
     *     backgroundColor: '#f0f4f8',
     *     customSettings: { ... }
     *   },
     *   'articles-grid': {
     *     title: 'Articles Grid',
     *     backgroundColor: '#ffffff'
     *   }
     * };
     * <grid-builder canvasMetadata={canvasMetadata} ... />
     * ```
     *
     * **Use with canvas-click events**:
     * - Library fires canvas-click event when canvas background clicked
     * - Host app shows canvas settings panel
     * - Host app updates canvasMetadata state
     * - Library passes metadata to canvas-section via props
     */
    canvasMetadata?: Record<string, any>;
    /**
     * Hook called before deleting a component
     *
     * **Optional prop**: Intercept deletion requests for custom workflows
     * **Purpose**: Allow host app to show confirmation, make API calls, etc.
     *
     * **Hook behavior**:
     * - Return `true` to proceed with deletion
     * - Return `false` to cancel the deletion
     * - Return a Promise for async operations (modals, API calls)
     *
     * **Example - Confirmation modal**:
     * ```typescript
     * const onBeforeDelete = async (context) => {
     *   const confirmed = await showConfirmModal(
     *     `Delete ${context.item.name}?`,
     *     'This action cannot be undone.'
     *   );
     *   return confirmed;
     * };
     * <grid-builder onBeforeDelete={onBeforeDelete} ... />
     * ```
     *
     * **Example - API call + confirmation**:
     * ```typescript
     * const onBeforeDelete = async (context) => {
     *   // Show loading modal
     *   const modal = showLoadingModal('Deleting...');
     *
     *   try {
     *     // Make API call
     *     await fetch(`/api/components/${context.itemId}`, {
     *       method: 'DELETE'
     *     });
     *     modal.close();
     *     return true; // Proceed with deletion
     *   } catch (error) {
     *     modal.close();
     *     showErrorModal('Failed to delete component');
     *     return false; // Cancel deletion
     *   }
     * };
     * ```
     *
     * **Default behavior**: If not provided, components delete immediately
     */
    onBeforeDelete?: DeletionHook;
    /**
     * Custom API exposure configuration
     *
     * **Optional prop**: Control where and how the Grid Builder API is exposed
     * **Default**: `{ target: window, key: 'gridBuilderAPI' }`
     * **Purpose**: Allows multiple grid-builder instances and flexible API access patterns
     *
     * **Options**:
     * 1. **Custom key on window** (multiple instances):
     * ```typescript
     * <grid-builder api-ref={{ key: 'gridAPI1' }}></grid-builder>
     * <grid-builder api-ref={{ key: 'gridAPI2' }}></grid-builder>
     * // Access: window.gridAPI1, window.gridAPI2
     * ```
     *
     * 2. **Custom storage object**:
     * ```typescript
     * const myStore = {};
     * <grid-builder api-ref={{ target: myStore, key: 'api' }}></grid-builder>
     * // Access: myStore.api
     * ```
     *
     * 3. **Disable automatic exposure** (use ref instead):
     * ```typescript
     * <grid-builder api-ref={null}></grid-builder>
     * // Access via ref: <grid-builder ref={el => this.api = el?.api}></grid-builder>
     * ```
     */
    apiRef?: {
        target?: any;
        key?: string;
    } | null;
    /**
     * Component registry (internal state)
     *
     * **Purpose**: Map component type → definition for lookup
     * **Built from**: components prop
     * **Used by**: grid-item-wrapper for dynamic rendering
     *
     * **Structure**: `{ 'header': ComponentDefinition, 'text': ComponentDefinition, ... }`
     */
    private componentRegistry;
    /**
     * Initialized plugins (internal state)
     *
     * **Purpose**: Track plugin instances for cleanup
     * **Lifecycle**: Set in componentDidLoad, cleared in disconnectedCallback
     */
    private initializedPlugins;
    /**
     * GridBuilderAPI instance (internal state)
     *
     * **Purpose**: Provides API to plugins and external code
     * **Lifecycle**: Created in componentDidLoad
     */
    private api?;
    /**
     * Host element reference
     *
     * **Purpose**: Access to host element for event listeners
     */
    private hostElement;
    /**
     * Event listener references for cleanup
     */
    private canvasDropHandler?;
    private canvasMoveHandler?;
    private canvasActivatedHandler?;
    private keyboardHandler?;
    /**
     * ResizeObserver for container-based viewport switching
     *
     * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
     * **Breakpoint**: 768px (container width, not window width)
     * **Cleanup**: disconnectedCallback() disconnects observer
     */
    private viewportResizeObserver?;
    /**
     * Component will load lifecycle
     *
     * **Purpose**: Validate props and initialize component registry
     *
     * **Validation**:
     * - Components prop is required
     * - Each component must have unique type
     * - Basic structure validation
     *
     * **Registry building**:
     * - Convert array to Map for O(1) lookups
     * - Key = component type, Value = ComponentDefinition
     *
     * **Initial state restoration**:
     * - If initialState provided, merge into gridState
     * - Otherwise use empty canvases
     */
    /**
     * Handle item deletion from grid-item-wrapper
     * Internal event dispatched by grid-item-wrapper after user clicks delete
     */
    handleGridItemDelete(event: CustomEvent): void;
    componentWillLoad(): void;
    /**
     * Component did load lifecycle
     *
     * **Purpose**: Initialize global dependencies and plugins
     *
     * **Initialization sequence**:
     * 1. Expose virtualRenderer singleton globally
     * 2. Create GridBuilderAPI instance
     * 3. Initialize plugins via plugin.init(api)
     * 4. Apply theme via CSS variables
     * 5. Expose debug helpers
     */
    componentDidLoad(): void;
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up resources when component unmounts
     *
     * **Cleanup sequence**:
     * 1. Remove event listeners
     * 2. Destroy all plugins
     * 3. Clear global references
     */
    disconnectedCallback(): void;
    /**
     * Watch components prop for changes
     *
     * **Purpose**: Rebuild component registry when components prop changes
     */
    handleComponentsChange(newComponents: ComponentDefinition[]): void;
    /**
     * Create GridBuilderAPI instance
     *
     * **Purpose**: Provide API to plugins and external code
     * **Returns**: GridBuilderAPI implementation
     *
     * **Implementation**: Full API with event system integration
     */
    private createAPI;
    /**
     * Apply theme via CSS variables
     *
     * **Purpose**: Apply theme customization to host element
     * **Implementation**: Set CSS custom properties on :host
     */
    private applyTheme;
    /**
     * Setup ResizeObserver for container-based viewport switching
     *
     * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
     * **Breakpoint**: 768px (container width, not window viewport)
     *
     * **Observer callback**:
     * 1. Get container width from ResizeObserver entry
     * 2. Determine target viewport (mobile if < 768px, desktop otherwise)
     * 3. Update gridState.currentViewport if changed
     *
     * **Why container-based**:
     * - More flexible than window.resize (e.g., sidebar layouts, embedded widgets)
     * - Grid-builder can be embedded at any size
     * - Multiple instances can have different viewports on same page
     *
     * **Debouncing**: Not needed - ResizeObserver is already efficient
     */
    private setupViewportResizeObserver;
    /**
     * Export current state to JSON-serializable format
     *
     * **Purpose**: Export grid layout for saving or transferring to viewer app
     *
     * **Use Cases**:
     * - Save layout to database/localStorage
     * - Transfer layout to viewer app via API
     * - Create layout templates/presets
     * - Backup/restore functionality
     *
     * **Example - Save to API**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const exportData = await builder.exportState();
     * await fetch('/api/layouts', {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify(exportData)
     * });
     * ```
     *
     * **Example - Save to localStorage**:
     * ```typescript
     * const exportData = await builder.exportState();
     * localStorage.setItem('grid-layout', JSON.stringify(exportData));
     * ```
     *
     * @returns Promise<GridExport> - JSON-serializable export object
     */
    exportState(): Promise<GridExport>;
    /**
     * Import state from JSON-serializable format
     *
     * **Purpose**: Restore previously exported grid state
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const savedState = JSON.parse(localStorage.getItem('grid-layout'));
     * await builder.importState(savedState);
     * ```
     *
     * @param state - GridExport or partial GridState object
     */
    importState(state: Partial<GridState> | GridExport): Promise<void>;
    /**
     * Get current grid state
     *
     * **Purpose**: Direct access to grid state for reading
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const state = await builder.getState();
     * console.log('Current viewport:', state.currentViewport);
     * ```
     *
     * @returns Promise<GridState> - Current grid state
     */
    getState(): Promise<GridState>;
    /**
     * Add a new canvas programmatically
     *
     * **Purpose**: Create new section/canvas in the grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.addCanvas('new-section');
     * ```
     *
     * @param canvasId - Unique canvas identifier
     */
    addCanvas(canvasId: string): Promise<void>;
    /**
     * Remove a canvas programmatically
     *
     * **Purpose**: Delete section/canvas from the grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.removeCanvas('old-section');
     * ```
     *
     * @param canvasId - Canvas identifier to remove
     */
    removeCanvas(canvasId: string): Promise<void>;
    /**
     * Set active canvas programmatically
     *
     * **Purpose**: Activate a specific canvas for focused editing
     *
     * **Use cases**:
     * - Focus specific section after adding items
     * - Programmatic navigation between sections
     * - Show canvas-specific settings panel
     *
     * **Events triggered**: 'canvasActivated'
     *
     * @param canvasId - Canvas to activate
     *
     * @example
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.setActiveCanvas('canvas2');
     * ```
     */
    setActiveCanvas(canvasId: string): Promise<void>;
    /**
     * Get currently active canvas ID
     *
     * **Purpose**: Check which canvas is currently active/focused
     *
     * @returns Promise<string | null> - Active canvas ID or null if none active
     *
     * @example
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const activeId = await builder.getActiveCanvas();
     * if (activeId === 'canvas1') {
     *   console.log('Canvas 1 is active');
     * }
     * ```
     */
    getActiveCanvas(): Promise<string | null>;
    /**
     * Undo last action
     *
     * **Purpose**: Revert last user action (move, resize, add, delete, etc.)
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.undo();
     * ```
     */
    undo(): Promise<void>;
    /**
     * Redo last undone action
     *
     * **Purpose**: Re-apply last undone action
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.redo();
     * ```
     */
    redo(): Promise<void>;
    /**
     * Check if undo is available
     *
     * **Purpose**: Determine if there are actions to undo
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const canUndo = await builder.canUndo();
     * undoButton.disabled = !canUndo;
     * ```
     *
     * @returns Promise<boolean> - True if undo is available
     */
    canUndo(): Promise<boolean>;
    /**
     * Check if redo is available
     *
     * **Purpose**: Determine if there are actions to redo
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const canRedo = await builder.canRedo();
     * redoButton.disabled = !canRedo;
     * ```
     *
     * @returns Promise<boolean> - True if redo is available
     */
    canRedo(): Promise<boolean>;
    /**
     * Add a component programmatically
     *
     * **Purpose**: Add new component to canvas without dragging from palette
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const itemId = await builder.addComponent('canvas1', 'header', {
     *   x: 10, y: 10, width: 30, height: 6
     * }, { title: 'My Header' });
     * ```
     *
     * @param canvasId - Canvas to add component to
     * @param componentType - Component type from registry
     * @param position - Grid position and size
     * @param config - Optional component configuration
     * @returns Promise<string | null> - New item ID or null if failed
     */
    addComponent(canvasId: string, componentType: string, position: {
        x: number;
        y: number;
        width: number;
        height: number;
    }, config?: Record<string, any>): Promise<string | null>;
    /**
     * Delete a component programmatically
     *
     * **Purpose**: Remove component from grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const success = await builder.deleteComponent('item-123');
     * ```
     *
     * @param itemId - Item ID to delete
     * @returns Promise<boolean> - True if deleted successfully
     */
    deleteComponent(itemId: string): Promise<boolean>;
    /**
     * Update component configuration
     *
     * **Purpose**: Update component properties/config
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const success = await builder.updateConfig('item-123', {
     *   title: 'Updated Title',
     *   color: '#ff0000'
     * });
     * ```
     *
     * @param itemId - Item ID to update
     * @param config - Configuration updates
     * @returns Promise<boolean> - True if updated successfully
     */
    updateConfig(itemId: string, config: Record<string, any>): Promise<boolean>;
    /**
     * Reference to host element
     */
    private el?;
    /**
     * Render component template
     *
     * **Purpose**: Render main UI structure
     *
     * **Structure**:
     * - Host element with theme classes
     * - Component palette (sidebar or custom)
     * - Canvas area with sections
     *
     * **Note**: Actual rendering delegates to child components:
     * - <component-palette> or custom ComponentPalette
     * - <canvas-section> for each canvas
     *
     * **Config Panel**: Users should implement their own config panels
     * - See custom-config-panel in demo for reference implementation
     * - Listen to 'item-click' events to show your config UI
     */
    render(): any;
}
