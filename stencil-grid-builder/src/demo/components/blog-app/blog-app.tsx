import { Component, h, State } from '@stencil/core';
import { blogComponentDefinitions, contentComponents, interactiveComponents, mediaComponents } from '../../component-definitions';
import { GridBuilderAPI } from '../../../types/api';
import { SectionEditorData } from '../../types/section-editor-data';
import { ConfirmationModalData } from '../../types/confirmation-modal-data';
import { DeletionHookContext } from '../../../types/deletion-hook';
import { getGridSizeVertical, clearGridSizeCache } from '../../../utils/grid-calculations';
import { domCache } from '../../../utils/dom-cache';
import { setActiveCanvas } from '../../../services/state-manager';

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

@Component({
  tag: 'blog-app',
  styleUrl: 'blog-app.scss',
  shadow: false,
})
export class BlogApp {
  /**
   * Grid Builder API instance (accessed from window.gridBuilderAPI)
   * Must be @State to trigger re-render when API becomes available
   */
  @State() private api!: GridBuilderAPI;

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
  @State() private canUndo: boolean = false;
  @State() private canRedo: boolean = false;

  private sectionCounter = 1;

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
  @State() canvasMetadata: Record<string, { title: string; backgroundColor: string }> = {
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
  @State() isPanelOpen: boolean = false;
  @State() editingSection: SectionEditorData | null = null;

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
  @State() isConfirmModalOpen: boolean = false;
  @State() confirmModalData: ConfirmationModalData | null = null;
  private deleteResolve: ((value: boolean) => void) | null = null;

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
  @State() categoryStates: Record<string, boolean> = {
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
  @State() isPreviewMode: boolean = false;

  /**
   * Current Grid State (for viewer mode)
   * -------------------------------------
   *
   * Stores the current grid state when switching to preview mode.
   * This ensures the viewer has the latest state from the builder.
   */
  @State() currentGridState: any = null;

  /**
   * Sidebar Collapsed State
   * ------------------------
   *
   * Toggle component palette sidebar visibility.
   * - Collapsed: Hides sidebar, gives more space to canvas
   * - Expanded: Shows sidebar with components (default)
   */
  @State() isSidebarCollapsed: boolean = false;

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

      if ((window as any).gridBuilderAPI) {
        console.log('🔧 blog-app found API on window, initializing...');
        this.api = (window as any).gridBuilderAPI;
        this.setupGridBuilderIntegration();
      } else if (attempts < maxAttempts) {
        setTimeout(checkForAPI, 50);
      } else {
        console.warn('⚠️ blog-app timeout waiting for API');
      }
    };

    checkForAPI();
  }

  /**
   * Track whether we've initialized the API integration
   */
  private apiInitialized = false;

