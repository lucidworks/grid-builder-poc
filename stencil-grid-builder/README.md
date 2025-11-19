# Stencil Grid Builder

A flexible, component-agnostic grid builder library built with StencilJS. Create drag-and-drop grid layouts with responsive viewports, undo/redo support, and a rich event system.

## Features

- 🎯 **Component-Agnostic**: Works with any web components or frameworks
- 📱 **Responsive**: Desktop and mobile viewport support with independent layouts
- ↩️ **Undo/Redo**: Full command pattern implementation with 50-action history
- 🎨 **Customizable**: Configurable grid sizing, colors, and component rendering
- 🔌 **Event-Driven**: Rich event system for state changes and user interactions
- ⚡ **Performance**: Virtual rendering with IntersectionObserver for large grids
- 📦 **TypeScript**: Full type definitions included

## Installation

```bash
npm install @lucidworks/stencil-grid-builder
```

## Quick Start

### 1. Basic Setup

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
    gridBuilder.componentDefinitions = [
      {
        type: 'header',
        name: 'Header',
        icon: '📄',
        description: 'Page header component',
        defaultSize: { width: 50, height: 6 },
        minSize: { width: 10, height: 3 },
        configSchema: [
          {
            key: 'title',
            label: 'Title',
            type: 'text',
            defaultValue: 'My Header'
          }
        ]
      },
      {
        type: 'text',
        name: 'Text Block',
        icon: '📝',
        description: 'Rich text content',
        defaultSize: { width: 25, height: 10 },
        minSize: { width: 10, height: 5 },
        configSchema: [
          {
            key: 'content',
            label: 'Content',
            type: 'textarea',
            defaultValue: 'Enter text here...',
            rows: 5
          }
        ]
      }
    ];

    // Optional: Configure grid settings
    gridBuilder.gridConfig = {
      gridSizePercent: 2,    // 2% grid (50 units = 100% width)
      minGridSize: 10,       // Min 10px per grid unit
      maxGridSize: 50        // Max 50px per grid unit
    };
  </script>
</body>
</html>
```

### 2. Using the API

```typescript
import { GridBuilderAPI } from '@lucidworks/stencil-grid-builder';

// Get API instance from component
const gridBuilder = document.querySelector('grid-builder');
const api = await gridBuilder.getAPI();

// Add an item programmatically
const item = api.addItem('canvas1', 'header', 10, 10, 30, 6);
console.log('Added item:', item);

// Listen for events
api.on('itemAdded', (event) => {
  console.log('Item added:', event.item);
});

api.on('itemUpdated', (event) => {
  console.log('Item updated:', event.itemId, event.updates);
});

// Update item
api.updateItem('canvas1', item.id, {
  config: { title: 'Updated Header' }
});

// Export/Import state
const stateJson = api.exportState();
localStorage.setItem('gridState', stateJson);

// Later...
const savedState = localStorage.getItem('gridState');
if (savedState) {
  api.importState(savedState);
}
```

### 3. Batch Operations for Performance

For optimal performance when adding, deleting, or updating multiple items, use the batch API methods. Batch operations trigger a single state update and re-render, compared to N updates for N individual operations.

#### Adding Multiple Items

```typescript
const api = await gridBuilder.getAPI();

// ❌ BAD: 100 individual operations = 100 re-renders (~1600ms)
for (let i = 0; i < 100; i++) {
  api.addItem('canvas1', 'header', (i % 10) * 5, Math.floor(i / 10) * 5, 20, 6);
}

// ✅ GOOD: 1 batch operation = 1 re-render (~16ms)
const itemIds = api.addItemsBatch(
  Array.from({ length: 100 }, (_, i) => ({
    canvasId: 'canvas1',
    type: 'header',
    x: (i % 10) * 5,
    y: Math.floor(i / 10) * 5,
    width: 20,
    height: 6,
    config: { title: `Header ${i + 1}` }
  }))
);
```

#### Deleting Multiple Items

```typescript
// Delete all selected items in one operation
const selectedIds = ['item-1', 'item-2', 'item-3'];
api.deleteItemsBatch(selectedIds);
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
// Add 100 items
api.addItemsBatch(items);

