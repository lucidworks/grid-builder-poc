# Stencil Grid Builder

A flexible, component-agnostic grid layout system built with StencilJS. Create drag-and-drop grid layouts with a full-featured builder component and a lightweight viewer component for displaying layouts.

## Two Components, One System

This library provides **two complementary components** for different use cases:

### 🛠️ **grid-builder** - Full Editing Experience
Create and edit grid layouts with drag-and-drop, resize, and configuration controls.
- Bundle size: ~150KB (includes interact.js for editing)
- Use in: Admin panels, content management systems, layout editors

### 👁️ **grid-viewer** - Display-Only Mode
Render grid layouts without any editing functionality for production display.
- Bundle size: ~30KB (80% smaller - no interact.js)
- Use in: Public-facing websites, mobile apps, content delivery

**Workflow**: Build layouts in `grid-builder`, export them, then display in `grid-viewer` for optimal performance.

## Features

### Common Features (Both Components)
- 🎯 **Component-Agnostic**: Works with any web components or frameworks
- 📱 **Responsive**: Desktop and mobile viewport support with independent layouts
- 🎨 **Customizable**: Configurable grid sizing, colors, and component rendering
- ⚡ **Performance**: Virtual rendering with IntersectionObserver for large grids
- 🛡️ **Error Boundaries**: 3-level error isolation with graceful degradation
- 📦 **TypeScript**: Full type definitions included

### grid-builder Exclusive Features
- ↩️ **Undo/Redo**: Full command pattern implementation with 50-action history
- 🔌 **Event-Driven**: Rich event system for state changes and user interactions
- 🎛️ **Component Palette**: Drag components from palette to canvas
- 🎨 **Multiple Palettes**: Support multiple component palettes on the same page for flexible organization
- 📑 **Multi-Section Layouts**: Multiple canvases on the same page, each with independent backgrounds and properties
- ⚙️ **Configuration Panel**: Edit component properties in real-time
- 📏 **Resize Handles**: Click and drag to resize components
- 🗑️ **Delete Controls**: Remove components with confirmation

## Installation

```bash
npm install @lucidworks/stencil-grid-builder
```

## Quick Start

Choose the component that matches your use case:
- **Building/Editing layouts?** → Use `grid-builder`
- **Displaying pre-built layouts?** → Use `grid-viewer`

### grid-builder: Creating Layouts

#### 1. Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="node_modules/@lucidworks/stencil-grid-builder/dist/stencil-grid-builder/stencil-grid-builder.esm.js"></script>
</head>
<body>
  <grid-builder id="myGrid"></grid-builder>

  <script>
    const gridBuilder = document.getElementById('myGrid');

    // Define your components
    gridBuilder.components = [
      {
        type: 'header',
        name: 'Header',
        icon: '📄',
        description: 'Page header component',
        defaultSize: { width: 50, height: 6 },
        minSize: { width: 10, height: 3 },
        renderDragClone: () => (
          <div style={{ padding: '8px 12px', background: '#f0f0f0', border: '2px dashed #ccc' }}>
            📄 Header
          </div>
        ),
        render: ({ config }) => (
          <div style={{ padding: '12px', background: '#f0f0f0' }}>
            <h3>{config?.title || 'Header'}</h3>
          </div>
        )
      },
      {
        type: 'text',
        name: 'Text Block',
        icon: '📝',
        description: 'Rich text content',
        defaultSize: { width: 25, height: 10 },
        minSize: { width: 10, height: 5 },
        renderDragClone: () => (
          <div style={{ padding: '8px 12px', background: '#fff', border: '2px dashed #ccc' }}>
            📝 Text Block
          </div>
        ),
        render: ({ config }) => (
          <div style={{ padding: '10px', background: '#fff' }}>
            <p>{config?.text || 'Sample text'}</p>
          </div>
        )
      }
    ];

    // Optional: Configure grid settings
    gridBuilder.config = {
      gridSizePercent: 2,    // 2% grid (50 units = 100% width)
      minGridSize: 10,       // Min 10px per grid unit
      maxGridSize: 50        // Max 50px per grid unit
    };
  </script>
</body>
</html>
```

#### 2. Using the API

```typescript
import { GridBuilderAPI } from '@lucidworks/stencil-grid-builder';

// API is available on window after grid-builder loads
const api = window.gridBuilderAPI;

// Or access via multiple instances with custom API keys
// <grid-builder api-ref='{ "key": "myGridAPI" }'></grid-builder>
// const api = window.myGridAPI;

