import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'component-button',
  styleUrl: 'component-button.css',
  shadow: false,
})
export class ComponentButton {
  @Prop() itemId!: string;

  render() {
    return (
      <div class="component-button-content">
        <button class="demo-button">Click me!</button>
      </div>
    );
  }
}
