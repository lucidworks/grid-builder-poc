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

| Property                  | Attribute | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Type                                                                                                                                                                               | Default                                        |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `apiRef`                  | --        | Custom API exposure configuration  **Optional prop**: Control where and how the Grid Builder API is exposed **Default**: `{ target: window, key: 'gridBuilderAPI' }` **Purpose**: Allows multiple grid-builder instances and flexible API access patterns  **Options**: 1. **Custom key on window** (multiple instances): ```typescript <grid-builder api-ref={{ key: 'gridAPI1' }}></grid-builder> <grid-builder api-ref={{ key: 'gridAPI2' }}></grid-builder> // Access: window.gridAPI1, window.gridAPI2 ```  2. **Custom storage object**: ```typescript const myStore = {}; <grid-builder api-ref={{ target: myStore, key: 'api' }}></grid-builder> // Access: myStore.api ```  3. **Disable automatic exposure** (use ref instead): ```typescript <grid-builder api-ref={null}></grid-builder> // Access via ref: <grid-builder ref={el => this.api = el?.api}></grid-builder> ```                                                                                                                                                                                                                                                                                                                                              | `{ target?: any; key?: string; }`                                                                                                                                                  | `{ target: undefined, key: 'gridBuilderAPI' }` |
| `canvasMetadata`          | --        | Canvas metadata storage (host app responsibility)  **Optional prop**: Store canvas-level presentation metadata **Purpose**: Host app owns canvas metadata (titles, colors, settings)  **Separation of concerns**: - Library owns placement state (items, layouts, zIndex) - Host app owns presentation state (colors, titles, custom metadata)  **Structure**: Record<canvasId, any>  **Example**: ```typescript const canvasMetadata = {   'hero-section': {     title: 'Hero Section',     backgroundColor: '#f0f4f8',     customSettings: { ... }   },   'articles-grid': {     title: 'Articles Grid',     backgroundColor: '#ffffff'   } }; <grid-builder canvasMetadata={canvasMetadata} ... /> ```  **Use with canvas-click events**: - Library fires canvas-click event when canvas background clicked - Host app shows canvas settings panel - Host app updates canvasMetadata state - Library passes metadata to canvas-section via props                                                                                                                                                                                                                                                                                   | `{ [x: string]: any; }`                                                                                                                                                            | `undefined`                                    |
| `components` _(required)_ | --        | Component definitions registry  **Required prop**: Array of ComponentDefinition objects **Purpose**: Defines available component types (header, text, button, etc.)  **Each definition includes**: - type: Unique identifier (e.g., 'header', 'text-block') - name: Display name in palette - icon: Visual identifier (emoji recommended) - defaultSize: Initial size when dropped - render: Function returning component to render - configSchema: Optional auto-generated config form - renderConfigPanel: Optional custom config UI - Lifecycle hooks: onVisible, onHidden for virtual rendering  **Example**: ```typescript const components = [   {     type: 'header',     name: 'Header',     icon: '📄',     defaultSize: { width: 20, height: 8 },     render: ({ itemId, config }) => (       <my-header itemId={itemId} config={config} />     ),     configSchema: [       { name: 'text', label: 'Text', type: 'text', defaultValue: 'Header' }     ]   } ]; ```                                                                                                                                                                                                                                                         | `ComponentDefinition[]`                                                                                                                                                            | `undefined`                                    |
| `config`                  | --        | Grid configuration options  **Optional prop**: Customizes grid system behavior **Default**: Standard 2% grid with 10px-50px constraints  **Configuration options**: - gridSizePercent: Grid unit as % of width (default: 2) - minGridSize: Minimum size in pixels (default: 10) - maxGridSize: Maximum size in pixels (default: 50) - snapToGrid: Enable snap-to-grid (default: true) - showGridLines: Show visual grid (default: true) - minItemSize: Minimum item dimensions (default: { width: 5, height: 4 }) - virtualRenderMargin: Pre-render margin (default: '20%')  **Example**: ```typescript const config = {   gridSizePercent: 3,           // 3% grid (33 units per 100%)   minGridSize: 15,              // 15px minimum   maxGridSize: 60,              // 60px maximum   snapToGrid: true,   virtualRenderMargin: '30%'    // Aggressive pre-loading }; ```                                                                                                                                                                                                                                                                                                                                                          | `GridConfig`                                                                                                                                                                       | `undefined`                                    |
| `initialState`            | --        | Initial state to restore  **Optional prop**: Restore saved layout **Purpose**: Load previously saved grid state  **State structure**: Same as gridState (canvases, viewport, etc.)  **Example**: ```typescript const savedState = JSON.parse(localStorage.getItem('grid-state')); <grid-builder initialState={savedState} ... /> ```                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `{ canvases?: Record<string, Canvas>; selectedItemId?: string; selectedCanvasId?: string; activeCanvasId?: string; currentViewport?: "desktop" \| "mobile"; showGrid?: boolean; }` | `undefined`                                    |
| `onBeforeDelete`          | --        | Hook called before deleting a component  **Optional prop**: Intercept deletion requests for custom workflows **Purpose**: Allow host app to show confirmation, make API calls, etc.  **Hook behavior**: - Return `true` to proceed with deletion - Return `false` to cancel the deletion - Return a Promise for async operations (modals, API calls)  **Example - Confirmation modal**: ```typescript const onBeforeDelete = async (context) => {   const confirmed = await showConfirmModal(     `Delete ${context.item.name}?`,     'This action cannot be undone.'   );   return confirmed; }; <grid-builder onBeforeDelete={onBeforeDelete} ... /> ```  **Example - API call + confirmation**: ```typescript const onBeforeDelete = async (context) => {   // Show loading modal   const modal = showLoadingModal('Deleting...');    try {     // Make API call     await fetch(`/api/components/${context.itemId}`, {       method: 'DELETE'     });     modal.close();     return true; // Proceed with deletion   } catch (error) {     modal.close();     showErrorModal('Failed to delete component');     return false; // Cancel deletion   } }; ```  **Default behavior**: If not provided, components delete immediately | `(context: DeletionHookContext) => DeletionHookResult`                                                                                                                             | `undefined`                                    |
| `plugins`                 | --        | Plugin instances for extending functionality  **Optional prop**: Array of GridBuilderPlugin instances **Purpose**: Add custom features, analytics, integrations  **Plugin lifecycle**: 1. Library calls plugin.init(api) on componentDidLoad 2. Plugin subscribes to events, adds UI, etc. 3. Library calls plugin.destroy() on disconnectedCallback  **Example**: ```typescript class AnalyticsPlugin implements GridBuilderPlugin {   name = 'analytics';    init(api: GridBuilderAPI) {     api.on('componentAdded', (e) => {       analytics.track('Component Added', { type: e.item.type });     });   }    destroy() {     // Cleanup   } }  const plugins = [new AnalyticsPlugin()]; ```                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `GridBuilderPlugin[]`                                                                                                                                                              | `undefined`                                    |
| `theme`                   | --        | Visual theme customization  **Optional prop**: Customizes colors, fonts, and styling **Default**: Bootstrap-inspired blue theme  **Theme options**: - primaryColor: Accent color (default: '#007bff') - paletteBackground: Palette sidebar color (default: '#f5f5f5') - canvasBackground: Canvas background (default: '#ffffff') - gridLineColor: Grid line color (default: 'rgba(0,0,0,0.1)') - selectionColor: Selection outline (default: '#007bff') - resizeHandleColor: Resize handle color (default: '#007bff') - fontFamily: UI font (default: system font stack) - customProperties: CSS variables for advanced theming  **Example**: ```typescript const theme = {   primaryColor: '#ff6b6b',        // Brand red   paletteBackground: '#fff5f5',   // Light red   customProperties: {     '--text-color': '#ffffff',     '--border-radius': '8px'   } }; ```                                                                                                                                                                                                                                                                                                                                                                | `GridBuilderTheme`                                                                                                                                                                 | `undefined`                                    |
| `uiOverrides`             | --        | Custom UI component overrides  **Optional prop**: Replace default UI components **Purpose**: Fully customize visual appearance  **Overridable components**: - ConfigPanel: Configuration panel UI - ComponentPalette: Component palette sidebar - Toolbar: Top toolbar with controls  **Example**: ```typescript const uiOverrides = {   Toolbar: (props) => (     <div class="my-toolbar">       <button onClick={props.onUndo}>Undo</button>       <button onClick={props.onRedo}>Redo</button>     </div>   ) }; ```                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `UIComponentOverrides`                                                                                                                                                             | `undefined`                                    |


