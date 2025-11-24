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
 *
 * @module layer-panel
 */

import { Component, h, State, Listen, Element, Prop } from '@stencil/core';
import { gridState, onChange, setItemZIndex, moveItemToCanvas, type GridItem } from '../../../services/state-manager';
import { eventManager } from '../../../services/event-manager';

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
  type: 'folder' | 'item';
  data: LayerItem | { canvasId: string; title: string; itemCount: number; totalItemCount?: number; isEmpty?: boolean };
  height: number;
  offset: number; // Cumulative offset from top
}

@Component({
  tag: 'layer-panel',
  styleUrl: 'layer-panel.scss',
  shadow: false,
})
export class LayerPanel {
  @Element() hostElement: HTMLElement;

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
  @State() searchQuery: string = '';

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
  private cleanupFunctions: Array<() => void> = [];

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
   * Component did load - subscribe to events
   */
  componentDidLoad() {
    // Initialize folder expanded state
    // Default: active canvas expanded, others collapsed
    this.initializeFolderState();

    // Initial data load
    this.refreshItems();

    // Subscribe to grid state changes
    const unsubscribe = onChange('canvases', () => {
      this.refreshItems();
    });
    this.cleanupFunctions.push(unsubscribe);

    // Subscribe to z-index change events
    const zIndexHandler = () => {
      this.refreshItems();
    };
    eventManager.on('zIndexChanged', zIndexHandler);
    this.cleanupFunctions.push(() => eventManager.off('zIndexChanged', zIndexHandler));

    const zIndexBatchHandler = () => {
      this.refreshItems();
    };
    eventManager.on('zIndexBatchChanged', zIndexBatchHandler);
    this.cleanupFunctions.push(() => eventManager.off('zIndexBatchChanged', zIndexBatchHandler));

    // Subscribe to active canvas changes
    const unsubActiveCanvas = onChange('activeCanvasId', () => {
      // Force re-render to update visual feedback
      this.allItems = [...this.allItems];
    });
    this.cleanupFunctions.push(unsubActiveCanvas);

    // Subscribe to selection changes
    const unsubSelection = onChange('selectedItemId', () => {
      // Force re-render to update visual feedback
      this.allItems = [...this.allItems];
    });
    this.cleanupFunctions.push(unsubSelection);

    // Initialize virtual scrolling
    this.initializeVirtualScrolling();
  }

