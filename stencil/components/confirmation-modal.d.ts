import type { Components, JSX } from "../types/components";

interface ConfirmationModal extends Components.ConfirmationModal, HTMLElement {}
export const ConfirmationModal: {
    prototype: ConfirmationModal;
    new (): ConfirmationModal;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
