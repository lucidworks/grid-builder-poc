/**
 * Grid Configuration Types
 * =========================
 *
 * Configuration options for the grid builder's grid system, snapping behavior,
 * and virtual rendering performance.
 */

/**
 * Grid Configuration Interface
 * ==============================
 *
 * Configures the grid builder's grid system, snapping behavior, and rendering optimizations.
 *
 * **Example: Default configuration**
 * ```typescript
 * const defaultConfig: GridConfig = {
 *   gridSizePercent: 2,
 *   minGridSize: 10,
 *   maxGridSize: 50,
 *   snapToGrid: true,
 *   showGridLines: true,
 *   minItemSize: { width: 5, height: 4 },
 *   virtualRenderMargin: '20%'
 * };
 * ```
 *
 * **Example: Custom configuration**
 * ```typescript
 * const customConfig: GridConfig = {
 *   gridSizePercent: 3,           // Larger grid (3% instead of 2%)
 *   snapToGrid: false,            // Free positioning
 *   showGridLines: false,         // Hide grid
 *   virtualRenderMargin: '30%'    // Aggressive pre-rendering
 * };
 * ```
 */
export interface GridConfig {
  /**
   * Grid size as percentage of canvas width
   *
   * **Default**: 2 (2% of canvas width per grid unit)
   * **Calculation**: Canvas width = 100% = 50 grid units (at 2%)
   * **Typical values**:
   * - 1: Fine grid (100 units = 100% width)
   * - 2: Standard grid (50 units = 100% width) ✅ Recommended
   * - 3: Coarse grid (33 units = 100% width)
   * - 5: Very coarse grid (20 units = 100% width)
   *
   * **Impact**:
   * - Smaller % = more granular positioning
   * - Larger % = less granular, easier alignment
   *
   * @default 2
   */
  gridSizePercent?: number;

  /**
   * Vertical grid size in pixels
   *
   * **Default**: 20px
   * **Purpose**: Fixed vertical spacing for grid rows
   * **Used for**: Y-axis positioning, height calculations, grid background
   *
   * **Typical values**:
   * - 15: Compact vertical spacing
   * - 20: Standard vertical spacing ✅ Recommended
   * - 25: Spacious vertical spacing
   * - 30: Very spacious vertical spacing
   *
   * **Impact**:
   * - Smaller value = more granular vertical positioning
   * - Larger value = less granular, larger minimum heights
   *
   * @default 20
   */
  verticalGridSize?: number;

  /**
   * Minimum grid size in pixels
   *
   * **Default**: 10px
   * **Purpose**: Prevents grid from becoming too small on tiny screens
   * **Calculation**: `Math.max(minGridSize, canvasWidth * gridSizePercent / 100)`
   *
   * **Typical values**:
   * - 5: Allow very small grids (mobile)
   * - 10: Standard minimum ✅ Recommended
   * - 20: Larger minimum (desktop-only)
   *
   * @default 10
   */
  minGridSize?: number;

  /**
   * Maximum grid size in pixels
   *
   * **Default**: 50px
   * **Purpose**: Prevents grid from becoming too large on huge screens
   * **Calculation**: `Math.min(maxGridSize, canvasWidth * gridSizePercent / 100)`
   *
   * **Typical values**:
   * - 30: Smaller maximum (fine positioning)
   * - 50: Standard maximum ✅ Recommended
   * - 100: Larger maximum (coarse positioning)
   *
   * @default 50
   */
  maxGridSize?: number;

  /**
   * Enable snap-to-grid behavior
   *
   * **Default**: true
   * **When true**: Items snap to grid during drag/resize
   * **When false**: Free-form positioning (pixel-perfect)
   *
   * **Use cases**:
   * - true: Consistent alignment, easier UI building ✅ Recommended
   * - false: Precise control, artistic freedom
   *
   * @default true
   */
  snapToGrid?: boolean;

