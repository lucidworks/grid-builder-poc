/**
 * Theme Configuration Types
 * ==========================
 *
 * Customization options for colors, fonts, and visual styling of the grid builder.
 */

/**
 * Grid Builder Theme Interface
 * ==============================
 *
 * Customizes the visual appearance of the grid builder.
 * All colors accept standard CSS color formats.
 *
 * **Example: Default theme**
 * ```typescript
 * const defaultTheme: GridBuilderTheme = {
 *   primaryColor: '#007bff',
 *   paletteBackground: '#f5f5f5',
 *   canvasBackground: '#ffffff',
 *   gridLineColor: 'rgba(0, 0, 0, 0.1)',
 *   selectionColor: '#007bff',
 *   resizeHandleColor: '#007bff',
 *   fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
 * };
 * ```
 *
 * **Example: Dark theme**
 * ```typescript
 * const darkTheme: GridBuilderTheme = {
 *   primaryColor: '#61dafb',
 *   paletteBackground: '#1e1e1e',
 *   canvasBackground: '#2d2d2d',
 *   gridLineColor: 'rgba(255, 255, 255, 0.1)',
 *   selectionColor: '#61dafb',
 *   resizeHandleColor: '#61dafb',
 *   customProperties: {
 *     '--text-color': '#ffffff',
 *     '--border-color': '#404040'
 *   }
 * };
 * ```
 *
 * **Example: Brand colors**
 * ```typescript
 * const brandTheme: GridBuilderTheme = {
 *   primaryColor: '#ff6b6b',      // Brand red
 *   paletteBackground: '#fff5f5', // Light red
 *   canvasBackground: '#ffffff',
 *   selectionColor: '#ff6b6b',
 *   resizeHandleColor: '#ff6b6b'
 * };
 * ```
 */
export interface GridBuilderTheme {
  /**
   * Primary accent color
   *
   * **Used for**:
   * - Selection highlights
   * - Active states
   * - Primary buttons
   * - Focus indicators
   *
   * **Accepts**: Any CSS color value
   * - Hex: '#007bff'
   * - RGB: 'rgb(0, 123, 255)'
   * - RGBA: 'rgba(0, 123, 255, 0.8)'
   * - Named: 'blue'
   * @default '#007bff' (Bootstrap blue)
   */
  primaryColor?: string;

  /**
   * Component palette background color
   *
   * **Used for**: Left sidebar containing component palette
   * **Typical values**:
   * - Light gray: '#f5f5f5' ✅ Default
   * - White: '#ffffff'
   * - Dark: '#2d2d2d' (dark theme)
   * @default '#f5f5f5' (light gray)
   */
  paletteBackground?: string;

  /**
   * Canvas background color
   *
   * **Used for**: Main canvas/section backgrounds
   * **Typical values**:
   * - White: '#ffffff' ✅ Default
   * - Off-white: '#fafafa'
   * - Dark: '#2d2d2d' (dark theme)
   *
   * **Note**: Individual canvases can override with their own backgroundColor
   * @default '#ffffff' (white)
   */
  canvasBackground?: string;

  /**
   * Grid line color
   *
   * **Used for**: Visual grid lines on canvas (when showGridLines is true)
   * **Recommendation**: Use semi-transparent color for subtlety
   *
   * **Typical values**:
   * - Light theme: 'rgba(0, 0, 0, 0.1)' ✅ Default (10% black)
   * - Dark theme: 'rgba(255, 255, 255, 0.1)' (10% white)
   * - Colored: 'rgba(0, 123, 255, 0.2)' (20% blue)
   * @default 'rgba(0, 0, 0, 0.1)' (subtle gray)
   */
  gridLineColor?: string;

  /**
   * Selection outline color
   *
   * **Used for**: Outline around selected items
   * **Typically matches**: primaryColor for consistency
   *
   * **Typical values**:
   * - Primary: '#007bff' ✅ Default (matches primaryColor)
   * - Custom: '#ff6b6b' (brand color)
   * - Semi-transparent: 'rgba(0, 123, 255, 0.5)'
   * @default '#007bff' (blue)
   */
  selectionColor?: string;

