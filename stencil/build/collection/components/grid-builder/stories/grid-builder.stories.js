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

export const ResponsiveViewportDemo = () => {
  // Create builders at different container widths to show viewport switching
  const createBuilder = (width) => {
    const builderEl = document.createElement('grid-builder');
    builderEl.components = simpleComponents;
    builderEl.initialState = {
      canvases: {
        'canvas-1': {
          items: [
            {
              id: `item-header-${width}`,
              type: 'header',
              name: 'Header',
              canvasId: 'canvas-1',
              layouts: {
                desktop: { x: 0, y: 0, width: 30, height: 4 },
                mobile: { x: null, y: null, width: null, height: null, customized: false },
              },
              config: { title: `Container: ${width}px` },
              zIndex: 1,
            },
            {
              id: `item-text-${width}`,
              type: 'text',
              name: 'Text Block',
              canvasId: 'canvas-1',
              layouts: {
                desktop: { x: 0, y: 5, width: 20, height: 6 },
                mobile: { x: null, y: null, width: null, height: null, customized: false },
              },
              config: { text: width < 768 ? 'Mobile viewport (< 768px)' : 'Desktop viewport (≥ 768px)' },
              zIndex: 2,
            },
            {
              id: `item-btn-${width}`,
              type: 'button',
              name: 'Button',
              canvasId: 'canvas-1',
              layouts: {
                desktop: { x: 21, y: 5, width: 12, height: 4 },
                mobile: { x: null, y: null, width: null, height: null, customized: false },
              },
              config: { label: 'Action' },
              zIndex: 3,
            },
          ],
          zIndexCounter: 4,
        },
      },
    };
    return builderEl;
  };

  return html`
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
      <h2 style="margin-top: 0; color: #333;">Container-Based Responsive Viewport Demo</h2>
      <p style="color: #666; margin-bottom: 30px;">
        The grid-builder automatically switches between desktop and mobile viewports based on <strong>container width</strong> (not window width).
        <br />
        <strong>Breakpoint: 768px</strong> — Check the browser console for viewport switch messages!
      </p>

      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 40px;">
        <!-- Desktop viewport (900px) -->
        <div style="flex: 1; min-width: 400px;">
          <h3 style="margin: 0 0 10px 0; color: #28a745; font-size: 16px;">
            ✅ Desktop Viewport (900px container)
          </h3>
          <div style="width: 900px; height: 400px; border: 3px solid #28a745; border-radius: 8px; overflow: hidden;">
            ${createBuilder(900)}
          </div>
          <p style="margin-top: 8px; font-size: 13px; color: #666;">
            <strong>Expected:</strong> Side-by-side layout, desktop viewport active
          </p>
        </div>
      </div>

      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <!-- Mobile viewport (600px) -->
        <div style="flex: 1; min-width: 300px;">
          <h3 style="margin: 0 0 10px 0; color: #007bff; font-size: 16px;">
            📱 Mobile Viewport (600px container)
          </h3>
          <div style="width: 600px; height: 500px; border: 3px solid #007bff; border-radius: 8px; overflow: hidden;">
            ${createBuilder(600)}
          </div>
          <p style="margin-top: 8px; font-size: 13px; color: #666;">
            <strong>Expected:</strong> Stacked layout, mobile viewport active
          </p>
        </div>
      </div>

      <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
        <h4 style="margin-top: 0; color: #17a2b8;">💡 How to Test</h4>
        <ol style="margin-bottom: 0; padding-left: 20px;">
          <li>Open browser DevTools → Console tab</li>
          <li>Resize the Storybook canvas or your browser window</li>
          <li>Watch for console messages: <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">📱 Container-based viewport switch: ...</code></li>
          <li>Notice how components reflow when crossing the 768px threshold</li>
        </ol>
      </div>
    </div>
  `;
};
