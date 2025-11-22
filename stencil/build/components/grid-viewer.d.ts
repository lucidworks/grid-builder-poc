import type { Components, JSX } from "../types/components";

interface GridViewer extends Components.GridViewer, HTMLElement {}
export const GridViewer: {
    prototype: GridViewer;
    new (): GridViewer;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
