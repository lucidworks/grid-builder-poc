/**
 * Drag Handler
 * Performance-critical drag operations using direct DOM manipulation
 *
 * Purpose: Handle drag operations outside of StencilJS virtual DOM
 * to avoid re-render overhead during 60fps drag operations
 *
 * Uses interact.js for drag events but manipulates DOM directly
 * Only updates StencilJS state at the END of drag (triggers single re-render)
 */

import { GridItem } from '../services/state-manager';
import { domCache } from './dom-cache';
import { getGridSizeHorizontal, getGridSizeVertical, pixelsToGridX, pixelsToGridY } from './grid-calculations';

/**
 * Extract transform position from element
 */
function getTransformPosition(element: HTMLElement): { x: number; y: number } {
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
 * Manages drag behavior for a single grid item
 */
export class DragHandler {
  private element: HTMLElement;
  private item: GridItem;
  private onUpdate: (item: GridItem) => void;
  private interactInstance: any;
  private basePosition: { x: number; y: number } = { x: 0, y: 0 };
  private dragStartCanvasId: string = '';

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

    this.interactInstance = interact(this.element).draggable({
      allowFrom: '.drag-handle', // Only allow drag from drag handle
      inertia: false,
      listeners: {
        start: this.handleDragStart.bind(this),
        move: this.handleDragMove.bind(this),
        end: this.handleDragEnd.bind(this),
      },
    });
  }

  private handleDragStart(event: any): void {
    // Start performance tracking
    if ((window as any).perfMonitor) {
      (window as any).perfMonitor.startOperation('drag');
    }

    event.target.classList.add('dragging');

    // Store the original canvas ID at drag start
    this.dragStartCanvasId = this.item.canvasId;

    // Store the base position from transform
    this.basePosition = getTransformPosition(event.target);

    // Reset accumulation
    event.target.setAttribute('data-x', '0');
    event.target.setAttribute('data-y', '0');
  }

  private handleDragMove(event: any): void {
    const x = (parseFloat(event.target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(event.target.getAttribute('data-y')) || 0) + event.dy;

    // Apply drag delta to base position
    // Direct DOM manipulation - no StencilJS re-render during drag
    event.target.style.transform = `translate(${this.basePosition.x + x}px, ${this.basePosition.y + y}px)`;
    event.target.setAttribute('data-x', x.toString());
    event.target.setAttribute('data-y', y.toString());
  }

  private handleDragEnd(event: any): void {
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
    gridContainers.forEach((container: HTMLElement) => {
      const containerRect = container.getBoundingClientRect();
      if (
        centerX >= containerRect.left &&
        centerX <= containerRect.right &&
        centerY >= containerRect.top &&
        centerY <= containerRect.bottom
      ) {
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
      if ((window as any).perfMonitor) {
        (window as any).perfMonitor.endOperation('drag');
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
    } else if (newX > targetContainer.clientWidth - itemWidth - EDGE_SNAP_THRESHOLD) {
      newX = targetContainer.clientWidth - itemWidth; // Snap to right edge
    }
    if (newY < EDGE_SNAP_THRESHOLD) {
      newY = 0; // Snap to top edge
    } else if (newY > targetContainer.clientHeight - itemHeight - EDGE_SNAP_THRESHOLD) {
      newY = targetContainer.clientHeight - itemHeight; // Snap to bottom edge
    }

    // Update item position in current viewport's layout (convert to grid units)
    const currentViewport = (window as any).gridState?.currentViewport || 'desktop';
    const layout = this.item.layouts[currentViewport as 'desktop' | 'mobile'];

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
    if ((window as any).perfMonitor) {
      (window as any).perfMonitor.endOperation('drag');
    }

    // Trigger StencilJS update (single re-render at end)
    this.onUpdate(this.item);
  }
}
