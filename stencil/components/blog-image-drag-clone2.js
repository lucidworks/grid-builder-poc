import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const blogImageDragCloneCss = ".image-preview{display:flex;width:100%;height:100%;flex-direction:column;background:#f8f9fa}.image-preview .image-placeholder{display:flex;flex:1;align-items:center;justify-content:center;background:#e9ecef}.image-preview .image-placeholder svg{width:40%;height:40%;max-width:80px;max-height:80px;color:#adb5bd}.image-preview .image-caption{flex-shrink:0;padding:8px;background:rgba(0, 0, 0, 0.03);color:#6c757d;font-size:clamp(9px, 1.5vw, 11px);font-style:italic;text-align:center}";

const BlogImageDragClone = /*@__PURE__*/ proxyCustomElement(class BlogImageDragClone extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'cf485810c6f42d321e06758548379a0af493e28a', class: "image-preview" }, h("div", { key: 'f828d4db7f5a8fed760a1b4254afacf615c73e84', class: "image-placeholder" }, h("svg", { key: '0bb4028b9a404247012f757dcfd31517cff53bda', viewBox: "0 0 48 48", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { key: 'cad6e7b5164b4122b45d928cde40cc604383bab9', x: "6", y: "10", width: "36", height: "28", rx: "2", stroke: "currentColor", "stroke-width": "2", fill: "none" }), h("circle", { key: '3f24dac994c616ad556548d8a42fb18cd1c33d3f', cx: "15", cy: "18", r: "3", fill: "currentColor", opacity: "0.5" }), h("path", { key: '2ed62e83988aa54de02707707e74052087a480b1', d: "M6 32 L16 22 L24 30 L32 22 L42 32", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", fill: "none" }))), h("div", { key: '8f08d2b7f5f3c7db1ea5f979a29b11f25cd64f42', class: "image-caption" }, "Image")));
    }
    static get style() { return blogImageDragCloneCss; }
}, [256, "blog-image-drag-clone"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["blog-image-drag-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "blog-image-drag-clone":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, BlogImageDragClone);
            }
            break;
    } });
}

export { BlogImageDragClone as B, defineCustomElement as d };
//# sourceMappingURL=blog-image-drag-clone2.js.map

//# sourceMappingURL=blog-image-drag-clone2.js.map