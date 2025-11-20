import { html } from 'lit-html';

export default {
  title: 'Components/Grid Builder',
};

// Simple component definitions for the story
const simpleComponents = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 20, height: 3 },
    render: ({ config }) => {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 20px; background: #f0f0f0; border-radius: 4px; height: 100%;';
      const heading = document.createElement('h2');
      heading.style.margin = '0';
      heading.textContent = config?.title || 'Header Component';
      container.appendChild(heading);
      return container;
    },
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    render: ({ config }) => {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 4px; height: 100%;';
      const paragraph = document.createElement('p');
      paragraph.style.margin = '0';
      paragraph.textContent = config?.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      container.appendChild(paragraph);
      return container;
    },
  },
  {
    type: 'button',
    name: 'Button',
    icon: '🔘',
    defaultSize: { width: 15, height: 5 },
    minSize: { width: 10, height: 3 },
    render: ({ config }) => {
      const button = document.createElement('button');
      button.style.cssText = `
        padding: 12px 24px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        width: 100%;
        height: 100%;
      `;
      button.textContent = config?.label || 'Click Me';
      return button;
    },
  },
];

export const BasicBuilder = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;

  return html`
    <div style="width: 100%; height: 600px;">
      ${builderEl}
    </div>
  `;
};

export const WithCustomTheme = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;
  builderEl.theme = {
    primaryColor: '#ff6b6b',
    paletteBackground: '#fff5f5',
    selectionColor: '#ff6b6b',
  };

  return html`
    <div style="width: 100%; height: 600px;">
      ${builderEl}
    </div>
  `;
};

export const WithCustomGridConfig = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;
  builderEl.config = {
    gridSizePercent: 3, // 3% grid (33 units per 100%)
    minGridSize: 15,
    maxGridSize: 60,
    snapToGrid: true,
    showGridLines: true,
  };

  return html`
    <div style="width: 100%; height: 600px;">
      ${builderEl}
    </div>
  `;
};

export const WithInitialState = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;
  builderEl.initialState = {
    canvases: {
      'canvas-1': {
        id: 'canvas-1',
        name: 'Main Canvas',
        items: {
          'item-1': {
            id: 'item-1',
            type: 'header',
            position: { x: 0, y: 0 },
            size: { width: 50, height: 6 },
            config: { title: 'Welcome!' },
          },
          'item-2': {
            id: 'item-2',
            type: 'text',
            position: { x: 0, y: 7 },
            size: { width: 25, height: 10 },
            config: { text: 'This is a pre-populated text block.' },
          },
          'item-3': {
            id: 'item-3',
            type: 'button',
            position: { x: 26, y: 7 },
            size: { width: 15, height: 5 },
            config: { label: 'Get Started' },
          },
        },
      },
    },
    activeCanvasId: 'canvas-1',
  };

  return html`
    <div style="width: 100%; height: 600px;">
      ${builderEl}
    </div>
  `;
};
