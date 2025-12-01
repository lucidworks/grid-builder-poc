import { r as registerInstance, a as createEvent, h, d as getElement } from './index-CoCbyscT.js';

const layerPanelItemCss = ".layer-item{position:relative;display:flex;align-items:center;gap:8px;padding:8px;border-radius:4px;cursor:pointer;transition:background 180ms cubic-bezier(0.4, 0, 0.2, 1), border-color 180ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1), transform 120ms cubic-bezier(0.4, 0, 0.2, 1), opacity 120ms cubic-bezier(0.4, 0, 0.2, 1);background:#ffffff;border:1px solid #e0e0e0;margin-bottom:4px;user-select:none}.layer-item:hover{background:#f5f5f5;border-color:#4a90e2}.layer-item--active{background:#e3f2fd;border-color:#4a90e2;box-shadow:0 2px 4px rgba(74, 144, 226, 0.2)}.layer-item--active:hover{background:#d1e7f7}.layer-item.dragging{opacity:0.5;cursor:grabbing}.layer-item.drop-target{background:#f0f8ff;border-color:#4a90e2}.layer-item.drop-above::before{content:\"\";position:absolute;top:-2px;left:0;right:0;height:3px;background:#4a90e2;border-radius:2px;z-index:10;animation:dropIndicatorFadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1)}.layer-item.drop-below::after{content:\"\";position:absolute;bottom:-2px;left:0;right:0;height:3px;background:#4a90e2;border-radius:2px;z-index:10;animation:dropIndicatorFadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1)}.layer-item__drag-handle{display:flex;align-items:center;justify-content:center;width:20px;height:20px;cursor:grab;color:#9e9e9e;font-size:12px;line-height:1;flex-shrink:0}.layer-item__drag-handle:hover{color:#4a90e2}.layer-item__drag-handle:active{cursor:grabbing}.layer-item__icon{font-size:20px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.layer-item__info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.layer-item__name{font-size:14px;font-weight:500;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.layer-item__meta{font-size:11px;color:#757575;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@keyframes dropIndicatorFadeIn{from{opacity:0;transform:scaleX(0.8)}to{opacity:1;transform:scaleX(1)}}";

const LayerPanelItem = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.layerItemSelect = createEvent(this, "layerItemSelect", 7);
        this.layerItemDragStart = createEvent(this, "layerItemDragStart", 7);
        this.layerItemDrop = createEvent(this, "layerItemDrop", 7);
        /**
         * Whether this item is currently active/selected
         */
        this.isActive = false;
        /**
         * Initialize drag-to-reorder functionality
         *
         * Uses HTML5 drag and drop for list reordering.
         * Emits events for parent layer-panel to handle z-index updates.
         */
        this.initializeDrag = () => {
            // Make the entire item draggable
            this.hostElement.setAttribute("draggable", "true");
            // Drag start: store data and add visual feedback
            this.hostElement.addEventListener("dragstart", (e) => {
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", JSON.stringify({
                        itemId: this.itemId,
                        canvasId: this.canvasId,
                        zIndex: this.zIndex,
                    }));
                }
                // Add visual feedback
                this.hostElement.classList.add("dragging");
                // Emit drag start event
                this.layerItemDragStart.emit({
                    itemId: this.itemId,
                    canvasId: this.canvasId,
                    zIndex: this.zIndex,
                });
            });
            // Drag end: clean up
            this.hostElement.addEventListener("dragend", () => {
                this.hostElement.classList.remove("dragging", "drop-above", "drop-below", "drop-target");
            });
            // Drag over: show drop indicator
            this.hostElement.addEventListener("dragover", (e) => {
                e.preventDefault(); // Allow drop
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "move";
                }
                // Show drop indicator based on cursor position
                const rect = this.hostElement.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const dropAbove = e.clientY < midpoint;
                this.hostElement.classList.remove("drop-above", "drop-below");
                this.hostElement.classList.add("drop-target", dropAbove ? "drop-above" : "drop-below");
            });
            // Drag leave: remove drop indicator
            this.hostElement.addEventListener("dragleave", () => {
                this.hostElement.classList.remove("drop-target", "drop-above", "drop-below");
            });
            // Drop: handle the drop
            this.hostElement.addEventListener("drop", (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Calculate drop position (above or below this item)
                const rect = this.hostElement.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const dropAbove = e.clientY < midpoint;
                // Emit drop event with target information
                // The parent layer-panel will handle the actual state update
                const dropEvent = new CustomEvent("layer-item-dropped", {
                    detail: {
                        targetItemId: this.itemId,
                        targetCanvasId: this.canvasId,
                        targetZIndex: this.zIndex,
                        dropAbove,
                    },
                    bubbles: true,
                    composed: true,
                });
                this.hostElement.dispatchEvent(dropEvent);
                // Clean up visual feedback
                this.hostElement.classList.remove("drop-above", "drop-below", "drop-target");
            });
        };
        /**
         * Handle click to select this item
         */
        this.handleClick = () => {
            if (!this.isActive) {
                this.layerItemSelect.emit({
                    itemId: this.itemId,
                    canvasId: this.canvasId,
                });
            }
        };
    }
    /**
     * Component did load - initialize drag functionality
     */
    componentDidLoad() {
        this.initializeDrag();
    }
    /**
     * Cleanup on unmount
     * Note: HTML5 drag and drop event listeners are automatically cleaned up
     */
    disconnectedCallback() {
        // No manual cleanup needed for HTML5 drag and drop
    }
    /**
     * Get icon for component type
     *
     * Maps component types to emoji icons for visual identification.
     * Fallback to generic icon for unknown types.
     */
    getTypeIcon() {
        const iconMap = {
            header: "📄",
            text: "📝",
            image: "🖼️",
            button: "🔘",
            gallery: "🖼️",
            dashboard: "📊",
            livedata: "📈",
            card: "🃏",
            list: "📋",
        };
        return iconMap[this.type] || "📦";
    }
    render() {
        const itemClasses = {
            "layer-item": true,
            "layer-item--active": this.isActive,
        };
        return (h("div", { key: '37b13c35fc035b9d5c8688d52b1e35adb95fad08', class: itemClasses, onClick: this.handleClick }, h("div", { key: 'd249a0f75f0682b03bdaab1028da97634d1bbf86', class: "layer-item__drag-handle", title: "Drag to reorder" }, "\u22EE\u22EE"), h("div", { key: 'e95dfe0696c741387dec1b0ccd0dd602c180ff1b', class: "layer-item__icon" }, this.getTypeIcon()), h("div", { key: 'fbaa62d5f19e139d5b9cca0c05e086f20af96b36', class: "layer-item__info" }, h("div", { key: 'f3b10d1c476aace41ad5b16a29402fd007d53619', class: "layer-item__name" }, this.name), h("div", { key: '02bef2881d2040f5ccb43eb88f141220372db2a4', class: "layer-item__meta" }, this.type, " \u00B7 z:", this.zIndex))));
    }
    get hostElement() { return getElement(this); }
};
LayerPanelItem.style = layerPanelItemCss;

export { LayerPanelItem as layer_panel_item };
//# sourceMappingURL=layer-panel-item.entry.esm.js.map
