import { h } from "@stencil/core";
/**
 * Custom Drag Clone Component
 * ============================
 *
 * Custom drag clone that shows a visual preview of the component being dragged.
 * Each component type has a unique appearance that matches what will be placed
 * on the canvas, helping with visual alignment and user understanding.
 *
 * The component fills the exact width and height provided, scaled to match
 * the actual drop size.
 */
export class CustomDragClone {
    /**
     * Get visual preview based on component type
     */
    getPreview() {
        switch (this.componentType) {
            case 'blog-header':
                return this.renderHeaderPreview();
            case 'blog-article':
                return this.renderArticlePreview();
            case 'blog-button':
                return this.renderButtonPreview();
            case 'blog-image':
                return this.renderImagePreview();
            default:
                return this.renderDefaultPreview();
        }
    }
    renderHeaderPreview() {
        return (h("div", { class: "drag-clone-header" }, h("div", { class: "header-title" }, "Header Title"), h("div", { class: "header-subtitle" }, "Subtitle text")));
    }
    renderArticlePreview() {
        return (h("div", { class: "drag-clone-article" }, h("div", { class: "article-title" }, "Article Title"), h("div", { class: "article-content" }, h("div", { class: "content-line" }), h("div", { class: "content-line" }), h("div", { class: "content-line short" })), h("div", { class: "article-meta" }, h("span", { class: "meta-item" }, "Author"), h("span", { class: "meta-item" }, "Date"))));
    }
    renderButtonPreview() {
        return (h("div", { class: "drag-clone-button" }, h("span", { class: "button-text" }, "Button")));
    }
    renderImagePreview() {
        return (h("div", { class: "drag-clone-image" }, h("div", { class: "image-placeholder" }, h("svg", { viewBox: "0 0 48 48", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("rect", { x: "6", y: "10", width: "36", height: "28", rx: "2", stroke: "currentColor", "stroke-width": "2", fill: "none" }), h("circle", { cx: "15", cy: "18", r: "3", fill: "currentColor", opacity: "0.5" }), h("path", { d: "M6 32 L16 22 L24 30 L32 22 L42 32", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", fill: "none" }))), h("div", { class: "image-caption" }, "Image")));
    }
    renderDefaultPreview() {
        return (h("div", { class: "drag-clone-default" }, this.name));
    }
    render() {
        return (h("div", { key: '30fe9c3904ed62b133adcf431a3c276baa25c2dd', class: `custom-drag-clone drag-clone-${this.componentType}`, style: {
                width: `${this.width}px`,
                height: `${this.height}px`,
            } }, this.getPreview()));
    }
    static get is() { return "custom-drag-clone"; }
    static get originalStyleUrls() {
        return {
            "$": ["custom-drag-clone.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["custom-drag-clone.css"]
        };
    }
    static get properties() {
        return {
            "componentType": {
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
                    "text": "Component type being dragged"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "component-type"
            },
            "name": {
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
                    "text": "Display name"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "name"
            },
            "icon": {
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
                    "text": "Icon/emoji"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "icon"
            },
            "width": {
                "type": "number",
                "mutable": false,
                "complexType": {
                    "original": "number",
                    "resolved": "number",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Width in pixels"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "width"
            },
            "height": {
                "type": "number",
                "mutable": false,
                "complexType": {
                    "original": "number",
                    "resolved": "number",
                    "references": {}
                },
                "required": true,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Height in pixels"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "height"
            }
        };
    }
}
//# sourceMappingURL=custom-drag-clone.js.map
