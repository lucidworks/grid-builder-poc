/**
 * TypeScript type definitions for interact.js
 * ==============================================
 *
 * This module provides TypeScript types for the interact.js library loaded via CDN.
 * Interact.js is a powerful drag/drop and resize library used in drag-handler.ts and
 * resize-handler.ts for high-performance interactions.
 *
 * ## Why These Types
 *
 * The interact.js library is loaded via CDN script tag and doesn't have comprehensive
 * TypeScript types. These definitions provide:
 * - Type safety for interact() calls
 * - Autocomplete for configuration options
 * - Event payload typing
 * - Better IDE support
 *
 * ## Coverage
 *
 * These types cover the subset of interact.js actually used in this project:
 * - Draggable configuration
 * - Resizable configuration
 * - Event types (dragstart, dragmove, dragend, resizestart, resizemove, resizeend)
 * - Common options (inertia, autoScroll, allowFrom, ignoreFrom, edges)
 *
 * For full API documentation, see: https://interactjs.io/docs/
 */

declare module "interactjs" {
  /**
   * Interact.js drag event
   *
   * Fired during drag lifecycle (start, move, end)
   */
  export interface InteractDragEvent {
    /** The DOM element being dragged */
    target: HTMLElement;

    /** Change in X position since last event */
    dx: number;

    /** Change in Y position since last event */
    dy: number;

    /** Cumulative X delta from drag start */
    deltaX?: number;

    /** Cumulative Y delta from drag start */
    deltaY?: number;

    /** Client X coordinate */
    clientX: number;

    /** Client Y coordinate */
    clientY: number;

    /** Page X coordinate */
    pageX: number;

    /** Page Y coordinate */
    pageY: number;

    /** Screen X coordinate */
    screenX: number;

    /** Screen Y coordinate */
    screenY: number;

    /** Underlying mouse/touch event */
    interaction: any;
  }

  /**
   * Interact.js resize event
   *
   * Fired during resize lifecycle (start, move, end)
   */
  export interface InteractResizeEvent {
    /** The DOM element being resized */
    target: HTMLElement;

    /** Rectangle delta information */
    deltaRect: {
      /** Change in left edge position */
      left: number;

      /** Change in top edge position */
      top: number;

      /** Change in width */
      width: number;

      /** Change in height */
      height: number;
    };

    /** Rectangle information */
    rect: {
      /** Element left position */
      left: number;

      /** Element top position */
      top: number;

      /** Element width */
      width: number;

      /** Element height */
      height: number;
    };

    /** Which edges are being resized */
    edges: {
      /** Left edge being resized */
      left?: boolean;

      /** Right edge being resized */
      right?: boolean;

      /** Top edge being resized */
      top?: boolean;

      /** Bottom edge being resized */
      bottom?: boolean;
    };

    /** Underlying mouse/touch event */
    interaction: any;
  }

  /**
   * Auto-scroll configuration
   *
   * Automatically scrolls container when dragging near edges
   */
  export interface InteractAutoScrollOptions {
    /** Enable auto-scroll */
    enabled?: boolean;

    /** Container to scroll (default: window) */
    container?: Window | HTMLElement;

    /** Distance from edge to trigger scroll (px) */
    margin?: number;

    /** Scroll speed multiplier */
    speed?: number;
  }

  /**
   * Draggable configuration options
   */
  export interface InteractDraggableOptions {
    /** Disable momentum/physics after drag release */
    inertia?: boolean | object;

    /** Auto-scroll configuration */
    autoScroll?: boolean | InteractAutoScrollOptions;

    /** CSS selector for drag handles (only these elements can initiate drag) */
    allowFrom?: string;

    /** CSS selector for elements to ignore (prevent drag from these) */
    ignoreFrom?: string;

    /** Event listeners */
    listeners?: {
      /** Drag start event handler */
      start?: (event: InteractDragEvent) => void;

      /** Drag move event handler (high-frequency, ~60fps) */
      move?: (event: InteractDragEvent) => void;

      /** Drag end event handler */
      end?: (event: InteractDragEvent) => void;
    };

    /** Prevent default browser drag behavior */
    preventDefault?: boolean;

    /** Lock dragging to specific axes */
    lockAxis?: "x" | "y" | "xy" | "start";

    /** Modifiers for drag behavior */
    modifiers?: any[];
  }

