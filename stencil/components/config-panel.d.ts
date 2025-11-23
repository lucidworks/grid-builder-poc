import type { Components, JSX } from "../types/components";

interface ConfigPanel extends Components.ConfigPanel, HTMLElement {}
export const ConfigPanel: {
    prototype: ConfigPanel;
    new (): ConfigPanel;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
