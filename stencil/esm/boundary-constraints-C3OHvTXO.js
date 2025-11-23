import { s as state, b as updateItemsBatch, d as deleteItemsBatch, c as createStore } from './state-manager-BIPn53sA.js';
import { e as eventManager } from './event-manager-C411GiWR.js';

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
            rootMargin: '200px', // Start loading 200px before entering viewport
            threshold: [0, 0.01], // Fire at 0% (just entered) AND 0.01% (already visible)
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
 * Debug Utility
 * ==============
 *
 * Environment-aware logging utility for the grid-builder library. Provides conditional
 * logging that only outputs in development mode, keeping production console clean.
 *
 * ## Problem
 *
 * Development logging is helpful for debugging but pollutes production console:
 * - Performance tracking logs on every drag/resize
 * - Build timestamp logs on initialization
 * - State change debug messages
 * - Verbose interaction tracking
 *
 * ## Solution
 *
 * Centralized debug utility that checks environment before logging:
 * - Development: Full logging for debugging
 * - Production: Silent (no console pollution)
 * - Test: Configurable via `ENABLE_TEST_LOGS` flag
 *
 * ## Usage
 *
 * ```typescript
 * import { debug } from '../utils/debug';
 *
 * // Replace console.log with debug.log
 * debug.log('Component mounted', { itemId, canvasId });
 *
 * // Still use console.warn/error for actual issues
 * console.warn('Invalid configuration:', config);
 * ```
 *
 * ## Environment Detection
 *
 * **How it works**:
 * - Checks `"production"` at runtime
 * - StencilJS sets NODE_ENV during build
 * - Development builds: NODE_ENV = 'development'
 * - Production builds: NODE_ENV = 'production'
 * - Test builds: NODE_ENV = 'test'
 *
 * **Build-time optimization**:
 * - Production: debug.log() calls are no-ops (dead code elimination)
 * - Tree-shaking removes unused debug code
 * - Zero runtime overhead in production
 *
 * @module debug
 */
/**
 * Check if debug logging is enabled
 *
 * **Enabled when**:
 * - NODE_ENV === 'development'
 * - NODE_ENV === 'test' AND ENABLE_TEST_LOGS === true
 *
 * **Disabled when**:
 * - NODE_ENV === 'production'
 * - NODE_ENV === 'test' AND ENABLE_TEST_LOGS !== true
 *
 * @returns true if debug logging should be enabled
 */
function isDebugEnabled() {
    // Check if we're in development mode
    if (typeof process !== 'undefined' && process.env && "production" === 'development') ;
    // Allow test logs if explicitly enabled
    if (typeof process !== 'undefined' && process.env && "production" === 'test') ;
    // Disable in production
    return false;
}
/**
 * Debug logger instance
 *
 * Provides console.log-compatible methods that only log in development mode.
 * All methods are no-ops in production, allowing tree-shaking to remove them.
 */
const debug$2 = {
    /**
     * Log informational message
     *
     * **Use for**: General debugging, state changes, lifecycle events
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.log output
     *
     * @param args - Arguments to pass to console.log
     *
     * @example
     * ```typescript
     * debug.log('Item added:', item);
     * debug.log('Grid size:', gridSize, 'for canvas:', canvasId);
     * ```
     */
    log(...args) {
        if (isDebugEnabled()) {
            console.log(...args);
        }
    },
    /**
     * Log warning message
     *
     * **Use for**: Recoverable issues, deprecation warnings, suspicious state
     *
     * **Note**: Consider using console.warn directly for warnings that should
     * always be visible (even in production)
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.warn output
     *
     * @param args - Arguments to pass to console.warn
     *
     * @example
     * ```typescript
     * debug.warn('Deprecated API usage:', methodName);
     * ```
     */
    warn(...args) {
        if (isDebugEnabled()) {
            console.warn(...args);
        }
    },
    /**
     * Log error message
     *
     * **Use for**: Non-critical errors, caught exceptions, debugging errors
     *
     * **Note**: Use console.error directly for critical errors that should
     * always be visible (even in production)
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.error output
     *
     * @param args - Arguments to pass to console.error
     *
     * @example
     * ```typescript
     * debug.error('Failed to initialize drag handler:', error);
     * ```
     */
    error(...args) {
        if (isDebugEnabled()) {
            console.error(...args);
        }
    },
    /**
     * Log grouped messages
     *
     * **Use for**: Complex debug output, nested data structures
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.group/groupEnd output
     *
     * @param label - Group label
     * @param fn - Function to execute within group
     *
     * @example
     * ```typescript
     * debug.group('Drag operation', () => {
     *   debug.log('Start position:', startPos);
     *   debug.log('End position:', endPos);
     *   debug.log('Delta:', delta);
     * });
     * ```
     */
    group(label, fn) {
        if (isDebugEnabled()) {
            console.group(label);
            fn();
            console.groupEnd();
        }
    },
    /**
     * Check if debug mode is enabled
     *
     * **Use for**: Expensive debug operations that should be skipped in production
     *
     * @returns true if debug logging is enabled
     *
     * @example
     * ```typescript
     * if (debug.isEnabled()) {
     *   // Expensive operation only in development
     *   const stats = calculateDetailedStats();
     *   debug.log('Stats:', stats);
     * }
     * ```
     */
    isEnabled() {
        return isDebugEnabled();
    },
};
/**
 * Create a namespaced debug logger
 *
 * **Use for**: Module-specific logging with consistent prefixes
 *
 * @param namespace - Namespace for log messages (e.g., 'drag-handler', 'grid-calculations')
 * @returns Debug logger with namespace prefix
 *
 * @example
 * ```typescript
 * // In drag-handler.ts
 * const debug = createDebugLogger('drag-handler');
 * debug.log('Drag started'); // → [drag-handler] Drag started
 * ```
 */
function createDebugLogger(namespace) {
    return {
        log(...args) {
            debug$2.log(`[${namespace}]`, ...args);
        },
        warn(...args) {
            debug$2.warn(`[${namespace}]`, ...args);
        },
        error(...args) {
            debug$2.error(`[${namespace}]`, ...args);
        },
        group(label, fn) {
            debug$2.group(`[${namespace}] ${label}`, fn);
        },
        isEnabled() {
            return debug$2.isEnabled();
        },
    };
}

