/**
 * Error Boundary Component (Generic - Extractable)
 * ==================================================
 *
 * Generic error boundary component for catching and handling component errors.
 * Zero dependencies on grid-builder - can be extracted to standalone package.
 *
 * ## Design Principles
 *
 * **Generic and Reusable**:
 * - Works with any StencilJS component
 * - No grid-builder specific imports
 * - Extensible via props and slots
 *
 * **Declarative API**:
 * - @Event for error notification
 * - Props for configuration
 * - Slots for content and fallback UI
 *
 * **Error Isolation**:
 * - Catches render errors in child components
 * - Prevents error propagation to parent
 * - Provides recovery mechanisms
 *
 * ## StencilJS Limitation
 *
 * **No native error boundaries**: Unlike React's componentDidCatch, StencilJS
 * has no built-in error boundary support. We must use try/catch manually.
 *
 * **Render-time errors only**: This component catches errors during render(),
 * not during lifecycle methods or event handlers. For those, wrap in try/catch.
 *
 * ## Usage
 *
 * **Basic error boundary**:
 * ```typescript
 * <error-boundary error-boundary="my-component">
 *   <my-component></my-component>
 * </error-boundary>
 * ```
 *
 * **With custom fallback**:
 * ```typescript
 * <error-boundary
 *   error-boundary="my-component"
 *   show-error-ui={true}
 *   onError={(e) => console.error(e.detail.error)}
 * >
 *   <my-component></my-component>
 *   <div slot="fallback">Custom error message</div>
 * </error-boundary>
 * ```
 *
 * **With custom fallback renderer**:
 * ```typescript
 * const errorBoundaryEl = document.querySelector('error-boundary');
 * errorBoundaryEl.errorFallback = (error, errorInfo, retry) => (
 *   <div class="my-error-ui">
 *     <h3>{error.message}</h3>
 *     <button onClick={retry}>Retry</button>
 *   </div>
 * );
 * ```
 * @module error-boundary
 */

import { Component, h, Prop, State, Event, EventEmitter, Element, Method } from '@stencil/core';
import {
  BaseErrorEventDetail,
  BaseErrorInfo,
  ErrorFallbackRenderer,
  ErrorRecoveryStrategy,
} from '../../types/error-types';
import {
  classifyError,
  buildErrorEventDetail,
  formatErrorMessage,
  getErrorIcon,
} from '../../utils/error-handler';
import { getRecommendedStrategy } from '../../utils/error-recovery';

/**
 * ErrorBoundary Component
 * ========================
 *
 * Generic error boundary for catching component render errors.
 *
 * **Tag**: `<error-boundary>`
 * **Shadow DOM**: Disabled (allows slot content to access parent styles)
 * **Reusable**: Zero dependencies, can be extracted to standalone package
 */
@Component({
  tag: 'error-boundary',
  styleUrl: 'error-boundary.scss',
  shadow: false,
})
export class ErrorBoundary {
  /**
   * Error boundary identifier
   *
   * **Purpose**: Identifies which boundary caught the error
   * **Required**: Yes
   * **Example**: 'grid-builder', 'canvas-section', 'grid-item-wrapper'
   *
   * **Used in error events**: Helps parent components know where error originated
   */
  @Prop() errorBoundary!: string;

  /**
   * Whether to show error UI
   *
   * **Purpose**: Control error UI visibility
   * **Default**: `process.env.NODE_ENV !== 'production'` (show in dev, hide in prod)
   *
   * **Override behavior**:
   * - `true`: Always show error UI
   * - `false`: Never show error UI (emit event only)
   * - `undefined`: Environment-based (dev: show, prod: hide)
   *
   * **Example**:
   * ```typescript
   * <error-boundary show-error-ui={true}>...</error-boundary>
   * ```
   */
  @Prop() showErrorUI?: boolean;

  /**
   * Custom error fallback renderer
   *
   * **Purpose**: Render custom error UI
   * **Default**: Uses default error UI (red box with message)
   *
   * **Function signature**:
   * ```typescript
   * (error: Error, errorInfo: BaseErrorInfo, retry?: () => void) => any
   * ```
   *
   * **Example**:
   * ```typescript
   * errorBoundaryEl.errorFallback = (error, errorInfo, retry) => (
   *   <div class="custom-error">
   *     <h3>{error.message}</h3>
   *     <button onClick={retry}>Try Again</button>
   *   </div>
   * );
   * ```
   */
  @Prop() errorFallback?: ErrorFallbackRenderer;

  /**
   * Error recovery strategy
   *
   * **Purpose**: Control how component recovers from errors
   * **Default**: Auto-determined from error classification
   *
   * **Strategies**:
   * - `graceful`: Show fallback UI, emit event, continue operation
   * - `strict`: Re-throw error, propagate to parent
   * - `retry`: Attempt automatic retry (not implemented for render errors)
   * - `ignore`: Swallow error, render nothing
   *
   * **Example**:
   * ```typescript
   * <error-boundary recovery-strategy="graceful">...</error-boundary>
   * ```
   */
  @Prop() recoveryStrategy?: ErrorRecoveryStrategy;

