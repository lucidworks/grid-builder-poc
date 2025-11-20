# blog-app



<!-- Auto Generated Below -->


## Overview

Blog App Demo - Host Application for grid-builder Library
==========================================================

This component demonstrates how to build a complete page builder application
using the

## Dependencies

### Depends on

- [component-palette](../../../components/component-palette)
- [grid-viewer](../../../components/grid-viewer)
- [grid-builder](../../../components/grid-builder)
- [section-editor-panel](../section-editor-panel)
- [confirmation-modal](../confirmation-modal)
- [custom-config-panel](../custom-config-panel)
- [blog-header](../blog-header)
- [blog-article](../blog-article)
- [blog-button](../blog-button)

### Graph
```mermaid
graph TD;
  blog-app --> component-palette
  blog-app --> grid-viewer
  blog-app --> grid-builder
  blog-app --> section-editor-panel
  blog-app --> confirmation-modal
  blog-app --> custom-config-panel
  blog-app --> blog-header
  blog-app --> blog-article
  blog-app --> blog-button
  grid-viewer --> canvas-section-viewer
  canvas-section-viewer --> grid-item-wrapper
  grid-builder --> component-palette
  grid-builder --> canvas-section
  grid-builder --> config-panel
  canvas-section --> grid-item-wrapper
  custom-config-panel --> blog-header
  custom-config-panel --> blog-article
  custom-config-panel --> blog-button
  style blog-app fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
