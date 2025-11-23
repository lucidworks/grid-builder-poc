import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const liveDataDragCloneCss = ".livedata-preview{display:flex;width:100%;height:100%;align-items:center;justify-content:center;background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);color:#495057;font-size:clamp(12px, 2vw, 14px);font-weight:500}";

const LiveDataDragClone = /*@__PURE__*/ proxyCustomElement(class LiveDataDragClone extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '3724117bd72a9b48bffea1e56550291062085f60', class: "livedata-preview" }, h("span", { key: '7292448b8932323084fc595dc487452a8d752d02' }, "Live Data")));
    }
    static get style() { return liveDataDragCloneCss; }
}, [256, "live-data-drag-clone"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["live-data-drag-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "live-data-drag-clone":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, LiveDataDragClone);
            }
            break;
    } });
}

export { LiveDataDragClone as L, defineCustomElement as d };
//# sourceMappingURL=live-data-drag-clone2.js.map

//# sourceMappingURL=live-data-drag-clone2.js.map