import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const dashboardWidgetDragCloneCss = ".dashboard-preview{display:flex;width:100%;height:100%;align-items:center;justify-content:center;background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);color:#495057;font-size:clamp(12px, 2vw, 14px);font-weight:500}";

const DashboardWidgetDragClone = /*@__PURE__*/ proxyCustomElement(class DashboardWidgetDragClone extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '166a2983147ab1510266029d402ed195e8cf47fd', class: "dashboard-preview" }, h("span", { key: 'e2dedcf75d6b0297246f2fffa5169719801b9c88' }, "Dashboard")));
    }
    static get style() { return dashboardWidgetDragCloneCss; }
}, [256, "dashboard-widget-drag-clone"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dashboard-widget-drag-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "dashboard-widget-drag-clone":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, DashboardWidgetDragClone);
            }
            break;
    } });
}

export { DashboardWidgetDragClone as D, defineCustomElement as d };
//# sourceMappingURL=dashboard-widget-drag-clone2.js.map

//# sourceMappingURL=dashboard-widget-drag-clone2.js.map