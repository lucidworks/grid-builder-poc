import type { Components, JSX } from "../types/components";

interface BlogApp extends Components.BlogApp, HTMLElement {}
export const BlogApp: {
    prototype: BlogApp;
    new (): BlogApp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
