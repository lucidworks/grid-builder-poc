import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'component-header',
  styleUrl: 'component-header.css',
  shadow: false,
})
export class ComponentHeader {
  @Prop() itemId!: string;

  render() {
    return (
      <div class="component-header-content">
        <h1>This is a header component</h1>
      </div>
    );
  }
}
