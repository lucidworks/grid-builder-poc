/**
 * Grid Builder POC - Gridstack.js Variant
 * ========================================
 *
 * This variant demonstrates using Gridstack.js as the positioning engine.
 * It shows what's available out-of-the-box vs what needs custom implementation.
 *
 * Gridstack provides:
 * - Drag and drop mechanics
 * - Resize handles
 * - Grid snapping
 * - Collision detection
 * - Save/load JSON state
 * - Responsive breakpoints
 *
 * Custom implementation needed:
 * - Desktop/mobile separate layouts (Gridstack only has responsive columns)
 * - Undo/redo system
 * - Component registry and rendering
 * - Multi-section management
 * - Virtual rendering
 */

// ============================================================================
// Component Templates
// ============================================================================

const componentTemplates = {
  header: {
    icon: '📄',
    label: 'Header',
    defaultSize: { w: 6, h: 2 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <div class="component-icon">📄</div>
        <div class="component-label">Header Component</div>
      </div>
    `
  },
  text: {
    icon: '📝',
    label: 'Text Block',
    defaultSize: { w: 4, h: 3 },
    render: () => `
      <div class="component-content" style="background: #f8f9fa; border: 2px solid #dee2e6;">
        <div class="component-icon">📝</div>
        <div class="component-label">Text Block</div>
        <div style="margin-top: 8px; font-size: 11px; color: #999;">Lorem ipsum dolor sit amet</div>
      </div>
    `
  },
  image: {
    icon: '🖼️',
    label: 'Image',
    defaultSize: { w: 3, h: 3 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
        <div class="component-icon">🖼️</div>
        <div class="component-label">Image Placeholder</div>
      </div>
    `
  },
  button: {
    icon: '🔘',
    label: 'Button',
    defaultSize: { w: 2, h: 1 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
        <div class="component-icon">🔘</div>
        <div class="component-label">Button</div>
      </div>
    `
  },
  video: {
    icon: '🎥',
    label: 'Video',
    defaultSize: { w: 4, h: 3 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white;">
        <div class="component-icon">🎥</div>
        <div class="component-label">Video Player</div>
      </div>
    `
  },
  gallery: {
    icon: '🖼️',
    label: 'Gallery',
    defaultSize: { w: 6, h: 4 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white;">
        <div class="component-icon">🖼️</div>
        <div class="component-label">Image Gallery</div>
        <div style="margin-top: 8px; font-size: 10px;">Complex Component</div>
      </div>
    `
  },
  dashboard: {
    icon: '📊',
    label: 'Dashboard',
    defaultSize: { w: 6, h: 4 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); color: white;">
        <div class="component-icon">📊</div>
        <div class="component-label">Dashboard Widget</div>
        <div style="margin-top: 8px; font-size: 10px;">Complex Component</div>
      </div>
    `
  },
  livedata: {
    icon: '📡',
    label: 'Live Data',
    defaultSize: { w: 4, h: 3 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333;">
        <div class="component-icon">📡</div>
        <div class="component-label">Live Data Feed</div>
        <div style="margin-top: 8px; font-size: 10px;">Complex Component</div>
      </div>
    `
  }
};

// ============================================================================
// State Management
// ============================================================================

const state = {
  grids: {}, // GridStack instances keyed by canvasId
  currentViewport: 'desktop',
  columnConfig: {
    desktop: 12,
    tablet: 6,
    mobile: 1
  },
  itemCounter: 0
};

// ============================================================================
// Grid Initialization
// ============================================================================

function initializeGrids() {
  const canvasElements = document.querySelectorAll('.grid-stack');

  canvasElements.forEach(canvas => {
    const canvasId = canvas.id;

    // Initialize Gridstack with responsive breakpoints
    const grid = GridStack.init({
      column: state.columnConfig.desktop,
      cellHeight: 60,
      margin: 10,
      float: false,
      resizable: {
        handles: 'e, se, s, sw, w, nw, n, ne'
      },
      draggable: {
        handle: '.grid-stack-item-content'
      },
      removable: false,
      acceptWidgets: true,
      // Responsive breakpoints
      columnOpts: {
        breakpoints: [
          { w: 1200, c: 12 },  // Desktop
          { w: 768, c: 6 },    // Tablet
          { w: 480, c: 1 }     // Mobile
        ]
      }
    }, canvas);

    // Store grid instance
    state.grids[canvasId] = grid;

    // Set initial background color
    const colorInput = document.querySelector(`input[data-canvas="${canvasId}"]`);
    if (colorInput) {
      canvas.style.backgroundColor = colorInput.value;
    }
  });

  console.log('Gridstack grids initialized:', Object.keys(state.grids));
}

// ============================================================================
// Component Creation
// ============================================================================

function createGridstackItem(canvasId, componentType, x = null, y = null) {
  const template = componentTemplates[componentType];
  if (!template) {
    console.error('Unknown component type:', componentType);
    return;
  }

  const grid = state.grids[canvasId];
  if (!grid) {
    console.error('Grid not found:', canvasId);
    return;
  }

  state.itemCounter++;
  const itemId = `item-${state.itemCounter}`;

  // Use default size or calculate from current column count
  const size = template.defaultSize;

  // Create widget element manually for better HTML control
  const widgetEl = document.createElement('div');
  widgetEl.setAttribute('gs-id', itemId);
  widgetEl.setAttribute('gs-w', size.w);
  widgetEl.setAttribute('gs-h', size.h);

  if (x !== null && y !== null) {
    widgetEl.setAttribute('gs-x', x);
    widgetEl.setAttribute('gs-y', y);
  }

  // Set the content HTML
  widgetEl.innerHTML = `
    <div class="grid-stack-item-content">
      ${template.render()}
      <button class="delete-btn" onclick="deleteItem('${canvasId}', '${itemId}')">×</button>
    </div>
  `;

  // Add widget to grid using the element
  grid.addWidget(widgetEl);

  updateItemCount();

  console.log(`Added ${componentType} to ${canvasId}:`, itemId);
}

// ============================================================================
// Drag from Palette
// ============================================================================

function setupPaletteDrag() {
  const paletteItems = document.querySelectorAll('.palette-item');

  paletteItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      const componentType = item.dataset.componentType;
      e.dataTransfer.setData('componentType', componentType);
      item.classList.add('dragging-from-palette');
    });

    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging-from-palette');
    });

    // Make draggable
    item.setAttribute('draggable', 'true');
  });

  // Setup drop zones on grids
  const grids = document.querySelectorAll('.grid-stack');
  grids.forEach(grid => {
    grid.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    grid.addEventListener('drop', (e) => {
      e.preventDefault();
      const componentType = e.dataTransfer.getData('componentType');
      if (componentType) {
        const canvasId = grid.id;
        createGridstackItem(canvasId, componentType);
      }
    });
  });
}

// ============================================================================
// Delete Item
// ============================================================================

window.deleteItem = function(canvasId, itemId) {
  const grid = state.grids[canvasId];
  if (!grid) return;

  // Find the grid item by gs-id attribute
  const canvas = document.getElementById(canvasId);
  const element = canvas.querySelector(`[gs-id="${itemId}"]`);
  if (element) {
    grid.removeWidget(element);
    updateItemCount();
  }
};

// ============================================================================
// Viewport Switching
// ============================================================================

function setupViewportControls() {
  const desktopBtn = document.getElementById('desktopView');
  const tabletBtn = document.getElementById('tabletView');
  const mobileBtn = document.getElementById('mobileView');

  desktopBtn.addEventListener('click', () => switchViewport('desktop', desktopBtn));
  tabletBtn.addEventListener('click', () => switchViewport('tablet', tabletBtn));
  mobileBtn.addEventListener('click', () => switchViewport('mobile', mobileBtn));
}

function switchViewport(viewport, button) {
  state.currentViewport = viewport;

  // Update button states
  document.querySelectorAll('.viewport-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');

  // Update grid column counts
  const columnCount = state.columnConfig[viewport];
  Object.values(state.grids).forEach(grid => {
    grid.column(columnCount);
  });

  console.log(`Switched to ${viewport} viewport (${columnCount} columns)`);
}

// ============================================================================
// Export/Import State
// ============================================================================

function setupExportImport() {
  document.getElementById('exportState').addEventListener('click', exportState);
  document.getElementById('importState').addEventListener('click', importState);
}

function exportState() {
  const exportData = {};

  Object.keys(state.grids).forEach(canvasId => {
    const grid = state.grids[canvasId];
    exportData[canvasId] = grid.save();
  });

  console.log('Exported state:', exportData);
  console.log('JSON:', JSON.stringify(exportData, null, 2));

  alert('State exported to console. Check the browser console.');
}

function importState() {
  const jsonString = prompt('Paste JSON state to import:');
  if (!jsonString) return;

  try {
    const importData = JSON.parse(jsonString);

    Object.keys(importData).forEach(canvasId => {
      const grid = state.grids[canvasId];
      if (grid) {
        grid.load(importData[canvasId]);
      }
    });

    updateItemCount();
    console.log('Imported state successfully');
  } catch (error) {
    console.error('Failed to import state:', error);
    alert('Invalid JSON format');
  }
}

// ============================================================================
// Section Management
// ============================================================================

function setupSectionManagement() {
  document.getElementById('addSection').addEventListener('click', addSection);

  // Setup delete section buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-section-btn')) {
      const canvasId = e.target.dataset.canvas;
      deleteSection(canvasId);
    }
  });

  // Setup clear canvas buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('clear-canvas-btn')) {
      const canvasId = e.target.dataset.canvas;
      clearCanvas(canvasId);
    }
  });

  // Setup background color pickers
  document.querySelectorAll('.canvas-bg-color').forEach(input => {
    input.addEventListener('change', (e) => {
      const canvasId = e.target.dataset.canvas;
      const color = e.target.value;
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        canvas.style.backgroundColor = color;
      }
    });
  });
}

function addSection() {
  const container = document.querySelector('.canvases-container');
  const sectionCount = container.querySelectorAll('.canvas-item').length + 1;
  const newCanvasId = `canvas${sectionCount}`;

  const section = document.createElement('div');
  section.className = 'canvas-item';
  section.dataset.canvasId = newCanvasId;
  section.innerHTML = `
    <div class="canvas-item-header">
      <h3>Section ${sectionCount}</h3>
      <div class="canvas-controls">
        <label>
          <input type="color" class="canvas-bg-color" data-canvas="${newCanvasId}" value="#ffffff">
        </label>
        <button class="clear-canvas-btn" data-canvas="${newCanvasId}">Clear</button>
        <button class="delete-section-btn" data-canvas="${newCanvasId}" title="Delete Section">🗑️</button>
      </div>
    </div>
    <div class="grid-builder">
      <div class="grid-stack" id="${newCanvasId}" data-canvas-id="${newCanvasId}">
      </div>
    </div>
  `;

  container.appendChild(section);

  // Initialize the new grid
  const newCanvas = document.getElementById(newCanvasId);
  const grid = GridStack.init({
    column: state.columnConfig[state.currentViewport],
    cellHeight: 60,
    margin: 10,
    float: false,
    resizable: {
      handles: 'e, se, s, sw, w, nw, n, ne'
    },
    draggable: {
      handle: '.grid-stack-item-content'
    },
    removable: false,
    acceptWidgets: true,
    columnOpts: {
      breakpoints: [
        { w: 1200, c: 12 },
        { w: 768, c: 6 },
        { w: 480, c: 1 }
      ]
    }
  }, newCanvas);

  state.grids[newCanvasId] = grid;

  console.log('Added new section:', newCanvasId);
}

function deleteSection(canvasId) {
  // Prevent deleting if only one section left
  const sections = document.querySelectorAll('.canvas-item');
  if (sections.length <= 1) {
    alert('Cannot delete the last section');
    return;
  }

  if (!confirm(`Delete section ${canvasId}?`)) {
    return;
  }

  // Destroy Gridstack instance
  if (state.grids[canvasId]) {
    state.grids[canvasId].destroy();
    delete state.grids[canvasId];
  }

  // Remove DOM element
  const section = document.querySelector(`[data-canvas-id="${canvasId}"]`);
  if (section) {
    section.remove();
  }

  updateItemCount();
  console.log('Deleted section:', canvasId);
}

function clearCanvas(canvasId) {
  const grid = state.grids[canvasId];
  if (!grid) return;

  if (!confirm(`Clear all items from ${canvasId}?`)) {
    return;
  }

  grid.removeAll();
  updateItemCount();
  console.log('Cleared canvas:', canvasId);
}

// ============================================================================
// Stress Test
// ============================================================================

function setupStressTest() {
  document.getElementById('addStressTest').addEventListener('click', addStressTestItems);
  document.getElementById('clearAll').addEventListener('click', clearAllItems);
}

function addStressTestItems() {
  const count = parseInt(document.getElementById('stressTestCount').value) || 50;
  const componentTypes = Object.keys(componentTemplates);
  const canvasIds = Object.keys(state.grids);

  console.log(`Adding ${count} random items...`);

  for (let i = 0; i < count; i++) {
    const randomType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
    const randomCanvas = canvasIds[Math.floor(Math.random() * canvasIds.length)];
    createGridstackItem(randomCanvas, randomType);
  }

  console.log(`Stress test complete: added ${count} items`);
}

function clearAllItems() {
  if (!confirm('Clear all items from all sections?')) {
    return;
  }

  Object.values(state.grids).forEach(grid => {
    grid.removeAll();
  });

  updateItemCount();
  console.log('Cleared all items');
}

// ============================================================================
// Utilities
// ============================================================================

function updateItemCount() {
  let totalItems = 0;
  Object.values(state.grids).forEach(grid => {
    const items = grid.getGridItems();
    totalItems += items.length;
  });

  const countElement = document.getElementById('itemCount');
  if (countElement) {
    countElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
  }
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Gridstack variant...');

  initializeGrids();
  setupPaletteDrag();
  setupViewportControls();
  setupExportImport();
  setupSectionManagement();
  setupStressTest();
  updateItemCount();

  console.log('Gridstack variant ready!');
  console.log('Note: This variant demonstrates Gridstack.js capabilities and limitations');
  console.log('Features NOT available in Gridstack:');
  console.log('  - Desktop/mobile separate layouts (only responsive columns)');
  console.log('  - Built-in undo/redo');
  console.log('  - Component registry system');
  console.log('  - Virtual rendering');
  console.log('  - Custom grid percentage calculations');
});
