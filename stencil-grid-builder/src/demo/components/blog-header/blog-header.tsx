import { Component, h, Prop } from "@stencil/core";

@Component({
  tag: "blog-header",
  styleUrl: "blog-header.scss",
  shadow: false,
})
export class BlogHeader {
  @Prop() headerTitle: string = "Default Header";
  @Prop() subtitle?: string;

  render() {
    return (
      <div class="blog-header-content">
        <h1>{this.headerTitle}</h1>
        {this.subtitle && <h2 class="subtitle">{this.subtitle}</h2>}
      </div>
    );
  }
}
