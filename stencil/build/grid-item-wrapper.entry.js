import { r as registerInstance, h } from './index-ebe9feb4.js';
import { c as componentTemplates } from './component-templates-e71f1a8f.js';
import { s as state } from './state-manager-b0e7f282.js';
import { p as pushCommand } from './undo-redo-158eb3dc.js';
import { M as MoveItemCommand } from './undo-redo-commands-efcbac99.js';
import { d as domCache, e as getGridSizeHorizontal, f as getGridSizeVertical, p as pixelsToGridX, a as pixelsToGridY, g as gridToPixelsX, b as gridToPixelsY } from './grid-calculations-e64c8272.js';
import './index-28d0c3f6.js';

/**
 * Virtual Renderer Service - Lazy Loading System
 * ===============================================
 *
 * Performance optimization using IntersectionObserver to lazy-load component content
 * only when visible in the viewport. Reduces initial render time, memory usage, and
 * improves page load performance for pages with 100+ grid items.
 *
 * ## Problem
 *
 * Grid builders with many items face performance challenges:
 * - **Initial render cost**: Rendering 100+ components at page load is expensive
 * - **Memory overhead**: All components in memory even if off-screen
 * - **Slow page load**: Long time to interactive (TTI)
 * - **Poor scrolling**: Heavy DOM operations during scroll
 * - **Wasted rendering**: Complex components rendered but never seen
 *
 * **Example scenario**:
 * - Page with 100 grid items
 * - 10 items visible initially
 * - 90 items rendered but off-screen (wasted work)
 * - Each complex component: ~5-50ms to render
 * - Total wasted: 450-4500ms (almost 5 seconds!)
 *
 * ## Solution
 *
 * IntersectionObserver pattern providing:
 * 1. **Lazy initialization**: Items start with placeholder content
 * 2. **Viewport detection**: Observe when items enter viewport
 * 3. **Callback notification**: Notify components when visible
 * 4. **Component rendering**: Replace placeholder with actual content
 * 5. **Pre-rendering**: Start loading 200px before entering viewport
 * 6. **Memory cleanup**: Unobserve removed components
 *
 * ## Architecture: IntersectionObserver Pattern
 *
 * **Observer setup**:
 * ```typescript
 * // In grid-builder-app.tsx componentDidLoad:
 * (window as any).virtualRenderer = new VirtualRendererService();
 *
 * // In grid-item-wrapper.tsx componentDidLoad:
 * virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
 *   this.isVisible = isVisible;  // Triggers re-render
 * });
 * ```
 *
 * **Flow**:
 * ```
 * 1. Grid item mounts → observe(element, callback)
 * 2. Item scrolls into viewport (200px before visible)
 * 3. IntersectionObserver fires → callback(true)
 * 4. Component sets isVisible = true → re-renders
 * 5. Placeholder replaced with actual component
 * 6. User sees smooth transition
 * ```
 *
 * **Cleanup**:
 * ```
 * 1. Grid item unmounts → disconnectedCallback()
 * 2. unobserve(element, id) → stop watching
 * 3. Remove callback from map → allow GC
 * 4. Observer continues for other elements
 * ```
 *
 * ## IntersectionObserver Configuration
 *
 * **Root margin strategy** (`rootMargin: '200px'`):
 * - Pre-render items 200px before they enter viewport
 * - Ensures content ready when user scrolls
 * - Prevents "pop-in" effect (flash of placeholder)
 * - Balance between performance and UX
 *
 * **Why 200px**:
 * - Typical scroll speed: ~100-300px per second
 * - 200px gives ~1 second to render before visible
 * - Complex component: ~50-200ms to render
 * - Comfortable buffer for smooth loading
 *
 * **Threshold setting** (`threshold: 0.01`):
 * - Trigger when even 1% of element is visible
 * - Very early detection (as soon as edge appears)
 * - Maximizes pre-render time
 * - Prevents late loading
 *
 * **Why 0.01 not 0**:
 * - 0 = fully outside viewport
 * - 0.01 = edge just entering
 * - Better cross-browser behavior
 * - More reliable than 0
 *
 * ## Observer Callback Pattern
 *
 * **Callback signature**:
 * ```typescript
 * type VisibilityCallback = (isVisible: boolean) => void;
 * ```
 *
 * **Callback invocation**:
 * ```typescript
 * entries.forEach((entry) => {
 *   const callback = this.observedElements.get(elementId);
 *   if (callback) {
 *     callback(entry.isIntersecting);  // true when entering, false when exiting
 *   }
 * });
 * ```
 *
 * **Component handler**:
 * ```typescript
 * // In grid-item-wrapper.tsx:
 * virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
 *   this.isVisible = isVisible;  // @State update triggers re-render
 * });
 * ```
 *
 * **Render method**:
 * ```typescript
 * renderComponent() {
 *   if (!this.isVisible) {
 *     return <div class="component-placeholder">Loading...</div>;
 *   }
 *   // Render actual component (expensive)
 *   return <component-image-gallery itemId={this.item.id} />;
 * }
 * ```
 *
 * ## Memory Management
 *
 * **Callback storage**:
 * ```typescript
 * private observedElements: Map<string, VisibilityCallback> = new Map();
 * ```
 *
 * **Why Map**:
 * - O(1) lookup by element ID
 * - Easy cleanup (delete)
 * - Prevents memory leaks
 * - Standard pattern
 *
 * **Cleanup strategy**:
 * 1. Component unmounts → unobserve(element, id)
 * 2. Delete callback from map → allow GC
 * 3. Observer stops watching element
 * 4. Element can be garbage collected
 *
 * **Memory impact**:
 * - Each callback: ~100 bytes
 * - 100 items: ~10KB total
 * - Negligible overhead
 *
 * ## Performance Characteristics
 *
 * **Initial page load** (100 items, 10 visible):
 * - Without virtual rendering: ~500-5000ms (render all)
 * - With virtual rendering: ~50-500ms (render 10)
 * - **10× faster initial load**
 *
 * **Scroll performance**:
 * - Observer overhead: ~1-2ms per event
 * - Component render: ~5-50ms (varies by type)
 * - Pre-render buffer: Items ready when visible
 * - Smooth 60fps scrolling maintained
 *
 * **Memory usage** (100 items):
 * - Without virtual rendering: ~50-500MB (all components)
 * - With virtual rendering: ~5-50MB (visible + buffered)
 * - **10× lower memory usage**
 *
 * ## Complex Component Targeting
 *
 * **Simple components** (always render):
 * - header, text, button (fast ~1-5ms)
 * - No lazy loading needed
 * - Always visible immediately
 *
 * **Complex components** (lazy load):
 * - image-gallery: Multiple images to load (~50-200ms)
 * - dashboard-widget: Chart rendering (~100-500ms)
 * - live-data: API calls + updates (~100ms+)
 *
 * **How wrapper decides**:
 * ```typescript
 * // In grid-item-wrapper.tsx:
 * componentDidLoad() {
 *   // Always observe, component decides if needed
 *   virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
 *     this.isVisible = isVisible;
 *   });
 * }
 *
 * renderComponent() {
 *   // Simple components ignore isVisible flag
 *   if (!this.isVisible && this.item.type === 'imageGallery') {
 *     return <div class="component-placeholder">Loading...</div>;
 *   }
 *   // Complex types use isVisible guard
 * }
 * ```
 *
 * ## Browser Compatibility
 *
 * **IntersectionObserver support**:
 * - Chrome 51+ (2016)
 * - Firefox 55+ (2017)
 * - Safari 12.1+ (2019)
 * - Edge 15+ (2017)
 * - ~97% global browser coverage (2024)
 *
 * **Polyfill option**:
 * ```typescript
 * // If needed for older browsers:
 * import 'intersection-observer'; // polyfill
 * ```
 *
 * **Graceful degradation**:
 * - If IntersectionObserver unavailable
 * - Could fallback to immediate rendering
 * - Or use scroll event listener (less efficient)
 *
 * ## Extracting This Pattern
 *
 * To adapt virtual rendering for your project:
 *
 * **Minimal implementation**:
 * ```typescript
 * // 1. Create observer service
 * class VirtualRenderer {
 *   private observer: IntersectionObserver;
 *   private callbacks = new Map<string, (visible: boolean) => void>();
 *
 *   constructor() {
 *     this.observer = new IntersectionObserver(
 *       (entries) => entries.forEach(e =>
 *         this.callbacks.get(e.target.id)?.(e.isIntersecting)
 *       ),
 *       { rootMargin: '200px', threshold: 0.01 }
 *     );
 *   }
 *
 *   observe(el: Element, id: string, cb: (visible: boolean) => void) {
 *     this.callbacks.set(id, cb);
 *     this.observer.observe(el);
 *   }
 *
 *   unobserve(el: Element, id: string) {
 *     this.callbacks.delete(id);
 *     this.observer.unobserve(el);
 *   }
 * }
 *
 * // 2. Create singleton
 * export const virtualRenderer = new VirtualRenderer();
 *
 * // 3. Use in component
 * useEffect(() => {
 *   virtualRenderer.observe(ref.current, id, setIsVisible);
 *   return () => virtualRenderer.unobserve(ref.current, id);
 * }, []);
 *
 * return isVisible ? <ComplexComponent /> : <Placeholder />;
 * ```
 *
 * **For different frameworks**:
 * - **React**: Use useEffect for lifecycle, useState for visibility
 * - **Vue**: Use onMounted/onUnmounted, ref() for visibility
 * - **Angular**: Use ngAfterViewInit/ngOnDestroy, signals for visibility
 * - **Svelte**: Use onMount/onDestroy, stores for visibility
 *
 * **Key patterns to preserve**:
 * 1. Singleton service (one observer for all components)
 * 2. Callback map for O(1) lookups
 * 3. 200px root margin for pre-rendering
 * 4. 0.01 threshold for early detection
 * 5. Cleanup on component unmount
 *
 * **Customization options**:
 * ```typescript
 * // Adjust root margin based on needs
 * rootMargin: '200px'  // Standard (1 second buffer)
 * rootMargin: '400px'  // Aggressive (2 second buffer, more memory)
 * rootMargin: '100px'  // Conservative (less memory, might see pop-in)
 *
 * // Adjust threshold based on needs
 * threshold: 0.01      // Trigger immediately
 * threshold: 0.1       // Trigger when 10% visible
 * threshold: 0.5       // Trigger when 50% visible (not recommended)
 * ```
 *
 * @module virtual-renderer
 */
/**
 * VirtualRendererService Class
 * ==============================
 *
 * Singleton service managing IntersectionObserver for all grid items.
 *
 * **Lifecycle**:
 * 1. Created once in grid-builder-app.tsx componentDidLoad
 * 2. Shared across all grid-item-wrapper components
 * 3. Lives for entire application lifetime
 * 4. Destroyed only on page unload
 *
 * **Properties**:
 * - `observer`: IntersectionObserver instance (null during initialization)
 * - `observedElements`: Map of element IDs to visibility callbacks
 *
 * **Methods**:
 * - `constructor()`: Initialize observer with configuration
 * - `initialize()`: Create IntersectionObserver with rootMargin and threshold
 * - `observe(element, id, callback)`: Start observing element
 * - `unobserve(element, id)`: Stop observing element
 * - `destroy()`: Cleanup all observations
 */
