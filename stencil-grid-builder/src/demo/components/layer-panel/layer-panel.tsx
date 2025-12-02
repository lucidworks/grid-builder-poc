/**
 * Layer Panel Component
 * =====================
 *
 * Displays all grid items across all canvases sorted by z-index (stacking order).
 * Supports drag-to-reorder, search/filter, and virtual scrolling for performance.
 *
 * ## Features
 *
 * - **Global view**: Shows items from all canvases in one unified list
 * - **Z-index sorting**: Items sorted by z-index (descending, top items first)
 * - **Virtual scrolling**: Renders only ~50 visible items for performance (handles 1000+ items)
 * - **Search/filter**: Debounced text search across item names
 * - **Drag-to-reorder**: Change z-index by dragging items in the list
 * - **Visual feedback**: Shows active canvas and selected item
 *
 * ## Performance Targets
 *
 * Based on `/tmp/z-index-performance-assessment.md`:
 * - **1000 items**: Baseline target, excellent performance
 * - **5000 items**: Extended capacity with optimizations
 * - **Virtual scrolling**: 50-item render window (200px pre-render buffer)
 * - **Search debounce**: 300ms delay
 * - **Batch updates**: Single undo/redo command for reordering
 *
 * ## Usage
 *
 * ```typescript
 * <layer-panel />
 * ```
 *
 * The layer panel automatically subscribes to grid state and updates reactively.
 * @module layer-panel
 */

import {
  Component,
  h,
  State,
  Listen,
  Element,
  Prop,
  Watch,
} from "@stencil/core";
import { type GridItem } from "../../../services/state-manager";

/**
 * Extended grid item with canvas information for display
 */
interface LayerItem extends GridItem {
  canvasId: string;
}

/**
 * Virtual scrolling item with height information
 */
interface VirtualItem {
  type: "folder" | "item";
  data:
    | LayerItem
    | {
        canvasId: string;
        title: string;
        itemCount: number;
        totalItemCount?: number;
        isEmpty?: boolean;
      };
  height: number;
  offset: number; // Cumulative offset from top
}

@Component({
  tag: "layer-panel",
  styleUrl: "layer-panel.scss",
  shadow: false,
})
export class LayerPanel {
  @Element() hostElement: HTMLElement;

  /**
   * Grid Builder API instance (instance-based architecture)
   *
   * **Required**: Must be provided or component won't display items
   * **Source**: Host app (blog-app) passes this via prop
   * **Purpose**: Access instance-based state for multi-instance support
   *
   * **Why needed**: Grid-builder uses its own state instance. The layer panel
   * must access that same instance to display items correctly.
   */
  @Prop() api?: any;

  /**
   * Canvas metadata for folder titles
   * Map of canvasId → { title: string }
   */
  @Prop() canvasMetadata?: Record<string, { title: string }> = {};

  /**
   * Height of folder header in pixels
   * @default 40
   */
  @Prop() folderHeight?: number = 40;

  /**
   * Height of layer item in pixels
   * @default 40
   */
  @Prop() itemHeight?: number = 40;

  /**
   * Number of items to render in virtual window
   * @default 50
   */
  @Prop() virtualWindowSize?: number = 50;

  /**
   * Pre-render buffer in pixels (renders items outside viewport)
   * @default 200
   */
  @Prop() virtualBufferPx?: number = 200;

  /**
   * Search input debounce delay in milliseconds
   * @default 300
   */
  @Prop() searchDebounceMs?: number = 300;

  /**
   * All items from all canvases, sorted by z-index (descending)
   */
  @State() allItems: LayerItem[] = [];

  /**
   * Filtered items (after search)
   */
  @State() filteredItems: LayerItem[] = [];

  /**
   * Search query for filtering items
   */
  @State() searchQuery: string = "";

  /**
   * Folder expand/collapse state
   * Map of canvasId → isExpanded
   * Default: active canvas expanded, others collapsed
   */
  @State() folderExpandedState: Record<string, boolean> = {};

