import { Component, h, State } from '@stencil/core';
import { blogComponentDefinitions } from '../../component-definitions';
import { GridBuilderAPI } from '../../../services/grid-builder-api';
import { SectionEditorData } from '../section-editor-panel/section-editor-panel';
import { ConfirmationModalData } from '../confirmation-modal/confirmation-modal';
import { DeletionHookContext } from '../../../types/deletion-hook';

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
 * 5. **Grid Builder API** (window.gridBuilderAPI)
 *    - Programmatic control of grid state
 *    - Methods: addCanvas, removeCanvas, undo, redo, etc.
 *    - Event system: canvasAdded, canvasRemoved, etc.
 *
 * 6. **Event System** (canvas-click, custom events)
 *    - Listen to library events for state synchronization
 *    - React to user interactions (canvas clicks, etc.)
 *
 * Architecture Pattern:
 * --------------------
 * - Library: Manages component placement, drag/drop, resize, undo/redo
 * - Host App: Manages canvas metadata, custom UI (headers, modals), business logic
 */

@Component({
  tag: 'blog-app',
  styleUrl: 'blog-app.scss',
  shadow: false,
})
export class BlogApp {
  private api!: GridBuilderAPI;
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

  componentWillLoad() {
    // Grid-builder components are built alongside the demo
    this.updateCanvasStyles();
  }

  /**
   * Component Lifecycle: componentDidLoad
   * --------------------------------------
   *
   * Library Feature: Grid Builder API (window.gridBuilderAPI)
   *
   * The library exposes a programmatic API on window.gridBuilderAPI that provides:
   * - State management methods: addCanvas, removeCanvas, undo, redo, etc.
   * - Query methods: getState, canUndo, canRedo
   * - Event system: on, off for subscribing to state changes
   *
   * This lifecycle hook demonstrates:
   * 1. Accessing the Grid Builder API
   * 2. Listening to library events (canvasAdded, canvasRemoved)
   * 3. Synchronizing host app state with library state
   */
  componentDidLoad() {
    /**
     * Get Grid Builder API
     * --------------------
     *
     * Library Feature: Programmatic API
     *
     * The library exposes an API on the global window object.
     * This API is set by the grid-builder component during its componentDidLoad lifecycle.
     *
     * Available API methods:
     * - addCanvas(canvasId: string): Add a new canvas
     * - removeCanvas(canvasId: string): Remove a canvas
     * - undo(): Undo last action
     * - redo(): Redo last undone action
     * - canUndo(): Check if undo is available
     * - canRedo(): Check if redo is available
     * - getState(): Get current grid state
     * - on(event, handler): Subscribe to events
     * - off(event, handler): Unsubscribe from events
     */
    this.api = (window as any).gridBuilderAPI;

    if (!this.api) {
      console.error('GridBuilderAPI not found on window. Make sure grid-builder component loaded first.');
      return;
    }

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
  }

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
        // Update existing header - just update text content and color value
        const titleEl = header.querySelector('.canvas-title') as HTMLElement;
        if (titleEl) {
          titleEl.textContent = this.canvasMetadata[canvasId]?.title || canvasId;
        }
        const colorInput = header.querySelector('input[type="color"]') as HTMLInputElement;
        if (colorInput) {
          colorInput.value = this.canvasMetadata[canvasId]?.backgroundColor || '#f5f5f5';
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

    // Section title badge (clickable to open editor)
    const title = document.createElement('span');
    title.className = 'canvas-title';
    title.textContent = this.canvasMetadata[canvasId]?.title || canvasId;
    title.addEventListener('click', () => {
      this.handleOpenSectionEditor(canvasId);
    });
    actions.appendChild(title);

    // Color picker (no label, just the input)
    const colorControl = document.createElement('label');
    colorControl.className = 'color-control';
    colorControl.title = 'Change background color';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = this.canvasMetadata[canvasId]?.backgroundColor || '#f5f5f5';
    colorInput.addEventListener('input', (e) => {
      this.handleColorChange(canvasId, (e.target as HTMLInputElement).value);
    });

    colorControl.appendChild(colorInput);
    actions.appendChild(colorControl);

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

  private handleColorChange = (canvasId: string, color: string) => {
    // Update color immediately (no undo for color changes for now)
    this.canvasMetadata = {
      ...this.canvasMetadata,
      [canvasId]: {
        ...this.canvasMetadata[canvasId],
        backgroundColor: color,
      },
    };
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
        zIndexCounter: 3,
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
            id: 'article-3',
            canvasId: 'articles-grid',
            type: 'blog-article',
            name: 'Third Article',
            layouts: {
              desktop: { x: 12, y: 13, width: 26, height: 12 },
              mobile: { x: null, y: null, width: null, height: null, customized: false },
            },
            zIndex: 3,
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
    return (
      <div class="blog-app-container">
        <div class="app-header">
          <div class="app-header-content">
            <h1 class="app-title">Blog Layout Builder Demo</h1>
            <p class="app-subtitle">
              Using custom Stencil components with @lucidworks/stencil-grid-builder
            </p>
          </div>
          <div class="global-controls">
            <div class="metadata-undo-redo">
              <button
                class="undo-btn"
                onClick={() => this.api?.undo()}
                disabled={!this.api || !this.api.canUndo()}
                title="Undo (components and sections)"
              >
                ↶ Undo
              </button>
              <button
                class="redo-btn"
                onClick={() => this.api?.redo()}
                disabled={!this.api || !this.api.canRedo()}
                title="Redo (components and sections)"
              >
                ↷ Redo
              </button>
            </div>
            <button class="add-section-btn" onClick={this.handleAddSection}>
              ➕ Add Section
            </button>
          </div>
        </div>

        <grid-builder
          components={blogComponentDefinitions}
          initialState={this.initialState}
          canvasMetadata={this.canvasMetadata}
          onBeforeDelete={this.handleBeforeDelete}
        />

        <section-editor-panel
          isOpen={this.isPanelOpen}
          sectionData={this.editingSection}
          onClosePanel={this.handleClosePanel}
          onUpdateSection={this.handleUpdateSection}
        />

        <confirmation-modal
          isOpen={this.isConfirmModalOpen}
          data={this.confirmModalData}
          onConfirm={this.handleConfirmDelete}
          onCancel={this.handleCancelDelete}
        />
      </div>
    );
  }
}
