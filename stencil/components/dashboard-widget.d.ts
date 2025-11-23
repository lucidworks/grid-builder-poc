import type { Components, JSX } from "../types/components";

interface DashboardWidget extends Components.DashboardWidget, HTMLElement {}
export const DashboardWidget: {
    prototype: DashboardWidget;
    new (): DashboardWidget;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
