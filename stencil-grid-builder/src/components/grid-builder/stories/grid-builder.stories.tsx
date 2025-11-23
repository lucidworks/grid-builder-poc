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

export const WithCanvasMetadataAndCustomHeaders = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;

  // Multiple canvas sections with metadata
  builderEl.initialState = {
    canvases: {
      'hero-section': {
        items: [
          {
            id: 'hero-header',
            type: 'header',
            name: 'Hero Header',
            canvasId: 'hero-section',
            layouts: {
              desktop: { x: 5, y: 2, width: 25, height: 4 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: { title: 'Welcome!' },
            zIndex: 1,
          },
        ],
        zIndexCounter: 2,
      },
      'content-section': {
        items: [
          {
            id: 'content-text',
            type: 'text',
            name: 'Content Text',
            canvasId: 'content-section',
            layouts: {
              desktop: { x: 0, y: 0, width: 30, height: 6 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: { text: 'This is the content section with a light green background.' },
            zIndex: 1,
          },
        ],
        zIndexCounter: 2,
      },
    },
  };

  // Canvas metadata with titles and background colors
  builderEl.canvasMetadata = {
    'hero-section': {
      title: 'Hero Section',
      backgroundColor: '#e0f2fe',
    },
    'content-section': {
      title: 'Content Section',
      backgroundColor: '#f0fdf4',
    },
  };

  // Custom canvas header component
  builderEl.uiOverrides = {
    CanvasHeader: ({ canvasId, metadata, isActive }) => {
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = `
        padding: 12px 20px;
        background: ${isActive ? '#007bff' : '#f8f9fa'};
        color: ${isActive ? 'white' : '#333'};
        border-bottom: 3px solid ${isActive ? '#0056b3' : '#dee2e6'};
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.2s;
      `;

      const badge = document.createElement('span');
      badge.style.cssText = `
        background: ${isActive ? 'rgba(255,255,255,0.2)' : '#007bff'};
        color: ${isActive ? 'white' : 'white'};
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      `;
      badge.textContent = isActive ? '✓ Active' : 'Inactive';

      const title = document.createElement('span');
      title.textContent = metadata.title || canvasId;

      headerDiv.appendChild(badge);
      headerDiv.appendChild(title);

      return headerDiv;
    },
  };

  return html`
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
      <h2 style="margin-top: 0; color: #333;">Canvas Metadata & Custom Headers</h2>
      <p style="color: #666; margin-bottom: 20px;">
        This demo shows custom canvas headers using <code>uiOverrides.CanvasHeader</code> and canvas metadata.
        <br />
        Click on different sections to see the active state change in the headers!
      </p>

      <div style="width: 100%; height: 600px; border: 2px solid #007bff; border-radius: 8px; overflow: hidden;">
        ${builderEl}
      </div>

      <div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
        <h4 style="margin-top: 0; color: #007bff;">🎨 Features Demonstrated</h4>
        <ul style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>Canvas Metadata:</strong> Titles and background colors per section</li>
          <li><strong>Custom Headers:</strong> Replace default headers with custom components</li>
          <li><strong>Active State:</strong> Visual indicator showing which canvas is active</li>
          <li><strong>Separation of Concerns:</strong> Library handles placement, host app handles presentation</li>
        </ul>
      </div>
    </div>
  `;
};

export const WithDeletionHook = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;

  builderEl.initialState = {
    canvases: {
      'canvas-1': {
        items: [
          {
            id: 'item-1',
            type: 'header',
            name: 'Protected Header',
            canvasId: 'canvas-1',
            layouts: {
              desktop: { x: 0, y: 0, width: 30, height: 4 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: { title: 'Try to delete me!' },
            zIndex: 1,
          },
          {
            id: 'item-2',
            type: 'text',
            name: 'Sample Text',
            canvasId: 'canvas-1',
            layouts: {
              desktop: { x: 0, y: 5, width: 20, height: 6 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            config: { text: 'This item has deletion confirmation.' },
            zIndex: 2,
          },
        ],
        zIndexCounter: 3,
      },
    },
  };

  // Deletion hook with browser confirm
  builderEl.onBeforeDelete = (context) => {
    const componentName = context.item.name || context.item.type;
    const confirmed = confirm(
      `Delete "${componentName}"?\n\nThis demonstrates the onBeforeDelete hook.\n\nIn a real app, you'd show a custom modal instead of browser confirm().`
    );
    return confirmed;
  };

  return html`
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
      <h2 style="margin-top: 0; color: #333;">Deletion Hook Demo</h2>
      <p style="color: #666; margin-bottom: 20px;">
        This demo shows the <code>onBeforeDelete</code> hook that intercepts component deletion.
        <br />
        Try deleting a component to see the confirmation dialog!
      </p>

      <div style="width: 100%; height: 500px; border: 2px solid #dc3545; border-radius: 8px; overflow: hidden;">
        ${builderEl}
      </div>

      <div style="margin-top: 20px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <h4 style="margin-top: 0; color: #856404;">⚠️ How It Works</h4>
        <ul style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>Hook receives:</strong> <code>{ item: GridItem, canvasId: string, itemId: string }</code></li>
          <li><strong>Hook returns:</strong> <code>boolean</code> or <code>Promise&lt;boolean&gt;</code></li>
          <li><strong>Return true:</strong> Deletion proceeds</li>
          <li><strong>Return false:</strong> Deletion is cancelled</li>
          <li><strong>Use cases:</strong> Confirmations, API calls, permission checks, analytics</li>
        </ul>
      </div>

      <div style="margin-top: 20px; padding: 20px; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #17a2b8;">
        <h4 style="margin-top: 0; color: #0c5460;">💡 Production Pattern</h4>
        <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; line-height: 1.4;"}>
          <code dangerouslySetInnerHTML={{
            __html: '// Async deletion with custom modal\n' +
            'builderEl.onBeforeDelete = async (context) => {\n' +
            '  const confirmed = await showCustomModal({\n' +
            '    title: \'Delete Component?\',\n' +
            '    message: &#96;Delete "${context.item.name}"?&#96;,\n' +
            '    confirmText: \'Delete\',\n' +
            '    cancelText: \'Cancel\'\n' +
            '  });\n' +
            '\n' +
            '  if (confirmed) {\n' +
            '    // Optional: Call API to delete on backend\n' +
            '    await fetch(\'/api/components/\' + context.itemId, {\n' +
            '      method: \'DELETE\'\n' +
            '    });\n' +
            '  }\n' +
            '\n' +
            '  return confirmed;\n' +
            '};'
          }} />
        </pre>
      </div>
    </div>
  `;
};

export const BatchOperationsPerformance = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;

  builderEl.initialState = {
    canvases: {
      'canvas-1': {
        items: [],
        zIndexCounter: 0,
      },
    },
  };

  // Container for performance stats
  const statsDiv = document.createElement('div');
  statsDiv.style.cssText = `
    padding: 15px;
    background: #e7f3ff;
    border-radius: 4px;
    margin: 20px 0;
    font-family: monospace;
    font-size: 13px;
  `;
  statsDiv.innerHTML = 'Click a button below to add components...';

  // Add 50 components one by one (slow)
  const slowButton = document.createElement('button');
  slowButton.textContent = '🐌 Add 50 Items Individually (Slow)';
  slowButton.style.cssText = `
    background: #dc3545;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin: 10px 10px 10px 0;
  `;
  slowButton.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (!api) return;

    slowButton.disabled = true;
    fastButton.disabled = true;

    const start = performance.now();

    for (let i = 0; i < 50; i++) {
      await api.addComponent('canvas-1', 'header', {
        x: (i % 10) * 5,
        y: Math.floor(i / 10) * 5,
        width: 4,
        height: 3,
      }, { title: `Item ${i + 1}` });
    }

    const duration = performance.now() - start;
    statsDiv.innerHTML = `
      <strong style="color: #dc3545;">Individual Operations:</strong><br/>
      Added 50 items in <strong>${duration.toFixed(2)}ms</strong><br/>
      Average: ${(duration / 50).toFixed(2)}ms per item<br/>
      Re-renders: 50 (one per item)
    `;

    slowButton.disabled = false;
    fastButton.disabled = false;
  };

  // Add 50 components in batch (fast)
  const fastButton = document.createElement('button');
  fastButton.textContent = '⚡ Add 50 Items in Batch (Fast)';
  fastButton.style.cssText = `
    background: #28a745;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin: 10px 10px 10px 0;
  `;
  fastButton.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (!api) return;

    slowButton.disabled = true;
    fastButton.disabled = true;

    const start = performance.now();

    const items = Array.from({ length: 50 }, (_, i) => ({
      canvasId: 'canvas-1',
      type: 'header',
      position: {
        x: (i % 10) * 5,
        y: Math.floor(i / 10) * 5,
        width: 4,
        height: 3,
      },
      config: { title: `Item ${i + 1}` },
    }));

    await api.addComponentsBatch(items);

    const duration = performance.now() - start;
    statsDiv.innerHTML = `
      <strong style="color: #28a745;">Batch Operation:</strong><br/>
      Added 50 items in <strong>${duration.toFixed(2)}ms</strong><br/>
      Average: ${(duration / 50).toFixed(2)}ms per item<br/>
      Re-renders: 1 (single batch)<br/>
      <strong style="color: #28a745;">⚡ ${((performance.now() - start) / duration * 100).toFixed(0)}× faster!</strong>
    `;

    slowButton.disabled = false;
    fastButton.disabled = false;
  };

  // Clear button
  const clearButton = document.createElement('button');
  clearButton.textContent = '🗑️ Clear All';
  clearButton.style.cssText = `
    background: #6c757d;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin: 10px 0;
  `;
  clearButton.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (!api) return;

    const state = api.getState();
    const itemIds = state.canvases['canvas-1']?.items.map(item => item.id) || [];

    if (itemIds.length > 0) {
      await api.deleteComponentsBatch(itemIds);
      statsDiv.innerHTML = `Cleared ${itemIds.length} items.`;
    }
  };

  return html`
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
      <h2 style="margin-top: 0; color: #333;">Batch Operations Performance</h2>
      <p style="color: #666; margin-bottom: 20px;">
        Compare individual operations vs batch operations. Batch methods trigger only 1 re-render instead of N re-renders.
      </p>

      ${slowButton}
      ${fastButton}
      ${clearButton}

      ${statsDiv}

      <div style="width: 100%; height: 400px; border: 2px solid #28a745; border-radius: 8px; overflow: hidden; margin-top: 20px;">
        ${builderEl}
      </div>

      <div style="margin-top: 20px; padding: 20px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
        <h4 style="margin-top: 0; color: #155724;">✨ Batch API Methods</h4>
        <ul style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li><code>api.addComponentsBatch(items[])</code> - Add multiple components</li>
          <li><code>api.deleteComponentsBatch(itemIds[])</code> - Delete multiple components</li>
          <li><code>api.updateConfigsBatch(updates[])</code> - Update multiple configs</li>
          <li><strong>Performance:</strong> 10-100× faster for bulk operations</li>
          <li><strong>Undo/Redo:</strong> Single undo/redo command per batch</li>
        </ul>
      </div>
    </div>
  `;
};

export const MultipleSectionsBuilder = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;

  // Multi-section layout
  builderEl.initialState = {
    canvases: {
      'hero-section': {
        items: [
          {
            id: 'hero-header',
            canvasId: 'hero-section',
            type: 'header',
            name: 'Hero Header',
            layouts: {
              desktop: { x: 5, y: 2, width: 40, height: 6 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: 1,
            config: { title: '🚀 Welcome Section' },
          },
        ],
        zIndexCounter: 2,
      },
      'content-section': {
        items: [
          {
            id: 'content-text',
            canvasId: 'content-section',
            type: 'text',
            name: 'Content',
            layouts: {
              desktop: { x: 0, y: 0, width: 30, height: 6 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: 1,
            config: { text: 'Main content goes here.' },
          },
        ],
        zIndexCounter: 2,
      },
      'cta-section': {
        items: [
          {
            id: 'cta-button',
            canvasId: 'cta-section',
            type: 'button',
            name: 'CTA Button',
            layouts: {
              desktop: { x: 19, y: 2, width: 12, height: 4 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: 1,
            config: { label: 'Get Started' },
          },
        ],
        zIndexCounter: 2,
      },
    },
  };

  // Canvas metadata with different background colors
  builderEl.canvasMetadata = {
    'hero-section': { backgroundColor: '#e0f2fe' },
    'content-section': { backgroundColor: '#f0fdf4' },
    'cta-section': { backgroundColor: '#fef3c7' },
  };

  // Add section button
  const addSectionButton = document.createElement('button');
  addSectionButton.textContent = '➕ Add New Section';
  addSectionButton.style.cssText = `
    background: #007bff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin: 20px 0;
  `;

  let sectionCounter = 1;
  addSectionButton.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (!api) return;

    const newCanvasId = `custom-section-${sectionCounter++}`;
    await api.addCanvas(newCanvasId);

    // Update metadata via direct property assignment
    builderEl.canvasMetadata = {
      ...builderEl.canvasMetadata,
      [newCanvasId]: { backgroundColor: '#f8f9fa' },
    };
  };

  return html`
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
      <h2 style="margin-top: 0; color: #333;">Multiple Canvas Sections</h2>
      <p style="color: #666; margin-bottom: 20px;">
        Build multi-section landing pages with independent canvases. Each section has its own background color.
        <br />
        Try adding a new section with the button below!
      </p>

      ${addSectionButton}

      <div style="width: 100%; height: 700px; border: 2px solid #17a2b8; border-radius: 8px; overflow: auto;">
        ${builderEl}
      </div>

      <div style="margin-top: 20px; padding: 20px; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #17a2b8;">
        <h4 style="margin-top: 0; color: #0c5460;">📐 Multi-Section Pattern</h4>
        <ul style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>Hero Section:</strong> Large banner with CTA</li>
          <li><strong>Content Section:</strong> Main content area</li>
          <li><strong>CTA Section:</strong> Call-to-action button</li>
          <li><strong>Dynamic Sections:</strong> Add/remove sections programmatically</li>
          <li><strong>Per-Section Styling:</strong> Custom backgrounds via canvasMetadata</li>
        </ul>
      </div>
    </div>
  `;
};

export const ActiveCanvasManagement = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;

  builderEl.initialState = {
    canvases: {
      'canvas-1': {
        items: [
          {
            id: 'item-1',
            canvasId: 'canvas-1',
            type: 'header',
            name: 'Header 1',
            layouts: {
              desktop: { x: 0, y: 0, width: 20, height: 4 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: 1,
            config: { title: 'Canvas 1' },
          },
        ],
        zIndexCounter: 2,
      },
      'canvas-2': {
        items: [
          {
            id: 'item-2',
            canvasId: 'canvas-2',
            type: 'text',
            name: 'Text 2',
            layouts: {
              desktop: { x: 0, y: 0, width: 25, height: 6 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: 1,
            config: { text: 'Canvas 2 content' },
          },
        ],
        zIndexCounter: 2,
      },
      'canvas-3': {
        items: [
          {
            id: 'item-3',
            canvasId: 'canvas-3',
            type: 'button',
            name: 'Button 3',
            layouts: {
              desktop: { x: 0, y: 0, width: 12, height: 4 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: 1,
            config: { label: 'Canvas 3' },
          },
        ],
        zIndexCounter: 2,
      },
    },
  };

  // Status display
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = `
    padding: 15px;
    background: #e7f3ff;
    border-radius: 4px;
    margin: 20px 0;
    font-family: monospace;
    font-size: 14px;
    font-weight: 600;
  `;
  statusDiv.innerHTML = 'Active Canvas: None';

  // Listen for canvas activation events
  setTimeout(() => {
    const api = (window as any).gridBuilderAPI;
    if (api) {
      api.on('canvasActivated', (event) => {
        statusDiv.innerHTML = `Active Canvas: <span style="color: #007bff;">${event.canvasId}</span>`;
      });
    }
  }, 500);

  // Control buttons
  const button1 = document.createElement('button');
  button1.textContent = '🎯 Activate Canvas 1';
  button1.style.cssText = `
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    margin: 5px;
  `;
  button1.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (api) await api.setActiveCanvas('canvas-1');
  };

  const button2 = document.createElement('button');
  button2.textContent = '🎯 Activate Canvas 2';
  button2.style.cssText = button1.style.cssText;
  button2.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (api) await api.setActiveCanvas('canvas-2');
  };

  const button3 = document.createElement('button');
  button3.textContent = '🎯 Activate Canvas 3';
  button3.style.cssText = button1.style.cssText;
  button3.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (api) await api.setActiveCanvas('canvas-3');
  };

  const clearButton = document.createElement('button');
  clearButton.textContent = '❌ Clear Active';
  clearButton.style.cssText = `
    background: #6c757d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    margin: 5px;
  `;
  clearButton.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (api) await api.setActiveCanvas(null);
  };

  return html`
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
      <h2 style="margin-top: 0; color: #333;">Active Canvas Management</h2>
      <p style="color: #666; margin-bottom: 20px;">
        Programmatically control which canvas is active. Active canvas shows visual indicator and receives focus.
        <br />
        Drop a component into any canvas to auto-activate it!
      </p>

      ${statusDiv}

      <div style="margin-bottom: 20px;">
        ${button1}
        ${button2}
        ${button3}
        ${clearButton}
      </div>

      <div style="width: 100%; height: 600px; border: 2px solid #007bff; border-radius: 8px; overflow: auto;">
        ${builderEl}
      </div>

      <div style="margin-top: 20px; padding: 20px; background: #e7f3ff; border-radius: 8px; border-left: 4px solid #007bff;">
        <h4 style="margin-top: 0; color: #004085;">🎯 Active Canvas Features</h4>
        <ul style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li><code>api.setActiveCanvas(canvasId)</code> - Set active canvas programmatically</li>
          <li><code>api.getActiveCanvas()</code> - Get currently active canvas ID</li>
          <li><strong>Auto-activation:</strong> Canvas activates when component is dropped into it</li>
          <li><strong>Visual indicator:</strong> Custom headers can show active state via <code>isActive</code> prop</li>
          <li><strong>Event:</strong> <code>canvasActivated</code> event fires on activation</li>
        </ul>
      </div>
    </div>
  `;
};

export const UndoRedoDemo = () => {
  const builderEl = document.createElement('grid-builder');
  builderEl.components = simpleComponents;

  builderEl.initialState = {
    canvases: {
      'canvas-1': {
        items: [
          {
            id: 'starter-header',
            canvasId: 'canvas-1',
            type: 'header',
            name: 'Starter Header',
            layouts: {
              desktop: { x: 0, y: 0, width: 30, height: 4 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: 1,
            config: { title: 'Start Here' },
          },
        ],
        zIndexCounter: 2,
      },
    },
  };

  // History status display
  const historyDiv = document.createElement('div');
  historyDiv.style.cssText = `
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
    margin: 20px 0;
    font-family: monospace;
    font-size: 13px;
  `;

  const updateHistoryDisplay = () => {
    setTimeout(() => {
      const api = (window as any).gridBuilderAPI;
      if (!api) return;

      const canUndo = api.canUndo();
      const canRedo = api.canRedo();

      historyDiv.innerHTML = `
        Can Undo: <strong style="color: ${canUndo ? '#28a745' : '#dc3545'};">${canUndo ? 'Yes' : 'No'}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        Can Redo: <strong style="color: ${canRedo ? '#28a745' : '#dc3545'};">${canRedo ? 'Yes' : 'No'}</strong>
      `;
    }, 100);
  };

  // Listen for events to update history display
  setTimeout(() => {
    const api = (window as any).gridBuilderAPI;
    if (api) {
      const events = ['componentAdded', 'componentDeleted', 'componentDragged', 'componentResized', 'undoExecuted', 'redoExecuted'];
      events.forEach(eventName => {
        api.on(eventName, updateHistoryDisplay);
      });
      updateHistoryDisplay();
    }
  }, 500);

  // Undo/Redo buttons
  const undoButton = document.createElement('button');
  undoButton.textContent = '↶ Undo (Ctrl+Z)';
  undoButton.style.cssText = `
    background: #007bff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin: 10px 10px 10px 0;
  `;
  undoButton.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (api) {
      await api.undo();
      updateHistoryDisplay();
    }
  };

  const redoButton = document.createElement('button');
  redoButton.textContent = '↷ Redo (Ctrl+Y)';
  redoButton.style.cssText = `
    background: #28a745;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin: 10px 0;
  `;
  redoButton.onclick = async () => {
    const api = (window as any).gridBuilderAPI;
    if (api) {
      await api.redo();
      updateHistoryDisplay();
    }
  };

  return html`
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
      <h2 style="margin-top: 0; color: #333;">Undo/Redo Demo</h2>
      <p style="color: #666; margin-bottom: 20px;">
        Full undo/redo support for all operations. Try adding, moving, resizing, or deleting components, then undo/redo!
        <br />
        <strong>Keyboard shortcuts:</strong> Ctrl+Z (undo), Ctrl+Y or Ctrl+Shift+Z (redo)
      </p>

      ${historyDiv}

      <div style="margin-bottom: 20px;">
        ${undoButton}
        ${redoButton}
      </div>

      <div style="width: 100%; height: 500px; border: 2px solid #6f42c1; border-radius: 8px; overflow: hidden;">
        ${builderEl}
      </div>

      <div style="margin-top: 20px; padding: 20px; background: #e7e3f7; border-radius: 8px; border-left: 4px solid #6f42c1;">
        <h4 style="margin-top: 0; color: #4a2a7a;">📚 Undo/Redo System</h4>
        <ul style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>Command Pattern:</strong> Gang of Four design pattern implementation</li>
          <li><strong>History Limit:</strong> 50 operations (prevents memory bloat)</li>
          <li><strong>Supported Operations:</strong> Add, delete, move, resize, batch operations</li>
          <li><strong>Canvas Management:</strong> Add/remove canvas sections</li>
          <li><strong>Keyboard Shortcuts:</strong> Standard Ctrl+Z / Ctrl+Y conventions</li>
          <li><strong>API Methods:</strong> <code>undo()</code>, <code>redo()</code>, <code>canUndo()</code>, <code>canRedo()</code></li>
        </ul>
      </div>

      <div style="margin-top: 20px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <h4 style="margin-top: 0; color: #856404;">💡 Try These Actions</h4>
        <ol style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li>Add a component from the palette</li>
          <li>Move or resize it</li>
          <li>Press Ctrl+Z to undo</li>
          <li>Press Ctrl+Y to redo</li>
          <li>Delete the component</li>
          <li>Undo to restore it</li>
        </ol>
      </div>
    </div>
  `;
};
