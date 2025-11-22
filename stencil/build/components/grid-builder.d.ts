import type { Components, JSX } from "../types/components";

interface GridBuilder extends Components.GridBuilder, HTMLElement {}
export const GridBuilder: {
    prototype: GridBuilder;
    new (): GridBuilder;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
