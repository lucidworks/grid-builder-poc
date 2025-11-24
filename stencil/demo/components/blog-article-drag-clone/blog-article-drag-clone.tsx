import { Component, h } from "@stencil/core";

@Component({
  tag: "blog-article-drag-clone",
  styleUrl: "blog-article-drag-clone.scss",
  shadow: false,
})
export class BlogArticleDragClone {
  render() {
    return (
      <div class="article-preview">
        <div class="article-title">Article Title</div>
        <div class="article-content">
          <div class="content-line"></div>
          <div class="content-line"></div>
          <div class="content-line short"></div>
        </div>
        <div class="article-meta">
          <span>Author</span>
          <span>Date</span>
        </div>
      </div>
    );
  }
}
