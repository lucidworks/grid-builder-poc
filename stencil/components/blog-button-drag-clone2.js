import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const blogButtonDragCloneCss = ".button-preview{display:flex;width:100%;height:100%;align-items:center;justify-content:center;border-radius:6px;background:linear-gradient(135deg, #4a90e2 0%, #357abd 100%);box-shadow:0 2px 8px rgba(0, 0, 0, 0.15)}.button-preview span{color:#ffffff;font-size:clamp(12px, 2vw, 16px);font-weight:600}";

const BlogButtonDragClone = /*@__PURE__*/ proxyCustomElement(class BlogButtonDragClone extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '1a47688e96c9870c7ec9ba6e1b5690da775616bf', class: "button-preview" }, h("span", { key: '067c1f9c0951d2778df11cc4c03e1b83523be7eb' }, "Button")));
    }
    static get style() { return blogButtonDragCloneCss; }
}, [256, "blog-button-drag-clone"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["blog-button-drag-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "blog-button-drag-clone":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, BlogButtonDragClone);
            }
            break;
    } });
}

export { BlogButtonDragClone as B, defineCustomElement as d };
//# sourceMappingURL=blog-button-drag-clone2.js.map

//# sourceMappingURL=blog-button-drag-clone2.js.map