import { h } from "@stencil/core";
export class BlogArticle {
    constructor() {
        this.content = 'Article content goes here';
    }
    render() {
        return (h("div", { key: '34f9a59243cc4222321db04ee6308ec701d32ab4', class: "blog-article-content" }, h("div", { key: '33e9c01c476570840f9f06ec8f9e00353e6c922f', class: "article-text" }, h("p", { key: '577b6791e655de0c7948590292d9beeae6cd35b9' }, this.content)), (this.author || this.date) && (h("div", { key: '2da4cc1e1b296109fa36ac5eb278ef2b72a4e0e8', class: "article-meta" }, this.author && h("span", { key: '62d265248ccb2f63cbf706d2522fb7d7ee965187', class: "author" }, "By ", this.author), this.date && h("span", { key: '24de67ef85eb22c5fb2dbc36d677e64843a19615', class: "date" }, this.date)))));
    }
    static get is() { return "blog-article"; }
    static get originalStyleUrls() {
        return {
            "$": ["blog-article.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["blog-article.css"]
        };
    }
    static get properties() {
        return {
            "content": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "content",
                "defaultValue": "'Article content goes here'"
            },
            "author": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "author"
            },
            "date": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": false,
                "optional": true,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "date"
            }
        };
    }
}
//# sourceMappingURL=blog-article.js.map
