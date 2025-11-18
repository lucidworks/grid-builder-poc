import { Component, h, Prop } from '@stencil/core';

/**
 * Custom Palette Item Component
 * ==============================
 *
 * Example custom palette item that shows how consumers can create
 * fully customized palette entries for their components.
 */
@Component({
  tag: 'custom-palette-item',
  styleUrl: 'custom-palette-item.scss',
  shadow: false,
})
export class CustomPaletteItem {
  /**
   * Component type
   */
  @Prop() componentType!: string;

  /**
   * Display name
   */
  @Prop() name!: string;

  /**
   * Icon/emoji
   */
  @Prop() icon!: string;

  render() {
    return (
      <div class="custom-palette-item">
        <span class="palette-icon">{this.icon}</span>
        <div class="palette-info">
          <div class="palette-name">{this.name}</div>
          <div class="palette-type">{this.componentType}</div>
        </div>
      </div>
    );
  }
}