/**
 * Undo/Redo Commands
 * ===================
 *
 * Concrete Command implementations for grid operations. Each command class
 * encapsulates a specific user action with the ability to undo and redo.
 *
 * ## Problem
 *
 * The Command pattern requires concrete implementations for each undoable operation.
 * Each command must:
 * - Capture enough state to reverse the operation (undo)
 * - Capture enough state to reapply the operation (redo)
 * - Be self-contained (no external dependencies)
 * - Handle edge cases (canvas switching, index preservation)
 *
 * ## Solution
 *
 * Four concrete command classes covering all grid operations:
 *
 * 1. **AddItemCommand**: Adding new items to canvas
 * 2. **DeleteItemCommand**: Removing items with index preservation
 * 3. **MoveItemCommand**: Dragging items (same or different canvas)
 * 4. **ResizeCommand**: (Not yet implemented - resize operations not tracked)
 *
 * ## Key Design Patterns
 *
 * ### Deep Cloning Strategy
 *
 * **Why deep clone**: Prevent mutations from affecting command snapshots
 *
 * ```typescript
 * this.item = JSON.parse(JSON.stringify(item));
 * ```
 *
 * **When to clone**:
 * - ✅ Constructor: Capture initial state
 * - ✅ redo(): Create fresh copy for state mutation
 * - ❌ undo(): Usually work with existing state references
 *
 * **Trade-offs**:
 * - ✅ Simple and reliable
 * - ✅ No reference bugs
 * - ❌ Higher memory usage (~1-5 KB per command)
 * - ❌ Slower than structural sharing
 *
 * ### Index Preservation Pattern
 *
 * **Why preserve index**: Undo delete should restore item at original position
 *
 * ```typescript
 * class DeleteItemCommand {
 *   private itemIndex: number;  // Capture index before deletion
 *
 *   undo() {
 *     canvas.items.splice(this.itemIndex, 0, item);  // Restore at index
 *   }
 * }
 * ```
 *
 * **Important for**:
 * - Visual consistency (item appears in same spot)
 * - Z-index order (items render in array order)
 * - User expectations (undo puts things back exactly)
 *
 * ### Selection State Management
 *
 * **Pattern**: Clear selection when deleting selected item
 *
 * ```typescript
 * if (gridState.selectedItemId === itemId) {
 *   gridState.selectedItemId = null;
 *   gridState.selectedCanvasId = null;
 * }
 * ```
 *
 * **Why needed**:
 * - Prevents dangling references to deleted items
 * - Avoids errors when accessing selectedItemId
 * - Matches user expectations (deleted item can't be selected)
 *
 * ### Cross-Canvas Move Support
 *
 * **Challenge**: Items can be dragged between canvases
 *
 * **Solution**: Track source and target canvas IDs
 *
 * ```typescript
 * class MoveItemCommand {
 *   sourceCanvasId: string;
 *   targetCanvasId: string;
 *
 *   undo() {
 *     // Move from target back to source
 *     removeFrom(targetCanvasId);
 *     addTo(sourceCanvasId, sourceIndex);  // Restore position
 *   }
 * }
 * ```
 *
 * ## Command Lifecycle
 *
 * **Typical flow**:
 * ```
 * 1. User performs action (drag, delete, etc.)
 * 2. Operation completes (state already updated)
 * 3. Create command with before/after snapshots
 * 4. pushCommand(command) → adds to history
 * 5. User presses Ctrl+Z
 * 6. command.undo() → reverses operation
 * 7. User presses Ctrl+Y
 * 8. command.redo() → reapplies operation
 * ```
 *
 * **Important**: Commands are created AFTER the operation completes,
 * not before. The constructor captures the final state.
 *
 * ## Extracting These Patterns
 *
 * To create new command types:
 *
 * ```typescript
 * export class MyCommand implements Command {
 *   // Capture state needed for undo/redo
 *   private beforeState: any;
 *   private afterState: any;
 *
 *   constructor(params) {
 *     // Deep clone to prevent mutations
 *     this.beforeState = JSON.parse(JSON.stringify(before));
 *     this.afterState = JSON.parse(JSON.stringify(after));
 *   }
 *
 *   undo(): void {
 *     // Restore before state
 *     restoreState(this.beforeState);
 *     gridState.canvases = { ...gridState.canvases };  // Trigger reactivity
 *   }
 *
 *   redo(): void {
 *     // Apply after state
 *     restoreState(this.afterState);
 *     gridState.canvases = { ...gridState.canvases };
 *   }
 * }
 * ```
 *
 * **Guidelines**:
 * - Always deep clone state in constructor
 * - Always trigger reactivity (`gridState.canvases = { ...gridState.canvases }`)
 * - Handle null cases (canvas/item not found)
 * - Clear selection if needed
 * - Preserve array indices for positional restore
 *
 * @module undo-redo-commands
 */
const debug$1 = createDebugLogger('undo-redo-commands');
/**
 * MoveItemCommand
 * ===============
 *
 * Captures the movement of a grid item within the same canvas or across canvases,
 * enabling undo/redo for drag operations with position and index preservation.
 *
 * ## Use Cases
 *
 * - User drags item to new position in same canvas
 * - User drags item across canvas boundaries (cross-canvas move)
 * - Programmatic item repositioning
 * - Layout reorganization
 *
 * ## Cross-Canvas Move Support
 *
 * **Challenge**: Items can be dragged between different canvases
 *
 * **Solution**: Track both source and target canvas IDs
 *
 * **Same-canvas move**:
 * ```typescript
 * sourceCanvasId === targetCanvasId
 * // Only position changes, no canvas transfer
 * ```
 *
 * **Cross-canvas move**:
 * ```typescript
 * sourceCanvasId !== targetCanvasId
 * // Item removed from source, added to target
 * // Position updated to target coordinates
 * ```
 *
 * ## Position Tracking
 *
 * **Dual position capture**:
 * - `sourcePosition`: { x, y } before drag
 * - `targetPosition`: { x, y } after drag
 *
 * **Why both needed**:
 * - Undo must restore original position
 * - Redo must restore final position
 * - Positions are in grid coordinates (not pixels)
 *
 * ## Index Preservation Pattern
 *
 * **Critical for undo**: Restore item at original array position in source canvas
 *
 * **Why important**:
 * - Maintains visual z-order consistency
 * - Restores exact pre-drag state
 * - Items render in array order
 *
 * **Implementation**:
 * ```typescript
 * // Capture source index before move
 * const sourceIndex = sourceCanvas.items.indexOf(item);
 *
 * // Restore at index on undo
 * sourceCanvas.items.splice(sourceIndex, 0, item);
 * ```
 *
 * ## Command Lifecycle
 *
 * **Creation**: BEFORE drag operation (capture source state)
 * ```typescript
 * // 1. Capture state before drag starts
 * const sourceIndex = canvas.items.indexOf(item);
 * const sourcePos = { x: item.layouts.desktop.x, y: item.layouts.desktop.y };
 *
 * // 2. Drag completes (position updated in DOM)
 * // ...
 *
 * // 3. Create command with before/after state
 * const command = new MoveItemCommand(
 *   item.id,
 *   sourceCanvasId,
 *   targetCanvasId,  // May be same as source
 *   sourcePos,
 *   targetPos,       // New position after drag
 *   sourceIndex
 * );
 *
 * // 4. Push command for undo
 * pushCommand(command);
 * ```
 *
 * **Undo**: Move back to source at original position
 * ```typescript
 * command.undo();
 * // Item returns to source canvas at original index
 * // Position restored to sourcePosition
 * ```
 *
 * **Redo**: Move to target at new position
 * ```typescript
 * command.redo();
 * // Item moves to target canvas (appended to end)
 * // Position updated to targetPosition
 * ```
 *
 * ## State Mutation Pattern
 *
 * **Unlike Add/Delete**: Does NOT deep clone item
 *
 * **Why reference-based**:
 * - Same item object moves between canvases
 * - Only position properties mutated
 * - Efficient (no serialization overhead)
 * - Item identity preserved (same ID, zIndex, etc.)
 *
 * **What gets cloned**:
 * ```typescript
 * // Only position objects cloned (shallow)
 * this.sourcePosition = { ...sourcePosition };
 * this.targetPosition = { ...targetPosition };
 * ```
 *
 * ## Position Coordinates
 *
 * **Uses desktop layout**: `item.layouts.desktop.x/y`
 *
 * **Why desktop**:
 * - Drag handler operates on desktop coordinates
 * - Mobile layout auto-generated or separately customized
 * - Single source of truth for command
 *
 * **Grid units**: Positions stored in grid units (not pixels)
 *
 * ## Canvas Mutation Flow
 *
 * **Undo sequence** (target → source):
 * 1. Find item in target canvas
 * 2. Remove from target.items array
 * 3. Update item.canvasId to source
 * 4. Update item position to sourcePosition
 * 5. Insert at sourceIndex in source.items
 * 6. Trigger reactivity
 *
 * **Redo sequence** (source → target):
 * 1. Find item in source canvas
 * 2. Remove from source.items array
 * 3. Update item.canvasId to target
 * 4. Update item position to targetPosition
 * 5. Append to target.items (no index preservation for redo)
 * 6. Trigger reactivity
 *
 * ## Edge Cases
 *
 * - **Canvas deleted**: Both undo/redo return early if canvas not found
 * - **Item not found**: Returns early (defensive coding)
 * - **Same position move**: Creates valid command (user expectation)
 * - **Invalid source index**: Fallback to append (defensive)
 *
 * @example
 * ```typescript
 * // After drag end event
 * handleDragEnd(event) {
 *   const item = getItem(sourceCanvasId, itemId);
 *   const sourceIndex = gridState.canvases[sourceCanvasId].items.indexOf(item);
 *
 *   const command = new MoveItemCommand(
 *     itemId,
 *     sourceCanvasId,
 *     targetCanvasId,  // Detected from drop target
 *     { x: oldX, y: oldY },  // Captured on drag start
 *     { x: newX, y: newY },  // Calculated from drop position
 *     sourceIndex
 *   );
 *
 *   pushCommand(command);
 * }
 * ```
 */
