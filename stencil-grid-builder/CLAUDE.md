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
npm test                # Run all 874 tests
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
├── breakpoint-utils.ts     - Multi-breakpoint responsive utilities
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

### Multi-Breakpoint Responsive Layouts

**Support for multiple configurable breakpoints with flexible layout modes.**

The library extends the original 2-breakpoint system (desktop/mobile) to support any number of breakpoints with customizable layout behaviors. This enables responsive designs that adapt to tablets, large desktops, and custom viewport sizes.

#### Layout Modes

Three layout modes control how items are positioned at each breakpoint:

1. **`stack`** - Vertical auto-stacking (mobile-first)
   - Items automatically stack vertically at full width
   - Y-position calculated from cumulative heights of previous items
   - Width fixed at 50 grid units (100% width)
   - No manual positioning required

2. **`manual`** - Individual positioning (desktop-style)
   - Items positioned exactly as defined in their layout config
   - Full control over x, y, width, height
   - Requires explicit layout configuration

3. **`inherit`** - Inherit from another breakpoint
   - Uses layout from a different breakpoint via `inheritFrom` property
   - Reduces configuration effort (e.g., tablet inherits from desktop)
   - Layout resolution follows 4-level priority system

#### Configuration Examples

**2 breakpoints (default, backwards compatible):**
```typescript
<grid-builder
  breakpoints={{
    mobile: { minWidth: 0, layoutMode: 'stack' },
    desktop: { minWidth: 768, layoutMode: 'manual' }
  }}
/>
```

**3 breakpoints (mobile + tablet + desktop):**
```typescript
<grid-builder
  breakpoints={{
    mobile: { minWidth: 0, layoutMode: 'stack' },
    tablet: { minWidth: 768, layoutMode: 'inherit', inheritFrom: 'desktop' },
    desktop: { minWidth: 1024, layoutMode: 'manual' }
  }}
/>
```

**5 breakpoints (Bootstrap-style):**
```typescript
<grid-builder
  breakpoints={{
    xs: { minWidth: 0, layoutMode: 'stack' },
    sm: { minWidth: 576, layoutMode: 'stack' },
    md: { minWidth: 768, layoutMode: 'inherit', inheritFrom: 'xl' },
    lg: { minWidth: 992, layoutMode: 'inherit', inheritFrom: 'xl' },
    xl: { minWidth: 1200, layoutMode: 'manual' }
  }}
/>
```

**Simple format (min-width only):**
```typescript
// Automatically normalized to full BreakpointConfig
<grid-builder breakpoints={{ mobile: 0, desktop: 768 }} />
```

#### Layout Inheritance

Items can inherit layouts from other breakpoints using the `inheritFrom` property:

```typescript
// Breakpoint configuration
breakpoints: {
  mobile: { minWidth: 0, layoutMode: 'stack' },
  tablet: { minWidth: 768, layoutMode: 'inherit', inheritFrom: 'desktop' },
  desktop: { minWidth: 1024, layoutMode: 'manual' }
}

// Item layouts
layouts: {
  desktop: { x: 10, y: 20, width: 30, height: 40, customized: true },
  tablet: { x: null, y: null, width: null, height: null, customized: false }, // ← Inherits from desktop
  mobile: { x: 0, y: 0, width: 50, height: 40, customized: false } // ← Auto-stacked
}
```

**Result**: At tablet viewport, the item uses the desktop layout (x: 10, y: 20, width: 30, height: 40).

#### Layout Resolution Priority

When determining which layout to render, the system follows a 4-level priority:

1. **Customized layout** - Use the breakpoint's own layout if `customized: true`
2. **Inherit chain** - Follow `inheritFrom` chain to find a customized layout
3. **Nearest by width** - Use the closest customized breakpoint by min-width
4. **Fallback** - Use the largest manual breakpoint as last resort

**Implementation** (see `src/utils/breakpoint-utils.ts`):
```typescript
import { getEffectiveLayout } from '../../utils/breakpoint-utils';

const { layout, sourceBreakpoint } = getEffectiveLayout(item, 'tablet', breakpoints);
// Returns: { layout: { x: 10, y: 20, ... }, sourceBreakpoint: 'desktop' }
```

#### Container-Based Viewport Switching

Breakpoints are evaluated based on **container width**, not window viewport:

```typescript
// ResizeObserver monitors grid-builder container width
const targetViewport = getViewportForWidth(containerWidth, breakpoints);
// Returns: 'mobile' | 'tablet' | 'desktop' | ... (whichever breakpoint matches)
```

**Mobile-first algorithm**:
- Breakpoints sorted by `minWidth` (ascending)
- Largest matching `minWidth` wins
- Example: At 900px width with breakpoints [0, 768, 1024], returns 'tablet' (768 ≤ 900 < 1024)

**Why container-based**:
- Enables multiple grid-builder instances with different viewports on same page
- Side-by-side demos can show mobile/tablet/desktop simultaneously
- More flexible than window-based media queries

#### Auto-Stacking Algorithm

For breakpoints with `layoutMode: 'stack'`, items automatically stack vertically:

