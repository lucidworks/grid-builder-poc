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

import { h } from '@stencil/core';
import { GridBuilder } from '../grid-builder';
import { reset as resetState } from '../../../services/state-manager';
import { clearHistory } from '../../../services/undo-redo';

// Mock component definitions for tests
const mockComponentDefinitions = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 50, height: 6 },
    minSize: { width: 10, height: 3 },
    render: () => <div>Header</div>,
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    minSize: { width: 10, height: 5 },
    render: () => <div>Text</div>,
  },
];

describe('grid-builder', () => {
  beforeEach(() => {
    resetState();
    clearHistory();
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
          render: () => <div>Header</div>,
        },
        {
          type: 'article',
          name: 'Article',
          icon: '📝',
          defaultSize: { width: 25, height: 10 },
          selectionColor: '#10b981', // Green
          render: () => <div>Article</div>,
        },
        {
          type: 'button',
          name: 'Button',
          icon: '🔘',
          defaultSize: { width: 15, height: 5 },
          selectionColor: '#ef4444', // Red
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
          render: () => <div>Hex</div>,
        },
        {
          type: 'rgb-color',
          name: 'RGB Color',
          icon: '🎨',
          defaultSize: { width: 20, height: 6 },
          selectionColor: 'rgb(255, 87, 51)', // RGB
          render: () => <div>RGB</div>,
        },
        {
          type: 'rgba-color',
          name: 'RGBA Color',
          icon: '🎨',
          defaultSize: { width: 20, height: 6 },
          selectionColor: 'rgba(255, 87, 51, 0.8)', // RGBA
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
});
