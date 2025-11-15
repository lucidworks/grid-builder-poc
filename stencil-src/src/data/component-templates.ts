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
    content: '<div class="video-placeholder">Video Placeholder</div>',
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
