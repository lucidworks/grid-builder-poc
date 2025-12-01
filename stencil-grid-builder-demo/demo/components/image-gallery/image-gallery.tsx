import { Component, h, Prop, Host } from "@stencil/core";

@Component({
  tag: "image-gallery",
  styleUrl: "image-gallery.scss",
  shadow: false,
})
export class ImageGallery {
  @Prop() imageCount: number = 6;
  @Prop() backgroundColor?: string = "#f5f5f5";

  private getRandomImageUrl() {
    return `https://picsum.photos/400?random=${Math.random()}`;
  }

  render() {
    const images = Array.from({ length: this.imageCount }, () =>
      this.getRandomImageUrl(),
    );

    return (
      <Host>
        <div class="image-gallery">
          {images.map((url, index) => (
            <div class="gallery-item" key={index}>
              <img
                src={url}
                alt={`Gallery image ${index + 1}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
