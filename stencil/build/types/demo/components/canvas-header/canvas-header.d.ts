/**
 * Canvas Header Component
 * =======================
 *
 * Displays a header bar above each canvas section with title and optional delete button.
 *
 * ## Purpose
 *
 * - Shows section title as clickable badge
 * - Provides delete button for non-default sections
 * - Emits events for user interactions
 *
 * ## Usage
 *
 * ```tsx
 * <canvas-header
 *   canvasId="hero-section"
 *   title="Hero Section"
 *   isDeletable={false}
 *   onHeaderClick={() => handleClick()}
 *   onDeleteClick={() => handleDelete()}
 * />
 * ```
 *
 * @module canvas-header
 */
import { EventEmitter } from '../../../stencil-public-runtime';
/**
 * CanvasHeader Component
 * ======================
 *
 * Declarative header component for canvas sections.
 *
 * **Tag**: `<canvas-header>`
 * **Shadow DOM**: Disabled (matches blog-app styling)
 */
export declare class CanvasHeader {
    /**
     * Canvas ID for data tracking
     *
     * **Purpose**: Identify which canvas this header belongs to
     * **Required**: Yes
     */
    canvasId: string;
    /**
     * Display title for the canvas section
     *
     * **Purpose**: Text shown in the title badge
     * **Required**: Yes
     * **Note**: Named sectionTitle to avoid conflict with standard HTML title attribute
     */
    sectionTitle: string;
    /**
     * Whether this section can be deleted
     *
     * **Purpose**: Control delete button visibility
     * **Default**: true
     * **Note**: Default sections (hero, articles, footer) should set to false
     */
    isDeletable: boolean;
    /**
     * Event emitted when header title is clicked
     *
     * **Detail**: { canvasId: string }
     * **Use case**: Activate canvas and open section editor
     */
    headerClick: EventEmitter<{
        canvasId: string;
    }>;
    /**
     * Event emitted when delete button is clicked
     *
     * **Detail**: { canvasId: string }
     * **Use case**: Delete the canvas section
     */
    deleteClick: EventEmitter<{
        canvasId: string;
    }>;
    /**
     * Handle title click
     */
    private handleTitleClick;
    /**
     * Handle delete button click
     */
    private handleDeleteClick;
    /**
     * Render component template
     */
    render(): any;
}