// Add a component programmatically
const itemId = api.addComponent('canvas1', 'header', {
  x: 10, y: 10, width: 30, height: 6
}, { title: 'My Header' });

// Listen for events
api.on('componentAdded', (event) => {
  console.log('Component added:', event.item);
});

api.on('configChanged', (event) => {
  console.log('Config changed:', event.itemId, event.config);
});

// Update component config
api.updateConfig(itemId, {
  title: 'Updated Header'
});

// Export/Import state
const gridBuilder = document.querySelector('grid-builder');
const stateJson = await gridBuilder.exportState();
localStorage.setItem('gridState', JSON.stringify(stateJson));

// Later...
const savedState = JSON.parse(localStorage.getItem('gridState'));
if (savedState) {
  await gridBuilder.importState(savedState);
}
```

#### 3. Batch Operations for Performance

For optimal performance when adding, deleting, or updating multiple items, use the batch API methods. Batch operations trigger a single state update and re-render, compared to N updates for N individual operations.

#### Adding Multiple Components

```typescript
const api = window.gridBuilderAPI;

// ❌ BAD: 100 individual operations = 100 re-renders (~1600ms)
for (let i = 0; i < 100; i++) {
  api.addComponent('canvas1', 'header', {
    x: (i % 10) * 5,
    y: Math.floor(i / 10) * 5,
    width: 20,
    height: 6
  });
}

// ✅ GOOD: 1 batch operation = 1 re-render (~16ms)
const itemIds = api.addComponentsBatch(
  Array.from({ length: 100 }, (_, i) => ({
    canvasId: 'canvas1',
    type: 'header',
    position: {
      x: (i % 10) * 5,
      y: Math.floor(i / 10) * 5,
      width: 20,
      height: 6
    },
    config: { title: `Header ${i + 1}` }
  }))
);
```

#### Deleting Multiple Components

```typescript
// Delete all selected components in one operation
const selectedIds = ['item-1', 'item-2', 'item-3'];
api.deleteComponentsBatch(selectedIds);
```

#### Updating Multiple Configs

```typescript
// Update theme colors across all headers
api.updateConfigsBatch([
  { itemId: 'item-1', config: { color: '#007bff' } },
  { itemId: 'item-2', config: { color: '#007bff' } },
  { itemId: 'item-3', config: { color: '#007bff' } },
]);
```

#### Performance Comparison

| Operation | Individual Calls | Batch Call | Improvement |
|-----------|------------------|------------|-------------|
| Add 100 items | 100 re-renders (~1600ms) | 1 re-render (~16ms) | **100× faster** |
| Delete 50 items | 50 re-renders (~800ms) | 1 re-render (~16ms) | **50× faster** |
| Update 200 configs | 200 re-renders (~3200ms) | 1 re-render (~16ms) | **200× faster** |

#### Undo/Redo Support

Batch operations are fully integrated with the undo/redo system. Each batch operation creates a single undo/redo command:

```typescript
// Add 100 components
api.addComponentsBatch(components);

// Undo removes all 100 components in one operation
api.undo();

