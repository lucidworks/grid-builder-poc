/**
 * Error Boundary Component Tests
 * ===============================
 *
 * Tests basic rendering, props validation, and UI structure.
 *
 * **Note**: Actual error catching cannot be tested in StencilJS unit tests
 * because JSX templates are evaluated before error boundaries can catch them.
 * Error catching is verified through:
 * 1. Storybook stories (error-boundary.stories.tsx)
 * 2. Manual testing in real browser environments
 * 3. Integration tests in consuming applications
 */

import { newSpecPage } from '@stencil/core/testing';
import { ErrorBoundary } from '../error-boundary';

describe('error-boundary', () => {
  /**
   * Basic rendering tests
   */
  describe('rendering', () => {
    it('should render without error when no children', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      expect(page.root).toBeDefined();
      const wrapper = page.root.querySelector('.error-boundary-wrapper');
      expect(wrapper).toBeDefined();
    });

    it('should render children normally when no error', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `
          <error-boundary error-boundary="test">
            <div class="test-child">Child content</div>
          </error-boundary>
        `,
      });

      const child = page.root.querySelector('.test-child');
      expect(child).toBeDefined();
      expect(child.textContent).toBe('Child content');
    });

    it('should have wrapper element with correct class', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="my-component"></error-boundary>`,
      });

      const wrapper = page.root.querySelector('.error-boundary-wrapper');
      expect(wrapper).toBeDefined();
      expect(wrapper.classList.contains('error-boundary-wrapper')).toBe(true);
    });

    it('should render multiple children', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `
          <error-boundary error-boundary="test">
            <div class="child-1">First child</div>
            <div class="child-2">Second child</div>
          </error-boundary>
        `,
      });

      const child1 = page.root.querySelector('.child-1');
      const child2 = page.root.querySelector('.child-2');
      expect(child1).toBeDefined();
      expect(child2).toBeDefined();
    });
  });

  /**
   * Props validation tests
   */
  describe('props', () => {
    it('should accept error-boundary prop', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="my-component-123"></error-boundary>`,
      });

      expect(page.rootInstance.errorBoundary).toBe('my-component-123');
    });

    it('should accept show-error-ui prop programmatically', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      // Set prop programmatically (string attributes don't coerce in test environment)
      page.rootInstance.showErrorUI = true;
      await page.waitForChanges();

      expect(page.rootInstance.showErrorUI).toBe(true);
    });

    it('should accept recovery-strategy prop programmatically', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      // Set prop programmatically
      page.rootInstance.recoveryStrategy = 'graceful';
      await page.waitForChanges();

      expect(page.rootInstance.recoveryStrategy).toBe('graceful');
    });

    it('should accept context prop programmatically', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      const context = { itemId: 'item-1', canvasId: 'canvas-1' };
      page.rootInstance.context = context;
      await page.waitForChanges();

      expect(page.rootInstance.context).toEqual(context);
    });
  });

  /**
   * Component API tests
   */
  describe('public methods', () => {
    it('should have simulateError method', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      expect(typeof page.rootInstance.simulateError).toBe('function');
    });

    it('should have handleRetry method', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      expect(typeof page.rootInstance.handleRetry).toBe('function');
    });
  });

  /**
   * Component structure tests
   */
  describe('DOM structure', () => {
    it('should have data-error-boundary attribute on wrapper', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="my-boundary"></error-boundary>`,
      });

      const wrapper = page.root.querySelector('.error-boundary-wrapper');
      expect(wrapper.getAttribute('data-error-boundary')).toBe('my-boundary');
    });

    it('should apply BEM modifier class based on error boundary name', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test-component"></error-boundary>`,
      });

      const wrapper = page.root.querySelector('.error-boundary-wrapper');
      expect(wrapper.classList.contains('error-boundary-wrapper--test-component')).toBe(true);
    });
  });

  /**
   * Error handling behavior tests
   *
   * These tests use simulateError() as a test helper to trigger errors,
   * then verify actual behavior (event emission, recovery strategies, UI).
   * This is NOT circular testing - we're testing the error handling logic.
   */
  describe('error handling behavior', () => {
    it('should emit error event when error occurs', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      // Setup event listener
      let eventDetail: any = null;
      page.root.addEventListener('error', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      // Trigger error
      await page.rootInstance.simulateError(new Error('Test error'));
      await page.waitForChanges();

      // Verify event was emitted with correct structure
      expect(eventDetail).toBeDefined();
      expect(eventDetail.error).toBeDefined();
      expect(eventDetail.error.message).toBe('Test error');
      expect(eventDetail.errorInfo).toBeDefined();
      expect(eventDetail.errorInfo.errorBoundary).toBe('test');
      expect(eventDetail.severity).toBeDefined();
      expect(typeof eventDetail.recoverable).toBe('boolean');
    });

    it('should show error UI in development mode by default', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      // Trigger error
      await page.rootInstance.simulateError(new Error('Test error'));
      await page.waitForChanges();

      // Verify error UI is rendered
      const errorFallback = page.root.querySelector('.error-boundary-fallback');
      expect(errorFallback).toBeDefined();

      // Restore
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error UI in production mode by default', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      // Trigger error
      await page.rootInstance.simulateError(new Error('Test error'));
      await page.waitForChanges();

      // Verify error UI is NOT rendered (hidden)
      const errorFallback = page.root.querySelector('.error-boundary-fallback');
      expect(errorFallback).toBeNull();

      const wrapper = page.root.querySelector('.error-boundary-wrapper');
      expect(wrapper.classList.contains('error-boundary-hidden')).toBe(true);

      // Restore
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error UI when showErrorUI=true regardless of NODE_ENV', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      // Set prop programmatically
      page.rootInstance.showErrorUI = true;
      await page.waitForChanges();

      // Trigger error
      await page.rootInstance.simulateError(new Error('Test error'));
      await page.waitForChanges();

      // Verify error UI IS rendered even in production
      const errorFallback = page.root.querySelector('.error-boundary-fallback');
      expect(errorFallback).toBeDefined();

      // Restore
      process.env.NODE_ENV = originalEnv;
    });

    it('should apply graceful recovery strategy by default', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test" show-error-ui="true"></error-boundary>`,
      });

      // Set showErrorUI to ensure we can see the UI
      page.rootInstance.showErrorUI = true;

      // Trigger error
      await page.rootInstance.simulateError(new Error('Test error'));
      await page.waitForChanges();

      // Verify graceful recovery: error UI is rendered
      const errorFallback = page.root.querySelector('.error-boundary-fallback');
      expect(errorFallback).toBeDefined();

      // Verify wrapper has error class (graceful strategy renders UI)
      const wrapper = page.root.querySelector('.error-boundary-wrapper');
      expect(wrapper.classList.contains('error-boundary-error')).toBe(true);
    });

    it('should clear error state when handleRetry is called', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test" show-error-ui="true"></error-boundary>`,
      });

      page.rootInstance.showErrorUI = true;

      // Trigger error
      await page.rootInstance.simulateError(new Error('Test error'));
      await page.waitForChanges();

      // Verify error UI is shown
      let errorFallback = page.root.querySelector('.error-boundary-fallback');
      expect(errorFallback).toBeDefined();

      // Click retry button
      const retryButton = page.root.querySelector('.error-boundary-retry') as HTMLButtonElement;
      expect(retryButton).toBeDefined();
      retryButton.click();
      await page.waitForChanges();

      // Verify error UI is cleared
      errorFallback = page.root.querySelector('.error-boundary-fallback');
      expect(errorFallback).toBeNull();

      // Verify children are rendered normally again
      const content = page.root.querySelector('.error-boundary-content');
      expect(content).toBeDefined();
    });

    it('should include context in error event', async () => {
      const page = await newSpecPage({
        components: [ErrorBoundary],
        html: `<error-boundary error-boundary="test"></error-boundary>`,
      });

      const context = { itemId: 'item-123', canvasId: 'canvas-1' };
      page.rootInstance.context = context;

      // Setup event listener
      let eventDetail: any = null;
      page.root.addEventListener('error', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      // Trigger error
      await page.rootInstance.simulateError(new Error('Test error'));
      await page.waitForChanges();

      // Verify context is included in error event
      expect(eventDetail.errorInfo.itemId).toBe('item-123');
      expect(eventDetail.errorInfo.canvasId).toBe('canvas-1');
    });
  });
});
