import type { Components, JSX } from "../types/components";

interface BlogArticle extends Components.BlogArticle, HTMLElement {}
export const BlogArticle: {
    prototype: BlogArticle;
    new (): BlogArticle;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
