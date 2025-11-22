import type { Components, JSX } from "../types/components";

interface CanvasSectionViewer extends Components.CanvasSectionViewer, HTMLElement {}
export const CanvasSectionViewer: {
    prototype: CanvasSectionViewer;
    new (): CanvasSectionViewer;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