  /**
   * Resizable configuration options
   */
  export interface InteractResizableOptions {
    /** Which edges can be resized */
    edges?: {
      /** Enable left edge resize */
      left?: boolean | string;

      /** Enable right edge resize */
      right?: boolean | string;

      /** Enable top edge resize */
      top?: boolean | string;

      /** Enable bottom edge resize */
      bottom?: boolean | string;
    };

    /** Disable momentum/physics after resize release */
    inertia?: boolean | object;

    /** CSS selector for elements to ignore (prevent resize from these) */
    ignoreFrom?: string;

    /** Event listeners */
    listeners?: {
      /** Resize start event handler */
      start?: (event: InteractResizeEvent) => void;

      /** Resize move event handler (high-frequency, ~60fps) */
      move?: (event: InteractResizeEvent) => void;

      /** Resize end event handler */
      end?: (event: InteractResizeEvent) => void;
    };

    /** Modifiers for resize behavior (snap, restrict, etc.) */
    modifiers?: any[];

    /** Margin around edge for resize handle detection (px) */
    margin?: number;

    /** Preserve aspect ratio during resize */
    preserveAspectRatio?: boolean;

    /** Invert edges during resize from top/left */
    invert?: "none" | "negate" | "reposition";
  }

  /**
   * Dropzone configuration options
   */
  export interface InteractDropzoneOptions {
    /** CSS selector for elements that can be dropped */
    accept?: string;

    /** Overlap requirement (percentage or pixels) */
    overlap?: number | "pointer" | "center";

    /** Check if element is draggable before accepting drop */
    checker?: (
      dragEvent: any,
      event: any,
      dropped: boolean,
      dropzone: Interactable,
      dropElement: HTMLElement,
      draggable: Interactable,
      draggableElement: HTMLElement,
    ) => boolean;

    /** Event listeners */
    listeners?: {
      /** Drop activated (drag enters dropzone area) */
      activate?: (event: any) => void;

      /** Drag enters dropzone */
      dragenter?: (event: any) => void;

      /** Drag moves within dropzone */
      dragmove?: (event: any) => void;

      /** Drag leaves dropzone */
      dragleave?: (event: any) => void;

      /** Drop occurs (drag ends in dropzone) */
      drop?: (event: any) => void;

      /** Drop deactivated (drag ends outside dropzone) */
      deactivate?: (event: any) => void;
    };
  }

  /**
   * Interactable instance
   *
   * Returned by interact(element) call
   */
  export interface Interactable {
    /** Make element draggable */
    draggable(options: InteractDraggableOptions | boolean): Interactable;

    /** Make element resizable */
    resizable(options: InteractResizableOptions | boolean): Interactable;

    /** Make element a dropzone for draggable elements */
    dropzone(options: InteractDropzoneOptions | boolean): Interactable;

    /** Remove all interact.js functionality from element */
    unset(): void;

    /** Add event listener */
    on(
      eventType: string,
      listener: (event: any) => void,
      options?: any,
    ): Interactable;

    /** Remove event listener */
    off(
      eventType: string,
      listener: (event: any) => void,
      options?: any,
    ): Interactable;

    /** Set/get context (arbitrary data storage) */
    context(element?: HTMLElement): any;

    /** Get the target element */
    target: HTMLElement;
  }

  /**
   * Main interact function
   *
   * Creates an Interactable from a DOM element or CSS selector
   *
   * @param target - DOM element or CSS selector
   * @returns Interactable instance for chaining configuration
   *
   * @example
   * ```typescript
   * import interact from 'interactjs';
   *
   * // Make element draggable
   * interact(element).draggable({
   *   inertia: false,
   *   listeners: {
   *     move: (event) => {
   *       const x = event.target.getAttribute('data-x') || 0;
   *       const y = event.target.getAttribute('data-y') || 0;
   *       event.target.style.transform = `translate(${x}px, ${y}px)`;
   *     }
   *   }
   * });
   *
   * // Make element resizable
   * interact(element).resizable({
   *   edges: { left: true, right: true, bottom: true, top: true },
   *   listeners: {
   *     move: (event) => {
   *       event.target.style.width = event.rect.width + 'px';
   *       event.target.style.height = event.rect.height + 'px';
   *     }
   *   }
   * });
   * ```
   */
  export default function interact(target: HTMLElement | string): Interactable;
}
