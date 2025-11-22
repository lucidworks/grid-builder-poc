import type { Components, JSX } from "../types/components";

interface CanvasSection extends Components.CanvasSection, HTMLElement {}
export const CanvasSection: {
    prototype: CanvasSection;
    new (): CanvasSection;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
