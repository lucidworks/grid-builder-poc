import { h } from '@stencil/core';
import { ComponentDefinition } from '../types/component-definition';

export const blogComponentDefinitions: ComponentDefinition[] = [
  {
    type: 'blog-header',
    name: 'Blog Header',
    icon: '📰',
    defaultSize: { width: 50, height: 5 },
    minSize: { width: 20, height: 3 },
    maxSize: { width: 50, height: 10 }, // Full width, max 10 units tall
    selectionColor: '#3b82f6', // Blue for headers
    render: ({ config }) => (
      <blog-header
        headerTitle={config?.title || 'Default Header'}
        subtitle={config?.subtitle}
      />
    ),
  },
  {
    type: 'blog-article',
    name: 'Blog Article',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    selectionColor: '#10b981', // Green for articles
    // No minSize/maxSize - uses defaults (100px min width, 80px min height, no maximum)
    render: ({ config }) => (
      <blog-article
        content={config?.content || 'Article content goes here'}
        author={config?.author}
        date={config?.date}
      />
    ),
  },
  {
    type: 'blog-button',
    name: 'Blog Button',
    icon: '🔘',
    defaultSize: { width: 20, height: 3 },
    minSize: { width: 10, height: 2 },
    maxSize: { width: 30, height: 5 }, // Max 60% width, 5 units tall
    selectionColor: '#ef4444', // Red for buttons
    // Custom palette item with enhanced layout
    renderPaletteItem: ({ componentType, name, icon }) =>
      `<custom-palette-item
        component-type="${componentType}"
        name="${name}"
        icon="${icon}">
      </custom-palette-item>`,
    // Custom drag clone with button appearance
    renderDragClone: ({ componentType, name, icon, width, height }) =>
      `<custom-drag-clone
        component-type="${componentType}"
        name="${name}"
        icon="${icon}"
        width="${width}"
        height="${height}">
      </custom-drag-clone>`,
    render: ({ config }) => (
      <blog-button
        label={config?.label || 'Click me!'}
        variant={config?.variant || 'primary'}
        href={config?.href}
      />
    ),
  },
];
