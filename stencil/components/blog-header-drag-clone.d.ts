import type { Components, JSX } from "../types/components";

interface BlogHeaderDragClone extends Components.BlogHeaderDragClone, HTMLElement {}
export const BlogHeaderDragClone: {
    prototype: BlogHeaderDragClone;
    new (): BlogHeaderDragClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