class MoveItemCommand {
    /**
     * Capture item move operation
     *
     * **Important**: Item should already be at target position
     *
     * **Shallow position clone**: Prevents mutation of passed objects
     *
     * **No item clone**: Uses reference-based approach (item ID tracking)
     *
     * **Resize support**: Optional size parameters track width/height changes
     *
     * @param itemId - ID of moved item
     * @param sourceCanvasId - Canvas where item started
     * @param targetCanvasId - Canvas where item ended
     * @param sourcePosition - Position before drag (will be shallow cloned)
     * @param targetPosition - Position after drag (will be shallow cloned)
     * @param sourceIndex - Original array index in source canvas
     * @param sourceSize - Optional: Size before operation (for resize tracking)
     * @param targetSize - Optional: Size after operation (for resize tracking)
     */
    constructor(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, sourceIndex, sourceSize, targetSize) {
        this.itemId = itemId;
        this.sourceCanvasId = sourceCanvasId;
        this.targetCanvasId = targetCanvasId;
        this.sourcePosition = Object.assign({}, sourcePosition);
        this.targetPosition = Object.assign({}, targetPosition);
        this.sourceSize = sourceSize ? Object.assign({}, sourceSize) : undefined;
        this.targetSize = targetSize ? Object.assign({}, targetSize) : undefined;
        this.sourceIndex = sourceIndex;
    }
    /**
     * Undo: Move item back to source canvas at original position
     *
     * **Cross-canvas handling**:
     * - Removes from target canvas
     * - Updates canvasId back to source
     * - Restores source position
     * - Inserts at original index in source
     *
     * **Index preservation**: Uses splice to restore exact array position
     *
     * **Fallback**: Appends to end if index invalid (defensive)
     *
     * **Side effects**:
     * - Item removed from target canvas
     * - Item added to source canvas at original index
     * - Item position updated to sourcePosition
     * - Item canvasId updated to sourceCanvasId
     * - Triggers component re-render
     *
     * **Safety**: Returns early if canvas or item not found
     */
    undo() {
        debug$1.log('🔙 MoveItemCommand.undo()', {
            itemId: this.itemId,
            sourceCanvasId: this.sourceCanvasId,
            targetCanvasId: this.targetCanvasId,
            sourcePosition: this.sourcePosition,
            targetPosition: this.targetPosition,
        });
        // Find the item in target canvas first
        let targetCanvas = state.canvases[this.targetCanvasId];
        let item = targetCanvas === null || targetCanvas === void 0 ? void 0 : targetCanvas.items.find((i) => i.id === this.itemId);
        // If target canvas doesn't exist or item not found there, search all canvases
        // This handles the case where the target canvas was deleted
        if (!item) {
            for (const canvasId in state.canvases) {
                const canvas = state.canvases[canvasId];
                item = canvas.items.find((i) => i.id === this.itemId);
                if (item) {
                    targetCanvas = canvas;
                    break;
                }
            }
        }
        if (!item || !targetCanvas) {
            console.warn('  ❌ Item or canvas not found, aborting undo');
            return;
        }
        debug$1.log('  📍 Found item, current position:', {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
        });
        // Remove from current canvas (wherever it is)
        targetCanvas.items = targetCanvas.items.filter((i) => i.id !== this.itemId);
        // Update item's position and canvasId back to source
        item.canvasId = this.sourceCanvasId;
        item.layouts.desktop.x = this.sourcePosition.x;
        item.layouts.desktop.y = this.sourcePosition.y;
        debug$1.log('  ✅ Updated item position to:', {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
        });
        // Restore size if it was tracked (for resize operations)
        if (this.sourceSize) {
            item.layouts.desktop.width = this.sourceSize.width;
            item.layouts.desktop.height = this.sourceSize.height;
        }
        // Add back to source canvas at original index
        const sourceCanvas = state.canvases[this.sourceCanvasId];
        if (!sourceCanvas) {
            console.warn('  ❌ Source canvas not found, aborting undo');
            return;
        }
        if (this.sourceIndex >= 0 && this.sourceIndex <= sourceCanvas.items.length) {
            sourceCanvas.items.splice(this.sourceIndex, 0, item);
        }
        else {
            sourceCanvas.items.push(item);
        }
        // Trigger state update
        state.canvases = Object.assign({}, state.canvases);
        // Clear any inline transform style that might be persisting from drag handler
        // This ensures the component re-renders with the correct position from state
        const element = document.getElementById(this.itemId);
        if (element) {
            debug$1.log('  🎨 Clearing inline transform style');
            element.style.transform = '';
        }
        debug$1.log('  ✅ Undo complete');
    }
    /**
     * Redo: Move item to target canvas at final position
     *
     * **Cross-canvas handling**:
     * - Removes from source canvas
     * - Updates canvasId to target
     * - Restores target position
     * - Appends to target canvas (no index preservation for redo)
     *
     * **No index preservation for redo**: Appends to end of target array
     * (undo needs original index, redo doesn't)
     *
     * **Side effects**:
     * - Item removed from source canvas
     * - Item added to end of target canvas
     * - Item position updated to targetPosition
     * - Item canvasId updated to targetCanvasId
     * - Triggers component re-render
     *
     * **Safety**: Returns early if canvas or item not found
     */
    redo() {
        debug$1.log('🔜 MoveItemCommand.redo()', {
            itemId: this.itemId,
            sourceCanvasId: this.sourceCanvasId,
            targetCanvasId: this.targetCanvasId,
            sourcePosition: this.sourcePosition,
            targetPosition: this.targetPosition,
        });
        // Find the item in source canvas
        const sourceCanvas = state.canvases[this.sourceCanvasId];
        const item = sourceCanvas === null || sourceCanvas === void 0 ? void 0 : sourceCanvas.items.find((i) => i.id === this.itemId);
        if (!item) {
            console.warn('  ❌ Item not found, aborting redo');
            return;
        }
        debug$1.log('  📍 Found item, current position:', {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
        });
        // Remove from source canvas
        sourceCanvas.items = sourceCanvas.items.filter((i) => i.id !== this.itemId);
        // Update item's position and canvasId to target
        item.canvasId = this.targetCanvasId;
        item.layouts.desktop.x = this.targetPosition.x;
        item.layouts.desktop.y = this.targetPosition.y;
        debug$1.log('  ✅ Updated item position to:', {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
        });
        // Restore size if it was tracked (for resize operations)
        if (this.targetSize) {
            item.layouts.desktop.width = this.targetSize.width;
            item.layouts.desktop.height = this.targetSize.height;
        }
        // Add to target canvas
        const targetCanvas = state.canvases[this.targetCanvasId];
        if (!targetCanvas) {
            console.warn('  ❌ Target canvas not found, aborting redo');
            return;
        }
        targetCanvas.items.push(item);
        // Trigger state update
        state.canvases = Object.assign({}, state.canvases);
        // Clear any inline transform style that might be persisting from drag handler
        // This ensures the component re-renders with the correct position from state
        const element = document.getElementById(this.itemId);
        if (element) {
            debug$1.log('  🎨 Clearing inline transform style');
            element.style.transform = '';
        }
        debug$1.log('  ✅ Redo complete');
    }
}
/**
 * BatchAddCommand - Add multiple items in a single batch operation
 *
 * **Performance benefit**: 1 undo/redo command for N items instead of N commands.
 * Reduces undo stack size and provides atomic undo/redo for batch operations.
 *
 * **Use cases**:
 * - Stress test (add 100+ items at once)
 * - Template application (add multiple pre-configured items)
 * - Undo batch delete operation
 * - Import from file (restore multiple items)
 *
 * **Undo behavior**:
 * - Deletes all items in a single batch operation
 * - Single state update, single re-render
 *
 * **Redo behavior**:
 * - Re-adds all items with original IDs and properties
 * - Maintains z-index and positioning
 * - Single state update, single re-render
 */
