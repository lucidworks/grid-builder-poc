import { proxyCustomElement, HTMLElement, createEvent, h } from '@stencil/core/internal/client';

const blogButtonCss = "blog-button .blog-button-content{display:flex;width:100%;height:100%;align-items:center;justify-content:center;padding:min(3%, 8px);overflow:hidden;box-sizing:border-box}blog-button .demo-button{max-width:100%;max-height:100%;padding:min(4%, 12px) min(8%, 28px);border:none;border-radius:min(2%, 6px);box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);cursor:pointer;font-size:clamp(12px, 4cqw, 16px);font-weight:600;line-height:1.2;transition:all 0.2s ease;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-sizing:border-box}blog-button .demo-button.primary{background:#4a90e2;color:white}blog-button .demo-button.primary:hover{background:#357abd;box-shadow:0 4px 8px rgba(0, 0, 0, 0.15);transform:translateY(-1px)}blog-button .demo-button.secondary{border:2px solid #4a90e2;background:white;color:#4a90e2}blog-button .demo-button.secondary:hover{background:#F7FBFF;box-shadow:0 4px 8px rgba(0, 0, 0, 0.15);transform:translateY(-1px)}";

const BlogButton = /*@__PURE__*/ proxyCustomElement(class BlogButton extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.buttonClick = createEvent(this, "buttonClick", 7);
        this.label = 'Click me!';
        this.variant = 'primary';
        this.handleClick = (_e) => {
            if (this.href) {
                window.location.href = this.href;
            }
            this.buttonClick.emit();
        };
    }
    render() {
        return (h("div", { key: '0091adf1e5409b114d855e03d84bc0334bc2a50c', class: "blog-button-content" }, h("button", { key: '040440be62f92ec76e4f2ee8cd98875e3f4333c2', class: `demo-button ${this.variant}`, onClick: this.handleClick }, this.label)));
    }
    static get style() { return blogButtonCss; }
}, [256, "blog-button", {
        "label": [1],
        "variant": [1],
        "href": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["blog-button"];
    components.forEach(tagName => { switch (tagName) {
        case "blog-button":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, BlogButton);
            }
            break;
    } });
}

export { BlogButton as B, defineCustomElement as d };
//# sourceMappingURL=blog-button2.js.map

//# sourceMappingURL=blog-button2.js.map