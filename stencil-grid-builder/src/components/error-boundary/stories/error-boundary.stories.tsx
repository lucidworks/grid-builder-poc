/**
 * Error Boundary Stories
 * ======================
 *
 * Demonstrates error boundary functionality in 6 scenarios:
 * 1. Basic - Simple error catching with default UI
 * 2. Custom Fallback - Custom error UI component
 * 3. Events - Error event handling and logging
 * 4. Degradation - Graceful degradation strategies
 * 5. Severity - Different error severity levels
 * 6. Dev vs Prod - Development vs production mode behavior
 */

import { html } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

export default {
  title: 'Components/Error Boundary',
};

/**
 * Helper component that throws an error after a delay
 * This allows the component to render initially, then error during lifecycle
 */
const ThrowingComponent = ({ delay = 0, message = 'Component error' }) => {
  const div = document.createElement('div');
  div.textContent = 'Loading...';

  // Throw error after delay
  setTimeout(() => {
    throw new Error(message);
  }, delay);

  return div;
};

/**
 * Helper component that throws on user interaction
 * Demonstrates error boundaries catching event handler errors
 */
const InteractiveThrowingComponent = () => {
  const div = document.createElement('div');
  div.style.cssText = 'padding: 20px; background: #f0f0f0; border-radius: 4px;';

  const button = document.createElement('button');
  button.textContent = 'Click to trigger error';
  button.style.cssText = 'padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';

  button.onclick = () => {
    throw new Error('Button click error');
  };

  div.appendChild(button);
  return div;
};

/**
 * Normal working component (for comparison)
 */
const WorkingComponent = () => {
  const div = document.createElement('div');
  div.style.cssText = 'padding: 20px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px;';
  div.innerHTML = '<strong>✓ Working Component</strong><p style="margin: 8px 0 0 0;">This component is rendering normally.</p>';
  return div;
};

/**
 * Story 1: Basic Error Boundary
 * ==============================
 *
 * Demonstrates basic error catching with default fallback UI.
 *
 * **Features demonstrated**:
 * - Default error UI (red box with error icon)
 * - Retry button functionality
 * - Error isolation (only failed component shows error UI)
 * - Automatic error severity detection
 */
export const Basic = () => {
  // Create a container with multiple components (some fail, some work)
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; display: flex; flex-direction: column; gap: 16px;';

  // Header
  const header = document.createElement('h2');
  header.textContent = 'Scenario 1: Basic Error Boundary';
  container.appendChild(header);

  const description = document.createElement('p');
  description.textContent = 'The error boundary catches component errors and shows default fallback UI with a retry button. Working components are unaffected.';
  description.style.cssText = 'color: #666; margin-bottom: 16px;';
  container.appendChild(description);

  // Working component (no error boundary needed)
  const workingWrapper = document.createElement('div');
  workingWrapper.appendChild(WorkingComponent());
  container.appendChild(workingWrapper);

  // Error boundary wrapping a failing component
  const errorBoundaryHTML = `
    <error-boundary
      error-boundary="basic-demo"
      show-error-ui="true"
      recovery-strategy="graceful">
      <div id="error-component-1" style="padding: 20px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">
        <strong>⚠️ This component will error</strong>
        <p style="margin: 8px 0 0 0;">The error boundary will catch it and show fallback UI.</p>
      </div>
    </error-boundary>
  `;

  const errorWrapper = document.createElement('div');
  errorWrapper.innerHTML = errorBoundaryHTML;
  container.appendChild(errorWrapper);

  // Trigger error after component mounts
  setTimeout(() => {
    const errorComponent = document.getElementById('error-component-1');
    if (errorComponent) {
      // Simulate a component error
      const event = new ErrorEvent('error', {
        error: new Error('Simulated render error'),
        message: 'Simulated render error',
      });
      errorComponent.dispatchEvent(event);
    }
  }, 100);

  // Another working component (shows isolation)
  const workingWrapper2 = document.createElement('div');
  workingWrapper2.appendChild(WorkingComponent());
  container.appendChild(workingWrapper2);

  return html`${unsafeHTML(container.outerHTML)}`;
};

