import { h } from "@stencil/core";
export class BlogButton {
    constructor() {
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
    static get is() { return "blog-button"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-button.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-button.css"]
        };
    }
    static get properties() {
        return {
            "label": {
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
                "attribute": "label",
                "defaultValue": "'Click me!'"
            },
            "variant": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "'primary' | 'secondary'",
                    "resolved": "\"primary\" | \"secondary\"",
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
                "attribute": "variant",
                "defaultValue": "'primary'"
            },
            "href": {
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
                "attribute": "href"
            }
        };
    }
    static get events() {
        return [{
                "method": "buttonClick",
                "name": "buttonClick",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "complexType": {
                    "original": "void",
                    "resolved": "void",
                    "references": {}
                }
            }];
    }
}
//# sourceMappingURL=blog-button.js.map
