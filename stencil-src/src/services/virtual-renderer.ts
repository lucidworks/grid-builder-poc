/**
 * Virtual Renderer Service
 * Lazy-loads component content using IntersectionObserver
 *
 * Purpose: Only render component content when visible in viewport
 * to improve performance with 100+ items
 *
 * Benefits:
 * - Reduced initial render time
 * - Lower memory usage
 * - Faster page load
 * - Smooth scrolling
 */

export type VisibilityCallback = (isVisible: boolean) => void;

export class VirtualRendererService {
  private observer: IntersectionObserver | null = null;
  private observedElements: Map<string, VisibilityCallback> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Create observer with 200px margin (pre-render before entering viewport)
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementId = entry.target.id;
          const callback = this.observedElements.get(elementId);

          if (callback) {
            // Call callback with visibility state
            callback(entry.isIntersecting);
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01, // Trigger when even 1% is visible
      }
    );
  }

  /**
   * Observe an element for visibility changes
   * @param element - The element to observe
   * @param elementId - Unique ID for the element
   * @param callback - Called when visibility changes
   */
  observe(element: HTMLElement, elementId: string, callback: VisibilityCallback) {
    if (!this.observer || !element) {
      return;
    }

    // Store callback
    this.observedElements.set(elementId, callback);

    // Start observing
    this.observer.observe(element);
  }

  /**
   * Stop observing an element
   * @param element - The element to stop observing
   * @param elementId - The element's ID
   */
  unobserve(element: HTMLElement, elementId: string) {
    if (!this.observer || !element) {
      return;
    }

    // Remove callback
    this.observedElements.delete(elementId);

    // Stop observing
    this.observer.unobserve(element);
  }

  /**
   * Cleanup all observations
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observedElements.clear();
  }
}

// Export singleton instance
export const virtualRenderer = new VirtualRendererService();
