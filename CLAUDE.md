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
5. **stencil/** - Build output for production web components (deployed demo)
6. **grapesjs/** - Integration with GrapesJS framework
7. **gridstack/** - Integration with GridStack.js library
8. **moveable/** - Integration with Moveable.js library (recommended alternative to Muuri)

**The production-ready StencilJS library has been moved to its own standalone repository:**
**[stencil-grid-builder](https://github.com/lucidworks/stencil-grid-builder)** (separate repo)

For StencilJS library development, see the standalone repository.

## Build & Development Commands

### Vanilla JS Variants (left-top, transform, virtual, masonry)

These variants are **standalone HTML/CSS/JS files** with no build process:
- Simply open `index.html` in a browser
- Or use a local server: `python3 -m http.server 8000`

## Architecture

### StencilJS Library

For detailed architecture documentation of the production-ready StencilJS library, see the **[standalone repository](https://github.com/lucidworks/stencil-grid-builder)**.

Key features:
- Layered architecture (Component, Utils, Services layers)
- 1,149 comprehensive tests with 100% pass rate
- Performance optimizations (6-100× faster than baseline)
- Comprehensive inline documentation (~8,420 lines)

### POC Variants

The POC demonstrates different implementation approaches:

- **Vanilla JS variants** (left-top, transform, virtual, masonry) - Simple standalone HTML/CSS/JS files
- **Library integrations** (grapesjs, gridstack, moveable) - Integration examples with existing libraries
- **StencilJS demo** (stencil/) - Deployed build from the standalone library

All shared concepts (grid system, data structures, performance patterns) are documented in the [standalone StencilJS library repository](https://github.com/lucidworks/stencil-grid-builder).

## Important Notes

### GitHub Pages Deployment

**The project is deployed to a subdirectory, not the domain root.**

StencilJS generates absolute paths (`/build/app.js`) which fail in subdirectories. The workaround is already in place:

1. Build output goes to `../stencil/` directory
2. Paths are manually adjusted for subdirectory deployment
3. All build artifacts in `stencil/` are committed to git (no build step on GitHub Pages)

**Do NOT change the build output directory** without updating the GitHub Actions workflow.

### Variant Comparison

| Variant | Purpose | When to Use |
|---------|---------|-------------|
| left-top | Baseline (educational) | Understanding core concepts |
| transform | GPU acceleration test | Moderate performance needs |
| virtual | Performance-optimized | High-volume layouts (500+ items) |
| stencil | Production demo | See [standalone library](https://github.com/lucidworks/stencil-grid-builder) for source |
| masonry | Auto-layout experiment | Pinterest-style layouts |
| grapesjs | Framework integration | GrapesJS-based builders |
| gridstack | Alternative library | GridStack.js integration |
| moveable | Recommended alternative | Better than Muuri for free-form layouts |

**For production use**, see the [standalone StencilJS library](https://github.com/lucidworks/stencil-grid-builder) which includes comprehensive tests, TypeScript support, and performance optimizations.

## Documentation

- **README.md** - Project overview and usage guide
- **VARIANTS.md** - Comparison of all implementation variants
- **[StencilJS Library Documentation](https://github.com/lucidworks/stencil-grid-builder)** - Architecture, API reference, and development guides

## Browser Compatibility

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **IE11**: ❌ Not supported (uses modern ES6+)

## Git Workflow

**Branch**: `main`

**Deployment**: Automatic via GitHub Actions on push to main
- Build output in `stencil/` is committed to git (no build step on GitHub Pages)
- GitHub Pages serves from the `main` branch
- Changes are live within ~20-30 seconds

**When making changes:**
1. Test locally first (open `index.html` for vanilla JS variants)
2. For the stencil demo, update from the [standalone repository](https://github.com/lucidworks/stencil-grid-builder)
3. Commit changes (including build output if modified)
4. Push to main (auto-deploys to GitHub Pages)
