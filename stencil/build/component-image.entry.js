import { r as registerInstance, h } from './index-ebe9feb4.js';

const componentImageCss = ".component-image-content{width:100%;height:100%;overflow:hidden;border-radius:4px}.component-image-content img{width:100%;height:100%;object-fit:cover}";

const ComponentImage = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.imageUrl = `https://picsum.photos/400/300?random=${Math.random()}`;
        this.itemId = undefined;
    }
    render() {
        return (h("div", { class: "component-image-content" }, h("img", { src: this.imageUrl, alt: "Sample image" })));
    }
};
ComponentImage.style = componentImageCss;

export { ComponentImage as component_image };

//# sourceMappingURL=component-image.entry.js.map