    // ========================================
    // MASONRY VARIANT - EXPERIMENTAL
    // ========================================
    //
    // KEY DIFFERENCES FROM OTHER VARIANTS:
    //
    // 1. LAYOUT LIBRARY: Uses Muuri.js for automatic masonry layout
    //    - Items automatically flow and pack efficiently
    //    - No manual positioning required
    //    - Completely different from all other variants
    //
    // 2. FIXED SIZE PRESETS: Items have predefined sizes
    //    - small (150x100), medium (200x150), large (300x200)
    //    - wide (400x150), tall (200x250)
    //    - Users resize by cycling through presets (not free-form)
    //    - Different from all other variants (free-form sizing)
    //
    // 3. NO GRID SNAPPING: Muuri handles all positioning
    //    - No grid units or pixel-to-grid conversion
    //    - Different from all other variants
    //
    // 4. NO UNDO/REDO: Muuri state is complex to serialize
    //    - Would require custom implementation
    //    - Different from all other variants
    //
    // 5. DRAG AND DROP: Custom Muuri drag configuration
    //    - Can drag between different canvases
    //    - Muuri handles all animation and sorting
    //
    // 6. NO VIEWPORT TOGGLE: Single responsive layout
    //    - No desktop/mobile switching
    //    - Different from all other variants
    //
    // PERFORMANCE TARGET: 100-500 items with automatic layout
    // USE CASE: Pinterest-style masonry layout experimentation
    // ========================================

    // State
    const grids = {};
    let itemIdCounter = 0;
    let sectionCounter = 3;
    let selectedItem = null; // Track currently selected/configured item

    // Component templates
    const componentTemplates = {
      header: { icon: '📄', title: 'Header', content: 'This is a header component', size: 'wide' },
      text: { icon: '📝', title: 'Text Block', content: 'This is a text block component', size: 'medium' },
      image: { icon: '🖼️', title: 'Image', content: '<img src="https://picsum.photos/400/300?random=' + Math.random() + '" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" alt="Sample image">', size: 'medium' },
      button: { icon: '🔘', title: 'Button', content: 'Click me!', size: 'small' },
      video: { icon: '🎥', title: 'Video', content: '<div style="width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(\'https://picsum.photos/400/300?random=' + Math.random() + '\') center/cover; border-radius: 4px; display: flex; align-items: center; justify-content: center;"><div style="width: 60px; height: 60px; background: rgba(255,255,255,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="#4A90E2"><path d="M8 5v14l11-7z"/></svg></div></div>', size: 'large' },
      gallery: { icon: '🖼️', title: 'Image Gallery', content: 'Loading images...', complex: true, size: 'large' },
      dashboard: { icon: '📊', title: 'Dashboard Widget', content: 'Dashboard data', complex: true, size: 'large' },
      livedata: { icon: '📡', title: 'Live Data', content: 'Connecting...', complex: true, size: 'tall' }
    };

    // Initialize Muuri grids
    function initializeGrid(canvasId) {
      const container = document.getElementById(canvasId);

      grids[canvasId] = new Muuri(container, {
        items: '.grid-item',
        dragEnabled: true,
        dragSort: function() {
          return Object.values(grids);
        },
        dragSortPredicate: {
          action: 'move',
          threshold: 50
        },
        dragStartPredicate: function(item, event) {
          // Only start drag if clicking on drag handle
          if (event.target.classList.contains('drag-handle') ||
              event.target.closest('.drag-handle')) {
            return Muuri.ItemDrag.defaultStartPredicate(item, event);
          }
          return false;
        },
        dragRelease: {
          duration: 300,
          easing: 'ease-out'
        },
        layout: {
          fillGaps: true,
          horizontal: false,
          alignRight: false,
          alignBottom: false,
          rounding: false
        },
        layoutDuration: 300,
        layoutEasing: 'ease-out'
      });

      // Handle drag end to track which grid the item ended up in
      grids[canvasId].on('dragEnd', function(item) {
        updateItemCount();
      });
    }

    // Create grid item element
    function createGridItem(componentType, size) {
      const template = componentTemplates[componentType];
      const id = 'item-' + (++itemIdCounter);

      const div = document.createElement('div');
      div.className = 'grid-item';
      div.id = id;
      div.setAttribute('data-component-name', template.title); // Store component name

      const itemContent = document.createElement('div');
      itemContent.className = `item-content size-${size || template.size}`;

      if (template.complex) {
        itemContent.innerHTML = `
          <div class="drag-handle"></div>
          <div class="grid-item-header">${template.icon} ${template.title}</div>
          <div class="grid-item-content" id="${id}-content"></div>
          <button class="grid-item-delete" onclick="deleteItem('${id}')">×</button>
          <div class="resize-handle se"></div>
        `;
      } else {
        itemContent.innerHTML = `
          <div class="drag-handle"></div>
          <div class="grid-item-header">${template.icon} ${template.title}</div>
          <div class="grid-item-content">${template.content}</div>
          <button class="grid-item-delete" onclick="deleteItem('${id}')">×</button>
          <div class="resize-handle se"></div>
        `;
      }

      div.appendChild(itemContent);
      div.setAttribute('data-size', size || template.size);

      // Add click handler to open config panel
      div.addEventListener('click', function(e) {
        // Don't open config panel if clicking on drag handle, resize handle, or delete button
        if (e.target.classList.contains('drag-handle') ||
            e.target.closest('.drag-handle') ||
            e.target.classList.contains('resize-handle') ||
            e.target.classList.contains('grid-item-delete')) {
          return;
        }
        openConfigPanel(id);
      });

      return div;
    }

    // Initialize complex component behavior
    function initializeComplexComponent(itemId, type) {
      const contentEl = document.getElementById(`${itemId}-content`);
      if (!contentEl) return;

      switch(type) {
        case 'gallery':
          contentEl.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; height: 100%;">
              <img src="https://picsum.photos/150?random=${Math.random()}" style="width: 100%; height: auto; border-radius: 4px;" loading="lazy" alt="Gallery image 1">
              <img src="https://picsum.photos/150?random=${Math.random()}" style="width: 100%; height: auto; border-radius: 4px;" loading="lazy" alt="Gallery image 2">
              <img src="https://picsum.photos/150?random=${Math.random()}" style="width: 100%; height: auto; border-radius: 4px;" loading="lazy" alt="Gallery image 3">
              <img src="https://picsum.photos/150?random=${Math.random()}" style="width: 100%; height: auto; border-radius: 4px;" loading="lazy" alt="Gallery image 4">
              <img src="https://picsum.photos/150?random=${Math.random()}" style="width: 100%; height: auto; border-radius: 4px;" loading="lazy" alt="Gallery image 5">
              <img src="https://picsum.photos/150?random=${Math.random()}" style="width: 100%; height: auto; border-radius: 4px;" loading="lazy" alt="Gallery image 6">
            </div>
          `;
          break;

        case 'dashboard':
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

          updateLiveData();
          const intervalId = setInterval(updateLiveData, 2000);

          const element = document.getElementById(itemId);
          if (element) {
            element.setAttribute('data-interval-id', intervalId);
          }
          break;
      }
    }

    // Size cycling order for resizing
    const sizeOrder = ['small', 'medium', 'large', 'wide', 'tall'];

    // Make item resizable with fixed size snapping
    function makeItemResizable(element, canvasId) {
      const resizeHandle = element.querySelector('.resize-handle.se');
      if (!resizeHandle) return;

      let isResizing = false;
      let startSize = null;
      let startMouseX = null;
      let startMouseY = null;
      let currentPreviewSize = null;

      // Helper function to determine size based on delta
      function calculateNewSize(deltaX, deltaY, startSize) {
        const currentIndex = sizeOrder.indexOf(startSize);
        let newSize = startSize;

        if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
          if (deltaX > 50 && deltaY < 30) {
            newSize = 'wide';
          } else if (deltaY > 50 && deltaX < 30) {
            newSize = 'tall';
          } else if (deltaX > 30 && deltaY > 30) {
            newSize = currentIndex < sizeOrder.length - 1 ? sizeOrder[currentIndex + 1] : 'large';
          } else if (deltaX < -30 || deltaY < -30) {
            newSize = currentIndex > 0 ? sizeOrder[currentIndex - 1] : 'small';
          }
        }

        return newSize;
      }

      // Mouse down on resize handle
      resizeHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();

        isResizing = true;
        startSize = element.getAttribute('data-size');
        startMouseX = e.pageX;
        startMouseY = e.pageY;
        currentPreviewSize = startSize;
      });

      // Mouse move anywhere on document
      document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;

        e.preventDefault();
        e.stopPropagation();

        // Calculate current delta from starting mouse position
        const deltaX = e.pageX - startMouseX;
        const deltaY = e.pageY - startMouseY;

        // Determine preview size
        const previewSize = calculateNewSize(deltaX, deltaY, startSize);

        // Only update preview if size changed
        if (previewSize !== currentPreviewSize) {
          currentPreviewSize = previewSize;
          const itemContent = element.querySelector('.item-content');
          itemContent.className = `item-content size-${previewSize}`;

          // Force browser to recalculate layout synchronously
          void element.offsetHeight;

          // Refresh Muuri layout
          const grid = grids[canvasId];
          // Refresh ALL items in the grid, not just this one
          grid.refreshItems();
          // Trigger immediate layout (true = instant, no animation during resize)
          grid.layout(true);
        }
      });

      // Mouse up anywhere on document
      document.addEventListener('mouseup', function(e) {
        if (!isResizing) return;

        e.preventDefault();
        e.stopPropagation();

        isResizing = false;

        // Calculate final delta from starting mouse position
        const deltaX = e.pageX - startMouseX;
        const deltaY = e.pageY - startMouseY;

        // Determine final size
        const newSize = calculateNewSize(deltaX, deltaY, startSize);

        // Update data attribute and ensure final size is applied
        if (newSize !== startSize) {
          const itemContent = element.querySelector('.item-content');
          itemContent.className = `item-content size-${newSize}`;
          element.setAttribute('data-size', newSize);

          // Force browser to recalculate layout synchronously
          void element.offsetHeight;

          // Final refresh
          const grid = grids[canvasId];
          // Refresh ALL items in the grid
          grid.refreshItems();
          grid.layout();
        } else if (currentPreviewSize !== startSize) {
          // Revert to original size if no significant change
          const itemContent = element.querySelector('.item-content');
          itemContent.className = `item-content size-${startSize}`;

          // Force browser to recalculate layout synchronously
          void element.offsetHeight;

          const grid = grids[canvasId];
          // Refresh ALL items in the grid
          grid.refreshItems();
          grid.layout();
        }

        currentPreviewSize = null;
        startSize = null;
        startMouseX = null;
        startMouseY = null;
      });
    }

    // Add item to grid
    function addItemToGrid(canvasId, componentType, size) {
      const template = componentTemplates[componentType];
      const element = createGridItem(componentType, size);

      // Append element to the grid container first
      const container = document.getElementById(canvasId);
      container.appendChild(element);

      // Then add it to the Muuri grid
      const grid = grids[canvasId];
      grid.add(element);

      // Make item resizable
      makeItemResizable(element, canvasId);

      // Explicitly trigger layout refresh
      grid.layout();

      if (template.complex) {
        setTimeout(() => {
          initializeComplexComponent(element.id, componentType);
        }, 50);
      }

      updateItemCount();
    }

    // Delete item
    function deleteItem(id) {
      const element = document.getElementById(id);
      if (!element) return;

      // Find which grid contains this item
      for (const canvasId in grids) {
        const grid = grids[canvasId];
        const items = grid.getItems();
        const item = items.find(i => i.getElement() === element);

        if (item) {
          // Clear any polling intervals
          const intervalId = element.getAttribute('data-interval-id');
          if (intervalId) {
            clearInterval(parseInt(intervalId));
          }

          grid.remove([item], { removeElements: true });
          updateItemCount();
          break;
        }
      }
    }

    // Update item count
    function updateItemCount() {
      let totalItems = 0;
      for (const canvasId in grids) {
        totalItems += grids[canvasId].getItems().length;
      }
      document.getElementById('itemCount').textContent = totalItems + ' items';
    }

    // Open configuration panel
    function openConfigPanel(itemId) {
      const element = document.getElementById(itemId);
      if (!element) return;

      selectedItem = itemId;
      const componentName = element.getAttribute('data-component-name') || '';

      // Populate form
      document.getElementById('componentName').value = componentName;

      // Show panel
      document.getElementById('configPanel').classList.add('open');

      // Add selected visual state
      document.querySelectorAll('.grid-item').forEach(el => el.classList.remove('selected'));
      element.classList.add('selected');
    }

    // Close configuration panel
    function closeConfigPanel() {
      document.getElementById('configPanel').classList.remove('open');
      if (selectedItem) {
        document.getElementById(selectedItem).classList.remove('selected');
      }
      selectedItem = null;
    }

    // Save configuration changes
    function saveConfig() {
      if (!selectedItem) return;

      const element = document.getElementById(selectedItem);
      if (!element) return;

      const newName = document.getElementById('componentName').value.trim();
      if (newName) {
        element.setAttribute('data-component-name', newName);
        // Update the header text
        const header = element.querySelector('.grid-item-header');
        if (header) {
          // Extract the icon (emoji) from the current header
          const currentText = header.textContent;
          const icon = currentText.match(/^[\u{1F300}-\u{1F9FF}]/u)?.[0] || '';
          header.textContent = icon ? `${icon} ${newName}` : newName;
        }
      }

      closeConfigPanel();
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize all grids
      initializeGrid('canvas1');
      initializeGrid('canvas2');
      initializeGrid('canvas3');

      // Palette drag and drop
      const paletteItems = document.querySelectorAll('.palette-item');

      paletteItems.forEach(paletteItem => {
        let dragClone = null;

        paletteItem.addEventListener('mousedown', function(e) {
        const startX = e.clientX;
        const startY = e.clientY;
        let isDragging = false;

        const handleMove = (e) => {
          if (!isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
              isDragging = true;

              // Get component type and template
              const componentType = paletteItem.getAttribute('data-component-type');
              const template = componentTemplates[componentType];

              // Create full-size drag preview
              dragClone = document.createElement('div');
              dragClone.className = 'dragging-clone';

              // Set size and styling
              dragClone.style.position = 'fixed';
              dragClone.style.width = '200px';
              dragClone.style.height = '150px';
              dragClone.style.background = 'white';
              dragClone.style.border = '2px solid #4A90E2';
              dragClone.style.borderRadius = '4px';
              dragClone.style.boxShadow = '0 8px 24px rgba(74, 144, 226, 0.4)';
              dragClone.style.opacity = '0.9';
              dragClone.style.pointerEvents = 'none';
              dragClone.style.zIndex = '10000';
              dragClone.style.padding = '16px';
              dragClone.style.display = 'flex';
              dragClone.style.flexDirection = 'column';
              dragClone.style.alignItems = 'center';
              dragClone.style.justifyContent = 'center';
              dragClone.style.gap = '12px';

              // Add component icon and title
              dragClone.innerHTML = `
                <div style="font-size: 48px;">${template.icon}</div>
                <div style="font-size: 14px; font-weight: 600; color: #333; text-align: center;">${template.title}</div>
              `;

              document.body.appendChild(dragClone);
            }
          }

          if (dragClone) {
            // Center preview on cursor
            dragClone.style.left = (e.clientX - 100) + 'px';
            dragClone.style.top = (e.clientY - 75) + 'px';
          }
        };

        const handleUp = (e) => {
          document.removeEventListener('mousemove', handleMove);
          document.removeEventListener('mouseup', handleUp);

          if (dragClone) {
            // Find which canvas the drop happened over
            // Use the center of the drag preview (where it visually appears)
            // since the preview is centered on the cursor
            const canvasElements = document.querySelectorAll('.muuri-grid');
            let targetCanvas = null;

            canvasElements.forEach(canvas => {
              const rect = canvas.getBoundingClientRect();
              if (e.clientX >= rect.left && e.clientX <= rect.right &&
                  e.clientY >= rect.top && e.clientY <= rect.bottom) {
                targetCanvas = canvas.id;
              }
            });

            if (targetCanvas) {
              const componentType = paletteItem.getAttribute('data-component-type');
              const size = paletteItem.getAttribute('data-size');
              addItemToGrid(targetCanvas, componentType, size);
            }

            dragClone.remove();
            dragClone = null;
          }
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
      });
    });

    // Background color pickers
    document.querySelectorAll('.canvas-bg-color').forEach(colorPicker => {
      colorPicker.addEventListener('input', function(e) {
        const canvasId = e.target.getAttribute('data-canvas');
        const gridBuilder = document.getElementById(canvasId).closest('.grid-builder');
        if (gridBuilder) {
          gridBuilder.style.backgroundColor = e.target.value;
        }
      });
    });

    // Clear canvas buttons
    document.querySelectorAll('.clear-canvas-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const canvasId = this.getAttribute('data-canvas');
        if (confirm(`Are you sure you want to clear all items from this canvas?`)) {
          const grid = grids[canvasId];
          const items = grid.getItems();

          items.forEach(item => {
            const element = item.getElement();
            const intervalId = element.getAttribute('data-interval-id');
            if (intervalId) {
              clearInterval(parseInt(intervalId));
            }
          });

          grid.remove(items, { removeElements: true });
          updateItemCount();
        }
      });
    });

    // Export state
    document.getElementById('exportState').addEventListener('click', function() {
      const state = {
        canvases: {},
        timestamp: new Date().toISOString()
      };

      for (const canvasId in grids) {
        const grid = grids[canvasId];
        const items = grid.getItems();
        state.canvases[canvasId] = {
          items: items.map(item => {
            const element = item.getElement();
            const type = element.querySelector('.grid-item-header').textContent.split(' ')[1].toLowerCase();
            return {
              id: element.id,
              type: type,
              size: element.querySelector('.item-content').className.split(' ').find(c => c.startsWith('size-'))
            };
          })
        };
      }

      console.log('Grid State:', state);
      const totalItems = Object.values(grids).reduce((sum, grid) => sum + grid.getItems().length, 0);
      alert('Grid state exported to console!\n\nTotal Items: ' + totalItems);
    });

    // Add section
    document.getElementById('addSection').addEventListener('click', function() {
      sectionCounter++;
      const newCanvasId = 'canvas' + sectionCounter;
      const sectionNumber = sectionCounter;

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
          <div class="muuri-grid" id="${newCanvasId}" data-canvas-id="${newCanvasId}"></div>
        </div>
      `;

      document.querySelector('.canvases-container').appendChild(newSection);

      initializeGrid(newCanvasId);

      const colorPicker = newSection.querySelector('.canvas-bg-color');
      colorPicker.addEventListener('input', function(e) {
        const canvasId = e.target.getAttribute('data-canvas');
        const gridBuilder = document.getElementById(canvasId).closest('.grid-builder');
        if (gridBuilder) {
          gridBuilder.style.backgroundColor = e.target.value;
        }
      });

      const clearBtn = newSection.querySelector('.clear-canvas-btn');
      clearBtn.addEventListener('click', function() {
        const canvasId = this.getAttribute('data-canvas');
        if (confirm(`Are you sure you want to clear all items from this canvas?`)) {
          const grid = grids[canvasId];
          const items = grid.getItems();

          items.forEach(item => {
            const element = item.getElement();
            const intervalId = element.getAttribute('data-interval-id');
            if (intervalId) {
              clearInterval(parseInt(intervalId));
            }
          });

          grid.remove(items, { removeElements: true });
          updateItemCount();
        }
      });

      alert(`Section ${sectionNumber} added!`);
    });

    // Delete section
    document.querySelector('.canvases-container').addEventListener('click', function(e) {
      if (e.target.classList.contains('delete-section-btn')) {
        const canvasId = e.target.getAttribute('data-canvas');
        const canvasItem = e.target.closest('.canvas-item');
        const sectionName = canvasItem.querySelector('h3').textContent;

        const totalSections = document.querySelectorAll('.canvas-item').length;
        if (totalSections === 1) {
          alert('Cannot delete the last section!');
          return;
        }

        if (confirm(`Are you sure you want to delete ${sectionName}?\n\nThis will remove all items in this section.`)) {
          const grid = grids[canvasId];
          const items = grid.getItems();

          items.forEach(item => {
            const element = item.getElement();
            const intervalId = element.getAttribute('data-interval-id');
            if (intervalId) {
              clearInterval(parseInt(intervalId));
            }
          });

          grid.destroy(true);
          delete grids[canvasId];

          canvasItem.remove();
          updateItemCount();
        }
      }
    });

    // Stress test: Add many items
    document.getElementById('addStressTest').addEventListener('click', function() {
      const count = parseInt(document.getElementById('stressTestCount').value) || 50;
      const componentTypes = Object.keys(componentTemplates);
      const sizes = ['small', 'medium', 'large', 'wide', 'tall'];
      const canvasIds = ['canvas1', 'canvas2', 'canvas3'];

      console.time('Add ' + count + ' items');

      for (let i = 0; i < count; i++) {
        const canvasId = canvasIds[i % canvasIds.length]; // Distribute across canvases
        const type = componentTypes[Math.floor(Math.random() * componentTypes.length)];
        const size = sizes[Math.floor(Math.random() * sizes.length)];

        addItemToGrid(canvasId, type, size);
      }

      console.timeEnd('Add ' + count + ' items');
      updateItemCount();

      alert(`Added ${count} items!\nCheck console for timing.`);
    });

    // Clear all items from all canvases
    document.getElementById('clearAll').addEventListener('click', function() {
      let totalItems = 0;
      for (const canvasId in grids) {
        totalItems += grids[canvasId].getItems().length;
      }

      if (totalItems === 0) {
        alert('No items to clear!');
        return;
      }

      if (confirm(`Clear all ${totalItems} items from all canvases?`)) {
        console.time('Clear all items');

        for (const canvasId in grids) {
          const grid = grids[canvasId];
          const items = grid.getItems();

          // Clear any polling intervals for complex components
          items.forEach(item => {
            const element = item.getElement();
            const intervalId = element.getAttribute('data-interval-id');
            if (intervalId) {
              clearInterval(parseInt(intervalId));
            }
          });

          // Remove all items from Muuri grid
          grid.remove(items, { removeElements: true });
        }

        console.timeEnd('Clear all items');
        updateItemCount();
      }
    });

    // Configuration panel event listeners
    document.getElementById('configPanelClose').addEventListener('click', closeConfigPanel);
    document.getElementById('configPanelCancel').addEventListener('click', closeConfigPanel);
    document.getElementById('configPanelSave').addEventListener('click', saveConfig);

    }); // End of DOMContentLoaded

    // Set initial background colors and add demo items
    window.addEventListener('load', function() {
      const canvas1Builder = document.getElementById('canvas1').closest('.grid-builder');
      const canvas2Builder = document.getElementById('canvas2').closest('.grid-builder');
      const canvas3Builder = document.getElementById('canvas3').closest('.grid-builder');

      if (canvas1Builder) canvas1Builder.style.backgroundColor = '#ffffff';
      if (canvas2Builder) canvas2Builder.style.backgroundColor = '#f5f5f5';
      if (canvas3Builder) canvas3Builder.style.backgroundColor = '#ffffff';

      // Section 1 - Hero section demo items
      addItemToGrid('canvas1', 'header', 'wide');
      addItemToGrid('canvas1', 'text', 'medium');
      addItemToGrid('canvas1', 'button', 'small');
      addItemToGrid('canvas1', 'image', 'medium');

      // Section 2 - Content section demo items
      addItemToGrid('canvas2', 'header', 'wide');
      addItemToGrid('canvas2', 'text', 'medium');
      addItemToGrid('canvas2', 'video', 'large');

      // Section 3 - Footer section demo items
      addItemToGrid('canvas3', 'text', 'medium');
      addItemToGrid('canvas3', 'button', 'small');
      addItemToGrid('canvas3', 'button', 'small');

      updateItemCount();
    });
