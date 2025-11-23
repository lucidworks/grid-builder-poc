import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const blogArticleDragCloneCss = ".article-preview{display:flex;width:100%;height:100%;flex-direction:column;gap:12px;background:#ffffff;padding:16px}.article-preview .article-title{color:#2c3e50;font-size:clamp(12px, 2vw, 16px);font-weight:600}.article-preview .article-content{display:flex;flex:1;flex-direction:column;gap:6px}.article-preview .article-content .content-line{height:4px;border-radius:2px;background:#dee2e6}.article-preview .article-content .content-line.short{width:70%}.article-preview .article-meta{display:flex;gap:12px;color:#6c757d;font-size:clamp(9px, 1.5vw, 11px)}.article-preview .article-meta span{opacity:0.7}";

const BlogArticleDragClone = /*@__PURE__*/ proxyCustomElement(class BlogArticleDragClone extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '3845deb28de1cfc3991beaad1108061d16d91cec', class: "article-preview" }, h("div", { key: '8ddcd1585319e02bdb3e8bc4727945f0bacab23a', class: "article-title" }, "Article Title"), h("div", { key: '31795af659fa19aeca6798af012f520d922264e5', class: "article-content" }, h("div", { key: '38b52a79b846106ded0e3c9d5285d0d1d6d47af3', class: "content-line" }), h("div", { key: 'dc79548d97fc9fd9435ad2409c777cb9c3c8a186', class: "content-line" }), h("div", { key: '85de26eb7acd71dc1f198a3b4c7fe599f6642c46', class: "content-line short" })), h("div", { key: '2b439fac1aef98cb6d112ddfdb4db63f3ad2b37f', class: "article-meta" }, h("span", { key: '6a63bb28ef097e0721212aba2475b3f678197d21' }, "Author"), h("span", { key: '268ede61431ecf8abd8b3d6041b9245d21634908' }, "Date"))));
    }
    static get style() { return blogArticleDragCloneCss; }
}, [256, "blog-article-drag-clone"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["blog-article-drag-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "blog-article-drag-clone":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, BlogArticleDragClone);
            }
            break;
    } });
}

export { BlogArticleDragClone as B, defineCustomElement as d };
//# sourceMappingURL=blog-article-drag-clone2.js.map

//# sourceMappingURL=blog-article-drag-clone2.js.map