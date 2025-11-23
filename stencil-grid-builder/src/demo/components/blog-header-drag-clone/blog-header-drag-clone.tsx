import { Component, h } from '@stencil/core';

@Component({
  tag: 'blog-header-drag-clone',
  styleUrl: 'blog-header-drag-clone.scss',
  shadow: false,
})
export class BlogHeaderDragClone {
  render() {
    return (
      <div class="header-preview">
        <div class="header-title">Header Title</div>
        <div class="header-subtitle">Subtitle text</div>
      </div>
    );
  }
}
