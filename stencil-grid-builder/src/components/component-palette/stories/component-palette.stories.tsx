import { html } from "lit-html";
import { reset } from "../../../services/state-manager";

export default {
  title: "Components/Component Palette",
};

// Sample component definitions for the story
// Using document.createElement() - returns real DOM elements
const sampleComponents = [
  {
    type: "header",
    name: "Header",
    icon: "📄",
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 20, height: 3 },
    render: () => {
      const div = document.createElement("div");
      div.style.cssText =
        "padding: 12px; background: #f0f0f0; border-radius: 4px; height: 100%;";
      const h3 = document.createElement("h3");
      h3.style.cssText = "margin: 0; font-size: 16px;";
      h3.textContent = "Header Component";
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
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    render: () => {
      const div = document.createElement("div");
      div.style.cssText =
        "padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px; height: 100%;";
      const p = document.createElement("p");
      p.style.cssText = "margin: 0; font-size: 13px; line-height: 1.4;";
      p.textContent = "Text Component";
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
    defaultSize: { width: 15, height: 5 },
    minSize: { width: 10, height: 3 },
    render: () => {
      const button = document.createElement("button");
      button.style.cssText =
        "padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%; height: 100%;";
      button.textContent = "Button Component";
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

export const BasicPalette = (args) => {
  // Reset state to clear any cached data from previous stories
  reset();

  // Create element and set props
  const paletteEl = document.createElement("component-palette");
  paletteEl.components = sampleComponents;

  return html`
    <div
      style="padding: ${args.padding}; height: ${args.height}; background: ${args.backgroundColor};"
    >
      ${paletteEl}
    </div>
  `;
};

BasicPalette.args = {
  padding: "20px",
  height: "500px",
  backgroundColor: "transparent",
};

BasicPalette.argTypes = {
  padding: {
    control: "text",
    description: "Container padding",
    table: {
      category: "Container",
      defaultValue: { summary: "20px" },
    },
  },
  height: {
    control: "text",
    description: "Container height",
    table: {
      category: "Container",
      defaultValue: { summary: "500px" },
    },
  },
  backgroundColor: {
    control: "color",
    description: "Container background color",
    table: {
      category: "Container",
      defaultValue: { summary: "transparent" },
    },
  },
};

export const WithCustomComponents = () => {
  // Reset state to clear any cached data from previous stories
  reset();

  // Marketing Components Palette - Vibrant gradient theme
  const marketingComponents = [
    {
      type: "hero-gradient",
      name: "Hero Banner",
      icon: "🚀",
      defaultSize: { width: 50, height: 15 },
      selectionColor: "#8b5cf6", // Bright purple to complement gradient
      render: () => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
        `;
        div.textContent = "🚀 Hero Banner";
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "🚀 Hero Banner";
        return div;
      },
      renderPaletteItem: ({ icon, name }) => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          transition: all 0.2s;
        `;
        div.innerHTML = `
          <span style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${icon}</span>
          <span>${name}</span>
        `;
        return div;
      },
    },
    {
      type: "cta-gradient",
      name: "Call to Action",
      icon: "💎",
      defaultSize: { width: 25, height: 8 },
      selectionColor: "#ec4899", // Hot pink to match gradient
      render: () => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 16px;
          border-radius: 8px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
        `;
        div.textContent = "💎 Get Started Now";
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "💎 Call to Action";
        return div;
      },
      renderPaletteItem: ({ icon, name }) => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
          transition: all 0.2s;
        `;
        div.innerHTML = `
          <span style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${icon}</span>
          <span>${name}</span>
        `;
        return div;
      },
    },
    {
      type: "testimonial",
      name: "Testimonial",
      icon: "💬",
      defaultSize: { width: 20, height: 10 },
      selectionColor: "#ff6b6b", // Bright red to match border accent
      render: () => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          padding: 16px;
          border-radius: 8px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          border-left: 4px solid #ff6b6b;
        `;
        div.innerHTML = `
          <div style="font-style: italic; color: #333; margin-bottom: 8px;">
            "Amazing product!"
          </div>
          <div style="font-size: 12px; color: #666;">
            💬 Customer Review
          </div>
        `;
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "💬 Testimonial";
        return div;
      },
      renderPaletteItem: ({ icon, name }) => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          color: #8b4513;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(255, 182, 159, 0.3);
          border-left: 4px solid #ff6b6b;
          transition: all 0.2s;
        `;
        div.innerHTML = `
          <span style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${icon}</span>
          <span>${name}</span>
        `;
        return div;
      },
    },
    {
      type: "pricing-card",
      name: "Pricing Card",
      icon: "💰",
      defaultSize: { width: 15, height: 12 },
      selectionColor: "#00d2ff", // Bright cyan to match border
      render: () => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          padding: 16px;
          border-radius: 12px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          border: 2px solid #00d2ff;
          text-align: center;
        `;
        div.innerHTML = `
          <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 8px;">
            $49
          </div>
          <div style="font-size: 12px; color: #666;">
            💰 per month
          </div>
        `;
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "💰 Pricing Card";
        return div;
      },
      renderPaletteItem: ({ icon, name }) => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          color: #0077aa;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(0, 210, 255, 0.3);
          border: 2px solid #00d2ff;
          transition: all 0.2s;
        `;
        div.innerHTML = `
          <span style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${icon}</span>
          <span>${name}</span>
        `;
        return div;
      },
    },
  ];

  // E-commerce Components Palette - Bold color theme
  const ecommerceComponents = [
    {
      type: "product-showcase",
      name: "Product Showcase",
      icon: "🛍️",
      defaultSize: { width: 30, height: 14 },
      selectionColor: "#bc78ec", // Bright magenta from gradient
      render: () => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #3b2667 0%, #bc78ec 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
        `;
        div.textContent = "🛍️ Featured Products";
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "🛍️ Product Showcase";
        return div;
      },
      renderPaletteItem: ({ icon, name }) => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #3b2667 0%, #bc78ec 100%);
          color: white;
          padding: 14px 18px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(59, 38, 103, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.2s;
        `;
        div.innerHTML = `
          <span style="font-size: 20px;">${icon}</span>
          <span>${name}</span>
        `;
        return div;
      },
    },
    {
      type: "cart-widget",
      name: "Shopping Cart",
      icon: "🛒",
      defaultSize: { width: 18, height: 8 },
      selectionColor: "#fbbf24", // Bright yellow from gradient
      render: () => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          padding: 16px;
          border-radius: 8px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 600;
          color: #333;
        `;
        div.innerHTML = `
          <span>🛒 Cart</span>
          <span style="background: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">3 items</span>
        `;
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "🛒 Shopping Cart";
        return div;
      },
      renderPaletteItem: ({ icon, name }) => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: #aa3355;
          padding: 14px 18px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(250, 112, 154, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 2px solid rgba(255, 255, 255, 0.5);
          transition: all 0.2s;
        `;
        div.innerHTML = `
          <span style="font-size: 20px;">${icon}</span>
          <span>${name}</span>
        `;
        return div;
      },
    },
    {
      type: "promo-banner",
      name: "Promo Banner",
      icon: "🎁",
      defaultSize: { width: 50, height: 6 },
      selectionColor: "#6bcf7f", // Bright green from rainbow gradient
      render: () => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(90deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%);
          color: white;
          padding: 12px;
          border-radius: 4px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        div.textContent = "🎁 50% OFF - Limited Time Offer!";
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "🎁 Promo Banner";
        return div;
      },
      renderPaletteItem: ({ icon, name }) => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(90deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%);
          color: white;
          padding: 14px 18px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
          transition: all 0.2s;
        `;
        div.innerHTML = `
          <span style="font-size: 20px;">${icon}</span>
          <span>${name}</span>
        `;
        return div;
      },
    },
    {
      type: "newsletter",
      name: "Newsletter",
      icon: "📧",
      defaultSize: { width: 25, height: 10 },
      selectionColor: "#667eea", // Electric blue from gradient
      render: () => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 8px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        `;
        div.innerHTML = `
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
            📧 Subscribe to Newsletter
          </div>
          <div style="font-size: 12px; opacity: 0.9;">
            Get the latest deals and updates
          </div>
        `;
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "📧 Newsletter";
        return div;
      },
      renderPaletteItem: ({ icon, name }) => {
        const div = document.createElement("div");
        div.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 18px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s;
        `;
        div.innerHTML = `
          <span style="font-size: 20px;">${icon}</span>
          <span>${name}</span>
        `;
        return div;
      },
    },
  ];

  // Combine all components for the grid-builder
  const allComponents = [...marketingComponents, ...ecommerceComponents];

  // Create palettes
  const marketingPalette = document.createElement("component-palette");
  marketingPalette.components = marketingComponents;
  marketingPalette.showHeader = false;

  const ecommercePalette = document.createElement("component-palette");
  ecommercePalette.components = ecommerceComponents;
  ecommercePalette.showHeader = false;

  // Create grid-builder with all components
  const gridBuilder = document.createElement("grid-builder");
  gridBuilder.components = allComponents;
  gridBuilder.config = {
    enableVirtualRendering: false,
    snapToGrid: true,
    showGridLines: true,
  };

  // Initialize with a demo canvas
  setTimeout(() => {
    if ((window as any).gridBuilderAPI) {
      (window as any).gridBuilderAPI.addCanvas("withcustom-canvas");
    }
  }, 100);

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; background: #f0f2f5; height: 100vh; display: flex; flex-direction: column;"
    >
      <div
        style="padding: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      >
        <h2 style="margin: 0 0 10px 0; color: #333;">
          Custom Component Palettes & Selection Colors
        </h2>
        <p style="color: #666; margin: 0;">
          Drag components from the themed palettes to see their
          <strong>custom selection colors</strong> in action!
        </p>
      </div>

      <div style="display: flex; flex: 1; overflow: hidden;">
        <!-- Left: Themed Palettes -->
        <div
          style="width: 320px; background: white; overflow-y: auto; border-right: 1px solid #ddd; display: flex; flex-direction: column; gap: 20px; padding: 20px;"
        >
          <!-- Marketing Components -->
          <div>
            <div
              style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 16px; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px; margin-bottom: -10px;"
            >
              🎨 Marketing Components
            </div>
            <div
              style="background: #f9f9f9; border-radius: 0 0 8px 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"
            >
              ${marketingPalette}
            </div>
          </div>

          <!-- E-commerce Components -->
          <div>
            <div
              style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 12px 16px; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px; margin-bottom: -10px;"
            >
              🛍️ E-commerce Components
            </div>
            <div
              style="background: #f9f9f9; border-radius: 0 0 8px 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"
            >
              ${ecommercePalette}
            </div>
          </div>

          <!-- Instructions -->
          <div
            style="padding: 16px; background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 8px; border-left: 4px solid #0ea5e9;"
          >
            <h4 style="margin: 0 0 8px 0; color: #0369a1; font-size: 13px;">
              💡 Try This:
            </h4>
            <ol
              style="margin: 0; padding-left: 20px; color: #075985; font-size: 12px; line-height: 1.6;"
            >
              <li>Drag components to the canvas</li>
              <li>
                Click on components to see their
                <strong>custom selection colors</strong>
              </li>
              <li>
                Each component has a unique selection color matching its theme!
              </li>
            </ol>
          </div>
        </div>

        <!-- Right: Grid Builder Canvas -->
        <div style="flex: 1; overflow: auto;">${gridBuilder}</div>
      </div>
    </div>
  `;
};