/**
 * Story 2: Custom Fallback UI
 * ============================
 *
 * Demonstrates custom error fallback components instead of default UI.
 *
 * **Features demonstrated**:
 * - Custom error rendering function
 * - Access to error object and errorInfo
 * - Custom retry logic
 * - Brand-specific error messaging
 */
export const CustomFallback = () => {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px;';

  const header = document.createElement('h2');
  header.textContent = 'Scenario 2: Custom Fallback UI';
  container.appendChild(header);

  const description = document.createElement('p');
  description.textContent = 'Error boundaries support custom fallback components for brand-specific error messaging and UI.';
  description.style.cssText = 'color: #666; margin-bottom: 16px;';
  container.appendChild(description);

  // Custom fallback function (passed as a function that returns HTMLElement)
  const customFallback = (error: Error, errorInfo: any, retry: () => void) => {
    const fallbackDiv = document.createElement('div');
    fallbackDiv.style.cssText = `
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    fallbackDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="font-size: 32px;">🛠️</div>
        <h3 style="margin: 0; font-size: 20px;">Oops! Something went wrong</h3>
      </div>
      <p style="margin: 0 0 12px 0; opacity: 0.9; font-size: 14px;">
        ${error.message || 'An unexpected error occurred'}
      </p>
      <p style="margin: 0 0 16px 0; opacity: 0.7; font-size: 12px;">
        Error boundary: ${errorInfo.errorBoundary || 'unknown'}
      </p>
      <button
        id="custom-retry-btn"
        style="
          padding: 8px 16px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        ">
        Try Again
      </button>
    `;

    // Add retry handler
    const retryBtn = fallbackDiv.querySelector('#custom-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', retry);
    }

    return fallbackDiv;
  };

  // Store custom fallback in window (workaround for passing functions via HTML attributes)
  (window as any).customErrorFallback = customFallback;

  const errorBoundaryHTML = `
    <error-boundary
      error-boundary="custom-demo"
      show-error-ui="true">
      <div id="error-component-2" style="padding: 20px; background: #f8d7da; border-radius: 4px;">
        <p>This component will error and show custom fallback UI...</p>
      </div>
    </error-boundary>
  `;

  const errorWrapper = document.createElement('div');
  errorWrapper.innerHTML = errorBoundaryHTML;
  container.appendChild(errorWrapper);

  // Apply custom fallback after mount
  setTimeout(() => {
    const errorBoundary = errorWrapper.querySelector('error-boundary');
    if (errorBoundary) {
      (errorBoundary as any).errorFallback = customFallback;

      // Trigger error
      const errorComponent = document.getElementById('error-component-2');
      if (errorComponent) {
        const event = new ErrorEvent('error', {
          error: new Error('Custom fallback demonstration error'),
          message: 'Custom fallback demonstration error',
        });
        errorComponent.dispatchEvent(event);
      }
    }
  }, 100);

  return html`${unsafeHTML(container.outerHTML)}`;
};

/**
 * Story 3: Error Events
 * ======================
 *
 * Demonstrates error event emission and external error logging.
 *
 * **Features demonstrated**:
 * - Error event emission
 * - Event payload structure (error, errorInfo, severity, recoverable)
 * - Integration with external logging systems (console, Sentry, etc.)
 * - Real-time error notifications
 */
