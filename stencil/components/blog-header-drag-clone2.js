import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const blogHeaderDragCloneCss = ".header-preview{display:flex;width:100%;height:100%;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg, #f0f4f8 0%, #e8f0f2 100%);padding:16px}.header-preview .header-title{color:#2c3e50;font-size:clamp(14px, 2.5vw, 20px);font-weight:700;text-align:center}.header-preview .header-subtitle{color:#6c757d;font-size:clamp(11px, 1.8vw, 14px);font-style:italic;text-align:center}";

const BlogHeaderDragClone = /*@__PURE__*/ proxyCustomElement(class BlogHeaderDragClone extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '8780fef332f15b304e55c34a28182f1b3f31c6f2', class: "header-preview" }, h("div", { key: 'a1cd2633584a6420d0477cf326ab149237a978a6', class: "header-title" }, "Header Title"), h("div", { key: 'e4c3f380ec684cf949a06438612020acc5a04559', class: "header-subtitle" }, "Subtitle text")));
    }
    static get style() { return blogHeaderDragCloneCss; }
}, [256, "blog-header-drag-clone"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["blog-header-drag-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "blog-header-drag-clone":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, BlogHeaderDragClone);
            }
            break;
    } });
}

export { BlogHeaderDragClone as B, defineCustomElement as d };
//# sourceMappingURL=blog-header-drag-clone2.js.map

//# sourceMappingURL=blog-header-drag-clone2.js.map