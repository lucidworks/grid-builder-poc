import { r as registerInstance, h, a as Host } from './index-ebe9feb4.js';
import { i as interact_min } from './interact.min-bef33ec6.js';
import { c as componentTemplates } from './component-templates-e71f1a8f.js';
import { s as state, g as generateItemId, a as addItemToCanvas, r as removeItemFromCanvas } from './state-manager-6c3d6100.js';
import { p as pushCommand, u as undo, r as redo } from './undo-redo-27e9fef6.js';
import { A as AddItemCommand, D as DeleteItemCommand, M as MoveItemCommand } from './undo-redo-commands-ad381a9f.js';
import { p as pixelsToGridX, a as pixelsToGridY } from './grid-calculations-54c868d5.js';
import './index-28d0c3f6.js';

/**
 * Virtual Rendering Utility
 * Lazy-load complex components using IntersectionObserver
 *
 * Purpose: Only initialize complex/heavy components when they become visible
 * This improves initial render performance and reduces memory usage
 */
/**
 * Virtual Renderer using IntersectionObserver
 * Observes grid items and initializes complex components when visible
 */
class VirtualRenderer {
    constructor() {
        this.visibleItems = new Set();
        this.intervalIds = new Map();
        // Create observer with 200px margin (pre-render before entering viewport)
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const itemElement = entry.target;
                const itemId = itemElement.id;
                const itemType = itemElement.getAttribute('data-item-type');
                if (entry.isIntersecting) {
                    // Item is visible - check if we need to initialize it
                    if (!this.visibleItems.has(itemId)) {
                        this.visibleItems.add(itemId);
                        this.initializeComplexComponent(itemId, itemType);
                    }
                }
                else {
                    // Item left viewport - cleanup if needed
                    this.visibleItems.delete(itemId);
                }
            });
        }, {
            rootMargin: '200px',
            threshold: 0.01, // Trigger when even 1% is visible
        });
    }
    /**
     * Start observing an element for lazy loading
     */
    observe(element, _itemId, itemType) {
        // Store item type as data attribute for retrieval in observer callback
        element.setAttribute('data-item-type', itemType);
        this.observer.observe(element);
    }
    /**
     * Stop observing an element
     */
    unobserve(itemId) {
        const element = document.getElementById(itemId);
        if (element) {
            this.observer.unobserve(element);
        }
        // Cleanup any intervals
        this.cleanup(itemId);
        this.visibleItems.delete(itemId);
    }
    /**
     * Destroy the virtual renderer
     */
    destroy() {
        this.observer.disconnect();
        // Cleanup all intervals
        this.intervalIds.forEach((intervalId) => clearInterval(intervalId));
        this.intervalIds.clear();
        this.visibleItems.clear();
    }
    /**
     * Cleanup resources for an item
     */
    cleanup(itemId) {
        const intervalId = this.intervalIds.get(itemId);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervalIds.delete(itemId);
        }
    }
    /**
     * Initialize complex component behavior
     * Only called when item becomes visible (via Intersection Observer)
     */
    initializeComplexComponent(itemId, type) {
        const contentEl = document.getElementById(`${itemId}-content`);
        if (!contentEl) {
            return;
        }
        // Check if already initialized (prevent double-init)
        if (contentEl.dataset.initialized === 'true') {
            return;
        }
        contentEl.dataset.initialized = 'true';
        switch (type) {
            case 'gallery':
                this.renderGallery(contentEl);
                break;
            case 'dashboard':
                this.renderDashboard(contentEl);
                break;
            case 'livedata':
                this.renderLiveData(contentEl, itemId);
                break;
        }
    }
    /**
     * Render image gallery component
     */
    renderGallery(contentEl) {
        contentEl.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; height: 100%;">
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 1">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 2">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 3">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 4">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 5">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 6">
        </div>
      </div>
    `;
    }
    /**
     * Render dashboard widget component
     */
    renderDashboard(contentEl) {
        contentEl.innerHTML = `
      <div style="font-size: 11px; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div style="flex: 1; padding: 6px; background: #f0f0f0; border-radius: 3px; margin-right: 4px;">
            <div style="font-weight: 600; color: #666;">Users</div>
            <div style="font-size: 16px; font-weight: 700; color: #4A90E2;">2,547</div>
          </div>
          <div style="flex: 1; padding: 6px; background: #f0f0f0; border-radius: 3px;">
            <div style="font-weight: 600; color: #666;">Revenue</div>
            <div style="font-size: 16px; font-weight: 700; color: #28a745;">$12.4K</div>
          </div>
        </div>
        <div style="background: #f8f8f8; padding: 8px; border-radius: 3px; margin-bottom: 6px;">
          <div style="font-weight: 600; margin-bottom: 4px;">Activity Chart</div>
          <div style="display: flex; align-items: flex-end; height: 40px; gap: 2px;">
            <div style="flex: 1; background: #4A90E2; height: 60%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 80%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 40%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 90%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 70%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 85%;"></div>
            <div style="flex: 1; background: #4A90E2; height: 95%;"></div>
          </div>
        </div>
        <div style="font-size: 10px; color: #999;">
          <div>• 24 active sessions</div>
          <div>• 156 page views</div>
          <div>• 89% bounce rate</div>
        </div>
      </div>
    `;
    }
    /**
     * Render live data component (with polling)
     */
    renderLiveData(contentEl, itemId) {
        let counter = 0;
        const updateLiveData = () => {
            counter++;
            const temperature = (20 + Math.random() * 10).toFixed(1);
            const cpu = (Math.random() * 100).toFixed(0);
            const memory = (40 + Math.random() * 50).toFixed(0);
            if (contentEl) {
                contentEl.innerHTML = `
          <div style="font-size: 11px;">
            <div style="margin-bottom: 8px; padding: 6px; background: #e3f2fd; border-radius: 3px;">
              <div style="font-weight: 600; color: #1976d2;">🌡️ Temperature</div>
              <div style="font-size: 20px; font-weight: 700; color: #1976d2;">${temperature}°C</div>
            </div>
            <div style="margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-weight: 600;">CPU</span>
                <span>${cpu}%</span>
              </div>
              <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #4A90E2; height: 100%; width: ${cpu}%; transition: width 0.5s;"></div>
              </div>
            </div>
            <div style="margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-weight: 600;">Memory</span>
                <span>${memory}%</span>
              </div>
              <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: #28a745; height: 100%; width: ${memory}%; transition: width 0.5s;"></div>
              </div>
            </div>
            <div style="font-size: 10px; color: #999; margin-top: 8px;">
              Updated ${counter} times • Last: ${new Date().toLocaleTimeString()}
            </div>
          </div>
        `;
            }
        };
        // Initial render
        updateLiveData();
        // Poll every 2 seconds
        const intervalId = window.setInterval(updateLiveData, 2000);
        // Store interval ID for cleanup
        this.intervalIds.set(itemId, intervalId);
    }
}

const gridBuilderAppCss = "*{box-sizing:border-box;padding:0;margin:0}body{overflow:hidden;height:100vh;background:#f5f5f5;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif}.app{display:flex;height:100vh}.canvas{position:relative;overflow:auto;flex:1;padding:20px}.canvas-header{padding:15px 20px;border-radius:4px;margin-bottom:20px;background:white;box-shadow:0 2px 4px rgba(0, 0, 0, 5%)}.canvas-header h1{margin-bottom:10px;color:#333;font-size:24px}.canvas-header p{margin-bottom:15px;color:#666}.controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px}.controls button{padding:8px 16px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:14px;transition:all 0.2s}.controls button:hover{border-color:#4a90e2;background:#f5f5f5}.controls button.active{border-color:#4a90e2;background:#4a90e2;color:white}.viewport-toggle{display:flex;overflow:hidden;border:1px solid #ddd;border-radius:4px;gap:5px}.viewport-btn{padding:8px 16px;border:none;background:white;cursor:pointer;font-size:14px;transition:all 0.2s}.viewport-btn:hover{background:#f5f5f5}.viewport-btn.active{background:#4a90e2;color:white}.version-switcher{display:flex;align-items:center;margin-left:auto;gap:8px}.version-switcher-label{color:#666;font-size:12px;font-weight:500}.version-switcher select{padding:6px 12px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px}.canvases-container{display:flex;flex-direction:column;gap:0}.canvases-container.mobile-view{max-width:375px;margin:0 auto;box-shadow:0 0 20px rgba(0, 0, 0, 10%)}";

const GridBuilderApp = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemCount = 0;
    }
    componentWillLoad() {
        // Expose interact to global scope before child components load
        // This ensures drag/resize handlers in grid-item-wrapper can initialize
        window.interact = interact_min;
        // Initial item count
        this.updateItemCount();
    }
    componentWillUpdate() {
        // Update item count when state changes
        this.updateItemCount();
    }
    componentDidLoad() {
        // Initialize item count
        this.updateItemCount();
        // Initialize performance monitor (from shared library)
        if (window.PerformanceMonitor) {
            window.perfMonitor = new window.PerformanceMonitor('stencil');
        }
        // Initialize global VirtualRenderer for lazy-loading complex components
        window.virtualRenderer = new VirtualRenderer();
        // Add debug helper to inspect all interactables
        window.debugInteractables = () => {
            const interactables = interact_min.interactables.list;
            console.log('Total interactables:', interactables.length);
            interactables.forEach((interactable, index) => {
                console.log(`Interactable ${index}:`, {
                    target: interactable.target,
                    actions: interactable._actions,
                    options: interactable.options,
                });
            });
        };
        // Set up keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }
    disconnectedCallback() {
        document.removeEventListener('keydown', this.handleKeyboard.bind(this));
    }
    handleCanvasDrop(event) {
        const { canvasId, componentType, x, y } = event.detail;
        // Get template for the component type
        const template = componentTemplates[componentType];
        if (!template) {
            console.error('Unknown component type:', componentType);
            return;
        }
        // Convert pixel coordinates to grid units
        const gridX = pixelsToGridX(x, canvasId);
        const gridY = pixelsToGridY(y);
        // Get canvas to determine next z-index
        const canvas = state.canvases[canvasId];
        if (!canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        // Create new item
        const newItem = {
            id: generateItemId(),
            canvasId,
            type: componentType,
            name: template.title,
            layouts: {
                desktop: {
                    x: gridX,
                    y: gridY,
                    width: 10,
                    height: 6, // Default 6 grid units tall
                },
                mobile: {
                    x: null,
                    y: null,
                    width: null,
                    height: null,
                    customized: false,
                },
            },
            zIndex: canvas.zIndexCounter++,
        };
        // Add item to canvas
        addItemToCanvas(canvasId, newItem);
        // Push undo command
        pushCommand(new AddItemCommand(canvasId, newItem));
        // Trigger update
        state.canvases = Object.assign({}, state.canvases);
    }
    handleItemDelete(event) {
        const { itemId, canvasId } = event.detail;
        // Find the item and its index before deletion
        const canvas = state.canvases[canvasId];
        if (!canvas) {
            return;
        }
        const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
        const item = canvas.items[itemIndex];
        if (!item) {
            return;
        }
        // Push undo command before deleting
        pushCommand(new DeleteItemCommand(canvasId, item, itemIndex));
        // Delete the item
        removeItemFromCanvas(canvasId, itemId);
        state.canvases = Object.assign({}, state.canvases);
    }
    handleCanvasMove(event) {
        const { itemId, sourceCanvasId, targetCanvasId, x, y } = event.detail;
        // Find the item in the source canvas
        const sourceCanvas = state.canvases[sourceCanvasId];
        const sourceIndex = sourceCanvas.items.findIndex((i) => i.id === itemId);
        const item = sourceCanvas.items[sourceIndex];
        if (!item) {
            return;
        }
        // Capture source position
        const sourcePosition = {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
        };
        // Convert pixel position to grid units
        const gridX = pixelsToGridX(x, targetCanvasId);
        const gridY = pixelsToGridY(y);
        // Capture target position
        const targetPosition = {
            x: gridX,
            y: gridY,
        };
        // Push undo command before moving
        pushCommand(new MoveItemCommand(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, sourceIndex));
        // Update item's canvas ID and position
        item.canvasId = targetCanvasId;
        item.layouts.desktop.x = gridX;
        item.layouts.desktop.y = gridY;
        // Remove from source canvas
        sourceCanvas.items = sourceCanvas.items.filter((i) => i.id !== itemId);
        // Add to target canvas
        const targetCanvas = state.canvases[targetCanvasId];
        targetCanvas.items.push(item);
        // Trigger update
        state.canvases = Object.assign({}, state.canvases);
    }
    render() {
        const canvasIds = Object.keys(state.canvases);
        return (h(Host, null, h("div", { class: "app" }, h("component-palette", null), h("div", { class: "canvas" }, h("div", { class: "canvas-header" }, h("h1", null, "Grid Builder POC - StencilJS Variant"), h("p", null, "Drag components from the palette into the page sections below. Build your page layout section by section."), h("div", { class: "controls" }, h("div", { class: "viewport-toggle" }, h("button", { class: {
                'viewport-btn': true,
                active: state.currentViewport === 'desktop',
            }, onClick: () => this.handleViewportChange('desktop') }, "\uD83D\uDDA5\uFE0F Desktop"), h("button", { class: {
                'viewport-btn': true,
                active: state.currentViewport === 'mobile',
            }, onClick: () => this.handleViewportChange('mobile') }, "\uD83D\uDCF1 Mobile")), h("button", { class: { active: state.showGrid }, onClick: () => this.handleGridToggle() }, state.showGrid ? 'Show Grid' : 'Hide Grid'), h("button", { onClick: () => this.handleExportState() }, "Export State"), h("button", { onClick: () => this.handleAddSection() }, "\u2795 Add Section"), h("button", { onClick: () => this.handleStressTest() }, "\uD83D\uDE80 Stress Test"), h("div", { style: {
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: '12px',
                padding: '6px 12px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
            } }, h("span", { style: { fontSize: '11px', color: '#666', marginLeft: '4px' } }, this.itemCount, " items")), h("div", { class: "version-switcher" }, h("span", { class: "version-switcher-label" }, "Version:"), h("select", { onChange: (e) => (window.location.href = e.target.value) }, h("option", { value: "../left-top/" }, "Left/Top"), h("option", { value: "../transform/" }, "Transform \uD83E\uDDEA"), h("option", { value: "../masonry/" }, "Masonry \uD83E\uDDEA"), h("option", { value: "../virtual/" }, "Virtual \uD83E\uDDEA"), h("option", { value: "../stencil/", selected: true }, "StencilJS \uD83E\uDDEA"))))), h("div", { class: {
                'canvases-container': true,
                'mobile-view': state.currentViewport === 'mobile',
            } }, canvasIds.map((canvasId, index) => (h("canvas-section", { canvasId: canvasId, sectionNumber: index + 1, key: canvasId })))))), h("config-panel", null)));
    }
    updateItemCount() {
        this.itemCount = Object.values(state.canvases).reduce((sum, canvas) => sum + canvas.items.length, 0);
    }
    handleKeyboard(e) {
        // Undo (Ctrl+Z or Cmd+Z)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
            return;
        }
        // Redo (Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
            return;
        }
        // Delete key
        if (e.key === 'Delete' && state.selectedItemId) {
            this.handleDeleteSelected();
        }
        // Escape key
        if (e.key === 'Escape') {
            state.selectedItemId = null;
            state.selectedCanvasId = null;
        }
    }
    handleDeleteSelected() {
        if (!state.selectedItemId || !state.selectedCanvasId) {
            return;
        }
        const canvas = state.canvases[state.selectedCanvasId];
        if (!canvas) {
            return;
        }
        // Find the item and its index before deletion
        const itemIndex = canvas.items.findIndex((i) => i.id === state.selectedItemId);
        const item = canvas.items[itemIndex];
        if (!item) {
            return;
        }
        // Push undo command before deleting
        pushCommand(new DeleteItemCommand(state.selectedCanvasId, item, itemIndex));
        // Delete the item
        canvas.items = canvas.items.filter((i) => i.id !== state.selectedItemId);
        state.selectedItemId = null;
        state.selectedCanvasId = null;
        // Trigger update
        state.canvases = Object.assign({}, state.canvases);
    }
    handleViewportChange(viewport) {
        /**
         * Viewport switching with automatic read/write batching:
         *
         * 1. Setting currentViewport triggers re-render of all grid-item-wrapper components
         * 2. Each component's render() calls gridToPixelsX() which uses getGridSizeHorizontal()
         * 3. Grid size caching ensures container.clientWidth is only read once per canvas
         * 4. All subsequent components use the cached grid size (no DOM reads)
         * 5. StencilJS automatically batches all resulting DOM writes
         *
         * Result: With 100+ items, only 1 DOM read per canvas instead of 100+,
         * and all style updates are batched by StencilJS for a single reflow
         */
        state.currentViewport = viewport;
    }
    handleGridToggle() {
        state.showGrid = !state.showGrid;
    }
    handleExportState() {
        const state$1 = {
            canvases: state.canvases,
            currentViewport: state.currentViewport,
            timestamp: new Date().toISOString(),
        };
        console.log('Grid State:', state$1);
        alert(`Grid state exported to console!\n\nTotal Items: ${this.itemCount}\nViewport: ${state.currentViewport}`);
    }
    handleAddSection() {
        // Add new section logic
        const canvasIds = Object.keys(state.canvases);
        const nextId = canvasIds.length + 1;
        const newCanvasId = `canvas${nextId}`;
        state.canvases = Object.assign(Object.assign({}, state.canvases), { [newCanvasId]: {
                items: [],
                zIndexCounter: 1,
                backgroundColor: '#ffffff',
            } });
        alert(`Section ${nextId} added!`);
    }
    handleStressTest() {
        // Prompt for number of items
        const input = prompt('How many items to add? (1-1000)', '100');
        if (!input) {
            return;
        }
        const count = parseInt(input, 10);
        if (isNaN(count) || count < 1 || count > 1000) {
            alert('Please enter a number between 1 and 1000');
            return;
        }
        // Get available component types
        const componentTypes = Object.keys(componentTemplates);
        const canvasIds = Object.keys(state.canvases);
        // Add items
        for (let i = 0; i < count; i++) {
            // Random component type
            const componentType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
            const template = componentTemplates[componentType];
            // Random canvas
            const canvasId = canvasIds[Math.floor(Math.random() * canvasIds.length)];
            const canvas = state.canvases[canvasId];
            // Random position (0-40 grid units horizontally, 0-100 grid units vertically)
            const gridX = Math.floor(Math.random() * 40);
            const gridY = Math.floor(Math.random() * 100);
            // Create new item
            const newItem = {
                id: generateItemId(),
                canvasId,
                type: componentType,
                name: `${template.title} ${i + 1}`,
                layouts: {
                    desktop: {
                        x: gridX,
                        y: gridY,
                        width: 10,
                        height: 6, // Default 6 grid units tall
                    },
                    mobile: {
                        x: null,
                        y: null,
                        width: null,
                        height: null,
                        customized: false,
                    },
                },
                zIndex: canvas.zIndexCounter++,
            };
            // Add item to canvas (without pushing undo command to avoid history bloat)
            addItemToCanvas(canvasId, newItem);
        }
        // Trigger single update after all items added
        state.canvases = Object.assign({}, state.canvases);
        alert(`Added ${count} items!`);
    }
};
GridBuilderApp.style = gridBuilderAppCss;

export { GridBuilderApp as grid_builder_app };

//# sourceMappingURL=grid-builder-app.entry.js.map