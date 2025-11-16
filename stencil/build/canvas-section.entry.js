import { r as registerInstance, h } from './index-ebe9feb4.js';
import { i as interact_min } from './interact.min-bef33ec6.js';
import { s as state, o as onChange } from './state-manager-6c3d6100.js';
import { c as clearGridSizeCache, g as gridToPixelsX, b as gridToPixelsY } from './grid-calculations-54c868d5.js';
import './index-28d0c3f6.js';

const canvasSectionCss = ".canvas-item{position:relative;display:flex;width:100%;flex-direction:column}.canvas-item-header{position:absolute;z-index:1000;top:10px;right:10px;display:flex;align-items:center;padding:8px 12px;border-radius:4px;background:rgba(255, 255, 255, 95%);box-shadow:0 2px 4px rgba(0, 0, 0, 10%);color:#666;font-size:12px;gap:10px;opacity:0.7;transition:opacity 0.2s}.canvas-item:hover .canvas-item-header{opacity:1}.canvas-item-header h3{margin:0;color:#999;font-size:11px;letter-spacing:0.5px;text-transform:uppercase}.canvas-controls{display:flex;align-items:center;gap:8px}.canvas-controls label{display:flex;align-items:center;color:#999;cursor:pointer;font-size:11px;gap:4px}.canvas-bg-color{width:30px;height:24px;border:1px solid #ddd;border-radius:3px;cursor:pointer}.clear-canvas-btn,.delete-section-btn{padding:4px 10px;border:1px solid #ddd;border-radius:3px;background:white;color:#666;cursor:pointer;font-size:11px;transition:all 0.2s}.clear-canvas-btn:hover{border-color:#4a90e2;background:#f5f5f5;color:#4a90e2}.delete-section-btn{padding:4px 8px}.delete-section-btn:hover{border-color:#dc3545;background:#fee}.grid-builder{width:100%;padding:0;border-radius:0;margin-bottom:0;background:transparent}.grid-container{position:relative;width:100%;min-height:400px;background-image:linear-gradient(rgba(0, 0, 0, 5%) 1px, transparent 1px),\n    linear-gradient(90deg, rgba(0, 0, 0, 5%) 1px, transparent 1px);background-size:2% 20px;transition:background-color 0.2s}.grid-container.hide-grid{background-image:none}";