class VirtualRendererService {
    /**
     * Constructor - Initialize virtual renderer
     *
     * **Called**: Once when VirtualRendererService instantiated
     * **Purpose**: Create IntersectionObserver with configuration
     *
     * **Delegates to**: initialize()
     * - Sets up observer with rootMargin and threshold
     * - Registers callback handler for intersection events
     *
     * **Usage**:
     * ```typescript
     * // In grid-builder-app.tsx componentDidLoad:
     * (window as any).virtualRenderer = new VirtualRendererService();
     * ```
     */
    constructor() {
        /**
         * IntersectionObserver instance
         *
         * **Lifecycle**: Created in initialize(), destroyed in destroy()
         * **Configuration**: rootMargin: '200px', threshold: 0.01
         * **Purpose**: Watch all grid items for viewport intersection
         *
         * **Null during**:
         * - Before initialize() completes
         * - After destroy() called
         * - Error during initialization
         */
        this.observer = null;
        /**
         * Map of element IDs to visibility callbacks
         *
         * **Structure**: `Map<elementId: string, callback: VisibilityCallback>`
         * **Lookup**: O(1) by element ID
         * **Cleanup**: Entries deleted in unobserve()
         *
         * **Memory**: ~100 bytes per entry, ~10KB for 100 items
         *
         * **Why Map**:
         * - Fast lookups in observer callback
         * - Easy cleanup (delete by key)
         * - Prevents memory leaks
         * - Standard pattern for observer registries
         */
        this.observedElements = new Map();
        this.initialize();
    }
    /**
     * Initialize IntersectionObserver
     *
     * **Called by**: constructor (once)
     * **Purpose**: Create and configure IntersectionObserver instance
     *
     * ## Observer Configuration
     *
     * **Observer callback**:
     * ```typescript
     * (entries) => {
     *   entries.forEach((entry) => {
     *     const elementId = entry.target.id;
     *     const callback = this.observedElements.get(elementId);
     *     if (callback) {
     *       callback(entry.isIntersecting);  // true = entering, false = exiting
     *     }
     *   });
     * }
     * ```
     *
     * **Why forEach entries**:
     * - IntersectionObserver can fire for multiple elements at once
     * - Batch processing is more efficient
     * - Each element gets independent callback
     *
     * **Element ID lookup**:
     * ```typescript
     * const elementId = entry.target.id;  // From element.id attribute
     * const callback = this.observedElements.get(elementId);  // O(1) lookup
     * ```
     *
     * **Why use element ID**:
     * - Direct mapping to callback
     * - No need to store element references
     * - Simpler memory management
     * - Works across DOM mutations
     *
     * ## Observer Options
     *
     * **Root margin** (`rootMargin: '200px'`):
     * - Expand viewport bounds by 200px in all directions
     * - Items render 200px before actually visible
     * - 1 second buffer at typical scroll speed
     * - Prevents "pop-in" effect
     *
     * **Threshold** (`threshold: 0.01`):
     * - Fire when 1% of element visible
     * - Very early detection
     * - Maximizes pre-render time
     * - More reliable than 0 across browsers
     *
     * **Why these specific values**:
     * - 200px root margin: Balance between performance and UX
     * - 0.01 threshold: As early as possible without false positives
     * - Tested with 100+ items for optimal performance
     *
     * ## Callback Execution
     *
     * **entry.isIntersecting**:
     * - `true`: Element entering viewport (or 200px buffer)
     * - `false`: Element exiting viewport
     * - Component can show/hide content accordingly
     *
     * **Callback guard** (`if (callback)`):
     * - Handles race conditions
     * - Element may have been unobserved but event still fires
     * - Prevents errors from missing callbacks
     * - Graceful degradation
     *
     * ## Performance Impact
     *
     * **Observer overhead**: ~1-2ms per intersection event
     * **Callback execution**: ~0.1ms per callback
     * **Total overhead**: Negligible compared to component rendering
     *
     * **Scalability**:
     * - Single observer for all elements (efficient)
     * - Map lookups O(1)
     * - No DOM queries needed
     * - Works well with 100+ elements
     *
     * @private
     */
    initialize() {
        // Create observer with 200px margin (pre-render before entering viewport)
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const elementId = entry.target.id;
                const callback = this.observedElements.get(elementId);
                if (callback) {
                    // Call callback with visibility state
                    callback(entry.isIntersecting);
                }
            });
        }, {
            rootMargin: '200px',
            threshold: 0.01, // Trigger when even 1% is visible
        });
    }
    /**
     * Observe element for visibility changes
     *
     * **Called from**: grid-item-wrapper.tsx componentDidLoad
     * **Purpose**: Register element for lazy loading when it enters viewport
     *
     * ## Registration Process
     *
     * **Validation**:
     * ```typescript
     * if (!this.observer || !element) return;  // Guard against invalid state
     * ```
     *
     * **Why validation needed**:
     * - Observer may not be initialized (edge case)
     * - Element may be null if ref not set
     * - Fail gracefully without errors
     * - Defensive programming
     *
     * **Store callback**:
     * ```typescript
     * this.observedElements.set(elementId, callback);  // Map: id → callback
     * ```
     *
     * **Why store before observing**:
     * - Callback ready when first intersection fires
     * - No race condition between observe and callback
     * - Guaranteed handler availability
     *
     * **Start observing**:
     * ```typescript
     * this.observer.observe(element);  // Add to observer's watch list
     * ```
     *
     * ## Callback Invocation
     *
     * **When callback fires**:
     * 1. Element enters viewport (or 200px buffer)
     * 2. Observer callback runs
     * 3. Looks up callback by elementId
     * 4. Calls callback(true)
     * 5. Component updates isVisible state
     * 6. Component re-renders with actual content
     *
     * **Callback signature**:
     * ```typescript
     * (isVisible: boolean) => void
     * ```
     *
     * **Typical usage**:
     * ```typescript
     * virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
     *   this.isVisible = isVisible;  // @State update → re-render
     * });
     * ```
     *
     * ## Multiple Observations
     *
     * **Same element, different callback**:
     * - New callback replaces old one
     * - Map key is elementId (unique)
     * - No duplicate observations
     * - Latest callback wins
     *
     * **Multiple elements**:
     * - Each gets own callback
     * - All share single observer
     * - Efficient batch processing
     * - Scalable to 100+ items
     *
     * ## Memory Impact
     *
     * **Per observation**:
     * - Map entry: ~100 bytes
     * - Observer tracking: ~50 bytes
     * - Total: ~150 bytes per item
     *
     * **100 items**:
     * - Map overhead: ~10KB
     * - Observer overhead: ~5KB
     * - Total: ~15KB (negligible)
     *
     * ## Edge Cases
     *
     * **Element already observed**:
     * - IntersectionObserver handles gracefully
     * - No duplicate tracking
     * - Callback map updated
     *
     * **Element without ID**:
     * - Callback stored with undefined key
     * - Lookups will fail
     * - Element won't lazy load
     * - Should ensure ID set
     *
     * **Observer not initialized**:
     * - Guard returns early
     * - No error thrown
     * - Element renders immediately
     * - Graceful degradation
     *
     * @param element - DOM element to observe (must have id attribute)
     * @param elementId - Unique ID for callback lookup (should match element.id)
     * @param callback - Function called when visibility changes
     *
     * @example
     * ```typescript
     * // In grid-item-wrapper.tsx componentDidLoad:
     * virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
     *   this.isVisible = isVisible;  // Trigger re-render
     * });
     * // → Element now monitored
     * // → Callback fires when scrolled into view
     * // → Component renders content instead of placeholder
     * ```
     */
    observe(element, elementId, callback) {
        if (!this.observer || !element) {
            return;
        }
        // Store callback
        this.observedElements.set(elementId, callback);
        // Start observing
        this.observer.observe(element);
    }
    /**
     * Stop observing element (cleanup)
     *
     * **Called from**: grid-item-wrapper.tsx disconnectedCallback
     * **Purpose**: Remove element from observation and free callback memory
     *
     * ## Cleanup Process
     *
     * **Validation**:
     * ```typescript
     * if (!this.observer || !element) return;  // Guard against invalid state
     * ```
     *
     * **Why validation needed**:
     * - Observer may be destroyed
     * - Element may be null during unmount
     * - Fail gracefully without errors
     * - Safe cleanup pattern
     *
     * **Remove callback**:
     * ```typescript
     * this.observedElements.delete(elementId);  // Free callback from map
     * ```
     *
     * **Why delete first**:
     * - Prevents callback from firing during unobserve
     * - Immediate cleanup of memory
     * - No race conditions
     * - Clean separation
     *
     * **Stop observing**:
     * ```typescript
     * this.observer.unobserve(element);  // Remove from observer's watch list
     * ```
     *
     * ## Memory Management
     *
     * **Callback deletion**:
     * - Removes Map entry
     * - Allows callback garbage collection
     * - Frees ~100 bytes per element
     * - Critical for long-running apps
     *
     * **Observer cleanup**:
     * - Removes element from internal list
     * - Stops firing intersection events
     * - Frees ~50 bytes per element
     * - Reduces observer overhead
     *
     * **What if not called**:
     * - Callback remains in memory (leak)
     * - Observer still tracks element (leak)
     * - ~150 bytes leaked per unmounted item
     * - Adds up with many mount/unmount cycles
     *
     * ## Cleanup Timing
     *
     * **Component lifecycle**:
     * ```
     * 1. Component mounts → componentDidLoad → observe()
     * 2. Component unmounts → disconnectedCallback → unobserve()
     * 3. Element removed from DOM
     * 4. Callback deleted from map
     * 5. Observer stops watching
     * 6. Garbage collector can free memory
     * ```
     *
     * **Why in disconnectedCallback**:
     * - Called when component removed from DOM
     * - Guaranteed cleanup point
     * - Standard web component lifecycle
     * - No memory leaks
     *
     * ## Edge Cases
     *
     * **Element not observed**:
     * - IntersectionObserver handles gracefully
     * - No error thrown
     * - Map.delete() returns false but safe
     * - Idempotent operation
     *
     * **Called multiple times**:
     * - First call removes callback and stops observing
     * - Subsequent calls are no-ops
     * - Safe to call multiple times
     * - Defensive cleanup
     *
     * **Observer already destroyed**:
     * - Guard returns early
     * - No error thrown
     * - Map cleanup still happens
     * - Graceful degradation
     *
     * ## Performance Impact
     *
     * **Per unobserve**:
     * - Map.delete(): ~0.01ms
     * - observer.unobserve(): ~0.1ms
     * - Total: ~0.11ms (negligible)
     *
     * **Batch cleanup** (100 items):
     * - Sequential unobserve: ~11ms
     * - Observer.disconnect() + Map.clear(): ~1ms
     * - destroy() method more efficient for bulk
     *
     * @param element - DOM element to stop observing
     * @param elementId - Element's ID for callback removal
     *
     * @example
     * ```typescript
     * // In grid-item-wrapper.tsx disconnectedCallback:
     * disconnectedCallback() {
     *   if (this.itemRef) {
     *     virtualRenderer.unobserve(this.itemRef, this.item.id);
     *   }
     * }
     * // → Callback removed from map
     * // → Observer stops watching element
     * // → Memory freed for garbage collection
     * ```
     */
    unobserve(element, elementId) {
        if (!this.observer || !element) {
            return;
        }
        // Remove callback
        this.observedElements.delete(elementId);
        // Stop observing
        this.observer.unobserve(element);
    }
    /**
     * Cleanup all observations (bulk cleanup)
     *
     * **Called**: Manually when destroying service (rare, typically page unload)
     * **Purpose**: Completely tear down observer and free all memory
     *
     * ## Cleanup Operations
     *
     * **Disconnect observer**:
     * ```typescript
     * if (this.observer) {
     *   this.observer.disconnect();  // Stop watching all elements
     *   this.observer = null;         // Allow GC
     * }
     * ```
     *
     * **Why disconnect**:
     * - Stops all intersection callbacks
     * - Removes all elements from watch list
     * - More efficient than unobserve for each element
     * - Single operation vs N operations
     *
     * **Why set to null**:
     * - Signals observer destroyed
     * - Guards in other methods will return early
     * - Allows IntersectionObserver GC
     * - Clean state reset
     *
     * **Clear callbacks**:
     * ```typescript
     * this.observedElements.clear();  // Remove all Map entries
     * ```
     *
     * **Why clear**:
     * - Frees all callback references
     * - Allows callback GC
     * - Prevents memory leaks
     * - Complete cleanup
     *
     * ## Performance Comparison
     *
     * **destroy() vs unobserve all** (100 items):
     * - destroy(): disconnect + clear = ~1ms
     * - unobserve × 100: ~11ms
     * - **11× faster for bulk cleanup**
     *
     * **Memory freed** (100 items):
     * - Callbacks: ~10KB
     * - Observer tracking: ~5KB
     * - Observer instance: ~1KB
     * - Total: ~16KB
     *
     * ## When to Use
     *
     * **Appropriate scenarios**:
     * - Page unload / navigation away
     * - Application teardown
     * - Test cleanup (afterEach)
     * - Hot module reload (HMR)
     *
     * **Not appropriate**:
     * - Individual component unmount (use unobserve)
     * - Removing some items (use unobserve per item)
     * - Temporary pause (no such feature needed)
     *
     * ## State After Destroy
     *
     * **Observer state**:
     * - `this.observer = null`
     * - All observe/unobserve calls become no-ops
     * - Guards prevent errors
     *
     * **Callbacks state**:
     * - `this.observedElements` empty
     * - All callbacks freed
     * - No memory leaks
     *
     * **Service unusable**:
     * - Must create new instance to use again
     * - Or call initialize() if made public
     * - Current design: create new service
     *
     * ## Edge Cases
     *
     * **Observer not initialized**:
     * - Guard skips disconnect
     * - Only clears callbacks
     * - Safe even if never initialized
     *
     * **Called multiple times**:
     * - First call destroys everything
     * - Subsequent calls are no-ops
     * - Idempotent operation
     * - Safe defensive cleanup
     *
     * **Active intersections**:
     * - disconnect() cancels all pending callbacks
     * - No callbacks fire after destroy
     * - Clean shutdown
     *
     * ## Memory Leak Prevention
     *
     * **Without destroy**:
     * - Observer remains in memory
     * - All callbacks remain referenced
     * - Elements can't be GC'd
     * - ~16KB leak per 100 items
     *
     * **With destroy**:
     * - Observer freed
     * - Callbacks freed
     * - Elements can be GC'd
     * - No memory leaks
     *
     * @example
     * ```typescript
     * // On page unload:
     * window.addEventListener('beforeunload', () => {
     *   virtualRenderer.destroy();
     * });
     *
     * // In tests:
     * afterEach(() => {
     *   virtualRenderer.destroy();
     * });
     *
     * // Hot module reload:
     * if (module.hot) {
     *   module.hot.dispose(() => {
     *     virtualRenderer.destroy();
     *   });
     * }
     * ```
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.observedElements.clear();
    }
}
/**
 * Singleton VirtualRenderer instance
 * ====================================
 *
 * Global singleton instance shared across all grid components.
 *
 * ## Singleton Pattern
 *
 * **Why singleton**:
 * - Single IntersectionObserver for all items (efficient)
 * - Shared callback registry (O(1) lookups)
 * - Consistent configuration across app
 * - Easier to use (no prop drilling)
 * - Standard service pattern
 *
 * **Instantiation**:
 * ```typescript
 * export const virtualRenderer = new VirtualRendererService();
 * ```
 * - Created at module load time
 * - Immediately available to all components
 * - Initializes IntersectionObserver
 * - Ready for observe() calls
 *
 * ## Usage Pattern
 *
 * **In grid-builder-app.tsx** (optional, for visibility):
 * ```typescript
 * componentDidLoad() {
 *   // Expose globally for debugging (optional)
 *   (window as any).virtualRenderer = virtualRenderer;
 * }
 * ```
 *
 * **In grid-item-wrapper.tsx**:
 * ```typescript
 * import { virtualRenderer } from '../../services/virtual-renderer';
 *
 * componentDidLoad() {
 *   virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
 *     this.isVisible = isVisible;
 * });
 * }
 *
 * disconnectedCallback() {
 *   virtualRenderer.unobserve(this.itemRef, this.item.id);
 * }
 * ```
 *
 * ## Global State
 *
 * **Observer shared across**:
 * - All grid-item-wrapper components
 * - All canvas sections
 * - Entire application
 *
 * **Benefits**:
 * - Single observer instance (low overhead)
 * - Batch intersection processing
 * - Consistent behavior
 * - Simple API
 *
 * ## Alternative Patterns
 *
 * **Could use React Context** (not needed):
 * ```typescript
 * const VirtualRendererContext = createContext(virtualRenderer);
 * // More boilerplate, no real benefit
 * ```
 *
 * **Could use dependency injection** (overkill):
 * ```typescript
 * @Inject() virtualRenderer: VirtualRendererService
 * // Complex setup, no benefit for this use case
 * ```
 *
 * **Singleton is simplest**:
 * - Direct import
 * - No context setup
 * - No DI container
 * - Works across frameworks
 *
 * @example
 * ```typescript
 * // Import and use directly:
 * import { virtualRenderer } from './virtual-renderer';
 *
 * virtualRenderer.observe(element, id, callback);
 * ```
 */