export const Events = () => {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px;';

  const header = document.createElement('h2');
  header.textContent = 'Scenario 3: Error Events & Logging';
  container.appendChild(header);

  const description = document.createElement('p');
  description.textContent = 'Error boundaries emit events for integration with logging systems. Check the console for logged errors.';
  description.style.cssText = 'color: #666; margin-bottom: 16px;';
  container.appendChild(description);

  // Event log display
  const eventLog = document.createElement('div');
  eventLog.id = 'event-log';
  eventLog.style.cssText = `
    padding: 16px;
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 16px;
  `;
  eventLog.innerHTML = '<div style="color: #6a9955;">// Waiting for errors...</div>';
  container.appendChild(eventLog);

  const errorBoundaryHTML = `
    <error-boundary
      error-boundary="events-demo"
      show-error-ui="true"
      id="events-error-boundary">
      <div id="error-component-3" style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
        <p>Trigger an error to see event logging...</p>
        <button id="trigger-error-btn" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Trigger Error
        </button>
      </div>
    </error-boundary>
  `;

  const errorWrapper = document.createElement('div');
  errorWrapper.innerHTML = errorBoundaryHTML;
  container.appendChild(errorWrapper);

  // Setup event listener after mount
  setTimeout(() => {
    const errorBoundary = errorWrapper.querySelector('#events-error-boundary');
    const triggerBtn = errorWrapper.querySelector('#trigger-error-btn');
    const logDisplay = container.querySelector('#event-log');

    if (errorBoundary && triggerBtn && logDisplay) {
      // Listen for error events
      errorBoundary.addEventListener('error', ((event: CustomEvent) => {
        const { error, errorInfo, severity, recoverable } = event.detail;

        // Log to console
        console.group('🔴 Error Boundary Event');
        console.error('Error:', error);
        console.log('Error Info:', errorInfo);
        console.log('Severity:', severity);
        console.log('Recoverable:', recoverable);
        console.groupEnd();

        // Update UI log
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `
          <div style="border-left: 3px solid #dc3545; padding-left: 12px; margin-bottom: 12px;">
            <div style="color: #858585;">[${timestamp}]</div>
            <div style="color: #ce9178;">"${error.message}"</div>
            <div style="color: #4ec9b0;">
              severity: <span style="color: #ce9178;">"${severity}"</span>,
              recoverable: <span style="color: ${recoverable ? '#4fc1ff' : '#d16969'}">${recoverable}</span>
            </div>
            <div style="color: #858585;">errorBoundary: "${errorInfo.errorBoundary}"</div>
          </div>
        `;

        logDisplay.innerHTML = logEntry + logDisplay.innerHTML;
      }) as EventListener);

      // Trigger button handler
      triggerBtn.addEventListener('click', () => {
        const error = new Error('User-triggered error for event demonstration');
        const event = new ErrorEvent('error', {
          error,
          message: error.message,
        });
        const errorComponent = document.getElementById('error-component-3');
        if (errorComponent) {
          errorComponent.dispatchEvent(event);
        }
      });
    }
  }, 100);

  return html`${unsafeHTML(container.outerHTML)}`;
};

/**
 * Story 4: Graceful Degradation
 * ==============================
 *
 * Demonstrates different recovery strategies for error handling.
 *
 * **Features demonstrated**:
 * - Graceful degradation (show fallback UI, continue operating)
 * - Ignore strategy (suppress errors, continue silently)
 * - Strict strategy (propagate errors up)
 * - Per-component recovery configuration
 */
