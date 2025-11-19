/**
 * Grid Builder POC - Moveable.js Variant
 * =======================================
 *
 * This variant demonstrates using Moveable.js for drag/resize/rotate functionality.
 * Moveable provides built-in features like snap-to-grid, group selection, and rotation
 * that would require custom implementation with Interact.js.
 *
 * Key Moveable features demonstrated:
 * - Transform-based positioning (translate, scale, rotate)
 * - Built-in snap-to-grid (snapGridWidth, snapGridHeight)
 * - Group selection (select multiple items)
 * - Boundary constraints (keep items within canvas)
 * - Event-driven API (drag, resize, rotate events)
 *
 * Comparison with Interact.js:
 * - More high-level API (less code for common patterns)
 * - Built-in rotation support
 * - Built-in guideline snapping
 * - Larger bundle size (~100KB vs 60KB)
 * - Transform-based by default (vs position-based)
 */

// ============================================================================
// Grid Configuration
// ============================================================================

const GRID_SIZE_HORIZONTAL = 20; // pixels (2% of 1000px canvas)
const GRID_SIZE_VERTICAL = 20;   // pixels

// ============================================================================
// Component Templates
// ============================================================================

const componentTemplates = {
  header: {
    icon: '📄',
    label: 'Header',
    defaultSize: { width: 600, height: 120 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="component-icon" style="font-size: 32px; margin-bottom: 8px;">📄</div>
        <div class="component-label" style="font-weight: 500; font-size: 13px;">Header Component</div>
      </div>
    `
  },
  text: {
    icon: '📝',
    label: 'Text Block',
    defaultSize: { width: 400, height: 200 },
    render: () => `
      <div class="component-content" style="background: #f8f9fa; border: 2px solid #dee2e6; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px;">
        <div class="component-icon" style="font-size: 32px; margin-bottom: 8px;">📝</div>
        <div class="component-label" style="font-weight: 500; font-size: 13px; color: #666;">Text Block</div>
        <div style="margin-top: 8px; font-size: 11px; color: #999;">Lorem ipsum dolor sit amet</div>
      </div>
    `
  },
  image: {
    icon: '🖼️',
    label: 'Image',
    defaultSize: { width: 300, height: 300 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="component-icon" style="font-size: 32px; margin-bottom: 8px;">🖼️</div>
        <div class="component-label" style="font-weight: 500; font-size: 13px;">Image Placeholder</div>
      </div>
    `
  },
  button: {
    icon: '🔘',
    label: 'Button',
    defaultSize: { width: 200, height: 60 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <div class="component-icon" style="font-size: 24px; margin-right: 8px;">🔘</div>
        <div class="component-label" style="font-weight: 500; font-size: 13px;">Button</div>
      </div>
    `
  },
  video: {
    icon: '🎥',
    label: 'Video',
    defaultSize: { width: 400, height: 300 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="component-icon" style="font-size: 32px; margin-bottom: 8px;">🎥</div>
        <div class="component-label" style="font-weight: 500; font-size: 13px;">Video Player</div>
      </div>
    `
  },
  gallery: {
    icon: '🖼️',
    label: 'Gallery',
    defaultSize: { width: 600, height: 400 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="component-icon" style="font-size: 32px; margin-bottom: 8px;">🖼️</div>
        <div class="component-label" style="font-weight: 500; font-size: 13px;">Image Gallery</div>
        <div style="margin-top: 8px; font-size: 10px;">Complex Component</div>
      </div>
    `
  },
  dashboard: {
    icon: '📊',
    label: 'Dashboard',
    defaultSize: { width: 600, height: 400 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); color: white; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="component-icon" style="font-size: 32px; margin-bottom: 8px;">📊</div>
        <div class="component-label" style="font-weight: 500; font-size: 13px;">Dashboard Widget</div>
        <div style="margin-top: 8px; font-size: 10px;">Complex Component</div>
      </div>
    `
  },
  livedata: {
    icon: '📡',
    label: 'Live Data',
    defaultSize: { width: 400, height: 300 },
    render: () => `
      <div class="component-content" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="component-icon" style="font-size: 32px; margin-bottom: 8px;">📡</div>
        <div class="component-label" style="font-weight: 500; font-size: 13px;">Live Data Feed</div>
        <div style="margin-top: 8px; font-size: 10px;">Complex Component</div>
      </div>
    `
  }
};

// ============================================================================
// State Management
// ============================================================================

const state = {
  items: new Map(), // Map<itemId, { element, moveable, canvasId, type }>
  selectedItems: new Set(),
  currentViewport: 'desktop',
  showGrid: true,
  itemCounter: 0,
  moveables: new Map() // Map<itemId, Moveable instance>
};

// ============================================================================
// Item Creation
// ============================================================================

function createItem(canvasId, componentType, x = 100, y = 100) {
  const template = componentTemplates[componentType];
  if (!template) {
    console.error('Unknown component type:', componentType);
    return null;
  }

  state.itemCounter++;
  const itemId = `item-${state.itemCounter}`;

  // Create item element
  const item = document.createElement('div');
  item.id = itemId;
  item.className = 'grid-item';
  item.dataset.canvasId = canvasId;
  item.dataset.type = componentType;

  // Set initial size
  item.style.width = template.defaultSize.width + 'px';
  item.style.height = template.defaultSize.height + 'px';
  item.style.position = 'absolute';
  item.style.left = '0px';
  item.style.top = '0px';
  item.style.transform = `translate(${x}px, ${y}px)`;

  // Add content
  item.innerHTML = `
    ${template.render()}
    <div class="item-controls">
      <button class="delete-btn" onclick="deleteItem('${itemId}')">×</button>
      <button class="front-btn" onclick="bringToFront('${itemId}')" title="Bring to Front">⬆️</button>
      <button class="back-btn" onclick="sendToBack('${itemId}')" title="Send to Back">⬇️</button>
    </div>
  `;

  // Add to canvas
  const canvas = document.getElementById(canvasId);
  canvas.appendChild(item);

  // Create Moveable instance
  const moveable = new Moveable(canvas, {
    target: item,
    draggable: true,
    resizable: true,
    rotatable: true,
    snappable: true,
    snapGridWidth: GRID_SIZE_HORIZONTAL,
    snapGridHeight: GRID_SIZE_VERTICAL,
    bounds: { left: 0, top: 0, right: canvas.clientWidth, bottom: canvas.clientHeight },
    origin: false,
    keepRatio: false,
    edge: true,
    throttleDrag: 0,
    throttleResize: 0,
  });

  // Event handlers
  moveable.on('drag', ({ target, transform }) => {
    target.style.transform = transform;
  });

  moveable.on('resize', ({ target, width, height, drag }) => {
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    target.style.transform = drag.transform;
  });

  moveable.on('rotate', ({ target, transform }) => {
    target.style.transform = transform;
  });

  // Click to select
  item.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn') ||
        e.target.classList.contains('front-btn') ||
        e.target.classList.contains('back-btn')) {
      return;
    }
    selectItem(itemId);
  });

  // Store state
  state.items.set(itemId, {
    element: item,
    moveable,
    canvasId,
    type: componentType
  });
  state.moveables.set(itemId, moveable);

  updateItemCount();

  console.log(`Created ${componentType} at (${x}, ${y}):`, itemId);
  return itemId;
}

