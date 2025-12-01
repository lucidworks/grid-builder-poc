import { r as registerInstance, h } from './index-CoCbyscT.js';
import { c as contentComponents, i as interactiveComponents, m as mediaComponents, b as blogComponentDefinitions } from './component-definitions-ZVTe1Mmn.js';
import { c as clearGridSizeCache, g as getGridSizeVertical } from './grid-calculations-C87xQzOc.js';
import { s as setActiveCanvas } from './state-manager-BtBFePO6.js';
import './blog-header-drag-clone-BuA2MVsN.js';
import './blog-article-drag-clone-lJRbfww3.js';
import './blog-button-drag-clone-CjHN4uS7.js';
import './blog-image-drag-clone-DDx9iKQX.js';
import './image-gallery-drag-clone-x1LsG3OV.js';
import './dashboard-widget-drag-clone-CWE4pYz0.js';
import './live-data-drag-clone-0Kto6HWb.js';
import './debug-BAq8PPFJ.js';

const blogAppCss = "blog-app .blog-app-container{min-height:100vh;padding:24px;background:#f8f9fa;box-sizing:border-box;}blog-app .blog-app-container.preview-mode .canvas-header{display:none}blog-app .blog-app-container .app-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-radius:8px;margin-bottom:24px;background:white;box-shadow:0 2px 4px rgba(0, 0, 0, 0.1)}blog-app .blog-app-container .app-header .app-header-content{flex:1}blog-app .blog-app-container .app-header .app-header-content .app-title{margin:0 0 4px 0;color:#212529;font-size:24px;font-weight:700}blog-app .blog-app-container .app-header .app-header-content .app-subtitle{margin:0;color:#6c757d;font-size:14px}blog-app .blog-app-container .app-header .global-controls{display:flex;align-items:center;gap:12px}blog-app .blog-app-container .app-header .global-controls .preview-toggle-btn{padding:8px 16px;border:1px solid #10b981;border-radius:6px;background:white;color:#10b981;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.15s}blog-app .blog-app-container .app-header .global-controls .preview-toggle-btn:hover{background:#10b981;color:white}blog-app .blog-app-container .app-header .global-controls .preview-toggle-btn:active{transform:translateY(1px)}blog-app .blog-app-container .app-header .global-controls .metadata-undo-redo{display:flex;gap:6px}blog-app .blog-app-container .app-header .global-controls .metadata-undo-redo button{padding:8px 14px;border:1px solid #dee2e6;border-radius:6px;background:#e9ecef;color:#495057;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.15s}blog-app .blog-app-container .app-header .global-controls .metadata-undo-redo button:hover:not(:disabled){border-color:#adb5bd;background:#dee2e6}blog-app .blog-app-container .app-header .global-controls .metadata-undo-redo button:active:not(:disabled){transform:translateY(1px)}blog-app .blog-app-container .app-header .global-controls .metadata-undo-redo button:disabled{cursor:not-allowed;opacity:0.4}blog-app .blog-app-container .app-header .global-controls .add-section-btn{padding:8px 16px;border:none;border-radius:6px;background:#4a90e2;color:white;cursor:pointer;font-size:14px;font-weight:500;transition:background 0.15s}blog-app .blog-app-container .app-header .global-controls .add-section-btn:hover{background:#357abd}blog-app .blog-app-container .app-header .global-controls .add-section-btn:active{transform:translateY(1px)}blog-app .blog-app-container{}blog-app .blog-app-container .demo-layout{display:flex;width:100%;height:calc(100vh - 120px);gap:0;overflow:hidden;}blog-app .blog-app-container{}blog-app .blog-app-container .categorized-palette-sidebar{display:flex;flex-direction:column;width:280px;height:100%;flex-shrink:0;border-right:1px solid #ddd;background:white;overflow-y:auto;overflow-x:hidden;}blog-app .blog-app-container .categorized-palette-sidebar .palette-header{display:flex;align-items:center;justify-content:space-between;padding:20px 20px 16px;border-bottom:1px solid #f0f0f0;flex-shrink:0;position:sticky;top:0;background:white;z-index:10}blog-app .blog-app-container .categorized-palette-sidebar .palette-header .palette-title{padding:0;margin:0;color:#333;font-size:18px;font-weight:600}blog-app .blog-app-container .categorized-palette-sidebar .palette-header .sidebar-collapse-btn{display:flex;width:28px;height:28px;align-items:center;justify-content:center;padding:0;border:1px solid #dee2e6;border-radius:4px;background:white;color:#495057;cursor:pointer;font-size:14px;transition:all 0.15s}blog-app .blog-app-container .categorized-palette-sidebar .palette-header .sidebar-collapse-btn:hover{border-color:#4a90e2;background:#f8f9fa;color:#4a90e2}blog-app .blog-app-container .categorized-palette-sidebar .palette-header .sidebar-collapse-btn:active{transform:scale(0.95)}blog-app .blog-app-container{}blog-app .blog-app-container .sidebar-expand-btn{position:fixed;top:200px;left:24px;z-index:1000;display:flex;width:40px;height:40px;align-items:center;justify-content:center;padding:0;border:1px solid #4a90e2;border-radius:6px;background:white;box-shadow:0 2px 8px rgba(74, 144, 226, 0.2);color:#4a90e2;cursor:pointer;font-size:16px;transition:all 0.15s}blog-app .blog-app-container .sidebar-expand-btn:hover{background:#4a90e2;box-shadow:0 4px 12px rgba(74, 144, 226, 0.3);color:white;transform:translateX(2px)}blog-app .blog-app-container .sidebar-expand-btn:active{transform:translateX(2px) scale(0.95)}blog-app .blog-app-container{}blog-app .blog-app-container .palette-category{border-bottom:1px solid #f0f0f0}blog-app .blog-app-container .palette-category .category-header{display:flex;align-items:center;padding:12px 20px;background:#f8f9fa;cursor:pointer;transition:background 0.15s;user-select:none}blog-app .blog-app-container .palette-category .category-header:hover{background:#e9ecef}blog-app .blog-app-container .palette-category .category-header .category-icon{width:16px;color:#6c757d;font-size:12px;font-weight:bold}blog-app .blog-app-container .palette-category .category-header .category-name{margin-left:8px;color:#495057;font-size:14px;font-weight:500}blog-app .blog-app-container .palette-category{}blog-app .blog-app-container .palette-category component-palette{display:block;width:100%}blog-app .blog-app-container .palette-category component-palette .palette{width:100%;padding:12px 20px;border:none;background:white;box-sizing:border-box;}blog-app .blog-app-container .palette-category component-palette{}blog-app .blog-app-container .palette-category component-palette .palette-item:has(custom-palette-item){background:transparent;padding:0;margin-bottom:12px}blog-app .blog-app-container .palette-category component-palette .palette-item{margin-bottom:8px;font-size:13px}blog-app .blog-app-container{}blog-app .blog-app-container .palette-section{border-top:2px solid #e0e0e0;background:#fafafa}blog-app .blog-app-container .palette-section .palette-section-header{padding:12px 20px;background:#f8f9fa;border-bottom:1px solid #e0e0e0}blog-app .blog-app-container .palette-section .palette-section-header .palette-section-title{margin:0;color:#495057;font-size:14px;font-weight:600}blog-app .blog-app-container .palette-section .layer-panel-container{overflow-x:hidden;}blog-app .blog-app-container .palette-section .layer-panel-container layer-panel{display:block;width:100%;box-sizing:border-box}blog-app .blog-app-container{}blog-app .blog-app-container .grid-builder-area{flex:1;height:100%;min-width:0;overflow-y:auto;overflow-x:auto;}blog-app .blog-app-container .grid-builder-area grid-builder{display:block;width:100%;min-height:600px;box-sizing:border-box;}blog-app .blog-app-container .grid-builder-area grid-builder .main-area{width:100%;box-sizing:border-box}blog-app .blog-app-container .grid-builder-area grid-builder{}blog-app .blog-app-container .grid-builder-area grid-builder .canvas-area{width:100%;min-width:0;overflow-x:hidden;box-sizing:border-box}blog-app .blog-app-container .grid-builder-area grid-builder{}blog-app .blog-app-container .grid-builder-area grid-builder .canvases-container{width:100%;max-width:100%;box-sizing:border-box}blog-app .blog-app-container .grid-builder-area grid-builder{}blog-app .blog-app-container .grid-builder-area grid-builder canvas-section{display:block;width:100%;max-width:100%;box-sizing:border-box;}blog-app .blog-app-container .grid-builder-area grid-builder canvas-section .grid-container{width:100%;box-sizing:border-box}blog-app .blog-app-container .grid-builder-area{}blog-app .blog-app-container .grid-builder-area grid-viewer{display:block;width:100%;min-height:600px;box-sizing:border-box;}blog-app .blog-app-container .grid-builder-area grid-viewer .grid-viewer-container{height:auto;min-height:600px;width:100%;box-sizing:border-box}blog-app .blog-app-container .grid-builder-area grid-viewer{}blog-app .blog-app-container .grid-builder-area grid-viewer .canvas-area{width:100%;min-width:0;overflow-x:hidden;box-sizing:border-box;height:auto}blog-app .blog-app-container .grid-builder-area grid-viewer{}blog-app .blog-app-container .grid-builder-area grid-viewer .canvases-container{width:100%;max-width:100%;box-sizing:border-box}blog-app .blog-app-container .grid-builder-area grid-viewer{}blog-app .blog-app-container .grid-builder-area grid-viewer canvas-section-viewer{display:block;width:100%;max-width:100%;box-sizing:border-box;}blog-app .blog-app-container .grid-builder-area grid-viewer canvas-section-viewer .grid-container{width:100%;box-sizing:border-box}";