  /**
   * Resize handle color
   *
   * **Used for**: 8-point resize handles on selected items
   * **Typically matches**: primaryColor or selectionColor for consistency
   *
   * **Typical values**:
   * - Primary: '#007bff' ✅ Default (matches primaryColor)
   * - Contrasting: '#ffffff' (white handles on dark theme)
   * - Custom: '#ff6b6b' (brand color)
   * @default '#007bff' (blue)
   */
  resizeHandleColor?: string;

  /**
   * Font family for UI text
   *
   * **Used for**: All text in grid builder UI (palette, config panel, etc.)
   * **Not used for**: Component content (components define their own fonts)
   *
   * **Recommendation**: Use system font stack for performance
   *
   * **Typical values**:
   * - System: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' ✅ Default
   * - Sans-serif: 'Arial, Helvetica, sans-serif'
   * - Monospace: '"SF Mono", Monaco, "Courier New", monospace'
   * - Custom: '"Inter", sans-serif' (requires font loading)
   * @default '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
   */
  fontFamily?: string;

  /**
   * Grid item header background color
   *
   * **Used for**: Background of the header area showing component icon and name
   * **Typical values**:
   * - Light gray: 'rgba(0, 0, 0, 0.05)' ✅ Default
   * - Primary color: '#007bff'
   * - Transparent: 'transparent'
   * @default 'rgba(0, 0, 0, 0.05)'
   */
  itemHeaderBackground?: string;

  /**
   * Grid item header text color
   *
   * **Used for**: Text color in the header area
   * **Typical values**:
   * - Dark: '#333333' ✅ Default
   * - White: '#ffffff' (for dark header backgrounds)
   * - Primary: '#007bff'
   * @default '#333333'
   */
  itemHeaderColor?: string;

  /**
   * Grid item drag handle color
   *
   * **Used for**: Color of the drag handle (⋮⋮) indicator
   * **Typical values**:
   * - Gray: '#999999' ✅ Default
   * - Primary: '#007bff'
   * - White: '#ffffff' (for dark themes)
   * @default '#999999'
   */
  itemDragHandleColor?: string;

  /**
   * Grid item control button color
   *
   * **Used for**: Color of control buttons (bring to front, send to back, delete)
   * **Typical values**:
   * - White: '#ffffff' ✅ Default
   * - Primary: '#007bff'
   * - Custom: '#333333'
   * @default '#ffffff'
   */
  itemControlButtonColor?: string;

  /**
   * Grid item control button background
   *
   * **Used for**: Background color of control buttons
   * **Typical values**:
   * - Primary: '#007bff' ✅ Default
   * - Gray: '#666666'
   * - Semi-transparent: 'rgba(0, 0, 0, 0.7)'
   * @default '#007bff'
   */
  itemControlButtonBackground?: string;

  /**
   * Grid item border color
   *
   * **Used for**: Border around grid items
   * **Typical values**:
   * - Light gray: '#e0e0e0' ✅ Default
   * - Transparent: 'transparent' (no border)
   * - Primary: '#007bff'
   * @default '#e0e0e0'
   */
  itemBorderColor?: string;

  /**
   * Custom CSS properties (CSS variables)
   *
   * **Used for**: Advanced theming beyond predefined colors
   * **Applied to**: :host element (accessible to all child components)
   *
   * **Use cases**:
   * - Custom spacing: `{ '--spacing-unit': '8px' }`
   * - Custom shadows: `{ '--shadow': '0 2px 4px rgba(0,0,0,0.1)' }`
   * - Custom transitions: `{ '--transition-speed': '200ms' }`
   * - Dark theme text: `{ '--text-color': '#ffffff' }`
   *
   * **Example**:
   * ```typescript
   * customProperties: {
   * '--text-color': '#ffffff',
   * '--border-color': '#404040',
   * '--hover-background': 'rgba(255, 255, 255, 0.1)',
   * '--shadow': '0 4px 6px rgba(0, 0, 0, 0.3)',
   * '--transition-speed': '150ms'
   * }
   * ```
   *
   * **Access in component styles**:
   * ```scss
   * .my-component {
   * color: var(--text-color);
   * border: 1px solid var(--border-color);
   * box-shadow: var(--shadow);
   * transition: all var(--transition-speed);
   * }
   * ```
   * @default undefined (no custom properties)
   */
  customProperties?: Record<string, string>;
}