```typescript
import { calculateAutoStackLayout } from '../../utils/breakpoint-utils';

// Calculate stacked position for an item
const stackedLayout = calculateAutoStackLayout(item, allCanvasItems, sourceBreakpoint);
// Returns: { x: 0, y: cumulativeHeight, width: 50, height: itemHeight, customized: false }
```

**Algorithm**:
1. Find item's index in canvas items array
2. Sum heights of all previous items (index 0 to currentIndex - 1)
3. Set y-position to cumulative height
4. Set x: 0, width: 50 (full width), preserve height from source layout

**Example**:
```typescript
// Items with heights: [10, 8, 6]
// Item 0: y = 0
// Item 1: y = 10 (0 + 10)
// Item 2: y = 18 (0 + 10 + 8)
```

#### Storybook Demos

See comprehensive multi-breakpoint demos in Storybook:

```bash
npm run storybook
```

**Available stories**:
- **Default Demo** - 2 breakpoints (mobile + desktop), backwards compatible
- **Three Breakpoint Demo** - Mobile/tablet/desktop side-by-side comparison
- **Five Breakpoint Demo** - Bootstrap-style xs/sm/md/lg/xl breakpoints

**Demo helper functions** (see `src/demo/sample-layouts.ts`):
```typescript
import {
  create3BreakpointLayout,
  create5BreakpointLayout,
  BREAKPOINTS_3,
  BREAKPOINTS_5
} from './demo/sample-layouts';

// Use in your own demos
const items = create3BreakpointLayout();
```

#### Type Definitions

**Core types** (exported from `src/types/api.ts`):
```typescript
// Layout mode for a breakpoint
type LayoutMode = 'stack' | 'manual' | 'inherit';

// Breakpoint configuration
interface BreakpointDefinition {
  minWidth: number;           // Minimum container width (mobile-first)
  layoutMode?: LayoutMode;    // Default: 'manual'
  inheritFrom?: string;       // Breakpoint name to inherit from
}

// Full breakpoint config (record of breakpoint name → definition)
type BreakpointConfig = Record<string, BreakpointDefinition>;

// Item layout at a specific breakpoint
interface LayoutConfig {
  x: number | null;           // Grid units from left
  y: number | null;           // Grid units from top
  width: number | null;       // Grid units wide
  height: number | null;      // Grid units tall
  customized: boolean;        // true = manually set, false = auto-calculated
}

// Grid item with multi-breakpoint layouts
interface GridItem {
  id: string;
  canvasId: string;
  type: string;
  name: string;
  zIndex: number;
  layouts: Record<string, LayoutConfig>; // Dynamic breakpoint names
  config: Record<string, any>;
}
```

#### Backwards Compatibility

**Default configuration maintains existing behavior:**
```typescript
export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: { minWidth: 0, layoutMode: 'stack' },
  desktop: { minWidth: 768, layoutMode: 'manual' }
};
```

**All existing code continues to work**:
- 2-breakpoint grids render identically
- `currentViewport` type widened from `'desktop' | 'mobile'` to `string`
- GridItem.layouts changed from `{ desktop, mobile }` to `Record<string, LayoutConfig>`
- Type-safe with proper TypeScript definitions

#### Utility Functions

**Core utilities** (see `src/utils/breakpoint-utils.ts`, 46 unit tests):

```typescript
// Get viewport name for a container width
getViewportForWidth(width: number, breakpoints: BreakpointConfig): string

// Get effective layout for an item at a breakpoint (follows inheritance)
getEffectiveLayout(
  item: GridItem,
  breakpointName: string,
  breakpoints: BreakpointConfig
): { layout: LayoutConfig; sourceBreakpoint: string }

// Check if a breakpoint uses auto-stacking
shouldAutoStack(breakpointName: string, breakpoints: BreakpointConfig): boolean

// Calculate auto-stacked layout position
calculateAutoStackLayout(
  item: GridItem,
  canvasItems: GridItem[],
  sourceBreakpoint: string
): LayoutConfig

// Initialize layouts for a new item (all breakpoints)
initializeLayouts(
  breakpoints: BreakpointConfig,
  baseLayout: LayoutConfig
): Record<string, LayoutConfig>
```

**Usage example**:
```typescript
import {
  getViewportForWidth,
  getEffectiveLayout,
  initializeLayouts
} from './utils/breakpoint-utils';

// Detect viewport from container width
const viewport = getViewportForWidth(containerWidth, breakpoints);
// → 'mobile' | 'tablet' | 'desktop' | ...

// Get resolved layout (follows inheritance)
const { layout, sourceBreakpoint } = getEffectiveLayout(item, viewport, breakpoints);
// → { layout: { x: 10, y: 20, ... }, sourceBreakpoint: 'desktop' }

// Initialize layouts for new item
const layouts = initializeLayouts(breakpoints, { x: 10, y: 20, width: 30, height: 40, customized: true });
// → { desktop: { x: 10, ... }, mobile: { x: 0, y: 0, width: 50, ... }, ... }
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

- **874 comprehensive tests** across all layers
- Component tests use `newSpecPage`
- Utility tests use standard Jest assertions
- Service tests mock dependencies where needed
- Multi-breakpoint utilities: 46 unit tests in `breakpoint-utils.spec.ts`

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
| breakpoint-utils.ts | Multi-breakpoint responsive utilities (46 tests) |
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