export const Degradation = () => {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px;';

  const header = document.createElement('h2');
  header.textContent = 'Scenario 4: Graceful Degradation Strategies';
  container.appendChild(header);

  const description = document.createElement('p');
  description.textContent = 'Different recovery strategies determine how the app responds to errors. Compare graceful vs ignore vs strict.';
  description.style.cssText = 'color: #666; margin-bottom: 16px;';
  container.appendChild(description);

  // Strategy comparison grid
  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 16px;';

  // Graceful strategy
  const gracefulHTML = `
    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px;">
      <h4 style="margin: 0 0 12px 0;">Graceful Strategy</h4>
      <p style="font-size: 13px; color: #666; margin-bottom: 12px;">Shows fallback UI, allows retry</p>
      <error-boundary
        error-boundary="graceful-demo"
        recovery-strategy="graceful"
        show-error-ui="true">
        <div id="error-component-4a" style="padding: 12px; background: #f8d7da; border-radius: 4px;">
          Will show error UI...
        </div>
      </error-boundary>
    </div>
  `;

  // Ignore strategy
  const ignoreHTML = `
    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px;">
      <h4 style="margin: 0 0 12px 0;">Ignore Strategy</h4>
      <p style="font-size: 13px; color: #666; margin-bottom: 12px;">Suppresses error, continues silently</p>
      <error-boundary
        error-boundary="ignore-demo"
        recovery-strategy="ignore"
        show-error-ui="false">
        <div id="error-component-4b" style="padding: 12px; background: #f8d7da; border-radius: 4px;">
          Error will be suppressed...
        </div>
      </error-boundary>
    </div>
  `;

  // Strict strategy
  const strictHTML = `
    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px;">
      <h4 style="margin: 0 0 12px 0;">Strict Strategy</h4>
      <p style="font-size: 13px; color: #666; margin-bottom: 12px;">Propagates error to parent boundary</p>
      <error-boundary
        error-boundary="strict-outer"
        recovery-strategy="graceful"
        show-error-ui="true">
        <error-boundary
          error-boundary="strict-inner"
          recovery-strategy="strict"
          show-error-ui="true">
          <div id="error-component-4c" style="padding: 12px; background: #f8d7da; border-radius: 4px;">
            Error will propagate...
          </div>
        </error-boundary>
      </error-boundary>
    </div>
  `;

  grid.innerHTML = gracefulHTML + ignoreHTML + strictHTML;
  container.appendChild(grid);

  // Trigger errors after mount
  setTimeout(() => {
    ['error-component-4a', 'error-component-4b', 'error-component-4c'].forEach((id) => {
      const errorComponent = document.getElementById(id);
      if (errorComponent) {
        const event = new ErrorEvent('error', {
          error: new Error(`${id} demonstration error`),
          message: `${id} demonstration error`,
        });
        errorComponent.dispatchEvent(event);
      }
    });
  }, 100);

  return html`${unsafeHTML(container.outerHTML)}`;
};

/**
 * Story 5: Error Severity
 * ========================
 *
 * Demonstrates different error severity levels and their visual treatment.
 *
 * **Features demonstrated**:
 * - Automatic severity classification (warning, error, critical)
 * - Visual differentiation by severity
 * - Custom severity assignment
 * - Severity-based routing (e.g., critical errors to incident channel)
 */
export const Severity = () => {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px;';

  const header = document.createElement('h2');
  header.textContent = 'Scenario 5: Error Severity Levels';
  container.appendChild(header);

  const description = document.createElement('p');
  description.textContent = 'Errors are automatically classified by severity. Visual treatment adapts to severity level.';
  description.style.cssText = 'color: #666; margin-bottom: 16px;';
  container.appendChild(description);

  // Severity comparison grid
  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; gap: 16px;';

  // Warning severity (item-level error)
  const warningHTML = `
    <div style="border: 1px solid #ffc107; border-radius: 4px; padding: 16px;">
      <h4 style="margin: 0 0 8px 0; color: #856404;">⚠️ Warning Severity</h4>
      <p style="font-size: 13px; color: #856404; margin-bottom: 12px;">
        Grid item render error - isolated, other items continue working
      </p>
      <error-boundary
        error-boundary="grid-item-wrapper"
        show-error-ui="true">
        <div id="error-component-5a" style="padding: 12px; background: #fff3cd; border-radius: 4px;">
          Item-level error...
        </div>
      </error-boundary>
    </div>
  `;

  // Error severity (canvas-level error)
  const errorHTML = `
    <div style="border: 1px solid #dc3545; border-radius: 4px; padding: 16px;">
      <h4 style="margin: 0 0 8px 0; color: #721c24;">🔴 Error Severity</h4>
      <p style="font-size: 13px; color: #721c24; margin-bottom: 12px;">
        Canvas section error - affects section but other canvases OK
      </p>
      <error-boundary
        error-boundary="canvas-section"
        show-error-ui="true">
        <div id="error-component-5b" style="padding: 12px; background: #f8d7da; border-radius: 4px;">
          Canvas-level error...
        </div>
      </error-boundary>
    </div>
  `;

  // Critical severity (builder-level error)
  const criticalHTML = `
    <div style="border: 1px solid #6c757d; border-radius: 4px; padding: 16px;">
      <h4 style="margin: 0 0 8px 0; color: #383d41;">💀 Critical Severity</h4>
      <p style="font-size: 13px; color: #383d41; margin-bottom: 12px;">
        Grid builder initialization error - entire grid fails
      </p>
      <error-boundary
        error-boundary="grid-builder"
        show-error-ui="true">
        <div id="error-component-5c" style="padding: 12px; background: #e2e3e5; border-radius: 4px;">
          Builder-level error...
        </div>
      </error-boundary>
    </div>
  `;

  grid.innerHTML = warningHTML + errorHTML + criticalHTML;
  container.appendChild(grid);

  // Trigger errors after mount
  setTimeout(() => {
    ['error-component-5a', 'error-component-5b', 'error-component-5c'].forEach((id) => {
      const errorComponent = document.getElementById(id);
      if (errorComponent) {
        const event = new ErrorEvent('error', {
          error: new Error(`${id} severity demonstration`),
          message: `${id} severity demonstration`,
        });
        errorComponent.dispatchEvent(event);
      }
    });
  }, 100);

  return html`${unsafeHTML(container.outerHTML)}`;
};

