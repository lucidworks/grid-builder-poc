import { r as registerInstance, h } from './index-ebe9feb4.js';

const componentButtonCss = ".component-button-content{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.demo-button{padding:12px 28px;background:#4a90e2;color:white;border:none;border-radius:6px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 4px rgba(74, 144, 226, 0.3)}.demo-button:hover{background:#357abd;box-shadow:0 4px 8px rgba(74, 144, 226, 0.4);transform:translateY(-1px)}";

const ComponentButton = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemId = undefined;
    }
    render() {
        return (h("div", { class: "component-button-content" }, h("button", { class: "demo-button" }, "Click me!")));
    }
};
ComponentButton.style = componentButtonCss;

export { ComponentButton as component_button };

//# sourceMappingURL=component-button.entry.js.map