import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'component-image-gallery',
  styleUrl: 'component-image-gallery.scss',
  shadow: false,
})
export class ComponentImageGallery {
  @Prop() itemId!: string;

  private images = [
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
    `https://picsum.photos/200/200?random=${Math.random()}`,
  ];

  render() {
    return (
      <div class="component-image-gallery-content">
        <div class="gallery-grid">
          {this.images.map((url, index) => (
            <div class="gallery-item" key={index}>
              <img src={url} alt={`Gallery image ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }
}