var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
/**
 * Blog App Demo - Host Application for grid-builder Library
 * ==========================================================
 *
 * This component demonstrates how to build a complete page builder application
 * using the @lucidworks/stencil-grid-builder library.
 *
 * Key Library Features Demonstrated:
 * ----------------------------------
 *
 * 1. **Component Registry** (components prop)
 *    - Pass array of ComponentDefinition objects to grid-builder
 *    - Library uses these to render palette and components
 *    - See: blogComponentDefinitions in component-definitions.tsx
 *
 * 2. **Initial State** (initialState prop)
 *    - Pre-populate canvases with components
 *    - Define layouts for desktop and mobile viewports
 *    - Library manages state updates via internal store
 *
 * 3. **Canvas Metadata** (canvasMetadata prop)
 *    - Host app owns presentation metadata (titles, colors, settings)
 *    - Library owns placement state (items, layouts, zIndex)
 *    - Separation of concerns pattern
 *
 * 4. **Deletion Hook** (onBeforeDelete prop)
 *    - Intercept component deletion requests
 *    - Show confirmation modals before deletion
 *    - Make API calls or run custom validation
 *    - Return Promise<boolean> to approve/cancel deletion
 *
 * 5. **Grid Builder API** (configurable storage via api-ref prop)
 *    - Programmatic control of grid state
 *    - Methods: addCanvas, removeCanvas, undo, redo, etc.
 *    - Event system: canvasAdded, canvasRemoved, etc.
 *    - **Demo uses custom storage**: api-ref={{ target: this, key: 'api' }}
 *    - API stored on component instance (this.api) instead of window
 *
 * 6. **Event System** (canvas-click, custom events)
 *    - Listen to library events for state synchronization
 *    - React to user interactions (canvas clicks, etc.)
 *
 * 7. **Multiple Palettes Pattern** (Demonstrated in this demo)
 *    - Multiple `<component-palette>` instances with different components
 *    - Categorized/grouped components (Content, Interactive, etc.)
 *    - Collapsible category sections
 *    - All palettes drag to the same canvases
 *
 * 8. **Custom Config Panel** (Demonstrated with custom-config-panel component)
 *    - Replace library's default config panel with custom UI
 *    - Access grid state via API (this.api in this demo)
 *    - Implement live preview for real-time updates
 *    - Support cancel/revert functionality
 *    - Subscribe to componentDeleted events for auto-close
 *    - See: src/demo/components/custom-config-panel/
 *
 * Architecture Pattern:
 * --------------------
 * - Library: Manages component placement, drag/drop, resize, undo/redo
 * - Host App: Manages canvas metadata, custom UI (headers, modals), business logic
 *
 * ## Multiple Palettes Pattern (Featured in this Demo)
 *
 * **Why use multiple palettes:**
 * - Better component organization (group by category, purpose, or feature)
 * - Collapsible sections save screen space
 * - Easier to find components in large libraries
 * - Matches common UI patterns (like the example mockup)
 *
 * **How it works:**
 * 1. Create categorized component arrays:
 *    ```typescript
 *    const contentComponents = [header, article, ...];
 *    const interactiveComponents = [button, link, ...];
 *    ```
 *
 * 2. Render multiple `<component-palette>` instances:
 *    ```typescript
 *    <component-palette components={contentComponents} showHeader={false} />
 *    <component-palette components={interactiveComponents} showHeader={false} />
 *    ```
 *
 * 3. All palettes work with the same canvases:
 *    - Each palette initializes its own drag handlers
 *    - All drag to the same `<canvas-section>` dropzones
 *    - Component type (not palette source) determines behavior
 *    - grid-builder registers ALL components for rendering
 *
 * **Key Points:**
 * - Pass all components to grid-builder (for type registration)
 * - Use chromeless mode (`showHeader={false}`) for custom headers
 * - Each palette manages its own drag/drop independently
 * - Canvases accept drops from any palette
 * - No coordination needed between palettes
 *
 * **Implementation in this demo:**
 * - Content category: Headers, Articles (text-based components)
 * - Interactive category: Buttons, CTAs (action components)
 * - Collapsible sections with expand/collapse state
 * - Clean categorized UI matching modern design patterns
 *
 * ## Custom Config Panel Pattern (Featured in this Demo)
 *
 * **Why use a custom config panel:**
 * - Match your application's design system and branding
 * - Add custom validation or business logic
 * - Integrate with other parts of your application
 * - Control the user experience and workflow
 *
 * **How it works:**
 * 1. Disable the library's default config panel using the showConfigPanel prop:
 *    ```typescript
 *    <grid-builder
 *      components={components}
 *      showConfigPanel={false}  // Hide default config panel
 *      ...
 *    />
 *    ```
 
 
 
 
 
 
 
 *
 * 2. Access the Grid Builder API:
 *    ```typescript
 *    const api = (window as any).gridBuilderAPI;
 *    ```
 *
 * 3. Listen for item-click events:
 *    ```typescript
 *    document.addEventListener('item-click', (event: CustomEvent) => {
 *      const { itemId, canvasId } = event.detail;
 *      // Open your custom panel
 *    });
 *    ```
 *
 * 4. Implement live preview by directly updating state:
 *    ```typescript
 *    const state = api.getState();
 *    const canvas = state.canvases[canvasId];
 *    canvas.items[itemIndex] = {
 *      ...canvas.items[itemIndex],
 *      name: newValue
 *    };
 *    // Trigger reactivity
 *    state.canvases = { ...state.canvases };
 *    ```
 *
 * 5. Implement cancel/revert by storing original state:
 *    ```typescript
 *    // On panel open, store original values
 *    this.originalState = {
 *      name: item.name,
 *      config: { ...item.config }
 *    };
 *
 *    // On cancel, restore original values
 *    api.updateConfig(itemId, this.originalState.config);
 *    // Restore name using same pattern as live preview
 *    ```
 *
 * 6. Subscribe to componentDeleted for auto-close:
 *    ```typescript
 *    api.on('componentDeleted', (event) => {
 *      if (event.itemId === this.selectedItemId) {
 *        this.closePanel();
 *      }
 *    });
 *    ```
 *
 * **Key Library APIs Used:**
 * - `window.gridBuilderAPI` - Global API instance
 * - `api.getState()` - Get current grid state for direct manipulation
 * - `api.getItem(itemId)` - Find item across all canvases
 * - `api.updateConfig(itemId, config)` - Update item configuration
 * - `api.on(event, handler)` - Subscribe to library events
 * - `api.off(event, handler)` - Unsubscribe from library events
 *
 * **Event-driven Integration:**
 * - `item-click` - Fired when user clicks a component (use document.addEventListener)
 * - `componentDeleted` - Fired when a component is deleted (use api.on)
 * - Manual event listeners required for custom events on document
 *
 * **Implementation in this demo:**
 * - See `custom-config-panel.tsx` for complete implementation
 * - Purple gradient styling matching blog theme
 * - Live preview for component name and config fields
 * - Cancel button reverts all changes
 * - Save button persists changes
 * - Auto-closes when selected component is deleted
 */
