import { h } from "@stencil/core";
import { ComponentDefinition } from "../types/component-definition";

/**
 * Component Definitions for Blog Layout Builder Demo
 * ===================================================
 *
 * This file demonstrates how to define custom components for the grid-builder library.
 * Each ComponentDefinition tells the library how to render, size, and display your components.
 *
 * Key Library Features Demonstrated:
 * ----------------------------------
 *
 * 1. **Component Type Registration** (`type` property)
 *    - Unique identifier for each component type
 *    - Used by the library to look up component definitions
 *    - Example: 'blog-header', 'blog-article', 'blog-button'
 *
 * 2. **Default Sizing** (`defaultSize` property)
 *    - Initial size when component is dropped onto canvas
 *    - Units are in grid units (default: 50 units = 100% width)
 *    - Example: { width: 50, height: 5 } = full width, 5 units tall
 *
 * 3. **Size Constraints** (`minSize`, `maxSize` properties)
 *    - Enforce minimum/maximum component dimensions
 *    - Prevents components from being resized too small or too large
 *    - If omitted, library uses defaults (100px min width, 80px min height)
 *
 * 4. **Custom Selection Colors** (`selectionColor` property)
 *    - Override default blue selection outline
 *    - Helps visually distinguish component types
 *    - Applied when component is selected
 *
 * 5. **Custom Palette Items** (`renderPaletteItem` property)
 *    - Override default palette item rendering
 *    - Return HTML string for custom palette appearance
 *    - Library injects this into the component palette sidebar
 *
 * 6. **Custom Drag Clones** (`renderDragClone` property)
 *    - Override default drag preview during palette drag
 *    - Return HTML string for custom drag appearance
 *    - Library creates this element during drag operations
 *
 * 7. **Component Rendering** (`render` property)
 *    - Function that returns the actual component to render
 *    - Receives config data from grid state
 *    - Uses JSX to return Stencil components or standard HTML
 */

/**
 * Categorized Component Groups
 * =============================
 *
 * Multiple Palette Pattern Demonstration:
 * - Components grouped by category
 * - Each category can be rendered in its own <component-palette>
 * - All palettes drag to the same canvases
 * - Enables collapsible sections and better organization
 */

// Content category - text-based components
export const contentComponents: ComponentDefinition[] = [
  {
    type: "blog-header",
    name: "Blog Header",
    icon: "📰",
    defaultSize: { width: 50, height: 5 },
    minSize: { width: 20, height: 3 },
    maxSize: { width: 50, height: 10 },
    selectionColor: "#3b82f6",
    renderPaletteItem: ({ componentType, name, icon }) => (
      <custom-palette-item
        componentType={componentType}
        name={name}
        icon={icon}
      />
    ),
    renderDragClone: () => <blog-header-drag-clone />,
    render: ({ config }) => (
      <blog-header
        headerTitle={config?.title || "Default Header"}
        subtitle={config?.subtitle}
      />
    ),
  },
  {
    type: "blog-article",
    name: "Blog Article",
    icon: "📝",
    defaultSize: { width: 25, height: 10 },
    selectionColor: "#10b981",
    renderPaletteItem: ({ componentType, name, icon }) => (
      <custom-palette-item
        componentType={componentType}
        name={name}
        icon={icon}
      />
    ),
    renderDragClone: () => <blog-article-drag-clone />,
    render: ({ config }) => (
      <blog-article
        content={config?.content || "Article content goes here"}
        author={config?.author}
        date={config?.date}
      />
    ),
  },
  {
    type: "blog-image",
    name: "Blog Image",
    icon: "🖼️",
    defaultSize: { width: 45, height: 20 },
    minSize: { width: 10, height: 8 },
    selectionColor: "#8b5cf6",
    renderPaletteItem: ({ componentType, name, icon }) => (
      <custom-palette-item
        componentType={componentType}
        name={name}
        icon={icon}
      />
    ),
    renderDragClone: () => <blog-image-drag-clone />,
    configSchema: [
      {
        name: "src",
        label: "Image URL",
        type: "text",
        defaultValue:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
        placeholder: "Enter image URL",
      },
      {
        name: "alt",
        label: "Alt Text",
        type: "text",
        defaultValue: "Placeholder image",
        placeholder: "Enter alt text for accessibility",
      },
      {
        name: "caption",
        label: "Caption",
        type: "text",
        defaultValue: "",
        placeholder: "Optional caption (max 2 lines)",
      },
      {
        name: "objectFit",
        label: "Fit Mode",
        type: "select",
        defaultValue: "contain",
        options: [
          { value: "contain", label: "Contain (show all, no crop)" },
          { value: "cover", label: "Cover (fill, may crop)" },
        ],
      },
    ],
    render: ({ config }) => (
      <blog-image
        src={
          config?.src ||
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
        }
        alt={config?.alt || "Placeholder image"}
        caption={config?.caption}
        objectFit={config?.objectFit || "contain"}
      />
    ),
  },
];