// ============================================================================
// Selection Management
// ============================================================================

function selectItem(itemId) {
  // Deselect all
  state.items.forEach((data, id) => {
    data.element.classList.remove('selected');
  });

  // Select this item
  const itemData = state.items.get(itemId);
  if (itemData) {
    itemData.element.classList.add('selected');
    state.selectedItems.clear();
    state.selectedItems.add(itemId);
  }
}

function deselectAll() {
  state.items.forEach((data) => {
    data.element.classList.remove('selected');
  });
  state.selectedItems.clear();
}

// ============================================================================
// Z-Index Management
// ============================================================================

window.bringToFront = function(itemId) {
  const itemData = state.items.get(itemId);
  if (!itemData) return;

  // Find max z-index in this canvas
  let maxZ = 0;
  state.items.forEach((data) => {
    if (data.canvasId === itemData.canvasId) {
      const z = parseInt(data.element.style.zIndex || '1');
      maxZ = Math.max(maxZ, z);
    }
  });

  itemData.element.style.zIndex = maxZ + 1;
};

window.sendToBack = function(itemId) {
  const itemData = state.items.get(itemId);
  if (!itemData) return;

  itemData.element.style.zIndex = '1';
};

// ============================================================================
// Delete Item
// ============================================================================

window.deleteItem = function(itemId) {
  const itemData = state.items.get(itemId);
  if (!itemData) return;

  // Destroy moveable instance
  itemData.moveable.destroy();

  // Remove element
  itemData.element.remove();

  // Remove from state
  state.items.delete(itemId);
  state.moveables.delete(itemId);
  state.selectedItems.delete(itemId);

  updateItemCount();
};

// ============================================================================
// Palette Drag
// ============================================================================

function setupPaletteDrag() {
  const paletteItems = document.querySelectorAll('.palette-item');

  paletteItems.forEach(item => {
    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('componentType', item.dataset.componentType);
      item.classList.add('dragging-from-palette');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging-from-palette');
    });
  });

  // Setup drop zones
  document.querySelectorAll('.grid-container').forEach(canvas => {
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const componentType = e.dataTransfer.getData('componentType');
      if (!componentType) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      createItem(canvas.id, componentType, x, y);
    });
  });
}

// ============================================================================
// Viewport Management
// ============================================================================

function setupViewportControls() {
  document.getElementById('desktopView').addEventListener('click', () => switchViewport('desktop'));
  document.getElementById('mobileView').addEventListener('click', () => switchViewport('mobile'));
}

function switchViewport(viewport) {
  state.currentViewport = viewport;

  document.querySelectorAll('.viewport-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  if (viewport === 'desktop') {
    document.getElementById('desktopView').classList.add('active');
    // TODO: Switch to desktop layout
  } else {
    document.getElementById('mobileView').classList.add('active');
    // TODO: Switch to mobile layout
  }

  console.log(`Switched to ${viewport} viewport`);
}

