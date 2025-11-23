import { h } from "@stencil/core";
export class LiveData {
    constructor() {
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
        return (h("div", { key: 'f3f3fdc80d6ed83205018452a54dfd3c70da636e', class: "live-data" }, h("div", { key: '1fb384c3f2377b56b327e670386a5e848f082f16', class: "temperature-display" }, h("div", { key: 'ac16626244fa3a236cb3952a1ce6467530591cf1', class: "temperature-label" }, "\uD83C\uDF21\uFE0F Temperature"), h("div", { key: 'f757ae47f901286bf37f69890744d670f39a25fa', class: "temperature-value" }, this.temperature, "\u00B0C")), h("div", { key: 'e5e895274f1ef6f71b40f9f43ce4675d219e979f', class: "metric" }, h("div", { key: '85931ef4b8924cd787d077ddad8b60b8e31c8abc', class: "metric-header" }, h("span", { key: '7fe4786632d8de87404b37fc00d429f4ed5be4fe', class: "metric-label" }, "CPU"), h("span", { key: '253de62184ec78e010c4faee6eabf7e96ade8b2a', class: "metric-percentage" }, this.cpu, "%")), h("div", { key: '048326940c271ad2a3ea44634e38a8d9d98d025e', class: "progress-bar" }, h("div", { key: 'e3bf39073faa32ce5e33fe21fae958776b612a63', class: "progress-fill progress-primary", style: { width: `${this.cpu}%` } }))), h("div", { key: '7835d9f5db9895f3df780cd05e2b2989b4313d07', class: "metric" }, h("div", { key: '9c7b1a3cc342287c7d4430758d41c8271b64e8ae', class: "metric-header" }, h("span", { key: '1e59c4b1bdda743c143078a218bf11f5db4463a8', class: "metric-label" }, "Memory"), h("span", { key: 'cce9f5d121a49d9602cf3d91901deddf62554266', class: "metric-percentage" }, this.memory, "%")), h("div", { key: 'bc06e6bab8d088de00d642cd4487535b8a2fd0e4', class: "progress-bar" }, h("div", { key: '2d5ba9946352d7ef752132e5bfc18e986b8da241', class: "progress-fill progress-success", style: { width: `${this.memory}%` } }))), h("div", { key: '708251e68cfef3f3c300bcc41bcd4cd6b6dc9947', class: "update-info" }, "Updated ", this.updateCount, " times \u2022 Last: ", this.lastUpdate)));
    }
    static get is() { return "live-data"; }
    static get originalStyleUrls() {
        return {
            "$": ["live-data.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["live-data.css"]
        };
    }
    static get states() {
        return {
            "temperature": {},
            "cpu": {},
            "memory": {},
            "updateCount": {},
            "lastUpdate": {}
        };
    }
}
//# sourceMappingURL=live-data.js.map
