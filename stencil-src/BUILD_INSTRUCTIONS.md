# StencilJS Variant - Build Instructions

## Current Status

✅ **Completed:**
- Project structure and configuration
- `package.json` with dependencies and lint scripts
- `stencil.config.ts` configured to output to `../stencil/`
- `tsconfig.json` TypeScript configuration
- All components fully implemented and tested:
  - `grid-builder-app` root component
  - `component-palette` component
  - `canvas-section` component
  - `grid-item-wrapper` component
  - `config-panel` component
- All services fully implemented and tested:
  - `state-manager` service
  - `undo-redo` service with command pattern
  - `undo-redo-commands` (Add, Update, Delete, Move)
- All vanilla JS utilities fully implemented:
  - `drag-handler.ts` (performance-critical drag operations)
  - `resize-handler.ts` (8-point resize with RAF batching)
  - `grid-calculations.ts` (pure coordinate conversion functions)
  - `virtual-rendering.ts` (lazy-loading with IntersectionObserver)
  - `dom-cache.ts` (DOM query optimization)
- Integration and wiring complete
- **153 comprehensive unit tests** (all passing)
- Linters configured (tslint, prettier, stylelint)
- Production builds verified

## Setup Steps

### 1. Install Dependencies

```bash
cd stencil-src
npm install
```

This will install:
- @stencil/core
- @stencil/store
- TypeScript
- Jest (testing)
- All dev dependencies

### 2. Start Development Server

```bash
npm start
```

This starts a dev server at http://localhost:3333 with hot reload.

### 3. Build for Production

```bash
npm run build
```

This compiles and creates two outputs:
- `../stencil/` - Web app for GitHub Pages
- `dist/` - Library distribution files

### 4. Run Linters

```bash
# Lint and auto-fix TypeScript files
npm run lint-ts:all

# Lint and auto-fix CSS files
npm run lint-css:all
```

Individual linting commands:
- `npm run prettier-ts-all` - Format TypeScript files
- `npm run tslint-all` - Lint TypeScript files
- `npm run prettier-css-all` - Format CSS files
- `npm run stylelint-all` - Lint CSS files

### 5. Run Tests

```bash
npm test
```

All 153 unit tests should pass.

## Implementation Reference Guide

This section documents how the project was implemented. All phases below are **completed**.

### Phase 1: Components (Completed)

#### A. canvas-section Component

**Location:** `src/components/canvas-section/`

**Responsibilities:**
- Render grid container for a section
- Display section header with background color picker
- Render all grid items for this section
- Initialize interact.js dropzone for palette items
- Handle section-level actions (clear, delete)

**Reference:** `virtual/index.js` lines 1671-1800 (canvas rendering)

**Key Features:**
- Props: `canvasId: string`
- State: Subscribe to `gridState.canvases[canvasId]`
- ComponentDidLoad: Initialize interact.js dropzone
- Render: Section header + grid container + grid items

#### B. grid-item-wrapper Component

**Location:** `src/components/grid-item-wrapper/`

**Responsibilities:**
- Lightweight wrapper for each grid item
- Render item content (header, body, controls)
- Initialize drag/resize handlers (vanilla JS)
- Handle selection state
- Manage resize handles visibility

**Reference:** `virtual/index.js` lines 318-430 (renderItem function)

**Key Features:**
- Props: `item: GridItem`
- ComponentDidLoad: Initialize `DragHandler` and `ResizeHandler`
- DisconnectedCallback: Cleanup handlers
- Render: Item structure with drag handle, content, controls, resize handles

#### C. config-panel Component

**Location:** `src/components/config-panel/`

**Responsibilities:**
- Side panel for component configuration
- Form for editing component name
- Z-index controls (to front, forward, backward, to back)
- Save/Cancel actions

**Reference:** `virtual/index.js` lines 1589-1650 (config panel logic)

