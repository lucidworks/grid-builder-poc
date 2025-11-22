/**
 * Config Panel Component Tests
 * =============================
 *
 * Tests for the config-panel component including:
 * - Auto-close behavior when selected item is deleted
 * - Event subscription and cleanup
 * - Lifecycle methods
 */

import { h } from '@stencil/core';
import { ConfigPanel } from '../config-panel';
import { eventManager } from '../../../../services/event-manager';
import { gridState, reset as resetState } from '../../../../services/state-manager';

// Mock component definitions for tests
const mockComponentDefinitions = [
  {
    type: 'header',
    name: 'Header',
    icon: '📄',
    defaultSize: { width: 50, height: 6 },
    render: () => <div>Header</div>,
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: '📝',
    defaultSize: { width: 25, height: 10 },
    render: () => <div>Text</div>,
  },
];

describe('config-panel', () => {
  beforeEach(() => {
    resetState();
    // Clear any existing event listeners
    eventManager['listeners'] = new Map();
  });

  describe('Component Instantiation', () => {
    it('should create component instance', () => {
      const component = new ConfigPanel();
      expect(component).toBeTruthy();
      expect(component).toBeInstanceOf(ConfigPanel);
    });

    it('should initialize with panel closed', () => {
      const component = new ConfigPanel();
      expect(component.isOpen).toBe(false);
      expect(component.selectedItemId).toBeNull();
      expect(component.selectedCanvasId).toBeNull();
    });
  });

  describe('Lifecycle Methods', () => {
    it('should have componentDidLoad method', () => {
      const component = new ConfigPanel();
      expect(typeof component.componentDidLoad).toBe('function');
    });

    it('should have disconnectedCallback method', () => {
      const component = new ConfigPanel();
      expect(typeof component.disconnectedCallback).toBe('function');
    });

    it('should subscribe to componentDeleted event on componentDidLoad', () => {
      const component = new ConfigPanel();
      const registry = new Map(mockComponentDefinitions.map((def) => [def.type, def]));
      component.componentRegistry = registry;

      component.componentDidLoad();

      // Verify subscription exists
      expect(eventManager['listeners'].get('componentDeleted')).toBeDefined();
      expect(eventManager['listeners'].get('componentDeleted')?.size).toBe(1);

      // Cleanup
      component.disconnectedCallback();
    });

    it('should unsubscribe from componentDeleted event on disconnectedCallback', () => {
      const component = new ConfigPanel();
      const registry = new Map(mockComponentDefinitions.map((def) => [def.type, def]));
      component.componentRegistry = registry;

      component.componentDidLoad();
      expect(eventManager['listeners'].get('componentDeleted')?.size).toBe(1);

      component.disconnectedCallback();
      // After unsubscribing the last listener, EventManager removes the key from the Map
      expect(eventManager['listeners'].get('componentDeleted')).toBeUndefined();
    });
  });

  describe('Auto-Close on Component Deletion', () => {
    it('should close panel when selected item is deleted', () => {
      const component = new ConfigPanel();
      const registry = new Map(mockComponentDefinitions.map((def) => [def.type, def]));
      component.componentRegistry = registry;

      // Initialize lifecycle
      component.componentDidLoad();

      // Add a test item to state
      gridState.canvases.canvas1.items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          layouts: {
            desktop: { x: 0, y: 0, width: 50, height: 6 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 1,
          config: {},
        },
      ];

      // Open panel for item-1
      component.isOpen = true;
      component.selectedItemId = 'item-1';
      component.selectedCanvasId = 'canvas1';

      expect(component.isOpen).toBe(true);

      // Emit componentDeleted event for item-1
      eventManager.emit('componentDeleted', { itemId: 'item-1', canvasId: 'canvas1' });

      // Panel should be closed
      expect(component.isOpen).toBe(false);
      expect(component.selectedItemId).toBeNull();
      expect(component.selectedCanvasId).toBeNull();

      // Cleanup
      component.disconnectedCallback();
    });

    it('should NOT close panel when different item is deleted', () => {
      const component = new ConfigPanel();
      const registry = new Map(mockComponentDefinitions.map((def) => [def.type, def]));
      component.componentRegistry = registry;

      // Initialize lifecycle
      component.componentDidLoad();

      // Add test items to state
      gridState.canvases.canvas1.items = [
        {
          id: 'item-1',
          canvasId: 'canvas1',
          type: 'header',
          name: 'Test Header',
          layouts: {
            desktop: { x: 0, y: 0, width: 50, height: 6 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 1,
          config: {},
        },
        {
          id: 'item-2',
          canvasId: 'canvas1',
          type: 'text',
          name: 'Test Text',
          layouts: {
            desktop: { x: 0, y: 10, width: 25, height: 10 },
            mobile: { x: null, y: null, width: null, height: null, customized: false },
          },
          zIndex: 1,
          config: {},
        },
      ];

      // Open panel for item-1
      component.isOpen = true;
      component.selectedItemId = 'item-1';
      component.selectedCanvasId = 'canvas1';

      expect(component.isOpen).toBe(true);

      // Emit componentDeleted event for item-2 (different item)
      eventManager.emit('componentDeleted', { itemId: 'item-2', canvasId: 'canvas1' });

      // Panel should still be open
      expect(component.isOpen).toBe(true);
      expect(component.selectedItemId).toBe('item-1');
      expect(component.selectedCanvasId).toBe('canvas1');

      // Cleanup
      component.disconnectedCallback();
    });

    it('should NOT crash when componentDeleted is emitted but panel is closed', () => {
      const component = new ConfigPanel();
      const registry = new Map(mockComponentDefinitions.map((def) => [def.type, def]));
      component.componentRegistry = registry;

      // Initialize lifecycle
      component.componentDidLoad();

      // Panel is closed (default state)
      expect(component.isOpen).toBe(false);

      // Emit componentDeleted event - should not crash
      expect(() => {
        eventManager.emit('componentDeleted', { itemId: 'item-1', canvasId: 'canvas1' });
      }).not.toThrow();

      // Panel should remain closed
      expect(component.isOpen).toBe(false);

      // Cleanup
      component.disconnectedCallback();
    });

    it('should NOT crash when componentDeleted is emitted but no item is selected', () => {
      const component = new ConfigPanel();
      const registry = new Map(mockComponentDefinitions.map((def) => [def.type, def]));
      component.componentRegistry = registry;

      // Initialize lifecycle
      component.componentDidLoad();

      // Panel is open but no item selected
      component.isOpen = true;
      component.selectedItemId = null;
      component.selectedCanvasId = null;

      // Emit componentDeleted event - should not crash
      expect(() => {
        eventManager.emit('componentDeleted', { itemId: 'item-1', canvasId: 'canvas1' });
      }).not.toThrow();

      // Panel should remain open with no selection
      expect(component.isOpen).toBe(true);
      expect(component.selectedItemId).toBeNull();

      // Cleanup
      component.disconnectedCallback();
    });
  });

  describe('Integration: Event Flow', () => {
    it('should handle complete lifecycle: open panel -> delete item -> panel closes', () => {
      const component = new ConfigPanel();
      const registry = new Map(mockComponentDefinitions.map((def) => [def.type, def]));
      component.componentRegistry = registry;

      // Initialize lifecycle
      component.componentDidLoad();

      // Add test item to state
      const testItem = {
        id: 'test-item',
        canvasId: 'canvas1',
        type: 'header',
        name: 'Test Header',
        layouts: {
          desktop: { x: 5, y: 5, width: 50, height: 6 },
          mobile: { x: null, y: null, width: null, height: null, customized: false },
        },
        zIndex: 1,
        config: { title: 'My Header' },
      };
      gridState.canvases.canvas1.items = [testItem];

      // Step 1: Panel is closed
      expect(component.isOpen).toBe(false);

      // Step 2: Open panel for the item
      component.isOpen = true;
      component.selectedItemId = 'test-item';
      component.selectedCanvasId = 'canvas1';
      component.componentName = 'Test Header';
      component.componentConfig = { title: 'My Header' };

      expect(component.isOpen).toBe(true);
      expect(component.selectedItemId).toBe('test-item');

      // Step 3: Delete the item (simulate deletion flow)
      eventManager.emit('componentDeleted', { itemId: 'test-item', canvasId: 'canvas1' });

      // Step 4: Panel should be closed
      expect(component.isOpen).toBe(false);
      expect(component.selectedItemId).toBeNull();
      expect(component.selectedCanvasId).toBeNull();

      // Cleanup
      component.disconnectedCallback();
    });
  });
});