/**
 * Section Metadata Command - Undo/Redo Support for Canvas Metadata
 * ==================================================================
 *
 * Implements Command pattern for section title and background color changes.
 * Integrates demo app metadata changes into library's unified undo/redo stack.
 *
 * **Purpose**:
 * - Enable undo/redo for section title changes
 * - Enable undo/redo for section background color changes
 * - Maintain unified undo/redo history (library operations + demo app metadata)
 *
 * **Integration**:
 * - Pushed to library's undo/redo stack via api.pushCommand()
 * - Works with library's Ctrl+Z/Ctrl+Y keyboard shortcuts
 * - Works with library's undo/redo buttons
 *
 * **Usage Pattern**:
 * ```typescript
 * // 1. Capture current state before change
 * const beforeState = { ...this.canvasMetadata[canvasId] };
 *
 * // 2. Create command with before/after states
 * const command = new SectionMetadataCommand(
 *   canvasId,
 *   beforeState,
 *   { title: 'New Title', backgroundColor: '#ffffff' },
 *   (canvasId, metadata) => {
 *     this.canvasMetadata = {
 *       ...this.canvasMetadata,
 *       [canvasId]: metadata
 *     };
 *   }
 * );
 *
 * // 3. Push to undo/redo stack
 * this.api.pushCommand(command);
 *
 * // 4. Apply the change (command.redo() not needed, we apply directly)
 * this.canvasMetadata = { ...this.canvasMetadata, [canvasId]: afterState };
 * ```
 */
