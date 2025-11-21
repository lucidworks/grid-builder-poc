# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@lucidworks/stencil-grid-builder** - A production-ready StencilJS library providing two web components for responsive grid layouts:

- **`<grid-builder>`** - Full editing experience (150KB) with drag/drop, resize, undo/redo
- **`<grid-viewer>`** - Display-only mode (30KB) for rendering saved layouts

Built with StencilJS, TypeScript, and comprehensive performance optimizations (6-100× faster than baseline).

## Development Commands

### Setup
```bash
npm install
```

### Development
```bash
npm run start:demo      # Dev server with demo components (http://localhost:3333)
npm run start           # Dev server, library only (no demo components)
```

### Building
```bash
npm run build           # Production library build (dist/)
npm run build:demo      # Development build with demo components (www/)
```

The build creates two outputs:
- **dist/** - NPM distribution files (CJS, ESM, types, collection)
- **www/** - Demo web app (when using build:demo)

### Testing
```bash
npm test                # Run all 206 tests
npm run test:watch      # Watch mode
npm run test-unit       # Same as npm test

# Run specific test file
npm test -- grid-calculations.spec.ts

# Run tests matching pattern
npm test -- --testPathPattern=utils
```

### Linting & Formatting
```bash
npm run lint-ts:all     # Lint and format TypeScript (prettier + eslint)
npm run lint-css:all    # Lint and format SCSS (prettier + stylelint)

# Individual commands
npm run prettier-ts-all # Format TypeScript only
npm run eslint-all      # ESLint with auto-fix
npm run prettier-css-all # Format SCSS only
npm run stylelint-all   # Stylelint with auto-fix
```

### Storybook
```bash
npm run storybook       # Start Storybook dev server (port 6006)
npm run build-storybook # Build static Storybook output
```

### Component Generation
```bash
npm run generate        # Interactive component generator
```

## Architecture

### Layered Design

```
Component Layer (UI)
├── grid-builder.tsx        - Main builder component
├── grid-viewer.tsx         - Display-only viewer
├── canvas-section.tsx      - Dropzone canvas
├── grid-item-wrapper.tsx   - Item container
├── component-palette.tsx   - Draggable library
└── config-panel.tsx        - Settings UI

Utils Layer (Performance-critical code)
├── drag-handler.ts         - Drag & drop (30× faster than state-based)
├── resize-handler.ts       - 8-point resize with RAF batching
├── grid-calculations.ts    - Grid unit ↔ pixel conversions
└── dom-cache.ts           - DOM read caching (100× fewer reads)

Services Layer (State & business logic)
├── state-manager.ts        - Reactive state (@stencil/store)
├── undo-redo.ts           - Command pattern stack (Gang of Four)
├── undo-redo-commands.ts  - AddItem, DeleteItem, MoveItem commands
└── virtual-renderer.ts    - Lazy loading (10× faster initial load)
```

### Key Design Patterns

- **Component Layer**: StencilJS components handle UI rendering and user interactions
- **Utils Layer**: Vanilla JS utilities for performance-critical operations (drag/resize)
- **Services Layer**: State management, undo/redo, virtual rendering
- **Command Pattern**: Gang of Four pattern for undo/redo operations
- **Singleton Pattern**: Shared services (DOM cache, virtual renderer)
- **Observer Pattern**: IntersectionObserver for virtual rendering, @stencil/store for reactivity

### Performance Optimizations

| Optimization | Impact | Improvement |
|--------------|--------|-------------|
| Transform Positioning | Item drag/resize | 6-10× faster |
| Grid Caching | Viewport switch (100 items) | 100× fewer DOM reads |
| RAF Batching | Resize operations | 3-4× fewer DOM operations |
| Virtual Rendering | Initial load (100 items) | 10× faster |

## Code Style

### TypeScript Conventions

**Naming:**
- **PascalCase**: Classes, interfaces, types, StencilJS components
- **camelCase**: Variables, functions, properties, methods
- **kebab-case**: Component tag names, CSS classes, file names
- **UPPER_SNAKE_CASE**: Constants

**Import Order:**
```typescript
// 1. External libraries (alphabetically)
import { Component, h, Prop, State } from '@stencil/core';
import interact from 'interactjs';

// 2. Relative imports (alphabetically)
import { gridState } from '../../services/state-manager';
import { calculateGridPosition } from '../../utils/grid-calculations';
```

**Type Definitions:**
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, aliases
- Export all public types from `src/types/api.ts`

**Code Formatting:**
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multiline objects/arrays

### Component Structure

```typescript
import { Component, h, Prop, State, Watch } from '@stencil/core';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.scss',
  shadow: true
})
export class MyComponent {
  // 1. Props (inputs)
  @Prop() someProp: string;

  // 2. State (internal)
  @State() internalState: number = 0;

  // 3. Lifecycle methods
  componentWillLoad() {}
  componentDidLoad() {}

  // 4. Watchers
  @Watch('someProp')
  handlePropChange(newValue: string) {}

  // 5. Event handlers
  private handleClick = () => {};

  // 6. Render
  render() {
    return <div>Content</div>;
  }
}
```

### Testing Structure

```typescript
import { newSpecPage } from '@stencil/core/testing';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  it('should render', async () => {
    const page = await newSpecPage({
      components: [MyComponent],
      html: `<my-component></my-component>`
    });
    expect(page.root).toBeDefined();
  });

  it('should handle prop changes', async () => {
    const page = await newSpecPage({
      components: [MyComponent],
      html: `<my-component some-prop="initial"></my-component>`
    });

    // Update prop
    page.root.someProp = 'updated';
    await page.waitForChanges();

    // Assert
    expect(page.root.shadowRoot.textContent).toContain('updated');
  });
});
```

### SCSS/CSS Conventions

**BEM Naming:**
```scss
.component-name {
  // Block styles

  &__element {
    // Element styles
  }

  &--modifier {
    // Modifier styles
  }

  &__element--modifier {
    // Element with modifier
  }
}
```

**Component-Scoped Styles:**
- All styles are scoped via Shadow DOM
- Global styles go in `src/global/global.scss`
- Use CSS custom properties for theming

## Common Tasks

### Adding a New Component Type

1. **Define component in demo definitions:**
```typescript
// src/demo/component-definitions.tsx
export const componentDefinitions: ComponentDefinition[] = [
  {
    type: 'my-component',
    name: 'My Component',
    icon: '🆕',
    defaultLayout: { width: 10, height: 6 },
    render: (item: GridItem) => <div>My component</div>
  }
];
```

2. **Create standalone component (optional for complex components):**
```bash
npm run generate
# Follow prompts to create new component
```

3. **The component will automatically appear in the palette**

### Adding a New Undo/Redo Command

1. **Create command class:**
```typescript
// src/services/undo-redo-commands.ts
export class MyCommand implements Command {
  constructor(
    private before: any,
    private after: any,
    private description: string = 'My Action'
  ) {}

  execute(): void {
    this.redo();
  }

  undo(): void {
    // Restore 'before' state
    gridState.canvases = { ...this.before };
  }

  redo(): void {
    // Apply 'after' state
    gridState.canvases = { ...this.after };
  }

  getDescription(): string {
    return this.description;
  }
}
```

2. **Push to undo stack:**
```typescript
import { undoRedoManager } from '../../services/undo-redo';

const beforeState = JSON.parse(JSON.stringify(gridState.canvases));
// ... make changes ...
const afterState = JSON.parse(JSON.stringify(gridState.canvases));

undoRedoManager.push(new MyCommand(beforeState, afterState));
```

### Running Individual Tests

```bash
# Single file
npm test -- grid-calculations.spec.ts

# Pattern matching
npm test -- --testPathPattern=services

# Watch mode for specific file
npm run test:watch -- undo-redo.spec.ts

# Update snapshots
npm test -- -u
```

### Modifying Grid System

```typescript
// src/utils/grid-calculations.ts
export const GRID_CONFIG = {
  responsivePercentage: 2,  // 2% of canvas width
  fixedMinimumPx: 20        // Minimum 20px per grid unit
};

// Grid size = Math.max(
//   containerWidth * 0.02,  // 2% responsive
//   20                       // 20px minimum
// )
```

### Build Configuration

The `BUILD_DEMO` environment variable controls whether demo components are included:

```bash
# Library only (smaller bundle)
npm run build

# With demo components
BUILD_DEMO=true npm run build
# or
npm run build:demo
```

This is controlled in `stencil.config.ts`:
```typescript
excludeSrc: buildDemo ? [] : ['**/demo/**']
```

## Important Implementation Details

### State Management

**Global reactive state using @stencil/store:**
```typescript
import { createStore } from '@stencil/store';

const { state: gridState, onChange } = createStore({
  canvases: {},
  currentViewport: 'desktop',
  selectedItems: []
});

// Changes automatically trigger component re-renders
gridState.currentViewport = 'mobile';
```

### Undo/Redo System

**Command Pattern implementation:**
- Maximum 50 commands in history
- Each command captures before/after snapshots
- Supports: AddItem, DeleteItem, MoveItem, ResizeItem
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo)

**Performance consideration:**
- Deep clone state before/after: `JSON.parse(JSON.stringify(state))`
- Avoid pushing commands during drag (only on dragend)

### Virtual Rendering

**IntersectionObserver for lazy loading:**
```typescript
// Components render placeholder until visible
virtualRenderer.observe(element, itemId, (isVisible) => {
  if (isVisible) {
    // Render actual component
  } else {
    // Show placeholder
  }
});

// Cleanup on unmount
virtualRenderer.unobserve(element);
```

**Configuration:**
- 200px pre-render margin
- Only applies to complex components (gallery, dashboard, livedata)

### Grid Calculations

**All positions stored in grid units, not pixels:**
```typescript
// Grid unit → pixels
const pixels = gridUnits * getGridSize(containerElement);

// Pixels → grid units
const gridUnits = Math.round(pixels / getGridSize(containerElement));
```

**Hybrid grid system:**
- 2% of container width (responsive)
- Minimum 20px (prevents too-small grids on mobile)

### Transform-Based Positioning

**GPU-accelerated for performance:**
```typescript
// ✅ Fast (GPU-accelerated, compositing layer)
element.style.transform = `translate(${x}px, ${y}px)`;

// ❌ Slow (triggers layout reflow)
element.style.left = `${x}px`;
element.style.top = `${y}px`;
```

## Testing

### Test Runner Configuration

Uses **jest-jasmine2** to work around StencilJS CLI `--spec` flag bug:

```javascript
// jest.config.js
module.exports = {
  preset: '@stencil/core/testing',
  testRunner: 'jest-jasmine2',
  // ...
};
```

Run tests using `npm test`, **not** `stencil test --spec`.

### Test Coverage

- **206 comprehensive tests** across all layers
- Component tests use `newSpecPage`
- Utility tests use standard Jest assertions
- Service tests mock dependencies where needed

### Writing New Tests

```typescript
// Component test
it('should update position on drag', async () => {
  const page = await newSpecPage({
    components: [GridItemWrapper],
    html: `<grid-item-wrapper item-id="item-1"></grid-item-wrapper>`
  });

  // Simulate drag
  const element = page.root.shadowRoot.querySelector('.grid-item');
  // ... trigger drag handlers ...
  await page.waitForChanges();

  // Assert
  expect(page.root.style.transform).toContain('translate');
});
```

## File Reference

### Component Layer (~4070 lines of docs)

| File | Purpose |
|------|---------|
| grid-builder.tsx | Main builder component (editing mode) |
| grid-viewer.tsx | Display-only viewer component |
| canvas-section.tsx | Dropzone canvas with ResizeObserver |
| grid-item-wrapper.tsx | Item container with drag/resize |
| component-palette.tsx | Draggable component library |
| config-panel.tsx | Settings and controls UI |

### Utils Layer (~1400 lines of docs)

| File | Purpose |
|------|---------|
| drag-handler.ts | Interact.js drag & drop (30× faster) |
| resize-handler.ts | 8-point resize with RAF batching |
| grid-calculations.ts | Grid system and conversions |
| dom-cache.ts | DOM read caching (100× fewer reads) |

### Services Layer (~2950 lines of docs)

| File | Purpose |
|------|---------|
| state-manager.ts | Reactive global state (@stencil/store) |
| undo-redo.ts | Command pattern stack |
| undo-redo-commands.ts | Command implementations |
| virtual-renderer.ts | IntersectionObserver lazy loading |

**Total: ~8420 lines of comprehensive inline documentation**

Each file includes:
- Implementation details
- Performance considerations
- Design patterns used
- "Extracting This Pattern" guides for React/Vue/Angular/Svelte

## Browser Support

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (14+)
- **IE11**: ❌ Not supported (uses modern ES6+, Web Components)

## Publishing to NPM

The library is configured for NPM publishing:

```json
{
  "name": "@lucidworks/stencil-grid-builder",
  "version": "1.0.0",
  "main": "dist/index.cjs.js",
  "module": "dist/index.js",
  "types": "dist/types/index.d.ts"
}
```

Build outputs:
- **dist/index.cjs.js** - CommonJS entry
- **dist/index.js** - ES module entry
- **dist/types/** - TypeScript definitions
- **dist/collection/** - StencilJS collection metadata
- **loader/** - Lazy-loading scripts

## Additional Documentation

- **ARCHITECTURE.md** - System architecture, workflows, performance metrics (if exists in parent directory)
- **readme.md** files - Auto-generated component documentation (in each component directory)
- **Inline docs** - Comprehensive documentation in source files (~8420 lines)
