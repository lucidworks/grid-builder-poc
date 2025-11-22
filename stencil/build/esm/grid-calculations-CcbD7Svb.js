/**
 * DOM Cache Utility
 * =================
 *
 * Performance optimization layer that caches frequently accessed DOM elements to avoid
 * repeated `document.getElementById()` calls during drag/resize operations.
 *
 * ## Problem
 *
 * During interactive operations (drag, resize), we frequently need to access the same
 * DOM elements:
 * - Canvas containers for width calculations
 * - Grid items for position updates
 * - Parent elements for coordinate transforms
 *
 * Each `document.getElementById()` call:
 * - Traverses the DOM tree
 * - Can trigger layout calculations
 * - Becomes expensive when called hundreds of times per second during drag
 *
 * ## Solution
 *
 * Cache DOM references in memory after first lookup:
 * - **First access**: Query DOM once and store reference
 * - **Subsequent access**: Return cached reference (O(1) Map lookup)
 * - **Invalidation**: Clear cache when DOM structure changes
 *
 * ## Performance Impact
 *
 * **Without caching**:
 * - During drag: ~60 getElementById calls/second (60fps × multiple items)
 * - Each call traverses DOM tree
 * - Cumulative impact on frame budget
 *
 * **With caching**:
 * - First call: DOM query + cache store
 * - Subsequent: Map.get() (constant time)
 * - 90%+ reduction in DOM queries during operations
 *
 * ## When to Use This Pattern
 *
 * Apply DOM caching when:
 * ✅ Accessing same elements repeatedly in tight loops
 * ✅ During high-frequency events (mousemove, scroll, resize)
 * ✅ Elements are stable (not frequently added/removed)
 * ✅ Performance profiling shows getElementById as bottleneck
 *
 * Avoid when:
 * ❌ Elements change frequently (cache becomes stale)
 * ❌ Only accessing elements once
 * ❌ Using framework-managed refs (React useRef, Stencil @Element)
 *
 * ## Extracting This Pattern
 *
 * To adapt for your project:
 * ```typescript
 * class MyDOMCache {
 *   private elements = new Map<string, HTMLElement>();
 *
 *   get(id: string): HTMLElement | null {
 *     if (this.elements.has(id)) return this.elements.get(id)!;
 *     const el = document.getElementById(id);
 *     if (el) this.elements.set(id, el);
 *     return el;
 *   }
 *
 *   invalidate(id: string) { this.elements.delete(id); }
 * }
 * export const cache = new MyDOMCache();
 * ```
 *
 * ## Cache Invalidation Strategy
 *
 * Clear cache when:
 * - Canvas added/removed from DOM
 * - Component unmounts
 * - Major DOM restructuring
 * - Element IDs change
 *
 * @module dom-cache
 */
/**
 * DOM Cache for canvas containers and frequently accessed elements
 *
 * Singleton pattern ensures all code uses same cache instance
 */
