import { h } from "@stencil/core";
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
export class SectionEditorPanel {
    constructor() {
        /**
         * Panel open/closed state
         * Controlled by parent component (blog-app)
         */
        this.isOpen = false;
        /**
         * Section data being edited
         * Passed from parent when user clicks section header
         */
        this.sectionData = null;
        /**
         * Internal editing state
         * These track user's changes before saving
         */
        this.editedTitle = '';
        this.editedColor = '';
        /**
         * Original values when modal opened
         * Used to revert on cancel
         */
        this.originalColor = '';
        this.originalTitle = '';
        this.handleClose = () => {
            // Revert to original values on cancel
            if (this.sectionData) {
                this.previewColorChange.emit({
                    canvasId: this.sectionData.canvasId,
                    backgroundColor: this.originalColor,
                });
                this.previewTitleChange.emit({
                    canvasId: this.sectionData.canvasId,
                    title: this.originalTitle,
                });
            }
            this.closePanel.emit();
        };
        this.handleSave = () => {
            if (this.sectionData) {
                this.updateSection.emit({
                    canvasId: this.sectionData.canvasId,
                    title: this.editedTitle,
                    backgroundColor: this.editedColor,
                });
                this.closePanel.emit();
            }
        };
        this.handleDelete = () => {
            if (this.sectionData) {
                this.deleteSection.emit({
                    canvasId: this.sectionData.canvasId,
                });
                this.closePanel.emit();
            }
        };
        this.handleTitleInput = (e) => {
            this.editedTitle = e.target.value;
            // Emit preview event for live title update
            if (this.sectionData) {
                this.previewTitleChange.emit({
                    canvasId: this.sectionData.canvasId,
                    title: this.editedTitle,
                });
            }
        };
        this.handleColorInput = (e) => {
            this.editedColor = e.target.value;
            // Emit preview event for live color update
            if (this.sectionData) {
                this.previewColorChange.emit({
                    canvasId: this.sectionData.canvasId,
                    backgroundColor: this.editedColor,
                });
            }
        };
    }
    handleSectionDataChange(newData) {
        if (newData) {
            this.editedTitle = newData.title;
            this.editedColor = newData.backgroundColor;
            // Store original values for revert on cancel
            this.originalColor = newData.backgroundColor;
            this.originalTitle = newData.title;
        }
    }
    componentWillLoad() {
        if (this.sectionData) {
            this.editedTitle = this.sectionData.title;
            this.editedColor = this.sectionData.backgroundColor;
            // Store original values for revert on cancel
            this.originalColor = this.sectionData.backgroundColor;
            this.originalTitle = this.sectionData.title;
        }
    }
    render() {
        if (!this.isOpen || !this.sectionData) {
            return null;
        }
        return (h("div", { class: "section-editor-overlay", onClick: this.handleClose }, h("div", { class: "section-editor-panel", onClick: (e) => e.stopPropagation() }, h("div", { class: "panel-header" }, h("h2", { class: "panel-title" }, "Edit Section"), h("button", { class: "close-btn", onClick: this.handleClose, title: "Close" }, "\u00D7")), h("div", { class: "panel-body" }, h("div", { class: "form-group" }, h("label", { htmlFor: "section-title" }, "Section Name"), h("input", { type: "text", id: "section-title", class: "section-title-input", value: this.editedTitle, onInput: this.handleTitleInput, placeholder: "Enter section name" })), h("div", { class: "form-group" }, h("label", { htmlFor: "section-color" }, "Background Color"), h("div", { class: "color-picker-wrapper" }, h("input", { type: "color", id: "section-color", class: "section-color-input", value: this.editedColor, onInput: this.handleColorInput }), h("input", { type: "text", class: "color-hex-input", value: this.editedColor, onInput: this.handleColorInput, placeholder: "#ffffff" })))), h("div", { class: "panel-footer" }, h("button", { class: "delete-btn", onClick: this.handleDelete }, "Delete Section"), h("div", { class: "footer-actions" }, h("button", { class: "cancel-btn", onClick: this.handleClose }, "Cancel"), h("button", { class: "save-btn", onClick: this.handleSave }, "Save Changes"))))));
    }
    static get is() { return "section-editor-panel"; }
    static get originalStyleUrls() {
        return {
            "$": ["section-editor-panel.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["section-editor-panel.css"]
        };
    }
    static get properties() {
        return {
            "isOpen": {
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
                    "text": "Panel open/closed state\nControlled by parent component (blog-app)"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "is-open",
                "defaultValue": "false"
            },
            "sectionData": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "SectionEditorData | null",
                    "resolved": "SectionEditorData",
                    "references": {
                        "SectionEditorData": {
                            "location": "import",
                            "path": "../../types/section-editor-data",
                            "id": "src/demo/types/section-editor-data.ts::SectionEditorData"
                        }
                    }
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Section data being edited\nPassed from parent when user clicks section header"
                },
                "getter": false,
                "setter": false,
                "defaultValue": "null"
            }
        };
    }
    static get states() {
        return {
            "editedTitle": {},
            "editedColor": {}
        };
    }
    static get events() {
        return [{
                "method": "closePanel",
                "name": "closePanel",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event: Close panel\nFired when user clicks Cancel, Save, or overlay"
                },
                "complexType": {
                    "original": "void",
                    "resolved": "void",
                    "references": {}
                }
            }, {
                "method": "updateSection",
                "name": "updateSection",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event: Update section\nFired when user clicks Save with edited values\nParent updates canvasMetadata state in response"
                },
                "complexType": {
                    "original": "{ canvasId: string; title: string; backgroundColor: string }",
                    "resolved": "{ canvasId: string; title: string; backgroundColor: string; }",
                    "references": {}
                }
            }, {
                "method": "previewColorChange",
                "name": "previewColorChange",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event: Preview color change\nFired when user changes color picker (live preview)\nParent temporarily updates canvas background"
                },
                "complexType": {
                    "original": "{ canvasId: string; backgroundColor: string }",
                    "resolved": "{ canvasId: string; backgroundColor: string; }",
                    "references": {}
                }
            }, {
                "method": "previewTitleChange",
                "name": "previewTitleChange",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event: Preview title change\nFired when user types in title input (live preview)\nParent temporarily updates canvas title"
                },
                "complexType": {
                    "original": "{ canvasId: string; title: string }",
                    "resolved": "{ canvasId: string; title: string; }",
                    "references": {}
                }
            }, {
                "method": "deleteSection",
                "name": "deleteSection",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event: Delete section\nFired when user clicks Delete button\nParent handles canvas removal"
                },
                "complexType": {
                    "original": "{ canvasId: string }",
                    "resolved": "{ canvasId: string; }",
                    "references": {}
                }
            }];
    }
    static get watchers() {
        return [{
                "propName": "sectionData",
                "methodName": "handleSectionDataChange"
            }];
    }
}
//# sourceMappingURL=section-editor-panel.js.map
