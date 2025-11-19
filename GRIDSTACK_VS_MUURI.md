# Gridstack.js vs Muuri.js Comparison

Both Gridstack and Muuri are JavaScript libraries for creating draggable grid layouts, but they have different philosophies and use cases.

## Similarities

### Core Functionality
- ✅ **Drag and drop** - Both support dragging items around
- ✅ **Resizing** - Both can resize items (Gridstack has 8-point handles, Muuri can be configured)
- ✅ **Grid-based layouts** - Both organize items in a grid structure
- ✅ **Responsive** - Both support responsive layouts
- ✅ **Save/load state** - Both can serialize and restore layouts
- ✅ **JavaScript API** - Both provide programmatic control
- ✅ **No dependencies** - Both are standalone libraries (modern versions)
- ✅ **Vanilla JS** - Both work without frameworks

## Key Differences

### Layout Philosophy

| Aspect | Gridstack.js | Muuri.js |
|--------|-------------|----------|
| **Layout Type** | Dashboard/Grid | Masonry/Pinterest |
| **Positioning** | Manual free positioning | Auto-layout with algorithms |
| **User Control** | Drag to specific position | Drag to reorder sequence |
| **Layout Algorithm** | Grid snapping | Bin-packing (First Fit) |
| **Empty Spaces** | Allowed (free positioning) | Automatically filled (masonry) |

### Gridstack.js - **Manual Positioning**

```javascript
// User drags item to exact position
grid.addWidget({
  x: 2,      // Column 2
  y: 3,      // Row 3
  w: 4,      // 4 columns wide
  h: 2       // 2 rows tall
});
```

**Result**: Item positioned exactly at column 2, row 3
**Use case**: Dashboards where precise positioning matters

### Muuri.js - **Auto-positioning**

```javascript
// User drags item, Muuri decides final position
grid.add(element);
// Muuri automatically calculates optimal position
```

**Result**: Item placed in next available space using bin-packing
**Use case**: Image galleries, Pinterest-style layouts

## Feature Comparison

| Feature | Gridstack | Muuri | Notes |
|---------|-----------|-------|-------|
| **Free positioning** | ✅ Yes | ❌ No | Gridstack: place anywhere; Muuri: auto-positions |
| **8-point resize** | ✅ Built-in | ⚠️ Configure | Gridstack has all handles by default |
| **Animations** | ⚠️ Basic | ✅ Advanced | Muuri has smooth, spring-based animations |
| **Filtering** | ❌ No | ✅ Yes | Muuri can filter/show/hide items |
| **Sorting** | ❌ No | ✅ Yes | Muuri can reorder based on criteria |
| **Drag between grids** | ✅ Yes | ✅ Yes | Both support multi-grid dragging |
| **Responsive breakpoints** | ✅ Yes | ⚠️ Manual | Gridstack has built-in column breakpoints |
| **Column system** | ✅ 1-12 cols | ❌ No | Gridstack uses column-based grid |
| **Pixel-based sizing** | ⚠️ Rows+Cols | ✅ Yes | Muuri uses actual pixel dimensions |
| **Touch support** | ✅ Yes | ✅ Yes | Both work on mobile |
| **TypeScript** | ✅ Yes | ⚠️ Community | Gridstack has official TypeScript support |

## Use Case Comparison

### When to Use Gridstack.js

**Best for:**
- ✅ **Dashboards** - Admin panels, analytics dashboards
- ✅ **Customizable workspaces** - User-configurable layouts
- ✅ **Widget systems** - Draggable/resizable widgets
- ✅ **Precise positioning** - Users need exact control
- ✅ **Grid-based designs** - 12-column grid systems
- ✅ **Responsive dashboards** - Different column counts per breakpoint

**Examples:**
- Google Analytics dashboard
- Jira board layouts
- WordPress Gutenberg-style editors
- Admin panel widgets
- Customizable portals

### When to Use Muuri.js

**Best for:**
- ✅ **Image galleries** - Pinterest-style photo grids
- ✅ **Product catalogs** - E-commerce product displays
- ✅ **Blog layouts** - Magazine-style article grids
- ✅ **Portfolio sites** - Project showcases
- ✅ **Filtering/sorting** - Dynamic content that needs to be filtered
- ✅ **Smooth animations** - Layouts where animation quality matters

**Examples:**
- Pinterest
- Unsplash photo grid
- Masonry blog layouts
- Dribbble portfolios
- E-commerce product grids

## Architecture Differences

### Gridstack.js Architecture

