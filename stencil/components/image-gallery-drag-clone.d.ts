import type { Components, JSX } from "../types/components";

interface ImageGalleryDragClone extends Components.ImageGalleryDragClone, HTMLElement {}
export const ImageGalleryDragClone: {
    prototype: ImageGalleryDragClone;
    new (): ImageGalleryDragClone;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