class DOMCache {
    constructor() {
        /** Canvas element cache - key: canvasId, value: HTMLElement */
        this.canvases = new Map();
    }
    /**
     * Get canvas element by ID with automatic caching
     *
     * **Caching behavior**:
     * 1. Check Map cache first (O(1))
     * 2. If miss, query DOM and cache result
     * 3. Return cached or fresh element
     *
     * **Performance**:
     * - Cached access: ~0.001ms (Map.get)
     * - DOM query: ~0.1-1ms (getElementById + tree traversal)
     * - Speedup: 100-1000x for cached access
     *
     * **Safety**:
     * - Returns `null` if element doesn't exist
     * - Safe to call before DOM ready (returns null, doesn't cache)
     * - Cache automatically populated on first successful access
     *
     * @param canvasId - Canvas container element ID
     * @returns HTMLElement or null if not found
     *
     * @example
     * ```typescript
     * // First call - queries DOM
     * const canvas1 = domCache.getCanvas('canvas1'); // ~0.5ms
     *
     * // Subsequent calls - returns cached
     * const canvas2 = domCache.getCanvas('canvas1'); // ~0.001ms
     * const canvas3 = domCache.getCanvas('canvas1'); // ~0.001ms
     *
     * // Different canvas - new DOM query
     * const canvas4 = domCache.getCanvas('canvas2'); // ~0.5ms
     * ```
     */
    getCanvas(canvasId) {
        // Check cache first
        if (this.canvases.has(canvasId)) {
            return this.canvases.get(canvasId);
        }
        // Query DOM and cache
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            this.canvases.set(canvasId, canvas);
        }
        return canvas;
    }
    /**
     * Invalidate cache for a specific canvas
     *
     * **When to call**:
     * - Canvas element removed from DOM
     * - Canvas element replaced (same ID, different element)
     * - Canvas component unmounts
     * - Element ID changed
     *
     * **Why needed**:
     * Cached references become stale when elements are removed or replaced.
     * Invalidation ensures next access queries fresh element from DOM.
     *
     * **Performance**:
     * Very cheap operation (Map.delete is O(1))
     *
     * @param canvasId - Canvas ID to remove from cache
     *
     * @example
     * ```typescript
     * // Component unmounting
     * disconnectedCallback() {
     *   domCache.invalidate(this.canvasId);
     * }
     *
     * // Canvas removed from state
     * delete gridState.canvases['canvas1'];
     * domCache.invalidate('canvas1');
     * ```
     */
    invalidate(canvasId) {
        this.canvases.delete(canvasId);
    }
    /**
     * Clear entire DOM cache
     *
     * **When to call**:
     * - Major DOM restructuring (e.g., navigation, full page reload)
     * - All canvases removed/replaced
     * - Test cleanup (afterEach hooks)
     * - Memory cleanup when cache grows too large
     *
     * **Why needed**:
     * Prevents memory leaks from cached references to removed elements
     * and ensures clean slate after major DOM changes.
     *
     * **Performance**:
     * Cheap operation - just clears Map references.
     * Elements are garbage collected automatically.
     *
     * @example
     * ```typescript
     * // Test cleanup
     * afterEach(() => {
     *   domCache.clear();
     * });
     *
     * // Navigation/route change
     * router.beforeEach(() => {
     *   domCache.clear();
     * });
     *
     * // Memory management
     * if (domCache.size() > 100) {
     *   domCache.clear(); // Periodic cleanup
     * }
     * ```
     */
    clear() {
        this.canvases.clear();
    }
}
/**
 * Singleton DOM cache instance
 *
 * Export as const to ensure single instance across entire application.
 * All modules import same cache, preventing duplicate element caching
 * and ensuring consistent cache state.
 *
 * @example
 * ```typescript
 * import { domCache } from './dom-cache';
 *
 * // All modules use same cache instance
 * const el1 = domCache.getCanvas('canvas1');
 * const el2 = domCache.getCanvas('canvas1'); // Same reference
 * ```
 */
const domCache = new DOMCache();

