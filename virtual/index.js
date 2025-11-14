    // ========================================
    // PERFORMANCE OPTIMIZATIONS
    // ========================================

    // DOM Cache Registry - cache frequently accessed DOM elements
    const DOM = {
      canvases: {},
      controls: {},
      configPanel: null
    };

    // Initialize DOM cache
    function initDOMCache() {
      // Cache control elements
      DOM.controls.desktopView = document.getElementById('desktopView');
      DOM.controls.mobileView = document.getElementById('mobileView');
      DOM.controls.toggleGrid = document.getElementById('toggleGrid');
      DOM.controls.exportState = document.getElementById('exportState');
      DOM.controls.addSection = document.getElementById('addSection');
      DOM.controls.stressTestCount = document.getElementById('stressTestCount');
      DOM.controls.addStressTest = document.getElementById('addStressTest');
      DOM.controls.clearAll = document.getElementById('clearAll');
      DOM.controls.itemCount = document.getElementById('itemCount');

      // Cache config panel
      DOM.configPanel = document.getElementById('configPanel');
      DOM.configPanelClose = document.getElementById('configPanelClose');
      DOM.configPanelCancel = document.getElementById('configPanelCancel');
      DOM.configPanelSave = document.getElementById('configPanelSave');
      DOM.componentName = document.getElementById('componentName');
    }

    // Grid size cache - avoid recalculating on every operation
    const gridSizeCache = new Map();

    function clearGridSizeCache() {
      gridSizeCache.clear();
    }

    // Virtual rendering - track which items are visible
    const virtualRenderingEnabled = true;
    const visibilityObservers = new Map(); // Map of canvasId -> IntersectionObserver
    const visibleItems = new Set(); // Set of visible item IDs
    const itemCleanupFns = new WeakMap(); // WeakMap for cleanup functions

    // ========================================
    // STATE
    // ========================================

    // State - per canvas
    const canvases = {
      canvas1: {
        items: [],
        zIndexCounter: 1
      },
      canvas2: {
        items: [],
        zIndexCounter: 1
      },
      canvas3: {
        items: [],
        zIndexCounter: 1
      }
    };
    let selectedItemId = null;
    let selectedCanvasId = null;
    let selectedConfigItem = null; // Track currently configured item
    let itemIdCounter = 0;
    let dragClone = null;
    let showGrid = true;
    let currentViewport = 'desktop'; // 'desktop' or 'mobile'
    let sectionCounter = 3; // Start at 3 since we have canvas1, canvas2, canvas3

    // Undo/Redo system
    const commandHistory = [];
    let historyPosition = -1;
    const MAX_HISTORY = 50;

    function pushCommand(command) {
      // Remove any commands after current position (if we undid and then did something new)
      commandHistory.splice(historyPosition + 1);

      // Add new command
      commandHistory.push(command);

      // Limit history size
      if (commandHistory.length > MAX_HISTORY) {
        commandHistory.shift();
      } else {
        historyPosition++;
      }
    }

    function undo() {
      if (historyPosition < 0) return;

      const command = commandHistory[historyPosition];
      command.undo();
      historyPosition--;
    }

    function redo() {
      if (historyPosition >= commandHistory.length - 1) return;

      historyPosition++;
      const command = commandHistory[historyPosition];
      command.redo();
    }

    const gridContainers = document.querySelectorAll('.grid-container');

    // Grid configuration matches CSS background-size: 2% 20px
    const GRID_SIZE_VERTICAL = 20; // Fixed 20px vertical grid
    const GRID_SIZE_HORIZONTAL_PERCENT = 0.02; // 2% horizontal grid

    // Calculate horizontal grid size (responsive, based on container width)
    // OPTIMIZED: Uses cache to avoid repeated DOM queries and calculations
    function getGridSizeHorizontal(canvasId, forceRecalc = false) {
      const cacheKey = `${canvasId}-h`;

      if (!forceRecalc && gridSizeCache.has(cacheKey)) {
        return gridSizeCache.get(cacheKey);
      }

      // Use cached DOM reference if available, otherwise query
      const container = DOM.canvases[canvasId] || document.getElementById(canvasId);
      if (container && !DOM.canvases[canvasId]) {
        DOM.canvases[canvasId] = container; // Cache for next time
      }

      const size = container.clientWidth * GRID_SIZE_HORIZONTAL_PERCENT;
      gridSizeCache.set(cacheKey, size);
      return size;
    }

    // Calculate vertical grid size (fixed 20px)
    function getGridSizeVertical() {
      return GRID_SIZE_VERTICAL;
    }

    // Convert grid units to pixels for horizontal values (x, width)
    // Uses percentage calculation to match CSS background grid
    function gridToPixelsX(gridUnits, canvasId) {
      const container = document.getElementById(canvasId);
      const percentage = gridUnits * GRID_SIZE_HORIZONTAL_PERCENT;
      return Math.round(container.clientWidth * percentage);
    }

    // Convert grid units to pixels for vertical values (y, height)
    // Uses fixed 20px grid size
    function gridToPixelsY(gridUnits) {
      return gridUnits * GRID_SIZE_VERTICAL;
    }

    // Convert pixels to grid units for horizontal values (x, width)
    function pixelsToGridX(pixels, canvasId) {
      const container = document.getElementById(canvasId);
      const percentage = pixels / container.clientWidth;
      return Math.round(percentage / GRID_SIZE_HORIZONTAL_PERCENT);
    }

    // Convert pixels to grid units for vertical values (y, height)
    function pixelsToGridY(pixels) {
      return Math.round(pixels / GRID_SIZE_VERTICAL);
    }

    // Component templates
    const componentTemplates = {
      header: { icon: '📄', title: 'Header', content: 'This is a header component' },
      text: { icon: '📝', title: 'Text Block', content: 'This is a text block component' },
      image: { icon: '🖼️', title: 'Image', content: '<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%; overflow: hidden; border-radius: 4px; background: #f0f0f0;"><img src="https://picsum.photos/seed/image/800/600" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" alt="Sample image"></div>' },
      button: { icon: '🔘', title: 'Button', content: 'Click me!' },
      video: { icon: '🎥', title: 'Video', content: '<div class="video-placeholder" style="width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(\'https://picsum.photos/seed/video/400/300\') center/cover; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="this.outerHTML = \'<video controls autoplay style=\\\'width: 100%; height: 100%; object-fit: cover; border-radius: 4px;\\\'><source src=\\\'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4\\\' type=\\\'video/mp4\\\'>Your browser does not support the video tag.</video>\';"><div style="width: 80px; height: 80px; background: rgba(255,255,255,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><svg width="32" height="32" viewBox="0 0 24 24" fill="#4A90E2"><path d="M8 5v14l11-7z"/></svg></div></div>' },
      gallery: { icon: '🖼️', title: 'Image Gallery', content: 'Loading images...', complex: true },
      dashboard: { icon: '📊', title: 'Dashboard Widget', content: 'Dashboard data', complex: true },
      livedata: { icon: '📡', title: 'Live Data', content: 'Connecting...', complex: true }
    };

    // Initialize palette dragging
    interact('.palette-item')
      .draggable({
        inertia: false,
        autoScroll: false,

        listeners: {
          start(event) {
            event.target.classList.add('dragging-from-palette');

            // Create drag clone
            dragClone = document.createElement('div');
            dragClone.className = 'dragging-clone';
            dragClone.textContent = event.target.textContent;
            dragClone.style.left = event.clientX + 'px';
            dragClone.style.top = event.clientY + 'px';
            document.body.appendChild(dragClone);
          },

          move(event) {
            if (dragClone) {
              dragClone.style.left = event.clientX + 'px';
              dragClone.style.top = event.clientY + 'px';
            }
          },

          end(event) {
            event.target.classList.remove('dragging-from-palette');
            if (dragClone) {
              dragClone.remove();
              dragClone = null;
            }
          }
        }
      });

    // Initialize drop zones for all canvases
    gridContainers.forEach(container => {
      interact(container)
        .dropzone({
          accept: '.palette-item',

          ondrop(event) {
            const componentType = event.relatedTarget.getAttribute('data-component-type');
            const canvasId = event.target.getAttribute('data-canvas-id');
            const dropPosition = getGridPosition(event.dragEvent.clientX, event.dragEvent.clientY, canvasId);

            addItemToGrid(canvasId, componentType, dropPosition.x, dropPosition.y);
          }
        });
    });

    // Batch render items using DocumentFragment for better performance
    // Use this after adding multiple items with skipRender = true
    function batchRenderItems(canvasId) {
      const canvas = canvases[canvasId];
      const gridContainer = document.getElementById(canvasId);
      const fragment = document.createDocumentFragment();

      // Create all DOM elements in the fragment (not yet in DOM)
      canvas.items.forEach(item => {
        const template = componentTemplates[item.type];
        const div = document.createElement('div');
        div.className = 'grid-item';
        div.id = item.id;
        div.setAttribute('data-canvas-id', item.canvasId);
        div.setAttribute('data-component-name', item.name || template.title); // Store component name

        const layout = getCurrentLayout(item);
        // Use transform for positioning instead of left/top
        div.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
        div.style.width = layout.width + 'px';
        div.style.height = layout.height + 'px';
        div.style.zIndex = item.zIndex;

        // Render complex or simple content
        // OPTIMIZED: Complex components get placeholder, content loaded when visible
        if (template.complex) {
          div.innerHTML = `
            <div class="drag-handle"></div>
            <div class="grid-item-header">${template.icon} ${item.name || template.title}</div>
            <div class="grid-item-content" id="${item.id}-content">
              <div class="loading-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 12px;">
                Loading...
              </div>
            </div>
            <div class="grid-item-controls">
              <button class="grid-item-control-btn" onclick="bringToFront('${item.id}', '${item.canvasId}')" title="Bring to Front">⬆️</button>
              <button class="grid-item-control-btn" onclick="sendToBack('${item.id}', '${item.canvasId}')" title="Send to Back">⬇️</button>
              <button class="grid-item-delete" onclick="deleteItem('${item.id}', '${item.canvasId}')">×</button>
            </div>
            <div class="resize-handle nw"></div>
            <div class="resize-handle ne"></div>
            <div class="resize-handle sw"></div>
            <div class="resize-handle se"></div>
            <div class="resize-handle n"></div>
            <div class="resize-handle s"></div>
            <div class="resize-handle e"></div>
            <div class="resize-handle w"></div>
          `;
        } else {
          div.innerHTML = `
            <div class="drag-handle"></div>
            <div class="grid-item-header">${template.icon} ${item.name || template.title}</div>
            <div class="grid-item-content">${template.content}</div>
            <div class="grid-item-controls">
              <button class="grid-item-control-btn" onclick="bringToFront('${item.id}', '${item.canvasId}')" title="Bring to Front">⬆️</button>
              <button class="grid-item-control-btn" onclick="sendToBack('${item.id}', '${item.canvasId}')" title="Send to Back">⬇️</button>
              <button class="grid-item-delete" onclick="deleteItem('${item.id}', '${item.canvasId}')">×</button>
            </div>
            <div class="resize-handle nw"></div>
            <div class="resize-handle ne"></div>
            <div class="resize-handle sw"></div>
            <div class="resize-handle se"></div>
            <div class="resize-handle n"></div>
            <div class="resize-handle s"></div>
            <div class="resize-handle e"></div>
            <div class="resize-handle w"></div>
          `;
        }

        // Click to open config panel
        div.addEventListener('click', (e) => {
          // Don't open config panel if clicking on drag handle, resize handle, delete button, or control buttons
          if (e.target.classList.contains('drag-handle') ||
              e.target.closest('.drag-handle') ||
              e.target.classList.contains('resize-handle') ||
              e.target.classList.contains('grid-item-delete') ||
              e.target.classList.contains('grid-item-control-btn')) {
            return;
          }
          openConfigPanel(item.id, item.canvasId);
        });

        fragment.appendChild(div);
      });

      // Single DOM append operation
      gridContainer.appendChild(fragment);

      // Initialize interact.js on all elements (must be done after elements are in DOM)
      canvas.items.forEach(item => {
        const element = document.getElementById(item.id);
        makeItemDraggable(element, item);
        makeItemResizable(element, item);
      });

      // OPTIMIZED: Instead of immediately initializing complex components,
      // observe them with Intersection Observer for lazy loading
      if (virtualRenderObserver) {
        canvas.items.forEach(item => {
          const template = componentTemplates[item.type];
          if (template.complex) {
            const element = document.getElementById(item.id);
            if (element) {
              virtualRenderObserver.observe(element);
            }
          }
        });
      }
    }

    // Add item to grid
    // NOTE: x, y, width, height are in PIXELS for the initial call, but stored as GRID UNITS
    function addItemToGrid(canvasId, componentType, x, y, width = 200, height = 150, zIndex = null, skipRender = false) {
      const template = componentTemplates[componentType];
      const id = 'item-' + (++itemIdCounter);
      const canvas = canvases[canvasId];

      const item = {
        id,
        canvasId,
        type: componentType,
        name: template.title, // Default name from template
        layouts: {
          desktop: {
            x: pixelsToGridX(x, canvasId),        // stored in grid units
            y: pixelsToGridY(y),                   // stored in grid units
            width: pixelsToGridX(width, canvasId), // stored in grid units
            height: pixelsToGridY(height)          // stored in grid units
          },
          mobile: {
            x: null, // null means auto-generate
            y: null,
            width: null,
            height: null,
            customized: false // track if user has manually edited mobile layout
          }
        },
        zIndex: zIndex !== null ? zIndex : canvas.zIndexCounter++
      };

      canvas.items.push(item);

      if (!skipRender) {
        renderItem(item, template);
      }

      // Clear mobile layout cache since items changed
      clearMobileLayoutCache(canvasId);

      // Update canvas height if in mobile view
      if (currentViewport === 'mobile') {
        const gridContainer = document.getElementById(canvasId);
        const requiredHeight = calculateCanvasHeight(canvasId);
        gridContainer.style.minHeight = requiredHeight + 'px';
      }

      return item;
    }

    // Cache for mobile auto-layouts (cleared when items change)
    const mobileAutoLayoutCache = {};

    // Calculate all mobile auto-layouts for a canvas in O(n) time
    // This eliminates the recursive O(n²) calculation
    function calculateAllMobileAutoLayouts(canvasId) {
      const canvas = canvases[canvasId];
      const containerWidth = document.getElementById(canvasId).clientWidth;
      const gridSizeX = getGridSizeHorizontal(canvasId);
      const gridSizeY = getGridSizeVertical();
      let yPosition = gridSizeY; // Start with 1 grid unit padding

      canvas.items.forEach(item => {
        const cacheKey = `${canvasId}-${item.id}`;

        if (item.layouts.mobile.customized) {
          // Use stored customized layout
          const layout = {
            x: gridToPixelsX(item.layouts.mobile.x, item.canvasId),
            y: gridToPixelsY(item.layouts.mobile.y),
            width: gridToPixelsX(item.layouts.mobile.width, item.canvasId),
            height: gridToPixelsY(item.layouts.mobile.height)
          };
          mobileAutoLayoutCache[cacheKey] = layout;

          // Update yPosition for next item (customized items can affect stacking)
          const bottom = layout.y + layout.height;
          yPosition = Math.max(yPosition, bottom + gridSizeY);
        } else {
          // Calculate auto-layout for this item
          const desktopLayout = item.layouts.desktop;
          const desktopWidthPx = gridToPixelsX(desktopLayout.width, item.canvasId);
          const desktopHeightPx = gridToPixelsY(desktopLayout.height);

          // Full width on mobile
          const mobileWidth = containerWidth;
          const aspectRatio = desktopHeightPx / desktopWidthPx;
          const mobileHeight = Math.round(mobileWidth * aspectRatio);

          const layout = {
            x: 0,
            y: yPosition,
            width: mobileWidth,
            height: mobileHeight
          };

          mobileAutoLayoutCache[cacheKey] = layout;

          // Move yPosition down for next item
          yPosition = layout.y + layout.height + gridSizeY;
        }
      });
    }

    // Clear mobile auto-layout cache for a canvas
    function clearMobileLayoutCache(canvasId) {
      const canvas = canvases[canvasId];
      canvas.items.forEach(item => {
        const cacheKey = `${canvasId}-${item.id}`;
        delete mobileAutoLayoutCache[cacheKey];
      });
    }

    // Get current layout for item based on viewport
    // Returns layout in PIXELS (converted from grid units)
    function getCurrentLayout(item) {
      const layout = item.layouts[currentViewport];

      // If mobile and not customized, use cached auto-layout
      if (currentViewport === 'mobile' && !layout.customized) {
        const cacheKey = `${item.canvasId}-${item.id}`;

        // If not in cache, calculate all layouts for this canvas
        if (!mobileAutoLayoutCache[cacheKey]) {
          calculateAllMobileAutoLayouts(item.canvasId);
        }

        return mobileAutoLayoutCache[cacheKey];
      }

      // Convert grid units to pixels
      return {
        x: gridToPixelsX(layout.x, item.canvasId),
        y: gridToPixelsY(layout.y),
        width: gridToPixelsX(layout.width, item.canvasId),
        height: gridToPixelsY(layout.height)
      };
    }

    // ========================================
    // VIRTUAL RENDERING - LAZY LOADING
    // ========================================

    // Setup Intersection Observer for lazy-loading complex components
    // This only renders complex content when items are visible in viewport
    function setupVirtualRendering() {
      // Create observer with 200px margin (pre-render before entering viewport)
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const itemElement = entry.target;
          const itemId = itemElement.id;

          if (entry.isIntersecting) {
            // Item is visible - check if we need to initialize it
            if (!visibleItems.has(itemId)) {
              visibleItems.add(itemId);

              // Find the item in state to get its type
              let item = null;
              let foundCanvas = null;

              for (const canvasId in canvases) {
                const canvas = canvases[canvasId];
                item = canvas.items.find(i => i.id === itemId);
                if (item) {
                  foundCanvas = canvasId;
                  break;
                }
              }

              if (item && componentTemplates[item.type].complex) {
                // Initialize complex component now that it's visible
                initializeComplexComponent(itemId, item.type);
              }
            }
          } else {
            // Item left viewport - could cleanup here if needed
            // For now we keep it rendered (no flickering on scroll)
            visibleItems.delete(itemId);
          }
        });
      }, {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01 // Trigger when even 1% is visible
      });

      return observer;
    }

    // Global observer instance
    let virtualRenderObserver = null;

    // Initialize complex component behavior
    // OPTIMIZED: Only called when item becomes visible (via Intersection Observer)
    function initializeComplexComponent(itemId, type) {
      const contentEl = document.getElementById(`${itemId}-content`);
      if (!contentEl) return;

      // Check if already initialized (prevent double-init)
      if (contentEl.dataset.initialized === 'true') return;
      contentEl.dataset.initialized = 'true';

      switch(type) {
        case 'gallery':
          // Image Gallery - loads 6 real photos from Lorem Picsum with responsive sizing
          contentEl.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; height: 100%;">
              <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
                <img src="https://picsum.photos/seed/gallery1/400" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 1">
              </div>
              <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
                <img src="https://picsum.photos/seed/gallery2/400" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 2">
              </div>
              <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
                <img src="https://picsum.photos/seed/gallery3/400" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 3">
              </div>
              <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
                <img src="https://picsum.photos/seed/gallery4/400" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 4">
              </div>
              <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
                <img src="https://picsum.photos/seed/gallery5/400" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 5">
              </div>
              <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
                <img src="https://picsum.photos/seed/gallery6/400" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 6">
              </div>
            </div>
          `;
          break;

        case 'dashboard':
          // Dashboard Widget - complex nested DOM structure
          contentEl.innerHTML = `
            <div style="font-size: 11px; line-height: 1.4;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div style="flex: 1; padding: 6px; background: #f0f0f0; border-radius: 3px; margin-right: 4px;">
                  <div style="font-weight: 600; color: #666;">Users</div>
                  <div style="font-size: 16px; font-weight: 700; color: #4A90E2;">2,547</div>
                </div>
                <div style="flex: 1; padding: 6px; background: #f0f0f0; border-radius: 3px;">
                  <div style="font-weight: 600; color: #666;">Revenue</div>
                  <div style="font-size: 16px; font-weight: 700; color: #28a745;">$12.4K</div>
                </div>
              </div>
              <div style="background: #f8f8f8; padding: 8px; border-radius: 3px; margin-bottom: 6px;">
                <div style="font-weight: 600; margin-bottom: 4px;">Activity Chart</div>
                <div style="display: flex; align-items: flex-end; height: 40px; gap: 2px;">
                  <div style="flex: 1; background: #4A90E2; height: 60%;"></div>
                  <div style="flex: 1; background: #4A90E2; height: 80%;"></div>
                  <div style="flex: 1; background: #4A90E2; height: 40%;"></div>
                  <div style="flex: 1; background: #4A90E2; height: 90%;"></div>
                  <div style="flex: 1; background: #4A90E2; height: 70%;"></div>
                  <div style="flex: 1; background: #4A90E2; height: 85%;"></div>
                  <div style="flex: 1; background: #4A90E2; height: 95%;"></div>
                </div>
              </div>
              <div style="font-size: 10px; color: #999;">
                <div>• 24 active sessions</div>
                <div>• 156 page views</div>
                <div>• 89% bounce rate</div>
              </div>
            </div>
          `;
          break;

        case 'livedata':
          // Live Data - simulates polling with DOM updates
          let counter = 0;
          const updateLiveData = () => {
            counter++;
            const temperature = (20 + Math.random() * 10).toFixed(1);
            const cpu = (Math.random() * 100).toFixed(0);
            const memory = (40 + Math.random() * 50).toFixed(0);

            if (contentEl) {
              contentEl.innerHTML = `
                <div style="font-size: 11px;">
                  <div style="margin-bottom: 8px; padding: 6px; background: #e3f2fd; border-radius: 3px;">
                    <div style="font-weight: 600; color: #1976d2;">🌡️ Temperature</div>
                    <div style="font-size: 20px; font-weight: 700; color: #1976d2;">${temperature}°C</div>
                  </div>
                  <div style="margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                      <span style="font-weight: 600;">CPU</span>
                      <span>${cpu}%</span>
                    </div>
                    <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                      <div style="background: #4A90E2; height: 100%; width: ${cpu}%; transition: width 0.5s;"></div>
                    </div>
                  </div>
                  <div style="margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                      <span style="font-weight: 600;">Memory</span>
                      <span>${memory}%</span>
                    </div>
                    <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                      <div style="background: #28a745; height: 100%; width: ${memory}%; transition: width 0.5s;"></div>
                    </div>
                  </div>
                  <div style="font-size: 10px; color: #999; margin-top: 8px;">
                    Updated ${counter} times • Last: ${new Date().toLocaleTimeString()}
                  </div>
                </div>
              `;
            }
          };

          // Initial render
          updateLiveData();

          // Poll every 2 seconds
          const intervalId = setInterval(updateLiveData, 2000);

          // Store interval ID for cleanup
          const element = document.getElementById(itemId);
          if (element) {
            element.setAttribute('data-interval-id', intervalId);
          }
          break;
      }
    }

    // Render item
    function renderItem(item, template) {
      const gridContainer = document.getElementById(item.canvasId);
      const div = document.createElement('div');
      div.className = 'grid-item';
      div.id = item.id;
      div.setAttribute('data-canvas-id', item.canvasId);
      div.setAttribute('data-component-name', item.name || template.title); // Store component name

      const layout = getCurrentLayout(item);
      // Use transform for positioning instead of left/top
      div.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
      div.style.width = layout.width + 'px';
      div.style.height = layout.height + 'px';
      div.style.zIndex = item.zIndex;

      // Render complex or simple content
      // OPTIMIZED: Complex components get placeholder, content loaded when visible
      if (template.complex) {
        div.innerHTML = `
          <div class="drag-handle"></div>
          <div class="grid-item-header">${template.icon} ${item.name || template.title}</div>
          <div class="grid-item-content" id="${item.id}-content">
            <div class="loading-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 12px;">
              Loading...
            </div>
          </div>
          <div class="grid-item-controls">
            <button class="grid-item-control-btn" onclick="bringToFront('${item.id}', '${item.canvasId}')" title="Bring to Front">⬆️</button>
            <button class="grid-item-control-btn" onclick="sendToBack('${item.id}', '${item.canvasId}')" title="Send to Back">⬇️</button>
            <button class="grid-item-delete" onclick="deleteItem('${item.id}', '${item.canvasId}')">×</button>
          </div>
          <div class="resize-handle nw"></div>
          <div class="resize-handle ne"></div>
          <div class="resize-handle sw"></div>
          <div class="resize-handle se"></div>
          <div class="resize-handle n"></div>
          <div class="resize-handle s"></div>
          <div class="resize-handle e"></div>
          <div class="resize-handle w"></div>
        `;
      } else {
        div.innerHTML = `
          <div class="drag-handle"></div>
          <div class="grid-item-header">${template.icon} ${item.name || template.title}</div>
          <div class="grid-item-content">${template.content}</div>
          <div class="grid-item-controls">
            <button class="grid-item-control-btn" onclick="bringToFront('${item.id}', '${item.canvasId}')" title="Bring to Front">⬆️</button>
            <button class="grid-item-control-btn" onclick="sendToBack('${item.id}', '${item.canvasId}')" title="Send to Back">⬇️</button>
            <button class="grid-item-delete" onclick="deleteItem('${item.id}', '${item.canvasId}')">×</button>
          </div>
          <div class="resize-handle nw"></div>
          <div class="resize-handle ne"></div>
          <div class="resize-handle sw"></div>
          <div class="resize-handle se"></div>
          <div class="resize-handle n"></div>
          <div class="resize-handle s"></div>
          <div class="resize-handle e"></div>
          <div class="resize-handle w"></div>
        `;
      }

      // Click to open config panel
      div.addEventListener('click', (e) => {
        // Don't open config panel if clicking on drag handle, resize handle, delete button, or control buttons
        if (e.target.classList.contains('drag-handle') ||
            e.target.closest('.drag-handle') ||
            e.target.classList.contains('resize-handle') ||
            e.target.classList.contains('grid-item-delete') ||
            e.target.classList.contains('grid-item-control-btn')) {
          return;
        }
        openConfigPanel(item.id, item.canvasId);
      });

      gridContainer.appendChild(div);

      // OPTIMIZED: Instead of immediately initializing, observe for lazy loading
      if (template.complex && virtualRenderObserver) {
        virtualRenderObserver.observe(div);
      }

      // Make draggable
      makeItemDraggable(div, item);

      // Make resizable
      makeItemResizable(div, item);
    }

    // Extract position from transform string
    // Returns {x: number, y: number} or {x: 0, y: 0} if no transform
    function getTransformPosition(element) {
      const transform = element.style.transform;
      if (!transform || transform === 'none') {
        return { x: 0, y: 0 };
      }

      // Match translate(Xpx, Ypx) pattern
      const match = transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
      if (match) {
        return {
          x: parseFloat(match[1]),
          y: parseFloat(match[2])
        };
      }

      return { x: 0, y: 0 };
    }

    // Make item draggable
    function makeItemDraggable(element, item) {
      let basePosition = { x: 0, y: 0 };

      interact(element)
        .draggable({
          allowFrom: '.drag-handle', // Only allow drag from drag handle
          inertia: false,
          listeners: {
            start(event) {
              event.target.classList.add('dragging');
              selectItem(item.id, item.canvasId);

              // Store the base position from transform
              basePosition = getTransformPosition(event.target);

              // Reset accumulation
              event.target.setAttribute('data-x', 0);
              event.target.setAttribute('data-y', 0);
            },

            move(event) {
              const x = (parseFloat(event.target.getAttribute('data-x')) || 0) + event.dx;
              const y = (parseFloat(event.target.getAttribute('data-y')) || 0) + event.dy;

              // Apply drag delta to base position - no RAF needed, interact.js already throttles
              event.target.style.transform = `translate(${basePosition.x + x}px, ${basePosition.y + y}px)`;
              event.target.setAttribute('data-x', x);
              event.target.setAttribute('data-y', y);
            },

            end(event) {

              event.target.classList.remove('dragging');

              const deltaX = parseFloat(event.target.getAttribute('data-x')) || 0;
              const deltaY = parseFloat(event.target.getAttribute('data-y')) || 0;

              // Get the element's current position in viewport
              const rect = event.target.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;

              // Find which canvas the center of the item is over
              const oldCanvasId = item.canvasId;
              let targetCanvasId = item.canvasId;
              gridContainers.forEach(container => {
                const containerRect = container.getBoundingClientRect();
                if (centerX >= containerRect.left && centerX <= containerRect.right &&
                    centerY >= containerRect.top && centerY <= containerRect.bottom) {
                  targetCanvasId = container.getAttribute('data-canvas-id');
                }
              });

              // Calculate new position relative to target canvas
              const targetContainer = document.getElementById(targetCanvasId);
              const targetRect = targetContainer.getBoundingClientRect();
              const gridSizeX = getGridSizeHorizontal(targetCanvasId);
              const gridSizeY = getGridSizeVertical();

              // Final position is base position + drag delta
              let newX = basePosition.x + deltaX;
              let newY = basePosition.y + deltaY;

              // If canvas changed, need to adjust for the relative position to new canvas
              if (targetCanvasId !== oldCanvasId) {
                // Get position in viewport coordinates and convert to new canvas coordinates
                newX = rect.left - targetRect.left;
                newY = rect.top - targetRect.top;
              }

              // Snap to grid (separate X and Y)
              newX = Math.round(newX / gridSizeX) * gridSizeX;
              newY = Math.round(newY / gridSizeY) * gridSizeY;

              // Ensure item stays fully within target canvas
              const itemWidth = parseFloat(event.target.style.width) || 0;
              const itemHeight = parseFloat(event.target.style.height) || 0;
              newX = Math.max(0, Math.min(newX, targetContainer.clientWidth - itemWidth));
              newY = Math.max(0, Math.min(newY, targetContainer.clientHeight - itemHeight));

              // Snap to canvas edges if within threshold (20px)
              const EDGE_SNAP_THRESHOLD = 20;
              if (newX < EDGE_SNAP_THRESHOLD) {
                newX = 0; // Snap to left edge
              } else if (newX > targetContainer.clientWidth - itemWidth - EDGE_SNAP_THRESHOLD) {
                newX = targetContainer.clientWidth - itemWidth; // Snap to right edge
              }
              if (newY < EDGE_SNAP_THRESHOLD) {
                newY = 0; // Snap to top edge
              } else if (newY > targetContainer.clientHeight - itemHeight - EDGE_SNAP_THRESHOLD) {
                newY = targetContainer.clientHeight - itemHeight; // Snap to bottom edge
              }

              // Save old state for undo before changing
              const oldLayout = JSON.parse(JSON.stringify(item.layouts[currentViewport]));
              // oldCanvasId already declared above at line 1232

              // If canvas changed, move item to new canvas
              if (targetCanvasId !== item.canvasId) {
                const oldCanvas = canvases[item.canvasId];
                const newCanvas = canvases[targetCanvasId];

                // Remove from old canvas
                oldCanvas.items = oldCanvas.items.filter(i => i.id !== item.id);

                // Update item canvas
                item.canvasId = targetCanvasId;

                // Add to new canvas
                newCanvas.items.push(item);

                // Move DOM element to new container
                event.target.remove();
                targetContainer.appendChild(event.target);

                // Update data attribute
                event.target.setAttribute('data-canvas-id', targetCanvasId);

                // Update control buttons to use new canvas ID
                const controlsDiv = event.target.querySelector('.grid-item-controls');
                if (controlsDiv) {
                  controlsDiv.innerHTML = `
                    <button class="grid-item-control-btn" onclick="bringToFront('${item.id}', '${targetCanvasId}')" title="Bring to Front">⬆️</button>
                    <button class="grid-item-control-btn" onclick="sendToBack('${item.id}', '${targetCanvasId}')" title="Send to Back">⬇️</button>
                    <button class="grid-item-delete" onclick="deleteItem('${item.id}', '${targetCanvasId}')">×</button>
                  `;
                }
              }

              // Update item position in current viewport's layout (convert to grid units)
              const layout = item.layouts[currentViewport];
              layout.x = pixelsToGridX(newX, targetCanvasId);
              layout.y = pixelsToGridY(newY);

              // If in mobile view, mark as customized
              if (currentViewport === 'mobile') {
                item.layouts.mobile.customized = true;
                // Set width/height if not already set (copy from desktop)
                if (item.layouts.mobile.width === null) {
                  item.layouts.mobile.width = item.layouts.desktop.width;
                  item.layouts.mobile.height = item.layouts.desktop.height;
                }
                // Clear cache since customization affects layout
                clearMobileLayoutCache(targetCanvasId);
                if (targetCanvasId !== oldCanvasId) {
                  clearMobileLayoutCache(oldCanvasId);
                }
              }

              // Save new state and push undo command
              const newLayout = JSON.parse(JSON.stringify(item.layouts[currentViewport]));
              const newCanvasId = targetCanvasId;

              pushCommand({
                undo: () => {
                  // Restore old layout
                  item.layouts[currentViewport] = JSON.parse(JSON.stringify(oldLayout));

                  // If canvas changed, move item back
                  if (newCanvasId !== oldCanvasId) {
                    const newCanvas = canvases[newCanvasId];
                    const oldCanvas = canvases[oldCanvasId];
                    newCanvas.items = newCanvas.items.filter(i => i.id !== item.id);
                    oldCanvas.items.push(item);
                    item.canvasId = oldCanvasId;

                    // Move DOM element back
                    const element = document.getElementById(item.id);
                    const oldContainer = document.getElementById(oldCanvasId);
                    if (element && oldContainer) {
                      element.remove();
                      oldContainer.appendChild(element);
                      element.setAttribute('data-canvas-id', oldCanvasId);
                    }
                  }

                  // Update DOM with old position
                  const element = document.getElementById(item.id);
                  if (element) {
                    const layout = getCurrentLayout(item);
                    element.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
                  }

                  // Clear cache and update heights if needed
                  clearMobileLayoutCache(item.canvasId);
                  if (currentViewport === 'mobile') {
                    const gridContainer = document.getElementById(item.canvasId);
                    const requiredHeight = calculateCanvasHeight(item.canvasId);
                    gridContainer.style.minHeight = requiredHeight + 'px';
                  }
                },
                redo: () => {
                  // Restore new layout
                  item.layouts[currentViewport] = JSON.parse(JSON.stringify(newLayout));

                  // If canvas changed, move item forward
                  if (newCanvasId !== oldCanvasId) {
                    const oldCanvas = canvases[oldCanvasId];
                    const newCanvas = canvases[newCanvasId];
                    oldCanvas.items = oldCanvas.items.filter(i => i.id !== item.id);
                    newCanvas.items.push(item);
                    item.canvasId = newCanvasId;

                    // Move DOM element forward
                    const element = document.getElementById(item.id);
                    const newContainer = document.getElementById(newCanvasId);
                    if (element && newContainer) {
                      element.remove();
                      newContainer.appendChild(element);
                      element.setAttribute('data-canvas-id', newCanvasId);
                    }
                  }

                  // Update DOM with new position
                  const element = document.getElementById(item.id);
                  if (element) {
                    const layout = getCurrentLayout(item);
                    element.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
                  }

                  // Clear cache and update heights if needed
                  clearMobileLayoutCache(item.canvasId);
                  if (currentViewport === 'mobile') {
                    const gridContainer = document.getElementById(item.canvasId);
                    const requiredHeight = calculateCanvasHeight(item.canvasId);
                    gridContainer.style.minHeight = requiredHeight + 'px';
                  }
                }
              });

              // Commit to transform-based position (no left/top)
              event.target.style.transform = `translate(${newX}px, ${newY}px)`;
              event.target.removeAttribute('data-x');
              event.target.removeAttribute('data-y');

              // Update selected canvas if this item is selected
              if (selectedItemId === item.id) {
                selectedCanvasId = targetCanvasId;
              }

              // Update canvas heights if in mobile view
              if (currentViewport === 'mobile') {
                // Update target canvas height (may be same as old or different)
                const requiredHeight = calculateCanvasHeight(targetCanvasId);
                targetContainer.style.minHeight = requiredHeight + 'px';

                // If canvas changed, also update old canvas height
                if (targetCanvasId !== oldCanvasId) {
                  const oldGridContainer = document.getElementById(oldCanvasId);
                  const oldRequiredHeight = calculateCanvasHeight(oldCanvasId);
                  oldGridContainer.style.minHeight = oldRequiredHeight + 'px';
                }
              }
            }
          }
        });
    }

    // Make item resizable
    function makeItemResizable(element, item) {
      let resizeRafId = null;
      let startRect = { x: 0, y: 0, width: 0, height: 0 };

      interact(element)
        .resizable({
          edges: { left: true, right: true, bottom: true, top: true },

          modifiers: [
            // FIXED: Use Interact.js snap modifier with endOnly to prevent initial jump
            // This snaps only when resize ends, not during the resize
            interact.modifiers.snap({
              targets: [
                interact.snappers.grid({
                  x: () => getGridSizeHorizontal(item.canvasId),
                  y: () => getGridSizeVertical()
                })
              ],
              range: Infinity,
              endOnly: true
            }),
            interact.modifiers.restrictSize({
              min: { width: 100, height: 80 }
            }),
            interact.modifiers.restrictEdges({
              outer: 'parent'
            })
          ],

          listeners: {
            start(event) {
              event.target.classList.add('resizing');

              // Store the starting position and size
              const position = getTransformPosition(event.target);
              startRect.x = position.x;
              startRect.y = position.y;
              startRect.width = parseFloat(event.target.style.width) || 0;
              startRect.height = parseFloat(event.target.style.height) || 0;
            },

            move(event) {
              // Cancel any pending frame
              if (resizeRafId) {
                cancelAnimationFrame(resizeRafId);
              }

              // Batch DOM updates with requestAnimationFrame
              resizeRafId = requestAnimationFrame(() => {
                // Use deltaRect to accumulate changes instead of absolute positions
                // This prevents jumping when endOnly snap is used
                const dx = event.deltaRect.left;
                const dy = event.deltaRect.top;
                const dw = event.deltaRect.width;
                const dh = event.deltaRect.height;

                // Update stored rect
                startRect.x += dx;
                startRect.y += dy;
                startRect.width += dw;
                startRect.height += dh;

                // Update DOM
                event.target.style.transform = `translate(${startRect.x}px, ${startRect.y}px)`;
                event.target.style.width = startRect.width + 'px';
                event.target.style.height = startRect.height + 'px';

                resizeRafId = null;
              });
            },

            end(event) {
              // Cancel any pending frame
              if (resizeRafId) {
                cancelAnimationFrame(resizeRafId);
                resizeRafId = null;
              }

              event.target.classList.remove('resizing');

              // Clean up data attributes
              event.target.removeAttribute('data-x');
              event.target.removeAttribute('data-y');
              event.target.removeAttribute('data-width');
              event.target.removeAttribute('data-height');

              // Use event.rect for final snapped values (snap modifier applies with endOnly: true)
              const newX = event.rect.left;
              const newY = event.rect.top;
              const newWidth = event.rect.width;
              const newHeight = event.rect.height;

              // Apply snapped final position
              event.target.style.transform = `translate(${newX}px, ${newY}px)`;
              event.target.style.width = newWidth + 'px';
              event.target.style.height = newHeight + 'px';

              // Save old state for undo before changing
              const oldLayout = JSON.parse(JSON.stringify(item.layouts[currentViewport]));

              // Update item size and position in current viewport's layout (convert to grid units)
              const layout = item.layouts[currentViewport];
              layout.width = pixelsToGridX(newWidth, item.canvasId);
              layout.height = pixelsToGridY(newHeight);
              layout.x = pixelsToGridX(newX, item.canvasId);
              layout.y = pixelsToGridY(newY);

              // If in mobile view, mark as customized
              if (currentViewport === 'mobile') {
                item.layouts.mobile.customized = true;

                // Clear cache since customization affects layout
                clearMobileLayoutCache(item.canvasId);

                // Update canvas height to fit resized item
                const gridContainer = document.getElementById(item.canvasId);
                const requiredHeight = calculateCanvasHeight(item.canvasId);
                gridContainer.style.minHeight = requiredHeight + 'px';
              }

              // Save new state and push undo command
              const newLayout = JSON.parse(JSON.stringify(item.layouts[currentViewport]));

              pushCommand({
                undo: () => {
                  // Restore old layout
                  item.layouts[currentViewport] = JSON.parse(JSON.stringify(oldLayout));

                  // Update DOM with old size and position
                  const element = document.getElementById(item.id);
                  if (element) {
                    const layout = getCurrentLayout(item);
                    element.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
                    element.style.width = layout.width + 'px';
                    element.style.height = layout.height + 'px';
                  }

                  // Clear cache and update heights if needed
                  clearMobileLayoutCache(item.canvasId);
                  if (currentViewport === 'mobile') {
                    const gridContainer = document.getElementById(item.canvasId);
                    const requiredHeight = calculateCanvasHeight(item.canvasId);
                    gridContainer.style.minHeight = requiredHeight + 'px';
                  }
                },
                redo: () => {
                  // Restore new layout
                  item.layouts[currentViewport] = JSON.parse(JSON.stringify(newLayout));

                  // Update DOM with new size and position
                  const element = document.getElementById(item.id);
                  if (element) {
                    const layout = getCurrentLayout(item);
                    element.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
                    element.style.width = layout.width + 'px';
                    element.style.height = layout.height + 'px';
                  }

                  // Clear cache and update heights if needed
                  clearMobileLayoutCache(item.canvasId);
                  if (currentViewport === 'mobile') {
                    const gridContainer = document.getElementById(item.canvasId);
                    const requiredHeight = calculateCanvasHeight(item.canvasId);
                    gridContainer.style.minHeight = requiredHeight + 'px';
                  }
                }
              });

              // Commit to transform-based position (no left/top)
              event.target.style.transform = `translate(${newX}px, ${newY}px)`;
              event.target.style.width = newWidth + 'px';
              event.target.style.height = newHeight + 'px';
              event.target.removeAttribute('data-x');
              event.target.removeAttribute('data-y');
            }
          }
        });
    }

    // Select item
    function selectItem(id, canvasId) {
      // Deselect all
      document.querySelectorAll('.grid-item').forEach(el => {
        el.classList.remove('selected');
      });

      // Select the clicked item
      const element = document.getElementById(id);
      if (element) {
        element.classList.add('selected');
        selectedItemId = id;
        selectedCanvasId = canvasId;
      }
    }

    // Delete item
    function deleteItem(id, canvasId, skipHistory = false) {
      const element = document.getElementById(id);
      if (element) {
        const canvas = canvases[canvasId];
        const item = canvas.items.find(i => i.id === id);

        if (!skipHistory && item) {
          // Save command for undo
          const deletedItem = JSON.parse(JSON.stringify(item)); // Deep clone
          const wasSelected = selectedItemId === id;

          pushCommand({
            undo: () => {
              // Restore the item
              canvas.items.push(deletedItem);
              const template = componentTemplates[deletedItem.type];
              renderItem(deletedItem, template);
              if (wasSelected) {
                selectItem(deletedItem.id, canvasId);
              }
              updateItemCount();
              clearMobileLayoutCache(canvasId);
              if (currentViewport === 'mobile') {
                const gridContainer = document.getElementById(canvasId);
                const requiredHeight = calculateCanvasHeight(canvasId);
                gridContainer.style.minHeight = requiredHeight + 'px';
              }
            },
            redo: () => {
              deleteItem(id, canvasId, true);
            }
          });
        }

        // OPTIMIZED: Stop observing this element
        if (virtualRenderObserver) {
          virtualRenderObserver.unobserve(element);
        }
        visibleItems.delete(id);

        // Clear any polling intervals for complex components
        const intervalId = element.getAttribute('data-interval-id');
        if (intervalId) {
          clearInterval(parseInt(intervalId));
        }

        element.remove();
        canvas.items = canvas.items.filter(item => item.id !== id);
        if (selectedItemId === id) {
          selectedItemId = null;
          selectedCanvasId = null;
        }

        // Clear mobile layout cache since items changed
        clearMobileLayoutCache(canvasId);

        // Update canvas height if in mobile view
        if (currentViewport === 'mobile') {
          const gridContainer = document.getElementById(canvasId);
          const requiredHeight = calculateCanvasHeight(canvasId);
          gridContainer.style.minHeight = requiredHeight + 'px';
        }

        // Update item count
        updateItemCount();
      }
    }

    // Bring item to front
    function bringToFront(id, canvasId) {
      const canvas = canvases[canvasId];
      const item = canvas.items.find(i => i.id === id);
      if (item) {
        item.zIndex = ++canvas.zIndexCounter;
        const element = document.getElementById(id);
        if (element) {
          element.style.zIndex = item.zIndex;
        }
      }
    }

    // Send item to back
    function sendToBack(id, canvasId) {
      const canvas = canvases[canvasId];
      const item = canvas.items.find(i => i.id === id);
      if (item) {
        // Find the lowest z-index, but never go below 1
        const minZIndex = Math.min(...canvas.items.map(i => i.zIndex));
        item.zIndex = Math.max(1, minZIndex - 1);

        // If the item is already at the back, reorder all z-indexes
        if (minZIndex <= 1) {
          // Sort items by current z-index
          const sortedItems = [...canvas.items].sort((a, b) => a.zIndex - b.zIndex);

          // Reassign z-indexes starting from 1, with this item first
          sortedItems.forEach((itm, index) => {
            if (itm.id === id) {
              itm.zIndex = 1;
              const elem = document.getElementById(itm.id);
              if (elem) elem.style.zIndex = 1;
            } else {
              itm.zIndex = index + 2;
              const elem = document.getElementById(itm.id);
              if (elem) elem.style.zIndex = itm.zIndex;
            }
          });
        } else {
          const element = document.getElementById(id);
          if (element) {
            element.style.zIndex = item.zIndex;
          }
        }
      }
    }

    // Bring item forward (increment z-index by 1)
    function bringForward(id, canvasId) {
      const canvas = canvases[canvasId];
      const item = canvas.items.find(i => i.id === id);
      if (item) {
        // Find items with z-index greater than current
        const itemsAbove = canvas.items.filter(i => i.zIndex > item.zIndex);
        if (itemsAbove.length > 0) {
          // Get the lowest z-index above this item
          const nextZIndex = Math.min(...itemsAbove.map(i => i.zIndex));
          // Swap z-indexes
          const itemAbove = canvas.items.find(i => i.zIndex === nextZIndex);
          if (itemAbove) {
            const temp = item.zIndex;
            item.zIndex = itemAbove.zIndex;
            itemAbove.zIndex = temp;

            // Update DOM
            const element = document.getElementById(id);
            const elementAbove = document.getElementById(itemAbove.id);
            if (element) element.style.zIndex = item.zIndex;
            if (elementAbove) elementAbove.style.zIndex = itemAbove.zIndex;
          }
        }
      }
    }

    // Send item backward (decrement z-index by 1)
    function sendBackward(id, canvasId) {
      const canvas = canvases[canvasId];
      const item = canvas.items.find(i => i.id === id);
      if (item) {
        // Find items with z-index less than current
        const itemsBelow = canvas.items.filter(i => i.zIndex < item.zIndex);
        if (itemsBelow.length > 0) {
          // Get the highest z-index below this item
          const prevZIndex = Math.max(...itemsBelow.map(i => i.zIndex));
          // Swap z-indexes
          const itemBelow = canvas.items.find(i => i.zIndex === prevZIndex);
          if (itemBelow) {
            const temp = item.zIndex;
            item.zIndex = itemBelow.zIndex;
            itemBelow.zIndex = temp;

            // Update DOM
            const element = document.getElementById(id);
            const elementBelow = document.getElementById(itemBelow.id);
            if (element) element.style.zIndex = item.zIndex;
            if (elementBelow) elementBelow.style.zIndex = itemBelow.zIndex;
          }
        }
      }
    }

    // Nudge item with keyboard
    // dx and dy are in grid units (1 = one grid cell)
    function nudgeItem(id, canvasId, dx, dy) {
      const canvas = canvases[canvasId];
      const item = canvas.items.find(i => i.id === id);
      if (item) {
        const layout = item.layouts[currentViewport];

        // If mobile and not customized, need to customize it first
        if (currentViewport === 'mobile' && !layout.customized) {
          // Get the cached auto-layout
          const cacheKey = `${canvasId}-${item.id}`;
          if (!mobileAutoLayoutCache[cacheKey]) {
            calculateAllMobileAutoLayouts(canvasId);
          }
          const autoLayout = mobileAutoLayoutCache[cacheKey];

          // Convert pixels to grid units and store
          layout.x = pixelsToGridX(autoLayout.x, canvasId);
          layout.y = pixelsToGridY(autoLayout.y);
          layout.width = pixelsToGridX(autoLayout.width, canvasId);
          layout.height = pixelsToGridY(autoLayout.height);
          layout.customized = true;

          // Clear cache since we just customized
          clearMobileLayoutCache(canvasId);
        }

        // Move by grid units
        layout.x += dx;
        layout.y += dy;

        // Get container bounds to ensure item stays fully within (in grid units)
        const container = document.getElementById(canvasId);
        const containerWidthInGrids = pixelsToGridX(container.clientWidth, canvasId);
        const containerHeightInGrids = pixelsToGridY(container.clientHeight);

        // Keep within bounds - ensure item stays fully visible
        layout.x = Math.max(0, Math.min(layout.x, containerWidthInGrids - layout.width));
        layout.y = Math.max(0, Math.min(layout.y, containerHeightInGrids - layout.height));

        // Update DOM using transform (convert to pixels)
        const element = document.getElementById(id);
        if (element) {
          const x = gridToPixelsX(layout.x, canvasId);
          const y = gridToPixelsY(layout.y);
          element.style.transform = `translate(${x}px, ${y}px)`;
        }

        // Update canvas height if in mobile view
        if (currentViewport === 'mobile') {
          const gridContainer = document.getElementById(canvasId);
          const requiredHeight = calculateCanvasHeight(canvasId);
          gridContainer.style.minHeight = requiredHeight + 'px';
        }
      }
    }

    // Get grid position from mouse coordinates
    function getGridPosition(clientX, clientY, canvasId) {
      const gridContainer = document.getElementById(canvasId);
      const rect = gridContainer.getBoundingClientRect();
      const gridSizeX = getGridSizeHorizontal(canvasId);
      const gridSizeY = getGridSizeVertical();

      // Get cursor position relative to container
      let x = clientX - rect.left;
      let y = clientY - rect.top;

      // Snap to grid (separate X and Y)
      x = Math.round(x / gridSizeX) * gridSizeX;
      y = Math.round(y / gridSizeY) * gridSizeY;

      // Keep within bounds
      x = Math.max(0, x);
      y = Math.max(0, y);

      return { x, y };
    }

    // Open configuration panel
    function openConfigPanel(itemId, canvasId) {
      const canvas = canvases[canvasId];
      const item = canvas.items.find(i => i.id === itemId);
      if (!item) return;

      selectedConfigItem = itemId;
      selectedCanvasId = canvasId;

      // Populate form
      document.getElementById('componentName').value = item.name || '';

      // Show panel
      document.getElementById('configPanel').classList.add('open');

      // Add selected visual state
      document.querySelectorAll('.grid-item').forEach(el => el.classList.remove('selected'));
      const element = document.getElementById(itemId);
      if (element) {
        element.classList.add('selected');
      }
    }

    // Close configuration panel
    function closeConfigPanel() {
      document.getElementById('configPanel').classList.remove('open');
      if (selectedConfigItem) {
        const element = document.getElementById(selectedConfigItem);
        if (element) {
          element.classList.remove('selected');
        }
      }
      selectedConfigItem = null;
    }

    // Save configuration changes
    function saveConfig() {
      if (!selectedConfigItem || !selectedCanvasId) return;

      const canvas = canvases[selectedCanvasId];
      const item = canvas.items.find(i => i.id === selectedConfigItem);
      if (!item) return;

      const newName = document.getElementById('componentName').value.trim();
      if (newName) {
        item.name = newName;

        // Update the DOM
        const element = document.getElementById(selectedConfigItem);
        if (element) {
          element.setAttribute('data-component-name', newName);
          const header = element.querySelector('.grid-item-header');
          if (header) {
            // Extract the icon (emoji) from the current header
            const template = componentTemplates[item.type];
            header.textContent = `${template.icon} ${newName}`;
          }
        }
      }

      closeConfigPanel();
    }

    // Calculate required height for a canvas in current viewport
    function calculateCanvasHeight(canvasId) {
      const canvas = canvases[canvasId];
      let maxBottom = 400; // minimum height

      canvas.items.forEach(item => {
        const layout = getCurrentLayout(item);
        const bottom = layout.y + layout.height;
        maxBottom = Math.max(maxBottom, bottom);
      });

      // Add some padding at the bottom
      return maxBottom + 40;
    }

    // Switch viewport
    function switchViewport(viewport) {
      currentViewport = viewport;

      // Update button states
      document.getElementById('desktopView').classList.toggle('active', viewport === 'desktop');
      document.getElementById('mobileView').classList.toggle('active', viewport === 'mobile');

      // Update container class
      const container = document.querySelector('.canvases-container');
      container.classList.toggle('mobile-view', viewport === 'mobile');

      // Re-render all items with current viewport layout
      Object.keys(canvases).forEach(canvasId => {
        const canvas = canvases[canvasId];
        const gridContainer = document.getElementById(canvasId);

        // Clear and re-render all items using transform
        canvas.items.forEach(item => {
          const element = document.getElementById(item.id);
          if (element) {
            const layout = getCurrentLayout(item);
            element.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
            element.style.width = layout.width + 'px';
            element.style.height = layout.height + 'px';
          }
        });

        // Update canvas height to fit all items
        const requiredHeight = calculateCanvasHeight(canvasId);
        gridContainer.style.minHeight = requiredHeight + 'px';
      });

      // Deselect items when switching
      selectedItemId = null;
      selectedCanvasId = null;
      document.querySelectorAll('.grid-item').forEach(el => {
        el.classList.remove('selected');
      });
    }

    // Viewport toggle handlers
    document.getElementById('desktopView').addEventListener('click', function() {
      switchViewport('desktop');
    });

    document.getElementById('mobileView').addEventListener('click', function() {
      switchViewport('mobile');
    });

    // Toggle grid visibility
    document.getElementById('toggleGrid').addEventListener('click', function() {
      showGrid = !showGrid;
      gridContainers.forEach(container => {
        container.classList.toggle('hide-grid', !showGrid);
      });
      this.classList.toggle('active', showGrid);
      this.textContent = showGrid ? 'Show Grid' : 'Hide Grid';
    });

    // Background color pickers
    document.querySelectorAll('.canvas-bg-color').forEach(colorPicker => {
      colorPicker.addEventListener('input', function(e) {
        const canvasId = e.target.getAttribute('data-canvas');
        const gridContainer = document.getElementById(canvasId);
        if (gridContainer) {
          gridContainer.style.backgroundColor = e.target.value;
        }
      });
    });

    // Clear canvas buttons
    document.querySelectorAll('.clear-canvas-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const canvasId = this.getAttribute('data-canvas');
        if (confirm(`Are you sure you want to clear all items from this canvas?`)) {
          const canvas = canvases[canvasId];
          const gridContainer = document.getElementById(canvasId);

          // Remove all items from DOM
          canvas.items.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) element.remove();
          });

          // Clear items array
          canvas.items = [];

          // Clear mobile layout cache
          clearMobileLayoutCache(canvasId);

          // Clear selection if it was on this canvas
          if (selectedCanvasId === canvasId) {
            selectedItemId = null;
            selectedCanvasId = null;
          }

          // Reset canvas height to minimum
          gridContainer.style.minHeight = '400px';
        }
      });
    });

    // Export state
    document.getElementById('exportState').addEventListener('click', function() {
      const state = {
        canvases: Object.keys(canvases).reduce((acc, canvasId) => {
          acc[canvasId] = {
            items: canvases[canvasId].items.map(({ id, canvasId, type, layouts, zIndex }) =>
              ({ id, canvasId, type, layouts, zIndex }))
          };
          return acc;
        }, {}),
        currentViewport: currentViewport,
        timestamp: new Date().toISOString()
      };

      console.log('Grid State:', state);
      const totalItems = Object.values(canvases).reduce((sum, canvas) => sum + canvas.items.length, 0);
      alert('Grid state exported to console!\n\nTotal Items: ' + totalItems + '\nViewport: ' + currentViewport);
    });

    // Update item count display
    function updateItemCount() {
      const totalItems = Object.values(canvases).reduce((sum, canvas) => sum + canvas.items.length, 0);
      document.getElementById('itemCount').textContent = totalItems + ' items';
    }

    // Stress test: Add many items
    document.getElementById('addStressTest').addEventListener('click', function() {
      const count = parseInt(document.getElementById('stressTestCount').value) || 50;
      const componentTypes = Object.keys(componentTemplates);
      const canvasIds = Object.keys(canvases);

      console.time('Add ' + count + ' items');

      // Batch add items without rendering
      const itemsToAdd = [];
      for (let i = 0; i < count; i++) {
        const canvasId = canvasIds[i % canvasIds.length]; // Distribute across canvases
        const type = componentTypes[Math.floor(Math.random() * componentTypes.length)];

        const container = document.getElementById(canvasId);
        const gridSizeX = getGridSizeHorizontal(canvasId);
        const gridSizeY = getGridSizeVertical();

        // Random size (snap to grid)
        const widthGrids = 8 + Math.floor(Math.random() * 8); // 8-15 grid units
        const heightGrids = 5 + Math.floor(Math.random() * 5); // 5-9 grid units
        const width = widthGrids * gridSizeX;
        const height = heightGrids * gridSizeY;

        // Random position within canvas bounds (ensuring item stays fully inside)
        const maxX = container.clientWidth - width;
        const maxY = 400 - height; // Keep within visible area
        let x = Math.floor(Math.random() * maxX);
        let y = Math.floor(Math.random() * maxY);

        // Snap to grid
        x = Math.round(x / gridSizeX) * gridSizeX;
        y = Math.round(y / gridSizeY) * gridSizeY;

        // Ensure still within bounds after snapping
        x = Math.max(0, Math.min(x, container.clientWidth - width));
        y = Math.max(0, Math.min(y, 400 - height));

        const item = addItemToGrid(canvasId, type, x, y, width, height, null, true);
        itemsToAdd.push({ item, canvasId });
      }

      // Batch render all items per canvas
      canvasIds.forEach(canvasId => {
        batchRenderItems(canvasId);
      });

      console.timeEnd('Add ' + count + ' items');
      updateItemCount();

      alert(`Added ${count} items!\nCheck console for timing.`);
    });

    // Clear all items from all canvases
    document.getElementById('clearAll').addEventListener('click', function() {
      const totalItems = Object.values(canvases).reduce((sum, canvas) => sum + canvas.items.length, 0);

      if (totalItems === 0) {
        alert('No items to clear!');
        return;
      }

      if (confirm(`Clear all ${totalItems} items from all canvases?`)) {
        console.time('Clear all items');

        Object.keys(canvases).forEach(canvasId => {
          const canvas = canvases[canvasId];
          const gridContainer = document.getElementById(canvasId);

          // Remove all items from DOM
          canvas.items.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) element.remove();
          });

          // Clear items array
          canvas.items = [];

          // Clear mobile layout cache
          clearMobileLayoutCache(canvasId);

          // Reset canvas height
          if (currentViewport === 'mobile') {
            gridContainer.style.minHeight = '400px';
          }
        });

        console.timeEnd('Clear all items');
        updateItemCount();
      }
    });

    // Add section
    document.getElementById('addSection').addEventListener('click', function() {
      sectionCounter++;
      const newCanvasId = 'canvas' + sectionCounter;
      const sectionNumber = sectionCounter;

      // Add to canvases state
      canvases[newCanvasId] = {
        items: [],
        zIndexCounter: 1
      };

      // Create new section HTML
      const newSection = document.createElement('div');
      newSection.className = 'canvas-item';
      newSection.setAttribute('data-canvas-id', newCanvasId);
      newSection.innerHTML = `
        <div class="canvas-item-header">
          <h3>Section ${sectionNumber}</h3>
          <div class="canvas-controls">
            <label>
              <input type="color" class="canvas-bg-color" data-canvas="${newCanvasId}" value="#ffffff">
            </label>
            <button class="clear-canvas-btn" data-canvas="${newCanvasId}">Clear</button>
            <button class="delete-section-btn" data-canvas="${newCanvasId}" title="Delete Section">🗑️</button>
          </div>
        </div>
        <div class="grid-builder">
          <div class="grid-container" id="${newCanvasId}" data-canvas-id="${newCanvasId}">
            <!-- Grid items will be added here -->
          </div>
        </div>
      `;

      // Add to DOM
      document.querySelector('.canvases-container').appendChild(newSection);

      // Set initial background color
      document.getElementById(newCanvasId).style.backgroundColor = '#ffffff';

      // Initialize interact.js dropzone for new canvas
      const newContainer = document.getElementById(newCanvasId);
      interact(newContainer)
        .dropzone({
          accept: '.palette-item',

          ondrop(event) {
            const componentType = event.relatedTarget.getAttribute('data-component-type');
            const canvasId = event.target.getAttribute('data-canvas-id');
            const dropPosition = getGridPosition(event.dragEvent.clientX, event.dragEvent.clientY, canvasId);

            addItemToGrid(canvasId, componentType, dropPosition.x, dropPosition.y);
          }
        });

      // Add background color picker event listener
      const colorPicker = newSection.querySelector('.canvas-bg-color');
      colorPicker.addEventListener('input', function(e) {
        const canvasId = e.target.getAttribute('data-canvas');
        const gridContainer = document.getElementById(canvasId);
        if (gridContainer) {
          gridContainer.style.backgroundColor = e.target.value;
        }
      });

      // Add clear button event listener
      const clearBtn = newSection.querySelector('.clear-canvas-btn');
      clearBtn.addEventListener('click', function() {
        const canvasId = this.getAttribute('data-canvas');
        if (confirm(`Are you sure you want to clear all items from this canvas?`)) {
          const canvas = canvases[canvasId];
          const gridContainer = document.getElementById(canvasId);

          // Remove all items from DOM
          canvas.items.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) element.remove();
          });

          // Clear items array
          canvas.items = [];

          // Clear mobile layout cache
          clearMobileLayoutCache(canvasId);

          // Clear selection if it was on this canvas
          if (selectedCanvasId === canvasId) {
            selectedItemId = null;
            selectedCanvasId = null;
          }

          // Reset canvas height to minimum
          gridContainer.style.minHeight = '400px';
        }
      });

      // Add deselect on background click
      newContainer.addEventListener('click', function(e) {
        if (e.target === newContainer) {
          document.querySelectorAll('.grid-item').forEach(el => {
            el.classList.remove('selected');
          });
          selectedItemId = null;
          selectedCanvasId = null;
        }
      });

      // Apply grid visibility setting to new canvas
      if (!showGrid) {
        newContainer.classList.add('hide-grid');
      }

      alert(`Section ${sectionNumber} added!`);
    });

    // Delete section (using event delegation)
    document.querySelector('.canvases-container').addEventListener('click', function(e) {
      if (e.target.classList.contains('delete-section-btn')) {
        const canvasId = e.target.getAttribute('data-canvas');
        const canvasItem = e.target.closest('.canvas-item');
        const sectionName = canvasItem.querySelector('h3').textContent;

        // Don't allow deleting the last section
        const totalSections = document.querySelectorAll('.canvas-item').length;
        if (totalSections === 1) {
          alert('Cannot delete the last section!');
          return;
        }

        if (confirm(`Are you sure you want to delete ${sectionName}?\n\nThis will remove all items in this section.`)) {
          const canvas = canvases[canvasId];

          // Remove all items from DOM
          canvas.items.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) {
              // Clear any polling intervals for complex components
              const intervalId = element.getAttribute('data-interval-id');
              if (intervalId) {
                clearInterval(parseInt(intervalId));
              }
              element.remove();
            }
          });

          // Remove from canvases state
          delete canvases[canvasId];

          // Clear mobile layout cache
          clearMobileLayoutCache(canvasId);

          // Clear selection if it was on this canvas
          if (selectedCanvasId === canvasId) {
            selectedItemId = null;
            selectedCanvasId = null;
          }

          // Remove from DOM
          canvasItem.remove();

          // Update item count
          updateItemCount();
        }
      }
    });

    // Initialize item count
    updateItemCount();

    // Deselect on background click
    gridContainers.forEach(container => {
      container.addEventListener('click', function(e) {
        if (e.target === container) {
          document.querySelectorAll('.grid-item').forEach(el => {
            el.classList.remove('selected');
          });
          selectedItemId = null;
          selectedCanvasId = null;
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Undo (Ctrl+Z or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete key
      if (e.key === 'Delete' && selectedItemId && selectedCanvasId) {
        deleteItem(selectedItemId, selectedCanvasId);
      }

      // Escape key
      if (e.key === 'Escape') {
        document.querySelectorAll('.grid-item').forEach(el => {
          el.classList.remove('selected');
        });
        selectedItemId = null;
        selectedCanvasId = null;
      }

      // Arrow keys - nudge selected item
      if (selectedItemId && selectedCanvasId) {
        let dx = 0, dy = 0;

        if (e.key === 'ArrowLeft') {
          dx = -1;
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          dx = 1;
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          dy = -1;
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          dy = 1;
          e.preventDefault();
        }

        if (dx !== 0 || dy !== 0) {
          nudgeItem(selectedItemId, selectedCanvasId, dx, dy);
        }
      }
    });

    // Configuration panel event listeners
    document.getElementById('configPanelClose').addEventListener('click', closeConfigPanel);
    document.getElementById('configPanelCancel').addEventListener('click', closeConfigPanel);
    document.getElementById('configPanelSave').addEventListener('click', saveConfig);

    // Z-index control buttons in config panel
    document.getElementById('sendToFront').addEventListener('click', function() {
      if (selectedConfigItem && selectedCanvasId) {
        bringToFront(selectedConfigItem, selectedCanvasId);
      }
    });

    document.getElementById('bringForward').addEventListener('click', function() {
      if (selectedConfigItem && selectedCanvasId) {
        bringForward(selectedConfigItem, selectedCanvasId);
      }
    });

    document.getElementById('sendBackward').addEventListener('click', function() {
      if (selectedConfigItem && selectedCanvasId) {
        sendBackward(selectedConfigItem, selectedCanvasId);
      }
    });

    document.getElementById('sendToBack').addEventListener('click', function() {
      if (selectedConfigItem && selectedCanvasId) {
        sendToBack(selectedConfigItem, selectedCanvasId);
      }
    });

    // Re-render all components when window resizes
    // Components are stored in grid units, so we need to recalculate pixel positions
    // OPTIMIZED: Clears grid size cache and uses RAF for smooth visual updates
    let resizeTimeout;
    let resizeRafId;

    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);

      // Immediate RAF for visual updates
      if (!resizeRafId) {
        resizeRafId = requestAnimationFrame(() => {
          // Update grid background visual immediately
          resizeRafId = null;
        });
      }

      // Debounced full re-render
      resizeTimeout = setTimeout(() => {
        // Clear grid size cache - forces recalculation
        clearGridSizeCache();

        // Clear all mobile layout caches since grid size changed
        if (currentViewport === 'mobile') {
          Object.keys(canvases).forEach(canvasId => {
            clearMobileLayoutCache(canvasId);
          });
        }

        Object.keys(canvases).forEach(canvasId => {
          const canvas = canvases[canvasId];

          canvas.items.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) {
              const layout = getCurrentLayout(item);
              element.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
              element.style.width = layout.width + 'px';
              element.style.height = layout.height + 'px';
            }
          });

          // Update canvas height if in mobile view
          if (currentViewport === 'mobile') {
            const gridContainer = document.getElementById(canvasId);
            const requiredHeight = calculateCanvasHeight(canvasId);
            gridContainer.style.minHeight = requiredHeight + 'px';
          }
        });
      }, 150);
    });

    // Add some demo items on load
    window.addEventListener('load', function() {
      // OPTIMIZATION: Initialize DOM cache on load
      initDOMCache();

      // OPTIMIZATION: Initialize virtual rendering observer
      virtualRenderObserver = setupVirtualRendering();
      console.log('✅ Virtual rendering enabled - complex components will lazy-load when visible');

      // Set initial background colors
      document.getElementById('canvas1').style.backgroundColor = '#ffffff';
      document.getElementById('canvas2').style.backgroundColor = '#f5f5f5';
      document.getElementById('canvas3').style.backgroundColor = '#ffffff';

      // Section 1 - Hero section demo items (batch add without rendering)
      addItemToGrid('canvas1', 'header', 40, 40, 400, 120, null, true);
      addItemToGrid('canvas1', 'text', 40, 180, 400, 100, null, true);
      addItemToGrid('canvas1', 'button', 40, 300, 180, 80, null, true);
      addItemToGrid('canvas1', 'image', 460, 40, 300, 240, null, true);

      // Batch render all canvas1 items with DocumentFragment
      batchRenderItems('canvas1');

      // Section 2 - Content section demo items (batch add without rendering)
      addItemToGrid('canvas2', 'header', 40, 40, 350, 80, null, true);
      addItemToGrid('canvas2', 'text', 40, 140, 350, 150, null, true);
      addItemToGrid('canvas2', 'video', 420, 40, 340, 250, null, true);

      // Batch render all canvas2 items with DocumentFragment
      batchRenderItems('canvas2');

      // Section 3 - Footer section demo items (batch add without rendering)
      addItemToGrid('canvas3', 'text', 40, 40, 300, 100, null, true);
      addItemToGrid('canvas3', 'button', 360, 40, 150, 80, null, true);
      addItemToGrid('canvas3', 'button', 530, 40, 150, 80, null, true);

      // Batch render all canvas3 items with DocumentFragment
      batchRenderItems('canvas3');

      // Update item count after loading demo items
      updateItemCount();
    });
