import { html } from 'lit-html';
import { h } from '@stencil/core';
import { ComponentDefinition } from '../../../types/component-definition';

export default {
  title: 'Components/Grid Builder',
};

// Simple component definitions using JSX/TSX
// This demonstrates the recommended approach for Stencil applications
const simpleComponents: ComponentDefinition[] = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 20, height: 3 },
    // Render function using JSX - typical Stencil pattern
    render: ({ config }) => (
      <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '4px', height: '100%' }}>
        <h2 style={{ margin: '0' }}>{config?.title || 'Header Component'}</h2>
      </div>
    ),
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    // JSX syntax is clean and readable
    render: ({ config }) => (
      <div style={{ padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', height: '100%' }}>
        <p style={{ margin: '0' }}>{config?.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}</p>
      </div>
    ),
  },
  {
    type: 'button',
    name: 'Button',
    icon: '🔘',
    defaultSize: { width: 15, height: 5 },
    minSize: { width: 10, height: 3 },
    // JSX works for any HTML element
    render: ({ config }) => (
      <button
        style={{
          padding: '12px 24px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
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
              desktop: { x: 0, y: 0, width: 50, height: 6 },
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
              desktop: { x: 0, y: 7, width: 25, height: 10 },
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
              desktop: { x: 26, y: 7, width: 15, height: 5 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: { label: 'Get Started' },
            zIndex: 3,
          },
        ],
        zIndexCounter: 4,
      },
    },
  } as any; // Type assertion for initial state partial

  return html`
    <div style="width: 100%; height: 600px;">
      ${builderEl}
    </div>
  `;
};
