# Better Library Options for Page Builders

After discovering that Gridstack.js and Muuri.js are incompatible with page builder requirements (no overlap, row-based positioning), here are libraries that **actually support** the key features needed:

## Key Requirements

✅ **Free positioning** - Not grid/row-based
✅ **Overlap support** - Items can layer with z-index control
✅ **Pixel-based positioning** - Both horizontal and vertical
✅ **Drag and resize** - Core interaction mechanics
✅ **No collision detection** - Or can be disabled

---

## Top Candidates

### 1. **Moveable** ⭐ Best Match

**GitHub**: https://github.com/daybrush/moveable
**NPM**: `moveable` (vanilla), `react-moveable`, `vue-moveable`, etc.
**Stars**: ~9.8k GitHub stars
**Maintenance**: Active (latest update 2024)

#### Features
- ✅ **Free positioning** - Absolute positioning anywhere
- ✅ **Drag, resize, rotate, scale**
- ✅ **Snappable** - Can snap to guidelines, elements, or grid
- ✅ **Groupable** - Select and move multiple elements
- ✅ **No collision detection** - Items can overlap freely
- ✅ **Framework support** - React, Vue, Angular, Svelte, Preact
- ✅ **Touch support** - Mobile-friendly
- ✅ **TypeScript** - Full type definitions

#### API Example
```javascript
import Moveable from "moveable";

const moveable = new Moveable(document.body, {
  target: document.querySelector(".target"),
  draggable: true,
  resizable: true,
  rotatable: true,
  snappable: true,
  snapGridWidth: 10,
  snapGridHeight: 10,
  bounds: { left: 0, top: 0, right: 1000, bottom: 2000 }
});

moveable.on("drag", ({ target, transform }) => {
  target.style.transform = transform;
});
```

#### What You Get
- ✅ Drag/resize mechanics (vs ~2,000 lines custom)
- ✅ Transform calculations
- ✅ Event system
- ✅ Snap-to-grid (configurable)
- ✅ Boundary constraints
- ✅ Group selection

#### What You Still Build
- Desktop/mobile layouts (~800 lines)
- Undo/redo (~1,500 lines)
- Component registry (~600 lines)
- State management (~1,000 lines)
- Multi-section architecture (~500 lines)

**Estimated Reusability**: ~40-50%

---

### 2. **subjx** - Lightweight Alternative

**GitHub**: https://github.com/nichollascarter/subjx
**NPM**: `subjx`
**Stars**: ~500+ GitHub stars

#### Features
- ✅ **Free positioning** - Absolute positioning
- ✅ **Drag, resize, rotate**
- ✅ **No dependencies** - Pure vanilla JS
- ✅ **Touch-enabled**
- ✅ **SVG support** - Works with HTML and SVG
- ✅ **Grid snapping**
- ✅ **No collision** - Free overlap

#### API Example
```javascript
import subjx from 'subjx';

const xElement = subjx('.target')[0];

xElement.drag({
  snap: {
    x: 10,
    y: 10
  },
  onMove: (e) => {
    console.log(e.dx, e.dy);
  }
});

xElement.resize({
  proportions: true
});
```

#### Pros
- Very lightweight (~20KB)
- Photoshop-inspired UX
- Good for simple use cases

#### Cons
- Less feature-rich than Moveable
- Smaller community
- Last update 2 years ago (less active)

**Estimated Reusability**: ~30-40%

---

### 3. **Konva.js** - Canvas-Based Approach

**Website**: https://konvajs.org
**GitHub**: https://github.com/konvajs/konva
**NPM**: `konva`, `react-konva`, `vue-konva`
**Stars**: ~11k+ GitHub stars

#### Features
- ✅ **Canvas-based** - Uses HTML5 Canvas instead of DOM
- ✅ **Free positioning** - Pixel-perfect anywhere
- ✅ **Layers** - Built-in z-index management
- ✅ **Drag, resize, rotate** - Via Transformer
- ✅ **High performance** - GPU accelerated
- ✅ **No collision** - Free overlap
- ✅ **Events** - Full event system
- ✅ **Filters & effects** - Image filters, shadows, etc.

#### API Example
```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: 1000,
  height: 600
});

const layer = new Konva.Layer();
stage.add(layer);

const rect = new Konva.Rect({
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  fill: 'blue',
  draggable: true
});

layer.add(rect);

// Add transformer for resize
const tr = new Konva.Transformer();
layer.add(tr);
tr.nodes([rect]);
```

#### Pros
- ✅ True pixel-perfect positioning
- ✅ Excellent performance (canvas vs DOM)
- ✅ Built-in layer system (z-index)
- ✅ Rich feature set (filters, animations)
- ✅ Active development

#### Cons
- ⚠️ **Canvas, not DOM** - Different rendering model
- ⚠️ Components must be drawn on canvas
- ⚠️ No HTML/CSS for component internals
- ⚠️ Different approach from current POC

**Estimated Reusability**: ~20-30% (architectural change required)

**Note**: Konva is powerful but requires rethinking component rendering. Best if you want canvas-based design tools (like Figma/Canva).

---

### 4. **Interact.js** - What You're Already Using

**Website**: https://interactjs.io
**GitHub**: https://github.com/taye/interact.js
**NPM**: `interactjs`
**Stars**: ~12k+ GitHub stars

#### Features
- ✅ **Free positioning** - You control positioning
- ✅ **Drag and resize**
- ✅ **Inertia & momentum**
- ✅ **Multi-touch gestures**
- ✅ **No collision** - You manage overlap
- ✅ **Modular** - Only load what you need

