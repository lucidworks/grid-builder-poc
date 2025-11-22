import { proxyCustomElement, HTMLElement, h } from '@stencil/core/internal/client';

const liveDataCss = ".live-data{font-size:11px}.temperature-display{margin-bottom:8px;padding:6px;border-radius:3px;background:#e3f2fd}.temperature-label{color:#1976d2;font-weight:600}.temperature-value{color:#1976d2;font-size:20px;font-weight:700}.metric{margin-bottom:6px}.metric-header{display:flex;justify-content:space-between;margin-bottom:2px}.metric-label{font-weight:600}.progress-bar{overflow:hidden;height:6px;border-radius:3px;background:#e0e0e0}.progress-fill{height:100%;transition:width 0.5s}.progress-primary{background:#4a90e2}.progress-success{background:#28a745}.update-info{margin-top:8px;color:#999;font-size:10px}";

const LiveData = /*@__PURE__*/ proxyCustomElement(class LiveData extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.temperature = '20.0';
        this.cpu = '0';
        this.memory = '40';
        this.updateCount = 0;
        this.lastUpdate = '';
        this.updateData = () => {
            this.updateCount++;
            this.temperature = (20 + Math.random() * 10).toFixed(1);
            this.cpu = (Math.random() * 100).toFixed(0);
            this.memory = (40 + Math.random() * 50).toFixed(0);
            this.lastUpdate = new Date().toLocaleTimeString();
        };
    }
    componentDidLoad() {
        // Initial update
        this.updateData();
        // Poll every 2 seconds
        this.intervalId = window.setInterval(() => {
            this.updateData();
        }, 2000);
    }
    disconnectedCallback() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    render() {
        return (h("div", { key: '48aa3ef07c511f2b5a6e78cd247da6f5ca15f01c', class: "live-data" }, h("div", { key: '8ab8c19d4a37cd304093cb57747ef4967ba31970', class: "temperature-display" }, h("div", { key: 'a8f0a8646e8c8284f0cc024ad7b0d8a8f6589739', class: "temperature-label" }, "\uD83C\uDF21\uFE0F Temperature"), h("div", { key: '59abb4dfb245c50f06bf59cc13707488a661176d', class: "temperature-value" }, this.temperature, "\u00B0C")), h("div", { key: 'f68508fd649546f701dcf6d9da03b07a37e3e92e', class: "metric" }, h("div", { key: 'e7910474a4f018e898c5944b2e4956a0ec8be45b', class: "metric-header" }, h("span", { key: '81b6d7d3465d11dee36842af6a6030aad8b0302e', class: "metric-label" }, "CPU"), h("span", { key: 'a4dede07bae3d86bb40a72b8b600f2f74bc9f154', class: "metric-percentage" }, this.cpu, "%")), h("div", { key: '9da4a5d99ad30993f1638a503f3dcbbbdc8e87d3', class: "progress-bar" }, h("div", { key: '44ed66644fb344286e9984f77a0ac1792fd5e4d2', class: "progress-fill progress-primary", style: { width: `${this.cpu}%` } }))), h("div", { key: '2ec4e84147def8ad3b6d338e2e36700f178c7d83', class: "metric" }, h("div", { key: 'eed376a29d5fba89b711c2d87f878a4c6724a612', class: "metric-header" }, h("span", { key: '0be29ada9de3908e6bf98f2f48a9f19f91ce9ac2', class: "metric-label" }, "Memory"), h("span", { key: 'ed688212aed5ccf4ccedb201101893a74142cd18', class: "metric-percentage" }, this.memory, "%")), h("div", { key: '2e54a50faa6fa3227d146aa403f28733e2cf641b', class: "progress-bar" }, h("div", { key: '40539deb22c75cd0f9453ddd881807cf37458784', class: "progress-fill progress-success", style: { width: `${this.memory}%` } }))), h("div", { key: '61e3b9fb2bb372f0c31d155dc3b8e0abb57947d4', class: "update-info" }, "Updated ", this.updateCount, " times \u2022 Last: ", this.lastUpdate)));
    }
    static get style() { return liveDataCss; }
}, [256, "live-data", {
        "temperature": [32],
        "cpu": [32],
        "memory": [32],
        "updateCount": [32],
        "lastUpdate": [32]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["live-data"];
    components.forEach(tagName => { switch (tagName) {
        case "live-data":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, LiveData);
            }
            break;
    } });
}

export { LiveData as L, defineCustomElement as d };
//# sourceMappingURL=live-data2.js.map

//# sourceMappingURL=live-data2.js.map