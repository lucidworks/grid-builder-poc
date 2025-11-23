import { Component, h } from '@stencil/core';

@Component({
  tag: 'live-data-drag-clone',
  styleUrl: 'live-data-drag-clone.scss',
  shadow: false,
})
export class LiveDataDragClone {
  render() {
    return (
      <div class="livedata-preview">
        <span>Live Data</span>
      </div>
    );
  }
}
