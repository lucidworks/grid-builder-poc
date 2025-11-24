/**
 * Component Definition Types
 * ===========================
 *
 * Type definitions for defining custom component types in the grid builder library.
 * Consumers use these interfaces to register their own component types with the library.
 */

/**
 * Configuration field definition for auto-generated config forms
 */
export interface ConfigField {
  /** Field name (used as key in config object) */
  name: string;

  /** Display label shown in UI */
  label: string;

  /** Input type */
  type: "text" | "number" | "color" | "select" | "checkbox" | "textarea";

  /** Default value when component is created */
  defaultValue?: any;

  /** Options for select fields (array of {label, value} or strings) */
  options?: ({ label: string; value: string } | string)[];

  /** Optional validation function */
  validation?: (value: any) => boolean;

  /** Placeholder text for input fields */
  placeholder?: string;

  /** Help text shown below field */
  helpText?: string;

  /** Minimum value for number inputs */
  min?: number;

  /** Maximum value for number inputs */
  max?: number;

  /** Step size for number inputs */
  step?: number;

  /** Number of rows for textarea */
  rows?: number;
}

/**
 * Component Definition Interface
 * ================================
 *
 * Defines a custom component type that can be added to the grid builder.
 * Each definition specifies how to render the component, configure it, and validate it.
 *
 * **Example: Simple Header Component**
 * ```typescript
 * const headerComponent: ComponentDefinition = {
 *   type: 'header',
 *   name: 'Header',
 *   icon: '📄',
 *   defaultSize: { width: 20, height: 6 },
 *   render: ({ itemId, config }) => (
 *     <div class="my-header">
 *       <h1>{config?.text || 'New Header'}</h1>
 *     </div>
 *   ),
 *   configSchema: [
 *     {
 *       name: 'text',
 *       label: 'Header Text',
 *       type: 'text',
 *       defaultValue: 'New Header'
 *     }
 *   ]
 * };
 * ```
 *
 * **Example: Complex Dashboard with Custom Config Panel**
 * ```typescript
 * const dashboardComponent: ComponentDefinition = {
 *   type: 'dashboard',
 *   name: 'Dashboard Widget',
 *   icon: '📊',
 *   defaultSize: { width: 20, height: 15 },
 *   render: ({ itemId, config }) => (
 *     <component-dashboard itemId={itemId} config={config} />
 *   ),
 *   // Custom config panel instead of auto-generated form
 *   renderConfigPanel: ({ config, onChange, onSave, onCancel }) => (
 *     <div class="dashboard-config-wizard">
 *       <h3>Configure Dashboard</h3>
 *       <div class="config-step">
 *         <label>Data Source</label>
 *         <select
 *           value={config.dataSource}
 *           onChange={(e) => onChange('dataSource', e.target.value)}
 *         >
 *           <option value="sales">Sales Data</option>
 *           <option value="analytics">Analytics</option>
 *         </select>
 *       </div>
 *       <div class="actions">
 *         <button onClick={onCancel}>Cancel</button>
 *         <button class="primary" onClick={onSave}>Apply</button>
 *       </div>
 *     </div>
 *   ),
 *   // Optional lifecycle hooks for resource management
 *   onVisible: (itemId, config) => {
 *     console.log(`Dashboard ${itemId} visible, starting data polling...`);
 *   },
 *   onHidden: (itemId) => {
 *     console.log(`Dashboard ${itemId} hidden, pausing data polling...`);
 *   }
 * };
 * ```
 */
export interface ComponentDefinition {
  /**
   * Unique component type identifier
   *
   * **Requirements**:
   * - Must be unique across all component definitions
   * - Lowercase recommended (e.g., 'header', 'text-block')
   * - Used in state to identify component type
   * @example 'header', 'text-block', 'image-gallery'
   */
  type: string;

  /**
   * Display name in component palette
   *
   * **Usage**: Shown in UI when user selects component from palette
   * @example 'Header', 'Text Block', 'Image Gallery'
   */
  name: string;

  /**
   * Icon/emoji for component palette
   *
   * **Usage**: Visual identifier in palette
   * **Recommendation**: Use emoji for consistency
   * @example '📄', '📝', '🖼️'
   */
  icon: string;

  /**
   * Default size when added to canvas (grid units)
   *
   * **Grid units**: Percentage-based (2% grid = 50 units = 100% width)
   * **Typical sizes**:
   * - Header: { width: 20, height: 6 } (40% width, ~120px height)
   * - Text: { width: 20, height: 10 } (40% width, ~200px height)
   * - Image: { width: 15, height: 12 } (30% width, ~240px height)
   */
  defaultSize: {
    width: number;
    height: number;
  };

