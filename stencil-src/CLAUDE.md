# Grid Builder StencilJS - Build Commands

## Build Commands
- Build for development: `npm run build`
- **Build for GitHub Pages: `npm run build:gh-pages`** (includes path fix)
- Start dev server: `npm run start`
- Run tests: `npm run test-unit`
- Lint TypeScript: `npm run lint-ts:all`
- Lint CSS: `npm run lint-css:all`
- Fix paths (standalone): `npm run fix-paths`

## Important: GitHub Pages Deployment

The project is deployed to GitHub Pages at a **subdirectory** (`/grid-builder-poc/stencil/`), not the domain root.

### Path Issue
StencilJS generates absolute paths in index.html (e.g., `/build/app.js`), which work fine when served from the domain root but fail when deployed to a subdirectory because browsers look for files at the wrong location.

### Solution
**Always use `npm run build:gh-pages`** instead of `npm run build` when building for GitHub Pages deployment.

This runs two steps:
1. `npm run build` - Standard StencilJS build
2. `npm run fix-paths` - Converts absolute paths to relative paths in the generated index.html

The `fix-paths` script converts:
- `/build/...` → `./build/...`
- `/shared/...` → `./shared/...`
- `data-resources-url="/build/"` → `data-resources-url="./build/"`

### Configuration Notes
- `stencil.config.ts` has `baseUrl: '.'` configured, but StencilJS still generates absolute paths
- The `fix-paths` script is the workaround until StencilJS provides native support for relative paths
- All build output in `../stencil/` directory must be committed to git for GitHub Pages (no build step on deployment)

## Code Style
- Use PascalCase for classes/interfaces, camelCase for variables/functions
- 2-space indentation
- Import ordering: external libs first (alpha ordered), then relative imports (alpha ordered)
- Type definitions: prefer interfaces over types
- Tests: describe/it pattern, use newSpecPage for component testing
- CSS: component-scoped SCSS with BEM naming convention
