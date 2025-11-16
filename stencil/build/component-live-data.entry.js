import { r as registerInstance, h } from './index-ebe9feb4.js';

const componentLiveDataCss = ".component-live-data-content{width:100%;height:100%;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px}.live-data-header{display:flex;align-items:center;gap:10px}.live-data-header h3{font-size:16px;font-weight:600;color:#333;margin:0}.live-indicator{font-size:10px;color:#e74c3c;font-weight:bold;animation:pulse 2s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}.live-data-value{font-size:48px;font-weight:bold;color:#4a90e2;font-variant-numeric:tabular-nums}.live-data-label{font-size:12px;color:#666;text-transform:uppercase}";

const ComponentLiveData = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.itemId = undefined;
        this.value = 0;
    }
    componentDidLoad() {
        // Simulate live data updates
        this.intervalId = setInterval(() => {
            this.value = Math.floor(Math.random() * 100);
        }, 2000);
    }
    disconnectedCallback() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    render() {
        return (h("div", { class: "component-live-data-content" }, h("div", { class: "live-data-header" }, h("h3", null, "Live Data Feed"), h("span", { class: "live-indicator" }, "\u25CF LIVE")), h("div", { class: "live-data-value" }, this.value), h("div", { class: "live-data-label" }, "Current Value")));
    }
};
ComponentLiveData.style = componentLiveDataCss;

export { ComponentLiveData as component_live_data };

//# sourceMappingURL=component-live-data.entry.js.map