/**
 * DOM Cache Utility
 * Cache DOM queries for performance
 *
 * Purpose: Reduce repeated document.getElementById() calls
 * which can be slow when called frequently during drag/resize operations
 */

/**
 * DOM Cache for canvas containers and frequently accessed elements
 */
class DOMCache {
  private canvases: Map<string, HTMLElement> = new Map();

  /**
   * Get canvas element by ID (cached)
   * Falls back to document.getElementById if not cached
   */
  getCanvas(canvasId: string): HTMLElement | null {
    // Check cache first
    if (this.canvases.has(canvasId)) {
      return this.canvases.get(canvasId)!;
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
   * Call this when canvas is removed or replaced
   */
  invalidate(canvasId: string): void {
    this.canvases.delete(canvasId);
  }

  /**
   * Clear entire cache
   * Call this on major DOM restructuring
   */
  clear(): void {
    this.canvases.clear();
  }
}

// Export singleton instance
export const domCache = new DOMCache();