```
Grid Container (12 columns)
├── Widget 1: x=0, y=0, w=4, h=2
├── Widget 2: x=4, y=0, w=4, h=2
├── Widget 3: x=8, y=0, w=4, h=2
└── Widget 4: x=0, y=2, w=6, h=3
    └── (Empty space at x=6, y=2)  ← Allowed!
```

**Key**: Absolute positioning within grid, empty spaces OK

### Muuri.js Architecture

```
Grid Container (masonry)
├── Item 1 (positioned by algorithm)
├── Item 2 (fills next best spot)
├── Item 3 (optimally packed)
└── Item 4 (no empty spaces)
```

**Key**: Automatic bin-packing, minimal empty space

## Performance Comparison

| Metric | Gridstack | Muuri |
|--------|-----------|-------|
| **Bundle size** | ~60KB min | ~40KB min |
| **Animation performance** | Good | Excellent |
| **Large grids (100+ items)** | Good | Excellent |
| **Layout calculations** | Fast (grid-based) | Fast (cached) |
| **Mobile performance** | Good | Excellent |

## API Comparison

### Adding Items

**Gridstack:**
```javascript
grid.addWidget({
  x: 2, y: 3,           // Explicit position
  w: 4, h: 2,           // Explicit size
  content: '<div>Widget</div>'
});
```

**Muuri:**
```javascript
const item = document.createElement('div');
item.innerHTML = '<div>Item</div>';
grid.add(item);         // Auto-positioned
```

### Removing Items

**Gridstack:**
```javascript
grid.removeWidget(element);
```

**Muuri:**
```javascript
grid.remove(items, { removeElements: true });
```

### Responsive Behavior

**Gridstack:**
```javascript
grid.column(6);  // Switch to 6 columns (tablet)
grid.column(1);  // Switch to 1 column (mobile)
```

**Muuri:**
```javascript
// Manual: Refresh layout on resize
grid.refreshItems().layout();
```

## Integration with Stencil Grid Builder

### What Each Library Provides

**Gridstack provides ~30% of Stencil Grid Builder:**
- ✅ Drag/resize mechanics
- ✅ Grid positioning
- ✅ Multi-grid support
- ✅ Responsive breakpoints
- ❌ No desktop/mobile separate layouts
- ❌ No undo/redo
- ❌ No component registry

**Muuri provides ~20% of Stencil Grid Builder:**
- ✅ Drag mechanics (but auto-positions)
- ✅ Smooth animations
- ✅ Filtering/sorting
- ❌ No free positioning (biggest gap!)
- ❌ No resize handles
- ❌ No grid snapping
- ❌ No responsive breakpoints
- ❌ No undo/redo
- ❌ No component registry

## Why They're Similar

Both libraries solve the **"draggable grid layout"** problem, but:

1. **Gridstack** = Manual positioning (dashboard approach)
   - "I want this widget in column 3, row 2"
   - User has precise control

2. **Muuri** = Auto-positioning (masonry approach)
   - "Put this item somewhere optimal"
   - Algorithm has control

## Recommendation for Your Use Case

Based on the Stencil Grid Builder requirements:

### ❌ **Muuri is NOT a good fit**
- Missing critical feature: **free positioning**
- Auto-layout conflicts with page builder paradigm
- No resize handles by default
- No grid system

### ⚠️ **Gridstack is BETTER but still limited**
- Has free positioning ✅
- Has resize handles ✅
- Has grid system ✅
- Missing: Desktop/mobile separate layouts ❌
- Missing: Undo/redo ❌
- Missing: ~70% of features ❌

### ✅ **Continue with Stencil Grid Builder**
- You've already solved the hard problems
- Custom implementation gives you full control
- Better architectural fit for page builder use case
- Already has features neither library provides

## Conclusion

**Gridstack and Muuri are similar in:**
- Being drag-and-drop grid libraries
- Supporting responsive layouts
- Providing smooth interactions
- Being framework-agnostic

**But they differ fundamentally in:**
- **Positioning philosophy**: Manual (Gridstack) vs Auto (Muuri)
- **Use case**: Dashboards (Gridstack) vs Galleries (Muuri)
- **User control**: Precise (Gridstack) vs Algorithmic (Muuri)

**For Stencil Grid Builder:**
- Neither library is a complete solution
- Gridstack is closer (30% reusable) but still requires 70% custom work
- Muuri is even further (20% reusable) due to auto-positioning
- Your custom implementation is the right approach

---

**See also:** [GRIDSTACK_COMPARISON.md](./GRIDSTACK_COMPARISON.md) for detailed analysis of Gridstack vs Stencil Grid Builder
