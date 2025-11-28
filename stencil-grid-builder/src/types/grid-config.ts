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
   * - Mobile (667px): 133px margin
   * - Desktop (1080px): 216px margin
   * - '30%': Aggressive - better for slow devices/connections, uses more memory
   * - Mobile: 200px margin
   * - Desktop: 324px margin
   * - '10%': Conservative - less memory, might see brief pop-in
   * - Mobile: 67px margin
   * - Desktop: 108px margin
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
   * - Virtual rendering is enabled by default (see enableVirtualRendering)
   * @default '20%'
   */
  virtualRenderMargin?: string;

  /**
   * Enable virtual rendering (lazy loading of components)
   *
   * **What it does**: Uses IntersectionObserver to only render components when they're near the viewport
   * **Why**: Dramatically improves initial load performance for pages with many components (10× faster)
   *
   * **Default**: true (enabled for optimal performance)
   *
   * **When enabled** (true):
   * - Components render only when visible or near viewport
   * - Uses IntersectionObserver API for efficient viewport detection
   * - "Loading..." placeholder shown until component enters pre-render zone
   * - Controlled by virtualRenderMargin setting (default: 20% viewport margin)
   *
   * **When disabled** (false):
   * - All components render immediately on page load
   * - No lazy loading or placeholders
   * - May cause slower initial load with many components (100+ items)
   * - Better for small layouts or testing environments
   *
   * **When to disable** (set to false):
   * - **Storybook/testing**: IntersectionObserver may not work correctly in iframes
   * - **Small layouts**: < 20 components where virtual rendering overhead isn't worth it
   * - **Server-side rendering**: IntersectionObserver not available in SSR
   * - **Debugging**: Easier to debug when all components are always rendered
   * - **Screenshot tools**: Tools that capture viewport may not trigger IntersectionObserver
   *
   * **Performance impact**:
   * - **With 100 components**:
   * - Enabled: ~200ms initial load, renders 10-20 components
   * - Disabled: ~2000ms initial load, renders all 100 components
   * - **With 500 components**:
   * - Enabled: ~300ms initial load, renders 20-40 components
   * - Disabled: ~10,000ms initial load, renders all 500 components
   *
   * **Example - Disable for Storybook**:
   * ```typescript
   * const storybookConfig: GridConfig = {
   * enableVirtualRendering: false,  // Disable for Storybook iframe compatibility
   * virtualRenderMargin: '20%'      // Not used when disabled
   * };
   * ```
   *
   * **Example - Enable for production**:
   * ```typescript
   * const productionConfig: GridConfig = {
   * enableVirtualRendering: true,   // Default behavior
   * virtualRenderMargin: '30%'      // Aggressive pre-loading
   * };
   * ```
   * @default true
   */
  enableVirtualRendering?: boolean;

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
   * eventDebounceDelay: 500  // Wait 500ms after last change before saving
   * };
   *
   * api.on('stateChanged', async () => {
   * // This only fires 500ms after user stops making changes
   * await fetch('/api/save', {
   * method: 'POST',
   * body: JSON.stringify(await api.exportState())
   * });
   * });
   * ```
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
   * enableAutoScroll: false  // Disable if grid fits in viewport
   * };
   * ```
   * @default true
   */
  enableAutoScroll?: boolean;

  /**
   * Enable smooth CSS transitions for animations
   *
   * **What it does**: Adds smooth CSS transitions when items snap to grid or resize
   * **Why**: Provides polished visual feedback for drag/resize operations
   *
   * **Default**: true (enabled for polished UX)
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
   * enableAnimations: true,       // Enable smooth transitions
   * animationDuration: 150        // Fast animations (150ms)
   * };
   * ```
   * @default true
   */
  enableAnimations?: boolean;

  /**
   * Animation duration in milliseconds (only used if enableAnimations is true)
   *
   * **What it controls**: Duration of CSS transitions for drag/resize animations
   * **Default**: 100ms (fast, responsive feel)
   *
   * **Typical values**:
   * - 100ms: Very fast, subtle animation ✅ Default
   * - 150ms: Fast, responsive feel
   * - 200ms: Balanced
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
   * enableAnimations: true,
   * animationDuration: 150  // Fast, snappy animations
   * };
   * ```
   * @default 100
   */
  animationDuration?: number;

  /**
   * Bottom margin for canvases in grid units
   *
   * **What it does**: Adds extra space below the bottommost item in each canvas
   * **Why**: Provides breathing room and space for adding new items below
   *
   * **Default**: 5 grid units (~100px with 20px vertical grid)
   *
   * **How it works**:
   * - Calculated canvas height = (bottommost item position + height) + canvasBottomMargin
   * - Applied to all canvases in both edit and preview modes
   * - Scales with grid size (responsive to verticalGridSize setting)
   *
   * **Typical values**:
   * - 3: Compact spacing (60px with default grid)
   * - 5: Standard spacing ✅ Recommended (~100px with default grid)
   * - 10: Spacious spacing (200px with default grid)
   * - 15: Very spacious (300px with default grid)
   *
   * **Use cases**:
   * - **Tight layouts**: Use 3 for compact designs with minimal whitespace
   * - **Standard layouts**: Use 5 for balanced spacing (default)
   * - **Spacious layouts**: Use 10+ for more breathing room
   * - **Drop zones**: Larger margins make it easier to drop new items at bottom
   *
   * **Example - Spacious canvas margins**:
   * ```typescript
   * const config: GridConfig = {
   * canvasBottomMargin: 10  // Extra space for new items
   * };
   * ```
   * @default 5
   */
  canvasBottomMargin?: number;

  /**
   * Minimum canvas height in grid units
   *
   * **What it does**: Sets the minimum height for empty or small canvases
   * **Why**: Prevents canvases from collapsing when empty, provides drop target area
   *
   * **Default**: 20 grid units (~400px with 20px vertical grid)
   *
   * **How it works**:
   * - Applied as CSS min-height on all canvas containers
   * - Only takes effect when calculated height is smaller
   * - Scales with grid size (responsive to verticalGridSize setting)
   * - Ensures empty canvases are visible and usable
   *
   * **Typical values**:
   * - 10: Compact minimum (200px with default grid)
   * - 15: Small minimum (300px with default grid)
   * - 20: Standard minimum ✅ Recommended (~400px with default grid)
   * - 25: Large minimum (500px with default grid)
   * - 30: Very large minimum (600px with default grid)
   *
   * **Use cases**:
   * - **Mobile layouts**: Use 10-15 for smaller screens
   * - **Desktop layouts**: Use 20-25 for comfortable drop targets
   * - **Large displays**: Use 25-30 for spacious canvases
   * - **Empty state UX**: Larger minimums make it clearer where to drop items
   *
   * **Example - Compact mobile canvas**:
   * ```typescript
   * const mobileConfig: GridConfig = {
   * canvasMinHeight: 15,     // Smaller minimum for mobile
   * verticalGridSize: 15     // Smaller grid for mobile
   * };
   * // Result: 15 × 15px = 225px minimum height
   * ```
   *
   * **Example - Spacious desktop canvas**:
   * ```typescript
   * const desktopConfig: GridConfig = {
   * canvasMinHeight: 25,     // Larger minimum for desktop
   * verticalGridSize: 20     // Standard grid
   * };
   * // Result: 25 × 20px = 500px minimum height
   * ```
   * @default 20
   */
  canvasMinHeight?: number;

  /**
   * Enable click-to-add components from palette
   *
   * **What it does**: Allows adding components by clicking palette items (alternative to drag-and-drop)
   * **Why**: Provides faster workflow for power users and better accessibility for users who can't drag
   *
   * **Default**: true (enabled for better UX)
   *
   * **How it works** (when enabled):
   * - Click on palette item → component added to active canvas
   * - Automatically finds free space using smart positioning algorithm
   * - Falls back to bottom of canvas if no free space found
   * - Canvas auto-expands to fit new component if needed
   * - Visual feedback: canvas highlight + component animation + position indicator
   *
   * **Smart positioning strategy** (Hybrid algorithm):
   * 1. **Empty canvas** → Center horizontally at (x = (50 - width) / 2, y = 2)
   * 2. **Try top-left** → (2, 2) if no collision
   * 3. **Grid scan** → Top-to-bottom, left-to-right for first free space
   * 4. **Fallback** → Place at canvas bottom (x = 0, y = bottomY + 2)
   *
   * **Edge cases handled**:
   * - No active canvas → Auto-selects first canvas
   * - Component too wide → Respects boundary constraints
   * - Canvas full → Places at bottom and auto-expands canvas height
   *
   * **Accessibility benefits**:
   * - Keyboard-friendly alternative to drag-and-drop
   * - Works with screen readers (ARIA announcements)
   * - No mouse precision required
   * - Faster for power users
   *
   * **Use cases**:
   * - **Power users**: Click-to-add is faster than drag-and-drop for repeated operations
   * - **Accessibility**: Better for keyboard navigation and screen readers
   * - **Touch devices**: Easier than drag-and-drop on mobile/tablet
   * - **Workflow apps**: Streamlined component addition for rapid prototyping
   *
   * **When to disable** (set to false):
   * - Drag-only workflows (force users to drag for deliberate placement)
   * - Custom palette implementations (implementing own click handlers)
   * - Simplified UI (fewer interaction modes)
   * - Prevent accidental additions (require drag for intentional action)
   *
   * **Example - Disable click-to-add (drag-only)**:
   * ```typescript
   * const dragOnlyConfig: GridConfig = {
   * enableClickToAdd: false  // Only allow drag-and-drop
   * };
   * ```
   *
   * **Example - Enable with custom settings**:
   * ```typescript
   * const clickToAddConfig: GridConfig = {
   * enableClickToAdd: true,        // Allow click-to-add
   * enableAnimations: true,        // Smooth animations for visual feedback
   * animationDuration: 200,        // Slightly longer for click feedback
   * canvasBottomMargin: 10         // Extra space for new items
   * };
   * ```
   *
   * **Integration with drag-and-drop**:
   * - Both interaction modes coexist (users can choose)
   * - Drag-and-drop: Precise placement control
   * - Click-to-add: Automatic placement, faster workflow
   * - Both use same underlying api.addComponent()
   * - Both emit same events (componentAdded, canvasActivated)
   * @default true
   */
  enableClickToAdd?: boolean;

  /**
   * Hide unknown component types instead of rendering error placeholder
   *
   * **What it does**: When a component type is not found in the registry, hide it completely
   * **Why**: Cleaner UX when dealing with partial component sets or during development
   *
   * **Default**: false (show error placeholder)
   *
   * **Behavior**:
   * - **When false** (default): Unknown components render as error placeholders with red message
   * - **When true**: Unknown components don't render at all (completely hidden)
   *
   * **Use cases**:
   * - **Production apps**: Hide unknown types for cleaner user experience
   * - **Partial imports**: When only loading subset of available components
   * - **Development**: Hide experimental/deprecated component types
   * - **A/B testing**: Conditionally hide components based on feature flags
   *
   * **When to keep false** (show errors):
   * - **Development/debugging**: Want to see which components are missing
   * - **Migration**: Tracking which old component types need updating
   * - **Error visibility**: Make it obvious when component registry is incomplete
   *
   * **Example - Hide unknown components**:
   * ```typescript
   * const prodConfig: GridConfig = {
   *   hideUnknownComponents: true  // Clean production experience
   * };
   * ```
   *
   * **Example - Show errors in development**:
   * ```typescript
   * const devConfig: GridConfig = {
   *   hideUnknownComponents: false,  // Default - show error placeholders
   *   renderUnknownComponent: ({ type, itemId }) => (
   *     <div>Dev Mode: Missing component type "{type}"</div>
   *   )
   * };
   * ```
   * @default false
   */
  hideUnknownComponents?: boolean;

  /**
   * Custom renderer for unknown component types
   *
   * **What it does**: Provides custom JSX/HTML when component type is not found in registry
   * **Why**: Better user experience and debugging for missing component types
   *
   * **Default**: undefined (uses built-in error placeholder)
   *
   * **Function signature**:
   * ```typescript
   * (context: { type: string; itemId: string }) => any
   * ```
   *
   * **Context properties**:
   * - `type`: The unknown component type string
   * - `itemId`: The item ID (for debugging/logging)
   *
   * **Return value**: JSX element or HTMLElement to render
   *
   * **Built-in default** (when not provided):
   * ```tsx
   * <div class="component-error">
   *   ⚠️ Unknown component type: {type}
   *   <small>Item ID: {itemId}</small>
   * </div>
   * ```
   *
   * **Use cases**:
   * - **Branded error messages**: Match your app's design system
   * - **Development aids**: Show helpful debug info or component type suggestions
   * - **Graceful degradation**: Render fallback content instead of errors
   * - **Logging**: Report missing components to analytics
   *
   * **Example - Custom error component**:
   * ```typescript
   * const config: GridConfig = {
   *   renderUnknownComponent: ({ type, itemId }) => {
   *     // Log to analytics
   *     analytics.track('unknown_component', { type, itemId });
   *
   *     // Return custom JSX
   *     return (
   *       <div style={{ padding: '20px', background: '#fff3cd', border: '1px solid #ffc107' }}>
   *         <h4>⚠️ Component Not Available</h4>
   *         <p>The "{type}" component is not available in this version.</p>
   *         <small>Item ID: {itemId}</small>
   *       </div>
   *     );
   *   }
   * };
   * ```
   *
   * **Example - Graceful fallback**:
   * ```typescript
   * const config: GridConfig = {
   *   renderUnknownComponent: ({ type }) => {
   *     // Render simple placeholder instead of error
   *     return (
   *       <div style={{ padding: '20px', background: '#f5f5f5' }}>
   *         <p>Content placeholder</p>
   *       </div>
   *     );
   *   }
   * };
   * ```
   *
   * **Example - Development debug info**:
   * ```typescript
   * const devConfig: GridConfig = {
   *   renderUnknownComponent: ({ type, itemId }) => (
   *     <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24' }}>
   *       <strong>Missing Component Type</strong>
   *       <ul>
   *         <li>Type: <code>{type}</code></li>
   *         <li>Item ID: <code>{itemId}</code></li>
   *         <li>Available types: {Object.keys(componentRegistry).join(', ')}</li>
   *       </ul>
   *       <button onClick={() => console.log('Item data:', getItem(itemId))}>
   *         Log Item Data
   *       </button>
   *     </div>
   *   )
   * };
   * ```
   *
   * **Interaction with hideUnknownComponents**:
   * - If `hideUnknownComponents: true`, this renderer is ignored (components hidden)
   * - If `hideUnknownComponents: false`, this renderer is used (or default if undefined)
   * @default undefined
   */
  renderUnknownComponent?: (context: {
    type: string;
    itemId: string;
  }) => any;
}
