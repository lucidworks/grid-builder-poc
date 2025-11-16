import { r as registerInstance, h } from './index-ebe9feb4.js';

const componentHeaderCss = ".component-header-content{width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:20px}.component-header-content h1{font-size:18px;font-weight:600;color:#212529;margin:0;line-height:1.3;text-align:center}";

const ComponentHeader = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemId = undefined;
    }
    render() {
        return (h("div", { class: "component-header-content" }, h("h1", null, "This is a header component")));
    }
};
ComponentHeader.style = componentHeaderCss;

export { ComponentHeader as component_header };

//# sourceMappingURL=component-header.entry.js.map