#### Current Usage
You're already using Interact.js successfully in your POC!

**Why it works well:**
- Provides low-level pointer events
- You build positioning logic on top
- Full control over grid system
- Works perfectly with your architecture

**Estimated Reusability**: You're already using it! (~2,000 lines of custom logic built on top)

---

## Comparison Matrix

| Feature | Moveable | subjx | Konva.js | Interact.js (Current) |
|---------|----------|-------|----------|----------------------|
| **Free Positioning** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Overlap Support** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Drag & Resize** | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **Snap to Grid** | ✅ Built-in | ✅ Built-in | ✅ Can implement | ⚠️ You build |
| **Group Selection** | ✅ Built-in | ❌ No | ✅ Built-in | ⚠️ You build |
| **Rotate** | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ You build |
| **Framework Support** | ✅ All major | ❌ Vanilla only | ✅ React, Vue | ✅ Framework agnostic |
| **Rendering** | DOM | DOM | Canvas | DOM |
| **Bundle Size** | ~100KB | ~20KB | ~200KB | ~60KB |
| **Active Maintenance** | ✅ Very active | ⚠️ Stale (2 yrs) | ✅ Very active | ✅ Active |
| **GitHub Stars** | 9.8k | 500+ | 11k+ | 12k+ |
| **TypeScript** | ✅ Yes | ⚠️ Partial | ✅ Yes | ✅ Yes |
| **Learning Curve** | Medium | Low | High | Low |
| **Reusability** | ~40-50% | ~30-40% | ~20-30% | Already using |

---

## Recommendation Analysis

### Option 1: **Keep Interact.js + Your Custom Logic** ⭐ Recommended

**Why:**
- ✅ You've already built a working system (~8,420 lines)
- ✅ Interact.js provides exactly what you need (low-level drag/resize)
- ✅ Full control over grid system (2% horizontal, 20px vertical)
- ✅ Your custom logic handles overlap, z-index, dual layouts
- ✅ No migration cost, no architectural changes

**When to choose**: When you want full control and already have working code

---

### Option 2: **Migrate to Moveable** ⚠️ Consider Carefully

**Why it might help:**
- ✅ Built-in snap-to-grid (save ~400 lines)
- ✅ Built-in group selection (save ~300 lines)
- ✅ Built-in rotation (future feature)
- ✅ Better transform handling (save ~500 lines)
- ✅ Active community and maintenance

**What you'd need to rebuild:**
- ⚠️ Adapt from Interact.js API to Moveable API
- ⚠️ Integrate with your state management
- ⚠️ Adapt grid system to Moveable's snapping
- ⚠️ Desktop/mobile layouts (still custom)
- ⚠️ Undo/redo (still custom)
- ⚠️ Multi-section architecture (still custom)

**Migration effort**: ~2-3 weeks

**When to choose**: If you want rotation, group selection, and willing to migrate

---

### Option 3: **subjx** ❌ Not Recommended

**Why not:**
- ❌ Less feature-rich than Moveable
- ❌ Stale maintenance (last update 2 years ago)
- ❌ Smaller community
- ✅ Only benefit: Slightly smaller bundle

**When to choose**: Probably never for this use case

---

### Option 4: **Konva.js** ❌ Not Recommended for This Project

**Why not:**
- ❌ Canvas-based (your POC is DOM-based)
- ❌ Completely different rendering model
- ❌ Component internals must be drawn, not HTML/CSS
- ❌ Would require rewriting most of your POC
- ✅ Only benefit: Better performance for image-heavy designs

**When to choose**: If building Figma/Canva-style design tools (not page builders)

---

## Final Recommendation

### 🎯 **Continue with Interact.js + Your Custom Implementation**

**Rationale:**

1. **You've already solved the hard problems**:
   - Free positioning with overlap ✅
   - Pixel-based grid system ✅
   - Desktop/mobile layouts ✅
   - Undo/redo ✅
   - Multi-section architecture ✅
   - Virtual rendering ✅

2. **Moveable would only save ~1,200 lines** (snap-to-grid, group selection, transforms):
   - But requires 2-3 weeks migration
   - Risk of introducing new bugs
   - Different API to learn
   - Not fundamentally better for your use case

3. **Interact.js is perfect for your needs**:
   - Low-level, flexible API
   - You control the positioning logic
   - Proven to work in your POC
   - Active maintenance
   - Good performance

4. **Your custom logic is your competitive advantage**:
   - Desktop/mobile dual layouts (unique feature)
   - 2% horizontal + 20px vertical grid (custom requirement)
   - Multi-section page builder (not dashboard)
   - Undo/redo with command pattern
   - Virtual rendering for performance

### If You Decide to Explore Moveable:

**Do this first:**
1. Create a spike/prototype (1-2 days)
2. Test drag, resize, snap-to-grid with Moveable
3. Check integration with your state management
4. Compare performance with current implementation
5. Estimate full migration effort

**Only migrate if:**
- ✅ Spike proves it's significantly easier
- ✅ You need rotation immediately
- ✅ You need group selection immediately
- ✅ Migration effort < 1 week

Otherwise, **stick with what works**.

---

## Conclusion

**None of these libraries are magic bullets.** They all provide drag/resize mechanics, but you still need to build:
- State management
- Desktop/mobile layouts
- Undo/redo
- Component registry
- Multi-section architecture
- Event system

**Your Stencil Grid Builder with Interact.js is already solving the hard problems.** Don't let "library FOMO" derail a working solution.

**Recommendation**: Continue with Interact.js. Consider Moveable only if you have a specific need for rotation or group selection that justifies a 2-3 week migration.
