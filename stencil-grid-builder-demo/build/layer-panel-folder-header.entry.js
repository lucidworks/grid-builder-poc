import { r as registerInstance, a as createEvent, h } from './index-CoCbyscT.js';

const layerPanelFolderHeaderCss = ".layer-panel-folder-header{display:flex;align-items:center;height:40px;padding:0 8px;background:var(--color-surface-secondary, #f5f5f5);border-bottom:1px solid var(--color-border, #e0e0e0);cursor:pointer;user-select:none;transition:background 150ms ease-out}.layer-panel-folder-header:hover{background:var(--color-surface-hover, #eeeeee)}.layer-panel-folder-header{}.layer-panel-folder-header--active{background:var(--color-primary-light, #e3f2fd);border-left:3px solid var(--color-primary, #1976d2);padding-left:5px}.layer-panel-folder-header--active:hover{background:var(--color-primary-lighter, #d1e9fc)}.layer-panel-folder-header{}.layer-panel-folder-header--empty{opacity:0.5;background:var(--color-surface-tertiary, #fafafa)}.layer-panel-folder-header--empty .layer-panel-folder-header__title{color:var(--color-text-secondary, #999)}.layer-panel-folder-header--empty:hover{opacity:0.6}.layer-panel-folder-header{}.layer-panel-folder-header__toggle{width:24px;height:24px;border:none;background:transparent;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}.layer-panel-folder-header__toggle:hover{background:rgba(0, 0, 0, 0.05);border-radius:4px}.layer-panel-folder-header__toggle:focus{outline:2px solid var(--color-primary, #1976d2);outline-offset:2px;border-radius:4px}.layer-panel-folder-header{}.layer-panel-folder-header__toggle-icon{font-size:12px;color:var(--color-text-secondary, #666);transition:transform 200ms ease-out;display:inline-block}.layer-panel-folder-header--expanded .layer-panel-folder-header__toggle-icon{transform:rotate(0deg)}.layer-panel-folder-header:not(.layer-panel-folder-header--expanded) .layer-panel-folder-header__toggle-icon{transform:rotate(-90deg)}.layer-panel-folder-header{}.layer-panel-folder-header__title{flex:1;font-weight:600;font-size:13px;color:var(--color-text-primary, #333);margin-left:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.layer-panel-folder-header{}.layer-panel-folder-header__count{font-size:11px;color:var(--color-text-secondary, #666);background:var(--color-surface-tertiary, #e0e0e0);padding:2px 8px;border-radius:12px;font-weight:500;min-width:24px;text-align:center}.layer-panel-folder-header--active .layer-panel-folder-header__count{background:var(--color-primary, #1976d2);color:white}.layer-panel-folder-header--empty .layer-panel-folder-header__count{background:transparent;border:1px solid var(--color-border, #e0e0e0);color:var(--color-text-tertiary, #999)}";

const LayerPanelFolderHeader = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.toggleFolder = createEvent(this, "toggleFolder", 7);
        this.activateCanvas = createEvent(this, "activateCanvas", 7);
        this.scrollToCanvas = createEvent(this, "scrollToCanvas", 7);
        /**
         * Whether this folder is currently expanded
         */
        this.isExpanded = true;
        /**
         * Whether this canvas is the active canvas
         */
        this.isActive = false;
        /**
         * Whether this folder has no items matching current search
         * When true, folder appears dimmed
         */
        this.isEmpty = false;
        /**
         * Handle toggle button click
         */
        this.handleToggle = (e) => {
            e.stopPropagation();
            this.toggleFolder.emit({ canvasId: this.canvasId });
        };
        /**
         * Handle folder header click to activate canvas
         */
        this.handleClick = () => {
            this.activateCanvas.emit({ canvasId: this.canvasId });
        };
        /**
         * Handle folder header double-click to scroll canvas into view
         */
        this.handleDblClick = () => {
            this.scrollToCanvas.emit({ canvasId: this.canvasId });
        };
    }
    render() {
        const headerClasses = {
            "layer-panel-folder-header": true,
            "layer-panel-folder-header--active": this.isActive,
            "layer-panel-folder-header--expanded": this.isExpanded,
            "layer-panel-folder-header--empty": this.isEmpty,
        };
        // Show "filtered / total" format during search, just count otherwise
        const countDisplay = this.totalItemCount !== undefined &&
            this.itemCount !== this.totalItemCount
            ? `${this.itemCount} / ${this.totalItemCount}`
            : this.itemCount;
        return (h("div", { key: '220ddec78f79eecf4309df39b0e16fc285723a43', class: headerClasses, onClick: this.handleClick, onDblClick: this.handleDblClick }, h("button", { key: '113c9d094fdb34a17dada1ae2577e8aa2c6baa4e', class: "layer-panel-folder-header__toggle", onClick: this.handleToggle, title: this.isExpanded ? "Collapse folder" : "Expand folder" }, h("span", { key: '9e46195a8bc2aa0e8188f2c641a4c56722d13967', class: "layer-panel-folder-header__toggle-icon" }, "\u25BC")), h("div", { key: '377e33702d0bbcf4191fe76988e14ace3c93915a', class: "layer-panel-folder-header__title" }, this.canvasTitle), h("div", { key: '68cadc387e6310a3d989a868b8bfecf094550f46', class: "layer-panel-folder-header__count" }, countDisplay)));
    }
};
LayerPanelFolderHeader.style = layerPanelFolderHeaderCss;

export { LayerPanelFolderHeader as layer_panel_folder_header };
//# sourceMappingURL=layer-panel-folder-header.entry.esm.js.map
