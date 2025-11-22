import type { Components, JSX } from "../types/components";

interface ImageGallery extends Components.ImageGallery, HTMLElement {}
export const ImageGallery: {
    prototype: ImageGallery;
    new (): ImageGallery;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