## Methods

### `addCanvas(canvasId: string) => Promise<void>`

Add a new canvas programmatically

**Purpose**: Create new section/canvas in the grid

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
await builder.addCanvas('new-section');
```

#### Parameters

| Name       | Type     | Description                |
| ---------- | -------- | -------------------------- |
| `canvasId` | `string` | - Unique canvas identifier |

#### Returns

Type: `Promise<void>`



### `addComponent(canvasId: string, componentType: string, position: { x: number; y: number; width: number; height: number; }, config?: Record<string, any>) => Promise<string | null>`

Add a component programmatically

**Purpose**: Add new component to canvas without dragging from palette

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
const itemId = await builder.addComponent('canvas1', 'header', {
  x: 10, y: 10, width: 30, height: 6
}, { title: 'My Header' });
```

#### Parameters

| Name            | Type                                                       | Description                        |
| --------------- | ---------------------------------------------------------- | ---------------------------------- |
| `canvasId`      | `string`                                                   | - Canvas to add component to       |
| `componentType` | `string`                                                   | - Component type from registry     |
| `position`      | `{ x: number; y: number; width: number; height: number; }` | - Grid position and size           |
| `config`        | `{ [x: string]: any; }`                                    | - Optional component configuration |

#### Returns

Type: `Promise<string>`

