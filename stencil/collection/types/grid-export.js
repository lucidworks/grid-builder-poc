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
 *   method: 'POST',
 *   body: JSON.stringify(exportData)
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
 *
 * @module grid-export
 */
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
export function isValidGridExport(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    // Check version
    if (data.version !== '1.0.0') {
        return false;
    }
    // Check canvases
    if (!data.canvases || typeof data.canvases !== 'object') {
        return false;
    }
    // Check viewport
    if (data.viewport !== 'desktop' && data.viewport !== 'mobile') {
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
            if (!item.id ||
                !item.canvasId ||
                !item.type ||
                !item.layouts ||
                !item.layouts.desktop ||
                !item.layouts.mobile ||
                typeof item.zIndex !== 'number' ||
                !item.config) {
                return false;
            }
        }
    }
    return true;
}
//# sourceMappingURL=grid-export.js.map
