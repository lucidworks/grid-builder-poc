import { r as registerInstance, h, e as Host } from './index-CoCbyscT.js';

const blogImageCss = "blog-image{display:block;width:100%;height:100%;position:relative;border-radius:8px;overflow:hidden;box-sizing:border-box}.blog-image-content{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box}.image-container{position:relative;flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;box-sizing:border-box}.blog-image{position:relative;z-index:2;display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-position:center;opacity:0;transition:opacity 0.3s ease}.blog-image.loaded{opacity:1}.blog-image.fit-contain{object-fit:contain}.blog-image.fit-cover{object-fit:cover;width:100%;height:100%}.image-placeholder{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e9ecef;z-index:1}.spinner{width:40px;height:40px;border:3px solid #dee2e6;border-top-color:#4a90e2;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.image-error{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#f8f9fa;color:#6c757d;z-index:1}.image-error .error-icon{font-size:48px}.image-error .error-text{font-size:14px;text-align:center;padding:0 12px}.image-caption{flex-shrink:0;padding:8px 12px;background:rgba(0, 0, 0, 0.03);color:#495057;font-size:12px;font-style:italic;line-height:1.4;text-align:center;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-wrap:break-word;box-sizing:border-box}";

const BlogImage = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.src = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop";
        this.alt = "Placeholder image";
        this.objectFit = "contain";
        this.backgroundColor = "#c8e6c9";
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
        return (h(Host, { key: 'a46854e021031f3260b8ebf981d0050fd68644e3' }, h("div", { key: 'e2a075e867d29f084bf55a1db5cc4f69116b52d6', class: "blog-image-content" }, h("div", { key: 'b0e21943a051facba616818fc96562369846f5d2', class: "image-container" }, !this.imageLoaded && !this.imageError && (h("div", { key: '8ef37c5a28604726375bc71c418a392100f1defd', class: "image-placeholder" }, h("div", { key: 'dae7d336d7431ee4bb6922472288a653e155a871', class: "spinner" }))), this.imageError && (h("div", { key: 'a51fa717007d79082afe845265ebfd3ebafa56da', class: "image-error" }, h("span", { key: '941ba543696869b743f4a46cf5ef231c13122543', class: "error-icon" }, "\uD83D\uDDBC\uFE0F"), h("span", { key: '71990912485257734f8dc310b3ec9e5d86c48f4e', class: "error-text" }, "Failed to load image"))), h("img", { key: '130bca86ca3de545fc36a0c9d1683fc2664bc149', ref: (el) => (this.imgRef = el), src: this.src, alt: this.alt, class: {
                "blog-image": true,
                loaded: this.imageLoaded,
                "fit-contain": this.objectFit === "contain",
                "fit-cover": this.objectFit === "cover",
            }, onLoad: this.handleImageLoad, onError: this.handleImageError })), this.caption && h("div", { key: '7a6b23e520eaae8c420d25e4c4eda370b5d510a2', class: "image-caption" }, this.caption))));
    }
};
BlogImage.style = blogImageCss;

export { BlogImage as blog_image };
//# sourceMappingURL=blog-image.entry.esm.js.map
