import { html } from "lit-html";

export default {
  title: "Components/Grid Viewer",
};

// Shared component definitions (same for builder and viewer)
const sharedComponents = [
  {
    type: "header",
    name: "Header",
    icon: "📄",
    defaultSize: { width: 30, height: 4 },
    minSize: { width: 15, height: 3 },
    render: ({ itemId, config }) => {
      const div = document.createElement("div");
      div.style.cssText =
        "padding: 12px; background: #f0f0f0; border-radius: 4px; height: 100%;";
      const h3 = document.createElement("h3");
      h3.style.cssText = "margin: 0; font-size: 16px;";
      h3.textContent = config?.title || "Header";
      div.appendChild(h3);
      return div;
    },
    renderDragClone: () => {
      const div = document.createElement("div");
      div.style.cssText =
        "padding: 12px; background: #f0f0f0; border-radius: 4px; height: 100%; opacity: 0.8;";
      const h3 = document.createElement("h3");
      h3.style.cssText = "margin: 0; font-size: 16px;";
      h3.textContent = "📄 Header";
      div.appendChild(h3);
      return div;
    },
  },
  {
    type: "text",
    name: "Text Block",
    icon: "📝",
    defaultSize: { width: 20, height: 6 },
    minSize: { width: 10, height: 4 },
    render: ({ itemId, config }) => {
      const div = document.createElement("div");
      div.style.cssText =
        "padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px; height: 100%;";
      const p = document.createElement("p");
      p.style.cssText = "margin: 0; font-size: 13px; line-height: 1.4;";
      p.textContent = config?.text || "Sample text content.";
      div.appendChild(p);
      return div;
    },
    renderDragClone: () => {
      const div = document.createElement("div");
      div.style.cssText =
        "padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px; height: 100%; opacity: 0.8;";
      const p = document.createElement("p");
      p.style.cssText = "margin: 0; font-size: 13px; line-height: 1.4;";
      p.textContent = "📝 Text Block";
      div.appendChild(p);
      return div;
    },
  },
  {
    type: "button",
    name: "Button",
    icon: "🔘",
    defaultSize: { width: 12, height: 4 },
    minSize: { width: 8, height: 3 },
    render: ({ itemId, config }) => {
      const button = document.createElement("button");
      button.style.cssText =
        "padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%; height: 100%;";
      button.textContent = config?.label || "Click Me";
      return button;
    },
    renderDragClone: () => {
      const button = document.createElement("button");
      button.style.cssText =
        "padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%; height: 100%; opacity: 0.8;";
      button.textContent = "🔘 Button";
      return button;
    },
  },
];

// Sample exported layout (what you'd get from builder.exportState())
const sampleExportedLayout = {
  version: "1.0.0",
  canvases: {
    canvas1: {
      items: [
        {
          id: "item-1",
          canvasId: "canvas1",
          type: "header",
          name: "Header",
          layouts: {
            desktop: { x: 0, y: 0, width: 30, height: 4 },
            mobile: {
              x: null,
              y: null,
              width: null,
              height: null,
              customized: false,
            },
          },
          zIndex: 1,
          config: { title: "Welcome to Grid Viewer!" },
        },
        {
          id: "item-2",
          canvasId: "canvas1",
          type: "text",
          name: "Text Block",
          layouts: {
            desktop: { x: 0, y: 5, width: 20, height: 6 },
            mobile: {
              x: null,
              y: null,
              width: null,
              height: null,
              customized: false,
            },
          },
          zIndex: 2,
          config: {
            text: "This layout was exported from grid-builder and imported to grid-viewer. Notice there are no editing controls - it's rendering-only!",
          },
        },
        {
          id: "item-3",
          canvasId: "canvas1",
          type: "button",
          name: "Button",
          layouts: {
            desktop: { x: 21, y: 5, width: 12, height: 4 },
            mobile: {
              x: null,
              y: null,
              width: null,
              height: null,
              customized: false,
            },
          },
          zIndex: 3,
          config: { label: "Get Started" },
        },
      ],
    },
  },
  viewport: "desktop",
  metadata: {
    name: "Sample Landing Page",
    description: "Exported from grid-builder",
    createdAt: new Date().toISOString(),
  },
};

