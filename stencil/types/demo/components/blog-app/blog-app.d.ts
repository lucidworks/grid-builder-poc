import { SectionEditorData } from '../../types/section-editor-data';
import { ConfirmationModalData } from '../../types/confirmation-modal-data';
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
export declare class BlogApp {
    /**
     * Grid Builder API instance (accessed from window.gridBuilderAPI)
     * Must be @State to trigger re-render when API becomes available
     */
    private api;
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
    private canUndo;
    private canRedo;
    private sectionCounter;
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
    canvasMetadata: Record<string, {
        title: string;
        backgroundColor: string;
    }>;
    /**
     * Section Editor Panel State
     * ---------------------------
     *
     * Demo-specific state for section editing UI.
     * This is NOT part of the library - it's custom host app UI.
     */
    isPanelOpen: boolean;
    editingSection: SectionEditorData | null;
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
    isConfirmModalOpen: boolean;
    confirmModalData: ConfirmationModalData | null;
    private deleteResolve;
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
    categoryStates: Record<string, boolean>;
    /**
     * View Mode State
     * ----------------
     *
     * Toggle between edit mode (grid builder) and preview mode (viewer).
     * - Edit mode: Shows grid, palette, resize handles, config panel
     * - Preview mode: Shows only the final rendered components
     */
    isPreviewMode: boolean;
    /**
     * Current Grid State (for viewer mode)
     * -------------------------------------
     *
     * Stores the current grid state when switching to preview mode.
     * This ensures the viewer has the latest state from the builder.
     */
    currentGridState: any;
    /**
     * Sidebar Collapsed State
     * ------------------------
     *
     * Toggle component palette sidebar visibility.
     * - Collapsed: Hides sidebar, gives more space to canvas
     * - Expanded: Shows sidebar with components (default)
     */
    isSidebarCollapsed: boolean;
    componentWillLoad(): void;
    componentDidLoad(): void;
    /**
     * Track whether we've initialized the API integration
     */
    private apiInitialized;
    private setupGridBuilderIntegration;
    private syncUndoRedoState;
    componentDidUpdate(): void;
    private updateCanvasStyles;
    private removeCanvasHeader;
    private injectCanvasHeaders;
    private createCanvasHeader;
    private handleOpenSectionEditor;
    private handleClosePanel;
    private handleUpdateSection;
    /**
     * Preview Color Change Handler
     * ------------------------------
     *
     * Handles live preview of background color changes.
     * Updates canvas background immediately without saving to metadata.
     * This allows real-time preview while editing, with revert on cancel.
     */
    private handlePreviewColorChange;
    /**
     * Preview Title Change Handler
     * -----------------------------
     *
     * Handles live preview of section title changes.
     * Updates canvas title immediately without saving to metadata.
     * This allows real-time preview while editing, with revert on cancel.
     */
    private handlePreviewTitleChange;
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
    private handleBeforeDelete;
    /**
     * Confirm Deletion Handler
     * -------------------------
     *
     * Called when user clicks "Delete" button in confirmation modal.
     * Resolves the deletion hook Promise with `true` to proceed with deletion.
     */
    private handleConfirmDelete;
    /**
     * Cancel Deletion Handler
     * ------------------------
     *
     * Called when user clicks "Cancel" button in confirmation modal.
     * Resolves the deletion hook Promise with `false` to cancel deletion.
     */
    private handleCancelDelete;
    private handleAddSection;
    private handleDeleteSection;
    /**
     * Handle section deletion from editor panel
     */
    private handleDeleteSectionFromPanel;
    /**
     * Toggle Category Collapse/Expand
     * --------------------------------
     *
     * Demonstrates state management for collapsible categories.
     * Each category (content, interactive) can be independently toggled.
     */
    private toggleCategory;
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
    private togglePreviewMode;
    /**
     * Toggle Sidebar Collapsed
     * -------------------------
     *
     * Collapses/expands the component palette sidebar:
     * - Collapsed: Hides sidebar, gives more canvas space
     * - Expanded: Shows sidebar with categorized components
     */
    private toggleSidebarCollapsed;
    initialState: {
        canvases: {
            'hero-section': {
                zIndexCounter: number;
                items: ({
                    id: string;
                    canvasId: string;
                    type: string;
                    name: string;
                    layouts: {
                        desktop: {
                            x: number;
                            y: number;
                            width: number;
                            height: number;
                        };
                        mobile: {
                            x: any;
                            y: any;
                            width: any;
                            height: any;
                            customized: boolean;
                        };
                    };
                    zIndex: number;
                    config: {
                        title: string;
                        subtitle: string;
                        label?: undefined;
                        variant?: undefined;
                    };
                } | {
                    id: string;
                    canvasId: string;
                    type: string;
                    name: string;
                    layouts: {
                        desktop: {
                            x: number;
                            y: number;
                            width: number;
                            height: number;
                        };
                        mobile: {
                            x: any;
                            y: any;
                            width: any;
                            height: any;
                            customized: boolean;
                        };
                    };
                    zIndex: number;
                    config: {
                        label: string;
                        variant: string;
                        title?: undefined;
                        subtitle?: undefined;
                    };
                })[];
            };
            'articles-grid': {
                zIndexCounter: number;
                items: ({
                    id: string;
                    canvasId: string;
                    type: string;
                    name: string;
                    layouts: {
                        desktop: {
                            x: number;
                            y: number;
                            width: number;
                            height: number;
                        };
                        mobile: {
                            x: any;
                            y: any;
                            width: any;
                            height: any;
                            customized: boolean;
                        };
                    };
                    zIndex: number;
                    config: {
                        content: string;
                        author: string;
                        date: string;
                        src?: undefined;
                        alt?: undefined;
                        caption?: undefined;
                        objectFit?: undefined;
                    };
                } | {
                    id: string;
                    canvasId: string;
                    type: string;
                    name: string;
                    layouts: {
                        desktop: {
                            x: number;
                            y: number;
                            width: number;
                            height: number;
                        };
                        mobile: {
                            x: any;
                            y: any;
                            width: any;
                            height: any;
                            customized: boolean;
                        };
                    };
                    zIndex: number;
                    config: {
                        src: string;
                        alt: string;
                        caption: string;
                        objectFit: string;
                        content?: undefined;
                        author?: undefined;
                        date?: undefined;
                    };
                })[];
            };
            'footer-section': {
                zIndexCounter: number;
                items: ({
                    id: string;
                    canvasId: string;
                    type: string;
                    name: string;
                    layouts: {
                        desktop: {
                            x: number;
                            y: number;
                            width: number;
                            height: number;
                        };
                        mobile: {
                            x: any;
                            y: any;
                            width: any;
                            height: any;
                            customized: boolean;
                        };
                    };
                    zIndex: number;
                    config: {
                        title: string;
                        subtitle: string;
                        label?: undefined;
                        variant?: undefined;
                    };
                } | {
                    id: string;
                    canvasId: string;
                    type: string;
                    name: string;
                    layouts: {
                        desktop: {
                            x: number;
                            y: number;
                            width: number;
                            height: number;
                        };
                        mobile: {
                            x: any;
                            y: any;
                            width: any;
                            height: any;
                            customized: boolean;
                        };
                    };
                    zIndex: number;
                    config: {
                        label: string;
                        variant: string;
                        title?: undefined;
                        subtitle?: undefined;
                    };
                })[];
            };
        };
    };
    render(): any;
}
