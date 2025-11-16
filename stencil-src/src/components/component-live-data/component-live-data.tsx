import { Component, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'component-live-data',
  styleUrl: 'component-live-data.css',
  shadow: false,
})
export class ComponentLiveData {
  @Prop() itemId!: string;
  @State() value: number = 0;

  private intervalId: any;

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
    return (
      <div class="component-live-data-content">
        <div class="live-data-header">
          <h3>Live Data Feed</h3>
          <span class="live-indicator">● LIVE</span>
        </div>
        <div class="live-data-value">{this.value}</div>
        <div class="live-data-label">Current Value</div>
      </div>
    );
  }
}
