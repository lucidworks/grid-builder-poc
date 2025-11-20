# Demo Application

This folder contains demo/example code for the grid-builder library. These files are **not included** in the production build of the library.

## Contents

- `index.html` - Demo application entry point
- `demo.js` - Demo initialization script
- `component-definitions.tsx` - Example component definitions for blog layout demo
- `components/` - Demo-specific Stencil components
  - `blog-app/` - Example blog layout builder application (host app)
  - `blog-header/` - Example blog header component
  - `blog-article/` - Example blog article component
  - `blog-button/` - Example blog button component

## Purpose

This demo shows how to build a blog layout editor using the grid-builder library. It demonstrates:

- Creating custom component definitions
- Implementing a host application (`blog-app`)
- Building custom content components (`blog-header`, `blog-article`, `blog-button`)
- Using the Grid Builder API to manage layouts

## Build Configuration

Demo files are excluded from production builds via `stencil.config.ts`:

```typescript
excludeSrc: buildDemo ? [] : ['**/demo/**']
```

To run the demo server:

```bash
npm run start:demo
```

This sets `BUILD_DEMO=true` to include demo components in the build.
