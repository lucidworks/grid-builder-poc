# component-palette



<!-- Auto Generated Below -->


## Overview

ComponentPalette Component
===========================

Library component providing draggable component palette UI.

**Tag**: `<component-palette>`
**Shadow DOM**: Disabled (for consistency with other components)
**Reactivity**: Re-renders when components prop changes

## Usage Patterns

**Pattern 1: Default (inside grid-builder)**
```typescript
// Palette automatically rendered by grid-builder
<grid-builder components={componentDefinitions} />
```

**Pattern 2: Independent placement**
```typescript
// Place palette anywhere in your app
<div class="my-layout">
  <aside class="sidebar">
    <component-palette
      components={componentDefinitions}
      config={gridConfig}
    />
  </aside>
  <main>
    <grid-builder
      components={componentDefinitions}
      config={gridConfig}
      uiOverrides={{
        ComponentPalette: () => null  // Hide default palette
      }}
    />
  </main>
</div>
```

**Pattern 3: Custom wrapper component**
```typescript
// Wrap in your own component for styling

## Properties

| Property                  | Attribute       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Type                    | Default               |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | --------------------- |
| `components` _(required)_ | --              | Component definitions to render in palette  **Required prop**: Array of ComponentDefinition objects **Source**: Passed from grid-builder component  **Each definition provides**: - type: Unique identifier for component - name: Display name in palette - icon: Visual identifier (emoji recommended) - defaultSize: Size when dropped (for drag clone sizing)  **Example**: ```typescript const components = [   {     type: 'header',     name: 'Header',     icon: '📄',     defaultSize: { width: 20, height: 8 },     render: ({ itemId, config }) => <my-header itemId={itemId} config={config} />   } ]; ```                                                                                                                                                                                                                                                          | `ComponentDefinition[]` | `undefined`           |
| `config`                  | --              | Grid configuration options  **Optional prop**: Customizes grid system behavior **Passed from**: grid-builder component **Used for**: Drag clone sizing (gridToPixelsX/Y calculations)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `GridConfig`            | `undefined`           |
| `paletteLabel`            | `palette-label` | Custom label for this palette instance  **Optional prop**: Provides a descriptive label for this specific palette **Default**: "Component palette" **Used for**: ARIA label on toolbar container  **Use case - Multiple palettes**: When multiple component palettes exist on the same page (e.g., categorized palettes), provide unique labels for screen reader users:  ```typescript <component-palette components={contentComponents} paletteLabel="Content components" /> <component-palette components={mediaComponents} paletteLabel="Media components" /> <component-palette components={interactiveComponents} paletteLabel="Interactive components" /> ```  **Accessibility benefit**: - Screen readers announce: "Content components, toolbar" - Users can navigate between palettes by their distinct labels - Each palette has unique ARIA IDs to avoid conflicts | `string`                | `"Component palette"` |
| `showHeader`              | `show-header`   | Show palette header (title)  **Optional prop**: Controls whether the "Components" header is displayed **Default**: true (shows header for backward compatibility)  **Use cases**: - `showHeader={true}` (default): Standard palette with "Components" title - `showHeader={false}`: Chromeless mode - just the component list  **Chromeless mode benefits**: - Embed palette in custom layouts - Add your own headers/titles - Integrate into existing UI structures - More flexible component placement  **Example - Chromeless with custom wrapper**: ```typescript <div class="my-custom-sidebar"> <h3 class="my-title">Available Components</h3> <p class="my-description">Drag to add</p> <component-palette components={componentDefinitions} showHeader={false} /> </div> ```                                                                                           | `boolean`               | `true`                |


## Dependencies

### Used by

 - [blog-app](../../demo/components/blog-app)

### Graph
```mermaid
graph TD;
  blog-app --> component-palette
  style component-palette fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
