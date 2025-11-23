import type { Components, JSX } from "../types/components";

interface GridItemWrapper extends Components.GridItemWrapper, HTMLElement {}
export const GridItemWrapper: {
    prototype: GridItemWrapper;
    new (): GridItemWrapper;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
