/**
 * Grid Builder - Main Library Component
 * =======================================
 *
 * Main entry point for the grid builder library. Accepts component definitions,
 * configuration, and customization options via props to create a fully functional
 * drag-and-drop page builder.
 *
 * ## Library Design Philosophy
 *
 * **Consumer-driven configuration**:
 * - Library provides infrastructure (drag/drop, undo/redo, state management)
 * - Consumer provides content (component types, initial layout, styling)
 * - Clean separation of concerns
 * - Maximum flexibility
 *
 * **Props-based API**:
 * ```typescript
 * <grid-builder
 *   components={componentDefinitions}     // Required: Component type registry
 *   config={gridConfig}                   // Optional: Grid system config
 *   theme={gridTheme}                     // Optional: Visual customization
 *   plugins={pluginInstances}             // Optional: Plugin extensions
 *   uiOverrides={customUIComponents}      // Optional: Custom UI rendering
 *   initialState={savedState}             // Optional: Restore saved layout
 * />
 * ```
 *
 * ## Component Lifecycle
 *
 * **Initialization flow**:
 * 1. componentWillLoad: Validate props, set defaults, restore initial state
 * 2. componentDidLoad: Initialize plugins, setup global dependencies, attach event listeners
 * 3. render: Render UI structure (palette, canvases, config panel)
 * 4. disconnectedCallback: Cleanup plugins, remove listeners, dispose resources
 *
 * **State management**:
 * - Uses global gridState from state-manager.ts
 * - Components subscribe via StencilJS reactivity
 * - Plugins access via GridBuilderAPI
 * - Clean separation of library vs consumer state
 *
 * @module grid-builder
 */

