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
import { h } from "@stencil/core";
/**
 * CanvasHeader Component
 * ======================
 *
 * Declarative header component for canvas sections.
 *
 * **Tag**: `<canvas-header>`
 * **Shadow DOM**: Disabled (matches blog-app styling)
 */
export class CanvasHeader {
    constructor() {
        /**
         * Whether this section can be deleted
         *
         * **Purpose**: Control delete button visibility
         * **Default**: true
         * **Note**: Default sections (hero, articles, footer) should set to false
         */
        this.isDeletable = true;
        /**
         * Handle title click
         */
        this.handleTitleClick = () => {
            this.headerClick.emit({ canvasId: this.canvasId });
        };
        /**
         * Handle delete button click
         */
        this.handleDeleteClick = () => {
            this.deleteClick.emit({ canvasId: this.canvasId });
        };
    }
    /**
     * Render component template
     */
    render() {
        return (h("div", { key: '2a7fabfa2f2e867a65353474ec3fb007fdd3c538', class: "canvas-header", "data-canvas-id": this.canvasId }, h("div", { key: '378efc96d7355779eb368091b254c263bb300346', class: "canvas-actions" }, h("span", { key: '043fb4d06223ae22d5a49675561f3a00078300fa', class: "canvas-title", onClick: this.handleTitleClick }, this.sectionTitle), this.isDeletable && (h("button", { key: '4faad29f7c56074b5ab2749e19088459e81de3aa', class: "delete-canvas-btn", title: "Delete this section", onClick: this.handleDeleteClick }, "\u00D7")))));
    }
    static get is() { return "canvas-header"; }
    static get originalStyleUrls() {
        return {
            "$": ["canvas-header.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["canvas-header.css"]
        };
    }
    static get properties() {
        return {
            "canvasId": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Canvas ID for data tracking\n\n**Purpose**: Identify which canvas this header belongs to\n**Required**: Yes"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "canvas-id"
            },
            "sectionTitle": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Display title for the canvas section\n\n**Purpose**: Text shown in the title badge\n**Required**: Yes\n**Note**: Named sectionTitle to avoid conflict with standard HTML title attribute"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "section-title"
            },
            "isDeletable": {
                "type": "boolean",
                "mutable": false,
                "complexType": {
                    "original": "boolean",
                    "resolved": "boolean",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Whether this section can be deleted\n\n**Purpose**: Control delete button visibility\n**Default**: true\n**Note**: Default sections (hero, articles, footer) should set to false"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "is-deletable",
                "defaultValue": "true"
            }
        };
    }
    static get events() {
        return [{
                "method": "headerClick",
                "name": "headerClick",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event emitted when header title is clicked\n\n**Detail**: { canvasId: string }\n**Use case**: Activate canvas and open section editor"
                },
                "complexType": {
                    "original": "{ canvasId: string }",
                    "resolved": "{ canvasId: string; }",
                    "references": {}
                }
            }, {
                "method": "deleteClick",
                "name": "deleteClick",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event emitted when delete button is clicked\n\n**Detail**: { canvasId: string }\n**Use case**: Delete the canvas section"
                },
                "complexType": {
                    "original": "{ canvasId: string }",
                    "resolved": "{ canvasId: string; }",
                    "references": {}
                }
            }];
    }
}
//# sourceMappingURL=canvas-header.js.map