// Redo adds all 100 components back in one operation
api.redo();
```

#### Best Practices

- **Use batch operations for 3+ components**: The overhead of batching is negligible, but benefits increase with size
- **Batch related operations**: Group related adds/deletes/updates together for logical undo/redo
- **Consider memory**: While batches can handle 1000+ items, keep individual batches under 1000 for best performance
- **Event listeners**: Batch operations emit single batch events (`componentsBatchAdded`, `componentsBatchDeleted`, `configsBatchChanged`)

### grid-viewer: Displaying Layouts

The `grid-viewer` component is a **lightweight, display-only** version of grid-builder. Use it to render pre-built layouts without any editing functionality.

#### Why Use grid-viewer?

| Feature | grid-builder | grid-viewer |
|---------|--------------|-------------|
| **Bundle Size** | ~150KB | ~30KB (80% smaller) |
| **Dependencies** | interact.js, full UI | Minimal (no interact.js) |
| **Use Case** | Editing layouts | Displaying layouts |
| **Drag & Drop** | ✅ Yes | ❌ No |
| **Resize** | ✅ Yes | ❌ No |
| **Config Panel** | ✅ Yes | ❌ No |
| **Component Palette** | ✅ Yes | ❌ No |
| **Responsive Layouts** | ✅ Yes | ✅ Yes |
| **Virtual Rendering** | ✅ Yes | ✅ Yes |
| **Custom Themes** | ✅ Yes | ✅ Yes |

#### 1. Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="node_modules/@lucidworks/stencil-grid-builder/dist/stencil-grid-builder/stencil-grid-builder.esm.js"></script>
</head>
<body>
  <grid-viewer id="myViewer"></grid-viewer>

  <script>
    const viewer = document.getElementById('myViewer');

    // Use the same component definitions as grid-builder
    viewer.components = [
      {
        type: 'header',
        name: 'Header',
        icon: '📄',
        defaultSize: { width: 30, height: 4 },
        minSize: { width: 15, height: 3 },
        renderDragClone: () => (
          <div style={{ padding: '8px 12px', background: '#f0f0f0', border: '2px dashed #ccc' }}>
            📄 Header
          </div>
        ),
        render: ({ config }) => (
          <div style={{ padding: '12px', background: '#f0f0f0' }}>
            <h3>{config?.title || 'Header'}</h3>
          </div>
        )
      },
      {
        type: 'text',
        name: 'Text Block',
        icon: '📝',
        defaultSize: { width: 20, height: 6 },
        minSize: { width: 10, height: 4 },
        renderDragClone: () => (
          <div style={{ padding: '8px 12px', background: '#fff', border: '2px dashed #ccc' }}>
            📝 Text Block
          </div>
        ),
        render: ({ config }) => (
          <div style={{ padding: '10px', background: '#fff' }}>
            <p>{config?.text || 'Sample text'}</p>
          </div>
        )
      }
    ];

    // Load layout data (from API, localStorage, etc.)
    fetch('/api/layouts/123')
      .then(r => r.json())
      .then(layout => {
        viewer.initialState = layout;
      });
  </script>
</body>
</html>
```

#### 2. Export from Builder, Display in Viewer

The recommended workflow is to build layouts in `grid-builder` and display them in `grid-viewer`:

```typescript
// ==========================================
// BUILDER APP (Admin/CMS)
// ==========================================
const builder = document.querySelector('grid-builder');

// Export layout when user clicks "Publish"
document.querySelector('#publishBtn').addEventListener('click', async () => {
  // Export state from builder
  const layoutData = await builder.exportState();

  // Save to API
  const response = await fetch('/api/layouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(layoutData)
  });

  const { layoutId } = await response.json();
  console.log('Layout published:', layoutId);
});

// ==========================================
// VIEWER APP (Public Website)
// ==========================================
const viewer = document.querySelector('grid-viewer');

// Load and display published layout
const layoutId = '123'; // from URL, route params, etc.
const layout = await fetch(`/api/layouts/${layoutId}`).then(r => r.json());

viewer.components = componentDefinitions; // Same definitions as builder
viewer.initialState = layout;              // Exported layout data
```

#### 3. Multi-Section Landing Pages

Create landing pages with multiple sections, each with its own background:

```javascript
// Layout data with multiple canvases (sections)
const landingPageLayout = {
  version: '1.0.0',
  viewport: 'desktop',
  canvases: {
    'hero': {
      items: [
        {
          id: 'hero-title',
          type: 'header',
          layouts: {
            desktop: { x: 5, y: 2, width: 40, height: 6 },
            mobile: { x: null, y: null, width: null, height: null, customized: false }
          },
          config: { title: 'Welcome to Our Product' }
        }
      ]
    },
    'features': {
      items: [
        {
          id: 'feature-1',
          type: 'text',
          layouts: {
            desktop: { x: 0, y: 5, width: 15, height: 8 },
            mobile: { x: null, y: null, width: null, height: null, customized: false }
          },
          config: { text: 'Feature 1 description' }
        }
      ]
    },
    'cta': {
      items: [
        {
          id: 'cta-button',
          type: 'button',
          layouts: {
            desktop: { x: 20, y: 2, width: 12, height: 4 },
            mobile: { x: null, y: null, width: null, height: null, customized: false }
          },
          config: { label: 'Get Started' }
        }
      ]
    }
  }
};

// Canvas metadata (background colors, etc.)
const canvasMetadata = {
  'hero': { backgroundColor: '#e0f2fe' },
  'features': { backgroundColor: '#f0fdf4' },
  'cta': { backgroundColor: '#fef3c7' }
};

viewer.initialState = landingPageLayout;
viewer.canvasMetadata = canvasMetadata;
```

#### 4. Responsive Behavior

Grid-viewer automatically switches between desktop and mobile layouts based on **container width** (not window width):