/**
 * Basic Viewer - Display Only
 *
 * This story demonstrates the grid-viewer component displaying a pre-exported layout.
 * Notice there are NO editing controls - no drag handles, no resize handles, no delete buttons.
 */
export const BasicViewer = (args) => {
  const viewerEl = document.createElement("grid-viewer");
  viewerEl.components = sharedComponents;
  viewerEl.initialState = sampleExportedLayout;
  viewerEl.config = {
    enableVirtualRendering: false, // Disable for Storybook iframe compatibility
  };

  return html`
    <div style="font-family: system-ui, -apple-system, sans-serif;">
      <h2 style="margin-top: 0; color: #333;">
        Grid Viewer - Display Only Mode
      </h2>
      <p style="color: #666; margin-bottom: 20px;">
        This is a rendering-only view. No drag-and-drop, no editing controls,
        just clean content display.
        <br />
        <strong>Bundle size:</strong> ~30KB (vs ~150KB for full builder with
        interact.js)
      </p>
      <div
        style="width: 100%; height: ${args.height}; border: ${args.borderWidth} solid ${args.borderColor}; border-radius: ${args.borderRadius}; overflow: hidden;"
      >
        ${viewerEl}
      </div>
    </div>
  `;
};

BasicViewer.args = {
  height: "500px",
  borderWidth: "2px",
  borderColor: "#007bff",
  borderRadius: "8px",
};

BasicViewer.argTypes = {
  height: {
    control: "text",
    description: "Container height",
    table: {
      category: "Container",
      defaultValue: { summary: "500px" },
    },
  },
  borderWidth: {
    control: "text",
    description: "Border width",
    table: {
      category: "Styling",
      defaultValue: { summary: "2px" },
    },
  },
  borderColor: {
    control: "color",
    description: "Border color",
    table: {
      category: "Styling",
      defaultValue: { summary: "#007bff" },
    },
  },
  borderRadius: {
    control: "text",
    description: "Border radius",
    table: {
      category: "Styling",
      defaultValue: { summary: "8px" },
    },
  },
};

/**
 * Export/Import Demo - Complete Workflow
 *
 * This story demonstrates the complete workflow:
 * 1. Create layout in grid-builder
 * 2. Export to JSON
 * 3. Import to grid-viewer for display
 */
