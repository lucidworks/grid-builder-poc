/**
 * Custom Config Panel (Demo Component)
 * ======================================
 *
 * Custom configuration panel for the blog demo app.
 * Demonstrates how to create an external config panel that works alongside grid-builder.
 *
 * **Key Features**:
 * - Custom styling to match blog theme (purple gradient)
 * - Auto-close when selected item is deleted (via itemRemoved event)
 * - Uses manual event listeners for item-click events (Stencil @Listen doesn't work for custom events)
 * - Receives GridBuilderAPI as a prop from parent component
 * - Demonstrates proper event subscription/unsubscription pattern
 *
 * **API Access Pattern**:
 * - Parent (blog-app) stores API on component instance via api-ref={{ target: this, key: 'api' }}
 * - Parent passes API to this component via api prop
 * - This allows multiple grid-builder instances without window pollution
 */
import { GridBuilderAPI } from '../../../types/api';
export declare class CustomConfigPanel {
    /**
     * Grid Builder API (accessed from window.gridBuilderAPI or passed as prop)
     *
     * **Source**: window.gridBuilderAPI (set by grid-builder component)
     * **Purpose**: Access grid state and methods
     * **Required**: Component won't work without valid API reference
     */
    api?: GridBuilderAPI;
    /**
     * Panel open/closed state
     */
    isOpen: boolean;
    /**
     * Currently selected item ID
     */
    selectedItemId: string | null;
    /**
     * Currently selected canvas ID
     */
    selectedCanvasId: string | null;
    /**
     * Component config (temporary edit state)
     */
    componentConfig: Record<string, any>;
    /**
     * Component name (temporary edit state)
     */
    componentName: string;
    /**
     * Original state for cancel functionality
     */
    private originalState;
    /**
     * Component registry (from blog component definitions)
     */
    private componentRegistry;
    /**
     * Flag to track if we've subscribed to events
     */
    private eventsSubscribed;
    /**
     * Callback for itemRemoved event (stored for unsubscribe)
     */
    private handleItemRemoved;
    /**
     * Get API (from prop or window)
     */
    private getAPI;
    /**
     * Ensure event subscription is set up (lazy initialization)
     */
    private ensureEventSubscription;
    /**
     * Watch for API prop changes
     */
    handleApiChange(newApi: GridBuilderAPI, oldApi: GridBuilderAPI): void;
    componentDidLoad(): void;
    disconnectedCallback(): void;
    /**
     * Handle item-click events from the document
     */
    private handleItemClick;
    /**
     * Close panel and revert changes
     */
    private closePanel;
    /**
     * Save config changes
     */
    private saveConfig;
    /**
     * Handle component name change
     */
    private handleNameChange;
    /**
     * Handle config field change
     */
    private handleConfigChange;
    render(): any;
    /**
     * Render a single config field
     */
    private renderConfigField;
}