  /**
   * Minimum allowed size (grid units)
   *
   * **Optional**: If not specified, no minimum enforced
   * **Usage**: Prevents user from making component too small
   * @example { width: 10, height: 4 }
   */
  minSize?: {
    width: number;
    height: number;
  };

  /**
   * Maximum allowed size (grid units)
   *
   * **Optional**: If not specified, no maximum enforced
   * **Usage**: Prevents user from making component too large
   * @example { width: 50, height: 30 }
   */
  maxSize?: {
    width: number;
    height: number;
  };

  /**
   * Custom selection color for this component type
   *
   * **Optional**: If not specified, uses default yellow/gold (#f59e0b)
   * **Usage**: Visual differentiation of component types
   * **Applied to**:
   * - Selection border
   * - Drag handle header background
   * - Resize handles
   *
   * **Recommended colors**:
   * - Headers: '#3b82f6' (blue)
   * - Text: '#10b981' (green)
   * - Images: '#8b5cf6' (purple)
   * - Buttons: '#ef4444' (red)
   * @example '#3b82f6'
   */
  selectionColor?: string;

  /**
   * Render function - returns StencilJS component or HTMLElement
   *
   * **Called by**: grid-item-wrapper component
   * **Return value**: StencilJS component reference (e.g., `<my-component />`)
   * **Important**: Returns component reference, NOT rendered output
   * StencilJS manages internal component state independently
   *
   * **Props provided**:
   * - `itemId`: Unique item identifier (use for event handlers, data fetching)
   * - `config`: Current configuration values (from configSchema or custom panel)
   *
   * **Component state management**:
   * Components with internal `@State` decorators (like live data feeds)
   * will continue to update correctly. The wrapper's render memoization
   * only caches the component reference, not the rendered output.
   *
   * 🔒 **SECURITY WARNING - XSS Prevention**:
   * ⚠️ The `config` parameter MAY CONTAIN USER-CONTROLLED DATA!
   *
   * **NEVER use unsafe patterns with config values**:
   * - ❌ `element.innerHTML = config.userText`
   * - ❌ `<div dangerouslySetInnerHTML={{__html: config.html}}/>`
   * - ❌ `eval(config.code)`
   * - ❌ `new Function(config.script)()`
   * - ❌ Directly injecting config into style attributes
   *
   * **ALWAYS use safe rendering**:
   * - ✅ JSX auto-escapes values: `<div>{config.text}</div>`
   * - ✅ Text content: `element.textContent = config.text`
   * - ✅ Sanitize HTML: Use DOMPurify before rendering user HTML
   *
   * **For user-generated HTML content**:
   * ```typescript
   * import DOMPurify from 'dompurify';
   *
   * render: ({ config }) => {
   *   const safeHTML = DOMPurify.sanitize(config.userHTML, {
   *     ALLOWED_TAGS: ['b', 'i', 'p', 'br'],
   *     ALLOWED_ATTR: []
   *   });
   *   return <div innerHTML={safeHTML}></div>;
   * }
   * ```
   *
   * **Security checklist**:
   * - [ ] Never use innerHTML/dangerouslySetInnerHTML with config values
   * - [ ] Use JSX for text rendering (auto-escapes)
   * - [ ] Sanitize any HTML before rendering (DOMPurify)
   * - [ ] Validate URLs before using in src/href attributes
   * - [ ] Never execute code from config values
   *
   * @param props - Contains itemId and config
   * @returns StencilJS component reference
   * @example
   * **Safe example** (JSX auto-escaping):
   * ```typescript
   * render: ({ itemId, config }) => (
   *   <component-header
   *     itemId={itemId}
   *     title={config.title}  // JSX auto-escapes
   *     text={config.text}     // Safe
   *   />
   * )
   * ```
   *
   * **Unsafe example** (DON'T DO THIS):
   * ```typescript
   * render: ({ config }) => {
   *   const div = document.createElement('div');
   *   div.innerHTML = config.html;  // ❌ XSS VULNERABILITY!
   *   return div;
   * }
   * ```
   */
  render: (props: { itemId: string; config?: Record<string, any> }) => any;