// ============================================================================
// Grid Toggle
// ============================================================================

function setupGridToggle() {
  const toggleBtn = document.getElementById('toggleGrid');

  toggleBtn.addEventListener('click', () => {
    state.showGrid = !state.showGrid;

    document.querySelectorAll('.grid-container').forEach(canvas => {
      canvas.classList.toggle('grid-visible', state.showGrid);
    });

    toggleBtn.classList.toggle('active', state.showGrid);
  });

  // Initialize grid visibility
  document.querySelectorAll('.grid-container').forEach(canvas => {
    canvas.classList.add('grid-visible');
  });
}

// ============================================================================
// Export State
// ============================================================================

function setupExport() {
  document.getElementById('exportState').addEventListener('click', exportState);
}

function exportState() {
  const exportData = {
    items: [],
    viewport: state.currentViewport
  };

  state.items.forEach((data, itemId) => {
    const element = data.element;
    const transform = element.style.transform;

    exportData.items.push({
      id: itemId,
      canvasId: data.canvasId,
      type: data.type,
      width: element.style.width,
      height: element.style.height,
      transform: transform,
      zIndex: element.style.zIndex || '1'
    });
  });

  console.log('Exported state:', exportData);
  console.log('JSON:', JSON.stringify(exportData, null, 2));
  alert('State exported to console. Check browser console.');
}

// ============================================================================
// Section Management
// ============================================================================

function setupSectionManagement() {
  document.getElementById('addSection').addEventListener('click', addSection);

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-section-btn')) {
      const canvasId = e.target.dataset.canvas;
      deleteSection(canvasId);
    }

    if (e.target.classList.contains('clear-canvas-btn')) {
      const canvasId = e.target.dataset.canvas;
      clearCanvas(canvasId);
    }
  });

  // Background color pickers
  document.querySelectorAll('.canvas-bg-color').forEach(input => {
    input.addEventListener('change', (e) => {
      const canvasId = e.target.dataset.canvas;
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        canvas.style.backgroundColor = e.target.value;
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
      <div class="grid-container grid-visible" id="${newCanvasId}" data-canvas-id="${newCanvasId}">
      </div>
    </div>
  `;

  container.appendChild(section);
  console.log('Added new section:', newCanvasId);
}

function deleteSection(canvasId) {
  const sections = document.querySelectorAll('.canvas-item');
  if (sections.length <= 1) {
    alert('Cannot delete the last section');
    return;
  }

  if (!confirm(`Delete section ${canvasId}?`)) return;

  // Destroy moveables in this canvas
  state.items.forEach((data, itemId) => {
    if (data.canvasId === canvasId) {
      data.moveable.destroy();
      state.items.delete(itemId);
      state.moveables.delete(itemId);
    }
  });

  // Remove DOM
  const section = document.querySelector(`[data-canvas-id="${canvasId}"]`);
  if (section) section.remove();

  updateItemCount();
}

function clearCanvas(canvasId) {
  if (!confirm(`Clear all items from ${canvasId}?`)) return;

  // Delete all items in this canvas
  const itemsToDelete = [];
  state.items.forEach((data, itemId) => {
    if (data.canvasId === canvasId) {
      itemsToDelete.push(itemId);
    }
  });

  itemsToDelete.forEach(itemId => window.deleteItem(itemId));
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
  const canvases = Array.from(document.querySelectorAll('.grid-container'));

  console.log(`Adding ${count} random items...`);

  for (let i = 0; i < count; i++) {
    const randomType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
    const randomCanvas = canvases[Math.floor(Math.random() * canvases.length)];
    const randomX = Math.random() * (randomCanvas.clientWidth - 200);
    const randomY = Math.random() * (randomCanvas.clientHeight - 200);

    createItem(randomCanvas.id, randomType, randomX, randomY);
  }

  console.log(`Stress test complete: added ${count} items`);
}

function clearAllItems() {
  if (!confirm('Clear all items from all sections?')) return;

  const itemsToDelete = Array.from(state.items.keys());
  itemsToDelete.forEach(itemId => window.deleteItem(itemId));
}

// ============================================================================
// Utilities
// ============================================================================

function updateItemCount() {
  const countElement = document.getElementById('itemCount');
  if (countElement) {
    const count = state.items.size;
    countElement.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  }
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Moveable variant...');

  setupPaletteDrag();
  setupViewportControls();
  setupGridToggle();
  setupExport();
  setupSectionManagement();
  setupStressTest();
  updateItemCount();

  console.log('Moveable variant ready!');
  console.log('Moveable.js provides:');
  console.log('  ✅ Built-in snap-to-grid');
  console.log('  ✅ Transform-based positioning');
  console.log('  ✅ Rotation support');
  console.log('  ✅ Boundary constraints');
  console.log('  ✅ Event-driven API');
});

// ============================================================================
// Deselect on canvas click
// ============================================================================

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('grid-container')) {
    deselectAll();
  }
});
