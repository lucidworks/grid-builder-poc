import { r as registerInstance, a as createEvent, h } from './index-CoCbyscT.js';

const canvasHeaderCss = ".canvas-header{position:absolute;top:0;right:0;z-index:10;display:flex;align-items:center;justify-content:flex-end;padding:12px;margin:0;gap:8px}.canvas-wrapper:not(:first-child) .canvas-header{margin-top:-38px}.canvas-header .canvas-title{display:inline-flex;align-items:center;padding:6px 12px;border-radius:4px;margin:0;background:#4a90e2;box-shadow:0 1px 3px rgba(74, 144, 226, 0.2);color:white;cursor:pointer;font-size:13px;font-weight:500;text-transform:none;opacity:0.6;transition:all 0.15s}.canvas-header .canvas-title:hover{background:#357abd;box-shadow:0 2px 6px rgba(74, 144, 226, 0.3)}.canvas-header.is-active .canvas-title{opacity:1}.canvas-header .canvas-actions{display:flex;align-items:center;gap:6px}.canvas-header .canvas-actions .delete-canvas-btn{display:flex;width:28px;height:28px;align-items:center;justify-content:center;padding:0;border:1px solid #dee2e6;border-radius:4px;background:white;color:#dc3545;cursor:pointer;font-size:20px;font-weight:300;line-height:1;transition:all 0.15s}.canvas-header .canvas-actions .delete-canvas-btn:hover{border-color:#dc3545;background:rgba(220, 53, 69, 0.1);transform:scale(1.1)}.canvas-header .canvas-actions .delete-canvas-btn:active{transform:scale(1)}";

const CanvasHeader = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
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
         * Whether this canvas is currently active
         *
         * **Purpose**: Control header opacity (active = full opacity, inactive = dimmed)
         * **Default**: false
         */
        this.isActive = false;
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
        const headerClass = `canvas-header ${this.isActive ? "is-active" : ""}`;
        return (h("div", { key: '3c17bc79777e2990d7fbf9a1dcd7c84754b93d1a', class: headerClass, "data-canvas-id": this.canvasId }, h("div", { key: '91ac9802271588d57f916e3e0afa9ac2cedace64', class: "canvas-actions" }, h("span", { key: 'fc82dd63892d193c3275d780039efbe00a990a3d', class: "canvas-title", onClick: this.handleTitleClick }, this.sectionTitle), this.isDeletable && (h("button", { key: '665aa088f6c68bfe6423be1cd582e3a59fa80515', class: "delete-canvas-btn", title: "Delete this section", onClick: this.handleDeleteClick }, "\u00D7")))));
    }
};
CanvasHeader.style = canvasHeaderCss;

export { CanvasHeader as canvas_header };
//# sourceMappingURL=canvas-header.entry.esm.js.map
