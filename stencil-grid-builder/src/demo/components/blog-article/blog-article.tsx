import { Component, h, Prop, Host } from "@stencil/core";

@Component({
  tag: "blog-article",
  styleUrl: "blog-article.scss",
  shadow: false,
})
export class BlogArticle {
  @Prop() content: string = "Article content goes here";
  @Prop() author?: string;
  @Prop() date?: string;
  @Prop() backgroundColor?: string = "#fff9c4";

  render() {
    return (
      <Host style={{ background: this.backgroundColor }}>
        <div class="blog-article-content">
          <div class="article-text">
            <p>{this.content}</p>
          </div>
          {(this.author || this.date) && (
            <div class="article-meta">
              {this.author && <span class="author">By {this.author}</span>}
              {this.date && <span class="date">{this.date}</span>}
            </div>
          )}
        </div>
      </Host>
    );
  }
}