```html
<!-- Desktop container (900px) shows horizontal layout -->
<div style="width: 900px;">
  <grid-viewer id="desktop-viewer"></grid-viewer>
</div>

<!-- Mobile container (600px) shows vertical stacked layout -->
<div style="width: 600px;">
  <grid-viewer id="mobile-viewer"></grid-viewer>
</div>
```

**Breakpoint**: 768px container width
- **≥ 768px**: Desktop layout (uses `layouts.desktop` positioning)
- **< 768px**: Mobile layout (vertically stacks full-width components)

#### 5. Multiple Grid Instances on Same Page

You can use multiple `grid-builder` or `grid-viewer` instances on the same page. The library uses `window.gridBuilderAPI` as the default global reference, which works fine for single instances.

**For multiple instances**, use different API keys on the window object:

```html
<!-- First grid builder -->
<grid-builder
  id="grid1"
  api-ref='{ "key": "gridBuilderAPI1" }'>
</grid-builder>

<!-- Second grid builder -->
<grid-builder
  id="grid2"
  api-ref='{ "key": "gridBuilderAPI2" }'>
</grid-builder>

<script>
  // Access each API independently
  const api1 = window.gridBuilderAPI1;
  const api2 = window.gridBuilderAPI2;

  // Each API controls its own grid
  api1.on('componentAdded', (e) => {
    console.log('Grid 1 - component added:', e);
  });

  api2.on('componentAdded', (e) => {
    console.log('Grid 2 - component added:', e);
  });
</script>
```

**Instance Isolation Architecture**:

Each grid-builder instance creates **isolated service instances** with no cross-instance interference:

- **State isolation**: Each instance has its own `StateManager` with independent canvases, selection, and viewport
- **Event isolation**: Each instance has its own `EventManager` - events only fire within their instance
- **Undo/redo isolation**: Each instance has its own `UndoRedoManager` with independent command history
- **Virtual rendering isolation**: Each instance has its own `VirtualRendererService` for lazy loading

**Plugin Instance Isolation**:

Plugins automatically receive **instance-specific APIs**:

```typescript
class MyPlugin implements GridBuilderPlugin {
  name = 'my-plugin';

  init(api: GridBuilderAPI) {
    // This API is instance-specific!
    // Events, state, and operations are isolated to this grid instance
    api.on('componentAdded', (e) => {
      console.log('Component added to THIS instance:', e);
    });
  }

  destroy() { /* cleanup */ }
}

// Each grid gets its own plugin instance with isolated API
<grid-builder api-ref='{ "key": "grid1" }' plugins={[new MyPlugin()]} />
<grid-builder api-ref='{ "key": "grid2" }' plugins={[new MyPlugin()]} />
```

**Important Notes**:
- If you only have **one grid instance** per page, you don't need to configure `api-ref` - the default `window.gridBuilderAPI` works perfectly
- The `api-ref` prop only supports setting a custom `key` on the `window` object
- Passing custom `target` objects (like `this`) through Stencil/JSX props is not supported due to JSX serialization limitations
- For namespace isolation, use unique key names like `window.myApp.gridAPI1` by setting `api-ref='{ "key": "myApp.gridAPI1" }'`

**Complete Instance Isolation**:

The library achieves **complete instance isolation** with no singleton fallbacks:

```typescript
// Child components use instance props (optional syntax for viewer mode compatibility)
<grid-item-wrapper
  stateInstance={this.stateManager}                      // grid-builder provides
  eventManagerInstance={this.eventManagerInstance}       // grid-builder provides
  undoRedoManagerInstance={this.undoRedoManager}         // grid-builder provides
  virtualRendererInstance={this.virtualRendererInstance} // both provide (if enabled)
/>

// Internally: Direct usage when provided, no singleton fallbacks
// const state = this.stateInstance;  // Direct use (no || gridState)
```

**Benefits**:
- ✅ **True isolation**: No shared global state between instances
- ✅ **Viewer mode support**: Virtual rendering now works in grid-viewer too
- ✅ **Cleaner code**: No complex fallback logic
- ✅ **Better testing**: All dependencies explicit and mockable

**How it works**:
- `grid-builder` provides all instances (state, events, undo/redo, virtual rendering)
- `grid-viewer` provides only `virtualRendererInstance` (for lazy loading performance)
- No editing services needed in viewer mode, no singleton fallbacks anywhere

**Note**: If you're using the `<grid-builder>` or `<grid-viewer>` components (recommended), you don't need to worry about this - they automatically create and pass the appropriate instances. This only matters if you're directly using child components like `<canvas-section>` or `<grid-item-wrapper>`.

