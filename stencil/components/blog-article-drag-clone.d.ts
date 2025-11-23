import type { Components, JSX } from "../types/components";

interface BlogArticleDragClone extends Components.BlogArticleDragClone, HTMLElement {}
export const BlogArticleDragClone: {
    prototype: BlogArticleDragClone;
    new (): BlogArticleDragClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
