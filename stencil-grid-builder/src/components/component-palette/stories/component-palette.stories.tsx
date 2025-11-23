import { html } from 'lit-html';
import { h } from '@stencil/core';

export default {
  title: 'Components/Component Palette',
};

// Sample component definitions for the story
// Using JSX for component rendering - matches grid-builder pattern
const sampleComponents = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 20, height: 3 },
    render: () => (
      <div style={{ padding: '12px', background: '#f0f0f0', borderRadius: '4px', height: '100%' }}>
        <h3 style={{ margin: '0', fontSize: '16px' }}>Header Component</h3>
      </div>
    ),
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    render: () => (
      <div style={{ padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', height: '100%' }}>
        <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.4' }}>Text Component</p>
      </div>
    ),
  },
  {
    type: 'button',
    name: 'Button',
    icon: '🔘',
    defaultSize: { width: 15, height: 5 },
    minSize: { width: 10, height: 3 },
    render: () => (
      <button style={{
        padding: '8px 16px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        width: '100%',
        height: '100%',
      }}>
        Button Component
      </button>
    ),
  },
];

export const BasicPalette = () => {
  // Create element and set props
  const paletteEl = document.createElement('component-palette');
  paletteEl.components = sampleComponents;

  return html`
    <div style="padding: 20px; height: 500px;">
      ${paletteEl}
    </div>
  `;
};

export const WithCustomComponents = () => {
  const customComponents = [
    {
      type: 'hero',
      name: 'Hero Section',
      icon: '🦸',
      defaultSize: { width: 50, height: 15 },
      render: () => '<div>Hero Section</div>',
    },
    {
      type: 'feature',
      name: 'Feature Card',
      icon: '✨',
      defaultSize: { width: 20, height: 12 },
      render: () => '<div>Feature Card</div>',
    },
    {
      type: 'footer',
      name: 'Footer',
      icon: '⬇️',
      defaultSize: { width: 50, height: 8 },
      render: () => '<div>Footer</div>',
    },
  ];

  const paletteEl = document.createElement('component-palette');
  paletteEl.components = customComponents;

  return html`
    <div style="padding: 20px; height: 500px;">
      ${paletteEl}
    </div>
  `;
};