/**
 * Grid Calculations Utility
 * ========================
 *
 * Core system for converting between pixel coordinates and grid units in the drag-and-drop
 * grid builder. This module provides pure functions with performance optimizations through
 * intelligent caching.
 *
 * ## Grid System Architecture
 *
 * The grid uses a hybrid approach combining responsive and fixed sizing:
 *
 * ### Horizontal Grid (Responsive)
 * - **Size**: 2% of container width (50 units across full width)
 * - **Behavior**: Scales proportionally with canvas width changes
 * - **Use case**: Enables responsive layouts that adapt to different screen sizes
 * - **Example**: At 1000px width, each grid unit = 20px (1000 * 0.02)
 *
 * ### Vertical Grid (Fixed)
 * - **Size**: Fixed 20px per grid unit
 * - **Behavior**: Remains constant regardless of viewport size
 * - **Use case**: Provides consistent vertical spacing and predictable heights
 * - **Rationale**: Vertical scrolling is unlimited, so fixed sizing provides better UX
 *
 * ## Performance Optimization Strategy
 *
 * ### Grid Size Caching
 * The horizontal grid size is calculated from DOM elements (container.clientWidth),
 * which is an expensive operation. To minimize performance impact:
 *
 * 1. **First access**: Calculate once per canvas and cache the result
 * 2. **Subsequent access**: Return cached value (no DOM reads)
 * 3. **Cache invalidation**: Clear when canvas resizes (via ResizeObserver)
 *
 * **Performance Impact**:
 * - Without caching: 100 items = 100+ DOM reads during viewport switch
 * - With caching: 100 items = 1 DOM read per canvas during viewport switch
 * - Prevents layout thrashing and reduces reflows
 *
 * ### DOM Caching Integration
 * Uses `domCache` utility to avoid repeated `getElementById` calls, providing
 * a second layer of performance optimization.
 *
 * ## Usage Examples
 *
 * ```typescript
 * // Convert grid position to pixels for rendering
 * const pixelX = gridToPixelsX(10, 'canvas1'); // Grid unit 10 → pixels
 * const pixelY = gridToPixelsY(5);              // Grid unit 5 → 100px
 *
 * // Convert mouse position to grid coordinates
 * const gridX = pixelsToGridX(250, 'canvas1');  // Pixels → grid units
 * const gridY = pixelsToGridY(120);             // 120px → 6 grid units
 *
 * // Clear cache on canvas resize
 * resizeObserver.observe(canvasContainer);
 * resizeObserver.addEventListener(() => clearGridSizeCache());
 * ```
 *
 * @module grid-calculations
 */
/** Fixed vertical grid size in pixels - provides consistent vertical spacing */
const GRID_SIZE_VERTICAL = 20;
/**
 * Horizontal grid size as percentage of container width
 * 0.02 = 2% = 50 grid units across full width
 */
const GRID_SIZE_HORIZONTAL_PERCENT = 0.02;
/**
 * Default minimum grid size in pixels
 * Prevents grid from becoming too small on tiny screens
 */
const DEFAULT_MIN_GRID_SIZE = 10;
/**
 * Default maximum grid size in pixels
 * Prevents grid from becoming too large on huge screens
 */
const DEFAULT_MAX_GRID_SIZE = 50;
/**
 * Grid size cache to avoid repeated DOM queries
 * Key format: `${canvasId}-h` for horizontal grid sizes
 * Cleared on canvas resize events
 */
const gridSizeCache = new Map();
/**
 * Clear the grid size cache for all canvases
 *
 * **When to call**:
 * - Canvas container is resized (via ResizeObserver)
 * - Viewport changes (desktop ↔ mobile)
 * - Canvas is added/removed from DOM
 *
 * **Why needed**:
 * Cached grid sizes become stale when container widths change. This ensures
 * fresh calculations on next access.
 *
 * **Performance note**:
 * Clearing cache is cheap (O(1)). The cost is in recalculation, which happens
 * lazily on next access.
 *
 * @example
 * ```typescript
 * resizeObserver.observe(canvasElement);
 * resizeCallback = () => {
 *   clearGridSizeCache();
 *   // Components will recalculate on next render
 * };
 * ```
 */
function clearGridSizeCache() {
    gridSizeCache.clear();
}
/**
 * Get the horizontal grid size for a specific canvas
 *
 * **Calculation**: `containerWidth * gridSizePercent` = size of one horizontal grid unit in pixels
 * **Min/Max constraints**: Applied from GridConfig (default: 10px-50px)
 *
 * **Caching behavior**:
 * - First call: Reads `container.clientWidth` from DOM and caches result
 * - Subsequent calls: Returns cached value (no DOM access)
 * - After resize: Cache cleared, recalculates on next call
 *
 * **Why responsive**:
 * Horizontal grid scales with container to support:
 * - Responsive layouts (desktop/mobile)
 * - Variable canvas widths
 * - Fluid grid-based designs
 *
 * **GridConfig customization**:
 * - `gridSizePercent`: Grid unit as % of width (default: 2% = 50 units per 100% width)
 * - `minGridSize`: Minimum size in pixels (default: 10px, prevents too small on mobile)
 * - `maxGridSize`: Maximum size in pixels (default: 50px, prevents too large on desktop)
 *
 * @param canvasId - The canvas element ID to calculate grid size for
 * @param config - Optional GridConfig for customization
 * @param forceRecalc - Set true to bypass cache and force fresh calculation
 * @returns Size of one horizontal grid unit in pixels (constrained by min/max)
 *
 * @example
 * ```typescript
 * // Default config (2% grid, 10px-50px)
 * const size1 = getGridSizeHorizontal('canvas1'); // → 20 (at 1000px width)
 *
 * // Custom config (3% grid, 15px-60px)
 * const size2 = getGridSizeHorizontal('canvas1', {
 *   gridSizePercent: 3,
 *   minGridSize: 15,
 *   maxGridSize: 60
 * }); // → 30 (at 1000px width)
 *
 * // Force recalculation
 * const size3 = getGridSizeHorizontal('canvas1', undefined, true);
 * ```
 */
