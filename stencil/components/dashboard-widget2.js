import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const dashboardWidgetCss = ".dashboard-widget{font-size:11px;line-height:1.4}.stats-row{display:flex;justify-content:space-between;margin-bottom:8px;gap:4px}.stat-card{flex:1;padding:6px;border-radius:3px;background:#f0f0f0}.stat-label{color:#666;font-weight:600}.stat-value{font-size:16px;font-weight:700}.stat-primary{color:#4a90e2}.stat-success{color:#28a745}.chart-container{margin-bottom:6px;padding:8px;border-radius:3px;background:#f8f8f8}.chart-title{margin-bottom:4px;font-weight:600}.chart-bars{display:flex;align-items:flex-end;height:40px;gap:2px}.chart-bar{flex:1;background:#4a90e2}.metrics-list{color:#999;font-size:10px}";

const DashboardWidget = /*@__PURE__*/ proxyCustomElement(class DashboardWidget extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '03eb1467b9157c171e74de2d53bb7f664d003458', class: "dashboard-widget" }, h("div", { key: '36ccfeabaf2ff2ca0b2e7fa014ce2bed226fe367', class: "stats-row" }, h("div", { key: '483472053d7bff5ee83848d622b6cdf7391273fa', class: "stat-card" }, h("div", { key: '24ccf37269a4e2f0f46a69a4270f6d2d3aed0e3d', class: "stat-label" }, "Users"), h("div", { key: '27904d5526cf64fb3ffa56cc3a27749e9035c048', class: "stat-value stat-primary" }, "2,547")), h("div", { key: 'f86048e60a5d9954efafc36c72c8aece4235007a', class: "stat-card" }, h("div", { key: 'cf9eb0ef0454e3eaed7bd5b936984afe290cd9d2', class: "stat-label" }, "Revenue"), h("div", { key: '4fc882e80a92a6921960c828af44d06ff5da990d', class: "stat-value stat-success" }, "$12.4K"))), h("div", { key: 'e372aed01c27abc791c4ac5c9a2e96e7b54f9de9', class: "chart-container" }, h("div", { key: '9ce9a720c90f50c127d204804eadee1e5e74ab3e', class: "chart-title" }, "Activity Chart"), h("div", { key: '04862f44645f84836181b66e0551f2dbfbce2009', class: "chart-bars" }, h("div", { key: '9adcbc6afb64f47ca363cd4a0b7170eb83943516', class: "chart-bar", style: { height: '60%' } }), h("div", { key: 'a580344b30d7e0500557baa3f5af793be1629b9b', class: "chart-bar", style: { height: '80%' } }), h("div", { key: '75b5cb787b4ec9690b7492629e0e2ce6cba48c13', class: "chart-bar", style: { height: '40%' } }), h("div", { key: '0d6ccd469d2459bc8668c1f6f3cfb1c49b3f3e6e', class: "chart-bar", style: { height: '90%' } }), h("div", { key: 'f4716e742e868edd8f9f81efc90f2377bc7eafc9', class: "chart-bar", style: { height: '70%' } }), h("div", { key: '2867f7fdeffefdcf190241fa4f96c6e03a12efdb', class: "chart-bar", style: { height: '85%' } }), h("div", { key: '9ba9651eec1615010366a6f4fd9cf1bee9742892', class: "chart-bar", style: { height: '95%' } }))), h("div", { key: '7bbd0850e644bda3ad66d5c32651c1845b10782f', class: "metrics-list" }, h("div", { key: 'f7be05ad9efab79e6d354520418c87fc8a6d7fe6' }, "\u2022 24 active sessions"), h("div", { key: '2202449bbb88dd117de1ff9ef17de8a9d0c11812' }, "\u2022 156 page views"), h("div", { key: '36d9ff509bad961ff39b5ef8627d24bd1e49140f' }, "\u2022 89% bounce rate"))));
    }
    static get style() { return dashboardWidgetCss; }
}, [256, "dashboard-widget"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dashboard-widget"];
    components.forEach(tagName => { switch (tagName) {
        case "dashboard-widget":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, DashboardWidget);
            }
            break;
    } });
}

export { DashboardWidget as D, defineCustomElement as d };
//# sourceMappingURL=dashboard-widget2.js.map

//# sourceMappingURL=dashboard-widget2.js.map