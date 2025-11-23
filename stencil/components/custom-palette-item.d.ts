import type { Components, JSX } from "../types/components";

interface CustomPaletteItem extends Components.CustomPaletteItem, HTMLElement {}
export const CustomPaletteItem: {
    prototype: CustomPaletteItem;
    new (): CustomPaletteItem;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
