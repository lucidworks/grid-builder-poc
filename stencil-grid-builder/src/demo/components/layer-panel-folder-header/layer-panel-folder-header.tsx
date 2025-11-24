/**
 * Layer Panel Folder Header Component
 * ====================================
 *
 * Collapsible folder header representing a canvas in the layer panel.
 * Displays canvas title, item count, expand/collapse toggle, and active state.
 *
 * ## Features
 *
 * - **Expand/collapse toggle**: Arrow icon rotates, emits toggle event
 * - **Canvas title**: Displays name from host app metadata
 * - **Item count**: Shows number of items in canvas
 * - **Active state**: Visual highlight when canvas is active
 * - **Empty state**: Dimmed appearance when no items match search
 *
 * ## Usage
 *
 * ```typescript
 * <layer-panel-folder-header
 * canvasId="canvas1"
 * canvasTitle="Hero Section"
 * itemCount={12}
 * isExpanded={true}
 * isActive={false}
 * isEmpty={false}
 * />
 * ```
 * @module layer-panel-folder-header
 */

import { Component, h, Prop, Event, EventEmitter } from "@stencil/core";

@Component({
  tag: "layer-panel-folder-header",
  styleUrl: "layer-panel-folder-header.scss",
  shadow: false,
})
export class LayerPanelFolderHeader {
  /**
   * Canvas ID this folder represents
   */
  @Prop() canvasId!: string;

  /**
   * Display title for the canvas
   */
  @Prop() canvasTitle!: string;

  /**
   * Number of items in this canvas
   */
  @Prop() itemCount!: number;

  /**
   * Whether this folder is currently expanded
   */
  @Prop() isExpanded?: boolean = true;

  /**
   * Whether this canvas is the active canvas
   */
  @Prop() isActive?: boolean = false;

  /**
   * Whether this folder has no items matching current search
   * When true, folder appears dimmed
   */
  @Prop() isEmpty?: boolean = false;

  /**
   * Total item count (for showing "0 / 15" during search)
   */
  @Prop() totalItemCount?: number;

  /**
   * Emitted when user clicks the expand/collapse toggle
   */
  @Event() toggleFolder: EventEmitter<{ canvasId: string }>;

  /**
   * Emitted when user clicks the folder header to activate canvas
   */
  @Event() activateCanvas: EventEmitter<{ canvasId: string }>;

  /**
   * Handle toggle button click
   */
  private handleToggle = (e: Event) => {
    e.stopPropagation();
    this.toggleFolder.emit({ canvasId: this.canvasId });
  };

  /**
   * Handle folder header click to activate canvas
   */
  private handleClick = () => {
    this.activateCanvas.emit({ canvasId: this.canvasId });
  };

  render() {
    const headerClasses = {
      "layer-panel-folder-header": true,
      "layer-panel-folder-header--active": this.isActive,
      "layer-panel-folder-header--expanded": this.isExpanded,
      "layer-panel-folder-header--empty": this.isEmpty,
    };

    // Show "filtered / total" format during search, just count otherwise
    const countDisplay =
      this.totalItemCount !== undefined &&
      this.itemCount !== this.totalItemCount
        ? `${this.itemCount} / ${this.totalItemCount}`
        : this.itemCount;

    return (
      <div class={headerClasses} onClick={this.handleClick}>
        <button
          class="layer-panel-folder-header__toggle"
          onClick={this.handleToggle}
          title={this.isExpanded ? "Collapse folder" : "Expand folder"}
        >
          <span class="layer-panel-folder-header__toggle-icon">▼</span>
        </button>

        <div class="layer-panel-folder-header__title">{this.canvasTitle}</div>

        <div class="layer-panel-folder-header__count">{countDisplay}</div>
      </div>
    );
  }
}
