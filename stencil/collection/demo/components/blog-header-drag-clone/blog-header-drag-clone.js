import { h } from "@stencil/core";
export class BlogHeaderDragClone {
    render() {
        return (h("div", { key: '8780fef332f15b304e55c34a28182f1b3f31c6f2', class: "header-preview" }, h("div", { key: 'a1cd2633584a6420d0477cf326ab149237a978a6', class: "header-title" }, "Header Title"), h("div", { key: 'e4c3f380ec684cf949a06438612020acc5a04559', class: "header-subtitle" }, "Subtitle text")));
    }
    static get is() { return "blog-header-drag-clone"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-header-drag-clone.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-header-drag-clone.css"]
        };
    }
}
//# sourceMappingURL=blog-header-drag-clone.js.map
