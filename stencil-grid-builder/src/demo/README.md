# Grid Builder Demo Application

This folder contains demo/example code for the `@lucidworks/stencil-grid-builder` library. These files are **not included** in the production build of the library.

## Overview

This demo showcases a **complete blog layout builder** application, demonstrating how to integrate the grid-builder library into a real-world page builder scenario.

## What This Demo Shows

This is a comprehensive demonstration of the grid-builder library's capabilities. Each file is heavily commented to explain which library features are being used and why.

### Core Library Features Demonstrated

#### 1. **Component Definitions** (`component-definitions.tsx`)
Demonstrates how to define custom component types for the grid:
- **Default sizing**: Initial dimensions when dropped onto canvas
- **Size constraints**: Min/max width and height enforcement
- **Custom selection colors**: Color-coded outlines per component type
- **Custom palette items**: Branded appearance in component sidebar
- **Custom drag clones**: Realistic drag previews during placement
- **Config-driven rendering**: Dynamic component properties from grid state

#### 2. **Deletion Hook System** (`blog-app.tsx` + `confirmation-modal/`)
Shows the library's most powerful extensibility feature:
- **beforeDeleteHook prop**: Intercept component deletion requests
- **Promise-based approval**: Async confirmation workflows
- **Custom modals**: Use any modal library (Bootstrap, Material, etc.)
- **API integration**: Make server calls before deletion
- **Complete control**: Host app decides whether deletion proceeds

**Key Pattern**: Library provides hook infrastructure, host app provides UI/logic.

#### 3. **Grid Builder API** (`blog-app.tsx`)
Programmatic control of grid state:
- **State management**: `addCanvas()`, `removeCanvas()`, `undo()`, `redo()`
- **Query methods**: `canUndo()`, `canRedo()`, `getState()`
- **Event system**: Subscribe to `canvasAdded`, `canvasRemoved` events
- **State synchronization**: Keep host app metadata in sync with library state

#### 4. **Canvas Metadata Pattern** (`blog-app.tsx`)
Demonstrates separation of concerns:
- **Library owns**: Component placement, layouts, zIndex (grid logic)
- **Host app owns**: Canvas titles, colors, settings (presentation)
- **Synchronization**: Events keep both in sync (including undo/redo)

#### 5. **Initial State** (`blog-app.tsx`)
Pre-populate canvases with components:
- Define desktop and mobile layouts
- Configure component properties
- Set up multi-canvas pages

## File Structure

```
demo/
├── index.html                      # Entry point for demo app
├── component-definitions.tsx       # Component registry (★ START HERE)
├── README.md                       # This file
└── components/
    ├── blog-app/                   # Host application (★ MAIN DEMO)
    │   ├── blog-app.tsx            # Complete integration example
    │   └── blog-app.scss           # Custom styling
    ├── blog-header/                # Example: Header component
    ├── blog-article/               # Example: Article component
    ├── blog-button/                # Example: Button with custom rendering
    ├── confirmation-modal/         # Example: Deletion confirmation
    └── section-editor-panel/       # Example: Custom canvas settings UI
```

**Note**: No initialization script is needed. Stencil's lazy-loading system automatically loads and initializes components when they're used in the HTML.

## Quick Start Guide

### Running the Demo

```bash
# Development server with hot reload
npm run start:demo

# Or manually:
BUILD_DEMO=true npm run start
```

Then navigate to `http://localhost:3333`

### Understanding the Code

**Recommended reading order:**

1. **`component-definitions.tsx`** - Start here to understand component registration
2. **`blog-app.tsx`** - Main demo showing all library features integrated
3. **`confirmation-modal/`** - Example of deletion hook implementation
4. **Individual components** (`blog-header/`, etc.) - Content component examples

Each file has extensive inline comments explaining:
- **What library feature** is being used
- **Why** that feature exists
- **How** to use it in your own app
- **What** the host app is responsible for

## Key Patterns Explained

### Pattern 1: Deletion Hook with Modal

**Library provides:**
```typescript
// In grid-builder component
@Prop() beforeDeleteHook?: (context: DeletionHookContext) => boolean | Promise<boolean>;
```

**Host app provides:**
```typescript
// In your app
private handleBeforeDelete = (context: DeletionHookContext): Promise<boolean> => {
  return new Promise((resolve) => {
    // Show your custom modal (any modal library works)
    this.showModal({
      title: 'Delete?',
      onConfirm: () => resolve(true),  // Proceed
      onCancel: () => resolve(false)   // Cancel
    });
  });
};

// Pass to library
<grid-builder beforeDeleteHook={this.handleBeforeDelete} />
```

**Why this pattern:**
- Library stays UI-agnostic (no built-in modals)
- Host app uses their preferred modal library
- Supports async operations (API calls, confirmations)
- Backward compatible (no hook = immediate deletion)

### Pattern 2: Metadata Synchronization

**Library manages:**
- Component positions, sizes, layouts
- zIndex ordering
- Undo/redo history

**Host app manages:**
- Canvas titles, colors
- Custom settings, metadata

**Synchronization via events:**
```typescript
// Library fires event when canvas added
api.on('canvasAdded', (event) => {
  // Host app adds corresponding metadata
  this.canvasMetadata[event.canvasId] = {
    title: 'New Canvas',
    backgroundColor: '#ffffff'
  };
});

// Pass metadata back to library
<grid-builder canvasMetadata={this.canvasMetadata} />
```

**Why this pattern:**
- Clean separation of concerns
- Library focuses on grid logic
- Host app controls presentation
- Both support undo/redo seamlessly

### Pattern 3: Component Registry

**Define once, use everywhere:**
```typescript
const components: ComponentDefinition[] = [
  {
    type: 'header',
    defaultSize: { width: 50, height: 5 },
    render: ({ config }) => <my-header {...config} />
  }
];

<grid-builder components={components} />
```

**Library uses this for:**
- Component palette sidebar
- Drag-and-drop creation
- Dynamic component rendering
- Type-based customization

## Build Configuration

Demo files are excluded from production builds via `stencil.config.ts`:

```typescript
excludeSrc: buildDemo ? [] : ['**/demo/**']
```

This ensures demo code never ships in the published npm package.

## Using This Demo as a Template

This demo is designed to be copied and customized for your own use case:

1. **Copy `component-definitions.tsx`** - Replace with your component types
2. **Copy `blog-app.tsx`** - Use as skeleton for your host app
3. **Copy `confirmation-modal/`** (optional) - Or use your preferred modal library
4. **Replace content components** - Build your own header, article, etc.

All library patterns demonstrated here work for any use case (CMS, landing pages, email builders, etc.).

## Questions?

If any library feature is unclear, check the comments in these files:
- **Component registry**: `component-definitions.tsx:10-48`
- **Deletion hooks**: `blog-app.tsx:422-487`
- **API usage**: `blog-app.tsx:138-261`
- **Metadata pattern**: `blog-app.tsx:63-97`

The demo is intentionally over-commented to serve as documentation.
