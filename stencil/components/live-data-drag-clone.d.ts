import type { Components, JSX } from "../types/components";

interface LiveDataDragClone extends Components.LiveDataDragClone, HTMLElement {}
export const LiveDataDragClone: {
    prototype: LiveDataDragClone;
    new (): LiveDataDragClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
