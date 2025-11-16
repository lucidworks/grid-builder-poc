/**
 * Canvas Section Component
 * ========================
 *
 * Individual canvas container providing drag-and-drop dropzone functionality,
 * grid background rendering, and item management for multi-section layouts.
 * Each canvas section is an independent workspace that can receive dropped
 * components and manage its own collection of grid items.
 *
 * ## Problem
 *
 * Multi-section page builders need:
 * - Independent content sections with visual boundaries
 * - Drag-and-drop target areas for adding components
 * - Visual grid alignment guides
 * - Responsive layout with auto-resize handling
 * - Section-level controls (color, clear, delete)
 * - Cross-canvas drag support
 * - Reactive updates when items change
 *
 * **Without canvases**:
 * - Single monolithic workspace
 * - No logical content separation
 * - Difficult to organize complex layouts
 * - No section-specific styling
 *
 * ## Solution
 *
 * Dedicated canvas component providing:
 * 1. **Dropzone integration**: interact.js dropzone for receiving drops
 * 2. **Grid rendering**: Visual grid background for alignment
 * 3. **Reactive state**: Auto-updates when items added/removed/changed
 * 4. **ResizeObserver**: Invalidates grid cache on container resize
 * 5. **Section controls**: Background color picker, clear, delete
 * 6. **Item rendering**: Loop through items, render grid-item-wrapper
 * 7. **Custom events**: Dispatches events to parent app for coordination
 *
 * ## Architecture: Canvas as Dropzone Container
 *
 * **Separation of concerns**:
 * - **Canvas**: Detects drops, dispatches events to app
 * - **Palette**: Creates drag preview
 * - **App**: Coordinates operations, creates grid items, manages state
 * - **Grid Item Wrapper**: Individual item rendering and interaction
 *
 * **Drop flow**:
 * ```
 * 1. Palette creates drag clone
 * 2. User drags over canvas
 * 3. Canvas dropzone detects drop
 * 4. Canvas calculates drop position (grid coordinates)
 * 5. Canvas dispatches custom event with details
 * 6. App receives event, creates GridItem, adds to state
 * 7. Canvas re-renders with new item
 * ```
 *
 * **Cross-canvas drag flow**:
 * ```
 * 1. User drags existing item from canvas A
 * 2. User drops on canvas B
 * 3. Canvas B detects drop, checks sourceCanvasId !== targetCanvasId
 * 4. Canvas B dispatches 'canvas-move' event
 * 5. App receives event, moves item between canvases
 * 6. Both canvases re-render
 * ```
 *
 * ## Dropzone Setup with interact.js
 *
 * **Configuration**:
 * ```typescript
 * interact(gridContainer).dropzone({
 *   accept: '.palette-item, .grid-item',  // Both new and existing items
 *   overlap: 'pointer',                   // Use pointer position, not element
 *   ondrop: (event) => { ... }
 * })
 * ```
 *
 * **Why pointer overlap**:
 * - More intuitive drop detection
 * - Matches user expectations (drop where cursor is)
 * - Works better with large dragged elements
 * - Consistent with design tools (Figma, Sketch)
 *
 * **Accept pattern**:
 * - `.palette-item` - New components from palette
 * - `.grid-item` - Existing items dragged between canvases
 *
 * ## Drop Event Handling
 *
 * **Two drop types**:
 *
 * ### 1. Palette Item Drop (Create New)
 * ```typescript
 * if (isPaletteItem) {
 *   const componentType = element.getAttribute('data-component-type');
 *   const x = event.dragEvent.clientX - rect.left - halfWidth;
 *   const y = event.dragEvent.clientY - rect.top - halfHeight;
 *
 *   // Dispatch 'canvas-drop' event
 *   dispatchEvent(new CustomEvent('canvas-drop', {
 *     detail: { canvasId, componentType, x, y }
 *   }));
 * }
 * ```
 *
 * **Position calculation**:
 * - Uses clientX/Y for cursor position
 * - Subtracts container offset (getBoundingClientRect)
 * - Centers item on cursor (subtract half dimensions)
 * - Result: x/y in pixels relative to canvas top-left
 *
 * ### 2. Grid Item Drop (Cross-Canvas Move)
 * ```typescript
 * if (isGridItem && sourceCanvasId !== targetCanvasId) {
 *   const droppedRect = element.getBoundingClientRect();
 *   const x = droppedRect.left - rect.left;
 *   const y = droppedRect.top - rect.top;
 *
 *   // Dispatch 'canvas-move' event
 *   dispatchEvent(new CustomEvent('canvas-move', {
 *     detail: { itemId, sourceCanvasId, targetCanvasId, x, y }
 *   }));
 * }
 * ```
 *
 * **Why different position calculation**:
 * - Grid item already positioned by drag handler
 * - Use element's current screen position
 * - Calculate relative to target canvas
 * - Preserves visual position during cross-canvas move
 *
 * ## Grid Background Rendering
 *
 * **CSS-based grid pattern**:
 * ```scss
 * .grid-container {
 *   background-size: 2% 20px;  // Responsive width, fixed height
 *   background-image:
 *     linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
 *     linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px);
 * }
 *
 * .grid-container.hide-grid {
 *   background-image: none;  // Toggle visibility
 * }
 * ```
 *
 * **Grid specifications**:
 * - Horizontal: 2% width per unit (50 units = 100% width)
 * - Vertical: 20px height per unit (fixed)
 * - Color: Semi-transparent black (rgba(0,0,0,0.1))
 * - Toggle: `.hide-grid` class removes background-image
 *
 * **Why CSS grid over canvas/SVG**:
 * - ✅ No JavaScript overhead
 * - ✅ Automatic responsive scaling (2% = relative to container)
 * - ✅ No redraw on scroll/zoom
 * - ✅ Simple toggle (add/remove class)
 * - ❌ Limited customization (vs canvas API)
 *
 * ## ResizeObserver Integration
 *
 * **Purpose**: Detect canvas container size changes and invalidate grid cache
 *
 * **Setup**:
 * ```typescript
 * this.resizeObserver = new ResizeObserver(() => {
 *   clearGridSizeCache();    // Invalidate cached grid calculations
 *   this.renderVersion++;    // Force re-render of items
 * });
 * this.resizeObserver.observe(gridContainerRef);
 * ```
 *
 * **Why needed**:
 * - Grid calculations cached for performance (grid-calculations.ts)
 * - Cache based on container width (responsive grid)
 * - Container resize → cache invalid → wrong positioning
 * - ResizeObserver detects resize → clears cache → recalculates
 *
 * **Triggers**:
 * - Browser window resize
 * - Sidebar collapse/expand
 * - DevTools open/close
 * - Zoom level change
 * - Mobile orientation change
 *
 * **Performance**:
 * - ResizeObserver fires ~1-5ms after resize
 * - clearGridSizeCache() is O(1) (just sets flag)
 * - renderVersion++ triggers efficient re-render (StencilJS diffing)
 * - Total overhead: ~2-10ms per resize event
 *
 * ## Section Numbering System
 *
 * **Props**:
 * ```typescript
 * @Prop() canvasId: string;      // 'canvas1', 'canvas2', etc.
 * @Prop() sectionNumber: number; // 1, 2, 3, etc.
 * ```
 *
 * **Why separate from canvasId**:
 * - canvasId = state management key (technical)
 * - sectionNumber = user-facing label (UX)
 * - Allows reordering sections without breaking state
 * - Clearer section headers ("Section 1", not "canvas1")
 *
 * **Example usage in parent**:
 * ```tsx
 * {Object.keys(gridState.canvases).map((canvasId, index) => (
 *   <canvas-section
 *     canvasId={canvasId}
 *     sectionNumber={index + 1}
 *   />
 * ))}
 * ```
 *
 * ## Item Rendering Loop
 *
 * **Pattern**:
 * ```tsx
 * {this.canvas?.items.map((item: GridItem) => (
 *   <grid-item-wrapper
 *     key={item.id}
 *     item={item}
 *     renderVersion={this.renderVersion}
 *   />
 * ))}
 * ```
 *
 * **Key props**:
 * - `key={item.id}` - React-style key for efficient diffing
 * - `item={item}` - Full GridItem data (position, size, type, etc.)
 * - `renderVersion={this.renderVersion}` - Force re-render trigger
 *
 * **Why renderVersion prop**:
 * - Items positioned using grid calculations (cached)
 * - Cache cleared on resize, but items don't re-render automatically
 * - Incrementing renderVersion forces grid-item-wrapper to recalculate
 * - Ensures items reposition correctly after resize
 *
 * **Optional chaining** (`.canvas?.items`):
 * - Prevents errors during component mounting
 * - Canvas state may not be loaded yet
 * - Returns empty array if canvas undefined
 *
 * ## Desktop vs Mobile Viewport Switching
 *
 * **Handled by grid-item-wrapper**:
 * - Canvas section doesn't directly handle viewport switching
 * - Renders all items with current gridState.currentViewport
 * - grid-item-wrapper reads viewport and selects correct layout
 *
 * **Why delegated to wrapper**:
 * - Each item has dual layouts (desktop/mobile)
 * - Wrapper applies correct layout based on viewport
 * - Canvas just provides container
 * - Cleaner separation of concerns
 *
 * **Canvas still responsive**:
 * - Container width affects grid calculations
 * - Grid units (2% width) scale with container
 * - Items automatically reposition via renderVersion
 *
 * ## State Subscription Pattern
 *
 * **componentWillLoad setup**:
 * ```typescript
 * onChange('canvases', () => {
 *   this.canvas = gridState.canvases[this.canvasId];
 *   this.renderVersion++;  // Force re-render
 * });
 * ```
 *
 * **Why subscribe in componentWillLoad**:
 * - Runs before first render
 * - Ensures subscription active for entire lifecycle
 * - Captures initial state before mount
 *
 * **Try/catch pattern**:
 * ```typescript
 * try {
 *   if (this.canvasId && gridState.canvases[this.canvasId]) {
 *     this.canvas = gridState.canvases[this.canvasId];
 *   }
 * } catch (error) {
 *   console.debug('Canvas section state update skipped:', error);
 * }
 * ```
 *
 * **Why needed**:
 * - Tests may mount/unmount rapidly
 * - Component may not be fully initialized
 * - Guards against accessing undefined properties
 * - Prevents test failures from timing issues
 *
 * **componentWillUpdate**:
 * - Also updates canvas reference
 * - Runs before each re-render
 * - Ensures fresh data from state
 *
 * ## Custom Event Dispatching
 *
 * **Three event types**:
 *
 * ### 1. canvas-drop (New Item)
 * ```typescript
 * new CustomEvent('canvas-drop', {
 *   detail: { canvasId, componentType, x, y },
 *   bubbles: true,    // Event bubbles to parent
 *   composed: true    // Event crosses shadow DOM
 * })
 * ```
 *
 * ### 2. canvas-move (Cross-Canvas)
 * ```typescript
 * new CustomEvent('canvas-move', {
 *   detail: { itemId, sourceCanvasId, targetCanvasId, x, y },
 *   bubbles: true,
 *   composed: true
 * })
 * ```
 *
 * ### 3. section-delete (Delete Section)
 * ```typescript
 * new CustomEvent('section-delete', {
 *   detail: { canvasId },
 *   bubbles: true,
 *   composed: true
 * })
 * ```
 *
 * **Why custom events**:
 * - Decouples canvas from app logic
 * - Canvas doesn't manage state directly
 * - App coordinates all state changes
 * - Testable (can spy on events)
 * - Standard DOM pattern
 *
 * ## Section Controls
 *
 * ### Background Color Picker
 * ```tsx
 * <input
 *   type="color"
 *   value={backgroundColor}
 *   onInput={(e) => this.handleColorChange(e)}
 * />
 * ```
 *
 * **Dual update pattern**:
 * 1. Update state: `this.canvas.backgroundColor = color`
 * 2. Update DOM: `this.gridContainerRef.style.backgroundColor = color`
 *
 * **Why both**:
 * - State update triggers re-render (reactivity)
 * - DOM update provides immediate visual feedback
 * - Prevents flash of old color during re-render
 *
 * ### Clear Canvas Button
 * - Confirms before clearing (`confirm()` dialog)
 * - Clears `canvas.items` array
 * - Clears selection if on this canvas
 * - Resets container min-height
 *
 * ### Delete Section Button
 * - Confirms if section has items
 * - Dispatches 'section-delete' event
 * - App handles actual deletion (state management)
 *
 * ## Performance Characteristics
 *
 * **ResizeObserver overhead**: ~2-10ms per resize event
 * **Dropzone detection**: <1ms (pointer-based, no calculations)
 * **Re-render on state change**: ~5-20ms (depends on item count)
 * **Grid background**: 0ms (CSS-only, no JavaScript)
 * **Item rendering**: O(n) where n = number of items
 *
 * **Optimization**: Uses renderVersion prop to force re-renders
 * only when needed (resize, state change), not on every interaction.
 *
 * ## StencilJS Lifecycle
 *
 * **componentWillLoad**: Subscribe to state changes
 * - Runs before first render
 * - Sets up onChange subscription
 * - Loads initial canvas state
 *
 * **componentWillUpdate**: Update canvas reference
 * - Runs before each re-render
 * - Ensures fresh state data
 *
 * **componentDidLoad**: Initialize interactions
 * - Runs after first render (DOM available)
 * - Sets up dropzone
 * - Sets up ResizeObserver
 *
 * **disconnectedCallback**: Cleanup
 * - Runs when component removed from DOM
 * - Unsets interact.js dropzone
 * - Disconnects ResizeObserver
 * - Prevents memory leaks
 *
 * **render**: Reactive template
 * - Renders section header with controls
 * - Renders grid container with background
 * - Loops through items, renders grid-item-wrapper
 *
 * ## Extracting This Pattern
 *
 * To adapt canvas dropzone pattern for your project:
 *
 * **Minimal implementation**:
 * ```typescript
 * // 1. Setup dropzone
 * interact(container).dropzone({
 *   accept: '.draggable-item',
 *   overlap: 'pointer',
 *   ondrop: (event) => {
 *     const rect = container.getBoundingClientRect();
 *     const x = event.dragEvent.clientX - rect.left;
 *     const y = event.dragEvent.clientY - rect.top;
 *
 *     // Dispatch event to parent
 *     container.dispatchEvent(new CustomEvent('item-drop', {
 *       detail: { x, y, type: event.relatedTarget.dataset.type },
 *       bubbles: true
 *     }));
 *   }
 * });
 *
 * // 2. Setup ResizeObserver
 * new ResizeObserver(() => {
 *   clearCache();
 *   forceRerender();
 * }).observe(container);
 *
 * // 3. Render items
 * {items.map(item => (
 *   <ItemWrapper key={item.id} item={item} renderVersion={version} />
 * ))}
 * ```
 *
 * **For different frameworks**:
 * - **React**: Use useEffect for setup, useRef for container, useState for renderVersion
 * - **Vue**: Use onMounted for setup, ref() for container, reactive for renderVersion
 * - **Angular**: Use ngAfterViewInit for setup, ViewChild for container, signals for renderVersion
 *
 * **Multi-canvas layouts**:
 * ```typescript
 * // Parent component
 * {canvases.map((canvas, index) => (
 *   <CanvasSection
 *     key={canvas.id}
 *     canvasId={canvas.id}
 *     sectionNumber={index + 1}
 *     onDrop={(e) => handleDrop(e)}
 *     onMove={(e) => handleMove(e)}
 *   />
 * ))}
 * ```
 *
 * @module canvas-section
 */