#### grid-viewer Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `components` | `ComponentDefinition[]` | ✅ Yes | Component registry (same as grid-builder) |
| `initialState` | `GridExport \| ViewerState` | ❌ No | Layout data to display |
| `config` | `GridConfig` | ❌ No | Grid configuration (should match builder config) |
| `theme` | `GridBuilderTheme` | ❌ No | Visual theme customization |
| `canvasMetadata` | `Record<string, any>` | ❌ No | Canvas-level metadata (backgrounds, etc.) |

## Component Definition Schema

Define your custom components with this schema:

```typescript
interface ComponentDefinition {
  // Basic info
  type: string;                    // Unique component type identifier
  name: string;                    // Display name
  icon: string;                    // Icon (emoji or HTML)
  description?: string;            // Description for tooltips

  // Size constraints (in grid units)
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };

  // Custom rendering - REQUIRED
  render: (props: { itemId: string; config: any }) => HTMLElement | JSX.Element;

  // Custom drag clone for palette - REQUIRED
  renderDragClone: () => HTMLElement | JSX.Element;

  // Optional: Custom config panel
  renderConfigPanel?: (props: {
    itemId: string;
    config: any;
    onUpdate: (config: any) => void
  }) => HTMLElement | JSX.Element;

  // Virtual rendering lifecycle hooks
  onVisible?: (itemId: string) => void;
  onHidden?: (itemId: string) => void;
}
```

## Complete Example: Blog Layout Builder

This example demonstrates using **custom Stencil components** within the grid builder. The `render` function creates instances of your own Stencil components (`<blog-hero>`, `<article-card>`, etc.) and configures them with props.

> **Note**: For a complete working example with full Stencil component definitions, see the demo in `src/demo/` directory.

```typescript
// Define blog component definitions that use your custom Stencil components
const blogComponents = [
  {
    type: 'hero',
    name: 'Hero Section',
    icon: '🎯',
    description: 'Large hero banner',
    defaultSize: { width: 50, height: 15 },
    minSize: { width: 30, height: 10 },
    renderDragClone: () => (
      <div style={{
        padding: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: '2px dashed #fff'
      }}>
        🎯 Hero Section
      </div>
    ),
    render: ({ itemId, config }) => (
      // Use your custom Stencil component with JSX
      <blog-hero
        item-id={itemId}
        headline={config?.headline || 'Welcome to My Blog'}
        subheadline={config?.subheadline || 'Discover amazing content'}
        background-image={config?.backgroundImage}
      />
    )
  },
  {
    type: 'article',
    name: 'Article Card',
    icon: '📰',
    description: 'Blog article preview',
    defaultSize: { width: 15, height: 12 },
    minSize: { width: 12, height: 10 },
    renderDragClone: () => (
      <div style={{
        padding: '8px 12px',
        background: '#fff',
        border: '2px dashed #ccc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        📰 Article Card
      </div>
    ),
    render: ({ itemId, config }) => (
      // Use your custom Stencil component with JSX
      <article-card
        item-id={itemId}
        title={config?.title || 'Article Title'}
        excerpt={config?.excerpt || 'Brief article description...'}
        image-url={config?.imageUrl}
        author={config?.author || 'John Doe'}
      />
    )
  }
];

// Initialize grid builder
const gridBuilder = document.querySelector('grid-builder');
gridBuilder.components = blogComponents;

// Get API and set up event handlers
const api = window.gridBuilderAPI;

// Auto-save to localStorage
api.on('componentAdded', async () => {
  const state = await gridBuilder.exportState();
  localStorage.setItem('blogLayout', JSON.stringify(state));
});

// Load saved layout on startup
const savedLayout = localStorage.getItem('blogLayout');
if (savedLayout) {
  await gridBuilder.importState(JSON.parse(savedLayout));
}
```

## API Reference

### GridBuilderAPI Methods

Available via `window.gridBuilderAPI` (or custom key with `api-ref` prop).

#### State Access
- `getState(): GridState` - Get current grid state
- `getItems(canvasId: string): GridItem[]` - Get all items in a canvas
- `getItem(itemId: string): GridItem | null` - Get specific item (searches all canvases)

#### Component Management
- `addComponent(canvasId, type, position, config?): string | null` - Add new component, returns itemId
- `deleteComponent(itemId): boolean` - Delete component, returns success
- `updateConfig(itemId, config): boolean` - Update component configuration, returns success

#### Batch Operations (Performance Optimized)
- `addComponentsBatch(components[]): string[]` - Add multiple components, returns itemIds
- `deleteComponentsBatch(itemIds[])` - Delete multiple components in one operation
- `updateConfigsBatch(updates[])` - Update multiple configs in one operation

