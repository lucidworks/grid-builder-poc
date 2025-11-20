import { Component, h, Prop, Event, EventEmitter, State, Watch } from '@stencil/core';

/**
 * Section Editor Data Interface
 * ------------------------------
 *
 * Data structure for section/canvas metadata being edited.
 * This is demo-specific - NOT part of the library.
 */
export interface SectionEditorData {
  canvasId: string;
  title: string;
  backgroundColor: string;
}

/**
 * Section Editor Panel Component
 * ===============================
 *
 * Demo Component - NOT Part of Library
 *
 * This component demonstrates how to build custom UI for editing canvas metadata
 * in applications using the grid-builder library.
 *
 * Purpose:
 * --------
 * Shows how to create a side panel for editing section/canvas settings.
 * This is completely custom to your application - the library doesn't provide this.
 *
 * Library Relationship:
 * ---------------------
 * - Library owns: Component placement, layouts, zIndex (grid state)
 * - Host app owns: Canvas metadata (titles, colors, settings) - THIS COMPONENT
 * - Metadata flows: App → Library via canvasMetadata prop
 *
 * Pattern Demonstrated:
 * ---------------------
 * 1. User clicks section header (demo UI)
 * 2. App opens this panel (demo component)
 * 3. User edits title/color
 * 4. App updates canvasMetadata state
 * 5. Library receives updated metadata via prop
 * 6. Library passes backgroundColor to canvas-section
 *
 * Why This Approach:
 * ------------------
 * - Library stays focused on grid logic
 * - Host app controls all presentation/metadata UI
 * - You can use any UI framework (Material, Bootstrap, etc.)
 * - Complete flexibility over settings panel design
 */
@Component({
  tag: 'section-editor-panel',
  styleUrl: 'section-editor-panel.scss',
  shadow: false,
})
export class SectionEditorPanel {
  /**
   * Panel open/closed state
   * Controlled by parent component (blog-app)
   */
  @Prop() isOpen: boolean = false;

  /**
   * Section data being edited
   * Passed from parent when user clicks section header
   */
  @Prop() sectionData: SectionEditorData | null = null;

  /**
   * Event: Close panel
   * Fired when user clicks Cancel, Save, or overlay
   */
  @Event() closePanel: EventEmitter<void>;

  /**
   * Event: Update section
   * Fired when user clicks Save with edited values
   * Parent updates canvasMetadata state in response
   */
  @Event() updateSection: EventEmitter<{ canvasId: string; title: string; backgroundColor: string }>;

  /**
   * Event: Preview color change
   * Fired when user changes color picker (live preview)
   * Parent temporarily updates canvas background
   */
  @Event() previewColorChange: EventEmitter<{ canvasId: string; backgroundColor: string }>;

  /**
   * Internal editing state
   * These track user's changes before saving
   */
  @State() editedTitle: string = '';
  @State() editedColor: string = '';

  /**
   * Original color when modal opened
   * Used to revert on cancel
   */
  private originalColor: string = '';

  @Watch('sectionData')
  handleSectionDataChange(newData: SectionEditorData | null) {
    if (newData) {
      this.editedTitle = newData.title;
      this.editedColor = newData.backgroundColor;
      // Store original color for revert on cancel
      this.originalColor = newData.backgroundColor;
    }
  }

  componentWillLoad() {
    if (this.sectionData) {
      this.editedTitle = this.sectionData.title;
      this.editedColor = this.sectionData.backgroundColor;
      // Store original color for revert on cancel
      this.originalColor = this.sectionData.backgroundColor;
    }
  }

  private handleClose = () => {
    // Revert to original color on cancel
    if (this.sectionData) {
      this.previewColorChange.emit({
        canvasId: this.sectionData.canvasId,
        backgroundColor: this.originalColor,
      });
    }
    this.closePanel.emit();
  };

  private handleSave = () => {
    if (this.sectionData) {
      this.updateSection.emit({
        canvasId: this.sectionData.canvasId,
        title: this.editedTitle,
        backgroundColor: this.editedColor,
      });
      this.closePanel.emit();
    }
  };

  private handleTitleInput = (e: Event) => {
    this.editedTitle = (e.target as HTMLInputElement).value;
  };

  private handleColorInput = (e: Event) => {
    this.editedColor = (e.target as HTMLInputElement).value;

    // Emit preview event for live color update
    if (this.sectionData) {
      this.previewColorChange.emit({
        canvasId: this.sectionData.canvasId,
        backgroundColor: this.editedColor,
      });
    }
  };

  render() {
    if (!this.isOpen || !this.sectionData) {
      return null;
    }

    return (
      <div class="section-editor-overlay" onClick={this.handleClose}>
        <div class="section-editor-panel" onClick={(e) => e.stopPropagation()}>
          <div class="panel-header">
            <h2 class="panel-title">Edit Section</h2>
            <button class="close-btn" onClick={this.handleClose} title="Close">
              ×
            </button>
          </div>

          <div class="panel-body">
            <div class="form-group">
              <label htmlFor="section-title">Section Name</label>
              <input
                type="text"
                id="section-title"
                class="section-title-input"
                value={this.editedTitle}
                onInput={this.handleTitleInput}
                placeholder="Enter section name"
              />
            </div>

            <div class="form-group">
              <label htmlFor="section-color">Background Color</label>
              <div class="color-picker-wrapper">
                <input
                  type="color"
                  id="section-color"
                  class="section-color-input"
                  value={this.editedColor}
                  onInput={this.handleColorInput}
                />
                <input
                  type="text"
                  class="color-hex-input"
                  value={this.editedColor}
                  onInput={this.handleColorInput}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <button class="cancel-btn" onClick={this.handleClose}>
              Cancel
            </button>
            <button class="save-btn" onClick={this.handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }
}
