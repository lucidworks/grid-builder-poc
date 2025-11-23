#!/usr/bin/env node

/**
 * Post-build script to remove demo components from production distribution
 *
 * Usage:
 * - npm run build → Runs this script (removes demo components)
 * - npm run build:demo → Does NOT run this script (keeps demo components)
 *
 * Removes:
 * - dist/types/demo/ (TypeScript definitions)
 * - dist/collection/demo/ (Compiled components)
 * - dist/esm/demo/ (ES modules)
 * - Demo component entries from dist/types/components.d.ts
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning demo components from distribution...');

const distDir = path.join(__dirname, '../dist');

// Directories to remove
const demoDirectories = [
  path.join(distDir, 'types/demo'),
  path.join(distDir, 'collection/demo'),
  path.join(distDir, 'esm/demo'),
];

// Remove demo directories
let removedDirs = 0;
demoDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`  ✓ Removed ${path.relative(distDir, dir)}/`);
    removedDirs++;
  }
});

// Clean components.d.ts - remove demo component definitions
const componentsDtsPath = path.join(distDir, 'types/components.d.ts');
if (fs.existsSync(componentsDtsPath)) {
  let content = fs.readFileSync(componentsDtsPath, 'utf8');
  const originalLength = content.length;

  // Remove demo type imports (lines like: import { ConfirmationModalData } from "./demo/types/confirmation-modal-data";)
  content = content.replace(/^import\s+\{[^}]+\}\s+from\s+["']\.\/demo\/[^"']+["'];?\n?/gm, '');

  // Remove demo type exports (lines like: export { ConfirmationModalData } from "./demo/types/confirmation-modal-data";)
  content = content.replace(/^export\s+\{[^}]+\}\s+from\s+["']\.\/demo\/[^"']+["'];?\n?/gm, '');

  // Remove demo component interfaces from Components namespace
  // Pattern: Match from comment/interface start to closing brace, for demo components
  const demoComponents = [
    'BlogApp',
    'BlogArticle',
    'BlogArticleDragClone',
    'BlogButton',
    'BlogButtonDragClone',
    'BlogHeader',
    'BlogHeaderDragClone',
    'BlogImage',
    'BlogImageDragClone',
    'CanvasHeader',
    'ConfirmationModal',
    'CustomConfigPanel',
    'CustomDragClone',
    'CustomPaletteItem',
    'DashboardWidget',
    'DashboardWidgetDragClone',
    'ImageGallery',
    'ImageGalleryDragClone',
    'LiveData',
    'LiveDataDragClone',
    'SectionEditorPanel',
  ];

  demoComponents.forEach(componentName => {
    // Remove interface definition from Components namespace
    const interfacePattern = new RegExp(
      `(\\s*\\/\\*\\*[\\s\\S]*?\\*\\/)?\\s*interface\\s+${componentName}\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
      'g'
    );
    content = content.replace(interfacePattern, '');

    // Remove from HTMLElementTagNameMap
    const tagMapPattern = new RegExp(
      `\\s*"[^"]*${componentName.toLowerCase().replace(/([A-Z])/g, '-$1').slice(1)}":\\s*HTML${componentName}Element;`,
      'g'
    );
    content = content.replace(tagMapPattern, '');

    // Remove HTML element interface definitions
    const htmlInterfacePattern = new RegExp(
      `(\\s*\\/\\*\\*[\\s\\S]*?\\*\\/)?[\\s\\S]*?interface\\s+HTML${componentName}Element[\\s\\S]*?\\n\\s*\\}\\n\\s*var\\s+HTML${componentName}Element:[\\s\\S]*?\\n\\s*\\};`,
      'g'
    );
    content = content.replace(htmlInterfacePattern, '');

    // Remove from LocalJSX namespace
    const localJsxPattern = new RegExp(
      `(\\s*\\/\\*\\*[\\s\\S]*?\\*\\/)?\\s*interface\\s+${componentName}\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
      'g'
    );
    content = content.replace(localJsxPattern, '');

    // Remove event map interfaces
    const eventMapPattern = new RegExp(
      `\\s*interface\\s+HTML${componentName}ElementEventMap\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
      'g'
    );
    content = content.replace(eventMapPattern, '');

    // Remove custom event types
    const customEventPattern = new RegExp(
      `export\\s+interface\\s+${componentName}CustomEvent<T>[\\s\\S]*?\\n\\}`,
      'g'
    );
    content = content.replace(customEventPattern, '');
  });

  // Remove from IntrinsicElements in both LocalJSX and JSX namespaces
  demoComponents.forEach(componentName => {
    const kebabCase = componentName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .slice(1);

    // Remove from LocalJSX.IntrinsicElements
    const intrinsicPattern = new RegExp(
      `\\s*"${kebabCase}":\\s*${componentName};`,
      'g'
    );
    content = content.replace(intrinsicPattern, '');

    // Remove from JSX.IntrinsicElements with documentation
    const jsxIntrinsicPattern = new RegExp(
      `(\\s*\\/\\*\\*[\\s\\S]*?\\*\\/)?\\s*"${kebabCase}":[\\s\\S]*?&\\s*JSXBase\\.HTMLAttributes<HTML${componentName}Element>;`,
      'g'
    );
    content = content.replace(jsxIntrinsicPattern, '');
  });

  // Clean up multiple consecutive blank lines (more than 2)
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content.length !== originalLength) {
    fs.writeFileSync(componentsDtsPath, content, 'utf8');
    const removedBytes = originalLength - content.length;
    console.log(`  ✓ Cleaned components.d.ts (removed ${removedBytes} bytes)`);
  }
}

console.log(`✅ Demo cleanup complete (${removedDirs} directories removed)\n`);