WithCustomComponents.args = {
  padding: "20px",
  height: "500px",
  backgroundColor: "#f8f9fa",
};

WithCustomComponents.argTypes = {
  padding: {
    control: "text",
    description: "Container padding",
    table: {
      category: "Container",
      defaultValue: { summary: "20px" },
    },
  },
  height: {
    control: "text",
    description: "Container height",
    table: {
      category: "Container",
      defaultValue: { summary: "500px" },
    },
  },
  backgroundColor: {
    control: "color",
    description: "Container background color",
    table: {
      category: "Container",
      defaultValue: { summary: "#f8f9fa" },
    },
  },
};

/**
 * Click-to-Add Demo
 * ==================
 *
 * Demonstrates the click-to-add feature as an alternative to drag-and-drop.
 * Shows visual feedback (pulse, ghost outline, fade-in) and keyboard support.
 */
export const ClickToAddDemo = () => {
  // Reset state to clear any cached data from previous stories
  reset();

  const components = sampleComponents;

  // Create component palette with click-to-add enabled
  const palette = document.createElement("component-palette");
  palette.components = components;
  palette.showHeader = false;
  palette.config = {
    enableClickToAdd: true, // Enable click-to-add
  };

  // Create grid-builder with click-to-add enabled
  const gridBuilder = document.createElement("grid-builder");
  gridBuilder.components = components;
  gridBuilder.config = {
    enableClickToAdd: true, // Enable click-to-add
    enableVirtualRendering: false,
    snapToGrid: true,
    showGridLines: true,
  };

  // Initialize with empty canvas
  setTimeout(() => {
    if ((window as any).gridBuilderAPI) {
      (window as any).gridBuilderAPI.addCanvas("clicktoadd-canvas");
    }
  }, 100);

  // Create status display
  const statusDiv = document.createElement("div");
  statusDiv.style.cssText = `
    padding: 15px;
    background: #e7f3ff;
    border-radius: 4px;
    margin: 20px 0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  `;
  statusDiv.innerHTML = `
    <strong style="color: #007bff;">Click-to-Add Enabled</strong><br/>
    Click any palette item to add it to the active canvas with smart positioning!
  `;

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; background: #f0f2f5; height: 100vh; display: flex; flex-direction: column;"
    >
      <div
        style="padding: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      >
        <h2 style="margin: 0 0 10px 0; color: #333;">
          Click-to-Add Feature Demo
        </h2>
        <p style="color: #666; margin: 0;">
          <strong>New feature!</strong> Click palette items to add them
          instantly with smart collision detection and visual feedback.
        </p>
        ${statusDiv}
      </div>

      <div style="display: flex; flex: 1; overflow: hidden;">
        <!-- Left: Component Palette -->
        <div
          style="width: 280px; background: white; overflow-y: auto; border-right: 1px solid #ddd; padding: 16px;"
        >
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">
            Components
          </h3>
          ${palette}
        </div>

        <!-- Right: Grid Builder -->
        <div style="flex: 1; overflow: auto;">${gridBuilder}</div>
      </div>

      <div
        style="padding: 20px; background: white; border-top: 1px solid #ddd;"
      >
        <h4 style="margin: 0 0 10px 0; color: #28a745;">
          ✨ Features Demonstrated
        </h4>
        <ul
          style="margin: 0; padding-left: 20px; line-height: 1.8; color: #666;"
        >
          <li>
            <strong>Click to Add:</strong> Simply click a palette item (no
            dragging needed)
          </li>
          <li>
            <strong>Smart Positioning:</strong> Automatic collision detection
            finds free space
          </li>
          <li>
            <strong>Visual Feedback:</strong> Canvas pulse + ghost outline +
            fade-in animation
          </li>
          <li>
            <strong>Keyboard Support:</strong> Tab to palette items, press
            Enter/Space to add
          </li>
          <li>
            <strong>Centering:</strong> First item centers horizontally for
            better layout
          </li>
        </ul>
      </div>
    </div>
  `;
};

/**
 * Multi-Palette with Unique Labels
 * =================================
 *
 * Demonstrates multiple component-palette instances with unique paletteLabel props.
 * Shows how screen readers announce distinct labels and prevents ID conflicts.
 */
export const MultiPaletteWithUniqueLabels = () => {
  // Reset state to clear any cached data from previous stories
  reset();

  // Content components
  const contentComponents = [
    {
      type: "header",
      name: "Header",
      icon: "📄",
      defaultSize: { width: 30, height: 4 },
      render: () => {
        const div = document.createElement("div");
        div.style.cssText =
          "padding: 12px; background: #e3f2fd; border-radius: 4px; height: 100%;";
        const h3 = document.createElement("h3");
        h3.style.cssText = "margin: 0; font-size: 16px; color: #1976d2;";
        h3.textContent = "Header";
        div.appendChild(h3);
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "📄 Header";
        return div;
      },
    },
    {
      type: "text",
      name: "Text Block",
      icon: "📝",
      defaultSize: { width: 20, height: 6 },
      render: () => {
        const div = document.createElement("div");
        div.style.cssText =
          "padding: 10px; background: #f3e5f5; border-radius: 4px; height: 100%;";
        const p = document.createElement("p");
        p.style.cssText = "margin: 0; font-size: 13px; color: #7b1fa2;";
        p.textContent = "Text Content";
        div.appendChild(p);
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "📝 Text";
        return div;
      },
    },
  ];

  // Media components
  const mediaComponents = [
    {
      type: "image",
      name: "Image",
      icon: "🖼️",
      defaultSize: { width: 15, height: 12 },
      render: () => {
        const div = document.createElement("div");
        div.style.cssText =
          "padding: 10px; background: #e8f5e9; border-radius: 4px; height: 100%; display: flex; align-items: center; justify-content: center;";
        div.textContent = "🖼️ Image";
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "🖼️ Image";
        return div;
      },
    },
    {
      type: "video",
      name: "Video",
      icon: "🎥",
      defaultSize: { width: 20, height: 15 },
      render: () => {
        const div = document.createElement("div");
        div.style.cssText =
          "padding: 10px; background: #fff3e0; border-radius: 4px; height: 100%; display: flex; align-items: center; justify-content: center;";
        div.textContent = "🎥 Video";
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "🎥 Video";
        return div;
      },
    },
  ];

  // Interactive components
  const interactiveComponents = [
    {
      type: "button",
      name: "Button",
      icon: "🔘",
      defaultSize: { width: 12, height: 4 },
      render: () => {
        const button = document.createElement("button");
        button.style.cssText =
          "padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; width: 100%; height: 100%;";
        button.textContent = "Button";
        return button;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "🔘 Button";
        return div;
      },
    },
    {
      type: "form",
      name: "Form",
      icon: "📋",
      defaultSize: { width: 25, height: 20 },
      render: () => {
        const div = document.createElement("div");
        div.style.cssText =
          "padding: 12px; background: #fce4ec; border-radius: 4px; height: 100%;";
        div.textContent = "📋 Form";
        return div;
      },
      renderDragClone: () => {
        const div = document.createElement("div");
        div.textContent = "📋 Form";
        return div;
      },
    },
  ];

  // Shared config for palettes (enables click-to-add)
  const paletteConfig = {
    enableClickToAdd: true,
  };

  // Create palettes with unique labels
  const contentPalette = document.createElement("component-palette");
  contentPalette.components = contentComponents;
  contentPalette.paletteLabel = "Content components"; // Unique label
  contentPalette.showHeader = false;
  contentPalette.config = paletteConfig;

  const mediaPalette = document.createElement("component-palette");
  mediaPalette.components = mediaComponents;
  mediaPalette.paletteLabel = "Media components"; // Unique label
  mediaPalette.showHeader = false;
  mediaPalette.config = paletteConfig;

  const interactivePalette = document.createElement("component-palette");
  interactivePalette.components = interactiveComponents;
  interactivePalette.paletteLabel = "Interactive components"; // Unique label
  interactivePalette.showHeader = false;
  interactivePalette.config = paletteConfig;

  // Create grid-builder with all components
  const allComponents = [
    ...contentComponents,
    ...mediaComponents,
    ...interactiveComponents,
  ];
  const gridBuilder = document.createElement("grid-builder");
  gridBuilder.components = allComponents;
  gridBuilder.config = {
    enableVirtualRendering: false,
    enableClickToAdd: true,
  };

  setTimeout(() => {
    if ((window as any).gridBuilderAPI) {
      (window as any).gridBuilderAPI.addCanvas("multipalette-canvas");
    }
  }, 100);

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; background: #f0f2f5; height: 100vh; display: flex; flex-direction: column;"
    >
      <div
        style="padding: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      >
        <h2 style="margin: 0 0 10px 0; color: #333;">
          Multi-Palette ARIA Accessibility
        </h2>
        <p style="color: #666; margin: 0;">
          Multiple palettes with unique <code>paletteLabel</code> props prevent
          ID conflicts and improve screen reader navigation.
        </p>
      </div>

      <div style="display: flex; flex: 1; overflow: hidden;">
        <!-- Left: Categorized Palettes -->
        <div
          style="width: 280px; background: white; overflow-y: auto; border-right: 1px solid #ddd; display: flex; flex-direction: column; gap: 16px; padding: 16px;"
        >
          <!-- Content Components -->
          <div>
            <div
              style="background: #1976d2; color: white; padding: 10px 12px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 13px;"
            >
              📄 Content
            </div>
            <div
              style="background: #f9f9f9; border-radius: 0 0 6px 6px; overflow: hidden;"
            >
              ${contentPalette}
            </div>
          </div>

          <!-- Media Components -->
          <div>
            <div
              style="background: #388e3c; color: white; padding: 10px 12px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 13px;"
            >
              🎨 Media
            </div>
            <div
              style="background: #f9f9f9; border-radius: 0 0 6px 6px; overflow: hidden;"
            >
              ${mediaPalette}
            </div>
          </div>

          <!-- Interactive Components -->
          <div>
            <div
              style="background: #d32f2f; color: white; padding: 10px 12px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 13px;"
            >
              ⚡ Interactive
            </div>
            <div
              style="background: #f9f9f9; border-radius: 0 0 6px 6px; overflow: hidden;"
            >
              ${interactivePalette}
            </div>
          </div>

          <!-- ARIA Info -->
          <div
            style="padding: 12px; background: #e1f5fe; border-radius: 6px; border-left: 3px solid #0288d1;"
          >
            <h4 style="margin: 0 0 8px 0; color: #01579b; font-size: 12px;">
              ♿ ARIA Features
            </h4>
            <ul
              style="margin: 0; padding-left: 16px; color: #01579b; font-size: 11px; line-height: 1.6;"
            >
              <li>
                <strong>Unique IDs:</strong> Each palette has unique
                aria-describedby IDs
              </li>
              <li>
                <strong>Screen Reader Labels:</strong> Palettes announced as
                "Content components, toolbar"
              </li>
              <li>
                <strong>No Conflicts:</strong> Multiple palettes on same page
                work correctly
              </li>
            </ul>
          </div>
        </div>

        <!-- Right: Grid Builder -->
        <div style="flex: 1; overflow: auto;">${gridBuilder}</div>
      </div>
    </div>
  `;
};

