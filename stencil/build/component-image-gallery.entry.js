import { r as registerInstance, h } from './index-ebe9feb4.js';

const componentImageGalleryCss = ".component-image-gallery-content{width:100%;height:100%;padding:10px}.gallery-grid{display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;height:100%}.gallery-item{width:100%;height:100%;overflow:hidden;border-radius:4px;background:#f0f0f0}.gallery-item img{width:100%;height:100%;object-fit:cover}";

const ComponentImageGallery = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.images = [
            `https://picsum.photos/200/200?random=${Math.random()}`,
            `https://picsum.photos/200/200?random=${Math.random()}`,
            `https://picsum.photos/200/200?random=${Math.random()}`,
            `https://picsum.photos/200/200?random=${Math.random()}`,
        ];
        this.itemId = undefined;
    }
    render() {
        return (h("div", { class: "component-image-gallery-content" }, h("div", { class: "gallery-grid" }, this.images.map((url, index) => (h("div", { class: "gallery-item", key: index }, h("img", { src: url, alt: `Gallery image ${index + 1}` })))))));
    }
};
ComponentImageGallery.style = componentImageGalleryCss;

export { ComponentImageGallery as component_image_gallery };

//# sourceMappingURL=component-image-gallery.entry.js.map