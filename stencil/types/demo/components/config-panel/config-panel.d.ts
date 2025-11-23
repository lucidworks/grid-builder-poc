/**
 * Config Panel Component (Library Version)
 * =========================================
 *
 * Configuration panel with auto-generated forms and custom panel support.
 * This is the library version that uses ComponentDefinition for flexibility.
 *
 * ## Key Features
 *
 * **Auto-generated forms**:
 * - Reads ComponentDefinition.configSchema
 * - Generates form fields automatically (text, number, select, checkbox, color)
 * - Live preview of changes
 * - Revert on cancel
 *
 * **Custom panels**:
 * - Uses ComponentDefinition.renderConfigPanel() if provided
 * - Consumer has full control over config UI
 * - Library provides onChange, onSave, onCancel callbacks
 *
 * **Basic fields** (always available):
 * - Component name (item.name)
 * - Z-index controls (bring to front, send to back, etc.)
 *
 * @module config-panel
 */
import { ComponentDefinition } from '../../../types/component-definition';
/**
 * ConfigPanel Component
 * =====================
 *
 * Library component providing configuration panel with auto-generated and custom forms.
 *
 * **Tag**: `<config-panel>`
 * **Shadow DOM**: Disabled (for consistency with other components)
 */
export declare class ConfigPanel {
    /**
     * Component registry (from parent grid-builder)
     *
     * **Source**: grid-builder component
     * **Purpose**: Look up component definitions for config forms
     */
    componentRegistry?: Map<string, ComponentDefinition>;
    /**
     * Panel open state
     */
    isOpen: boolean;
    /**
     * Selected item ID
     */
    selectedItemId: string | null;
    /**
     * Selected canvas ID
     */
    selectedCanvasId: string | null;
    /**
     * Component name (editable)
     */
    componentName: string;
    /**
     * Component config (editable)
     */
    componentConfig: Record<string, any>;
    /**
     * Original state for cancel functionality
     */
    private originalState;
    /**
     * Callback for componentDeleted event (stored for unsubscribe)
     */
    private handleComponentDeleted;
    /**
     * Listen for item-click events to open panel
     */
    handleItemClick(event: CustomEvent): void;
    /**
     * Component lifecycle: Subscribe to componentDeleted event
     */
    componentDidLoad(): void;
    /**
     * Component lifecycle: Cleanup event subscriptions
     */
    disconnectedCallback(): void;
    /**
     * Render component template
     */
    render(): any;
    /**
     * Render config fields (custom or auto-generated)
     */
    private renderConfigFields;
    /**
     * Render a single config field from schema
     */
    private renderConfigField;
    /**
     * Get selected item from state
     */
    private getSelectedItem;
    /**
     * Open config panel for item
     */
    private openPanel;
    /**
     * Close config panel (revert changes)
     */
    private closePanel;
    /**
     * Save config changes
     */
    private saveConfig;
    /**
     * Handle component name input
     */
    private handleNameInput;
    /**
     * Handle config field change
     */
    private handleConfigChange;
    /**
     * Z-index control methods
     */
    private bringToFront;
    private bringForward;
    private sendBackward;
    private sendToBack;
}