export const ExportImportWorkflow = () => {
  // Unique ID for this story instance (prevents duplicates on hot reload)
  const storyId = `story-${Date.now()}`;

  // Create builder instance
  const builderEl = document.createElement("grid-builder");
  builderEl.id = `${storyId}-builder`;
  builderEl.components = sharedComponents;
  builderEl.initialState = {
    canvases: {
      canvas1: {
        items: [
          {
            id: "demo-header",
            canvasId: "canvas1",
            type: "header",
            name: "Header",
            layouts: {
              desktop: { x: 0, y: 0, width: 30, height: 4 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 1,
            config: { title: "Edit me in the builder above!" },
          },
          {
            id: "demo-text",
            canvasId: "canvas1",
            type: "text",
            name: "Text",
            layouts: {
              desktop: { x: 0, y: 5, width: 25, height: 6 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 2,
            config: {
              text: "Try adding, moving, or editing components in the builder, then click Export to see the changes in the viewer below!",
            },
          },
        ],
        zIndexCounter: 3,
      },
    },
  };

  // Create viewer instance
  const viewerEl = document.createElement("grid-viewer");
  viewerEl.components = sharedComponents;
  viewerEl.initialState = sampleExportedLayout;
  viewerEl.config = {
    enableVirtualRendering: false, // Disable for Storybook iframe compatibility
  };

  // Create JSON display element
  const jsonDisplay = document.createElement("pre");
  jsonDisplay.style.cssText = `
    background: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
    overflow: auto;
    max-height: 300px;
    font-size: 12px;
    margin: 10px 0;
  `;
  jsonDisplay.textContent = JSON.stringify(sampleExportedLayout, null, 2);

  // Create export button
  const exportButton = document.createElement("button");
  exportButton.textContent = "📤 Export from Builder → Import to Viewer";
  exportButton.style.cssText = `
    background: #28a745;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin: 20px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s;
  `;
  exportButton.addEventListener("mouseover", () => {
    exportButton.style.background = "#218838";
    exportButton.style.transform = "translateY(-2px)";
    exportButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
  });
  exportButton.addEventListener("mouseout", () => {
    exportButton.style.background = "#28a745";
    exportButton.style.transform = "translateY(0)";
    exportButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  });

  // Container for viewer (so we can replace it)
  const viewerContainer = document.createElement("div");
  viewerContainer.appendChild(viewerEl);

  // Handle export button click
  exportButton.addEventListener("click", async () => {
    try {
      // Export from builder
      const exportData = await builderEl.exportState();
      console.log("📤 Exported layout:", exportData);

      // Update JSON display
      jsonDisplay.textContent = JSON.stringify(exportData, null, 2);

      // Re-create viewer with new data (necessary for proper re-rendering)
      const newViewer = document.createElement("grid-viewer");
      newViewer.components = sharedComponents;
      newViewer.initialState = exportData;
      newViewer.config = {
        enableVirtualRendering: false, // Disable for Storybook iframe compatibility
      };

      // Replace old viewer
      viewerContainer.innerHTML = "";
      viewerContainer.appendChild(newViewer);

      // Show success message in console
      console.log(
        "✅ Successfully exported from builder and imported to viewer!",
      );
    } catch (error) {
      console.error("Export/import failed:", error);
      alert("Export/import failed. Check console for details.");
    }
  });

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;"
    >
      <h2 style="margin-top: 0; color: #333;">Export/Import Workflow Demo</h2>
      <p style="color: #666;">
        This demonstrates the complete builder → viewer workflow. Edit the
        layout in the builder, then click the button to export and import to the
        viewer.
      </p>

      <!-- Builder Section -->
      <div style="margin-bottom: 40px;">
        <h3 style="color: #007bff; margin-bottom: 10px;">
          🛠️ Builder (Full Editing Mode)
        </h3>
        <div
          style="width: 100%; height: 400px; border: 3px solid #007bff; border-radius: 8px; overflow: hidden;"
        >
          ${builderEl}
        </div>
        <p style="margin-top: 10px; font-size: 13px; color: #666;">
          <strong>Features:</strong> Drag-and-drop, resize, delete, undo/redo,
          config panel
          <br />
          <strong>Bundle size:</strong> ~150KB (includes interact.js)
        </p>
      </div>

      <!-- Export Button -->
      ${exportButton}

      <!-- JSON Export Display -->
      <details style="margin: 20px 0;">
        <summary
          style="cursor: pointer; font-weight: 600; color: #333; padding: 10px; background: #f8f9fa; border-radius: 4px;"
        >
          📋 View Exported JSON
        </summary>
        ${jsonDisplay}
      </details>

      <!-- Viewer Section -->
      <div>
        <h3 style="color: #28a745; margin-bottom: 10px;">
          👁️ Viewer (Display Only Mode)
        </h3>
        <div
          style="width: 100%; height: 400px; border: 3px solid #28a745; border-radius: 8px; overflow: hidden;"
        >
          ${viewerContainer}
        </div>
        <p style="margin-top: 10px; font-size: 13px; color: #666;">
          <strong>Features:</strong> Clean display, responsive layouts, virtual
          rendering
          <br />
          <strong>Bundle size:</strong> ~30KB (no interact.js, 80% smaller)
        </p>
      </div>

      <!-- Instructions -->
      <div
        style="margin-top: 40px; padding: 20px; background: #e7f3ff; border-left: 4px solid #007bff; border-radius: 4px;"
      >
        <h4 style="margin-top: 0; color: #007bff;">💡 How to Use</h4>
        <ol style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li>Add components from the palette in the builder</li>
          <li>Drag, resize, and configure components</li>
          <li>Click the <strong>Export → Import</strong> button</li>
          <li>
            See the exact same layout in the viewer below (without editing
            controls)
          </li>
          <li>Open the JSON section to see the exported data structure</li>
        </ol>
      </div>
    </div>
  `;
};

/**
 * Responsive Viewer - Desktop vs Mobile
 *
 * Shows how the viewer handles responsive layouts with container-based viewport switching.
 */
export const ResponsiveViewer = (args) => {
  const createViewer = (width, label) => {
    const viewerEl = document.createElement("grid-viewer");
    viewerEl.components = sharedComponents;
    viewerEl.initialState = sampleExportedLayout;
    viewerEl.config = {
      enableVirtualRendering: false, // Disable for Storybook iframe compatibility
    };

    return html`
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
          ${label}
        </h3>
        <div
          style="width: ${width}px; height: 400px; border: 3px solid #17a2b8; border-radius: 8px; overflow: hidden;"
        >
          ${viewerEl}
        </div>
        <p style="margin-top: 8px; font-size: 13px; color: #666;">
          Container width: <strong>${width}px</strong> →
          ${width < 768 ? "Mobile" : "Desktop"} viewport
        </p>
      </div>
    `;
  };

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;"
    >
      <h2 style="margin-top: 0; color: #333;">Responsive Grid Viewer</h2>
      <p style="color: #666; margin-bottom: 30px;">
        The viewer automatically switches between desktop and mobile viewports
        based on container width.
        <br />
        <strong>Breakpoint: 768px</strong> — Check the browser console for
        viewport switch messages!
      </p>

      ${createViewer(
        args.desktopWidth,
        "✅ Desktop Viewport (900px container)",
      )}
      ${createViewer(args.mobileWidth, "📱 Mobile Viewport (600px container)")}

      <div
        style="padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;"
      >
        <h4 style="margin-top: 0; color: #17a2b8;">
          📊 Container-Based Responsive Design
        </h4>
        <ul style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li>
            Viewport switching based on <strong>container width</strong>, not
            window width
          </li>
          <li>Works perfectly in sidebars, modals, or embedded widgets</li>
          <li>
            Multiple viewers can have different viewports on the same page
          </li>
          <li>ResizeObserver provides efficient, automatic switching</li>
        </ul>
      </div>
    </div>
  `;
};

ResponsiveViewer.args = {
  desktopWidth: 900,
  mobileWidth: 600,
};

ResponsiveViewer.argTypes = {
  desktopWidth: {
    control: { type: "range", min: 768, max: 1200, step: 50 },
    description: "Desktop container width (≥768px triggers desktop viewport)",
    table: {
      category: "Container Sizes",
      defaultValue: { summary: 900 },
    },
  },
  mobileWidth: {
    control: { type: "range", min: 320, max: 767, step: 50 },
    description: "Mobile container width (<768px triggers mobile viewport)",
    table: {
      category: "Container Sizes",
      defaultValue: { summary: 600 },
    },
  },
};

/**
 * Minimal Viewer - Just Components
 *
 * Shows the absolute minimal viewer setup - just components, no extras.
 */
export const MinimalViewer = (args) => {
  const viewerEl = document.createElement("grid-viewer");
  viewerEl.components = sharedComponents;
  viewerEl.initialState = sampleExportedLayout;
  viewerEl.config = {
    enableVirtualRendering: false, // Disable for Storybook iframe compatibility
  };

  return html`
    <div style="width: 100%; height: ${args.height};">${viewerEl}</div>
  `;
};

MinimalViewer.args = {
  height: "600px",
};

MinimalViewer.argTypes = {
  height: {
    control: "text",
    description: "Container height",
    table: {
      category: "Container",
      defaultValue: { summary: "600px" },
    },
  },
};

/**
 * Multiple Sections - Multi-Canvas Layout
 *
 * Demonstrates grid-viewer with multiple canvas sections (like hero, features, footer).
 * Each section can have its own background color and components.
 */
export const MultipleSections = () => {
  // Multi-section layout data
  const multiSectionLayout = {
    version: "1.0.0",
    canvases: {
      "hero-section": {
        items: [
          {
            id: "hero-header",
            canvasId: "hero-section",
            type: "header",
            name: "Hero Header",
            layouts: {
              desktop: { x: 5, y: 2, width: 40, height: 6 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 1,
            config: { title: "🚀 Welcome to Multi-Section Viewer" },
          },
          {
            id: "hero-text",
            canvasId: "hero-section",
            type: "text",
            name: "Hero Description",
            layouts: {
              desktop: { x: 5, y: 9, width: 40, height: 6 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 2,
            config: {
              text: "This hero section is the first canvas in a multi-section layout.",
            },
          },
        ],
      },
      "features-section": {
        items: [
          {
            id: "features-header",
            canvasId: "features-section",
            type: "header",
            name: "Features Header",
            layouts: {
              desktop: { x: 0, y: 0, width: 50, height: 4 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 1,
            config: { title: "✨ Key Features" },
          },
          {
            id: "feature-1",
            canvasId: "features-section",
            type: "text",
            name: "Feature 1",
            layouts: {
              desktop: { x: 0, y: 5, width: 15, height: 8 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 2,
            config: {
              text: "📦 Lightweight bundle - Only 30KB for viewer vs 150KB for builder",
            },
          },
          {
            id: "feature-2",
            canvasId: "features-section",
            type: "text",
            name: "Feature 2",
            layouts: {
              desktop: { x: 17, y: 5, width: 15, height: 8 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 3,
            config: {
              text: "📱 Responsive layouts - Auto-switch between desktop and mobile viewports",
            },
          },
          {
            id: "feature-3",
            canvasId: "features-section",
            type: "text",
            name: "Feature 3",
            layouts: {
              desktop: { x: 34, y: 5, width: 15, height: 8 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 4,
            config: {
              text: "🎨 Custom styling - Per-section background colors and theme support",
            },
          },
        ],
      },
      "cta-section": {
        items: [
          {
            id: "cta-text",
            canvasId: "cta-section",
            type: "text",
            name: "CTA Text",
            layouts: {
              desktop: { x: 10, y: 2, width: 20, height: 4 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 1,
            config: { text: "Ready to get started?" },
          },
          {
            id: "cta-button",
            canvasId: "cta-section",
            type: "button",
            name: "CTA Button",
            layouts: {
              desktop: { x: 32, y: 2, width: 12, height: 4 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
            zIndex: 2,
            config: { label: "Try It Now" },
          },
        ],
      },
    },
    viewport: "desktop",
    metadata: {
      name: "Multi-Section Landing Page",
      description: "Demo of multiple canvas sections",
      createdAt: new Date().toISOString(),
    },
  };

  // Canvas metadata with background colors
  const canvasMetadata = {
    "hero-section": {
      backgroundColor: "#e0f2fe", // Light blue
    },
    "features-section": {
      backgroundColor: "#f0fdf4", // Light green
    },
    "cta-section": {
      backgroundColor: "#fef3c7", // Light yellow
    },
  };

  const viewerEl = document.createElement("grid-viewer");
  viewerEl.components = sharedComponents;
  viewerEl.initialState = multiSectionLayout;
  viewerEl.canvasMetadata = canvasMetadata;
  viewerEl.config = {
    enableVirtualRendering: false, // Disable for Storybook iframe compatibility
  };

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;"
    >
      <h2 style="margin-top: 0; color: #333;">Multiple Sections Demo</h2>
      <p style="color: #666; margin-bottom: 20px;">
        Grid-viewer can render multiple canvas sections vertically, each with
        its own background color.
        <br />
        This is perfect for creating landing pages with hero, features,
        testimonials, and CTA sections.
      </p>

      <div
        style="width: 100%; border: 2px solid #17a2b8; border-radius: 8px; overflow: hidden;"
      >
        ${viewerEl}
      </div>

      <div
        style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;"
      >
        <h4 style="margin-top: 0; color: #17a2b8;">📐 Section Structure</h4>
        <ul style="margin-bottom: 0; padding-left: 20px; line-height: 1.8;">
          <li>
            <strong>Hero Section</strong> (light blue): Welcome header +
            description
          </li>
          <li>
            <strong>Features Section</strong> (light green): 3 feature cards in
            a row
          </li>
          <li>
            <strong>CTA Section</strong> (light yellow): Call-to-action text +
            button
          </li>
        </ul>
      </div>
    </div>
  `;
};
