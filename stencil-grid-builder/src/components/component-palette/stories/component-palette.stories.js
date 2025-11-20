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
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.height = '500px';

  const palette = document.createElement('component-palette');
  palette.components = sampleComponents;

  container.appendChild(palette);
  return container;
};

export const WithCustomComponents = () => {
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.height = '500px';

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

  const palette = document.createElement('component-palette');
  palette.components = customComponents;

  container.appendChild(palette);
  return container;
};
