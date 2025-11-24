import { Component, h, Prop, State, Host } from "@stencil/core";

@Component({
  tag: "blog-image",
  styleUrl: "blog-image.scss",
  shadow: false,
})
export class BlogImage {
  @Prop() src: string =
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop";
  @Prop() alt: string = "Placeholder image";
  @Prop() caption?: string;
  @Prop() objectFit: "contain" | "cover" = "contain";
  @Prop() backgroundColor?: string = "#c8e6c9";

  @State() imageLoaded: boolean = false;
  @State() imageError: boolean = false;

  private imgRef?: HTMLImageElement;

  componentDidLoad() {
    // Check if image is already loaded (cached)
    if (this.imgRef?.complete && this.imgRef?.naturalHeight !== 0) {
      this.imageLoaded = true;
    }
  }

  private handleImageLoad = () => {
    this.imageLoaded = true;
    this.imageError = false;
  };

  private handleImageError = () => {
    this.imageError = true;
    this.imageLoaded = false;
  };

  render() {
    return (
      <Host style={{ background: this.backgroundColor }}>
        <div class="blog-image-content">
        <div class="image-container">
          {!this.imageLoaded && !this.imageError && (
            <div class="image-placeholder">
              <div class="spinner"></div>
            </div>
          )}
          {this.imageError && (
            <div class="image-error">
              <span class="error-icon">🖼️</span>
              <span class="error-text">Failed to load image</span>
            </div>
          )}
          <img
            ref={(el) => (this.imgRef = el)}
            src={this.src}
            alt={this.alt}
            class={{
              "blog-image": true,
              loaded: this.imageLoaded,
              "fit-contain": this.objectFit === "contain",
              "fit-cover": this.objectFit === "cover",
            }}
            onLoad={this.handleImageLoad}
            onError={this.handleImageError}
          />
        </div>
        {this.caption && <div class="image-caption">{this.caption}</div>}
      </div>
      </Host>
    );
  }
}
