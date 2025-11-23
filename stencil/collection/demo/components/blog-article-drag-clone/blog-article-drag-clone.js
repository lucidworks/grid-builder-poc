import { h } from "@stencil/core";
export class BlogArticleDragClone {
    render() {
        return (h("div", { key: '3845deb28de1cfc3991beaad1108061d16d91cec', class: "article-preview" }, h("div", { key: '8ddcd1585319e02bdb3e8bc4727945f0bacab23a', class: "article-title" }, "Article Title"), h("div", { key: '31795af659fa19aeca6798af012f520d922264e5', class: "article-content" }, h("div", { key: '38b52a79b846106ded0e3c9d5285d0d1d6d47af3', class: "content-line" }), h("div", { key: 'dc79548d97fc9fd9435ad2409c777cb9c3c8a186', class: "content-line" }), h("div", { key: '85de26eb7acd71dc1f198a3b4c7fe599f6642c46', class: "content-line short" })), h("div", { key: '2b439fac1aef98cb6d112ddfdb4db63f3ad2b37f', class: "article-meta" }, h("span", { key: '6a63bb28ef097e0721212aba2475b3f678197d21' }, "Author"), h("span", { key: '268ede61431ecf8abd8b3d6041b9245d21634908' }, "Date"))));
    }
    static get is() { return "blog-article-drag-clone"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-article-drag-clone.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-article-drag-clone.css"]
        };
    }
}
//# sourceMappingURL=blog-article-drag-clone.js.map
