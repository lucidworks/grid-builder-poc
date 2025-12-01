/**
 * Canvas Header Component
 * =======================
 *
 * Displays a header bar above each canvas section with title and optional delete button.
 *
 * ## Purpose
 *
 * - Shows section title as clickable badge
 * - Provides delete button for non-default sections
 * - Emits events for user interactions
 *
 * ## Usage
 *
 * ```tsx
 * <canvas-header
 *   canvasId="hero-section"
 *   title="Hero Section"
 *   isDeletable={false}
 *   onHeaderClick={() => handleClick()}
 *   onDeleteClick={() => handleDelete()}
 * />
 * ```
 *
 * @module canvas-header
 */

import { Component, Event, EventEmitter, h, Prop } from "@stencil/core";

/**
 * CanvasHeader Component
 * ======================
 *
 * Declarative header component for canvas sections.
 *
 * **Tag**: `<canvas-header>`
 * **Shadow DOM**: Disabled (matches blog-app styling)
 */
@Component({
  tag: "canvas-header",
  styleUrl: "canvas-header.scss",
  shadow: false,
})
export class CanvasHeader {
  /**
   * Canvas ID for data tracking
   *
   * **Purpose**: Identify which canvas this header belongs to
   * **Required**: Yes
   */
  @Prop() canvasId!: string;

  /**
   * Display title for the canvas section
   *
   * **Purpose**: Text shown in the title badge
   * **Required**: Yes
   * **Note**: Named sectionTitle to avoid conflict with standard HTML title attribute
   */
  @Prop() sectionTitle!: string;

  /**
   * Whether this section can be deleted
   *
   * **Purpose**: Control delete button visibility
   * **Default**: true
   * **Note**: Default sections (hero, articles, footer) should set to false
   */
  @Prop() isDeletable: boolean = true;

  /**
   * Whether this canvas is currently active
   *
   * **Purpose**: Control header opacity (active = full opacity, inactive = dimmed)
   * **Default**: false
   */
  @Prop() isActive: boolean = false;

  /**
   * Event emitted when header title is clicked
   *
   * **Detail**: { canvasId: string }
   * **Use case**: Activate canvas and open section editor
   */
  @Event() headerClick: EventEmitter<{ canvasId: string }>;

  /**
   * Event emitted when delete button is clicked
   *
   * **Detail**: { canvasId: string }
   * **Use case**: Delete the canvas section
   */
  @Event() deleteClick: EventEmitter<{ canvasId: string }>;

  /**
   * Handle title click
   */
  private handleTitleClick = () => {
    this.headerClick.emit({ canvasId: this.canvasId });
  };

  /**
   * Handle delete button click
   */
  private handleDeleteClick = () => {
    this.deleteClick.emit({ canvasId: this.canvasId });
  };

  /**
   * Render component template
   */
  render() {
    const headerClass = `canvas-header ${this.isActive ? "is-active" : ""}`;

    return (
      <div class={headerClass} data-canvas-id={this.canvasId}>
        <div class="canvas-actions">
          {/* Section title badge (clickable) */}
          <span class="canvas-title" onClick={this.handleTitleClick}>
            {this.sectionTitle}
          </span>

          {/* Delete button (optional) */}
          {this.isDeletable && (
            <button
              class="delete-canvas-btn"
              title="Delete this section"
              onClick={this.handleDeleteClick}
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }
}
