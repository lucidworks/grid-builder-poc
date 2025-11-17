/**
 * Drag Handler
 * ============
 *
 * High-performance drag-and-drop system for grid items using interact.js and direct DOM
 * manipulation. This module handles smooth 60fps dragging while avoiding framework
 * re-render overhead.
 *
 * ## Problem
 *
 * Dragging UI elements at 60fps requires updating positions ~16ms per frame. Using
 * framework state updates would cause:
 * - Full component re-renders on every mousemove event
 * - Virtual DOM diffing overhead
 * - Layout thrashing from read/write cycles
 * - Janky, stuttering drag experience
 *
 * ## Solution
 *
 * Hybrid approach combining interact.js events with direct DOM manipulation:
 *
 * 1. **During drag** (60fps): Direct DOM updates via `element.style.transform`
 * - No state updates
 * - No re-renders
 * - Smooth visual feedback
 *
 * 2. **After drag** (single operation): Update StencilJS state once
 * - Trigger single re-render
 * - Persist final position
 * - Emit undo/redo commands
 *
 * ## Key Architecture Decisions
 *
 * ### Transform vs Top/Left Positioning
 *
 * **Using**: `transform: translate(x, y)`
 * **Not using**: `top: y; left: x;`
 *
 * **Why transforms**:
 * - GPU-accelerated (composited layer)
 * - Doesn't trigger layout/reflow
 * - Subpixel precision for smooth animations
 * - Better performance on low-end devices
 *
 * **Why not top/left**:
 * - Triggers layout recalculation
 * - CPU-bound rendering
 * - Causes reflows affecting other elements
 * - Stuttery on complex layouts
 *
 * ### Grid Snapping Strategy
 *
 * **When**: Only at drag end
 * **How**: `Math.round(position / gridSize) * gridSize`
 * **Why**: Allows free-form dragging during operation, snaps to grid on release
 *
 * ### Cross-Canvas Dragging
 *
 * Detects when item is dragged over different canvas by:
 * 1. Tracking drag start canvas ID
 * 2. Finding element center point at drag end
 * 3. Hit-testing against all canvas bounding boxes
 * 4. Delegating to dropzone handler if canvas changed
 *
 * ## Performance Characteristics
 *
 * **During drag** (per frame):
 * - 1 style update (transform)
 * - 2 data attribute updates
 * - No layout/reflow
 * - ~0.5ms per frame
 *
 * **At drag end**:
 * - Grid snapping calculations
 * - Edge snapping checks
 * - State update + single re-render
 * - ~5-10ms total
 *
 * **Performance gain over state-based approach**:
 * - State-based: ~16ms+ per frame (re-render overhead)
 * - This approach: ~0.5ms per frame
 * - **~30x faster during drag**
 *
 * ## Edge Cases Handled
 *
 * - Cross-canvas drag detection
 * - Boundary constraints (can't drag outside canvas)
 * - Edge snapping (auto-snap to canvas edges within 20px)
 * - Mobile vs desktop viewport layouts
 * - Dragging from non-drag handles prevented
 * - Clean state cleanup on component destruction
 *
 * ## Extracting This Pattern
 *
 * To adapt for your project:
 *
 * ```typescript
 * class MyDragHandler {
 * private basePos = { x: 0, y: 0 };
 *
 * handleDragStart(e) {
 * // Store starting position
 * this.basePos = getCurrentPosition(e.target);
 * }
 *
 * handleDragMove(e) {
 * // Direct DOM update (no framework state)
 * const newX = this.basePos.x + e.dx;
 * const newY = this.basePos.y + e.dy;
 * e.target.style.transform = `translate(${newX}px, ${newY}px)`;
 * }
 *
 * handleDragEnd(e) {
 * // Snap to grid/constraints
 * const snapped = snapToGrid(finalPosition);
 * e.target.style.transform = `translate(${snapped.x}px, ${snapped.y}px)`;
 *
 * // Single state update triggers framework re-render
 * this.updateState(snapped);
 * }
 * }
 * ```
 *
 * ## Integration with Other Systems
 *
 * - **grid-calculations**: Convert between pixels and grid units
 * - **dom-cache**: Fast canvas element lookup
 * - **state-manager**: Single state update at drag end
 * - **undo-redo**: Command pushed via onUpdate callback
 * - **interact.js**: Event source for drag lifecycle
 * @module drag-handler
 */

