import type { Components, JSX } from "../types/components";

interface LiveData extends Components.LiveData, HTMLElement {}
export const LiveData: {
    prototype: LiveData;
    new (): LiveData;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
