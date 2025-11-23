import { Component, h } from '@stencil/core';

@Component({
  tag: 'dashboard-widget-drag-clone',
  styleUrl: 'dashboard-widget-drag-clone.scss',
  shadow: false,
})
export class DashboardWidgetDragClone {
  render() {
    return (
      <div class="dashboard-preview">
        <span>Dashboard</span>
      </div>
    );
  }
}
