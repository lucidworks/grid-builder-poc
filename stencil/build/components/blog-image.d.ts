import type { Components, JSX } from "../types/components";

interface BlogImage extends Components.BlogImage, HTMLElement {}
export const BlogImage: {
    prototype: BlogImage;
    new (): BlogImage;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
