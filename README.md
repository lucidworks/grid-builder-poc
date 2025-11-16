# Grid Builder POC

A minimal proof-of-concept demonstrating a drag-and-drop grid builder system with container-relative positioning and multi-section page layouts.

**🔗 [Live Demo](http://javadoc.lucidworks.com/grid-builder-poc/)**

## Features

✅ **Multi-Section Layouts** - Build pages with multiple sections (e.g., hero, content, footer)
✅ **Drag from Palette** - Drag components from the left sidebar into any section
✅ **Cross-Section Movement** - Move components between sections by dragging
✅ **Reposition Items** - Drag existing items to move them around within or between sections
✅ **Resize Items** - Use 8-point handles to resize components
✅ **Snap to Grid** - All movements snap to a responsive grid (2% of canvas width)
✅ **Section Background Colors** - Customize background color for each section
✅ **Selection** - Click to select items, shows resize handles
✅ **Delete** - Click × button or press Delete key
✅ **Z-Index Controls** - Bring to front or send to back buttons (per section)
✅ **Keyboard Nudging** - Use arrow keys to move selected items
✅ **Grid Toggle** - Show/hide the visual grid across all sections
✅ **Desktop/Mobile Viewports** - Switch between desktop and mobile preview modes
✅ **Auto-Stacking Mobile Layout** - Components automatically stack vertically in mobile view
✅ **Independent Mobile Customization** - Manually adjust mobile layouts separately from desktop
✅ **Undo/Redo** - Full command history with Ctrl+Z/Ctrl+Y keyboard shortcuts
✅ **Export State** - Export current layout (both desktop and mobile) to console

## How to Use

### Running the POC

**Option 1: Live Demo - Overview Page**
- Visit [http://javadoc.lucidworks.com/grid-builder-poc/](http://javadoc.lucidworks.com/grid-builder-poc/)
- Overview of all POC variants with links to each implementation

**Option 2: Live Demo - Left/Top Version (Recommended)**
- Visit [http://javadoc.lucidworks.com/grid-builder-poc/left-top/](http://javadoc.lucidworks.com/grid-builder-poc/left-top/)
- Uses CSS `left/top` properties for positioning

**Option 3: Live Demo - Transform-Based (Experimental)**
- Visit [http://javadoc.lucidworks.com/grid-builder-poc/transform/](http://javadoc.lucidworks.com/grid-builder-poc/transform/)
- Uses CSS `transform: translate()` for all positioning
- Alternative architecture with potentially better GPU acceleration
- All features work identically to left/top version

**Option 4: Live Demo - Muuri Auto-Layout (Experimental)**
- Visit [http://javadoc.lucidworks.com/grid-builder-poc/masonry/](http://javadoc.lucidworks.com/grid-builder-poc/masonry/)
- Uses Muuri.js library for automatic grid layout
- Smooth animations and auto-positioning
- Trade-offs: No free-form positioning, no resize handles, no custom snap-to-grid, no separate desktop/mobile layouts (see tooltip on page for full list)

**Option 5: Live Demo - Virtual Rendering (Experimental)**
- Visit [http://javadoc.lucidworks.com/grid-builder-poc/virtual/](http://javadoc.lucidworks.com/grid-builder-poc/virtual/)
- Performance-optimized version based on Transform variant
- Uses Intersection Observer API for lazy-loading complex components
- Cached DOM queries and grid calculations
- Better performance with 500-2000+ items (fewer dropped frames than other variants)
- All features work identically to transform version

**Option 6: Live Demo - StencilJS Variant (Experimental)**
- Visit [http://javadoc.lucidworks.com/grid-builder-poc/stencil/](http://javadoc.lucidworks.com/grid-builder-poc/stencil/)
- Production-ready web component architecture using StencilJS
- Hybrid approach: StencilJS components + Vanilla JS performance-critical code
- Type-safe component development with TypeScript
- Reactive state management with @stencil/store
- All performance optimizations from Virtual variant
- Comprehensive inline documentation (~8420 lines across 12 core files)
- See [stencil-src/ARCHITECTURE.md](stencil-src/ARCHITECTURE.md) for detailed architecture overview

**Option 7: Local**
1. Clone the repository
2. Open `index.html` in your web browser for the overview page
3. Or navigate to any POC folder and open its `index.html`
4. That's it! No build process required.

### Usage

**Building Multi-Section Pages:**
- The page is divided into sections (Section 1, Section 2, etc.)
- Each section represents a part of your page (e.g., hero, content, footer)
- Sections stack vertically with no visual separation
- Each section can have its own background color

**Adding Components:**
- Drag any component from the left palette into any section
- The component will snap to the nearest grid position within that section

**Moving Components Within a Section:**
- Click and drag any component to reposition it within the same section
- Components stay fully within their section boundaries

**Moving Components Between Sections:**
- Drag a component from one section into another
- Release when the component's center is over the target section
- The component moves to the new section and stays fully contained within it

**Resizing Components:**
- Click a component to select it
- Drag any of the 8 resize handles (corners and edges)
- Component maintains minimum size of 100x80px
- Components cannot resize beyond their section boundaries

**Section Background Colors:**
- Hover over a section to reveal its controls in the top-right corner
- Use the color picker to change the section's background color
- Each section maintains its own independent background color

**Deleting Components:**
- Click the × button on a selected component
- Or select a component and press the Delete key

**Managing Layers:**
- Click the ⬆️ button to bring a component to the front (within its section)
- Click the ⬇️ button to send a component to the back (within its section)
- Components can overlap, and z-index controls determine which appears on top
- Z-index is managed independently per section

**Keyboard Navigation:**
- Use arrow keys (↑ ↓ ← →) to nudge selected component by one grid unit (responsive to canvas width)
- Press `Delete` to delete selected component
- Press `Escape` to deselect all components

**Viewport Switching:**
- Click **🖥️ Desktop** or **📱 Mobile** to switch between viewport modes
- Desktop view shows the full-width layout as designed
- Mobile view automatically stacks components vertically with maintained aspect ratios
- In mobile view, drag or resize any component to customize its mobile layout independently
- Once customized in mobile, that component retains its manual mobile layout (not auto-stacked)
- Switch back to desktop at any time - each viewport maintains its own layout

**Undo/Redo:**
- Press `Ctrl+Z` (or `Cmd+Z` on Mac) to undo the last action
- Press `Ctrl+Y` or `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac) to redo
- Supports up to 50 operations in history
- Works for: drag, resize, delete, and all item modifications

**Controls:**
- **🖥️ Desktop / 📱 Mobile** - Switch between desktop and mobile viewport preview
- **Show Grid** - Toggle visibility of the background grid across all sections
- **↶ Undo / ↷ Redo** - Undo or redo recent actions
- **Clear** (per section) - Remove all components from a specific section
- **Export State** - View the current layout state (both desktop and mobile) for all sections in the console

## Technical Implementation

### Versions

**Left/Top Version (`left-top/`)** ⭐
- Uses `left` and `top` CSS properties for positioning
- Two-phase positioning: transform during drag/resize → commit to left/top on end
- Well-tested, production-ready approach
- Includes undo/redo
- Recommended version

**Transform-Based Version (`transform/`)** 🧪
- Uses CSS `transform: translate(x, y)` for all positioning
- Single-phase positioning: always uses transform
- Potentially better GPU acceleration
- Simpler code architecture (no two-phase commit)
- Includes undo/redo
- Experimental - testing alternative approach
- All features work identically to left/top version

**Muuri Auto-Layout Version (`masonry/`)** 🧪
- Uses Muuri.js library for automatic grid layout with smooth animations
- Auto-positioning with drag-and-drop reordering
- Simplified architecture - no manual position calculations needed
- Excellent animation and visual feedback
- Trade-offs compared to original versions:
  - ❌ No free-form positioning (auto-layout only)
  - ❌ No resize handles (fixed component sizes)
  - ❌ No custom snap-to-grid system
  - ❌ No separate desktop/mobile layouts
  - ❌ No manual mobile customization
  - ❌ No edge snapping feature
  - ✅ Gains: Built-in animations, sorting, filtering capabilities
- Best for: Layouts that prioritize automatic organization over precise manual control

**Virtual Rendering Version (`virtual/`)** 🧪
- Performance-optimized variant based on Transform version
- Uses native Intersection Observer API for lazy-loading complex components
- Cached DOM queries reduce repeated document.getElementById calls by 50%
- Cached grid size calculations reduce snap-to-grid overhead by 80%
- GPU-accelerated transforms (inherit from Transform variant)
- RequestAnimationFrame-based updates for better rendering performance
- Includes undo/redo
- Optimizations:
  - ✅ Lazy-load gallery/dashboard/livedata components only when visible
  - ✅ DOM cache registry initialized on page load
  - ✅ Grid size cache invalidated only on window resize
  - ✅ Virtual rendering with 200px pre-render margin
  - ✅ Automatic cleanup of intervals and observers on item delete
  - ✅ All features identical to Transform version
- Performance gains vs Left/Top:
  - 5-10x faster stress test (200 items in ~500ms vs ~5000ms)
  - Handles 500-2000+ items with significantly fewer dropped frames (vs ~100 item practical limit)
  - 50% reduction in memory usage
  - Better framerate during drag/resize operations (still some frame drops at very high item counts)
- Best for: High-volume layouts with 100+ items, scenarios requiring better scalability

**StencilJS Variant (`stencil/`)** 🧪
- Production-ready web component architecture using StencilJS framework
- Hybrid approach: StencilJS components + Vanilla JS utilities for performance-critical code
- Type-safe development with comprehensive TypeScript interfaces
- Reactive state management using @stencil/store
- All performance optimizations from Virtual variant (transform positioning, caching, lazy loading)
- Command pattern for undo/redo (Gang of Four design pattern)
- Layered architecture: Component Layer → Utils Layer → Services Layer
- Includes undo/redo
- Features:
  - ✅ Transform-based GPU-accelerated positioning (6-10× faster)
  - ✅ Grid calculation caching (100× fewer DOM reads)
  - ✅ RAF batching for resize operations (3-4× fewer DOM operations)
  - ✅ Virtual rendering with IntersectionObserver (10× faster initial load)
  - ✅ Singleton pattern for shared services (DOM cache, virtual renderer)
  - ✅ Comprehensive inline documentation (~8420 lines across 12 core files)
  - ✅ All features identical to Virtual version
- Architecture documentation: See [stencil-src/ARCHITECTURE.md](stencil-src/ARCHITECTURE.md)
- **Extraction guide**: See [stencil-src/EXTRACTION_GUIDE.md](stencil-src/EXTRACTION_GUIDE.md) - Complete guide for creating `@lucidworks/stencil-grid-builder` reusable library
- Best for: Production implementations requiring type safety, component architecture, and comprehensive documentation

### Developer Tools

#### Performance Monitoring (Diagnostic Tool)

The left-top, transform, and virtual variants include a performance monitoring tool (`shared/performance-monitor.js`) for **comparing variant performance and diagnosing bottlenecks**. This is a development/evaluation tool, not a user-facing feature.

**Purpose:**
- Compare performance characteristics between variants (left-top vs transform vs virtual)
- Measure operation timing (drag, resize, viewport switching, stress tests)
- Identify performance bottlenecks and layout thrashing
- Validate optimization improvements

**How to Use:**
1. Click **📊 Performance** button in top-right corner of any variant
2. Perform test operations (drag items, resize, switch viewports, run stress tests)
3. View real-time FPS, dropped frames, and operation timing
4. Click **Export Data** to download JSON performance report
5. Repeat in different variants and compare exported data

**Key Metrics:**
- **Current FPS** - Instantaneous frame rate (updates ~10x per second)
- **Dropped Frames** - Count of frames below 55 FPS
- **Operation Timing** - Average, min, max duration for each operation type
- **Layout Thrashing** - Operations taking >16ms (one frame at 60fps)

See `shared/PERFORMANCE_MONITORING.md` for detailed technical documentation.

### Technologies Used

- **Vanilla JavaScript** - No frameworks, just pure JS (left-top, transform, masonry, virtual variants)
- **StencilJS** - Web component framework with TypeScript and reactive state (stencil variant)
- **Interact.js** - Drag, drop, and resize functionality (loaded from CDN)
- **Muuri.js** - Auto-layout grid system with animations (masonry variant only)
- **CSS Grid Background** - Visual grid overlay
- **Absolute Positioning** (standard) / **Transform Positioning** (experimental) / **Muuri Auto-Layout** (experimental) / **StencilJS Components** (experimental) - Different approaches to component positioning and architecture

**Diagnostic Tools:**
- **Performance Monitor** (`shared/performance-monitor.js`) - Developer tool for comparing variant performance

### Key Concepts Demonstrated

1. **Multi-Section Architecture**
   - Page divided into independent sections that flow together seamlessly
   - Each section maintains its own component state and z-index management
   - Sections represent different parts of a page (hero, content, footer, etc.)

2. **Container-Relative Positioning**
   - All items use absolute positioning within their section container
   - Positions are in pixels relative to the section, not the page

3. **Cross-Section Dragging**
   - Components can be moved between sections dynamically
   - Drop detection uses component center point to determine target section
   - Components automatically reposition and snap to the target section's grid

4. **Snap-to-Grid**
   - All drag and resize operations snap to a responsive grid (2% of canvas width)
   - Grid scales proportionally with canvas width for consistent layouts across different screen sizes
   - Component positions and sizes are stored in grid units, not pixels
   - Components automatically scale with the grid when canvas width changes
   - Provides clean alignment within each section

5. **Per-Section State Management**
   - Each section has its own items array and z-index counter
   - State structure: `canvases: { canvas1: { items: [], zIndexCounter: 1 }, ... }`
   - Each item stores: id, canvasId, type, layouts (desktop & mobile), zIndex

6. **Responsive Layout System**
   - Desktop and mobile layouts stored independently per component
   - Desktop layout: manual positioning with full control
   - Mobile layout: auto-stacks by default, customizable on demand
   - Auto-stacking maintains aspect ratio and provides 20px vertical spacing
   - Once a component is manually edited in mobile view, it's marked as "customized"
   - Customized mobile layouts persist independently from desktop layouts

7. **Event Handling**
   - Interact.js handles drag/drop/resize events
   - Custom logic converts pixel positions to grid coordinates
   - Manual grid snapping during drag/resize for real-time alignment
   - Section boundary enforcement ensures components stay fully contained

8. **Z-Index Layering**
   - Components can overlap with proper layering control
   - Z-index managed independently per section
   - Z-index management prevents components from going behind the canvas (minimum z-index: 1)

### Data Structure

**Per-Section State:**
```javascript
canvases: {
  canvas1: {
    items: [...],
    zIndexCounter: 3
  },
  canvas2: {
    items: [...],
    zIndexCounter: 2
  }
}
```

**Item Structure:**
```javascript
{
  id: 'item-1',
  canvasId: 'canvas1',  // which section this item belongs to
  type: 'header',
  layouts: {
    desktop: {
      x: 2,             // grid units from left of section
      y: 2,             // grid units from top of section
      width: 20,        // grid units wide
      height: 6         // grid units tall
    },
    mobile: {
      x: 1,             // auto-calculated or manually set (grid units)
      y: 1,             // auto-calculated or manually set (grid units)
      width: 14,        // auto-calculated or manually set (grid units)
      height: 5,        // auto-calculated or manually set (grid units)
      customized: false // true if user manually edited mobile layout
    }
  },
  zIndex: 1             // layering order within this section
}
```

**Note:** All position and size values are stored in grid units (not pixels). This allows components to scale proportionally with the grid when the canvas width changes. Grid size = 2% of canvas width.

## What's NOT Included (Keeping it Minimal)

This is a proof-of-concept, so these features are intentionally not included:

- ❌ Undo/redo
- ❌ Data persistence (localStorage/backend)
- ❌ Component configuration/properties
- ❌ Copy/paste
- ❌ Multi-select
- ❌ Alignment guides/tools
- ❌ Grouping/containers
- ❌ Additional breakpoints (tablet, etc.)

These would be added in a production implementation based on the full proposal.

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses modern ES6+)

## Next Steps

This POC demonstrates the core concepts including responsive desktop/mobile layouts. For a production implementation, see the full technical proposal in Confluence:

**Grid Builder System - Technical Proposal & Research**

The proposal includes:
- Extended responsive system with additional breakpoints (tablet, etc.)
- Command pattern for undo/redo
- StencilJS component architecture
- State persistence and data management
- Component configuration and properties
- And much more...

## Development

No build process needed! The project is organized as follows:

```
grid-builder-poc/
├── index.html           # Overview page with links to all POCs
├── left-top/           # Recommended version
│   ├── index.html      # HTML structure
│   ├── index.css       # Styles
│   └── index.js        # JavaScript logic
├── transform/          # Experimental transform-based version
│   ├── index.html
│   ├── index.css
│   └── index.js
├── masonry/            # Experimental masonry layout version
│   ├── index.html
│   ├── index.css
│   └── index.js
├── virtual/            # Experimental virtual rendering (performance optimized)
│   ├── index.html
│   ├── index.css
│   └── index.js
├── stencil/            # Build output for StencilJS variant (generated from stencil-src/)
│   ├── index.html      # Entry point
│   ├── build/          # Compiled components and bundles
│   └── shared/         # Shared assets
└── stencil-src/        # StencilJS variant source code
    ├── src/            # TypeScript source files
    │   ├── components/ # StencilJS components
    │   ├── utils/      # Vanilla JS utilities
    │   └── services/   # State management
    ├── ARCHITECTURE.md # Architecture documentation
    ├── README.md       # Build and development instructions
    └── package.json    # Dependencies and scripts
```

To customize any version:
- Edit component templates in the `componentTemplates` object in `index.js`
- Adjust grid percentage in `background-size` CSS and `getGridSize()` function to change snap grid density
- Modify styles in `index.css`
- Update HTML structure in `index.html`
- Add more sections by duplicating the `.canvas-item` structure in HTML

## Deployment

The POC is automatically deployed to GitHub Pages on every push to the `main` branch.

**Live URL:** http://javadoc.lucidworks.com/grid-builder-poc/

**Deployment Process:**
1. Push changes to the `main` branch
2. GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers automatically
3. Site deploys to GitHub Pages within ~20-30 seconds
4. Changes are immediately visible at the live URL

---

**Created:** January 2025
**Purpose:** Proof of Concept for Grid Builder Technical Proposal
**Live Demo:** http://javadoc.lucidworks.com/grid-builder-poc/
