/**
 * Visual Feedback Utility
 * =======================
 *
 * Animation and visual feedback utilities for click-to-add feature.
 * Provides canvas highlighting, position indicators, and component animations.
 *
 * ## Key Features
 *
 * **Canvas Highlighting**:
 * - Pulse animation on active canvas border
 * - Shows user which canvas will receive the component
 * - Auto-removes after animation completes
 *
 * **Position Indicator (Ghost Outline)**:
 * - Shows where component will be placed
 * - Semi-transparent preview of component size/position
 * - Helps user understand auto-placement logic
 * - Respects custom GridConfig (grid size, constraints)
 *
 * **Component Animation**:
 * - Fade + scale animation for newly added components
 * - Draws attention to new item
 * - Smooth visual feedback
 *
 * ## Performance
 *
 * - Uses CSS animations (GPU-accelerated)
 * - Minimal JavaScript overhead
 * - Cleanup after animations complete
 * @module visual-feedback
 */
/**
 * Canvas highlight duration (milliseconds)
 * Duration of pulse animation on canvas border
 */
const CANVAS_HIGHLIGHT_DURATION = 600;
/**
 * Position indicator duration (milliseconds)
 * How long ghost outline stays visible
 */
const POSITION_INDICATOR_DURATION = 800;
/**
 * Component animation duration (milliseconds)
 * Duration of selection outline pulse animation for new components
 */
const COMPONENT_ANIMATION_DURATION = 600;
/**
 * Highlight canvas with pulse animation
 *
 * Adds visual feedback showing which canvas will receive the component.
 * Useful when user clicks palette item - highlights active canvas.
 *
 * **Visual Effect**:
 * - Pulse animation on canvas border
 * - Color: var(--selection-color) or #f59e0b (amber/gold)
 * - Duration: 600ms
 * - Auto-removes after animation
 *
 * **Implementation**:
 * 1. Find canvas element by ID
 * 2. Add `.canvas-highlight` class (triggers CSS animation)
 * 3. Remove class after animation completes
 *
 * **CSS Animation** (defined in canvas-section.scss):
 * ```scss
 * @keyframes canvas-highlight-pulse {
 * 0%, 100% {
 * box-shadow: 0 0 0 0 var(--selection-color);
 * opacity: 1;
 * }
 * 50% {
 * box-shadow: 0 0 0 4px var(--selection-color);
 * opacity: 0.7;
 * }
 * }
 *
 * .canvas-highlight {
 * animation: canvas-highlight-pulse 600ms ease-out;
 * }
 * ```
 *
 * **Example Usage**:
 * ```typescript
 * // User clicks palette item
 * highlightCanvas('canvas1');
 * // → Canvas border pulses to show it's active
 * ```
 * @param canvasId - Canvas ID to highlight
 */
function highlightCanvas(canvasId) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        console.warn(`highlightCanvas: Canvas element not found: ${canvasId}`);
        return;
    }
    // Add highlight class (triggers CSS animation)
    canvasElement.classList.add("canvas-highlight");
    // Remove class after animation completes
    setTimeout(() => {
        canvasElement.classList.remove("canvas-highlight");
    }, CANVAS_HIGHLIGHT_DURATION);
}
/**
 * Show position indicator (ghost outline) where component will be placed
 *
 * Creates a semi-transparent preview showing where the component will appear.
 * Helps user understand auto-placement algorithm results.
 *
 * **Visual Effect**:
 * - Ghost outline at target position
 * - Semi-transparent (30% opacity)
 * - Dashed border
 * - Fade out after 800ms
 *
 * **Grid Configuration**:
 * - Respects custom GridConfig (grid size, min/max constraints)
 * - Uses same grid calculations as actual component positioning
 * - Ensures indicator matches final component size/position
 *
 * **Implementation**:
 * 1. Find canvas container element
 * 2. Convert grid units to pixels (respecting GridConfig)
 * 3. Create ghost div with exact position/size
 * 4. Add `.position-indicator` class (CSS styling)
 * 5. Fade out and remove after delay
 *
 * **CSS Styling** (defined in canvas-section.scss):
 * ```scss
 * .position-indicator {
 * position: absolute;
 * border: 2px dashed var(--selection-color);
 * opacity: 0.8;
 * pointer-events: none;
 * z-index: 9999;
 * animation: position-indicator-fade 800ms ease-out forwards;
 * }
 *
 * @keyframes position-indicator-fade {
 * 0% { opacity: 0.8; }
 * 70% { opacity: 0.8; }
 * 100% { opacity: 0; }
 * }
 * ```
 *
 * **Example Usage**:
 * ```typescript
 * // Show where 10×6 component will be placed at (20, 2)
 * showPositionIndicator('canvas1', 20, 2, 10, 6);
 * // → Ghost outline appears at position, fades out
 *
 * // With custom grid config
 * const customConfig = { gridSizePercent: 3 };
 * showPositionIndicator('canvas1', 20, 2, 10, 6, customConfig);
 * // → Ghost outline uses 3% grid size instead of default 2%
 * ```
 * @param canvasId - Canvas ID where component will be placed
 * @param x - X position in grid units
 * @param y - Y position in grid units
 * @param width - Width in grid units
 * @param height - Height in grid units
 * @param config - Optional GridConfig (uses defaults if not provided)
 */
