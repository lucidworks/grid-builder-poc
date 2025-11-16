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
- [Example Usage](#example-usage)

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

**New library code**: Remove enum, use `string` type:
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

**New library code**: Use dynamic component resolution:
```typescript
@Prop() componentRegistry: Map<string, ComponentDefinition>;

private renderComponentContent() {
  const definition = this.componentRegistry.get(this.item.type);
  if (!definition) {
    return <div class="unknown-component">Unknown: {this.item.type}</div>;
  }

  // Call consumer's render function
  return definition.render({
    itemId: this.item.id,
    config: this.item.config,
  });
}
```

#### 2.3.4 Config Panel Component

**Current POC code** (`config-panel.tsx:100-120` has hard-coded form):
```typescript
<input type="text" id="componentName" placeholder="Enter component name" />
```

**New library code**: Generate form from component definition:
```typescript
@Prop() componentRegistry: Map<string, ComponentDefinition>;

private renderConfigFields() {
  const definition = this.componentRegistry.get(selectedItem.type);
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
   * Configuration schema for config panel
   */
  configSchema?: ConfigField[];

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
- `state-manager.ts` - Remove hard-coded component types
- `grid-item-wrapper.tsx` - Dynamic component rendering
- `config-panel.tsx` - Dynamic form generation
- `component-palette.tsx` - Component list from props

**❌ Move to Examples**:
- All POC component types (Header, TextBlock, Image, etc.)
- Hard-coded UI layouts
- POC-specific styling

**➕ Add New**:
- `grid-builder` wrapper component (new main API)
- Type definitions (`ComponentDefinition`, `GridConfig`, `Theme`, etc.)
- Plugin system (`GridBuilderPlugin`, `GridBuilderAPI`)
- Examples and documentation

### Key Architecture Decisions

1. **Component types are pluggable** - consumers define their own via `ComponentDefinition`
2. **Configurations are props** - grid size, theming, validation all configurable
3. **Performance tools are plugins** - not baked into core library
4. **State management is generic** - no assumptions about component types
5. **Event-driven API** - consumers hook into lifecycle via callbacks

This extraction creates a **production-ready, internal StencilJS library** that preserves all the POC's capabilities while making it flexible and reusable for any page/layout builder use case.
