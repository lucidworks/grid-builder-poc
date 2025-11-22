import type { Components, JSX } from "../types/components";

interface BlogButton extends Components.BlogButton, HTMLElement {}
export const BlogButton: {
    prototype: BlogButton;
    new (): BlogButton;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
