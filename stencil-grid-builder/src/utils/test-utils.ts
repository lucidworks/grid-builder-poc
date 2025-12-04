// External libraries (alphabetical)
import { SpecPage } from "@stencil/core/testing";

// Internal imports (alphabetical)
import { GridItem, gridState } from "../services/state-manager";

/**
 * Mock global objects for testing
 * Call this before importing components that use these globals
 */
export function setupGlobalMocks(): void {
  // Mock IntersectionObserver
  (global as any).IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock interact.js
  (global as any).interact = jest.fn(() => ({
    draggable: jest.fn().mockReturnThis(),
    resizable: jest.fn().mockReturnThis(),
    dropzone: jest.fn().mockReturnThis(),
    unset: jest.fn(),
  }));

  // Set window.interact for components that check it
  (window as any).interact = (global as any).interact;
}

/**
 * Reset gridState to initial state
 * Call this in beforeEach to ensure clean state
 */
export function resetGridState(): void {
  gridState.canvases = {
    canvas1: {
      items: [],
      zIndexCounter: 1,
    },
  };
  gridState.selectedItemId = null;
  gridState.selectedCanvasId = null;
  gridState.currentViewport = "desktop";
  gridState.showGrid = true;
}

/**
 * Create a test grid item with sensible defaults
 * Customize with partial override
 */
export function createTestItem(overrides?: Partial<GridItem>): GridItem {
  return {
    id: "item-1",
    canvasId: "canvas1",
    type: "header",
    name: "Test Header",
    layouts: {
      desktop: { x: 100, y: 100, width: 200, height: 150, customized: true },
      mobile: {
        x: null,
        y: null,
        width: null,
        height: null,
        customized: false,
      },
    },
    zIndex: 1,
    ...overrides,
  };
}

/**
 * Create multiple test items
 */
export function createTestItems(
  count: number,
  baseOverrides?: Partial<GridItem>,
): GridItem[] {
  return Array.from({ length: count }, (_, index) =>
    createTestItem({
      id: `item-${index + 1}`,
      name: `Test Item ${index + 1}`,
      zIndex: index + 1,
      layouts: {
        desktop: {
          x: 10 + index * 5,
          y: 10 + index * 5,
          width: 200,
          height: 150,
          customized: true,
        },
        mobile: {
          x: null,
          y: null,
          width: null,
          height: null,
          customized: false,
        },
      },
      ...baseOverrides,
    }),
  );
}

/**
 * Create a mock canvas element with specified width
 * Returns the element so it can be appended to the test page
 */
export function createMockCanvas(
  page: SpecPage,
  canvasId: string = "canvas1",
  width: number = 1000,
): HTMLElement {
  const mockCanvas = page.doc.createElement("div");
  mockCanvas.id = canvasId;

  // Mock clientWidth since JSDOM doesn't compute layout
  Object.defineProperty(mockCanvas, "clientWidth", {
    value: width,
    writable: true,
    configurable: true,
  });

  return mockCanvas;
}

/**
 * Setup a spec page with mock canvas for layout tests
 * This handles the complex setup needed for tests that use grid calculations
 */
export interface MockCanvasSetupOptions {
  canvasId?: string;
  canvasWidth?: number;
  component: any;
  componentProps?: Record<string, any>;
  componentTag?: string;
}

export async function setupSpecPageWithCanvas(
  page: SpecPage,
  options: MockCanvasSetupOptions,
): Promise<HTMLElement> {
  const {
    canvasId = "canvas1",
    canvasWidth = 1000,
    component,
    componentProps = {},
    componentTag,
  } = options;

  // Create and add mock canvas
  const mockCanvas = createMockCanvas(page, canvasId, canvasWidth);
  page.body.appendChild(mockCanvas);

  // Clear existing content
  page.root.innerHTML = "";

  // Create component element
  const tag =
    componentTag ||
    component.is ||
    `${component.name
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .slice(1)}`;
  const wrapper = page.doc.createElement(tag) as any;

  // Apply props
  Object.entries(componentProps).forEach(([key, value]) => {
    wrapper[key] = value;
  });

  // Add to page and wait for changes
  page.root.appendChild(wrapper);
  await page.waitForChanges();

  return wrapper;
}

/**
 * Dispatch a custom event on an element or document
 */
export function dispatchCustomEvent<T = any>(
  element: Element | Document,
  eventName: string,
  detail: T,
  options: { bubbles?: boolean; composed?: boolean } = {},
): void {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: options.bubbles ?? true,
    composed: options.composed ?? true,
  });
  element.dispatchEvent(event);
}

/**
 * Wait for a condition to be true
 * Useful for async operations in tests
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 1000,
  interval: number = 50,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Get element text content trimmed
 */
export function getTextContent(element: Element | null): string {
  return element?.textContent?.trim() || "";
}

/**
 * Check if element has class
 */
export function hasClass(element: Element | null, className: string): boolean {
  return element?.classList.contains(className) ?? false;
}

/**
 * Mock pattern: Create a jest spy function that can be chained
 */
export function createChainableMock(): jest.Mock {
  const mock = jest.fn();
  mock.mockReturnThis();
  return mock;
}