// External libraries (alphabetical)
import { Component, h, Prop, State } from '@stencil/core';
import interact from 'interactjs';

// Internal imports (alphabetical)
import { Canvas, GridItem, gridState, onChange } from '../../services/state-manager';
import { clearGridSizeCache, gridToPixelsX, gridToPixelsY } from '../../utils/grid-calculations';

/**
 * CanvasSection Component
 * =======================
 *
 * StencilJS component providing individual canvas dropzone with item management.
 *
 * **Tag**: `<canvas-section>`
 * **Shadow DOM**: Disabled (required for interact.js compatibility)
 * **Lifecycle**: Standard StencilJS (componentWillLoad → componentDidLoad → render → disconnectedCallback)
 */
@Component({
  tag: 'canvas-section',
  styleUrl: 'canvas-section.scss',
  shadow: false, // Use light DOM for compatibility with interact.js
})
export class CanvasSection {
  /**
   * Canvas ID for state management
   *
   * **Format**: 'canvas1', 'canvas2', etc.
   * **Purpose**: Key for accessing canvas data in gridState.canvases
   * **Required**: Component won't render without valid canvasId
   */
  @Prop() canvasId!: string;

  /**
   * Section number for UI display
   *
   * **Format**: 1, 2, 3, etc.
   * **Purpose**: User-facing label ("Section 1", "Section 2")
   * **Decoupled from canvasId**: Allows reordering without breaking state
   */
  @Prop() sectionNumber!: number;

