import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const imageGalleryCss = "image-gallery{display:block;width:100%;height:100%;position:relative;overflow:hidden;box-sizing:border-box}.image-gallery{display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;width:100%;height:100%}.gallery-item{position:relative;width:100%;padding-bottom:100%;overflow:hidden;border-radius:4px;background:#f0f0f0}.gallery-item img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center}";

const ImageGallery = /*@__PURE__*/ proxyCustomElement(class ImageGallery extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.imageCount = 6;
    }
    getRandomImageUrl() {
        return `https://picsum.photos/400?random=${Math.random()}`;
    }
    render() {
        const images = Array.from({ length: this.imageCount }, () => this.getRandomImageUrl());
        return (h("div", { key: '8ea26144328d858061bc9e72d86442163b25c892', class: "image-gallery" }, images.map((url, index) => (h("div", { class: "gallery-item", key: index }, h("img", { src: url, alt: `Gallery image ${index + 1}`, loading: "lazy" }))))));
    }
    static get style() { return imageGalleryCss; }
}, [256, "image-gallery", {
        "imageCount": [2, "image-count"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["image-gallery"];
    components.forEach(tagName => { switch (tagName) {
        case "image-gallery":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, ImageGallery);
            }
            break;
    } });
}

export { ImageGallery as I, defineCustomElement as d };
//# sourceMappingURL=image-gallery2.js.map

//# sourceMappingURL=image-gallery2.js.map