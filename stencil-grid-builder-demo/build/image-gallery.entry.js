import { r as registerInstance, h, e as Host } from './index-CoCbyscT.js';

const imageGalleryCss = "image-gallery{display:block;width:100%;height:100%;position:relative;border-radius:8px;overflow:hidden;box-sizing:border-box}.image-gallery{display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:repeat(2, 1fr);gap:8px;width:100%;height:100%;padding:8px;box-sizing:border-box}.gallery-item{position:relative;width:100%;height:100%;overflow:hidden;border-radius:4px;background:#f0f0f0}.gallery-item img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center}";

const ImageGallery = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.imageCount = 6;
        this.backgroundColor = "#f5f5f5";
    }
    getRandomImageUrl() {
        return `https://picsum.photos/400?random=${Math.random()}`;
    }
    render() {
        const images = Array.from({ length: this.imageCount }, () => this.getRandomImageUrl());
        return (h(Host, { key: 'b786965efca34b6ef337c01ed056b6cec8a77c84' }, h("div", { key: '26097f34eda239f19af96c1c7e6b1d8618cfd2a6', class: "image-gallery" }, images.map((url, index) => (h("div", { class: "gallery-item", key: index }, h("img", { src: url, alt: `Gallery image ${index + 1}`, loading: "lazy" })))))));
    }
};
ImageGallery.style = imageGalleryCss;

export { ImageGallery as image_gallery };
//# sourceMappingURL=image-gallery.entry.esm.js.map
