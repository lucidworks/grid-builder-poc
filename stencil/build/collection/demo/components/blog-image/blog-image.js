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
        return (h("div", { key: '3f73a668a46013138c8bebbd6b2cb93d394e36f3', class: "blog-image-content" }, h("div", { key: '9ec0dca51834acfa6b1a0d7858357171f4c4f03c', class: "image-container" }, !this.imageLoaded && !this.imageError && (h("div", { key: '4c8d1b845cc8b59473da959ea728ac1f46796eab', class: "image-placeholder" }, h("div", { key: '4370e0f255bc4e9deba617e2974d7568ef34a2a4', class: "spinner" }))), this.imageError && (h("div", { key: '39da704a73a9f4067c8f2ca1373f882b5bae73a7', class: "image-error" }, h("span", { key: '0dd4015d2e563bfcbf572ecf45c987695f2bb266', class: "error-icon" }, "\uD83D\uDDBC\uFE0F"), h("span", { key: '4148ea4672a4a99d0dcd6c8db1f5af47e2b46e93', class: "error-text" }, "Failed to load image"))), h("img", { key: '6be7c34a8c14db5184d07e1c3a6f07205e7161c3', ref: (el) => this.imgRef = el, src: this.src, alt: this.alt, class: {
                'blog-image': true,
                'loaded': this.imageLoaded,
                'fit-contain': this.objectFit === 'contain',
                'fit-cover': this.objectFit === 'cover',
            }, onLoad: this.handleImageLoad, onError: this.handleImageError })), this.caption && (h("div", { key: '4548fe393c441224522c945f407c429a30f33010', class: "image-caption" }, this.caption))));
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