#### Canvas Management
- `addCanvas(canvasId: string)` - Add new canvas/section
- `removeCanvas(canvasId: string)` - Remove canvas/section
- `setActiveCanvas(canvasId: string)` - Set active canvas
- `getActiveCanvas(): string | null` - Get currently active canvas ID

#### Undo/Redo
- `undo()` - Undo last action
- `redo()` - Redo last undone action
- `canUndo(): boolean` - Check if undo available
- `canRedo(): boolean` - Check if redo available
- `undoRedoState` - Observable state object with canUndo/canRedo properties

#### Events
- `on<T>(event: string, listener: (data: T) => void)` - Register event listener
- `off<T>(event: string, listener: (data: T) => void)` - Unregister event listener

### Component @Methods

Methods available directly on the `<grid-builder>` element:

- `exportState(): Promise<GridExport>` - Export layout for saving or viewer display
- `importState(state: Partial<GridState> | GridExport): Promise<void>` - Import state
- `getState(): Promise<GridState>` - Get current state
- `addCanvas(canvasId: string): Promise<void>` - Add canvas
- `removeCanvas(canvasId: string): Promise<void>` - Remove canvas
- `setActiveCanvas(canvasId: string): Promise<void>` - Set active canvas
- `getActiveCanvas(): Promise<string | null>` - Get active canvas
- `undo(): Promise<void>` - Undo
- `redo(): Promise<void>` - Redo
- `canUndo(): Promise<boolean>` - Check undo availability
- `canRedo(): Promise<boolean>` - Check redo availability
- `addComponent(canvasId, type, position, config?): Promise<string | null>` - Add component
- `deleteComponent(itemId): Promise<boolean>` - Delete component
- `updateConfig(itemId, config): Promise<boolean>` - Update config

### Events

```typescript
// Component events
api.on('componentAdded', (event) => {
  // event: { item: GridItem, canvasId: string }
});

api.on('componentDeleted', (event) => {
  // event: { itemId: string, canvasId: string }
});

api.on('componentDragged', (event) => {
  // event: { itemId: string, canvasId: string, position: { x: number, y: number } }
});

api.on('componentMoved', (event) => {
  // event: { item: GridItem, sourceCanvasId: string, targetCanvasId: string, position: { x, y } }
});

api.on('configChanged', (event) => {
  // event: { itemId: string, canvasId: string, config: Record<string, any> }
});

// Batch component events
api.on('componentsBatchAdded', (event) => {
  // event: { items: Array<{ item: GridItem, canvasId: string }> }
});

api.on('componentsBatchDeleted', (event) => {
  // event: { items: Array<{ itemId: string, canvasId: string }> }
});

api.on('configsBatchChanged', (event) => {
  // event: { items: Array<{ itemId: string, canvasId: string, config: Record<string, any> }> }
});

// Canvas events
api.on('canvasAdded', (event) => {
  // event: { canvasId: string }
});

api.on('canvasRemoved', (event) => {
  // event: { canvasId: string }
});

api.on('canvasActivated', (event) => {
  // event: { canvasId: string }
});

// Undo/Redo events
api.on('undoExecuted', (event) => {
  // Event fired after undo operation
});

api.on('redoExecuted', (event) => {
  // Event fired after redo operation
});
```

## Grid Configuration

Configure the grid system via the `config` prop:

```typescript
gridBuilder.config = {
  gridSizePercent: 2,    // Grid unit as % of container width (default: 2%)
  minGridSize: 10,       // Minimum grid size in pixels (default: 10px)
  maxGridSize: 50        // Maximum grid size in pixels (default: 50px)
};
```

**Grid System**:
- Horizontal: Percentage-based (default 2% = 50 units across full width)
- Vertical: Grid size determined by container-relative calculation
- Responsive: Grid scales with container width
- Boundary constraints: Components cannot exceed canvas width (100 grid units = 100%)

## Advanced Features

### Canvas Metadata

The `canvasMetadata` prop allows you to store presentation data for each canvas (sections). The library handles placement state while you manage visual presentation:

```typescript
const canvasMetadata = {
  'hero-section': {
    title: 'Hero Section',
    backgroundColor: '#f0f4f8',
    // Any custom properties you need
    customData: { ... }
  },
  'features-section': {
    title: 'Features',
    backgroundColor: '#ffffff'
  }
};

gridBuilder.canvasMetadata = canvasMetadata;
```

