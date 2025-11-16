import { r as registerInstance, h } from './index-ebe9feb4.js';

const componentDashboardWidgetCss = ".component-dashboard-widget-content{width:100%;height:100%;padding:15px;display:flex;flex-direction:column;gap:15px}.widget-header h3{font-size:16px;font-weight:600;color:#333;margin:0}.widget-stats{display:flex;gap:15px;flex:1}.stat-item{flex:1;background:#f5f5f5;padding:15px;border-radius:4px;text-align:center}.stat-value{font-size:24px;font-weight:bold;color:#4a90e2;margin-bottom:5px}.stat-label{font-size:12px;color:#666;text-transform:uppercase}";

const ComponentDashboardWidget = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemId = undefined;
    }
    render() {
        return (h("div", { class: "component-dashboard-widget-content" }, h("div", { class: "widget-header" }, h("h3", null, "Analytics Dashboard")), h("div", { class: "widget-stats" }, h("div", { class: "stat-item" }, h("div", { class: "stat-value" }, "1,234"), h("div", { class: "stat-label" }, "Users")), h("div", { class: "stat-item" }, h("div", { class: "stat-value" }, "56.7%"), h("div", { class: "stat-label" }, "Growth")), h("div", { class: "stat-item" }, h("div", { class: "stat-value" }, "$12.3K"), h("div", { class: "stat-label" }, "Revenue")))));
    }
};
ComponentDashboardWidget.style = componentDashboardWidgetCss;

export { ComponentDashboardWidget as component_dashboard_widget };

//# sourceMappingURL=component-dashboard-widget.entry.js.map