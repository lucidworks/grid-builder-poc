/**
 * Grid Item Wrapper Component (Library Version)
 * ===============================================
 *
 * Individual grid item container with dynamic component rendering from registry.
 * This is the library version that uses ComponentDefinition.render() for flexibility.
 *
 * ## Key Differences from POC
 *
 * **Dynamic component rendering**:
 * - POC: Hardcoded switch statement with 8 component types
 * - Library: Uses ComponentDefinition.render() from component registry
 * - Consumer defines all component types
 * - Library just calls the render function
 *
 * **Removed POC-specific**:
 * - componentTemplates import (hardcoded component data)
 * - Fixed component type switch statement
 * - Hardcoded icon/title from templates
 *
 * **Added library features**:
 * - Component registry lookup
 * - Fallback for unknown component types
 * - Pass GridConfig to grid calculations
 *
 * @module grid-item-wrapper
 */
import { h } from "@stencil/core";
// Internal imports
import { gridState, updateItem, setActiveCanvas } from "../../services/state-manager";
import { pushCommand } from "../../services/undo-redo";
import { MoveItemCommand } from "../../services/undo-redo-commands";
import { virtualRenderer } from "../../services/virtual-renderer";
import { eventManager } from "../../services/event-manager";
import { DragHandler } from "../../utils/drag-handler";
import { ResizeHandler } from "../../utils/resize-handler";
import { gridToPixelsX, gridToPixelsY } from "../../utils/grid-calculations";
import { createDebugLogger } from "../../utils/debug";
const debug = createDebugLogger('grid-item-wrapper');
/**
 * GridItemWrapper Component
 * ==========================
 *
 * Library component wrapping individual grid items with drag/resize/selection.
 *
 * **Tag**: `<grid-item-wrapper>`
 * **Shadow DOM**: Disabled (required for interact.js compatibility)
 * **Dynamic rendering**: Uses ComponentDefinition.render() from registry
 */