  /**
   * Configuration schema for auto-generated config panel
   *
   * **Optional**: If not provided and renderConfigPanel not provided,
   * component will have no configurable properties.
   *
   * **Usage**: Library generates form UI from this schema
   * **Alternative**: Use `renderConfigPanel` for custom config UI
   *
   * **When to use**:
   * - Simple text/color/select fields
   * - Standard form inputs
   * - Quick component configuration
   *
   * **When NOT to use** (use renderConfigPanel instead):
   * - Complex UIs (image uploaders, multi-step wizards)
   * - Visual pickers (color palettes, icon selectors)
   * - Conditional field visibility
   * @example
   * ```typescript
   * configSchema: [
   *   {
   *     name: 'text',
   *     label: 'Header Text',
   *     type: 'text',
   *     defaultValue: 'New Header',
   *     placeholder: 'Enter header text...'
   *   },
   *   {
   *     name: 'level',
   *     label: 'Heading Level',
   *     type: 'select',
   *     options: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
   *     defaultValue: 'H1'
   *   },
   *   {
   *     name: 'color',
   *     label: 'Text Color',
   *     type: 'color',
   *     defaultValue: '#000000'
   *   }
   * ]
   * ```
   */
  configSchema?: ConfigField[];

  /**
   * Optional: Custom config panel renderer
   *
   * **When provided**: Completely overrides auto-generated form
   * **Use cases**:
   * - Complex configuration UIs (wizards, image uploaders, visual pickers)
   * - Multi-step configuration flows
   * - Conditional field visibility
   * - Advanced validation logic
   *
   * **Props provided**:
   * - `config`: Current configuration values (live preview state)
   * - `onChange`: Callback to update a config field (for live preview)
   * - `onSave`: Callback to save changes (commits to item)
   * - `onCancel`: Callback to cancel and discard changes
   *
   * **State management**:
   * - `config` is temporary state (not yet committed)
   * - Call `onChange(fieldName, value)` for each field change
   * - Call `onSave()` to commit all changes
   * - Call `onCancel()` to discard all changes
   *
   * **Live preview**: Component renders using `config` while editing,
   * so user sees changes in real-time before saving.
   *
   * **Auto-close on deletion**: Built-in config panels automatically close
   * when the associated component is deleted. Custom panels should listen
   * to the `componentDeleted` event via the EventManager to implement the
   * same behavior:
   * ```typescript
   * // In your custom config panel component
   * componentDidLoad() {
   * eventManager.on('componentDeleted', this.handleComponentDeleted);
   * }
   *
   * private handleComponentDeleted = (event: { itemId: string }) => {
   * if (this.selectedItemId === event.itemId) {
   * this.closePanel();
   * }
   * };
   *
   * disconnectedCallback() {
   * eventManager.off('componentDeleted', this.handleComponentDeleted);
   * }
   * ```
   * @param props - Config state and callbacks
   * @returns Custom config panel UI
   * @example
   * ```typescript
   * renderConfigPanel: ({ config, onChange, onSave, onCancel }) => (
   *   <div class="custom-config-panel">
   *     <h3>Configure Component</h3>
   *     <div class="field">
   *       <label>Background Color</label>
   *       <div class="color-picker">
   *         {['#ff0000', '#00ff00', '#0000ff'].map(color => (
   *           <div
   *             class={config.bgColor === color ? 'selected' : ''}
   *             onClick={() => onChange('bgColor', color)}
   *             style={{ background: color }}
   *           />
   *         ))}
   *       </div>
   *     </div>
   *     <div class="actions">
   *       <button onClick={onCancel}>Cancel</button>
   *       <button class="primary" onClick={onSave}>Apply</button>
   *     </div>
   *   </div>
   * )
   * ```
   */
  renderConfigPanel?: (props: {
    config: Record<string, any>;
    onChange: (fieldName: string, value: any) => void;
    onSave: () => void;
    onCancel: () => void;
  }) => any;

  /**
   * Validation function for placement
   *
   * **Optional**: If not provided, all placements allowed
   * **Called**: When user drags component to canvas
   * **Return**: true if placement is valid, false to reject
   *
   * **Use cases**:
   * - Restrict to specific canvases (e.g., footer only in canvas3)
   * - Prevent overlapping with other components
   * - Enforce grid boundaries
   * - Custom business rules
   * @param canvasId - Target canvas ID
   * @param position - Proposed position (x, y in grid units)
   * @returns true if placement is valid
   * @example
   * ```typescript
   * validatePlacement: (canvasId, position) => {
   *   // Only allow in first canvas
   *   return canvasId === 'canvas1';
   * }
   * ```
   */
  validatePlacement?: (
    canvasId: string,
    position: { x: number; y: number },
  ) => boolean;

