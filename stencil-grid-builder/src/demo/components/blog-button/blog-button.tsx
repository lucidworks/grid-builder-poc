import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'blog-button',
  styleUrl: 'blog-button.scss',
  shadow: false,
})
export class BlogButton {
  @Prop() label: string = 'Click me!';
  @Prop() variant: 'primary' | 'secondary' = 'primary';
  @Prop() href?: string;

  @Event() buttonClick: EventEmitter<void>;

  private handleClick = (_e: MouseEvent) => {
    if (this.href) {
      window.location.href = this.href;
    }
    this.buttonClick.emit();
  };

  render() {
    return (
      <div class="blog-button-content">
        <button
          class={`demo-button ${this.variant}`}
          onClick={this.handleClick}
        >
          {this.label}
        </button>
      </div>
    );
  }
}
