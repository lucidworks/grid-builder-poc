/**
 * Error Boundary Component E2E Tests
 * ===================================
 *
 * E2E tests for error-boundary component in real browser environment.
 * These tests verify error catching functionality that cannot be tested
 * in StencilJS unit tests due to JSX template evaluation timing.
 */

import { newE2EPage } from '@stencil/core/testing';

describe('error-boundary E2E', () => {
  /**
   * Basic error catching and fallback UI
   */
  describe('error catching', () => {
    it('should catch errors and show default fallback UI', async () => {
      const page = await newE2EPage();

      // Create a simple page with error boundary and a button that throws
      await page.setContent(`
        <error-boundary
          error-boundary="test"
          show-error-ui="true"
          recovery-strategy="graceful">
          <div id="test-content">
            <button id="trigger-error">Trigger Error</button>
          </div>
        </error-boundary>
      `);

      // Wait for component to load
      await page.waitForChanges();

      // Verify initial content is shown
      const content = await page.find('#test-content');
      expect(content).toBeDefined();

      // Trigger an error by evaluating JavaScript that throws
      await page.evaluate(() => {
        const boundary = document.querySelector('error-boundary');
        const button = document.querySelector('#trigger-error');

        if (button) {
          button.addEventListener('click', () => {
            throw new Error('Test error');
          });
          (button as HTMLButtonElement).click();
        }
      });

      await page.waitForChanges();

      // Verify fallback UI is shown
      const fallback = await page.find('error-boundary >>> .error-boundary-fallback');
      expect(fallback).toBeDefined();

      // Verify error message is displayed
      const message = await page.find('error-boundary >>> .error-boundary-message');
      expect(message).toBeDefined();
      const messageText = await message.getProperty('textContent');
      expect(messageText).toContain('error');
    });

    it('should emit error event when error is caught', async () => {
      const page = await newE2EPage();

      await page.setContent(`
        <error-boundary
          error-boundary="test"
          show-error-ui="true">
          <button id="trigger-error">Trigger Error</button>
        </error-boundary>
      `);

      await page.waitForChanges();

      // Listen for error event
      const errorEventSpy = await page.spyOnEvent('error');

      // Trigger error
      await page.evaluate(() => {
        const button = document.querySelector('#trigger-error');
        if (button) {
          button.addEventListener('click', () => {
            throw new Error('Event test error');
          });
          (button as HTMLButtonElement).click();
        }
      });

      await page.waitForChanges();

      // Verify error event was emitted
      expect(errorEventSpy).toHaveReceivedEvent();
      expect(errorEventSpy.events[0].detail).toBeDefined();
      expect(errorEventSpy.events[0].detail.error).toBeDefined();
      expect(errorEventSpy.events[0].detail.severity).toBeDefined();
    });
  });

  /**
   * Retry functionality
   */
  describe('retry', () => {
    it('should clear error state when retry button is clicked', async () => {
      const page = await newE2EPage();

      await page.setContent(`
        <error-boundary
          error-boundary="test"
          show-error-ui="true"
          recovery-strategy="graceful">
          <button id="trigger-error">Trigger Error</button>
        </error-boundary>
      `);

      await page.waitForChanges();

      // Trigger error
      await page.evaluate(() => {
        const button = document.querySelector('#trigger-error');
        if (button) {
          button.addEventListener('click', () => {
            throw new Error('Retry test error');
          });
          (button as HTMLButtonElement).click();
        }
      });

      await page.waitForChanges();

      // Verify fallback is shown
      let fallback = await page.find('error-boundary >>> .error-boundary-fallback');
      expect(fallback).toBeDefined();

      // Click retry button
      const retryButton = await page.find('error-boundary >>> .error-boundary-retry');
      expect(retryButton).toBeDefined();
      await retryButton.click();

      await page.waitForChanges();

      // Verify fallback is hidden
      fallback = await page.find('error-boundary >>> .error-boundary-fallback');
      expect(fallback).toBeNull();
    });
  });

  /**
   * Recovery strategies
   */
  describe('recovery strategies', () => {
    it('should show fallback UI with graceful strategy', async () => {
      const page = await newE2EPage();

      await page.setContent(`
        <error-boundary
          error-boundary="test"
          show-error-ui="true"
          recovery-strategy="graceful">
          <button id="trigger-error">Trigger Error</button>
        </error-boundary>
      `);

      await page.waitForChanges();

      // Trigger error
      await page.evaluate(() => {
        const button = document.querySelector('#trigger-error');
        if (button) {
          button.addEventListener('click', () => {
            throw new Error('Graceful strategy test');
          });
          (button as HTMLButtonElement).click();
        }
      });

      await page.waitForChanges();

      // Verify fallback UI is shown
      const fallback = await page.find('error-boundary >>> .error-boundary-fallback');
      expect(fallback).toBeDefined();
    });

    it('should suppress error with ignore strategy', async () => {
      const page = await newE2EPage();

      await page.setContent(`
        <error-boundary
          error-boundary="test"
          show-error-ui="false"
          recovery-strategy="ignore">
          <button id="trigger-error">Trigger Error</button>
        </error-boundary>
      `);

      await page.waitForChanges();

      // Trigger error
      await page.evaluate(() => {
        const button = document.querySelector('#trigger-error');
        if (button) {
          button.addEventListener('click', () => {
            throw new Error('Ignore strategy test');
          });
          (button as HTMLButtonElement).click();
        }
      });

      await page.waitForChanges();

      // Verify no fallback UI is shown (error suppressed)
      const fallback = await page.find('error-boundary >>> .error-boundary-fallback');
      expect(fallback).toBeNull();
    });
  });

  /**
   * Error UI visibility
   */
  describe('error UI', () => {
    it('should show error UI when showErrorUI is true', async () => {
      const page = await newE2EPage();

      await page.setContent(`
        <error-boundary
          error-boundary="test"
          show-error-ui="true">
          <button id="trigger-error">Trigger Error</button>
        </error-boundary>
      `);

      await page.waitForChanges();

      // Trigger error
      await page.evaluate(() => {
        const button = document.querySelector('#trigger-error');
        if (button) {
          button.addEventListener('click', () => {
            throw new Error('Show UI test');
          });
          (button as HTMLButtonElement).click();
        }
      });

      await page.waitForChanges();

      // Verify fallback UI is visible
      const fallback = await page.find('error-boundary >>> .error-boundary-fallback');
      expect(fallback).toBeDefined();
    });

    it('should hide error UI when showErrorUI is false', async () => {
      const page = await newE2EPage();

      await page.setContent(`
        <error-boundary
          error-boundary="test"
          show-error-ui="false">
          <button id="trigger-error">Trigger Error</button>
        </error-boundary>
      `);

      await page.waitForChanges();

      // Trigger error
      await page.evaluate(() => {
        const button = document.querySelector('#trigger-error');
        if (button) {
          button.addEventListener('click', () => {
            throw new Error('Hide UI test');
          });
          (button as HTMLButtonElement).click();
        }
      });

      await page.waitForChanges();

      // Verify fallback UI is not shown
      const fallback = await page.find('error-boundary >>> .error-boundary-fallback');
      expect(fallback).toBeNull();
    });
  });

  /**
   * Context propagation
   */
  describe('context', () => {
    it('should include context in error event', async () => {
      const page = await newE2EPage();

      await page.setContent(`
        <error-boundary
          error-boundary="test"
          show-error-ui="true">
          <button id="trigger-error">Trigger Error</button>
        </error-boundary>
      `);

      await page.waitForChanges();

      // Set context via JavaScript
      await page.evaluate(() => {
        const boundary = document.querySelector('error-boundary');
        if (boundary) {
          (boundary as any).context = {
            itemId: 'item-123',
            canvasId: 'canvas-1',
          };
        }
      });

      // Listen for error event
      const errorEventSpy = await page.spyOnEvent('error');

      // Trigger error
      await page.evaluate(() => {
        const button = document.querySelector('#trigger-error');
        if (button) {
          button.addEventListener('click', () => {
            throw new Error('Context test error');
          });
          (button as HTMLButtonElement).click();
        }
      });

      await page.waitForChanges();

      // Verify context is included in error event
      expect(errorEventSpy).toHaveReceivedEvent();
      const errorDetail = errorEventSpy.events[0].detail;
      expect(errorDetail.errorInfo).toBeDefined();
      expect(errorDetail.errorInfo.itemId).toBe('item-123');
      expect(errorDetail.errorInfo.canvasId).toBe('canvas-1');
    });
  });
});
