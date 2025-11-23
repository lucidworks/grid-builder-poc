import type { Components, JSX } from "../types/components";

interface BlogButtonDragClone extends Components.BlogButtonDragClone, HTMLElement {}
export const BlogButtonDragClone: {
    prototype: BlogButtonDragClone;
    new (): BlogButtonDragClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