const virtualRenderer = new VirtualRendererService();

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
function getTransformPosition$1(element) {
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
class DragHandler {
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
    constructor(element, item, onUpdate) {
        /** Position at drag start (from transform) - used to apply deltas */
        this.basePosition = { x: 0, y: 0 };
        /** Canvas ID where drag started - for cross-canvas detection */
        this.dragStartCanvasId = '';
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
    destroy() {
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
    initialize() {
        const interact = window.interact;
        if (!interact) {
            console.warn('interact.js not loaded');
            return;
        }
        this.interactInstance = interact(this.element).draggable({
            allowFrom: '.drag-handle',
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
    handleDragStart(event) {
        // Start performance tracking
        if (window.perfMonitor) {
            window.perfMonitor.startOperation('drag');
        }
        event.target.classList.add('dragging');
        // Store the original canvas ID at drag start
        this.dragStartCanvasId = this.item.canvasId;
        // Store the base position from transform
        this.basePosition = getTransformPosition$1(event.target);
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
    handleDragMove(event) {
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
    handleDragEnd(event) {
        var _a;
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
        gridContainers.forEach((container) => {
            const containerRect = container.getBoundingClientRect();
            if (centerX >= containerRect.left &&
                centerX <= containerRect.right &&
                centerY >= containerRect.top &&
                centerY <= containerRect.bottom) {
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
            if (window.perfMonitor) {
                window.perfMonitor.endOperation('drag');
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
        }
        else if (newX > targetContainer.clientWidth - itemWidth - EDGE_SNAP_THRESHOLD) {
            newX = targetContainer.clientWidth - itemWidth; // Snap to right edge
        }
        if (newY < EDGE_SNAP_THRESHOLD) {
            newY = 0; // Snap to top edge
        }
        else if (newY > targetContainer.clientHeight - itemHeight - EDGE_SNAP_THRESHOLD) {
            newY = targetContainer.clientHeight - itemHeight; // Snap to bottom edge
        }
        // Update item position in current viewport's layout (convert to grid units)
        const currentViewport = ((_a = window.gridState) === null || _a === void 0 ? void 0 : _a.currentViewport) || 'desktop';
        const layout = this.item.layouts[currentViewport];
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
        if (window.perfMonitor) {
            window.perfMonitor.endOperation('drag');
        }
        // Trigger StencilJS update (single re-render at end)
        this.onUpdate(this.item);
    }
}

/**
 * Resize Handler
 * ===============
 *
 * High-performance resize system for grid items using interact.js with direct DOM
 * manipulation and requestAnimationFrame batching. Enables smooth 60fps resizing
 * with 8-point handles while avoiding framework re-render overhead.
 *
 * ## Problem
 *
 * Resizing UI elements at 60fps requires updating dimensions and position ~16ms per frame.
 * Using framework state updates would cause:
 * - Full component re-renders on every mousemove event during resize
 * - Virtual DOM diffing overhead
 * - Layout thrashing from repeated read/write cycles
 * - Janky, stuttering resize experience
 * - Position jumping on certain resize handles (bottom/right edges)
 *
 * ## Solution
 *
 * Hybrid approach combining interact.js resize events with RAF-batched DOM updates:
 *
 * 1. **During resize** (60fps): Direct DOM updates via RAF batching
 *    - No state updates
 *    - No re-renders
 *    - Smooth visual feedback
 *    - Batched with requestAnimationFrame
 *
 * 2. **After resize** (single operation): Update StencilJS state once
 *    - Trigger single re-render
 *    - Persist final dimensions
 *    - Emit undo/redo commands
 *
 * ## Key Architecture Decisions
 *
 * ### 8-Point Resize Handles
 *
 * **Configuration**: `edges: { left: true, right: true, bottom: true, top: true }`
 *
 * Provides 8 resize handles:
 * - 4 corners: top-left, top-right, bottom-left, bottom-right
 * - 4 edges: top, right, bottom, left
 *
 * **Why all 8 handles**:
 * - Maximum flexibility for users
 * - Matches familiar UI patterns (Figma, Photoshop, etc.)
 * - Enables precise positioning and sizing
 *
 * ### RequestAnimationFrame Batching
 *
 * **Pattern**:
 * ```typescript
 * handleResizeMove(event) {
 *   cancelAnimationFrame(this.rafId);
 *   this.rafId = requestAnimationFrame(() => {
 *     // Apply DOM updates once per frame
 *   });
 * }
 * ```
 *
 * **Why RAF batching**:
 * - Mousemove events fire faster than display refresh (60fps)
 * - Without batching: multiple DOM updates per frame (wasted work)
 * - With batching: exactly 1 DOM update per frame (aligned with browser paint)
 * - Prevents layout thrashing
 * - Smoother visual updates
 *
 * **Performance impact**:
 * - Without RAF: ~200 updates/sec, many dropped frames
 * - With RAF: ~60 updates/sec, no dropped frames
 * - **3-4x fewer DOM operations**
 *
 * ### Grid Snapping Strategy
 *
 * **When**: Only at resize end (endOnly: true)
 * **Why**: Allows free-form resizing during operation, snaps to grid on release
 *
 * **interact.js modifier**:
 * ```typescript
 * interact.modifiers.snap({
 *   targets: [interact.snappers.grid({ x: gridSizeX, y: gridSizeY })],
 *   endOnly: true  // Critical: prevents mid-resize jumps
 * })
 * ```
 *
 * **Alternative approaches and why they fail**:
 * - Snap during resize: Causes visual jumping, poor UX
 * - Manual snapping in handleResizeEnd: Works, but duplicates logic
 * - endOnly modifier: Clean, performant, built into interact.js
 *
 * ### DeltaRect Position Preservation
 *
 * **Problem**: Resizing from left/top edges changes element position
 * **Solution**: Track accumulated deltas and update transform
 *
 * **Example**:
 * - Resize from left edge: width increases, x position decreases
 * - deltaRect.left = -50 (element moved left 50px)
 * - deltaRect.width = 50 (element grew 50px wider)
 * - Apply both: new x = startX + (-50), new width = startWidth + 50
 *
 * **Why this is tricky**:
 * - Bottom/right resizes only change dimensions
 * - Top/left resizes change BOTH position and dimensions
 * - Must update transform AND width/height simultaneously
 * - interact.js provides deltaRect to handle this automatically
 *
 * ### Minimum Size Constraints
 *
 * **Configuration**:
 * ```typescript
 * interact.modifiers.restrictSize({ min: { width: 100, height: 80 } })
 * ```
 *
 * **Why these minimums**:
 * - width: 100px → ~5 grid units (enough for readable text/UI)
 * - height: 80px → ~4 grid units (matches common component heights)
 * - Prevents accidentally collapsing items to unusable sizes
 * - No maximum (items can grow to fill canvas)
 *
 * ## Performance Characteristics
 *
 * **During resize** (per frame):
 * - 1 RAF batch (~60fps max)
 * - 3 style updates (transform, width, height)
 * - No layout/reflow (transform is composited)
 * - ~0.5-1ms per frame
 *
 * **At resize end**:
 * - Grid snapping calculations
 * - Boundary constraint checks
 * - State update + single re-render
 * - ~5-10ms total
 *
 * **Performance gain over state-based approach**:
 * - State-based: ~16ms+ per frame (re-render overhead)
 * - This approach: ~0.5-1ms per frame
 * - **~16-30x faster during resize**
 *
 * ## Edge Cases Handled
 *
 * - Resize from any of 8 handles
 * - Position preservation during top/left resize
 * - Boundary constraints (can't resize outside canvas)
 * - Minimum size enforcement (100×80px)
 * - Grid snapping without mid-resize jumps
 * - Mobile vs desktop viewport layouts
 * - Element styles not yet applied (RAF delay in constructor)
 * - Clean RAF cancellation on destroy
 *
 * ## Extracting This Pattern
 *
 * To adapt for your project:
 *
 * ```typescript
 * class MyResizeHandler {
 *   private rafId: number | null = null;
 *   private startRect = { x: 0, y: 0, width: 0, height: 0 };
 *
 *   handleResizeMove(e) {
 *     // Cancel previous frame
 *     if (this.rafId) cancelAnimationFrame(this.rafId);
 *
 *     // Batch with RAF
 *     this.rafId = requestAnimationFrame(() => {
 *       // Accumulate deltas
 *       this.startRect.x += e.deltaRect.left;
 *       this.startRect.y += e.deltaRect.top;
 *       this.startRect.width += e.deltaRect.width;
 *       this.startRect.height += e.deltaRect.height;
 *
 *       // Direct DOM update
 *       e.target.style.transform = `translate(${this.startRect.x}px, ${this.startRect.y}px)`;
 *       e.target.style.width = this.startRect.width + 'px';
 *       e.target.style.height = this.startRect.height + 'px';
 *     });
 *   }
 *
 *   handleResizeEnd(e) {
 *     cancelAnimationFrame(this.rafId);
 *     // Single state update
 *     this.updateState(this.startRect);
 *   }
 * }
 * ```
 *
 * ## Integration with Other Systems
 *
 * - **grid-calculations**: Convert between pixels and grid units
 * - **dom-cache**: Fast canvas element lookup
 * - **state-manager**: Single state update at resize end
 * - **undo-redo**: Command pushed via onUpdate callback
 * - **interact.js**: Event source for resize lifecycle + modifiers
 *
 * @module resize-handler
 */
/**
 * Extract current transform position from element's inline style
 *
 * **Purpose**: Get element's current position for resize start position tracking
 *
 * **Why needed**: Resize operations must preserve position when resizing from
 * top/left handles. The transform is the canonical position source during operations.
 *
 * **Pattern shared with drag-handler**: Both drag and resize need base position
 * extraction, so this function is duplicated (could be extracted to shared utility).
 *
 * @param element - Element with transform style
 * @returns Current x,y position in pixels, or {0,0} if no transform
 *
 * @example
 * ```typescript
 * const el = document.getElementById('item-1');
 * el.style.transform = 'translate(100px, 150px)';
 * const pos = getTransformPosition(el); // → {x: 100, y: 150}
 * ```
 */
function getTransformPosition(element) {
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
 * Resize Handler Class
 * =====================
 *
 * Manages high-performance resize behavior for a single grid item. Each grid item
 * gets its own ResizeHandler instance that coordinates interact.js resize events
 * with RAF-batched DOM updates and state management.
 *
 * ## Instance Lifecycle
 *
 * 1. **Creation**: Instantiated by grid-item-wrapper when item mounts
 * 2. **Initialization**: Sets up interact.js resizable with 8 handles + modifiers
 * 3. **Active**: Handles resize events with RAF-batched DOM manipulation
 * 4. **Cleanup**: destroy() called when item unmounts to prevent RAF/memory leaks
 *
 * ## State Management
 *
 * **Private state** (not in framework):
 * - `startRect`: Position and size at resize start
 * - `resizeRafId`: RAF handle for batching updates
 * - `interactInstance`: interact.js resizable instance
 *
 * **Framework state**: Updated only once at resize end via `onUpdate` callback
 *
 * ## Performance Pattern
 *
 * RAF batching + direct manipulation:
 * - High-frequency events (move): RAF-batched DOM updates
 * - Low-frequency events (start/end): State updates + event tracking
 * - Cancel pending RAF on each move (only last frame executes)
 *
 * @example
 * ```typescript
 * // In grid-item-wrapper.tsx
 * componentDidLoad() {
 *   this.resizeHandler = new ResizeHandler(
 *     this.element,
 *     this.item,
 *     (updatedItem) => {
 *       // This callback runs ONCE at resize end
 *       gridState.updateItem(updatedItem);
 *       undoRedo.pushCommand(new ResizeCommand(this.item, updatedItem));
 *     }
 *   );
 * }
 *
 * disconnectedCallback() {
 *   this.resizeHandler?.destroy(); // Critical: prevents RAF leak
 * }
 * ```
 */
class ResizeHandler {
    /**
     * Create resize handler and initialize interact.js
     *
     * **Lifecycle**: Called when grid-item-wrapper mounts
     *
     * **RAF delay pattern**:
     * If element doesn't have width/height styles yet, defers initialization to next frame.
     * This handles race condition where StencilJS hasn't applied computed styles yet.
     *
     * **Why RAF delay is needed**:
     * - interact.js reads element dimensions during setup
     * - If dimensions are 0, resize handles won't work correctly
     * - RAF ensures browser has completed style application
     * - Only happens on initial mount, not on subsequent operations
     *
     * **Error handling**:
     * Warns but continues if styles missing (won't break app, just logs issue)
     *
     * @param element - DOM element to make resizable (grid-item-wrapper)
     * @param item - Grid item data for dimension/position management
     * @param onUpdate - Callback invoked with updated item after resize ends
     *
     * @example
     * ```typescript
     * // Typical usage in component
     * private resizeHandler: ResizeHandler;
     *
     * componentDidLoad() {
     *   this.resizeHandler = new ResizeHandler(
     *     this.element,
     *     this.item,
     *     (item) => this.handleItemUpdate(item)
     *   );
     * }
     * ```
     */
    constructor(element, item, onUpdate) {
        /** RAF ID for cancelling pending frame updates */
        this.resizeRafId = null;
        /** Accumulated position and size during resize (deltaRect tracking) */
        this.startRect = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
        this.element = element;
        this.item = item;
        this.onUpdate = onUpdate;
        // Ensure element has width/height before initializing interact.js
        // StencilJS might not have applied styles yet
        if (!element.style.width || !element.style.height) {
            console.warn('Element missing width/height styles, waiting for next frame');
            requestAnimationFrame(() => this.initialize());
        }
        else {
            this.initialize();
        }
    }
    /**
     * Cleanup interact.js instance and cancel pending RAF
     *
     * **When to call**: Component unmount (disconnectedCallback in StencilJS)
     *
     * **Critical for RAF cleanup**:
     * Unlike drag-handler, resize-handler uses RAF batching. Must cancel
     * pending RAF to prevent:
     * - Memory leaks from closures
     * - Errors from updating removed elements
     * - RAF callbacks firing after component destruction
     *
     * **What it does**:
     * 1. Cancels any pending requestAnimationFrame
     * 2. Calls `interactInstance.unset()` to remove event listeners
     * 3. Safe to call multiple times (checks if instances exist)
     *
     * **Performance**: Very cheap operation (~0.1ms)
     *
     * @example
     * ```typescript
     * // In grid-item-wrapper component
     * disconnectedCallback() {
     *   if (this.resizeHandler) {
     *     this.resizeHandler.destroy(); // MUST call to prevent RAF leak
     *   }
     * }
     * ```
     */
    destroy() {
        if (this.resizeRafId) {
            cancelAnimationFrame(this.resizeRafId);
            this.resizeRafId = null;
        }
        if (this.interactInstance) {
            this.interactInstance.unset();
        }
    }
    /**
     * Initialize interact.js resizable on element
     *
     * **Configuration choices explained**:
     *
     * **edges: all true**
     * - Enables 8 resize handles (4 corners + 4 edges)
     * - Provides maximum flexibility for users
     * - Matches familiar design tool patterns
     *
     * **modifiers array**:
     * Order matters! Modifiers are applied in sequence:
     *
     * 1. **restrictSize modifier**: Enforces minimum dimensions
     *    - min width: 100px (~5 grid units)
     *    - min height: 80px (~4 grid units)
     *    - Prevents unusably small items
     *    - No maximum (items can grow to canvas bounds)
     *
     * 2. **snap modifier with endOnly: true**:
     *    - Snaps to grid ONLY at resize end
     *    - **Critical**: endOnly prevents mid-resize jumping
     *    - Uses function callbacks for dynamic grid sizes
     *    - range: Infinity means always snap (no distance limit)
     *
     * **Why function callbacks for grid sizes**:
     * ```typescript
     * x: () => getGridSizeHorizontal(this.item.canvasId)
     * ```
     * - Grid sizes can change (viewport switch, canvas resize)
     * - Function ensures fresh value on each snap
     * - Without callback, would cache stale grid size
     *
     * **Event binding**:
     * - Uses `.bind(this)` to preserve class context
     * - Without bind, `this` would be interact.js context
     * - Allows handlers to access instance properties
     *
     * **Error handling**:
     * - Checks if interact.js loaded (from CDN)
     * - Fails gracefully with console warning
     * - Prevents app crash if CDN fails
     *
     * @private
     *
     * @example
     * ```typescript
     * // interact.js resizable configuration
     * interact(element).resizable({
     *   edges: { left: true, right: true, bottom: true, top: true },
     *   modifiers: [
     *     interact.modifiers.restrictSize({ min: { width: 100, height: 80 } }),
     *     interact.modifiers.snap({
     *       targets: [interact.snappers.grid({ x: 20, y: 20 })],
     *       endOnly: true  // Key: prevents visual jumping during resize
     *     })
     *   ]
     * });
     * ```
     */
    initialize() {
        const interact = window.interact;
        if (!interact) {
            console.warn('interact.js not loaded');
            return;
        }
        this.interactInstance = interact(this.element).resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            modifiers: [
                // Enforce minimum size
                interact.modifiers.restrictSize({
                    min: { width: 100, height: 80 },
                }),
                // Snap to grid only when resize ends (prevents jump during resize)
                interact.modifiers.snap({
                    targets: [
                        interact.snappers.grid({
                            x: () => getGridSizeHorizontal(this.item.canvasId),
                            y: () => getGridSizeVertical(),
                        }),
                    ],
                    range: Infinity,
                    endOnly: true,
                }),
            ],
            listeners: {
                start: this.handleResizeStart.bind(this),
                move: this.handleResizeMove.bind(this),
                end: this.handleResizeEnd.bind(this),
            },
        });
    }
    /**
     * Handle resize start event
     *
     * **Responsibilities**:
     * 1. Start performance monitoring (if perfMonitor available)
     * 2. Add visual feedback (resizing class)
     * 3. Capture starting position and dimensions
     * 4. Initialize startRect for deltaRect accumulation
     *
     * **Why capture startRect**:
     * - interact.js provides deltaRect (cumulative changes)
     * - Must apply deltas to starting values
     * - Position can change during resize (top/left handles)
     * - Dimensions always change during resize
     *
     * **startRect structure**:
     * ```typescript
     * {
     *   x: 100,      // Starting transform X
     *   y: 150,      // Starting transform Y
     *   width: 300,  // Starting width in pixels
     *   height: 200  // Starting height in pixels
     * }
     * ```
     *
     * **Performance tracking**:
     * - Optional perfMonitor integration
     * - Measures total resize duration (start → end)
     * - Helps identify performance regressions
     *
     * @private
     * @param event - interact.js resize start event
     *
     * @example
     * ```typescript
     * // Event provides element reference
     * {
     *   target: HTMLElement,
     *   rect: {width, height, left, top, ...},
     *   // ... other interact.js properties
     * }
     * ```
     */
    handleResizeStart(event) {
        // Start performance tracking
        if (window.perfMonitor) {
            window.perfMonitor.startOperation('resize');
        }
        event.target.classList.add('resizing');
        // Store the starting position and size
        const position = getTransformPosition(event.target);
        this.startRect.x = position.x;
        this.startRect.y = position.y;
        this.startRect.width = parseFloat(event.target.style.width) || 0;
        this.startRect.height = parseFloat(event.target.style.height) || 0;
    }
    /**
     * Handle resize move event with RAF batching (high-frequency, ~60fps)
     *
     * **Critical Performance Path**: This runs ~200 times/sec during resize (mousemove),
     * but RAF batching limits actual DOM updates to ~60fps.
     *
     * **RAF Batching Pattern**:
     * ```
     * cancelAnimationFrame(oldId);  // Cancel previous pending frame
     * newId = requestAnimationFrame(() => {
     *   // DOM updates execute once per browser paint
     * });
     * ```
     *
     * **Why RAF batching is critical**:
     * - Mousemove fires ~200x/sec (faster than 60fps display)
     * - Without batching: 200 DOM updates/sec, many wasted (can't paint that fast)
     * - With batching: ~60 DOM updates/sec, aligned with browser paint
     * - **3-4x fewer DOM operations**
     * - Prevents frame drops and stuttering
     *
     * **DeltaRect Accumulation**:
     * interact.js provides cumulative changes since resize start:
     * - `deltaRect.left`: X position change (negative = moved left)
     * - `deltaRect.top`: Y position change (negative = moved up)
     * - `deltaRect.width`: Width change
     * - `deltaRect.height`: Height change
     *
     * **Why accumulate into startRect**:
     * - Maintains single source of truth for current state
     * - Allows direct application to DOM
     * - Simplifies final position calculation
     *
     * **Example resize from top-left handle**:
     * ```
     * Start: x=100, y=150, width=300, height=200
     * User drags top-left handle up-left by 50px
     * deltaRect: {left: -50, top: -50, width: 50, height: 50}
     * Result: x=50, y=100, width=350, height=250
     * ```
     *
     * **Performance per frame**:
     * - Cancel previous RAF: ~0.01ms
     * - Schedule new RAF: ~0.01ms
     * - Actual DOM update (in RAF callback):
     *   - 3 style updates (transform, width, height)
     *   - No layout/reflow (transform is composited)
     *   - ~0.5-1ms total
     *
     * **Without RAF batching**:
     * - 200 updates/sec × 1ms = 200ms/sec wasted
     * - Dropped frames, stuttering
     *
     * **With RAF batching**:
     * - 60 updates/sec × 1ms = 60ms/sec
     * - Smooth, no dropped frames
     *
     * @private
     * @param event - interact.js resize move event
     *
     * @example
     * ```typescript
     * // Event provides deltaRect (cumulative changes)
     * {
     *   target: HTMLElement,
     *   deltaRect: {
     *     left: -10,   // Element moved left 10px
     *     top: 0,      // No vertical movement
     *     width: 10,   // Grew 10px wider
     *     height: 0    // Height unchanged
     *   }
     * }
     *
     * // Applied as:
     * // newX = startX + (-10)
     * // newWidth = startWidth + 10
     * ```
     */
    handleResizeMove(event) {
        // Cancel any pending frame
        if (this.resizeRafId) {
            cancelAnimationFrame(this.resizeRafId);
        }
        // Batch DOM updates with requestAnimationFrame for 60fps
        this.resizeRafId = requestAnimationFrame(() => {
            // Use deltaRect to accumulate changes
            const dx = event.deltaRect.left;
            const dy = event.deltaRect.top;
            const dw = event.deltaRect.width;
            const dh = event.deltaRect.height;
            // Update stored rect
            this.startRect.x += dx;
            this.startRect.y += dy;
            this.startRect.width += dw;
            this.startRect.height += dh;
            // Apply styles
            event.target.style.transform = `translate(${this.startRect.x}px, ${this.startRect.y}px)`;
            event.target.style.width = this.startRect.width + 'px';
            event.target.style.height = this.startRect.height + 'px';
            this.resizeRafId = null;
        });
    }
    /**
     * Handle resize end event - finalize dimensions and update state
     *
     * **Critical responsibilities**:
     * - Cancel pending RAF (prevent stale updates)
     * - Grid snap position AND dimensions
     * - Enforce boundary constraints
     * - Convert viewport coordinates to container-relative
     * - Update state (triggers single re-render)
     *
     * ## Processing Steps
     *
     * ### 1. RAF Cleanup
     * Cancel any pending requestAnimationFrame to prevent stale updates after
     * resize completes. Critical to avoid errors and ensure clean state.
     *
     * ### 2. Coordinate Conversion
     * interact.js provides viewport coordinates (event.rect.left/top).
     * Must convert to container-relative coordinates:
     * ```
     * containerRelativeX = viewportX - containerRect.left
     * ```
     *
     * **Why conversion needed**:
     * - CSS transform uses container-relative coordinates
     * - event.rect uses viewport coordinates
     * - Scrolled pages have different viewport vs container positions
     *
     * ### 3. Grid Snapping (Position AND Dimensions)
     * Unlike drag, resize snaps BOTH position and dimensions:
     * ```
     * newX = Math.round(newX / gridSizeX) * gridSizeX
     * newWidth = Math.round(newWidth / gridSizeX) * gridSizeX
     * ```
     *
     * **Why snap dimensions**:
     * - Ensures items align to grid cells
     * - Prevents items spanning fractional grid units
     * - Makes layouts predictable and clean
     *
     * ### 4. Boundary Constraints
     * **Manual implementation** (interact.js restrictEdges breaks with deltaRect):
     * ```
     * newX = Math.max(0, newX);  // Left edge
     * newX = Math.min(newX, containerWidth - itemWidth);  // Right edge
     * ```
     *
     * **Why manual constraints**:
     * - interact.js restrictEdges modifier conflicts with deltaRect
     * - Manual constraints applied after grid snapping
     * - Ensures final position respects canvas bounds
     *
     * ### 5. Mobile Layout Handling
     * - Detects current viewport (desktop vs mobile)
     * - Updates appropriate layout object
     * - Marks mobile as "customized" when modified
     * - Ensures mobile layouts don't auto-sync from desktop
     *
     * ### 6. State Persistence
     * - Converts pixels to grid units
     * - Updates item.layouts with new position and dimensions
     * - Calls `onUpdate(item)` callback
     * - Triggers single StencilJS re-render
     * - Parent pushes undo/redo command
     *
     * ## Performance Characteristics
     *
     * **Total execution time**: ~5-10ms
     * - RAF cancellation: ~0.01ms
     * - Coordinate conversion: ~0.5ms
     * - Grid snapping: ~1ms
     * - Boundary checks: ~0.5ms
     * - State update: ~3-5ms (single re-render)
     *
     * **Why this is acceptable**:
     * - Only runs once at resize end (not 60fps)
     * - User expects slight delay when releasing resize
     * - Grid snapping provides visual feedback justifying delay
     *
     * ## Edge Cases Handled
     *
     * - Resize extending outside canvas → clamped to bounds
     * - Minimum size violations → prevented by modifier
     * - Position changes during resize (top/left handles) → preserved via deltaRect
     * - Container not found → early exit (safety)
     * - Mobile view → mark as customized
     * - Pending RAF → cancelled before state update
     *
     * @private
     * @param event - interact.js resize end event
     *
     * @example
     * ```typescript
     * // Example resize sequence (top-left handle):
     * // 1. handleResizeStart: Store startRect (x=100, y=150, w=300, h=200)
     * // 2. handleResizeMove (RAF batched): Apply deltaRect changes
     * // 3. handleResizeEnd:
     * //    - event.rect: {left: 525, top: 375, width: 350, height: 250} (viewport coords)
     * //    - containerRect: {left: 475, top: 275} (viewport offset)
     * //    - relativeX = 525 - 475 = 50px
     * //    - relativeY = 375 - 275 = 100px
     * //    - snappedX = round(50/20)*20 = 60px
     * //    - gridX = 60/20 = 3 grid units
     * //    - item.layouts.desktop.x = 3
     * //    - onUpdate(item) → re-render + undo command
     * ```
     */
    handleResizeEnd(event) {
        var _a;
        // Cancel any pending frame
        if (this.resizeRafId) {
            cancelAnimationFrame(this.resizeRafId);
            this.resizeRafId = null;
        }
        event.target.classList.remove('resizing');
        // Clean up data attributes
        event.target.removeAttribute('data-x');
        event.target.removeAttribute('data-y');
        event.target.removeAttribute('data-width');
        event.target.removeAttribute('data-height');
        // Get the container to calculate relative position
        const container = domCache.getCanvas(this.item.canvasId);
        if (!container) {
            return;
        }
        const containerRect = container.getBoundingClientRect();
        const gridSizeX = getGridSizeHorizontal(this.item.canvasId);
        const gridSizeY = getGridSizeVertical();
        // Convert absolute event.rect to container-relative coordinates
        let newX = event.rect.left - containerRect.left;
        let newY = event.rect.top - containerRect.top;
        let newWidth = event.rect.width;
        let newHeight = event.rect.height;
        // Snap position to grid
        newX = Math.round(newX / gridSizeX) * gridSizeX;
        newY = Math.round(newY / gridSizeY) * gridSizeY;
        // Snap dimensions to grid
        newWidth = Math.round(newWidth / gridSizeX) * gridSizeX;
        newHeight = Math.round(newHeight / gridSizeY) * gridSizeY;
        // Keep within parent boundaries (manual implementation since interact.js restrictEdges breaks deltaRect)
        newX = Math.max(0, newX); // Don't go past left edge
        newY = Math.max(0, newY); // Don't go past top edge
        newX = Math.min(newX, container.clientWidth - newWidth); // Don't go past right edge
        newY = Math.min(newY, container.clientHeight - newHeight); // Don't go past bottom edge
        // Apply snapped final position
        event.target.style.transform = `translate(${newX}px, ${newY}px)`;
        event.target.style.width = newWidth + 'px';
        event.target.style.height = newHeight + 'px';
        // Update item size and position in current viewport's layout (convert to grid units)
        const currentViewport = ((_a = window.gridState) === null || _a === void 0 ? void 0 : _a.currentViewport) || 'desktop';
        const layout = this.item.layouts[currentViewport];
        layout.width = pixelsToGridX(newWidth, this.item.canvasId);
        layout.height = pixelsToGridY(newHeight);
        layout.x = pixelsToGridX(newX, this.item.canvasId);
        layout.y = pixelsToGridY(newY);
        // If in mobile view, mark as customized
        if (currentViewport === 'mobile') {
            this.item.layouts.mobile.customized = true;
        }
        // End performance tracking
        if (window.perfMonitor) {
            window.perfMonitor.endOperation('resize');
        }
        // Trigger StencilJS update (single re-render at end)
        this.onUpdate(this.item);
    }
}

const gridItemWrapperCss = "@charset \"UTF-8\";.grid-item{position:absolute;min-width:100px;min-height:80px;padding:20px 20px 20px 44px;border:2px solid transparent;border-radius:4px;background:white;box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);cursor:default;transition:border-color 0.2s, box-shadow 0.2s;will-change:transform;}.grid-item:hover{border-color:#4a90e2}.grid-item.selected{z-index:1000;border:3px solid #2563eb;padding:19px 19px 19px 43px;box-shadow:0 0 0 3px rgba(37, 99, 235, 0.2), 0 4px 12px rgba(74, 144, 226, 0.4);}.grid-item.dragging{cursor:move;opacity:0.7}.grid-item.resizing{user-select:none}.grid-item-header{display:flex;align-items:center;gap:8px;margin:-20px -20px 12px -44px;padding:10px 16px 10px 50px;background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);border-bottom:1px solid #dee2e6;border-radius:4px 4px 0 0;color:#495057;font-size:13px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase}.grid-item.selected .grid-item-header{margin:-19px -19px 12px -43px;padding:10px 16px 10px 49px;}.grid-item-content{overflow:hidden;max-width:100%;color:#666;font-size:13px}.loading-placeholder{display:flex;height:100%;align-items:center;justify-content:center;color:#999;font-size:12px}.grid-item-controls{position:absolute;top:8px;right:8px;display:flex;gap:4px;opacity:0;transition:opacity 0.2s}.grid-item.selected .grid-item-controls,.grid-item:hover .grid-item-controls{opacity:1}.grid-item.selected .grid-item-controls{top:7px;right:7px;}.grid-item-control-btn{width:24px;height:24px;padding:0;border:none;border-radius:4px;background:#4a90e2;color:white;cursor:pointer;font-size:12px;line-height:1;transition:background 0.2s}.grid-item-control-btn:hover{background:#357abd}.grid-item-delete{width:24px;height:24px;padding:0;border:none;border-radius:50%;background:#f44;color:white;cursor:pointer;font-size:14px;line-height:1;transition:background 0.2s}.grid-item-delete:hover{background:#c00}.drag-handle{position:absolute;top:8px;left:8px;display:flex;width:28px;height:28px;align-items:center;justify-content:center;border:1px solid rgba(74, 144, 226, 0.3);border-radius:4px;background:rgba(74, 144, 226, 0.1);cursor:move;opacity:0.7;transition:all 0.2s}.drag-handle::before{color:#4a90e2;content:\"⋮⋮\";font-size:14px;font-weight:bold;letter-spacing:-2px}.drag-handle:hover{background:rgba(74, 144, 226, 0.25);transform:scale(1.1)}.grid-item:hover .drag-handle{background:rgba(74, 144, 226, 0.15);opacity:1}.grid-item.selected .drag-handle{top:7px;left:7px;}.resize-handle{position:absolute;width:10px;height:10px;border:2px solid white;border-radius:50%;background:#4a90e2;box-shadow:0 0 3px rgba(0, 0, 0, 0.3);opacity:0;transition:opacity 0.2s}.grid-item.selected .resize-handle,.grid-item:hover .resize-handle{opacity:1}.resize-handle.nw{top:-5px;left:-5px;cursor:nw-resize}.resize-handle.ne{top:-5px;right:-5px;cursor:ne-resize}.resize-handle.sw{bottom:-5px;left:-5px;cursor:sw-resize}.resize-handle.se{right:-5px;bottom:-5px;cursor:se-resize}.resize-handle.n{top:-5px;left:50%;cursor:n-resize;transform:translateX(-50%)}.resize-handle.s{bottom:-5px;left:50%;cursor:s-resize;transform:translateX(-50%)}.resize-handle.e{top:50%;right:-5px;cursor:e-resize;transform:translateY(-50%)}.resize-handle.w{top:50%;left:-5px;cursor:w-resize;transform:translateY(-50%)}.grid-item.selected .resize-handle.nw,.grid-item.selected .resize-handle.n,.grid-item.selected .resize-handle.ne{top:-6px;}.grid-item.selected .resize-handle.sw,.grid-item.selected .resize-handle.s,.grid-item.selected .resize-handle.se{bottom:-6px;}.grid-item.selected .resize-handle.nw,.grid-item.selected .resize-handle.w,.grid-item.selected .resize-handle.sw{left:-6px;}.grid-item.selected .resize-handle.ne,.grid-item.selected .resize-handle.e,.grid-item.selected .resize-handle.se{right:-6px;}";

const GridItemWrapper = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Item snapshot (for undo/redo)
         *
         * **Captured**: componentWillLoad, componentWillUpdate
         * **Purpose**: Store item state before interactions
         * **Used by**: handleItemUpdate to detect changes and create undo commands
         * **Deep clone**: JSON.parse(JSON.stringify(item))
         */
        this.itemSnapshot = null;
        /**
         * Capture item snapshot for undo/redo
         *
         * **Called from**: updateComponentState (before interactions)
         * **Purpose**: Deep clone item state for change detection
         *
         * **Deep cloning**:
         * ```typescript
         * this.itemSnapshot = JSON.parse(JSON.stringify(this.item));
         * ```
         *
         * **Why deep clone**:
         * - Prevents mutations from affecting snapshot
         * - Independent copy of item state
         * - Simple and reliable (no reference tracking)
         *
         * **Performance**:
         * - ~0.1-0.5ms per snapshot
         * - Acceptable for pre-interaction capture
         * - Could optimize with structured cloning if needed
         *
         * **Used by**: handleItemUpdate to compare before/after state
         *
         * @private
         */
        this.captureItemSnapshot = () => {
            // Deep clone the item to capture its state before drag/resize
            this.itemSnapshot = JSON.parse(JSON.stringify(this.item));
        };
        /**
         * Handle item update (called by drag/resize handlers)
         *
         * **Triggered by**: DragHandler.onUpdate, ResizeHandler.onUpdate
         * **Purpose**: Create undo command and update state
         *
         * ## Change Detection
         *
         * **Compare snapshot with updated item**:
         * ```typescript
         * const positionChanged =
         *   snapshot.layouts.desktop.x !== updated.layouts.desktop.x ||
         *   snapshot.layouts.desktop.y !== updated.layouts.desktop.y ||
         *   snapshot.layouts.desktop.width !== updated.layouts.desktop.width ||
         *   snapshot.layouts.desktop.height !== updated.layouts.desktop.height;
         *
         * const canvasChanged = snapshot.canvasId !== updated.canvasId;
         * ```
         *
         * **Why check for changes**:
         * - Drag without movement shouldn't create undo command
         * - Resize without size change shouldn't create undo command
         * - Prevents undo history pollution
         * - Only track meaningful operations
         *
         * ## Undo Command Creation
         *
         * **Create MoveItemCommand**:
         * ```typescript
         * pushCommand(new MoveItemCommand(
         *   itemId,
         *   snapshot.canvasId,     // Source canvas
         *   updated.canvasId,      // Target canvas (may be same)
         *   { x: snapshot.x, y: snapshot.y },        // Before position
         *   { x: updated.x, y: updated.y },          // After position
         *   sourceIndex            // Original array index
         * ));
         * ```
         *
         * **Why MoveItemCommand for resize**:
         * - MoveItemCommand tracks position changes
         * - Resize changes position AND size
         * - Position comparison includes width/height
         * - Single command type for all transformations
         *
         * **Source index capture**:
         * ```typescript
         * const sourceIndex = sourceCanvas.items.findIndex(i => i.id === item.id);
         * ```
         * - Needed for undo to restore at original position
         * - Critical for z-index order preservation
         *
         * ## State Update
         *
         * **Update item in canvas**:
         * ```typescript
         * const canvas = gridState.canvases[this.item.canvasId];
         * const itemIndex = canvas.items.findIndex(i => i.id === this.item.id);
         * canvas.items[itemIndex] = updatedItem;
         * gridState.canvases = { ...gridState.canvases };  // Trigger reactivity
         * ```
         *
         * **Why spread pattern**:
         * - Object reference change triggers StencilJS reactivity
         * - Components automatically re-render
         * - Standard reactive state pattern
         *
         * **Order of operations**:
         * 1. Compare snapshot with updated item
         * 2. Create undo command if changed
         * 3. Push command to history
         * 4. Update item in state
         * 5. Trigger re-render
         *
         * **Edge cases**:
         * - No snapshot: Skip undo command creation
         * - Canvas not found: Skip state update
         * - Item not found: Skip state update
         *
         * @param updatedItem - Item with new position/size from drag/resize handler
         *
         * @example
         * ```typescript
         * // After drag operation
         * handleItemUpdate({
         *   ...item,
         *   layouts: {
         *     desktop: { x: 15, y: 10, width: 20, height: 8 }
         *   }
         * })
         * // → Compares with snapshot: { x: 10, y: 5, ... }
         * // → Position changed: true
         * // → Creates MoveItemCommand(before: {10,5}, after: {15,10})
         * // → Updates state
         * // → Undo available
         * ```
         *
         * @private
         */
        this.handleItemUpdate = (updatedItem) => {
            // Called by drag/resize handlers at end of operation
            // Check if position or canvas changed (for undo/redo)
            if (this.itemSnapshot) {
                const snapshot = this.itemSnapshot;
                const positionChanged = snapshot.layouts.desktop.x !== updatedItem.layouts.desktop.x ||
                    snapshot.layouts.desktop.y !== updatedItem.layouts.desktop.y ||
                    snapshot.layouts.desktop.width !== updatedItem.layouts.desktop.width ||
                    snapshot.layouts.desktop.height !== updatedItem.layouts.desktop.height;
                const canvasChanged = snapshot.canvasId !== updatedItem.canvasId;
                if (positionChanged || canvasChanged) {
                    // Find source canvas and index
                    const sourceCanvas = state.canvases[snapshot.canvasId];
                    const sourceIndex = (sourceCanvas === null || sourceCanvas === void 0 ? void 0 : sourceCanvas.items.findIndex((i) => i.id === this.item.id)) || 0;
                    // Push undo command before updating state
                    pushCommand(new MoveItemCommand(updatedItem.id, snapshot.canvasId, updatedItem.canvasId, {
                        x: snapshot.layouts.desktop.x,
                        y: snapshot.layouts.desktop.y,
                    }, {
                        x: updatedItem.layouts.desktop.x,
                        y: updatedItem.layouts.desktop.y,
                    }, sourceIndex));
                }
            }
            // Update item in state (triggers re-render)
            const canvas = state.canvases[this.item.canvasId];
            const itemIndex = canvas.items.findIndex((i) => i.id === this.item.id);
            if (itemIndex !== -1) {
                canvas.items[itemIndex] = updatedItem;
                state.canvases = Object.assign({}, state.canvases); // Trigger update
            }
        };
        /**
         * Handle click event (selection and config panel)
         *
         * **Triggered by**: User clicks anywhere on grid item
         * **Purpose**: Select item and optionally open config panel
         *
         * ## Click Filtering
         *
         * **Ignore clicks on interactive elements**:
         * ```typescript
         * if (
         *   target.classList.contains('drag-handle') ||
         *   target.classList.contains('resize-handle') ||
         *   target.classList.contains('grid-item-delete') ||
         *   target.classList.contains('grid-item-control-btn')
         * ) {
         *   return;  // Don't select/open config
         * }
         * ```
         *
         * **Why filter**:
         * - Drag handle should only drag (not select)
         * - Resize handles should only resize (not select)
         * - Control buttons have their own actions
         * - Prevents conflicting interactions
         *
         * **Uses closest() for nested elements**:
         * ```typescript
         * target.closest('.drag-handle')
         * ```
         * - Handles clicks on child elements of handle
         * - Bubbling through handle children
         * - More robust than classList alone
         *
         * ## Selection Update
         *
         * **Set selection immediately**:
         * ```typescript
         * gridState.selectedItemId = this.item.id;
         * gridState.selectedCanvasId = this.item.canvasId;
         * ```
         *
         * **Why immediate**:
         * - Keyboard shortcuts check selection (Delete key)
         * - Visual feedback needs to be instant
         * - Other components react to selection
         * - No need to wait for event handling
         *
         * ## Custom Event Dispatch
         *
         * **Dispatch 'item-click' event**:
         * ```typescript
         * dispatchEvent(new CustomEvent('item-click', {
         *   detail: { itemId: item.id, canvasId: item.canvasId },
         *   bubbles: true,    // Event reaches parent (grid-builder-app)
         *   composed: true    // Event crosses shadow DOM
         * }));
         * ```
         *
         * **Purpose**: Open config panel in parent app
         * - App listens for item-click events
         * - Opens config panel for selected item
         * - Decouples wrapper from app logic
         *
         * **Event details**:
         * - `itemId`: Which item was clicked
         * - `canvasId`: Which canvas contains item
         * - Both needed for state lookup
         *
         * @param e - Mouse click event
         *
         * @example
         * ```typescript
         * // User clicks item header
         * handleClick(event)
         * // → target is header, not a handle
         * // → Selection updated: selectedItemId = 'item-3'
         * // → Event dispatched to app
         * // → Config panel opens
         *
         * // User clicks drag handle
         * handleClick(event)
         * // → target is drag-handle
         * // → Early return, no selection change
         * // → Drag operation can proceed
         * ```
         *
         * @private
         */
        this.handleClick = (e) => {
            // Don't open config panel if clicking on drag handle, resize handle, or control buttons
            const target = e.target;
            if (target.classList.contains('drag-handle') ||
                target.closest('.drag-handle') ||
                target.classList.contains('resize-handle') ||
                target.closest('.resize-handle') ||
                target.classList.contains('grid-item-delete') ||
                target.classList.contains('grid-item-control-btn')) {
                return;
            }
            // Set selection state immediately (so keyboard shortcuts work)
            state.selectedItemId = this.item.id;
            state.selectedCanvasId = this.item.canvasId;
            // Dispatch event to open config panel
            const event = new CustomEvent('item-click', {
                detail: { itemId: this.item.id, canvasId: this.item.canvasId },
                bubbles: true,
                composed: true,
            });
            this.itemRef.dispatchEvent(event);
        };
        /**
         * Handle bring to front (increase z-index)
         *
         * **Triggered by**: User clicks "Bring to Front" button (⬆️)
         * **Purpose**: Move item to top of stacking order
         *
         * ## Z-Index Calculation
         *
         * **Find maximum z-index in canvas**:
         * ```typescript
         * const canvas = gridState.canvases[item.canvasId];
         * const maxZ = Math.max(...canvas.items.map(i => i.zIndex));
         * ```
         *
         * **Set item z-index to max + 1**:
         * ```typescript
         * this.item.zIndex = maxZ + 1;
         * ```
         *
         * **Why max + 1**:
         * - Guarantees item is on top
         * - Monotonic z-index (never reuse values)
         * - Simple and reliable
         * - No conflicts with existing items
         *
         * ## State Update
         *
         * **Trigger reactivity**:
         * ```typescript
         * gridState.canvases = { ...gridState.canvases };
         * ```
         *
         * **Side effects**:
         * - Component re-renders with new z-index
         * - Item visually moves to front
         * - CSS z-index applied: `style={{ zIndex: newValue }}`
         *
         * ## No Undo Support
         *
         * **Note**: Z-index changes NOT tracked in undo history
         * - Would clutter history with minor operations
         * - Less critical than position/size changes
         * - Could be added if needed
         *
         * **Alternative approach**:
         * - Track in separate z-index command type
         * - Or bundle with next position change
         *
         * @example
         * ```typescript
         * // Canvas has items with z-index: 1, 3, 5
         * handleBringToFront()
         * // → maxZ = 5
         * // → item.zIndex = 6
         * // → Item now on top
         * ```
         *
         * @private
         */
        this.handleBringToFront = () => {
            const canvas = state.canvases[this.item.canvasId];
            const maxZ = Math.max(...canvas.items.map((i) => i.zIndex));
            this.item.zIndex = maxZ + 1;
            state.canvases = Object.assign({}, state.canvases); // Trigger update
        };
        /**
         * Handle send to back (decrease z-index)
         *
         * **Triggered by**: User clicks "Send to Back" button (⬇️)
         * **Purpose**: Move item to bottom of stacking order
         *
         * ## Z-Index Calculation
         *
         * **Find minimum z-index in canvas**:
         * ```typescript
         * const canvas = gridState.canvases[item.canvasId];
         * const minZ = Math.min(...canvas.items.map(i => i.zIndex));
         * ```
         *
         * **Set item z-index to min - 1**:
         * ```typescript
         * this.item.zIndex = minZ - 1;
         * ```
         *
         * **Why min - 1**:
         * - Guarantees item is behind all others
         * - Allows negative z-index (CSS allows it)
         * - Monotonic z-index (never conflicts)
         * - Simple and reliable
         *
         * ## State Update
         *
         * **Trigger reactivity**:
         * ```typescript
         * gridState.canvases = { ...gridState.canvases };
         * ```
         *
         * **Side effects**:
         * - Component re-renders with new z-index
         * - Item visually moves to back
         * - Other items appear in front
         *
         * ## Z-Index Range
         *
         * **No limits enforced**:
         * - Can go negative (valid CSS)
         * - Can grow arbitrarily high
         * - In practice: -100 to +100 range
         * - Could add normalization if needed
         *
         * @example
         * ```typescript
         * // Canvas has items with z-index: 1, 3, 5
         * handleSendToBack()
         * // → minZ = 1
         * // → item.zIndex = 0
         * // → Item now behind all others
         * ```
         *
         * @private
         */
        this.handleSendToBack = () => {
            const canvas = state.canvases[this.item.canvasId];
            const minZ = Math.min(...canvas.items.map((i) => i.zIndex));
            this.item.zIndex = minZ - 1;
            state.canvases = Object.assign({}, state.canvases); // Trigger update
        };
        /**
         * Handle delete (dispatch event to app)
         *
         * **Triggered by**: User clicks delete button (×)
         * **Purpose**: Request item deletion from parent app
         *
         * ## Custom Event Dispatch
         *
         * **Pattern**:
         * ```typescript
         * dispatchEvent(new CustomEvent('item-delete', {
         *   detail: { itemId: item.id, canvasId: item.canvasId },
         *   bubbles: true,
         *   composed: true
         * }));
         * ```
         *
         * **Why custom event**:
         * - Wrapper doesn't manage global state
         * - App coordinates deletion with undo command
         * - Decouples wrapper from app logic
         * - Testable (can spy on events)
         *
         * **Event details**:
         * - `itemId`: Which item to delete
         * - `canvasId`: Which canvas contains item
         * - Both needed for state lookup
         *
         * ## App Coordination
         *
         * **grid-builder-app.tsx handles**:
         * 1. Receives 'item-delete' event
         * 2. Gets item and index for undo command
         * 3. Creates DeleteItemCommand
         * 4. Removes item from state
         * 5. Pushes command for undo
         * 6. Clears selection if this item selected
         *
         * **Why delegate to app**:
         * - App owns item collection state
         * - App manages undo history
         * - Single responsibility (wrapper = UI, app = state)
         * - Easier to test and maintain
         *
         * ## No Direct State Mutation
         *
         * **Wrapper does NOT**:
         * - Remove item from state
         * - Create undo command
         * - Clear selection
         *
         * **Only dispatches event**:
         * - App decides how to handle
         * - Could show confirmation dialog
         * - Could enforce business rules
         * - Flexible architecture
         *
         * @example
         * ```typescript
         * // User clicks delete button
         * handleDelete()
         * // → Event dispatched: { itemId: 'item-3', canvasId: 'canvas1' }
         * // → App receives event
         * // → App creates DeleteItemCommand
         * // → App removes item from state
         * // → Item disappears from DOM
         * // → Undo available
         * ```
         *
         * @private
         */
        this.handleDelete = () => {
            // Dispatch event to grid-builder-app to handle
            const event = new CustomEvent('item-delete', {
                detail: { itemId: this.item.id, canvasId: this.item.canvasId },
                bubbles: true,
                composed: true,
            });
            this.itemRef.dispatchEvent(event);
        };
        this.item = undefined;
        this.renderVersion = undefined;
        this.isSelected = false;
        this.isVisible = false;
    }
    /**
     * Component will load lifecycle hook
     *
     * **Called**: Before first render
     * **Purpose**: Update component state before initial render
     *
     * **Delegates to**: updateComponentState()
     * - Updates selection state
     * - Captures item snapshot for undo
     */
    componentWillLoad() {
        this.updateComponentState();
    }
    /**
     * Component will update lifecycle hook
     *
     * **Called**: Before each re-render
     * **Purpose**: Refresh component state before re-render
     *
     * **Delegates to**: updateComponentState()
     * - Re-checks selection state (may have changed)
     * - Re-captures snapshot (item may have been modified)
     *
     * **Why needed**:
     * - Selection can change between renders
     * - Item data can be updated externally
     * - Ensures render has latest state
     */
    componentWillUpdate() {
        this.updateComponentState();
    }
    /**
     * Update component state (selection and snapshot)
     *
     * **Called from**: componentWillLoad, componentWillUpdate
     * **Purpose**: Sync local state with global state before render
     *
     * **Operations**:
     * 1. Update selection state from gridState
     * 2. Capture item snapshot for undo/redo
     *
     * **Selection check**:
     * ```typescript
     * this.isSelected = gridState.selectedItemId === this.item.id;
     * ```
     *
     * **Snapshot capture**:
     * ```typescript
     * this.captureItemSnapshot();  // Deep clone item
     * ```
     *
     * **Why in separate method**:
     * - DRY principle (called from 2 places)
     * - Easier to test
     * - Clearer lifecycle flow
     *
     * @private
     */
    updateComponentState() {
        // Update selection state
        this.isSelected = state.selectedItemId === this.item.id;
        // Capture item snapshot for undo/redo
        this.captureItemSnapshot();
    }
    /**
     * Component did load lifecycle hook
     *
     * **Called**: After first render (DOM available)
     * **Purpose**: Initialize drag/resize handlers and virtual rendering
     *
     * **Operations**:
     * 1. Create DragHandler instance
     * 2. Create ResizeHandler instance
     * 3. Setup virtual rendering observer
     *
     * **Handler initialization**:
     * ```typescript
     * this.dragHandler = new DragHandler(
     *   this.itemRef,           // Element to make draggable
     *   this.item,              // Grid item data
     *   this.handleItemUpdate   // Callback on drag end
     * );
     * ```
     *
     * **Virtual rendering setup**:
     * ```typescript
     * virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
     *   this.isVisible = isVisible;  // State update triggers re-render
     * });
     * ```
     *
     * **Why after render**:
     * - Needs itemRef to be assigned (happens during render)
     * - interact.js requires actual DOM element
     * - IntersectionObserver requires element to observe
     *
     * **One-time setup**:
     * - Only runs once after mount
     * - Handlers persist across re-renders
     * - Cleanup in disconnectedCallback
     */
    componentDidLoad() {
        // Initialize drag and resize handlers
        this.dragHandler = new DragHandler(this.itemRef, this.item, this.handleItemUpdate);
        this.resizeHandler = new ResizeHandler(this.itemRef, this.item, this.handleItemUpdate);
        // Set up virtual rendering observer
        virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
            this.isVisible = isVisible;
        });
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Called**: When component removed from DOM
     * **Purpose**: Clean up handlers and observers
     *
     * **Cleanup operations**:
     * 1. Destroy drag handler (remove interact.js listeners)
     * 2. Destroy resize handler (remove interact.js listeners)
     * 3. Unobserve virtual renderer (remove IntersectionObserver)
     *
     * **Why important**:
     * - Prevents memory leaks
     * - Removes event listeners
     * - Stops observation of removed elements
     * - Standard web component lifecycle pattern
     *
     * **Safety checks**:
     * - Verifies handlers exist before destroying
     * - Verifies itemRef exists before unobserving
     *
     * **Memory impact**:
     * - Without cleanup: ~50-100KB per item leaked
     * - With cleanup: Proper garbage collection
     */
    disconnectedCallback() {
        // Cleanup handlers
        if (this.dragHandler) {
            this.dragHandler.destroy();
        }
        if (this.resizeHandler) {
            this.resizeHandler.destroy();
        }
        // Cleanup virtual renderer
        if (this.itemRef) {
            virtualRenderer.unobserve(this.itemRef, this.item.id);
        }
    }
    /**
     * Render component content (dynamic component switching)
     *
     * **Called from**: render() method
     * **Purpose**: Render appropriate component based on item type
     *
     * ## Virtual Rendering Guard
     *
     * **Placeholder when not visible**:
     * ```typescript
     * if (!this.isVisible) {
     *   return <div class="component-placeholder">Loading...</div>;
     * }
     * ```
     *
     * **Why needed**:
     * - Complex components expensive to render
     * - Initial page load renders only visible items
     * - Placeholder shows while scrolling
     * - Actual component renders when visible
     *
     * **Performance benefit**:
     * - 100 items, 10 visible → 90 placeholders
     * - Placeholder: ~0.5ms, Component: ~5-50ms
     * - 10× faster initial render
     *
     * ## Component Type Switching
     *
     * **Switch statement pattern**:
     * ```typescript
     * switch (this.item.type) {
     *   case 'header': return <component-header itemId={item.id} />;
     *   case 'text': return <component-text-block itemId={item.id} />;
     *   // ...
     *   default: return <div>Unknown component type</div>;
     * }
     * ```
     *
     * **Why itemId prop**:
     * - Child component can look up data in gridState
     * - Avoids prop drilling full GridItem
     * - Components can update themselves
     * - Simpler wrapper interface
     *
     * **Component types**:
     * - Simple: header, text, image, button, video
     * - Complex: imageGallery, dashboardWidget, liveData
     * - Complex components benefit most from virtual rendering
     *
     * **Error handling**:
     * - Default case shows "Unknown component type"
     * - Prevents crash if invalid type
     * - Helps debugging
     *
     * @returns JSX for component content or placeholder
     *
     * @example
     * ```typescript
     * // Visible header item
     * renderComponent()
     * // → <component-header itemId="item-1" />
     *
     * // Not visible gallery
     * renderComponent()
     * // → <div class="component-placeholder">Loading...</div>
     * ```
     *
     * @private
     */
    renderComponent() {
        // Virtual rendering: only render component content when visible
        if (!this.isVisible) {
            return h("div", { class: "component-placeholder" }, "Loading...");
        }
        switch (this.item.type) {
            case 'header':
                return h("component-header", { itemId: this.item.id });
            case 'text':
                return h("component-text-block", { itemId: this.item.id });
            case 'image':
                return h("component-image", { itemId: this.item.id });
            case 'button':
                return h("component-button", { itemId: this.item.id });
            case 'video':
                return h("component-video", { itemId: this.item.id });
            case 'imageGallery':
                return h("component-image-gallery", { itemId: this.item.id });
            case 'dashboardWidget':
                return h("component-dashboard-widget", { itemId: this.item.id });
            case 'liveData':
                return h("component-live-data", { itemId: this.item.id });
            default:
                return h("div", null, "Unknown component type: ", this.item.type);
        }
    }
    /**
     * Render component template
     *
     * **Reactive**: Re-runs when item, renderVersion, or state changes
     * **Pure**: No side effects, only returns JSX
     *
     * ## Layout Selection and Auto-Layout
     *
     * **Viewport-based layout**:
     * ```typescript
     * const currentViewport = gridState.currentViewport; // 'desktop' | 'mobile'
     * const layout = this.item.layouts[currentViewport];
     * ```
     *
     * **Mobile auto-layout**:
     * When `currentViewport === 'mobile'` AND `!item.layouts.mobile.customized`:
     * ```typescript
     * // Calculate stacked vertical position
     * const itemIndex = canvas.items.findIndex(i => i.id === item.id);
     * let yPosition = 0;
     * for (let i = 0; i < itemIndex; i++) {
     *   yPosition += canvas.items[i].layouts.desktop.height || 6;
     * }
     *
     * actualLayout = {
     *   x: 0,                                  // Full left
     *   y: yPosition,                          // Stacked
     *   width: 50,                             // Full width (50 units = 100%)
     *   height: item.layouts.desktop.height    // Keep height
     * };
     * ```
     *
     * **Auto-layout strategy**:
     * - Full-width items (no horizontal scroll)
     * - Stacked vertically (reading flow)
     * - Maintains aspect ratio (desktop height)
     * - Mobile-friendly UX
     *
     * ## Grid to Pixel Conversion
     *
     * **Convert layout to pixels**:
     * ```typescript
     * const xPixels = gridToPixelsX(actualLayout.x, item.canvasId);
     * const yPixels = gridToPixelsY(actualLayout.y);
     * const widthPixels = gridToPixelsX(actualLayout.width, item.canvasId);
     * const heightPixels = gridToPixelsY(actualLayout.height);
     * ```
     *
     * **Responsive width**: 2% per unit × container width
     * **Fixed height**: 20px per unit
     * **Canvas-specific**: Width varies by canvas
     *
     * ## Transform-Based Positioning
     *
     * **Style object**:
     * ```typescript
     * const itemStyle = {
     *   transform: `translate(${xPixels}px, ${yPixels}px)`,
     *   width: `${widthPixels}px`,
     *   height: `${heightPixels}px`,
     *   zIndex: this.item.zIndex.toString()
     * };
     * ```
     *
     * **Why transform**:
     * - GPU-accelerated compositing
     * - No layout recalculation
     * - 60fps dragging performance
     * - Sub-pixel accuracy
     *
     * ## Template Structure
     *
     * **Wrapper div** (`.grid-item`):
     * - Positioned with transform
     * - Sized with width/height
     * - Layered with z-index
     * - Contains all child elements
     *
     * **Child elements**:
     * 1. **Drag handle** - For dragging entire item
     * 2. **Item header** - Icon + title display
     * 3. **Item content** - Actual component (renderComponent())
     * 4. **Item controls** - Bring to front, send to back, delete
     * 5. **Resize handles** - 8 points (corners + edges)
     *
     * ## Selection State
     *
     * **Dynamic classes**:
     * ```typescript
     * const itemClasses = {
     *   'grid-item': true,           // Always present
     *   selected: isSelected         // Conditional
     * };
     * ```
     *
     * **CSS effects** (when selected):
     * - Border and shadow visible
     * - Resize handles visible
     * - Z-index controls visible
     * - Drag handle highlighted
     *
     * ## Event Handlers
     *
     * **onClick**: handleClick (selection and config panel)
     * **Bring to front button**: handleBringToFront
     * **Send to back button**: handleSendToBack
     * **Delete button**: handleDelete
     *
     * ## Data Attributes
     *
     * - `id={item.id}` - For DOM queries and drag detection
     * - `data-canvas-id={item.canvasId}` - For cross-canvas drag detection
     * - `data-component-name={item.name}` - For debugging
     *
     * ## Ref Assignment
     *
     * **Item ref**:
     * ```typescript
     * ref={(el) => (this.itemRef = el)}
     * ```
     *
     * **Used for**:
     * - Drag handler initialization
     * - Resize handler initialization
     * - Virtual renderer observation
     * - Event dispatching
     *
     * @returns JSX template for grid item wrapper
     *
     * @example
     * ```tsx
     * // Rendered output for selected header item:
     * <div
     *   class="grid-item selected"
     *   id="item-1"
     *   style={{
     *     transform: "translate(100px, 40px)",
     *     width: "200px",
     *     height: "120px",
     *     zIndex: "1"
     *   }}
     * >
     *   <div class="drag-handle" />
     *   <div class="grid-item-header">📝 Header</div>
     *   <div class="grid-item-content">
     *     <component-header itemId="item-1" />
     *   </div>
     *   <div class="grid-item-controls">
     *     <button>⬆️</button>
     *     <button>⬇️</button>
     *     <button>×</button>
     *   </div>
     *   <div class="resize-handle nw" />
     *   <!-- ... 7 more resize handles ... -->
     * </div>
     * ```
     */
    render() {
        var _a;
        const template = componentTemplates[this.item.type];
        const currentViewport = state.currentViewport;
        const layout = this.item.layouts[currentViewport];
        // For mobile viewport, calculate auto-layout if not customized
        let actualLayout = layout;
        if (currentViewport === 'mobile' && !this.item.layouts.mobile.customized) {
            // Auto-layout for mobile: stack components vertically at full width
            const canvas = state.canvases[this.item.canvasId];
            const itemIndex = (_a = canvas === null || canvas === void 0 ? void 0 : canvas.items.findIndex((i) => i.id === this.item.id)) !== null && _a !== void 0 ? _a : 0;
            // Calculate Y position by summing heights of all previous items
            let yPosition = 0;
            if (canvas && itemIndex > 0) {
                for (let i = 0; i < itemIndex; i++) {
                    const prevItem = canvas.items[i];
                    // Use desktop height or default to 6 units
                    yPosition += prevItem.layouts.desktop.height || 6;
                }
            }
            actualLayout = {
                x: 0,
                y: yPosition,
                width: 50,
                height: this.item.layouts.desktop.height || 6, // Keep desktop height
            };
        }
        // Compute selection directly from gridState (not cached state)
        const isSelected = state.selectedItemId === this.item.id;
        const itemClasses = {
            'grid-item': true,
            selected: isSelected,
        };
        // Convert grid units to pixels
        const xPixels = gridToPixelsX(actualLayout.x, this.item.canvasId);
        const yPixels = gridToPixelsY(actualLayout.y);
        const widthPixels = gridToPixelsX(actualLayout.width, this.item.canvasId);
        const heightPixels = gridToPixelsY(actualLayout.height);
        const itemStyle = {
            transform: `translate(${xPixels}px, ${yPixels}px)`,
            width: `${widthPixels}px`,
            height: `${heightPixels}px`,
            zIndex: this.item.zIndex.toString(),
        };
        return (h("div", { class: itemClasses, id: this.item.id, "data-canvas-id": this.item.canvasId, "data-component-name": this.item.name || template.title, style: itemStyle, onClick: (e) => this.handleClick(e), ref: (el) => (this.itemRef = el) }, h("div", { class: "drag-handle" }), h("div", { class: "grid-item-header" }, template.icon, " ", this.item.name || template.title), h("div", { class: "grid-item-content", id: `${this.item.id}-content` }, this.renderComponent()), h("div", { class: "grid-item-controls" }, h("button", { class: "grid-item-control-btn", onClick: () => this.handleBringToFront(), title: "Bring to Front" }, "\u2B06\uFE0F"), h("button", { class: "grid-item-control-btn", onClick: () => this.handleSendToBack(), title: "Send to Back" }, "\u2B07\uFE0F"), h("button", { class: "grid-item-delete", onClick: () => this.handleDelete() }, "\u00D7")), h("div", { class: "resize-handle nw" }), h("div", { class: "resize-handle ne" }), h("div", { class: "resize-handle sw" }), h("div", { class: "resize-handle se" }), h("div", { class: "resize-handle n" }), h("div", { class: "resize-handle s" }), h("div", { class: "resize-handle e" }), h("div", { class: "resize-handle w" })));
    }
};
GridItemWrapper.style = gridItemWrapperCss;

export { GridItemWrapper as grid_item_wrapper };

//# sourceMappingURL=grid-item-wrapper.entry.js.map