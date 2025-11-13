# Grid Builder POC

A minimal proof-of-concept demonstrating a drag-and-drop grid builder system with container-relative positioning.

## Features

✅ **Drag from Palette** - Drag components from the left sidebar into the grid
✅ **Reposition Items** - Drag existing items to move them around
✅ **Resize Items** - Use 8-point handles to resize components
✅ **Snap to Grid** - All movements snap to a 20px grid
✅ **Selection** - Click to select items, shows resize handles
✅ **Delete** - Click × button or press Delete key
✅ **Z-Index Controls** - Bring to front or send to back buttons
✅ **Keyboard Nudging** - Use arrow keys to move selected items
✅ **Grid Toggle** - Show/hide the visual grid
✅ **Export State** - Export current layout to console

## How to Use

### Running the POC

1. Open `index.html` in your web browser
2. That's it! No build process required.

### Usage

**Adding Components:**
- Drag any component from the left palette into the grid area
- The component will snap to the nearest grid position

**Moving Components:**
- Click and drag any component to reposition it
- Release to place

**Resizing Components:**
- Click a component to select it
- Drag any of the 8 resize handles (corners and edges)
- Component maintains minimum size of 100x80px

**Deleting Components:**
- Click the × button on a selected component
- Or select a component and press the Delete key

**Managing Layers:**
- Click the ⬆️ button to bring a component to the front
- Click the ⬇️ button to send a component to the back
- Components can overlap, and z-index controls determine which appears on top

**Keyboard Navigation:**
- Use arrow keys (↑ ↓ ← →) to nudge selected component by 20px (one grid unit)
- Press `Delete` to delete selected component
- Press `Escape` to deselect all components

**Controls:**
- **Show Grid** - Toggle visibility of the background grid
- **Clear All** - Remove all components from the grid
- **Export State** - View the current grid state in the console

## Technical Implementation

### Technologies Used

- **Vanilla JavaScript** - No frameworks, just pure JS
- **Interact.js** - Drag, drop, and resize functionality (loaded from CDN)
- **CSS Grid Background** - Visual grid overlay
- **Absolute Positioning** - Container-relative positioning for grid items

### Key Concepts Demonstrated

1. **Container-Relative Positioning**
   - All items use absolute positioning within the grid container
   - Positions are in pixels relative to the container

2. **Snap-to-Grid**
   - All drag and resize operations snap to a 20px grid
   - Provides clean alignment

3. **State Management**
   - Simple array-based state (`items[]`)
   - Each item stores: id, type, x, y, width, height, zIndex

4. **Event Handling**
   - Interact.js handles drag/drop/resize events
   - Custom logic converts pixel positions to grid coordinates
   - Manual grid snapping during drag/resize for real-time alignment

5. **Z-Index Layering**
   - Components can overlap with proper layering control
   - Z-index management prevents components from going behind the canvas (minimum z-index: 1)

### Data Structure

```javascript
{
  id: 'item-1',
  type: 'header',
  x: 40,        // pixels from left
  y: 40,        // pixels from top
  width: 300,   // pixels wide
  height: 100,  // pixels tall
  zIndex: 1     // layering order (1 = back, higher = front)
}
```

## What's NOT Included (Keeping it Minimal)

This is a proof-of-concept, so these features are intentionally not included:

- ❌ Responsive/breakpoint switching
- ❌ Undo/redo
- ❌ Data persistence (localStorage/backend)
- ❌ Component configuration/properties
- ❌ Copy/paste
- ❌ Multi-select
- ❌ Alignment guides/tools
- ❌ Grouping/containers

These would be added in a production implementation based on the full proposal.

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses modern ES6+)

## Next Steps

This POC demonstrates the core concepts. For a production implementation, see the full technical proposal in Confluence:

**Grid Builder System - Technical Proposal & Research**

The proposal includes:
- Container-relative responsive system (desktop/mobile breakpoints)
- Command pattern for undo/redo
- Z-index layering management
- StencilJS component architecture
- State persistence
- And much more...

## Development

No build process needed! Just open `index.html` in a browser.

To customize:
- Edit component templates in the `componentTemplates` object
- Adjust `gridSize` variable to change snap grid
- Modify styles in the `<style>` section

---

**Created:** January 2025
**Purpose:** Proof of Concept for Grid Builder Technical Proposal