function getGridSizeHorizontal(canvasId, config, forceRecalc = false) {
    var _a, _b;
    const cacheKey = `${canvasId}-h`;
    if (!forceRecalc && gridSizeCache.has(cacheKey)) {
        return gridSizeCache.get(cacheKey);
    }
    // Use DOM cache instead of getElementById
    const container = domCache.getCanvas(canvasId);
    if (!container) {
        console.warn(`Canvas container not found: ${canvasId}`);
        return 0;
    }
    // Get grid size percent from config or use default
    // Config gridSizePercent is whole number (2 = 2%), default is already decimal (0.02)
    const gridSizePercent = (config === null || config === void 0 ? void 0 : config.gridSizePercent) ? config.gridSizePercent / 100 : GRID_SIZE_HORIZONTAL_PERCENT;
    // Calculate raw grid size
    const rawSize = container.clientWidth * gridSizePercent;
    // Apply min/max constraints from config or use defaults
    const minSize = (_a = config === null || config === void 0 ? void 0 : config.minGridSize) !== null && _a !== void 0 ? _a : DEFAULT_MIN_GRID_SIZE;
    const maxSize = (_b = config === null || config === void 0 ? void 0 : config.maxGridSize) !== null && _b !== void 0 ? _b : DEFAULT_MAX_GRID_SIZE;
    const size = Math.max(minSize, Math.min(maxSize, rawSize));
    gridSizeCache.set(cacheKey, size);
    return size;
}
/**
 * Get the vertical grid size
 *
 * **Configurable vertical grid**:
 * Unlike horizontal grid, vertical uses fixed sizing (default 20px) because:
 * - Vertical scrolling is infinite (no container height limit)
 * - Provides predictable, consistent heights across all viewports
 * - Simplifies calculations (no container dependency)
 * - Better UX for vertical spacing
 *
 * @param config Optional GridConfig with verticalGridSize
 * @returns Vertical grid size in pixels (config.verticalGridSize || 20)
 *
 * @example
 * ```typescript
 * const vSize = getGridSizeVertical(); // → 20 (default)
 * const vSize2 = getGridSizeVertical({ verticalGridSize: 25 }); // → 25
 * ```
 */
function getGridSizeVertical(config) {
    var _a;
    return (_a = config === null || config === void 0 ? void 0 : config.verticalGridSize) !== null && _a !== void 0 ? _a : GRID_SIZE_VERTICAL;
}
/**
 * Convert grid units to pixels for horizontal positioning and sizing
 *
 * **Use cases**:
 * - Converting item `x` position from grid coordinates to CSS left/transform
 * - Converting item `width` from grid units to CSS width
 * - Rendering grid items at correct horizontal positions
 *
 * **Performance**:
 * Uses cached grid size via `getGridSizeHorizontal()` to avoid DOM reads
 *
 * **Rounding**:
 * Uses `Math.round()` to prevent subpixel rendering issues
 *
 * @param gridUnits - Number of grid units
 * @param canvasId - Canvas ID for responsive grid size calculation
 * @param config - Optional GridConfig for customization
 * @returns Pixel value
 *
 * @example
 * ```typescript
 * // Item at grid position x=10 (default 2% grid)
 * const leftPx = gridToPixelsX(10, 'canvas1'); // → 200px (at 1000px container)
 *
 * // Item with grid width=15 (custom 3% grid)
 * const widthPx = gridToPixelsX(15, 'canvas1', { gridSizePercent: 3 }); // → 450px
 * ```
 */
