import { Component, h } from '@stencil/core';

@Component({
  tag: 'image-gallery-drag-clone',
  styleUrl: 'image-gallery-drag-clone.scss',
  shadow: false,
})
export class ImageGalleryDragClone {
  render() {
    return (
      <div class="gallery-preview">
        <span>Image Gallery</span>
      </div>
    );
  }
}
