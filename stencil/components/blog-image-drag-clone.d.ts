import type { Components, JSX } from "../types/components";

interface BlogImageDragClone extends Components.BlogImageDragClone, HTMLElement {}
export const BlogImageDragClone: {
    prototype: BlogImageDragClone;
    new (): BlogImageDragClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
