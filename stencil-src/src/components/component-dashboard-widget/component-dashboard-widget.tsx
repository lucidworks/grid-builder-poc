import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'component-dashboard-widget',
  styleUrl: 'component-dashboard-widget.scss',
  shadow: false,
})
export class ComponentDashboardWidget {
  @Prop() itemId!: string;

  render() {
    return (
      <div class="component-dashboard-widget-content">
        <div class="widget-header">
          <h3>Analytics Dashboard</h3>
        </div>
        <div class="widget-stats">
          <div class="stat-item">
            <div class="stat-value">1,234</div>
            <div class="stat-label">Users</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">56.7%</div>
            <div class="stat-label">Growth</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">$12.3K</div>
            <div class="stat-label">Revenue</div>
          </div>
        </div>
      </div>
    );
  }
}
