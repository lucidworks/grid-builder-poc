import { proxyCustomElement, HTMLElement, h, Host } from '@stencil/core/internal/client';
import { i as interact } from './interact.min.js';
import { s as state, e as eventManager, m as moveItemToCanvas, a as setActiveCanvas, u as updateItemsBatch, d as deleteItemsBatch, b as addItemsBatch, g as generateItemId } from './event-manager.js';
import { c as createDebugLogger, v as virtualRenderer, a as applyBoundaryConstraints, M as MoveItemCommand, u as undoRedo, b as undoRedoState, R as RemoveCanvasCommand, A as AddCanvasCommand, B as BatchUpdateConfigCommand, e as BatchDeleteCommand, f as BatchAddCommand, d as defineCustomElement$1, g as constrainPositionToCanvas, C as CANVAS_WIDTH_UNITS } from './grid-item-wrapper2.js';
import { p as pixelsToGridX, a as pixelsToGridY } from './grid-calculations.js';
import { d as defineCustomElement$3 } from './canvas-section2.js';
import { d as defineCustomElement$2 } from './component-palette2.js';

const gridBuilderCss = ":host{--grid-builder-primary-color:#007bff;--grid-builder-palette-bg:#f5f5f5;--grid-builder-canvas-bg:#ffffff;--grid-builder-grid-line-color:rgba(0, 0, 0, 0.1);--grid-builder-selection-color:#007bff;--grid-builder-resize-handle-color:#007bff;--grid-builder-font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\",\n    \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif;display:block;width:100%;height:100%;font-family:var(--grid-builder-font-family)}.grid-builder-container{position:relative;display:flex;width:100%;height:100%}.palette-area{width:250px;flex-shrink:0;border-right:1px solid #ddd;background:var(--grid-builder-palette-bg);overflow-y:auto}.canvas-area{position:relative;flex:1;background:var(--grid-builder-canvas-bg);overflow-y:auto}.canvases-container{display:flex;flex-direction:column;min-height:100%;gap:0;}.config-area{position:fixed;z-index:1000;right:0;bottom:0;display:none;width:350px;max-height:60%;border:1px solid #ddd;border-radius:8px 8px 0 0;background:white;box-shadow:0 -2px 10px rgba(0, 0, 0, 0.1)}.config-area.visible{display:block}";