**Key Features:**
- State: `visible: boolean`, `item: GridItem | null`
- Form inputs for component properties
- Z-index button handlers
- Save/cancel callbacks

#### D. performance-monitor-ui Component

**Location:** `src/components/performance-monitor-ui/`

**Responsibilities:**
- Port `shared/performance-monitor.js` to StencilJS
- Toggle button for visibility
- Performance metrics panel
- FPS tracking, operation timing
- Export data functionality

**Reference:** `shared/performance-monitor.js` (entire file)

**Key Features:**
- Props: `variantName: string`
- State: `visible: boolean`, `fps: number`, `stats: object`
- Integration with performance tracking
- UI panel with metrics

### Phase 2: Vanilla JS Utilities (Completed)

#### A. drag-handler.ts

**Location:** `src/utils/drag-handler.ts`

**Purpose:** Handle drag operations with direct DOM manipulation (performance-critical)

**Reference:** `virtual/index.js` lines 862-1122

**Key Exports:**
```typescript
export class DragHandler {
  constructor(element: HTMLElement, item: GridItem, onUpdate: (item: GridItem) => void)
  destroy(): void
}
```

**Features:**
- Uses interact.js for drag events
- Direct `element.style.transform` updates during drag
- Grid snapping logic
- Cross-canvas detection
- Calls `onUpdate` callback at end (triggers StencilJS re-render)

#### B. resize-handler.ts

**Location:** `src/utils/resize-handler.ts`

**Purpose:** Handle resize operations with RAF batching

**Reference:** `virtual/index.js` lines 1124-1320

**Key Exports:**
```typescript
export class ResizeHandler {
  constructor(element: HTMLElement, item: GridItem, onUpdate: (item: GridItem) => void)
  destroy(): void
}
```

**Features:**
- 8-point resize with interact.js
- RAF-based batching
- Grid snapping
- Min size enforcement
- Boundary constraints

#### C. grid-calculations.ts

**Location:** `src/utils/grid-calculations.ts`

**Purpose:** Pure functions for grid coordinate conversions

**Reference:** `virtual/index.js` lines 188-240

**Key Exports:**
```typescript
export function getGridSizeHorizontal(canvasId: string): number
export function getGridSizeVertical(): number
export function gridToPixelsX(gridUnits: number, canvasId: string): number
export function gridToPixelsY(gridUnits: number): number
export function pixelsToGridX(pixels: number, canvasId: string): number
export function pixelsToGridY(pixels: number): number
```

#### D. virtual-rendering.ts

**Location:** `src/utils/virtual-rendering.ts`

**Purpose:** Lazy-load complex components using IntersectionObserver

**Reference:** `virtual/index.js` lines 576-750

**Key Exports:**
```typescript
export class VirtualRenderer {
  constructor(rootElement: HTMLElement)
  observe(element: HTMLElement, itemId: string, itemType: string): void
  unobserve(itemId: string): void
  destroy(): void
}
```

**Features:**
- 200px pre-render margin
- Lazy-load gallery, dashboard, livedata
- Cleanup tracking

#### E. dom-cache.ts

**Location:** `src/utils/dom-cache.ts`

**Purpose:** Cache DOM queries for performance

**Reference:** `virtual/index.js` lines 54-82, 191-209

**Key Exports:**
```typescript
export class DOMCache {
  getCanvas(canvasId: string): HTMLElement | null
  invalidate(canvasId: string): void
  clear(): void
}
```

### Phase 3: Undo-Redo Service (Completed)

**Location:** `src/services/undo-redo.ts`

**Reference:** `virtual/index.js` lines 133-183

**Key Exports:**
```typescript
interface Command {
  undo(): void
  redo(): void
}

export function pushCommand(command: Command): void
export function undo(): void
export function redo(): void
export function canUndo(): boolean
export function canRedo(): boolean
```

**Features:**
- Command pattern
- Max 50 operations in history
- Integration with keyboard shortcuts

