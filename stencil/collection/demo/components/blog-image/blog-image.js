import { h } from "@stencil/core";
export class BlogImage {
    constructor() {
        this.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
        this.alt = 'Placeholder image';
        this.objectFit = 'contain';
        this.imageLoaded = false;
        this.imageError = false;
        this.handleImageLoad = () => {
            this.imageLoaded = true;
            this.imageError = false;
        };
        this.handleImageError = () => {
            this.imageError = true;
            this.imageLoaded = false;
        };
    }
    componentDidLoad() {
        var _a, _b;
        // Check if image is already loaded (cached)
        if (((_a = this.imgRef) === null || _a === void 0 ? void 0 : _a.complete) && ((_b = this.imgRef) === null || _b === void 0 ? void 0 : _b.naturalHeight) !== 0) {
            this.imageLoaded = true;
        }
    }
    render() {
        return (h("div", { key: 'fefeb0e9f93c7c398c07844182bc7af75bda6bc3', class: "blog-image-content" }, h("div", { key: 'fa996ee62b615ec516eebdf0830e48e6c62f184d', class: "image-container" }, !this.imageLoaded && !this.imageError && (h("div", { key: 'b6e8f9ba8a0fc11cb26d05d0b474177d9eb33595', class: "image-placeholder" }, h("div", { key: '49be84758eeea3e53ba549ab9fc4006cb230ed5a', class: "spinner" }))), this.imageError && (h("div", { key: 'a4854961b4a0ca5cb87e88018cbc64972f526e6e', class: "image-error" }, h("span", { key: '4047d43c70389ad4d7afffc9425a58ceb0f3176c', class: "error-icon" }, "\uD83D\uDDBC\uFE0F"), h("span", { key: '26079bdeb350c316fee32c593d4e66bf938f6fc7', class: "error-text" }, "Failed to load image"))), h("img", { key: '5120532071d7780be0f81f62e4433e72009646f0', ref: (el) => this.imgRef = el, src: this.src, alt: this.alt, class: {
                'blog-image': true,
                'loaded': this.imageLoaded,
                'fit-contain': this.objectFit === 'contain',
                'fit-cover': this.objectFit === 'cover',
            }, onLoad: this.handleImageLoad, onError: this.handleImageError })), this.caption && (h("div", { key: '9eb9ee63c073fcada611925151084e1d42f851b3', class: "image-caption" }, this.caption))));
    }
    static get is() { return "blog-image"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-image.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-image.css"]
        };
    }
    static get properties() {
        return {
            "src": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
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
                "attribute": "src",
                "defaultValue": "'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'"
            },
            "alt": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
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
                "attribute": "alt",
                "defaultValue": "'Placeholder image'"
            },
            "caption": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "caption"
            },
            "objectFit": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "'contain' | 'cover'",
                    "resolved": "\"contain\" | \"cover\"",
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
                "attribute": "object-fit",
                "defaultValue": "'contain'"
            }
        };
    }
    static get states() {
        return {
            "imageLoaded": {},
            "imageError": {}
        };
    }
}
//# sourceMappingURL=blog-image.js.map