  /**
   * Additional context for error info
   *
   * **Purpose**: Add domain-specific context to error events
   * **Default**: {}
   *
   * **Example** (grid-builder specific):
   * ```typescript
   * <error-boundary context={{ itemId: 'item-123', canvasId: 'canvas1' }}>
   *   ...
   * </error-boundary>
   * ```
   */
  @Prop() context?: Record<string, any>;

  /**
   * Error event emitter
   *
   * **Purpose**: Notify parent components of errors
   * **Event name**: 'error'
   * **Detail type**: BaseErrorEventDetail
   *
   * **Event structure**:
   * ```typescript
   * {
   *   error: Error,              // The caught error
   *   errorInfo: {
   *     errorBoundary: string,   // Which boundary caught it
   *     timestamp: number,
   *     userAgent: string,
   *     componentStack?: string,
   *     ...context               // Additional context
   *   },
   *   severity: 'critical' | 'error' | 'warning' | 'info',
   *   recoverable: boolean
   * }
   * ```
   *
   * **Example**:
   * ```typescript
   * <error-boundary onError={(e) => {
   *   console.error('Error caught:', e.detail.error);
   *   logToSentry(e.detail);
   * }}>
   *   ...
   * </error-boundary>
   * ```
   */
  @Event({
    eventName: 'error',
    composed: true,
    cancelable: false,
    bubbles: true,
  })
  errorEvent: EventEmitter<BaseErrorEventDetail>;

  /**
   * Error state (internal)
   *
   * **Purpose**: Track caught error for error UI
   * **Lifecycle**: Set when error caught, cleared on retry
   */
  @State() private caughtError: Error | null = null;

  /**
   * Error info state (internal)
   *
   * **Purpose**: Track error context for error UI
   * **Lifecycle**: Set when error caught, cleared on retry
   */
  @State() private errorInfo: BaseErrorInfo | null = null;

  /**
   * Host element reference
   *
   * **Purpose**: Access to error-boundary element
   */
  @Element() private el!: HTMLElement;

  /**
   * Render error caught flag (internal)
   *
   * **Purpose**: Track if error was caught during this render cycle
   * **Why needed**: Prevent infinite error loops (error → render → error → ...)
   */
  private renderErrorCaught: boolean = false;

  /**
   * Component will render lifecycle hook
   *
   * **Purpose**: Reset render error flag before each render
   */
  componentWillRender() {
    this.renderErrorCaught = false;
  }

  /**
   * Handle caught error
   *
   * **Purpose**: Process error, emit event, update state
   * **Called from**: renderContent() try/catch block
   *
   * **Implementation**:
   * 1. Classify error (type, severity, recoverability)
   * 2. Build error event detail
   * 3. Emit error event
   * 4. Update state for error UI
   * 5. Apply recovery strategy
   *
   * @param error - Caught error
   */
  private handleError(error: Error): void {
    // Prevent infinite error loops
    if (this.renderErrorCaught) {
      console.error('ErrorBoundary: Infinite error loop detected', error);
      return;
    }
    this.renderErrorCaught = true;

    // Build error event detail
    const eventDetail = buildErrorEventDetail(error, this.errorBoundary, this.context);

    // Classify error to determine recovery strategy
    const classification = classifyError(error);
    const strategy = this.recoveryStrategy || getRecommendedStrategy(error, classification);

    // Emit error event to parent
    this.errorEvent.emit(eventDetail);

    // Update state for error UI (only if graceful recovery)
    if (strategy === 'graceful') {
      this.caughtError = error;
      this.errorInfo = eventDetail.errorInfo;
    } else if (strategy === 'strict') {
      // Re-throw error to propagate upward
      throw error;
    } else if (strategy === 'ignore') {
      // Swallow error, log to console
      console.warn('ErrorBoundary: Ignoring error (recovery strategy: ignore)', error);
    }
  }

  /**
   * Retry handler (for error UI "Retry" button)
   *
   * **Purpose**: Clear error state and re-render children
   * **Trigger**: User clicks retry button in error UI
   *
   * **Implementation**:
   * 1. Clear error state
   * 2. StencilJS re-renders component
   * 3. If error still occurs, caught again by handleError()
   */
  private handleRetry = (): void => {
    this.caughtError = null;
    this.errorInfo = null;
    this.renderErrorCaught = false;
  };

  /**
   * Simulate Error (Public API for demos/testing)
   *
   * **Purpose**: Manually trigger error boundary for demonstration or testing
   * **Use case**: Storybook stories, E2E tests, demo scenarios
   *
   * **Example**:
   * ```typescript
   * const errorBoundary = document.querySelector('error-boundary');
   * await errorBoundary.simulateError(new Error('Test error'));
   * ```
   *
   * @param error - Error to simulate (or string message)
   * @returns Promise<void>
   */
  @Method()
  async simulateError(error: Error | string): Promise<void> {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    this.handleError(errorObj);
  }

