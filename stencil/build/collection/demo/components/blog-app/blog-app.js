import { h } from "@stencil/core";
import { blogComponentDefinitions, contentComponents, interactiveComponents, mediaComponents } from "../../component-definitions";
import { getGridSizeVertical, clearGridSizeCache } from "../../../utils/grid-calculations";
import { domCache } from "../../../utils/dom-cache";
import { setActiveCanvas } from "../../../services/state-manager";
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
export class BlogApp {
    constructor() {
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
         * - Color changes are immediate (no undo for now - could be added)
         */
        this.canvasMetadata = {
            'hero-section': {
                title: 'Hero Section',
                backgroundColor: '#f0f4f8',
            },
            'articles-grid': {
                title: 'Articles Grid',
                backgroundColor: '#ffffff',
            },
            'footer-section': {
                title: 'Footer Section',
                backgroundColor: '#e8f0f2',
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
         * Track whether we've initialized the API integration
         */
        this.apiInitialized = false;
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
        this.updateCanvasStyles = () => {
            // Apply canvas background colors via CSS custom properties
            Object.keys(this.canvasMetadata).forEach((canvasId) => {
                const canvas = document.querySelector(`[data-canvas-id="${canvasId}"] .grid-container`);
                if (canvas) {
                    canvas.style.backgroundColor = this.canvasMetadata[canvasId].backgroundColor;
                }
            });
        };
        this.removeCanvasHeader = (canvasId) => {
            console.log('🔍 removeCanvasHeader called for:', canvasId);
            // Find and remove the header for this canvas
            const headers = document.querySelectorAll('.canvas-header');
            console.log('  📋 Total headers found:', headers.length);
            let removed = false;
            headers.forEach((header) => {
                const headerCanvasId = header.getAttribute('data-canvas-id');
                console.log('  🔎 Checking header with data-canvas-id:', headerCanvasId);
                if (headerCanvasId === canvasId) {
                    console.log('  ✅ Match found! Removing header for:', canvasId);
                    header.remove();
                    removed = true;
                }
            });
            if (!removed) {
                console.warn('  ⚠️ No matching header found for:', canvasId);
            }
        };
        this.injectCanvasHeaders = () => {
            // Inject section headers before each canvas-section
            Object.keys(this.canvasMetadata).forEach((canvasId) => {
                var _a, _b;
                // Find canvas-section by looking for the inner div with data-canvas-id
                const innerDiv = document.querySelector(`[data-canvas-id="${canvasId}"]`);
                if (!innerDiv)
                    return;
                const canvasSection = innerDiv.closest('canvas-section');
                if (!canvasSection)
                    return;
                // Check if header already exists
                let header = canvasSection.previousElementSibling;
                if (header && header.tagName.toLowerCase() === 'canvas-header') {
                    // Update existing header component - update sectionTitle prop
                    header.sectionTitle = ((_a = this.canvasMetadata[canvasId]) === null || _a === void 0 ? void 0 : _a.title) || canvasId;
                }
                else {
                    // Create new header component
                    header = this.createCanvasHeader(canvasId);
                    (_b = canvasSection.parentElement) === null || _b === void 0 ? void 0 : _b.insertBefore(header, canvasSection);
                }
            });
        };
        this.createCanvasHeader = (canvasId) => {
            var _a;
            // Create canvas-header component element
            const header = document.createElement('canvas-header');
            // Set component properties
            header.canvasId = canvasId;
            header.sectionTitle = ((_a = this.canvasMetadata[canvasId]) === null || _a === void 0 ? void 0 : _a.title) || canvasId;
            header.isDeletable = !['hero-section', 'articles-grid', 'footer-section'].includes(canvasId);
            // Add event listeners
            header.addEventListener('headerClick', () => {
                // Activate the canvas (adds visual highlight)
                setActiveCanvas(canvasId);
                // Open section editor panel
                this.handleOpenSectionEditor(canvasId);
            });
            header.addEventListener('deleteClick', () => {
                this.handleDeleteSection(canvasId);
            });
            return header;
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
        };
        this.handleUpdateSection = (event) => {
            const { canvasId, title, backgroundColor } = event.detail;
            this.canvasMetadata = Object.assign(Object.assign({}, this.canvasMetadata), { [canvasId]: {
                    title,
                    backgroundColor,
                } });
        };
        /**
         * Preview Color Change Handler
         * ------------------------------
         *
         * Handles live preview of background color changes.
         * Updates canvas background immediately without saving to metadata.
         * This allows real-time preview while editing, with revert on cancel.
         */
        this.handlePreviewColorChange = (event) => {
            const { canvasId, backgroundColor } = event.detail;
            // Directly update canvas background color (don't update metadata yet)
            const canvas = document.querySelector(`[data-canvas-id="${canvasId}"] .grid-container`);
            if (canvas) {
                canvas.style.backgroundColor = backgroundColor;
            }
        };
        /**
         * Preview Title Change Handler
         * -----------------------------
         *
         * Handles live preview of section title changes.
         * Updates canvas title immediately without saving to metadata.
         * This allows real-time preview while editing, with revert on cancel.
         */
        this.handlePreviewTitleChange = (event) => {
            const { canvasId, title } = event.detail;
            // Find the canvas header for this canvas
            const header = document.querySelector(`.canvas-header[data-canvas-id="${canvasId}"]`);
            if (header) {
                const titleEl = header.querySelector('.canvas-title');
                if (titleEl) {
                    // Directly update title text (don't update metadata yet)
                    titleEl.textContent = title;
                }
            }
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
                    title: 'Delete Component?',
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
                console.error('API not ready');
                return;
            }
            const newCanvasId = `custom-section-${this.sectionCounter}`;
            // Add canvas via library API (includes undo/redo)
            this.api.addCanvas(newCanvasId);
            // Metadata will be added automatically via canvasAdded event listener
        };
        this.handleDeleteSection = (canvasId) => {
            if (!this.api) {
                console.error('API not ready');
                return;
            }
            // Prevent deleting initial sections
            if (['hero-section', 'articles-grid', 'footer-section'].includes(canvasId)) {
                alert('Cannot delete initial sections');
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
            // Clear both caches to force fresh calculations
            // Grid size cache: Clears cached grid unit sizes
            // DOM cache: Clears cached canvas element references (prevents stale DOM references)
            clearGridSizeCache();
            domCache.clear();
            // This ensures items render at correct positions when switching modes
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
        this.initialState = {
            canvases: {
                'hero-section': {
                    zIndexCounter: 2,
                    items: [
                        {
                            id: 'hero-header',
                            canvasId: 'hero-section',
                            type: 'blog-header',
                            name: 'Hero Header',
                            layouts: {
                                desktop: { x: 0, y: 0, width: 50, height: 6 },
                                mobile: { x: null, y: null, width: null, height: null, customized: false },
                            },
                            zIndex: 1,
                            config: {
                                title: 'Welcome to My Blog',
                                subtitle: 'Exploring technology, design, and development',
                            },
                        },
                        {
                            id: 'hero-button',
                            canvasId: 'hero-section',
                            type: 'blog-button',
                            name: 'Hero CTA',
                            layouts: {
                                desktop: { x: 15, y: 7, width: 20, height: 3 },
                                mobile: { x: null, y: null, width: null, height: null, customized: false },
                            },
                            zIndex: 2,
                            config: {
                                label: 'Start Reading',
                                variant: 'primary',
                            },
                        },
                    ],
                },
                'articles-grid': {
                    zIndexCounter: 4,
                    items: [
                        {
                            id: 'article-1',
                            canvasId: 'articles-grid',
                            type: 'blog-article',
                            name: 'First Article',
                            layouts: {
                                desktop: { x: 0, y: 0, width: 25, height: 12 },
                                mobile: { x: null, y: null, width: null, height: null, customized: false },
                            },
                            zIndex: 1,
                            config: {
                                content: 'This is my first blog post about using the grid-builder library!',
                                author: 'Jane Doe',
                                date: '2025-01-15',
                            },
                        },
                        {
                            id: 'article-2',
                            canvasId: 'articles-grid',
                            type: 'blog-article',
                            name: 'Second Article',
                            layouts: {
                                desktop: { x: 25, y: 0, width: 25, height: 12 },
                                mobile: { x: null, y: null, width: null, height: null, customized: false },
                            },
                            zIndex: 2,
                            config: {
                                content: 'Another interesting post about custom Stencil components.',
                                author: 'John Smith',
                                date: '2025-01-14',
                            },
                        },
                        {
                            id: 'featured-image',
                            canvasId: 'articles-grid',
                            type: 'blog-image',
                            name: 'Featured Image',
                            layouts: {
                                desktop: { x: 0, y: 13, width: 12, height: 15 },
                                mobile: { x: null, y: null, width: null, height: null, customized: false },
                            },
                            zIndex: 3,
                            config: {
                                src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
                                alt: 'Developer workspace with laptop and code',
                                caption: 'A modern development environment',
                                objectFit: 'cover',
                            },
                        },
                        {
                            id: 'article-3',
                            canvasId: 'articles-grid',
                            type: 'blog-article',
                            name: 'Third Article',
                            layouts: {
                                desktop: { x: 12, y: 13, width: 26, height: 12 },
                                mobile: { x: null, y: null, width: null, height: null, customized: false },
                            },
                            zIndex: 4,
                            config: {
                                content: 'Learn how to build amazing layouts with drag-and-drop functionality.',
                                author: 'Alex Chen',
                                date: '2025-01-13',
                            },
                        },
                    ],
                },
                'footer-section': {
                    zIndexCounter: 2,
                    items: [
                        {
                            id: 'footer-header',
                            canvasId: 'footer-section',
                            type: 'blog-header',
                            name: 'Footer Header',
                            layouts: {
                                desktop: { x: 0, y: 0, width: 50, height: 4 },
                                mobile: { x: null, y: null, width: null, height: null, customized: false },
                            },
                            zIndex: 1,
                            config: {
                                title: 'Stay Connected',
                                subtitle: 'Subscribe for updates',
                            },
                        },
                        {
                            id: 'footer-button',
                            canvasId: 'footer-section',
                            type: 'blog-button',
                            name: 'Subscribe Button',
                            layouts: {
                                desktop: { x: 15, y: 5, width: 20, height: 3 },
                                mobile: { x: null, y: null, width: null, height: null, customized: false },
                            },
                            zIndex: 2,
                            config: {
                                label: 'Subscribe Now',
                                variant: 'primary',
                            },
                        },
                    ],
                },
            },
        };
    }
    componentWillLoad() {
        // Grid-builder components are built alongside the demo
        this.updateCanvasStyles();
    }
    componentDidLoad() {
        // Wait for grid-builder to initialize and expose API on window
        // Check every 50ms for up to 2 seconds
        let attempts = 0;
        const maxAttempts = 40; // 2 seconds / 50ms
        const checkForAPI = () => {
            attempts++;
            if (window.gridBuilderAPI) {
                console.log('🔧 blog-app found API on window, initializing...');
                this.api = window.gridBuilderAPI;
                this.setupGridBuilderIntegration();
            }
            else if (attempts < maxAttempts) {
                setTimeout(checkForAPI, 50);
            }
            else {
                console.warn('⚠️ blog-app timeout waiting for API');
            }
        };
        checkForAPI();
    }
    setupGridBuilderIntegration() {
        console.log('🔧 blog-app setupGridBuilderIntegration called', {
            apiInitialized: this.apiInitialized,
            hasApi: !!this.api,
            apiType: typeof this.api,
        });
        // Only initialize once, and only when API is available
        if (this.apiInitialized || !this.api) {
            console.log('  ⏭️ Skipping setup -', {
                alreadyInitialized: this.apiInitialized,
                noApi: !this.api,
            });
            return;
        }
        console.log('  ✅ Proceeding with API setup');
        this.apiInitialized = true;
        // Inject canvas headers after initial render
        // This is demo-specific UI (not part of library)
        setTimeout(() => {
            this.injectCanvasHeaders();
        }, 100);
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
         */
        const gridBuilder = document.querySelector('grid-builder');
        if (gridBuilder) {
            gridBuilder.addEventListener('canvas-click', ((event) => {
                const { canvasId } = event.detail;
                console.log('Canvas clicked:', canvasId);
                // In a real app, this would show a canvas settings panel
                // For now, we just log it to demonstrate the event
            }));
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
         */
        this.api.on('canvasAdded', (event) => {
            const { canvasId } = event;
            // Add metadata for new canvas if it doesn't exist
            if (!this.canvasMetadata[canvasId]) {
                const title = `Custom Section ${this.sectionCounter++}`;
                this.canvasMetadata = Object.assign(Object.assign({}, this.canvasMetadata), { [canvasId]: {
                        title,
                        backgroundColor: '#f5f5f5',
                    } });
            }
        });
        this.api.on('canvasRemoved', (event) => {
            const { canvasId } = event;
            console.log('🗑️ canvasRemoved event received:', canvasId);
            // Remove metadata when canvas is removed
            // This keeps metadata in sync with library state
            const updated = Object.assign({}, this.canvasMetadata);
            delete updated[canvasId];
            this.canvasMetadata = updated;
            console.log('  ✅ Metadata removed for:', canvasId);
            // Remove injected header (demo-specific UI)
            this.removeCanvasHeader(canvasId);
            console.log('  ✅ Header removal attempted for:', canvasId);
        });
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
         */
        // Initial sync
        this.syncUndoRedoState();
        // Listen to all events that modify history
        const eventsToWatch = [
            'componentAdded',
            'componentDeleted',
            'componentDragged',
            'componentResized',
            'componentsBatchAdded',
            'componentsBatchDeleted',
            'canvasAdded',
            'canvasRemoved',
            'undoExecuted', // Library emits this when undo() is called
            'redoExecuted' // Library emits this when redo() is called
        ];
        eventsToWatch.forEach(eventName => {
            this.api.on(eventName, this.syncUndoRedoState);
        });
    }
    componentDidUpdate() {
        // Update canvas styles whenever metadata changes
        this.updateCanvasStyles();
        // Inject canvas headers
        this.injectCanvasHeaders();
    }
    render() {
        // Calculate canvas header overlay margin from grid size (1.4 grid units)
        const verticalGridSize = getGridSizeVertical();
        const canvasHeaderOverlayMargin = -(verticalGridSize * 1.4);
        return (h("div", { key: 'cfa02ba9a6db80b81104d89b14125f914de883e3', class: `blog-app-container ${this.isPreviewMode ? 'preview-mode' : ''}`, style: {
                '--canvas-header-overlay-margin': `${canvasHeaderOverlayMargin}px`,
            } }, h("div", { key: '830bf861ad338288a2e34197d9ec66d9f38ffc5f', class: "app-header" }, h("div", { key: '11248cdfca1c324edb257a96f7c84f7fdcf6b8b7', class: "app-header-content" }, h("h1", { key: '5ef0303fcb7505447cc178245e5257ad9a332fdb', class: "app-title" }, "Blog Layout Builder Demo"), h("p", { key: 'fae2b9f748bafefc99a0a6d1168d2440baf853a9', class: "app-subtitle" }, "Using custom Stencil components with @lucidworks/stencil-grid-builder")), h("div", { key: 'b944bf094e68c576a53f7d0d4070680ab297e39a', class: "global-controls" }, h("button", { key: '96aae052ca8e48c3a0c571776f1fcbaa83ea75b6', class: "preview-toggle-btn", onClick: this.togglePreviewMode, title: this.isPreviewMode ? 'Switch to Edit Mode' : 'Switch to Preview Mode' }, this.isPreviewMode ? '✏️ Edit Mode' : '👁️ Preview'), !this.isPreviewMode && (h("div", { key: 'c077f3b77a81a743883d0405f4ffb3200663f28a', class: "metadata-undo-redo" }, h("button", { key: '6cb27f6b43d16bedcbfd62061028e6053a35bfe9', class: "undo-btn", onClick: () => { var _a; return (_a = this.api) === null || _a === void 0 ? void 0 : _a.undo(); }, disabled: !this.api || !this.canUndo, title: "Undo (components and sections)" }, "\u21B6 Undo"), h("button", { key: '4f05fbedd8efe7d68e85393fb55b45730b4cffbd', class: "redo-btn", onClick: () => { var _a; return (_a = this.api) === null || _a === void 0 ? void 0 : _a.redo(); }, disabled: !this.api || !this.canRedo, title: "Redo (components and sections)" }, "\u21B7 Redo"))), !this.isPreviewMode && (h("button", { key: 'e080740586e0753256b2862e9df4b42810455e1a', class: "add-section-btn", onClick: this.handleAddSection }, "\u2795 Add Section")))), h("div", { key: '85f1ccaed6dab65d1c95a8f15fa69aef4c8caefe', class: "demo-layout" }, !this.isPreviewMode && !this.isSidebarCollapsed && (h("div", { key: 'c0129f6e349c213df06defa7b2d82952a4b1a9f2', class: "categorized-palette-sidebar" }, h("div", { key: '3df94c000278f4f596f1c11ce4b5a1084055eb60', class: "palette-header" }, h("h2", { key: '2cda6fbe4be7484a36a8be71016fa3a182119657', class: "palette-title" }, "Components"), h("button", { key: '7a865032a01e27e23bd6fd040c38a049407a333f', class: "sidebar-collapse-btn", onClick: this.toggleSidebarCollapsed, title: "Collapse sidebar" }, "\u25C0")), h("div", { key: '72ed1638d79ae5d51000e5e7418a7899c79e43e4', class: "palette-category" }, h("div", { key: '499253e5bcbe1ed3e10f269e8be84d9b34ba2ea6', class: "category-header", onClick: () => this.toggleCategory('content') }, h("span", { key: '61bcfaf4c4899ca3fcaeeb2220a7365c557f6e4c', class: "category-icon" }, this.categoryStates.content ? '▼' : '▶'), h("span", { key: '5301a01849441bb4f027c41b765fcbb5c4c8f890', class: "category-name" }, "Content")), this.categoryStates.content && (h("component-palette", { key: '58d3424114471514260d2d3ae20144d59098318c', components: contentComponents, showHeader: false }))), h("div", { key: '6f27ebda791f0ec1e9cd092327cf97bea22c74f5', class: "palette-category" }, h("div", { key: 'da8b0e1855763783b4c132b249f813b1821bb6d3', class: "category-header", onClick: () => this.toggleCategory('interactive') }, h("span", { key: '58fd3d5f2164d27541f4afc786be16d204070c04', class: "category-icon" }, this.categoryStates.interactive ? '▼' : '▶'), h("span", { key: '956fd520e4c6ee0b584ee5550474cd0ad4b25b42', class: "category-name" }, "Interactive")), this.categoryStates.interactive && (h("component-palette", { key: '34ebd5f8067bd3bd13d78e11a31798d020436922', components: interactiveComponents, showHeader: false }))), h("div", { key: 'e3cf66cbba9c7c38ba286e33cd8a64846761a06c', class: "palette-category" }, h("div", { key: '96848658b1feccf9230103fd6ab9b6c6779b618d', class: "category-header", onClick: () => this.toggleCategory('media') }, h("span", { key: 'ec7096e620adeeff463f49eb62163479bd8a74f6', class: "category-icon" }, this.categoryStates.media ? '▼' : '▶'), h("span", { key: '03fc0e4be223d9aa7641b400da52d523626d0741', class: "category-name" }, "Media")), this.categoryStates.media && (h("component-palette", { key: 'e739d4579641d6c695f8a408d42cbc34aeae153e', components: mediaComponents, showHeader: false }))))), !this.isPreviewMode && this.isSidebarCollapsed && (h("button", { key: '9a528b6dcf54d4cdc099e15303cf773c3100f53c', class: "sidebar-expand-btn", onClick: this.toggleSidebarCollapsed, title: "Expand sidebar" }, "\u25B6")), h("div", { key: 'c6c01209c3d92eae010fc423cf96e7554f3ce5f9', class: "grid-builder-area" }, this.isPreviewMode ? (h("grid-viewer", { key: "viewer", components: blogComponentDefinitions, initialState: this.currentGridState || this.initialState, canvasMetadata: this.canvasMetadata })) : (h("grid-builder", { key: "builder", components: blogComponentDefinitions, config: {
                enableAnimations: true,
                animationDuration: 100,
            }, initialState: this.initialState, canvasMetadata: this.canvasMetadata, onBeforeDelete: this.handleBeforeDelete })))), h("section-editor-panel", { key: '64f4640e25fb83ba1a3f06363f02cefa894f9f06', isOpen: this.isPanelOpen, sectionData: this.editingSection, onClosePanel: this.handleClosePanel, onUpdateSection: this.handleUpdateSection, onPreviewColorChange: this.handlePreviewColorChange, onPreviewTitleChange: this.handlePreviewTitleChange, onDeleteSection: this.handleDeleteSectionFromPanel }), h("confirmation-modal", { key: 'deed0f941e0e2947af3255a2b3813360d15d8583', isOpen: this.isConfirmModalOpen, data: this.confirmModalData, onConfirm: this.handleConfirmDelete, onCancel: this.handleCancelDelete }), h("custom-config-panel", { key: 'b6c78f5cbf1e6ea0d7322d7611f1985bbfc38a85', api: this.api })));
    }
    static get is() { return "blog-app"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-app.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-app.css"]
        };
    }
    static get states() {
        return {
            "api": {},
            "canUndo": {},
            "canRedo": {},
            "canvasMetadata": {},
            "isPanelOpen": {},
            "editingSection": {},
            "isConfirmModalOpen": {},
            "confirmModalData": {},
            "categoryStates": {},
            "isPreviewMode": {},
            "currentGridState": {},
            "isSidebarCollapsed": {},
            "initialState": {}
        };
    }
}
//# sourceMappingURL=blog-app.js.map
