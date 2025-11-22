import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const blogHeaderCss = "blog-header .blog-header-content{display:flex;width:100%;height:100%;flex-direction:column;align-items:center;justify-content:center;padding:min(10%, 20px);overflow:hidden;box-sizing:border-box}blog-header .blog-header-content h1{margin:0;width:100%;color:#212529;font-size:clamp(12px, 5cqw, 22px);font-weight:600;line-height:1.3;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}blog-header .blog-header-content .subtitle{margin:min(3%, 8px) 0 0 0;width:100%;color:#6c757d;font-size:clamp(11px, 3.5cqw, 16px);font-weight:400;line-height:1.4;text-align:center;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal}";

const BlogHeader = /*@__PURE__*/ proxyCustomElement(class BlogHeader extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.headerTitle = 'Default Header';
    }
    render() {
        return (h("div", { key: '6490d22b347ca64487266af4bb2a00632dce60ef', class: "blog-header-content" }, h("h1", { key: '1b67d82f2cc461294d8016890333ef5143820796' }, this.headerTitle), this.subtitle && h("h2", { key: 'f0ef9f4345cec9e9e965034f602fbdf4afd005a7', class: "subtitle" }, this.subtitle)));
    }
    static get style() { return blogHeaderCss; }
}, [256, "blog-header", {
        "headerTitle": [1, "header-title"],
        "subtitle": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["blog-header"];
    components.forEach(tagName => { switch (tagName) {
        case "blog-header":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, BlogHeader);
            }
            break;
    } });
}

export { BlogHeader as B, defineCustomElement as d };
//# sourceMappingURL=blog-header2.js.map

//# sourceMappingURL=blog-header2.js.map