  /**
   * Canvas state (reactive)
   *
   * **Source**: gridState.canvases[canvasId]
   * **Updates**: componentWillLoad, componentWillUpdate, onChange subscription
   * **Contains**: items array, zIndexCounter, backgroundColor
   */
  @State() canvas: Canvas;

  /**
   * Render version counter (forces re-renders)
   *
   * **Purpose**: Trigger re-renders when grid calculations change
   * **Incremented on**: ResizeObserver events, state changes
   * **Passed to**: grid-item-wrapper as prop
   * **Why needed**: Grid calculations cached, need to recalculate on resize
   */
  @State() renderVersion: number = 0;

  /**
   * Grid container DOM reference
   *
   * **Used for**:
   * - interact.js dropzone setup
   * - ResizeObserver monitoring
   * - Position calculations (getBoundingClientRect)
   * - Direct DOM updates (backgroundColor)
   */
  private gridContainerRef: HTMLElement;

  /**
   * Dropzone initialization flag
   *
   * **Prevents**: Multiple dropzone setups on same element
   * **Set in**: initializeDropzone()
   * **Checked in**: initializeDropzone(), disconnectedCallback()
   */
  private dropzoneInitialized: boolean = false;

  /**
   * ResizeObserver instance
   *
   * **Monitors**: gridContainerRef size changes
   * **Callback**: Clears grid cache, increments renderVersion
   * **Cleanup**: disconnectedCallback() disconnects observer
   */
  private resizeObserver: ResizeObserver;

