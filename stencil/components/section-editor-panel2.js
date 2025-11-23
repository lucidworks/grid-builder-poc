import { proxyCustomElement, HTMLElement, createEvent, h } from '@stencil/core/internal/client';

const sectionEditorPanelCss = "section-editor-panel .section-editor-overlay{position:fixed;z-index:10000;top:0;right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease-out;background:rgba(0, 0, 0, 0.5)}section-editor-panel .section-editor-panel{width:90%;max-width:440px;border-radius:12px;animation:slideUp 0.2s ease-out;background:white;box-shadow:0 8px 32px rgba(0, 0, 0, 0.12)}section-editor-panel .panel-header{display:flex;align-items:center;justify-content:space-between;padding:28px 32px 24px;border-bottom:1px solid #e9ecef}section-editor-panel .panel-header .panel-title{margin:0;color:#212529;font-size:20px;font-weight:600;letter-spacing:-0.02em}section-editor-panel .panel-header .close-btn{display:flex;width:32px;height:32px;align-items:center;justify-content:center;padding:0;border:none;border-radius:6px;background:transparent;color:#6c757d;cursor:pointer;font-size:24px;font-weight:300;line-height:1;transition:all 0.15s}section-editor-panel .panel-header .close-btn:hover{background:#f8f9fa;color:#212529}section-editor-panel .panel-header .close-btn:active{transform:scale(0.95)}section-editor-panel .panel-body{padding:32px}section-editor-panel .panel-body .form-group{margin-bottom:28px}section-editor-panel .panel-body .form-group:last-child{margin-bottom:0}section-editor-panel .panel-body .form-group label{display:block;margin-bottom:10px;color:#495057;font-size:13px;font-weight:600;letter-spacing:0.01em;text-transform:uppercase}section-editor-panel .panel-body .form-group .section-title-input{width:100%;box-sizing:border-box;padding:12px 16px;border:1.5px solid #e1e4e8;border-radius:8px;background:#f8f9fa;color:#212529;font-size:15px;transition:all 0.2s}section-editor-panel .panel-body .form-group .section-title-input:hover{background:white;border-color:#cbd3da}section-editor-panel .panel-body .form-group .section-title-input:focus{border-color:#4a90e2;background:white;box-shadow:0 0 0 3px rgba(74, 144, 226, 0.08);outline:none}section-editor-panel .panel-body .form-group .section-title-input::placeholder{color:#adb5bd}section-editor-panel .panel-body .form-group .color-picker-wrapper{display:flex;align-items:stretch;gap:14px}section-editor-panel .panel-body .form-group .color-picker-wrapper .section-color-input{width:64px;height:48px;padding:6px;border:1.5px solid #e1e4e8;border-radius:8px;cursor:pointer;transition:all 0.2s}section-editor-panel .panel-body .form-group .color-picker-wrapper .section-color-input:hover{border-color:#4a90e2;box-shadow:0 2px 8px rgba(74, 144, 226, 0.15)}section-editor-panel .panel-body .form-group .color-picker-wrapper .section-color-input:focus{border-color:#4a90e2;box-shadow:0 0 0 3px rgba(74, 144, 226, 0.08);outline:none}section-editor-panel .panel-body .form-group .color-picker-wrapper .color-hex-input{flex:1;padding:12px 16px;border:1.5px solid #e1e4e8;border-radius:8px;background:#f8f9fa;color:#495057;font-family:\"SF Mono\", \"Monaco\", \"Courier New\", monospace;font-size:14px;transition:all 0.2s}section-editor-panel .panel-body .form-group .color-picker-wrapper .color-hex-input:hover{background:white;border-color:#cbd3da}section-editor-panel .panel-body .form-group .color-picker-wrapper .color-hex-input:focus{border-color:#4a90e2;background:white;box-shadow:0 0 0 3px rgba(74, 144, 226, 0.08);outline:none}section-editor-panel .panel-body .form-group .color-picker-wrapper .color-hex-input::placeholder{color:#adb5bd}section-editor-panel .panel-footer{display:flex;align-items:center;justify-content:space-between;padding:24px 32px 28px;border-top:1px solid #e9ecef}section-editor-panel .panel-footer .footer-actions{display:flex;gap:12px}section-editor-panel .panel-footer button{padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s}section-editor-panel .panel-footer button:active{transform:translateY(1px)}section-editor-panel .panel-footer .delete-btn{padding:12px 16px;margin-right:16px;border:1.5px solid #dc3545;background:transparent;color:#dc3545;font-weight:500}section-editor-panel .panel-footer .delete-btn:hover{background:#fff5f5;border-color:#c82333;color:#c82333}section-editor-panel .panel-footer .delete-btn:active{background:#ffe5e5}section-editor-panel .panel-footer .cancel-btn{border:1.5px solid #e1e4e8;background:white;color:#495057}section-editor-panel .panel-footer .cancel-btn:hover{border-color:#cbd3da;background:#f8f9fa}section-editor-panel .panel-footer .cancel-btn:active{background:#e9ecef}section-editor-panel .panel-footer .save-btn{background:#4a90e2;color:white;box-shadow:0 2px 8px rgba(74, 144, 226, 0.2)}section-editor-panel .panel-footer .save-btn:hover{background:#357abd;box-shadow:0 4px 12px rgba(74, 144, 226, 0.25);transform:translateY(-1px)}section-editor-panel .panel-footer .save-btn:active{background:#2a5f8f;box-shadow:0 1px 4px rgba(74, 144, 226, 0.2);transform:translateY(0)}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}";

const SectionEditorPanel = /*@__PURE__*/ proxyCustomElement(class SectionEditorPanel extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.closePanel = createEvent(this, "closePanel", 7);
        this.updateSection = createEvent(this, "updateSection", 7);
        this.previewColorChange = createEvent(this, "previewColorChange", 7);
        this.previewTitleChange = createEvent(this, "previewTitleChange", 7);
        this.deleteSection = createEvent(this, "deleteSection", 7);
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
    static get watchers() { return {
        "sectionData": ["handleSectionDataChange"]
    }; }
    static get style() { return sectionEditorPanelCss; }
}, [256, "section-editor-panel", {
        "isOpen": [4, "is-open"],
        "sectionData": [16],
        "editedTitle": [32],
        "editedColor": [32]
    }, undefined, {
        "sectionData": ["handleSectionDataChange"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["section-editor-panel"];
    components.forEach(tagName => { switch (tagName) {
        case "section-editor-panel":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, SectionEditorPanel);
            }
            break;
    } });
}

export { SectionEditorPanel as S, defineCustomElement as d };
//# sourceMappingURL=section-editor-panel2.js.map

//# sourceMappingURL=section-editor-panel2.js.map