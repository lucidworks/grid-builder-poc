import { h } from "@stencil/core";
export class BlogHeader {
    constructor() {
        this.headerTitle = 'Default Header';
    }
    render() {
        return (h("div", { key: '0ea35f136f273c13603c9168ca5646d3ad57c225', class: "blog-header-content" }, h("h1", { key: 'b7723355a82ca3a023dadd6de860078807006e34' }, this.headerTitle), this.subtitle && h("h2", { key: '12f6ed48aac6267b472d340abcef951d6897f491', class: "subtitle" }, this.subtitle)));
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