function showPositionIndicator(canvasId, x, y, width, height, config) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        console.warn(`showPositionIndicator: Canvas element not found: ${canvasId}`);
        return;
    }
    // Import grid calculations (avoid circular dependency by using dynamic import)
    import('./grid-calculations-C87xQzOc.js').then(function (n) { return n.f; }).then(({ gridToPixelsX, gridToPixelsY }) => {
        // Convert grid units to pixels (respecting GridConfig)
        const xPixels = gridToPixelsX(x, canvasId, config);
        const yPixels = gridToPixelsY(y, config);
        const widthPixels = gridToPixelsX(width, canvasId, config);
        const heightPixels = gridToPixelsY(height, config);
        // Create ghost indicator element
        const indicator = document.createElement("div");
        indicator.className = "position-indicator";
        indicator.style.position = "absolute";
        indicator.style.transform = `translate(${xPixels}px, ${yPixels}px)`;
        indicator.style.width = `${widthPixels}px`;
        indicator.style.height = `${heightPixels}px`;
        // Add to canvas
        canvasElement.appendChild(indicator);
        // Remove after animation completes
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, POSITION_INDICATOR_DURATION);
    });
}
/**
 * Animate component in (pulse animation with scroll into view)
 *
 * Adds visual feedback when component is added via click-to-add.
 * Draws attention to newly created item and ensures it's visible.
 *
 * **Visual Effect**:
 * - Clears position indicators (prevents blue flash)
 * - Scrolls component into view with smooth animation (centers in viewport)
 * - Selection outline stays visible throughout, pulsing from 2px to 6px glow
 * - Component appears instantly (no opacity fade to prevent confusing flash)
 * - Duration: 600ms
 * - Easing: ease-out
 *
 * **Implementation**:
 * 1. Find grid item element by ID
 * 2. Clear all position indicators immediately
 * 3. Scroll component to center of viewport (smooth animation)
 * 4. Add `.component-animate-in` class (triggers CSS animation)
 * 5. Remove class after animation completes
 *
 * **CSS Animation** (defined in grid-item-wrapper.scss):
 * ```scss
 * @keyframes component-animate-in {
 * 0%, 100% {
 * border-color: var(--selection-color);
 * box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.5);
 * }
 * 50% {
 * border-color: var(--selection-color);
 * box-shadow: 0 0 0 6px rgba(74, 144, 226, 0.7);
 * }
 * }
 *
 * .component-animate-in {
 * animation: component-animate-in 600ms ease-out;
 * border-color: var(--selection-color);
 * }
 * ```
 *
 * **Example Usage**:
 * ```typescript
 * // After adding component with id 'item-123'
 * animateComponentIn('item-123');
 * // → Position indicators cleared, component scrolls to center and outline pulses
 * ```
 *
 * **Note**: Call this AFTER the component has been added to the DOM.
 * Use a small delay (e.g., 50ms) to ensure DOM update has completed.
 * @param itemId - Grid item ID to animate
 */
function animateComponentIn(itemId) {
    // Small delay to ensure DOM update has completed
    setTimeout(() => {
        const itemElement = document.getElementById(itemId);
        if (!itemElement) {
            console.warn(`animateComponentIn: Item element not found: ${itemId}`);
            return;
        }
        // Clear any position indicators immediately (prevents blue flash)
        const indicators = document.querySelectorAll(".position-indicator");
        indicators.forEach((indicator) => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        });
        // Scroll component into view (with smooth animation)
        // Always use standard scrollIntoView for consistent animated scrolling
        itemElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
        });
        // Add animation class (triggers CSS animation)
        itemElement.classList.add("component-animate-in");
        // Remove class after animation completes
        setTimeout(() => {
            itemElement.classList.remove("component-animate-in");
        }, COMPONENT_ANIMATION_DURATION);
    }, 50); // 50ms delay for DOM update
}

export { animateComponentIn, highlightCanvas, showPositionIndicator };
//# sourceMappingURL=visual-feedback-NdurxFwM.js.map

//# sourceMappingURL=visual-feedback-NdurxFwM.js.map