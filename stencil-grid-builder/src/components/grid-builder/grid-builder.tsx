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

import { Component, Element, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import interact from 'interactjs';

// Type imports
import { ComponentDefinition } from '../../types/component-definition';
import { GridConfig } from '../../types/grid-config';
import { GridBuilderTheme } from '../../types/theme';
import { GridBuilderPlugin } from '../../types/plugin';
import { UIComponentOverrides } from '../../types/ui-overrides';
import { GridBuilderAPI } from '../../types/api';

// Service imports
import { gridState, GridState, generateItemId, deleteItemsBatch, addItemsBatch, updateItemsBatch } from '../../services/state-manager';
import { virtualRenderer } from '../../services/virtual-renderer';
import { eventManager } from '../../services/event-manager';
import { BatchAddCommand, BatchDeleteCommand, BatchUpdateConfigCommand, AddCanvasCommand, RemoveCanvasCommand } from '../../services/undo-redo-commands';
import { undoRedo } from '../../services/undo-redo';

// Utility imports
import { pixelsToGridX, pixelsToGridY } from '../../utils/grid-calculations';
import { applyBoundaryConstraints } from '../../utils/boundary-constraints';

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
  tag: 'grid-builder',
  styleUrl: 'grid-builder.scss',
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
   * Component registry (internal state)
   *
   * **Purpose**: Map component type → definition for lookup
   * **Built from**: components prop
   * **Used by**: grid-item-wrapper for dynamic rendering
   *
   * **Structure**: `{ 'header': ComponentDefinition, 'text': ComponentDefinition, ... }`
   */
  @State() private componentRegistry: Map<string, ComponentDefinition> = new Map();

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
  @Listen('grid-item:delete')
  handleGridItemDelete(event: CustomEvent) {
    console.log('🗑️ @Listen(grid-item:delete) in grid-builder', {
      detail: event.detail,
    });

    const { itemId } = event.detail;
    if (itemId) {
      console.log('  ✅ Deleting item:', itemId);
      deleteItemsBatch([itemId]);
    }
  }

  componentWillLoad() {
    // Validate required props
    if (!this.components || this.components.length === 0) {
      console.error('GridBuilder: components prop is required');
      return;
    }

    // Build component registry
    this.componentRegistry = new Map(
      this.components.map(comp => [comp.type, comp])
    );

    // Validate unique component types
    if (this.componentRegistry.size !== this.components.length) {
      console.warn('GridBuilder: Duplicate component types detected');
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
    (window as any).gridBuilderAPI = this.api;

    // Initialize plugins
    if (this.plugins && this.plugins.length > 0) {
      this.initializedPlugins = this.plugins.filter(plugin => {
        try {
          plugin.init(this.api!);
          console.log(`GridBuilder: Initialized plugin "${plugin.name}"`);
          return true;
        } catch (e) {
          console.error(`GridBuilder: Failed to initialize plugin "${plugin.name}":`, e);
          return false;
        }
      });
    }

    // Apply theme
    if (this.theme) {
      this.applyTheme(this.theme);
    }

    // Debug helper
    (window as any).debugInteractables = () => {
      const interactables = (interact as any).interactables.list;
      console.log('Total interactables:', interactables.length);
      interactables.forEach((interactable: any, index: number) => {
        console.log(`Interactable ${index}:`, {
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

      console.log('🎯 canvas-drop event received:', { canvasId, componentType, x, y });

      // Get component definition to determine default size
      const definition = this.componentRegistry.get(componentType);
      if (!definition) {
        console.warn(`Component definition not found for type: ${componentType}`);
        return;
      }

      // Convert pixel position to grid units
      const gridX = pixelsToGridX(x, canvasId);
      const gridY = pixelsToGridY(y);

      console.log('  Converting to grid units (before constraints):', {
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

      console.log('  After boundary constraints:', constrained);

      // Use existing addComponent API method with constrained values
      const newItem = this.api?.addComponent(canvasId, componentType, {
        x: constrained.x,
        y: constrained.y,
        width: constrained.width,
        height: constrained.height,
      });

      console.log('  Created item:', newItem);
    };

    this.hostElement.addEventListener('canvas-drop', this.canvasDropHandler);

    // Setup canvas move event handler for cross-canvas moves
    this.canvasMoveHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { itemId, sourceCanvasId, targetCanvasId, x, y } = customEvent.detail;

      console.log('🔄 canvas-move event received:', { itemId, sourceCanvasId, targetCanvasId, x, y });

      // TODO: Implement cross-canvas move
      // This would require updating the item's canvasId and position
      console.warn('Cross-canvas moves not yet implemented');
    };

    this.hostElement.addEventListener('canvas-move', this.canvasMoveHandler);
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

    // Destroy plugins
    if (this.initializedPlugins.length > 0) {
      this.initializedPlugins.forEach(plugin => {
        try {
          plugin.destroy();
          console.log(`GridBuilder: Destroyed plugin "${plugin.name}"`);
        } catch (e) {
          console.error(`GridBuilder: Failed to destroy plugin "${plugin.name}":`, e);
        }
      });
      this.initializedPlugins = [];
    }

    // Clear global references
    delete (window as any).virtualRenderer;
    delete (window as any).gridBuilderAPI;
  }

  /**
   * Watch components prop for changes
   *
   * **Purpose**: Rebuild component registry when components prop changes
   */
  @Watch('components')
  handleComponentsChange(newComponents: ComponentDefinition[]) {
    this.componentRegistry = new Map(
      newComponents.map(comp => [comp.type, comp])
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

      on: <T = any>(eventName: string, callback: (data: T) => void) => {
        eventManager.on(eventName, callback);
      },

      off: <T = any>(eventName: string, callback: (data: T) => void) => {
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

      addComponent: (canvasId: string, componentType: string, position: { x: number; y: number; width: number; height: number }, config?: Record<string, any>) => {
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
            mobile: { x: 0, y: 0, width: 50, height: position.height, customized: false },
          },
          config: config || {},
        };

        // Add to canvas
        canvas.items.push(newItem);
        gridState.canvases = { ...gridState.canvases };

        // Emit event
        eventManager.emit('componentAdded', { item: newItem, canvasId });

        return newItem.id;
      },

      deleteComponent: (itemId: string) => {
        // Find and delete item across all canvases
        for (const canvasId in gridState.canvases) {
          const canvas = gridState.canvases[canvasId];
          const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
          if (itemIndex !== -1) {
            canvas.items.splice(itemIndex, 1);
            gridState.canvases = { ...gridState.canvases };

            // Deselect if deleted item was selected
            if (gridState.selectedItemId === itemId) {
              gridState.selectedItemId = null;
              gridState.selectedCanvasId = null;
            }

            // Emit event
            eventManager.emit('componentDeleted', { itemId, canvasId });

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
            // Merge config
            canvas.items[itemIndex] = {
              ...canvas.items[itemIndex],
              config: { ...canvas.items[itemIndex].config, ...config },
            };
            gridState.canvases = { ...gridState.canvases };

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

      addComponentsBatch: (components: Array<{ canvasId: string; type: string; position: { x: number; y: number; width: number; height: number }; config?: Record<string, any> }>) => {
        // Convert API format to state-manager format
        const partialItems = components.map(({ canvasId, type, position, config }) => ({
          canvasId,
          type,
          name: type,
          layouts: {
            desktop: { ...position },
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
          const item = this.api?.getItem(id);
          return item ? { item, canvasId: item.canvasId } : null;
        }).filter(Boolean);
        eventManager.emit('componentsBatchAdded', { items: createdItems });

        return itemIds;
      },

      deleteComponentsBatch: (itemIds: string[]) => {
        // Store deleted items for event
        const deletedItems = itemIds.map(itemId => {
          const item = this.api?.getItem(itemId);
          return item ? { itemId, canvasId: item.canvasId } : null;
        }).filter(Boolean);

        // Add to undo/redo history BEFORE deletion (need state for undo)
        undoRedo.push(new BatchDeleteCommand(itemIds));

        // Use state-manager batch operation (single state update)
        deleteItemsBatch(itemIds);

        // Clear selection if any deleted item was selected
        if (gridState.selectedItemId && itemIds.includes(gridState.selectedItemId)) {
          gridState.selectedItemId = null;
          gridState.selectedCanvasId = null;
        }

        // Emit batch event
        eventManager.emit('componentsBatchDeleted', { items: deletedItems });
      },

      updateConfigsBatch: (updates: Array<{ itemId: string; config: Record<string, any> }>) => {
        // Convert to state-manager format (need canvasId)
        const batchUpdates = updates.map(({ itemId, config }) => {
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
        }).filter(Boolean) as Array<{ itemId: string; canvasId: string; updates: Partial<any> }>;

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

      getCanvasElement: (canvasId: string) => {
        return document.getElementById(canvasId);
      },

      // ======================
      // Undo/Redo Operations
      // ======================

      undo: () => {
        undoRedo.undo();
      },

      redo: () => {
        undoRedo.redo();
      },

      canUndo: () => {
        return undoRedo.canUndo();
      },

      canRedo: () => {
        return undoRedo.canRedo();
      },

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
   * - Config panel (bottom or custom)
   *
   * **Note**: Actual rendering delegates to child components:
   * - <component-palette> or custom ComponentPalette
   * - <canvas-section> for each canvas
   * - <config-panel> or custom ConfigPanel
   */
  render() {
    const canvasIds = Object.keys(gridState.canvases);

    return (
      <Host ref={(el) => this.el = el}>
        <div class="grid-builder-container">
          {/* Component Palette */}
          <div class="palette-area">
            <component-palette components={this.components} config={this.config} />
          </div>

          {/* Canvas Area */}
          <div class="canvas-area">
            {/* Canvases */}
            <div class="canvases-container">
              {canvasIds.map((canvasId) => (
                <canvas-section
                  key={canvasId}
                  canvasId={canvasId}
                  config={this.config}
                  componentRegistry={this.componentRegistry}
                  backgroundColor={this.canvasMetadata?.[canvasId]?.backgroundColor}
                />
              ))}
            </div>
          </div>

          {/* Config Panel */}
          <config-panel componentRegistry={this.componentRegistry} />
        </div>
      </Host>
    );
  }
}
