import type { Components, JSX } from "../types/components";

interface DashboardWidgetDragClone extends Components.DashboardWidgetDragClone, HTMLElement {}
export const DashboardWidgetDragClone: {
    prototype: DashboardWidgetDragClone;
    new (): DashboardWidgetDragClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