/**
 * Keyboard Accessibility Demo
 * ============================
 *
 * Demonstrates full keyboard navigation and screen reader support.
 * Shows Tab navigation, Enter/Space activation, and ARIA attributes.
 */
export const KeyboardAccessibilityDemo = () => {
  // Reset state to clear any cached data from previous stories
  reset();

  const components = sampleComponents;

  // Create component palette with click-to-add enabled
  const palette = document.createElement("component-palette");
  palette.components = components;
  palette.showHeader = false;
  palette.config = {
    enableClickToAdd: true,
  };

  // Create grid-builder with keyboard-friendly config
  const gridBuilder = document.createElement("grid-builder");
  gridBuilder.components = components;
  gridBuilder.config = {
    enableClickToAdd: true, // Required for keyboard activation
    enableVirtualRendering: false,
    snapToGrid: true,
  };

  setTimeout(() => {
    if ((window as any).gridBuilderAPI) {
      (window as any).gridBuilderAPI.addCanvas("keyboard-canvas");
    }
  }, 100);

  // Create keyboard instruction panel
  const instructionsDiv = document.createElement("div");
  instructionsDiv.style.cssText = `
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 20px 0;
  `;
  instructionsDiv.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">⌨️ Keyboard Navigation Instructions</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h4 style="margin: 0 0 10px 0; color: #007bff; font-size: 14px;">Basic Navigation</h4>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 13px;">
          <li><kbd style="background: white; padding: 2px 6px; border: 1px solid #ccc; border-radius: 3px;">Tab</kbd> - Navigate between palette items</li>
          <li><kbd style="background: white; padding: 2px 6px; border: 1px solid #ccc; border-radius: 3px;">Shift+Tab</kbd> - Navigate backwards</li>
          <li><kbd style="background: white; padding: 2px 6px; border: 1px solid #ccc; border-radius: 3px;">Enter</kbd> or <kbd style="background: white; padding: 2px 6px; border: 1px solid #ccc; border-radius: 3px;">Space</kbd> - Add component to canvas</li>
        </ul>
      </div>
      <div>
        <h4 style="margin: 0 0 10px 0; color: #28a745; font-size: 14px;">Screen Reader Support</h4>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 13px;">
          <li><strong>aria-label:</strong> "Component name. Click to add to active canvas or drag to position"</li>
          <li><strong>aria-describedby:</strong> Additional context for each item</li>
          <li><strong>role="button":</strong> Announces as interactive button</li>
          <li><strong>role="toolbar":</strong> Palette announced as toolbar</li>
        </ul>
      </div>
    </div>
  `;

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;"
    >
      <h2 style="margin: 0 0 10px 0; color: #333;">
        Keyboard Accessibility & Screen Reader Support
      </h2>
      <p style="color: #666; margin: 0 0 20px 0;">
        Comprehensive keyboard navigation makes the component palette fully
        accessible without a mouse.
        <br />
        <strong>Try it:</strong> Click in the palette area, then use Tab/Enter
        to navigate and add components!
      </p>

      ${instructionsDiv}

      <div style="display: flex; gap: 20px;">
        <!-- Left: Component Palette -->
        <div
          style="width: 280px; background: white; border: 2px solid #007bff; border-radius: 8px; padding: 16px;"
        >
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">
            Components
          </h3>
          ${palette}
        </div>

        <!-- Right: Grid Builder -->
        <div
          style="flex: 1; border: 2px solid #007bff; border-radius: 8px; overflow: hidden;"
        >
          ${gridBuilder}
        </div>
      </div>

      <div
        style="margin-top: 20px; padding: 20px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;"
      >
        <h4 style="margin: 0 0 10px 0; color: #155724;">
          ✅ WCAG 2.1 Compliance
        </h4>
        <ul
          style="margin: 0; padding-left: 20px; line-height: 1.8; color: #155724;"
        >
          <li>
            <strong>2.1.1 Keyboard (Level A):</strong> All functionality
            available via keyboard
          </li>
          <li>
            <strong>2.1.3 Keyboard (No Exception) (Level AAA):</strong> No
            keyboard traps
          </li>
          <li>
            <strong>4.1.2 Name, Role, Value (Level A):</strong> All elements
            have proper ARIA attributes
          </li>
          <li>
            <strong>4.1.3 Status Messages (Level AA):</strong> Screen reader
            announcements for state changes
          </li>
        </ul>
      </div>

      <div
        style="margin-top: 20px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;"
      >
        <h4 style="margin: 0 0 10px 0; color: #856404;">
          💡 Testing with Screen Readers
        </h4>
        <ul
          style="margin: 0; padding-left: 20px; line-height: 1.8; color: #856404;"
        >
          <li>
            <strong>NVDA (Windows):</strong> Free, open-source screen reader
          </li>
          <li><strong>JAWS (Windows):</strong> Professional screen reader</li>
          <li>
            <strong>VoiceOver (macOS):</strong> Built-in, press Cmd+F5 to enable
          </li>
          <li>
            <strong>TalkBack (Android):</strong> Built-in mobile screen reader
          </li>
        </ul>
      </div>
    </div>
  `;
};

