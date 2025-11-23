/**
 * UI Override Types
 * ==================
 *
 * Type definitions for pluggable UI components that consumers can override
 * to customize the grid builder's appearance and behavior.
 */
import { GridItem } from '../services/state-manager';
import { ComponentDefinition } from './component-definition';
/**
 * Config Panel Props
 * ===================
 *
 * Props passed to custom config panel components.
 * Used when consumer overrides the default config panel UI.
 *
 * **When to override**:
 * - Custom visual design (match your app's theme)
 * - Different layout/structure
 * - Additional validation UI
 * - Multi-step wizard
 * - Conditional field visibility
 *
 * **Example: Custom Config Panel**
 * ```typescript
 * const CustomConfigPanel = ({ item, config, onChange, onSave, onCancel }: ConfigPanelProps) => {
 *   return (
 *     <div class="my-custom-config-panel">
 *       <h3>Configure {item.name}</h3>
 *       {config && Object.keys(config).map(key => (
 *         <div class="field" key={key}>
 *           <label>{key}</label>
 *           <input
 *             value={config[key]}
 *             onChange={(e) => onChange(key, e.target.value)}
 *           />
 *         </div>
 *       ))}
 *       <div class="actions">
 *         <button onClick={onCancel}>Cancel</button>
 *         <button class="primary" onClick={onSave}>Save</button>
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 */
export interface ConfigPanelProps {
    /**
     * The grid item being configured
     *
     * **Contains**:
     * - item.id - Unique item ID
     * - item.type - Component type (e.g., 'header', 'text')
     * - item.name - Display name
     * - item.layouts - Desktop/mobile layouts
     *
     * **Use cases**:
     * - Display item name in panel header
     * - Show item type icon
     * - Display current position/size
     * - Conditional UI based on item type
     */
    item: GridItem;
    /**
     * Component definition for this item type
     *
     * **Contains**:
     * - definition.configSchema - Field definitions (if auto-generated)
     * - definition.renderConfigPanel - Custom panel renderer (if custom)
     * - definition.name - Display name
     * - definition.icon - Icon/emoji
     *
     * **Use cases**:
     * - Render fields from configSchema
     * - Show component type info
     * - Delegate to definition's renderConfigPanel
     * - Type-specific config UI
     */
    definition: ComponentDefinition;
    /**
     * Current configuration values (temporary state during editing)
     *
     * **Important**: This is NOT the saved config, but temporary edit state
     * **Structure**: Record<string, any> matching configSchema field names
     *
     * **Use cases**:
     * - Populate form inputs
     * - Live preview of changes
     * - Validation checks
     *
     * @example
     * ```typescript
     * // For header component:
     * config = {
     *   text: 'Welcome!',
     *   level: 'H1',
     *   color: '#000000',
     *   alignment: 'center'
     * }
     * ```
     */
    config: Record<string, any>;
    /**
     * Update single config field (live preview)
     *
     * **When to call**: On every input change for live preview
     * **What it does**: Updates temporary config state, triggers component re-render
     * **Does NOT save**: Changes only committed when onSave() called
     *
     * **Pattern**: Call on onChange/onInput handlers
     *
     * @param fieldName - Config field name (must match configSchema)
     * @param value - New value for field
     *
     * @example
     * ```typescript
     * // Text input with live preview
     * <input
     *   value={config.text}
     *   onChange={(e) => onChange('text', e.target.value)}
     * />
     *
     * // Color picker with live preview
     * <input
     *   type="color"
     *   value={config.color}
     *   onChange={(e) => onChange('color', e.target.value)}
     * />
     *
     * // Select with live preview
     * <select
     *   value={config.level}
     *   onChange={(e) => onChange('level', e.target.value)}
     * >
     *   <option value="H1">H1</option>
     *   <option value="H2">H2</option>
     * </select>
     * ```
     */
    onChange: (fieldName: string, value: any) => void;
    /**
     * Save all config changes
     *
     * **When to call**: When user clicks "Save" or "Apply" button
     * **What it does**:
     * - Commits temporary config to item
     * - Triggers 'configChanged' event
     * - Closes config panel
     * - Adds undo command
     *
     * **Pattern**: Attach to primary action button
     *
     * @example
     * ```typescript
     * <div class="actions">
     *   <button onClick={onCancel}>Cancel</button>
     *   <button class="primary" onClick={onSave}>
     *     Apply Changes
     *   </button>
     * </div>
     * ```
     */
    onSave: () => void;
    /**
     * Cancel config changes
     *
     * **When to call**: When user clicks "Cancel" or closes panel
     * **What it does**:
     * - Discards temporary config changes
     * - Reverts component to previous config
     * - Closes config panel
     * - No undo command added
     *
     * **Pattern**: Attach to cancel button or close icon
     *
     * @example
     * ```typescript
     * <div class="panel-header">
     *   <h3>Configure Component</h3>
     *   <button class="close" onClick={onCancel}>✕</button>
     * </div>
     * ```
     */
    onCancel: () => void;
}
/**
 * Component Palette Props
 * ========================
 *
 * Props passed to custom component palette components.
 * Used when consumer overrides the default palette UI.
 *
 * **When to override**:
 * - Custom visual design (match your app's theme)
 * - Different layout (grid vs list, collapsible categories)
 * - Search/filter functionality
 * - Drag preview customization
 * - Tooltips/help text
 *
 * **Example: Custom Palette**
 * ```typescript
 * const CustomPalette = ({ components, onDragStart }: ComponentPaletteProps) => (
 *   <div class="my-custom-palette">
 *     <h3>Components</h3>
 *     <div class="components-grid">
 *       {components.map(comp => (
 *         <div
 *           class="palette-item"
 *           draggable
 *           onDragStart={(e) => onDragStart(comp, e)}
 *         >
 *           <span class="icon">{comp.icon}</span>
 *           <span class="name">{comp.name}</span>
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export interface ComponentPaletteProps {
    /**
     * Array of available component definitions
     *
     * **Contents**: All registered ComponentDefinition objects
     * **Sorted**: By registration order (or consumer can sort)
     *
     * **Use cases**:
     * - Render palette items
     * - Group by category
     * - Filter/search
     * - Display component info
     *
     * @example
     * ```typescript
     * // Group by category
     * const grouped = components.reduce((acc, comp) => {
     *   const category = comp.type.split('-')[0]; // 'component-header' -> 'component'
     *   if (!acc[category]) acc[category] = [];
     *   acc[category].push(comp);
     *   return acc;
     * }, {});
     * ```
     */
    components: ComponentDefinition[];
    /**
     * Callback to initiate drag operation
     *
     * **When to call**: On dragstart event of palette item
     * **What it does**:
     * - Sets up drag data transfer
     * - Initializes drag state
     * - Shows drag ghost/preview
     *
     * **Pattern**: Attach to draggable palette items
     *
     * @param component - Component definition being dragged
     * @param event - Native drag event
     *
     * @example
     * ```typescript
     * <div
     *   draggable
     *   onDragStart={(e) => onDragStart(component, e)}
     * >
     *   {component.icon} {component.name}
     * </div>
     * ```
     */
    onDragStart: (component: ComponentDefinition, event: DragEvent) => void;
}
/**
 * Toolbar Props
 * ==============
 *
 * Props passed to custom toolbar components.
 * Used when consumer overrides the default toolbar UI.
 *
 * **When to override**:
 * - Custom visual design (match your app's theme)
 * - Different button layout
 * - Additional actions
 * - Custom keyboard shortcuts display
 * - Integration with app navigation
 *
 * **Example: Custom Toolbar**
 * ```typescript
 * const CustomToolbar = ({
 *   canUndo,
 *   canRedo,
 *   viewport,
 *   showGrid,
 *   onUndo,
 *   onRedo,
 *   onToggleViewport,
 *   onToggleGrid,
 *   onExport,
 *   onImport
 * }: ToolbarProps) => (
 *   <div class="my-custom-toolbar">
 *     <div class="toolbar-section">
 *       <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
 *         ↶
 *       </button>
 *       <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
 *         ↷
 *       </button>
 *     </div>
 *
 *     <div class="toolbar-section">
 *       <button
 *         onClick={onToggleViewport}
 *         class={viewport === 'mobile' ? 'active' : ''}
 *       >
 *         {viewport === 'desktop' ? '🖥️' : '📱'}
 *       </button>
 *       <button
 *         onClick={onToggleGrid}
 *         class={showGrid ? 'active' : ''}
 *       >
 *         Grid {showGrid ? 'On' : 'Off'}
 *       </button>
 *     </div>
 *
 *     <div class="toolbar-section">
 *       <button onClick={onExport}>Export</button>
 *       <button onClick={onImport}>Import</button>
 *     </div>
 *   </div>
 * );
 * ```
 */