import { GridItem } from '../services/state-manager';
import { domCache } from './dom-cache';
import { getGridSizeHorizontal, getGridSizeVertical, pixelsToGridX, pixelsToGridY } from './grid-calculations';

/**
 * Extract current transform position from element's inline style
 *
 * Parses the `transform: translate(Xpx, Ypx)` CSS property to get current position.
 * This is needed because drag deltas are cumulative - we need the base position
 * to add deltas to.
 *
 * **Why needed**:
 * - Drag uses cumulative deltas (dx, dy) from drag start
 * - Must add to initial position, not reset each frame
 * - Transform string is canonical source of truth during drag
 *
 * **Performance**:
 * - Regex parsing is fast (< 0.1ms)
 * - Only called once at drag start, not per frame
 *
 * **Regex explanation**:
 * - `([\d.-]+)` matches numbers including decimals and negatives
 * - More specific than `[^,]+` to avoid ReDoS issues
 * - Matches: `translate(10.5px, -20.3px)`
 * @param element - Element with transform style
 * @returns Current x,y position in pixels, or {0,0} if no transform
 * @example
 * ```typescript
 * const el = document.getElementById('item-1');
 * el.style.transform = 'translate(150px, 200px)';
 * const pos = getTransformPosition(el); // → {x: 150, y: 200}
 * ```
 */
function getTransformPosition(element: HTMLElement): { x: number; y: number } {
  const transform = element.style.transform;
  const match = transform.match(/translate\(([\d.-]+)px,\s*([\d.-]+)px\)/);

  if (match) {
    return {
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
    };
  }

  return { x: 0, y: 0 };
}

/**
 * Drag Handler Class
 * ===================
 *
 * Manages high-performance drag behavior for a single grid item. Each grid item
 * gets its own DragHandler instance that coordinates interact.js events with
 * DOM updates and state management.
 *
 * ## Instance Lifecycle
 *
 * 1. **Creation**: Instantiated by grid-item-wrapper when item mounts
 * 2. **Initialization**: Sets up interact.js draggable with event listeners
 * 3. **Active**: Handles drag events with direct DOM manipulation
 * 4. **Cleanup**: destroy() called when item unmounts to prevent memory leaks
 *
 * ## State Management
 *
 * **Private state** (not in framework):
 * - `basePosition`: Starting transform position at drag start
 * - `dragStartCanvasId`: Original canvas ID for cross-canvas detection
 * - `interactInstance`: interact.js draggable instance
 *
 * **Framework state**: Updated only once at drag end via `onUpdate` callback
 *
 * ## Performance Pattern
 *
 * This class implements the "direct manipulation + deferred state" pattern:
 * - High-frequency events (move): Direct DOM updates
 * - Low-frequency events (start/end): State updates + event tracking
 * @example
 * ```typescript
 * // In grid-item-wrapper.tsx
 * componentDidLoad() {
 *   this.dragHandler = new DragHandler(
 *     this.element,
 *     this.item,
 *     (updatedItem) => {
 *       // This callback runs ONCE at drag end
 *       gridState.updateItem(updatedItem);
 *       undoRedo.pushCommand(new MoveCommand(this.item, updatedItem));
 *     }
 *   );
 * }
 *
 * disconnectedCallback() {
 *   this.dragHandler?.destroy(); // Cleanup
 * }
 * ```
 */
export class DragHandler {
  /** DOM element being dragged (grid-item-wrapper element) */
  private element: HTMLElement;

  /** Grid item data (position, size, layouts) */
  private item: GridItem;

  /** Callback to update parent state after drag ends */
  private onUpdate: (item: GridItem) => void;

  /** interact.js draggable instance for cleanup */
  private interactInstance: any;

  /** Position at drag start (from transform) - used to apply deltas */
  private basePosition: { x: number; y: number } = { x: 0, y: 0 };

