import type { Components, JSX } from "../types/components";

interface SectionEditorPanel extends Components.SectionEditorPanel, HTMLElement {}
export const SectionEditorPanel: {
    prototype: SectionEditorPanel;
    new (): SectionEditorPanel;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