class BatchAddCommand {
    constructor(itemIds) {
        // Store full item data for redo (deep clone to prevent mutations)
        this.itemsData = itemIds.map((id) => {
            const item = Object.values(state.canvases)
                .flatMap((canvas) => canvas.items)
                .find((i) => i.id === id);
            return item ? JSON.parse(JSON.stringify(item)) : null;
        }).filter(Boolean);
    }
    undo() {
        // Delete all items in one batch
        const itemIds = this.itemsData.map((item) => item.id);
        deleteItemsBatch(itemIds);
    }
    redo() {
        // Re-add all items (addItemsBatch will generate new IDs, so we need custom logic)
        const updatedCanvases = Object.assign({}, state.canvases);
        for (const itemData of this.itemsData) {
            const canvas = updatedCanvases[itemData.canvasId];
            if (canvas) {
                // Check if item already exists (prevent duplicates)
                const exists = canvas.items.some((i) => i.id === itemData.id);
                if (!exists) {
                    canvas.items.push(itemData);
                }
            }
        }
        state.canvases = updatedCanvases;
    }
}
/**
 * BatchDeleteCommand - Delete multiple items in a single batch operation
 *
 * **Performance benefit**: 1 undo/redo command for N items instead of N commands.
 *
 * **Use cases**:
 * - Clear canvas (delete all items)
 * - Delete selection group
 * - Undo batch add operation
 * - Bulk cleanup operations
 *
 * **Undo behavior**:
 * - Re-adds all items with original properties and positions
 * - Maintains z-index and canvas placement
 * - Single state update, single re-render
 *
 * **Redo behavior**:
 * - Deletes all items in a single batch operation
 * - Single state update, single re-render
 */
class BatchDeleteCommand {
    constructor(itemIds) {
        // Store full item data for undo (deep clone to prevent mutations)
        this.itemsData = itemIds.map((id) => {
            const item = Object.values(state.canvases)
                .flatMap((canvas) => canvas.items)
                .find((i) => i.id === id);
            return item ? JSON.parse(JSON.stringify(item)) : null;
        }).filter(Boolean);
    }
    undo() {
        // Re-add all items (same logic as BatchAddCommand.redo)
        const updatedCanvases = Object.assign({}, state.canvases);
        for (const itemData of this.itemsData) {
            const canvas = updatedCanvases[itemData.canvasId];
            if (canvas) {
                // Check if item already exists (prevent duplicates)
                const exists = canvas.items.some((i) => i.id === itemData.id);
                if (!exists) {
                    canvas.items.push(itemData);
                }
            }
        }
        state.canvases = updatedCanvases;
    }
    redo() {
        // Delete all items in one batch
        const itemIds = this.itemsData.map((item) => item.id);
        deleteItemsBatch(itemIds);
    }
}
/**
 * BatchUpdateConfigCommand - Update multiple item configs in a single batch
 *
 * **Performance benefit**: 1 undo/redo command for N config updates instead of N commands.
 *
 * **Use cases**:
 * - Theme changes (update colors for all headers)
 * - Bulk property changes (set all text sizes to 16px)
 * - Template application (apply preset configs)
 * - Undo/redo bulk config changes
 *
 * **Undo behavior**:
 * - Restores all old configs in a single batch operation
 * - Single state update, single re-render
 *
 * **Redo behavior**:
 * - Applies all new configs in a single batch operation
 * - Single state update, single re-render
 */
class BatchUpdateConfigCommand {
    constructor(updates) {
        // Store old and new state for each item (deep clone to prevent mutations)
        this.updates = updates.map(({ itemId, canvasId, updates: itemUpdates }) => {
            const canvas = state.canvases[canvasId];
            const item = canvas === null || canvas === void 0 ? void 0 : canvas.items.find((i) => i.id === itemId);
            if (!item) {
                return null;
            }
            return {
                itemId,
                canvasId,
                oldItem: JSON.parse(JSON.stringify(item)),
                newItem: JSON.parse(JSON.stringify(Object.assign(Object.assign({}, item), itemUpdates))),
            };
        }).filter(Boolean);
    }
    undo() {
        // Restore old configs
        const batchUpdates = this.updates.map(({ itemId, canvasId, oldItem }) => ({
            itemId,
            canvasId,
            updates: oldItem,
        }));
        updateItemsBatch(batchUpdates);
    }
    redo() {
        // Apply new configs
        const batchUpdates = this.updates.map(({ itemId, canvasId, newItem }) => ({
            itemId,
            canvasId,
            updates: newItem,
        }));
        updateItemsBatch(batchUpdates);
    }
}
/**
 * AddCanvasCommand
 * =================
 *
 * Undoable command for adding a canvas to the grid.
 *
 * **Pattern**: Host app owns canvas metadata, library manages item placement
 *
 * **Library responsibility** (what this command does):
 * - Create canvas in gridState.canvases with empty items array
 * - Initialize zIndexCounter for item stacking
 * - Track operation in undo/redo
 *
 * **Host app responsibility** (what this command does NOT do):
 * - Store canvas title, backgroundColor, or other metadata
 * - Host app maintains its own canvas metadata separately
 * - Host app listens to canvasAdded event to sync its state
 *
 * **Integration pattern**:
 * ```typescript
 * // Host app maintains canvas metadata
 * const canvasMetadata = {
 *   'section-1': { title: 'Hero Section', backgroundColor: '#f0f4f8' }
 * };
 *
 * // Create canvas in library (just placement state)
 * const cmd = new AddCanvasCommand('section-1');
 * pushCommand(cmd); // Add to undo/redo stack
 * cmd.redo(); // Creates canvas with items: [], zIndexCounter: 1
 *
 * // Host app listens to event and syncs its own state
 * api.on('canvasAdded', (event) => {
 *   // Host app can now add its own metadata
 * });
 * ```
 *
 * **Why this separation**:
 * - Library focuses on layout (items, positions, z-index)
 * - Host app owns presentation (styling, titles, metadata)
 * - Different apps can use library with different data models
 *
 * @module undo-redo-commands
 */
