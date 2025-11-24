/**
 * Component Palette Tests
 * ========================
 *
 * Comprehensive tests for component-palette component including:
 * - Rendering component list
 * - Click-to-add functionality
 * - Keyboard accessibility
 * - Event dispatching
 * - Config-based feature toggling
 */

import { newSpecPage } from '@stencil/core/testing';
import { ComponentPalette } from './component-palette';
import { ComponentDefinition } from '../../types/component-definition';

describe('ComponentPalette', () => {
  // Mock component definitions for testing
  const mockComponents: ComponentDefinition[] = [
    {
      type: 'header',
      name: 'Header',
      icon: '📄',
      defaultSize: { width: 20, height: 8 },
      render: () => <div>Header</div>,
      renderDragClone: () => <div>Header Clone</div>,
    },
    {
      type: 'text',
      name: 'Text Block',
      icon: '📝',
      defaultSize: { width: 15, height: 10 },
      render: () => <div>Text</div>,
      renderDragClone: () => <div>Text Clone</div>,
    },
    {
      type: 'button',
      name: 'Button',
      icon: '🔘',
      defaultSize: { width: 10, height: 5 },
      render: () => <div>Button</div>,
      renderDragClone: () => <div>Button Clone</div>,
    },
  ];

  describe('rendering', () => {
    it('should render with components prop', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      expect(page.root).toBeDefined();
      expect(page.root.shadowRoot).toBeDefined();
    });

    it('should render all palette items', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');
      expect(paletteItems.length).toBe(3);
    });

    it('should render component names and icons', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');

      // Check first item (Header)
      expect(paletteItems[0].textContent).toContain('📄');
      expect(paletteItems[0].textContent).toContain('Header');

      // Check second item (Text Block)
      expect(paletteItems[1].textContent).toContain('📝');
      expect(paletteItems[1].textContent).toContain('Text Block');
    });

    it('should set data-component-type attribute on palette items', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');

      expect(paletteItems[0].getAttribute('data-component-type')).toBe('header');
      expect(paletteItems[1].getAttribute('data-component-type')).toBe('text');
      expect(paletteItems[2].getAttribute('data-component-type')).toBe('button');
    });

    it('should render with showHeader=true by default', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const header = page.root.querySelector('h2');
      expect(header).not.toBeNull();
      expect(header.textContent).toBe('Components');
    });

    it('should not render header when showHeader=false', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette show-header="false"></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const header = page.root.querySelector('h2');
      expect(header).toBeNull();
    });

    it('should show empty state message when no components provided', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = [];
      await page.waitForChanges();

      const emptyMessage = page.root.querySelector('.palette-empty');
      expect(emptyMessage).not.toBeNull();
      expect(emptyMessage.textContent).toContain('No components available');
    });
  });

  describe('accessibility', () => {
    it('should set role="button" on palette items', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');
      paletteItems.forEach((item) => {
        expect(item.getAttribute('role')).toBe('button');
      });
    });

    it('should set tabindex=0 on palette items', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');
      paletteItems.forEach((item) => {
        expect(item.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should set aria-label on palette items', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');

      // Updated to match improved aria-label format (mentions both click and drag)
      expect(paletteItems[0].getAttribute('aria-label')).toBe('Header component. Click to add to active canvas or drag to position');
      expect(paletteItems[1].getAttribute('aria-label')).toBe('Text Block component. Click to add to active canvas or drag to position');
      expect(paletteItems[2].getAttribute('aria-label')).toBe('Button component. Click to add to active canvas or drag to position');
    });

    it('should set toolbar role on palette container', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const palette = page.root.querySelector('.palette');
      // Updated to match improved semantic role (toolbar instead of region)
      expect(palette.getAttribute('role')).toBe('toolbar');
      expect(palette.getAttribute('aria-label')).toBe('Component palette');
      expect(palette.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should use custom paletteLabel when provided', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette palette-label="Media components"></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const palette = page.root.querySelector('.palette');
      expect(palette.getAttribute('aria-label')).toBe('Media components');
    });

    it('should set aria-describedby on palette items with unique ID', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');
      const firstItemDescribedBy = paletteItems[0].getAttribute('aria-describedby');

      // Should use unique ID pattern: palette-help-{timestamp}-{random}
      expect(firstItemDescribedBy).toMatch(/^palette-help-\d+-[a-z0-9]+$/);

      // All items should reference the same help text ID
      paletteItems.forEach(item => {
        expect(item.getAttribute('aria-describedby')).toBe(firstItemDescribedBy);
      });

      // The referenced help text element should exist
      const helpText = page.root.querySelector(`#${firstItemDescribedBy}`);
      expect(helpText).not.toBeNull();
      expect(helpText.classList.contains('sr-only')).toBe(true);
    });

    it('should have unique help text IDs across multiple instances', async () => {
      // Create first palette instance
      const page1 = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });
      page1.root.components = mockComponents;
      await page1.waitForChanges();

      // Create second palette instance
      const page2 = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });
      page2.root.components = mockComponents;
      await page2.waitForChanges();

      // Get help text IDs from both palettes
      const helpText1 = page1.root.querySelector('.sr-only');
      const helpText2 = page2.root.querySelector('.sr-only');

      // Both should exist
      expect(helpText1).not.toBeNull();
      expect(helpText2).not.toBeNull();

      // IDs should be different (no conflicts)
      expect(helpText1.id).not.toBe(helpText2.id);

      // Both should match the pattern
      expect(helpText1.id).toMatch(/^palette-help-\d+-[a-z0-9]+$/);
      expect(helpText2.id).toMatch(/^palette-help-\d+-[a-z0-9]+$/);
    });

    it('should set aria-pressed to false when not dragging', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');
      paletteItems.forEach(item => {
        expect(item.getAttribute('aria-pressed')).toBe('false');
      });
    });

    it('should include help text for screen readers', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Help text now has unique ID - find it by class instead
      const helpText = page.root.querySelector('.sr-only');
      expect(helpText).toBeDefined();
      expect(helpText.textContent).toContain('Click or press Enter/Space to add component to active canvas');
      expect(helpText.textContent).toContain('or drag to position on any canvas');
      expect(helpText.classList.contains('sr-only')).toBe(true);

      // Verify ID follows unique pattern
      expect(helpText.id).toMatch(/^palette-help-\d+-[a-z0-9]+$/);
    });

    it('should show drag-only help text when enableClickToAdd is false', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      page.root.config = { enableClickToAdd: false };
      await page.waitForChanges();

      // Help text now has unique ID - find it by class instead
      const helpText = page.root.querySelector('.sr-only');
      expect(helpText.textContent).toBe('Drag component to canvas to add');
    });

    it('should use drag-only aria-label when enableClickToAdd is false', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      page.root.config = { enableClickToAdd: false };
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');
      expect(paletteItems[0].getAttribute('aria-label')).toBe('Header component. Drag to canvas');
      expect(paletteItems[1].getAttribute('aria-label')).toBe('Text Block component. Drag to canvas');
      expect(paletteItems[2].getAttribute('aria-label')).toBe('Button component. Drag to canvas');
    });

    it('should set aria-live and role on empty state message', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = [];
      await page.waitForChanges();

      const emptyMessage = page.root.querySelector('.palette-empty');
      expect(emptyMessage.getAttribute('role')).toBe('status');
      expect(emptyMessage.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('click-to-add functionality', () => {
    it('should dispatch palette-item-click event when item is clicked', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      let eventDetail: any = null;
      page.root.addEventListener('palette-item-click', (e: CustomEvent) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      // Click first palette item (Header)
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      paletteItem.click();

      // Wait for event to propagate
      await page.waitForChanges();

      expect(eventFired).toBe(true);
      expect(eventDetail).not.toBeNull();
      expect(eventDetail.componentType).toBe('header');
    });

    it('should dispatch correct component type for each palette item', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');
      const expectedTypes = ['header', 'text', 'button'];

      for (let i = 0; i < paletteItems.length; i++) {
        let eventDetail: any = null;

        page.root.addEventListener('palette-item-click', (e: CustomEvent) => {
          eventDetail = e.detail;
        });

        (paletteItems[i] as HTMLElement).click();
        await page.waitForChanges();

        expect(eventDetail.componentType).toBe(expectedTypes[i]);
      }
    });

    it('should not dispatch event when enableClickToAdd is false', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      page.root.config = { enableClickToAdd: false };
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      page.root.addEventListener('palette-item-click', () => {
        eventFired = true;
      });

      // Click palette item
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      paletteItem.click();
      await page.waitForChanges();

      expect(eventFired).toBe(false);
    });

    it('should dispatch event when enableClickToAdd is true', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      page.root.config = { enableClickToAdd: true };
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      page.root.addEventListener('palette-item-click', () => {
        eventFired = true;
      });

      // Click palette item
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      paletteItem.click();
      await page.waitForChanges();

      expect(eventFired).toBe(true);
    });

    it('should dispatch event by default when config is not provided', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      // No config provided - should default to enabled
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      page.root.addEventListener('palette-item-click', () => {
        eventFired = true;
      });

      // Click palette item
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      paletteItem.click();
      await page.waitForChanges();

      expect(eventFired).toBe(true);
    });

    it('should set event.bubbles to true', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Setup event listener
      let event: Event = null;
      page.root.addEventListener('palette-item-click', (e: Event) => {
        event = e;
      });

      // Click palette item
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      paletteItem.click();
      await page.waitForChanges();

      expect(event).not.toBeNull();
      expect(event.bubbles).toBe(true);
    });

    it('should set event.composed to true', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Setup event listener
      let event: Event = null;
      page.root.addEventListener('palette-item-click', (e: Event) => {
        event = e;
      });

      // Click palette item
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      paletteItem.click();
      await page.waitForChanges();

      expect(event).not.toBeNull();
      expect(event.composed).toBe(true);
    });
  });

  describe('keyboard navigation', () => {
    it('should dispatch event when Enter key is pressed', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      let eventDetail: any = null;
      page.root.addEventListener('palette-item-click', (e: CustomEvent) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      // Press Enter key on first palette item
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      paletteItem.dispatchEvent(keyEvent);
      await page.waitForChanges();

      expect(eventFired).toBe(true);
      expect(eventDetail.componentType).toBe('header');
    });

    it('should dispatch event when Space key is pressed', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      let eventDetail: any = null;
      page.root.addEventListener('palette-item-click', (e: CustomEvent) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      // Press Space key on first palette item
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      const keyEvent = new KeyboardEvent('keydown', { key: ' ' });
      paletteItem.dispatchEvent(keyEvent);
      await page.waitForChanges();

      expect(eventFired).toBe(true);
      expect(eventDetail.componentType).toBe('header');
    });

    it('should not dispatch event for other keys', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      page.root.addEventListener('palette-item-click', () => {
        eventFired = true;
      });

      // Press various non-activation keys
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      const keys = ['a', 'Escape', 'ArrowDown', 'Tab'];

      for (const key of keys) {
        const keyEvent = new KeyboardEvent('keydown', { key });
        paletteItem.dispatchEvent(keyEvent);
        await page.waitForChanges();

        expect(eventFired).toBe(false);
      }
    });

    it('should not dispatch keyboard event when enableClickToAdd is false', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      page.root.config = { enableClickToAdd: false };
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      page.root.addEventListener('palette-item-click', () => {
        eventFired = true;
      });

      // Press Enter key
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      paletteItem.dispatchEvent(keyEvent);
      await page.waitForChanges();

      expect(eventFired).toBe(false);
    });
  });

  describe('drag state management', () => {
    it('should not dispatch click event when dragging', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Set dragging state
      page.rootInstance.draggingItemType = 'header';
      await page.waitForChanges();

      // Setup event listener
      let eventFired = false;
      page.root.addEventListener('palette-item-click', () => {
        eventFired = true;
      });

      // Click palette item
      const paletteItem = page.root.querySelector('.palette-item') as HTMLElement;
      paletteItem.click();
      await page.waitForChanges();

      expect(eventFired).toBe(false);
    });

    it('should add dragging-from-palette class when dragging', async () => {
      const page = await newSpecPage({
        components: [ComponentPalette],
        html: `<component-palette></component-palette>`,
      });

      page.root.components = mockComponents;
      await page.waitForChanges();

      // Set dragging state for header
      page.rootInstance.draggingItemType = 'header';
      await page.waitForChanges();

      const paletteItems = page.root.querySelectorAll('.palette-item');

      // First item (header) should have dragging class
      expect(paletteItems[0].classList.contains('dragging-from-palette')).toBe(true);

      // Other items should not
      expect(paletteItems[1].classList.contains('dragging-from-palette')).toBe(false);
      expect(paletteItems[2].classList.contains('dragging-from-palette')).toBe(false);
    });
  });
});
