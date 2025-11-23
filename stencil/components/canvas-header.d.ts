import type { Components, JSX } from "../types/components";

interface CanvasHeader extends Components.CanvasHeader, HTMLElement {}
export const CanvasHeader: {
    prototype: CanvasHeader;
    new (): CanvasHeader;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