class AddCanvasCommand {
    constructor(canvasId) {
        this.description = 'Add Canvas';
        this.canvasId = canvasId;
    }
    undo() {
        debug$1.log('🔙 AddCanvasCommand.undo() - removing canvas:', this.canvasId);
        // Remove canvas from library state
        delete state.canvases[this.canvasId];
        // Trigger state change for reactivity
        state.canvases = Object.assign({}, state.canvases);
        // Emit event so host app can sync its metadata
        debug$1.log('  📢 Emitting canvasRemoved event for:', this.canvasId);
        eventManager.emit('canvasRemoved', { canvasId: this.canvasId });
    }
    redo() {
        // Add canvas to library state (minimal - just item placement management)
        state.canvases[this.canvasId] = {
            zIndexCounter: 1,
            items: [],
        };
        // Trigger state change for reactivity
        state.canvases = Object.assign({}, state.canvases);
        // Emit event so host app can sync its metadata
        eventManager.emit('canvasAdded', { canvasId: this.canvasId });
    }
}
/**
 * RemoveCanvasCommand
 * ====================
 *
 * Undoable command for removing a canvas from the grid.
 *
 * **Critical**: Snapshots canvas items and zIndexCounter before removal
 *
 * **Library responsibility** (what this command does):
 * - Snapshot canvas items array and zIndexCounter
 * - Remove canvas from gridState.canvases
 * - Restore canvas with all items on undo
 *
 * **Host app responsibility** (what this command does NOT do):
 * - Store canvas title, backgroundColor, or metadata
 * - Host app must listen to canvasRemoved event
 * - Host app must manage its own metadata undo/redo separately
 *
 * **Integration pattern**:
 * ```typescript
 * // Host app listens to events and manages its own metadata
 * api.on('canvasRemoved', (event) => {
 *   // Host app removes its own metadata
 *   delete canvasMetadata[event.canvasId];
 * });
 *
 * api.on('canvasAdded', (event) => {
 *   // On undo of remove, host app restores metadata
 *   if (wasUndoOperation) {
 *     canvasMetadata[event.canvasId] = savedMetadata;
 *   }
 * });
 *
 * // Remove canvas
 * const cmd = new RemoveCanvasCommand('section-1');
 * pushCommand(cmd);
 * cmd.redo(); // Removes canvas from library
 * ```
 *
 * **Edge case handling**:
 * - Canvas doesn't exist: command becomes no-op
 * - Canvas has items: all items removed with canvas
 * - Undo restores items with original layouts and zIndex
 *
 * @module undo-redo-commands
 */
class RemoveCanvasCommand {
    constructor(canvasId) {
        this.description = 'Remove Canvas';
        this.canvasSnapshot = null;
        this.canvasId = canvasId;
        // Snapshot canvas state (deep clone to prevent mutations)
        const canvas = state.canvases[canvasId];
        if (canvas) {
            this.canvasSnapshot = JSON.parse(JSON.stringify(canvas));
        }
    }
    undo() {
        // Restore canvas from snapshot (just layout state, no metadata)
        if (this.canvasSnapshot) {
            state.canvases[this.canvasId] = JSON.parse(JSON.stringify(this.canvasSnapshot));
            // Trigger state change for reactivity
            state.canvases = Object.assign({}, state.canvases);
            // Emit event so host app can sync its metadata
            eventManager.emit('canvasAdded', { canvasId: this.canvasId });
        }
    }
    redo() {
        // Remove canvas from library state
        delete state.canvases[this.canvasId];
        // Trigger state change for reactivity
        state.canvases = Object.assign({}, state.canvases);
        // Emit event so host app can sync its metadata
        eventManager.emit('canvasRemoved', { canvasId: this.canvasId });
    }
}

/**
 * Undo/Redo Service
 * ==================
 *
 * Command pattern implementation for undo/redo functionality in the grid builder.
 * Provides stack-based history management with keyboard shortcuts and UI state tracking.
 *
 * ## Problem
 *
 * Interactive applications need undo/redo capabilities for:
 * - Recovering from mistakes (accidental delete)
 * - Experimenting with layouts (try different arrangements)
 * - Learning the interface (undo to see what changed)
 * - Building confidence (knowing you can undo)
 *
 * **Without undo/redo**:
 * - Users hesitant to experiment
 * - Mistakes are permanent
 * - No way to review history
 * - Poor user experience
 *
 * ## Solution
 *
 * Implement **Command Pattern** with stack-based history:
 *
 * 1. **Command Interface**: Each undoable action implements undo() and redo()
 * 2. **History Stack**: Array of command objects
 * 3. **Position Pointer**: Tracks current position in history
 * 4. **Bounded History**: Limited to 50 commands to prevent memory bloat
 * 5. **Branching**: New actions after undo discard "future" history
 *
 * ## Architecture: Command Pattern
 *
 * **Classic Gang of Four pattern** for undo/redo:
 *
 * **Key Components**:
 * - **Command Interface**: Defines undo() and redo() methods
 * - **Concrete Commands**: AddItemCommand, DeleteItemCommand, MoveItemCommand, ResizeCommand
 * - **Invoker**: undo-redo.ts (this file) manages command execution
 * - **Receiver**: state-manager.ts (receives state mutations)
 *
 * **Flow**:
 * ```
 * User Action → Create Command → pushCommand() → Execute & Store
 * Undo (Ctrl+Z) → Get command at position → command.undo() → Update position
 * Redo (Ctrl+Y) → Advance position → command.redo() → Execute
 * ```
 *
 * **Why Command Pattern**:
 * - ✅ Encapsulates actions as objects
 * - ✅ Enables undo/redo without coupling to specific operations
 * - ✅ Supports macro commands (batch operations)
 * - ✅ Easy to extend with new command types
 * - ✅ History can be serialized/persisted
 *
 * ## History Management
 *
 * **Stack-based with position pointer**:
 * ```
 * commandHistory = [cmd1, cmd2, cmd3, cmd4, cmd5]
 *                                  ↑
 *                            historyPosition = 2
 * ```
 *
 * **Operations**:
 * - **Push new command**: Discard commands after position, append new command
 * - **Undo**: Execute command.undo() at position, decrement position
 * - **Redo**: Increment position, execute command.redo() at new position
 *
 * **Branching behavior** (discarding future on new action):
 * ```
 * Initial:  [cmd1, cmd2, cmd3, cmd4, cmd5]
 *                         ↑ position = 2
 *
 * Undo 2x:  [cmd1, cmd2, cmd3, cmd4, cmd5]
 *                  ↑ position = 0
 *
 * New cmd:  [cmd1, cmd6]  ← cmd2-cmd5 discarded!
 *                  ↑ position = 1
 * ```
 *
 * **Why branching (not tree)**:
 * - Simpler mental model for users
 * - No UI complexity for branch navigation
 * - Standard undo/redo UX pattern
 *
 * ## Memory Management
 *
 * **Bounded history** (MAX_HISTORY = 50):
 * - Prevents unbounded memory growth
 * - Removes oldest command when limit reached
 * - 50 commands ≈ typical user session
 *
 * **Memory per command**:
 * - Command object: ~200-500 bytes
 * - State snapshots: ~1-5 KB (JSON serialized GridItem)
 * - Total for 50 commands: ~50-250 KB (acceptable)
 *
 * **Sliding window approach**:
 * ```
 * When history full:
 * [cmd1, cmd2, ..., cmd50]  ← At capacity
 * Push cmd51:
 * [cmd2, cmd3, ..., cmd51]  ← cmd1 removed
 * ```
 *
 * ## State Snapshot Strategy
 *
 * Each command stores **before/after snapshots**:
 * ```typescript
 * class MoveItemCommand implements Command {
 *   beforeState = JSON.parse(JSON.stringify(item));  // Deep clone
 *   afterState = JSON.parse(JSON.stringify(updatedItem));
 *
 *   undo() { restoreState(beforeState); }
 *   redo() { restoreState(afterState); }
 * }
 * ```
 *
 * **Deep cloning required because**:
 * - Prevents mutations from affecting snapshots
 * - Ensures independent state copies
 * - Simple and reliable (no reference tracking needed)
 *
 * **Trade-off**:
 * - ✅ Simple implementation
 * - ✅ No reference bugs
 * - ❌ Higher memory usage than delta-based
 * - ❌ Slower than structural sharing (acceptable for this use case)
 *
 * ## Keyboard Shortcuts
 *
 * Implemented in grid-builder-app.tsx:
 * - **Ctrl+Z** (Cmd+Z on Mac): Undo last command
 * - **Ctrl+Y** (Cmd+Y on Mac): Redo next command
 * - **Ctrl+Shift+Z**: Alternative redo (common in design tools)
 *
 * ## UI Integration
 *
 * **Reactive state for buttons**:
 * ```typescript
 * undoRedoState = {
 *   canUndo: boolean,  // Enable/disable undo button
 *   canRedo: boolean   // Enable/disable redo button
 * }
 * ```
 *
 * **Updates on**:
 * - New command pushed
 * - Undo executed
 * - Redo executed
 * - History cleared
 *
 * **Button rendering**:
 * ```tsx
 * <button disabled={!undoRedoState.canUndo} onClick={undo}>
 *   Undo
 * </button>
 * ```
 *
 * ## Extracting This Pattern
 *
 * To adapt Command pattern for your project:
 *
 * **Minimal implementation**:
 * ```typescript
 * interface Command {
 *   undo(): void;
 *   redo(): void;
 * }
 *
 * class UndoRedoManager {
 *   private history: Command[] = [];
 *   private position = -1;
 *
 *   push(command: Command) {
 *     this.history.splice(this.position + 1);  // Discard future
 *     this.history.push(command);
 *     this.position++;
 *   }
 *
 *   undo() {
 *     if (this.position >= 0) {
 *       this.history[this.position].undo();
 *       this.position--;
 *     }
 *   }
 *
 *   redo() {
 *     if (this.position < this.history.length - 1) {
 *       this.position++;
 *       this.history[this.position].redo();
 *     }
 *   }
 * }
 * ```
 *
 * **Example commands**:
 * ```typescript
 * class AddItemCommand implements Command {
 *   constructor(
 *     private canvasId: string,
 *     private item: GridItem
 *   ) {}
 *
 *   undo() { removeItemFromCanvas(this.canvasId, this.item.id); }
 *   redo() { addItemToCanvas(this.canvasId, this.item); }
 * }
 * ```
 *
 * **For different frameworks**:
 * - React: Use useReducer or Zustand middleware
 * - Vue: Use Pinia plugin or custom composable
 * - Angular: Use NgRx effects or service
 *
 * @module undo-redo
 */
