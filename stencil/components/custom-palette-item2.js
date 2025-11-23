import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const customPaletteItemCss = ".custom-palette-item{display:flex;width:100%;box-sizing:border-box;flex-direction:column;align-items:center;justify-content:center;padding:16px 12px;gap:12px;background:transparent;cursor:grab;transition:background-color 0.2s}.custom-palette-item:hover{background-color:rgba(255, 255, 255, 0.05)}.custom-palette-item:active{cursor:grabbing}.palette-name{overflow:hidden;color:#495057;font-size:13px;font-weight:500;text-align:center;text-overflow:ellipsis;white-space:nowrap;width:100%;order:-1;pointer-events:none}.palette-icon-container{display:flex;width:100%;height:80px;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s;pointer-events:none}.palette-icon-container svg{width:100%;max-width:100px;height:auto;color:#6c757d !important;pointer-events:none}.custom-palette-item:hover .palette-icon-container{transform:scale(1.05)}.palette-icon-emoji{font-size:32px;line-height:1}";

const CustomPaletteItem = /*@__PURE__*/ proxyCustomElement(class CustomPaletteItem extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
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
        return (h("div", { key: 'e64cd27ce737220ab32bcdaa448d9a0bc014b9fd', class: "custom-palette-item" }, h("div", { key: '73722e66cf987b4aa0c53f85face7995cd906d95', class: "palette-name" }, this.name), h("div", { key: 'db13a944255e08a6ce08c89540750c4081b0e842', class: "palette-icon-container" }, this.getSvgIcon())));
    }
    static get style() { return customPaletteItemCss; }
}, [256, "custom-palette-item", {
        "componentType": [1, "component-type"],
        "name": [1],
        "icon": [1]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-palette-item"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-palette-item":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, CustomPaletteItem);
            }
            break;
    } });
}

export { CustomPaletteItem as C, defineCustomElement as d };
//# sourceMappingURL=custom-palette-item2.js.map

//# sourceMappingURL=custom-palette-item2.js.map