# section-editor-panel



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute | Description | Type                | Default |
| ------------- | --------- | ----------- | ------------------- | ------- |
| `isOpen`      | `is-open` |             | `boolean`           | `false` |
| `sectionData` | --        |             | `SectionEditorData` | `null`  |


## Events

| Event           | Description | Type                                                                         |
| --------------- | ----------- | ---------------------------------------------------------------------------- |
| `closePanel`    |             | `CustomEvent<void>`                                                          |
| `updateSection` |             | `CustomEvent<{ canvasId: string; title: string; backgroundColor: string; }>` |


## Dependencies

### Used by

 - [blog-app](../blog-app)

### Graph
```mermaid
graph TD;
  blog-app --> section-editor-panel
  style section-editor-panel fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