  /**
   * Minimum item size (grid units)
   *
   * **Default**: { width: 5, height: 4 }
   * **Purpose**: Prevents items from becoming too small to interact with
   * **Applied**: During resize operations
   *
   * **Typical values**:
   * - { width: 3, height: 3 }: Very small minimum
   * - { width: 5, height: 4 }: Standard minimum ✅ Recommended
   * - { width: 10, height: 8 }: Large minimum
   *
   * **Note**: Components can override with their own minSize in ComponentDefinition
   *
   * @default { width: 5, height: 4 }
   */
  minItemSize?: {
    width: number;
    height: number;
  };

  /**
   * Show visual grid lines on canvases
   *
   * **Default**: true
   * **Implementation**: CSS background-image with repeating grid pattern
   * **Purpose**: Visual aid for alignment
   *
   * **Use cases**:
   * - true: Helps users align items ✅ Recommended for building
   * - false: Cleaner look for presentations/previews
   *
   * @default true
   */
  showGridLines?: boolean;

  /**
   * Virtual rendering pre-render margin
   *
   * **What it does**: Components start rendering this distance BEFORE entering viewport
   * **Why**: Prevents "pop-in" flash as user scrolls - components load smoothly in advance
   *
   * **Accepts**: Pixels ('200px') or percentage of viewport ('20%')
   *
   * **Default**: '20%' (responsive - adapts to screen size)
   *
   * **Recommended (percentage - adapts to screen size):**
   * - '20%' (default): Balanced - smooth loading on all devices ✅
   *   - Mobile (667px): 133px margin
   *   - Desktop (1080px): 216px margin
   * - '30%': Aggressive - better for slow devices/connections, uses more memory
   *   - Mobile: 200px margin
   *   - Desktop: 324px margin
   * - '10%': Conservative - less memory, might see brief pop-in
   *   - Mobile: 67px margin
   *   - Desktop: 108px margin
   *
   * **Alternative (pixels - fixed distance):**
   * - '200px': Fixed 200px margin (good for desktop-only apps)
   * - '400px': Larger fixed margin (desktop, aggressive pre-loading)
   * - '100px': Smaller fixed margin (desktop, conservative)
   *
   * **Rule of thumb:**
   * - Use % for responsive apps (mobile + desktop) ✅ Recommended
   * - Use px for fixed-size apps (desktop-only)
   * - Higher margin = smoother but uses more memory
   *
   * **Memory impact**:
   * - 20% margin: ~34 KB overhead for 100 components
   * - 30% margin: ~50 KB overhead for 100 components
   * - Savings: 2-10 MB per 100 components (50-200× ROI)
   *
   * **Performance characteristics**:
   * - Pre-render margin controls when components **start** rendering
   * - Once rendered, components **stay** rendered (no de-rendering)
   * - Virtual rendering is **always enabled** for all components
   *
   * @default '20%'
   */
  virtualRenderMargin?: string;

  /**
   * Event debounce delay in milliseconds
   *
   * **What it does**: Delays high-frequency events to reduce excessive calls
   * **Why**: Drag/resize events fire on every pixel - debouncing groups them together
   *
   * **Default**: 300ms (good balance between responsiveness and performance)
   *
   * **Events that are debounced**:
   * - `componentDragged` - fires during drag (every pixel)
   * - `componentResized` - fires during resize (every pixel)
   * - `stateChanged` - fires on any state update
   *
   * **Events that are NOT debounced** (fire immediately):
   * - `componentSelected` - click selection
   * - `componentDeleted` - delete action
   * - `componentAdded` - add action
   * - `canvasAdded` - canvas operations
   * - `canvasRemoved` - canvas operations
   *
   * **Typical values**:
   * - 0: No debouncing (fire immediately - may cause performance issues)
   * - 150ms: Fast response (good for local state updates)
   * - 300ms: Balanced (default) ✅ Recommended
   * - 500ms: Slower response (good for API calls, reduces server load)
   * - 1000ms: Very slow (use only for expensive operations)
   *
   * **Use cases**:
   * - **Auto-save to API**: Use 500-1000ms to reduce server calls
   * - **Local state sync**: Use 150-300ms for responsive feel
   * - **Analytics tracking**: Use 300-500ms to batch events
   *
   * **Example - Auto-save with debouncing**:
   * ```typescript
   * const config: GridConfig = {
   *   eventDebounceDelay: 500  // Wait 500ms after last change before saving
   * };
   *
   * api.on('stateChanged', async () => {
   *   // This only fires 500ms after user stops making changes
   *   await fetch('/api/save', {
   *     method: 'POST',
   *     body: JSON.stringify(await api.exportState())
   *   });
   * });
   * ```
   *
   * @default 300
   */
  eventDebounceDelay?: number;