**Use cases**:
- Section titles and descriptions
- Background colors
- Custom styling per section
- Any section-level metadata your app needs

### Deletion Hook

Intercept component deletion with the `onBeforeDelete` hook to show confirmations or run validation:

```typescript
const handleBeforeDelete = async (context) => {
  // context: { item: GridItem, canvasId: string, itemId: string }

  const confirmed = await showConfirmModal(
    `Delete "${context.item.name}"?`,
    'This action cannot be undone.'
  );

  return confirmed; // true = proceed, false = cancel
};

gridBuilder.onBeforeDelete = handleBeforeDelete;
```

**Hook return values**:
- `true` - Proceed with deletion
- `false` - Cancel deletion
- `Promise<boolean>` - Async operations (modals, API calls)

### UI Overrides

Customize the UI by providing your own components via the `uiOverrides` prop:

```typescript
gridBuilder.uiOverrides = {
  // Custom canvas headers
  CanvasHeader: ({ canvasId, metadata, isActive }) => {
    return (
      <my-canvas-header
        canvas-id={canvasId}
        title={metadata.title}
        is-active={isActive}
      />
    );
  }
};
```

**Available overrides**:
- `CanvasHeader` - Header rendered above each canvas section
  - Props: `{ canvasId: string, metadata: any, isActive: boolean }`

### Error Boundaries

The grid builder includes a comprehensive 3-level error boundary system for graceful error handling and isolation. Errors are caught at the appropriate level to minimize impact on the rest of the application.

#### Error Boundary Hierarchy

```
grid-builder (Level 1 - Critical)
├── canvas-section (Level 2 - Error)
│   ├── grid-item-wrapper (Level 3 - Warning)
│   ├── grid-item-wrapper (Level 3 - Warning)
│   └── ...
├── canvas-section (Level 2 - Error)
└── ...
```

**Level 1 (grid-builder)**: Critical errors that prevent the entire grid from functioning
- Plugin initialization failures
- API creation errors
- Global state corruption

**Level 2 (canvas-section)**: Errors affecting a single canvas section
- Canvas rendering failures
- Dropzone initialization errors
- Canvas-level state issues

**Level 3 (grid-item-wrapper)**: Isolated component errors
- Component render failures
- Component lifecycle errors
- Custom component errors

#### Configuration

Enable and configure error boundaries via the `config` prop:

```typescript
gridBuilder.config = {
  // Error boundary configuration
  showErrorUI: true,                    // Show error UI in development (default: process.env.NODE_ENV === 'development')
  logErrors: true,                      // Log errors to console (default: true)
  reportToSentry: false,                // Report to Sentry (default: false)
  recoveryStrategy: 'graceful',         // 'graceful' | 'ignore' | 'strict' (default: 'graceful')

  // Custom error fallback UI (optional)
  errorFallback: (error, errorInfo, retry) => {
    return (
      <div class="custom-error-ui">
        <h3>{error.message}</h3>
        <button onClick={retry}>Try Again</button>
      </div>
    );
  },

  // ... other grid config
};
```

#### Recovery Strategies

**Graceful (default)**: Show fallback UI, allow retry, continue operating
```typescript
config.recoveryStrategy = 'graceful';
```

**Ignore**: Suppress error, continue silently (log only)
```typescript
config.recoveryStrategy = 'ignore';
```

**Strict**: Propagate error to parent boundary
```typescript
config.recoveryStrategy = 'strict';
```

#### Error Events

Listen for error events to integrate with external logging systems (Sentry, Datadog, etc.):

```typescript
const api = window.gridBuilderAPI;

// Listen for all error events
api.on('error', (event) => {
  const { error, errorInfo, severity, recoverable } = event;

  // Log to external service
  Sentry.captureException(error, {
    level: severity,
    tags: {
      errorBoundary: errorInfo.errorBoundary,
      canvasId: errorInfo.canvasId,
      itemId: errorInfo.itemId,
      componentType: errorInfo.componentType,
      recoverable: recoverable
    }
  });

  // Update UI
  if (severity === 'critical') {
    showIncidentBanner('Critical error occurred');
  }
});
```

**Event payload structure**:
```typescript
interface GridErrorEventDetail {
  error: Error;                    // The caught error
  errorInfo: GridErrorInfo;        // Grid-specific context
  severity: 'warning' | 'error' | 'critical';
  recoverable: boolean;            // Can the grid continue operating?
}

interface GridErrorInfo {
  errorBoundary: 'grid-builder' | 'canvas-section' | 'grid-item-wrapper';
  timestamp: number;
  itemId?: string;                 // Present for item-level errors
  canvasId?: string;               // Present for canvas/item errors
  componentType?: string;          // Present for item render errors
}
```