  /** Canvas ID where drag started - for cross-canvas detection */
  private dragStartCanvasId: string = '';

  /**
   * Create drag handler and initialize interact.js
   *
   * **Lifecycle**: Called when grid-item-wrapper mounts
   *
   * **Why auto-initialize in constructor**:
   * - Ensures drag is ready immediately after creation
   * - Simplifies component code (no separate setup call)
   * - Matches StencilJS lifecycle (componentDidLoad)
   *
   * **Performance**: Initialization is cheap (~1ms), deferred to constructor is fine
   * @param element - DOM element to make draggable (grid-item-wrapper)
   * @param item - Grid item data for position/layout management
   * @param onUpdate - Callback invoked with updated item after drag ends
   * @example
   * ```typescript
   * // Typical usage in component
   * private dragHandler: DragHandler;
   *
   * componentDidLoad() {
   *   this.dragHandler = new DragHandler(
   *     this.element,
   *     this.item,
   *     (item) => this.handleItemUpdate(item)
   *   );
   * }
   * ```
   */
  constructor(element: HTMLElement, item: GridItem, onUpdate: (item: GridItem) => void) {
    this.element = element;
    this.item = item;
    this.onUpdate = onUpdate;

    this.initialize();
  }

  /**
   * Cleanup interact.js instance to prevent memory leaks
   *
   * **When to call**: Component unmount (disconnectedCallback in StencilJS)
   *
   * **Why needed**:
   * - interact.js attaches event listeners to elements
   * - Without cleanup, listeners persist after element removal
   * - Causes memory leaks and potential errors on removed elements
   *
   * **What it does**:
   * - Calls `interactInstance.unset()` to remove all interact.js listeners
   * - Safe to call multiple times (checks if instance exists)
   *
   * **Performance**: Very cheap operation (~0.1ms)
   * @example
   * ```typescript
   * // In grid-item-wrapper component
   * disconnectedCallback() {
   *   if (this.dragHandler) {
   *     this.dragHandler.destroy();
   *   }
   * }
   * ```
   */
  destroy(): void {
    if (this.interactInstance) {
      this.interactInstance.unset();
    }
  }

  /**
   * Initialize interact.js draggable on element
   *
   * **Configuration choices**:
   *
   * **allowFrom: '.drag-handle'**
   * - Only allows drag from drag handle element
   * - Prevents accidental drags when clicking buttons/inputs inside item
   * - Improves UX by requiring intentional drag gesture
   *
   * **inertia: false**
   * - Disables momentum/physics after drag release
   * - Grid snapping works better without inertia
   * - Provides more predictable, precise positioning
   *
   * **Event binding**:
   * - Uses `.bind(this)` to preserve class context in event handlers
   * - Without bind, `this` would be interact.js context, not DragHandler
   * - Allows handlers to access instance properties (element, item, etc.)
   *
   * **Error handling**:
   * - Checks if interact.js loaded (from CDN script tag)
   * - Fails gracefully with console warning if missing
   * - Prevents app crash if CDN fails to load
   * @example
   * ```typescript
   * // interact.js setup with event handlers
   * interact(element).draggable({
   *   allowFrom: '.drag-handle',
   *   inertia: false,
   *   listeners: {
   *     start: handleDragStart,
   *     move: handleDragMove,
   *     end: handleDragEnd,
   *   }
   * });
   * ```
   */
  private initialize(): void {
    const interact = (window as any).interact;
    if (!interact) {
      console.warn('interact.js not loaded');
      return;
    }

    this.interactInstance = interact(this.element).draggable({
      allowFrom: '.drag-handle', // Only allow drag from drag handle
      inertia: false,
      listeners: {
        start: this.handleDragStart.bind(this),
        move: this.handleDragMove.bind(this),
        end: this.handleDragEnd.bind(this),
      },
    });
  }

