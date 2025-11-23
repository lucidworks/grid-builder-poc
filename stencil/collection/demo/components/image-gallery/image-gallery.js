import { h } from "@stencil/core";
export class ImageGallery {
    constructor() {
        this.imageCount = 6;
    }
    getRandomImageUrl() {
        return `https://picsum.photos/400?random=${Math.random()}`;
    }
    render() {
        const images = Array.from({ length: this.imageCount }, () => this.getRandomImageUrl());
        return (h("div", { key: '8ea26144328d858061bc9e72d86442163b25c892', class: "image-gallery" }, images.map((url, index) => (h("div", { class: "gallery-item", key: index }, h("img", { src: url, alt: `Gallery image ${index + 1}`, loading: "lazy" }))))));
    }
    static get is() { return "image-gallery"; }
    static get originalStyleUrls() {
        return {
            "$": ["image-gallery.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["image-gallery.css"]
        };
    }
    static get properties() {
        return {
            "imageCount": {
                "type": "number",
                "mutable": false,
                "complexType": {
                    "original": "number",
                    "resolved": "number",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "image-count",
                "defaultValue": "6"
            }
        };
    }
}
//# sourceMappingURL=image-gallery.js.map