export interface ToolbarProps {
    /**
     * Whether undo is available
     *
     * **true**: Undo stack has commands
     * **false**: No commands to undo
     *
     * **Use**: Disable undo button when false
     */
    canUndo: boolean;
    /**
     * Whether redo is available
     *
     * **true**: Redo stack has commands
     * **false**: No commands to redo
     *
     * **Use**: Disable redo button when false
     */
    canRedo: boolean;
    /**
     * Current viewport mode
     *
     * **'desktop'**: Showing desktop layout
     * **'mobile'**: Showing mobile layout
     *
     * **Use**: Toggle button active state
     */
    viewport: 'desktop' | 'mobile';
    /**
     * Whether grid lines are visible
     *
     * **true**: Grid lines showing
     * **false**: Grid lines hidden
     *
     * **Use**: Toggle button active state
     */
    showGrid: boolean;
    /**
     * Perform undo operation
     *
     * **What it does**:
     * - Reverts last command
     * - Updates state
     * - Triggers 'undo' event
     *
     * **Pattern**: Attach to undo button
     */
    onUndo: () => void;
    /**
     * Perform redo operation
     *
     * **What it does**:
     * - Re-applies last undone command
     * - Updates state
     * - Triggers 'redo' event
     *
     * **Pattern**: Attach to redo button
     */
    onRedo: () => void;
    /**
     * Toggle viewport mode (desktop ↔ mobile)
     *
     * **What it does**:
     * - Switches viewport mode
     * - Re-renders with new layout
     * - Triggers 'viewportChanged' event
     *
     * **Pattern**: Attach to viewport toggle button
     */
    onToggleViewport: () => void;
    /**
     * Toggle grid line visibility
     *
     * **What it does**:
     * - Shows/hides grid lines
     * - Updates state
     *
     * **Pattern**: Attach to grid toggle button
     */
    onToggleGrid: () => void;
    /**
     * Export current state to JSON
     *
     * **What it does**:
     * - Serializes current state
     * - Downloads JSON file
     * - Or returns JSON for consumer handling
     *
     * **Pattern**: Attach to export button
     */
    onExport: () => void;
    /**
     * Import state from JSON
     *
     * **What it does**:
     * - Opens file picker
     * - Loads and validates JSON
     * - Replaces current state
     *
     * **Pattern**: Attach to import button
     */
    onImport: () => void;
}
/**
 * UI Component Overrides
 * =======================
 *
 * Collection of custom UI components that can override default grid builder UI.
 * Pass to `<grid-builder uiOverrides={...} />` to customize appearance.
 *
 * **All overrides are optional**: Only override what you need.
 * Default components used for any undefined overrides.
 *
 * **Example: Override Config Panel and Toolbar**
 * ```typescript
 * const uiOverrides: UIComponentOverrides = {
 *   ConfigPanel: CustomConfigPanel,
 *   Toolbar: CustomToolbar
 *   // ComponentPalette uses default (not overridden)
 * };
 *
 * <grid-builder
 *   components={componentDefinitions}
 *   uiOverrides={uiOverrides}
 * />
 * ```
 *
 * **Example: Override All UI Components**
 * ```typescript
 * const uiOverrides: UIComponentOverrides = {
 *   ConfigPanel: MyConfigPanel,
 *   ComponentPalette: MyPalette,
 *   Toolbar: MyToolbar
 * };
 * ```
 */