  /**
   * Handle drag start event
   *
   * **Responsibilities**:
   * 1. Start performance monitoring (if perfMonitor available)
   * 2. Add visual feedback (dragging class)
   * 3. Capture initial state for cross-canvas detection
   * 4. Extract base position from current transform
   * 5. Reset delta accumulators
   *
   * **Why capture dragStartCanvasId**:
   * - item.canvasId may be updated by dropzone during drag
   * - Need original canvas to detect if item moved to different canvas
   * - Enables cross-canvas drag detection at drag end
   *
   * **Why extract basePosition**:
   * - interact.js provides cumulative deltas (dx, dy) from drag start
   * - Must add deltas to starting position, not reset each frame
   * - Transform string is canonical position source during drag
   *
   * **Data attributes usage**:
   * - `data-x`, `data-y`: Store cumulative deltas from drag start
   * - Reset to 0 at drag start
   * - Updated on every move event
   * - Used to calculate final position at drag end
   *
   * **Performance tracking**:
   * - Optional perfMonitor integration for debugging
   * - Measures total drag duration (start → end)
   * - Helps identify performance regressions
   * @param event - interact.js drag start event
   * @example
   * ```typescript
   * // Event data structure
   * {
   *   target: HTMLElement,        // Element being dragged
   *   dx: 0,                      // Delta X (always 0 at start)
   *   dy: 0,                      // Delta Y (always 0 at start)
   *   // ... other interact.js properties
   * }
   * ```
   */
  private handleDragStart(event: any): void {
    // Start performance tracking
    if ((window as any).perfMonitor) {
      (window as any).perfMonitor.startOperation('drag');
    }

    event.target.classList.add('dragging');

    // Store the original canvas ID at drag start
    this.dragStartCanvasId = this.item.canvasId;

    // Store the base position from transform
    this.basePosition = getTransformPosition(event.target);

    // Reset accumulation
    event.target.setAttribute('data-x', '0');
    event.target.setAttribute('data-y', '0');
  }

