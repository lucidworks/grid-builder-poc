import { r as registerInstance, h, e as Host } from './index-CoCbyscT.js';

const blogArticleCss = "blog-article{display:block;width:100%;height:100%;border-radius:8px;overflow:hidden;box-sizing:border-box}blog-article .blog-article-content{display:flex;width:100%;height:100%;flex-direction:column;padding:min(5%, 12px);box-sizing:border-box}blog-article .blog-article-content .article-text{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:4px}blog-article .blog-article-content .article-text::-webkit-scrollbar{width:6px}blog-article .blog-article-content .article-text::-webkit-scrollbar-track{background:#f1f3f5;border-radius:3px}blog-article .blog-article-content .article-text::-webkit-scrollbar-thumb{background:#adb5bd;border-radius:3px}blog-article .blog-article-content .article-text::-webkit-scrollbar-thumb:hover{background:#868e96}blog-article .blog-article-content .article-text p{margin:0;color:#495057;font-size:clamp(12px, 3.5cqw, 16px);line-height:1.6;word-wrap:break-word;overflow-wrap:break-word}blog-article .blog-article-content .article-meta{display:flex;flex-shrink:0;padding-top:min(3%, 8px);border-top:1px solid #ced4da;margin-top:min(4%, 12px);color:#6c757d;font-size:clamp(11px, 2.5cqw, 14px);gap:min(3%, 12px);overflow:hidden}blog-article .blog-article-content .article-meta .author,blog-article .blog-article-content .article-meta .date{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}blog-article .blog-article-content .article-meta .author{font-weight:500}blog-article .blog-article-content .article-meta .date{color:#646F7A}";

const BlogArticle = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.content = "Article content goes here";
        this.backgroundColor = "#fff9c4";
    }
    render() {
        return (h(Host, { key: 'fc77868d2e780e443209ec2762b2c6a0507f39f7' }, h("div", { key: 'a8f9fef983134b0b2cb3ab8ac7ca9fba897da1a8', class: "blog-article-content" }, h("div", { key: '3dc1dec45cb25103a6cbacfbe97249fc43e34775', class: "article-text" }, h("p", { key: '0dba1770d4ac8a2a301ec497d18b634ab2e23fc8' }, this.content)), (this.author || this.date) && (h("div", { key: 'a02f879be6cb222db60213a10a0ddaa7b3269e5c', class: "article-meta" }, this.author && h("span", { key: 'f4eea004d971a683d90bcaa597ca36ebe5429fb3', class: "author" }, "By ", this.author), this.date && h("span", { key: '7f7d9b6e9abaa67f0c75108660b8bd7ee1eb800f', class: "date" }, this.date))))));
    }
};
BlogArticle.style = blogArticleCss;

export { BlogArticle as blog_article };
//# sourceMappingURL=blog-article.entry.esm.js.map
