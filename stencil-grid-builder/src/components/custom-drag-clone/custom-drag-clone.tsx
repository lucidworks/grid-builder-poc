import { Component, h, Prop } from '@stencil/core';

/**
 * Custom Drag Clone Component
 * ============================
 *
 * Example custom drag clone that mimics a button component appearance.
 * This shows how to create a drag preview that looks exactly like the
 * component that will be dropped - helping with visual alignment.
 *
 * The component fills the exact width and height provided, with no extra chrome.
 */
@Component({
  tag: 'custom-drag-clone',
  styleUrl: 'custom-drag-clone.scss',
  shadow: false,
})
export class CustomDragClone {
  /**
   * Component type being dragged
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

  /**
   * Width in pixels
   */
  @Prop() width!: number;

  /**
   * Height in pixels
   */
  @Prop() height!: number;

  render() {
    return (
      <div
        class="custom-drag-clone"
        style={{
          width: `${this.width}px`,
          height: `${this.height}px`,
        }}
      >
        {this.name}
      </div>
    );
  }
}
