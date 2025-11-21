# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Grid Builder POC** - a proof-of-concept for a drag-and-drop page builder system with multiple implementation variants. It demonstrates container-relative positioning, multi-section page layouts, and responsive desktop/mobile views.

**Live Demo:** http://javadoc.lucidworks.com/grid-builder-poc/

The project contains **7 different implementation variants**:
1. **left-top/** - Baseline using CSS `left/top` positioning (recommended for understanding core concepts)
2. **transform/** - GPU-accelerated using CSS `transform` positioning
3. **masonry/** - Auto-layout using Muuri.js library (Pinterest-style)
4. **virtual/** - Performance-optimized with virtual rendering (500-2000+ items)
5. **stencil/** - Build output for production web components (generated from stencil-grid-builder/)
6. **grapesjs/** - Integration with GrapesJS framework
7. **gridstack/** - Integration with GridStack.js library
8. **moveable/** - Integration with Moveable.js library (recommended alternative to Muuri)

The primary development work happens in **stencil-grid-builder/**, which is a production-ready StencilJS library.

## Build & Development Commands

### StencilJS Library (Primary Development - stencil-grid-builder/)

```bash
cd stencil-grid-builder

# Install dependencies
npm install

# Development server with hot reload
npm run start:demo      # With demo components
npm run start           # Library only

# Build
npm run build           # Production library build
npm run build:demo      # Development build with demo components

# Testing
npm test                # Run all tests (206 tests)
npm run test:watch      # Watch mode
npm run test-unit       # Unit tests only

# Linting & Formatting
npm run lint-ts:all     # Lint and format TypeScript
npm run lint-css:all    # Lint and format SCSS
npm run eslint-all      # ESLint with auto-fix
npm run prettier-ts-all # Format TypeScript
npm run stylelint-all   # Stylelint with auto-fix

# Storybook (Component Documentation)
npm run storybook       # Start Storybook dev server
npm run build-storybook # Build static Storybook

# Component Generation
npm run generate        # Generate new StencilJS component
```

### Testing Individual Components

```bash
# Run tests for a specific file
npm test -- grid-calculations.spec.ts

# Run tests matching a pattern
npm test -- --testPathPattern=utils

# Run tests in watch mode for a specific file
npm run test:watch -- grid-calculations.spec.ts
```

### Vanilla JS Variants (left-top, transform, virtual, masonry)

These variants are **standalone HTML/CSS/JS files** with no build process:
- Simply open `index.html` in a browser
- Or use a local server: `python3 -m http.server 8000`

## Architecture

### StencilJS Library Structure (stencil-grid-builder/)

The production library uses a **layered architecture**:

```
stencil-grid-builder/
├── src/
│   ├── components/          # StencilJS Components (UI layer)
│   │   ├── grid-builder/    # Main builder (editing mode)
│   │   ├── grid-viewer/     # Display-only viewer
│   │   ├── canvas-section/  # Canvas dropzone
│   │   ├── grid-item-wrapper/ # Item container
│   │   ├── component-palette/ # Draggable library
│   │   └── config-panel/    # Settings UI
│   ├── utils/              # Vanilla JS utilities (performance-critical)
│   │   ├── drag-handler.ts  # Drag & drop (30× faster than state-based)
│   │   ├── resize-handler.ts # 8-point resize with RAF batching
│   │   ├── grid-calculations.ts # Grid unit ↔ pixel conversions
│   │   └── dom-cache.ts     # DOM read caching (100× fewer reads)
│   ├── services/           # State management & business logic
│   │   ├── state-manager.ts # Reactive state (@stencil/store)
│   │   ├── undo-redo.ts     # Command pattern stack
│   │   ├── undo-redo-commands.ts # Command implementations
│   │   └── virtual-renderer.ts # Lazy loading (10× faster)
│   ├── types/              # TypeScript type definitions
│   └── demo/               # Demo components & app
├── .storybook/             # Storybook configuration
└── dist/                   # Build output (generated)
```

**Key Design Patterns:**
- **Component Layer**: UI rendering, user interactions, event coordination
- **Utils Layer**: Reusable logic for interactions and grid calculations
- **Services Layer**: Global state, undo/redo, performance optimizations
- **Command Pattern**: Gang of Four pattern for undo/redo
- **Singleton Pattern**: DOM cache, virtual renderer (shared services)
- **Observer Pattern**: IntersectionObserver for virtual rendering

### Performance Optimizations

The StencilJS variant inherits all Virtual variant optimizations:

| Optimization | Impact | Improvement |
|--------------|--------|-------------|
| Transform Positioning | Item drag/resize | 6-10× faster |
| Grid Caching | Viewport switch (100 items) | 100× fewer DOM reads |
| RAF Batching | Resize operations | 3-4× fewer DOM operations |
| Virtual Rendering | Initial load (100 items) | 10× faster |

**GPU-Accelerated Positioning:**
```typescript
// Uses transform instead of left/top
const style = {
  transform: `translate(${xPixels}px, ${yPixels}px)`,
  width: `${widthPixels}px`,
  height: `${heightPixels}px`
};
```

**Grid Calculation Caching:**
- Single DOM read per canvas instead of 100+ (with 100 items)
- Cache invalidated only on window resize
- Prevents layout thrashing

**Virtual Rendering:**
- IntersectionObserver renders components only when visible
- 200px pre-render margin
- Automatic cleanup on item delete

### Data Structures

**Per-Section State:**
```javascript
canvases: {
  canvas1: {
    items: [...],      // Array of grid items
    zIndexCounter: 3   // Current z-index counter
  }
}
```

**Item Structure:**
```javascript
{
  id: 'item-1',
  canvasId: 'canvas1',     // Which section this item belongs to
  type: 'header',          // Component type
  layouts: {
    desktop: {
      x: 2,                // Grid units from left
      y: 2,                // Grid units from top
      width: 20,           // Grid units wide
      height: 6            // Grid units tall
    },
    mobile: {
      x: 1,                // Auto-calculated or manually set
      y: 1,
      width: 14,
      height: 5,
      customized: false    // true if user manually edited mobile layout
    }
  },
  zIndex: 1                // Layering order within section
}
```

**Grid System:**
- All positions and sizes stored in **grid units** (not pixels)
- Grid size = 2% of canvas width
- Components scale proportionally when canvas resizes
- Hybrid grid: 2% responsive + 20px fixed minimum

## Code Style & Conventions

### StencilJS Components

**File Naming:**
- Component files: `component-name.tsx`
- Styles: `component-name.scss`
- Tests: `component-name.spec.tsx`
- Documentation: `readme.md` (auto-generated)

**Code Style:**
- **PascalCase**: Classes, interfaces, types
- **camelCase**: Variables, functions, properties
- **kebab-case**: Component tag names, CSS classes
- **2-space indentation**
- **Single quotes** for strings
- **Semicolons required**

**Import Ordering:**
1. External libraries (alphabetically ordered)
2. Relative imports (alphabetically ordered)

```typescript
// External
import { Component, h, Prop, State } from '@stencil/core';
import interact from 'interactjs';

// Relative
import { gridState } from '../../services/state-manager';
import { calculateGridPosition } from '../../utils/grid-calculations';
```

**Type Definitions:**
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and aliases
- Export all public types from `src/types/api.ts`

### Testing Conventions

**Test Structure:**
```typescript
describe('ComponentName', () => {
  it('should render correctly', async () => {
    const page = await newSpecPage({
      components: [ComponentName],
      html: `<component-name></component-name>`
    });
    expect(page.root).toBeDefined();
  });

  it('should handle user interaction', async () => {
    // Arrange
    const page = await newSpecPage({...});

    // Act
    await page.root.someMethod();
    await page.waitForChanges();

    // Assert
    expect(page.root.someProperty).toBe(expectedValue);
  });
});
```

**Testing Tools:**
- `newSpecPage`: For component unit tests
- `jest-jasmine2`: Test runner (works around StencilJS CLI --spec bug)
- Manual jest.config.js: Bypasses Stencil CLI issues

### CSS/SCSS Conventions

**BEM Naming:**
```scss
.component-name {
  &__element {
    // Element styles
  }

  &--modifier {
    // Modifier styles
  }
}
```

**Component-Scoped Styles:**
- All component styles are scoped (Shadow DOM)
- Global styles in `src/global/global.scss`
- Use CSS custom properties for theming

## Common Development Tasks

### Adding a New Component Type

1. Add template to `src/demo/component-definitions.tsx`:
```typescript
export const componentDefinitions: ComponentDefinition[] = [
  // ... existing definitions
  {
    type: 'my-new-component',
    name: 'My Component',
    icon: '🆕',
    defaultLayout: { width: 10, height: 6 },
    render: (item: GridItem) => (
      <div>My component content</div>
    )
  }
];
```

2. Create component file if needed (for complex components)
3. Add to component palette in `component-palette.tsx` (auto-populated from definitions)

### Adding a New Undo/Redo Command

1. Create command class in `src/services/undo-redo-commands.ts`:
```typescript
export class MyCommand implements Command {
  constructor(
    private before: any,
    private after: any
  ) {}

  execute(): void {
    // Apply 'after' state
    this.redo();
  }

  undo(): void {
    // Restore 'before' state
  }

  redo(): void {
    // Re-apply 'after' state
  }
}
```

2. Push to undo stack when action occurs:
```typescript
import { undoRedoManager } from '../../services/undo-redo';

undoRedoManager.push(new MyCommand(beforeState, afterState));
```

### Modifying the Grid System

Edit `src/utils/grid-calculations.ts`:
```typescript
export const GRID_CONFIG = {
  responsivePercentage: 2,  // 2% of canvas width
  fixedMinimumPx: 20        // Minimum 20px per grid unit
};
```

## Important Notes

### GitHub Pages Deployment

**The project is deployed to a subdirectory, not the domain root.**

StencilJS generates absolute paths (`/build/app.js`) which fail in subdirectories. The workaround is already in place:

1. Build output goes to `../stencil/` directory
2. Paths are manually adjusted for subdirectory deployment
3. All build artifacts in `stencil/` are committed to git (no build step on GitHub Pages)

**Do NOT change the build output directory** without updating the GitHub Actions workflow.

### Variant Differences

The 7 variants demonstrate different approaches:

| Variant | Purpose | When to Use |
|---------|---------|-------------|
| left-top | Baseline (educational) | Understanding core concepts |
| transform | GPU acceleration test | Moderate performance needs |
| virtual | Production-optimized | High-volume layouts (500+ items) |
| stencil-grid-builder | Production library | Type safety, component architecture |
| masonry | Auto-layout experiment | Pinterest-style layouts |
| grapesjs | Framework integration | GrapesJS-based builders |
| gridstack | Alternative library | GridStack.js integration |
| moveable | Recommended alternative | Better than Muuri for free-form layouts |

**Most code changes should happen in stencil-grid-builder/** - the other variants are experimental or demos.

### Undo/Redo Implementation

- Uses **Command Pattern** (Gang of Four)
- Maximum 50 commands in history
- Captures before/after snapshots for each operation
- Supports: AddItem, DeleteItem, MoveItem, ResizeItem commands
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo)

### State Management

- **Reactive state** using @stencil/store
- Changes to `gridState` automatically trigger component re-renders
- State structure mirrors the data structure above
- Batch updates for performance (stress tests, viewport switching)

## Documentation

### Architecture Documentation

**Primary documentation is in the code itself:**
- ~8420 lines of comprehensive inline documentation across 12 core files
- Each file has detailed "Extracting This Pattern" sections for React/Vue/Angular/Svelte

**High-level documentation:**
- `stencil-grid-builder/ARCHITECTURE.md` - Architecture overview with Mermaid diagrams
- `stencil-grid-builder/README.md` - Build and development instructions
- `VARIANTS.md` - Comparison of all implementation variants
- `README.md` - Project overview and usage guide

### Component Documentation

All components have auto-generated documentation:
- `readme.md` files in each component directory
- Generated by StencilJS from JSDoc comments
- Includes props, events, methods, and usage examples

## Browser Compatibility

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **IE11**: ❌ Not supported (uses modern ES6+)

## Git Workflow

**Branch**: `main`

**Deployment**: Automatic via GitHub Actions on push to main
- Builds are pre-compiled and committed (stencil-grid-builder/dist/, stencil/)
- GitHub Pages serves from the `main` branch
- Changes are live within ~20-30 seconds

**When making changes:**
1. Test locally first
2. Run tests: `npm test`
3. Run linting: `npm run lint-ts:all && npm run lint-css:all`
4. Commit changes (including build output if modified)
5. Push to main (auto-deploys to GitHub Pages)
