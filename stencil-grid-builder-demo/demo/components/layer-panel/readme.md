# layer-panel



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute             | Description                                                           | Type                                   | Default |
| ------------------- | --------------------- | --------------------------------------------------------------------- | -------------------------------------- | ------- |
| `canvasMetadata`    | --                    | Canvas metadata for folder titles Map of canvasId → { title: string } | `{ [x: string]: { title: string; }; }` | `{}`    |
| `folderHeight`      | `folder-height`       | Height of folder header in pixels                                     | `number`                               | `40`    |
| `itemHeight`        | `item-height`         | Height of layer item in pixels                                        | `number`                               | `40`    |
| `searchDebounceMs`  | `search-debounce-ms`  | Search input debounce delay in milliseconds                           | `number`                               | `300`   |
| `virtualBufferPx`   | `virtual-buffer-px`   | Pre-render buffer in pixels (renders items outside viewport)          | `number`                               | `200`   |
| `virtualWindowSize` | `virtual-window-size` | Number of items to render in virtual window                           | `number`                               | `50`    |


## Dependencies

### Used by

 - [blog-app](../blog-app)

### Depends on

- [layer-panel-folder-header](../layer-panel-folder-header)
- [layer-panel-item](../layer-panel-item)

### Graph
```mermaid
graph TD;
  layer-panel --> layer-panel-folder-header
  layer-panel --> layer-panel-item
  blog-app --> layer-panel
  style layer-panel fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
