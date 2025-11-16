import { r as registerInstance, h } from './index-ebe9feb4.js';

const componentVideoCss = ".component-video-content{width:100%;height:100%;border-radius:4px;overflow:hidden}.component-video-content video{width:100%;height:100%;object-fit:cover;border-radius:4px}.video-placeholder{width:100%;height:100%;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}.video-placeholder::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3))}.play-button{width:80px;height:80px;background:rgba(255, 255, 255, 0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0, 0, 0, 0.3);z-index:1;transition:transform 0.2s}.play-button:hover{transform:scale(1.1)}";

const ComponentVideo = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.thumbnailUrl = `https://picsum.photos/400/300?random=${Math.random()}`;
        this.handlePlayClick = () => {
            this.showVideo = true;
        };
        this.itemId = undefined;
        this.showVideo = false;
    }
    render() {
        if (this.showVideo) {
            return (h("div", { class: "component-video-content" }, h("video", { controls: true, autoplay: true }, h("source", { src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", type: "video/mp4" }), "Your browser does not support the video tag.")));
        }
        return (h("div", { class: "component-video-content" }, h("div", { class: "video-placeholder", style: { backgroundImage: `url(${this.thumbnailUrl})` }, onClick: this.handlePlayClick }, h("div", { class: "play-button" }, h("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "#4A90E2" }, h("path", { d: "M8 5v14l11-7z" }))))));
    }
};
ComponentVideo.style = componentVideoCss;

export { ComponentVideo as component_video };

//# sourceMappingURL=component-video.entry.js.map