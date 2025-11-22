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
        return (h("div", { key: '431a2e029e79be8284518d88de03a04c1f3234d2', class: "dashboard-widget" }, h("div", { key: '6d4295ed67c79d361b9f37a3aaec40f5da75f7e4', class: "stats-row" }, h("div", { key: '66cac43528f23e4d167b98ead648d2f7343c9018', class: "stat-card" }, h("div", { key: '274f2d6e07eb04d6d9f4eceb2af231c22b936b85', class: "stat-label" }, "Users"), h("div", { key: 'ae7f7a62301fb4f0601adf38c81735f619584d43', class: "stat-value stat-primary" }, "2,547")), h("div", { key: '2db411f161da2db867e23d8a041b94f67a097813', class: "stat-card" }, h("div", { key: '94d45ea168e45c9fe6d1bb4b2342888f808c4318', class: "stat-label" }, "Revenue"), h("div", { key: 'ec8bcd6b9dd8c71c2db08e02d7067fa70f3421f6', class: "stat-value stat-success" }, "$12.4K"))), h("div", { key: 'f262e602b3b9d7619c5a3ab59e6d1e7eb20e6b81', class: "chart-container" }, h("div", { key: '7fa3491dcf276ecf7ba5dfc776700582a6923d8b', class: "chart-title" }, "Activity Chart"), h("div", { key: 'a6fa179d82cd78a7639cbf7107de22169290a74c', class: "chart-bars" }, h("div", { key: '65e65f8d9e8cfab524d15e0df10916cd759da6fc', class: "chart-bar", style: { height: '60%' } }), h("div", { key: '3272c79fceaebfc72982b916e00fe6aff38fdebd', class: "chart-bar", style: { height: '80%' } }), h("div", { key: '7f99cfe435e4a1ba929d3cdd9d1aaeb01565b93b', class: "chart-bar", style: { height: '40%' } }), h("div", { key: '3f4be5e2700aa68241ad408d30fc586e4b5c4906', class: "chart-bar", style: { height: '90%' } }), h("div", { key: '56eb07f55a8cce504bf6950820c2f5c5c8e779d4', class: "chart-bar", style: { height: '70%' } }), h("div", { key: '9d23f857c84cc7defc8b412610be20974cdda68f', class: "chart-bar", style: { height: '85%' } }), h("div", { key: '013027d1d04a0a4d024297b5889f59345c10ffaf', class: "chart-bar", style: { height: '95%' } }))), h("div", { key: 'c3845b684312cc2d38a6606481e19d66bb158af1', class: "metrics-list" }, h("div", { key: '5a69450c201637d8c586382137d0cae387b26aef' }, "\u2022 24 active sessions"), h("div", { key: 'af502790015d8ee7fa66aa4842c28c6107789262' }, "\u2022 156 page views"), h("div", { key: 'f6fc4b9e6211c5d33a1a6b13534161e663243e73' }, "\u2022 89% bounce rate"))));
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