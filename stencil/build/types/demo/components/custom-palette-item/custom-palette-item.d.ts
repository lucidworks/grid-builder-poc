/**
 * Custom Palette Item Component
 * ==============================
 *
 * Example custom palette item that shows how consumers can create
 * fully customized palette entries for their components.
 *
 * Updated to display SVG icons on top with titles below (similar to UI builder pattern)
 */
export declare class CustomPaletteItem {
    /**
     * Component type
     */
    componentType: string;
    /**
     * Display name
     */
    name: string;
    /**
     * Icon/emoji or SVG identifier
     */
    icon: string;
    /**
     * Get SVG canvas preview based on component type
     * Shows abstract representation of how the component appears on canvas
     */
    private getSvgIcon;
    render(): any;
}
