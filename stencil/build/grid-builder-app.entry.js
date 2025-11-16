import { r as registerInstance, h, a as Host } from './index-ebe9feb4.js';
import { i as interact_min } from './interact.min-bef33ec6.js';
import { c as componentTemplates } from './component-templates-e71f1a8f.js';
import { s as state, g as generateItemId, a as addItemToCanvas, r as removeItemFromCanvas } from './state-manager-b0e7f282.js';
import { u as undo, r as redo, p as pushCommand } from './undo-redo-158eb3dc.js';
import { D as DeleteItemCommand, A as AddItemCommand, M as MoveItemCommand } from './undo-redo-commands-efcbac99.js';
import { p as pixelsToGridX, a as pixelsToGridY } from './grid-calculations-e64c8272.js';
import './index-28d0c3f6.js';

/**
 * Virtual Rendering Utility
 * Lazy-load complex components using IntersectionObserver
 *
 * Purpose: Only initialize complex/heavy components when they become visible
 * This improves initial render performance and reduces memory usage
 */
/**
 * Virtual Renderer using IntersectionObserver
 * Observes grid items and initializes complex components when visible
 */
class VirtualRenderer {
    constructor() {
        this.visibleItems = new Set();
        this.intervalIds = new Map();
        // Create observer with 200px margin (pre-render before entering viewport)
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const itemElement = entry.target;
                const itemId = itemElement.id;
                const itemType = itemElement.getAttribute('data-item-type');
                if (entry.isIntersecting) {
                    // Item is visible - check if we need to initialize it
                    if (!this.visibleItems.has(itemId)) {
                        this.visibleItems.add(itemId);
                        this.initializeComplexComponent(itemId, itemType);
                    }
                }
                else {
                    // Item left viewport - cleanup if needed
                    this.visibleItems.delete(itemId);
                }
            });
        }, {
            rootMargin: '200px',
            threshold: 0.01, // Trigger when even 1% is visible
        });
    }
    /**
     * Start observing an element for lazy loading
     */
    observe(element, _itemId, itemType) {
        // Store item type as data attribute for retrieval in observer callback
        element.setAttribute('data-item-type', itemType);
        this.observer.observe(element);
    }
    /**
     * Stop observing an element
     */
    unobserve(itemId) {
        const element = document.getElementById(itemId);
        if (element) {
            this.observer.unobserve(element);
        }
        // Cleanup any intervals
        this.cleanup(itemId);
        this.visibleItems.delete(itemId);
    }
    /**
     * Destroy the virtual renderer
     */
    destroy() {
        this.observer.disconnect();
        // Cleanup all intervals
        this.intervalIds.forEach((intervalId) => clearInterval(intervalId));
        this.intervalIds.clear();
        this.visibleItems.clear();
    }
    /**
     * Cleanup resources for an item
     */
    cleanup(itemId) {
        const intervalId = this.intervalIds.get(itemId);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervalIds.delete(itemId);
        }
    }
    /**
     * Initialize complex component behavior
     * Only called when item becomes visible (via Intersection Observer)
     */
    initializeComplexComponent(itemId, type) {
        const contentEl = document.getElementById(`${itemId}-content`);
        if (!contentEl) {
            return;
        }
        // Check if already initialized (prevent double-init)
        if (contentEl.dataset.initialized === 'true') {
            return;
        }
        contentEl.dataset.initialized = 'true';
        switch (type) {
            case 'gallery':
                this.renderGallery(contentEl);
                break;
            case 'dashboard':
                this.renderDashboard(contentEl);
                break;
            case 'livedata':
                this.renderLiveData(contentEl, itemId);
                break;
        }
    }
    /**
     * Render image gallery component
     */
    renderGallery(contentEl) {
        contentEl.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; height: 100%;">
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 1">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 2">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 3">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 4">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 5">
        </div>
        <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 4px; background: #f0f0f0;">
          <img src="https://picsum.photos/400?random=${Math.random()}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" loading="lazy" alt="Gallery image 6">
        </div>
      </div>
    `;
    }
    /**
     * Render dashboard widget component
     */
    renderDashboard(contentEl) {
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
    }
    /**
     * Render live data component (with polling)
     */
    renderLiveData(contentEl, itemId) {
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
        const intervalId = window.setInterval(updateLiveData, 2000);
        // Store interval ID for cleanup
        this.intervalIds.set(itemId, intervalId);
    }
}

const gridBuilderAppCss = ".error-notification{position:fixed;z-index:1070;top:20px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:16px 20px;border-radius:6px;background:#dc3545;color:white;box-shadow:0 8px 16px rgba(0, 0, 0, 0.2);animation:slideDown 0.3s ease}.error-notification .error-icon{font-size:18px}.error-notification .error-text{flex:1;font-size:14px;font-weight:500}.error-notification .error-dismiss{padding:0;border:none;background:transparent;color:white;cursor:pointer;font-size:24px;line-height:1;opacity:0.8;transition:opacity 0.15s ease}.error-notification .error-dismiss:hover{opacity:1}@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}*{box-sizing:border-box;padding:0;margin:0}body{overflow:hidden;height:100vh;background:#f5f5f5;font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif}.app{display:flex;height:100vh}.canvas{position:relative;overflow:auto;flex:1;padding:20px}.canvas-header{padding:15px 20px;border-radius:4px;margin-bottom:20px;background:white;box-shadow:0 2px 4px rgba(0, 0, 0, 0.05)}.canvas-header h1{margin-bottom:10px;color:#333;font-size:24px}.canvas-header p{margin-bottom:15px;color:#666}.controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px}.controls button{padding:8px 16px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:14px;transition:all 0.2s}.controls button:hover{border-color:#4a90e2;background:#f5f5f5}.controls button.active{border-color:#4a90e2;background:#4a90e2;color:white}.viewport-toggle{display:flex;overflow:hidden;border:1px solid #ddd;border-radius:4px;gap:5px}.viewport-btn{padding:8px 16px;border:none;background:white;cursor:pointer;font-size:14px;transition:all 0.2s}.viewport-btn:hover{background:#f5f5f5}.viewport-btn.active{background:#4a90e2;color:white}.version-switcher{display:flex;align-items:center;margin-left:auto;gap:8px}.version-switcher-label{color:#666;font-size:12px;font-weight:500}.version-switcher select{padding:6px 12px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px}.canvases-container{display:flex;flex-direction:column;gap:0}.canvases-container.mobile-view{max-width:375px;margin:0 auto;box-shadow:0 0 20px rgba(0, 0, 0, 0.1)}";

const GridBuilderApp = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Update item count (helper method)
         *
         * **Called from**: componentWillLoad, componentWillUpdate
         * **Purpose**: Calculate total items across all canvases
         *
         * **Implementation**:
         * ```typescript
         * this.itemCount = Object.values(gridState.canvases)
         *   .reduce((sum, canvas) => sum + canvas.items.length, 0);
         * ```
         *
         * **Reduce pattern**:
         * - Iterates over all canvases
         * - Sums items.length from each
         * - Single pass through canvases
         * - Functional programming style
         *
         * **Why reduce**:
         * - Clean and concise
         * - No temporary variables
         * - Chainable with other operations
         * - Standard JS pattern
         *
         * **Updates @State()**:
         * - Setting this.itemCount triggers re-render
         * - Item count display updates automatically
         * - Reactive UI pattern
         *
         * @private
         */
        this.updateItemCount = () => {
            this.itemCount = Object.values(state.canvases).reduce((sum, canvas) => sum + canvas.items.length, 0);
        };
        /**
         * Handle keyboard events (main dispatcher)
         *
         * **Triggered by**: Document keydown event (global)
         * **Purpose**: Route keyboard shortcuts to specialized handlers
         *
         * ## Handler Chain Pattern
         *
         * **Delegation sequence**:
         * ```typescript
         * if (this.handleArrowKeys(e)) return;    // 1. Arrow keys (nudge)
         * if (this.handleUndoRedo(e)) return;     // 2. Undo/redo
         * if (this.handleDelete(e)) return;       // 3. Delete/backspace
         * if (this.handleEscape(e)) return;       // 4. Escape (clear selection)
         * ```
         *
         * **Early return pattern**:
         * - Each handler returns boolean (true = handled)
         * - First matching handler processes event
         * - Subsequent handlers skipped
         * - Cleaner than nested if/else
         *
         * **Why this pattern**:
         * - Single responsibility per handler
         * - Easy to add new shortcuts
         * - Testable in isolation
         * - Clear precedence order
         * - No code duplication
         *
         * **Debug logging**:
         * ```typescript
         * console.log('Keyboard event:', e.key, 'selectedItemId:', gridState.selectedItemId);
         * ```
         * - Helps debug keyboard issues
         * - Shows which item selected
         * - Can be removed in production
         *
         * ## Supported Shortcuts
         *
         * - **Arrow keys**: Nudge selected item (1 unit or 10 with Shift)
         * - **Ctrl+Z / Cmd+Z**: Undo last operation
         * - **Ctrl+Y / Cmd+Shift+Z**: Redo last undone operation
         * - **Delete / Backspace**: Delete selected item
         * - **Escape**: Clear selection
         *
         * @param e - Keyboard event from document
         * @private
         */
        this.handleKeyboard = (e) => {
            console.log('Keyboard event:', e.key, 'selectedItemId:', state.selectedItemId);
            if (this.handleArrowKeys(e))
                return;
            if (this.handleUndoRedo(e))
                return;
            if (this.handleDelete(e))
                return;
            if (this.handleEscape(e))
                return;
        };
        /**
         * Handle arrow key events (nudge selected item)
         *
         * **Triggered by**: handleKeyboard when arrow key pressed
         * **Purpose**: Move selected item by 1 or 10 units
         *
         * ## Validation Checks
         *
         * **1. Is arrow key**:
         * ```typescript
         * if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && ...) return false;
         * ```
         * - Returns false if not arrow key
         * - Allows handleKeyboard to try next handler
         *
         * **2. Has selection**:
         * ```typescript
         * if (!gridState.selectedItemId || !gridState.selectedCanvasId) {
         *   return false;  // Allow normal page scrolling
         * }
         * ```
         * - Returns false if no item selected
         * - Browser handles arrow keys normally (scroll page)
         * - Good UX (arrows scroll when nothing selected)
         *
         * **3. Prevent default**:
         * ```typescript
         * e.preventDefault();  // Stop page scroll
         * ```
         * - Only called if item selected
         * - Prevents page scroll while nudging
         * - Arrow keys control item, not scroll
         *
         * ## Item Lookup
         *
         * **Find selected item**:
         * ```typescript
         * const canvas = gridState.canvases[gridState.selectedCanvasId];
         * const item = canvas?.items.find(i => i.id === gridState.selectedItemId);
         * if (!item) return true;
         * ```
         *
         * **Returns true if not found**:
         * - Event was arrow key, so mark as handled
         * - Prevents default (no page scroll)
         * - Gracefully handles invalid selection state
         *
         * ## Nudge Operation
         *
         * **Delegate to nudgeItem**:
         * ```typescript
         * this.nudgeItem(item, e.key, e.shiftKey);
         * ```
         * - Passes item, direction, and shift modifier
         * - nudgeItem handles actual position update
         * - Separation of concerns
         *
         * @param e - Keyboard event
         * @returns true if arrow key (handled), false otherwise
         * @private
         */
        this.handleArrowKeys = (e) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                return false;
            }
            if (!state.selectedItemId || !state.selectedCanvasId) {
                return false; // Allow normal page scrolling
            }
            e.preventDefault();
            console.log('Arrow key pressed, nudging item:', e.key);
            const canvas = state.canvases[state.selectedCanvasId];
            const item = canvas === null || canvas === void 0 ? void 0 : canvas.items.find((i) => i.id === state.selectedItemId);
            if (!item) {
                return true;
            }
            this.nudgeItem(item, e.key, e.shiftKey);
            return true;
        };
        /**
         * Nudge item in direction (helper for arrow keys)
         *
         * **Called by**: handleArrowKeys
         * **Purpose**: Update item position by nudge amount
         *
         * ## Nudge Amount Calculation
         *
         * **Standard vs Large nudge**:
         * ```typescript
         * const nudgeAmount = shiftKey ? 10 : 1;  // 10 units with Shift, 1 normally
         * ```
         *
         * **Why 10 with Shift**:
         * - Large movements (20% of canvas with 2% units)
         * - Fine control without Shift (2% of canvas)
         * - Common UX pattern (Shift = 10×)
         *
         * ## Direction Handling
         *
         * **Switch statement**:
         * ```typescript
         * switch (key) {
         *   case 'ArrowUp':    layout.y = Math.max(0, layout.y - nudgeAmount); break;
         *   case 'ArrowDown':  layout.y = layout.y + nudgeAmount; break;
         *   case 'ArrowLeft':  layout.x = Math.max(0, layout.x - nudgeAmount); break;
         *   case 'ArrowRight': layout.x = layout.x + nudgeAmount; break;
         * }
         * ```
         *
         * **Boundary constraints**:
         * - `Math.max(0, ...)` prevents negative positions (Up/Left)
         * - No upper limit (can nudge beyond canvas, user's choice)
         * - Down/Right unconstrained (allows infinite canvas)
         *
         * ## Viewport Awareness
         *
         * **Current viewport layout**:
         * ```typescript
         * const currentViewport = gridState.currentViewport;  // 'desktop' | 'mobile'
         * const layout = item.layouts[currentViewport];
         * ```
         *
         * **Mobile customization flag**:
         * ```typescript
         * if (currentViewport === 'mobile') {
         *   item.layouts.mobile.customized = true;
         * }
         * ```
         * - Marks mobile layout as customized
         * - Prevents auto-layout from overriding
         * - User explicitly positioned in mobile view
         *
         * ## State Update
         *
         * **Trigger reactivity**:
         * ```typescript
         * gridState.canvases = { ...gridState.canvases };
         * ```
         * - Spread creates new object reference
         * - StencilJS detects change
         * - Components re-render with new position
         *
         * ## No Undo Support
         *
         * **Note**: Nudge operations NOT added to undo history
         * - Too granular (1 unit moves)
         * - Would flood undo stack
         * - User can drag to undo if needed
         * - Could add command aggregation if needed
         *
         * @param item - Grid item to nudge
         * @param key - Arrow key direction
         * @param shiftKey - Whether Shift modifier pressed
         * @private
         */
        this.nudgeItem = (item, key, shiftKey) => {
            const currentViewport = state.currentViewport;
            const layout = item.layouts[currentViewport];
            const nudgeAmount = shiftKey ? 10 : 1;
            switch (key) {
                case 'ArrowUp':
                    layout.y = Math.max(0, layout.y - nudgeAmount);
                    break;
                case 'ArrowDown':
                    layout.y = layout.y + nudgeAmount;
                    break;
                case 'ArrowLeft':
                    layout.x = Math.max(0, layout.x - nudgeAmount);
                    break;
                case 'ArrowRight':
                    layout.x = layout.x + nudgeAmount;
                    break;
            }
            if (currentViewport === 'mobile') {
                item.layouts.mobile.customized = true;
            }
            state.canvases = Object.assign({}, state.canvases);
        };
        /**
         * Handle undo/redo keyboard shortcuts
         *
         * **Triggered by**: handleKeyboard when Ctrl/Cmd+Z or Ctrl/Cmd+Y pressed
         * **Purpose**: Execute undo or redo operations
         *
         * ## Undo Shortcut
         *
         * **Pattern**:
         * ```typescript
         * if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
         *   e.preventDefault();
         *   undo();
         *   return true;
         * }
         * ```
         *
         * **Cross-platform**:
         * - `e.ctrlKey` for Windows/Linux
         * - `e.metaKey` for macOS (Cmd key)
         * - Standard keyboard convention
         *
         * **Shift exclusion**: `!e.shiftKey`
         * - Prevents Ctrl+Shift+Z from triggering undo
         * - Ctrl+Shift+Z reserved for redo
         * - Important for key combo disambiguation
         *
         * ## Redo Shortcuts
         *
         * **Two patterns supported**:
         * ```typescript
         * if ((e.ctrlKey || e.metaKey) && (
         *   e.key === 'y' ||                  // Ctrl+Y (Windows)
         *   (e.key === 'z' && e.shiftKey)     // Ctrl+Shift+Z (macOS)
         * )) {
         *   e.preventDefault();
         *   redo();
         *   return true;
         * }
         * ```
         *
         * **Why two patterns**:
         * - Windows/Linux convention: Ctrl+Y
         * - macOS convention: Cmd+Shift+Z
         * - Supports both for better UX
         * - Matches user expectations per platform
         *
         * ## undo/redo Functions
         *
         * **Imported from**: undo-redo.ts
         * - `undo()`: Executes previous command's undo() method
         * - `redo()`: Executes next command's redo() method
         * - Updates undoRedoState (canUndo/canRedo)
         * - Triggers UI button state updates
         *
         * **State restoration**:
         * - Commands restore gridState.canvases
         * - Reactivity triggers component re-renders
         * - Items appear/disappear/move automatically
         *
         * @param e - Keyboard event
         * @returns true if undo/redo shortcut, false otherwise
         * @private
         */
        this.handleUndoRedo = (e) => {
            // Undo (Ctrl+Z or Cmd+Z)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return true;
            }
            // Redo (Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
                return true;
            }
            return false;
        };
        /**
         * Handle delete key (delete selected item)
         *
         * **Triggered by**: handleKeyboard when Delete or Backspace pressed
         * **Purpose**: Delete currently selected item
         *
         * ## Key Detection
         *
         * **Two keys supported**:
         * ```typescript
         * if ((e.key === 'Delete' || e.key === 'Backspace') && gridState.selectedItemId)
         * ```
         * - Delete key (PC keyboards)
         * - Backspace key (Mac keyboards, some PCs)
         * - Both trigger same operation
         *
         * **Selection check**:
         * - Only proceeds if item selected
         * - Returns false if no selection
         * - Allows normal Backspace behavior (navigate back) when nothing selected
         *
         * ## Deletion Process
         *
         * **Prevent default**:
         * ```typescript
         * e.preventDefault();  // Stop browser back navigation
         * ```
         * - Backspace normally navigates browser back
         * - preventDefault stops this when item selected
         * - Only affects Backspace when used for deletion
         *
         * **Delegate to handleDeleteSelected**:
         * ```typescript
         * this.handleDeleteSelected();
         * ```
         * - Separate method for actual deletion logic
         * - Shared with button click deletion (handleItemDelete)
         * - DRY principle
         *
         * **Debug logging**:
         * ```typescript
         * console.log('Deleting item:', gridState.selectedItemId);
         * ```
         * - Helps debug deletion issues
         * - Shows which item being deleted
         * - Can be removed in production
         *
         * @param e - Keyboard event
         * @returns true if delete key with selection, false otherwise
         * @private
         */
        this.handleDelete = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedItemId) {
                console.log('Deleting item:', state.selectedItemId);
                e.preventDefault();
                this.handleDeleteSelected();
                return true;
            }
            return false;
        };
        /**
         * Handle Escape key (clear selection)
         *
         * **Triggered by**: handleKeyboard when Escape pressed
         * **Purpose**: Deselect currently selected item
         *
         * ## Selection Clearing
         *
         * **Clear selection state**:
         * ```typescript
         * gridState.selectedItemId = null;
         * gridState.selectedCanvasId = null;
         * ```
         * - Both IDs cleared together
         * - Prevents orphaned selection state
         * - Consistent deselection
         *
         * **Trigger re-render**:
         * ```typescript
         * const canvases = gridState.canvases;
         * gridState.canvases = { ...canvases };
         * ```
         * - Spread operator creates new reference
         * - StencilJS detects change
         * - grid-item-wrapper components re-render
         * - Selected item loses visual feedback
         *
         * ## Why Spread Pattern Here
         *
         * **Reactivity trigger**:
         * - selectedItemId/selectedCanvasId not @State in app
         * - They're in gridState (global)
         * - Need to trigger canvases update to re-render items
         * - Spread ensures wrapper components update selection state
         *
         * **Debug logging**:
         * ```typescript
         * console.log('Escape pressed, clearing selection');
         * console.log('Canvases updated to trigger re-render');
         * ```
         * - Tracks selection clearing
         * - Confirms re-render triggered
         * - Can be removed in production
         *
         * @param e - Keyboard event
         * @returns true if Escape key, false otherwise
         * @private
         */
        this.handleEscape = (e) => {
            if (e.key === 'Escape') {
                console.log('Escape pressed, clearing selection');
                state.selectedItemId = null;
                state.selectedCanvasId = null;
                const canvases = state.canvases;
                state.canvases = Object.assign({}, canvases);
                console.log('Canvases updated to trigger re-render');
                return true;
            }
            return false;
        };
        /**
         * Delete currently selected item (helper method)
         *
         * **Called by**: handleDelete (keyboard) or could be called from UI
         * **Purpose**: Shared deletion logic with undo support
         *
         * ## Validation Checks
         *
         * **Has selection**:
         * ```typescript
         * if (!gridState.selectedItemId || !gridState.selectedCanvasId) return;
         * ```
         * - Early return if nothing selected
         * - Prevents errors from invalid state
         *
         * **Canvas exists**:
         * ```typescript
         * const canvas = gridState.canvases[gridState.selectedCanvasId];
         * if (!canvas) return;
         * ```
         * - Guards against stale selection
         * - Canvas may have been deleted
         *
         * **Item exists**:
         * ```typescript
         * const itemIndex = canvas.items.findIndex(i => i.id === gridState.selectedItemId);
         * const item = canvas.items[itemIndex];
         * if (!item) return;
         * ```
         * - Item may have been deleted elsewhere
         * - Graceful handling of race conditions
         *
         * ## Deletion with Undo
         *
         * **Push command BEFORE deletion**:
         * ```typescript
         * pushCommand(new DeleteItemCommand(canvasId, item, itemIndex));
         * ```
         * - Captures item state before removal
         * - Includes original index for accurate undo
         * - Same pattern as handleItemDelete
         *
         * **Remove item**:
         * ```typescript
         * canvas.items = canvas.items.filter(i => i.id !== gridState.selectedItemId);
         * ```
         * - Filter creates new array (immutable pattern)
         * - Triggers reactivity
         *
         * **Clear selection**:
         * ```typescript
         * gridState.selectedItemId = null;
         * gridState.selectedCanvasId = null;
         * ```
         * - Deleted item no longer selectable
         * - Prevents errors accessing deleted item
         * - Good UX (nothing selected after delete)
         *
         * **Trigger update**:
         * ```typescript
         * gridState.canvases = { ...gridState.canvases };
         * ```
         * - Standard reactivity trigger
         * - Components re-render without item
         *
         * @private
         */
        this.handleDeleteSelected = () => {
            if (!state.selectedItemId || !state.selectedCanvasId) {
                return;
            }
            const canvas = state.canvases[state.selectedCanvasId];
            if (!canvas) {
                return;
            }
            // Find the item and its index before deletion
            const itemIndex = canvas.items.findIndex((i) => i.id === state.selectedItemId);
            const item = canvas.items[itemIndex];
            if (!item) {
                return;
            }
            // Push undo command before deleting
            pushCommand(new DeleteItemCommand(state.selectedCanvasId, item, itemIndex));
            // Delete the item
            canvas.items = canvas.items.filter((i) => i.id !== state.selectedItemId);
            state.selectedItemId = null;
            state.selectedCanvasId = null;
            // Trigger update
            state.canvases = Object.assign({}, state.canvases);
        };
        /**
         * Handle viewport change (desktop ↔ mobile toggle)
         *
         * **Triggered by**: User clicks viewport toggle buttons
         * **Purpose**: Switch between desktop and mobile layouts
         *
         * ## Performance Optimization
         *
         * **Automatic read/write batching**:
         * ```
         * 1. Setting currentViewport triggers re-render of all grid-item-wrapper components
         * 2. Each component's render() calls gridToPixelsX() which uses getGridSizeHorizontal()
         * 3. Grid size caching ensures container.clientWidth is only read once per canvas
         * 4. All subsequent components use the cached grid size (no DOM reads)
         * 5. StencilJS automatically batches all resulting DOM writes
         * ```
         *
         * **Result**:
         * - With 100+ items: Only 1 DOM read per canvas instead of 100+
         * - All style updates batched by StencilJS for single reflow
         * - ~50-100ms for viewport switch with 100 items
         * - Very responsive UX
         *
         * ## Mobile Auto-Layout
         *
         * **Handled by grid-item-wrapper**:
         * - Items without customized mobile layout stack vertically
         * - Full width (50 units = 100%)
         * - Maintains desktop height
         * - No work needed here (just switch flag)
         *
         * **State update**:
         * ```typescript
         * gridState.currentViewport = viewport;  // 'desktop' | 'mobile'
         * ```
         * - Reactive state update
         * - All wrappers re-render with new viewport
         * - Layout selection happens in wrapper render
         *
         * @param viewport - Target viewport ('desktop' or 'mobile')
         * @private
         */
        this.handleViewportChange = (viewport) => {
            /**
             * Viewport switching with automatic read/write batching:
             *
             * 1. Setting currentViewport triggers re-render of all grid-item-wrapper components
             * 2. Each component's render() calls gridToPixelsX() which uses getGridSizeHorizontal()
             * 3. Grid size caching ensures container.clientWidth is only read once per canvas
             * 4. All subsequent components use the cached grid size (no DOM reads)
             * 5. StencilJS automatically batches all resulting DOM writes
             *
             * Result: With 100+ items, only 1 DOM read per canvas instead of 100+,
             * and all style updates are batched by StencilJS for a single reflow
             */
            state.currentViewport = viewport;
        };
        /**
         * Handle grid toggle (show/hide grid background)
         *
         * **Triggered by**: User clicks grid toggle button
         * **Purpose**: Toggle visual grid alignment guides
         *
         * **Simple toggle**:
         * ```typescript
         * gridState.showGrid = !gridState.showGrid;
         * ```
         * - Reactive state update
         * - canvas-section components update CSS classes
         * - `.hide-grid` class added/removed
         * - CSS background-image shown/hidden
         *
         * **CSS implementation** (in canvas-section):
         * ```scss
         * .grid-container {
         *   background-image: linear-gradient(...);  // Grid lines
         * }
         * .grid-container.hide-grid {
         *   background-image: none;  // No grid
         * }
         * ```
         *
         * **No performance impact**:
         * - Pure CSS toggle
         * - No JavaScript overhead
         * - Instant visual feedback
         *
         * @private
         */
        this.handleGridToggle = () => {
            state.showGrid = !state.showGrid;
        };
        /**
         * Handle state export (debug feature)
         *
         * **Triggered by**: User clicks "Export State" button
         * **Purpose**: Output current grid state to console for debugging
         *
         * ## State Snapshot
         *
         * **Captured data**:
         * ```typescript
         * const state = {
         *   canvases: gridState.canvases,        // All canvases and items
         *   currentViewport: gridState.currentViewport,  // Desktop or mobile
         *   timestamp: new Date().toISOString()  // When exported
         * };
         * ```
         *
         * **Console output**:
         * ```typescript
         * console.log('Grid State:', state);
         * ```
         * - Full state tree logged
         * - Can be copied from console
         * - Used for debugging layout issues
         * - Could be saved to file in future
         *
         * **User feedback**:
         * ```typescript
         * alert(`Grid state exported to console!\n\nTotal Items: ${this.itemCount}\nViewport: ${gridState.currentViewport}`);
         * ```
         * - Confirms export success
         * - Shows item count summary
         * - Shows current viewport
         * - Directs user to console
         *
         * ## Use Cases
         *
         * - **Debugging**: Inspect item positions and properties
         * - **Bug reports**: Include state snapshot in report
         * - **Testing**: Verify state correctness
         * - **Save/load**: Foundation for future feature
         *
         * @private
         */
        this.handleExportState = () => {
            const state$1 = {
                canvases: state.canvases,
                currentViewport: state.currentViewport,
                timestamp: new Date().toISOString(),
            };
            console.log('Grid State:', state$1);
            alert(`Grid state exported to console!\n\nTotal Items: ${this.itemCount}\nViewport: ${state.currentViewport}`);
        };
        /**
         * Handle add section (create new canvas)
         *
         * **Triggered by**: User clicks "➕ Add Section" button
         * **Purpose**: Add new canvas section to page
         *
         * ## Section Creation
         *
         * **Calculate next ID**:
         * ```typescript
         * const canvasIds = Object.keys(gridState.canvases);
         * const nextId = canvasIds.length + 1;
         * const newCanvasId = `canvas${nextId}`;
         * ```
         * - Simple sequential numbering
         * - canvas1, canvas2, canvas3, etc.
         * - No gaps in sequence
         *
         * **Create canvas object**:
         * ```typescript
         * gridState.canvases = {
         *   ...gridState.canvases,
         *   [newCanvasId]: {
         *     items: [],              // Empty items array
         *     zIndexCounter: 1,       // Start z-index at 1
         *     backgroundColor: '#ffffff'  // Default white background
         *   }
         * };
         * ```
         *
         * **Spread pattern**:
         * - Creates new canvases object
         * - Triggers reactivity
         * - Components re-render with new canvas
         * - New canvas-section appears
         *
         * **User feedback**:
         * ```typescript
         * alert(`Section ${nextId} added!`);
         * ```
         * - Confirms section creation
         * - Shows section number
         * - Simple and clear
         *
         * ## No Undo Support
         *
         * **Note**: Section creation NOT in undo history
         * - Structural change (not item operation)
         * - Could be added if needed
         * - User can delete section if mistake
         *
         * @private
         */
        this.handleAddSection = () => {
            // Add new section logic
            const canvasIds = Object.keys(state.canvases);
            const nextId = canvasIds.length + 1;
            const newCanvasId = `canvas${nextId}`;
            state.canvases = Object.assign(Object.assign({}, state.canvases), { [newCanvasId]: {
                    items: [],
                    zIndexCounter: 1,
                    backgroundColor: '#ffffff',
                } });
            alert(`Section ${nextId} added!`);
        };
        /**
         * Handle stress test (performance testing)
         *
         * **Triggered by**: User clicks "🚀 Stress Test" button
         * **Purpose**: Add many items quickly for performance testing
         *
         * ## User Input
         *
         * **Prompt for count**:
         * ```typescript
         * const input = prompt('How many items to add? (1-1000)', '100');
         * if (!input) return;  // User cancelled
         * ```
         * - Default: 100 items
         * - Max: 1000 items (safety limit)
         * - Validates range
         *
         * **Validation**:
         * ```typescript
         * const count = parseInt(input, 10);
         * if (isNaN(count) || count < 1 || count > 1000) {
         *   alert('Please enter a number between 1 and 1000');
         *   return;
         * }
         * ```
         * - Rejects invalid input
         * - Prevents extreme loads
         * - Good UX
         *
         * ## Bulk Item Creation
         *
         * **Random distribution**:
         * ```typescript
         * for (let i = 0; i < count; i++) {
         *   // Random component type
         *   const componentType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
         *
         *   // Random canvas
         *   const canvasId = canvasIds[Math.floor(Math.random() * canvasIds.length)];
         *
         *   // Random position
         *   const gridX = Math.floor(Math.random() * 40);  // 0-40 units (80% of width)
         *   const gridY = Math.floor(Math.random() * 100); // 0-100 units
         *
         *   // Create and add item
         *   addItemToCanvas(canvasId, newItem);
         * }
         * ```
         *
         * **Why random**:
         * - Tests varied layouts
         * - Distributed across canvases
         * - Realistic performance scenario
         * - Different component types
         *
         * ## Performance Optimization
         *
         * **Single state update**:
         * ```typescript
         * // Add all items first
         * for (let i = 0; i < count; i++) {
         *   addItemToCanvas(canvasId, newItem);  // Mutates state
         * }
         *
         * // Single reactivity trigger at end
         * gridState.canvases = { ...gridState.canvases };
         * ```
         *
         * **Why single update**:
         * - Avoids 100+ re-renders
         * - All items added, then render once
         * - Much faster than individual updates
         * - 100 items: ~200-500ms total
         *
         * **No undo commands**:
         * - Would bloat undo history
         * - Stress test = testing tool
         * - Not normal user operation
         * - Can clear section if needed
         *
         * ## Use Cases
         *
         * - **Test virtual rendering**: Lazy load performance
         * - **Test grid caching**: Many items share cached calculations
         * - **Test transform positioning**: GPU acceleration with many items
         * - **Identify bottlenecks**: Where does performance degrade?
         *
         * @private
         */
        this.handleStressTest = () => {
            // Prompt for number of items
            const input = prompt('How many items to add? (1-1000)', '100');
            if (!input) {
                return;
            }
            const count = parseInt(input, 10);
            if (isNaN(count) || count < 1 || count > 1000) {
                alert('Please enter a number between 1 and 1000');
                return;
            }
            // Get available component types
            const componentTypes = Object.keys(componentTemplates);
            const canvasIds = Object.keys(state.canvases);
            // Add items
            for (let i = 0; i < count; i++) {
                // Random component type
                const componentType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
                const template = componentTemplates[componentType];
                // Random canvas
                const canvasId = canvasIds[Math.floor(Math.random() * canvasIds.length)];
                const canvas = state.canvases[canvasId];
                // Random position (0-40 grid units horizontally, 0-100 grid units vertically)
                const gridX = Math.floor(Math.random() * 40);
                const gridY = Math.floor(Math.random() * 100);
                // Create new item
                const newItem = {
                    id: generateItemId(),
                    canvasId,
                    type: componentType,
                    name: `${template.title} ${i + 1}`,
                    layouts: {
                        desktop: {
                            x: gridX,
                            y: gridY,
                            width: 10,
                            height: 6, // Default 6 grid units tall
                        },
                        mobile: {
                            x: null,
                            y: null,
                            width: null,
                            height: null,
                            customized: false,
                        },
                    },
                    zIndex: canvas.zIndexCounter++,
                };
                // Add item to canvas (without pushing undo command to avoid history bloat)
                addItemToCanvas(canvasId, newItem);
            }
            // Trigger single update after all items added
            state.canvases = Object.assign({}, state.canvases);
            alert(`Added ${count} items!`);
        };
        this.itemCount = 0;
        this.showErrorHeading = false;
        this.errorHeadingText = '';
    }
    /**
     * Component will load lifecycle hook
     *
     * **Called**: Before first render
     * **Purpose**: Expose globals before child components load
     *
     * **Critical initialization**:
     * - Expose interact.js to window (required by grid-item-wrapper)
     * - Calculate initial item count
     *
     * **Why expose interact.js**:
     * - Child components (grid-item-wrapper) initialize drag/resize handlers in componentDidLoad
     * - Handlers need interact to be available immediately
     * - Cannot use ES6 imports in handlers (interact.js uses UMD)
     * - Global window.interact ensures availability
     *
     * **Order matters**:
     * - componentWillLoad runs before child components mount
     * - Guarantees interact available when children need it
     */
    componentWillLoad() {
        // Expose interact to global scope before child components load
        // This ensures drag/resize handlers in grid-item-wrapper can initialize
        window.interact = interact_min;
        // Initial item count
        this.updateItemCount();
    }
    /**
     * Component will update lifecycle hook
     *
     * **Called**: Before each re-render
     * **Purpose**: Update item count when state changes
     *
     * **Why needed**:
     * - State changes may add/remove items
     * - Item count display must stay accurate
     * - Runs before every render to ensure fresh data
     *
     * **Delegates to**: updateItemCount()
     * - Calculates total items across all canvases
     * - Uses reduce pattern for efficiency
     * - Updates @State() itemCount (triggers display update)
     */
    componentWillUpdate() {
        // Update item count when state changes
        this.updateItemCount();
    }
    /**
     * Component did load lifecycle hook
     *
     * **Called**: After first render (DOM available)
     * **Purpose**: Initialize global dependencies and keyboard shortcuts
     *
     * ## Global Initialization Sequence
     *
     * **1. Update item count**:
     * ```typescript
     * this.updateItemCount();  // Initial count display
     * ```
     *
     * **2. Initialize PerformanceMonitor** (optional):
     * ```typescript
     * if ((window as any).PerformanceMonitor) {
     *   (window as any).perfMonitor = new (window as any).PerformanceMonitor('stencil');
     * }
     * ```
     * - From shared library (may not be present)
     * - Tracks render performance metrics
     * - Helps identify bottlenecks
     * - 'stencil' tag for variant identification
     *
     * **3. Initialize VirtualRenderer**:
     * ```typescript
     * (window as any).virtualRenderer = new VirtualRenderer();
     * ```
     * - Global singleton for lazy component loading
     * - Used by grid-item-wrapper for complex components
     * - Must exist before items mount
     * - Reduces initial render cost
     *
     * **4. Add debugInteractables helper**:
     * ```typescript
     * (window as any).debugInteractables = () => { ... };
     * ```
     * - Console helper for debugging interact.js
     * - Lists all active interactables (drag/resize/dropzone)
     * - Shows configuration and state
     * - Useful for troubleshooting drag/drop issues
     *
     * **5. Setup keyboard shortcuts**:
     * ```typescript
     * document.addEventListener('keydown', this.handleKeyboard);
     * ```
     * - Global keyboard handler for all shortcuts
     * - Handles undo/redo, delete, arrow keys, escape
     * - Document-level (works anywhere in app)
     * - Cleanup in disconnectedCallback
     *
     * ## Why Global Initialization Here
     *
     * - **After DOM available**: Ensures elements exist for event listeners
     * - **Before child interactions**: Dependencies ready when children need them
     * - **One-time setup**: Doesn't re-run on re-renders
     * - **Centralized**: Single point of initialization
     *
     * ## Order Matters
     *
     * 1. VirtualRenderer must exist before grid-item-wrapper components mount
     * 2. Keyboard listener must be attached before user interactions
     * 3. PerformanceMonitor should start early to capture full lifecycle
     * 4. Debug helpers can be added any time
     */
    componentDidLoad() {
        // Initialize item count
        this.updateItemCount();
        // Initialize performance monitor (from shared library)
        if (window.PerformanceMonitor) {
            window.perfMonitor = new window.PerformanceMonitor('stencil');
        }
        // Initialize global VirtualRenderer for lazy-loading complex components
        window.virtualRenderer = new VirtualRenderer();
        // Add debug helper to inspect all interactables
        window.debugInteractables = () => {
            const interactables = interact_min.interactables.list;
            console.log('Total interactables:', interactables.length);
            interactables.forEach((interactable, index) => {
                console.log(`Interactable ${index}:`, {
                    target: interactable.target,
                    actions: interactable._actions,
                    options: interactable.options,
                });
            });
        };
        // Set up keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard);
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Called**: When component removed from DOM
     * **Purpose**: Remove keyboard event listener
     *
     * **Why needed**:
     * - Prevents memory leaks
     * - Removes document-level event listener
     * - Standard cleanup pattern
     *
     * **What if skipped**:
     * - Listener remains active even after unmount
     * - Multiple listeners accumulate on remount
     * - Memory leak (~1-5KB per unmount)
     * - Potential errors accessing unmounted component
     */
    disconnectedCallback() {
        document.removeEventListener('keydown', this.handleKeyboard);
    }
    /**
     * Handle canvas drop event (create new item)
     *
     * **Triggered by**: canvas-section dispatches 'canvas-drop' when palette item dropped
     * **Purpose**: Create new grid item from component type and add to canvas
     *
     * ## Event Flow
     *
     * ```
     * 1. User drags component from palette
     * 2. User drops on canvas
     * 3. Canvas calculates drop position (pixels)
     * 4. Canvas dispatches 'canvas-drop' event
     * 5. App receives event (this handler)
     * 6. App creates GridItem from template
     * 7. App adds item to state
     * 8. App pushes undo command
     * 9. Canvas re-renders with new item
     * ```
     *
     * ## Event Detail Structure
     *
     * ```typescript
     * {
     *   canvasId: string,      // Which canvas received the drop
     *   componentType: string, // Component type from data-component-type
     *   x: number,             // Drop position in pixels (relative to canvas)
     *   y: number              // Drop position in pixels (relative to canvas)
     * }
     * ```
     *
     * ## Item Creation Process
     *
     * **1. Validate component type**:
     * ```typescript
     * const template = componentTemplates[componentType];
     * if (!template) throw new Error(`Unknown component type`);
     * ```
     *
     * **2. Convert pixels to grid units**:
     * ```typescript
     * const gridX = pixelsToGridX(x, canvasId);  // Responsive conversion
     * const gridY = pixelsToGridY(y);            // Fixed conversion
     * ```
     *
     * **3. Get canvas for z-index**:
     * ```typescript
     * const canvas = gridState.canvases[canvasId];
     * const zIndex = canvas.zIndexCounter++;  // Monotonic increment
     * ```
     *
     * **4. Create GridItem object**:
     * ```typescript
     * const newItem = {
     *   id: generateItemId(),     // Unique ID
     *   canvasId,                 // Which canvas
     *   type: componentType,      // Component type (header, text, etc.)
     *   name: template.title,     // Display name from template
     *   layouts: {
     *     desktop: { x, y, width: 10, height: 6 },  // Default size
     *     mobile: { x: null, y: null, width: null, height: null, customized: false }
     *   },
     *   zIndex: canvas.zIndexCounter++
     * };
     * ```
     *
     * **5. Add to canvas**:
     * ```typescript
     * addItemToCanvas(canvasId, newItem);  // Helper function
     * ```
     *
     * **6. Push undo command**:
     * ```typescript
     * pushCommand(new AddItemCommand(canvasId, newItem));
     * ```
     *
     * **7. Trigger reactivity**:
     * ```typescript
     * gridState.canvases = { ...gridState.canvases };  // New object reference
     * ```
     *
     * ## Default Item Sizing
     *
     * - **Width**: 10 grid units (20% of canvas width with 2% per unit)
     * - **Height**: 6 grid units (120px with 20px per unit)
     * - **Mobile**: Not customized (will auto-layout full-width stacked)
     *
     * ## Error Handling
     *
     * **Try/catch pattern**:
     * ```typescript
     * try {
     *   // Item creation logic
     * } catch (e) {
     *   this.showErrorHeading = true;
     *   this.errorHeadingText = `Error adding component: ${e.message}`;
     *   setTimeout(() => this.showErrorHeading = false, 5000);
     * }
     * ```
     *
     * **Error scenarios**:
     * - Unknown component type (invalid data-component-type)
     * - Canvas not found (invalid canvasId)
     * - State mutation error (canvas items not array)
     *
     * **User feedback**:
     * - Error banner at top of app
     * - Auto-dismisses after 5 seconds
     * - Manual dismiss with × button
     *
     * ## Undo Support
     *
     * **AddItemCommand**:
     * - Stores canvasId and item snapshot
     * - Undo: Removes item from canvas
     * - Redo: Re-adds item at same position
     * - Preserves z-index and all properties
     *
     * @param event - CustomEvent with canvas drop details
     *
     * @example
     * ```typescript
     * // User drops header component at (100, 200) on canvas1
     * handleCanvasDrop({
     *   detail: {
     *     canvasId: 'canvas1',
     *     componentType: 'header',
     *     x: 100,  // pixels
     *     y: 200   // pixels
     *   }
     * })
     * // → gridX = 5 units (100px ÷ 20px per unit at 2%)
     * // → gridY = 10 units (200px ÷ 20px per unit)
     * // → Creates item: { x: 5, y: 10, width: 10, height: 6 }
     * // → Item appears on canvas, undo available
     * ```
     */
    handleCanvasDrop(event) {
        const { canvasId, componentType, x, y } = event.detail;
        try {
            // Get template for the component type
            const template = componentTemplates[componentType];
            if (!template) {
                throw new Error(`Unknown component type: ${componentType}`);
            }
            // Convert pixel coordinates to grid units
            const gridX = pixelsToGridX(x, canvasId);
            const gridY = pixelsToGridY(y);
            // Get canvas to determine next z-index
            const canvas = state.canvases[canvasId];
            if (!canvas) {
                throw new Error(`Canvas not found: ${canvasId}`);
            }
            // Create new item
            const newItem = {
                id: generateItemId(),
                canvasId,
                type: componentType,
                name: template.title,
                layouts: {
                    desktop: {
                        x: gridX,
                        y: gridY,
                        width: 10,
                        height: 6, // Default 6 grid units tall
                    },
                    mobile: {
                        x: null,
                        y: null,
                        width: null,
                        height: null,
                        customized: false,
                    },
                },
                zIndex: canvas.zIndexCounter++,
            };
            // Add item to canvas
            addItemToCanvas(canvasId, newItem);
            // Push undo command
            pushCommand(new AddItemCommand(canvasId, newItem));
            // Trigger update
            state.canvases = Object.assign({}, state.canvases);
        }
        catch (e) {
            this.showErrorHeading = true;
            this.errorHeadingText = `Error adding component: ${e.message || e}`;
            setTimeout(() => {
                this.showErrorHeading = false;
            }, 5000); // Auto-dismiss after 5 seconds
        }
    }
    /**
     * Handle item delete event
     *
     * **Triggered by**: grid-item-wrapper dispatches 'item-delete' when delete button clicked
     * **Purpose**: Remove item from canvas with undo support
     *
     * ## Event Flow
     *
     * ```
     * 1. User clicks delete button (×) on grid item
     * 2. grid-item-wrapper dispatches 'item-delete' event
     * 3. App receives event (this handler)
     * 4. App finds item and captures state for undo
     * 5. App pushes DeleteItemCommand
     * 6. App removes item from canvas
     * 7. Item disappears, undo available
     * ```
     *
     * ## Event Detail Structure
     *
     * ```typescript
     * {
     *   itemId: string,    // ID of item to delete
     *   canvasId: string   // Which canvas contains the item
     * }
     * ```
     *
     * ## Deletion Process
     *
     * **1. Find canvas**:
     * ```typescript
     * const canvas = gridState.canvases[canvasId];
     * if (!canvas) return;  // Safety check
     * ```
     *
     * **2. Find item and index**:
     * ```typescript
     * const itemIndex = canvas.items.findIndex(i => i.id === itemId);
     * const item = canvas.items[itemIndex];
     * if (!item) return;  // Item not found
     * ```
     *
     * **Why capture index**:
     * - Undo needs to restore item at same position
     * - Preserves z-index stacking order
     * - Critical for undo accuracy
     *
     * **3. Push undo command BEFORE deletion**:
     * ```typescript
     * pushCommand(new DeleteItemCommand(canvasId, item, itemIndex));
     * ```
     *
     * **Why before**:
     * - Command needs item data
     * - After deletion, item is gone
     * - Undo restores exact snapshot
     *
     * **4. Remove item**:
     * ```typescript
     * removeItemFromCanvas(canvasId, itemId);
     * gridState.canvases = { ...gridState.canvases };
     * ```
     *
     * **removeItemFromCanvas helper**:
     * - Filters item from items array
     * - Also clears selection if item was selected
     * - Defined in state-manager.ts
     *
     * ## Undo Support
     *
     * **DeleteItemCommand**:
     * - Stores canvasId, item snapshot, and original index
     * - Undo: Re-inserts item at original index
     * - Redo: Removes item again
     * - Preserves position, size, z-index, all properties
     *
     * ## Why Separate from Keyboard Delete
     *
     * **Two deletion paths**:
     * 1. Button click → This handler (via event)
     * 2. Delete key → handleDeleteSelected (directly)
     *
     * **Why split**:
     * - Button: Specific item (from event detail)
     * - Keyboard: Currently selected item (from gridState)
     * - Different data sources, same operation
     *
     * @param event - CustomEvent with item delete details
     *
     * @example
     * ```typescript
     * // User clicks delete on item-3 in canvas1
     * handleItemDelete({
     *   detail: {
     *     itemId: 'item-3',
     *     canvasId: 'canvas1'
     *   }
     * })
     * // → Finds item at index 2
     * // → Pushes DeleteItemCommand(canvas1, item-3, index: 2)
     * // → Removes item from state
     * // → Item disappears, undo available
     * ```
     */
    handleItemDelete(event) {
        const { itemId, canvasId } = event.detail;
        // Find the item and its index before deletion
        const canvas = state.canvases[canvasId];
        if (!canvas) {
            return;
        }
        const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
        const item = canvas.items[itemIndex];
        if (!item) {
            return;
        }
        // Push undo command before deleting
        pushCommand(new DeleteItemCommand(canvasId, item, itemIndex));
        // Delete the item
        removeItemFromCanvas(canvasId, itemId);
        state.canvases = Object.assign({}, state.canvases);
    }
    /**
     * Handle canvas move event (cross-canvas drag)
     *
     * **Triggered by**: canvas-section dispatches 'canvas-move' when item dragged to different canvas
     * **Purpose**: Move item between canvases with undo support
     *
     * ## Event Flow
     *
     * ```
     * 1. User drags item from canvas A
     * 2. User drops on canvas B
     * 3. Canvas B detects sourceCanvasId !== targetCanvasId
     * 4. Canvas B dispatches 'canvas-move' event
     * 5. App receives event (this handler)
     * 6. App captures source/target positions
     * 7. App pushes MoveItemCommand
     * 8. App moves item between canvases
     * 9. Both canvases re-render
     * ```
     *
     * ## Event Detail Structure
     *
     * ```typescript
     * {
     *   itemId: string,           // ID of item being moved
     *   sourceCanvasId: string,   // Original canvas
     *   targetCanvasId: string,   // Destination canvas
     *   x: number,                // Drop position in pixels (relative to target)
     *   y: number                 // Drop position in pixels (relative to target)
     * }
     * ```
     *
     * ## Move Process
     *
     * **1. Find item in source canvas**:
     * ```typescript
     * const sourceCanvas = gridState.canvases[sourceCanvasId];
     * const sourceIndex = sourceCanvas.items.findIndex(i => i.id === itemId);
     * const item = sourceCanvas.items[sourceIndex];
     * if (!item) return;
     * ```
     *
     * **2. Capture source position** (before changes):
     * ```typescript
     * const sourcePosition = {
     *   x: item.layouts.desktop.x,
     *   y: item.layouts.desktop.y
     * };
     * ```
     *
     * **Why capture**:
     * - Undo needs original position
     * - Before mutation occurs
     * - Exact restoration on undo
     *
     * **3. Convert drop position to grid units**:
     * ```typescript
     * const gridX = pixelsToGridX(x, targetCanvasId);
     * const gridY = pixelsToGridY(y);
     * ```
     *
     * **Why target canvas for x**:
     * - Grid width varies by canvas
     * - 2% per unit responsive to container
     * - Correct conversion for target
     *
     * **4. Capture target position**:
     * ```typescript
     * const targetPosition = { x: gridX, y: gridY };
     * ```
     *
     * **5. Push undo command BEFORE moving**:
     * ```typescript
     * pushCommand(new MoveItemCommand(
     *   itemId,
     *   sourceCanvasId,
     *   targetCanvasId,
     *   sourcePosition,
     *   targetPosition,
     *   sourceIndex
     * ));
     * ```
     *
     * **MoveItemCommand stores**:
     * - Source and target canvas IDs
     * - Source and target positions
     * - Original array index
     *
     * **6. Update item properties**:
     * ```typescript
     * item.canvasId = targetCanvasId;
     * item.layouts.desktop.x = gridX;
     * item.layouts.desktop.y = gridY;
     * ```
     *
     * **7. Remove from source canvas**:
     * ```typescript
     * sourceCanvas.items = sourceCanvas.items.filter(i => i.id !== itemId);
     * ```
     *
     * **8. Add to target canvas**:
     * ```typescript
     * const targetCanvas = gridState.canvases[targetCanvasId];
     * targetCanvas.items.push(item);
     * ```
     *
     * **9. Trigger reactivity**:
     * ```typescript
     * gridState.canvases = { ...gridState.canvases };
     * ```
     *
     * ## Same-Canvas Moves
     *
     * **Not handled here**: canvas-section only dispatches event for cross-canvas
     *
     * **Same-canvas handled by**:
     * - drag-handler.ts directly updates item position
     * - No canvas coordination needed
     * - Simpler, faster path
     *
     * ## Undo Support
     *
     * **Undo operation**:
     * - Move item back to source canvas
     * - Restore source position
     * - Insert at original index
     *
     * **Redo operation**:
     * - Move item to target canvas again
     * - Restore target position
     * - Append to target items
     *
     * @param event - CustomEvent with cross-canvas move details
     *
     * @example
     * ```typescript
     * // User drags item-5 from canvas1 to canvas2 at (300, 400)
     * handleCanvasMove({
     *   detail: {
     *     itemId: 'item-5',
     *     sourceCanvasId: 'canvas1',
     *     targetCanvasId: 'canvas2',
     *     x: 300,  // pixels relative to canvas2
     *     y: 400   // pixels relative to canvas2
     *   }
     * })
     * // → Captures source position: { x: 10, y: 5 }
     * // → Converts to grid: gridX = 15, gridY = 20
     * // → Pushes MoveItemCommand
     * // → Item moves to canvas2 at (15, 20)
     * // → Both canvases update, undo available
     * ```
     */
    handleCanvasMove(event) {
        const { itemId, sourceCanvasId, targetCanvasId, x, y } = event.detail;
        // Find the item in the source canvas
        const sourceCanvas = state.canvases[sourceCanvasId];
        const sourceIndex = sourceCanvas.items.findIndex((i) => i.id === itemId);
        const item = sourceCanvas.items[sourceIndex];
        if (!item) {
            return;
        }
        // Capture source position
        const sourcePosition = {
            x: item.layouts.desktop.x,
            y: item.layouts.desktop.y,
        };
        // Convert pixel position to grid units
        const gridX = pixelsToGridX(x, targetCanvasId);
        const gridY = pixelsToGridY(y);
        // Capture target position
        const targetPosition = {
            x: gridX,
            y: gridY,
        };
        // Push undo command before moving
        pushCommand(new MoveItemCommand(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, sourceIndex));
        // Update item's canvas ID and position
        item.canvasId = targetCanvasId;
        item.layouts.desktop.x = gridX;
        item.layouts.desktop.y = gridY;
        // Remove from source canvas
        sourceCanvas.items = sourceCanvas.items.filter((i) => i.id !== itemId);
        // Add to target canvas
        const targetCanvas = state.canvases[targetCanvasId];
        targetCanvas.items.push(item);
        // Trigger update
        state.canvases = Object.assign({}, state.canvases);
    }
    /**
     * Render component template
     *
     * **Reactive**: Re-runs when state changes (itemCount, showErrorHeading, gridState)
     * **Pure**: No side effects, only returns JSX
     *
     * ## Template Structure
     *
     * **Root** (`<Host>`):
     * - Stencil component wrapper
     * - Contains all app UI
     *
     * **Error notification** (conditional):
     * - Rendered when showErrorHeading = true
     * - Auto-dismisses after 5 seconds
     * - Manual dismiss with × button
     *
     * **App container** (`.app`):
     * - Component palette (sidebar)
     * - Canvas area (main content)
     * - Config panel (not rendered here, separate component)
     *
     * **Canvas header**:
     * - Title and description
     * - Viewport toggle (desktop/mobile)
     * - Grid toggle button
     * - Export state button
     * - Add section button
     * - Stress test button
     * - Item count display
     * - Version switcher dropdown
     *
     * **Canvases container**:
     * - Dynamic class: `.mobile-view` when currentViewport = 'mobile'
     * - Maps over canvasIds to render canvas-section components
     * - Key = canvasId for efficient diffing
     *
     * ## Dynamic Canvas Rendering
     *
     * **Pattern**:
     * ```tsx
     * {canvasIds.map((canvasId, index) => (
     *   <canvas-section
     *     canvasId={canvasId}
     *     sectionNumber={index + 1}
     *     key={canvasId}
     *   />
     * ))}
     * ```
     *
     * **Why index + 1**:
     * - Section numbers user-facing (start at 1, not 0)
     * - canvasId is technical (canvas1, canvas2)
     * - Clearer UX ("Section 1" vs "canvas1")
     *
     * @returns JSX template for entire application
     */
    render() {
        const canvasIds = Object.keys(state.canvases);
        return (h(Host, null, this.showErrorHeading && (h("div", { class: "error-notification" }, h("span", { class: "error-icon" }, "\u26A0\uFE0F"), h("span", { class: "error-text" }, this.errorHeadingText), h("button", { class: "error-dismiss", onClick: () => (this.showErrorHeading = false) }, "\u00D7"))), h("div", { class: "app" }, h("component-palette", null), h("div", { class: "canvas" }, h("div", { class: "canvas-header" }, h("h1", null, "Grid Builder POC - StencilJS Variant"), h("p", null, "Drag components from the palette into the page sections below. Build your page layout section by section."), h("div", { class: "controls" }, h("div", { class: "viewport-toggle" }, h("button", { class: {
                'viewport-btn': true,
                active: state.currentViewport === 'desktop',
            }, onClick: () => this.handleViewportChange('desktop') }, "\uD83D\uDDA5\uFE0F Desktop"), h("button", { class: {
                'viewport-btn': true,
                active: state.currentViewport === 'mobile',
            }, onClick: () => this.handleViewportChange('mobile') }, "\uD83D\uDCF1 Mobile")), h("button", { class: { active: state.showGrid }, onClick: () => this.handleGridToggle() }, state.showGrid ? 'Show Grid' : 'Hide Grid'), h("button", { onClick: () => this.handleExportState() }, "Export State"), h("button", { onClick: () => this.handleAddSection() }, "\u2795 Add Section"), h("button", { onClick: () => this.handleStressTest() }, "\uD83D\uDE80 Stress Test"), h("div", { style: {
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: '12px',
                padding: '6px 12px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
            } }, h("span", { style: { fontSize: '11px', color: '#666', marginLeft: '4px' } }, this.itemCount, " items")), h("div", { class: "version-switcher" }, h("span", { class: "version-switcher-label" }, "Version:"), h("select", { onChange: (e) => (window.location.href = e.target.value) }, h("option", { value: "../left-top/" }, "Left/Top"), h("option", { value: "../transform/" }, "Transform \uD83E\uDDEA"), h("option", { value: "../masonry/" }, "Masonry \uD83E\uDDEA"), h("option", { value: "../virtual/" }, "Virtual \uD83E\uDDEA"), h("option", { value: "../stencil/", selected: true }, "StencilJS \uD83E\uDDEA"))))), h("div", { class: {
                'canvases-container': true,
                'mobile-view': state.currentViewport === 'mobile',
            } }, canvasIds.map((canvasId, index) => (h("canvas-section", { canvasId: canvasId, sectionNumber: index + 1, key: canvasId })))))), h("config-panel", null)));
    }
};
GridBuilderApp.style = gridBuilderAppCss;

export { GridBuilderApp as grid_builder_app };

//# sourceMappingURL=grid-builder-app.entry.js.map