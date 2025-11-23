/**
 * Custom Drag Clone Component
 * ============================
 *
 * Custom drag clone that shows a visual preview of the component being dragged.
 * Each component type has a unique appearance that matches what will be placed
 * on the canvas, helping with visual alignment and user understanding.
 *
 * The component fills the exact width and height provided, scaled to match
 * the actual drop size.
 */
export declare class CustomDragClone {
    /**
     * Component type being dragged
     */
    componentType: string;
    /**
     * Display name
     */
    name: string;
    /**
     * Icon/emoji
     */
    icon: string;
    /**
     * Width in pixels
     */
    width: number;
    /**
     * Height in pixels
     */
    height: number;
    /**
     * Get visual preview based on component type
     */
    private getPreview;
    private renderHeaderPreview;
    private renderArticlePreview;
    private renderButtonPreview;
    private renderImagePreview;
    private renderDefaultPreview;
    render(): any;
}
