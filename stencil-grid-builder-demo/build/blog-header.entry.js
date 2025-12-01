import { r as registerInstance, h, e as Host } from './index-CoCbyscT.js';

const blogHeaderCss = "blog-header{display:block;width:100%;height:100%;border-radius:8px;overflow:hidden;box-sizing:border-box}blog-header .blog-header-content{display:flex;width:100%;height:100%;flex-direction:column;align-items:center;justify-content:center;padding:min(10%, 20px);box-sizing:border-box}blog-header .blog-header-content h1{margin:0;width:100%;color:#212529;font-size:clamp(12px, 5cqw, 22px);font-weight:600;line-height:1.3;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}blog-header .blog-header-content .subtitle{margin:min(3%, 8px) 0 0 0;width:100%;color:#6c757d;font-size:clamp(11px, 3.5cqw, 16px);font-weight:400;line-height:1.4;text-align:center;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal}";

const BlogHeader = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.headerTitle = "Default Header";
        this.backgroundColor = "#e8eaf6";
    }
    render() {
        return (h(Host, { key: '30db453f3900931db2c5f21a45b2f469baca9df4' }, h("div", { key: '19e814b4fe951ca2d6c68c0f1aeaadd89d33e04c', class: "blog-header-content" }, h("h1", { key: '7f37c332f99a2034369f472b2e0a1d57370e894a' }, this.headerTitle), this.subtitle && h("h2", { key: '3f9579278c9fcb3ceab08fdbac30a70bdc9024a3', class: "subtitle" }, this.subtitle))));
    }
};
BlogHeader.style = blogHeaderCss;

export { BlogHeader as blog_header };
//# sourceMappingURL=blog-header.entry.esm.js.map