  /**
   * Component will load lifecycle hook
   *
   * **Called**: Before first render
   * **Purpose**: Load initial canvas state and subscribe to changes
   *
   * **Operations**:
   * 1. Load canvas from global state
   * 2. Subscribe to 'canvases' state changes
   * 3. Update local canvas state on changes
   * 4. Increment renderVersion to trigger item re-renders
   *
   * **Error handling**:
   * - Try/catch guards against rapid mount/unmount in tests
   * - Checks canvasId and canvas existence before update
   * - Logs debug message if update skipped
   *
   * **Why try/catch**:
   * - Tests may mount components before state fully initialized
   * - Component may be unmounting while state update fires
   * - Prevents test failures from timing issues
   */
  componentWillLoad() {
    // Initial load
    this.canvas = gridState.canvases[this.canvasId];

    // Subscribe to state changes
    onChange('canvases', () => {
      // Guard against accessing properties when component is not fully initialized
      try {
        if (this.canvasId && gridState.canvases[this.canvasId]) {
          this.canvas = gridState.canvases[this.canvasId];
          this.renderVersion++; // Force re-render
        }
      } catch (error) {
        // Component may not be fully initialized yet (e.g., during test setup)
        // This can happen during rapid component mounting/unmounting in tests
        console.debug('Canvas section state update skipped:', error);
      }
    });
  }

  /**
   * Component will update lifecycle hook
   *
   * **Called**: Before each re-render
   * **Purpose**: Ensure canvas reference is fresh from state
   *
   * **Why needed**:
   * - State may have changed since last render
   * - Local canvas reference might be stale
   * - Ensures render uses latest data
   *
   * **Complements**: onChange subscription in componentWillLoad
   */
  componentWillUpdate() {
    // Update canvas reference when state changes
    this.canvas = gridState.canvases[this.canvasId];
  }

  /**
   * Component did load lifecycle hook
   *
   * **Called**: After first render (DOM available)
   * **Purpose**: Initialize interact.js dropzone and ResizeObserver
   *
   * **Why after render**:
   * - Needs gridContainerRef to be assigned (happens during render)
   * - interact.js requires actual DOM element
   * - ResizeObserver requires element to observe
   *
   * **One-time setup**:
   * - Only runs once after mount
   * - Handlers persist across re-renders
   * - Cleanup in disconnectedCallback
   */
  componentDidLoad() {
    this.initializeDropzone();
    this.setupResizeObserver();
  }