// Undo removes all 100 items in one operation
api.undo();

// Redo adds all 100 items back in one operation
api.redo();
```

#### Best Practices

- **Use batch operations for 3+ items**: The overhead of batching is negligible, but benefits increase with size
- **Batch related operations**: Group related adds/deletes/updates together for logical undo/redo
- **Consider memory**: While batches can handle 1000+ items, keep individual batches under 1000 for best performance
- **Event listeners**: Batch operations emit single batch events (`itemsBatchAdded`, `itemsBatchDeleted`, `itemsBatchUpdated`)

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

  // Configuration schema
  configSchema?: ConfigField[];

  // Custom rendering
  renderComponent?: (item: GridItem, config: any) => HTMLElement;
  renderPreview?: (item: GridItem, config: any) => HTMLElement;

  // Custom config form
  renderConfigForm?: (item: GridItem, onChange: (updates: any) => void) => HTMLElement;
}

interface ConfigField {
  key: string;                     // Property key in config object
  label: string;                   // Display label
  type: 'text' | 'number' | 'color' | 'select' | 'checkbox' | 'textarea';
  defaultValue?: any;

  // Number field options
  min?: number;
  max?: number;
  step?: number;

  // Select field options
  options?: Array<{ label: string; value: string } | string>;

  // Textarea options
  rows?: number;

  // Validation
  required?: boolean;
}
```

## Complete Example: Blog Layout Builder

This example demonstrates using **custom Stencil components** within the grid builder. The `renderComponent` function creates instances of your own Stencil components (`<blog-hero>`, `<article-card>`, etc.) and configures them with props.

> **Note**: For a complete example with full Stencil component definitions, see the `/examples` directory in this repository.

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
    configSchema: [
      {
        key: 'headline',
        label: 'Headline',
        type: 'text',
        defaultValue: 'Welcome to My Blog',
        required: true
      },
      {
        key: 'subheadline',
        label: 'Subheadline',
        type: 'text',
        defaultValue: 'Discover amazing content'
      },
      {
        key: 'backgroundImage',
        label: 'Background Image URL',
        type: 'text'
      }
    ],
    renderComponent: (item, config) => {
      // Create and return your custom Stencil component
      const hero = document.createElement('blog-hero');
      hero.headline = config.headline;
      hero.subheadline = config.subheadline;
      hero.backgroundImage = config.backgroundImage;
      return hero;
    }
  },
  {
    type: 'article',
    name: 'Article Card',
    icon: '📰',
    description: 'Blog article preview',
    defaultSize: { width: 15, height: 12 },
    minSize: { width: 12, height: 10 },
    configSchema: [
      {
        key: 'title',
        label: 'Title',
        type: 'text',
        defaultValue: 'Article Title',
        required: true
      },
      {
        key: 'excerpt',
        label: 'Excerpt',
        type: 'textarea',
        defaultValue: 'Brief article description...',
        rows: 3
      },
      {
        key: 'imageUrl',
        label: 'Image URL',
        type: 'text'
      },
      {
        key: 'author',
        label: 'Author',
        type: 'text',
        defaultValue: 'John Doe'
      }
    ],
    renderComponent: (item, config) => {
      // Create and configure your custom Stencil component
      const card = document.createElement('article-card');
      card.title = config.title;
      card.excerpt = config.excerpt;
      card.imageUrl = config.imageUrl;
      card.author = config.author;
      return card;
    }
  }
];

// Initialize grid builder
const gridBuilder = document.querySelector('grid-builder');
gridBuilder.componentDefinitions = blogComponents;

// Get API and set up event handlers
const api = await gridBuilder.getAPI();

// Auto-save to localStorage
api.on('stateChanged', () => {
  const state = api.exportState();
  localStorage.setItem('blogLayout', state);
});

