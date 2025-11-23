import { Component, h } from '@stencil/core';

@Component({
  tag: 'blog-image-drag-clone',
  styleUrl: 'blog-image-drag-clone.scss',
  shadow: false,
})
export class BlogImageDragClone {
  render() {
    return (
      <div class="image-preview">
        <div class="image-placeholder">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="10" width="36" height="28" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <circle cx="15" cy="18" r="3" fill="currentColor" opacity="0.5"/>
            <path d="M6 32 L16 22 L24 30 L32 22 L42 32" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
        </div>
        <div class="image-caption">Image</div>
      </div>
    );
  }
}