class SectionMetadataCommand {
    constructor(canvasId, beforeState, afterState, updateCallback) {
        this.canvasId = canvasId;
        this.beforeState = beforeState;
        this.afterState = afterState;
        this.updateCallback = updateCallback;
    }
    undo() {
        this.updateCallback(this.canvasId, this.beforeState);
    }
    redo() {
        this.updateCallback(this.canvasId, this.afterState);
    }
}
const BlogApp = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Local undo/redo state (synced from API)
         * ------------------------------------
         *
         * Why local state instead of imported undoRedoState:
         * - Stencil reactivity doesn't work across module boundaries
         * - When demo is built separately from library, imported store is different instance
         * - Local @State() properties trigger re-renders reliably
         *
         * Synchronization:
         * - Updated via API events in setupGridBuilderIntegration()
         * - Listens to stateChanged event to update button states
         */
        this.canUndo = false;
        this.canRedo = false;
        this.sectionCounter = 1;
        /**
         * Grid Configuration
         * ------------------
         *
         * Configuration for grid-builder component.
         * Stored as class property so it can be reused in render calculations.
         */
        this.gridConfig = {
            enableAnimations: true,
            animationDuration: 100,
        };
        /**
         * Event Handler References for Cleanup
         * -------------------------------------
         *
         * Store references to event handlers so they can be removed in disconnectedCallback.
         * This prevents memory leaks when the component is unmounted.
         */
        this.gridBuilder = null;
        this.eventsToWatch = [
            "componentAdded",
            "componentDeleted",
            "componentDragged",
            "componentResized",
            "componentsBatchAdded",
            "componentsBatchDeleted",
            "canvasAdded",
            "canvasRemoved",
            "undoExecuted",
            "redoExecuted",
        ];
        /**
         * Canvas Metadata State
         * ---------------------
         *
         * Library Feature: canvasMetadata prop (optional)
         *
         * Purpose:
         * - Host app owns presentation metadata (titles, colors, custom settings)
         * - Library owns placement state (items, layouts, zIndex)
         * - This separation allows library to focus on grid logic
         *
         * Pattern:
         * - Library fires canvasAdded/canvasRemoved events
         * - Host app syncs metadata when canvases are added/removed
         * - Host app passes metadata to library via canvasMetadata prop
         * - Library passes backgroundColor to canvas-section components
         *
         * Note on Undo/Redo:
         * - Canvas add/remove operations support undo/redo (handled by library)
         * - Section metadata changes (title, color) support undo/redo via pushCommand API
         * - Custom commands integrate with library's unified undo/redo stack
         */
        this.canvasMetadata = {
            "hero-section": {
                title: "Hero Section",
                backgroundColor: "#f0f4f8",
            },
            "articles-grid": {
                title: "Articles Grid",
                backgroundColor: "#ffffff",
            },
            "footer-section": {
                title: "Footer Section",
                backgroundColor: "#e8f0f2",
            },
        };
        /**
         * Section Editor Panel State
         * ---------------------------
         *
         * Demo-specific state for section editing UI.
         * This is NOT part of the library - it's custom host app UI.
         */
        this.isPanelOpen = false;
        this.editingSection = null;
        /**
         * Confirmation Modal State
         * -------------------------
         *
         * Library Feature: Deletion Hook System
         *
         * This state demonstrates how to use the library's onBeforeDelete hook
         * to show a confirmation modal before component deletion.
         *
         * Pattern:
         * 1. Library calls onBeforeDelete with deletion context
         * 2. Host app returns Promise<boolean>
         * 3. Host app shows modal and stores Promise resolve function
         * 4. User confirms/cancels modal
         * 5. Host app calls resolve(true/false)
         * 6. Library proceeds with or cancels deletion
         *
         * Note: The modal component itself is NOT part of the library.
         * This allows you to use any modal library (Material, Bootstrap, etc.)
         */
        this.isConfirmModalOpen = false;
        this.confirmModalData = null;
        this.deleteResolve = null;
        /**
         * Categorized Palette State
         * --------------------------
         *
         * Demonstrates multiple palette pattern:
         * - Each category has its own expanded/collapsed state
         * - Multiple palettes render independently
         * - All palettes drag to the same canvases
         * - Enables better component organization
         */
        this.categoryStates = {
            content: true, // Content category expanded by default
            interactive: true, // Interactive category expanded by default
            media: true, // Media category expanded by default
        };
        /**
         * View Mode State
         * ----------------
         *
         * Toggle between edit mode (grid builder) and preview mode (viewer).
         * - Edit mode: Shows grid, palette, resize handles, config panel
         * - Preview mode: Shows only the final rendered components
         */
        this.isPreviewMode = false;
        /**
         * Current Grid State (for viewer mode)
         * -------------------------------------
         *
         * Stores the current grid state when switching to preview mode.
         * This ensures the viewer has the latest state from the builder.
         */
        this.currentGridState = null;
        /**
         * Sidebar Collapsed State
         * ------------------------
         *
         * Toggle component palette sidebar visibility.
         * - Collapsed: Hides sidebar, gives more space to canvas
         * - Expanded: Shows sidebar with components (default)
         */
        this.isSidebarCollapsed = false;
        /**
         * Preview Metadata State
         * -----------------------
         *
         * Temporary preview values for live preview (replaces DOM manipulation).
         * - Stores title/backgroundColor during section editing
         * - Merged with canvasMetadata for rendering
         * - Cleared when panel closes
         */
        this.previewMetadata = {};
        this.syncUndoRedoState = () => {
            if (!this.api)
                return;
            const newCanUndo = this.api.canUndo();
            const newCanRedo = this.api.canRedo();
            // Only update if changed (avoid unnecessary re-renders)
            if (this.canUndo !== newCanUndo) {
                this.canUndo = newCanUndo;
            }
            if (this.canRedo !== newCanRedo) {
                this.canRedo = newCanRedo;
            }
        };
        /**
         * Canvas Click Event Handler
         * ----------------------------
         *
         * Handles canvas-click events from grid-builder.
         * Stored as class method for cleanup in disconnectedCallback.
         */
        this.handleCanvasClick = (event) => {
            const { canvasId } = event.detail;
            console.log("Canvas clicked:", canvasId);
            // In a real app, this would show a canvas settings panel
            // For now, we just log it to demonstrate the event
        };
        /**
         * External Palette Click Handler
         * --------------------------------
         *
         * Handles palette-item-click events from external component-palette instances.
         * These palettes are siblings to grid-builder (not children), so we need
         * to listen on document instead of relying on grid-builder's @Listen decorator.
         *
         * This demonstrates the pattern for using multiple external palettes with
         * grid-builder in custom layouts.
         */
        this.handleExternalPaletteClick = async (event) => {
            if (!this.api) {
                console.warn("API not ready for palette click");
                return;
            }
            const { componentType } = event.detail;
            console.log("🖱️ External palette click:", componentType);
            // The grid-builder's internal logic will handle:
            // - Finding/creating active canvas
            // - Finding free space
            // - Adding component via API
            // - Visual feedback (pulse, ghost outline, fade-in)
            //
            // We just need to ensure the event reaches grid-builder.
            // Since we're listening on document, we need to manually trigger
            // grid-builder's handler by dispatching to it directly.
            const gridBuilderElement = document.querySelector("grid-builder");
            if (gridBuilderElement) {
                // Re-dispatch event to grid-builder so its @Listen decorator catches it
                // IMPORTANT: bubbles: false prevents infinite loop (event bubbling back to document)
                const newEvent = new CustomEvent("palette-item-click", {
                    detail: { componentType },
                    bubbles: false, // Don't bubble - prevents infinite loop
                    composed: true,
                });
                gridBuilderElement.dispatchEvent(newEvent);
            }
        };
        /**
         * Canvas Added Event Handler
         * ---------------------------
         *
         * Handles canvasAdded events from API.
         * Adds metadata for newly created canvases.
         */
        this.handleCanvasAdded = (event) => {
            const { canvasId } = event;
            // Add metadata for new canvas if it doesn't exist
            if (!this.canvasMetadata[canvasId]) {
                const title = `Custom Section ${this.sectionCounter++}`;
                this.canvasMetadata = Object.assign(Object.assign({}, this.canvasMetadata), { [canvasId]: {
                        title,
                        backgroundColor: "#f5f5f5",
                    } });
            }
        };
        /**
         * Canvas Removed Event Handler
         * -----------------------------
         *
         * Handles canvasRemoved events from API.
         * Removes metadata when canvases are deleted.
         */
        this.handleCanvasRemoved = (event) => {
            const { canvasId } = event;
            console.log("🗑️ canvasRemoved event received:", canvasId);
            // Remove metadata when canvas is removed
            // This keeps metadata in sync with library state
            // Headers automatically update via reactive rendering
            const updated = Object.assign({}, this.canvasMetadata);
            delete updated[canvasId];
            this.canvasMetadata = updated;
            console.log("  ✅ Metadata removed for:", canvasId);
        };
        this.handleOpenSectionEditor = (canvasId) => {
            const metadata = this.canvasMetadata[canvasId];
            if (metadata) {
                this.editingSection = {
                    canvasId,
                    title: metadata.title,
                    backgroundColor: metadata.backgroundColor,
                };
                this.isPanelOpen = true;
            }
        };
        this.handleClosePanel = () => {
            this.isPanelOpen = false;
            this.editingSection = null;
            // Clear preview state when closing panel
            this.previewMetadata = {};
        };
        this.handleUpdateSection = (event) => {
            const { canvasId, title, backgroundColor } = event.detail;
            // Capture current state before change (for undo)
            const beforeState = Object.assign({}, this.canvasMetadata[canvasId]);
            const afterState = { title, backgroundColor };
            // Create undo/redo command
            const command = new SectionMetadataCommand(canvasId, beforeState, afterState, (canvasId, metadata) => {
                // Callback used by undo/redo to update state
                this.canvasMetadata = Object.assign(Object.assign({}, this.canvasMetadata), { [canvasId]: metadata });
            });
            // Push to library's undo/redo stack
            this.api.pushCommand(command);
            // Apply the change immediately
            this.canvasMetadata = Object.assign(Object.assign({}, this.canvasMetadata), { [canvasId]: afterState });
            // Clear preview state for this canvas after saving
            const _a = this.previewMetadata, _b = canvasId, _ = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
            this.previewMetadata = rest;
        };
        /**
         * Preview Color Change Handler
         * ------------------------------
         *
         * Handles live preview of background color changes using reactive state.
         * Updates preview state which triggers re-render with new color.
         * Allows real-time preview while editing, with revert on cancel.
         */
        this.handlePreviewColorChange = (event) => {
            const { canvasId, backgroundColor } = event.detail;
            // Update preview state (triggers re-render)
            this.previewMetadata = Object.assign(Object.assign({}, this.previewMetadata), { [canvasId]: Object.assign(Object.assign({}, this.previewMetadata[canvasId]), { backgroundColor }) });
        };
        /**
         * Preview Title Change Handler
         * -----------------------------
         *
         * Handles live preview of section title changes using reactive state.
         * Updates preview state which triggers re-render with new title.
         * Allows real-time preview while editing, with revert on cancel.
         */
        this.handlePreviewTitleChange = (event) => {
            const { canvasId, title } = event.detail;
            // Update preview state (triggers re-render)
            this.previewMetadata = Object.assign(Object.assign({}, this.previewMetadata), { [canvasId]: Object.assign(Object.assign({}, this.previewMetadata[canvasId]), { title }) });
        };
        /**
         * Deletion Hook Handler
         * ----------------------
         *
         * Library Feature: onBeforeDelete Hook (grid-builder prop)
         *
         * This is the most important demonstration in this demo. It shows how to use
         * the library's deletion hook system to implement custom deletion workflows.
         *
         * What the Library Provides:
         * - onBeforeDelete prop on grid-builder component
         * - Hook receives DeletionHookContext with item data
         * - Hook returns boolean or Promise<boolean>
         * - Library waits for hook approval before deleting
         * - If hook returns false, deletion is cancelled
         * - If hook returns true, deletion proceeds
         *
         * What the Host App Provides:
         * - This hook handler function
         * - Confirmation modal component (any modal library works)
         * - Custom deletion logic (API calls, validation, etc.)
         *
         * How It Works:
         * 1. User clicks delete button on component
         * 2. Library calls this hook with deletion context
         * 3. Hook returns a Promise (doesn't resolve immediately)
         * 4. Hook shows confirmation modal
         * 5. User confirms or cancels
         * 6. Hook resolves Promise with true/false
         * 7. Library proceeds with or cancels deletion
         *
         * Why This Pattern:
         * - Keeps modal UI out of library (use any modal you want)
         * - Supports async operations (API calls, confirmations)
         * - Gives host app full control over deletion workflow
         * - Backward compatible (no hook = immediate deletion)
         *
         * Example Use Cases:
         * - Confirmation modals (this demo)
         * - API calls before deletion
         * - Permission checks
         * - Validation logic
         * - Analytics tracking
         */
        this.handleBeforeDelete = (context) => {
            return new Promise((resolve) => {
                // Store the Promise resolve function
                // We'll call this from the modal confirm/cancel handlers
                this.deleteResolve = resolve;
                // Extract component info from deletion context
                // Context provides: item (GridItem), canvasId, itemId
                const componentType = context.item.type;
                const componentName = context.item.name || componentType;
                // Show confirmation modal with component info
                // This is demo-specific - you can use any modal library
                this.confirmModalData = {
                    title: "Delete Component?",
                    message: `Are you sure you want to delete "${componentName}"? This action cannot be undone.`,
                };
                this.isConfirmModalOpen = true;
                // Promise won't resolve until user confirms/cancels
                // The library will wait for this Promise before proceeding
            });
        };
        /**
         * Confirm Deletion Handler
         * -------------------------
         *
         * Called when user clicks "Delete" button in confirmation modal.
         * Resolves the deletion hook Promise with `true` to proceed with deletion.
         */
        this.handleConfirmDelete = () => {
            this.isConfirmModalOpen = false;
            this.confirmModalData = null;
            if (this.deleteResolve) {
                this.deleteResolve(true); // Tell library to proceed with deletion
                this.deleteResolve = null;
            }
        };
        /**
         * Cancel Deletion Handler
         * ------------------------
         *
         * Called when user clicks "Cancel" button in confirmation modal.
         * Resolves the deletion hook Promise with `false` to cancel deletion.
         */
        this.handleCancelDelete = () => {
            this.isConfirmModalOpen = false;
            this.confirmModalData = null;
            if (this.deleteResolve) {
                this.deleteResolve(false); // Tell library to cancel deletion
                this.deleteResolve = null;
            }
        };
        this.handleAddSection = () => {
            if (!this.api) {
                console.error("API not ready");
                return;
            }
            const newCanvasId = `custom-section-${this.sectionCounter}`;
            // Add canvas via library API (includes undo/redo)
            this.api.addCanvas(newCanvasId);
            // Metadata will be added automatically via canvasAdded event listener
        };
        this.handleDeleteSection = (canvasId) => {
            if (!this.api) {
                console.error("API not ready");
                return;
            }
            // Prevent deleting initial sections
            if (["hero-section", "articles-grid", "footer-section"].includes(canvasId)) {
                alert("Cannot delete initial sections");
                return;
            }
            // Remove canvas via library API (includes undo/redo)
            this.api.removeCanvas(canvasId);
            // Metadata will be removed automatically via canvasRemoved event listener
            // Header will also be removed in the canvasRemoved event listener
        };
        /**
         * Handle section deletion from editor panel
         */
        this.handleDeleteSectionFromPanel = (event) => {
            const { canvasId } = event.detail;
            this.handleDeleteSection(canvasId);
            // Close the panel (already handled in section-editor-panel, but ensure it's closed)
            this.isPanelOpen = false;
        };
        /**
         * Toggle Category Collapse/Expand
         * --------------------------------
         *
         * Demonstrates state management for collapsible categories.
         * Each category (content, interactive) can be independently toggled.
         */
        this.toggleCategory = (category) => {
            this.categoryStates = Object.assign(Object.assign({}, this.categoryStates), { [category]: !this.categoryStates[category] });
        };
        /**
         * Handle Category Header Keyboard Events
         * ----------------------------------------
         *
         * Accessibility: Support keyboard navigation for category headers.
         * - Enter key: Toggle category expand/collapse
         * - Space key: Toggle category expand/collapse
         * - Prevents default behavior to avoid page scrolling on Space
         */
        this.handleCategoryKeyDown = (event, category) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.toggleCategory(category);
            }
        };
        /**
         * Toggle Preview Mode
         * -------------------
         *
         * Switches between edit mode and preview mode:
         * - Edit mode: Shows palette, grid, resize handles, editing UI
         * - Preview mode: Shows only rendered components (final output)
         *
         * Also clears both grid size cache and DOM cache to ensure fresh calculations when switching.
         */
        this.togglePreviewMode = () => {
            // Capture current state from API before switching to preview mode
            if (!this.isPreviewMode && this.api) {
                this.currentGridState = this.api.getState();
            }
            this.isPreviewMode = !this.isPreviewMode;
            // Clear grid size cache to force fresh calculations
            // This ensures items render at correct positions when switching modes
            clearGridSizeCache();
        };
        /**
         * Toggle Sidebar Collapsed
         * -------------------------
         *
         * Collapses/expands the component palette sidebar:
         * - Collapsed: Hides sidebar, gives more canvas space
         * - Expanded: Shows sidebar with categorized components
         */
        this.toggleSidebarCollapsed = () => {
            this.isSidebarCollapsed = !this.isSidebarCollapsed;
        };
        /**
         * Palette Config
         * ---------------
         *
         * Configuration shared across all component palettes.
         * Enables click-to-add functionality for all palette instances.
         */
        this.paletteConfig = {
            enableClickToAdd: true,
        };
        this.initialState = {
            canvases: {
                "hero-section": {
                    zIndexCounter: 2,
                    items: [
                        {
                            id: "hero-header",
                            canvasId: "hero-section",
                            type: "blog-header",
                            name: "Hero Header",
                            layouts: {
                                desktop: { x: 0, y: 0, width: 50, height: 6 },
                                mobile: {
                                    x: null,
                                    y: null,
                                    width: null,
                                    height: null,
                                    customized: false,
                                },
                            },
                            zIndex: 1,
                            config: {
                                title: "Welcome to My Blog",
                                subtitle: "Exploring technology, design, and development",
                            },
                        },
                        {
                            id: "hero-button",
                            canvasId: "hero-section",
                            type: "blog-button",
                            name: "Hero CTA",
                            layouts: {
                                desktop: { x: 15, y: 7, width: 20, height: 4 }, // 4 units × 20px = 80px (matches CSS min-height)
                                mobile: {
                                    x: null,
                                    y: null,
                                    width: null,
                                    height: null,
                                    customized: false,
                                },
                            },
                            zIndex: 2,
                            config: {
                                label: "Start Reading",
                                variant: "primary",
                            },
                        },
                    ],
                },
                "articles-grid": {
                    zIndexCounter: 4,
                    items: [
                        {
                            id: "article-1",
                            canvasId: "articles-grid",
                            type: "blog-article",
                            name: "First Article",
                            layouts: {
                                desktop: { x: 0, y: 0, width: 25, height: 12 },
                                mobile: {
                                    x: null,
                                    y: null,
                                    width: null,
                                    height: null,
                                    customized: false,
                                },
                            },
                            zIndex: 1,
                            config: {
                                content: "This is my first blog post about using the grid-builder library!",
                                author: "Jane Doe",
                                date: "2025-01-15",
                            },
                        },
                        {
                            id: "article-2",
                            canvasId: "articles-grid",
                            type: "blog-article",
                            name: "Second Article",
                            layouts: {
                                desktop: { x: 25, y: 0, width: 25, height: 12 },
                                mobile: {
                                    x: null,
                                    y: null,
                                    width: null,
                                    height: null,
                                    customized: false,
                                },
                            },
                            zIndex: 2,
                            config: {
                                content: "Another interesting post about custom Stencil components.",
                                author: "John Smith",
                                date: "2025-01-14",
                            },
                        },
                        {
                            id: "featured-image",
                            canvasId: "articles-grid",
                            type: "blog-image",
                            name: "Featured Image",
                            layouts: {
                                desktop: { x: 0, y: 13, width: 12, height: 15 },
                                mobile: {
                                    x: null,
                                    y: null,
                                    width: null,
                                    height: null,
                                    customized: false,
                                },
                            },
                            zIndex: 3,
                            config: {
                                src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
                                alt: "Developer workspace with laptop and code",
                                caption: "A modern development environment",
                                objectFit: "cover",
                            },
                        },
                        {
                            id: "article-3",
                            canvasId: "articles-grid",
                            type: "blog-article",
                            name: "Third Article",
                            layouts: {
                                desktop: { x: 12, y: 13, width: 26, height: 12 },
                                mobile: {
                                    x: null,
                                    y: null,
                                    width: null,
                                    height: null,
                                    customized: false,
                                },
                            },
                            zIndex: 4,
                            config: {
                                content: "Learn how to build amazing layouts with drag-and-drop functionality.",
                                author: "Alex Chen",
                                date: "2025-01-13",
                            },
                        },
                    ],
                },
                "footer-section": {
                    zIndexCounter: 2,
                    items: [
                        {
                            id: "footer-header",
                            canvasId: "footer-section",
                            type: "blog-header",
                            name: "Footer Header",
                            layouts: {
                                desktop: { x: 0, y: 0, width: 50, height: 4 },
                                mobile: {
                                    x: null,
                                    y: null,
                                    width: null,
                                    height: null,
                                    customized: false,
                                },
                            },
                            zIndex: 1,
                            config: {
                                title: "Stay Connected",
                                subtitle: "Subscribe for updates",
                            },
                        },
                        {
                            id: "footer-button",
                            canvasId: "footer-section",
                            type: "blog-button",
                            name: "Subscribe Button",
                            layouts: {
                                desktop: { x: 15, y: 5, width: 20, height: 4 }, // 4 units × 20px = 80px (matches CSS min-height)
                                mobile: {
                                    x: null,
                                    y: null,
                                    width: null,
                                    height: null,
                                    customized: false,
                                },
                            },
                            zIndex: 2,
                            config: {
                                label: "Subscribe Now",
                                variant: "primary",
                            },
                        },
                    ],
                },
            },
        };
    }
    /**
     * Watch API Property for Changes
     * --------------------------------
     *
     * StencilJS Pattern: Use @Watch decorator for reactive initialization
     *
     * When API is assigned from window.gridBuilderAPI, this watcher automatically
     * triggers setupGridBuilderIntegration(). This replaces polling pattern with
     * reactive state management.
     *
     * Fires when: componentDidLoad assigns this.api = window.gridBuilderAPI
     */
    handleApiChange(newApi) {
        if (newApi) {
            console.log("🔧 blog-app API watcher triggered, initializing...");
            this.setupGridBuilderIntegration();
        }
    }
    componentDidLoad() {
        // Grid-builder exposes API on window after componentDidLoad
        // Use requestAnimationFrame to wait for next render cycle
        requestAnimationFrame(() => {
            if (window.gridBuilderAPI) {
                console.log("🔧 blog-app found API on window, assigning...");
                this.api = window.gridBuilderAPI;
            }
            else {
                console.warn("⚠️ API not available on window.gridBuilderAPI");
            }
        });
        // Listen for palette-item-click events from external palettes
        // Note: External palettes are siblings to grid-builder, so @Listen decorator
        // in grid-builder can't catch these events. We need to listen on document.
        document.addEventListener("palette-item-click", this.handleExternalPaletteClick);
    }
    /**
     * Lifecycle: Component Disconnected
     * ----------------------------------
     *
     * StencilJS Pattern: Clean up event listeners in disconnectedCallback
     *
     * This lifecycle method is called when the component is removed from the DOM.
     * Clean up all event listeners to prevent memory leaks.
     *
     * Event Listeners to Clean Up:
     * - DOM event listener on grid-builder element (canvas-click)
     * - API event listeners (canvasAdded, canvasRemoved, undo/redo events)
     */
    disconnectedCallback() {
        console.log("🔧 blog-app disconnectedCallback - cleaning up event listeners");
        // Remove DOM event listener
        if (this.gridBuilder) {
            this.gridBuilder.removeEventListener("canvas-click", this.handleCanvasClick);
            this.gridBuilder = null;
        }
        // Remove palette-item-click listener
        document.removeEventListener("palette-item-click", this.handleExternalPaletteClick);
        // Remove API event listeners
        if (this.api) {
            this.api.off("canvasAdded", this.handleCanvasAdded);
            this.api.off("canvasRemoved", this.handleCanvasRemoved);
            // Remove undo/redo event listeners
            this.eventsToWatch.forEach((eventName) => {
                this.api.off(eventName, this.syncUndoRedoState);
            });
        }
        console.log("  ✅ Event listeners cleaned up");
    }
    setupGridBuilderIntegration() {
        console.log("🔧 blog-app setupGridBuilderIntegration called");
        /**
         * Listen to canvas-click Events
         * ------------------------------
         *
         * Library Feature: Custom Events
         *
         * The library fires custom events when users interact with the grid:
         * - canvas-click: When user clicks canvas background
         * - component-added: When component is added to grid
         * - component-removed: When component is removed from grid
         * - etc.
         *
         * These events allow host apps to respond to user interactions.
         *
         * Note: Store grid-builder reference for cleanup in disconnectedCallback.
         */
        this.gridBuilder = document.querySelector("grid-builder");
        if (this.gridBuilder) {
            this.gridBuilder.addEventListener("canvas-click", this.handleCanvasClick);
        }
        /**
         * Subscribe to Library Events
         * ----------------------------
         *
         * Library Feature: Event System (GridBuilderAPI.on)
         *
         * The API provides an event system for state change notifications:
         * - canvasAdded: Fired when canvas is added (including via undo/redo)
         * - canvasRemoved: Fired when canvas is removed (including via undo/redo)
         * - stateChanged: Fired on any state change
         *
         * This allows host apps to sync their metadata with library state.
         *
         * Pattern:
         * - Library manages placement state (items, layouts, zIndex)
         * - Library fires events when canvases are added/removed
         * - Host app adds/removes metadata in response to events
         * - This keeps host app metadata in sync with library state
         *
         * Note: Use class method handlers for cleanup in disconnectedCallback.
         */
        this.api.on("canvasAdded", this.handleCanvasAdded);
        this.api.on("canvasRemoved", this.handleCanvasRemoved);
        /**
         * Sync undo/redo button state
         * -----------------------------
         *
         * Since Stencil reactivity doesn't work across module boundaries,
         * we listen to library events that indicate undo/redo state changes.
         *
         * Events that change undo/redo state:
         * - componentAdded, componentDeleted (modify history)
         * - componentDragged, componentResized (modify history)
         * - componentsBatchAdded, componentsBatchDeleted (modify history)
         * - canvasAdded, canvasRemoved (modify history)
         *
         * This ensures undo/redo buttons update correctly in the demo.
         *
         * Note: Use class method handler for cleanup in disconnectedCallback.
         */
        // Initial sync
        this.syncUndoRedoState();
        // Listen to all events that modify history
        this.eventsToWatch.forEach((eventName) => {
            this.api.on(eventName, this.syncUndoRedoState);
        });
    }
    /**
     * Get Merged Canvas Metadata
     * ---------------------------
     *
     * Merges canvas metadata with preview state for rendering.
     * Preview state takes precedence over saved metadata for live preview.
     * @param canvasId - Canvas ID to get metadata for
     * @returns Merged metadata object with title and backgroundColor
     */
    getMergedMetadata(canvasId) {
        const baseMetadata = this.canvasMetadata[canvasId] || {
            title: canvasId,
            backgroundColor: "#ffffff",
        };
        const preview = this.previewMetadata[canvasId] || {};
        return {
            title: preview.title !== undefined ? preview.title : baseMetadata.title,
            backgroundColor: preview.backgroundColor !== undefined
                ? preview.backgroundColor
                : baseMetadata.backgroundColor,
        };
    }
    render() {
        // Calculate canvas header overlay margin from grid size (1.4 grid units)
        const verticalGridSize = getGridSizeVertical(this.gridConfig);
        const canvasHeaderOverlayMargin = -(verticalGridSize * 1.4);
        // Build merged metadata (canvas metadata + preview state) for all canvases
        const canvasIds = Object.keys(this.canvasMetadata);
        const mergedCanvasMetadata = canvasIds.reduce((acc, canvasId) => {
            acc[canvasId] = this.getMergedMetadata(canvasId);
            return acc;
        }, {});
        return (h("div", { class: `blog-app-container ${this.isPreviewMode ? "preview-mode" : ""}`, style: {
                "--canvas-header-overlay-margin": `${canvasHeaderOverlayMargin}px`,
            } }, h("div", { class: "app-header" }, h("div", { class: "app-header-content" }, h("h1", { class: "app-title" }, "Blog Layout Builder Demo"), h("p", { class: "app-subtitle" }, "Using custom Stencil components with @lucidworks/stencil-grid-builder")), h("div", { class: "global-controls" }, h("button", { class: "preview-toggle-btn", onClick: this.togglePreviewMode, title: this.isPreviewMode
                ? "Switch to Edit Mode"
                : "Switch to Preview Mode" }, this.isPreviewMode ? "✏️ Edit Mode" : "👁️ Preview"), !this.isPreviewMode && (h("div", { class: "metadata-undo-redo" }, h("button", { class: "undo-btn", onClick: () => { var _a; return (_a = this.api) === null || _a === void 0 ? void 0 : _a.undo(); }, disabled: !this.api || !this.canUndo, title: "Undo (components and sections)" }, "\u21B6 Undo"), h("button", { class: "redo-btn", onClick: () => { var _a; return (_a = this.api) === null || _a === void 0 ? void 0 : _a.redo(); }, disabled: !this.api || !this.canRedo, title: "Redo (components and sections)" }, "\u21B7 Redo"))), !this.isPreviewMode && (h("button", { class: "add-section-btn", onClick: this.handleAddSection }, "\u2795 Add Section")))), h("div", { class: "demo-layout" }, !this.isPreviewMode && !this.isSidebarCollapsed && (h("div", { class: "categorized-palette-sidebar" }, h("div", { class: "palette-header" }, h("h2", { class: "palette-title" }, "Components"), h("button", { class: "sidebar-collapse-btn", onClick: this.toggleSidebarCollapsed, title: "Collapse sidebar" }, "\u25C0")), h("div", { class: "palette-category" }, h("div", { class: "category-header", role: "button", tabindex: 0, "aria-expanded": this.categoryStates.content ? "true" : "false", "aria-controls": "content-palette-panel", "aria-label": "Content components category", onClick: () => this.toggleCategory("content"), onKeyDown: (e) => this.handleCategoryKeyDown(e, "content") }, h("span", { class: "category-icon", "aria-hidden": "true" }, this.categoryStates.content ? "▼" : "▶"), h("span", { class: "category-name" }, "Content")), h("div", { id: "content-palette-panel", role: "region", "aria-labelledby": "content-category-header" }, this.categoryStates.content && (h("component-palette", { components: contentComponents, showHeader: false, config: this.paletteConfig })))), h("div", { class: "palette-category" }, h("div", { class: "category-header", role: "button", tabindex: 0, "aria-expanded": this.categoryStates.interactive ? "true" : "false", "aria-controls": "interactive-palette-panel", "aria-label": "Interactive components category", onClick: () => this.toggleCategory("interactive"), onKeyDown: (e) => this.handleCategoryKeyDown(e, "interactive") }, h("span", { class: "category-icon", "aria-hidden": "true" }, this.categoryStates.interactive ? "▼" : "▶"), h("span", { class: "category-name" }, "Interactive")), h("div", { id: "interactive-palette-panel", role: "region", "aria-labelledby": "interactive-category-header" }, this.categoryStates.interactive && (h("component-palette", { components: interactiveComponents, showHeader: false, config: this.paletteConfig })))), h("div", { class: "palette-category" }, h("div", { class: "category-header", role: "button", tabindex: 0, "aria-expanded": this.categoryStates.media ? "true" : "false", "aria-controls": "media-palette-panel", "aria-label": "Media components category", onClick: () => this.toggleCategory("media"), onKeyDown: (e) => this.handleCategoryKeyDown(e, "media") }, h("span", { class: "category-icon", "aria-hidden": "true" }, this.categoryStates.media ? "▼" : "▶"), h("span", { class: "category-name" }, "Media")), h("div", { id: "media-palette-panel", role: "region", "aria-labelledby": "media-category-header" }, this.categoryStates.media && (h("component-palette", { components: mediaComponents, showHeader: false, config: this.paletteConfig })))), h("div", { class: "palette-section" }, h("div", { class: "palette-section-header" }, h("h3", { class: "palette-section-title" }, "Layers")), h("div", { class: "layer-panel-container" }, h("layer-panel", { api: this.api, canvasMetadata: mergedCanvasMetadata }))))), !this.isPreviewMode && this.isSidebarCollapsed && (h("button", { class: "sidebar-expand-btn", onClick: this.toggleSidebarCollapsed, title: "Expand sidebar" }, "\u25B6")), h("div", { class: "grid-builder-area" }, this.isPreviewMode ? (h("grid-viewer", { key: "viewer", components: blogComponentDefinitions, initialState: this.currentGridState || this.initialState, canvasMetadata: mergedCanvasMetadata })) : (h("grid-builder", { key: "builder", components: blogComponentDefinitions, config: this.gridConfig, initialState: this.initialState, canvasMetadata: mergedCanvasMetadata, onBeforeDelete: this.handleBeforeDelete, uiOverrides: {
                CanvasHeader: ({ canvasId, metadata, isActive, }) => {
                    const isDeletable = ![
                        "hero-section",
                        "articles-grid",
                        "footer-section",
                    ].includes(canvasId);
                    return (h("canvas-header", { canvasId: canvasId, sectionTitle: metadata.title, isDeletable: isDeletable, isActive: isActive, onHeaderClick: () => {
                            setActiveCanvas(canvasId);
                            this.handleOpenSectionEditor(canvasId);
                        }, onDeleteClick: () => this.handleDeleteSection(canvasId) }));
                },
            } })))), h("section-editor-panel", { isOpen: this.isPanelOpen, sectionData: this.editingSection, onClosePanel: this.handleClosePanel, onUpdateSection: this.handleUpdateSection, onPreviewColorChange: this.handlePreviewColorChange, onPreviewTitleChange: this.handlePreviewTitleChange, onDeleteSection: this.handleDeleteSectionFromPanel }), h("confirmation-modal", { isOpen: this.isConfirmModalOpen, data: this.confirmModalData, onConfirm: this.handleConfirmDelete, onCancel: this.handleCancelDelete }), h("custom-config-panel", { api: this.api })));
    }
    static get watchers() { return {
        "api": ["handleApiChange"]
    }; }
};
BlogApp.style = blogAppCss;

export { BlogApp as blog_app };
//# sourceMappingURL=blog-app.entry.esm.js.map
