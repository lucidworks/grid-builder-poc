import { html } from 'lit-html';

export default {
  title: 'Components/Component Palette',
};

// Sample component definitions for the story
const sampleComponents = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 20, height: 3 },
    render: () => '<div>Header Component</div>',
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    render: () => '<div>Text Component</div>',
  },
  {
    type: 'button',
    name: 'Button',
    icon: '🔘',
    defaultSize: { width: 15, height: 5 },
    minSize: { width: 10, height: 3 },
    render: () => '<div>Button Component</div>',
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
