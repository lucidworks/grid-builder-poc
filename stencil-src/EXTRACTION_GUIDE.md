# Grid Builder Library Extraction Guide

This guide explains how to extract the Grid Builder POC into a reusable StencilJS library (`@lucidworks/stencil-grid-builder`). This will be a **new project** - the existing POC code remains untouched as a reference implementation.

## Table of Contents
- [Overview](#overview)
- [Phase 1: New Project Setup](#phase-1-new-project-setup)
- [Phase 2: Code Reuse Map](#phase-2-code-reuse-map)
- [Phase 3: Component Abstraction](#phase-3-component-abstraction)
- [Phase 4: Configuration API](#phase-4-configuration-api)
- [Phase 5: Plugin System](#phase-5-plugin-system)
- [Phase 6: Testing Strategy](#phase-6-testing-strategy)
- [Phase 7: Performance Optimizations](#phase-7-performance-optimizations)
- [Phase 8: Pluggable UI Components](#phase-8-pluggable-ui-components)
- [Example Usage](#example-usage)
- [Summary](#summary)

---

## Overview

### What We're Building
A production-ready StencilJS library for building page/layout builders with:
- ✅ **Component palette** with drag-and-drop from sidebar
- ✅ **Multi-canvas** (section-based) layouts
- ✅ **8-point resize handles** for components
- ✅ **Component configuration** panel with edit capabilities
- ✅ **Performance optimizations** (virtual rendering, DOM caching, RAF batching)
- ✅ **Pluggable component types** (not hard-coded to Header/TextBlock/etc)
- ✅ **Pluggable performance monitoring** tools
- ✅ **Configurable** grid, theming, validation, event hooks

### Target Use Case
Page/Layout builders (similar to this POC) using StencilJS components as the registration mechanism.

### Key Principle
**The new library is component-agnostic** - it provides the infrastructure (drag-drop, resize, multi-canvas, undo/redo) but consumers define their own component types.

---

## Phase 1: New Project Setup

### 1.1 Initialize New StencilJS Project

```bash
npm init stencil

# Choose: component (library)
# Project name: stencil-grid-builder
# Confirm
```

### 1.2 Configure for Library Distribution

**`stencil.config.ts`:**
```typescript
import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';

export const config: Config = {
  namespace: 'grid-builder',
  plugins: [sass()],
  outputTargets: [
    // NPM distribution
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    // Type definitions
    {
      type: 'dist-custom-elements',
    },
    // Documentation
    {
      type: 'docs-readme',
    },
    // Demo/testing (optional)
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
};
```

### 1.3 Package Configuration

**`package.json`:**
```json
{
  "name": "@lucidworks/stencil-grid-builder",
  "version": "1.0.0",
  "description": "StencilJS library for building drag-and-drop page/layout builders",
  "main": "dist/index.cjs.js",
  "module": "dist/index.js",
  "types": "dist/types/index.d.ts",
  "collection": "dist/collection/collection-manifest.json",
  "files": ["dist/", "loader/"],
  "scripts": {
    "build": "stencil build",
    "start": "stencil build --dev --watch --serve",
    "test": "stencil test --spec",
    "test.watch": "stencil test --spec --watchAll"
  },
  "dependencies": {
    "@stencil/core": "^4.8.2",
    "@stencil/store": "^2.0.0",
    "interactjs": "^1.10.19"
  },
  "devDependencies": {
    "@stencil/sass": "^3.2.3"
  }
}
```

---

## Phase 2: Code Reuse Map

This section maps POC files to the new library, indicating what to copy directly vs. what needs modification.

### 2.1 Utils Layer (Performance-Critical Code)

**✅ COPY AS-IS** - These are framework-agnostic JavaScript utilities:

| POC File | New Library Path | Changes Needed |
|----------|------------------|----------------|
| `src/utils/drag-handler.ts` | `src/utils/drag-handler.ts` | ✅ None - copy directly |
| `src/utils/resize-handler.ts` | `src/utils/resize-handler.ts` | ✅ None - copy directly |
| `src/utils/grid-calculations.ts` | `src/utils/grid-calculations.ts` | 🔧 Add configuration options (see 2.1.1) |
| `src/utils/virtual-rendering.ts` | `src/utils/virtual-rendering.ts` | ✅ None - copy directly |
| `src/utils/dom-cache.ts` | `src/utils/dom-cache.ts` | ✅ None - copy directly |

#### 2.1.1 Grid Calculations Configuration

**What to change**: Make grid size configurable instead of hard-coded 2%.

**Current POC code** (`grid-calculations.ts:15-20`):
```typescript
export function getGridSize(canvas: HTMLElement): number {
  const canvasWidth = canvas.offsetWidth;
  return Math.round(canvasWidth * 0.02); // Hard-coded 2%
}
```

**New library code**:
```typescript
export interface GridConfig {
  gridSizePercent?: number;  // Default: 2
  minGridSize?: number;       // Default: 10px
  maxGridSize?: number;       // Default: 50px
}

export function getGridSize(canvas: HTMLElement, config: GridConfig = {}): number {
  const { gridSizePercent = 2, minGridSize = 10, maxGridSize = 50 } = config;
  const canvasWidth = canvas.offsetWidth;
  const size = Math.round(canvasWidth * (gridSizePercent / 100));
  return Math.max(minGridSize, Math.min(maxGridSize, size));
}
```

### 2.2 Services Layer (State Management)

**🔧 MODIFY** - Generalize to support custom component types:

| POC File | New Library Path | Changes Needed |
|----------|------------------|----------------|
| `src/services/state-manager.ts` | `src/services/state-manager.ts` | 🔧 Replace `ItemType` enum with generic string (see 2.2.1) |
| `src/services/undo-redo.ts` | `src/services/undo-redo.ts` | ✅ Command pattern is generic - copy as-is |

#### 2.2.1 State Manager Generalization

**What to remove**: Hard-coded `ItemType` enum.

**Current POC code** (`state-manager.ts:24-35`):
```typescript
export enum ItemType {
  Header = 'header',
  Text = 'text',
  Image = 'image',
  Button = 'button',
  Video = 'video',
  Gallery = 'gallery',
  Dashboard = 'dashboard',
  LiveData = 'livedata',
}
```

**New library code**: Remove enum, use `string` type and add batch operation support:
```typescript
export interface GridItem {
  id: string;
  canvasId: string;
  type: string;  // ✅ Generic - consumer defines types
  layouts: {
    desktop: ItemLayout;
    mobile: ItemLayout;
  };
  zIndex: number;
  config?: Record<string, any>;  // ✅ Generic config storage
}

/**
 * Add multiple items in a single batch
 * Single state update = single re-render
 */
export function addItemsBatch(items: Partial<GridItem>[]): string[] {
  const itemIds: string[] = [];
  const updates = { ...gridState.items };

  // Batch all additions into single state object
  for (const itemData of items) {
    const id = generateId();
    updates[id] = {
      id,
      canvasId: itemData.canvasId,
      type: itemData.type,
      layouts: itemData.layouts || getDefaultLayouts(itemData.size),
      zIndex: getNextZIndex(itemData.canvasId),
      config: itemData.config || {},
    };
    itemIds.push(id);
  }

  // Single state update triggers single re-render
  gridState.items = updates;

  // Single undo/redo command for entire batch
  undoRedoService.push(new BatchAddCommand(itemIds));

  return itemIds;
}

/**
 * Delete multiple items in a single batch
 */
export function deleteItemsBatch(itemIds: string[]): void {
  const updates = { ...gridState.items };

  for (const id of itemIds) {
    delete updates[id];
  }

  gridState.items = updates;
  undoRedoService.push(new BatchDeleteCommand(itemIds));
}
```

### 2.3 Components Layer

**🔧 MODIFY** - Make component types configurable:

| POC Component | New Library Path | Reusability |
|---------------|------------------|-------------|
| `grid-builder-app/` | **REPLACE** with `grid-builder/` | ❌ Too POC-specific - create new wrapper (see 2.3.1) |
| `canvas-section/` | `canvas-section/` | ✅ Copy with minimal changes (see 2.3.2) |
| `grid-item-wrapper/` | `grid-item-wrapper/` | 🔧 Generalize content rendering (see 2.3.3) |
| `config-panel/` | `config-panel/` | 🔧 Make form fields dynamic (see 2.3.4) |
| `component-palette/` | `component-palette/` | 🔧 Make component list configurable (see 2.3.5) |
| `component-header/` | **MOVE TO EXAMPLES** | ❌ POC-specific component type |
| `component-text-block/` | **MOVE TO EXAMPLES** | ❌ POC-specific component type |
| `component-image/` | **MOVE TO EXAMPLES** | ❌ POC-specific component type |
| `component-button/` | **MOVE TO EXAMPLES** | ❌ POC-specific component type |
| `component-video/` | **MOVE TO EXAMPLES** | ❌ POC-specific component type |
| `component-image-gallery/` | **MOVE TO EXAMPLES** | ❌ POC-specific component type |
| `component-dashboard-widget/` | **MOVE TO EXAMPLES** | ❌ POC-specific component type |
| `component-live-data/` | **MOVE TO EXAMPLES** | ❌ POC-specific component type |

#### 2.3.1 New Grid Builder Wrapper Component

**Create**: `src/components/grid-builder/grid-builder.tsx` (replaces `grid-builder-app`)

This is the **main public API** for the library.

```typescript
import { Component, Prop, h, State } from '@stencil/core';
import { ComponentDefinition } from '../../types/component-definition';
import { GridConfig } from '../../types/grid-config';
import { GridBuilderTheme } from '../../types/theme';

@Component({
  tag: 'grid-builder',
  styleUrl: 'grid-builder.scss',
  shadow: true,
})
export class GridBuilder {
  /**
   * Component definitions to make available in palette
   */
  @Prop() components: ComponentDefinition[] = [];

  /**
   * Grid configuration (size, snap behavior, etc.)
   */
  @Prop() gridConfig?: GridConfig;

  /**
   * Theme customization
   */
  @Prop() theme?: GridBuilderTheme;

  /**
   * Event: Component added to canvas
   */
  @Event() componentAdded: EventEmitter<{ itemId: string; type: string; canvasId: string }>;

  /**
   * Event: Component deleted
   */
  @Event() componentDeleted: EventEmitter<{ itemId: string }>;

  /**
   * Event: Component dragged
   */
  @Event() componentDragged: EventEmitter<{ itemId: string; position: { x: number; y: number } }>;

  render() {
    return (
      <Host>
        <div class="grid-builder-container">
          {/* Component Palette */}
          <component-palette components={this.components} />

          {/* Main Canvas */}
          <div class="canvas-area">
            {/* Controls */}
            <div class="controls">
              {/* Viewport toggle, undo/redo, etc. */}
            </div>

            {/* Canvas Sections */}
            <div class="canvases-container">
              {/* Render canvas sections */}
            </div>
          </div>

          {/* Config Panel */}
          <config-panel />
        </div>
      </Host>
    );
  }
}
```

#### 2.3.2 Canvas Section Component

**Reuse**: `src/components/canvas-section/canvas-section.tsx`

**Minor changes needed**:
1. Accept `gridConfig` prop (instead of hard-coded 2%)
2. Pass config to grid-calculations utilities

```typescript
@Prop() gridConfig?: GridConfig;

// In drag/resize handlers:
const gridSize = getGridSize(this.canvasElement, this.gridConfig);
```

#### 2.3.3 Grid Item Wrapper Component

**Current POC code** (`grid-item-wrapper.tsx:200-220` renders hard-coded component types):
```typescript
private renderComponentContent() {
  switch (this.item.type) {
    case ItemType.Header:
      return <component-header itemId={this.item.id} />;
    case ItemType.Text:
      return <component-text-block itemId={this.item.id} />;
    // ... etc
  }
}
```

**New library code**: Use dynamic component resolution with always-on virtual rendering:
```typescript
@Prop() componentRegistry: Map<string, ComponentDefinition>;
@State() isVisible: boolean = false;  // Tracked by IntersectionObserver

componentDidLoad() {
  const definition = this.componentRegistry.get(this.item.type);

  // Virtual rendering is ALWAYS enabled for all components
  // This provides massive performance benefits with negligible overhead
  virtualRenderer.observe(
    this.itemRef,
    this.item.id,
    (visible) => {
      this.isVisible = visible;

      // Call optional lifecycle hooks if defined
      if (visible && definition?.onVisible) {
        definition.onVisible(this.item.id, this.item.config);
      } else if (!visible && definition?.onHidden) {
        definition.onHidden(this.item.id);
      }
    }
  );
}

disconnectedCallback() {
  const definition = this.componentRegistry.get(this.item.type);

  // Unobserve all components
  virtualRenderer.unobserve(this.item.id);

  // Call final cleanup hook if defined
  if (definition?.onHidden) {
    definition.onHidden(this.item.id);
  }
}

private renderComponentContent() {
  const definition = this.componentRegistry.get(this.item.type);
  if (!definition) {
    return <div class="unknown-component">Unknown: {this.item.type}</div>;
  }

  // Show placeholder until component enters viewport (200px pre-render margin)
  if (!this.isVisible) {
    return (
      <div class="lazy-placeholder">
        <div class="spinner" />
        <p>Loading {definition.name}...</p>
      </div>
    );
  }

  // Call consumer's render function
  // Returns StencilJS component reference - StencilJS manages internal state
  return definition.render({
    itemId: this.item.id,
    config: this.item.config,
  });
}
```

**Why virtual rendering is always-on:**
- **Negligible overhead**: ~342 KB for 1000 components
- **Massive savings**: 15-60 MB saved for typical layouts
- **200px pre-render margin**: Components load BEFORE visible (no flash)
- **Benefits all components**: Simple components render fast anyway, complex ones get huge boost
- **No configuration needed**: Works automatically, no `isComplex` flag to manage

**Important Note**: StencilJS components with internal `@State` (like live data feeds with `setInterval`) will continue to update correctly even when wrapped, because StencilJS manages their internal state reactivity independently. The wrapper's render memoization only caches the **component reference**, not the rendered output.

**Why this works for live updates:**
- `definition.render()` returns a component **reference** like `<component-live-data itemId={...} />`
- StencilJS tracks that component's internal `@State` decorators independently
- When `component-live-data` updates `this.value` via `setInterval`, StencilJS re-renders **that component only**
- The wrapper doesn't need to re-render - it just holds the component reference

**Example: Live Data Component**
```typescript
@Component({ tag: 'component-live-data' })
export class ComponentLiveData {
  @State() value: number = 0;  // StencilJS tracks this

  componentDidLoad() {
    setInterval(() => {
      this.value = Math.random() * 100;  // ✅ Triggers re-render automatically
    }, 2000);
  }

  render() {
    return <div>{this.value}</div>;  // ✅ Updates every 2 seconds
  }
}

// Component definition (in library)
const liveDataComponent: ComponentDefinition = {
  type: 'livedata',
  render: ({ itemId, config }) => (
    <component-live-data itemId={itemId} config={config} />
    // ✅ This returns a reference, not rendered output
    // ✅ StencilJS manages component's internal state updates
  ),
};
```

#### 2.3.4 Config Panel Component

**Current POC code** (`config-panel.tsx:100-120` has hard-coded form):
```typescript
<input type="text" id="componentName" placeholder="Enter component name" />
```

**New library code**: Two approaches supported:

**Approach 1: Auto-generated forms (default)** - Library generates form from `configSchema`:
```typescript
@Prop() componentRegistry: Map<string, ComponentDefinition>;

private renderConfigFields() {
  const definition = this.componentRegistry.get(selectedItem.type);

  // Check if component has custom renderer
  if (definition?.renderConfigPanel) {
    return definition.renderConfigPanel({
      config: this.tempConfig,
      onChange: this.handleConfigChange,
      onSave: this.handleSave,
      onCancel: this.handleCancel,
    });
  }

  // Otherwise auto-generate from schema
  if (!definition?.configSchema) return null;

  return definition.configSchema.map(field => {
    switch (field.type) {
      case 'text':
        return <input type="text" {...field.props} />;
      case 'color':
        return <input type="color" {...field.props} />;
      case 'select':
        return <select {...field.props}>{field.options.map(opt => <option>{opt}</option>)}</select>;
      // etc
    }
  });
}
```

**Approach 2: Custom forms per component** - Component definition provides custom UI:
```typescript
// Example: Dashboard component with custom config wizard
const dashboardComponent: ComponentDefinition = {
  type: 'dashboard',
  name: 'Dashboard Widget',

  // Custom config panel instead of auto-generated form
  renderConfigPanel: ({ config, onChange, onSave, onCancel }) => (
    <div class="dashboard-config-wizard">
      <h3>Configure Dashboard</h3>

      {/* Step 1: Data Source */}
      <div class="config-step">
        <label>Data Source</label>
        <select
          value={config.dataSource}
          onChange={(e) => onChange('dataSource', e.target.value)}
        >
          <option value="sales">Sales Data</option>
          <option value="analytics">Analytics</option>
          <option value="custom">Custom API</option>
        </select>
      </div>

      {/* Step 2: Chart Type with Visual Picker */}
      <div class="config-step">
        <label>Chart Type</label>
        <div class="chart-picker">
          {['bar', 'line', 'pie'].map(type => (
            <div
              class={config.chartType === type ? 'selected' : ''}
              onClick={() => onChange('chartType', type)}
            >
              <img src={`/previews/${type}.png`} />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div class="actions">
        <button onClick={onCancel}>Cancel</button>
        <button class="primary" onClick={onSave}>Apply</button>
      </div>
    </div>
  ),

  render: ({ itemId, config }) => (
    <component-dashboard itemId={itemId} config={config} />
  ),
};
```

**Why support both?**
- **Auto-generated forms** are convenient for simple text/color/select fields
- **Custom forms** enable complex UIs like image uploaders, multi-step wizards, or visual pickers
- Component authors choose the appropriate approach per component type

#### 2.3.5 Component Palette Component

**Current POC code** (`component-palette.tsx:50-70` has hard-coded palette items):
```typescript
<div class="palette-item" data-component-type="header">📄 Header</div>
<div class="palette-item" data-component-type="text">📝 Text Block</div>
```

**New library code**: Render from `components` prop:
```typescript
@Prop() components: ComponentDefinition[] = [];

render() {
  return (
    <div class="palette">
      <h2>Components</h2>
      {this.components.map(comp => (
        <div
          class="palette-item"
          data-component-type={comp.type}
        >
          {comp.icon} {comp.name}
        </div>
      ))}
    </div>
  );
}
```

---

## Phase 3: Component Abstraction

### 3.1 Component Definition Interface

**Create**: `src/types/component-definition.ts`

```typescript
export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'checkbox';
  defaultValue?: any;
  options?: string[];  // For select fields
  validation?: (value: any) => boolean;
}

export interface ComponentDefinition {
  /**
   * Unique component type identifier
   */
  type: string;

  /**
   * Display name in palette
   */
  name: string;

  /**
   * Icon/emoji for palette (e.g., "📄")
   */
  icon: string;

  /**
   * Default size when added to canvas (grid units)
   */
  defaultSize: {
    width: number;
    height: number;
  };

  /**
   * Minimum allowed size (grid units)
   */
  minSize?: {
    width: number;
    height: number;
  };

  /**
   * Maximum allowed size (grid units)
   */
  maxSize?: {
    width: number;
    height: number;
  };

  /**
   * Render function - returns StencilJS component or HTMLElement
   *
   * @param props - Contains itemId and config
   */
  render: (props: { itemId: string; config?: Record<string, any> }) => any;

  /**
   * Configuration schema for auto-generated config panel
   * If renderConfigPanel is not provided, library generates form from this schema
   */
  configSchema?: ConfigField[];

  /**
   * Optional: Custom config panel renderer
   * If provided, this completely overrides the auto-generated form
   * Useful for complex configuration UIs (wizards, image uploaders, etc.)
   *
   * @param props.config - Current configuration values
   * @param props.onChange - Callback to update a config field
   * @param props.onSave - Callback to save changes
   * @param props.onCancel - Callback to cancel and discard changes
   * @returns Custom config panel UI
   */
  renderConfigPanel?: (props: {
    config: Record<string, any>;
    onChange: (fieldName: string, value: any) => void;
    onSave: () => void;
    onCancel: () => void;
  }) => any;

  /**
   * Validation function for placement
   *
   * @returns true if placement is valid
   */
  validatePlacement?: (canvasId: string, position: { x: number; y: number }) => boolean;

  /**
   * Validation function for resize
   *
   * @returns true if resize is valid
   */
  validateResize?: (newSize: { width: number; height: number }) => boolean;

  /**
   * Optional: Lifecycle hook called when component becomes visible
   *
   * Note: Virtual rendering is ALWAYS enabled for all components.
   * This hook is optional and useful for:
   * - Starting animations when component appears
   * - Beginning data fetching for live data feeds
   * - Initializing heavy resources (WebGL, video players)
   * - Tracking analytics (component viewed)
   *
   * @param itemId - The component's unique ID
   * @param config - The component's current configuration
   */
  onVisible?: (itemId: string, config: Record<string, any>) => void;

  /**
   * Optional: Lifecycle hook called when component leaves viewport
   *
   * Useful for:
   * - Pausing videos/animations to save resources
   * - Stopping data fetching/polling
   * - Cleaning up heavy resources
   * - Tracking analytics (component scrolled away)
   *
   * @param itemId - The component's unique ID
   */
  onHidden?: (itemId: string) => void;
}
```

### 3.2 Example Component Definitions

**Create**: `examples/component-definitions.tsx`

These are the POC component types, moved to examples to show consumers how to define their own.

```typescript
import { h } from '@stencil/core';
import { ComponentDefinition } from '../src/types/component-definition';

/**
 * Example: Header Component
 */
export const headerComponent: ComponentDefinition = {
  type: 'header',
  name: 'Header',
  icon: '📄',
  defaultSize: { width: 20, height: 6 },
  minSize: { width: 10, height: 4 },

  render: ({ itemId, config }) => (
    <component-header itemId={itemId} config={config} />
  ),

  configSchema: [
    {
      name: 'text',
      label: 'Header Text',
      type: 'text',
      defaultValue: 'New Header',
    },
    {
      name: 'level',
      label: 'Heading Level',
      type: 'select',
      options: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
      defaultValue: 'H1',
    },
  ],
};

/**
 * Example: Text Block Component
 */
export const textComponent: ComponentDefinition = {
  type: 'text',
  name: 'Text Block',
  icon: '📝',
  defaultSize: { width: 20, height: 10 },

  render: ({ itemId, config }) => (
    <component-text-block itemId={itemId} config={config} />
  ),

  configSchema: [
    {
      name: 'content',
      label: 'Text Content',
      type: 'text',
      defaultValue: 'Enter your text here...',
    },
  ],
};

/**
 * Example: Dashboard Component (with lifecycle hooks)
 */
export const dashboardComponent: ComponentDefinition = {
  type: 'dashboard',
  name: 'Dashboard Widget',
  icon: '📊',
  defaultSize: { width: 20, height: 15 },

  render: ({ itemId, config }) => (
    <component-dashboard itemId={itemId} config={config} />
  ),

  // Optional: Initialize charts when visible (virtual rendering is automatic)
  onVisible: (itemId, config) => {
    console.log(`Dashboard ${itemId} now visible, initializing charts...`);
    // Start chart rendering, data fetching, etc.
  },

  // Optional: Cleanup when hidden (pause resources, not destroy DOM)
  onHidden: (itemId) => {
    console.log(`Dashboard ${itemId} hidden, pausing updates...`);
    // Stop timers, pause animations, etc.
  },
};

// ... more component definitions
```

---

## Phase 4: Configuration API

### 4.1 Grid Configuration

**Create**: `src/types/grid-config.ts`

```typescript
export interface GridConfig {
  /**
   * Grid size as percentage of canvas width
   * @default 2
   */
  gridSizePercent?: number;

  /**
   * Minimum grid size in pixels
   * @default 10
   */
  minGridSize?: number;

  /**
   * Maximum grid size in pixels
   * @default 50
   */
  maxGridSize?: number;

  /**
   * Enable snap-to-grid
   * @default true
   */
  snapToGrid?: boolean;

  /**
   * Minimum item size (grid units)
   * @default { width: 5, height: 4 }
   */
  minItemSize?: {
    width: number;
    height: number;
  };

  /**
   * Show visual grid overlay
   * @default true
   */
  showGridLines?: boolean;
}
```

### 4.2 Theme Configuration

**Create**: `src/types/theme.ts`

```typescript
export interface GridBuilderTheme {
  /**
   * Primary accent color (used for selection, buttons, etc.)
   * @default '#007bff'
   */
  primaryColor?: string;

  /**
   * Palette background color
   * @default '#f5f5f5'
   */
  paletteBackground?: string;

  /**
   * Canvas background color
   * @default '#ffffff'
   */
  canvasBackground?: string;

  /**
   * Grid line color
   * @default 'rgba(0, 0, 0, 0.1)'
   */
  gridLineColor?: string;

  /**
   * Selection outline color
   * @default '#007bff'
   */
  selectionColor?: string;

  /**
   * Resize handle color
   * @default '#007bff'
   */
  resizeHandleColor?: string;

  /**
   * Font family
   * @default '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
   */
  fontFamily?: string;

  /**
   * Custom CSS properties (applied to :host)
   */
  customProperties?: Record<string, string>;
}
```

### 4.3 Event Callbacks

**Create**: `src/types/events.ts`

```typescript
export interface GridBuilderEvents {
  /**
   * Fired when component is added to canvas
   */
  onComponentAdded?: (event: {
    itemId: string;
    type: string;
    canvasId: string;
    position: { x: number; y: number };
  }) => void;

  /**
   * Fired when component starts dragging
   */
  onDragStart?: (event: { itemId: string }) => void;

  /**
   * Fired when component is dragged
   */
  onDragMove?: (event: {
    itemId: string;
    position: { x: number; y: number };
  }) => void;

  /**
   * Fired when component drag ends
   */
  onDragEnd?: (event: {
    itemId: string;
    finalPosition: { x: number; y: number };
  }) => void;

  /**
   * Fired when component resize starts
   */
  onResizeStart?: (event: { itemId: string }) => void;

  /**
   * Fired when component is resized
   */
  onResize?: (event: {
    itemId: string;
    size: { width: number; height: number };
  }) => void;

  /**
   * Fired when component resize ends
   */
  onResizeEnd?: (event: {
    itemId: string;
    finalSize: { width: number; height: number };
  }) => void;

  /**
   * Fired when component is deleted
   */
  onComponentDeleted?: (event: { itemId: string }) => void;

  /**
   * Fired when component config is changed
   */
  onConfigChanged?: (event: {
    itemId: string;
    config: Record<string, any>;
  }) => void;

  /**
   * Fired when canvas/section is added
   */
  onCanvasAdded?: (event: { canvasId: string }) => void;

  /**
   * Fired when canvas/section is deleted
   */
  onCanvasDeleted?: (event: { canvasId: string }) => void;

  /**
   * Fired on undo action
   */
  onUndo?: (event: { action: string }) => void;

  /**
   * Fired on redo action
   */
  onRedo?: (event: { action: string }) => void;
}
```

### 4.4 Grid Builder API Interface

**Create**: `src/types/api.ts`

```typescript
export interface GridBuilderAPI {
  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: any) => void): void;

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (data: any) => void): void;

  /**
   * Get current state
   */
  getState(): any;

  /**
   * Get all items
   */
  getItems(): GridItem[];

  /**
   * Get specific item
   */
  getItem(itemId: string): GridItem | null;

  /**
   * Programmatically add component
   */
  addComponent(type: string, canvasId: string, position?: { x: number; y: number }): string;

  /**
   * Programmatically delete component
   */
  deleteComponent(itemId: string): void;

  /**
   * Get canvas element reference
   */
  getCanvasElement(canvasId: string): HTMLElement | null;

  /**
   * Add multiple components in a single batch operation
   * More efficient than calling addComponent() in a loop
   *
   * @returns Array of created item IDs
   */
  addComponentsBatch(components: Array<{
    type: string;
    canvasId: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    config?: Record<string, any>;
  }>): string[];

  /**
   * Delete multiple components in a single batch
   */
  deleteComponentsBatch(itemIds: string[]): void;

  /**
   * Update multiple component configs in a single batch
   */
  updateConfigsBatch(updates: Array<{
    itemId: string;
    config: Record<string, any>;
  }>): void;
}
```

---

## Phase 5: Plugin System

### 5.1 Plugin Interface

**Create**: `src/types/plugin.ts`

```typescript
export interface GridBuilderPlugin {
  /**
   * Plugin name
   */
  name: string;

  /**
   * Plugin version
   */
  version?: string;

  /**
   * Initialize plugin
   * Called when grid-builder mounts
   *
   * @param api - Grid Builder API for interacting with the library
   */
  init(api: GridBuilderAPI): void;

  /**
   * Cleanup plugin resources
   * Called when grid-builder unmounts
   */
  destroy(): void;
}
```

### 5.2 Example Performance Monitor Plugin

**Move POC code to**: `examples/plugins/performance-monitor.ts`

```typescript
import { GridBuilderPlugin, GridBuilderAPI } from '../../src/types/plugin';

export class PerformanceMonitorPlugin implements GridBuilderPlugin {
  name = 'performance-monitor';
  version = '1.0.0';

  private api: GridBuilderAPI;
  private metrics = {
    dragOperations: [],
    resizeOperations: [],
    fps: 60,
  };

  init(api: GridBuilderAPI) {
    this.api = api;

    // Subscribe to drag events
    api.on('dragStart', this.onDragStart);
    api.on('dragEnd', this.onDragEnd);

    // Subscribe to resize events
    api.on('resizeStart', this.onResizeStart);
    api.on('resizeEnd', this.onResizeEnd);

    // Start FPS monitoring
    this.startFPSMonitoring();

    // Add performance UI
    this.renderPerformanceUI();
  }

  destroy() {
    this.api.off('dragStart', this.onDragStart);
    this.api.off('dragEnd', this.onDragEnd);
    this.api.off('resizeStart', this.onResizeStart);
    this.api.off('resizeEnd', this.onResizeEnd);
    this.stopFPSMonitoring();
    this.removePerformanceUI();
  }

  private onDragStart = (event) => {
    // Track drag performance
  };

  private onDragEnd = (event) => {
    // Calculate drag metrics
  };

  // ... rest of implementation from POC
}
```

### 5.3 Using Plugins

```typescript
import { PerformanceMonitorPlugin } from './examples/plugins/performance-monitor';

<grid-builder
  components={componentDefinitions}
  plugins={[new PerformanceMonitorPlugin()]}
/>
```

---

## Phase 6: Testing Strategy

### 6.1 Adapt Existing Tests

The POC has **206 passing unit tests** - most can be adapted for the new library.

**Tests to keep (with minimal changes)**:
- `drag-handler.spec.ts` ✅ (no changes - utils are framework-agnostic)
- `resize-handler.spec.ts` ✅ (no changes)
- `grid-calculations.spec.ts` 🔧 (update to test with config options)
- `virtual-rendering.spec.ts` ✅ (no changes)
- `dom-cache.spec.ts` ✅ (no changes)
- `undo-redo.spec.ts` ✅ (no changes - command pattern is generic)
- `canvas-section.spec.ts` 🔧 (update to use component definitions instead of hard-coded types)
- `grid-item-wrapper.spec.ts` 🔧 (update to test with custom component registry)

**Tests to remove**:
- `component-header.spec.ts` ❌ (move to examples - not part of library)
- `component-text-block.spec.ts` ❌ (move to examples)
- All other POC-specific component tests ❌

**New tests to add**:
- Plugin system tests
- Component registration tests
- Configuration API tests
- Event callback tests

---

## Phase 7: Performance Optimizations

This phase consolidates all performance-related features and best practices.

### 7.1 Stable Component Registry

#### Problem: Dynamic Component Registry Can Cause Re-renders

**Issue**: If `componentRegistry` is passed as a prop and recreated on each render, all grid items will re-render unnecessarily.

**Solution**: Keep registry stable and use memoization.

```typescript
// ❌ BAD: Creates new Map on every render
function MyApp() {
  const registry = new Map([
    ['header', headerDefinition],  // New map every render!
    ['text', textDefinition],
  ]);

  return <grid-builder componentRegistry={registry} />;
}

// ✅ GOOD: Stable reference
const COMPONENT_REGISTRY = new Map([
  ['header', headerDefinition],
  ['text', textDefinition],
]);

function MyApp() {
  return <grid-builder componentRegistry={COMPONENT_REGISTRY} />;
}
```

### 7.2 Batch Operations

#### Problem: Adding Components in a Loop

Adding components one-by-one triggers N state updates and N re-renders:

```typescript
// ❌ BAD: 100 state updates, 100 re-renders, 100 undo commands
for (let i = 0; i < 100; i++) {
  api.addComponent('header', 'canvas1');
}
```

#### Solution: Use Batch API Methods

See [Phase 4.4](#44-grid-builder-api-interface) for the batch API interface and [Phase 2.2.1](#221-state-manager-generalization) for implementation details in state-manager.ts.

#### Usage Example

```typescript
// ✅ GOOD: 1 state update, 1 re-render, 1 undo command
api.addComponentsBatch(
  Array.from({ length: 100 }, (_, i) => ({
    type: i % 2 === 0 ? 'header' : 'text',
    canvasId: 'canvas1',
    position: { x: (i % 10) * 5, y: Math.floor(i / 10) * 5 },
  }))
);
```

#### Stress Test Optimization

The POC already implements this correctly - document it:

```typescript
// Stress test button handler (from POC)
private handleStressTest = () => {
  const count = parseInt(this.stressTestInput.value);
  const components = [];

  // Prepare batch array
  for (let i = 0; i < count; i++) {
    components.push({
      type: this.getRandomComponentType(),
      canvasId: this.getRandomCanvas(),
      position: this.getRandomPosition(),
    });
  }

  // Add in single batch operation
  this.api.addComponentsBatch(components);
  // ✅ Efficient: 1 re-render for 1000 items
};
```

### 7.3 Virtual Rendering (Always Enabled)

The library uses IntersectionObserver to lazy-load **ALL** components only when they enter the viewport. This is **always enabled** with no configuration needed - providing massive performance benefits with negligible overhead.

#### How It Works

**From POC** (`virtual-rendering.ts`):
- IntersectionObserver watches **ALL** grid items (simple and complex)
- Components render only when entering viewport (with 200px pre-render margin)
- Once rendered, components **stay rendered** (no de-rendering on scroll away)
- Provides ~10× faster initial load for pages with 100+ items

**Why no de-rendering?**
- **Smooth scrolling**: No DOM removal = no reflow/repaint jank
- **Preserves state**: Component state (form inputs, video position) kept intact
- **Fast scroll-back**: Already rendered components don't need re-render
- **Browser optimized**: Modern browsers handle off-screen DOM efficiently
- **Simple implementation**: Less complexity, fewer edge cases

**For resource cleanup**, use `onHidden` hook instead:
```typescript
const videoComponent: ComponentDefinition = {
  type: 'video',

  onVisible: (itemId) => {
    const video = document.querySelector(`#video-${itemId}`);
    video?.play();  // Resume playback
  },

  onHidden: (itemId) => {
    const video = document.querySelector(`#video-${itemId}`);
    video?.pause();  // Pause but keep DOM
  },
};
```

See [Phase 3.1](#31-component-definition-interface) for the `onVisible` and `onHidden` lifecycle hooks in ComponentDefinition.

See [Phase 2.3.3](#233-grid-item-wrapper-component) for integration with grid-item-wrapper including IntersectionObserver setup and placeholder rendering.

#### Performance Impact

**Memory overhead** (IntersectionObserver + Map storage):

| Components | Overhead | Savings (typical) | Worth It? |
|------------|----------|-------------------|-----------|
| 10 | 3.4 KB | Minimal | ✅ Yes (no harm) |
| 100 | 34 KB | ~2-10 MB | ✅ Yes (decent win) |
| 1000 | 342 KB | ~15-60 MB | ✅ **Absolutely!** (huge win) |
| 10000 | 3.3 MB | ~150-600 MB | ✅ **Critical!** (prevents crash) |

**Performance metrics** (from POC testing):

| Scenario | Without Virtual Rendering | With Virtual Rendering | Improvement |
|----------|--------------------------|----------------------|-------------|
| Initial load (100 items, 30% complex) | 2-5 seconds | 200-500ms | **10× faster** |
| Memory usage (100 items) | ~50MB | ~25MB | **50% reduction** |
| Scroll performance | 30-45 FPS | 55-60 FPS | **Smoother** |
| Memory overhead | 0 KB | 34 KB | Negligible |

**Key insight**: Virtual rendering overhead is **0.3-3 MB** even at extreme scale, but saves **15-600 MB** depending on component complexity. That's a **50-200× return on memory investment**.

#### Using Lifecycle Hooks

Optional `onVisible` and `onHidden` hooks are useful for:

**onVisible** - When component enters viewport:
- Start animations/transitions
- Begin data fetching for live feeds
- Initialize heavy resources (WebGL, video)
- Track analytics (component viewed)

**onHidden** - When component leaves viewport:
- Pause videos/animations (save CPU)
- Stop data polling/WebSocket updates
- Clean up heavy resources
- Track analytics (scroll away)

---

## Phase 8: Pluggable UI Components

### 8.1 Config Panel Customization

The default config panel is a side panel, but consumers may want:
- Modal dialog
- Bottom sheet
- Inline editing
- Custom layout

Make the config panel **pluggable**.

#### UI Component Override Interface

**Create**: `src/types/ui-overrides.ts`

```typescript
export interface ConfigPanelProps {
  /**
   * Currently selected item (or null if none selected)
   */
  selectedItem: GridItem | null;

  /**
   * Component definition for selected item
   */
  componentDefinition: ComponentDefinition | null;

  /**
   * Current config values (for live preview)
   * This is temporary state - not yet committed to item
   */
  tempConfig: Record<string, any>;

  /**
   * Callback when config field changes
   * Updates tempConfig for live preview
   */
  onConfigChange: (fieldName: string, value: any) => void;

  /**
   * Callback when user confirms changes
   * Commits tempConfig to actual item
   */
  onSave: (finalConfig: Record<string, any>) => void;

  /**
   * Callback when user cancels changes
   * Discards tempConfig, item reverts to original config
   */
  onCancel: () => void;

  /**
   * Callback to close panel (after save or cancel)
   */
  onClose: () => void;
}

export interface UIComponentOverrides {
  /**
   * Custom config panel component
   * If not provided, uses built-in <config-panel> side panel
   */
  ConfigPanel?: (props: ConfigPanelProps) => any;

  /**
   * Custom component palette
   * If not provided, uses built-in <component-palette> sidebar
   */
  Palette?: (props: PaletteProps) => any;

  /**
   * Custom controls/toolbar
   * If not provided, uses built-in controls
   */
  Controls?: (props: ControlsProps) => any;
}
```

#### Using Custom Config Panel

```typescript
import { h } from '@stencil/core';
import { ConfigPanelProps } from '@lucidworks/stencil-grid-builder';

const ModalConfigPanel = (props: ConfigPanelProps) => {
  if (!props.selectedItem) return null;

  return (
    <div class="modal-overlay" onClick={props.onCancel}>
      <div class="modal-content" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Configure {props.componentDefinition.name}</h2>
          <button class="close-btn" onClick={props.onClose}>×</button>
        </div>

        <div class="modal-body">
          {/* Render form fields from schema */}
          {props.componentDefinition.configSchema?.map(field => (
            <div class="form-field">
              <label>{field.label}</label>
              <input
                type={field.type}
                value={props.tempConfig[field.name]}
                onInput={(e) => props.onConfigChange(field.name, (e.target as HTMLInputElement).value)}
              />
            </div>
          ))}
        </div>

        <div class="modal-footer">
          <button onClick={props.onCancel}>Cancel</button>
          <button class="primary" onClick={() => props.onSave(props.tempConfig)}>Save</button>
        </div>
      </div>
    </div>
  );
};

// Use custom modal
<grid-builder
  components={myComponents}
  uiOverrides={{
    ConfigPanel: ModalConfigPanel,
  }}
/>
```

#### State Management for Preview + Rollback

**Add to grid-builder component** (see Phase 2.3.1):

```typescript
export class GridBuilder {
  @State() selectedItemId: string | null = null;
  @State() tempConfig: Record<string, any> = {};
  @State() originalConfig: Record<string, any> = {};  // For rollback

  /**
   * User clicks on a grid item
   */
  private handleItemSelect = (itemId: string) => {
    const item = gridState.items[itemId];

    this.selectedItemId = itemId;
    this.tempConfig = { ...item.config };  // Clone for preview
    this.originalConfig = { ...item.config };  // Save for rollback
  };

  /**
   * User changes a config field (live preview)
   */
  private handleConfigChange = (fieldName: string, value: any) => {
    // Update temp config
    this.tempConfig = { ...this.tempConfig, [fieldName]: value };

    // Emit preview event (for advanced use cases)
    this.configPreviewed.emit({
      itemId: this.selectedItemId,
      tempConfig: this.tempConfig,
    });
  };

  /**
   * User saves config (commit changes)
   */
  private handleConfigSave = (finalConfig: Record<string, any>) => {
    // Update actual item with final config
    const updates = { ...gridState.items };
    updates[this.selectedItemId].config = finalConfig;
    gridState.items = updates;

    // Add to undo/redo
    undoRedoService.push(new ConfigChangeCommand(
      this.selectedItemId,
      this.originalConfig,
      finalConfig
    ));

    // Clear temp state
    this.selectedItemId = null;
    this.tempConfig = {};
    this.originalConfig = {};

    // Emit saved event
    this.configChanged.emit({
      itemId: this.selectedItemId,
      config: finalConfig,
    });
  };

  /**
   * User cancels config (rollback)
   */
  private handleConfigCancel = () => {
    // Discard temp config - item keeps original
    this.tempConfig = {};
    this.originalConfig = {};
    this.selectedItemId = null;

    // No state update needed - item never changed
  };

  render() {
    const ConfigPanelComponent = this.uiOverrides?.ConfigPanel || DefaultConfigPanel;
    const selectedItem = this.selectedItemId ? gridState.items[this.selectedItemId] : null;
    const definition = selectedItem ? this.componentRegistry.get(selectedItem.type) : null;

    return (
      <Host>
        {/* ... other UI */}

        <ConfigPanelComponent
          selectedItem={selectedItem}
          componentDefinition={definition}
          tempConfig={this.tempConfig}
          onConfigChange={this.handleConfigChange}
          onSave={this.handleConfigSave}
          onCancel={this.handleConfigCancel}
          onClose={() => { this.selectedItemId = null; }}
        />
      </Host>
    );
  }
}
```

#### Live Preview During Config

Grid items should render using `tempConfig` when selected:

```typescript
export class GridItemWrapper {
  private getEffectiveConfig() {
    // If this item is being configured, use temp config for preview
    if (gridBuilder.selectedItemId === this.item.id) {
      return gridBuilder.tempConfig;
    }

    // Otherwise use committed config
    return this.item.config;
  }

  private renderComponentContent() {
    const definition = this.componentRegistry.get(this.item.type);

    return definition.render({
      itemId: this.item.id,
      config: this.getEffectiveConfig(),  // ✅ Live preview
    });
  }
}
```

This provides **live preview** while editing config, with **instant rollback** on cancel.

---

## Example Usage

### Basic Example

```typescript
import { h } from '@stencil/core';
import { ComponentDefinition } from '@lucidworks/stencil-grid-builder';

// Define your component types
const myComponents: ComponentDefinition[] = [
  {
    type: 'my-header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 20, height: 6 },
    render: ({ itemId, config }) => (
      <div class="my-header">
        <h1>{config?.text || 'New Header'}</h1>
      </div>
    ),
    configSchema: [
      {
        name: 'text',
        label: 'Header Text',
        type: 'text',
        defaultValue: 'New Header',
      },
    ],
  },
  {
    type: 'my-text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 20, height: 10 },
    render: ({ itemId, config }) => (
      <div class="my-text">
        <p>{config?.content || 'Text content...'}</p>
      </div>
    ),
    configSchema: [
      {
        name: 'content',
        label: 'Content',
        type: 'text',
        defaultValue: 'Text content...',
      },
    ],
  },
];

// Use the library
function MyPageBuilder() {
  return (
    <grid-builder
      components={myComponents}
      gridConfig={{
        gridSizePercent: 2,
        snapToGrid: true,
        showGridLines: true,
      }}
      theme={{
        primaryColor: '#007bff',
        canvasBackground: '#ffffff',
      }}
      onComponentAdded={(e) => console.log('Component added:', e)}
      onDragEnd={(e) => console.log('Drag ended:', e)}
    />
  );
}
```

### Advanced Example with Plugins

```typescript
import { PerformanceMonitorPlugin } from './plugins/performance-monitor';
import { AutoSavePlugin } from './plugins/auto-save';

<grid-builder
  components={myComponents}
  gridConfig={{ gridSizePercent: 2 }}
  plugins={[
    new PerformanceMonitorPlugin(),
    new AutoSavePlugin({ interval: 5000 }), // Auto-save every 5 seconds
  ]}
  onComponentAdded={(e) => {
    // Custom logic
  }}
/>
```

### Custom Validation Example

```typescript
const restrictedComponent: ComponentDefinition = {
  type: 'restricted',
  name: 'Restricted Item',
  icon: '🔒',
  defaultSize: { width: 10, height: 10 },
  render: ({ itemId }) => <div>Restricted</div>,

  // Only allow in specific canvas
  validatePlacement: (canvasId, position) => {
    return canvasId === 'canvas1'; // Only allow in first section
  },

  // Only allow certain sizes
  validateResize: (newSize) => {
    return newSize.width <= 15 && newSize.height <= 15;
  },
};
```

---

## Summary

### What's Reusable from POC

**✅ Copy Directly (90% of code)**:
- All utils (`drag-handler`, `resize-handler`, `virtual-rendering`, `dom-cache`)
- Core components (`canvas-section`, `grid-item-wrapper`, `config-panel`, `component-palette`)
- Services (`undo-redo`)
- All performance optimizations
- 206 unit tests (with minor adaptations)

**🔧 Modify for Flexibility**:
- `grid-calculations.ts` - Add config options
- `state-manager.ts` - Remove hard-coded component types, add batch operations
- `grid-item-wrapper.tsx` - Dynamic component rendering with virtual rendering support
- `config-panel.tsx` - Dynamic form generation
- `component-palette.tsx` - Component list from props

**❌ Move to Examples**:
- All POC component types (Header, TextBlock, Image, etc.)
- Hard-coded UI layouts
- POC-specific styling

**➕ Add New**:
- `grid-builder` wrapper component (new main API)
- Type definitions (`ComponentDefinition`, `GridConfig`, `Theme`, `GridBuilderAPI`, etc.)
- Plugin system (`GridBuilderPlugin`, `GridBuilderAPI`)
- UI override system (`UIComponentOverrides`, `ConfigPanelProps`)
- Examples and documentation

### Key Architecture Decisions

1. **Component types are pluggable** - consumers define their own via `ComponentDefinition`
2. **Configurations are props** - grid size, theming, validation all configurable
3. **Performance tools are plugins** - not baked into core library
4. **State management is generic** - no assumptions about component types
5. **Event-driven API** - consumers hook into lifecycle via callbacks
6. **UI components are pluggable** - config panel, palette, controls can be customized

### Performance Optimizations Summary

**Stable Component Registry**:
- Keep `componentRegistry` reference stable to prevent unnecessary re-renders
- Use const declarations or useMemo for registry initialization

**Batch Operations**:
- Use `addComponentsBatch()` for bulk additions (1 re-render vs N re-renders)
- Use `deleteComponentsBatch()` for bulk deletions
- Use `updateConfigsBatch()` for bulk config updates
- Provides 10-100× performance improvement for large operations

**Virtual Rendering** (Always Enabled):
- **Automatic** for all components (no configuration needed)
- Components lazy-load when entering viewport (200px pre-render margin)
- Once rendered, components stay rendered (no de-rendering)
- Use `onVisible`/`onHidden` hooks for resource management (pause/resume)
- Provides 10× faster initial load and 50% memory reduction
- Negligible overhead (342 KB for 1000 components)

### UI Customization Summary

**Config Panel Override**:
- Replace default side panel with modal, bottom sheet, or custom UI
- Full control over rendering and styling
- Live preview support with temp state
- Instant rollback on cancel

**State Management**:
- Preview changes with `tempConfig` (doesn't affect actual item)
- Commit changes with `onSave` (updates item + adds to undo/redo)
- Rollback with `onCancel` (discards temp config)
- Live rendering updates during configuration

This extraction creates a **production-ready, performant, and highly customizable** internal StencilJS library suitable for any page/layout builder use case.
