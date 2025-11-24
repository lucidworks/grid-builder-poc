import { Component, h, Prop } from "@stencil/core";

/**
 * Custom Palette Item Component
 * ==============================
 *
 * Example custom palette item that shows how consumers can create
 * fully customized palette entries for their components.
 *
 * Updated to display SVG icons on top with titles below (similar to UI builder pattern)
 */
@Component({
  tag: "custom-palette-item",
  styleUrl: "custom-palette-item.scss",
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
   * Icon/emoji or SVG identifier
   */
  @Prop() icon!: string;

  /**
   * Get SVG canvas preview based on component type
   * Shows abstract representation of how the component appears on canvas
   */
  private getSvgIcon() {
    const iconMap: Record<string, any> = {
      "blog-header": (
        <svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main title - large bar */}
          <rect x="8" y="6" width="64" height="8" rx="2" fill="currentColor" />
          {/* Subtitle - smaller bar */}
          <rect
            x="16"
            y="18"
            width="48"
            height="4"
            rx="1"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      ),
      "blog-article": (
        <svg viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Title bar */}
          <rect x="8" y="6" width="48" height="4" rx="1" fill="currentColor" />
          {/* Content lines */}
          <rect
            x="8"
            y="14"
            width="64"
            height="2"
            rx="0.5"
            fill="currentColor"
            opacity="0.6"
          />
          <rect
            x="8"
            y="19"
            width="60"
            height="2"
            rx="0.5"
            fill="currentColor"
            opacity="0.6"
          />
          <rect
            x="8"
            y="24"
            width="56"
            height="2"
            rx="0.5"
            fill="currentColor"
            opacity="0.6"
          />
          <rect
            x="8"
            y="29"
            width="52"
            height="2"
            rx="0.5"
            fill="currentColor"
            opacity="0.6"
          />
          {/* Author/date info */}
          <rect
            x="8"
            y="38"
            width="24"
            height="2"
            rx="0.5"
            fill="currentColor"
            opacity="0.4"
          />
          <rect
            x="36"
            y="38"
            width="20"
            height="2"
            rx="0.5"
            fill="currentColor"
            opacity="0.4"
          />
        </svg>
      ),
      "blog-button": (
        <svg viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Button background */}
          <rect
            x="16"
            y="6"
            width="48"
            height="12"
            rx="6"
            fill="currentColor"
          />
          {/* Button label text */}
          <rect
            x="28"
            y="10"
            width="24"
            height="4"
            rx="1"
            fill="white"
            opacity="0.9"
          />
        </svg>
      ),
    };

    return (
      iconMap[this.componentType] || (
        <span class="palette-icon-emoji">{this.icon}</span>
      )
    );
  }

  render() {
    return (
      <div class="custom-palette-item">
        <div class="palette-name">{this.name}</div>
        <div class="palette-icon-container">{this.getSvgIcon()}</div>
      </div>
    );
  }
}