const CanvasSection = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.dropzoneInitialized = false;
        this.canvasId = undefined;
        this.sectionNumber = undefined;
        this.canvas = undefined;
        this.renderVersion = 0;
    }
    componentWillLoad() {
        // Initial load
        this.canvas = state.canvases[this.canvasId];
        // Subscribe to state changes
        onChange('canvases', () => {
            // Guard against accessing properties when component is not fully initialized
            try {
                if (this.canvasId && state.canvases[this.canvasId]) {
                    this.canvas = state.canvases[this.canvasId];
                    this.renderVersion++; // Force re-render
                }
            }
            catch (_e) {
                // Component may not be fully initialized yet (e.g., during test setup)
            }
        });
    }
    componentWillUpdate() {
        // Update canvas reference when state changes
        this.canvas = state.canvases[this.canvasId];
    }
    componentDidLoad() {
        this.initializeDropzone();
        this.setupResizeObserver();
    }
    disconnectedCallback() {
        // Cleanup interact.js
        if (this.gridContainerRef && this.dropzoneInitialized) {
            interact_min(this.gridContainerRef).unset();
        }
        // Cleanup ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    setupResizeObserver() {
        if (!this.gridContainerRef) {
            return;
        }
        // Watch for canvas container size changes
        this.resizeObserver = new ResizeObserver(() => {
            // Clear grid size cache when container resizes
            clearGridSizeCache();
            // Force re-render to update item positions
            this.renderVersion++;
        });
        this.resizeObserver.observe(this.gridContainerRef);
    }
    render() {
        var _a, _b;
        const showGrid = state.showGrid;
        const backgroundColor = ((_a = this.canvas) === null || _a === void 0 ? void 0 : _a.backgroundColor) || '#ffffff';
        return (h("div", { class: "canvas-item", "data-canvas-id": this.canvasId }, h("div", { class: "canvas-item-header" }, h("h3", null, "Section ", this.sectionNumber), h("div", { class: "canvas-controls" }, h("label", null, h("input", { type: "color", class: "canvas-bg-color", value: backgroundColor, onInput: (e) => this.handleColorChange(e) })), h("button", { class: "clear-canvas-btn", onClick: () => this.handleClearCanvas() }, "Clear"), h("button", { class: "delete-section-btn", onClick: () => this.handleDeleteSection(), title: "Delete Section" }, "\uD83D\uDDD1\uFE0F"))), h("div", { class: "grid-builder" }, h("div", { class: {
                'grid-container': true,
                'hide-grid': !showGrid,
            }, id: this.canvasId, "data-canvas-id": this.canvasId, style: {
                backgroundColor,
            }, ref: (el) => (this.gridContainerRef = el) }, (_b = this.canvas) === null || _b === void 0 ? void 0 : _b.items.map((item) => (h("grid-item-wrapper", { key: item.id, item: item, renderVersion: this.renderVersion })))))));
    }
    initializeDropzone() {
        if (!this.gridContainerRef || this.dropzoneInitialized) {
            return;
        }
        const interactable = interact_min(this.gridContainerRef);
        interactable.dropzone({
            accept: '.palette-item, .grid-item',
            overlap: 'pointer',
            checker: (_dragEvent, _event, dropped) => {
                return dropped;
            },
            ondrop: (event) => {
                const droppedElement = event.relatedTarget;
                const isPaletteItem = droppedElement.classList.contains('palette-item');
                const isGridItem = droppedElement.classList.contains('grid-item');
                if (isPaletteItem) {
                    // Dropping from palette - create new item
                    const componentType = droppedElement.getAttribute('data-component-type');
                    // Calculate half dimensions for centering (default: 10 units wide, 6 units tall)
                    const defaultWidth = 10;
                    const defaultHeight = 6;
                    const widthPx = gridToPixelsX(defaultWidth, this.canvasId);
                    const heightPx = gridToPixelsY(defaultHeight);
                    const halfWidth = widthPx / 2;
                    const halfHeight = heightPx / 2;
                    // Get drop position relative to grid container
                    const rect = this.gridContainerRef.getBoundingClientRect();
                    const x = event.dragEvent.clientX - rect.left - halfWidth;
                    const y = event.dragEvent.clientY - rect.top - halfHeight;
                    // Dispatch custom event for grid-builder-app to handle
                    const dropEvent = new CustomEvent('canvas-drop', {
                        detail: {
                            canvasId: this.canvasId,
                            componentType,
                            x,
                            y,
                        },
                        bubbles: true,
                        composed: true,
                    });
                    this.gridContainerRef.dispatchEvent(dropEvent);
                }
                else if (isGridItem) {
                    // Moving existing grid item to different canvas
                    const itemId = droppedElement.id;
                    const sourceCanvasId = droppedElement.getAttribute('data-canvas-id');
                    // Only process if moving to a different canvas
                    if (sourceCanvasId !== this.canvasId) {
                        // For cross-canvas moves, get the element's actual screen position
                        // (the drag handler has already positioned it during the drag)
                        const droppedRect = droppedElement.getBoundingClientRect();
                        const rect = this.gridContainerRef.getBoundingClientRect();
                        // Use the element's top-left corner relative to the target canvas
                        const x = droppedRect.left - rect.left;
                        const y = droppedRect.top - rect.top;
                        // Dispatch custom event for moving item between canvases
                        const moveEvent = new CustomEvent('canvas-move', {
                            detail: {
                                itemId,
                                sourceCanvasId,
                                targetCanvasId: this.canvasId,
                                x,
                                y,
                            },
                            bubbles: true,
                            composed: true,
                        });
                        this.gridContainerRef.dispatchEvent(moveEvent);
                    }
                }
            },
        });
        this.dropzoneInitialized = true;
    }
    handleColorChange(e) {
        const target = e.target;
        const color = target.value;
        // Update state
        this.canvas.backgroundColor = color;
        state.canvases = Object.assign({}, state.canvases); // Trigger update
        // Also update DOM directly for immediate feedback
        if (this.gridContainerRef) {
            this.gridContainerRef.style.backgroundColor = color;
        }
    }
    handleClearCanvas() {
        if (confirm(`Are you sure you want to clear all items from this section?`)) {
            // Clear items from state
            this.canvas.items = [];
            state.canvases = Object.assign({}, state.canvases); // Trigger update
            // Clear selection if on this canvas
            if (state.selectedCanvasId === this.canvasId) {
                state.selectedItemId = null;
                state.selectedCanvasId = null;
            }
            // Reset canvas height
            if (this.gridContainerRef) {
                this.gridContainerRef.style.minHeight = '400px';
            }
        }
    }
    handleDeleteSection() {
        if (this.canvas.items.length > 0) {
            if (!confirm(`This section has ${this.canvas.items.length} items. Are you sure you want to delete it?`)) {
                return;
            }
        }
        // Dispatch custom event for grid-builder-app to handle
        const deleteEvent = new CustomEvent('section-delete', {
            detail: { canvasId: this.canvasId },
            bubbles: true,
            composed: true,
        });
        this.gridContainerRef.dispatchEvent(deleteEvent);
    }
};
CanvasSection.style = canvasSectionCss;

export { CanvasSection as canvas_section };

//# sourceMappingURL=canvas-section.entry.js.map