// Interactive category - buttons and CTAs
export const interactiveComponents: ComponentDefinition[] = [
  {
    type: "blog-button",
    name: "Blog Button",
    icon: "🔘",
    defaultSize: { width: 20, height: 4 },  // 4 units × 20px = 80px (matches CSS min-height)
    minSize: { width: 5, height: 4 },       // 5 units × 20px = 100px width, 4 units × 20px = 80px height (matches CSS)
    maxSize: { width: 30, height: 5 },
    selectionColor: "#ef4444",
    renderPaletteItem: ({ componentType, name, icon }) => (
      <custom-palette-item
        componentType={componentType}
        name={name}
        icon={icon}
      />
    ),
    renderDragClone: () => <blog-button-drag-clone />,
    render: ({ config }) => (
      <blog-button
        label={config?.label || "Click me!"}
        variant={config?.variant || "primary"}
        href={config?.href}
      />
    ),
  },
];

// Media category - galleries, dashboards, and live data
export const mediaComponents: ComponentDefinition[] = [
  {
    type: "image-gallery",
    name: "Image Gallery",
    icon: "🖼️",
    defaultSize: { width: 30, height: 12 },
    minSize: { width: 15, height: 8 },
    selectionColor: "#8b5cf6",
    renderPaletteItem: ({ componentType, name, icon }) => (
      <custom-palette-item
        componentType={componentType}
        name={name}
        icon={icon}
      />
    ),
    renderDragClone: () => <image-gallery-drag-clone />,
    configSchema: [
      {
        name: "imageCount",
        label: "Number of Images",
        type: "select",
        defaultValue: "6",
        options: [
          { value: "3", label: "3 images" },
          { value: "6", label: "6 images" },
          { value: "9", label: "9 images" },
          { value: "12", label: "12 images" },
        ],
      },
    ],
    render: ({ config }) => (
      <image-gallery imageCount={parseInt(config?.imageCount || "6")} />
    ),
  },
  {
    type: "dashboard-widget",
    name: "Dashboard",
    icon: "📊",
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 15, height: 8 },
    selectionColor: "#ec4899",
    renderPaletteItem: ({ componentType, name, icon }) => (
      <custom-palette-item
        componentType={componentType}
        name={name}
        icon={icon}
      />
    ),
    renderDragClone: () => <dashboard-widget-drag-clone />,
    render: () => <dashboard-widget />,
  },
  {
    type: "live-data",
    name: "Live Data",
    icon: "📡",
    defaultSize: { width: 20, height: 10 },
    minSize: { width: 15, height: 8 },
    selectionColor: "#06b6d4",
    renderPaletteItem: ({ componentType, name, icon }) => (
      <custom-palette-item
        componentType={componentType}
        name={name}
        icon={icon}
      />
    ),
    renderDragClone: () => <live-data-drag-clone />,
    render: () => <live-data />,
  },
];

// All components combined (for grid-builder registration)
export const blogComponentDefinitions: ComponentDefinition[] = [
  ...contentComponents,
  ...interactiveComponents,
  ...mediaComponents,
];

