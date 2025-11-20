/**
 * Grid Builder POC - GrapesJS Variant
 * =====================================
 *
 * This variant uses GrapesJS for visual layout editing while maintaining
 * compatibility with the app-studio-api render endpoint format.
 *
 * Key Features:
 * - Visual drag-and-drop editor (no HTML editing)
 * - Custom components for app-studio-api (SearchBox, ResultsList, Facets, QAPair)
 * - Export to app-studio-api template format
 * - Coordinate-based positioning
 */

// ============================================================================
// GrapesJS Editor Initialization
// ============================================================================

let editor;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing GrapesJS variant...');

  // Initialize GrapesJS Editor
  editor = grapesjs.init({
    container: '#gjs',
    height: '100%',
    width: 'auto',

    // Storage configuration
    storageManager: {
      type: 'local',
      autosave: true,
      autoload: true,
      stepsBeforeSave: 1,
    },

    // Panels configuration (hide HTML/CSS editors)
    panels: {
      defaults: [
        {
          id: 'basic-actions',
          el: '.panel__basic-actions',
          buttons: [
            {
              id: 'visibility',
              active: true,
              className: 'btn-toggle-borders',
              label: '<i class="fa fa-clone"></i>',
              command: 'sw-visibility',
            },
          ],
        },
        {
          id: 'panel-devices',
          el: '.panel__devices',
          buttons: [
            {
              id: 'device-desktop',
              label: '🖥️',
              command: 'set-device-desktop',
              active: true,
              togglable: false,
            },
            {
              id: 'device-mobile',
              label: '📱',
              command: 'set-device-mobile',
              togglable: false,
            },
          ],
        },
      ],
    },

    // Layers configuration
    layerManager: {
      appendTo: '.layers-container',
    },

    // Block Manager configuration
    blockManager: {
      appendTo: '#blocks',
      blocks: [],
    },

    // Device Manager configuration
    deviceManager: {
      devices: [
        {
          name: 'Desktop',
          width: '',
        },
        {
          name: 'Mobile',
          width: '480px',
          widthMedia: '480px',
        },
      ],
    },

    // Style Manager configuration (limited)
    styleManager: {
      appendTo: '.styles-container',
      sectors: [
        {
          name: 'Dimension',
          open: true,
          buildProps: ['width', 'height', 'min-height', 'padding', 'margin'],
        },
        {
          name: 'Typography',
          open: false,
          buildProps: ['font-family', 'font-size', 'font-weight', 'color'],
        },
      ],
    },

    // Canvas configuration
    canvas: {
      styles: [],
      scripts: [],
    },

    // Plugin configuration
    plugins: [],
    pluginsOpts: {},
  });

  // Add custom components
  addCustomComponents();

  // Add custom blocks
  addCustomBlocks();

  // Setup event handlers
  setupEventHandlers();

  console.log('GrapesJS variant ready!');
});

// ============================================================================
// Custom Components for App-Studio-API
// ============================================================================

