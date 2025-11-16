import { r as registerInstance, h } from './index-ebe9feb4.js';
import { c as componentTemplates } from './component-templates-e71f1a8f.js';
import { s as state } from './state-manager-6c3d6100.js';
import { p as pushCommand } from './undo-redo-27e9fef6.js';
import { M as MoveItemCommand } from './undo-redo-commands-ad381a9f.js';
import { d as domCache, e as getGridSizeHorizontal, f as getGridSizeVertical, p as pixelsToGridX, a as pixelsToGridY, g as gridToPixelsX, b as gridToPixelsY } from './grid-calculations-54c868d5.js';
import './index-28d0c3f6.js';

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
class VirtualRendererService {
    constructor() {
        this.observer = null;
        this.observedElements = new Map();
        this.initialize();
    }
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
     * Observe an element for visibility changes
     * @param element - The element to observe
     * @param elementId - Unique ID for the element
     * @param callback - Called when visibility changes
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
     * Stop observing an element
     * @param element - The element to stop observing
     * @param elementId - The element's ID
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
const virtualRenderer = new VirtualRendererService();

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
/**
 * Extract transform position from element
 */
function getTransformPosition$1(element) {
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
 * Drag Handler Class
 * Manages drag behavior for a single grid item
 */
class DragHandler {
    constructor(element, item, onUpdate) {
        this.basePosition = { x: 0, y: 0 };
        this.dragStartCanvasId = '';
        this.element = element;
        this.item = item;
        this.onUpdate = onUpdate;
        this.initialize();
    }
    /**
     * Cleanup interact.js instance
     */
    destroy() {
        if (this.interactInstance) {
            this.interactInstance.unset();
        }
    }
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
    handleDragMove(event) {
        const x = (parseFloat(event.target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(event.target.getAttribute('data-y')) || 0) + event.dy;
        // Apply drag delta to base position
        // Direct DOM manipulation - no StencilJS re-render during drag
        event.target.style.transform = `translate(${this.basePosition.x + x}px, ${this.basePosition.y + y}px)`;
        event.target.setAttribute('data-x', x.toString());
        event.target.setAttribute('data-y', y.toString());
    }
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
 * Performance-critical resize operations using direct DOM manipulation
 *
 * Purpose: Handle 8-point resize operations outside of StencilJS virtual DOM
 * to avoid re-render overhead during 60fps resize operations
 *
 * Uses interact.js for resize events with RAF batching
 * Only updates StencilJS state at the END of resize (triggers single re-render)
 */
/**
 * Extract transform position from element
 */
function getTransformPosition(element) {
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
class ResizeHandler {
    constructor(element, item, onUpdate) {
        this.resizeRafId = null;
        this.startRect = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
        this.element = element;
        this.item = item;
        this.onUpdate = onUpdate;
        this.initialize();
    }
    /**
     * Cleanup interact.js instance
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
    initialize() {
        const interact = window.interact;
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
    handleResizeMove(event) {
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
        // Commit to transform-based position (no left/top)
        event.target.style.transform = `translate(${newX}px, ${newY}px)`;
        event.target.style.width = newWidth + 'px';
        event.target.style.height = newHeight + 'px';
        event.target.removeAttribute('data-x');
        event.target.removeAttribute('data-y');
        // End performance tracking
        if (window.perfMonitor) {
            window.perfMonitor.endOperation('resize');
        }
        // Trigger StencilJS update (single re-render at end)
        this.onUpdate(this.item);
    }
}

const gridItemWrapperCss = ".grid-item{position:absolute;min-width:100px;min-height:80px;padding:20px 20px 20px 44px;border:2px solid transparent;border-radius:4px;background:white;box-shadow:0 2px 4px rgba(0, 0, 0, 10%);cursor:default;transition:border-color 0.2s, box-shadow 0.2s;will-change:transform;}.grid-item:hover{border-color:#4a90e2}.grid-item.selected{z-index:1000;border-color:#4a90e2;box-shadow:0 4px 12px rgba(74, 144, 226, 30%)}.grid-item.dragging{cursor:move;opacity:0.7}.grid-item.resizing{user-select:none}.grid-item-header{display:flex;align-items:center;gap:8px;margin:-20px -20px 12px -44px;padding:10px 16px 10px 50px;background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);border-bottom:1px solid #dee2e6;border-radius:4px 4px 0 0;color:#495057;font-size:13px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase}.grid-item-content{overflow:hidden;max-width:100%;color:#666;font-size:13px}.loading-placeholder{display:flex;height:100%;align-items:center;justify-content:center;color:#999;font-size:12px}.grid-item-controls{position:absolute;top:8px;right:8px;display:flex;gap:4px;opacity:0;transition:opacity 0.2s}.grid-item.selected .grid-item-controls,.grid-item:hover .grid-item-controls{opacity:1}.grid-item-control-btn{width:24px;height:24px;padding:0;border:none;border-radius:4px;background:#4a90e2;color:white;cursor:pointer;font-size:12px;line-height:1;transition:background 0.2s}.grid-item-control-btn:hover{background:#357abd}.grid-item-delete{width:24px;height:24px;padding:0;border:none;border-radius:50%;background:#f44;color:white;cursor:pointer;font-size:14px;line-height:1;transition:background 0.2s}.grid-item-delete:hover{background:#c00}.drag-handle{position:absolute;top:8px;left:8px;display:flex;width:28px;height:28px;align-items:center;justify-content:center;border:1px solid rgba(74, 144, 226, 30%);border-radius:4px;background:rgba(74, 144, 226, 10%);cursor:move;opacity:0.7;transition:all 0.2s}.drag-handle::before{color:#4a90e2;content:'⋮⋮';font-size:14px;font-weight:bold;letter-spacing:-2px}.drag-handle:hover{background:rgba(74, 144, 226, 25%);transform:scale(1.1)}.grid-item:hover .drag-handle{background:rgba(74, 144, 226, 15%);opacity:1}.resize-handle{position:absolute;width:10px;height:10px;border:2px solid white;border-radius:50%;background:#4a90e2;box-shadow:0 0 3px rgba(0, 0, 0, 30%);opacity:0;transition:opacity 0.2s}.grid-item.selected .resize-handle,.grid-item:hover .resize-handle{opacity:1}.resize-handle.nw{top:-5px;left:-5px;cursor:nw-resize}.resize-handle.ne{top:-5px;right:-5px;cursor:ne-resize}.resize-handle.sw{bottom:-5px;left:-5px;cursor:sw-resize}.resize-handle.se{right:-5px;bottom:-5px;cursor:se-resize}.resize-handle.n{top:-5px;left:50%;cursor:n-resize;transform:translateX(-50%)}.resize-handle.s{bottom:-5px;left:50%;cursor:s-resize;transform:translateX(-50%)}.resize-handle.e{top:50%;right:-5px;cursor:e-resize;transform:translateY(-50%)}.resize-handle.w{top:50%;left:-5px;cursor:w-resize;transform:translateY(-50%)}";

const GridItemWrapper = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemSnapshot = null;
        this.item = undefined;
        this.renderVersion = undefined;
        this.isSelected = false;
        this.isVisible = false;
    }
    componentWillLoad() {
        // Initial selection state
        this.isSelected = state.selectedItemId === this.item.id;
        // Store snapshot for undo/redo before operations
        this.captureItemSnapshot();
    }
    componentWillUpdate() {
        // Update selection state when state changes
        this.isSelected = state.selectedItemId === this.item.id;
        // Capture new snapshot after state update
        this.captureItemSnapshot();
    }
    componentDidLoad() {
        // Initialize drag and resize handlers
        this.dragHandler = new DragHandler(this.itemRef, this.item, this.handleItemUpdate.bind(this));
        this.resizeHandler = new ResizeHandler(this.itemRef, this.item, this.handleItemUpdate.bind(this));
        // Set up virtual rendering observer
        virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
            this.isVisible = isVisible;
        });
    }
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
        const itemClasses = {
            'grid-item': true,
            selected: this.isSelected,
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
    captureItemSnapshot() {
        // Deep clone the item to capture its state before drag/resize
        this.itemSnapshot = JSON.parse(JSON.stringify(this.item));
    }
    handleItemUpdate(updatedItem) {
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
    }
    handleClick(e) {
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
        // Dispatch event to open config panel
        const event = new CustomEvent('item-click', {
            detail: { itemId: this.item.id, canvasId: this.item.canvasId },
            bubbles: true,
            composed: true,
        });
        this.itemRef.dispatchEvent(event);
    }
    handleBringToFront() {
        const canvas = state.canvases[this.item.canvasId];
        const maxZ = Math.max(...canvas.items.map((i) => i.zIndex));
        this.item.zIndex = maxZ + 1;
        state.canvases = Object.assign({}, state.canvases); // Trigger update
    }
    handleSendToBack() {
        const canvas = state.canvases[this.item.canvasId];
        const minZ = Math.min(...canvas.items.map((i) => i.zIndex));
        this.item.zIndex = minZ - 1;
        state.canvases = Object.assign({}, state.canvases); // Trigger update
    }
    handleDelete() {
        // Dispatch event to grid-builder-app to handle
        const event = new CustomEvent('item-delete', {
            detail: { itemId: this.item.id, canvasId: this.item.canvasId },
            bubbles: true,
            composed: true,
        });
        this.itemRef.dispatchEvent(event);
    }
};
GridItemWrapper.style = gridItemWrapperCss;

export { GridItemWrapper as grid_item_wrapper };

//# sourceMappingURL=grid-item-wrapper.entry.js.map