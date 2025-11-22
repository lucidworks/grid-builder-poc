import { h } from "@stencil/core";
export class BlogHeader {
    constructor() {
        this.headerTitle = 'Default Header';
    }
    render() {
        return (h("div", { key: '6490d22b347ca64487266af4bb2a00632dce60ef', class: "blog-header-content" }, h("h1", { key: '1b67d82f2cc461294d8016890333ef5143820796' }, this.headerTitle), this.subtitle && h("h2", { key: 'f0ef9f4345cec9e9e965034f602fbdf4afd005a7', class: "subtitle" }, this.subtitle)));
    }
    static get is() { return "blog-header"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-header.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-header.css"]
        };
    }
    static get properties() {
        return {
            "headerTitle": {
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
                "attribute": "header-title",
                "defaultValue": "'Default Header'"
            },
            "subtitle": {
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
                "attribute": "subtitle"
            }
        };
    }
}
//# sourceMappingURL=blog-header.js.map