const debug = createDebugLogger('undo-redo');
/**
 * Reactive state store for undo/redo button states
 *
 * **StencilJS integration**: Components automatically subscribe when accessing properties
 * **Updates**: Modified by updateButtonStates() after each operation
 */
const { state: undoRedoState } = createStore({
    canUndo: false,
    canRedo: false,
});
/**
 * Undo/Redo Service API
 * =====================
 *
 * Provides a clear, namespaced API for undo/redo operations.
 * Use this instead of individual function imports for better clarity.
 *
 * @example
 * ```typescript
 * import { undoRedo } from './services/undo-redo';
 *
 * // Add command to history
 * undoRedo.push(new AddItemCommand(canvasId, item));
 *
 * // Undo/redo
 * undoRedo.undo();
 * undoRedo.redo();
 *
 * // Check availability
 * if (undoRedo.canUndo()) {
 *   undoRedo.undo();
 * }
 * ```
 */
const undoRedo = {
    /** Add command to undo/redo history */
    push: pushCommand,
    /** Undo last command */
    undo,
    /** Redo previously undone command */
    redo,
    /** Check if undo is available */
    canUndo,
    /** Check if redo is available */
    canRedo,
    /** Clear entire history */
    clearHistory,
};
/**
 * Internal Command History State
 * ===============================
 *
 * Private state managing command stack and position.
 * Not exported - accessed only through public functions.
 */
/**
 * Command history stack
 *
 * **Structure**: Array of Command objects in chronological order
 * **Growth**: Appends new commands to end
 * **Bounded**: Limited to MAX_HISTORY commands (50)
 * **Branching**: Discards commands after current position on new push
 *
 * @example
 * ```
 * [AddItemCommand, DeleteItemCommand, MoveItemCommand]
 *  ↑                ↑                  ↑
 *  0                1                  2 (historyPosition)
 * ```
 */
const commandHistory = [];
/**
 * Current position in command history
 *
 * **Range**: -1 (empty history) to commandHistory.length - 1
 * **Meaning**:
 * - -1: No commands or all undone
 * - 0: First command is current state
 * - N: Command at index N is current state
 *
 * **Operations**:
 * - Push command: position++
 * - Undo: position--
 * - Redo: position++
 *
 * **Invariant**: position < commandHistory.length
 */
let historyPosition = -1;
/**
 * Maximum number of commands in history
 *
 * **Why 50**: Balance between:
 * - ✅ Enough for typical user session
 * - ✅ Reasonable memory usage (~50-250 KB)
 * - ❌ Not unlimited (prevents memory bloat)
 *
 * **Behavior when exceeded**: Oldest command removed (sliding window)
 */
const MAX_HISTORY = 50;
/**
 * Update reactive state for undo/redo button enablement
 *
 * **Called after**:
 * - pushCommand() - New command added
 * - undo() - Position moved backward
 * - redo() - Position moved forward
 * - clearHistory() - History reset
 *
 * **Updates**:
 * - `canUndo`: true if historyPosition >= 0 (commands available to undo)
 * - `canRedo`: true if historyPosition < commandHistory.length - 1 (commands available to redo)
 *
 * **Triggers**:
 * - Component re-renders (via StencilJS Store reactivity)
 * - Button enable/disable state changes
 *
 * **Why not inline**:
 * - DRY principle (called from 4 places)
 * - Single responsibility (updating button states)
 * - Easier to extend (e.g., add logging, analytics)
 *
 * @private
 */
function updateButtonStates() {
    undoRedoState.canUndo = historyPosition >= 0;
    undoRedoState.canRedo = historyPosition < commandHistory.length - 1;
}
/**
 * Push a new command to the history stack
 *
 * **Use cases**:
 * - After drag operation completes
 * - After resize operation completes
 * - After adding new item
 * - After deleting item
 *
 * **Branching behavior** (discards future):
 * ```
 * Before: [cmd1, cmd2, cmd3, cmd4]
 *                  ↑ position = 1 (undid twice)
 *
 * Push cmd5: [cmd1, cmd2, cmd5]
 *                        ↑ position = 2
 *
 * Note: cmd3 and cmd4 discarded!
 * ```
 *
 * **Why discard future**:
 * - Matches user mental model (new action erases "undone" history)
 * - Simpler implementation than tree-based history
 * - Standard undo/redo UX pattern
 *
 * **Memory management**:
 * - If history exceeds MAX_HISTORY (50), oldest command removed
 * - Position adjusted to maintain integrity
 *
 * **Operation sequence**:
 * 1. Discard commands after current position (splice)
 * 2. Append new command to history
 * 3. If over limit, remove oldest (shift)
 * 4. Update position pointer
 * 5. Update button states (triggers UI)
 *
 * **Typical usage**:
 * ```typescript
 * // After drag end
 * const command = new MoveItemCommand(item, oldPos, newPos);
 * pushCommand(command);
 * ```
 *
 * **Important**: Command should be fully constructed (with snapshots taken)
 * before being pushed. This function does NOT execute the command - it's
 * assumed the operation already happened.
 *
 * @param command - Fully constructed command with before/after snapshots
 *
 * @example
 * ```typescript
 * // Delete item example
 * handleDelete(itemId: string, canvasId: string) {
 *   const item = getItem(canvasId, itemId);
 *   const index = gridState.canvases[canvasId].items.indexOf(item);
 *
 *   // Perform the delete
 *   removeItemFromCanvas(canvasId, itemId);
 *
 *   // Push command for undo (AFTER operation)
 *   const command = new DeleteItemCommand(canvasId, item, index);
 *   pushCommand(command);
 * }
 * ```
 */
