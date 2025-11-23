import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const blogImageCss = "blog-image{display:block;width:100%;height:100%;position:relative;overflow:hidden;box-sizing:border-box}.blog-image-content{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;overflow:hidden;background:#f8f9fa;box-sizing:border-box}.image-container{position:relative;flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;box-sizing:border-box}.blog-image{position:relative;z-index:2;display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-position:center;opacity:0;transition:opacity 0.3s ease}.blog-image.loaded{opacity:1}.blog-image.fit-contain{object-fit:contain}.blog-image.fit-cover{object-fit:cover;width:100%;height:100%}.image-placeholder{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e9ecef;z-index:1}.spinner{width:40px;height:40px;border:3px solid #dee2e6;border-top-color:#4a90e2;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.image-error{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#f8f9fa;color:#6c757d;z-index:1}.image-error .error-icon{font-size:48px}.image-error .error-text{font-size:14px;text-align:center;padding:0 12px}.image-caption{flex-shrink:0;padding:8px 12px;background:rgba(0, 0, 0, 0.03);color:#495057;font-size:12px;font-style:italic;line-height:1.4;text-align:center;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-wrap:break-word;box-sizing:border-box}";

const BlogImage = /*@__PURE__*/ proxyCustomElement(class BlogImage extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
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
    static get style() { return blogImageCss; }
}, [256, "blog-image", {
        "src": [1],
        "alt": [1],
        "caption": [1],
        "objectFit": [1, "object-fit"],
        "imageLoaded": [32],
        "imageError": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["blog-image"];
    components.forEach(tagName => { switch (tagName) {
        case "blog-image":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, BlogImage);
            }
            break;
    } });
}

export { BlogImage as B, defineCustomElement as d };
//# sourceMappingURL=blog-image2.js.map

//# sourceMappingURL=blog-image2.js.map