// Detailed documentation for each component type
// (Keeping for reference, but using combined arrays above)
export const _blogComponentDefinitionsDetailed: ComponentDefinition[] = [
  /**
   * Blog Header Component
   * ---------------------
   *
   * Features demonstrated:
   * - Full-width default size (50 units = 100% of canvas width)
   * - Custom minimum size (can't be smaller than 20x3)
   * - Custom maximum size (can't be taller than 10 units)
   * - Custom selection color (blue for headers)
   * - Custom palette item with SVG preview
   * - Config-driven rendering (title and subtitle from config)
   */
  {
    type: "blog-header",
    name: "Blog Header",
    icon: "📰",

    // Default size when dropped onto canvas
    // 50 units width = 100% of canvas (library uses 50 units for full width by default)
    // 5 units height = moderate vertical space
    defaultSize: { width: 50, height: 5 },

    // Minimum size constraints
    // Prevents header from being resized below 20x3 units
    minSize: { width: 20, height: 3 },

    // Maximum size constraints
    // Full width allowed, but max 10 units tall
    maxSize: { width: 50, height: 10 },

    // Custom selection color (overrides library's default blue)
    // Applied to selection outline when this component is selected
    selectionColor: "#3b82f6", // Blue for headers

    // Custom palette item with SVG preview
    renderPaletteItem: ({ componentType, name, icon }) =>
      `<custom-palette-item
        component-type="${componentType}"
        name="${name}"
        icon="${icon}">
      </custom-palette-item>`,

    // Custom drag clone preview
    renderDragClone: () => <blog-header-drag-clone />,

    // Render function - returns the actual component JSX
    // The library calls this with { config, itemId, ...otherProps }
    // Config comes from gridState.canvases[canvasId].items[itemId].config
    render: ({ config }) => (
      <blog-header
        headerTitle={config?.title || "Default Header"}
        subtitle={config?.subtitle}
      />
    ),
  },

  /**
   * Blog Article Component
   * ----------------------
   *
   * Features demonstrated:
   * - Half-width default size (25 units = 50% of canvas)
   * - No size constraints (uses library defaults)
   * - Custom selection color (green for articles)
   * - Custom palette item with SVG preview
   * - Multiple config properties (content, author, date)
   */
  {
    type: "blog-article",
    name: "Blog Article",
    icon: "📝",

    // Default size when dropped
    // 25 units = 50% canvas width (good for side-by-side articles)
    // 10 units height = comfortable reading height
    defaultSize: { width: 25, height: 10 },

    // Custom selection color (green distinguishes articles from headers/buttons)
    selectionColor: "#10b981", // Green for articles

    // No minSize/maxSize specified
    // Library will use defaults: 100px min width, 80px min height, no maximum

    // Custom palette item with SVG preview
    renderPaletteItem: ({ componentType, name, icon }) =>
      `<custom-palette-item
        component-type="${componentType}"
        name="${name}"
        icon="${icon}">
      </custom-palette-item>`,

    // Custom drag clone preview
    renderDragClone: () => <blog-article-drag-clone />,

    // Render function with multiple config properties
    // Demonstrates passing multiple configuration values to child component
    render: ({ config }) => (
      <blog-article
        content={config?.content || "Article content goes here"}
        author={config?.author}
        date={config?.date}
      />
    ),
  },

  /**
   * Blog Button Component
   * ---------------------
   *
   * Features demonstrated:
   * - Custom palette item rendering (renderPaletteItem)
   * - Custom drag clone rendering (renderDragClone)
   * - Narrow default size (20 units = 40% width)
   * - Tight size constraints (10-30 width, 2-5 height)
   * - Custom selection color (red for CTAs)
   */
  {
    type: "blog-button",
    name: "Blog Button",
    icon: "🔘",

    // Default size for buttons
    // 20 units = 40% canvas width (buttons don't need full width)
    // 3 units height = compact button size
    defaultSize: { width: 20, height: 3 },

    // Tight constraints for buttons
    // Min 10 units (20% width), max 30 units (60% width)
    // Min 2 units tall, max 5 units tall
    minSize: { width: 10, height: 2 },
    maxSize: { width: 30, height: 5 },

    // Custom selection color (red for call-to-action buttons)
    selectionColor: "#ef4444", // Red for buttons

    /**
     * Custom Palette Item Rendering
     * ------------------------------
     *
     * Library Feature: renderPaletteItem
     * - Override default palette item appearance
     * - Return HTML string (not JSX - this is raw HTML)
     * - Library injects this into the component palette sidebar
     * - Receives: { componentType, name, icon, defaultSize }
     *
     * Why use this:
     * - Create branded/styled palette items
     * - Add custom icons, badges, or decorations
     * - Match your application's design system
     */
    renderPaletteItem: ({ componentType, name, icon }) =>
      `<custom-palette-item
        component-type="${componentType}"
        name="${name}"
        icon="${icon}">
      </custom-palette-item>`,

    /**
     * Custom Drag Clone Rendering
     * ----------------------------
     *
     * Library Feature: renderDragClone
     * - Override default drag preview appearance
     * - Return HTML string (not JSX - this is raw HTML)
     * - Library creates this element during drag from palette
     * - Receives: { componentType, name, icon, width, height }
     *
     * Why use this:
     * - Show realistic preview of component during drag
     * - Match actual component appearance
     * - Improve user experience during placement
     */
    renderDragClone: () => <blog-button-drag-clone />,

    // Render function with conditional config values
    // Demonstrates fallback values for optional config properties
    render: ({ config }) => (
      <blog-button
        label={config?.label || "Click me!"}
        variant={config?.variant || "primary"}
        href={config?.href}
      />
    ),
  },

  /**
   * Blog Image Component
   * --------------------
   *
   * Features demonstrated:
   * - Proper aspect ratio preservation (no distortion)
   * - Maximum space utilization within container
   * - Guaranteed no overflow (critical for images)
   * - Loading state with spinner animation
   * - Error state with fallback UI
   * - Optional caption with truncation
   * - Two fit modes: contain (show all) and cover (fill container)
   * - Container-relative sizing for all elements
   * - Editable config (src, alt, caption, objectFit)
   */
  {
    type: "blog-image",
    name: "Blog Image",
    icon: "🖼️",

    // Default size for images
    // 25 units = 50% canvas width (good for side-by-side layouts)
    // 15 units height = adequate space for various aspect ratios
    defaultSize: { width: 25, height: 15 },

    // Minimum size constraints
    // Min 10 units width (20%), 8 units height
    // Allows for small thumbnails while maintaining usability
    minSize: { width: 10, height: 8 },

    // Custom selection color (purple for media components)
    selectionColor: "#8b5cf6", // Purple for images

    // Custom palette item
    renderPaletteItem: ({ componentType, name, icon }) =>
      `<custom-palette-item
        component-type="${componentType}"
        name="${name}"
        icon="${icon}">
      </custom-palette-item>`,

    // Custom drag clone preview
    renderDragClone: () => <blog-image-drag-clone />,

    /**
     * Configuration Schema
     * --------------------
     *
     * Library Feature: configSchema
     * - Defines editable fields in the config panel
     * - Supports: text, number, select, checkbox, color, textarea
     * - Changes apply immediately (live preview)
     * - Schema is used by custom-config-panel component
     */
    configSchema: [
      {
        name: "src",
        label: "Image URL",
        type: "text",
        defaultValue:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
        placeholder: "Enter image URL",
      },
      {
        name: "alt",
        label: "Alt Text",
        type: "text",
        defaultValue: "Placeholder image",
        placeholder: "Enter alt text for accessibility",
      },
      {
        name: "caption",
        label: "Caption",
        type: "text",
        defaultValue: "",
        placeholder: "Optional caption (max 2 lines)",
      },
      {
        name: "objectFit",
        label: "Fit Mode",
        type: "select",
        defaultValue: "contain",
        options: [
          { value: "contain", label: "Contain (show all, no crop)" },
          { value: "cover", label: "Cover (fill, may crop)" },
        ],
      },
    ],

    // Render function with image-specific config
    // Demonstrates src, alt, caption, and objectFit configuration
    render: ({ config }) => (
      <blog-image
        src={
          config?.src ||
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
        }
        alt={config?.alt || "Placeholder image"}
        caption={config?.caption}
        objectFit={config?.objectFit || "contain"}
      />
    ),
  },
];
