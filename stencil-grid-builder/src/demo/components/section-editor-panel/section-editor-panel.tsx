import { Component, h, Prop, Event, EventEmitter, State, Watch } from '@stencil/core';

export interface SectionEditorData {
  canvasId: string;
  title: string;
  backgroundColor: string;
}

@Component({
  tag: 'section-editor-panel',
  styleUrl: 'section-editor-panel.scss',
  shadow: false,
})
export class SectionEditorPanel {
  @Prop() isOpen: boolean = false;
  @Prop() sectionData: SectionEditorData | null = null;

  @Event() closePanel: EventEmitter<void>;
  @Event() updateSection: EventEmitter<{ canvasId: string; title: string; backgroundColor: string }>;

  @State() editedTitle: string = '';
  @State() editedColor: string = '';

  @Watch('sectionData')
  handleSectionDataChange(newData: SectionEditorData | null) {
    if (newData) {
      this.editedTitle = newData.title;
      this.editedColor = newData.backgroundColor;
    }
  }

  componentWillLoad() {
    if (this.sectionData) {
      this.editedTitle = this.sectionData.title;
      this.editedColor = this.sectionData.backgroundColor;
    }
  }

  private handleClose = () => {
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
