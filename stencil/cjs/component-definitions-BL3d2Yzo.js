'use strict';

var index = require('./index-DAu61QiP.js');

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
const contentComponents = [
    {
        type: 'blog-header',
        name: 'Blog Header',
        icon: '📰',
        defaultSize: { width: 50, height: 5 },
        minSize: { width: 20, height: 3 },
        maxSize: { width: 50, height: 10 },
        selectionColor: '#3b82f6',
        renderPaletteItem: ({ componentType, name, icon }) => (index.h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => index.h("blog-header-drag-clone", null),
        render: ({ config }) => (index.h("blog-header", { headerTitle: (config === null || config === void 0 ? void 0 : config.title) || 'Default Header', subtitle: config === null || config === void 0 ? void 0 : config.subtitle })),
    },
    {
        type: 'blog-article',
        name: 'Blog Article',
        icon: '📝',
        defaultSize: { width: 25, height: 10 },
        selectionColor: '#10b981',
        renderPaletteItem: ({ componentType, name, icon }) => (index.h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => index.h("blog-article-drag-clone", null),
        render: ({ config }) => (index.h("blog-article", { content: (config === null || config === void 0 ? void 0 : config.content) || 'Article content goes here', author: config === null || config === void 0 ? void 0 : config.author, date: config === null || config === void 0 ? void 0 : config.date })),
    },
    {
        type: 'blog-image',
        name: 'Blog Image',
        icon: '🖼️',
        defaultSize: { width: 45, height: 20 },
        minSize: { width: 10, height: 8 },
        selectionColor: '#8b5cf6',
        renderPaletteItem: ({ componentType, name, icon }) => (index.h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => index.h("blog-image-drag-clone", null),
        configSchema: [
            {
                name: 'src',
                label: 'Image URL',
                type: 'text',
                defaultValue: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                placeholder: 'Enter image URL',
            },
            {
                name: 'alt',
                label: 'Alt Text',
                type: 'text',
                defaultValue: 'Placeholder image',
                placeholder: 'Enter alt text for accessibility',
            },
            {
                name: 'caption',
                label: 'Caption',
                type: 'text',
                defaultValue: '',
                placeholder: 'Optional caption (max 2 lines)',
            },
            {
                name: 'objectFit',
                label: 'Fit Mode',
                type: 'select',
                defaultValue: 'contain',
                options: [
                    { value: 'contain', label: 'Contain (show all, no crop)' },
                    { value: 'cover', label: 'Cover (fill, may crop)' },
                ],
            },
        ],
        render: ({ config }) => (index.h("blog-image", { src: (config === null || config === void 0 ? void 0 : config.src) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', alt: (config === null || config === void 0 ? void 0 : config.alt) || 'Placeholder image', caption: config === null || config === void 0 ? void 0 : config.caption, objectFit: (config === null || config === void 0 ? void 0 : config.objectFit) || 'contain' })),
    },
];
// Interactive category - buttons and CTAs
const interactiveComponents = [
    {
        type: 'blog-button',
        name: 'Blog Button',
        icon: '🔘',
        defaultSize: { width: 20, height: 3 },
        minSize: { width: 10, height: 2 },
        maxSize: { width: 30, height: 5 },
        selectionColor: '#ef4444',
        renderPaletteItem: ({ componentType, name, icon }) => (index.h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => index.h("blog-button-drag-clone", null),
        render: ({ config }) => (index.h("blog-button", { label: (config === null || config === void 0 ? void 0 : config.label) || 'Click me!', variant: (config === null || config === void 0 ? void 0 : config.variant) || 'primary', href: config === null || config === void 0 ? void 0 : config.href })),
    },
];
// Media category - galleries, dashboards, and live data
const mediaComponents = [
    {
        type: 'image-gallery',
        name: 'Image Gallery',
        icon: '🖼️',
        defaultSize: { width: 30, height: 12 },
        minSize: { width: 15, height: 8 },
        selectionColor: '#8b5cf6',
        renderPaletteItem: ({ componentType, name, icon }) => (index.h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => index.h("image-gallery-drag-clone", null),
        configSchema: [
            {
                name: 'imageCount',
                label: 'Number of Images',
                type: 'select',
                defaultValue: '6',
                options: [
                    { value: '3', label: '3 images' },
                    { value: '6', label: '6 images' },
                    { value: '9', label: '9 images' },
                    { value: '12', label: '12 images' },
                ],
            },
        ],
        render: ({ config }) => (index.h("image-gallery", { imageCount: parseInt((config === null || config === void 0 ? void 0 : config.imageCount) || '6') })),
    },
    {
        type: 'dashboard-widget',
        name: 'Dashboard',
        icon: '📊',
        defaultSize: { width: 25, height: 10 },
        minSize: { width: 15, height: 8 },
        selectionColor: '#ec4899',
        renderPaletteItem: ({ componentType, name, icon }) => (index.h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => index.h("dashboard-widget-drag-clone", null),
        render: () => index.h("dashboard-widget", null),
    },
    {
        type: 'live-data',
        name: 'Live Data',
        icon: '📡',
        defaultSize: { width: 20, height: 10 },
        minSize: { width: 15, height: 8 },
        selectionColor: '#06b6d4',
        renderPaletteItem: ({ componentType, name, icon }) => (index.h("custom-palette-item", { componentType: componentType, name: name, icon: icon })),
        renderDragClone: () => index.h("live-data-drag-clone", null),
        render: () => index.h("live-data", null),
    },
];
// All components combined (for grid-builder registration)
const blogComponentDefinitions = [
    ...contentComponents,
    ...interactiveComponents,
    ...mediaComponents,
];

exports.blogComponentDefinitions = blogComponentDefinitions;
exports.contentComponents = contentComponents;
exports.interactiveComponents = interactiveComponents;
exports.mediaComponents = mediaComponents;
//# sourceMappingURL=component-definitions-BL3d2Yzo.js.map

//# sourceMappingURL=component-definitions-BL3d2Yzo.js.map