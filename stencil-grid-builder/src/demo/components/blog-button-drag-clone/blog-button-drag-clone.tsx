import { Component, h } from '@stencil/core';

@Component({
  tag: 'blog-button-drag-clone',
  styleUrl: 'blog-button-drag-clone.scss',
  shadow: false,
})
export class BlogButtonDragClone {
  render() {
    return (
      <div class="button-preview">
        <span>Button</span>
      </div>
    );
  }
}
