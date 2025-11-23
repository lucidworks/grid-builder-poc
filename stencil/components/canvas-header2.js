import { proxyCustomElement, HTMLElement, createEvent, h } from '@stencil/core/internal/client';

const canvasHeaderCss = ".canvas-header{position:relative;display:flex;align-items:center;justify-content:flex-end;padding:0;margin:0;gap:8px;}.canvas-header:not(:first-of-type){margin-top:var(--canvas-header-overlay-margin, -28px);}.canvas-header .canvas-title{display:inline-flex;align-items:center;padding:6px 12px;border-radius:4px;margin:0;background:#4a90e2;box-shadow:0 1px 3px rgba(74, 144, 226, 0.2);color:white;cursor:pointer;font-size:13px;font-weight:500;text-transform:none;transition:all 0.15s}.canvas-header .canvas-title:hover{background:#357abd;box-shadow:0 2px 6px rgba(74, 144, 226, 0.3)}.canvas-header .canvas-actions{display:flex;align-items:center;gap:6px}.canvas-header .canvas-actions .delete-canvas-btn{display:flex;width:28px;height:28px;align-items:center;justify-content:center;padding:0;border:1px solid #dee2e6;border-radius:4px;background:white;color:#dc3545;cursor:pointer;font-size:20px;font-weight:300;line-height:1;transition:all 0.15s}.canvas-header .canvas-actions .delete-canvas-btn:hover{border-color:#dc3545;background:rgba(220, 53, 69, 0.1);transform:scale(1.1)}.canvas-header .canvas-actions .delete-canvas-btn:active{transform:scale(1)}";

const CanvasHeader = /*@__PURE__*/ proxyCustomElement(class CanvasHeader extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.headerClick = createEvent(this, "headerClick", 7);
        this.deleteClick = createEvent(this, "deleteClick", 7);
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
        return (h("div", { key: 'c44e288f10ce16098fe519cbc4354254cb110012', class: "canvas-header", "data-canvas-id": this.canvasId }, h("div", { key: '73701d3d053fead4e623db300a10abeda0e1b513', class: "canvas-actions" }, h("span", { key: '031ebb4279bfe6b5aed68b486a3fe2295fdf54f9', class: "canvas-title", onClick: this.handleTitleClick }, this.sectionTitle), this.isDeletable && (h("button", { key: 'e6399922d59ff07d03a32c0ecb61b89886b49240', class: "delete-canvas-btn", title: "Delete this section", onClick: this.handleDeleteClick }, "\u00D7")))));
    }
    static get style() { return canvasHeaderCss; }
}, [256, "canvas-header", {
        "canvasId": [1, "canvas-id"],
        "sectionTitle": [1, "section-title"],
        "isDeletable": [4, "is-deletable"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["canvas-header"];
    components.forEach(tagName => { switch (tagName) {
        case "canvas-header":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, CanvasHeader);
            }
            break;
    } });
}

export { CanvasHeader as C, defineCustomElement as d };
//# sourceMappingURL=canvas-header2.js.map

//# sourceMappingURL=canvas-header2.js.map