import {
  Component,
  Element,
  h,
  Host,
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from "@stencil/core";
import interact from "interactjs";

// Type imports
import { ComponentDefinition } from "../../types/component-definition";
import { GridConfig } from "../../types/grid-config";
import { GridBuilderTheme } from "../../types/theme";
import { GridBuilderPlugin } from "../../types/plugin";
import { UIComponentOverrides } from "../../types/ui-overrides";
import { GridBuilderAPI } from "../../types/api";
import { DeletionHook } from "../../types/deletion-hook";
import { GridExport } from "../../types/grid-export";

// Service imports
import {
  gridState,
  GridState,
  generateItemId,
  deleteItemsBatch,
  addItemsBatch,
  updateItemsBatch,
  setActiveCanvas,
  moveItemToCanvas,
} from "../../services/state-manager";
import { virtualRenderer } from "../../services/virtual-renderer";
import { eventManager } from "../../services/event-manager";
import {
  BatchAddCommand,
  BatchDeleteCommand,
  BatchUpdateConfigCommand,
  AddCanvasCommand,
  RemoveCanvasCommand,
  MoveItemCommand,
} from "../../services/undo-redo-commands";
import { undoRedo, undoRedoState } from "../../services/undo-redo";

// Utility imports
import { pixelsToGridX, pixelsToGridY } from "../../utils/grid-calculations";
import {
  applyBoundaryConstraints,
  constrainPositionToCanvas,
  CANVAS_WIDTH_UNITS,
} from "../../utils/boundary-constraints";
import { createDebugLogger } from "../../utils/debug";

const debug = createDebugLogger("grid-builder");

/**
 * GridBuilder Component
 * ======================
 *
 * Main library component providing complete grid builder functionality.
 *
 * **Tag**: `<grid-builder>`
 * **Shadow DOM**: Disabled (required for interact.js compatibility)
 * **Reactivity**: Listens to gridState changes via StencilJS store
 */
@Component({
  tag: "grid-builder",
  styleUrl: "grid-builder.scss",
  shadow: false, // Light DOM required for interact.js
})
export class GridBuilder {
  /**
   * Component definitions registry
   *
   * **Required prop**: Array of ComponentDefinition objects
   * **Purpose**: Defines available component types (header, text, button, etc.)
   *
   * **Each definition includes**:
   * - type: Unique identifier (e.g., 'header', 'text-block')
   * - name: Display name in palette
   * - icon: Visual identifier (emoji recommended)
   * - defaultSize: Initial size when dropped
   * - render: Function returning component to render
   * - configSchema: Optional auto-generated config form
   * - renderConfigPanel: Optional custom config UI
   * - Lifecycle hooks: onVisible, onHidden for virtual rendering
   *
   * **Example**:
   * ```typescript
   * const components = [
   *   {
   *     type: 'header',
   *     name: 'Header',
   *     icon: '📄',
   *     defaultSize: { width: 20, height: 8 },
   *     render: ({ itemId, config }) => (
   *       <my-header itemId={itemId} config={config} />
   *     ),
   *     configSchema: [
   *       { name: 'text', label: 'Text', type: 'text', defaultValue: 'Header' }
   *     ]
   *   }
   * ];
   * ```
   */
  @Prop() components!: ComponentDefinition[];

  /**
   * Grid configuration options
   *
   * **Optional prop**: Customizes grid system behavior
   * **Default**: Standard 2% grid with 10px-50px constraints
   *
   * **Configuration options**:
   * - gridSizePercent: Grid unit as % of width (default: 2)
   * - minGridSize: Minimum size in pixels (default: 10)
   * - maxGridSize: Maximum size in pixels (default: 50)
   * - snapToGrid: Enable snap-to-grid (default: true)
   * - showGridLines: Show visual grid (default: true)
   * - minItemSize: Minimum item dimensions (default: { width: 5, height: 4 })
   * - virtualRenderMargin: Pre-render margin (default: '20%')
   *
   * **Example**:
   * ```typescript
   * const config = {
   *   gridSizePercent: 3,           // 3% grid (33 units per 100%)
   *   minGridSize: 15,              // 15px minimum
   *   maxGridSize: 60,              // 60px maximum
   *   snapToGrid: true,
   *   virtualRenderMargin: '30%'    // Aggressive pre-loading
   * };
   * ```
   */
  @Prop() config?: GridConfig;

  /**
   * Visual theme customization
   *
   * **Optional prop**: Customizes colors, fonts, and styling
   * **Default**: Bootstrap-inspired blue theme
   *
   * **Theme options**:
   * - primaryColor: Accent color (default: '#007bff')
   * - paletteBackground: Palette sidebar color (default: '#f5f5f5')
   * - canvasBackground: Canvas background (default: '#ffffff')
   * - gridLineColor: Grid line color (default: 'rgba(0,0,0,0.1)')
   * - selectionColor: Selection outline (default: '#007bff')
   * - resizeHandleColor: Resize handle color (default: '#007bff')
   * - fontFamily: UI font (default: system font stack)
   * - customProperties: CSS variables for advanced theming
   *
   * **Example**:
   * ```typescript
   * const theme = {
   *   primaryColor: '#ff6b6b',        // Brand red
   *   paletteBackground: '#fff5f5',   // Light red
   *   customProperties: {
   *     '--text-color': '#ffffff',
   *     '--border-radius': '8px'
   *   }
   * };
   * ```
   */
  @Prop() theme?: GridBuilderTheme;

  /**
   * Plugin instances for extending functionality
   *
   * **Optional prop**: Array of GridBuilderPlugin instances
   * **Purpose**: Add custom features, analytics, integrations
   *
   * **Plugin lifecycle**:
   * 1. Library calls plugin.init(api) on componentDidLoad
   * 2. Plugin subscribes to events, adds UI, etc.
   * 3. Library calls plugin.destroy() on disconnectedCallback
   *
   * **Example**:
   * ```typescript
   * class AnalyticsPlugin implements GridBuilderPlugin {
   *   name = 'analytics';
   *
   *   init(api: GridBuilderAPI) {
   *     api.on('componentAdded', (e) => {
   *       analytics.track('Component Added', { type: e.item.type });
   *     });
   *   }
   *
   *   destroy() {
   *     // Cleanup
   *   }
   * }
   *
   * const plugins = [new AnalyticsPlugin()];
   * ```
   */
  @Prop() plugins?: GridBuilderPlugin[];

  /**
   * Custom UI component overrides
   *
   * **Optional prop**: Replace default UI components
   * **Purpose**: Fully customize visual appearance
   *
   * **Overridable components**:
   * - ConfigPanel: Configuration panel UI
   * - ComponentPalette: Component palette sidebar
   * - Toolbar: Top toolbar with controls
   *
   * **Example**:
   * ```typescript
   * const uiOverrides = {
   *   Toolbar: (props) => (
   *     <div class="my-toolbar">
   *       <button onClick={props.onUndo}>Undo</button>
   *       <button onClick={props.onRedo}>Redo</button>
   *     </div>
   *   )
   * };
   * ```
   */
  @Prop() uiOverrides?: UIComponentOverrides;

  /**
   * Initial state to restore
   *
   * **Optional prop**: Restore saved layout
   * **Purpose**: Load previously saved grid state
   *
   * **State structure**: Same as gridState (canvases, viewport, etc.)
   *
   * **Example**:
   * ```typescript
   * const savedState = JSON.parse(localStorage.getItem('grid-state'));
   * <grid-builder initialState={savedState} ... />
   * ```
   */
  @Prop() initialState?: Partial<GridState>;

  /**
   * Canvas metadata storage (host app responsibility)
   *
   * **Optional prop**: Store canvas-level presentation metadata
   * **Purpose**: Host app owns canvas metadata (titles, colors, settings)
   *
   * **Separation of concerns**:
   * - Library owns placement state (items, layouts, zIndex)
   * - Host app owns presentation state (colors, titles, custom metadata)
   *
   * **Structure**: Record<canvasId, any>
   *
   * **Example**:
   * ```typescript
   * const canvasMetadata = {
   *   'hero-section': {
   *     title: 'Hero Section',
   *     backgroundColor: '#f0f4f8',
   *     customSettings: { ... }
   *   },
   *   'articles-grid': {
   *     title: 'Articles Grid',
   *     backgroundColor: '#ffffff'
   *   }
   * };
   * <grid-builder canvasMetadata={canvasMetadata} ... />
   * ```
   *
   * **Use with canvas-click events**:
   * - Library fires canvas-click event when canvas background clicked
   * - Host app shows canvas settings panel
   * - Host app updates canvasMetadata state
   * - Library passes metadata to canvas-section via props
   */
  @Prop() canvasMetadata?: Record<string, any>;

  /**
   * Hook called before deleting a component
   *
   * **Optional prop**: Intercept deletion requests for custom workflows
   * **Purpose**: Allow host app to show confirmation, make API calls, etc.
   *
   * **Hook behavior**:
   * - Return `true` to proceed with deletion
   * - Return `false` to cancel the deletion
   * - Return a Promise for async operations (modals, API calls)
   *
   * **Example - Confirmation modal**:
   * ```typescript
   * const onBeforeDelete = async (context) => {
   *   const confirmed = await showConfirmModal(
   *     `Delete ${context.item.name}?`,
   *     'This action cannot be undone.'
   *   );
   *   return confirmed;
   * };
   * <grid-builder onBeforeDelete={onBeforeDelete} ... />
   * ```
   *
   * **Example - API call + confirmation**:
   * ```typescript
   * const onBeforeDelete = async (context) => {
   *   // Show loading modal
   *   const modal = showLoadingModal('Deleting...');
   *
   *   try {
   *     // Make API call
   *     await fetch(`/api/components/${context.itemId}`, {
   *       method: 'DELETE'
   *     });
   *     modal.close();
   *     return true; // Proceed with deletion
   *   } catch (error) {
   *     modal.close();
   *     showErrorModal('Failed to delete component');
   *     return false; // Cancel deletion
   *   }
   * };
   * ```
   *
   * **Default behavior**: If not provided, components delete immediately
   */
  @Prop() onBeforeDelete?: DeletionHook;

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
  @Prop() apiRef?: { target?: any; key?: string } | null = {
    target: undefined,
    key: "gridBuilderAPI",
  };

  /**
   * Component registry (internal state)
   *
   * **Purpose**: Map component type → definition for lookup
   * **Built from**: components prop
   * **Used by**: grid-item-wrapper for dynamic rendering
   *
   * **Structure**: `{ 'header': ComponentDefinition, 'text': ComponentDefinition, ... }`
   */
  @State() private componentRegistry: Map<string, ComponentDefinition> =
    new Map();

  /**
   * Initialized plugins (internal state)
   *
   * **Purpose**: Track plugin instances for cleanup
   * **Lifecycle**: Set in componentDidLoad, cleared in disconnectedCallback
   */
  @State() private initializedPlugins: GridBuilderPlugin[] = [];

  /**
   * GridBuilderAPI instance (internal state)
   *
   * **Purpose**: Provides API to plugins and external code
   * **Lifecycle**: Created in componentDidLoad
   */
  private api?: GridBuilderAPI;

  /**
   * Host element reference
   *
   * **Purpose**: Access to host element for event listeners
   */
  @Element() private hostElement!: HTMLElement;

  /**
   * Event listener references for cleanup
   */
  private canvasDropHandler?: (e: Event) => void;
  private canvasMoveHandler?: (e: Event) => void;
  private canvasActivatedHandler?: (e: Event) => void;
  private keyboardHandler?: (e: KeyboardEvent) => void;

  /**
   * ResizeObserver for container-based viewport switching
   *
   * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
   * **Breakpoint**: 768px (container width, not window width)
   * **Cleanup**: disconnectedCallback() disconnects observer
   */
  private viewportResizeObserver?: ResizeObserver;

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
  @Listen("grid-item:delete")
  handleGridItemDelete(event: CustomEvent) {
    debug.log("🗑️ @Listen(grid-item:delete) in grid-builder", {
      detail: event.detail,
    });

    const { itemId } = event.detail;
    if (itemId) {
      debug.log("  ✅ Deleting item via API (with undo support):", itemId);
      // Use API method instead of direct deleteItemsBatch to enable undo/redo
      this.api?.deleteComponent(itemId);
    }
  }

  componentWillLoad() {
    // Validate required props
    if (!this.components || this.components.length === 0) {
      console.error("GridBuilder: components prop is required");
      return;
    }

    // Build component registry
    this.componentRegistry = new Map(
      this.components.map((comp) => [comp.type, comp]),
    );

    // Validate unique component types
    if (this.componentRegistry.size !== this.components.length) {
      console.warn("GridBuilder: Duplicate component types detected");
    }

    // Expose interact.js globally (required for drag/drop handlers)
    (window as any).interact = interact;

    // Restore initial state if provided
    if (this.initialState) {
      Object.assign(gridState, this.initialState);
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
    // Expose virtualRenderer singleton globally (for debugging)
    (window as any).virtualRenderer = virtualRenderer;

    // Create GridBuilderAPI instance
    this.api = this.createAPI();

    // Expose API based on apiRef configuration
    debug.log("🔧 grid-builder exposing API", {
      hasApiRef: !!this.apiRef,
      apiRefKey: this.apiRef?.key,
      hasTarget: !!this.apiRef?.target,
      targetType: typeof this.apiRef?.target,
      apiCreated: !!this.api,
    });

    if (this.apiRef && this.apiRef.key) {
      const target = this.apiRef.target || window;
      debug.log("  📤 Setting API on target", {
        key: this.apiRef.key,
        isWindow: target === window,
        targetKeys: Object.keys(target).slice(0, 10), // Show first 10 keys
      });
      target[this.apiRef.key] = this.api;
      debug.log("  ✅ API set on target -", {
        key: this.apiRef.key,
        apiNowExists: !!target[this.apiRef.key],
      });
    }

    // Initialize plugins
    if (this.plugins && this.plugins.length > 0) {
      this.initializedPlugins = this.plugins.filter((plugin) => {
        try {
          plugin.init(this.api!);
          debug.log(`GridBuilder: Initialized plugin "${plugin.name}"`);
          return true;
        } catch (e) {
          console.error(
            `GridBuilder: Failed to initialize plugin "${plugin.name}":`,
            e,
          );
          return false;
        }
      });
    }

    // Apply theme
    if (this.theme) {
      this.applyTheme(this.theme);
    }

    // Configure event debouncing
    const debounceDelay = this.config?.eventDebounceDelay ?? 300;
    eventManager.setDebounceDelay(debounceDelay);
    debug.log(`GridBuilder: Event debounce delay set to ${debounceDelay}ms`);

    // Debug helper
    (window as any).debugInteractables = () => {
      const interactables = (interact as any).interactables.list;
      debug.log("Total interactables:", interactables.length);
      interactables.forEach((interactable: any, index: number) => {
        debug.log(`Interactable ${index}:`, {
          target: interactable.target,
          actions: interactable._actions,
          options: interactable.options,
        });
      });
    };

    // Setup canvas drop event handler for palette items
    this.canvasDropHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { canvasId, componentType, x, y } = customEvent.detail;

      debug.log("🎯 canvas-drop event received:", {
        canvasId,
        componentType,
        x,
        y,
      });

      // Get component definition to determine default size
      const definition = this.componentRegistry.get(componentType);
      if (!definition) {
        console.warn(
          `Component definition not found for type: ${componentType}`,
        );
        return;
      }

      // Convert pixel position to grid units
      const gridX = pixelsToGridX(x, canvasId, this.config);
      const gridY = pixelsToGridY(y, this.config);

      debug.log("  Converting to grid units (before constraints):", {
        gridX,
        gridY,
        defaultWidth: definition.defaultSize.width,
        defaultHeight: definition.defaultSize.height,
      });

      // Apply boundary constraints (validate, adjust size, constrain position)
      const constrained = applyBoundaryConstraints(definition, gridX, gridY);

      if (!constrained) {
        console.warn(
          `Cannot place component "${definition.name}" - minimum size exceeds canvas width`,
        );
        return;
      }

      debug.log("  After boundary constraints:", constrained);

      // Use existing addComponent API method with constrained values
      const newItem = this.api?.addComponent(canvasId, componentType, {
        x: constrained.x,
        y: constrained.y,
        width: constrained.width,
        height: constrained.height,
      });

      debug.log("  Created item:", newItem);

      // Set the target canvas as active when item is dropped
      setActiveCanvas(canvasId);
      eventManager.emit("canvasActivated", { canvasId });
    };

    this.hostElement.addEventListener("canvas-drop", this.canvasDropHandler);

    // Setup canvas move event handler for cross-canvas moves
    this.canvasMoveHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { itemId, sourceCanvasId, targetCanvasId, x, y } =
        customEvent.detail;

      debug.log("🔄 canvas-move event received:", {
        itemId,
        sourceCanvasId,
        targetCanvasId,
        x,
        y,
      });

      // 1. Get item from source canvas
      const sourceCanvas = gridState.canvases[sourceCanvasId];
      if (!sourceCanvas) {
        console.error("Source canvas not found:", sourceCanvasId);
        return;
      }

      const itemIndex = sourceCanvas.items.findIndex((i) => i.id === itemId);
      if (itemIndex === -1) {
        console.error("Item not found in source canvas:", itemId);
        return;
      }

      const item = sourceCanvas.items[itemIndex];

      // 2. Capture state BEFORE move (for undo)
      const sourcePosition = {
        x: item.layouts.desktop.x,
        y: item.layouts.desktop.y,
      };

      // 3. Convert drop position (pixels) to grid units for target canvas
      let gridX = pixelsToGridX(x, targetCanvasId, this.config);
      let gridY = pixelsToGridY(y, this.config);

      // 4. Constrain position to target canvas boundaries
      const constrained = constrainPositionToCanvas(
        gridX,
        gridY,
        item.layouts.desktop.width,
        item.layouts.desktop.height,
        CANVAS_WIDTH_UNITS,
      );

      gridX = constrained.x;
      gridY = constrained.y;

      const targetPosition = { x: gridX, y: gridY };

      // 5. Update item position in desktop layout
      item.layouts.desktop.x = gridX;
      item.layouts.desktop.y = gridY;

      // 6. Move item between canvases (updates canvasId, removes from source, adds to target)
      moveItemToCanvas(sourceCanvasId, targetCanvasId, itemId);

      // 7. Assign new z-index in target canvas
      const targetCanvas = gridState.canvases[targetCanvasId];
      item.zIndex = targetCanvas.zIndexCounter++;
      gridState.canvases = { ...gridState.canvases }; // Trigger reactivity

      // 8. Set target canvas as active
      setActiveCanvas(targetCanvasId);

      // 9. Update selection state if item was selected
      if (gridState.selectedItemId === itemId) {
        gridState.selectedCanvasId = targetCanvasId;
      }

      // 10. Create undo/redo command
      const command = new MoveItemCommand(
        itemId,
        sourceCanvasId,
        targetCanvasId,
        sourcePosition,
        targetPosition,
        itemIndex,
      );
      undoRedo.push(command);

      // 11. Emit events for plugins
      eventManager.emit("componentMoved", {
        item,
        sourceCanvasId,
        targetCanvasId,
        position: targetPosition,
      });

      eventManager.emit("canvasActivated", { canvasId: targetCanvasId });

      debug.log("✅ Cross-canvas move completed:", {
        itemId,
        from: sourceCanvasId,
        to: targetCanvasId,
        position: targetPosition,
      });
    };

    this.hostElement.addEventListener("canvas-move", this.canvasMoveHandler);

    // Setup canvas activated event handler
    this.canvasActivatedHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { canvasId } = customEvent.detail;

      debug.log("🎨 canvas-activated event received:", { canvasId });

      // Emit plugin event
      eventManager.emit("canvasActivated", { canvasId });
    };

    this.hostElement.addEventListener(
      "canvas-activated",
      this.canvasActivatedHandler,
    );

    // Setup keyboard shortcuts
    this.keyboardHandler = (event: KeyboardEvent) => {
      // Get modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
      const isUndo =
        (event.metaKey || event.ctrlKey) &&
        event.key === "z" &&
        !event.shiftKey;
      const isRedo =
        (event.metaKey || event.ctrlKey) &&
        ((event.key === "z" && event.shiftKey) || // Ctrl/Cmd+Shift+Z
          event.key === "y"); // Ctrl/Cmd+Y

      // Handle undo/redo
      if (isUndo) {
        debug.log("⌨️ Keyboard: Undo triggered");
        event.preventDefault();
        this.api?.undo();
        return;
      }

      if (isRedo) {
        debug.log("⌨️ Keyboard: Redo triggered");
        event.preventDefault();
        this.api?.redo();
        return;
      }

      // Handle arrow key nudging (only if component is selected)
      if (!gridState.selectedItemId || !gridState.selectedCanvasId) {
        return;
      }

      const isArrowKey = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(event.key);
      if (!isArrowKey) {
        return;
      }

      event.preventDefault();

      // Get selected item
      const canvas = gridState.canvases[gridState.selectedCanvasId];
      if (!canvas) {
        return;
      }

      const item = canvas.items.find((i) => i.id === gridState.selectedItemId);
      if (!item) {
        return;
      }

      // Get current viewport layout
      const viewport = gridState.currentViewport;
      const layout = item.layouts[viewport];

      // Calculate nudge amount (1 grid unit in each direction)
      const nudgeAmount = 1;
      let deltaX = 0;
      let deltaY = 0;

      switch (event.key) {
        case "ArrowUp":
          deltaY = -nudgeAmount;
          break;
        case "ArrowDown":
          deltaY = nudgeAmount;
          break;
        case "ArrowLeft":
          deltaX = -nudgeAmount;
          break;
        case "ArrowRight":
          deltaX = nudgeAmount;
          break;
      }

      debug.log("⌨️ Keyboard: Nudging component", {
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
      const nudgeCommand = new MoveItemCommand(
        item.id,
        gridState.selectedCanvasId,
        gridState.selectedCanvasId,
        { x: oldX, y: oldY },
        { x: constrainedX, y: constrainedY },
        canvas.items.findIndex((i) => i.id === item.id),
      );
      undoRedo.push(nudgeCommand);

      // Trigger state update
      gridState.canvases = { ...gridState.canvases };

      // Emit event
      eventManager.emit("componentDragged", {
        itemId: item.id,
        canvasId: gridState.selectedCanvasId,
        position: { x: constrainedX, y: constrainedY },
      });
    };

    document.addEventListener("keydown", this.keyboardHandler);

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
      this.hostElement.removeEventListener(
        "canvas-drop",
        this.canvasDropHandler,
      );
    }
    if (this.canvasMoveHandler) {
      this.hostElement.removeEventListener(
        "canvas-move",
        this.canvasMoveHandler,
      );
    }
    if (this.canvasActivatedHandler) {
      this.hostElement.removeEventListener(
        "canvas-activated",
        this.canvasActivatedHandler,
      );
    }
    if (this.keyboardHandler) {
      document.removeEventListener("keydown", this.keyboardHandler);
    }

    // Cleanup ResizeObserver
    if (this.viewportResizeObserver) {
      this.viewportResizeObserver.disconnect();
    }

    // Destroy plugins
    if (this.initializedPlugins.length > 0) {
      this.initializedPlugins.forEach((plugin) => {
        try {
          plugin.destroy();
          debug.log(`GridBuilder: Destroyed plugin "${plugin.name}"`);
        } catch (e) {
          console.error(
            `GridBuilder: Failed to destroy plugin "${plugin.name}":`,
            e,
          );
        }
      });
      this.initializedPlugins = [];
    }

    // Clear global references
    delete (window as any).virtualRenderer;

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
  @Watch("components")
  handleComponentsChange(newComponents: ComponentDefinition[]) {
    this.componentRegistry = new Map(
      newComponents.map((comp) => [comp.type, comp]),
    );
  }

  /**
   * Create GridBuilderAPI instance
   *
   * **Purpose**: Provide API to plugins and external code
   * **Returns**: GridBuilderAPI implementation
   *
   * **Implementation**: Full API with event system integration
   */
  private createAPI(): GridBuilderAPI {
    return {
      // ======================
      // Event Subscriptions
      // ======================

      on: <T = any,>(eventName: string, callback: (data: T) => void) => {
        eventManager.on(eventName, callback);
      },

      off: <T = any,>(eventName: string, callback: (data: T) => void) => {
        eventManager.off(eventName, callback);
      },

      // ======================
      // State Access (Read)
      // ======================

      getState: () => gridState,

      getItems: (canvasId: string) => {
        return gridState.canvases[canvasId]?.items || [];
      },

      getItem: (itemId: string) => {
        // Search across all canvases
        for (const canvasId in gridState.canvases) {
          const canvas = gridState.canvases[canvasId];
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

      addComponent: (
        canvasId: string,
        componentType: string,
        position: { x: number; y: number; width: number; height: number },
        config?: Record<string, any>,
      ) => {
        const canvas = gridState.canvases[canvasId];
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
            desktop: { ...position },
            mobile: {
              x: 0,
              y: 0,
              width: 50,
              height: position.height,
              customized: false,
            },
          },
          config: config || {},
        };

        // Add to canvas
        canvas.items.push(newItem);
        gridState.canvases = { ...gridState.canvases };

        // Add to undo/redo history
        undoRedo.push(new BatchAddCommand([newItem.id]));

        // Emit event
        eventManager.emit("componentAdded", { item: newItem, canvasId });

        return newItem.id;
      },

      deleteComponent: (itemId: string) => {
        // Find and delete item across all canvases
        for (const canvasId in gridState.canvases) {
          const canvas = gridState.canvases[canvasId];
          const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
          if (itemIndex !== -1) {
            // Add to undo/redo history BEFORE deletion (need state for undo)
            undoRedo.push(new BatchDeleteCommand([itemId]));

            // Delete item
            canvas.items.splice(itemIndex, 1);
            gridState.canvases = { ...gridState.canvases };

            // Deselect if deleted item was selected
            if (gridState.selectedItemId === itemId) {
              gridState.selectedItemId = null;
              gridState.selectedCanvasId = null;
            }

            // Emit event
            eventManager.emit("componentDeleted", { itemId, canvasId });

            return true;
          }
        }
        return false;
      },

      updateConfig: (itemId: string, config: Record<string, any>) => {
        // Find and update item across all canvases
        for (const canvasId in gridState.canvases) {
          const canvas = gridState.canvases[canvasId];
          const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
          if (itemIndex !== -1) {
            const item = canvas.items[itemIndex];
            const newConfig = { ...item.config, ...config };

            // Create undo command BEFORE making changes
            const batchUpdate = [
              {
                itemId,
                canvasId,
                updates: { config: newConfig },
              },
            ];
            undoRedo.push(new BatchUpdateConfigCommand(batchUpdate));

            // Merge config
            canvas.items[itemIndex] = {
              ...canvas.items[itemIndex],
              config: newConfig,
            };
            gridState.canvases = { ...gridState.canvases };

            // Emit event
            eventManager.emit("configChanged", { itemId, canvasId, config });

            return true;
          }
        }
        return false;
      },

      // ======================
      // Batch Operations
      // ======================

      addComponentsBatch: (
        components: Array<{
          canvasId: string;
          type: string;
          position: { x: number; y: number; width: number; height: number };
          config?: Record<string, any>;
        }>,
      ) => {
        // Convert API format to state-manager format
        const partialItems = components.map(
          ({ canvasId, type, position, config }) => ({
            canvasId,
            type,
            name: type,
            layouts: {
              desktop: { ...position },
              mobile: {
                x: 0,
                y: 0,
                width: 50,
                height: position.height,
                customized: false,
              },
            },
            config: config || {},
          }),
        );

        // Use state-manager batch operation (single state update)
        const itemIds = addItemsBatch(partialItems);

        // Add to undo/redo history
        undoRedo.push(new BatchAddCommand(itemIds));

        // Emit batch event
        const createdItems = itemIds
          .map((id) => {
            const item = this.api?.getItem(id);
            return item ? { item, canvasId: item.canvasId } : null;
          })
          .filter(Boolean);
        eventManager.emit("componentsBatchAdded", { items: createdItems });

        return itemIds;
      },

      deleteComponentsBatch: (itemIds: string[]) => {
        // Store deleted items for event
        const deletedItems = itemIds
          .map((itemId) => {
            const item = this.api?.getItem(itemId);
            return item ? { itemId, canvasId: item.canvasId } : null;
          })
          .filter(Boolean);

        // Add to undo/redo history BEFORE deletion (need state for undo)
        undoRedo.push(new BatchDeleteCommand(itemIds));

        // Use state-manager batch operation (single state update)
        deleteItemsBatch(itemIds);

        // Clear selection if any deleted item was selected
        if (
          gridState.selectedItemId &&
          itemIds.includes(gridState.selectedItemId)
        ) {
          gridState.selectedItemId = null;
          gridState.selectedCanvasId = null;
        }

        // Emit batch event
        eventManager.emit("componentsBatchDeleted", { items: deletedItems });
      },

      updateConfigsBatch: (
        updates: Array<{ itemId: string; config: Record<string, any> }>,
      ) => {
        // Convert to state-manager format (need canvasId)
        const batchUpdates = updates
          .map(({ itemId, config }) => {
            const item = this.api?.getItem(itemId);
            if (!item) {
              console.warn(`Item ${itemId} not found for config update`);
              return null;
            }
            return {
              itemId,
              canvasId: item.canvasId,
              updates: { config: { ...item.config, ...config } },
            };
          })
          .filter(Boolean) as Array<{
          itemId: string;
          canvasId: string;
          updates: Partial<any>;
        }>;

        // Add to undo/redo history
        undoRedo.push(new BatchUpdateConfigCommand(batchUpdates));

        // Use state-manager batch operation (single state update)
        updateItemsBatch(batchUpdates);

        // Emit batch event
        const updatedItems = batchUpdates.map(
          ({ itemId, canvasId, updates }) => ({
            itemId,
            canvasId,
            config: updates.config,
          }),
        );
        eventManager.emit("configsBatchChanged", { items: updatedItems });
      },

      // ======================
      // Canvas Access
      // ======================

      getCanvasElement: (canvasId: string) => {
        return document.getElementById(canvasId);
      },

      // ======================
      // Undo/Redo Operations
      // ======================

      undo: () => {
        undoRedo.undo();
        // Emit event after undo
        eventManager.emit("undoExecuted", {});
      },

      redo: () => {
        undoRedo.redo();
        // Emit event after redo
        eventManager.emit("redoExecuted", {});
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

      addCanvas: (canvasId: string) => {
        // Create and execute command
        const command = new AddCanvasCommand(canvasId);
        undoRedo.push(command);
        command.redo();
      },

      removeCanvas: (canvasId: string) => {
        // Create and execute command
        const command = new RemoveCanvasCommand(canvasId);
        undoRedo.push(command);
        command.redo();
      },

      setActiveCanvas: (canvasId: string) => {
        setActiveCanvas(canvasId);
        eventManager.emit("canvasActivated", { canvasId });
      },

      getActiveCanvas: () => {
        return gridState.activeCanvasId;
      },
    };
  }

  /**
   * Apply theme via CSS variables
   *
   * **Purpose**: Apply theme customization to host element
   * **Implementation**: Set CSS custom properties on :host
   */
  private applyTheme(theme: GridBuilderTheme) {
    const host = this.el;
    if (!host) return;

    // Apply predefined theme properties
    if (theme.primaryColor) {
      host.style.setProperty(
        "--grid-builder-primary-color",
        theme.primaryColor,
      );
    }
    if (theme.paletteBackground) {
      host.style.setProperty(
        "--grid-builder-palette-bg",
        theme.paletteBackground,
      );
    }
    if (theme.canvasBackground) {
      host.style.setProperty(
        "--grid-builder-canvas-bg",
        theme.canvasBackground,
      );
    }
    if (theme.gridLineColor) {
      host.style.setProperty(
        "--grid-builder-grid-line-color",
        theme.gridLineColor,
      );
    }
    if (theme.selectionColor) {
      host.style.setProperty(
        "--grid-builder-selection-color",
        theme.selectionColor,
      );
    }
    if (theme.resizeHandleColor) {
      host.style.setProperty(
        "--grid-builder-resize-handle-color",
        theme.resizeHandleColor,
      );
    }
    if (theme.fontFamily) {
      host.style.setProperty("--grid-builder-font-family", theme.fontFamily);
    }

    // Apply custom properties
    if (theme.customProperties) {
      Object.entries(theme.customProperties).forEach(([key, value]) => {
        host.style.setProperty(key, value);
      });
    }
  }

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
  private setupViewportResizeObserver = () => {
    if (!this.hostElement) {
      return;
    }

    // Watch for grid-builder container size changes
    this.viewportResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Get container width (use borderBoxSize for better accuracy)
        const width =
          entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width;

        // Determine target viewport based on container width
        const targetViewport = width < 768 ? "mobile" : "desktop";

        // Only update if viewport changed
        if (gridState.currentViewport !== targetViewport) {
          debug.log(
            `📱 Container-based viewport switch: ${gridState.currentViewport} → ${targetViewport} (width: ${Math.round(width)}px)`,
          );
          gridState.currentViewport = targetViewport;
        }
      }
    });

    this.viewportResizeObserver.observe(this.hostElement);
  };

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
  @Method()
  async exportState(): Promise<GridExport> {
    // Build export data from current gridState
    const exportData: GridExport = {
      version: "1.0.0",
      canvases: {},
      viewport: gridState.currentViewport,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Export each canvas with its items
    for (const canvasId in gridState.canvases) {
      const canvas = gridState.canvases[canvasId];

      exportData.canvases[canvasId] = {
        items: canvas.items.map((item) => ({
          id: item.id,
          canvasId: item.canvasId,
          type: item.type,
          name: item.name,
          layouts: {
            desktop: { ...item.layouts.desktop },
            mobile: { ...item.layouts.mobile },
          },
          zIndex: item.zIndex,
          config: { ...item.config }, // Deep copy to avoid mutations
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
  @Method()
  async importState(state: Partial<GridState> | GridExport) {
    // Import grid state
    Object.assign(gridState, state);
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
  @Method()
  async getState(): Promise<GridState> {
    return gridState;
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
  @Method()
  async addCanvas(canvasId: string) {
    this.api?.addCanvas(canvasId);
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
  @Method()
  async removeCanvas(canvasId: string) {
    this.api?.removeCanvas(canvasId);
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
  @Method()
  async setActiveCanvas(canvasId: string) {
    this.api?.setActiveCanvas(canvasId);
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
  @Method()
  async getActiveCanvas(): Promise<string | null> {
    return this.api?.getActiveCanvas() || null;
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
  @Method()
  async undo() {
    this.api?.undo();
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
  @Method()
  async redo() {
    this.api?.redo();
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
  @Method()
  async canUndo(): Promise<boolean> {
    return this.api?.canUndo() || false;
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
  @Method()
  async canRedo(): Promise<boolean> {
    return this.api?.canRedo() || false;
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
  @Method()
  async addComponent(
    canvasId: string,
    componentType: string,
    position: { x: number; y: number; width: number; height: number },
    config?: Record<string, any>,
  ): Promise<string | null> {
    return (
      this.api?.addComponent(canvasId, componentType, position, config) || null
    );
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
  @Method()
  async deleteComponent(itemId: string): Promise<boolean> {
    return this.api?.deleteComponent(itemId) || false;
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
  @Method()
  async updateConfig(
    itemId: string,
    config: Record<string, any>,
  ): Promise<boolean> {
    return this.api?.updateConfig(itemId, config) || false;
  }

  /**
   * Reference to host element
   */
  private el?: HTMLElement;

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
    const canvasIds = Object.keys(gridState.canvases);

    return (
      <Host ref={(el) => (this.el = el)}>
        <div class="grid-builder-container">
          {/* Component Palette */}
          <div class="palette-area">
            <component-palette
              components={this.components}
              config={this.config}
            />
          </div>

          {/* Canvas Area */}
          <div class="canvas-area">
            {/* Canvases */}
            <div class="canvases-container">
              {canvasIds.map((canvasId) => {
                const isActive = gridState.activeCanvasId === canvasId;
                const metadata = this.canvasMetadata?.[canvasId] || {};

                // Render custom canvas header if provided
                const headerElement = this.uiOverrides?.CanvasHeader?.({
                  canvasId,
                  metadata,
                  isActive,
                });

                // Handle both vNode and HTMLElement returns
                const headerContent = headerElement instanceof HTMLElement
                  ? <div ref={(el) => {
                      if (el) {
                        // Clear existing children to allow updates when active state changes
                        el.innerHTML = '';
                        el.appendChild(headerElement);
                      }
                    }} />
                  : headerElement;

                return (
                  <div key={canvasId} class="canvas-wrapper">
                    {headerContent}
                    <canvas-section
                      canvasId={canvasId}
                      isActive={isActive}
                      config={this.config}
                      componentRegistry={this.componentRegistry}
                      backgroundColor={metadata.backgroundColor}
                      canvasTitle={metadata.title}
                      onBeforeDelete={this.onBeforeDelete}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
