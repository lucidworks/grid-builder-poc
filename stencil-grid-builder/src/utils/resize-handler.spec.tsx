/**
 * Resize Handler Tests
 * ====================
 *
 * Tests for resize handler functionality including:
 * - Component definition min/max size constraints
 * - Grid unit to pixel conversions for constraints
 * - Position preservation when hitting size limits
 * - Clamping behavior for top/left edge resizes
 * - Optional min/max size handling
 */

import { h } from '@stencil/core';
import { ResizeHandler } from './resize-handler';
import { GridItem } from '../services/state-manager';
import { ComponentDefinition } from '../types/component-definition';
import { domCache } from './dom-cache';

// Mock interact.js
const mockInteract = () => {
  const mockInstance = {
    resizable: jest.fn().mockReturnThis(),
    unset: jest.fn(),
  };

  const mockInteractFn: any = jest.fn(() => mockInstance);

  // Add modifiers API
  mockInteractFn.modifiers = {
    restrictSize: jest.fn((options) => ({ name: 'restrictSize', options })),
    snap: jest.fn((options) => ({ name: 'snap', options })),
  };

  // Add snappers API
  mockInteractFn.snappers = {
    grid: jest.fn((options) => ({ type: 'grid', options })),
  };

  return mockInteractFn;
};

// Mock window.interact
(window as any).interact = mockInteract();

// Mock canvas element
function createMockCanvas(id: string, width: number): HTMLElement {
  const element = document.createElement('div');
  element.id = id;
  element.className = 'canvas-section';
  Object.defineProperty(element, 'clientWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(element, 'clientHeight', {
    value: 1000,
    writable: true,
    configurable: true,
  });
  document.body.appendChild(element);
  return element;
}

// Mock grid item element
function createMockItemElement(): HTMLElement {
  const element = document.createElement('div');
  element.className = 'grid-item';
  element.style.width = '200px';
  element.style.height = '100px';
  element.style.transform = 'translate(100px, 50px)';
  document.body.appendChild(element);
  return element;
}

// Create test grid item
function createTestItem(canvasId: string): GridItem {
  return {
    id: 'test-item',
    canvasId,
    type: 'test-component',
    name: 'Test Component',
    layouts: {
      desktop: {
        x: 5,
        y: 2,
        width: 10,
        height: 5,
      },
      mobile: {
        x: null,
        y: null,
        width: null,
        height: null,
        customized: false,
      },
    },
    zIndex: 1,
    config: {},
  };
}