function addCustomComponents() {
  const domc = editor.DomComponents;

  // SearchBox Component
  domc.addType('search-box', {
    model: {
      defaults: {
        tagName: 'div',
        attributes: { class: 'app-studio-search-box' },
        components: [
          {
            type: 'text',
            content: '🔍 Search Box',
            attributes: { class: 'component-label' },
          },
          {
            type: 'text',
            content: 'Search input component',
            attributes: { class: 'component-description' },
          },
        ],
        styles: `
          .app-studio-search-box {
            padding: 20px;
            background: white;
            border: 2px dashed #4A90E2;
            border-radius: 4px;
            min-height: 80px;
          }
        `,
        traits: [
          {
            type: 'text',
            name: 'query-prefix',
            label: 'Query Prefix',
            placeholder: 'e.g., main-search',
          },
          {
            type: 'text',
            name: 'placeholder',
            label: 'Placeholder',
            placeholder: 'Search...',
          },
        ],
        'custom-name': 'SearchBox',
        droppable: false,
      },
    },
  });

  // ResultsList Component
  domc.addType('results-list', {
    model: {
      defaults: {
        tagName: 'div',
        attributes: { class: 'app-studio-results-list' },
        components: [
          {
            type: 'text',
            content: '📋 Results List',
            attributes: { class: 'component-label' },
          },
          {
            type: 'text',
            content: 'Search results display with card mappings',
            attributes: { class: 'component-description' },
          },
        ],
        traits: [
          {
            type: 'text',
            name: 'query-prefix',
            label: 'Query Prefix',
            placeholder: 'e.g., main-search',
          },
          {
            type: 'select',
            name: 'card-type',
            label: 'Card Type',
            options: [
              { value: 'BASIC', name: 'Basic' },
              { value: 'PRODUCT', name: 'Product' },
              { value: 'PERSON', name: 'Person' },
              { value: 'DOCUMENT', name: 'Document' },
            ],
            default: 'BASIC',
          },
          {
            type: 'text',
            name: 'title-field',
            label: 'Title Field',
            placeholder: 'e.g., title',
          },
          {
            type: 'text',
            name: 'description-field',
            label: 'Description Field',
            placeholder: 'e.g., description',
          },
          {
            type: 'number',
            name: 'page-size',
            label: 'Page Size',
            default: 10,
          },
        ],
        'custom-name': 'ResultsList',
        droppable: false,
      },
    },
  });

  // Facets Component
  domc.addType('facets', {
    model: {
      defaults: {
        tagName: 'div',
        attributes: { class: 'app-studio-facets' },
        components: [
          {
            type: 'text',
            content: '🎛️ Facets',
            attributes: { class: 'component-label' },
          },
          {
            type: 'text',
            content: 'Filter/facet component',
            attributes: { class: 'component-description' },
          },
        ],
        traits: [
          {
            type: 'text',
            name: 'query-prefix',
            label: 'Query Prefix',
            placeholder: 'e.g., main-search',
          },
          {
            type: 'text',
            name: 'facet-fields',
            label: 'Facet Fields',
            placeholder: 'category,price,brand',
          },
        ],
        'custom-name': 'Facets',
        droppable: false,
      },
    },
  });

  // QA Pair Component
  domc.addType('qa-pair', {
    model: {
      defaults: {
        tagName: 'div',
        attributes: { class: 'app-studio-qa-pair' },
        components: [
          {
            type: 'text',
            content: '💬 QA Pair',
            attributes: { class: 'component-label' },
          },
          {
            type: 'text',
            content: 'Question & Answer display',
            attributes: { class: 'component-description' },
          },
        ],
        traits: [
          {
            type: 'text',
            name: 'query-prefix',
            label: 'Query Prefix',
            placeholder: 'e.g., qa-search',
          },
          {
            type: 'number',
            name: 'min-confidence',
            label: 'Min Confidence',
            default: 0.7,
            min: 0,
            max: 1,
            step: 0.1,
          },
        ],
        'custom-name': 'QAPair',
        droppable: false,
      },
    },
  });

  console.log('Custom app-studio-api components registered');
}

// ============================================================================
// Custom Blocks for Block Manager
// ============================================================================

function addCustomBlocks() {
  const bm = editor.BlockManager;

  // Basic Blocks
  bm.add('text', {
    label: '📝 Text',
    category: 'Basic',
    content: '<div data-gjs-type="text">Insert your text here</div>',
  });

  bm.add('image', {
    label: '🖼️ Image',
    category: 'Basic',
    content: { type: 'image' },
  });

  bm.add('video', {
    label: '🎥 Video',
    category: 'Basic',
    content: { type: 'video' },
  });

  // App-Studio-API Components
  bm.add('search-box', {
    label: '🔍 Search Box',
    category: 'App Studio',
    content: { type: 'search-box' },
  });

  bm.add('results-list', {
    label: '📋 Results List',
    category: 'App Studio',
    content: { type: 'results-list' },
  });

  bm.add('facets', {
    label: '🎛️ Facets',
    category: 'App Studio',
    content: { type: 'facets' },
  });

  bm.add('qa-pair', {
    label: '💬 QA Pair',
    category: 'App Studio',
    content: { type: 'qa-pair' },
  });

  console.log('Custom blocks registered');
}

// ============================================================================
// Event Handlers
// ============================================================================

function setupEventHandlers() {
  // Export Layout Button
  document.getElementById('exportLayout').addEventListener('click', exportLayout);

  // Export App Studio Button
  document.getElementById('exportAppStudio').addEventListener('click', exportAppStudio);

  // Clear Canvas Button
  document.getElementById('clearCanvas').addEventListener('click', clearCanvas);

  // Viewport Buttons
  document.getElementById('desktopView').addEventListener('click', () => switchViewport('desktop'));
  document.getElementById('mobileView').addEventListener('click', () => switchViewport('mobile'));
}

