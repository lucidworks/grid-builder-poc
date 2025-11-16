import { Component, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'component-video',
  styleUrl: 'component-video.scss',
  shadow: false,
})
export class ComponentVideo {
  @Prop() itemId!: string;
  @State() showVideo: boolean = false;

  private thumbnailUrl = `https://picsum.photos/400/300?random=${Math.random()}`;

  private handlePlayClick = () => {
    this.showVideo = true;
  };

  render() {
    if (this.showVideo) {
      return (
        <div class="component-video-content">
          <video controls autoplay>
            <source
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return (
      <div class="component-video-content">
        <div
          class="video-placeholder"
          style={{ backgroundImage: `url(${this.thumbnailUrl})` }}
          onClick={this.handlePlayClick}
        >
          <div class="play-button">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#4A90E2">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
}
