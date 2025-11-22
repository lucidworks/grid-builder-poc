import type { Components, JSX } from "../types/components";

interface CustomDragClone extends Components.CustomDragClone, HTMLElement {}
export const CustomDragClone: {
    prototype: CustomDragClone;
    new (): CustomDragClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