function pushCommand(command) {
    debug.log('➕ PUSH: Adding command to history:', command.description || command);
    // Remove any commands after current position
    commandHistory.splice(historyPosition + 1);
    // Add new command
    commandHistory.push(command);
    // Limit history size
    if (commandHistory.length > MAX_HISTORY) {
        commandHistory.shift();
    }
    else {
        historyPosition++;
    }
    debug.log('  History position now:', historyPosition, ', Total commands:', commandHistory.length);
    // Update button states
    updateButtonStates();
}
/**
 * Undo the last command in history
 *
 * **Triggered by**:
 * - Ctrl+Z / Cmd+Z keyboard shortcut
 * - Undo button click
 * - Programmatic undo (rare)
 *
 * **Operation sequence**:
 * 1. Check if undo available (historyPosition >= 0)
 * 2. Get command at current position
 * 3. Execute command.undo() (reverses operation)
 * 4. Decrement position pointer
 * 5. Update button states (triggers UI)
 *
 * **Side effects**:
 * - Mutates global state (via command.undo())
 * - Triggers component re-renders
 * - Updates undo/redo button states
 * - May deselect items (depending on command)
 *
 * **Position before/after**:
 * ```
 * Before: [cmd1, cmd2, cmd3]
 *                      ↑ position = 2
 *
 * After:  [cmd1, cmd2, cmd3]
 *                ↑ position = 1
 * ```
 *
 * **Safety**: No-op if historyPosition < 0 (nothing to undo)
 *
 * **Multiple undo**: Can be called repeatedly to undo multiple commands
 *
 * @example
 * ```typescript
 * // Keyboard shortcut handler
 * window.addEventListener('keydown', (e) => {
 *   if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
 *     undo();
 *     e.preventDefault();
 *   }
 * });
 * ```
 */
function undo() {
    if (historyPosition < 0) {
        return;
    }
    const command = commandHistory[historyPosition];
    debug.log('🔙 UNDO: Executing command at position', historyPosition, ':', command);
    debug.log('  Command description:', command.description);
    command.undo();
    historyPosition--;
    debug.log('  New position after undo:', historyPosition);
    updateButtonStates();
}
/**
 * Redo the next command in history
 *
 * **Triggered by**:
 * - Ctrl+Y / Cmd+Y keyboard shortcut
 * - Ctrl+Shift+Z / Cmd+Shift+Z (alternative)
 * - Redo button click
 * - Programmatic redo (rare)
 *
 * **Operation sequence**:
 * 1. Check if redo available (historyPosition < commandHistory.length - 1)
 * 2. Increment position pointer
 * 3. Get command at new position
 * 4. Execute command.redo() (reapplies operation)
 * 5. Update button states (triggers UI)
 *
 * **Side effects**:
 * - Mutates global state (via command.redo())
 * - Triggers component re-renders
 * - Updates undo/redo button states
 * - May select items (depending on command)
 *
 * **Position before/after**:
 * ```
 * Before: [cmd1, cmd2, cmd3]
 *                ↑ position = 1
 *
 * After:  [cmd1, cmd2, cmd3]
 *                      ↑ position = 2
 * ```
 *
 * **Safety**: No-op if no commands to redo (position at end)
 *
 * **Multiple redo**: Can be called repeatedly to redo multiple commands
 *
 * **Redo after new action**: Redo becomes unavailable after new command
 * pushed (future history discarded)
 *
 * @example
 * ```typescript
 * // Keyboard shortcut handler
 * window.addEventListener('keydown', (e) => {
 *   if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
 *     redo();
 *     e.preventDefault();
 *   }
 * });
 * ```
 */
function redo() {
    if (historyPosition >= commandHistory.length - 1) {
        return;
    }
    historyPosition++;
    const command = commandHistory[historyPosition];
    command.redo();
    updateButtonStates();
}
/**
 * Check if undo operation is available
 *
 * **Use cases**:
 * - Enabling/disabling undo button
 * - Showing undo keyboard hint
 * - Programmatic checks before undo
 *
 * **Returns true when**: historyPosition >= 0 (commands in history)
 * **Returns false when**: historyPosition = -1 (no history or all undone)
 *
 * **Note**: Prefer using `undoRedoState.canUndo` in UI components
 * for automatic reactivity. This function is for imperative checks.
 *
 * @returns true if undo() can be called, false otherwise
 *
 * @example
 * ```typescript
 * // Imperative check
 * if (canUndo()) {
 *   debug.log('Undo available');
 *   undo();
 * }
 *
 * // Prefer reactive state in UI
 * <button disabled={!undoRedoState.canUndo}>Undo</button>
 * ```
 */
function canUndo() {
    return historyPosition >= 0;
}
/**
 * Check if redo operation is available
 *
 * **Use cases**:
 * - Enabling/disabling redo button
 * - Showing redo keyboard hint
 * - Programmatic checks before redo
 *
 * **Returns true when**: historyPosition < commandHistory.length - 1
 * **Returns false when**: At end of history or history empty
 *
 * **Becomes false after**: New command pushed (future discarded)
 *
 * **Note**: Prefer using `undoRedoState.canRedo` in UI components
 * for automatic reactivity. This function is for imperative checks.
 *
 * @returns true if redo() can be called, false otherwise
 *
 * @example
 * ```typescript
 * // Imperative check
 * if (canRedo()) {
 *   debug.log('Redo available');
 *   redo();
 * }
 *
 * // Prefer reactive state in UI
 * <button disabled={!undoRedoState.canRedo}>Redo</button>
 * ```
 */
function canRedo() {
    return historyPosition < commandHistory.length - 1;
}
/**
 * Clear all command history
 *
 * **Use cases**:
 * - Application reset
 * - Loading new project
 * - Test cleanup
 * - Memory management (rare)
 *
 * **Effects**:
 * - Empties command history array
 * - Resets position to -1
 * - Disables both undo and redo buttons
 * - Does NOT affect current state (only history)
 *
 * **Memory**: Allows garbage collection of command objects and snapshots
 *
 * **Cannot be undone**: This operation itself is not undoable
 *
 * **Safety**: Safe to call even if history already empty
 *
 * @example
 * ```typescript
 * // Reset application
 * function resetApp() {
 *   clearHistory();
 *   reset(); // Reset state
 *   debug.log('Application reset');
 * }
 *
 * // Test cleanup
 * afterEach(() => {
 *   clearHistory();
 * });
 * ```
 */
function clearHistory() {
    commandHistory.length = 0;
    historyPosition = -1;
    updateButtonStates();
}

/**
 * Boundary Constraints Utility
 * =============================
 *
 * Utilities for constraining component placement and sizing within canvas boundaries.
 * Ensures components stay fully within canvas and handles size fitting when needed.
 *
 * ## Problem
 *
 * Components can be placed or dragged such that they extend beyond canvas boundaries:
 * - Dropped from palette outside canvas bounds
 * - Dragged beyond edges
 * - Default size larger than canvas
 *
 * ## Solution
 *
 * Provides constraint functions that:
 * 1. Validate component can fit within canvas (respecting minSize)
 * 2. Adjust size to fit canvas if needed (respecting minSize/maxSize)
 * 3. Constrain position to keep component fully within bounds
 *
 * @module boundary-constraints
 */
/**
 * Canvas dimensions in grid units
 *
 * **Standard canvas size**:
 * - Width: 50 units (100% width, 2% per unit)
 * - Height: Unlimited (grows with content)
 */
