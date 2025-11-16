import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'component-text-block',
  styleUrl: 'component-text-block.css',
  shadow: false,
})
export class ComponentTextBlock {
  @Prop() itemId!: string;

  render() {
    return (
      <div class="component-text-block-content">
        <p>This is a text block component</p>
      </div>
    );
  }
}