  private setupGridBuilderIntegration() {
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
      gridBuilder.addEventListener('canvas-click', ((event: CustomEvent) => {
        const { canvasId } = event.detail;
        console.log('Canvas clicked:', canvasId);
        // In a real app, this would show a canvas settings panel
        // For now, we just log it to demonstrate the event
      }) as EventListener);
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
        this.canvasMetadata = {
          ...this.canvasMetadata,
          [canvasId]: {
            title,
            backgroundColor: '#f5f5f5',
          },
        };
      }
    });

    this.api.on('canvasRemoved', (event) => {
      const { canvasId } = event;
      console.log('🗑️ canvasRemoved event received:', canvasId);

      // Remove metadata when canvas is removed
      // This keeps metadata in sync with library state
      const updated = { ...this.canvasMetadata };
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
      'undoExecuted',  // Library emits this when undo() is called
      'redoExecuted'   // Library emits this when redo() is called
    ];

    eventsToWatch.forEach(eventName => {
      this.api.on(eventName, this.syncUndoRedoState);
    });
  }

  private syncUndoRedoState = () => {
    if (!this.api) return;

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

  componentDidUpdate() {
    // Update canvas styles whenever metadata changes
    this.updateCanvasStyles();
    // Inject canvas headers
    this.injectCanvasHeaders();
  }

  private updateCanvasStyles = () => {
    // Apply canvas background colors via CSS custom properties
    Object.keys(this.canvasMetadata).forEach((canvasId) => {
      const canvas = document.querySelector(`[data-canvas-id="${canvasId}"] .grid-container`) as HTMLElement;
      if (canvas) {
        canvas.style.backgroundColor = this.canvasMetadata[canvasId].backgroundColor;
      }
    });
  };

  private removeCanvasHeader = (canvasId: string) => {
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

  private injectCanvasHeaders = () => {
    // Inject section headers before each canvas-section
    Object.keys(this.canvasMetadata).forEach((canvasId) => {
      // Find canvas-section by looking for the inner div with data-canvas-id
      const innerDiv = document.querySelector(`[data-canvas-id="${canvasId}"]`) as HTMLElement;
      if (!innerDiv) return;

      const canvasSection = innerDiv.closest('canvas-section') as HTMLElement;
      if (!canvasSection) return;

      // Check if header already exists
      let header = canvasSection.previousElementSibling as HTMLElement;
      if (header && header.classList.contains('canvas-header')) {
        // Update existing header - just update text content
        const titleEl = header.querySelector('.canvas-title') as HTMLElement;
        if (titleEl) {
          titleEl.textContent = this.canvasMetadata[canvasId]?.title || canvasId;
        }
      } else {
        // Create new header
        header = this.createCanvasHeader(canvasId);
        canvasSection.parentElement?.insertBefore(header, canvasSection);
      }
    });
  };

  private createCanvasHeader = (canvasId: string): HTMLElement => {
    const header = document.createElement('div');
    header.className = 'canvas-header';
    header.setAttribute('data-canvas-id', canvasId);

    const actions = document.createElement('div');
    actions.className = 'canvas-actions';

    // Section title badge (clickable to open editor and activate canvas)
    const title = document.createElement('span');
    title.className = 'canvas-title';
    title.textContent = this.canvasMetadata[canvasId]?.title || canvasId;
    title.addEventListener('click', () => {
      // Activate the canvas (adds visual highlight)
      setActiveCanvas(canvasId);
      // Open section editor panel
      this.handleOpenSectionEditor(canvasId);
    });
    actions.appendChild(title);

    // Add delete button for custom sections (icon only)
    if (!['hero-section', 'articles-grid', 'footer-section'].includes(canvasId)) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-canvas-btn';
      deleteBtn.innerHTML = '×'; // Clean X icon
      deleteBtn.title = 'Delete this section';
      deleteBtn.addEventListener('click', () => {
        this.handleDeleteSection(canvasId);
      });
      actions.appendChild(deleteBtn);
    }

    header.appendChild(actions);

    return header;
  };

  private handleOpenSectionEditor = (canvasId: string) => {
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

  private handleClosePanel = () => {
    this.isPanelOpen = false;
    this.editingSection = null;
  };

  private handleUpdateSection = (event: CustomEvent<{ canvasId: string; title: string; backgroundColor: string }>) => {
    const { canvasId, title, backgroundColor } = event.detail;
    this.canvasMetadata = {
      ...this.canvasMetadata,
      [canvasId]: {
        title,
        backgroundColor,
      },
    };
  };

  /**
   * Preview Color Change Handler
   * ------------------------------
   *
   * Handles live preview of background color changes.
   * Updates canvas background immediately without saving to metadata.
   * This allows real-time preview while editing, with revert on cancel.
   */
  private handlePreviewColorChange = (event: CustomEvent<{ canvasId: string; backgroundColor: string }>) => {
    const { canvasId, backgroundColor } = event.detail;
    // Directly update canvas background color (don't update metadata yet)
    const canvas = document.querySelector(`[data-canvas-id="${canvasId}"] .grid-container`) as HTMLElement;
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
  private handlePreviewTitleChange = (event: CustomEvent<{ canvasId: string; title: string }>) => {
    const { canvasId, title } = event.detail;
    // Find the canvas header for this canvas
    const header = document.querySelector(`.canvas-header[data-canvas-id="${canvasId}"]`) as HTMLElement;
    if (header) {
      const titleEl = header.querySelector('.canvas-title') as HTMLElement;
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
  private handleBeforeDelete = (context: DeletionHookContext): Promise<boolean> => {
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
  private handleConfirmDelete = () => {
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
  private handleCancelDelete = () => {
    this.isConfirmModalOpen = false;
    this.confirmModalData = null;
    if (this.deleteResolve) {
      this.deleteResolve(false); // Tell library to cancel deletion
      this.deleteResolve = null;
    }
  };

  private handleAddSection = () => {
    if (!this.api) {
      console.error('API not ready');
      return;
    }

    const newCanvasId = `custom-section-${this.sectionCounter}`;

    // Add canvas via library API (includes undo/redo)
    this.api.addCanvas(newCanvasId);

    // Metadata will be added automatically via canvasAdded event listener
  };

  private handleDeleteSection = (canvasId: string) => {
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
  private handleDeleteSectionFromPanel = (event: CustomEvent<{ canvasId: string }>) => {
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
  private toggleCategory = (category: string) => {
    this.categoryStates = {
      ...this.categoryStates,
      [category]: !this.categoryStates[category],
    };
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
  private togglePreviewMode = () => {
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
  private toggleSidebarCollapsed = () => {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  };

  @State() initialState = {
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

  render() {
    // Calculate canvas header overlay margin from grid size (1.4 grid units)
    const verticalGridSize = getGridSizeVertical();
    const canvasHeaderOverlayMargin = -(verticalGridSize * 1.4);

    return (
      <div
        class={`blog-app-container ${this.isPreviewMode ? 'preview-mode' : ''}`}
        style={{
          '--canvas-header-overlay-margin': `${canvasHeaderOverlayMargin}px`,
        } as any}
      >
        <div class="app-header">
          <div class="app-header-content">
            <h1 class="app-title">Blog Layout Builder Demo</h1>
            <p class="app-subtitle">
              Using custom Stencil components with @lucidworks/stencil-grid-builder
            </p>
          </div>
          <div class="global-controls">
            <button
              class="preview-toggle-btn"
              onClick={this.togglePreviewMode}
              title={this.isPreviewMode ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
            >
              {this.isPreviewMode ? '✏️ Edit Mode' : '👁️ Preview'}
            </button>
            {!this.isPreviewMode && (
              <div class="metadata-undo-redo">
                <button
                  class="undo-btn"
                  onClick={() => this.api?.undo()}
                  disabled={!this.api || !this.canUndo}
                  title="Undo (components and sections)"
                >
                  ↶ Undo
                </button>
                <button
                  class="redo-btn"
                  onClick={() => this.api?.redo()}
                  disabled={!this.api || !this.canRedo}
                  title="Redo (components and sections)"
                >
                  ↷ Redo
                </button>
              </div>
            )}
            {!this.isPreviewMode && (
              <button class="add-section-btn" onClick={this.handleAddSection}>
                ➕ Add Section
              </button>
            )}
          </div>
        </div>

        {/* Main content area with categorized palettes */}
        <div class="demo-layout">
          {/* Categorized Component Palettes - Hidden in preview mode */}
          {!this.isPreviewMode && !this.isSidebarCollapsed && (
            <div class="categorized-palette-sidebar">
              <div class="palette-header">
                <h2 class="palette-title">Components</h2>
                <button
                  class="sidebar-collapse-btn"
                  onClick={this.toggleSidebarCollapsed}
                  title="Collapse sidebar"
                >
                  ◀
                </button>
              </div>

              {/* Content Category */}
              <div class="palette-category">
                <div
                  class="category-header"
                  onClick={() => this.toggleCategory('content')}
                >
                  <span class="category-icon">{this.categoryStates.content ? '▼' : '▶'}</span>
                  <span class="category-name">Content</span>
                </div>
                {this.categoryStates.content && (
                  <component-palette
                    components={contentComponents}
                    showHeader={false}
                  />
                )}
              </div>

              {/* Interactive Category */}
              <div class="palette-category">
                <div
                  class="category-header"
                  onClick={() => this.toggleCategory('interactive')}
                >
                  <span class="category-icon">{this.categoryStates.interactive ? '▼' : '▶'}</span>
                  <span class="category-name">Interactive</span>
                </div>
                {this.categoryStates.interactive && (
                  <component-palette
                    components={interactiveComponents}
                    showHeader={false}
                  />
                )}
              </div>

              {/* Media Category */}
              <div class="palette-category">
                <div
                  class="category-header"
                  onClick={() => this.toggleCategory('media')}
                >
                  <span class="category-icon">{this.categoryStates.media ? '▼' : '▶'}</span>
                  <span class="category-name">Media</span>
                </div>
                {this.categoryStates.media && (
                  <component-palette
                    components={mediaComponents}
                    showHeader={false}
                  />
                )}
              </div>
            </div>
          )}

          {/* Floating expand button when sidebar is collapsed */}
          {!this.isPreviewMode && this.isSidebarCollapsed && (
            <button
              class="sidebar-expand-btn"
              onClick={this.toggleSidebarCollapsed}
              title="Expand sidebar"
            >
              ▶
            </button>
          )}

          {/* Grid Builder / Viewer - all components for registration */}
          <div class="grid-builder-area">
            {this.isPreviewMode ? (
              <grid-viewer
                key="viewer"
                components={blogComponentDefinitions}
                initialState={this.currentGridState || this.initialState}
                canvasMetadata={this.canvasMetadata}
              />
            ) : (
              <grid-builder
                key="builder"
                components={blogComponentDefinitions}
                config={{
                  enableAnimations: true,
                  animationDuration: 100,
                }}
                initialState={this.initialState}
                canvasMetadata={this.canvasMetadata}
                onBeforeDelete={this.handleBeforeDelete}
              />
            )}
          </div>
        </div>

        <section-editor-panel
          isOpen={this.isPanelOpen}
          sectionData={this.editingSection}
          onClosePanel={this.handleClosePanel}
          onUpdateSection={this.handleUpdateSection}
          onPreviewColorChange={this.handlePreviewColorChange}
          onPreviewTitleChange={this.handlePreviewTitleChange}
          onDeleteSection={this.handleDeleteSectionFromPanel}
        />

        <confirmation-modal
          isOpen={this.isConfirmModalOpen}
          data={this.confirmModalData}
          onConfirm={this.handleConfirmDelete}
          onCancel={this.handleCancelDelete}
        />

        {/* Custom Config Panel (demo-specific) */}
        <custom-config-panel api={this.api} />
      </div>
    );
  }
}
