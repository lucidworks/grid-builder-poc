import { r as registerInstance, h } from './index-ebe9feb4.js';

const componentTextBlockCss = ".component-text-block-content{width:100%;height:100%;padding:15px}.component-text-block-content p{font-size:15px;line-height:1.7;color:#495057;margin:0}";

const ComponentTextBlock = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemId = undefined;
    }
    render() {
        return (h("div", { class: "component-text-block-content" }, h("p", null, "This is a text block component")));
    }
};
ComponentTextBlock.style = componentTextBlockCss;

export { ComponentTextBlock as component_text_block };

//# sourceMappingURL=component-text-block.entry.js.map