/**
 * Grid Viewer - Rendering-Only Component
 * ========================================
 *
 * Lightweight component for rendering grid layouts without editing functionality.
 * Designed to be used in viewer apps where layouts are created in grid-builder
 * and displayed in grid-viewer.
 *
 * ## Design Philosophy
 *
 * **Separation of concerns**:
 * - Builder app: grid-builder with full editing (~150KB with interact.js)
 * - Viewer app: grid-viewer for display only (~30KB, 80% smaller)
 * - Same component definitions, different rendering modes
 *
 * **Export/Import workflow**:
 * ```typescript
 * // Builder App → Export layout
 * const builder = document.querySelector('grid-builder');
 * const exportData = await builder.exportState();
 * await saveToAPI(exportData);
 *
 * // Viewer App → Import and display layout
 * const layout = await loadFromAPI();
 * const viewer = document.querySelector('grid-viewer');
 * viewer.initialState = layout;
 * ```
 *
 * ## What's Excluded from Viewer
 *
 * **No editing features**:
 * - ❌ No drag-and-drop (no interact.js)
 * - ❌ No component palette
 * - ❌ No config panel
 * - ❌ No item selection
 * - ❌ No resize handles
 * - ❌ No undo/redo
 *
 * **Only rendering features**:
 * - ✅ Responsive layouts (desktop/mobile)
 * - ✅ Container-based viewport switching
 * - ✅ Virtual rendering for performance
 * - ✅ Theme customization
 * - ✅ Component registry for dynamic rendering
 *
 * ## Bundle Size Impact
 *
 * **Builder**: ~150KB (includes interact.js ~45KB)
 * **Viewer**: ~30KB (no interact.js, no editing logic)
 * **Reduction**: 80% smaller bundle
 *
 * @module grid-viewer
 */
import { ComponentDefinition } from '../../types/component-definition';
import { GridConfig } from '../../types/grid-config';
import { GridBuilderTheme } from '../../types/theme';
import { GridExport } from '../../types/grid-export';
import { ViewerState } from '../../services/state-manager';
/**
 * GridViewer Component
 * ====================
 *
 * Rendering-only grid component for displaying layouts created in grid-builder.
 *
 * **Tag**: `<grid-viewer>`
 * **Shadow DOM**: Disabled (consistent with grid-builder)
 * **Reactivity**: Uses local store for viewer state
 *
 * **Key differences from grid-builder**:
 * - No interact.js dependency (80% bundle size reduction)
 * - No palette, config panel, or editing UI
 * - Simplified state (no selection, no z-index tracking)
 * - Rendering-only canvas sections
 */
export declare class GridViewer {
    /**
     * Component definitions registry
     *
     * **Required prop**: Array of ComponentDefinition objects
     * **Purpose**: Defines how to render each component type
     *
     * **Must match builder definitions**: Same component types as used in builder
     *
     * **Example**:
     * ```typescript
     * const components = [
     *   {
     *     type: 'header',
     *     name: 'Header',
     *     icon: '📄',
     *     render: ({ itemId, config }) => (
     *       <my-header itemId={itemId} config={config} />
     *     )
     *   }
     * ];
     * ```
     */
    components: ComponentDefinition[];
    /**
     * Grid configuration options
     *
     * **Optional prop**: Grid system configuration
     * **Default**: Standard 2% grid with 10px-50px constraints
     *
     * **Should match builder config**: Use same config as builder for consistent rendering
     */
    config?: GridConfig;
    /**
     * Visual theme customization
     *
     * **Optional prop**: Customizes colors, fonts, and styling
     * **Default**: Bootstrap-inspired blue theme
     */
    theme?: GridBuilderTheme;
    /**
     * Initial state to display
     *
     * **Optional prop**: Layout data to render
     * **Accepts**: ViewerState or GridExport (both compatible)
     *
     * **From builder export**:
     * ```typescript
     * const exportData = await builder.exportState();
     * viewer.initialState = exportData; // Type-safe!
     * ```
     *
     * **From API**:
     * ```typescript
     * const layout = await fetch('/api/layouts/123').then(r => r.json());
     * viewer.initialState = layout;
     * ```
     */
    initialState?: Partial<ViewerState> | GridExport;
    /**
     * Canvas metadata storage (host app responsibility)
     *
     * **Optional prop**: Store canvas-level presentation metadata
     * **Purpose**: Host app owns canvas metadata (titles, colors, settings)
     *
     * **Structure**: Record<canvasId, any>
     *
     * **Example**:
     * ```typescript
     * const canvasMetadata = {
     *   'hero-section': {
     *     backgroundColor: '#f0f4f8',
     *     customSettings: { ... }
     *   }
     * };
     * ```
     */
    canvasMetadata?: Record<string, any>;
    /**
     * Component registry (internal state)
     *
     * **Purpose**: Map component type → definition for lookup
     * **Built from**: components prop
     */
    private componentRegistry;
    /**
     * Local viewer state store
     *
     * **Purpose**: Minimal state for rendering (no editing state)
     * **Structure**: ViewerState with canvases and currentViewport
     */
    private viewerState;
    /**
     * Host element reference
     */
    private hostElement;
    /**
     * ResizeObserver for container-based viewport switching
     *
     * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
     * **Breakpoint**: 768px (container width, not window width)
     */
    private viewportResizeObserver?;
    /**
     * Component will load lifecycle
     *
     * **Purpose**: Initialize component registry and viewer state
     */
    componentWillLoad(): void;
    /**
     * Component did load lifecycle
     *
     * **Purpose**: Apply theme and setup viewport switching
     */
    componentDidLoad(): void;
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up ResizeObserver
     */
    disconnectedCallback(): void;
    /**
     * Watch components prop for changes
     *
     * **Purpose**: Rebuild component registry when components prop changes
     */
    handleComponentsChange(newComponents: ComponentDefinition[]): void;
    /**
     * Watch initialState prop for changes
     *
     * **Purpose**: Update viewer state when initialState prop changes
     */
    handleInitialStateChange(newState: Partial<ViewerState> | GridExport): void;
    /**
     * Apply theme via CSS variables
     *
     * **Purpose**: Apply theme customization to host element
     * **Implementation**: Set CSS custom properties on :host
     */
    private applyTheme;
    /**
     * Setup ResizeObserver for container-based viewport switching
     *
     * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
     * **Breakpoint**: 768px (container width, not window viewport)
     *
     * **Reused from grid-builder**: Same implementation for consistency
     */
    private setupViewportResizeObserver;
    /**
     * Reference to host element
     */
    private el?;
    /**
     * Render component template
     *
     * **Purpose**: Render canvases with items (no palette, no config panel)
     *
     * **Structure**:
     * - Host element with theme classes
     * - Canvas area with sections
     * - No palette (viewing only)
     * - No config panel (viewing only)
     */
    render(): any;
}
