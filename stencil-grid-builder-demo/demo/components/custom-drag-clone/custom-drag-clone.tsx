import { Component, h, Prop } from "@stencil/core";

/**
 * Custom Drag Clone Component
 * ============================
 *
 * Custom drag clone that shows a visual preview of the component being dragged.
 * Each component type has a unique appearance that matches what will be placed
 * on the canvas, helping with visual alignment and user understanding.
 *
 * The component fills the exact width and height provided, scaled to match
 * the actual drop size.
 */
@Component({
  tag: "custom-drag-clone",
  styleUrl: "custom-drag-clone.scss",
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

  /**
   * Get visual preview based on component type
   */
  private getPreview() {
    switch (this.componentType) {
      case "blog-header":
        return this.renderHeaderPreview();
      case "blog-article":
        return this.renderArticlePreview();
      case "blog-button":
        return this.renderButtonPreview();
      case "blog-image":
        return this.renderImagePreview();
      default:
        return this.renderDefaultPreview();
    }
  }

  private renderHeaderPreview() {
    return (
      <div class="drag-clone-header">
        <div class="header-title">Header Title</div>
        <div class="header-subtitle">Subtitle text</div>
      </div>
    );
  }

  private renderArticlePreview() {
    return (
      <div class="drag-clone-article">
        <div class="article-title">Article Title</div>
        <div class="article-content">
          <div class="content-line" />
          <div class="content-line" />
          <div class="content-line short" />
        </div>
        <div class="article-meta">
          <span class="meta-item">Author</span>
          <span class="meta-item">Date</span>
        </div>
      </div>
    );
  }

  private renderButtonPreview() {
    return (
      <div class="drag-clone-button">
        <span class="button-text">Button</span>
      </div>
    );
  }

  private renderImagePreview() {
    return (
      <div class="drag-clone-image">
        <div class="image-placeholder">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Image icon */}
            <rect
              x="6"
              y="10"
              width="36"
              height="28"
              rx="2"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            />
            <circle cx="15" cy="18" r="3" fill="currentColor" opacity="0.5" />
            <path
              d="M6 32 L16 22 L24 30 L32 22 L42 32"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              fill="none"
            />
          </svg>
        </div>
        <div class="image-caption">Image</div>
      </div>
    );
  }

  private renderDefaultPreview() {
    return <div class="drag-clone-default">{this.name}</div>;
  }

  render() {
    return (
      <div
        class={`custom-drag-clone drag-clone-${this.componentType}`}
        style={{
          width: `${this.width}px`,
          height: `${this.height}px`,
        }}
      >
        {this.getPreview()}
      </div>
    );
  }
}