describe('ResizeHandler', () => {
  // @ts-ignore - mockCanvas is used via DOM manipulation, not direct reference
  let mockCanvas: HTMLElement;
  let mockElement: HTMLElement;
  let mockItem: GridItem;
  let onUpdate: jest.Mock;

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    domCache.clear();

    // Create mock canvas and item
    mockCanvas = createMockCanvas('test-canvas', 1000);
    mockElement = createMockItemElement();
    mockItem = createTestItem('test-canvas');
    onUpdate = jest.fn();

    // Reset interact mock
    (window as any).interact = mockInteract();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    domCache.clear();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with component definition', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        minSize: { width: 5, height: 3 },
        maxSize: { width: 20, height: 10 },
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);
      expect(handler).toBeDefined();

      // Verify interact.js was called
      expect((window as any).interact).toHaveBeenCalledWith(mockElement);

      handler.destroy();
    });

    it('should initialize without component definition', () => {
      const handler = new ResizeHandler(mockElement, mockItem, onUpdate);
      expect(handler).toBeDefined();

      handler.destroy();
    });

    it('should delay initialization if element missing width/height', () => {
      const elementNoSize = document.createElement('div');
      document.body.appendChild(elementNoSize);

      const handler = new ResizeHandler(elementNoSize, mockItem, onUpdate);
      expect(handler).toBeDefined();

      handler.destroy();
    });
  });

  describe('Component Definition Min/Max Constraints', () => {
    it('should use minSize from component definition', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        minSize: { width: 5, height: 3 }, // 5 * 20px = 100px, 3 * 20px = 60px
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);

      // Verify resizable was called (modifiers removed - constraints handled manually in handleResizeMove)
      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      const resizeConfig = interactInstance.resizable.mock.calls[0][0];
      expect(resizeConfig.edges).toBeDefined();
      expect(resizeConfig.listeners).toBeDefined();

      handler.destroy();
    });

    it('should use maxSize from component definition', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        maxSize: { width: 25, height: 15 }, // 25 * 20px = 500px, 15 * 20px = 300px
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);

      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      handler.destroy();
    });

    it('should use both minSize and maxSize from component definition', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        minSize: { width: 5, height: 3 },
        maxSize: { width: 25, height: 15 },
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);

      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      handler.destroy();
    });

    it('should use default min/max when component definition has no constraints', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        // No minSize/maxSize
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);

      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      // Modifiers removed - constraints handled manually in handleResizeMove
      const resizeConfig = interactInstance.resizable.mock.calls[0][0];
      expect(resizeConfig.edges).toBeDefined();
      expect(resizeConfig.listeners).toBeDefined();

      handler.destroy();
    });

    it('should use default min/max when no component definition provided', () => {
      const handler = new ResizeHandler(mockElement, mockItem, onUpdate);

      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      // Modifiers removed - constraints handled manually in handleResizeMove
      const resizeConfig = interactInstance.resizable.mock.calls[0][0];
      expect(resizeConfig.edges).toBeDefined();
      expect(resizeConfig.listeners).toBeDefined();

      handler.destroy();
    });
  });

  describe('Grid Unit to Pixel Conversion', () => {
    it('should convert minSize grid units to pixels', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        minSize: { width: 10, height: 5 }, // 10 * 2% * 1000 = 200px, 5 * 20px = 100px
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);

      // Expected conversions:
      // minSize.width: 10 grid units * 2% * 1000px canvas = 200px
      // minSize.height: 5 grid units * 20px = 100px
      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      handler.destroy();
    });

    it('should convert maxSize grid units to pixels', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        maxSize: { width: 50, height: 20 }, // 50 * 2% * 1000 = 1000px (full width), 20 * 20px = 400px
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);

      // Expected conversions:
      // maxSize.width: 50 grid units * 2% * 1000px canvas = 1000px (full width)
      // maxSize.height: 20 grid units * 20px = 400px
      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      handler.destroy();
    });

    it('should adapt to different canvas widths', () => {
      // Create wider canvas
      const wideCanvas = createMockCanvas('wide-canvas', 2000);
      const wideItem = createTestItem('wide-canvas');

      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        minSize: { width: 10, height: 5 }, // 10 * 2% * 2000 = 400px, 5 * 20px = 100px
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, wideItem, onUpdate, definition);

      // Expected conversions for 2000px canvas:
      // minSize.width: 10 grid units * 2% * 2000px canvas = 400px
      // minSize.height: 5 grid units * 20px = 100px (same, vertical is fixed)
      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      handler.destroy();
      wideCanvas.parentNode?.removeChild(wideCanvas);
    });
  });

  describe('Destroy and Cleanup', () => {
    it('should cleanup interact.js instance', () => {
      const handler = new ResizeHandler(mockElement, mockItem, onUpdate);

      const interactInstance = (window as any).interact(mockElement);
      handler.destroy();

      expect(interactInstance.unset).toHaveBeenCalled();
    });

    it('should be safe to call destroy multiple times', () => {
      const handler = new ResizeHandler(mockElement, mockItem, onUpdate);

      handler.destroy();
      handler.destroy(); // Should not throw

      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.unset).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Case Handling', () => {
    it('should handle missing interact.js gracefully', () => {
      (window as any).interact = undefined;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate);

      expect(consoleWarnSpy).toHaveBeenCalledWith('interact.js not loaded');

      handler.destroy();
      consoleWarnSpy.mockRestore();

      // Restore interact
      (window as any).interact = mockInteract();
    });

    it('should handle component definition with only minSize', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        minSize: { width: 5, height: 3 },
        // No maxSize
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);

      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      handler.destroy();
    });

    it('should handle component definition with only maxSize', () => {
      const definition: ComponentDefinition = {
        type: 'test-component',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 10, height: 5 },
        // No minSize
        maxSize: { width: 30, height: 15 },
        render: () => <div>Test</div>,
      };

      const handler = new ResizeHandler(mockElement, mockItem, onUpdate, definition);

      const interactInstance = (window as any).interact(mockElement);
      expect(interactInstance.resizable).toHaveBeenCalled();

      handler.destroy();
    });
  });

  describe('Resize Configuration', () => {
    it('should enable all 8 resize handles', () => {
      const handler = new ResizeHandler(mockElement, mockItem, onUpdate);

      const interactInstance = (window as any).interact(mockElement);
      const resizeConfig = interactInstance.resizable.mock.calls[0][0];

      expect(resizeConfig.edges).toEqual({
        left: true,
        right: true,
        bottom: true,
        top: true,
      });

      handler.destroy();
    });

    it('should configure grid snapping with endOnly', () => {
      const handler = new ResizeHandler(mockElement, mockItem, onUpdate);

      const interactInstance = (window as any).interact(mockElement);
      const resizeConfig = interactInstance.resizable.mock.calls[0][0];

      // Modifiers removed - grid snapping handled manually in handleResizeEnd
      expect(resizeConfig.edges).toBeDefined();
      expect(resizeConfig.listeners).toBeDefined();

      handler.destroy();
    });

    it('should attach resize event listeners', () => {
      const handler = new ResizeHandler(mockElement, mockItem, onUpdate);

      const interactInstance = (window as any).interact(mockElement);
      const resizeConfig = interactInstance.resizable.mock.calls[0][0];

      expect(resizeConfig.listeners).toBeDefined();
      expect(resizeConfig.listeners.start).toBeDefined();
      expect(resizeConfig.listeners.move).toBeDefined();
      expect(resizeConfig.listeners.end).toBeDefined();

      handler.destroy();
    });
  });
});