const debug = createDebugLogger('grid-builder');
const GridBuilder = /*@__PURE__*/ proxyCustomElement(class GridBuilder extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        /**
         * Custom API exposure configuration
         *
         * **Optional prop**: Control where and how the Grid Builder API is exposed
         * **Default**: `{ target: window, key: 'gridBuilderAPI' }`
         * **Purpose**: Allows multiple grid-builder instances and flexible API access patterns
         *
         * **Options**:
         * 1. **Custom key on window** (multiple instances):
         * ```typescript
         * <grid-builder api-ref={{ key: 'gridAPI1' }}></grid-builder>
         * <grid-builder api-ref={{ key: 'gridAPI2' }}></grid-builder>
         * // Access: window.gridAPI1, window.gridAPI2
         * ```
         *
         * 2. **Custom storage object**:
         * ```typescript
         * const myStore = {};
         * <grid-builder api-ref={{ target: myStore, key: 'api' }}></grid-builder>
         * // Access: myStore.api
         * ```
         *
         * 3. **Disable automatic exposure** (use ref instead):
         * ```typescript
         * <grid-builder api-ref={null}></grid-builder>
         * // Access via ref: <grid-builder ref={el => this.api = el?.api}></grid-builder>
         * ```
         */
        this.apiRef = { target: undefined, key: 'gridBuilderAPI' };
        /**
         * Component registry (internal state)
         *
         * **Purpose**: Map component type → definition for lookup
         * **Built from**: components prop
         * **Used by**: grid-item-wrapper for dynamic rendering
         *
         * **Structure**: `{ 'header': ComponentDefinition, 'text': ComponentDefinition, ... }`
         */
        this.componentRegistry = new Map();
        /**
         * Initialized plugins (internal state)
         *
         * **Purpose**: Track plugin instances for cleanup
         * **Lifecycle**: Set in componentDidLoad, cleared in disconnectedCallback
         */
        this.initializedPlugins = [];
        /**
         * Setup ResizeObserver for container-based viewport switching
         *
         * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
         * **Breakpoint**: 768px (container width, not window viewport)
         *
         * **Observer callback**:
         * 1. Get container width from ResizeObserver entry
         * 2. Determine target viewport (mobile if < 768px, desktop otherwise)
         * 3. Update gridState.currentViewport if changed
         *
         * **Why container-based**:
         * - More flexible than window.resize (e.g., sidebar layouts, embedded widgets)
         * - Grid-builder can be embedded at any size
         * - Multiple instances can have different viewports on same page
         *
         * **Debouncing**: Not needed - ResizeObserver is already efficient
         */
        this.setupViewportResizeObserver = () => {
            if (!this.hostElement) {
                return;
            }
            // Watch for grid-builder container size changes
            this.viewportResizeObserver = new ResizeObserver((entries) => {
                var _a, _b;
                for (const entry of entries) {
                    // Get container width (use borderBoxSize for better accuracy)
                    const width = ((_b = (_a = entry.borderBoxSize) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.inlineSize) || entry.contentRect.width;
                    // Determine target viewport based on container width
                    const targetViewport = width < 768 ? 'mobile' : 'desktop';
                    // Only update if viewport changed
                    if (state.currentViewport !== targetViewport) {
                        debug.log(`📱 Container-based viewport switch: ${state.currentViewport} → ${targetViewport} (width: ${Math.round(width)}px)`);
                        state.currentViewport = targetViewport;
                    }
                }
            });
            this.viewportResizeObserver.observe(this.hostElement);
        };
    }
    /**
     * Component will load lifecycle
     *
     * **Purpose**: Validate props and initialize component registry
     *
     * **Validation**:
     * - Components prop is required
     * - Each component must have unique type
     * - Basic structure validation
     *
     * **Registry building**:
     * - Convert array to Map for O(1) lookups
     * - Key = component type, Value = ComponentDefinition
     *
     * **Initial state restoration**:
     * - If initialState provided, merge into gridState
     * - Otherwise use empty canvases
     */
    /**
     * Handle item deletion from grid-item-wrapper
     * Internal event dispatched by grid-item-wrapper after user clicks delete
     */
    handleGridItemDelete(event) {
        var _a;
        debug.log('🗑️ @Listen(grid-item:delete) in grid-builder', {
            detail: event.detail,
        });
        const { itemId } = event.detail;
        if (itemId) {
            debug.log('  ✅ Deleting item via API (with undo support):', itemId);
            // Use API method instead of direct deleteItemsBatch to enable undo/redo
            (_a = this.api) === null || _a === void 0 ? void 0 : _a.deleteComponent(itemId);
        }
    }
    componentWillLoad() {
        // Validate required props
        if (!this.components || this.components.length === 0) {
            console.error('GridBuilder: components prop is required');
            return;
        }
        // Build component registry
        this.componentRegistry = new Map(this.components.map(comp => [comp.type, comp]));
        // Validate unique component types
        if (this.componentRegistry.size !== this.components.length) {
            console.warn('GridBuilder: Duplicate component types detected');
        }
        // Expose interact.js globally (required for drag/drop handlers)
        window.interact = interact;
        // Restore initial state if provided
        if (this.initialState) {
            Object.assign(state, this.initialState);
        }
    }
    /**
     * Component did load lifecycle
     *
     * **Purpose**: Initialize global dependencies and plugins
     *
     * **Initialization sequence**:
     * 1. Expose virtualRenderer singleton globally
     * 2. Create GridBuilderAPI instance
     * 3. Initialize plugins via plugin.init(api)
     * 4. Apply theme via CSS variables
     * 5. Expose debug helpers
     */
    componentDidLoad() {
        var _a, _b, _c, _d, _e;
        // Expose virtualRenderer singleton globally (for debugging)
        window.virtualRenderer = virtualRenderer;
        // Create GridBuilderAPI instance
        this.api = this.createAPI();
        // Expose API based on apiRef configuration
        debug.log('🔧 grid-builder exposing API', {
            hasApiRef: !!this.apiRef,
            apiRefKey: (_a = this.apiRef) === null || _a === void 0 ? void 0 : _a.key,
            hasTarget: !!((_b = this.apiRef) === null || _b === void 0 ? void 0 : _b.target),
            targetType: typeof ((_c = this.apiRef) === null || _c === void 0 ? void 0 : _c.target),
            apiCreated: !!this.api,
        });
        if (this.apiRef && this.apiRef.key) {
            const target = this.apiRef.target || window;
            debug.log('  📤 Setting API on target', {
                key: this.apiRef.key,
                isWindow: target === window,
                targetKeys: Object.keys(target).slice(0, 10), // Show first 10 keys
            });
            target[this.apiRef.key] = this.api;
            debug.log('  ✅ API set on target -', {
                key: this.apiRef.key,
                apiNowExists: !!target[this.apiRef.key],
            });
        }
        // Initialize plugins
        if (this.plugins && this.plugins.length > 0) {
            this.initializedPlugins = this.plugins.filter(plugin => {
                try {
                    plugin.init(this.api);
                    debug.log(`GridBuilder: Initialized plugin "${plugin.name}"`);
                    return true;
                }
                catch (e) {
                    console.error(`GridBuilder: Failed to initialize plugin "${plugin.name}":`, e);
                    return false;
                }
            });
        }
        // Apply theme
        if (this.theme) {
            this.applyTheme(this.theme);
        }
        // Configure event debouncing
        const debounceDelay = (_e = (_d = this.config) === null || _d === void 0 ? void 0 : _d.eventDebounceDelay) !== null && _e !== void 0 ? _e : 300;
        eventManager.setDebounceDelay(debounceDelay);
        debug.log(`GridBuilder: Event debounce delay set to ${debounceDelay}ms`);
        // Debug helper
        window.debugInteractables = () => {
            const interactables = interact.interactables.list;
            debug.log('Total interactables:', interactables.length);
            interactables.forEach((interactable, index) => {
                debug.log(`Interactable ${index}:`, {
                    target: interactable.target,
                    actions: interactable._actions,
                    options: interactable.options,
                });
            });
        };
        // Setup canvas drop event handler for palette items
        this.canvasDropHandler = (event) => {
            var _a;
            const customEvent = event;
            const { canvasId, componentType, x, y } = customEvent.detail;
            debug.log('🎯 canvas-drop event received:', { canvasId, componentType, x, y });
            // Get component definition to determine default size
            const definition = this.componentRegistry.get(componentType);
            if (!definition) {
                console.warn(`Component definition not found for type: ${componentType}`);
                return;
            }
            // Convert pixel position to grid units
            const gridX = pixelsToGridX(x, canvasId, this.config);
            const gridY = pixelsToGridY(y, this.config);
            debug.log('  Converting to grid units (before constraints):', {
                gridX,
                gridY,
                defaultWidth: definition.defaultSize.width,
                defaultHeight: definition.defaultSize.height
            });
            // Apply boundary constraints (validate, adjust size, constrain position)
            const constrained = applyBoundaryConstraints(definition, gridX, gridY);
            if (!constrained) {
                console.warn(`Cannot place component "${definition.name}" - minimum size exceeds canvas width`);
                return;
            }
            debug.log('  After boundary constraints:', constrained);
            // Use existing addComponent API method with constrained values
            const newItem = (_a = this.api) === null || _a === void 0 ? void 0 : _a.addComponent(canvasId, componentType, {
                x: constrained.x,
                y: constrained.y,
                width: constrained.width,
                height: constrained.height,
            });
            debug.log('  Created item:', newItem);
        };
        this.hostElement.addEventListener('canvas-drop', this.canvasDropHandler);
        // Setup canvas move event handler for cross-canvas moves
        this.canvasMoveHandler = (event) => {
            const customEvent = event;
            const { itemId, sourceCanvasId, targetCanvasId, x, y } = customEvent.detail;
            debug.log('🔄 canvas-move event received:', { itemId, sourceCanvasId, targetCanvasId, x, y });
            // 1. Get item from source canvas
            const sourceCanvas = state.canvases[sourceCanvasId];
            if (!sourceCanvas) {
                console.error('Source canvas not found:', sourceCanvasId);
                return;
            }
            const itemIndex = sourceCanvas.items.findIndex(i => i.id === itemId);
            if (itemIndex === -1) {
                console.error('Item not found in source canvas:', itemId);
                return;
            }
            const item = sourceCanvas.items[itemIndex];
            // 2. Capture state BEFORE move (for undo)
            const sourcePosition = {
                x: item.layouts.desktop.x,
                y: item.layouts.desktop.y
            };
            // 3. Convert drop position (pixels) to grid units for target canvas
            let gridX = pixelsToGridX(x, targetCanvasId, this.config);
            let gridY = pixelsToGridY(y, this.config);
            // 4. Constrain position to target canvas boundaries
            const constrained = constrainPositionToCanvas(gridX, gridY, item.layouts.desktop.width, item.layouts.desktop.height, CANVAS_WIDTH_UNITS);
            gridX = constrained.x;
            gridY = constrained.y;
            const targetPosition = { x: gridX, y: gridY };
            // 5. Update item position in desktop layout
            item.layouts.desktop.x = gridX;
            item.layouts.desktop.y = gridY;
            // 6. Move item between canvases (updates canvasId, removes from source, adds to target)
            moveItemToCanvas(sourceCanvasId, targetCanvasId, itemId);
            // 7. Assign new z-index in target canvas
            const targetCanvas = state.canvases[targetCanvasId];
            item.zIndex = targetCanvas.zIndexCounter++;
            state.canvases = Object.assign({}, state.canvases); // Trigger reactivity
            // 8. Set target canvas as active
            setActiveCanvas(targetCanvasId);
            // 9. Update selection state if item was selected
            if (state.selectedItemId === itemId) {
                state.selectedCanvasId = targetCanvasId;
            }
            // 10. Create undo/redo command
            const command = new MoveItemCommand(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, itemIndex);
            undoRedo.push(command);
            // 11. Emit events for plugins
            eventManager.emit('componentMoved', {
                item,
                sourceCanvasId,
                targetCanvasId,
                position: targetPosition
            });
            eventManager.emit('canvasActivated', { canvasId: targetCanvasId });
            debug.log('✅ Cross-canvas move completed:', {
                itemId,
                from: sourceCanvasId,
                to: targetCanvasId,
                position: targetPosition
            });
        };
        this.hostElement.addEventListener('canvas-move', this.canvasMoveHandler);
        // Setup canvas activated event handler
        this.canvasActivatedHandler = (event) => {
            const customEvent = event;
            const { canvasId } = customEvent.detail;
            debug.log('🎨 canvas-activated event received:', { canvasId });
            // Emit plugin event
            eventManager.emit('canvasActivated', { canvasId });
        };
        this.hostElement.addEventListener('canvas-activated', this.canvasActivatedHandler);
        // Setup keyboard shortcuts
        this.keyboardHandler = (event) => {
            var _a, _b;
            // Get modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
            const isUndo = (event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey;
            const isRedo = (event.metaKey || event.ctrlKey) && ((event.key === 'z' && event.shiftKey) || // Ctrl/Cmd+Shift+Z
                event.key === 'y' // Ctrl/Cmd+Y
            );
            // Handle undo/redo
            if (isUndo) {
                debug.log('⌨️ Keyboard: Undo triggered');
                event.preventDefault();
                (_a = this.api) === null || _a === void 0 ? void 0 : _a.undo();
                return;
            }
            if (isRedo) {
                debug.log('⌨️ Keyboard: Redo triggered');
                event.preventDefault();
                (_b = this.api) === null || _b === void 0 ? void 0 : _b.redo();
                return;
            }
            // Handle arrow key nudging (only if component is selected)
            if (!state.selectedItemId || !state.selectedCanvasId) {
                return;
            }
            const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
            if (!isArrowKey) {
                return;
            }
            event.preventDefault();
            // Get selected item
            const canvas = state.canvases[state.selectedCanvasId];
            if (!canvas) {
                return;
            }
            const item = canvas.items.find(i => i.id === state.selectedItemId);
            if (!item) {
                return;
            }
            // Get current viewport layout
            const viewport = state.currentViewport;
            const layout = item.layouts[viewport];
            // Calculate nudge amount (1 grid unit in each direction)
            const nudgeAmount = 1;
            let deltaX = 0;
            let deltaY = 0;
            switch (event.key) {
                case 'ArrowUp':
                    deltaY = -1;
                    break;
                case 'ArrowDown':
                    deltaY = nudgeAmount;
                    break;
                case 'ArrowLeft':
                    deltaX = -1;
                    break;
                case 'ArrowRight':
                    deltaX = nudgeAmount;
                    break;
            }
            debug.log('⌨️ Keyboard: Nudging component', {
                key: event.key,
                deltaX,
                deltaY,
                itemId: item.id,
            });
            // Capture old position for undo
            const oldX = layout.x;
            const oldY = layout.y;
            // Update position with boundary checks
            const newX = Math.max(0, layout.x + deltaX);
            const newY = Math.max(0, layout.y + deltaY);
            // Check right boundary (100 grid units = 100%)
            const maxX = 100 - layout.width;
            const constrainedX = Math.min(newX, maxX);
            const constrainedY = newY; // No vertical limit
            // Only update if position actually changed
            if (oldX === constrainedX && oldY === constrainedY) {
                return; // No change, don't create undo command
            }
            // Update item layout (mutate in place to preserve all properties like 'customized')
            layout.x = constrainedX;
            layout.y = constrainedY;
            // Create undo command for nudge
            const nudgeCommand = new MoveItemCommand(item.id, state.selectedCanvasId, state.selectedCanvasId, { x: oldX, y: oldY }, { x: constrainedX, y: constrainedY }, canvas.items.findIndex(i => i.id === item.id));
            undoRedo.push(nudgeCommand);
            // Trigger state update
            state.canvases = Object.assign({}, state.canvases);
            // Emit event
            eventManager.emit('componentDragged', {
                itemId: item.id,
                canvasId: state.selectedCanvasId,
                position: { x: constrainedX, y: constrainedY },
            });
        };
        document.addEventListener('keydown', this.keyboardHandler);
        // Setup container-based viewport switching
        this.setupViewportResizeObserver();
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up resources when component unmounts
     *
     * **Cleanup sequence**:
     * 1. Remove event listeners
     * 2. Destroy all plugins
     * 3. Clear global references
     */
    disconnectedCallback() {
        // Remove event listeners
        if (this.canvasDropHandler) {
            this.hostElement.removeEventListener('canvas-drop', this.canvasDropHandler);
        }
        if (this.canvasMoveHandler) {
            this.hostElement.removeEventListener('canvas-move', this.canvasMoveHandler);
        }
        if (this.canvasActivatedHandler) {
            this.hostElement.removeEventListener('canvas-activated', this.canvasActivatedHandler);
        }
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        // Cleanup ResizeObserver
        if (this.viewportResizeObserver) {
            this.viewportResizeObserver.disconnect();
        }
        // Destroy plugins
        if (this.initializedPlugins.length > 0) {
            this.initializedPlugins.forEach(plugin => {
                try {
                    plugin.destroy();
                    debug.log(`GridBuilder: Destroyed plugin "${plugin.name}"`);
                }
                catch (e) {
                    console.error(`GridBuilder: Failed to destroy plugin "${plugin.name}":`, e);
                }
            });
            this.initializedPlugins = [];
        }
        // Clear global references
        delete window.virtualRenderer;
        // Clear API from storage location if it was set
        if (this.apiRef && this.apiRef.key) {
            const target = this.apiRef.target || window;
            delete target[this.apiRef.key];
        }
    }
    /**
     * Watch components prop for changes
     *
     * **Purpose**: Rebuild component registry when components prop changes
     */
    handleComponentsChange(newComponents) {
        this.componentRegistry = new Map(newComponents.map(comp => [comp.type, comp]));
    }
    /**
     * Create GridBuilderAPI instance
     *
     * **Purpose**: Provide API to plugins and external code
     * **Returns**: GridBuilderAPI implementation
     *
     * **Implementation**: Full API with event system integration
     */
    createAPI() {
        return {
            // ======================
            // Event Subscriptions
            // ======================
            on: (eventName, callback) => {
                eventManager.on(eventName, callback);
            },
            off: (eventName, callback) => {
                eventManager.off(eventName, callback);
            },
            // ======================
            // State Access (Read)
            // ======================
            getState: () => state,
            getItems: (canvasId) => {
                var _a;
                return ((_a = state.canvases[canvasId]) === null || _a === void 0 ? void 0 : _a.items) || [];
            },
            getItem: (itemId) => {
                // Search across all canvases
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const item = canvas.items.find((i) => i.id === itemId);
                    if (item) {
                        return item;
                    }
                }
                return null;
            },
            // ======================
            // Programmatic Operations
            // ======================
            addComponent: (canvasId, componentType, position, config) => {
                const canvas = state.canvases[canvasId];
                if (!canvas) {
                    console.error(`Canvas not found: ${canvasId}`);
                    return null;
                }
                // Create new item
                const newItem = {
                    id: generateItemId(),
                    canvasId,
                    name: componentType,
                    type: componentType,
                    zIndex: ++canvas.zIndexCounter,
                    layouts: {
                        desktop: Object.assign({}, position),
                        mobile: { x: 0, y: 0, width: 50, height: position.height, customized: false },
                    },
                    config: config || {},
                };
                // Add to canvas
                canvas.items.push(newItem);
                state.canvases = Object.assign({}, state.canvases);
                // Add to undo/redo history
                undoRedo.push(new BatchAddCommand([newItem.id]));
                // Emit event
                eventManager.emit('componentAdded', { item: newItem, canvasId });
                return newItem.id;
            },
            deleteComponent: (itemId) => {
                // Find and delete item across all canvases
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
                    if (itemIndex !== -1) {
                        // Add to undo/redo history BEFORE deletion (need state for undo)
                        undoRedo.push(new BatchDeleteCommand([itemId]));
                        // Delete item
                        canvas.items.splice(itemIndex, 1);
                        state.canvases = Object.assign({}, state.canvases);
                        // Deselect if deleted item was selected
                        if (state.selectedItemId === itemId) {
                            state.selectedItemId = null;
                            state.selectedCanvasId = null;
                        }
                        // Emit event
                        eventManager.emit('componentDeleted', { itemId, canvasId });
                        return true;
                    }
                }
                return false;
            },
            updateConfig: (itemId, config) => {
                // Find and update item across all canvases
                for (const canvasId in state.canvases) {
                    const canvas = state.canvases[canvasId];
                    const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
                    if (itemIndex !== -1) {
                        const item = canvas.items[itemIndex];
                        const newConfig = Object.assign(Object.assign({}, item.config), config);
                        // Create undo command BEFORE making changes
                        const batchUpdate = [{
                                itemId,
                                canvasId,
                                updates: { config: newConfig },
                            }];
                        undoRedo.push(new BatchUpdateConfigCommand(batchUpdate));
                        // Merge config
                        canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { config: newConfig });
                        state.canvases = Object.assign({}, state.canvases);
                        // Emit event
                        eventManager.emit('configChanged', { itemId, canvasId, config });
                        return true;
                    }
                }
                return false;
            },
            // ======================
            // Batch Operations
            // ======================
            addComponentsBatch: (components) => {
                // Convert API format to state-manager format
                const partialItems = components.map(({ canvasId, type, position, config }) => ({
                    canvasId,
                    type,
                    name: type,
                    layouts: {
                        desktop: Object.assign({}, position),
                        mobile: { x: 0, y: 0, width: 50, height: position.height, customized: false },
                    },
                    config: config || {},
                }));
                // Use state-manager batch operation (single state update)
                const itemIds = addItemsBatch(partialItems);
                // Add to undo/redo history
                undoRedo.push(new BatchAddCommand(itemIds));
                // Emit batch event
                const createdItems = itemIds.map(id => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(id);
                    return item ? { item, canvasId: item.canvasId } : null;
                }).filter(Boolean);
                eventManager.emit('componentsBatchAdded', { items: createdItems });
                return itemIds;
            },
            deleteComponentsBatch: (itemIds) => {
                // Store deleted items for event
                const deletedItems = itemIds.map(itemId => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(itemId);
                    return item ? { itemId, canvasId: item.canvasId } : null;
                }).filter(Boolean);
                // Add to undo/redo history BEFORE deletion (need state for undo)
                undoRedo.push(new BatchDeleteCommand(itemIds));
                // Use state-manager batch operation (single state update)
                deleteItemsBatch(itemIds);
                // Clear selection if any deleted item was selected
                if (state.selectedItemId && itemIds.includes(state.selectedItemId)) {
                    state.selectedItemId = null;
                    state.selectedCanvasId = null;
                }
                // Emit batch event
                eventManager.emit('componentsBatchDeleted', { items: deletedItems });
            },
            updateConfigsBatch: (updates) => {
                // Convert to state-manager format (need canvasId)
                const batchUpdates = updates.map(({ itemId, config }) => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(itemId);
                    if (!item) {
                        console.warn(`Item ${itemId} not found for config update`);
                        return null;
                    }
                    return {
                        itemId,
                        canvasId: item.canvasId,
                        updates: { config: Object.assign(Object.assign({}, item.config), config) },
                    };
                }).filter(Boolean);
                // Add to undo/redo history
                undoRedo.push(new BatchUpdateConfigCommand(batchUpdates));
                // Use state-manager batch operation (single state update)
                updateItemsBatch(batchUpdates);
                // Emit batch event
                const updatedItems = batchUpdates.map(({ itemId, canvasId, updates }) => ({
                    itemId,
                    canvasId,
                    config: updates.config,
                }));
                eventManager.emit('configsBatchChanged', { items: updatedItems });
            },
            // ======================
            // Canvas Access
            // ======================
            getCanvasElement: (canvasId) => {
                return document.getElementById(canvasId);
            },
            // ======================
            // Undo/Redo Operations
            // ======================
            undo: () => {
                undoRedo.undo();
                // Emit event after undo
                eventManager.emit('undoExecuted', {});
            },
            redo: () => {
                undoRedo.redo();
                // Emit event after redo
                eventManager.emit('redoExecuted', {});
            },
            canUndo: () => {
                return undoRedo.canUndo();
            },
            canRedo: () => {
                return undoRedo.canRedo();
            },
            undoRedoState: undoRedoState,
            // ======================
            // Canvas Management
            // ======================
            addCanvas: (canvasId) => {
                // Create and execute command
                const command = new AddCanvasCommand(canvasId);
                undoRedo.push(command);
                command.redo();
            },
            removeCanvas: (canvasId) => {
                // Create and execute command
                const command = new RemoveCanvasCommand(canvasId);
                undoRedo.push(command);
                command.redo();
            },
            setActiveCanvas: (canvasId) => {
                setActiveCanvas(canvasId);
                eventManager.emit('canvasActivated', { canvasId });
            },
            getActiveCanvas: () => {
                return state.activeCanvasId;
            },
        };
    }
    /**
     * Apply theme via CSS variables
     *
     * **Purpose**: Apply theme customization to host element
     * **Implementation**: Set CSS custom properties on :host
     */
    applyTheme(theme) {
        const host = this.el;
        if (!host)
            return;
        // Apply predefined theme properties
        if (theme.primaryColor) {
            host.style.setProperty('--grid-builder-primary-color', theme.primaryColor);
        }
        if (theme.paletteBackground) {
            host.style.setProperty('--grid-builder-palette-bg', theme.paletteBackground);
        }
        if (theme.canvasBackground) {
            host.style.setProperty('--grid-builder-canvas-bg', theme.canvasBackground);
        }
        if (theme.gridLineColor) {
            host.style.setProperty('--grid-builder-grid-line-color', theme.gridLineColor);
        }
        if (theme.selectionColor) {
            host.style.setProperty('--grid-builder-selection-color', theme.selectionColor);
        }
        if (theme.resizeHandleColor) {
            host.style.setProperty('--grid-builder-resize-handle-color', theme.resizeHandleColor);
        }
        if (theme.fontFamily) {
            host.style.setProperty('--grid-builder-font-family', theme.fontFamily);
        }
        // Apply custom properties
        if (theme.customProperties) {
            Object.entries(theme.customProperties).forEach(([key, value]) => {
                host.style.setProperty(key, value);
            });
        }
    }
    /**
     * Export current state to JSON-serializable format
     *
     * **Purpose**: Export grid layout for saving or transferring to viewer app
     *
     * **Use Cases**:
     * - Save layout to database/localStorage
     * - Transfer layout to viewer app via API
     * - Create layout templates/presets
     * - Backup/restore functionality
     *
     * **Example - Save to API**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const exportData = await builder.exportState();
     * await fetch('/api/layouts', {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify(exportData)
     * });
     * ```
     *
     * **Example - Save to localStorage**:
     * ```typescript
     * const exportData = await builder.exportState();
     * localStorage.setItem('grid-layout', JSON.stringify(exportData));
     * ```
     *
     * @returns Promise<GridExport> - JSON-serializable export object
     */
    async exportState() {
        // Build export data from current gridState
        const exportData = {
            version: '1.0.0',
            canvases: {},
            viewport: state.currentViewport,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
        // Export each canvas with its items
        for (const canvasId in state.canvases) {
            const canvas = state.canvases[canvasId];
            exportData.canvases[canvasId] = {
                items: canvas.items.map(item => ({
                    id: item.id,
                    canvasId: item.canvasId,
                    type: item.type,
                    name: item.name,
                    layouts: {
                        desktop: Object.assign({}, item.layouts.desktop),
                        mobile: Object.assign({}, item.layouts.mobile),
                    },
                    zIndex: item.zIndex,
                    config: Object.assign({}, item.config), // Deep copy to avoid mutations
                })),
            };
        }
        return exportData;
    }
    /**
     * Import state from JSON-serializable format
     *
     * **Purpose**: Restore previously exported grid state
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const savedState = JSON.parse(localStorage.getItem('grid-layout'));
     * await builder.importState(savedState);
     * ```
     *
     * @param state - GridExport or partial GridState object
     */
    async importState(state$1) {
        // Import grid state
        Object.assign(state, state$1);
    }
    /**
     * Get current grid state
     *
     * **Purpose**: Direct access to grid state for reading
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const state = await builder.getState();
     * console.log('Current viewport:', state.currentViewport);
     * ```
     *
     * @returns Promise<GridState> - Current grid state
     */
    async getState() {
        return state;
    }
    /**
     * Add a new canvas programmatically
     *
     * **Purpose**: Create new section/canvas in the grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.addCanvas('new-section');
     * ```
     *
     * @param canvasId - Unique canvas identifier
     */
    async addCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.addCanvas(canvasId);
    }
    /**
     * Remove a canvas programmatically
     *
     * **Purpose**: Delete section/canvas from the grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.removeCanvas('old-section');
     * ```
     *
     * @param canvasId - Canvas identifier to remove
     */
    async removeCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.removeCanvas(canvasId);
    }
    /**
     * Set active canvas programmatically
     *
     * **Purpose**: Activate a specific canvas for focused editing
     *
     * **Use cases**:
     * - Focus specific section after adding items
     * - Programmatic navigation between sections
     * - Show canvas-specific settings panel
     *
     * **Events triggered**: 'canvasActivated'
     *
     * @param canvasId - Canvas to activate
     *
     * @example
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.setActiveCanvas('canvas2');
     * ```
     */
    async setActiveCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.setActiveCanvas(canvasId);
    }
    /**
     * Get currently active canvas ID
     *
     * **Purpose**: Check which canvas is currently active/focused
     *
     * @returns Promise<string | null> - Active canvas ID or null if none active
     *
     * @example
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const activeId = await builder.getActiveCanvas();
     * if (activeId === 'canvas1') {
     *   console.log('Canvas 1 is active');
     * }
     * ```
     */
    async getActiveCanvas() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.getActiveCanvas()) || null;
    }
    /**
     * Undo last action
     *
     * **Purpose**: Revert last user action (move, resize, add, delete, etc.)
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.undo();
     * ```
     */
    async undo() {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.undo();
    }
    /**
     * Redo last undone action
     *
     * **Purpose**: Re-apply last undone action
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.redo();
     * ```
     */
    async redo() {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.redo();
    }
    /**
     * Check if undo is available
     *
     * **Purpose**: Determine if there are actions to undo
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const canUndo = await builder.canUndo();
     * undoButton.disabled = !canUndo;
     * ```
     *
     * @returns Promise<boolean> - True if undo is available
     */
    async canUndo() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.canUndo()) || false;
    }
    /**
     * Check if redo is available
     *
     * **Purpose**: Determine if there are actions to redo
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const canRedo = await builder.canRedo();
     * redoButton.disabled = !canRedo;
     * ```
     *
     * @returns Promise<boolean> - True if redo is available
     */
    async canRedo() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.canRedo()) || false;
    }
    /**
     * Add a component programmatically
     *
     * **Purpose**: Add new component to canvas without dragging from palette
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const itemId = await builder.addComponent('canvas1', 'header', {
     *   x: 10, y: 10, width: 30, height: 6
     * }, { title: 'My Header' });
     * ```
     *
     * @param canvasId - Canvas to add component to
     * @param componentType - Component type from registry
     * @param position - Grid position and size
     * @param config - Optional component configuration
     * @returns Promise<string | null> - New item ID or null if failed
     */
    async addComponent(canvasId, componentType, position, config) {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.addComponent(canvasId, componentType, position, config)) || null;
    }
    /**
     * Delete a component programmatically
     *
     * **Purpose**: Remove component from grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const success = await builder.deleteComponent('item-123');
     * ```
     *
     * @param itemId - Item ID to delete
     * @returns Promise<boolean> - True if deleted successfully
     */
    async deleteComponent(itemId) {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.deleteComponent(itemId)) || false;
    }
    /**
     * Update component configuration
     *
     * **Purpose**: Update component properties/config
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const success = await builder.updateConfig('item-123', {
     *   title: 'Updated Title',
     *   color: '#ff0000'
     * });
     * ```
     *
     * @param itemId - Item ID to update
     * @param config - Configuration updates
     * @returns Promise<boolean> - True if updated successfully
     */
    async updateConfig(itemId, config) {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.updateConfig(itemId, config)) || false;
    }
    /**
     * Render component template
     *
     * **Purpose**: Render main UI structure
     *
     * **Structure**:
     * - Host element with theme classes
     * - Component palette (sidebar or custom)
     * - Canvas area with sections
     *
     * **Note**: Actual rendering delegates to child components:
     * - <component-palette> or custom ComponentPalette
     * - <canvas-section> for each canvas
     *
     * **Config Panel**: Users should implement their own config panels
     * - See custom-config-panel in demo for reference implementation
     * - Listen to 'item-click' events to show your config UI
     */
    render() {
        const canvasIds = Object.keys(state.canvases);
        return (h(Host, { key: '41f88f4f0486a63bbbe473fb738b3ac2ae21ecc9', ref: (el) => this.el = el }, h("div", { key: 'dbcda54b31a36ee34522ef697892dd4628d717b3', class: "grid-builder-container" }, h("div", { key: '9a59401dd27a47b88558a791b80a084f4ac90e7e', class: "palette-area" }, h("component-palette", { key: '3b83fa7ec7e23bf61a64b4361d39368c3a028b08', components: this.components, config: this.config })), h("div", { key: 'e7366c25649d47699d8e0e5816656d04280abc68', class: "canvas-area" }, h("div", { key: '99ee6f4776120765eaa81a09f166af999deab27d', class: "canvases-container" }, canvasIds.map((canvasId) => {
            var _a, _b, _c, _d;
            return (h("canvas-section", { key: canvasId, canvasId: canvasId, isActive: state.activeCanvasId === canvasId, config: this.config, componentRegistry: this.componentRegistry, backgroundColor: (_b = (_a = this.canvasMetadata) === null || _a === void 0 ? void 0 : _a[canvasId]) === null || _b === void 0 ? void 0 : _b.backgroundColor, canvasTitle: (_d = (_c = this.canvasMetadata) === null || _c === void 0 ? void 0 : _c[canvasId]) === null || _d === void 0 ? void 0 : _d.title, onBeforeDelete: this.onBeforeDelete }));
        }))))));
    }
    get hostElement() { return this; }
    static get watchers() { return {
        "components": ["handleComponentsChange"]
    }; }
    static get style() { return gridBuilderCss; }
}, [256, "grid-builder", {
        "components": [16],
        "config": [16],
        "theme": [16],
        "plugins": [16],
        "uiOverrides": [16],
        "initialState": [16],
        "canvasMetadata": [16],
        "onBeforeDelete": [16],
        "apiRef": [16],
        "componentRegistry": [32],
        "initializedPlugins": [32],
        "exportState": [64],
        "importState": [64],
        "getState": [64],
        "addCanvas": [64],
        "removeCanvas": [64],
        "setActiveCanvas": [64],
        "getActiveCanvas": [64],
        "undo": [64],
        "redo": [64],
        "canUndo": [64],
        "canRedo": [64],
        "addComponent": [64],
        "deleteComponent": [64],
        "updateConfig": [64]
    }, [[0, "grid-item:delete", "handleGridItemDelete"]], {
        "components": ["handleComponentsChange"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["grid-builder", "canvas-section", "component-palette", "grid-item-wrapper"];
    components.forEach(tagName => { switch (tagName) {
        case "grid-builder":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, GridBuilder);
            }
            break;
        case "canvas-section":
            if (!customElements.get(tagName)) {
                defineCustomElement$3();
            }
            break;
        case "component-palette":
            if (!customElements.get(tagName)) {
                defineCustomElement$2();
            }
            break;
        case "grid-item-wrapper":
            if (!customElements.get(tagName)) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { GridBuilder as G, defineCustomElement as d };
//# sourceMappingURL=grid-builder2.js.map

//# sourceMappingURL=grid-builder2.js.map