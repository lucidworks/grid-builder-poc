import { Component, h } from '@stencil/core';

@Component({
  tag: 'dashboard-widget',
  styleUrl: 'dashboard-widget.scss',
  shadow: false,
})
export class DashboardWidget {
  render() {
    return (
      <div class="dashboard-widget">
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-label">Users</div>
            <div class="stat-value stat-primary">2,547</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Revenue</div>
            <div class="stat-value stat-success">$12.4K</div>
          </div>
        </div>

        <div class="chart-container">
          <div class="chart-title">Activity Chart</div>
          <div class="chart-bars">
            <div class="chart-bar" style={{ height: '60%' }}></div>
            <div class="chart-bar" style={{ height: '80%' }}></div>
            <div class="chart-bar" style={{ height: '40%' }}></div>
            <div class="chart-bar" style={{ height: '90%' }}></div>
            <div class="chart-bar" style={{ height: '70%' }}></div>
            <div class="chart-bar" style={{ height: '85%' }}></div>
            <div class="chart-bar" style={{ height: '95%' }}></div>
          </div>
        </div>

        <div class="metrics-list">
          <div>• 24 active sessions</div>
          <div>• 156 page views</div>
          <div>• 89% bounce rate</div>
        </div>
      </div>
    );
  }
}
