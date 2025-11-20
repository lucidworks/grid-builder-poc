import { h } from '@stencil/core';
import { ComponentDefinition } from '../types/component-definition';

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
    type: 'blog-header',
    name: 'Blog Header',
    icon: '📰',
    defaultSize: { width: 50, height: 5 },
    minSize: { width: 20, height: 3 },
    maxSize: { width: 50, height: 10 },
    selectionColor: '#3b82f6',
    render: ({ config }) => (
      <blog-header
        headerTitle={config?.title || 'Default Header'}
        subtitle={config?.subtitle}
      />
    ),
  },
  {
    type: 'blog-article',
    name: 'Blog Article',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    selectionColor: '#10b981',
    render: ({ config }) => (
      <blog-article
        content={config?.content || 'Article content goes here'}
        author={config?.author}
        date={config?.date}
      />
    ),
  },
];

// Interactive category - buttons and CTAs
export const interactiveComponents: ComponentDefinition[] = [
  {
    type: 'blog-button',
    name: 'Blog Button',
    icon: '🔘',
    defaultSize: { width: 20, height: 3 },
    minSize: { width: 10, height: 2 },
    maxSize: { width: 30, height: 5 },
    selectionColor: '#ef4444',
    renderPaletteItem: ({ componentType, name, icon }) =>
      `<custom-palette-item
        component-type="${componentType}"
        name="${name}"
        icon="${icon}">
      </custom-palette-item>`,
    renderDragClone: ({ componentType, name, icon, width, height }) =>
      `<custom-drag-clone
        component-type="${componentType}"
        name="${name}"
        icon="${icon}"
        width="${width}"
        height="${height}">
      </custom-drag-clone>`,
    render: ({ config }) => (
      <blog-button
        label={config?.label || 'Click me!'}
        variant={config?.variant || 'primary'}
        href={config?.href}
      />
    ),
  },
];

// All components combined (for backward compatibility)
export const blogComponentDefinitions: ComponentDefinition[] = [
  /**
   * Blog Header Component
   * ---------------------
   *
   * Features demonstrated:
   * - Full-width default size (50 units = 100% of canvas width)
   * - Custom minimum size (can't be smaller than 20x3)
   * - Custom maximum size (can't be taller than 10 units)
   * - Custom selection color (blue for headers)
   * - Config-driven rendering (title and subtitle from config)
   */
  {
    type: 'blog-header',
    name: 'Blog Header',
    icon: '📰',

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
    selectionColor: '#3b82f6', // Blue for headers

    // Render function - returns the actual component JSX
    // The library calls this with { config, itemId, ...otherProps }
    // Config comes from gridState.canvases[canvasId].items[itemId].config
    render: ({ config }) => (
      <blog-header
        headerTitle={config?.title || 'Default Header'}
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
   * - Multiple config properties (content, author, date)
   */
  {
    type: 'blog-article',
    name: 'Blog Article',
    icon: '📝',

    // Default size when dropped
    // 25 units = 50% canvas width (good for side-by-side articles)
    // 10 units height = comfortable reading height
    defaultSize: { width: 25, height: 10 },

    // Custom selection color (green distinguishes articles from headers/buttons)
    selectionColor: '#10b981', // Green for articles

    // No minSize/maxSize specified
    // Library will use defaults: 100px min width, 80px min height, no maximum

    // Render function with multiple config properties
    // Demonstrates passing multiple configuration values to child component
    render: ({ config }) => (
      <blog-article
        content={config?.content || 'Article content goes here'}
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
    type: 'blog-button',
    name: 'Blog Button',
    icon: '🔘',

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
    selectionColor: '#ef4444', // Red for buttons

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
    renderDragClone: ({ componentType, name, icon, width, height }) =>
      `<custom-drag-clone
        component-type="${componentType}"
        name="${name}"
        icon="${icon}"
        width="${width}"
        height="${height}">
      </custom-drag-clone>`,

    // Render function with conditional config values
    // Demonstrates fallback values for optional config properties
    render: ({ config }) => (
      <blog-button
        label={config?.label || 'Click me!'}
        variant={config?.variant || 'primary'}
        href={config?.href}
      />
    ),
  },
];
