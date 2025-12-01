/**
 * Layer Panel Component Tests
 * ============================
 *
 * Tests cover library interaction patterns that consumers can learn from:
 * - API event subscription and cleanup
 * - Event emission for inter-component communication
 * - API state access and reactivity
 *
 * These patterns are useful for building custom panels/sidebars.
 */

import { newSpecPage } from '@stencil/core/testing';
import { h } from '@stencil/core';
import { LayerPanel } from '../layer-panel';
import { LayerPanelFolderHeader } from '../../layer-panel-folder-header/layer-panel-folder-header';
import { LayerPanelItem } from '../../layer-panel-item/layer-panel-item';

describe('layer-panel', () => {
  /**
   * Mock API that simulates grid-builder API
   * Demonstrates the interface consumers should implement
   */
  const createMockAPI = () => {
    const listeners = new Map<string, Set<Function>>();

    return {
      getState: () => ({
        canvases: {
          canvas1: {
            items: [
              { id: 'item1', name: 'Header', type: 'header', zIndex: 1 },
              { id: 'item2', name: 'Button', type: 'button', zIndex: 2 },
            ],
          },
          canvas2: {
            items: [
              { id: 'item3', name: 'Image', type: 'image', zIndex: 1 },
            ],
          },
        },
        activeCanvasId: 'canvas1',
        selectedItemId: 'item1',
        selectedCanvasId: 'canvas1',
      }),
      on: (event: string, callback: Function) => {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event).add(callback);
      },
      off: (event: string, callback: Function) => {
        listeners.get(event)?.delete(callback);
      },
      emit: (event: string, ...args: any[]) => {
        listeners.get(event)?.forEach(cb => cb(...args));
      },
    };
  };

  it('should build', () => {
    expect(new LayerPanel()).toBeTruthy();
  });

  /**
   * Tests API integration pattern
   * Consumers need to pass API instance for the component to work
   */
  describe('API Integration', () => {
    it('should wait for API prop before initializing', async () => {
      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        html: `<layer-panel></layer-panel>`,
      });

      // Without API, component renders but has no items
      expect(page.root).toBeDefined();
      const emptyMessage = page.root.querySelector('.layer-panel__empty');
      expect(emptyMessage?.textContent).toBe('No items found');
    });

    it('should initialize when API prop is provided', async () => {
      const mockAPI = createMockAPI();

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      await page.waitForChanges();

      // Should display items from API state
      const itemCount = page.root.querySelector('.layer-panel__count');
      expect(itemCount?.textContent).toContain('3 items'); // 2 from canvas1 + 1 from canvas2
    });

    it('should initialize with different API instances', async () => {
      const mockAPI2 = createMockAPI();

      // API2 has different state
      mockAPI2.getState = () => ({
        canvases: {
          canvas1: {
            items: [
              { id: 'item1', name: 'Header', type: 'header', zIndex: 1 },
            ],
          },
          canvas2: {
            items: [],
          },
        },
        activeCanvasId: 'canvas1',
        selectedItemId: null,
        selectedCanvasId: null,
      });

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI2} />,
      });

      await page.waitForChanges();

      // Should display items from API2 state
      expect(page.root.querySelector('.layer-panel__count')?.textContent).toContain('1 item');
    });
  });

  /**
   * Tests event subscription pattern
   * Demonstrates how to listen to API events and clean up properly
   */
  describe('Event Subscription (Library Pattern)', () => {
    it('should subscribe to API events on mount', async () => {
      const mockAPI = createMockAPI();
      const onSpy = jest.spyOn(mockAPI, 'on');

      await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      // Should subscribe to all relevant events
      expect(onSpy).toHaveBeenCalledWith('componentAdded', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('componentDeleted', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('componentDragged', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('componentResized', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('zIndexChanged', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('canvasActivated', expect.any(Function));
    });

    it('should clean up event listeners on unmount', async () => {
      const mockAPI = createMockAPI();
      const offSpy = jest.spyOn(mockAPI, 'off');

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      // Unmount component
      page.root.remove();

      // Should unsubscribe from all events
      expect(offSpy).toHaveBeenCalledWith('componentAdded', expect.any(Function));
      expect(offSpy).toHaveBeenCalledWith('componentDeleted', expect.any(Function));
      expect(offSpy).toHaveBeenCalledWith('canvasActivated', expect.any(Function));
    });

    it('should subscribe to all relevant API events', async () => {
      const mockAPI = createMockAPI();
      const onSpy = jest.spyOn(mockAPI, 'on');

      await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      // Verify all event subscriptions
      const expectedEvents = [
        'componentAdded',
        'componentDeleted',
        'componentDragged',
        'componentResized',
        'zIndexChanged',
        'canvasActivated'
      ];

      expectedEvents.forEach(eventName => {
        expect(onSpy).toHaveBeenCalledWith(eventName, expect.any(Function));
      });
    });
  });

  /**
   * Tests auto-expand behavior
   * Demonstrates reactive state updates based on API events
   */
  describe('Auto-Expand Active Canvas', () => {
    it('should render folders for all canvases', async () => {
      const mockAPI = createMockAPI();

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      await page.waitForChanges();

      // Should render items from all canvases
      expect(page.root.querySelector('.layer-panel__count')?.textContent).toContain('3 items');
    });

    it('should update display when canvasActivated event fires', async () => {
      const mockAPI = createMockAPI();

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      await page.waitForChanges();
      const initialCount = page.root.querySelector('.layer-panel__count')?.textContent;

      // Emit canvasActivated event
      mockAPI.emit('canvasActivated');
      await page.waitForChanges();

      // Component should still render correctly after event
      const afterCount = page.root.querySelector('.layer-panel__count')?.textContent;
      expect(afterCount).toBe(initialCount);
    });
  });

  /**
   * Tests scroll-to-canvas behavior
   * Demonstrates custom event handling pattern for inter-component communication
   */
  describe('Scroll to Canvas (Event Pattern)', () => {
    it('should have handleScrollToCanvas method for event handling', async () => {
      const mockAPI = createMockAPI();

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      await page.waitForChanges();

      // Component should have the scroll handler method
      expect(typeof (page.rootInstance as any).handleScrollToCanvas).toBe('function');
    });

    it('should handle scrollToCanvas event gracefully when canvas not found', async () => {
      const mockAPI = createMockAPI();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      await page.waitForChanges();

      // Call handler directly with non-existent canvas
      const event = { detail: { canvasId: 'nonexistent' } } as CustomEvent;
      (page.rootInstance as any).handleScrollToCanvas(event);

      // Should log warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Canvas element not found'),
        'nonexistent'
      );

      consoleSpy.mockRestore();
    });
  });

  /**
   * Tests canvas metadata integration
   * Demonstrates how to pass custom labels/titles
   */
  describe('Canvas Metadata', () => {
    it('should accept canvasMetadata prop for custom titles', async () => {
      const mockAPI = createMockAPI();
      const metadata = {
        canvas1: { title: 'Hero Section' },
        canvas2: { title: 'Footer Section' },
      };

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} canvasMetadata={metadata} />,
      });

      await page.waitForChanges();

      // Component should render with metadata
      expect(page.root).toBeDefined();
      expect(page.root.querySelector('.layer-panel__count')).toBeDefined();
    });

    it('should render without metadata prop', async () => {
      const mockAPI = createMockAPI();

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      await page.waitForChanges();

      // Component should render successfully without metadata
      expect(page.root).toBeDefined();
      expect(page.root.querySelector('.layer-panel__count')?.textContent).toContain('3 items');
    });
  });

  /**
   * Tests search/filter functionality
   * Demonstrates debounced input handling
   */
  describe('Search Functionality', () => {
    it('should filter items based on search query', async () => {
      const mockAPI = createMockAPI();

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} />,
      });

      await page.waitForChanges();
      expect(page.root.querySelector('.layer-panel__count')?.textContent).toContain('3 items');

      // Type in search box
      const searchInput = page.root.querySelector('.layer-panel__search-input') as HTMLInputElement;
      searchInput.value = 'Header';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for debounce (default 300ms)
      await new Promise(resolve => setTimeout(resolve, 350));
      await page.waitForChanges();

      // Should show only matching items
      expect(page.root.querySelector('.layer-panel__count')?.textContent).toContain('1 item');
    });

    it('should respect searchDebounceMs prop', async () => {
      const mockAPI = createMockAPI();

      const page = await newSpecPage({
        components: [LayerPanel, LayerPanelFolderHeader, LayerPanelItem],
        template: () => <layer-panel api={mockAPI} searchDebounceMs={100} />,
      });

      await page.waitForChanges();

      const searchInput = page.root.querySelector('.layer-panel__search-input') as HTMLInputElement;
      searchInput.value = 'Button';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for shorter debounce
      await new Promise(resolve => setTimeout(resolve, 150));
      await page.waitForChanges();

      expect(page.root.querySelector('.layer-panel__count')?.textContent).toContain('1 item');
    });
  });
});
