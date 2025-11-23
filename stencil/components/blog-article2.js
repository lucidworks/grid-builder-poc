import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const blogArticleCss = "blog-article .blog-article-content{display:flex;width:100%;height:100%;flex-direction:column;padding:min(5%, 12px);overflow:hidden;box-sizing:border-box}blog-article .blog-article-content .article-text{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:4px}blog-article .blog-article-content .article-text::-webkit-scrollbar{width:6px}blog-article .blog-article-content .article-text::-webkit-scrollbar-track{background:#f1f3f5;border-radius:3px}blog-article .blog-article-content .article-text::-webkit-scrollbar-thumb{background:#adb5bd;border-radius:3px}blog-article .blog-article-content .article-text::-webkit-scrollbar-thumb:hover{background:#868e96}blog-article .blog-article-content .article-text p{margin:0;color:#495057;font-size:clamp(12px, 3.5cqw, 16px);line-height:1.6;word-wrap:break-word;overflow-wrap:break-word}blog-article .blog-article-content .article-meta{display:flex;flex-shrink:0;padding-top:min(3%, 8px);border-top:1px solid #ced4da;margin-top:min(4%, 12px);color:#6c757d;font-size:clamp(11px, 2.5cqw, 14px);gap:min(3%, 12px);overflow:hidden}blog-article .blog-article-content .article-meta .author,blog-article .blog-article-content .article-meta .date{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}blog-article .blog-article-content .article-meta .author{font-weight:500}blog-article .blog-article-content .article-meta .date{color:#646F7A}";

const BlogArticle = /*@__PURE__*/ proxyCustomElement(class BlogArticle extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.content = 'Article content goes here';
    }
    render() {
        return (h("div", { key: '34f9a59243cc4222321db04ee6308ec701d32ab4', class: "blog-article-content" }, h("div", { key: '33e9c01c476570840f9f06ec8f9e00353e6c922f', class: "article-text" }, h("p", { key: '577b6791e655de0c7948590292d9beeae6cd35b9' }, this.content)), (this.author || this.date) && (h("div", { key: '2da4cc1e1b296109fa36ac5eb278ef2b72a4e0e8', class: "article-meta" }, this.author && h("span", { key: '62d265248ccb2f63cbf706d2522fb7d7ee965187', class: "author" }, "By ", this.author), this.date && h("span", { key: '24de67ef85eb22c5fb2dbc36d677e64843a19615', class: "date" }, this.date)))));
    }
    static get style() { return blogArticleCss; }
}, [256, "blog-article", {
        "content": [1],
        "author": [1],
        "date": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["blog-article"];
    components.forEach(tagName => { switch (tagName) {
        case "blog-article":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, BlogArticle);
            }
            break;
    } });
}

export { BlogArticle as B, defineCustomElement as d };
//# sourceMappingURL=blog-article2.js.map

//# sourceMappingURL=blog-article2.js.map