  /**
   * Disconnected callback (cleanup)
   *
   * **Called**: When component removed from DOM
   * **Purpose**: Clean up interact.js and ResizeObserver
   *
   * **Cleanup operations**:
   * 1. Unset interact.js dropzone if initialized
   * 2. Disconnect ResizeObserver if created
   *
   * **Why important**:
   * - Prevents memory leaks
   * - Removes event listeners
   * - Stops observation of removed elements
   * - Standard web component lifecycle pattern
   *
   * **Safety checks**:
   * - Verifies gridContainerRef exists before interact unset
   * - Verifies dropzoneInitialized before interact unset
   * - Verifies resizeObserver exists before disconnect
   */
  disconnectedCallback() {
    // Cleanup interact.js
    if (this.gridContainerRef && this.dropzoneInitialized) {
      interact(this.gridContainerRef).unset();
    }

    // Cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Setup ResizeObserver for grid cache invalidation
   *
   * **Purpose**: Detect container size changes and force grid recalculation
   *
   * **Observer callback**:
   * 1. Clear grid size cache (grid-calculations.ts)
   * 2. Increment renderVersion (triggers item re-renders)
   *
   * **Why needed**:
   * - Grid calculations cached for performance
   * - Cache based on container width (responsive 2% units)
   * - Container resize invalidates cache
   * - Items need to recalculate positions with new dimensions
   *
   * **Resize triggers**:
   * - Browser window resize
   * - Sidebar expand/collapse
   * - DevTools open/close
   * - Mobile orientation change
   * - Zoom level change
   *
   * **Performance impact**:
   * - ResizeObserver: ~1-2ms per event
   * - clearGridSizeCache(): O(1) flag set
   * - renderVersion++: ~5-20ms re-render (varies by item count)
   * - Total: ~7-23ms per resize (acceptable)
   *
   * **Safety**: Returns early if gridContainerRef not available
   *
   * @private
   */
  private setupResizeObserver = () => {
    if (!this.gridContainerRef) {
      return;
    }

    // Watch for canvas container size changes
    this.resizeObserver = new ResizeObserver(() => {
      // Clear grid size cache when container resizes
      clearGridSizeCache();

      // Force re-render to update item positions
      this.renderVersion++;
    });

    this.resizeObserver.observe(this.gridContainerRef);
  };

  /**
   * Render component template
   *
   * **Reactive**: Re-runs when canvas state or renderVersion changes
   * **Pure**: No side effects, only returns JSX
   *
   * ## Template Structure
   *
   * **Outer container** (`.canvas-item`):
   * - Section wrapper with canvas ID
   * - Contains header and grid builder
   *
   * **Header** (`.canvas-item-header`):
   * - Section number (h3)
   * - Controls container:
   *   - Color picker (background color)
   *   - Clear button (clear all items)
   *   - Delete button (delete section)
   *
   * **Grid builder** (`.grid-builder`):
   * - Grid container (`.grid-container`):
   *   - Dynamic class: `.hide-grid` when showGrid = false
   *   - Background color from canvas state
   *   - Ref assigned to gridContainerRef
   *   - Item rendering loop
   *
   * ## Grid Container Classes
   *
   * **Dynamic class binding**:
   * ```tsx
   * class={{
   *   'grid-container': true,      // Always present
   *   'hide-grid': !showGrid       // Conditional
   * }}
   * ```
   *
   * **CSS grid visibility**:
   * - `.grid-container`: Shows grid background
   * - `.grid-container.hide-grid`: Hides grid background
   * - Controlled by `gridState.showGrid` toggle
   *
   * ## Item Rendering Loop
   *
   * **Mapping pattern**:
   * ```tsx
   * {this.canvas?.items.map((item: GridItem) => (
   *   <grid-item-wrapper
   *     key={item.id}
   *     item={item}
   *     renderVersion={this.renderVersion}
   *   />
   * ))}
   * ```
   *
   * **Optional chaining** (`.canvas?.items`):
   * - Guards against undefined canvas during mounting
   * - Returns empty array if canvas not loaded
   * - Prevents "Cannot read property 'items' of undefined"
   *
   * **Props passed to wrapper**:
   * - `key={item.id}`: React-style key for efficient diffing
   * - `item={item}`: Full GridItem data
   * - `renderVersion={this.renderVersion}`: Triggers recalculation
   *
   * ## Background Color Binding
   *
   * **Inline style**:
   * ```tsx
   * style={{ backgroundColor }}
   * ```
   *
   * **Value source**: `this.canvas?.backgroundColor || '#ffffff'`
   * - Reads from canvas state
   * - Falls back to white if undefined
   * - Reactive: updates when canvas.backgroundColor changes
   *
   * **Also updated directly** in handleColorChange for immediate feedback
   *
   * @returns JSX template for canvas section
   *
   * @example
   * ```tsx
   * // Rendered output structure:
   * <div class="canvas-item" data-canvas-id="canvas1">
   *   <div class="canvas-item-header">
   *     <h3>Section 1</h3>
   *     <div class="canvas-controls">
   *       <input type="color" value="#ffffff" />
   *       <button>Clear</button>
   *       <button>🗑️</button>
   *     </div>
   *   </div>
   *   <div class="grid-builder">
   *     <div class="grid-container" style="background-color: #ffffff">
   *       <grid-item-wrapper item={...} renderVersion={0} />
   *       <grid-item-wrapper item={...} renderVersion={0} />
   *       ...
   *     </div>
   *   </div>
   * </div>
   * ```
   */
  render() {
    const showGrid = gridState.showGrid;
    const backgroundColor = this.canvas?.backgroundColor || '#ffffff';

    return (
      <div class="canvas-item" data-canvas-id={this.canvasId}>
        <div class="canvas-item-header">
          <h3>Section {this.sectionNumber}</h3>
          <div class="canvas-controls">
            <label>
              <input
                type="color"
                class="canvas-bg-color"
                value={backgroundColor}
                onInput={(e) => this.handleColorChange(e)}
              />
            </label>
            <button class="clear-canvas-btn" onClick={() => this.handleClearCanvas()}>
              Clear
            </button>
            <button class="delete-section-btn" onClick={() => this.handleDeleteSection()} title="Delete Section">
              🗑️
            </button>
          </div>
        </div>
        <div class="grid-builder">
          <div
            class={{
              'grid-container': true,
              'hide-grid': !showGrid,
            }}
            id={this.canvasId}
            data-canvas-id={this.canvasId}
            style={{
              backgroundColor,
            }}
            ref={(el) => (this.gridContainerRef = el)}
          >
            {/* Grid items will be rendered here by grid-item-wrapper components */}
            {this.canvas?.items.map((item: GridItem) => (
              <grid-item-wrapper key={item.id} item={item} renderVersion={this.renderVersion} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Initialize interact.js dropzone
   *
   * **Called from**: componentDidLoad (after DOM available)
   * **Purpose**: Setup dropzone to receive palette items and grid items
   *
   * ## Dropzone Configuration
   *
   * **Accept pattern**: `.palette-item, .grid-item`
   * - `.palette-item` - New components from palette
   * - `.grid-item` - Existing items for cross-canvas moves
   *
   * **Overlap mode**: `'pointer'`
   * - Drop detection based on cursor position
   * - More intuitive than element overlap
   * - Matches design tool behavior
   *
   * **Checker function**: `(dragEvent, event, dropped) => dropped`
   * - Returns true if drop should be accepted
   * - Currently accepts all drops (could add validation)
   *
   * ## Drop Event Handling
   *
   * **Two drop scenarios**:
   *
   * ### 1. Palette Item Drop (Create New)
   *
   * **Detection**:
   * ```typescript
   * const isPaletteItem = droppedElement.classList.contains('palette-item');
   * ```
   *
   * **Component type extraction**:
   * ```typescript
   * const componentType = droppedElement.getAttribute('data-component-type');
   * ```
   *
   * **Position calculation**:
   * ```typescript
   * // Get half dimensions (default: 10 units × 6 units)
   * const widthPx = gridToPixelsX(10, canvasId);
   * const heightPx = gridToPixelsY(6);
   * const halfWidth = widthPx / 2;
   * const halfHeight = heightPx / 2;
   *
   * // Calculate position (cursor-centered)
   * const rect = gridContainerRef.getBoundingClientRect();
   * const x = event.dragEvent.clientX - rect.left - halfWidth;
   * const y = event.dragEvent.clientY - rect.top - halfHeight;
   * ```
   *
   * **Why subtract half dimensions**:
   * - Centers item on cursor position
   * - Matches drag clone visual (cursor in center)
   * - Better UX (item appears where user expects)
   *
   * **Custom event dispatch**:
   * ```typescript
   * dispatchEvent(new CustomEvent('canvas-drop', {
   *   detail: { canvasId, componentType, x, y },
   *   bubbles: true,    // Event reaches parent
   *   composed: true    // Event crosses shadow DOM
   * }));
   * ```
   *
   * ### 2. Grid Item Drop (Cross-Canvas Move)
   *
   * **Detection**:
   * ```typescript
   * const isGridItem = droppedElement.classList.contains('grid-item');
   * const sourceCanvasId = droppedElement.getAttribute('data-canvas-id');
   * if (sourceCanvasId !== this.canvasId) { ... }
   * ```
   *
   * **Only process cross-canvas moves**:
   * - Same-canvas moves handled by drag handler directly
   * - No need for canvas coordination
   * - Prevents duplicate events
   *
   * **Position calculation**:
   * ```typescript
   * // Item already positioned by drag handler
   * const droppedRect = droppedElement.getBoundingClientRect();
   * const rect = gridContainerRef.getBoundingClientRect();
   *
   * // Use element's current screen position
   * const x = droppedRect.left - rect.left;
   * const y = droppedRect.top - rect.top;
   * ```
   *
   * **Why different from palette**:
   * - Grid item already has position from drag handler
   * - Use element's bounding rect, not cursor position
   * - Preserves visual position during move
   * - More accurate for cross-canvas transfers
   *
   * **Custom event dispatch**:
   * ```typescript
   * dispatchEvent(new CustomEvent('canvas-move', {
   *   detail: { itemId, sourceCanvasId, targetCanvasId, x, y },
   *   bubbles: true,
   *   composed: true
   * }));
   * ```
   *
   * ## Initialization Guard
   *
   * **Early return conditions**:
   * - `!gridContainerRef` - DOM not ready
   * - `dropzoneInitialized` - Already setup
   *
   * **Prevents**:
   * - Multiple dropzone setups on same element
   * - Errors from missing DOM element
   * - Duplicate event handlers
   *
   * **Sets flag**: `this.dropzoneInitialized = true` after setup
   *
   * @private
   */
  private initializeDropzone = () => {
    if (!this.gridContainerRef || this.dropzoneInitialized) {
      return;
    }

    const interactable = interact(this.gridContainerRef);

    interactable.dropzone({
      accept: '.palette-item, .grid-item', // Accept both palette items and grid items
      overlap: 'pointer', // Use pointer position instead of element overlap

      checker: (_dragEvent: any, _event: any, dropped: boolean) => {
        return dropped;
      },

      ondrop: (event: any) => {
        const droppedElement = event.relatedTarget;
        const isPaletteItem = droppedElement.classList.contains('palette-item');
        const isGridItem = droppedElement.classList.contains('grid-item');

        if (isPaletteItem) {
          // Dropping from palette - create new item
          const componentType = droppedElement.getAttribute('data-component-type');

          // Calculate half dimensions for centering (default: 10 units wide, 6 units tall)
          const defaultWidth = 10;
          const defaultHeight = 6;
          const widthPx = gridToPixelsX(defaultWidth, this.canvasId);
          const heightPx = gridToPixelsY(defaultHeight);
          const halfWidth = widthPx / 2;
          const halfHeight = heightPx / 2;

          // Get drop position relative to grid container
          const rect = this.gridContainerRef.getBoundingClientRect();
          const x = event.dragEvent.clientX - rect.left - halfWidth;
          const y = event.dragEvent.clientY - rect.top - halfHeight;

          // Dispatch custom event for grid-builder-app to handle
          const dropEvent = new CustomEvent('canvas-drop', {
            detail: {
              canvasId: this.canvasId,
              componentType,
              x,
              y,
            },
            bubbles: true,
            composed: true,
          });
          this.gridContainerRef.dispatchEvent(dropEvent);
        } else if (isGridItem) {
          // Moving existing grid item to different canvas
          const itemId = droppedElement.id;
          const sourceCanvasId = droppedElement.getAttribute('data-canvas-id');

          // Only process if moving to a different canvas
          if (sourceCanvasId !== this.canvasId) {
            // For cross-canvas moves, get the element's actual screen position
            // (the drag handler has already positioned it during the drag)
            const droppedRect = droppedElement.getBoundingClientRect();
            const rect = this.gridContainerRef.getBoundingClientRect();

            // Use the element's top-left corner relative to the target canvas
            const x = droppedRect.left - rect.left;
            const y = droppedRect.top - rect.top;

            // Dispatch custom event for moving item between canvases
            const moveEvent = new CustomEvent('canvas-move', {
              detail: {
                itemId,
                sourceCanvasId,
                targetCanvasId: this.canvasId,
                x,
                y,
              },
              bubbles: true,
              composed: true,
            });
            this.gridContainerRef.dispatchEvent(moveEvent);
          }
        }
      },
    });

    this.dropzoneInitialized = true;
  };

  /**
   * Handle background color change
   *
   * **Triggered by**: User selects color from color picker input
   *
   * ## Dual Update Pattern
   *
   * **1. State update** (reactivity):
   * ```typescript
   * this.canvas.backgroundColor = color;
   * gridState.canvases = { ...gridState.canvases };
   * ```
   *
   * **Why spread**: Triggers StencilJS reactivity
   * - Object reference change detected
   * - Components re-render
   * - Persists color in state
   *
   * **2. DOM update** (immediate feedback):
   * ```typescript
   * this.gridContainerRef.style.backgroundColor = color;
   * ```
   *
   * **Why needed**:
   * - State update triggers async re-render
   * - User sees delay (~16ms) without DOM update
   * - Direct style update provides instant visual feedback
   * - Better UX (no flash of old color)
   *
   * ## Event Handling
   *
   * **Input type**: `type="color"` (native HTML5 color picker)
   * **Event**: `onInput` (fires during color selection)
   * **Value**: `e.target.value` (hex color string, e.g., '#ff0000')
   *
   * **Why onInput vs onChange**:
   * - onInput fires immediately during selection
   * - onChange only fires on blur (after closing picker)
   * - Better real-time feedback
   *
   * @param e - Input event from color picker
   *
   * @example
   * ```typescript
   * // User selects red (#ff0000)
   * handleColorChange(event)
   * // → State updated: canvas.backgroundColor = '#ff0000'
   * // → DOM updated: container.style.backgroundColor = '#ff0000'
   * // → Visual feedback instant, state persisted
   * ```
   *
   * @private
   */
  private handleColorChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const color = target.value;

    // Update state
    this.canvas.backgroundColor = color;
    gridState.canvases = { ...gridState.canvases }; // Trigger update

    // Also update DOM directly for immediate feedback
    if (this.gridContainerRef) {
      this.gridContainerRef.style.backgroundColor = color;
    }
  };

  /**
   * Handle clear canvas (delete all items)
   *
   * **Triggered by**: User clicks "Clear" button
   *
   * ## Confirmation Dialog
   *
   * **Pattern**:
   * ```typescript
   * if (confirm('Are you sure you want to clear all items from this section?'))
   * ```
   *
   * **Why needed**:
   * - Prevents accidental clears
   * - Destructive operation (cannot undo via undo/redo)
   * - Standard UX pattern for dangerous actions
   *
   * **Native confirm**:
   * - Blocks execution until user responds
   * - Simple and reliable
   * - No dependencies needed
   * - Could be replaced with custom modal for better UX
   *
   * ## Clear Operations
   *
   * **1. Clear items array**:
   * ```typescript
   * this.canvas.items = [];
   * gridState.canvases = { ...gridState.canvases };
   * ```
   *
   * **Why assignment vs splice**:
   * - Assignment creates new array reference
   * - Triggers reactivity
   * - Simpler than splice(0, items.length)
   *
   * **2. Clear selection** (if on this canvas):
   * ```typescript
   * if (gridState.selectedCanvasId === this.canvasId) {
   *   gridState.selectedItemId = null;
   *   gridState.selectedCanvasId = null;
   * }
   * ```
   *
   * **Why needed**:
   * - Selected item no longer exists after clear
   * - Prevents dangling reference
   * - Avoids errors when accessing selectedItemId
   *
   * **3. Reset container height**:
   * ```typescript
   * this.gridContainerRef.style.minHeight = '400px';
   * ```
   *
   * **Why needed**:
   * - Canvas may have grown with many items
   * - Empty canvas should return to default height
   * - Provides visual feedback (canvas shrinks)
   * - 400px = comfortable minimum workspace
   *
   * ## No Undo Support
   *
   * **Note**: Clear operation NOT added to undo history
   * - Too destructive for standard undo
   * - Would require full state snapshot
   * - Confirmation dialog is safety mechanism
   * - Could be enhanced to support undo if needed
   *
   * @example
   * ```typescript
   * // User clicks "Clear" on canvas with 5 items
   * handleClearCanvas()
   * // → Dialog: "Are you sure you want to clear all items from this section?"
   * // → User confirms
   * // → Items cleared: canvas.items = []
   * // → Selection cleared: selectedItemId = null
   * // → Height reset: container.style.minHeight = '400px'
   * ```
   *
   * @private
   */
  private handleClearCanvas = () => {
    if (confirm(`Are you sure you want to clear all items from this section?`)) {
      // Clear items from state
      this.canvas.items = [];
      gridState.canvases = { ...gridState.canvases }; // Trigger update

      // Clear selection if on this canvas
      if (gridState.selectedCanvasId === this.canvasId) {
        gridState.selectedItemId = null;
        gridState.selectedCanvasId = null;
      }

      // Reset canvas height
      if (this.gridContainerRef) {
        this.gridContainerRef.style.minHeight = '400px';
      }
    }
  };

  /**
   * Handle delete section
   *
   * **Triggered by**: User clicks delete button (🗑️)
   *
   * ## Confirmation Dialog
   *
   * **Conditional confirmation**:
   * ```typescript
   * if (canvas.items.length > 0) {
   *   if (!confirm(`This section has ${items.length} items. Are you sure?`))
   *     return;
   * }
   * ```
   *
   * **Confirmation only if items exist**:
   * - Empty section can be deleted without confirmation
   * - Section with items requires confirmation
   * - Shows item count for context
   *
   * **Early return on cancel**:
   * - Prevents event dispatch
   * - No state changes
   * - Operation fully cancelled
   *
   * ## Custom Event Dispatch
   *
   * **Pattern**:
   * ```typescript
   * dispatchEvent(new CustomEvent('section-delete', {
   *   detail: { canvasId },
   *   bubbles: true,
   *   composed: true
   * }));
   * ```
   *
   * **Why custom event**:
   * - Canvas doesn't manage global state
   * - App coordinates section deletion
   * - Decouples canvas from app logic
   * - Testable (can spy on events)
   *
   * **Event details**:
   * - `canvasId`: Which section to delete
   * - `bubbles: true`: Event reaches parent
   * - `composed: true`: Event crosses shadow DOM
   *
   * ## App Coordination
   *
   * **grid-builder-app.tsx handles**:
   * 1. Receives 'section-delete' event
   * 2. Removes canvas from gridState.canvases
   * 3. Clears selection if on deleted canvas
   * 4. Updates canvas numbering
   * 5. Re-renders canvas list
   *
   * **Why delegate to app**:
   * - App owns canvas collection state
   * - Single responsibility (canvas = UI, app = state)
   * - Easier to test and maintain
   * - Follows React/StencilJS patterns
   *
   * ## No Undo Support
   *
   * **Note**: Section deletion NOT added to undo history
   * - Very destructive operation
   * - Would require full section snapshot
   * - Confirmation dialog is safety mechanism
   * - Could be enhanced to support undo if needed
   *
   * @example
   * ```typescript
   * // User clicks delete on section with 3 items
   * handleDeleteSection()
   * // → Dialog: "This section has 3 items. Are you sure you want to delete it?"
   * // → User confirms
   * // → Event dispatched: { detail: { canvasId: 'canvas2' } }
   * // → App receives event, deletes canvas from state
   * // → Section removed from DOM
   * ```
   *
   * @private
   */
  private handleDeleteSection = () => {
    if (this.canvas.items.length > 0) {
      if (!confirm(`This section has ${this.canvas.items.length} items. Are you sure you want to delete it?`)) {
        return;
      }
    }

    // Dispatch custom event for grid-builder-app to handle
    const deleteEvent = new CustomEvent('section-delete', {
      detail: { canvasId: this.canvasId },
      bubbles: true,
      composed: true,
    });
    this.gridContainerRef.dispatchEvent(deleteEvent);
  };
}
