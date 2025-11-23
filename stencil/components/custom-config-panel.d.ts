import type { Components, JSX } from "../types/components";

interface CustomConfigPanel extends Components.CustomConfigPanel, HTMLElement {}
export const CustomConfigPanel: {
    prototype: CustomConfigPanel;
    new (): CustomConfigPanel;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
