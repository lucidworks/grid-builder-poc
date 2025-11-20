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
}
