import { html } from 'lit-html';
import { h } from '@stencil/core';

export default {
  title: 'Components/Grid Builder',
};

// Simple component definitions using JSX
// This demonstrates the recommended approach for Stencil applications
// Sizes are optimized for Storybook's smaller viewport
const simpleComponents = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 30, height: 4 },
    minSize: { width: 15, height: 3 },
    // Render function using JSX - typical Stencil pattern
    render: ({ config }) => (
      <div style={{ padding: '12px', background: '#f0f0f0', borderRadius: '4px', height: '100%' }}>
        <h3 style={{ margin: '0', fontSize: '16px' }}>{config?.title || 'Header'}</h3>
      </div>
    ),
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 20, height: 6 },
    minSize: { width: 10, height: 4 },
    // JSX syntax is clean and readable
    render: ({ config }) => (
      <div style={{ padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', height: '100%' }}>
        <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.4' }}>{config?.text || 'Sample text content.'}</p>
      </div>
    ),
  },
  {
    type: 'button',
    name: 'Button',
    icon: '🔘',
    defaultSize: { width: 12, height: 4 },
    minSize: { width: 8, height: 3 },
    // JSX works for any HTML element
    render: ({ config }) => (
      <button
        style={{
          padding: '8px 16px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          width: '100%',
          height: '100%',
        }}
      >
        {config?.label || 'Click Me'}
      </button>
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
        items: [
          {
            id: 'item-1',
            type: 'header',
            name: 'Header',
            canvasId: 'canvas-1',
            layouts: {
              desktop: { x: 0, y: 0, width: 30, height: 4 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: { title: 'Welcome!' },
            zIndex: 1,
          },
          {
            id: 'item-2',
            type: 'text',
            name: 'Text Block',
            canvasId: 'canvas-1',
            layouts: {
              desktop: { x: 0, y: 5, width: 20, height: 6 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: { text: 'This is a pre-populated text block.' },
            zIndex: 2,
          },
          {
            id: 'item-3',
            type: 'button',
            name: 'Button',
            canvasId: 'canvas-1',
            layouts: {
              desktop: { x: 21, y: 5, width: 12, height: 4 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: { label: 'Get Started' },
            zIndex: 3,
          },
        ],
        zIndexCounter: 4,
      },
    },
  };

  return html`
    <div style="width: 100%; height: 600px;">
      ${builderEl}
    </div>
  `;
};
