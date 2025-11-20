import { html } from 'lit-html';
import { h } from '@stencil/core';

export default {
  title: 'Components/Grid Builder',
};

// Simple component definitions using Stencil's h() function
// This demonstrates the recommended approach for Stencil applications
const simpleComponents = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 20, height: 3 },
    // Render function using Stencil's h() - typical usage pattern
    render: ({ config }) =>
      h(
        'div',
        { style: { padding: '20px', background: '#f0f0f0', borderRadius: '4px', height: '100%' } },
        h('h2', { style: { margin: '0' } }, config?.title || 'Header Component'),
      ),
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    // Using h() to create virtual DOM nodes
    render: ({ config }) =>
      h(
        'div',
        { style: { padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', height: '100%' } },
        h('p', { style: { margin: '0' } }, config?.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
      ),
  },
  {
    type: 'button',
    name: 'Button',
    icon: '🔘',
    defaultSize: { width: 15, height: 5 },
    minSize: { width: 10, height: 3 },
    // h() works for any HTML element
    render: ({ config }) =>
      h(
        'button',
        {
          style: {
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            width: '100%',
            height: '100%',
          },
        },
        config?.label || 'Click Me',
      ),
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