#### Custom Fallback UI

Provide custom error UI instead of the default red error box:

```typescript
const customErrorFallback = (error, errorInfo, retry) => {
  const fallbackDiv = document.createElement('div');
  fallbackDiv.style.cssText = `
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
  `;

  fallbackDiv.innerHTML = `
    <h3>🛠️ Oops! Something went wrong</h3>
    <p>${error.message || 'An unexpected error occurred'}</p>
    <button id="retry-btn" style="padding: 8px 16px; background: white; color: #667eea; border: none; border-radius: 4px; cursor: pointer;">
      Try Again
    </button>
  `;

  // Add retry handler
  const retryBtn = fallbackDiv.querySelector('#retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', retry);
  }

  return fallbackDiv;
};

gridBuilder.config = {
  errorFallback: customErrorFallback,
  showErrorUI: true
};
```

#### Development vs Production

Error UI behavior adapts based on environment:

**Development mode** (`NODE_ENV=development`):
- Shows detailed error stack traces
- Displays technical error information
- Includes error boundary metadata
- Defaults to `showErrorUI: true`

**Production mode** (`NODE_ENV=production`):
- Shows user-friendly messages
- Hides technical details and stack traces
- Logs errors silently to external services
- Defaults to `showErrorUI: false`

#### Error Severity Levels

Errors are automatically classified by severity based on the boundary that caught them:

| Severity | Boundary | Impact | Example |
|----------|----------|--------|---------|
| **Warning** | grid-item-wrapper | Single component fails, others OK | Component render error |
| **Error** | canvas-section | Entire canvas section fails | Canvas initialization error |
| **Critical** | grid-builder | Entire grid fails | Plugin initialization error |

#### Best Practices

**1. Use custom fallback UI for production**:
```typescript
config.errorFallback = (error, errorInfo, retry) => {
  return <your-branded-error-component error={error} onRetry={retry} />;
};
```

**2. Integrate with external logging**:
```typescript
api.on('error', (event) => {
  if (event.severity === 'critical') {
    Sentry.captureException(event.error, {
      level: 'error',
      tags: event.errorInfo
    });
  }
});
```

**3. Handle component errors gracefully**:
```typescript
// In your component render function
render: ({ itemId, config }) => {
  try {
    return <your-component config={config} />;
  } catch (error) {
    // Error will be caught by grid-item-wrapper error boundary
    throw error;
  }
}
```

**4. Test error boundaries in development**:
```typescript
// Use Storybook stories to test error scenarios
// See: src/components/error-boundary/stories/error-boundary.stories.tsx
```

**5. Monitor error rates**:
```typescript
let errorCount = 0;

api.on('error', (event) => {
  errorCount++;

  if (errorCount > 10) {
    // Too many errors - alert developers
    console.error('High error rate detected');
  }
});
```

For complete examples and demonstrations, see the error boundary Storybook stories at:
`src/components/error-boundary/stories/error-boundary.stories.tsx`

## Styling & Theming

The grid builder uses CSS custom properties for theming:

```css
grid-builder {
  --grid-color: #e0e0e0;
  --grid-hover-color: #2196f3;
  --selection-color: #2196f3;
  --selection-border: 2px solid #2196f3;
  --resize-handle-size: 10px;
  --resize-handle-color: #2196f3;
}
```

## Performance Considerations

- **Virtual Rendering**: Uses IntersectionObserver to only render visible items
- **Grid Size Caching**: Caches grid calculations to avoid repeated DOM reads
- **Debounced Updates**: Drag/resize operations are optimized with RAF
- **Bounded History**: Undo/redo limited to 50 operations to prevent memory bloat

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires:
- ES2017+ (async/await, Object.entries, etc.)
- IntersectionObserver API
- Custom Elements v1
- Shadow DOM

## TypeScript Support

Full TypeScript definitions included:

```typescript
import type {
  // Builder types
  GridBuilderAPI,
  ComponentDefinition,
  GridItem,
  GridConfig,
  GridBuilderEventMap,
  GridBuilderTheme,

  // Export/Viewer types
  GridExport,
  ViewerState,
  ViewerCanvas
} from '@lucidworks/stencil-grid-builder';
```

## License

MIT

## Contributing

Issues and pull requests welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Credits

Built with [StencilJS](https://stenciljs.com/) by the Lucidworks team.
