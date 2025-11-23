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
        return (h("div", { key: 'dbf0aa6e813e056cff957f008caad5464e68a081', class: "blog-button-content" }, h("button", { key: '0c4cf1c6cdd7de55da087b5646b6f2d29339fcd2', class: `demo-button ${this.variant}`, onClick: this.handleClick }, this.label)));
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
