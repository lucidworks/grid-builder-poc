/**
 * Resize Handler
 * Performance-critical resize operations using direct DOM manipulation
 *
 * Purpose: Handle 8-point resize operations outside of StencilJS virtual DOM
 * to avoid re-render overhead during 60fps resize operations
 *
 * Uses interact.js for resize events with RAF batching
 * Only updates StencilJS state at the END of resize (triggers single re-render)
 */

import { GridItem } from '../services/state-manager';
import { getGridSizeHorizontal, getGridSizeVertical, pixelsToGridX, pixelsToGridY } from './grid-calculations';

/**
 * Extract transform position from element
 */
function getTransformPosition(element: HTMLElement): { x: number; y: number } {
  const transform = element.style.transform;
  const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);

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
 * Manages resize behavior for a single grid item
 */
export class ResizeHandler {
  private element: HTMLElement;
  private item: GridItem;
  private onUpdate: (item: GridItem) => void;
  private interactInstance: any;
  private resizeRafId: number | null = null;
  private startRect: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  constructor(element: HTMLElement, item: GridItem, onUpdate: (item: GridItem) => void) {
    this.element = element;
    this.item = item;
    this.onUpdate = onUpdate;

    this.initialize();
  }

  /**
   * Cleanup interact.js instance
   */
  destroy(): void {
    if (this.resizeRafId) {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
    }

    if (this.interactInstance) {
      this.interactInstance.unset();
    }
  }

  private initialize(): void {
    const interact = (window as any).interact;
    if (!interact) {
      console.warn('interact.js not loaded');
      return;
    }

    this.interactInstance = interact(this.element).resizable({
      edges: { left: true, right: true, bottom: true, top: true },

      modifiers: [
        // Snap to grid only when resize ends (prevents initial jump)
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
        // Enforce minimum size
        interact.modifiers.restrictSize({
          min: { width: 100, height: 80 },
        }),
        // Keep within parent boundaries
        interact.modifiers.restrictEdges({
          outer: 'parent',
        }),
      ],

      listeners: {
        start: this.handleResizeStart.bind(this),
        move: this.handleResizeMove.bind(this),
        end: this.handleResizeEnd.bind(this),
      },
    });
  }

  private handleResizeStart(event: any): void {
    // Start performance tracking
    if ((window as any).perfMonitor) {
      (window as any).perfMonitor.startOperation('resize');
    }

    event.target.classList.add('resizing');

    // Store the starting position and size
    const position = getTransformPosition(event.target);
    this.startRect.x = position.x;
    this.startRect.y = position.y;
    this.startRect.width = parseFloat(event.target.style.width) || 0;
    this.startRect.height = parseFloat(event.target.style.height) || 0;
  }

  private handleResizeMove(event: any): void {
    // Cancel any pending frame
    if (this.resizeRafId) {
      cancelAnimationFrame(this.resizeRafId);
    }

    // Batch DOM updates with requestAnimationFrame for 60fps
    this.resizeRafId = requestAnimationFrame(() => {
      // Use deltaRect to accumulate changes instead of absolute positions
      // This prevents jumping when endOnly snap is used
      const dx = event.deltaRect.left;
      const dy = event.deltaRect.top;
      const dw = event.deltaRect.width;
      const dh = event.deltaRect.height;

      // Update stored rect
      this.startRect.x += dx;
      this.startRect.y += dy;
      this.startRect.width += dw;
      this.startRect.height += dh;

      // Direct DOM manipulation - no StencilJS re-render during resize
      event.target.style.transform = `translate(${this.startRect.x}px, ${this.startRect.y}px)`;
      event.target.style.width = this.startRect.width + 'px';
      event.target.style.height = this.startRect.height + 'px';

      this.resizeRafId = null;
    });
  }

  private handleResizeEnd(event: any): void {
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
    const container = document.getElementById(this.item.canvasId);
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

    // Apply snapped final position
    event.target.style.transform = `translate(${newX}px, ${newY}px)`;
    event.target.style.width = newWidth + 'px';
    event.target.style.height = newHeight + 'px';

    // Update item size and position in current viewport's layout (convert to grid units)
    const currentViewport = (window as any).gridState?.currentViewport || 'desktop';
    const layout = this.item.layouts[currentViewport as 'desktop' | 'mobile'];

    layout.width = pixelsToGridX(newWidth, this.item.canvasId);
    layout.height = pixelsToGridY(newHeight);
    layout.x = pixelsToGridX(newX, this.item.canvasId);
    layout.y = pixelsToGridY(newY);

    // If in mobile view, mark as customized
    if (currentViewport === 'mobile') {
      this.item.layouts.mobile.customized = true;
    }

    // Commit to transform-based position (no left/top)
    event.target.style.transform = `translate(${newX}px, ${newY}px)`;
    event.target.style.width = newWidth + 'px';
    event.target.style.height = newHeight + 'px';
    event.target.removeAttribute('data-x');
    event.target.removeAttribute('data-y');

    // End performance tracking
    if ((window as any).perfMonitor) {
      (window as any).perfMonitor.endOperation('resize');
    }

    // Trigger StencilJS update (single re-render at end)
    this.onUpdate(this.item);
  }
}
