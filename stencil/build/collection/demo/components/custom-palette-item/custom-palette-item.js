import { h } from "@stencil/core";
/**
 * Custom Palette Item Component
 * ==============================
 *
 * Example custom palette item that shows how consumers can create
 * fully customized palette entries for their components.
 *
 * Updated to display SVG icons on top with titles below (similar to UI builder pattern)
 */
export class CustomPaletteItem {
    /**
     * Get SVG canvas preview based on component type
     * Shows abstract representation of how the component appears on canvas
     */
    getSvgIcon() {
        const iconMap = {
            'blog-header': (h("svg", { viewBox: "0 0 80 32", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { x: "8", y: "6", width: "64", height: "8", rx: "2", fill: "currentColor" }), h("rect", { x: "16", y: "18", width: "48", height: "4", rx: "1", fill: "currentColor", opacity: "0.5" }))),
            'blog-article': (h("svg", { viewBox: "0 0 80 48", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { x: "8", y: "6", width: "48", height: "4", rx: "1", fill: "currentColor" }), h("rect", { x: "8", y: "14", width: "64", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.6" }), h("rect", { x: "8", y: "19", width: "60", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.6" }), h("rect", { x: "8", y: "24", width: "56", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.6" }), h("rect", { x: "8", y: "29", width: "52", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.6" }), h("rect", { x: "8", y: "38", width: "24", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.4" }), h("rect", { x: "36", y: "38", width: "20", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.4" }))),
            'blog-button': (h("svg", { viewBox: "0 0 80 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { x: "16", y: "6", width: "48", height: "12", rx: "6", fill: "currentColor" }), h("rect", { x: "28", y: "10", width: "24", height: "4", rx: "1", fill: "white", opacity: "0.9" }))),
        };
        return iconMap[this.componentType] || h("span", { class: "palette-icon-emoji" }, this.icon);
    }
    render() {
        return (h("div", { key: '2330609b398ee7e7791595c7ba6869a65b894667', class: "custom-palette-item" }, h("div", { key: '8ab8af333b5bea96c9c31678b815126fad34c66f', class: "palette-name" }, this.name), h("div", { key: '38fcbefe9a85df89bde1393509d85774b7c24ce9', class: "palette-icon-container" }, this.getSvgIcon())));
    }
    static get is() { return "custom-palette-item"; }
    static get originalStyleUrls() {
        return {
            "$": ["custom-palette-item.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["custom-palette-item.css"]
        };
    }
    static get properties() {
        return {
            "componentType": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Component type"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "component-type"
            },
            "name": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Display name"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "name"
            },
            "icon": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Icon/emoji or SVG identifier"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "icon"
            }
        };
    }
}
//# sourceMappingURL=custom-palette-item.js.map