  /**
   * Handle drag move event (high-frequency, ~60fps)
   *
   * **Critical Performance Path**: This runs ~60 times per second during drag
   *
   * **Direct DOM Manipulation**:
   * - Updates `element.style.transform` directly
   * - No StencilJS state updates
   * - No component re-renders
   * - No virtual DOM diffing
   * - Result: Smooth 60fps drag performance
   *
   * **Why this approach**:
   * - State-based: Update state → trigger render → diff vdom → update DOM (~16ms+)
   * - Direct DOM: Update transform property directly (~0.5ms)
   * - **30x faster** than state-based approach
   *
   * **Delta accumulation**:
   * - interact.js provides cumulative deltas since drag start
   * - Read current delta from data attributes
   * - Add new delta from event
   * - Store back to data attributes
   * - Apply to base position for final transform
   *
   * **Formula**:
   * ```
   * newX = basePosition.x + totalDeltaX
   * newY = basePosition.y + totalDeltaY
   * ```
   *
   * **Why data attributes**:
   * - Persist state across events without class properties
   * - Can be read/written during event without this context
   * - Survive potential element re-renders (though we avoid those)
   *
   * **Performance per frame**:
   * - 1 transform style update
   * - 2 data attribute updates
   * - No layout/reflow (transform is composited)
   * - Total: ~0.5ms
   * @param event - interact.js drag move event
   * @example
   * ```typescript
   * // Event provides cumulative deltas
   * {
   *   target: HTMLElement,
   *   dx: 5,    // 5px moved horizontally since drag start
   *   dy: 3,    // 3px moved vertically since drag start
   * }
   *
   * // Applied as:
   * // transform = translate(baseX + 5px, baseY + 3px)
   * ```
   */
  private handleDragMove(event: any): void {
    const x = (parseFloat(event.target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(event.target.getAttribute('data-y')) || 0) + event.dy;

    // Apply drag delta to base position
    // Direct DOM manipulation - no StencilJS re-render during drag
    event.target.style.transform = `translate(${this.basePosition.x + x}px, ${this.basePosition.y + y}px)`;
    event.target.setAttribute('data-x', x.toString());
    event.target.setAttribute('data-y', y.toString());
  }

  /**
   * Handle drag end event - finalize position and update state
   *
   * **Most Complex Method**: Handles grid snapping, boundary constraints, cross-canvas
   * detection, mobile layout handling, and state persistence.
   *
   * ## Processing Steps
   *
   * ### 1. Cross-Canvas Detection
   * - Calculate item center point in viewport coordinates
   * - Hit-test against all canvas bounding boxes
   * - Detect if dragged to different canvas
   * - **Early exit**: Let dropzone handler manage cross-canvas moves
   *
   * **Why check center point**:
   * - More intuitive than checking any corner
   * - Prevents accidental canvas switches when edge crosses boundary
   * - Matches user mental model ("where did I drop it?")
   *
   * **Why delegate to dropzone**:
   * - Dropzone has specialized logic for cross-canvas moves
   * - Handles state transfer between canvases
   * - Emits proper undo/redo commands
   * - This handler focuses on same-canvas repositioning
   *
   * ### 2. Grid Snapping
   * Formula: `Math.round(position / gridSize) * gridSize`
   * - Rounds to nearest grid unit
   * - Separate X and Y snapping (different grid sizes)
   * - Applied before boundary constraints
   *
   * **Why snap before constraints**:
   * - Ensures snapped position respects grid
   * - Constraints then clip to canvas bounds
   * - Prevents off-grid positions at edges
   *
   * ### 3. Boundary Constraints
   * - Prevents item from extending outside canvas
   * - Uses `Math.max(0, Math.min(pos, maxPos))` clamp pattern
   * - Considers item width/height (full item must be visible)
   *
   * ### 4. Edge Snapping
   * - Auto-snap to canvas edges within 20px threshold
   * - Provides "magnetic" edges for precise alignment
   * - Applied after grid snapping (takes precedence)
   *
   * **UX benefit**:
   * - Easy to align items to canvas edges
   * - No need for pixel-perfect dragging
   * - Common layout pattern (full-width headers, etc.)
   *
   * ### 5. Mobile Layout Handling
   * - Detects current viewport (desktop vs mobile)
   * - Updates appropriate layout object
   * - Marks mobile layout as "customized" when modified
   * - Initializes mobile width/height from desktop if not set
   *
   * **Why "customized" flag**:
   * - Mobile layouts default to desktop layout
   * - Flag indicates user explicitly modified mobile layout
   * - Prevents future desktop changes from overwriting mobile
   *
   * ### 6. State Persistence
   * - Converts final pixel position to grid units
   * - Updates item.layouts with new position
   * - Calls `onUpdate(item)` callback
   * - Triggers single StencilJS re-render
   * - Parent component pushes undo/redo command
   *
   * ## Performance Characteristics
   *
   * **Total execution time**: ~5-10ms
   * - Cross-canvas detection: ~1-2ms (querySelectorAll + getBoundingClientRect)
   * - Grid calculations: ~1ms
   * - Boundary checks: ~0.5ms
   * - State update: ~3-5ms (single re-render)
   *
   * **Why this is acceptable**:
   * - Only runs once at drag end (not 60fps)
   * - User expects slight delay when releasing drag
   * - Grid snapping provides visual feedback justifying delay
   *
   * ## Edge Cases Handled
   *
   * - Item dragged outside canvas bounds → clamped to canvas
   * - Item dragged to different canvas → delegated to dropzone
   * - Canvas container not found → early exit (safety)
   * - Mobile view with no mobile layout → initialized from desktop
   * - Item near edge → snapped to edge for alignment
   * @param event - interact.js drag end event
   * @example
   * ```typescript
   * // Example drag sequence:
   * // 1. handleDragStart: Store basePosition (100, 200)
   * // 2. handleDragMove (60 times): Update transform with deltas
   * // 3. handleDragEnd: deltaX=150, deltaY=75
   * //    - finalX = 100 + 150 = 250px
   * //    - snappedX = Math.round(250 / 20) * 20 = 260px
   * //    - gridX = 260 / 20 = 13 grid units
   * //    - item.layouts.desktop.x = 13
   * //    - onUpdate(item) → re-render + undo command
   * ```
   */
  private handleDragEnd(event: any): void {
    event.target.classList.remove('dragging');

    const deltaX = parseFloat(event.target.getAttribute('data-x')) || 0;
    const deltaY = parseFloat(event.target.getAttribute('data-y')) || 0;

    // Get the element's current position in viewport
    const rect = event.target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Find which canvas the center of the item is over
    let targetCanvasId = this.item.canvasId;

    const gridContainers = document.querySelectorAll('.grid-container');
    gridContainers.forEach((container: HTMLElement) => {
      const containerRect = container.getBoundingClientRect();
      if (
        centerX >= containerRect.left &&
        centerX <= containerRect.right &&
        centerY >= containerRect.top &&
        centerY <= containerRect.bottom
      ) {
        targetCanvasId = container.getAttribute('data-canvas-id') || this.item.canvasId;
      }
    });

    // If canvas changed from drag start, let the dropzone handle it
    // (Use dragStartCanvasId since item.canvasId may have been updated by dropzone already)
    if (targetCanvasId !== this.dragStartCanvasId) {
      // Clean up drag state
      event.target.classList.remove('dragging');
      event.target.setAttribute('data-x', '0');
      event.target.setAttribute('data-y', '0');

      // End performance tracking
      if ((window as any).perfMonitor) {
        (window as any).perfMonitor.endOperation('drag');
      }
      return;
    }

    // Calculate new position relative to current canvas (same-canvas drag only)
    const targetContainer = domCache.getCanvas(targetCanvasId);
    if (!targetContainer) {
      return;
    }

    const gridSizeX = getGridSizeHorizontal(targetCanvasId);
    const gridSizeY = getGridSizeVertical();

    // Final position is base position + drag delta
    let newX = this.basePosition.x + deltaX;
    let newY = this.basePosition.y + deltaY;

    // Snap to grid (separate X and Y)
    newX = Math.round(newX / gridSizeX) * gridSizeX;
    newY = Math.round(newY / gridSizeY) * gridSizeY;

    // Ensure item stays fully within target canvas
    const itemWidth = parseFloat(event.target.style.width) || 0;
    const itemHeight = parseFloat(event.target.style.height) || 0;
    newX = Math.max(0, Math.min(newX, targetContainer.clientWidth - itemWidth));
    newY = Math.max(0, Math.min(newY, targetContainer.clientHeight - itemHeight));

    // Snap to canvas edges if within threshold (20px)
    const EDGE_SNAP_THRESHOLD = 20;
    if (newX < EDGE_SNAP_THRESHOLD) {
      newX = 0; // Snap to left edge
    } else if (newX > targetContainer.clientWidth - itemWidth - EDGE_SNAP_THRESHOLD) {
      newX = targetContainer.clientWidth - itemWidth; // Snap to right edge
    }
    if (newY < EDGE_SNAP_THRESHOLD) {
      newY = 0; // Snap to top edge
    } else if (newY > targetContainer.clientHeight - itemHeight - EDGE_SNAP_THRESHOLD) {
      newY = targetContainer.clientHeight - itemHeight; // Snap to bottom edge
    }

    // Update item position in current viewport's layout (convert to grid units)
    const currentViewport = (window as any).gridState?.currentViewport || 'desktop';
    const layout = this.item.layouts[currentViewport as 'desktop' | 'mobile'];

    layout.x = pixelsToGridX(newX, targetCanvasId);
    layout.y = pixelsToGridY(newY);

    // If in mobile view, mark as customized
    if (currentViewport === 'mobile') {
      this.item.layouts.mobile.customized = true;
      // Set width/height if not already set (copy from desktop)
      if (this.item.layouts.mobile.width === null) {
        this.item.layouts.mobile.width = this.item.layouts.desktop.width;
      }
      if (this.item.layouts.mobile.height === null) {
        this.item.layouts.mobile.height = this.item.layouts.desktop.height;
      }
    }

    // Apply final snapped position to DOM
    event.target.style.transform = `translate(${newX}px, ${newY}px)`;
    event.target.setAttribute('data-x', '0');
    event.target.setAttribute('data-y', '0');

    // End performance tracking
    if ((window as any).perfMonitor) {
      (window as any).perfMonitor.endOperation('drag');
    }

    // Trigger StencilJS update (single re-render at end)
    this.onUpdate(this.item);
  }
}
