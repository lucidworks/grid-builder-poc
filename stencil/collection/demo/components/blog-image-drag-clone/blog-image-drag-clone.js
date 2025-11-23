import { h } from "@stencil/core";
export class BlogImageDragClone {
    render() {
        return (h("div", { key: 'cf485810c6f42d321e06758548379a0af493e28a', class: "image-preview" }, h("div", { key: 'f828d4db7f5a8fed760a1b4254afacf615c73e84', class: "image-placeholder" }, h("svg", { key: '0bb4028b9a404247012f757dcfd31517cff53bda', viewBox: "0 0 48 48", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { key: 'cad6e7b5164b4122b45d928cde40cc604383bab9', x: "6", y: "10", width: "36", height: "28", rx: "2", stroke: "currentColor", "stroke-width": "2", fill: "none" }), h("circle", { key: '3f24dac994c616ad556548d8a42fb18cd1c33d3f', cx: "15", cy: "18", r: "3", fill: "currentColor", opacity: "0.5" }), h("path", { key: '2ed62e83988aa54de02707707e74052087a480b1', d: "M6 32 L16 22 L24 30 L32 22 L42 32", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", fill: "none" }))), h("div", { key: '8f08d2b7f5f3c7db1ea5f979a29b11f25cd64f42', class: "image-caption" }, "Image")));
    }
    static get is() { return "blog-image-drag-clone"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-image-drag-clone.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-image-drag-clone.css"]
        };
    }
}
//# sourceMappingURL=blog-image-drag-clone.js.map