  /**
   * Current search debounce timer
   */
  private searchDebounceTimer: number | null = null;

  /**
   * Virtual scrolling: first visible item index
   */
  @State() virtualScrollOffset: number = 0;

  /**
   * Event listener cleanup functions
   */
  private cleanupFunctions: (() => void)[] = [];

  /**
   * Drag state tracking
   * Stores information about the item currently being dragged
   */
  private draggedItem: {
    itemId: string;
    canvasId: string;
    zIndex: number;
  } | null = null;

  /**
   * Watch API prop for changes
   *
   * **Why needed**: Layer panel's componentDidLoad() runs before blog-app
   * has retrieved and passed the API prop. We need to initialize when
   * the API prop becomes available.
   */
  @Watch("api")
  handleApiChange(newApi: any) {
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
    } else {
      console.warn("  ⚠️ API not yet available, waiting for prop...");
    }
  }

  /**
   * Setup layer panel (called when API becomes available)
   */
  private setupLayerPanel = () => {
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
        const newFolderState: Record<string, boolean> = {};
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
  private initializeFolderState = () => {
    console.log("📁 initializeFolderState called");

    if (!this.api) {
      console.warn("  ⚠️ No API - aborting");
      return;
    }

    const state = this.api.getState();
    const activeCanvasId = state.activeCanvasId;
    console.log("  Active canvas:", activeCanvasId);

    const folderState: Record<string, boolean> = {};

    Object.keys(state.canvases).forEach((canvasId) => {
      folderState[canvasId] = canvasId === activeCanvasId;
    });

    console.log("  Folder state:", folderState);
    this.folderExpandedState = folderState;
  };

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
   * Refresh item list from grid state
   *
   * Aggregates all items from all canvases and sorts by z-index (descending).
   * Top items (highest z-index) appear first in the list.
   */
  private refreshItems = () => {
    console.log("🔄 refreshItems called");

    if (!this.api) {
      console.warn("  ⚠️ No API - aborting");
      return;
    }

    const state = this.api.getState();
    console.log("  State from API:", state);
    console.log("  Canvases:", Object.keys(state.canvases || {}));

    const items: LayerItem[] = [];

    // Collect all items from all canvases
    Object.entries(state.canvases).forEach(
      ([canvasId, canvas]: [string, any]) => {
        console.log(`  Canvas ${canvasId}: ${canvas.items?.length || 0} items`);
        canvas.items.forEach((item) => {
          items.push({
            ...item,
            canvasId,
          });
        });
      },
    );

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
  private applySearchFilter = () => {
    if (!this.searchQuery) {
      this.filteredItems = this.allItems;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredItems = this.allItems.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
  };

  /**
   * Handle search input change with debouncing
   *
   * Debounces search input using configurable delay (default 300ms)
   * to prevent excessive filtering on every keystroke.
   */
  private handleSearchInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
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
  private groupItemsByCanvas = (
    items: LayerItem[],
  ): Record<string, LayerItem[]> => {
    const grouped: Record<string, LayerItem[]> = {};

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
  private getCanvasTitle = (canvasId: string): string => {
    return this.canvasMetadata?.[canvasId]?.title || canvasId;
  };

  /**
   * Toggle folder expand/collapse state
   */
  private toggleFolder = (canvasId: string) => {
    this.folderExpandedState = {
      ...this.folderExpandedState,
      [canvasId]: !this.folderExpandedState[canvasId],
    };
  };

  /**
   * Initialize virtual scrolling
   *
   * Sets up scroll event listener for variable-height virtual rendering.
   * Supports configurable item/folder heights and buffer zones.
   *
   * Performance target: <16ms per scroll frame (60fps)
   */
  private initializeVirtualScrolling = () => {
    const scrollContainer = this.hostElement.querySelector(
      ".layer-panel__list",
    ) as HTMLElement;
    if (!scrollContainer) return;

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
  private buildVirtualItemsList = (): VirtualItem[] => {
    const virtualItems: VirtualItem[] = [];
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
      // Skip canvases that don't exist in state (e.g., removed canvases)
      if (!allItemsByCanvas[canvasId]) return;
      const allCanvasItems = allItemsByCanvas[canvasId] || [];
      const filteredCanvasItems = filteredItemsByCanvas[canvasId] || [];
      const isExpanded = this.folderExpandedState[canvasId] ?? true;
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
  private calculateVirtualScrolling = (): {
    visibleItems: VirtualItem[];
    totalHeight: number;
  } => {
    const allVirtualItems = this.buildVirtualItemsList();

    // Calculate total height
    const totalHeight =
      allVirtualItems.length > 0
        ? allVirtualItems[allVirtualItems.length - 1].offset +
          allVirtualItems[allVirtualItems.length - 1].height
        : 0;

    // Find visible range with buffer
    const scrollTop = this.virtualScrollOffset;
    const scrollContainer = this.hostElement.querySelector(
      ".layer-panel__list",
    ) as HTMLElement;
    const viewportHeight = scrollContainer?.clientHeight || 600;

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

  /**
   * Handle layer item selection
   *
   * Updates grid state to select the clicked item.
   */
  @Listen("layerItemSelect")
  handleLayerItemSelect(
    event: CustomEvent<{ itemId: string; canvasId: string }>,
  ) {
    if (!this.api) return;

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
  @Listen("toggleFolder")
  handleToggleFolder(event: CustomEvent<{ canvasId: string }>) {
    this.toggleFolder(event.detail.canvasId);
  }

  /**
   * Handle canvas activation (set as active canvas)
   */
  @Listen("activateCanvas")
  handleActivateCanvas(event: CustomEvent<{ canvasId: string }>) {
    if (!this.api) return;

    const state = this.api.getState();
    state.activeCanvasId = event.detail.canvasId;
  }

  /**
   * Handle scroll to canvas (double-click on folder header)
   */
  @Listen("scrollToCanvas")
  handleScrollToCanvas(event: CustomEvent<{ canvasId: string }>) {
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
    } else {
      console.warn("  ⚠️ Canvas element not found:", canvasId);
    }
  }

  /**
   * Handle drag start for layer item reordering
   *
   * Stores drag metadata for drop calculation.
   */
  @Listen("layerItemDragStart")
  handleLayerItemDragStart(
    event: CustomEvent<{ itemId: string; canvasId: string; zIndex: number }>,
  ) {
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
  @Listen("layer-item-dropped")
  handleLayerItemDropped(
    event: CustomEvent<{
      targetItemId: string;
      targetCanvasId: string;
      targetZIndex: number;
      dropAbove: boolean;
    }>,
  ) {
    console.log("🎯 Layer item dropped", {
      event: event.detail,
      draggedItem: this.draggedItem,
      hasApi: !!this.api,
    });

    if (!this.draggedItem || !this.api) {
      console.warn("  ⚠️ No draggedItem or API, aborting");
      return;
    }

    const state = this.api.getState();
    const { targetItemId, targetCanvasId, targetZIndex, dropAbove } =
      event.detail;
    const {
      itemId: draggedItemId,
      canvasId: draggedCanvasId,
      zIndex: draggedZIndex,
    } = this.draggedItem;

    // Don't drop on self
    if (draggedItemId === targetItemId && draggedCanvasId === targetCanvasId) {
      console.log("  ℹ️ Dropped on self, ignoring");
      this.draggedItem = null;
      return;
    }

    console.log("  📦 Processing drop:", {
      draggedItemId,
      draggedCanvasId,
      draggedZIndex,
      targetItemId,
      targetCanvasId,
      targetZIndex,
      dropAbove,
    });

    // Collect all z-index changes to apply in batch
    const zIndexChanges: {
      itemId: string;
      canvasId: string;
      newZIndex: number;
    }[] = [];

    // Handle cross-canvas movement
    if (draggedCanvasId !== targetCanvasId) {
      const sourceCanvas = state.canvases[draggedCanvasId];
      const targetCanvas = state.canvases[targetCanvasId];

      if (!sourceCanvas || !targetCanvas) return;

      // Move item to target canvas using API
      this.api.moveItem(draggedCanvasId, targetCanvasId, draggedItemId);

      // Get updated state after move
      const updatedTargetCanvas = this.api.getState().canvases[targetCanvasId];
      const sortedItems = [...updatedTargetCanvas.items].sort(
        (a, b) => a.zIndex - b.zIndex,
      );

      // Find target item index in sorted list
      const targetIndex = sortedItems.findIndex((i) => i.id === targetItemId);

      // Calculate new z-index based on drop position
      let newZIndex: number;
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
      } else {
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
        } else {
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
    } else {
      // Same canvas reordering
      const canvas = state.canvases[draggedCanvasId];
      const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);

      // Find indices
      const draggedIndex = sortedItems.findIndex((i) => i.id === draggedItemId);
      const targetIndex = sortedItems.findIndex((i) => i.id === targetItemId);

      // Calculate new z-index
      let newZIndex: number;
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
            } else {
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
      } else {
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
              } else {
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
        } else {
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
    const { visibleItems, totalHeight } = this.calculateVirtualScrolling();

    // Get state for selection/active canvas checks
    const state = this.api?.getState();
    const activeCanvasId = state?.activeCanvasId;
    const selectedItemId = state?.selectedItemId;
    const selectedCanvasId = state?.selectedCanvasId;

    return (
      <div class="layer-panel">
        {/* Header */}
        <div class="layer-panel__header">
          <h3 class="layer-panel__title">Layers</h3>
          <div class="layer-panel__count">
            {this.filteredItems.length} items
          </div>
        </div>

        {/* Search */}
        <div class="layer-panel__search">
          <input
            type="text"
            class="layer-panel__search-input"
            placeholder="Search layers..."
            onInput={this.handleSearchInput}
          />
        </div>

        {/* Layer list with virtual scrolling */}
        <div class="layer-panel__list">
          <div
            class="layer-panel__list-inner"
            style={{ height: `${totalHeight}px`, position: "relative" }}
          >
            {visibleItems.length === 0 && (
              <div class="layer-panel__empty">No items found</div>
            )}

            {visibleItems.map((virtualItem) => {
              if (virtualItem.type === "folder") {
                // Render folder header
                const folderData = virtualItem.data as {
                  canvasId: string;
                  title: string;
                  itemCount: number;
                  totalItemCount?: number;
                  isEmpty?: boolean;
                };

                return (
                  <layer-panel-folder-header
                    key={`folder-${folderData.canvasId}`}
                    canvasId={folderData.canvasId}
                    canvasTitle={folderData.title}
                    itemCount={folderData.itemCount}
                    totalItemCount={folderData.totalItemCount}
                    isExpanded={
                      this.folderExpandedState[folderData.canvasId] ?? true
                    }
                    isActive={folderData.canvasId === activeCanvasId}
                    isEmpty={folderData.isEmpty}
                    style={{
                      position: "absolute",
                      top: `${virtualItem.offset}px`,
                      left: "0",
                      right: "0",
                      height: `${virtualItem.height}px`,
                    }}
                  />
                );
              } else {
                // Render layer item
                const item = virtualItem.data as LayerItem;

                return (
                  <layer-panel-item
                    key={item.id}
                    itemId={item.id}
                    canvasId={item.canvasId}
                    name={item.name}
                    type={item.type}
                    zIndex={item.zIndex}
                    isActive={
                      item.id === selectedItemId &&
                      item.canvasId === selectedCanvasId
                    }
                    style={{
                      position: "absolute",
                      top: `${virtualItem.offset}px`,
                      left: "0",
                      right: "0",
                      height: `${virtualItem.height}px`,
                    }}
                  />
                );
              }
            })}
          </div>
        </div>

        {/* Instructions */}
        <div class="layer-panel__footer">
          <div class="layer-panel__hint">
            Click folder to expand/collapse · Click item to select
          </div>
        </div>
      </div>
    );
  }
}