  /**
   * Render child content with error boundary
   *
   * **Purpose**: Try to render children, catch errors if they occur
   * **Returns**: Rendered content or null if error and ignoring
   *
   * **Error handling flow**:
   * 1. Try to render slot content
   * 2. If error thrown, catch and handle
   * 3. Return null to prevent error propagation
   */
  private renderContent() {
    try {
      // Get slot content
      const slotContent = this.el.querySelector(':not([slot])');

      // If no content, return empty
      if (!slotContent) {
        return null;
      }

      // Return slot wrapper
      return <slot></slot>;
    } catch (error) {
      // Catch render errors
      const actualError = error instanceof Error ? error : new Error(String(error));
      this.handleError(actualError);
      return null;
    }
  }

  /**
   * Render default error fallback UI
   *
   * **Purpose**: Show error message when no custom fallback provided
   * **Appears**: In development mode by default, or when showErrorUI=true
   *
   * **UI elements**:
   * - Error icon (emoji based on severity)
   * - Error message (user-friendly or technical based on NODE_ENV)
   * - Retry button (calls handleRetry)
   * - Error details (in development mode)
   *
   * @returns JSX for default error UI
   */
  private renderDefaultFallback() {
    if (!this.caughtError || !this.errorInfo) {
      return null;
    }

    const classification = classifyError(this.caughtError);
    const icon = getErrorIcon(classification.severity);
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const message = formatErrorMessage(this.caughtError, classification, isDevelopment);

    return (
      <div class="error-boundary-fallback" data-severity={classification.severity}>
        <div class="error-boundary-header">
          <span class="error-boundary-icon">{icon}</span>
          <span class="error-boundary-title">
            {classification.severity === 'critical' ? 'Critical Error' : 'Error'}
          </span>
        </div>

        <div class="error-boundary-message">{message}</div>

        {isDevelopment && (
          <details class="error-boundary-details">
            <summary>Error Details (Development Only)</summary>
            <pre class="error-boundary-stack">
              {this.caughtError.stack || this.caughtError.message}
            </pre>
            {this.errorInfo.componentStack && (
              <div class="error-boundary-component-stack">
                <strong>Component Stack:</strong>
                <pre>{this.errorInfo.componentStack}</pre>
              </div>
            )}
          </details>
        )}

        {classification.recoverable && (
          <button class="error-boundary-retry" onClick={this.handleRetry}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  /**
   * Render custom error fallback (from prop or slot)
   *
   * **Purpose**: Use custom error UI instead of default
   * **Priority**:
   * 1. errorFallback prop (renderer function)
   * 2. slot="fallback" (custom JSX/HTML)
   * 3. Default fallback (built-in UI)
   *
   * @returns JSX for custom error UI or null
   */
  private renderCustomFallback() {
    if (!this.caughtError || !this.errorInfo) {
      return null;
    }

    // 1. Try errorFallback prop (renderer function)
    if (this.errorFallback) {
      const rendered = this.errorFallback(this.caughtError, this.errorInfo, this.handleRetry);

      // Handle both HTMLElement and JSX returns
      if (rendered instanceof HTMLElement) {
        return (
          <div
            class="error-boundary-custom"
            ref={(el) => el && !el.hasChildNodes() && el.appendChild(rendered)}
          />
        );
      }
      return <div class="error-boundary-custom">{rendered}</div>;
    }

    // 2. Try slot="fallback" (custom JSX/HTML)
    const fallbackSlot = this.el.querySelector('[slot="fallback"]');
    if (fallbackSlot) {
      return (
        <div class="error-boundary-custom">
          <slot name="fallback"></slot>
        </div>
      );
    }

    // 3. No custom fallback, return null (will use default)
    return null;
  }

  /**
   * Render error boundary component
   *
   * **Purpose**: Wrap children with error catching and recovery
   *
   * **Render logic**:
   * 1. If no error caught, render children normally
   * 2. If error caught and showErrorUI enabled, render error UI
   * 3. If error caught and showErrorUI disabled, render nothing (emit event only)
   *
   * **Error UI priority**:
   * 1. Custom fallback (errorFallback prop or slot="fallback")
   * 2. Default fallback (built-in error UI)
   * 3. Nothing (if showErrorUI=false)
   */
  render() {
    // No error - render children normally
    if (!this.caughtError) {
      return (
        <div class="error-boundary-wrapper" data-error-boundary={this.errorBoundary}>
          {this.renderContent()}
        </div>
      );
    }

    // Error caught - determine if should show error UI
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const shouldShowUI =
      this.showErrorUI !== undefined ? this.showErrorUI : isDevelopment;

    if (!shouldShowUI) {
      // Error UI disabled - render nothing (event already emitted)
      return (
        <div
          class="error-boundary-wrapper error-boundary-hidden"
          data-error-boundary={this.errorBoundary}
        />
      );
    }

    // Render error UI (custom or default)
    const customFallback = this.renderCustomFallback();

    return (
      <div class="error-boundary-wrapper error-boundary-error" data-error-boundary={this.errorBoundary}>
        {customFallback || this.renderDefaultFallback()}
      </div>
    );
  }
}
