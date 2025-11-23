import { h } from "@stencil/core";
export class BlogButtonDragClone {
    render() {
        return (h("div", { key: '1a47688e96c9870c7ec9ba6e1b5690da775616bf', class: "button-preview" }, h("span", { key: '067c1f9c0951d2778df11cc4c03e1b83523be7eb' }, "Button")));
    }
    static get is() { return "blog-button-drag-clone"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-button-drag-clone.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-button-drag-clone.css"]
        };
    }
}
//# sourceMappingURL=blog-button-drag-clone.js.map
