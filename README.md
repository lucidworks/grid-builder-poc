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
✅ **Export State** - Export current layout (both desktop and mobile) to console

## How to Use

### Running the POC

**Option 1: Live Demo**
- Visit [http://javadoc.lucidworks.com/grid-builder-poc/](http://javadoc.lucidworks.com/grid-builder-poc/)

**Option 2: Local**
1. Clone the repository
2. Open `index.html` in your web browser
3. That's it! No build process required.

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

**Controls:**
- **🖥️ Desktop / 📱 Mobile** - Switch between desktop and mobile viewport preview
- **Show Grid** - Toggle visibility of the background grid across all sections
- **Clear** (per section) - Remove all components from a specific section
- **Export State** - View the current layout state (both desktop and mobile) for all sections in the console

## Technical Implementation

### Technologies Used

- **Vanilla JavaScript** - No frameworks, just pure JS
- **Interact.js** - Drag, drop, and resize functionality (loaded from CDN)
- **CSS Grid Background** - Visual grid overlay
- **Absolute Positioning** - Container-relative positioning for grid items

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
      x: 40,            // pixels from left of section
      y: 40,            // pixels from top of section
      width: 300,       // pixels wide
      height: 100       // pixels tall
    },
    mobile: {
      x: 20,            // auto-calculated or manually set
      y: 20,            // auto-calculated or manually set
      width: 280,       // auto-calculated or manually set
      height: 93,       // auto-calculated or manually set
      customized: false // true if user manually edited mobile layout
    }
  },
  zIndex: 1             // layering order within this section
}
```

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

No build process needed! Just open `index.html` in a browser.

To customize:
- Edit component templates in the `componentTemplates` object
- Adjust grid percentage in `background-size` CSS and `getGridSize()` function to change snap grid density
- Modify styles in the `<style>` section
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