export interface UIComponentOverrides {
    /**
     * Custom config panel component
     *
     * **When to override**:
     * - Custom visual design
     * - Multi-step wizard
     * - Advanced validation
     * - Different layout
     *
     * **Receives**: ConfigPanelProps
     * **Must call**: onChange, onSave, onCancel appropriately
     *
     * **Auto-close on deletion**: Custom config panels should listen
     * to the `componentDeleted` event via the EventManager and close
     * themselves when the associated component is deleted:
     * ```typescript
     * // In your custom config panel component
     * componentDidLoad() {
     *   eventManager.on('componentDeleted', this.handleComponentDeleted);
     * }
     *
     * private handleComponentDeleted = (event: { itemId: string }) => {
     *   if (this.selectedItemId === event.itemId) {
     *     this.closePanel();
     *   }
     * };
     *
     * disconnectedCallback() {
     *   eventManager.off('componentDeleted', this.handleComponentDeleted);
     * }
     * ```
     *
     * **Default**: Auto-generated form from configSchema or component's renderConfigPanel
     */
    ConfigPanel?: (props: ConfigPanelProps) => any;
    /**
     * Custom component palette component
     *
     * **When to override**:
     * - Custom visual design
     * - Grid vs list layout
     * - Search/filter functionality
     * - Category grouping
     *
     * **Receives**: ComponentPaletteProps
     * **Must call**: onDragStart when dragging palette items
     *
     * **Default**: Vertical list with icon + name
     */
    ComponentPalette?: (props: ComponentPaletteProps) => any;
    /**
     * Custom toolbar component
     *
     * **When to override**:
     * - Custom visual design
     * - Different button layout
     * - Additional actions
     * - App navigation integration
     *
     * **Receives**: ToolbarProps
     * **Must call**: onUndo, onRedo, etc. when user interacts
     *
     * **Default**: Horizontal toolbar with undo/redo, viewport toggle, grid toggle
     */
    Toolbar?: (props: ToolbarProps) => any;
}