// ============================================================================
// Export Functions
// ============================================================================

function exportLayout() {
  const components = editor.getComponents();
  const layout = extractLayout(components);

  console.log('Exported Layout:', layout);
  console.log('JSON:', JSON.stringify(layout, null, 2));

  // Download as JSON file
  const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'grapesjs-layout.json';
  a.click();

  alert('Layout exported! Check your downloads and browser console.');
}

function exportAppStudio() {
  const components = editor.getComponents();
  const appStudioFormat = convertToAppStudioFormat(components);

  console.log('App Studio API Format:', appStudioFormat);
  console.log('JSON:', JSON.stringify(appStudioFormat, null, 2));

  // Download as JSON file
  const blob = new Blob([JSON.stringify(appStudioFormat, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'app-studio-template.json';
  a.click();

  alert('App Studio template exported! Check your downloads and browser console.');
}

function extractLayout(components) {
  const layout = {
    viewport: editor.getDevice(),
    components: [],
  };

  components.forEach((component, index) => {
    const type = component.get('type');
    const attributes = component.getAttributes();
    const traits = {};

    component.get('traits').forEach(trait => {
      traits[trait.get('name')] = trait.getTargetValue();
    });

    const style = component.getStyle();
    const rect = component.view.$el[0].getBoundingClientRect();

    layout.components.push({
      id: `component-${index + 1}`,
      type: type,
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      },
      attributes: attributes,
      traits: traits,
      style: style,
    });
  });

  return layout;
}

function convertToAppStudioFormat(components) {
  const template = {
    id: generateUUID(),
    name: 'GrapesJS Layout',
    components: [],
  };

  components.forEach((component) => {
    const type = component.get('type');
    const traits = {};

    component.get('traits').forEach(trait => {
      traits[trait.get('name')] = trait.getTargetValue();
    });

    // Map component types to app-studio-api format
    let apiComponent = null;

    if (type === 'search-box') {
      apiComponent = {
        type: 'SEARCH_BOX',
        config: {
          queryPrefix: traits['query-prefix'] || '',
          placeholder: traits['placeholder'] || 'Search...',
        },
      };
    } else if (type === 'results-list') {
      apiComponent = {
        type: 'RESULTS_LIST_SEARCH',
        config: {
          queryPrefix: traits['query-prefix'] || '',
          pageSize: parseInt(traits['page-size']) || 10,
          cardMappings: {
            fallback: {
              type: traits['card-type'] || 'BASIC',
              fields: {
                [traits['title-field'] || 'title']: {
                  displayName: 'Title',
                  action: 'NONE',
                },
                [traits['description-field'] || 'description']: {
                  displayName: 'Description',
                  action: 'NONE',
                },
              },
            },
          },
        },
      };
    } else if (type === 'facets') {
      const facetFields = (traits['facet-fields'] || '').split(',').filter(f => f.trim());
      apiComponent = {
        type: 'FACETS_SEARCH',
        config: {
          queryPrefix: traits['query-prefix'] || '',
          facets: facetFields.map(field => ({
            field: field.trim(),
          })),
        },
      };
    } else if (type === 'qa-pair') {
      apiComponent = {
        type: 'QA_PAIR',
        config: {
          queryPrefix: traits['query-prefix'] || '',
          minConfidence: parseFloat(traits['min-confidence']) || 0.7,
        },
      };
    }

    if (apiComponent) {
      apiComponent.id = generateUUID();
      template.components.push(apiComponent);
    }
  });

  return template;
}

// ============================================================================
// Utility Functions
// ============================================================================

function clearCanvas() {
  if (!confirm('Clear all components from the canvas?')) return;

  editor.setComponents('');
  console.log('Canvas cleared');
}

function switchViewport(viewport) {
  if (viewport === 'desktop') {
    editor.setDevice('Desktop');
    document.getElementById('desktopView').classList.add('active');
    document.getElementById('mobileView').classList.remove('active');
  } else {
    editor.setDevice('Mobile');
    document.getElementById('mobileView').classList.add('active');
    document.getElementById('desktopView').classList.remove('active');
  }

  console.log(`Switched to ${viewport} viewport`);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