  /**
   * Validation function for resize
   *
   * **Optional**: If not provided, all resizes allowed (within min/max if specified)
   * **Called**: When user resizes component
   * **Return**: true if resize is valid, false to reject
   *
   * **Use cases**:
   * - Enforce aspect ratio
   * - Prevent specific sizes (e.g., must be even width)
   * - Custom business rules
   *
   * **Note**: min/max size constraints are enforced automatically,
   * this is for additional custom validation.
   * @param newSize - Proposed size (width, height in grid units)
   * @returns true if resize is valid
   * @example
   * ```typescript
   * validateResize: (newSize) => {
   *   // Enforce 16:9 aspect ratio
   *   return Math.abs(newSize.width / newSize.height - 16/9) < 0.1;
   * }
   * ```
   */
  validateResize?: (newSize: { width: number; height: number }) => boolean;

  /**
   * Optional: Lifecycle hook called when component becomes visible
   *
   * **Note**: Virtual rendering is ALWAYS enabled for all components.
   * This hook is optional and useful for:
   * - Starting animations when component appears
   * - Beginning data fetching for live data feeds
   * - Initializing heavy resources (WebGL, video players)
   * - Tracking analytics (component viewed)
   *
   * **Virtual rendering details**:
   * - Components render when entering viewport (default: 20% margin)
   * - Once rendered, stay rendered (no de-rendering)
   * - Use this hook to pause/resume resources, not to manage DOM
   * @param itemId - The component's unique ID
   * @param config - The component's current configuration
   * @example
   * ```typescript
   * onVisible: (itemId, config) => {
   *   console.log(`Video ${itemId} visible, starting playback...`);
   *   const video = document.querySelector(`#video-${itemId}`);
   *   video?.play();
   * }
   * ```
   */
  onVisible?: (itemId: string, config: Record<string, any>) => void;

  /**
   * Optional: Lifecycle hook called when component leaves viewport
   *
   * **Important**: Component DOM stays rendered (not destroyed).
   * Use this hook for resource cleanup, NOT DOM removal.
   *
   * **Useful for**:
   * - Pausing videos/animations to save CPU
   * - Stopping data fetching/polling
   * - Cleaning up heavy resources (close WebSocket, pause WebGL)
   * - Tracking analytics (component scrolled away)
   *
   * **Why no de-rendering**:
   * - Prevents scroll jank (no reflow/repaint)
   * - Preserves component state (form inputs, video position)
   * - Faster scroll-back (already rendered)
   * - Browser optimized for off-screen DOM
   * @param itemId - The component's unique ID
   * @example
   * ```typescript
   * onHidden: (itemId) => {
   *   console.log(`Video ${itemId} hidden, pausing playback...`);
   *   const video = document.querySelector(`#video-${itemId}`);
   *   video?.pause(); // Pause but keep DOM
   * }
   * ```
   */
  onHidden?: (itemId: string) => void;

  /**
   * Optional: Custom palette item renderer
   *
   * **When provided**: Returns JSX element for custom palette item.
   *
   * **When NOT provided**: Library uses default palette item (icon + name).
   *
   * **Use cases**:
   * - Custom branding or styling for palette items
   * - Visual previews or thumbnails in palette
   * - Enhanced component descriptions
   *
   * **Props provided**:
   * - `componentType`: The component type
   * - `name`: Component display name
   * - `icon`: Component icon/emoji
   *
   * **Return value**: JSX element (StencilJS vNode)
   *
   * **Security**: Using JSX instead of HTML strings prevents XSS vulnerabilities
   * @param props - Palette item rendering context
   * @returns JSX element
   * @example
   * ```typescript
   * renderPaletteItem: ({ componentType, name, icon }) => (
   *   <custom-palette-item
   *     component-type={componentType}
   *     name={name}
   *     icon={icon}
   *   />
   * )
   * ```
   */
  renderPaletteItem?: (props: {
    componentType: string;
    name: string;
    icon: string;
  }) => any;

