import type { Components, JSX } from "../types/components";

interface BlogHeader extends Components.BlogHeader, HTMLElement {}
export const BlogHeader: {
    prototype: BlogHeader;
    new (): BlogHeader;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
