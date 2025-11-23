import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const imageGalleryDragCloneCss = ".gallery-preview{display:flex;width:100%;height:100%;align-items:center;justify-content:center;background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);color:#495057;font-size:clamp(12px, 2vw, 14px);font-weight:500}";

const ImageGalleryDragClone = /*@__PURE__*/ proxyCustomElement(class ImageGalleryDragClone extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '1011cb66558fa05ded47d3abce3d3b206fb60468', class: "gallery-preview" }, h("span", { key: '1963d4eecde4c931950c2fc847c92cfd4ee2ad76' }, "Image Gallery")));
    }
    static get style() { return imageGalleryDragCloneCss; }
}, [256, "image-gallery-drag-clone"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["image-gallery-drag-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "image-gallery-drag-clone":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, ImageGalleryDragClone);
            }
            break;
    } });
}

export { ImageGalleryDragClone as I, defineCustomElement as d };
//# sourceMappingURL=image-gallery-drag-clone2.js.map

//# sourceMappingURL=image-gallery-drag-clone2.js.map