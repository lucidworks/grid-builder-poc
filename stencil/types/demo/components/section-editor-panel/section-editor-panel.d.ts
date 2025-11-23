import { EventEmitter } from '../../../stencil-public-runtime';
import { SectionEditorData } from '../../types/section-editor-data';
/**
 * Section Editor Panel Component
 * ===============================
 *
 * Demo Component - NOT Part of Library
 *
 * This component demonstrates how to build custom UI for editing canvas metadata
 * in applications using the grid-builder library.
 *
 * Purpose:
 * --------
 * Shows how to create a side panel for editing section/canvas settings.
 * This is completely custom to your application - the library doesn't provide this.
 *
 * Library Relationship:
 * ---------------------
 * - Library owns: Component placement, layouts, zIndex (grid state)
 * - Host app owns: Canvas metadata (titles, colors, settings) - THIS COMPONENT
 * - Metadata flows: App → Library via canvasMetadata prop
 *
 * Pattern Demonstrated:
 * ---------------------
 * 1. User clicks section header (demo UI)
 * 2. App opens this panel (demo component)
 * 3. User edits title/color
 * 4. App updates canvasMetadata state
 * 5. Library receives updated metadata via prop
 * 6. Library passes backgroundColor to canvas-section
 *
 * Why This Approach:
 * ------------------
 * - Library stays focused on grid logic
 * - Host app controls all presentation/metadata UI
 * - You can use any UI framework (Material, Bootstrap, etc.)
 * - Complete flexibility over settings panel design
 */
export declare class SectionEditorPanel {
    /**
     * Panel open/closed state
     * Controlled by parent component (blog-app)
     */
    isOpen: boolean;
    /**
     * Section data being edited
     * Passed from parent when user clicks section header
     */
    sectionData: SectionEditorData | null;
    /**
     * Event: Close panel
     * Fired when user clicks Cancel, Save, or overlay
     */
    closePanel: EventEmitter<void>;
    /**
     * Event: Update section
     * Fired when user clicks Save with edited values
     * Parent updates canvasMetadata state in response
     */
    updateSection: EventEmitter<{
        canvasId: string;
        title: string;
        backgroundColor: string;
    }>;
    /**
     * Event: Preview color change
     * Fired when user changes color picker (live preview)
     * Parent temporarily updates canvas background
     */
    previewColorChange: EventEmitter<{
        canvasId: string;
        backgroundColor: string;
    }>;
    /**
     * Event: Preview title change
     * Fired when user types in title input (live preview)
     * Parent temporarily updates canvas title
     */
    previewTitleChange: EventEmitter<{
        canvasId: string;
        title: string;
    }>;
    /**
     * Event: Delete section
     * Fired when user clicks Delete button
     * Parent handles canvas removal
     */
    deleteSection: EventEmitter<{
        canvasId: string;
    }>;
    /**
     * Internal editing state
     * These track user's changes before saving
     */
    editedTitle: string;
    editedColor: string;
    /**
     * Original values when modal opened
     * Used to revert on cancel
     */
    private originalColor;
    private originalTitle;
    handleSectionDataChange(newData: SectionEditorData | null): void;
    componentWillLoad(): void;
    private handleClose;
    private handleSave;
    private handleDelete;
    private handleTitleInput;
    private handleColorInput;
    render(): any;
}