  /**
   * Enable auto-scroll during drag operations
   *
   * **What it does**: Automatically scrolls the page when dragging an item near the edge of a scrollable container
   * **Why**: Allows users to drag items to areas not currently visible without manually scrolling
   *
   * **Default**: true (enabled for better UX)
   *
   * **How it works**:
   * - Detects when item is dragged within 60px of container edge
   * - Automatically scrolls the nearest scrollable parent container
   * - Scroll speed increases as item gets closer to edge
   * - Works with both canvas scrolling and window scrolling
   *
   * **Use cases**:
   * - **Long scrollable pages**: Essential for dragging items across long layouts
   * - **Nested scrollable containers**: Works with canvas containers inside scrollable divs
   * - **Constrained viewports**: Useful when grid-builder is in a fixed-height container
   *
   * **When to disable** (set to false):
   * - Small grids that fit entirely in viewport (no scrolling needed)
   * - Custom scroll handling implemented
   * - Performance-critical scenarios (though auto-scroll is highly optimized)
   *
   * **Example - Disable auto-scroll**:
   * ```typescript
   * const config: GridConfig = {
   *   enableAutoScroll: false  // Disable if grid fits in viewport
   * };
   * ```
   *
   * @default true
   */
  enableAutoScroll?: boolean;

  /**
   * Enable smooth CSS transitions for animations
   *
   * **What it does**: Adds smooth CSS transitions when items snap to grid or resize
   * **Why**: Provides polished visual feedback for drag/resize operations
   *
   * **Default**: false (disabled for performance and instant feedback)
   *
   * **What gets animated** (when enabled):
   * - Grid snapping at drag end (smooth snap to grid instead of instant)
   * - Resize handle operations (smooth size changes)
   * - Selection border appearance/disappearance
   *
   * **Performance considerations**:
   * - Animations use GPU-accelerated CSS transforms
   * - Very low performance impact (~0.1ms per frame)
   * - May feel slightly less responsive than instant snapping
   * - Some users prefer instant feedback (hence disabled by default)
   *
   * **Use cases**:
   * - **Presentation/demo mode**: Polished animations for showcasing
   * - **Public-facing apps**: Better visual appeal for end users
   * - **Design-focused apps**: When aesthetics matter more than speed
   *
   * **When to disable** (default):
   * - **Power users**: Prefer instant feedback without animation delay
   * - **Performance-critical apps**: Eliminate any animation overhead
   * - **Precise positioning**: Instant snapping shows exact final position
   *
   * **Example - Enable animations**:
   * ```typescript
   * const config: GridConfig = {
   *   enableAnimations: true,       // Enable smooth transitions
   *   animationDuration: 150        // Fast animations (150ms)
   * };
   * ```
   *
   * @default false
   */
  enableAnimations?: boolean;

  /**
   * Animation duration in milliseconds (only used if enableAnimations is true)
   *
   * **What it controls**: Duration of CSS transitions for drag/resize animations
   * **Default**: 200ms (balanced - not too slow, not too fast)
   *
   * **Typical values**:
   * - 100ms: Very fast, subtle animation
   * - 150ms: Fast, responsive feel ✅ Recommended for power users
   * - 200ms: Balanced (default) ✅ Recommended for general use
   * - 300ms: Slower, more noticeable animation
   * - 400ms+: Very slow, primarily for presentations
   *
   * **Rule of thumb**:
   * - Shorter durations (100-150ms) feel more responsive
   * - Longer durations (300-400ms) feel more polished but slower
   * - Don't exceed 500ms (feels sluggish)
   *
   * **Example - Fast animations**:
   * ```typescript
   * const config: GridConfig = {
   *   enableAnimations: true,
   *   animationDuration: 150  // Fast, snappy animations
   * };
   * ```
   *
   * @default 200
   */
  animationDuration?: number;
}
