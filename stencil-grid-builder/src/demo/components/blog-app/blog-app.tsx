import { Component, h, State } from '@stencil/core';
import { blogComponentDefinitions } from '../../component-definitions';
import { GridBuilderAPI } from '../../../services/grid-builder-api';
import { SectionEditorData } from '../section-editor-panel/section-editor-panel';
import { ConfirmationModalData } from '../confirmation-modal/confirmation-modal';
import { DeletionHookContext } from '../../../types/deletion-hook';

@Component({
  tag: 'blog-app',
  styleUrl: 'blog-app.scss',
  shadow: false,
})

export class BlogApp {
  private api!: GridBuilderAPI;
  private sectionCounter = 1;

  // Host app owns canvas metadata (presentation concerns)
  // Note: Undo/redo for canvas add/remove is handled by the library
  // Color changes are immediate (no undo for now)
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

  // Section editor panel state
  @State() isPanelOpen: boolean = false;
  @State() editingSection: SectionEditorData | null = null;

  // Confirmation modal state
  @State() isConfirmModalOpen: boolean = false;
  @State() confirmModalData: ConfirmationModalData | null = null;
  private deleteResolve: ((value: boolean) => void) | null = null;

  componentWillLoad() {
    // Grid-builder components are built alongside the demo
    this.updateCanvasStyles();
  }

  componentDidLoad() {
    // Get the API from the global window object (set by grid-builder)
    this.api = (window as any).gridBuilderAPI;

    if (!this.api) {
      console.error('GridBuilderAPI not found on window. Make sure grid-builder component loaded first.');
      return;
    }

    // Inject headers after initial render
    setTimeout(() => {
      this.injectCanvasHeaders();
    }, 100);

    // Listen for canvas-click events (when user clicks canvas background)
    const gridBuilder = document.querySelector('grid-builder');
    if (gridBuilder) {
      gridBuilder.addEventListener('canvas-click', ((event: CustomEvent) => {
        const { canvasId } = event.detail;
        console.log('Canvas clicked:', canvasId);
        // In a real app, this would show a canvas settings panel
        // For now, we just log it to demonstrate the event
      }) as EventListener);
    }

    // Listen to library's canvas events to sync metadata
    // When library adds/removes canvases (including via undo/redo),
    // we sync the metadata accordingly
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
      const updated = { ...this.canvasMetadata };
      delete updated[canvasId];
      this.canvasMetadata = updated;
      console.log('  ✅ Metadata removed for:', canvasId);

      // Remove injected header
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
   * Deletion hook - called before component deletion
   * Shows confirmation modal and returns Promise<boolean>
   */
  private handleBeforeDelete = (context: DeletionHookContext): Promise<boolean> => {
    return new Promise((resolve) => {
      // Store resolve function to call from modal handlers
      this.deleteResolve = resolve;

      // Get component type name for better message
      const componentType = context.item.type;
      const componentName = context.item.name || componentType;

      // Show confirmation modal
      this.confirmModalData = {
        title: 'Delete Component?',
        message: `Are you sure you want to delete "${componentName}"? This action cannot be undone.`,
      };
      this.isConfirmModalOpen = true;
    });
  };

  private handleConfirmDelete = () => {
    this.isConfirmModalOpen = false;
    this.confirmModalData = null;
    if (this.deleteResolve) {
      this.deleteResolve(true); // Proceed with deletion
      this.deleteResolve = null;
    }
  };

  private handleCancelDelete = () => {
    this.isConfirmModalOpen = false;
    this.confirmModalData = null;
    if (this.deleteResolve) {
      this.deleteResolve(false); // Cancel deletion
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
