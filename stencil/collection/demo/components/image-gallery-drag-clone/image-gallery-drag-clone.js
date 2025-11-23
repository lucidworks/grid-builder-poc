import { h } from "@stencil/core";
export class ImageGalleryDragClone {
    render() {
        return (h("div", { key: '1011cb66558fa05ded47d3abce3d3b206fb60468', class: "gallery-preview" }, h("span", { key: '1963d4eecde4c931950c2fc847c92cfd4ee2ad76' }, "Image Gallery")));
    }
    static get is() { return "image-gallery-drag-clone"; }
    static get originalStyleUrls() {
        return {
            "$": ["image-gallery-drag-clone.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["image-gallery-drag-clone.css"]
        };
    }
}
//# sourceMappingURL=image-gallery-drag-clone.js.map
