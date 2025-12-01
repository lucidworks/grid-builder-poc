import { r as registerInstance, a as createEvent, h, e as Host } from './index-CoCbyscT.js';

const blogButtonCss = "blog-button{display:block;width:100%;height:100%;border-radius:8px;overflow:hidden;box-sizing:border-box}blog-button .blog-button-content{display:flex;width:100%;height:100%;align-items:center;justify-content:center;padding:min(3%, 8px);box-sizing:border-box}blog-button .demo-button{max-width:100%;max-height:100%;padding:min(4%, 12px) min(8%, 28px);border:none;border-radius:min(2%, 6px);box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);cursor:pointer;font-size:clamp(12px, 4cqw, 16px);font-weight:600;line-height:1.2;transition:all 0.2s ease;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-sizing:border-box}blog-button .demo-button.primary{background:#4a90e2;color:white}blog-button .demo-button.primary:hover{background:#357abd;box-shadow:0 4px 8px rgba(0, 0, 0, 0.15);transform:translateY(-1px)}blog-button .demo-button.secondary{border:2px solid #4a90e2;background:white;color:#4a90e2}blog-button .demo-button.secondary:hover{background:#F7FBFF;box-shadow:0 4px 8px rgba(0, 0, 0, 0.15);transform:translateY(-1px)}";

const BlogButton = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.buttonClick = createEvent(this, "buttonClick", 7);
        this.label = "Click me!";
        this.variant = "primary";
        this.backgroundColor = "#bbdefb";
        this.handleClick = (_e) => {
            if (this.href) {
                window.open(this.href, '_blank');
            }
            this.buttonClick.emit();
        };
    }
    render() {
        return (h(Host, { key: '03aac33859713e6d0f87c4b6148d3b34b7c6d04f' }, h("div", { key: '01d29f532c9ca02f8648d87b87c50f53ceea6cee', class: "blog-button-content" }, h("button", { key: 'd3a33d84557d5435cfba42c2c577707b38e2d9a1', class: `demo-button ${this.variant}`, onClick: this.handleClick }, this.label))));
    }
};
BlogButton.style = blogButtonCss;

export { BlogButton as blog_button };
//# sourceMappingURL=blog-button.entry.esm.js.map
