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
export declare const contentComponents: ComponentDefinition[];
export declare const interactiveComponents: ComponentDefinition[];
export declare const mediaComponents: ComponentDefinition[];
export declare const blogComponentDefinitions: ComponentDefinition[];
export declare const _blogComponentDefinitionsDetailed: ComponentDefinition[];