/**
 * Story 6: Development vs Production
 * ===================================
 *
 * Demonstrates different error UI behavior in dev vs prod modes.
 *
 * **Features demonstrated**:
 * - Development mode: Detailed error stack traces, technical info
 * - Production mode: User-friendly messages, hide technical details
 * - Conditional error details based on NODE_ENV
 * - Error reporting integration (dev: console, prod: Sentry)
 */
export const DevVsProd = () => {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px;';

  const header = document.createElement('h2');
  header.textContent = 'Scenario 6: Development vs Production Mode';
  container.appendChild(header);

  const description = document.createElement('p');
  description.textContent = 'Error UI adapts based on environment. Development shows stack traces, production shows user-friendly messages.';
  description.style.cssText = 'color: #666; margin-bottom: 16px;';
  container.appendChild(description);

  // Mode comparison grid
  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;';

  // Development mode simulation
  const devHTML = `
    <div style="border: 1px solid #17a2b8; border-radius: 4px; padding: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #0c5460;">🔧 Development Mode</h4>
      <p style="font-size: 13px; color: #0c5460; margin-bottom: 12px;">
        Shows detailed error information and stack traces
      </p>
      <error-boundary
        error-boundary="dev-demo"
        show-error-ui="true"
        id="dev-error-boundary">
        <div id="error-component-6a" style="padding: 12px; background: #d1ecf1; border-radius: 4px;">
          Development error...
        </div>
      </error-boundary>
    </div>
  `;

  // Production mode simulation
  const prodHTML = `
    <div style="border: 1px solid #28a745; border-radius: 4px; padding: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #155724;">🚀 Production Mode</h4>
      <p style="font-size: 13px; color: #155724; margin-bottom: 12px;">
        Shows user-friendly messages, hides technical details
      </p>
      <error-boundary
        error-boundary="prod-demo"
        show-error-ui="true"
        id="prod-error-boundary">
        <div id="error-component-6b" style="padding: 12px; background: #d4edda; border-radius: 4px;">
          Production error...
        </div>
      </error-boundary>
    </div>
  `;

  grid.innerHTML = devHTML + prodHTML;
  container.appendChild(grid);

  // Simulate development/production environments after mount
  setTimeout(() => {
    // Development boundary - enable detailed errors
    const devBoundary = container.querySelector('#dev-error-boundary');
    if (devBoundary) {
      // In real usage, this would check process.env.NODE_ENV
      // For demo, we simulate dev mode with data attribute
      devBoundary.setAttribute('data-env', 'development');
    }

    // Production boundary - suppress details
    const prodBoundary = container.querySelector('#prod-error-boundary');
    if (prodBoundary) {
      prodBoundary.setAttribute('data-env', 'production');
    }

    // Trigger errors
    ['error-component-6a', 'error-component-6b'].forEach((id) => {
      const errorComponent = document.getElementById(id);
      if (errorComponent) {
        const event = new ErrorEvent('error', {
          error: new Error(`${id} mode demonstration`),
          message: `${id} mode demonstration`,
        });
        errorComponent.dispatchEvent(event);
      }
    });
  }, 100);

  return html`${unsafeHTML(container.outerHTML)}`;
};