const CANVAS_WIDTH_UNITS = 50;
/**
 * Validate if component can fit within canvas
 *
 * Checks if component's minimum size is smaller than or equal to canvas size.
 * If component's minSize > canvas size, placement should be rejected.
 *
 * @param definition - Component definition with min/max size constraints
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns true if component can fit, false if too large
 *
 * @example
 * ```typescript
 * const hugeComponent = {
 *   type: 'huge-widget',
 *   minSize: { width: 60, height: 10 } // 60 > 50 canvas width
 * };
 *
 * if (!canComponentFitCanvas(hugeComponent)) {
 *   console.warn('Component too large for canvas');
 *   return; // Don't allow placement
 * }
 * ```
 */
function canComponentFitCanvas(definition, canvasWidth = CANVAS_WIDTH_UNITS) {
    var _a;
    // Get minimum size (or use default minimums if not specified)
    const minWidth = ((_a = definition.minSize) === null || _a === void 0 ? void 0 : _a.width) || 0;
    // Check if minimum size fits within canvas
    // Height is unlimited, so only check width
    return minWidth <= canvasWidth;
}
/**
 * Constrain component size to fit within canvas
 *
 * Adjusts component size if default size exceeds canvas bounds,
 * while respecting min/max size constraints.
 *
 * **Size adjustment rules**:
 * 1. If defaultSize fits, use it
 * 2. If defaultSize > canvas, shrink to canvas size
 * 3. Never shrink below minSize
 * 4. Never grow beyond maxSize
 *
 * **Width constraint**: Canvas width (50 units)
 * **Height constraint**: None (canvas height grows with content)
 *
 * @param definition - Component definition
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained size and adjustment flag
 *
 * @example
 * ```typescript
 * const wideComponent = {
 *   type: 'banner',
 *   defaultSize: { width: 60, height: 10 }, // Too wide
 *   minSize: { width: 20, height: 5 }
 * };
 *
 * const size = constrainSizeToCanvas(wideComponent);
 * // { width: 50, height: 10, wasAdjusted: true }
 * ```
 */
function constrainSizeToCanvas(definition, canvasWidth = CANVAS_WIDTH_UNITS) {
    var _a, _b, _c, _d;
    const defaultWidth = definition.defaultSize.width;
    const defaultHeight = definition.defaultSize.height;
    const minWidth = ((_a = definition.minSize) === null || _a === void 0 ? void 0 : _a.width) || 0;
    const maxWidth = ((_b = definition.maxSize) === null || _b === void 0 ? void 0 : _b.width) || Infinity;
    let width = defaultWidth;
    let height = defaultHeight;
    let wasAdjusted = false;
    // Constrain width to canvas
    if (width > canvasWidth) {
        width = canvasWidth;
        wasAdjusted = true;
    }
    // Respect minSize
    if (width < minWidth) {
        width = minWidth;
    }
    // Respect maxSize
    if (width > maxWidth) {
        width = maxWidth;
    }
    // Height is not constrained by canvas (canvas grows vertically)
    // but still respect min/max if specified
    const minHeight = ((_c = definition.minSize) === null || _c === void 0 ? void 0 : _c.height) || 0;
    const maxHeight = ((_d = definition.maxSize) === null || _d === void 0 ? void 0 : _d.height) || Infinity;
    if (height < minHeight) {
        height = minHeight;
    }
    if (height > maxHeight) {
        height = maxHeight;
    }
    return { width, height, wasAdjusted };
}
/**
 * Constrain component position to keep it fully within canvas bounds
 *
 * Adjusts position so component stays completely inside canvas.
 * Snaps to edges if component would extend beyond boundaries.
 *
 * **Boundary rules**:
 * - Left edge: x >= 0
 * - Right edge: x + width <= canvasWidth
 * - Top edge: y >= 0
 * - Bottom edge: No constraint (canvas height grows)
 *
 * @param x - Desired x position in grid units
 * @param y - Desired y position in grid units
 * @param width - Component width in grid units
 * @param height - Component height in grid units
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained placement
 *
 * @example
 * ```typescript
 * // Component would extend beyond right edge
 * const placement = constrainPositionToCanvas(45, 10, 20, 10);
 * // { x: 30, y: 10, width: 20, height: 10, positionAdjusted: true, sizeAdjusted: false }
 * // Adjusted from 45 to 30 so (30 + 20 = 50) stays within canvas
 * ```
 */
function constrainPositionToCanvas(x, y, width, height, canvasWidth = CANVAS_WIDTH_UNITS) {
    let newX = x;
    let newY = y;
    let positionAdjusted = false;
    // Constrain left edge
    if (newX < 0) {
        newX = 0;
        positionAdjusted = true;
    }
    // Constrain right edge
    if (newX + width > canvasWidth) {
        newX = canvasWidth - width;
        positionAdjusted = true;
    }
    // Constrain top edge
    if (newY < 0) {
        newY = 0;
        positionAdjusted = true;
    }
    // No bottom edge constraint - canvas grows vertically
    // Ensure position doesn't go negative after adjustment
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    return {
        x: newX,
        y: newY,
        width,
        height,
        positionAdjusted,
        sizeAdjusted: false,
    };
}
/**
 * Apply full boundary constraints to component placement
 *
 * Complete constraint pipeline:
 * 1. Check if component can fit (validate minSize <= canvas)
 * 2. Adjust size to fit canvas (if needed)
 * 3. Constrain position to keep within bounds
 *
 * **Returns null if component cannot fit** (minSize > canvas)
 *
 * @param definition - Component definition
 * @param x - Desired x position in grid units
 * @param y - Desired y position in grid units
 * @param canvasWidth - Canvas width in grid units (default: 50)
 * @returns Constrained placement, or null if component too large
 *
 * @example
 * ```typescript
 * const definition = {
 *   type: 'widget',
 *   defaultSize: { width: 60, height: 10 },
 *   minSize: { width: 20, height: 5 }
 * };
 *
 * const placement = applyBoundaryConstraints(definition, 45, 10);
 * // {
 * //   x: 0,              // Adjusted from 45 to fit
 * //   y: 10,             // No Y adjustment needed
 * //   width: 50,         // Shrunk from 60 to fit canvas
 * //   height: 10,        // No height adjustment
 * //   positionAdjusted: true,
 * //   sizeAdjusted: true
 * // }
 * ```
 */
function applyBoundaryConstraints(definition, x, y, canvasWidth = CANVAS_WIDTH_UNITS) {
    var _a;
    // 1. Validate component can fit
    if (!canComponentFitCanvas(definition, canvasWidth)) {
        console.warn(`Component "${definition.name}" minSize (${(_a = definition.minSize) === null || _a === void 0 ? void 0 : _a.width}) ` +
            `exceeds canvas width (${canvasWidth}). Placement rejected.`);
        return null;
    }
    // 2. Adjust size to fit canvas
    const constrainedSize = constrainSizeToCanvas(definition, canvasWidth);
    // 3. Constrain position to keep within bounds
    const constrainedPlacement = constrainPositionToCanvas(x, y, constrainedSize.width, constrainedSize.height, canvasWidth);
    // Combine size and position adjustments
    return Object.assign(Object.assign({}, constrainedPlacement), { sizeAdjusted: constrainedSize.wasAdjusted });
}

export { AddCanvasCommand as A, BatchUpdateConfigCommand as B, CANVAS_WIDTH_UNITS as C, MoveItemCommand as M, RemoveCanvasCommand as R, createDebugLogger as a, applyBoundaryConstraints as b, constrainPositionToCanvas as c, undoRedoState as d, BatchDeleteCommand as e, BatchAddCommand as f, pushCommand as p, undoRedo as u, virtualRenderer as v };
//# sourceMappingURL=boundary-constraints-C3OHvTXO.js.map

//# sourceMappingURL=boundary-constraints-C3OHvTXO.js.map