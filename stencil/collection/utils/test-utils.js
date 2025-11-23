// Internal imports (alphabetical)
import { gridState } from "../services/state-manager";
/**
 * Mock global objects for testing
 * Call this before importing components that use these globals
 */
export function setupGlobalMocks() {
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
    // Mock interact.js
    global.interact = jest.fn(() => ({
        draggable: jest.fn().mockReturnThis(),
        resizable: jest.fn().mockReturnThis(),
        dropzone: jest.fn().mockReturnThis(),
        unset: jest.fn(),
    }));
    // Set window.interact for components that check it
    window.interact = global.interact;
}
/**
 * Reset gridState to initial state
 * Call this in beforeEach to ensure clean state
 */
export function resetGridState() {
    gridState.canvases = {
        canvas1: {
            items: [],
            zIndexCounter: 1,
        },
    };
    gridState.selectedItemId = null;
    gridState.selectedCanvasId = null;
    gridState.currentViewport = 'desktop';
    gridState.showGrid = true;
}
/**
 * Create a test grid item with sensible defaults
 * Customize with partial override
 */
export function createTestItem(overrides) {
    return Object.assign({ id: 'item-1', canvasId: 'canvas1', type: 'header', name: 'Test Header', layouts: {
            desktop: { x: 100, y: 100, width: 200, height: 150 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
        }, zIndex: 1 }, overrides);
}
/**
 * Create multiple test items
 */
export function createTestItems(count, baseOverrides) {
    return Array.from({ length: count }, (_, index) => createTestItem(Object.assign({ id: `item-${index + 1}`, name: `Test Item ${index + 1}`, zIndex: index + 1, layouts: {
            desktop: {
                x: 10 + index * 5,
                y: 10 + index * 5,
                width: 200,
                height: 150,
            },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
        } }, baseOverrides)));
}
/**
 * Create a mock canvas element with specified width
 * Returns the element so it can be appended to the test page
 */
export function createMockCanvas(page, canvasId = 'canvas1', width = 1000) {
    const mockCanvas = page.doc.createElement('div');
    mockCanvas.id = canvasId;
    // Mock clientWidth since JSDOM doesn't compute layout
    Object.defineProperty(mockCanvas, 'clientWidth', {
        value: width,
        writable: true,
        configurable: true,
    });
    return mockCanvas;
}
export async function setupSpecPageWithCanvas(page, options) {
    const { canvasId = 'canvas1', canvasWidth = 1000, component, componentProps = {}, componentTag } = options;
    // Create and add mock canvas
    const mockCanvas = createMockCanvas(page, canvasId, canvasWidth);
    page.body.appendChild(mockCanvas);
    // Clear existing content
    page.root.innerHTML = '';
    // Create component element
    const tag = componentTag ||
        component.is ||
        `${component.name
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .slice(1)}`;
    const wrapper = page.doc.createElement(tag);
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
export function dispatchCustomEvent(element, eventName, detail, options = {}) {
    var _a, _b;
    const event = new CustomEvent(eventName, {
        detail,
        bubbles: (_a = options.bubbles) !== null && _a !== void 0 ? _a : true,
        composed: (_b = options.composed) !== null && _b !== void 0 ? _b : true,
    });
    element.dispatchEvent(event);
}
/**
 * Wait for a condition to be true
 * Useful for async operations in tests
 */
export async function waitFor(condition, timeout = 1000, interval = 50) {
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
export function getTextContent(element) {
    var _a;
    return ((_a = element === null || element === void 0 ? void 0 : element.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
}
/**
 * Check if element has class
 */
export function hasClass(element, className) {
    var _a;
    return (_a = element === null || element === void 0 ? void 0 : element.classList.contains(className)) !== null && _a !== void 0 ? _a : false;
}
/**
 * Mock pattern: Create a jest spy function that can be chained
 */
export function createChainableMock() {
    const mock = jest.fn();
    mock.mockReturnThis();
    return mock;
}
//# sourceMappingURL=test-utils.js.map
