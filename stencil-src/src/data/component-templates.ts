/**
 * Component Templates
 * Defines the available component types and their default content
 */

export interface ComponentTemplate {
  icon: string;
  title: string;
  content: string;
  complex?: boolean;
}

export const componentTemplates: Record<string, ComponentTemplate> = {
  header: {
    icon: '📄',
    title: 'Header',
    content: 'This is a header component',
  },
  text: {
    icon: '📝',
    title: 'Text Block',
    content: 'This is a text block component',
  },
  image: {
    icon: '🖼️',
    title: 'Image',
    content:
      '<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%; overflow: hidden; border-radius: 4px; background: #f0f0f0;"><img src="https://picsum.photos/800/600?random=' +
      Math.random() +
      '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" alt="Sample image"></div>',
  },
  button: {
    icon: '🔘',
    title: 'Button',
    content: 'Click me!',
  },
  video: {
    icon: '🎥',
    title: 'Video',
    content:
      '<div class="video-placeholder" style="width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(\'https://picsum.photos/400/300?random=' +
      Math.random() +
      '\') center/cover; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="this.outerHTML = \'<video controls autoplay style=\\\'width: 100%; height: 100%; object-fit: cover; border-radius: 4px;\\\'><source src=\\\'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4\\\' type=\\\'video/mp4\\\'>Your browser does not support the video tag.</video>\';" ><div style="width: 80px; height: 80px; background: rgba(255,255,255,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><svg width="32" height="32" viewBox="0 0 24 24" fill="#4A90E2"><path d="M8 5v14l11-7z"/></svg></div></div>',
  },
  gallery: {
    icon: '🖼️',
    title: 'Image Gallery',
    content: 'Loading images...',
    complex: true,
  },
  dashboard: {
    icon: '📊',
    title: 'Dashboard Widget',
    content: 'Dashboard data',
    complex: true,
  },
  livedata: {
    icon: '📡',
    title: 'Live Data',
    content: 'Connecting...',
    complex: true,
  },
};
