/**
 * Error Boundary Stories
 * ======================
 *
 * Demonstrates error boundary functionality with real-world scenarios.
 *
 * **Why Error Boundaries Matter:**
 *
 * Without error boundaries, a single component error crashes the entire application:
 * - User sees blank screen or browser error page
 * - All working components disappear
 * - No recovery possible without page reload
 * - Poor user experience and data loss
 *
 * **With Error Boundaries:**
 * - Errors isolated to failing component
 * - Rest of UI continues working
 * - Graceful fallback UI with retry option
 * - Events emitted for external logging
 * - Users can continue their work
 *
 * **Stories:**
 * 1. Comparison - Side-by-side: with vs without error boundaries
 * 2. Basic - Simple error catching with default UI
 * 3. Custom Fallback - Custom error UI component
 * 4. Events - Error event handling and logging
 * 5. Degradation - Graceful degradation strategies
 * 6. Severity - Different error severity levels
 * 7. Dev vs Prod - Development vs production mode behavior
 */

import { html } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

export default {
  title: 'Components/Error Boundary',
  parameters: {
    docs: {
      description: {
        component: `
Error boundaries catch JavaScript errors in child components, preventing entire application crashes.

## Real-World Scenarios

**Scenario 1: Third-party component fails**
- Without boundary: Entire grid disappears, user loses all work
- With boundary: Only that component shows error UI, rest of grid works

**Scenario 2: API returns unexpected data**
- Without boundary: White screen, confused users call support
- With boundary: Error UI with retry, user can continue working

**Scenario 3: Network timeout during render**
- Without boundary: App freezes, requires page reload
- With boundary: Graceful fallback, automatic retry

**Scenario 4: User uploads corrupted file**
- Without boundary: Browser crash, lost form data
- With boundary: Error shown, file can be re-uploaded
        `,
      },
    },
  },
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
 * Story 1: Comparison - With vs Without Error Boundaries
 * =======================================================
 *
 * **Real-World Scenario**: Third-party analytics widget receives malformed data from API
 *
 * **What would break**: The analytics component throws:
 * `TypeError: Cannot read property 'metrics' of undefined`
 *
 * **Without error boundary**:
 * - ❌ Entire page goes blank (white screen of death)
 * - ❌ User loses all unsaved work in the page builder
 * - ❌ No error message shown to user
 * - ❌ User must reload page and start over
 * - ❌ Support tickets pile up: "The app just stopped working!"
 *
 * **With error boundary**:
 * - ✅ Only the analytics widget shows error UI
 * - ✅ Rest of page builder continues working normally
 * - ✅ User can retry the widget or continue without it
 * - ✅ Error logged for developers to fix
 * - ✅ User keeps working, doesn't lose progress
 */
export const Comparison = () => {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px;';

  const header = document.createElement('h2');
  header.textContent = 'Scenario: Component Error - With vs Without Error Boundary';
  container.appendChild(header);

  const description = document.createElement('p');
  description.textContent = 'This demonstrates what happens when a component fails. Click "Trigger Error" to simulate a component crash.';
  description.style.cssText = 'color: #666; margin-bottom: 24px;';
  container.appendChild(description);

  // Side-by-side comparison grid
  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px;';

  // LEFT: Without error boundary
  const withoutHTML = `
    <div style="border: 2px solid #dc3545; border-radius: 8px; padding: 16px; background: #fff;">
      <div style="background: #dc3545; color: white; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-weight: bold;">
        ❌ WITHOUT Error Boundary
      </div>
      <p style="font-size: 13px; color: #721c24; margin-bottom: 12px; background: #f8d7da; padding: 8px; border-radius: 4px;">
        <strong>Result:</strong> Entire UI crashes → blank screen → user loses all work
      </p>
      <div id="without-boundary-container" style="min-height: 150px; border: 1px dashed #ddd; border-radius: 4px; padding: 12px; background: #f8f9fa;">
        <div style="padding: 12px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px; margin-bottom: 12px;">
          ✓ Working Component A
        </div>
        <div id="error-component-comparison-without" style="padding: 12px; background: #fff3cd; color: #856404; border: 1px solid #ffc107; border-radius: 4px; margin-bottom: 12px;">
          ⚠️ Component B (will crash)<br>
          <button id="trigger-error-without" style="margin-top: 8px; padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
            Trigger Error
          </button>
        </div>
        <div style="padding: 12px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px;">
          ✓ Working Component C
        </div>
      </div>
    </div>
  `;

  // RIGHT: With error boundary
  const withHTML = `
    <div style="border: 2px solid #28a745; border-radius: 8px; padding: 16px; background: #fff;">
      <div style="background: #28a745; color: white; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-weight: bold;">
        ✅ WITH Error Boundary
      </div>
      <p style="font-size: 13px; color: #155724; margin-bottom: 12px; background: #d4edda; padding: 8px; border-radius: 4px;">
        <strong>Result:</strong> Error isolated → fallback UI shown → rest of app works → user continues
      </p>
      <div style="min-height: 150px; border: 1px dashed #ddd; border-radius: 4px; padding: 12px; background: #f8f9fa;">
        <div style="padding: 12px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px; margin-bottom: 12px;">
          ✓ Working Component A
        </div>
        <error-boundary
          error-boundary="comparison-demo"
          show-error-ui="true"
          recovery-strategy="graceful">
          <div id="error-component-comparison-with" style="padding: 12px; background: #fff3cd; color: #856404; border: 1px solid #ffc107; border-radius: 4px; margin-bottom: 12px;">
            ⚠️ Component B (protected)<br>
            <button id="trigger-error-with" style="margin-top: 8px; padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Trigger Error
            </button>
          </div>
        </error-boundary>
        <div style="padding: 12px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px;">
          ✓ Working Component C
        </div>
      </div>
    </div>
  `;

  grid.innerHTML = withoutHTML + withHTML;
  container.appendChild(grid);

  // Setup error triggers after mount
  setTimeout(() => {
    // Without boundary - crashes entire container
    const triggerWithout = document.getElementById('trigger-error-without');
    if (triggerWithout) {
      triggerWithout.addEventListener('click', () => {
        // Show button feedback
        (triggerWithout as HTMLButtonElement).textContent = 'Error Triggered!';
        (triggerWithout as HTMLButtonElement).disabled = true;

        setTimeout(() => {
          const container = document.getElementById('without-boundary-container');
          if (container) {
            // Simulate complete crash - replace with error message
            container.innerHTML = `
              <div style="padding: 24px; text-align: center; color: #721c24;">
                <div style="font-size: 48px; margin-bottom: 16px;">💥</div>
                <h3 style="margin: 0 0 8px 0; color: #721c24;">Application Crashed</h3>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">
                  This simulates what happens without error boundaries.<br>
                  In a real app, you'd see a blank screen or browser error page.
                </p>
                <p style="margin: 0; font-size: 12px; color: #999;">
                  All components gone. User must reload page.
                </p>
              </div>
            `;
          }
        }, 300);
      });
    }

    // With boundary - only Component B fails
    const triggerWith = document.getElementById('trigger-error-with');
    if (triggerWith) {
      triggerWith.addEventListener('click', async () => {
        // Show button feedback
        (triggerWith as HTMLButtonElement).textContent = 'Triggering Error...';
        (triggerWith as HTMLButtonElement).style.background = '#ffc107';
        (triggerWith as HTMLButtonElement).style.color = '#000';

        setTimeout(async () => {
          const errorBoundary = document.querySelector('error-boundary[error-boundary="comparison-demo"]');

          if (errorBoundary) {
            try {
              // Use the public simulateError method
              await (errorBoundary as any).simulateError(
                new Error('Analytics widget: Cannot read property "metrics" of undefined')
              );

              // Update button to show it was triggered
              (triggerWith as HTMLButtonElement).textContent = 'Error Triggered!';
              (triggerWith as HTMLButtonElement).style.background = '#28a745';
              (triggerWith as HTMLButtonElement).style.color = '#fff';
              (triggerWith as HTMLButtonElement).disabled = true;
            } catch (e) {
              console.error('Error triggering error boundary:', e);
              (triggerWith as HTMLButtonElement).textContent = 'Failed to Trigger';
              (triggerWith as HTMLButtonElement).style.background = '#dc3545';
            }
          }
        }, 300);
      });
    }
  }, 100);

  return html`${unsafeHTML(container.outerHTML)}`;
};

/**
 * Story 2: Basic Error Boundary
 * ==============================
 *
 * **Real-World Scenario**: Image gallery receives invalid image URLs from CMS
 *
 * **What would break**: The image component throws:
 * `Error: Failed to load image: Invalid URL format`
 *
 * **Business Impact**:
 * - Without boundary: Entire page builder crashes, user loses 30 minutes of layout work
 * - With boundary: Just the image gallery shows error, user can fix URLs or continue without it
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
 * Story 3: Custom Fallback UI
 * ============================
 *
 * **Real-World Scenario**: Enterprise dashboard component fails to connect to backend service
 *
 * **What would break**: The dashboard component throws:
 * `Error: WebSocket connection failed: ECONNREFUSED`
 *
 * **Why custom fallback matters**:
 * - Default error UI shows technical jargon ("ECONNREFUSED") → confuses non-tech users
 * - Custom UI shows: "Dashboard temporarily unavailable. Trying to reconnect..."
 * - Matches brand colors and design system
 * - Provides helpful next steps instead of generic "Try again" button
 *
 * **Business Impact**:
 * - Reduces support tickets from confused users
 * - Maintains professional brand experience even during errors
 * - Users understand what's happening and feel in control
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
 * Story 4: Error Events & External Logging
 * =========================================
 *
 * **Real-World Scenario**: Production monitoring and error tracking
 *
 * **What would happen without event logging**:
 * - ❌ Errors occur silently in production
 * - ❌ No way to know when/where errors happen
 * - ❌ Users report bugs but developers can't reproduce them
 * - ❌ No metrics on error frequency or patterns
 * - ❌ Can't prioritize which errors to fix first
 *
 * **With error events + external logging**:
 * - ✅ All errors automatically sent to Sentry/LogRocket/Datadog
 * - ✅ Error dashboards show trends and patterns
 * - ✅ Alerts fire when error rate spikes
 * - ✅ Full context captured (user, session, component state)
 * - ✅ Stack traces and breadcrumbs for debugging
 *
 * **Example Integration**:
 * ```typescript
 * // Send critical errors to Sentry
 * api.on('error', (event) => {
 *   if (event.severity === 'critical') {
 *     Sentry.captureException(event.error, {
 *       level: 'error',
 *       tags: { component: event.errorInfo.errorBoundary },
 *       user: { id: currentUserId },
 *       extra: event.errorInfo
 *     });
 *   }
 * });
 * ```
 *
 * **Business Impact**:
 * - Fix issues before users report them
 * - Data-driven prioritization of bug fixes
 * - Faster debugging with full error context
 * - Better product quality and user experience
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
 * Story 5: Recovery Strategies - Graceful Degradation
 * ====================================================
 *
 * **Real-World Scenario**: Different components need different error handling strategies
 *
 * **Component Examples**:
 *
 * **1. Social Media Feed (Graceful)**:
 * - **Error**: "Failed to fetch tweets: Rate limit exceeded"
 * - **Without boundary**: Entire page crashes
 * - **With graceful**: Shows "Feed temporarily unavailable" + retry button
 * - **Why**: Non-critical feature, user can continue without it
 *
 * **2. Analytics Tracker (Ignore)**:
 * - **Error**: "Analytics endpoint unreachable"
 * - **Without boundary**: Crashes entire page for non-critical tracking
 * - **With ignore**: Silently fails, app continues normally
 * - **Why**: Invisible to user, shouldn't disrupt experience
 *
 * **3. Payment Processor (Strict)**:
 * - **Error**: "Payment gateway connection failed"
 * - **Without boundary**: User thinks payment went through, but it didn't
 * - **With strict**: Bubbles up to parent, shows critical error, blocks checkout
 * - **Why**: Critical business logic, must handle at app level
 *
 * **Strategy Selection Guide**:
 * - **Graceful**: User-facing components, show error UI, allow retry
 * - **Ignore**: Logging/analytics, silent failures OK
 * - **Strict**: Critical flows (payment, auth), must escalate
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
 * Story 6: Error Severity Levels
 * ===============================
 *
 * **Real-World Scenario**: Errors have different business impact requiring different responses
 *
 * **Severity Examples**:
 *
 * **⚠️ Warning (grid-item-wrapper)**:
 * - **Error**: "Failed to render image thumbnail"
 * - **Impact**: Single grid item shows placeholder, rest of grid works fine
 * - **User Experience**: Slightly degraded but usable
 * - **Response**: Log to analytics, show in UI, allow retry
 * - **Example**: Broken image URL, missing optional data
 *
 * **🔴 Error (canvas-section)**:
 * - **Error**: "Canvas dropzone initialization failed"
 * - **Impact**: Entire canvas section unusable, other sections OK
 * - **User Experience**: Moderately degraded, user can work in other sections
 * - **Response**: Log to error tracking, show prominent error UI, alert on-call
 * - **Example**: Third-party library initialization failure
 *
 * **💀 Critical (grid-builder)**:
 * - **Error**: "Grid state corrupted: Cannot deserialize layout data"
 * - **Impact**: Entire grid builder fails, user cannot proceed
 * - **User Experience**: Severely degraded or blocked
 * - **Response**: Page Sentry, trigger incident, show recovery options
 * - **Example**: Data corruption, plugin initialization failure, API down
 *
 * **Automatic Severity Classification**:
 * - Based on error boundary level (grid-item → canvas → builder)
 * - Lower in hierarchy = lower severity (more isolated)
 * - Higher in hierarchy = higher severity (broader impact)
 *
 * **Business Impact by Severity**:
 * - **Warning**: 95% of users unaffected, fix in next sprint
 * - **Error**: 20% of users affected, fix within 24 hours
 * - **Critical**: All users blocked, fix immediately (P0 incident)
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
 * Story 7: Development vs Production Mode
 * ========================================
 *
 * **Real-World Scenario**: Error UI must adapt to environment and audience
 *
 * **Development Mode (Technical Audience)**:
 * - **Error**: "TypeError: Cannot read property 'data' of undefined at ComponentRenderer.tsx:42"
 * - **Display**: Full stack trace, component tree, props/state dump
 * - **Purpose**: Help developers debug quickly
 * - **Features**:
 *   - Complete error message and stack trace
 *   - Component hierarchy that led to error
 *   - Props and state at time of error
 *   - Link to source code line (with source maps)
 *   - Console logging with full context
 *
 * **Production Mode (End Users)**:
 * - **Error**: Same "TypeError: Cannot read property 'data' of undefined"
 * - **Display**: "Something went wrong. Please try again or contact support."
 * - **Purpose**: Don't confuse/scare users with technical details
 * - **Features**:
 *   - User-friendly message (no jargon)
 *   - Actionable next steps (retry, contact support)
 *   - Error ID for support lookup
 *   - Silent logging to Sentry with full context
 *   - No stack traces visible to user
 *
 * **Why This Matters**:
 *
 * **Development**:
 * - ✅ Developers see everything needed to debug
 * - ✅ Faster bug fixes and iteration
 * - ✅ No need to dig through logs for every error
 *
 * **Production**:
 * - ✅ Users see helpful, non-scary messages
 * - ✅ Reduces support tickets ("What does 'undefined' mean?")
 * - ✅ Professional user experience maintained
 * - ✅ Technical details still captured for developers (in Sentry)
 *
 * **Example Code**:
 * ```typescript
 * const isDevelopment = process.env.NODE_ENV === 'development';
 *
 * gridBuilder.config = {
 *   showErrorUI: true,
 *   errorFallback: isDevelopment
 *     ? detailedErrorUI        // Stack traces, debug info
 *     : userFriendlyErrorUI    // Simple message, retry button
 * };
 * ```
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
