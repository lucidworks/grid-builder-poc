# blog-app



<!-- Auto Generated Below -->


## Dependencies

### Depends on

- [grid-builder](../../../components/grid-builder)
- [section-editor-panel](../section-editor-panel)
- [confirmation-modal](../confirmation-modal)
- [blog-header](../blog-header)
- [blog-article](../blog-article)
- [blog-button](../blog-button)

### Graph
```mermaid
graph TD;
  blog-app --> grid-builder
  blog-app --> section-editor-panel
  blog-app --> confirmation-modal
  blog-app --> blog-header
  blog-app --> blog-article
  blog-app --> blog-button
  grid-builder --> component-palette
  grid-builder --> canvas-section
  grid-builder --> config-panel
  canvas-section --> grid-item-wrapper
  style blog-app fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