export class GridItemWrapper {
    constructor() {
        /**
         * Viewer mode flag
         *
         * **Purpose**: Disable editing features for rendering-only mode
         * **Default**: false (editing enabled)
         *
         * **When true**:
         * - ❌ No drag-and-drop handlers
         * - ❌ No resize handles
         * - ❌ No item header (drag handle)
         * - ❌ No delete button
         * - ❌ No selection state
         * - ✅ Only renders component content
         *
         * **Use case**: grid-viewer component for display-only mode
         */
        this.viewerMode = false;
        /**
         * Selection state (reactive)
         *
         * **Managed by**: updateComponentState()
         * **Updated on**: componentWillLoad, componentWillUpdate
         * **Triggers**: Visual selection styles (.selected class)
         */
        this.isSelected = false;
        /**
         * Visibility state (virtual rendering)
         *
         * **Managed by**: IntersectionObserver callback
         * **Initial value**: false (don't render content yet)
         * **Triggered by**: Observer callback or manual check for initially-visible items
         * **Controls**: Whether component content renders or placeholder shows
         *
         * **Note**: Virtual renderer checks if element is initially in viewport
         * and triggers callback immediately to prevent "Loading..." on visible items.
         * Off-screen items stay false until scrolled into view (virtual rendering).
         */
        this.isVisible = false;
        /**
         * Item snapshot (for undo/redo)
         */
        this.itemSnapshot = null;
        /**
         * Track whether item was dragged (to prevent click event on drag end)
         */
        this.wasDragged = false;
        /**
         * Capture item snapshot for undo/redo
         */
        this.captureItemSnapshot = () => {
            this.itemSnapshot = JSON.parse(JSON.stringify(this.item));
        };
        /**
         * Handle item update (called by drag/resize handlers)
         */
        this.handleItemUpdate = (updatedItem) => {
            // Check if position or canvas changed (for undo/redo)
            let isDrag = false;
            let isResize = false;
            if (this.itemSnapshot) {
                const snapshot = this.itemSnapshot;
                const positionOnlyChanged = (snapshot.layouts.desktop.x !== updatedItem.layouts.desktop.x ||
                    snapshot.layouts.desktop.y !== updatedItem.layouts.desktop.y) &&
                    snapshot.layouts.desktop.width === updatedItem.layouts.desktop.width &&
                    snapshot.layouts.desktop.height === updatedItem.layouts.desktop.height;
                const sizeChanged = snapshot.layouts.desktop.width !== updatedItem.layouts.desktop.width ||
                    snapshot.layouts.desktop.height !== updatedItem.layouts.desktop.height;
                const canvasChanged = snapshot.canvasId !== updatedItem.canvasId;
                isDrag = positionOnlyChanged || canvasChanged;
                isResize = sizeChanged;
                if (isDrag || isResize) {
                    // Find source canvas and index
                    const sourceCanvas = gridState.canvases[snapshot.canvasId];
                    const sourceIndex = (sourceCanvas === null || sourceCanvas === void 0 ? void 0 : sourceCanvas.items.findIndex((i) => i.id === this.item.id)) || 0;
                    // Push undo command before updating state
                    // Include size tracking for resize operations (also handles resize with position change)
                    pushCommand(new MoveItemCommand(updatedItem.id, snapshot.canvasId, updatedItem.canvasId, {
                        x: snapshot.layouts.desktop.x,
                        y: snapshot.layouts.desktop.y,
                    }, {
                        x: updatedItem.layouts.desktop.x,
                        y: updatedItem.layouts.desktop.y,
                    }, sourceIndex, 
                    // Include size for resize tracking (position and size can both change)
                    isResize
                        ? {
                            width: snapshot.layouts.desktop.width,
                            height: snapshot.layouts.desktop.height,
                        }
                        : undefined, isResize
                        ? {
                            width: updatedItem.layouts.desktop.width,
                            height: updatedItem.layouts.desktop.height,
                        }
                        : undefined));
                }
            }
            // Update item in state (triggers re-render)
            const canvas = gridState.canvases[this.item.canvasId];
            const itemIndex = canvas.items.findIndex((i) => i.id === this.item.id);
            if (itemIndex !== -1) {
                canvas.items[itemIndex] = updatedItem;
                gridState.canvases = Object.assign({}, gridState.canvases);
            }
            // Emit events for plugins
            if (isDrag) {
                eventManager.emit('componentDragged', {
                    itemId: updatedItem.id,
                    canvasId: updatedItem.canvasId,
                    position: {
                        x: updatedItem.layouts.desktop.x,
                        y: updatedItem.layouts.desktop.y,
                    },
                });
            }
            if (isResize) {
                eventManager.emit('componentResized', {
                    itemId: updatedItem.id,
                    canvasId: updatedItem.canvasId,
                    size: {
                        width: updatedItem.layouts.desktop.width,
                        height: updatedItem.layouts.desktop.height,
                    },
                });
            }
        };
        /**
         * Handle click event (selection and config panel)
         */
        this.handleClick = (e) => {
            // Skip click handling in viewer mode
            if (this.viewerMode) {
                debug.log('  ⏭️ Skipping - viewer mode');
                return;
            }
            // Don't open config panel if item was just dragged
            if (this.wasDragged) {
                debug.log('  ⏭️ Skipping - was dragged');
                // Reset flag after a small delay to allow this click event to finish
                setTimeout(() => {
                    this.wasDragged = false;
                }, 10);
                return;
            }
            // Don't open config panel if clicking on drag handle, resize handle, or control buttons
            const target = e.target;
            if (target.classList.contains('drag-handle') ||
                target.closest('.drag-handle') ||
                target.classList.contains('resize-handle') ||
                target.closest('.resize-handle') ||
                target.classList.contains('grid-item-delete') ||
                target.classList.contains('grid-item-control-btn')) {
                debug.log('  ⏭️ Skipping - clicked on control element');
                return;
            }
            debug.log('  ✅ Proceeding with click handling');
            // Set selection state immediately
            gridState.selectedItemId = this.item.id;
            gridState.selectedCanvasId = this.item.canvasId;
            // Set this canvas as active
            setActiveCanvas(this.item.canvasId);
            // Emit selection event for plugins
            eventManager.emit('componentSelected', {
                itemId: this.item.id,
                canvasId: this.item.canvasId,
            });
            // Dispatch event to open config panel
            debug.log('  📤 Dispatching item-click event', {
                itemId: this.item.id,
                canvasId: this.item.canvasId,
                hasItemRef: !!this.itemRef,
            });
            const event = new CustomEvent('item-click', {
                detail: { itemId: this.item.id, canvasId: this.item.canvasId },
                bubbles: true,
                composed: true,
            });
            this.itemRef.dispatchEvent(event);
            debug.log('  ✅ item-click event dispatched');
        };
        /**
         * Handle delete from default wrapper button
         * Calls deletion hook if provided, then dispatches delete event if approved
         */
        this.handleDelete = async () => {
            debug.log('🗑️ handleDelete (default wrapper button)', {
                itemId: this.item.id,
                canvasId: this.item.canvasId,
            });
            // If deletion hook provided, call it first
            if (this.onBeforeDelete) {
                debug.log('  🪝 Calling deletion hook...');
                try {
                    const shouldDelete = await this.onBeforeDelete({
                        item: this.item,
                        canvasId: this.item.canvasId,
                        itemId: this.item.id,
                    });
                    if (!shouldDelete) {
                        debug.log('  ❌ Deletion cancelled by hook');
                        return;
                    }
                    debug.log('  ✅ Deletion approved by hook');
                }
                catch (error) {
                    console.error('  ❌ Deletion hook error:', error);
                    return;
                }
            }
            // Proceed with deletion
            const event = new CustomEvent('grid-item:delete', {
                detail: { itemId: this.item.id, canvasId: this.item.canvasId },
                bubbles: true,
                composed: true,
            });
            debug.log('  📤 Dispatching grid-item:delete (internal event)');
            this.itemRef.dispatchEvent(event);
        };
    }
    /**
     * Component will load lifecycle hook
     */
    componentWillLoad() {
        this.updateComponentState();
    }
    /**
     * Component will update lifecycle hook
     */
    componentWillUpdate() {
        this.updateComponentState();
    }
    /**
     * Update component state (selection and snapshot)
     */
    updateComponentState() {
        // Update selection state
        this.isSelected = gridState.selectedItemId === this.item.id;
        // Capture item snapshot for undo/redo
        this.captureItemSnapshot();
    }
    /**
     * Component did load lifecycle hook
     */
    componentDidLoad() {
        var _a;
        // Set up virtual rendering observer (both builder and viewer modes)
        // Virtual rendering improves performance for long pages with many components
        virtualRenderer.observe(this.itemRef, this.item.id, (isVisible) => {
            this.isVisible = isVisible;
        });
        // Inject component content into custom wrapper's content slot if needed
        this.injectComponentContent();
        // Skip drag/resize handlers in viewer mode
        if (!this.viewerMode) {
            // Get component definition for min/max size constraints
            const componentDefinition = (_a = this.componentRegistry) === null || _a === void 0 ? void 0 : _a.get(this.item.type);
            // Get the header element for drag handler
            const headerElement = this.itemRef.querySelector('.grid-item-header');
            // Initialize drag and resize handlers
            // Pass header element for drag (instead of whole item)
            this.dragHandler = new DragHandler(this.itemRef, this.item, this.handleItemUpdate, this.config, headerElement, () => {
                this.wasDragged = true;
            });
            this.resizeHandler = new ResizeHandler(this.itemRef, this.item, this.handleItemUpdate, componentDefinition, this.config);
        }
    }
    /**
     * Component did update lifecycle hook
     */
    componentDidUpdate() {
        // Re-inject component content if custom wrapper re-rendered
        this.injectComponentContent();
    }
    /**
     * Inject component content into custom wrapper's content slot
     *
     * **Purpose**: For custom wrappers, find the content slot div and inject component
     * **Called from**: componentDidLoad, componentDidUpdate
     * **Why needed**: Custom wrapper JSX renders, then we inject content into its slot
     */
    injectComponentContent() {
        var _a;
        // Only for custom wrappers
        const definition = (_a = this.componentRegistry) === null || _a === void 0 ? void 0 : _a.get(this.item.type);
        if (!(definition === null || definition === void 0 ? void 0 : definition.renderItemWrapper) || !this.itemRef)
            return;
        // Find the content slot
        const contentSlotId = `${this.item.id}-content`;
        const contentSlot = this.itemRef.querySelector(`#${contentSlotId}`);
        if (!contentSlot)
            return;
        // Check if already injected
        if (contentSlot.hasAttribute('data-content-injected'))
            return;
        // Render and inject component content
        const componentContent = this.renderComponent();
        // Clear any existing content
        contentSlot.innerHTML = '';
        if (componentContent instanceof HTMLElement) {
            contentSlot.appendChild(componentContent);
        }
        else {
            // For Stencil vNodes, we need to use a workaround
            // Create a temporary container and let Stencil render into it
            const tempContainer = document.createElement('div');
            contentSlot.appendChild(tempContainer);
            // This is a limitation - vNodes can't be manually appended
            // The custom wrapper should handle rendering the component directly
            // For now, we'll just set a placeholder
            tempContainer.textContent = '[Component Content]';
        }
        // Mark as injected
        contentSlot.setAttribute('data-content-injected', 'true');
    }
    /**
     * Disconnected callback (cleanup)
     */
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
    /**
     * Watch for item prop changes
     *
     * **When triggered**: Parent passes updated item data
     * **Actions**:
     * - Update component state (selection, snapshot)
     * - Reinitialize drag/resize handlers with new item data
     * - Preserve handlers if already initialized
     */
    handleItemChange(newItem, oldItem) {
        // Skip if item reference hasn't actually changed
        if (newItem === oldItem)
            return;
        debug.log('📦 Item prop changed:', {
            itemId: newItem.id,
            oldId: oldItem === null || oldItem === void 0 ? void 0 : oldItem.id,
        });
        // Update component state
        this.updateComponentState();
        // Update drag/resize handlers with new item data
        if (!this.viewerMode && this.dragHandler && this.resizeHandler) {
            // Handlers are already initialized, they'll use the updated this.item reference
            // No need to destroy and recreate - they reference this.item internally
            debug.log('  ✅ Handlers updated with new item reference');
        }
    }
    /**
     * Watch for renderVersion prop changes
     *
     * **When triggered**: Parent increments renderVersion (e.g., on container resize)
     * **Purpose**: Force component re-render to recalculate grid positions
     * **Note**: This is a force-update mechanism, actual recalculation happens in render()
     */
    handleRenderVersionChange(newVersion, oldVersion) {
        // Skip if version hasn't changed (undefined → undefined)
        if (newVersion === oldVersion)
            return;
        debug.log('🔄 RenderVersion changed:', {
            oldVersion,
            newVersion,
            itemId: this.item.id,
        });
        // No action needed - the prop change itself triggers re-render
        // Grid calculations will be re-executed in render()
    }
    /**
     * Watch for config prop changes
     *
     * **When triggered**: Parent passes updated GridConfig
     * **Actions**: Reinitialize drag/resize handlers with new config
     * **Note**: Config changes are rare (e.g., user changes grid settings)
     */
    handleConfigChange(newConfig, oldConfig) {
        var _a;
        // Skip if config reference hasn't changed
        if (newConfig === oldConfig)
            return;
        debug.log('⚙️ Config prop changed:', {
            itemId: this.item.id,
            oldConfig,
            newConfig,
        });
        // Reinitialize handlers with new config
        if (!this.viewerMode && this.itemRef) {
            // Cleanup old handlers
            if (this.dragHandler) {
                this.dragHandler.destroy();
            }
            if (this.resizeHandler) {
                this.resizeHandler.destroy();
            }
            // Recreate handlers with new config
            const componentDefinition = (_a = this.componentRegistry) === null || _a === void 0 ? void 0 : _a.get(this.item.type);
            const headerElement = this.itemRef.querySelector('.grid-item-header');
            this.dragHandler = new DragHandler(this.itemRef, this.item, this.handleItemUpdate, newConfig, headerElement, () => {
                this.wasDragged = true;
            });
            this.resizeHandler = new ResizeHandler(this.itemRef, this.item, this.handleItemUpdate, componentDefinition, newConfig);
            debug.log('  ✅ Handlers reinitialized with new config');
        }
    }
    /**
     * Watch for currentViewport prop changes (viewer mode only)
     *
     * **When triggered**: Viewport switches between desktop/mobile in viewer mode
     * **Purpose**: Force re-render to use appropriate layout
     * **Note**: Only relevant in viewerMode=true
     */
    handleViewportChange(newViewport, oldViewport) {
        // Skip if viewport hasn't changed
        if (newViewport === oldViewport)
            return;
        // Only relevant in viewer mode
        if (!this.viewerMode)
            return;
        debug.log('📱 Viewport prop changed (viewer mode):', {
            oldViewport,
            newViewport,
            itemId: this.item.id,
        });
        // No action needed - the prop change itself triggers re-render
        // render() will use the new viewport to select layout
    }
    /**
     * Listen for item-delete events from custom wrapper components
     * This is the PUBLIC API for custom wrappers to request item deletion
     * We intercept these and re-dispatch as internal 'grid-item:delete' events
     */
    handleItemDeleteEvent(event) {
        debug.log('🔴 @Listen(item-delete) - from custom wrapper', {
            eventTarget: event.target,
            itemId: this.item.id,
        });
        // Stop the public event from bubbling
        event.stopPropagation();
        // Re-dispatch as internal event that grid-builder listens for
        const deleteEvent = new CustomEvent('grid-item:delete', {
            detail: { itemId: this.item.id, canvasId: this.item.canvasId },
            bubbles: true,
            composed: true,
        });
        debug.log('  📤 Re-dispatching as grid-item:delete');
        this.itemRef.dispatchEvent(deleteEvent);
    }
    /**
     * Listen for item-bring-to-front events from custom wrapper components
     */
    handleItemBringToFrontEvent(event) {
        event.stopPropagation();
        const canvas = gridState.canvases[this.item.canvasId];
        if (!canvas)
            return;
        const maxZ = Math.max(...canvas.items.map((i) => i.zIndex));
        updateItem(this.item.canvasId, this.item.id, { zIndex: maxZ + 1 });
    }
    /**
     * Listen for item-send-to-back events from custom wrapper components
     */
    handleItemSendToBackEvent(event) {
        event.stopPropagation();
        const canvas = gridState.canvases[this.item.canvasId];
        if (!canvas)
            return;
        const minZ = Math.min(...canvas.items.map((i) => i.zIndex));
        updateItem(this.item.canvasId, this.item.id, { zIndex: minZ - 1 });
    }
    /**
     * Render component content (dynamic component from registry)
     *
     * **Dynamic rendering via ComponentDefinition.render()**:
     * - Lookup component definition by type in registry
     * - Call definition.render({ itemId, config })
     * - Consumer controls what gets rendered
     * - Library just provides the wrapper
     *
     * **Virtual rendering guard**:
     * - Only render when isVisible = true
     * - Show placeholder while loading
     * - Performance optimization
     *
     * **Fallback for unknown types**:
     * - If no registry provided: "Component registry not available"
     * - If type not in registry: "Unknown component type: {type}"
     * - Prevents crashes, helps debugging
     */
    renderComponent() {
        // Virtual rendering: only render component content when visible
        if (!this.isVisible) {
            return h("div", { class: "component-placeholder" }, "Loading...");
        }
        // Check if component registry is available
        if (!this.componentRegistry) {
            console.error(`GridItemWrapper: componentRegistry not provided for item ${this.item.id}`);
            return h("div", { class: "component-error" }, "Component registry not available");
        }
        // Look up component definition from registry
        const definition = this.componentRegistry.get(this.item.type);
        if (!definition) {
            console.error(`GridItemWrapper: Unknown component type "${this.item.type}" for item ${this.item.id}`);
            return h("div", { class: "component-error" }, "Unknown component type: ", this.item.type);
        }
        // Call component definition's render function
        // Pass itemId and config so component can look up state and use config
        const rendered = definition.render({
            itemId: this.item.id,
            config: this.item.config,
        });
        // If render returns a DOM element (HTMLElement), wrap it in a div for Stencil
        // This handles cases where consumer uses document.createElement()
        if (rendered instanceof HTMLElement) {
            return h("div", { ref: (el) => el && !el.hasChildNodes() && el.appendChild(rendered) });
        }
        // Otherwise return the vNode directly (JSX)
        return rendered;
    }
    /**
     * Render component template
     *
     * **Layout selection and auto-layout**:
     * - Desktop: Use desktop layout
     * - Mobile (not customized): Auto-stack full-width
     * - Mobile (customized): Use custom mobile layout
     *
     * **Grid to pixel conversion**:
     * - Horizontal: gridToPixelsX(units, canvasId, config)
     * - Vertical: gridToPixelsY(units)
     * - Responsive width, fixed height
     *
     * **Transform-based positioning**:
     * - GPU-accelerated translate()
     * - Better performance than top/left
     * - Sub-pixel accuracy
     *
     * **Dynamic component rendering**:
     * - Look up definition from registry
     * - Use definition.icon and definition.name for header
     * - Call definition.render() for content
     */
    render() {
        var _a, _b, _c, _d, _e, _f, _g;
        // Use prop-based viewport in viewer mode, global state in builder mode
        const currentViewport = this.viewerMode
            ? (this.currentViewport || 'desktop')
            : gridState.currentViewport;
        const layout = this.item.layouts[currentViewport];
        // For mobile viewport, calculate auto-layout if not customized
        let actualLayout = layout;
        if (currentViewport === 'mobile' && !this.item.layouts.mobile.customized) {
            // Auto-layout for mobile: stack components vertically at full width
            // Use prop-based items in viewer mode, global state in builder mode
            const canvasItems = this.viewerMode
                ? (this.canvasItems || [])
                : (((_a = gridState.canvases[this.item.canvasId]) === null || _a === void 0 ? void 0 : _a.items) || []);
            const itemIndex = (_b = canvasItems.findIndex((i) => i.id === this.item.id)) !== null && _b !== void 0 ? _b : 0;
            // Calculate Y position by summing heights of all previous items
            let yPosition = 0;
            if (itemIndex > 0) {
                for (let i = 0; i < itemIndex; i++) {
                    const prevItem = canvasItems[i];
                    yPosition += prevItem.layouts.desktop.height || 6;
                }
            }
            actualLayout = {
                x: 0, // Full left
                y: yPosition,
                width: 50, // Full width (50 units = 100%)
                height: this.item.layouts.desktop.height || 6,
            };
        }
        // Compute selection directly from gridState (only in editing mode)
        const isSelected = !this.viewerMode && gridState.selectedItemId === this.item.id;
        const itemClasses = {
            'grid-item': true,
            selected: isSelected,
            'with-animations': (_d = (_c = this.config) === null || _c === void 0 ? void 0 : _c.enableAnimations) !== null && _d !== void 0 ? _d : true,
        };
        // Convert grid units to pixels (with GridConfig support)
        const xPixels = gridToPixelsX(actualLayout.x, this.item.canvasId, this.config);
        const yPixels = gridToPixelsY(actualLayout.y);
        const widthPixels = gridToPixelsX(actualLayout.width, this.item.canvasId, this.config);
        const heightPixels = gridToPixelsY(actualLayout.height);
        // Get component definition for icon, name, and selection color
        const definition = (_e = this.componentRegistry) === null || _e === void 0 ? void 0 : _e.get(this.item.type);
        const icon = (definition === null || definition === void 0 ? void 0 : definition.icon) || '�';
        const displayName = this.item.name || (definition === null || definition === void 0 ? void 0 : definition.name) || this.item.type;
        const selectionColor = (definition === null || definition === void 0 ? void 0 : definition.selectionColor) || '#f59e0b'; // Default yellow/gold
        const itemStyle = {
            transform: `translate(${xPixels}px, ${yPixels}px)`,
            width: `${widthPixels}px`,
            height: `${heightPixels}px`,
            zIndex: this.item.zIndex.toString(),
            '--selection-color': selectionColor,
            '--animation-duration': `${(_g = (_f = this.config) === null || _f === void 0 ? void 0 : _f.animationDuration) !== null && _g !== void 0 ? _g : 100}ms`,
        };
        // Generate unique content slot ID for custom wrapper
        const contentSlotId = `${this.item.id}-content`;
        // Check if custom item wrapper is provided
        if (definition === null || definition === void 0 ? void 0 : definition.renderItemWrapper) {
            const customWrapper = definition.renderItemWrapper({
                itemId: this.item.id,
                componentType: this.item.type,
                name: displayName,
                icon: icon,
                isSelected: isSelected,
                contentSlotId: contentSlotId,
            });
            return (h("div", { class: itemClasses, id: this.item.id, "data-canvas-id": this.item.canvasId, "data-component-name": displayName, "data-viewer-mode": this.viewerMode ? 'true' : 'false', style: itemStyle, onClick: (e) => this.handleClick(e), ref: (el) => (this.itemRef = el) }, customWrapper, h("div", { class: "resize-handle nw" }), h("div", { class: "resize-handle ne" }), h("div", { class: "resize-handle sw" }), h("div", { class: "resize-handle se" }), h("div", { class: "resize-handle n" }), h("div", { class: "resize-handle s" }), h("div", { class: "resize-handle e" }), h("div", { class: "resize-handle w" })));
        }
        // Default item wrapper
        return (h("div", { class: itemClasses, id: this.item.id, "data-canvas-id": this.item.canvasId, "data-component-name": displayName, "data-viewer-mode": this.viewerMode ? 'true' : 'false', style: itemStyle, onClick: (e) => this.handleClick(e), ref: (el) => (this.itemRef = el) }, !this.viewerMode && ([
            /* Drag Handle */
            h("div", { class: "drag-handle", key: "drag-handle" }),
            /* Item Header */
            h("div", { class: "grid-item-header", key: "header" }, icon, " ", displayName),
            /* Item Controls */
            h("div", { class: "grid-item-controls", key: "controls" }, h("button", { class: "grid-item-delete", onClick: () => this.handleDelete() }, "\u00D7"))
        ]), h("div", { class: "grid-item-content", id: contentSlotId, "data-component-type": this.item.type }, this.renderComponent()), !this.viewerMode && ([
            h("div", { class: "resize-handle nw", key: "resize-nw" }),
            h("div", { class: "resize-handle ne", key: "resize-ne" }),
            h("div", { class: "resize-handle sw", key: "resize-sw" }),
            h("div", { class: "resize-handle se", key: "resize-se" }),
            h("div", { class: "resize-handle n", key: "resize-n" }),
            h("div", { class: "resize-handle s", key: "resize-s" }),
            h("div", { class: "resize-handle e", key: "resize-e" }),
            h("div", { class: "resize-handle w", key: "resize-w" })
        ])));
    }
    static get is() { return "grid-item-wrapper"; }
    static get originalStyleUrls() {
        return {
            "$": ["grid-item-wrapper.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["grid-item-wrapper.css"]
        };
    }
    static get properties() {
        return {
            "item": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "GridItem",
                    "resolved": "GridItem",
                    "references": {
                        "GridItem": {
                            "location": "import",
                            "path": "../../services/state-manager",
                            "id": "src/services/state-manager.ts::GridItem"
                        }
                    }
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Grid item data (position, size, type, etc.)\n\n**Source**: Parent canvas-section component\n**Contains**: id, canvasId, type, name, layouts (desktop/mobile), zIndex, config"
                },
                "getter": false,
                "setter": false
            },
            "renderVersion": {
                "type": "number",
                "mutable": false,
                "complexType": {
                    "original": "number",
                    "resolved": "number",
                    "references": {}
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Render version (force re-render trigger)\n\n**Source**: Parent canvas-section (incremented on resize)\n**Purpose**: Force grid calculation refresh when container resizes"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "render-version"
            },
            "config": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "GridConfig",
                    "resolved": "GridConfig",
                    "references": {
                        "GridConfig": {
                            "location": "import",
                            "path": "../../types/grid-config",
                            "id": "src/types/grid-config.ts::GridConfig"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Grid configuration options\n\n**Optional**: Customizes grid system behavior\n**Passed from**: grid-builder \u2192 canvas-section \u2192 grid-item-wrapper\n**Used for**: Grid size calculations with constraints"
                },
                "getter": false,
                "setter": false
            },
            "componentRegistry": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "Map<string, ComponentDefinition>",
                    "resolved": "Map<string, ComponentDefinition>",
                    "references": {
                        "Map": {
                            "location": "global",
                            "id": "global::Map"
                        },
                        "ComponentDefinition": {
                            "location": "import",
                            "path": "../../types/component-definition",
                            "id": "src/types/component-definition.ts::ComponentDefinition"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Component registry (from parent grid-builder)\n\n**Source**: grid-builder component (built from components prop)\n**Structure**: Map<type, ComponentDefinition>\n**Purpose**: Look up component definitions for dynamic rendering\n\n**Note**: This is passed as a workaround since StencilJS doesn't have\ngood support for context/provide-inject patterns. In a production app,\nconsider using a global registry or context provider."
                },
                "getter": false,
                "setter": false
            },
            "onBeforeDelete": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "(context: any) => boolean | Promise<boolean>",
                    "resolved": "(context: any) => boolean | Promise<boolean>",
                    "references": {
                        "Promise": {
                            "location": "global",
                            "id": "global::Promise"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Deletion hook (from parent grid-builder)\n\n**Source**: grid-builder component (from onBeforeDelete prop)\n**Purpose**: Allow host app to intercept deletion requests\n\n**Hook behavior**:\n- Called before deleting a component\n- Receives context with item data\n- Returns true/false or Promise<boolean>\n- If false, deletion is cancelled\n- If true, deletion proceeds\n\n**Default**: If not provided, components delete immediately"
                },
                "getter": false,
                "setter": false
            },
            "viewerMode": {
                "type": "boolean",
                "mutable": false,
                "complexType": {
                    "original": "boolean",
                    "resolved": "boolean",
                    "references": {}
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Viewer mode flag\n\n**Purpose**: Disable editing features for rendering-only mode\n**Default**: false (editing enabled)\n\n**When true**:\n- \u274C No drag-and-drop handlers\n- \u274C No resize handles\n- \u274C No item header (drag handle)\n- \u274C No delete button\n- \u274C No selection state\n- \u2705 Only renders component content\n\n**Use case**: grid-viewer component for display-only mode"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "viewer-mode",
                "defaultValue": "false"
            },
            "currentViewport": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "'desktop' | 'mobile'",
                    "resolved": "\"desktop\" | \"mobile\"",
                    "references": {}
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Current viewport (for viewer mode)\n\n**Purpose**: Determine which layout to render (desktop or mobile)\n**Source**: grid-viewer \u2192 canvas-section-viewer \u2192 grid-item-wrapper\n**Used by**: render() to select appropriate layout\n\n**Note**: When in builder mode (viewerMode=false), this is ignored\nand gridState.currentViewport is used instead. When in viewer mode\n(viewerMode=true), this prop is required."
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "current-viewport"
            },
            "canvasItems": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "GridItem[]",
                    "resolved": "GridItem[]",
                    "references": {
                        "GridItem": {
                            "location": "import",
                            "path": "../../services/state-manager",
                            "id": "src/services/state-manager.ts::GridItem"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "All items in the canvas (for viewer mode auto-layout)\n\n**Purpose**: Calculate mobile auto-layout positions\n**Source**: grid-viewer \u2192 canvas-section-viewer \u2192 grid-item-wrapper\n**Used by**: render() to calculate stacked positions in mobile viewport\n\n**Note**: When in builder mode (viewerMode=false), this is ignored\nand gridState.canvases is used instead. When in viewer mode\n(viewerMode=true), this prop is required for mobile auto-layout."
                },
                "getter": false,
                "setter": false
            }
        };
    }
    static get states() {
        return {
            "isSelected": {},
            "isVisible": {}
        };
    }
    static get watchers() {
        return [{
                "propName": "item",
                "methodName": "handleItemChange"
            }, {
                "propName": "renderVersion",
                "methodName": "handleRenderVersionChange"
            }, {
                "propName": "config",
                "methodName": "handleConfigChange"
            }, {
                "propName": "currentViewport",
                "methodName": "handleViewportChange"
            }];
    }
    static get listeners() {
        return [{
                "name": "item-delete",
                "method": "handleItemDeleteEvent",
                "target": undefined,
                "capture": false,
                "passive": false
            }, {
                "name": "item-bring-to-front",
                "method": "handleItemBringToFrontEvent",
                "target": undefined,
                "capture": false,
                "passive": false
            }, {
                "name": "item-send-to-back",
                "method": "handleItemSendToBackEvent",
                "target": undefined,
                "capture": false,
                "passive": false
            }];
    }
}
//# sourceMappingURL=grid-item-wrapper.js.map
