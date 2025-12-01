import { r as registerInstance, h } from './index-CoCbyscT.js';

const customPaletteItemCss = ".custom-palette-item{display:flex;width:100%;box-sizing:border-box;flex-direction:column;align-items:center;justify-content:center;padding:16px 12px;gap:12px;background:transparent;cursor:grab;transition:background-color 0.2s}.custom-palette-item:hover{background-color:rgba(255, 255, 255, 0.05)}.custom-palette-item:active{cursor:grabbing}.palette-name{overflow:hidden;color:#495057;font-size:13px;font-weight:500;text-align:center;text-overflow:ellipsis;white-space:nowrap;width:100%;order:-1;pointer-events:none}.palette-icon-container{display:flex;width:100%;height:80px;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s;pointer-events:none}.palette-icon-container svg{width:100%;max-width:100px;height:auto;color:#6c757d !important;pointer-events:none}.custom-palette-item:hover .palette-icon-container{transform:scale(1.05)}.palette-icon-emoji{font-size:32px;line-height:1}";

const CustomPaletteItem = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    /**
     * Get SVG canvas preview based on component type
     * Shows abstract representation of how the component appears on canvas
     */
    getSvgIcon() {
        const iconMap = {
            "blog-header": (h("svg", { viewBox: "0 0 80 32", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { x: "8", y: "6", width: "64", height: "8", rx: "2", fill: "currentColor" }), h("rect", { x: "16", y: "18", width: "48", height: "4", rx: "1", fill: "currentColor", opacity: "0.5" }))),
            "blog-article": (h("svg", { viewBox: "0 0 80 48", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { x: "8", y: "6", width: "48", height: "4", rx: "1", fill: "currentColor" }), h("rect", { x: "8", y: "14", width: "64", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.6" }), h("rect", { x: "8", y: "19", width: "60", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.6" }), h("rect", { x: "8", y: "24", width: "56", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.6" }), h("rect", { x: "8", y: "29", width: "52", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.6" }), h("rect", { x: "8", y: "38", width: "24", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.4" }), h("rect", { x: "36", y: "38", width: "20", height: "2", rx: "0.5", fill: "currentColor", opacity: "0.4" }))),
            "blog-button": (h("svg", { viewBox: "0 0 80 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { x: "16", y: "6", width: "48", height: "12", rx: "6", fill: "currentColor" }), h("rect", { x: "28", y: "10", width: "24", height: "4", rx: "1", fill: "white", opacity: "0.9" }))),
        };
        return (iconMap[this.componentType] || (h("span", { class: "palette-icon-emoji" }, this.icon)));
    }
    render() {
        return (h("div", { key: '722ec17e3002032881c8a1ccd49f0f51c6599717', class: "custom-palette-item" }, h("div", { key: '38e53f0d5eb1b5d3f03a18250aff0a88db5f0557', class: "palette-name" }, this.name), h("div", { key: '0638809f9b849d807bb43ab84d14c1175890b403', class: "palette-icon-container" }, this.getSvgIcon())));
    }
};
CustomPaletteItem.style = customPaletteItemCss;

export { CustomPaletteItem as custom_palette_item };
//# sourceMappingURL=custom-palette-item.entry.esm.js.map