Promise<string | null> - New item ID or null if failed

### `canRedo() => Promise<boolean>`

Check if redo is available

**Purpose**: Determine if there are actions to redo

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
const canRedo = await builder.canRedo();
redoButton.disabled = !canRedo;
```

#### Returns

Type: `Promise<boolean>`

Promise<boolean> - True if redo is available

### `canUndo() => Promise<boolean>`

Check if undo is available

**Purpose**: Determine if there are actions to undo

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
const canUndo = await builder.canUndo();
undoButton.disabled = !canUndo;
```

#### Returns

Type: `Promise<boolean>`

Promise<boolean> - True if undo is available

### `deleteComponent(itemId: string) => Promise<boolean>`

Delete a component programmatically

**Purpose**: Remove component from grid

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
const success = await builder.deleteComponent('item-123');
```

#### Parameters

| Name     | Type     | Description         |
| -------- | -------- | ------------------- |
| `itemId` | `string` | - Item ID to delete |

#### Returns

Type: `Promise<boolean>`

Promise<boolean> - True if deleted successfully

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

### `getActiveCanvas() => Promise<string | null>`

Get currently active canvas ID

**Purpose**: Check which canvas is currently active/focused

#### Returns

Type: `Promise<string>`

Promise<string | null> - Active canvas ID or null if none active

### `getState() => Promise<GridState>`

Get current grid state

**Purpose**: Direct access to grid state for reading

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
const state = await builder.getState();
console.log('Current viewport:', state.currentViewport);
```

#### Returns

Type: `Promise<GridState>`

Promise<GridState> - Current grid state

### `importState(state: Partial<GridState> | GridExport) => Promise<void>`

Import state from JSON-serializable format

**Purpose**: Restore previously exported grid state

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
const savedState = JSON.parse(localStorage.getItem('grid-layout'));
await builder.importState(savedState);
```

#### Parameters

| Name    | Type                               | Description                              |
| ------- | ---------------------------------- | ---------------------------------------- |
| `state` | `GridExport \| Partial<GridState>` | - GridExport or partial GridState object |

#### Returns

Type: `Promise<void>`



### `redo() => Promise<void>`

Redo last undone action

**Purpose**: Re-apply last undone action

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
await builder.redo();
```

#### Returns

Type: `Promise<void>`



### `removeCanvas(canvasId: string) => Promise<void>`

Remove a canvas programmatically

**Purpose**: Delete section/canvas from the grid

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
await builder.removeCanvas('old-section');
```

#### Parameters

| Name       | Type     | Description                   |
| ---------- | -------- | ----------------------------- |
| `canvasId` | `string` | - Canvas identifier to remove |

#### Returns

Type: `Promise<void>`



### `setActiveCanvas(canvasId: string) => Promise<void>`

Set active canvas programmatically

**Purpose**: Activate a specific canvas for focused editing

**Use cases**:
- Focus specific section after adding items
- Programmatic navigation between sections
- Show canvas-specific settings panel

**Events triggered**: 'canvasActivated'

#### Parameters

| Name       | Type     | Description          |
| ---------- | -------- | -------------------- |
| `canvasId` | `string` | - Canvas to activate |

#### Returns

Type: `Promise<void>`



### `undo() => Promise<void>`

Undo last action

**Purpose**: Revert last user action (move, resize, add, delete, etc.)

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
await builder.undo();
```

#### Returns

Type: `Promise<void>`



### `updateConfig(itemId: string, config: Record<string, any>) => Promise<boolean>`

Update component configuration

**Purpose**: Update component properties/config

**Example**:
```typescript
const builder = document.querySelector('grid-builder');
const success = await builder.updateConfig('item-123', {
  title: 'Updated Title',
  color: '#ff0000'
});
```

#### Parameters

| Name     | Type                    | Description             |
| -------- | ----------------------- | ----------------------- |
| `itemId` | `string`                | - Item ID to update     |
| `config` | `{ [x: string]: any; }` | - Configuration updates |

#### Returns

Type: `Promise<boolean>`

Promise<boolean> - True if updated successfully


## Dependencies

### Used by

 - [blog-app](../../demo/components/blog-app)

### Depends on

- [component-palette](../component-palette)
- [canvas-section](../canvas-section)

### Graph
```mermaid
graph TD;
  grid-builder --> component-palette
  grid-builder --> canvas-section
  canvas-section --> grid-item-wrapper
  blog-app --> grid-builder
  style grid-builder fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
