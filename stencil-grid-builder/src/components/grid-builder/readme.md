# grid-builder



<!-- Auto Generated Below -->


## Overview

GridBuilder Component
======================

Main library component providing complete grid builder functionality.

**Tag**: `<grid-builder>`
**Shadow DOM**: Disabled (required for interact.js compatibility)
**Reactivity**: Listens to gridState changes via StencilJS store

## Properties

| Property                  | Attribute | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Type                                                                                                                                                      | Default     |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `canvasMetadata`          | --        | Canvas metadata storage (host app responsibility)  **Optional prop**: Store canvas-level presentation metadata **Purpose**: Host app owns canvas metadata (titles, colors, settings)  **Separation of concerns**: - Library owns placement state (items, layouts, zIndex) - Host app owns presentation state (colors, titles, custom metadata)  **Structure**: Record<canvasId, any>  **Example**: ```typescript const canvasMetadata = {   'hero-section': {     title: 'Hero Section',     backgroundColor: '#f0f4f8',     customSettings: { ... }   },   'articles-grid': {     title: 'Articles Grid',     backgroundColor: '#ffffff'   } }; <grid-builder canvasMetadata={canvasMetadata} ... /> ```  **Use with canvas-click events**: - Library fires canvas-click event when canvas background clicked - Host app shows canvas settings panel - Host app updates canvasMetadata state - Library passes metadata to canvas-section via props                                                                                                                                                                                                                                                                                   | `{ [x: string]: any; }`                                                                                                                                   | `undefined` |
| `components` _(required)_ | --        | Component definitions registry  **Required prop**: Array of ComponentDefinition objects **Purpose**: Defines available component types (header, text, button, etc.)  **Each definition includes**: - type: Unique identifier (e.g., 'header', 'text-block') - name: Display name in palette - icon: Visual identifier (emoji recommended) - defaultSize: Initial size when dropped - render: Function returning component to render - configSchema: Optional auto-generated config form - renderConfigPanel: Optional custom config UI - Lifecycle hooks: onVisible, onHidden for virtual rendering  **Example**: ```typescript const components = [   {     type: 'header',     name: 'Header',     icon: '📄',     defaultSize: { width: 20, height: 8 },     render: ({ itemId, config }) => (       <my-header itemId={itemId} config={config} />     ),     configSchema: [       { name: 'text', label: 'Text', type: 'text', defaultValue: 'Header' }     ]   } ]; ```                                                                                                                                                                                                                                                         | `ComponentDefinition[]`                                                                                                                                   | `undefined` |
| `config`                  | --        | Grid configuration options  **Optional prop**: Customizes grid system behavior **Default**: Standard 2% grid with 10px-50px constraints  **Configuration options**: - gridSizePercent: Grid unit as % of width (default: 2) - minGridSize: Minimum size in pixels (default: 10) - maxGridSize: Maximum size in pixels (default: 50) - snapToGrid: Enable snap-to-grid (default: true) - showGridLines: Show visual grid (default: true) - minItemSize: Minimum item dimensions (default: { width: 5, height: 4 }) - virtualRenderMargin: Pre-render margin (default: '20%')  **Example**: ```typescript const config = {   gridSizePercent: 3,           // 3% grid (33 units per 100%)   minGridSize: 15,              // 15px minimum   maxGridSize: 60,              // 60px maximum   snapToGrid: true,   virtualRenderMargin: '30%'    // Aggressive pre-loading }; ```                                                                                                                                                                                                                                                                                                                                                          | `GridConfig`                                                                                                                                              | `undefined` |
| `initialState`            | --        | Initial state to restore  **Optional prop**: Restore saved layout **Purpose**: Load previously saved grid state  **State structure**: Same as gridState (canvases, viewport, etc.)  **Example**: ```typescript const savedState = JSON.parse(localStorage.getItem('grid-state')); <grid-builder initialState={savedState} ... /> ```                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `{ canvases?: Record<string, Canvas>; selectedItemId?: string; selectedCanvasId?: string; currentViewport?: "desktop" \| "mobile"; showGrid?: boolean; }` | `undefined` |
| `onBeforeDelete`          | --        | Hook called before deleting a component  **Optional prop**: Intercept deletion requests for custom workflows **Purpose**: Allow host app to show confirmation, make API calls, etc.  **Hook behavior**: - Return `true` to proceed with deletion - Return `false` to cancel the deletion - Return a Promise for async operations (modals, API calls)  **Example - Confirmation modal**: ```typescript const onBeforeDelete = async (context) => {   const confirmed = await showConfirmModal(     `Delete ${context.item.name}?`,     'This action cannot be undone.'   );   return confirmed; }; <grid-builder onBeforeDelete={onBeforeDelete} ... /> ```  **Example - API call + confirmation**: ```typescript const onBeforeDelete = async (context) => {   // Show loading modal   const modal = showLoadingModal('Deleting...');    try {     // Make API call     await fetch(`/api/components/${context.itemId}`, {       method: 'DELETE'     });     modal.close();     return true; // Proceed with deletion   } catch (error) {     modal.close();     showErrorModal('Failed to delete component');     return false; // Cancel deletion   } }; ```  **Default behavior**: If not provided, components delete immediately | `(context: DeletionHookContext) => DeletionHookResult`                                                                                                    | `undefined` |
| `plugins`                 | --        | Plugin instances for extending functionality  **Optional prop**: Array of GridBuilderPlugin instances **Purpose**: Add custom features, analytics, integrations  **Plugin lifecycle**: 1. Library calls plugin.init(api) on componentDidLoad 2. Plugin subscribes to events, adds UI, etc. 3. Library calls plugin.destroy() on disconnectedCallback  **Example**: ```typescript class AnalyticsPlugin implements GridBuilderPlugin {   name = 'analytics';    init(api: GridBuilderAPI) {     api.on('componentAdded', (e) => {       analytics.track('Component Added', { type: e.item.type });     });   }    destroy() {     // Cleanup   } }  const plugins = [new AnalyticsPlugin()]; ```                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `GridBuilderPlugin[]`                                                                                                                                     | `undefined` |
| `theme`                   | --        | Visual theme customization  **Optional prop**: Customizes colors, fonts, and styling **Default**: Bootstrap-inspired blue theme  **Theme options**: - primaryColor: Accent color (default: '#007bff') - paletteBackground: Palette sidebar color (default: '#f5f5f5') - canvasBackground: Canvas background (default: '#ffffff') - gridLineColor: Grid line color (default: 'rgba(0,0,0,0.1)') - selectionColor: Selection outline (default: '#007bff') - resizeHandleColor: Resize handle color (default: '#007bff') - fontFamily: UI font (default: system font stack) - customProperties: CSS variables for advanced theming  **Example**: ```typescript const theme = {   primaryColor: '#ff6b6b',        // Brand red   paletteBackground: '#fff5f5',   // Light red   customProperties: {     '--text-color': '#ffffff',     '--border-radius': '8px'   } }; ```                                                                                                                                                                                                                                                                                                                                                                | `GridBuilderTheme`                                                                                                                                        | `undefined` |
| `uiOverrides`             | --        | Custom UI component overrides  **Optional prop**: Replace default UI components **Purpose**: Fully customize visual appearance  **Overridable components**: - ConfigPanel: Configuration panel UI - ComponentPalette: Component palette sidebar - Toolbar: Top toolbar with controls  **Example**: ```typescript const uiOverrides = {   Toolbar: (props) => (     <div class="my-toolbar">       <button onClick={props.onUndo}>Undo</button>       <button onClick={props.onRedo}>Redo</button>     </div>   ) }; ```                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `UIComponentOverrides`                                                                                                                                    | `undefined` |


## Methods

### `exportState() => Promise<GridExport>`

Export current state to JSON-serializable format

**Purpose**: Export grid layout for saving or transferring to viewer app

**Use Cases**:
- Save layout to database/localStorage
- Transfer layout to viewer app via API
- Create layout templates/presets
- Backup/restore functionality

**Example - Save to API**:
```typescript
const builder = document.querySelector('grid-builder');
const exportData = await builder.exportState();
await fetch('/api/layouts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(exportData)
});
```

**Example - Save to localStorage**:
```typescript
const exportData = await builder.exportState();
localStorage.setItem('grid-layout', JSON.stringify(exportData));
```

#### Returns

Type: `Promise<GridExport>`

Promise<GridExport> - JSON-serializable export object


## Dependencies

### Used by

 - [blog-app](../../demo/components/blog-app)

### Depends on

- [component-palette](../component-palette)
- [canvas-section](../canvas-section)
- [config-panel](../config-panel)

### Graph
```mermaid
graph TD;
  grid-builder --> component-palette
  grid-builder --> canvas-section
  grid-builder --> config-panel
  canvas-section --> grid-item-wrapper
  blog-app --> grid-builder
  style grid-builder fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