/**
 * Drag-Only Mode (Click-to-Add Disabled)
 * =======================================
 *
 * Demonstrates the palette when click-to-add is disabled (drag-only mode).
 * Shows how ARIA descriptions automatically adapt to available interaction methods.
 */
export const DragOnlyMode = () => {
  // Reset state to clear any cached data from previous stories
  reset();

  const components = sampleComponents;

  // Create component palette with click-to-add DISABLED
  const palette = document.createElement("component-palette");
  palette.components = components;
  palette.showHeader = false;
  palette.config = {
    enableClickToAdd: false, // Disable click-to-add (drag-only)
  };

  // Create grid-builder with click-to-add DISABLED
  const gridBuilder = document.createElement("grid-builder");
  gridBuilder.components = components;
  gridBuilder.config = {
    enableClickToAdd: false, // Disable click-to-add
    enableVirtualRendering: false,
    snapToGrid: true,
    showGridLines: true,
  };

  // Initialize with empty canvas
  setTimeout(() => {
    if ((window as any).gridBuilderAPI) {
      (window as any).gridBuilderAPI.addCanvas("dragonly-canvas");
    }
  }, 100);

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; background: #f0f2f5; height: 100vh; display: flex; flex-direction: column;"
    >
      <div
        style="padding: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      >
        <h2 style="margin: 0 0 10px 0; color: #333;">
          Drag-Only Mode (Click-to-Add Disabled)
        </h2>
        <p style="color: #666; margin: 0;">
          When <code>enableClickToAdd: false</code>, the palette switches to
          drag-only mode and ARIA descriptions automatically update to reflect
          this.
        </p>
      </div>

      <div style="display: flex; flex: 1; overflow: hidden;">
        <!-- Left: Component Palette (Drag-Only) -->
        <div
          style="width: 280px; background: white; overflow-y: auto; border-right: 1px solid #ddd; padding: 16px;"
        >
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">
            Components (Drag Only)
          </h3>
          ${palette}
        </div>

        <!-- Right: Grid Builder -->
        <div style="flex: 1; overflow: auto;">${gridBuilder}</div>
      </div>

      <div
        style="padding: 20px; background: white; border-top: 1px solid #ddd;"
      >
        <h4 style="margin: 0 0 10px 0; color: #dc3545;">
          🚫 Click-to-Add Disabled
        </h4>
        <ul
          style="margin: 0 0 20px 0; padding-left: 20px; line-height: 1.8; color: #666;"
        >
          <li>
            <strong>Drag Required:</strong> Components must be dragged to canvas
            (clicking has no effect)
          </li>
          <li>
            <strong>ARIA Updated:</strong> Screen reader text changes to "Drag
            component to canvas to add"
          </li>
          <li>
            <strong>Keyboard Support:</strong> Enter/Space keys do not add
            components (drag-only)
          </li>
        </ul>

        <h4 style="margin: 0 0 10px 0; color: #28a745;">
          ♿ Adaptive ARIA Descriptions
        </h4>
        <div
          style="background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px;"
        >
          <div style="margin-bottom: 10px;">
            <strong>When enableClickToAdd: true (default):</strong>
            <div style="color: #28a745; margin-top: 5px;">
              "Click or press Enter/Space to add component to active canvas, or
              drag to position on any canvas"
            </div>
          </div>
          <div>
            <strong>When enableClickToAdd: false:</strong>
            <div style="color: #dc3545; margin-top: 5px;">
              "Drag component to canvas to add"
            </div>
          </div>
        </div>

        <div
          style="margin-top: 15px; padding: 15px; background: #e7f3ff; border-radius: 4px; border-left: 4px solid #007bff;"
        >
          <strong style="color: #004085;">💡 Accessibility Tip:</strong>
          <p style="margin: 5px 0 0 0; color: #004085; line-height: 1.6;">
            The component automatically updates aria-describedby text based on
            available interaction methods. This ensures screen reader users
            always receive accurate instructions about how to interact with
            palette items.
          </p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Multi-Canvas Click-to-Add
 * ==========================
 *
 * Demonstrates how click-to-add works with multiple canvases.
 * Components are added to the **active canvas** (highlighted with blue border).
 */
export const MultiCanvasClickToAdd = () => {
  // Reset state to clear any cached data from previous stories
  reset();

  const components = sampleComponents;

  // Create component palette with click-to-add enabled
  const palette = document.createElement("component-palette");
  palette.components = components;
  palette.showHeader = false;
  palette.config = {
    enableClickToAdd: true,
  };

  // Create grid-builder with click-to-add enabled
  const gridBuilder = document.createElement("grid-builder");
  gridBuilder.components = components;
  gridBuilder.config = {
    enableClickToAdd: true,
    enableVirtualRendering: false,
    snapToGrid: true,
    showGridLines: true,
  };

  // Initialize with THREE canvases to demonstrate section-level click-to-add
  setTimeout(() => {
    if ((window as any).gridBuilderAPI) {
      (window as any).gridBuilderAPI.addCanvas("hero-section");
      (window as any).gridBuilderAPI.addCanvas("content-section");
      (window as any).gridBuilderAPI.addCanvas("footer-section");
    }
  }, 100);

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; background: #f0f2f5; height: 100vh; display: flex; flex-direction: column;"
    >
      <div
        style="padding: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      >
        <h2 style="margin: 0 0 10px 0; color: #333;">
          Multi-Canvas Click-to-Add
        </h2>
        <p style="color: #666; margin: 0 0 10px 0;">
          This story demonstrates click-to-add with <strong>multiple canvas sections</strong> (Hero, Content, Footer).
          Click-to-add is <strong>canvas-aware</strong> - components are added to the <strong>active canvas</strong> (highlighted with blue border).
        </p>
        <div style="padding: 12px; background: #e7f3ff; border-radius: 4px; border-left: 4px solid #007bff;">
          <strong style="color: #004085;">💡 How it works:</strong>
          <span style="color: #004085; font-size: 14px;">
            Click any canvas section below to activate it, then click a palette item to add it to that section. Scroll down to see all three sections.
          </span>
        </div>
      </div>

      <div style="display: flex; flex: 1; overflow: hidden;">
        <!-- Left: Component Palette -->
        <div
          style="width: 280px; background: white; overflow-y: auto; border-right: 1px solid #ddd; padding: 16px;"
        >
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">
            Components
          </h3>
          ${palette}
        </div>

        <!-- Right: Grid Builder with Multiple Canvases -->
        <div style="flex: 1; overflow-y: auto;">${gridBuilder}</div>
      </div>

      <div
        style="padding: 12px 20px; background: white; border-top: 1px solid #ddd;"
      >
        <div style="display: flex; gap: 30px; align-items: center; margin-bottom: 8px;">
          <div style="color: #666; font-size: 13px;">
            <strong style="color: #007bff;">🎯 Try it:</strong> Click a canvas to activate it (blue border), then click palette items to add components
          </div>
          <div style="color: #666; font-size: 13px;">
            <strong style="color: #28a745;">💡 Tip:</strong> Click = smart position | Drag = exact position
          </div>
        </div>
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; color: #007bff; font-size: 12px; user-select: none;">
            📖 Show detailed instructions
          </summary>
          <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; font-size: 13px; line-height: 1.6;">
            <div style="margin-bottom: 12px;">
              <strong style="color: #333;">Active Canvas Selection:</strong>
              <ul style="margin: 4px 0 0 20px; color: #666;">
                <li>Click a canvas to make it active (blue border appears)</li>
                <li>Click a component to activate its canvas</li>
                <li>Click palette item to add to active canvas</li>
              </ul>
            </div>
            <div>
              <strong style="color: #333;">Try This:</strong>
              <ol style="margin: 4px 0 0 20px; color: #666;">
                <li>Click the "Hero Section" canvas</li>
                <li>Click a palette item (e.g., "Header")</li>
                <li>Notice it appears in Hero Section</li>
                <li>Click the "Footer Section" canvas</li>
                <li>Click another palette item</li>
                <li>Notice it appears in Footer (not Hero)</li>
              </ol>
            </div>
          </div>
        </details>
      </div>
    </div>
  `;
};

/**
 * Component Sizing Best Practices
 * ================================
 *
 * Demonstrates the correct way to size components so that resize handles
 * align perfectly with visual edges.
 */
export const ComponentSizingBestPractices = () => {
  // Reset state to clear any cached data from previous stories
  reset();

  // ✅ CORRECT: Component with padding and proper box-sizing
  const componentWithPadding = {
    type: "with-padding",
    name: "With Padding ✅",
    icon: "📦",
    defaultSize: { width: 20, height: 10 },
    render: () => {
      const div = document.createElement("div");
      div.style.cssText = `
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      `;
      div.textContent = "Padding + box-sizing ✅";
      return div;
    },
    renderDragClone: () => {
      const div = document.createElement("div");
      div.textContent = "📦 With Padding";
      return div;
    },
  };

  // ✅ CORRECT: Component without padding (edge-to-edge fill)
  const componentNoPadding = {
    type: "no-padding",
    name: "No Padding ✅",
    icon: "📐",
    defaultSize: { width: 20, height: 10 },
    render: () => {
      const div = document.createElement("div");
      div.style.cssText = `
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-radius: 8px;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      `;
      div.textContent = "No padding, fills edge-to-edge ✅";
      return div;
    },
    renderDragClone: () => {
      const div = document.createElement("div");
      div.textContent = "📐 No Padding";
      return div;
    },
  };

  // ❌ WRONG: Missing width and box-sizing
  const componentWrong = {
    type: "wrong-sizing",
    name: "Missing box-sizing ❌",
    icon: "⚠️",
    defaultSize: { width: 20, height: 10 },
    render: () => {
      const div = document.createElement("div");
      div.style.cssText = `
        padding: 16px;
        background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        color: #8b4513;
        border-radius: 8px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        border: 3px dashed #ff6b6b;
      `;
      div.textContent = "Missing width/box-sizing ❌";
      return div;
    },
    renderDragClone: () => {
      const div = document.createElement("div");
      div.textContent = "⚠️ Wrong Sizing";
      return div;
    },
  };

  const components = [componentWithPadding, componentNoPadding, componentWrong];

  // Create palette
  const palette = document.createElement("component-palette");
  palette.components = components;
  palette.showHeader = false;

  // Create grid-builder
  const gridBuilder = document.createElement("grid-builder");
  gridBuilder.components = components;
  gridBuilder.config = {
    enableVirtualRendering: false,
    snapToGrid: true,
    showGridLines: true,
  };

  // Initialize with demo canvas
  setTimeout(() => {
    if ((window as any).gridBuilderAPI) {
      (window as any).gridBuilderAPI.addCanvas("sizing-demo-canvas");
    }
  }, 100);

  return html`
    <div
      style="font-family: system-ui, -apple-system, sans-serif; background: #f0f2f5; height: 100vh; display: flex; flex-direction: column;"
    >
      <div
        style="padding: 20px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      >
        <h2 style="margin: 0 0 10px 0; color: #333;">
          Component Sizing Best Practices
        </h2>
        <p style="color: #666; margin: 0;">
          Learn the correct way to size components so resize handles align
          perfectly with visual edges.
        </p>
      </div>

      <div style="display: flex; flex: 1; overflow: hidden;">
        <!-- Left: Palette + Instructions -->
        <div
          style="width: 320px; background: white; overflow-y: auto; border-right: 1px solid #ddd; display: flex; flex-direction: column; gap: 20px; padding: 20px;"
        >
          <!-- Palette -->
          <div>
            <div
              style="background: #4a90e2; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px; margin-bottom: -10px;"
            >
              🎨 Demo Components
            </div>
            <div
              style="background: #f9f9f9; border-radius: 0 0 8px 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"
            >
              ${palette}
            </div>
          </div>

          <!-- Instructions -->
          <div
            style="padding: 16px; background: #e7f3ff; border-radius: 8px; border-left: 4px solid #0ea5e9;"
          >
            <h4 style="margin: 0 0 8px 0; color: #0369a1; font-size: 13px;">
              📋 Try This:
            </h4>
            <ol
              style="margin: 0; padding-left: 20px; color: #075985; font-size: 12px; line-height: 1.6;"
            >
              <li>Drag all three components to the canvas</li>
              <li>Click each one to see resize handles</li>
              <li>
                Notice the ❌ component's handles don't align with visual edges
              </li>
              <li>
                The ✅ components have handles perfectly aligned to visual edges
              </li>
            </ol>
          </div>

          <!-- Code Examples -->
          <div
            style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;"
          >
            <h4 style="margin: 0 0 12px 0; color: #155724; font-size: 13px;">
              ✅ Correct Pattern (With Padding)
            </h4>
            <pre
              style="margin: 0; padding: 12px; background: white; border-radius: 4px; font-size: 11px; line-height: 1.4; overflow-x: auto;"
            ><code>div.style.cssText = \`
  padding: 16px;
  background: #667eea;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
\`;</code></pre>
          </div>

          <div
            style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;"
          >
            <h4 style="margin: 0 0 12px 0; color: #155724; font-size: 13px;">
              ✅ Correct Pattern (No Padding)
            </h4>
            <pre
              style="margin: 0; padding: 12px; background: white; border-radius: 4px; font-size: 11px; line-height: 1.4; overflow-x: auto;"
            ><code>div.style.cssText = \`
  background: #10b981;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
\`;</code></pre>
          </div>

          <div
            style="padding: 16px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;"
          >
            <h4 style="margin: 0 0 12px 0; color: #856404; font-size: 13px;">
              ❌ Wrong Pattern (Missing width/box-sizing)
            </h4>
            <pre
              style="margin: 0; padding: 12px; background: white; border-radius: 4px; font-size: 11px; line-height: 1.4; overflow-x: auto;"
            ><code>div.style.cssText = \`
  padding: 16px;
  background: #ffecd2;
  height: 100%;
  // Missing width and box-sizing!
\`;</code></pre>
            <p
              style="margin: 12px 0 0 0; color: #856404; font-size: 11px; line-height: 1.4;"
            >
              Without <code>width: 100%</code> and
              <code>box-sizing: border-box</code>, the component won't fill its
              container properly, causing resize handles to appear disconnected
              from visual edges.
            </p>
          </div>

          <!-- Why It Matters -->
          <div
            style="padding: 16px; background: #e1f5fe; border-radius: 8px; border-left: 4px solid #0288d1;"
          >
            <h4 style="margin: 0 0 8px 0; color: #01579b; font-size: 13px;">
              💡 Why This Matters
            </h4>
            <ul
              style="margin: 0; padding-left: 16px; color: #01579b; font-size: 11px; line-height: 1.6;"
            >
              <li>
                <strong>box-sizing: border-box</strong> includes padding and
                border in width/height
              </li>
              <li>
                Without it, <code>height: 100% + padding</code> exceeds
                container size
              </li>
              <li>
                <strong>width: 100%</strong> ensures horizontal fill of
                grid-item-wrapper
              </li>
              <li>
                Grid-item-wrapper positions resize handles based on its own
                size
              </li>
              <li>
                Component must fill wrapper completely for handles to align with
                visual edges
              </li>
            </ul>
          </div>
        </div>

        <!-- Right: Grid Builder Canvas -->
        <div style="flex: 1; overflow: auto;">${gridBuilder}</div>
      </div>
    </div>
  `;
};
