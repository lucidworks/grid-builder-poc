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
import { h, Host } from "@stencil/core";
import { createStore } from "@stencil/store";
import { createDebugLogger } from "../../utils/debug";
const debug = createDebugLogger('grid-viewer');
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
export class GridViewer {
    constructor() {
        /**
         * Component registry (internal state)
         *
         * **Purpose**: Map component type → definition for lookup
         * **Built from**: components prop
         */
        this.componentRegistry = new Map();
        /**
         * Setup ResizeObserver for container-based viewport switching
         *
         * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
         * **Breakpoint**: 768px (container width, not window viewport)
         *
         * **Reused from grid-builder**: Same implementation for consistency
         */
        this.setupViewportResizeObserver = () => {
            if (!this.hostElement) {
                return;
            }
            // Watch for grid-viewer container size changes
            this.viewportResizeObserver = new ResizeObserver((entries) => {
                var _a, _b;
                for (const entry of entries) {
                    // Get container width directly from the element
                    // Note: We use offsetWidth instead of entry.contentRect.width because
                    // the grid-viewer uses Light DOM and contentRect returns 0 for elements with height: 100%
                    const width = this.hostElement.offsetWidth || ((_b = (_a = entry.borderBoxSize) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.inlineSize) || entry.contentRect.width;
                    // Skip viewport switching if width is 0 or very small (container not yet laid out)
                    // This prevents premature switching to mobile before CSS layout is complete
                    if (width < 100) {
                        debug.log(`📱 [Viewer] Skipping viewport switch - container not yet laid out (width: ${Math.round(width)}px)`);
                        return;
                    }
                    // Determine target viewport based on container width
                    const targetViewport = width < 768 ? 'mobile' : 'desktop';
                    // Only update if viewport changed
                    if (this.viewerState.state.currentViewport !== targetViewport) {
                        debug.log(`📱 [Viewer] Container-based viewport switch: ${this.viewerState.state.currentViewport} → ${targetViewport} (width: ${Math.round(width)}px)`);
                        this.viewerState.state.currentViewport = targetViewport;
                    }
                }
            });
            this.viewportResizeObserver.observe(this.hostElement);
        };
    }
    /**
     * Component will load lifecycle
     *
     * **Purpose**: Initialize component registry and viewer state
     */
    componentWillLoad() {
        // Validate required props
        if (!this.components || this.components.length === 0) {
            console.error('GridViewer: components prop is required');
            return;
        }
        // Build component registry
        this.componentRegistry = new Map(this.components.map(comp => [comp.type, comp]));
        // Validate unique component types
        if (this.componentRegistry.size !== this.components.length) {
            console.warn('GridViewer: Duplicate component types detected');
        }
        // Initialize local viewer state store
        const initialViewerState = {
            canvases: {},
            currentViewport: 'desktop',
        };
        // Restore initial state if provided
        if (this.initialState) {
            // Handle both ViewerState and GridExport formats
            if ('viewport' in this.initialState) {
                // GridExport format
                initialViewerState.currentViewport = this.initialState.viewport;
                initialViewerState.canvases = this.initialState.canvases;
            }
            else {
                // ViewerState format
                Object.assign(initialViewerState, this.initialState);
            }
        }
        // Create local store (not global like grid-builder)
        this.viewerState = createStore(initialViewerState);
    }
    /**
     * Component did load lifecycle
     *
     * **Purpose**: Apply theme and setup viewport switching
     */
    componentDidLoad() {
        // Apply theme
        if (this.theme) {
            this.applyTheme(this.theme);
        }
        // Setup container-based viewport switching
        this.setupViewportResizeObserver();
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up ResizeObserver
     */
    disconnectedCallback() {
        // Cleanup ResizeObserver
        if (this.viewportResizeObserver) {
            this.viewportResizeObserver.disconnect();
        }
    }
    /**
     * Watch components prop for changes
     *
     * **Purpose**: Rebuild component registry when components prop changes
     */
    handleComponentsChange(newComponents) {
        this.componentRegistry = new Map(newComponents.map(comp => [comp.type, comp]));
    }
    /**
     * Watch initialState prop for changes
     *
     * **Purpose**: Update viewer state when initialState prop changes
     */
    handleInitialStateChange(newState) {
        if (newState) {
            // Handle both ViewerState and GridExport formats
            if ('viewport' in newState) {
                // GridExport format
                this.viewerState.state.currentViewport = newState.viewport;
                this.viewerState.state.canvases = newState.canvases;
            }
            else {
                // ViewerState format
                Object.assign(this.viewerState.state, newState);
            }
        }
    }
    /**
     * Apply theme via CSS variables
     *
     * **Purpose**: Apply theme customization to host element
     * **Implementation**: Set CSS custom properties on :host
     */
    applyTheme(theme) {
        const host = this.el;
        if (!host)
            return;
        // Apply predefined theme properties
        if (theme.primaryColor) {
            host.style.setProperty('--grid-viewer-primary-color', theme.primaryColor);
        }
        if (theme.canvasBackground) {
            host.style.setProperty('--grid-viewer-canvas-bg', theme.canvasBackground);
        }
        if (theme.fontFamily) {
            host.style.setProperty('--grid-viewer-font-family', theme.fontFamily);
        }
        // Apply custom properties
        if (theme.customProperties) {
            Object.entries(theme.customProperties).forEach(([key, value]) => {
                host.style.setProperty(key, value);
            });
        }
    }
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
    render() {
        const canvasIds = Object.keys(this.viewerState.state.canvases);
        return (h(Host, { key: '243907a7615c3c4eb7263383337b26d9131236d0', ref: (el) => this.el = el }, h("div", { key: '8d4eb74201dc529163348967d25a05f031b088b1', class: "grid-viewer-container" }, h("div", { key: '287bcfbbf3b430201f239f83da3fd4afc1c6df6d', class: "canvas-area" }, h("div", { key: 'd72dda890861e7de3bf25983d0c082b6c758a424', class: "canvases-container" }, canvasIds.map((canvasId) => {
            var _a, _b;
            return (h("canvas-section-viewer", { key: canvasId, canvasId: canvasId, config: this.config, componentRegistry: this.componentRegistry, items: this.viewerState.state.canvases[canvasId].items, currentViewport: this.viewerState.state.currentViewport, backgroundColor: (_b = (_a = this.canvasMetadata) === null || _a === void 0 ? void 0 : _a[canvasId]) === null || _b === void 0 ? void 0 : _b.backgroundColor }));
        }))))));
    }
    static get is() { return "grid-viewer"; }
    static get originalStyleUrls() {
        return {
            "$": ["grid-viewer.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["grid-viewer.css"]
        };
    }
    static get properties() {
        return {
            "components": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "ComponentDefinition[]",
                    "resolved": "ComponentDefinition[]",
                    "references": {
                        "ComponentDefinition": {
                            "location": "import",
                            "path": "../../types/component-definition",
                            "id": "src/types/component-definition.ts::ComponentDefinition"
                        }
                    }
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Component definitions registry\n\n**Required prop**: Array of ComponentDefinition objects\n**Purpose**: Defines how to render each component type\n\n**Must match builder definitions**: Same component types as used in builder\n\n**Example**:\n```typescript\nconst components = [\n  {\n    type: 'header',\n    name: 'Header',\n    icon: '\uD83D\uDCC4',\n    render: ({ itemId, config }) => (\n      <my-header itemId={itemId} config={config} />\n    )\n  }\n];\n```"
                },
                "getter": false,
                "setter": false
            },
            "config": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "GridConfig",
                    "resolved": "GridConfig",
                    "references": {
                        "GridConfig": {
                            "location": "import",
                            "path": "../../types/grid-config",
                            "id": "src/types/grid-config.ts::GridConfig"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Grid configuration options\n\n**Optional prop**: Grid system configuration\n**Default**: Standard 2% grid with 10px-50px constraints\n\n**Should match builder config**: Use same config as builder for consistent rendering"
                },
                "getter": false,
                "setter": false
            },
            "theme": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "GridBuilderTheme",
                    "resolved": "GridBuilderTheme",
                    "references": {
                        "GridBuilderTheme": {
                            "location": "import",
                            "path": "../../types/theme",
                            "id": "src/types/theme.ts::GridBuilderTheme"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Visual theme customization\n\n**Optional prop**: Customizes colors, fonts, and styling\n**Default**: Bootstrap-inspired blue theme"
                },
                "getter": false,
                "setter": false
            },
            "initialState": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "Partial<ViewerState> | GridExport",
                    "resolved": "GridExport | { canvases?: Record<string, ViewerCanvas>; currentViewport?: \"desktop\" | \"mobile\"; }",
                    "references": {
                        "Partial": {
                            "location": "global",
                            "id": "global::Partial"
                        },
                        "ViewerState": {
                            "location": "import",
                            "path": "../../services/state-manager",
                            "id": "src/services/state-manager.ts::ViewerState"
                        },
                        "GridExport": {
                            "location": "import",
                            "path": "../../types/grid-export",
                            "id": "src/types/grid-export.ts::GridExport"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Initial state to display\n\n**Optional prop**: Layout data to render\n**Accepts**: ViewerState or GridExport (both compatible)\n\n**From builder export**:\n```typescript\nconst exportData = await builder.exportState();\nviewer.initialState = exportData; // Type-safe!\n```\n\n**From API**:\n```typescript\nconst layout = await fetch('/api/layouts/123').then(r => r.json());\nviewer.initialState = layout;\n```"
                },
                "getter": false,
                "setter": false
            },
            "canvasMetadata": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "Record<string, any>",
                    "resolved": "{ [x: string]: any; }",
                    "references": {
                        "Record": {
                            "location": "global",
                            "id": "global::Record"
                        }
                    }
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": "Canvas metadata storage (host app responsibility)\n\n**Optional prop**: Store canvas-level presentation metadata\n**Purpose**: Host app owns canvas metadata (titles, colors, settings)\n\n**Structure**: Record<canvasId, any>\n\n**Example**:\n```typescript\nconst canvasMetadata = {\n  'hero-section': {\n    backgroundColor: '#f0f4f8',\n    customSettings: { ... }\n  }\n};\n```"
                },
                "getter": false,
                "setter": false
            }
        };
    }
    static get states() {
        return {
            "componentRegistry": {}
        };
    }
    static get elementRef() { return "hostElement"; }
    static get watchers() {
        return [{
                "propName": "components",
                "methodName": "handleComponentsChange"
            }, {
                "propName": "initialState",
                "methodName": "handleInitialStateChange"
            }];
    }
}
//# sourceMappingURL=grid-viewer.js.map
