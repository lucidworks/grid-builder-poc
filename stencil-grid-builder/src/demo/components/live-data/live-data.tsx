import { Component, h, State, Prop, Host } from "@stencil/core";

@Component({
  tag: "live-data",
  styleUrl: "live-data.scss",
  shadow: false,
})
export class LiveData {
  @Prop() backgroundColor?: string = "#b2ebf2";

  @State() temperature: string = "20.0";
  @State() cpu: string = "0";
  @State() memory: string = "40";
  @State() updateCount: number = 0;
  @State() lastUpdate: string = "";

  private intervalId?: number;

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

  private updateData = () => {
    this.updateCount++;
    this.temperature = (20 + Math.random() * 10).toFixed(1);
    this.cpu = (Math.random() * 100).toFixed(0);
    this.memory = (40 + Math.random() * 50).toFixed(0);
    this.lastUpdate = new Date().toLocaleTimeString();
  };

  render() {
    return (
      <Host style={{ background: this.backgroundColor }}>
        <div class="live-data">
        <div class="temperature-display">
          <div class="temperature-label">🌡️ Temperature</div>
          <div class="temperature-value">{this.temperature}°C</div>
        </div>

        <div class="metric">
          <div class="metric-header">
            <span class="metric-label">CPU</span>
            <span class="metric-percentage">{this.cpu}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill progress-primary"
              style={{ width: `${this.cpu}%` }}
            ></div>
          </div>
        </div>

        <div class="metric">
          <div class="metric-header">
            <span class="metric-label">Memory</span>
            <span class="metric-percentage">{this.memory}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill progress-success"
              style={{ width: `${this.memory}%` }}
            ></div>
          </div>
        </div>

        <div class="update-info">
          Updated {this.updateCount} times • Last: {this.lastUpdate}
        </div>
      </div>
      </Host>
    );
  }
}