// Load saved layout on startup
const savedLayout = localStorage.getItem('blogLayout');
if (savedLayout) {
  api.importState(savedLayout);
}
```

## API Reference

### GridBuilderAPI Methods

#### State Access
- `getState(): GridState` - Get current grid state
- `getCanvases()` - Get all canvases
- `getCanvas(canvasId: string)` - Get specific canvas
- `getItem(canvasId: string, itemId: string)` - Get specific item
- `getCurrentViewport()` - Get current viewport ('desktop' | 'mobile')
- `getGridVisibility(): boolean` - Get grid visibility state
- `getSelectedItem()` - Get currently selected item

#### Item Management
- `addItem(canvasId, type, x, y, width, height, config?)` - Add new item
- `removeItem(canvasId, itemId)` - Remove item
- `updateItem(canvasId, itemId, updates)` - Update item properties
- `moveItem(fromCanvasId, toCanvasId, itemId)` - Move item between canvases

#### Batch Operations (Performance Optimized)
- `addItemsBatch(items[])` - Add multiple items in one operation
- `deleteItemsBatch(itemIds[])` - Delete multiple items in one operation
- `updateConfigsBatch(updates[])` - Update multiple configs in one operation

#### Selection
- `selectItem(itemId, canvasId)` - Select an item
- `deselectItem()` - Deselect current item

#### Viewport & Display
- `setViewport(viewport: 'desktop' | 'mobile')` - Change viewport
- `toggleGrid(visible: boolean)` - Show/hide grid
- `setCanvasBackground(canvasId, color)` - Set canvas background color

#### Undo/Redo
- `undo()` - Undo last action
- `redo()` - Redo last undone action
- `canUndo(): boolean` - Check if undo available
- `canRedo(): boolean` - Check if redo available
- `clearHistory()` - Clear undo/redo history

#### State Management
- `exportState(): string` - Export state as JSON
- `importState(json: string)` - Import state from JSON
- `reset()` - Reset to initial state

#### Events
- `on(event, listener)` - Register event listener
- `off(event, listener)` - Unregister event listener
- `once(event, listener)` - Register one-time listener
- `destroy()` - Clean up all listeners

### Events

```typescript
// Item events
api.on('itemAdded', (event) => {
  // event: { item: GridItem, canvasId: string }
});

api.on('itemRemoved', (event) => {
  // event: { itemId: string, canvasId: string }
});

api.on('itemUpdated', (event) => {
  // event: { itemId: string, canvasId: string, updates: Partial<GridItem> }
});

api.on('itemMoved', (event) => {
  // event: { itemId: string, fromCanvasId: string, toCanvasId: string }
});

// Batch item events
api.on('itemsBatchAdded', (event) => {
  // event: { items: GridItem[] }
});

api.on('itemsBatchDeleted', (event) => {
  // event: { itemIds: string[] }
});

api.on('itemsBatchUpdated', (event) => {
  // event: { updates: Array<{ itemId: string, canvasId: string, config: Record<string, any> }> }
});

// Selection events
api.on('selectionChanged', (event) => {
  // event: { itemId: string | null, canvasId: string | null }
});

// Viewport events
api.on('viewportChanged', (event) => {
  // event: { viewport: 'desktop' | 'mobile' }
});

// Display events
api.on('gridVisibilityChanged', (event) => {
  // event: { visible: boolean }
});

api.on('canvasBackgroundChanged', (event) => {
  // event: { canvasId: string, color: string }
});

// State events
api.on('stateChanged', (event) => {
  // Generic state change event
});
```

## Grid Configuration

Configure the grid system:

```typescript
gridBuilder.gridConfig = {
  gridSizePercent: 2,    // Grid unit as % of container width (default: 2%)
  minGridSize: 10,       // Minimum grid size in pixels (default: 10px)
  maxGridSize: 50        // Maximum grid size in pixels (default: 50px)
};
```

**Grid System**:
- Horizontal: Percentage-based (default 2% = 50 units across full width)
- Vertical: Fixed 20px per grid unit
- Responsive: Grid scales with container width

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
  GridBuilderAPI,
  ComponentDefinition,
  GridItem,
  GridConfig,
  GridBuilderEventMap
} from '@lucidworks/stencil-grid-builder';
```

## License

MIT

## Contributing

Issues and pull requests welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Credits

Built with [StencilJS](https://stenciljs.com/) by the Lucidworks team.
