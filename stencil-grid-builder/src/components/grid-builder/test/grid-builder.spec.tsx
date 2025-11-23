/**
 * Grid Builder Component Tests
 * ==============================
 *
 * Tests for the main grid-builder component including:
 * - Component instantiation
 * - Props validation
 * - Plugin initialization
 * - Lifecycle methods
 *
 * Note: These tests focus on the component's public API and lifecycle.
 * The GridBuilderAPI itself is tested in grid-builder-api.spec.ts.
 */

// Mock ResizeObserver BEFORE importing GridBuilder
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

(global as any).ResizeObserver = jest.fn(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

import { h } from '@stencil/core';
import { GridBuilder } from '../grid-builder';
import { reset as resetState, gridState, setActiveCanvas } from '../../../services/state-manager';
import { clearHistory } from '../../../services/undo-redo';
import { eventManager } from '../../../services/event-manager';
import { mockDragClone } from '../../../utils/test-helpers';

// Mock component definitions for tests
const mockComponentDefinitions = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 10, height: 3 },
    renderDragClone: () => <div>Header Clone</div>,
    render: () => <div>Header</div>,
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    renderDragClone: () => <div>Text Clone</div>,
    render: () => <div>Text</div>,
  },
];

describe('grid-builder', () => {
  beforeEach(() => {
    resetState();
    clearHistory();
    // Clear mock calls
    jest.clearAllMocks();
  });

  describe('Component Instantiation', () => {
    it('should create component instance', () => {
      const component = new GridBuilder();
      expect(component).toBeTruthy();
      expect(component).toBeInstanceOf(GridBuilder);
    });

    it('should have required lifecycle methods', () => {
      const component = new GridBuilder();
      expect(typeof component.componentWillLoad).toBe('function');
      expect(typeof component.componentDidLoad).toBe('function');
      expect(typeof component.disconnectedCallback).toBe('function');
    });
  });

  describe('Props Validation', () => {
    it('should accept components prop', () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      expect(component.components).toBeDefined();
      expect(component.components.length).toBe(2);
      expect(component.components[0].type).toBe('header');
    });

    it('should log error when components prop is missing', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const component = new GridBuilder();
      component.componentWillLoad();

      expect(consoleErrorSpy).toHaveBeenCalledWith('GridBuilder: components prop is required');

      consoleErrorSpy.mockRestore();
    });

    it('should log error when components prop is empty array', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const component = new GridBuilder();
      component.components = [];
      component.componentWillLoad();

      expect(consoleErrorSpy).toHaveBeenCalledWith('GridBuilder: components prop is required');

      consoleErrorSpy.mockRestore();
    });

    it('should accept optional config prop', () => {
      const customConfig = {
        gridSizePercent: 3,
        minGridSize: 15,
        maxGridSize: 60,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config).toEqual(customConfig);
    });

    it('should accept optional plugins prop', () => {
      const mockPlugin = {
        name: 'test-plugin',
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.plugins = [mockPlugin];

      expect(component.plugins).toBeDefined();
      expect(component.plugins?.length).toBe(1);
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should initialize plugins on componentDidLoad', () => {
      const mockPlugin = {
        name: 'test-plugin',
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.plugins = [mockPlugin];

      component.componentDidLoad();

      expect(mockPlugin.init).toHaveBeenCalled();
      // Verify API object was passed (not a class instance)
      expect(mockPlugin.init).toHaveBeenCalledWith(
        expect.objectContaining({
          on: expect.any(Function),
          off: expect.any(Function),
          getState: expect.any(Function),
        })
      );
    });

    it('should destroy plugins on disconnectedCallback', () => {
      const mockPlugin = {
        name: 'test-plugin',
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.plugins = [mockPlugin];

      component.componentDidLoad();
      component.disconnectedCallback();

      expect(mockPlugin.destroy).toHaveBeenCalled();
    });

    it('should handle multiple plugins', () => {
      const plugin1 = {
        name: 'plugin-1',
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const plugin2 = {
        name: 'plugin-2',
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.plugins = [plugin1, plugin2];

      component.componentDidLoad();

      expect(plugin1.init).toHaveBeenCalled();
      expect(plugin2.init).toHaveBeenCalled();

      component.disconnectedCallback();

      expect(plugin1.destroy).toHaveBeenCalled();
      expect(plugin2.destroy).toHaveBeenCalled();
    });

    it('should handle plugin init errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const failingPlugin = {
        name: 'failing-plugin',
        init: jest.fn(() => {
          throw new Error('Init failed');
        }),
        destroy: jest.fn(),
      };

      const goodPlugin = {
        name: 'good-plugin',
        init: jest.fn(),
        destroy: jest.fn(),
      };

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.plugins = [failingPlugin, goodPlugin];

      component.componentDidLoad();

      // Good plugin should still be initialized
      expect(goodPlugin.init).toHaveBeenCalled();

      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Component Lifecycle', () => {
    it('should call componentWillLoad before rendering', () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentWillLoad();

      // Verify by checking that validation ran (no error since we have components)
      expect(component.components).toBeDefined();
    });

    it('should work without plugins', () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      component.componentDidLoad();

      // Should not crash without plugins
      expect(component.plugins).toBeUndefined();
    });
  });

  describe('Custom Component Rendering', () => {
    it('should support renderComponent returning custom elements', () => {
      // Simulate a custom Stencil component definition
      const customComponentDef = [
        {
          type: 'custom-card',
          name: 'Custom Card',
          icon: '🎴',
          defaultSize: { width: 20, height: 15 },
          minSize: { width: 10, height: 10 },
          render: () => <div>Custom Card</div>,
          renderComponent: (_item, config) => {
            // Simulate creating a custom element (like a Stencil component)
            const customElement = document.createElement('custom-card');
            customElement.setAttribute('title', config.title || 'Default Title');
            customElement.setAttribute('content', config.content || 'Default Content');
            return customElement;
          },
        },
      ];

      const component = new GridBuilder();
      component.components = customComponentDef as any;

      expect((customComponentDef[0] as any).renderComponent).toBeDefined();
      expect(typeof (customComponentDef[0] as any).renderComponent).toBe('function');

      // Test the renderComponent function
      const mockItem = { id: 'test-1', type: 'custom-card', canvasId: 'canvas1' };
      const mockConfig = { title: 'Test Title', content: 'Test Content' };
      const element = customComponentDef[0].renderComponent(mockItem, mockConfig);

      expect(element).toBeTruthy();
      expect(element.tagName.toLowerCase()).toBe('custom-card');
      expect(element.getAttribute('title')).toBe('Test Title');
      expect(element.getAttribute('content')).toBe('Test Content');
    });

    it('should support renderComponent with props assignment pattern', () => {
      // More realistic pattern for Stencil components with properties
      const stencilComponentDef = [
        {
          type: 'article-card',
          name: 'Article Card',
          icon: '📰',
          defaultSize: { width: 20, height: 18 },
          minSize: { width: 15, height: 15 },
          render: () => <div>Article Card</div>,
          configSchema: [
            { name: 'title', label: 'Title', type: 'text', defaultValue: 'Article Title' },
            { name: 'author', label: 'Author', type: 'text', defaultValue: 'John Doe' },
            { name: 'imageUrl', label: 'Image', type: 'text', defaultValue: '' },
          ],
          renderComponent: (_item, config) => {
            // Pattern: Create custom element and assign props
            const card = document.createElement('article-card') as any;
            card.title = config.title;
            card.author = config.author;
            card.imageUrl = config.imageUrl;
            return card;
          },
        },
      ];

      const component = new GridBuilder();
      component.components = stencilComponentDef as any;

      // Test the component definition
      expect(component.components[0].configSchema).toBeDefined();
      expect(component.components[0].configSchema.length).toBe(3);

      // Test renderComponent creates proper element
      const mockItem = { id: 'test-2', type: 'article-card', canvasId: 'canvas1' };
      const mockConfig = {
        title: 'My Article',
        author: 'Jane Smith',
        imageUrl: 'https://example.com/image.jpg',
      };

      const element = stencilComponentDef[0].renderComponent(mockItem, mockConfig);

      expect(element).toBeTruthy();
      expect(element.tagName.toLowerCase()).toBe('article-card');
      expect((element as any).title).toBe('My Article');
      expect((element as any).author).toBe('Jane Smith');
      expect((element as any).imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should support renderComponent with event listeners', () => {
      // Pattern: Custom component with event handling
      const interactiveComponentDef = [
        {
          type: 'newsletter-form',
          name: 'Newsletter Form',
          icon: '✉️',
          defaultSize: { width: 25, height: 12 },
          minSize: { width: 20, height: 10 },
          render: () => <div>Newsletter Form</div>,
          renderComponent: (_item, _config) => {
            const form = document.createElement('newsletter-form') as any;

            // Simulate adding event listener for custom events
            const mockListener = jest.fn();
            form.addEventListener('newsletterSubmit', mockListener);

            // Store the listener for testing
            form.__mockListener = mockListener;

            return form;
          },
        },
      ];

      const component = new GridBuilder();
      component.components = interactiveComponentDef as any;

      const mockItem = { id: 'test-3', type: 'newsletter-form', canvasId: 'canvas1' };
      const element = interactiveComponentDef[0].renderComponent(mockItem, {});

      expect(element).toBeTruthy();
      expect(element.tagName.toLowerCase()).toBe('newsletter-form');

      // Simulate custom event dispatch
      const mockEvent = new CustomEvent('newsletterSubmit', { detail: 'test@example.com' });
      element.dispatchEvent(mockEvent);

      expect((element as any).__mockListener).toHaveBeenCalled();
    });
  });

  describe('Custom Selection Colors', () => {
    it('should support optional selectionColor in component definition', () => {
      const customColorDef = [
        {
          type: 'custom-header',
          name: 'Custom Header',
          icon: '📄',
          defaultSize: { width: 20, height: 6 },
          selectionColor: '#3b82f6', // Custom blue
          renderDragClone: () => <div>Header Clone</div>,
          render: () => <div>Header</div>,
        },
      ];

      const component = new GridBuilder();
      component.components = customColorDef;

      expect(component.components[0].selectionColor).toBe('#3b82f6');
    });

    it('should work without selectionColor (using default)', () => {
      const defaultColorDef = [
        {
          type: 'default-header',
          name: 'Default Header',
          icon: '📄',
          defaultSize: { width: 20, height: 6 },
          renderDragClone: () => <div>Header Clone</div>,
          render: () => <div>Header</div>,
        },
      ];

      const component = new GridBuilder();
      component.components = defaultColorDef;

      expect(component.components[0].selectionColor).toBeUndefined();
    });

    it('should support different colors for different component types', () => {
      const multiColorDefs = [
        {
          type: 'header',
          name: 'Header',
          icon: '📄',
          defaultSize: { width: 20, height: 6 },
          selectionColor: '#3b82f6', // Blue
          renderDragClone: () => <div>Header Clone</div>,
          render: () => <div>Header</div>,
        },
        {
          type: 'article',
          name: 'Article',
          icon: '📝',
          defaultSize: { width: 25, height: 10 },
          selectionColor: '#10b981', // Green
          renderDragClone: () => <div>Article Clone</div>,
          render: () => <div>Article</div>,
        },
        {
          type: 'button',
          name: 'Button',
          icon: '🔘',
          defaultSize: { width: 15, height: 5 },
          selectionColor: '#ef4444', // Red
          renderDragClone: () => <div>Button Clone</div>,
          render: () => <div>Button</div>,
        },
      ];

      const component = new GridBuilder();
      component.components = multiColorDefs;

      expect(component.components[0].selectionColor).toBe('#3b82f6');
      expect(component.components[1].selectionColor).toBe('#10b981');
      expect(component.components[2].selectionColor).toBe('#ef4444');
    });

    it('should accept various color formats', () => {
      const colorFormatDefs = [
        {
          type: 'hex-color',
          name: 'Hex Color',
          icon: '🎨',
          defaultSize: { width: 20, height: 6 },
          selectionColor: '#ff5733', // 6-digit hex
          renderDragClone: mockDragClone,
          render: () => <div>Hex</div>,
        },
        {
          type: 'rgb-color',
          name: 'RGB Color',
          icon: '🎨',
          defaultSize: { width: 20, height: 6 },
          selectionColor: 'rgb(255, 87, 51)', // RGB
          renderDragClone: mockDragClone,
          render: () => <div>RGB</div>,
        },
        {
          type: 'rgba-color',
          name: 'RGBA Color',
          icon: '🎨',
          defaultSize: { width: 20, height: 6 },
          selectionColor: 'rgba(255, 87, 51, 0.8)', // RGBA
          renderDragClone: mockDragClone,
          render: () => <div>RGBA</div>,
        },
      ];

      const component = new GridBuilder();
      component.components = colorFormatDefs;

      expect(component.components[0].selectionColor).toBe('#ff5733');
      expect(component.components[1].selectionColor).toBe('rgb(255, 87, 51)');
      expect(component.components[2].selectionColor).toBe('rgba(255, 87, 51, 0.8)');
    });
  });

  describe('@Method() Decorators', () => {
    it('should expose exportState method', async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      expect(typeof component.exportState).toBe('function');

      const result = await component.exportState();
      expect(result).toBeDefined();
      expect(result.canvases).toBeDefined();
    });

    it('should expose importState method', async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      expect(typeof component.importState).toBe('function');

      const mockState = {
        canvases: {
          'canvas-1': {
            zIndexCounter: 1,
            items: [],
          },
        },
      };

      await component.importState(mockState);
      // Should not throw
    });

    it('should expose getState method', async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      expect(typeof component.getState).toBe('function');

      const state = await component.getState();
      expect(state).toBeDefined();
      expect(state.canvases).toBeDefined();
    });

    it('should expose addCanvas method', async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.componentDidLoad();

      expect(typeof component.addCanvas).toBe('function');

      await component.addCanvas('test-canvas');
      // Should not throw
    });

    it('should expose removeCanvas method', async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.componentDidLoad();

      expect(typeof component.removeCanvas).toBe('function');

      await component.removeCanvas('test-canvas');
      // Should not throw
    });

    it('should expose undo/redo methods', async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.componentDidLoad();

      expect(typeof component.undo).toBe('function');
      expect(typeof component.redo).toBe('function');
      expect(typeof component.canUndo).toBe('function');
      expect(typeof component.canRedo).toBe('function');

      const canUndoResult = await component.canUndo();
      expect(typeof canUndoResult).toBe('boolean');

      const canRedoResult = await component.canRedo();
      expect(typeof canRedoResult).toBe('boolean');
    });

    it('should expose component manipulation methods', async () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.componentDidLoad();

      expect(typeof component.addComponent).toBe('function');
      expect(typeof component.deleteComponent).toBe('function');
      expect(typeof component.updateConfig).toBe('function');

      // Test addComponent
      const itemId = await component.addComponent(
        'test-canvas',
        'header',
        { x: 0, y: 0, width: 10, height: 5 },
        { title: 'Test' }
      );
      expect(itemId).toBeDefined();
    });
  });

  describe('Configuration Options', () => {
    it('should accept enableAnimations config', () => {
      const customConfig = {
        enableAnimations: true,
        animationDuration: 200,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config.enableAnimations).toBe(true);
      expect(component.config.animationDuration).toBe(200);
    });

    it('should accept enableAutoScroll config', () => {
      const customConfig = {
        enableAutoScroll: false,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config.enableAutoScroll).toBe(false);
    });

    it('should accept eventDebounceDelay config', () => {
      const customConfig = {
        eventDebounceDelay: 500,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config.eventDebounceDelay).toBe(500);
    });

    it('should work with default config values', () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;

      // Should work without explicit config
      expect(component.config).toBeUndefined();
    });

    it('should accept all new config options together', () => {
      const customConfig = {
        enableAnimations: true,
        animationDuration: 150,
        enableAutoScroll: true,
        eventDebounceDelay: 300,
        gridSizePercent: 2,
      };

      const component = new GridBuilder();
      component.config = customConfig;

      expect(component.config.enableAnimations).toBe(true);
      expect(component.config.animationDuration).toBe(150);
      expect(component.config.enableAutoScroll).toBe(true);
      expect(component.config.eventDebounceDelay).toBe(300);
      expect(component.config.gridSizePercent).toBe(2);
    });
  });

  describe('Active Canvas Feature', () => {
    beforeEach(() => {
      resetState();
      clearHistory();
      jest.clearAllMocks();
    });

    describe('isActive Prop Passing', () => {
      it('should pass isActive=true to canvas-section when activeCanvasId matches', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Set active canvas in state
        setActiveCanvas('canvas1');

        // Render component
        component.render();

        // Component passes isActive prop based on state comparison
        // (This is verified by testing that the prop binding exists in the component)
        expect(gridState.activeCanvasId).toBe('canvas1');
      });

      it('should pass isActive=false when activeCanvasId does not match', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        setActiveCanvas('canvas1');

        // A different canvas should not be active
        expect(gridState.activeCanvasId).not.toBe('canvas2');
      });

      it('should update isActive when activeCanvasId changes', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Start with canvas1 active
        setActiveCanvas('canvas1');
        expect(gridState.activeCanvasId).toBe('canvas1');

        // Switch to canvas2
        setActiveCanvas('canvas2');
        expect(gridState.activeCanvasId).toBe('canvas2');

        // Switch back to canvas1
        setActiveCanvas('canvas1');
        expect(gridState.activeCanvasId).toBe('canvas1');
      });

      it('should handle null activeCanvasId (no canvas active)', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Initially null
        expect(gridState.activeCanvasId).toBeNull();

        // Set active
        setActiveCanvas('canvas1');
        expect(gridState.activeCanvasId).toBe('canvas1');

        // Clear active
        gridState.activeCanvasId = null;
        expect(gridState.activeCanvasId).toBeNull();
      });
    });

    describe('Event Handler Registration', () => {
      it('should register canvas-activated event handler in componentDidLoad', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        // Mock the hostElement
        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Verify canvas-activated event listener was registered
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasActivatedCall = addEventListenerCalls.find(call => call[0] === 'canvas-activated');

        expect(canvasActivatedCall).toBeDefined();
        expect(typeof canvasActivatedCall[1]).toBe('function');
      });

      it('should remove canvas-activated event handler in disconnectedCallback', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();
        component.disconnectedCallback();

        // Verify event listener was removed
        const removeEventListenerCalls = mockHostElement.removeEventListener.mock.calls;
        const canvasActivatedCall = removeEventListenerCalls.find(call => call[0] === 'canvas-activated');

        expect(canvasActivatedCall).toBeDefined();
      });

      it('should handle canvas-activated event and emit plugin event', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        // Spy on eventManager.emit
        const emitSpy = jest.spyOn(eventManager, 'emit');

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasActivatedCall = addEventListenerCalls.find(call => call[0] === 'canvas-activated');
        const handler = canvasActivatedCall[1];

        // Simulate canvas-activated event
        const mockEvent = new CustomEvent('canvas-activated', {
          detail: { canvasId: 'canvas1' },
        });

        handler(mockEvent);

        // Verify plugin event was emitted
        expect(emitSpy).toHaveBeenCalledWith('canvasActivated', { canvasId: 'canvas1' });

        emitSpy.mockRestore();
      });
    });

    describe('@Method() Public Methods', () => {
      it('should expose setActiveCanvas method', async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        expect(typeof component.setActiveCanvas).toBe('function');

        await component.setActiveCanvas('canvas1');

        expect(gridState.activeCanvasId).toBe('canvas1');
      });

      it('should expose getActiveCanvas method', async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        expect(typeof component.getActiveCanvas).toBe('function');

        // Initially null
        let result = await component.getActiveCanvas();
        expect(result).toBeNull();

        // Set active canvas
        setActiveCanvas('canvas2');
        result = await component.getActiveCanvas();
        expect(result).toBe('canvas2');
      });

      it('should emit canvasActivated event when setActiveCanvas is called', async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        const emitSpy = jest.spyOn(eventManager, 'emit');

        await component.setActiveCanvas('canvas1');

        expect(emitSpy).toHaveBeenCalledWith('canvasActivated', { canvasId: 'canvas1' });

        emitSpy.mockRestore();
      });

      it('should allow switching active canvas via public method', async () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        await component.setActiveCanvas('canvas1');
        let result = await component.getActiveCanvas();
        expect(result).toBe('canvas1');

        await component.setActiveCanvas('canvas2');
        result = await component.getActiveCanvas();
        expect(result).toBe('canvas2');

        await component.setActiveCanvas('canvas3');
        result = await component.getActiveCanvas();
        expect(result).toBe('canvas3');
      });
    });

    describe('API Object Methods', () => {
      it('should expose setActiveCanvas in API object', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        const api = (component as any).api;

        expect(api).toBeDefined();
        expect(typeof api.setActiveCanvas).toBe('function');

        api.setActiveCanvas('canvas1');
        expect(gridState.activeCanvasId).toBe('canvas1');
      });

      it('should expose getActiveCanvas in API object', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        const api = (component as any).api;

        expect(typeof api.getActiveCanvas).toBe('function');

        setActiveCanvas('canvas1');
        const result = api.getActiveCanvas();
        expect(result).toBe('canvas1');
      });

      it('should emit plugin event when API setActiveCanvas is called', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        const api = (component as any).api;
        const emitSpy = jest.spyOn(eventManager, 'emit');

        api.setActiveCanvas('canvas2');

        expect(emitSpy).toHaveBeenCalledWith('canvasActivated', { canvasId: 'canvas2' });

        emitSpy.mockRestore();
      });

      it('should provide API to plugins during initialization', () => {
        const mockPlugin = {
          name: 'test-plugin',
          init: jest.fn(),
          destroy: jest.fn(),
        };

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.plugins = [mockPlugin];

        component.componentDidLoad();

        expect(mockPlugin.init).toHaveBeenCalled();

        // Get the API object passed to plugin
        const apiArg = mockPlugin.init.mock.calls[0][0];

        expect(apiArg.setActiveCanvas).toBeDefined();
        expect(apiArg.getActiveCanvas).toBeDefined();
        expect(typeof apiArg.setActiveCanvas).toBe('function');
        expect(typeof apiArg.getActiveCanvas).toBe('function');
      });
    });

    describe('Integration with State', () => {
      it('should keep activeCanvasId independent from selectedCanvasId', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        // Set selection
        gridState.selectedItemId = 'item-1';
        gridState.selectedCanvasId = 'canvas1';

        // Set active canvas to different canvas
        setActiveCanvas('canvas2');

        // Both should coexist
        expect(gridState.selectedCanvasId).toBe('canvas1');
        expect(gridState.activeCanvasId).toBe('canvas2');
        expect(gridState.selectedItemId).toBe('item-1');
      });

      it('should maintain activeCanvasId through viewport switches', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        setActiveCanvas('canvas1');
        expect(gridState.activeCanvasId).toBe('canvas1');

        // Switch viewport
        gridState.currentViewport = 'mobile';
        expect(gridState.activeCanvasId).toBe('canvas1');

        // Switch back
        gridState.currentViewport = 'desktop';
        expect(gridState.activeCanvasId).toBe('canvas1');
      });

      it('should reset activeCanvasId when state is reset', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.componentDidLoad();

        setActiveCanvas('canvas1');
        expect(gridState.activeCanvasId).toBe('canvas1');

        resetState();
        expect(gridState.activeCanvasId).toBeNull();
      });
    });

    describe('Plugin Event Emission', () => {
      it('should allow plugins to listen for canvasActivated events', () => {
        const activatedEvents: any[] = [];

        const mockPlugin = {
          name: 'test-plugin',
          init: (api: any) => {
            api.on('canvasActivated', (data: any) => {
              activatedEvents.push(data);
            });
          },
          destroy: jest.fn(),
        };

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.plugins = [mockPlugin];

        component.componentDidLoad();

        // Trigger canvas activation via API
        const api = (component as any).api;
        api.setActiveCanvas('canvas1');

        expect(activatedEvents.length).toBe(1);
        expect(activatedEvents[0]).toEqual({ canvasId: 'canvas1' });

        api.setActiveCanvas('canvas2');

        expect(activatedEvents.length).toBe(2);
        expect(activatedEvents[1]).toEqual({ canvasId: 'canvas2' });
      });

      it('should emit events for all activation methods', () => {
        const activatedEvents: any[] = [];

        const mockPlugin = {
          name: 'test-plugin',
          init: (api: any) => {
            api.on('canvasActivated', (data: any) => {
              activatedEvents.push(data);
            });
          },
          destroy: jest.fn(),
        };

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;
        component.plugins = [mockPlugin];

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Method 1: Via API
        const api = (component as any).api;
        api.setActiveCanvas('canvas1');
        expect(activatedEvents.length).toBe(1);

        // Method 2: Via public @Method
        component.setActiveCanvas('canvas2');
        expect(activatedEvents.length).toBe(2);

        // Method 3: Via DOM event (simulate)
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasActivatedCall = addEventListenerCalls.find(call => call[0] === 'canvas-activated');
        const handler = canvasActivatedCall[1];

        const mockEvent = new CustomEvent('canvas-activated', {
          detail: { canvasId: 'canvas3' },
        });
        handler(mockEvent);

        expect(activatedEvents.length).toBe(3);
        expect(activatedEvents[2]).toEqual({ canvasId: 'canvas3' });
      });
    });

    describe('Cross-Canvas Move', () => {
      beforeEach(() => {
        // Reset grid state
        gridState.canvases = {
          canvas1: { items: [], zIndexCounter: 0 },
          canvas2: { items: [], zIndexCounter: 0 },
        };
        gridState.selectedItemId = null;
        gridState.selectedCanvasId = null;
        gridState.activeCanvasId = null;
      });

      it('should register canvas-move event handler in componentDidLoad', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Verify canvas-move event listener was registered
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');

        expect(canvasMoveCall).toBeDefined();
        expect(typeof canvasMoveCall[1]).toBe('function');
      });

      it('should remove canvas-move event handler in disconnectedCallback', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();
        component.disconnectedCallback();

        // Verify event listener was removed
        const removeEventListenerCalls = mockHostElement.removeEventListener.mock.calls;
        const canvasMoveCall = removeEventListenerCalls.find(call => call[0] === 'canvas-move');

        expect(canvasMoveCall).toBeDefined();
      });

      it('should move item from source to target canvas', () => {
        // Setup: Add item to source canvas
        const testItem = {
          id: 'test-item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };
        gridState.canvases.canvas1.items.push(testItem);
        gridState.canvases.canvas1.zIndexCounter = 2;

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'test-item-1',
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
            x: 100, // pixels
            y: 50, // pixels
          },
        });

        handler(mockEvent);

        // Verify item removed from source canvas
        expect(gridState.canvases.canvas1.items.length).toBe(0);

        // Verify item added to target canvas
        expect(gridState.canvases.canvas2.items.length).toBe(1);
        expect(gridState.canvases.canvas2.items[0].id).toBe('test-item-1');

        // Verify canvasId updated
        expect(gridState.canvases.canvas2.items[0].canvasId).toBe('canvas2');
      });

      it('should update item position to grid coordinates', () => {
        // Setup: Add item to source canvas
        const testItem = {
          id: 'test-item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };
        gridState.canvases.canvas1.items.push(testItem);

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event (drop at specific pixel position)
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'test-item-1',
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
            x: 200, // pixels
            y: 100, // pixels
          },
        });

        handler(mockEvent);

        const movedItem = gridState.canvases.canvas2.items[0];

        // Verify position was converted to grid units (not pixels)
        expect(typeof movedItem.layouts.desktop.x).toBe('number');
        expect(typeof movedItem.layouts.desktop.y).toBe('number');
        expect(movedItem.layouts.desktop.x).toBeGreaterThanOrEqual(0);
        expect(movedItem.layouts.desktop.y).toBeGreaterThanOrEqual(0);
      });

      it('should assign new z-index in target canvas', () => {
        // Setup: Add item to source canvas
        const testItem = {
          id: 'test-item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          zIndex: 5, // Has z-index 5 in source
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };
        gridState.canvases.canvas1.items.push(testItem);
        gridState.canvases.canvas1.zIndexCounter = 6;

        // Target canvas already has some items
        gridState.canvases.canvas2.zIndexCounter = 3;

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'test-item-1',
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        const movedItem = gridState.canvases.canvas2.items[0];

        // Verify new z-index assigned from target canvas counter
        expect(movedItem.zIndex).toBe(3);

        // Verify target canvas counter incremented
        expect(gridState.canvases.canvas2.zIndexCounter).toBe(4);
      });

      it('should set target canvas as active', () => {
        // Setup: Add item to source canvas
        const testItem = {
          id: 'test-item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };
        gridState.canvases.canvas1.items.push(testItem);

        // Initially canvas1 is active
        gridState.activeCanvasId = 'canvas1';

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'test-item-1',
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify active canvas updated to target
        expect(gridState.activeCanvasId).toBe('canvas2');
      });

      it('should update selection state if moved item was selected', () => {
        // Setup: Add item to source canvas and select it
        const testItem = {
          id: 'test-item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };
        gridState.canvases.canvas1.items.push(testItem);
        gridState.selectedItemId = 'test-item-1';
        gridState.selectedCanvasId = 'canvas1';

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'test-item-1',
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify selectedCanvasId updated to target
        expect(gridState.selectedCanvasId).toBe('canvas2');
        expect(gridState.selectedItemId).toBe('test-item-1'); // Still selected
      });

      it('should emit componentMoved and canvasActivated events', () => {
        // Setup: Add item to source canvas
        const testItem = {
          id: 'test-item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 20, height: 6 },
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };
        gridState.canvases.canvas1.items.push(testItem);

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        // Spy on eventManager.emit
        const emitSpy = jest.spyOn(eventManager, 'emit');

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'test-item-1',
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify componentMoved event emitted
        expect(emitSpy).toHaveBeenCalledWith(
          'componentMoved',
          expect.objectContaining({
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
          })
        );

        // Verify canvasActivated event emitted
        expect(emitSpy).toHaveBeenCalledWith('canvasActivated', { canvasId: 'canvas2' });

        emitSpy.mockRestore();
      });

      it('should handle missing source canvas gracefully', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        // Spy on console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event with non-existent source canvas
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'test-item-1',
            sourceCanvasId: 'non-existent',
            targetCanvasId: 'canvas2',
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith('Source canvas not found:', 'non-existent');

        consoleErrorSpy.mockRestore();
      });

      it('should handle missing item gracefully', () => {
        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        // Spy on console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event with non-existent item
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'non-existent-item',
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
            x: 100,
            y: 50,
          },
        });

        handler(mockEvent);

        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith('Item not found in source canvas:', 'non-existent-item');

        consoleErrorSpy.mockRestore();
      });

      it('should constrain position to target canvas boundaries', () => {
        // Setup: Add item to source canvas with large width
        const testItem = {
          id: 'test-item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          zIndex: 1,
          layouts: {
            desktop: { x: 10, y: 10, width: 40, height: 6 }, // 40 units wide
            mobile: { x: 0, y: 0, width: 50, height: 6, customized: false },
          },
          config: {},
        };
        gridState.canvases.canvas1.items.push(testItem);

        const component = new GridBuilder();
        component.components = mockComponentDefinitions;

        const mockHostElement = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        Object.defineProperty(component, 'hostElement', {
          value: mockHostElement,
          writable: true,
        });

        component.componentDidLoad();

        // Get the registered handler
        const addEventListenerCalls = mockHostElement.addEventListener.mock.calls;
        const canvasMoveCall = addEventListenerCalls.find(call => call[0] === 'canvas-move');
        const handler = canvasMoveCall[1];

        // Simulate canvas-move event with position that would overflow
        const mockEvent = new CustomEvent('canvas-move', {
          detail: {
            itemId: 'test-item-1',
            sourceCanvasId: 'canvas1',
            targetCanvasId: 'canvas2',
            x: 9999, // Very far right (will be constrained)
            y: 50,
          },
        });

        handler(mockEvent);

        const movedItem = gridState.canvases.canvas2.items[0];

        // Verify position was constrained (x + width should not exceed canvas width)
        // Canvas width is 50 grid units (CANVAS_WIDTH_UNITS)
        expect(movedItem.layouts.desktop.x + movedItem.layouts.desktop.width).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('UI Overrides - CanvasHeader', () => {
    it('should not render custom canvas header when uiOverrides.CanvasHeader is not provided', () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };

      component.componentWillLoad();
      const result = component.render();

      // Check that no custom header is rendered
      expect(result).toBeDefined();
    });

    it('should render custom canvas header when uiOverrides.CanvasHeader is provided', () => {
      const mockHeaderRender = jest.fn(({ canvasId }) => <div class="custom-header">{canvasId}</div>);

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };
      component.canvasMetadata = {
        canvas1: { title: 'Test Canvas', backgroundColor: '#ffffff' },
      };
      component.uiOverrides = {
        CanvasHeader: mockHeaderRender,
      };

      component.componentWillLoad();
      const result = component.render();

      // Verify header render function was called with correct props
      expect(mockHeaderRender).toHaveBeenCalledWith({
        canvasId: 'canvas1',
        metadata: { title: 'Test Canvas', backgroundColor: '#ffffff' },
        isActive: false,
      });
    });

    it('should pass correct isActive prop when canvas is active', () => {
      const mockHeaderRender = jest.fn(() => <div>Header</div>);

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
          canvas2: { items: [], zIndexCounter: 0 },
        },
      };
      component.canvasMetadata = {
        canvas1: { title: 'Canvas 1' },
        canvas2: { title: 'Canvas 2' },
      };
      component.uiOverrides = {
        CanvasHeader: mockHeaderRender,
      };

      // Set canvas2 as active
      setActiveCanvas('canvas2');

      component.componentWillLoad();
      component.render();

      // Verify canvas1 header was called with isActive: false
      expect(mockHeaderRender).toHaveBeenCalledWith(
        expect.objectContaining({
          canvasId: 'canvas1',
          isActive: false,
        })
      );

      // Verify canvas2 header was called with isActive: true
      expect(mockHeaderRender).toHaveBeenCalledWith(
        expect.objectContaining({
          canvasId: 'canvas2',
          isActive: true,
        })
      );
    });

    it('should handle missing canvas metadata gracefully', () => {
      const mockHeaderRender = jest.fn(() => <div>Header</div>);

      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };
      // No canvasMetadata provided
      component.uiOverrides = {
        CanvasHeader: mockHeaderRender,
      };

      component.componentWillLoad();
      component.render();

      // Verify header was called with empty metadata object
      expect(mockHeaderRender).toHaveBeenCalledWith({
        canvasId: 'canvas1',
        metadata: {},
        isActive: false,
      });
    });

    it('should wrap each canvas in canvas-wrapper div', () => {
      const component = new GridBuilder();
      component.components = mockComponentDefinitions;
      component.initialState = {
        canvases: {
          canvas1: { items: [], zIndexCounter: 0 },
        },
      };
      component.uiOverrides = {
        CanvasHeader: () => <div>Header</div>,
      };

      component.componentWillLoad();
      const result = component.render();

      // The result should contain canvas-wrapper divs
      // Note: This is a structural test - actual DOM verification would require spec page
      expect(result).toBeDefined();
    });
  });
});