function gridToPixelsX(gridUnits, canvasId, config) {
    // Use cached grid size for better performance
    const gridSize = getGridSizeHorizontal(canvasId, config);
    return Math.round(gridUnits * gridSize);
}
/**
 * Convert grid units to pixels for vertical positioning and sizing
 *
 * **Use cases**:
 * - Converting item `y` position from grid coordinates to CSS top/transform
 * - Converting item `height` from grid units to CSS height
 * - Calculating vertical spacing
 *
 * **Configurable vertical grid**:
 * Uses config.verticalGridSize (default 20px) for calculation
 *
 * @param gridUnits - Number of grid units
 * @param config - Optional GridConfig with verticalGridSize
 * @returns Pixel value (gridUnits * verticalGridSize)
 *
 * @example
 * ```typescript
 * // Item at grid position y=5 (default 20px)
 * const topPx = gridToPixelsY(5); // → 100px
 *
 * // Item with grid height=8 (custom 25px)
 * const heightPx = gridToPixelsY(8, { verticalGridSize: 25 }); // → 200px
 * ```
 */
function gridToPixelsY(gridUnits, config) {
    return gridUnits * getGridSizeVertical(config);
}
/**
 * Convert pixel coordinates to grid units for horizontal values
 *
 * **Use cases**:
 * - Converting mouse/drop position to grid coordinates
 * - Snapping dragged items to grid
 * - Calculating item positions after drag
 *
 * **Rounding**:
 * Uses `Math.round()` to snap to nearest grid unit (implements grid snapping)
 *
 * **Safety**:
 * Returns 0 if grid size is 0 (container not found/initialized)
 *
 * @param pixels - Pixel value to convert
 * @param canvasId - Canvas ID for responsive grid size calculation
 * @param config - Optional GridConfig for customization
 * @returns Number of grid units (rounded)
 *
 * @example
 * ```typescript
 * // Mouse drop at 250px (default 2% grid)
 * const gridX = pixelsToGridX(250, 'canvas1'); // → 13 (at 1000px container)
 *
 * // After drag, element at 371px (custom 3% grid)
 * const snappedX = pixelsToGridX(371, 'canvas1', { gridSizePercent: 3 }); // → 12
 * ```
 */
function pixelsToGridX(pixels, canvasId, config) {
    // Use cached grid size for better performance
    const gridSize = getGridSizeHorizontal(canvasId, config);
    if (gridSize === 0) {
        return 0;
    }
    return Math.round(pixels / gridSize);
}
/**
 * Convert pixel coordinates to grid units for vertical values
 *
 * **Use cases**:
 * - Converting mouse Y position to grid coordinates
 * - Snapping vertical positions to grid
 * - Calculating vertical offsets
 *
 * **Rounding**:
 * Implements automatic grid snapping via `Math.round()`
 *
 * @param pixels - Pixel value to convert
 * @param config - Optional GridConfig with verticalGridSize
 * @returns Number of grid units (rounded)
 *
 * @example
 * ```typescript
 * // Mouse at 127px vertically (default 20px grid)
 * const gridY = pixelsToGridY(127); // → 6 (rounded from 6.35)
 *
 * // Element height 165px (custom 25px grid)
 * const gridHeight = pixelsToGridY(165, { verticalGridSize: 25 }); // → 7 (rounded from 6.6)
 * ```
 */
function pixelsToGridY(pixels, config) {
    return Math.round(pixels / getGridSizeVertical(config));
}

export { getGridSizeVertical as a, gridToPixelsX as b, clearGridSizeCache as c, domCache as d, getGridSizeHorizontal as e, pixelsToGridY as f, gridToPixelsY as g, pixelsToGridX as p };
//# sourceMappingURL=grid-calculations-CcbD7Svb.js.map

//# sourceMappingURL=grid-calculations-CcbD7Svb.js.map