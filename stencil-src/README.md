# Grid Builder - StencilJS Variant (Source)

This directory contains the source code for the StencilJS variant of the grid builder POC.

## Setup

```bash
cd stencil-src
npm install
```

## Development

Start the dev server with hot reload:

```bash
npm start
```

This will start a dev server at http://localhost:3333 and watch for changes.

## Build

Build the production version:

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle components
- Generate TypeScript type definitions
- Create two output builds:
  - `../stencil/` - Web app for GitHub Pages (with index.html)
  - `dist/` - Library distribution files (for npm)

## Testing

Run unit tests (153 comprehensive tests):

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test.watch
```

## Linting

Lint TypeScript files:

```bash
npm run lint-ts:all
```

Lint CSS files:

```bash
npm run lint-css:all
```

Individual linting commands:
- `npm run prettier-ts-all` - Format TypeScript files
- `npm run tslint-all` - Lint TypeScript files with auto-fix
- `npm run prettier-css-all` - Format CSS files
- `npm run stylelint-all` - Lint CSS files with auto-fix

## Project Structure

```
stencil-src/
├── src/
│   ├── components/          # StencilJS components
│   │   ├── grid-builder-app/
│   │   ├── canvas-section/
│   │   ├── component-palette/
│   │   ├── grid-item-wrapper/
│   │   ├── config-panel/
│   │   └── performance-monitor-ui/
│   ├── utils/              # Vanilla JS utilities (performance-critical)
│   │   ├── drag-handler.ts
│   │   ├── resize-handler.ts
│   │   ├── grid-calculations.ts
│   │   ├── virtual-rendering.ts
│   │   └── dom-cache.ts
│   ├── services/           # State management and business logic
│   │   ├── state-manager.ts
│   │   └── undo-redo.ts
│   └── index.html          # App entry point
├── stencil.config.ts       # StencilJS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Build Output

The build process creates **two** outputs:

### 1. Web App (for GitHub Pages)
**Location:** `../stencil/`
- `index.html` - Entry point
- `build/` - Compiled JavaScript and CSS bundles
- `shared/` - Shared assets

This is what GitHub Pages serves.

### 2. Library Distribution (for npm)
**Location:** `dist/`
- `dist/cjs/` - CommonJS modules
- `dist/esm/` - ES modules
- `dist/types/` - TypeScript type definitions
- `dist/collection/` - Component collection metadata
- `dist/grid-builder/` - Bundled output

This workspace (`stencil-src/`) is for development only. The build artifacts are generated from the source code.

## Architecture

This variant uses a **hybrid approach** for optimal performance:

- **StencilJS Components** - UI structure, state management, reactive updates
- **Vanilla JS Utilities** - Performance-critical code (drag/resize handlers)

This ensures we get the benefits of StencilJS (component architecture, type safety, reactive updates) while maintaining the performance of the virtual variant for drag/resize operations.

## Documentation

For a comprehensive overview of the system architecture, component interactions, and performance optimizations, see:

**📖 [ARCHITECTURE.md](ARCHITECTURE.md)** - High-level architecture overview with:
- System architecture diagrams (Mermaid)
- Component layer dependencies
- Key workflows (sequence diagrams)
- Performance optimizations and metrics
- Design patterns used
- File reference with line counts

All 12 core files have comprehensive inline documentation (~8420 lines total) covering implementation details, design decisions, and extraction guides for other frameworks.