  /**
   * Custom drag clone renderer (REQUIRED)
   *
   * **Returns**: JSX element for custom drag clone preview.
   *
   * **Use cases**:
   * - Custom visual preview matching your component's appearance
   * - Rich drag feedback with realistic component representation
   * - Branded or styled drag previews
   *
   * **Sizing**: The library automatically uses `defaultSize` from this definition
   * and converts grid units to pixels. No need to specify size in renderDragClone.
   *
   * **Return value**: JSX element (StencilJS vNode)
   * - Can be inline JSX with styles
   * - Can be a dedicated Stencil component (recommended for complex previews)
   *
   * **Recommended Pattern**: Create a dedicated Stencil component for drag clones
   * ```typescript
   * // Component: blog-header-drag-clone.tsx
   * @Component({ tag: 'blog-header-drag-clone' })
   * export class BlogHeaderDragClone {
   * render() {
   * return (
   * <div class="header-preview">
   * <h1>Header Title</h1>
   * <p>Subtitle preview</p>
   * </div>
   * );
   * }
   * }
   * ```
   *
   * **Library responsibilities**:
   * - Wraps your JSX in a fixed-size container (width × height from defaultSize)
   * - Applies base drag styling (border, shadow, cursor)
   * - Positions during drag and cleans up after drop
   * - Sets `overflow: hidden` to clip content to size
   *
   * **Your responsibility**:
   * - Return JSX that looks good at the component's default size
   * - Make it visually represent the actual component
   * @returns JSX element (StencilJS vNode)
   * @example
   * ```typescript
   * // Using a dedicated Stencil component (recommended)
   * renderDragClone: () => (
   *   <blog-header-drag-clone />
   * )
   *
   * // Or inline JSX for simple cases
   * renderDragClone: () => (
   *   <div style={{
   *     display: 'flex',
   *     alignItems: 'center',
   *     justifyContent: 'center',
   *     height: '100%'
   *   }}>
   *     <h1>Header Preview</h1>
   *   </div>
   * )
   * ```
   */
  renderDragClone: () => any;

  /**
   * Optional: Custom item wrapper/chrome renderer
   *
   * **When provided**: Returns JSX element for custom grid item wrapper
   * that will replace the default grid item chrome (drag handle, header, controls).
   *
   * **When NOT provided**: Library uses default grid item wrapper.
   *
   * **Use cases**:
   * - Custom control layouts
   * - Different header designs
   * - Alternative drag handles
   * - Custom branding
   *
   * **Props provided**:
   * - `itemId`: The grid item ID
   * - `componentType`: The component type
   * - `name`: Component display name
   * - `icon`: Component icon/emoji
   * - `isSelected`: Whether the item is currently selected
   * - `contentSlotId`: ID for the content container (your component renders here)
   *
   * **Return value**: JSX element (StencilJS vNode)
   *
   * **Security**: Using JSX instead of HTML strings prevents XSS vulnerabilities
   *
   * **IMPORTANT REQUIREMENTS**:
   * Your custom wrapper component MUST include:
   *
   * 1. **Content Slot**: A container with `id={contentSlotId}` where the actual component will render
   * ```jsx
   * <div id={contentSlotId} class="component-content"></div>
   * ```
   *
   * 2. **Drag Handle**: An element with class `drag-handle` for dragging functionality
   * ```jsx
   * <div class="drag-handle"></div>
   * ```
   *
   * 3. **Event Emission**: Your component must emit the following standard events for user actions
   * ```typescript
   * // Delete button clicked
   * this.el.dispatchEvent(new CustomEvent('item-delete', { bubbles: true, composed: true }));
   *
   * // Bring to front button clicked
   * this.el.dispatchEvent(new CustomEvent('item-bring-to-front', { bubbles: true, composed: true }));
   *
   * // Send to back button clicked
   * this.el.dispatchEvent(new CustomEvent('item-send-to-back', { bubbles: true, composed: true }));
   * ```
   *
   * **Event-based architecture**:
   * The library uses Stencil's `@Listen` decorator to listen for these standard events.
   * Your wrapper emits events → Library handles the business logic (undo/redo, state updates, etc.).
   * This provides clean separation of concerns and follows web component best practices.
   *
   * Without the required elements and events, drag, resize, and delete functionality will not work.
   * The resize handles (8-point) are added automatically by the library outside your custom chrome.
   * @param props - Item wrapper rendering context
   * @returns JSX element
   * @example
   * ```typescript
   * renderItemWrapper: ({ itemId, componentType, name, icon, isSelected, contentSlotId }) => (
   *   <custom-item-wrapper
   *     item-id={itemId}
   *     component-type={componentType}
   *     name={name}
   *     icon={icon}
   *     is-selected={isSelected}
   *     content-slot-id={contentSlotId}
   *   />
   * )
   * ```
   *
   * Example custom wrapper component:
   * - Use @Element() decorator to get host element reference
   * - Create handler methods that dispatch custom events
   * - Include drag-handle element with class="drag-handle"
   * - Include content slot element with id={contentSlotId}
   * - Dispatch 'item-delete', 'item-bring-to-front', 'item-send-to-back' events
   */
  renderItemWrapper?: (props: {
    itemId: string;
    componentType: string;
    name: string;
    icon: string;
    isSelected: boolean;
    contentSlotId: string;
  }) => any;
}