### Phase 4: Integration & Wiring (Completed)

1. **Component Integration**
   - `grid-item-wrapper` initializes `DragHandler` and `ResizeHandler`
   - Handlers call `onUpdate` callback at end
   - Callback updates `gridState` (triggers re-render)

2. **Undo/Redo Integration**
   - `grid-builder-app` subscribes to undo/redo state
   - Updates button disabled states
   - Keyboard shortcuts call undo/redo functions

3. **Virtual Rendering Integration**
   - `canvas-section` initializes `VirtualRenderer`
   - Observes all grid items
   - Lazy-loads complex components

4. **Performance Monitoring**
   - Instrument drag/resize in handlers
   - Call `perfMonitor.startOperation()` / `endOperation()`
   - Track all operations

### Phase 5: Testing (Completed)

Comprehensive unit tests created for:
- All components (`.spec.tsx` files)
- All services (`.spec.ts` files)
- All utilities (`.spec.ts` files)

**Total: 153 passing unit tests**

Run tests:
```bash
npm test
```

### Phase 6: Build & Linting (Completed)

1. **Linting setup:**
   - Installed prettier, tslint, stylelint (matching one-platform-external-ui)
   - Created config files: `.prettierrc.yaml`, `tslint.json`, `.stylelintrc.js`, `.prettierignore`
   - Added lint scripts to `package.json`

2. **Linting execution:**
   ```bash
   npm run lint-ts:all   # TypeScript linting and formatting
   npm run lint-css:all  # CSS linting and formatting
   ```

3. **Build:**
   ```bash
   npm run build
   ```

4. **Verify build outputs:**
   - **GitHub Pages app** in `../stencil/`:
     - `index.html` - Entry point
     - `build/` - Compiled bundles
     - `shared/` - Assets
   - **Library distribution** in `dist/`:
     - `dist/cjs/` - CommonJS modules
     - `dist/esm/` - ES modules
     - `dist/types/` - TypeScript definitions
     - `dist/collection/` - Component collection
     - `dist/grid-builder/` - Bundled output

## Reference Implementation

All implementation details can be found in the virtual variant:
- **File:** `virtual/index.js` (2,326 lines)
- **File:** `virtual/index.css` (styles)
- **File:** `shared/performance-monitor.js` (performance tracking)

## Key Differences from Virtual Variant

**StencilJS Components (30% of code):**
- Component structure
- Reactive state management
- Type safety
- Scoped styling

**Vanilla JS Utilities (70% of code):**
- Drag/resize handlers (performance-critical)
- Grid calculations (pure functions)
- Virtual rendering (IntersectionObserver)
- DOM caching (optimization)

**Benefits:**
- ✅ Better code organization
- ✅ Type safety (fewer runtime errors)
- ✅ Component reusability
- ✅ Scoped styling

**Trade-offs:**
- ⚠️ +40KB bundle size (StencilJS runtime)
- ⚠️ Slightly slower initial load (+100-200ms)
- ✅ Same drag/resize performance (kept vanilla JS)

## Development Timeline (Completed)

All phases have been completed:

- **Phase 1** (Components): ✅ Complete
- **Phase 2** (Utilities): ✅ Complete
- **Phase 3** (Undo/Redo): ✅ Complete
- **Phase 4** (Integration): ✅ Complete
- **Phase 5** (Testing): ✅ Complete - 153 unit tests passing
- **Phase 6** (Build/Linting): ✅ Complete - Production builds verified, linters configured

## Need Help?

- Reference the virtual variant implementation
- Check StencilJS docs: https://stenciljs.com/docs
- Check @stencil/store docs for state management
- Test incrementally (build after each component)

## Success Criteria

- ✅ All virtual variant features work
- ✅ Drag/resize performance <16ms
- ✅ Handles 500-2000+ items
- ✅ Unit tests pass
- ✅ Builds to `../stencil/`
- ✅ Deploys to GitHub Pages
