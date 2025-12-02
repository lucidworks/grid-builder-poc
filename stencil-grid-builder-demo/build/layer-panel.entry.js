import { r as registerInstance, h, d as getElement } from './index-CoCbyscT.js';

const layerPanelCss = ".layer-panel{display:flex;flex-direction:column;width:100%;background:#fafafa;overflow:hidden;box-sizing:border-box}.layer-panel__header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e0e0e0;background:#ffffff}.layer-panel__title{margin:0;font-size:16px;font-weight:600;color:#333}.layer-panel__count{font-size:12px;color:#757575;background:#f5f5f5;padding:2px 8px;border-radius:12px}.layer-panel__search{padding:12px 16px;border-bottom:1px solid #e0e0e0;background:#ffffff}.layer-panel__search-input{width:100%;padding:8px 12px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;outline:none;transition:border-color 0.2s ease;box-sizing:border-box}.layer-panel__search-input:focus{border-color:#4a90e2;box-shadow:0 0 0 2px rgba(74, 144, 226, 0.1)}.layer-panel__search-input::placeholder{color:#9e9e9e}.layer-panel__list{overflow-x:hidden;padding:8px;background:#fafafa;width:100%;box-sizing:border-box;min-height:400px;}.layer-panel__list::-webkit-scrollbar{width:8px}.layer-panel__list::-webkit-scrollbar-track{background:#f5f5f5}.layer-panel__list::-webkit-scrollbar-thumb{background:#ccc;border-radius:4px}.layer-panel__list::-webkit-scrollbar-thumb:hover{background:#aaa}.layer-panel__list-inner{position:relative;min-height:100%;width:100%;box-sizing:border-box}.layer-panel__visible-items{position:absolute;width:100%;will-change:transform}.layer-panel__empty{text-align:center;padding:32px 16px;color:#9e9e9e;font-size:14px}.layer-panel__footer{padding:8px 16px;border-top:1px solid #e0e0e0;background:#ffffff}.layer-panel__hint{font-size:11px;color:#757575;text-align:center}";

const LayerPanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Canvas metadata for folder titles
         * Map of canvasId → { title: string }
         */
        this.canvasMetadata = {};
        /**
         * Height of folder header in pixels
         * @default 40
         */
        this.folderHeight = 40;
        /**
         * Height of layer item in pixels
         * @default 40
         */
        this.itemHeight = 40;
        /**
         * Number of items to render in virtual window
         * @default 50
         */
        this.virtualWindowSize = 50;
        /**
         * Pre-render buffer in pixels (renders items outside viewport)
         * @default 200
         */
        this.virtualBufferPx = 200;
        /**
         * Search input debounce delay in milliseconds
         * @default 300
         */
        this.searchDebounceMs = 300;
        /**
         * All items from all canvases, sorted by z-index (descending)
         */
        this.allItems = [];
        /**
         * Filtered items (after search)
         */
        this.filteredItems = [];
        /**
         * Search query for filtering items
         */
        this.searchQuery = "";
        /**
         * Folder expand/collapse state
         * Map of canvasId → isExpanded
         * Default: active canvas expanded, others collapsed
         */
        this.folderExpandedState = {};
        /**
         * Current search debounce timer
         */
        this.searchDebounceTimer = null;
        /**
         * Virtual scrolling: first visible item index
         */
        this.virtualScrollOffset = 0;
        /**
         * Event listener cleanup functions
         */
        this.cleanupFunctions = [];
        /**
         * Drag state tracking
         * Stores information about the item currently being dragged
         */
        this.draggedItem = null;
        /**
         * Setup layer panel (called when API becomes available)
         */
        this.setupLayerPanel = () => {
            console.log("🔧 setupLayerPanel called");
            if (!this.api) {
                console.warn("  ⚠️ No API - aborting");
                return;
            }
            // Prevent double initialization
            if (this.cleanupFunctions.length > 0) {
                console.log("  ℹ️ Already initialized, skipping");
                return;
            }
            // Initialize folder expanded state
            // Default: active canvas expanded, others collapsed
            this.initializeFolderState();
            // Initial data load
            this.refreshItems();
            // Subscribe to API events for state changes
            const refreshHandler = () => {
                this.refreshItems();
            };
            // Listen to all events that modify items
            this.api.on("componentAdded", refreshHandler);
            this.api.on("componentDeleted", refreshHandler);
            this.api.on("componentDragged", refreshHandler);
            this.api.on("componentResized", refreshHandler);
            this.api.on("componentsBatchAdded", refreshHandler);
            this.api.on("componentsBatchDeleted", refreshHandler);
            this.api.on("zIndexChanged", refreshHandler);
            this.api.on("zIndexBatchChanged", refreshHandler);
            // Store cleanup functions
            this.cleanupFunctions.push(() => {
                this.api.off("componentAdded", refreshHandler);
                this.api.off("componentDeleted", refreshHandler);
                this.api.off("componentDragged", refreshHandler);
                this.api.off("componentResized", refreshHandler);
                this.api.off("componentsBatchAdded", refreshHandler);
                this.api.off("componentsBatchDeleted", refreshHandler);
                this.api.off("zIndexChanged", refreshHandler);
                this.api.off("zIndexBatchChanged", refreshHandler);
            });
            // Subscribe to selection/canvas changes for visual feedback
            const visualUpdateHandler = () => {
                // Force re-render to update visual feedback
                this.allItems = [...this.allItems];
            };
            this.api.on("componentSelected", visualUpdateHandler);
            this.api.on("canvasActivated", visualUpdateHandler);
            this.cleanupFunctions.push(() => {
                this.api.off("componentSelected", visualUpdateHandler);
                this.api.off("canvasActivated", visualUpdateHandler);
            });
            // Subscribe to canvas activation to auto-expand the active section
            const canvasActivationHandler = () => {
                const state = this.api.getState();
                const activeCanvasId = state.activeCanvasId;
                if (activeCanvasId) {
                    console.log("📁 Canvas activated, expanding folder:", activeCanvasId);
                    // Update folder state to expand only the active canvas
                    const newFolderState = {};
                    Object.keys(state.canvases).forEach((canvasId) => {
                        newFolderState[canvasId] = canvasId === activeCanvasId;
                    });
                    this.folderExpandedState = newFolderState;
                }
            };
            this.api.on("canvasActivated", canvasActivationHandler);
            this.cleanupFunctions.push(() => {
                this.api.off("canvasActivated", canvasActivationHandler);
            });
            // Initialize virtual scrolling
            this.initializeVirtualScrolling();
        };
        /**
         * Initialize folder expanded state
         * Default: active canvas expanded, others collapsed
         */
        this.initializeFolderState = () => {
            console.log("📁 initializeFolderState called");
            if (!this.api) {
                console.warn("  ⚠️ No API - aborting");
                return;
            }
            const state = this.api.getState();
            const activeCanvasId = state.activeCanvasId;
            console.log("  Active canvas:", activeCanvasId);
            const folderState = {};
            Object.keys(state.canvases).forEach((canvasId) => {
                folderState[canvasId] = canvasId === activeCanvasId;
            });
            console.log("  Folder state:", folderState);
            this.folderExpandedState = folderState;
        };
        /**
         * Refresh item list from grid state
         *
         * Aggregates all items from all canvases and sorts by z-index (descending).
         * Top items (highest z-index) appear first in the list.
         */
        this.refreshItems = () => {
            console.log("🔄 refreshItems called");
            if (!this.api) {
                console.warn("  ⚠️ No API - aborting");
                return;
            }
            const state = this.api.getState();
            console.log("  State from API:", state);
            console.log("  Canvases:", Object.keys(state.canvases || {}));
            const items = [];
            // Collect all items from all canvases
            Object.entries(state.canvases).forEach(([canvasId, canvas]) => {
                var _a;
                console.log(`  Canvas ${canvasId}: ${((_a = canvas.items) === null || _a === void 0 ? void 0 : _a.length) || 0} items`);
                canvas.items.forEach((item) => {
                    items.push(Object.assign(Object.assign({}, item), { canvasId }));
                });
            });
            console.log(`  Total items collected: ${items.length}`);
            // Sort by z-index (descending - highest first)
            items.sort((a, b) => b.zIndex - a.zIndex);
            this.allItems = items;
            console.log("  this.allItems set to:", this.allItems.length, "items");
            this.applySearchFilter();
            console.log("  After filter:", this.filteredItems.length, "items");
        };
        /**
         * Apply search filter to items
         *
         * Filters items by name (case-insensitive substring match).
         * Performance: <5ms for 1000 items, <10ms for 5000 items
         */
        this.applySearchFilter = () => {
            if (!this.searchQuery) {
                this.filteredItems = this.allItems;
                return;
            }
            const query = this.searchQuery.toLowerCase();
            this.filteredItems = this.allItems.filter((item) => item.name.toLowerCase().includes(query));
        };
        /**
         * Handle search input change with debouncing
         *
         * Debounces search input using configurable delay (default 300ms)
         * to prevent excessive filtering on every keystroke.
         */
        this.handleSearchInput = (event) => {
            const input = event.target;
            const value = input.value;
            // Clear existing timer
            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
            }
            // Debounce by configurable delay
            this.searchDebounceTimer = window.setTimeout(() => {
                this.searchQuery = value;
                this.applySearchFilter();
            }, this.searchDebounceMs);
        };
        /**
         * Group items by canvas for folder rendering
         */
        this.groupItemsByCanvas = (items) => {
            const grouped = {};
            items.forEach((item) => {
                if (!grouped[item.canvasId]) {
                    grouped[item.canvasId] = [];
                }
                grouped[item.canvasId].push(item);
            });
            return grouped;
        };
        /**
         * Get canvas title from metadata or fallback to canvasId
         */
        this.getCanvasTitle = (canvasId) => {
            var _a, _b;
            return ((_b = (_a = this.canvasMetadata) === null || _a === void 0 ? void 0 : _a[canvasId]) === null || _b === void 0 ? void 0 : _b.title) || canvasId;
        };
        /**
         * Toggle folder expand/collapse state
         */
        this.toggleFolder = (canvasId) => {
            this.folderExpandedState = Object.assign(Object.assign({}, this.folderExpandedState), { [canvasId]: !this.folderExpandedState[canvasId] });
        };
        /**
         * Initialize virtual scrolling
         *
         * Sets up scroll event listener for variable-height virtual rendering.
         * Supports configurable item/folder heights and buffer zones.
         *
         * Performance target: <16ms per scroll frame (60fps)
         */
        this.initializeVirtualScrolling = () => {
            const scrollContainer = this.hostElement.querySelector(".layer-panel__list");
            if (!scrollContainer)
                return;
            // Track scroll position for virtual rendering
            scrollContainer.addEventListener("scroll", () => {
                const scrollTop = scrollContainer.scrollTop;
                this.virtualScrollOffset = scrollTop;
            });
        };
        /**
         * Build virtual items list with position cache
         *
         * Creates a flattened list of folders and items with their heights and cumulative offsets.
         * This allows for accurate virtual scrolling with variable-height items.
         * @returns Array of virtual items with position information
         */
        this.buildVirtualItemsList = () => {
            const virtualItems = [];
            let currentOffset = 0;
            // Group items by canvas
            const allItemsByCanvas = this.groupItemsByCanvas(this.allItems);
            const filteredItemsByCanvas = this.groupItemsByCanvas(this.filteredItems);
            // Build virtual items list (folders + items)
            // Iterate in canvasMetadata order to match visual order on page
            const canvasOrder = this.canvasMetadata
                ? Object.keys(this.canvasMetadata)
                : Object.keys(allItemsByCanvas);
            canvasOrder.forEach((canvasId) => {
                var _a;
                // Skip canvases that don't exist in state (e.g., removed canvases)
                if (!allItemsByCanvas[canvasId])
                    return;
                const allCanvasItems = allItemsByCanvas[canvasId] || [];
                const filteredCanvasItems = filteredItemsByCanvas[canvasId] || [];
                const isExpanded = (_a = this.folderExpandedState[canvasId]) !== null && _a !== void 0 ? _a : true;
                const isEmpty = this.searchQuery && filteredCanvasItems.length === 0;
                // Add folder header
                virtualItems.push({
                    type: "folder",
                    data: {
                        canvasId,
                        title: this.getCanvasTitle(canvasId),
                        itemCount: filteredCanvasItems.length,
                        totalItemCount: allCanvasItems.length,
                        isEmpty,
                    },
                    height: this.folderHeight,
                    offset: currentOffset,
                });
                currentOffset += this.folderHeight;
                // Add items if folder is expanded
                if (isExpanded) {
                    filteredCanvasItems.forEach((item) => {
                        virtualItems.push({
                            type: "item",
                            data: item,
                            height: this.itemHeight,
                            offset: currentOffset,
                        });
                        currentOffset += this.itemHeight;
                    });
                }
            });
            return virtualItems;
        };
        /**
         * Get visible items for virtual scrolling
         *
         * Returns only the items/folders that should be rendered based on scroll position.
         * Uses configurable heights and buffer zones for optimal performance.
         *
         * Performance: Reduces DOM nodes from 1000+ to ~50-100 (10-20× improvement)
         * @returns Object with visible items and total scroll height
         */
        this.calculateVirtualScrolling = () => {
            const allVirtualItems = this.buildVirtualItemsList();
            // Calculate total height
            const totalHeight = allVirtualItems.length > 0
                ? allVirtualItems[allVirtualItems.length - 1].offset +
                    allVirtualItems[allVirtualItems.length - 1].height
                : 0;
            // Find visible range with buffer
            const scrollTop = this.virtualScrollOffset;
            const scrollContainer = this.hostElement.querySelector(".layer-panel__list");
            const viewportHeight = (scrollContainer === null || scrollContainer === void 0 ? void 0 : scrollContainer.clientHeight) || 600;
            const startY = Math.max(0, scrollTop - this.virtualBufferPx);
            const endY = scrollTop + viewportHeight + this.virtualBufferPx;
            // Binary search for start index
            let startIndex = 0;
            for (let i = 0; i < allVirtualItems.length; i++) {
                if (allVirtualItems[i].offset + allVirtualItems[i].height >= startY) {
                    startIndex = i;
                    break;
                }
            }
            // Find end index
            let endIndex = startIndex;
            for (let i = startIndex; i < allVirtualItems.length; i++) {
                if (allVirtualItems[i].offset > endY) {
                    break;
                }
                endIndex = i;
            }
            // Extract visible items
            const visibleItems = allVirtualItems.slice(startIndex, endIndex + 1);
            return { visibleItems, totalHeight };
        };
    }
    /**
     * Watch API prop for changes
     *
     * **Why needed**: Layer panel's componentDidLoad() runs before blog-app
     * has retrieved and passed the API prop. We need to initialize when
     * the API prop becomes available.
     */
    handleApiChange(newApi) {
        console.log("🔧 Layer panel: API prop changed", { hasApi: !!newApi });
        if (newApi) {
            this.setupLayerPanel();
        }
    }
    /**
     * Component did load - subscribe to events
     */
    componentDidLoad() {
        console.log("🔧 Layer panel componentDidLoad called");
        console.log("  API available:", !!this.api);
        // If API is already available, initialize immediately
        // Otherwise, @Watch("api") will initialize when API prop is set
        if (this.api) {
            this.setupLayerPanel();
        }
        else {
            console.warn("  ⚠️ API not yet available, waiting for prop...");
        }
    }
    /**
     * Cleanup event subscriptions
     */
    disconnectedCallback() {
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
    }
    /**
     * Handle layer item selection
     *
     * Updates grid state to select the clicked item.
     */
    handleLayerItemSelect(event) {
        if (!this.api)
            return;
        const { itemId, canvasId } = event.detail;
        // Update grid state via API
        const state = this.api.getState();
        state.selectedItemId = itemId;
        state.selectedCanvasId = canvasId;
        state.activeCanvasId = canvasId;
    }
    /**
     * Handle folder toggle (expand/collapse)
     */
    handleToggleFolder(event) {
        this.toggleFolder(event.detail.canvasId);
    }
    /**
     * Handle canvas activation (set as active canvas)
     */
    handleActivateCanvas(event) {
        if (!this.api)
            return;
        const state = this.api.getState();
        state.activeCanvasId = event.detail.canvasId;
    }
    /**
     * Handle scroll to canvas (double-click on folder header)
     */
    handleScrollToCanvas(event) {
        const { canvasId } = event.detail;
        console.log("📜 Scrolling to canvas:", canvasId);
        // Find the canvas element in the DOM
        const canvasElement = document.getElementById(canvasId);
        if (canvasElement) {
            canvasElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
            });
            console.log("  ✅ Scrolled to canvas element");
        }
        else {
            console.warn("  ⚠️ Canvas element not found:", canvasId);
        }
    }
    /**
     * Handle drag start for layer item reordering
     *
     * Stores drag metadata for drop calculation.
     */
    handleLayerItemDragStart(event) {
        const { itemId, canvasId, zIndex } = event.detail;
        // Store drag state
        this.draggedItem = {
            itemId,
            canvasId,
            zIndex,
        };
    }
    /**
     * Handle drop for layer item reordering
     *
     * Calculates new z-index and handles cross-canvas movement.
     * Supports Photoshop-like behavior: drop above/below target item.
     *
     * Uses GridBuilderAPI methods for proper event emission and undo/redo support.
     */
    handleLayerItemDropped(event) {
        console.log("🎯 Layer item dropped", { event: event.detail, draggedItem: this.draggedItem, hasApi: !!this.api });
        if (!this.draggedItem || !this.api) {
            console.warn("  ⚠️ No draggedItem or API, aborting");
            return;
        }
        const state = this.api.getState();
        const { targetItemId, targetCanvasId, targetZIndex, dropAbove } = event.detail;
        const { itemId: draggedItemId, canvasId: draggedCanvasId, zIndex: draggedZIndex, } = this.draggedItem;
        // Don't drop on self
        if (draggedItemId === targetItemId && draggedCanvasId === targetCanvasId) {
            console.log("  ℹ️ Dropped on self, ignoring");
            this.draggedItem = null;
            return;
        }
        console.log("  📦 Processing drop:", { draggedItemId, draggedCanvasId, draggedZIndex, targetItemId, targetCanvasId, targetZIndex, dropAbove });
        // Collect all z-index changes to apply in batch
        const zIndexChanges = [];
        // Handle cross-canvas movement
        if (draggedCanvasId !== targetCanvasId) {
            const sourceCanvas = state.canvases[draggedCanvasId];
            const targetCanvas = state.canvases[targetCanvasId];
            if (!sourceCanvas || !targetCanvas)
                return;
            // Move item to target canvas using API
            this.api.moveItem(draggedCanvasId, targetCanvasId, draggedItemId);
            // Get updated state after move
            const updatedTargetCanvas = this.api.getState().canvases[targetCanvasId];
            const sortedItems = [...updatedTargetCanvas.items].sort((a, b) => a.zIndex - b.zIndex);
            // Find target item index in sorted list
            const targetIndex = sortedItems.findIndex((i) => i.id === targetItemId);
            // Calculate new z-index based on drop position
            let newZIndex;
            if (dropAbove) {
                // Drop above target: use target's z-index
                newZIndex = targetZIndex;
                // Collect z-index changes for items that need to shift up
                sortedItems.forEach((item) => {
                    if (item.id !== draggedItemId && item.zIndex >= newZIndex) {
                        zIndexChanges.push({
                            itemId: item.id,
                            canvasId: targetCanvasId,
                            newZIndex: item.zIndex + 1,
                        });
                    }
                });
            }
            else {
                // Drop below target: use z-index between target and next item
                if (targetIndex < sortedItems.length - 1) {
                    const nextItem = sortedItems[targetIndex + 1];
                    newZIndex = nextItem.zIndex;
                    // Collect z-index changes for items that need to shift up
                    sortedItems.forEach((item) => {
                        if (item.id !== draggedItemId && item.zIndex >= newZIndex) {
                            zIndexChanges.push({
                                itemId: item.id,
                                canvasId: targetCanvasId,
                                newZIndex: item.zIndex + 1,
                            });
                        }
                    });
                }
                else {
                    // Dropping at the bottom
                    newZIndex = targetZIndex + 1;
                }
            }
            // Add dragged item's new z-index
            zIndexChanges.push({
                itemId: draggedItemId,
                canvasId: targetCanvasId,
                newZIndex,
            });
        }
        else {
            // Same canvas reordering
            const canvas = state.canvases[draggedCanvasId];
            const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);
            // Find indices
            const draggedIndex = sortedItems.findIndex((i) => i.id === draggedItemId);
            const targetIndex = sortedItems.findIndex((i) => i.id === targetItemId);
            // Calculate new z-index
            let newZIndex;
            if (dropAbove) {
                // Drop above target
                newZIndex = targetZIndex;
                // Collect z-index changes for items between old and new position
                sortedItems.forEach((item) => {
                    if (item.id !== draggedItemId) {
                        if (draggedIndex < targetIndex) {
                            // Moving down: decrement items between
                            if (item.zIndex > draggedZIndex && item.zIndex <= targetZIndex) {
                                zIndexChanges.push({
                                    itemId: item.id,
                                    canvasId: draggedCanvasId,
                                    newZIndex: item.zIndex - 1,
                                });
                            }
                        }
                        else {
                            // Moving up: increment items between
                            if (item.zIndex >= targetZIndex && item.zIndex < draggedZIndex) {
                                zIndexChanges.push({
                                    itemId: item.id,
                                    canvasId: draggedCanvasId,
                                    newZIndex: item.zIndex + 1,
                                });
                            }
                        }
                    }
                });
            }
            else {
                // Drop below target
                if (targetIndex < sortedItems.length - 1) {
                    newZIndex = targetZIndex + 1;
                    // Collect z-index changes
                    sortedItems.forEach((item) => {
                        if (item.id !== draggedItemId) {
                            if (draggedIndex < targetIndex) {
                                // Moving down
                                if (item.zIndex > draggedZIndex && item.zIndex <= newZIndex) {
                                    zIndexChanges.push({
                                        itemId: item.id,
                                        canvasId: draggedCanvasId,
                                        newZIndex: item.zIndex - 1,
                                    });
                                }
                            }
                            else {
                                // Moving up
                                if (item.zIndex >= newZIndex && item.zIndex < draggedZIndex) {
                                    zIndexChanges.push({
                                        itemId: item.id,
                                        canvasId: draggedCanvasId,
                                        newZIndex: item.zIndex + 1,
                                    });
                                }
                            }
                        }
                    });
                }
                else {
                    // Dropping at bottom
                    newZIndex = targetZIndex + 1;
                }
            }
            // Add dragged item's new z-index
            zIndexChanges.push({
                itemId: draggedItemId,
                canvasId: draggedCanvasId,
                newZIndex,
            });
        }
        // Apply all z-index changes in one batch operation
        if (zIndexChanges.length > 0) {
            this.api.setItemsZIndexBatch(zIndexChanges);
        }
        // Clear drag state (refreshItems() is no longer needed as API events will trigger re-render)
        this.draggedItem = null;
    }
    render() {
        var _a;
        const { visibleItems, totalHeight } = this.calculateVirtualScrolling();
        // Get state for selection/active canvas checks
        const state = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getState();
        const activeCanvasId = state === null || state === void 0 ? void 0 : state.activeCanvasId;
        const selectedItemId = state === null || state === void 0 ? void 0 : state.selectedItemId;
        const selectedCanvasId = state === null || state === void 0 ? void 0 : state.selectedCanvasId;
        return (h("div", { key: 'da36148db18547b56866c6dbd99297bec4effe67', class: "layer-panel" }, h("div", { key: '6b6ae84e1fcb9d3759f5790637b1cb513acd53f9', class: "layer-panel__header" }, h("h3", { key: '315c7c4a23ca02b45e20b115022046e62c8fa7f0', class: "layer-panel__title" }, "Layers"), h("div", { key: '021b4abe473becb6c8003fe4c2bfaed868c593dc', class: "layer-panel__count" }, this.filteredItems.length, " items")), h("div", { key: '4139d9ada036e769b258ebe92bdfa3ad29792ab2', class: "layer-panel__search" }, h("input", { key: 'a0cf72c1929484cd8a184b33df58749d7ded6968', type: "text", class: "layer-panel__search-input", placeholder: "Search layers...", onInput: this.handleSearchInput })), h("div", { key: '0123845d6e696e2d729b41431d98e3036280cbdd', class: "layer-panel__list" }, h("div", { key: '1085d6f53809334906bed7eac234ebc64feb61d1', class: "layer-panel__list-inner", style: { height: `${totalHeight}px`, position: "relative" } }, visibleItems.length === 0 && (h("div", { key: '932597d94315135a04afe323fd4c3efade289fc0', class: "layer-panel__empty" }, "No items found")), visibleItems.map((virtualItem) => {
            var _a;
            if (virtualItem.type === "folder") {
                // Render folder header
                const folderData = virtualItem.data;
                return (h("layer-panel-folder-header", { key: `folder-${folderData.canvasId}`, canvasId: folderData.canvasId, canvasTitle: folderData.title, itemCount: folderData.itemCount, totalItemCount: folderData.totalItemCount, isExpanded: (_a = this.folderExpandedState[folderData.canvasId]) !== null && _a !== void 0 ? _a : true, isActive: folderData.canvasId === activeCanvasId, isEmpty: folderData.isEmpty, style: {
                        position: "absolute",
                        top: `${virtualItem.offset}px`,
                        left: "0",
                        right: "0",
                        height: `${virtualItem.height}px`,
                    } }));
            }
            else {
                // Render layer item
                const item = virtualItem.data;
                return (h("layer-panel-item", { key: item.id, itemId: item.id, canvasId: item.canvasId, name: item.name, type: item.type, zIndex: item.zIndex, isActive: item.id === selectedItemId &&
                        item.canvasId === selectedCanvasId, style: {
                        position: "absolute",
                        top: `${virtualItem.offset}px`,
                        left: "0",
                        right: "0",
                        height: `${virtualItem.height}px`,
                    } }));
            }
        }))), h("div", { key: '668c1801a690738f8e370760bedf276d7234c022', class: "layer-panel__footer" }, h("div", { key: '09dff3076c16baded2ae0330535ec2490739e6dc', class: "layer-panel__hint" }, "Click folder to expand/collapse \u00B7 Click item to select"))));
    }
    get hostElement() { return getElement(this); }
    static get watchers() { return {
        "api": ["handleApiChange"]
    }; }
};
LayerPanel.style = layerPanelCss;

export { LayerPanel as layer_panel };
//# sourceMappingURL=layer-panel.entry.esm.js.map
