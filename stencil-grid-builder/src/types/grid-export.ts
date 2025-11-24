/**
 * Grid Export/Import Types
 * =========================
 *
 * JSON-serializable format for exporting layouts from builder and importing to viewer.
 *
 * ## Use Cases
 *
 * **Builder App** → Export layout to JSON:
 * ```typescript
 * const builder = document.querySelector('grid-builder');
 * const exportData = await builder.exportState();
 * await fetch('/api/layouts', {
 * method: 'POST',
 * body: JSON.stringify(exportData)
 * });
 * ```
 *
 * **Viewer App** → Import layout from JSON:
 * ```typescript
 * const layout = await fetch('/api/layouts/123').then(r => r.json());
 * const viewer = document.querySelector('grid-viewer');
 * viewer.initialState = layout;
 * ```
 *
 * ## Format Versioning
 *
 * The `version` field allows for future format changes while maintaining backwards compatibility.
 * Current version: '1.0.0'
 * @module grid-export
 */

/**
 * Grid item layout for a specific viewport
 *
 * **Desktop layout**: Always has concrete values
 * **Mobile layout**: Can be auto-generated (null values) or customized
 */
export interface GridItemLayout {
  /** X position in grid units (0-50 for 2% grid) */
  x: number | null;

  /** Y position in grid units */
  y: number | null;

  /** Width in grid units */
  width: number | null;

  /** Height in grid units */
  height: number | null;

  /**
   * Whether mobile layout is customized
   *
   * **false** (default): Auto-generate mobile layout (stack vertically, full width)
   * **true**: Use explicit x/y/width/height values
   */
  customized?: boolean;
}

/**
 * Exported grid item (JSON-serializable)
 *
 * **Differences from GridItem**:
 * - Fully serializable to JSON
 * - No selection state
 * - Minimal metadata
 */
export interface GridExportItem {
  /** Unique item identifier */
  id: string;

  /** Parent canvas identifier */
  canvasId: string;

  /** Component type (matches ComponentDefinition.type) */
  type: string;

  /** Display name (optional for viewer) */
  name: string;

  /**
   * Responsive layouts
   *
   * **Desktop**: Always required with concrete values
   * **Mobile**: Can be auto-generated or customized
   */
  layouts: {
    desktop: GridItemLayout;
    mobile: GridItemLayout;
  };

  /**
   * Z-index for stacking order
   *
   * Higher values appear above lower values.
   * Typically starts at 1 and increments for each new item.
   */
  zIndex: number;

  /**
   * Component-specific configuration
   *
   * **Must be JSON-serializable**:
   * - Strings, numbers, booleans
   * - Arrays and objects
   * - NO functions, NO circular references
   *
   * **Example**:
   * ```typescript
   * {
   *   title: 'Welcome',
   *   fontSize: 24,
   *   color: '#007bff',
   *   alignment: 'center'
   * }
   * ```
   */
  config: Record<string, any>;
}

/**
 * Exported canvas (JSON-serializable)
 *
 * **Differences from Canvas**:
 * - No zIndexCounter (editing-only state)
 * - Items array is fully serialized
 */
export interface GridExportCanvas {
  /** Grid items on this canvas */
  items: GridExportItem[];

  /**
   * Canvas height (optional)
   *
   * Stores the current canvas height as a CSS value (e.g., '800px', '50vh').
   * If not specified, canvas height will default to auto/content height.
   *
   * This allows canvases that have been dynamically expanded (via drag operations)
   * to maintain their height when exported and re-imported.
   */
  height?: string;
}

/**
 * Complete grid export format
 *
 * **Root object for JSON serialization**
 *
 * ## Example Usage
 *
 * **Export from builder**:
 * ```typescript
 * const exportData: GridExport = {
 *   version: '1.0.0',
 *   canvases: {
 *     'hero-section': {
 *       items: [
 *         {
 *           id: 'header-1',
 *           canvasId: 'hero-section',
 *           type: 'header',
 *           name: 'Hero Header',
 *           layouts: {
 *             desktop: { x: 0, y: 0, width: 50, height: 6 },
 *             mobile: { x: null, y: null, width: null, height: null, customized: false }
 *           },
 *           zIndex: 1,
 *           config: { title: 'Welcome to My Site' }
 *         }
 *       ]
 *     }
 *   },
 *   viewport: 'desktop'
 * };
 *
 * // Serialize to JSON string
 * const json = JSON.stringify(exportData, null, 2);
 * ```
 *
 * **Import to viewer**:
 * ```typescript
 * const importData: GridExport = JSON.parse(json);
 * viewer.initialState = importData;
 * ```
 */
export interface GridExport {
  /**
   * Format version for compatibility
   *
   * **Semantic versioning**:
   * - Major: Breaking changes (e.g., '2.0.0')
   * - Minor: New fields (backwards compatible)
   * - Patch: Bug fixes
   *
   * **Current version**: '1.0.0'
   */
  version: "1.0.0";

  /**
   * Canvas sections with their items
   *
   * **Key**: Canvas ID (e.g., 'hero-section', 'articles-grid')
   * **Value**: Canvas data with items array
   */
  canvases: Record<string, GridExportCanvas>;

  /**
   * Current viewport mode
   *
   * **'desktop'**: Wide layout (side-by-side components)
   * **'mobile'**: Narrow layout (stacked components)
   *
   * **Note**: Viewer can override this via props
   */
  viewport: "desktop" | "mobile";

  /**
   * Optional metadata
   *
   * **Use for**:
   * - Layout name/title
   * - Author information
   * - Creation/modified timestamps
   * - Custom app-specific data
   */
  metadata?: {
    /** Layout name/title */
    name?: string;

    /** Layout description */
    description?: string;

    /** Author/creator */
    author?: string;

    /** Creation timestamp (ISO 8601) */
    createdAt?: string;

    /** Last modified timestamp (ISO 8601) */
    updatedAt?: string;

    /** Custom application-specific metadata */
    [key: string]: any;
  };
}

/**
 * Validation helper for GridExport format
 *
 * **Usage**:
 * ```typescript
 * const data = JSON.parse(jsonString);
 * if (!isValidGridExport(data)) {
 *   throw new Error('Invalid grid export format');
 * }
 * ```
 */
export function isValidGridExport(data: any): data is GridExport {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Check version
  if (data.version !== "1.0.0") {
    return false;
  }

  // Check canvases
  if (!data.canvases || typeof data.canvases !== "object") {
    return false;
  }

  // Check viewport
  if (data.viewport !== "desktop" && data.viewport !== "mobile") {
    return false;
  }

  // Validate each canvas
  for (const canvasId in data.canvases) {
    const canvas = data.canvases[canvasId];
    if (!canvas || !Array.isArray(canvas.items)) {
      return false;
    }

    // Validate each item
    for (const item of canvas.items) {
      if (
        !item.id ||
        !item.canvasId ||
        !item.type ||
        !item.layouts ||
        !item.layouts.desktop ||
        !item.layouts.mobile ||
        typeof item.zIndex !== "number" ||
        !item.config
      ) {
        return false;
      }
    }
  }

  return true;
}