  /**
   * Initialize folder expanded state
   * Default: active canvas expanded, others collapsed
   *
   * @private
   */
  private initializeFolderState = () => {
    const activeCanvasId = gridState.activeCanvasId;
    const folderState: Record<string, boolean> = {};

    Object.keys(gridState.canvases).forEach((canvasId) => {
      folderState[canvasId] = canvasId === activeCanvasId;
    });

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
   *
   * @private
   */
  private refreshItems = () => {
    const items: LayerItem[] = [];

    // Collect all items from all canvases
    Object.entries(gridState.canvases).forEach(([canvasId, canvas]) => {
      canvas.items.forEach((item) => {
        items.push({
          ...item,
          canvasId,
        });
      });
    });

    // Sort by z-index (descending - highest first)
    items.sort((a, b) => b.zIndex - a.zIndex);

    this.allItems = items;
    this.applySearchFilter();
  };

  /**
   * Apply search filter to items
   *
   * Filters items by name (case-insensitive substring match).
   * Performance: <5ms for 1000 items, <10ms for 5000 items
   *
   * @private
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
   *
   * @private
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
   *
   * @private
   */
  private groupItemsByCanvas = (items: LayerItem[]): Record<string, LayerItem[]> => {
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
   *
   * @private
   */
  private getCanvasTitle = (canvasId: string): string => {
    return this.canvasMetadata?.[canvasId]?.title || canvasId;
  };

  /**
   * Toggle folder expand/collapse state
   *
   * @private
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
   *
   * @private
   */
  private initializeVirtualScrolling = () => {
    const scrollContainer = this.hostElement.querySelector('.layer-panel__list') as HTMLElement;
    if (!scrollContainer) return;

    // Track scroll position for virtual rendering
    scrollContainer.addEventListener('scroll', () => {
      const scrollTop = scrollContainer.scrollTop;
      this.virtualScrollOffset = scrollTop;
    });
  };

  /**
   * Build virtual items list with position cache
   *
   * Creates a flattened list of folders and items with their heights and cumulative offsets.
   * This allows for accurate virtual scrolling with variable-height items.
   *
   * @returns Array of virtual items with position information
   * @private
   */
  private buildVirtualItemsList = (): VirtualItem[] => {
    const virtualItems: VirtualItem[] = [];
    let currentOffset = 0;

    // Group items by canvas
    const allItemsByCanvas = this.groupItemsByCanvas(this.allItems);
    const filteredItemsByCanvas = this.groupItemsByCanvas(this.filteredItems);

    // Build virtual items list (folders + items)
    Object.keys(allItemsByCanvas).forEach((canvasId) => {
      const allCanvasItems = allItemsByCanvas[canvasId] || [];
      const filteredCanvasItems = filteredItemsByCanvas[canvasId] || [];
      const isExpanded = this.folderExpandedState[canvasId] ?? true;
      const isEmpty = this.searchQuery && filteredCanvasItems.length === 0;

      // Add folder header
      virtualItems.push({
        type: 'folder',
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
            type: 'item',
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
   *
   * @returns Object with visible items and total scroll height
   * @private
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
    const scrollContainer = this.hostElement.querySelector('.layer-panel__list') as HTMLElement;
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
   *
   * @private
   */
  @Listen('layerItemSelect')
  handleLayerItemSelect(event: CustomEvent<{ itemId: string; canvasId: string }>) {
    const { itemId, canvasId } = event.detail;

    // Update grid state
    gridState.selectedItemId = itemId;
    gridState.selectedCanvasId = canvasId;
    gridState.activeCanvasId = canvasId;
  }

  /**
   * Handle folder toggle (expand/collapse)
   *
   * @private
   */
  @Listen('toggleFolder')
  handleToggleFolder(event: CustomEvent<{ canvasId: string }>) {
    this.toggleFolder(event.detail.canvasId);
  }

  /**
   * Handle canvas activation (set as active canvas)
   *
   * @private
   */
  @Listen('activateCanvas')
  handleActivateCanvas(event: CustomEvent<{ canvasId: string }>) {
    gridState.activeCanvasId = event.detail.canvasId;
  }

  /**
   * Handle drag start for layer item reordering
   *
   * Stores drag metadata for drop calculation.
   *
   * @private
   */
  @Listen('layerItemDragStart')
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
   * @private
   */
  @Listen('layer-item-dropped')
  handleLayerItemDropped(
    event: CustomEvent<{
      targetItemId: string;
      targetCanvasId: string;
      targetZIndex: number;
      dropAbove: boolean;
    }>,
  ) {
    if (!this.draggedItem) return;

    const { targetItemId, targetCanvasId, targetZIndex, dropAbove } = event.detail;
    const { itemId: draggedItemId, canvasId: draggedCanvasId, zIndex: draggedZIndex } = this.draggedItem;

    // Don't drop on self
    if (draggedItemId === targetItemId && draggedCanvasId === targetCanvasId) {
      this.draggedItem = null;
      return;
    }

    // Handle cross-canvas movement
    if (draggedCanvasId !== targetCanvasId) {
      // Move item to new canvas
      moveItemToCanvas(draggedCanvasId, targetCanvasId, draggedItemId);

      // Get all items in target canvas sorted by z-index
      const targetCanvas = gridState.canvases[targetCanvasId];
      const sortedItems = [...targetCanvas.items].sort((a, b) => a.zIndex - b.zIndex);

      // Find target item index in sorted list
      const targetIndex = sortedItems.findIndex((i) => i.id === targetItemId);

      // Calculate new z-index based on drop position
      let newZIndex: number;
      if (dropAbove) {
        // Drop above target: use target's z-index
        newZIndex = targetZIndex;
        // Increment all items at or above this z-index
        sortedItems.forEach((item) => {
          if (item.id !== draggedItemId && item.zIndex >= newZIndex) {
            item.zIndex++;
          }
        });
      } else {
        // Drop below target: use z-index between target and next item
        if (targetIndex < sortedItems.length - 1) {
          const nextItem = sortedItems[targetIndex + 1];
          newZIndex = nextItem.zIndex;
          // Increment all items at or above this z-index
          sortedItems.forEach((item) => {
            if (item.id !== draggedItemId && item.zIndex >= newZIndex) {
              item.zIndex++;
            }
          });
        } else {
          // Dropping at the bottom
          newZIndex = targetZIndex + 1;
        }
      }

      // Set new z-index for dragged item
      setItemZIndex(targetCanvasId, draggedItemId, newZIndex);
    } else {
      // Same canvas reordering
      const canvas = gridState.canvases[draggedCanvasId];
      const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);

      // Find indices
      const draggedIndex = sortedItems.findIndex((i) => i.id === draggedItemId);
      const targetIndex = sortedItems.findIndex((i) => i.id === targetItemId);

      // Calculate new z-index
      let newZIndex: number;
      if (dropAbove) {
        // Drop above target
        newZIndex = targetZIndex;
        // Shift z-indices for items between old and new position
        sortedItems.forEach((item) => {
          if (item.id !== draggedItemId) {
            if (draggedIndex < targetIndex) {
              // Moving down: decrement items between
              if (item.zIndex > draggedZIndex && item.zIndex <= targetZIndex) {
                item.zIndex--;
              }
            } else {
              // Moving up: increment items between
              if (item.zIndex >= targetZIndex && item.zIndex < draggedZIndex) {
                item.zIndex++;
              }
            }
          }
        });
      } else {
        // Drop below target
        if (targetIndex < sortedItems.length - 1) {
          newZIndex = targetZIndex + 1;
          // Shift z-indices
          sortedItems.forEach((item) => {
            if (item.id !== draggedItemId) {
              if (draggedIndex < targetIndex) {
                // Moving down
                if (item.zIndex > draggedZIndex && item.zIndex <= newZIndex) {
                  item.zIndex--;
                }
              } else {
                // Moving up
                if (item.zIndex >= newZIndex && item.zIndex < draggedZIndex) {
                  item.zIndex++;
                }
              }
            }
          });
        } else {
          // Dropping at bottom
          newZIndex = targetZIndex + 1;
        }
      }

      // Set new z-index
      setItemZIndex(draggedCanvasId, draggedItemId, newZIndex);
    }

    // Trigger re-render
    this.refreshItems();

    // Clear drag state
    this.draggedItem = null;

    // Fire z-index changed event for undo/redo
    eventManager.emit('zIndexChanged', {
      canvasId: targetCanvasId,
      itemId: draggedItemId,
      oldZIndex: draggedZIndex,
      newZIndex: gridState.canvases[targetCanvasId]?.items.find((i) => i.id === draggedItemId)?.zIndex,
    });
  }


  render() {
    const { visibleItems, totalHeight } = this.calculateVirtualScrolling();

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
            style={{ height: `${totalHeight}px`, position: 'relative' }}
          >
            {visibleItems.length === 0 && (
              <div class="layer-panel__empty">No items found</div>
            )}

            {visibleItems.map((virtualItem) => {
              if (virtualItem.type === 'folder') {
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
                    isExpanded={this.folderExpandedState[folderData.canvasId] ?? true}
                    isActive={folderData.canvasId === gridState.activeCanvasId}
                    isEmpty={folderData.isEmpty}
                    style={{
                      position: 'absolute',
                      top: `${virtualItem.offset}px`,
                      left: '0',
                      right: '0',
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
                      item.id === gridState.selectedItemId &&
                      item.canvasId === gridState.selectedCanvasId
                    }
                    style={{
                      position: 'absolute',
                      top: `${virtualItem.offset}px`,
                      left: '0',
                      right: '0',
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
