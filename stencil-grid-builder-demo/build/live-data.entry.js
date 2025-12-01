import { r as registerInstance, h, e as Host } from './index-CoCbyscT.js';

const liveDataCss = "live-data{display:block;width:100%;height:100%;border-radius:8px;overflow:hidden;box-sizing:border-box}.live-data{font-size:11px;padding:12px;height:100%;box-sizing:border-box}.temperature-display{margin-bottom:8px;padding:6px;border-radius:3px;background:#e3f2fd}.temperature-label{color:#1976d2;font-weight:600}.temperature-value{color:#1976d2;font-size:20px;font-weight:700}.metric{margin-bottom:6px}.metric-header{display:flex;justify-content:space-between;margin-bottom:2px}.metric-label{font-weight:600}.progress-bar{overflow:hidden;height:6px;border-radius:3px;background:#e0e0e0}.progress-fill{height:100%;transition:width 0.5s}.progress-primary{background:#4a90e2}.progress-success{background:#28a745}.update-info{margin-top:8px;color:#999;font-size:10px}";

const LiveData = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.backgroundColor = "#b2ebf2";
        this.temperature = "20.0";
        this.cpu = "0";
        this.memory = "40";
        this.updateCount = 0;
        this.lastUpdate = "";
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
        return (h(Host, { key: '0c11dde0ea236dd2eaf674113ef8a9811f5ebfdd' }, h("div", { key: '90337bd13d8112b3a42e920e11eb63742f7ebec8', class: "live-data" }, h("div", { key: 'dd10aa0f56e6409ff353b7a51482676192112285', class: "temperature-display" }, h("div", { key: '5f4682542a39a46a2da24157f737597c41c14743', class: "temperature-label" }, "\uD83C\uDF21\uFE0F Temperature"), h("div", { key: '5a719831530d8e270036f68ae69680b23bf0d0b5', class: "temperature-value" }, this.temperature, "\u00B0C")), h("div", { key: 'bf01e25d15b8aa157f06ab310bf47615b897e65c', class: "metric" }, h("div", { key: '531a2702f731ddd6204695af297100985225357b', class: "metric-header" }, h("span", { key: 'b19fb82c18133fb5c9e4f37c4b4f3ee674c5bbaf', class: "metric-label" }, "CPU"), h("span", { key: '0f7f2d72e9b4690af1f2936e6881861fba260bfe', class: "metric-percentage" }, this.cpu, "%")), h("div", { key: '9491bf0708e5b69e0ffae087d2d373e66985ce86', class: "progress-bar" }, h("div", { key: '26b7dfd4a85cac2165157e4b4c11742cc71de50e', class: "progress-fill progress-primary", style: { width: `${this.cpu}%` } }))), h("div", { key: '8b74253266e4e5577fe964453fcd656e928a2dee', class: "metric" }, h("div", { key: '073b60a32cebc82d56ed107e5ca308c3f2b15ea9', class: "metric-header" }, h("span", { key: '91db66415fcfff7a0d5bfe22a189b13efb3c090e', class: "metric-label" }, "Memory"), h("span", { key: '7545ef6e1e3045664c7f4ff3831835b032b1a86e', class: "metric-percentage" }, this.memory, "%")), h("div", { key: '7801caff3781323197ff79dee39cc710db408b5a', class: "progress-bar" }, h("div", { key: '69479e534e2516f1f020f7e3acc84c84615a00b1', class: "progress-fill progress-success", style: { width: `${this.memory}%` } }))), h("div", { key: '3ed60a7f1e92f3e822f51eeb2f787ed387486841', class: "update-info" }, "Updated ", this.updateCount, " times \u2022 Last: ", this.lastUpdate))));
    }
};
LiveData.style = liveDataCss;

export { LiveData as live_data };
//# sourceMappingURL=live-data.entry.esm.js.map
