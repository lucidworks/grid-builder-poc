# blog-app



<!-- Auto Generated Below -->


## Overview

Blog App Demo - Host Application for grid-builder Library
==========================================================

This component demonstrates how to build a complete page builder application
using the

## Dependencies

### Depends on

- [canvas-header](../canvas-header)
- [component-palette](../../../components/component-palette)
- [grid-viewer](../../../components/grid-viewer)
- [grid-builder](../../../components/grid-builder)
- [section-editor-panel](../section-editor-panel)
- [confirmation-modal](../confirmation-modal)
- [custom-config-panel](../custom-config-panel)
- [custom-palette-item](../custom-palette-item)
- [custom-drag-clone](../custom-drag-clone)
- [blog-header](../blog-header)
- [blog-article](../blog-article)
- [blog-image](../blog-image)
- [blog-button](../blog-button)
- [image-gallery](../image-gallery)
- [dashboard-widget](../dashboard-widget)
- [live-data](../live-data)

### Graph
```mermaid
graph TD;
  blog-app --> canvas-header
  blog-app --> component-palette
  blog-app --> grid-viewer
  blog-app --> grid-builder
  blog-app --> section-editor-panel
  blog-app --> confirmation-modal
  blog-app --> custom-config-panel
  blog-app --> custom-palette-item
  blog-app --> custom-drag-clone
  blog-app --> blog-header
  blog-app --> blog-article
  blog-app --> blog-image
  blog-app --> blog-button
  blog-app --> image-gallery
  blog-app --> dashboard-widget
  blog-app --> live-data
  grid-viewer --> canvas-section-viewer
  canvas-section-viewer --> grid-item-wrapper
  grid-builder --> component-palette
  grid-builder --> canvas-section
  canvas-section --> grid-item-wrapper
  custom-config-panel --> custom-palette-item
  custom-config-panel --> custom-drag-clone
  custom-config-panel --> blog-header
  custom-config-panel --> blog-article
  custom-config-panel --> blog-image
  custom-config-panel --> blog-button
  custom-config-panel --> image-gallery
  custom-config-panel --> dashboard-widget
  custom-config-panel --> live-data
  style blog-app fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
