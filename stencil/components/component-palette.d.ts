import type { Components, JSX } from "../types/components";

interface ComponentPalette extends Components.ComponentPalette, HTMLElement {}
export const ComponentPalette: {
    prototype: ComponentPalette;
    new (): ComponentPalette;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
