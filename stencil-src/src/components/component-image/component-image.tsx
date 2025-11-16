import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'component-image',
  styleUrl: 'component-image.css',
  shadow: false,
})
export class ComponentImage {
  @Prop() itemId!: string;

  private imageUrl = `https://picsum.photos/400/300?random=${Math.random()}`;

  render() {
    return (
      <div class="component-image-content">
        <img src={this.imageUrl} alt="Sample image" />
      </div>
    );
  }
}
