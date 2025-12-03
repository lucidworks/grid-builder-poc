/**
 * Base Error Types (Generic - Extractable)
 * =========================================
 *
 * Generic error boundary types with zero dependencies on grid-builder.
 * These types can be extracted to a standalone @lucidworks/stencil-error-boundary package.
 *
 * ## Design Principles
 *
 * **Generic and Reusable**:
 * - No grid-builder specific imports
 * - No assumptions about component structure
 * - Context provided via generic Record<string, any>
 *
 * **Extensible**:
 * - Base interfaces can be extended by consuming libraries
 * - Severity levels support custom values
 * - Context supports arbitrary metadata
 *
 * **StencilJS Compatible**:
 * - Works with @Event decorator
 * - Compatible with CustomEvent dispatch
 * - Type-safe error event details
 * @module error-types
 */

/**
 * Error severity levels
 *
 * **Usage**:
 * - `critical`: Application cannot continue (plugin init failed, state corrupted)
 * - `error`: Feature broken but app continues (component render failed)
 * - `warning`: Degraded experience (fallback UI shown)
 * - `info`: Informational (recovered automatically)
 */
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Error boundary level identifier
 *
 * **Generic version**: Uses string for maximum flexibility
 * **Grid-specific**: Extends with union type ('grid-builder' | 'canvas-section' | 'grid-item-wrapper')
 */
export type ErrorBoundaryLevel = string;

/**
 * Error recovery strategy
 *
 * **Strategies**:
 * - `graceful`: Render fallback UI, emit event, continue operation
 * - `strict`: Halt operation, propagate error upward
 * - `retry`: Attempt automatic retry (with exponential backoff)
 * - `ignore`: Log error but continue without UI change
 */
export type ErrorRecoveryStrategy = 'graceful' | 'strict' | 'retry' | 'ignore';

/**
 * Base error information context
 *
 * **Purpose**: Capture error context without assuming specific fields
 * **Extensible**: Consuming libraries add domain-specific fields
 *
 * **Base Fields**:
 * - `componentStack`: Component hierarchy at error point
 * - `errorBoundary`: Which boundary caught the error
 * - `timestamp`: When error occurred (milliseconds since epoch)
 * - `userAgent`: Browser information for debugging
 *
 * **Example Extension** (grid-builder):
 * ```typescript
 * interface GridErrorInfo extends BaseErrorInfo {
 *   itemId?: string;
 *   canvasId?: string;
 *   componentType?: string;
 * }
 * ```
 */
export interface BaseErrorInfo {
  /**
   * Component stack trace (if available)
   *
   * **Format**: String representation of component hierarchy
   * **Example**: "ErrorBoundary > MyComponent > ChildComponent"
   */
  componentStack?: string;

  /**
   * Which error boundary caught this error
   *
   * **Generic**: Any string identifier
   * **Grid-specific**: 'grid-builder' | 'canvas-section' | 'grid-item-wrapper'
   */
  errorBoundary: ErrorBoundaryLevel;

  /**
   * When error occurred (milliseconds since epoch)
   *
   * **Usage**: Error tracking, debugging, filtering
   */
  timestamp: number;

  /**
   * Browser user agent string
   *
   * **Purpose**: Help debug browser-specific errors
   */
  userAgent?: string;

  /**
   * Additional context (domain-specific)
   *
   * **Generic**: Allows arbitrary metadata
   * **Grid Example**: { itemId: 'item-123', canvasId: 'canvas1' }
   */
  [key: string]: any;
}

/**
 * Base error event detail
 *
 * **Purpose**: Type-safe error event payload for CustomEvent
 * **Used by**: @Event decorator, CustomEvent dispatch
 *
 * **Generic Design**:
 * - Works with any Error subclass
 * - Extensible error info via BaseErrorInfo
 * - Severity and recoverability flags
 *
 * **Example Usage**:
 * ```typescript
 * const errorEvent = new CustomEvent('error', {
 *   detail: {
 *     error: new Error('Component failed'),
 *     errorInfo: { errorBoundary: 'my-component', timestamp: Date.now() },
 *     severity: 'error',
 *     recoverable: true
 *   }
 * });
 * ```
 */
export interface BaseErrorEventDetail {
  /**
   * The caught error object
   *
   * **Type**: Any Error subclass (Error, TypeError, CustomError, etc.)
   */
  error: Error;

  /**
   * Error context information
   *
   * **Extensible**: BaseErrorInfo can be extended by consuming libraries
   */
  errorInfo: BaseErrorInfo;

  /**
   * Error severity level
   *
   * **Determines**: UI treatment, logging level, user notification
   */
  severity: ErrorSeverity;

  /**
   * Whether error is recoverable
   *
   * **true**: Application can continue (show fallback UI)
   * **false**: Application should halt or reload
   */
  recoverable: boolean;
}

/**
 * Error fallback renderer function
 *
 * **Purpose**: Custom error UI rendering
 * **Returns**: JSX element or HTMLElement
 *
 * **Parameters**:
 * - `error`: The caught error
 * - `errorInfo`: Error context and metadata
 * - `retry`: Optional retry callback (if supported)
 *
 * **Example**:
 * ```typescript
 * const fallbackRenderer: ErrorFallbackRenderer = (error, errorInfo, retry) => (
 *   <div class="error-ui">
 *     <h3>{error.message}</h3>
 *     <button onClick={retry}>Retry</button>
 *   </div>
 * );
 * ```
 */
export type ErrorFallbackRenderer = (
  error: Error,
  errorInfo: BaseErrorInfo,
  retry?: () => void,
) => any;

/**
 * Error callback function
 *
 * **Purpose**: Imperative error handling (logging, analytics, etc.)
 * **Alternative**: Use @Event decorator for declarative handling
 *
 * **Example**:
 * ```typescript
 * const errorCallback: ErrorCallback = (detail) => {
 *   console.error('Error caught:', detail.error);
 *   logToSentry(detail.error, detail.errorInfo);
 * };
 * ```
 */
export type ErrorCallback = (detail: BaseErrorEventDetail) => void;

/**
 * Error boundary configuration
 *
 * **Purpose**: Configure error boundary behavior
 * **Generic**: No grid-specific assumptions
 *
 * **Options**:
 * - `showErrorUI`: Display error UI (default: dev mode only)
 * - `errorFallback`: Custom error UI renderer
 * - `onError`: Error callback (alternative to @Event)
 * - `recoveryStrategy`: How to handle errors
 * - `context`: Additional context for error info
 */
export interface ErrorBoundaryConfig {
  /**
   * Whether to show error UI
   *
   * **Default**: true in development, false in production
   * **Override**: Explicitly set to true/false
   */
  showErrorUI?: boolean;

  /**
   * Custom error fallback renderer
   *
   * **Purpose**: Replace default error UI
   * **Returns**: JSX element or HTMLElement
   */
  errorFallback?: ErrorFallbackRenderer;

  /**
   * Error callback (imperative)
   *
   * **Alternative**: Use @Event for declarative handling
   * **Use case**: Legacy code, non-StencilJS integration
   */
  onError?: ErrorCallback;

  /**
   * Recovery strategy
   *
   * **Default**: 'graceful' (show fallback UI, continue)
   * **Strict**: Propagate error upward
   * **Retry**: Attempt automatic retry
   */
  recoveryStrategy?: ErrorRecoveryStrategy;

  /**
   * Additional context for error info
   *
   * **Purpose**: Inject domain-specific context
   * **Example**: { feature: 'dashboard', userId: '123' }
   */
  context?: Record<string, any>;
}

/**
 * Error classification result
 *
 * **Purpose**: Classify error for appropriate handling
 * **Used by**: error-handler.ts utilities
 *
 * **Classification**:
 * - `type`: Error category (network, validation, runtime, etc.)
 * - `severity`: How serious the error is
 * - `recoverable`: Can we continue or must we halt
 * - `shouldReport`: Should this be logged/reported
 */
export interface ErrorClassification {
  /**
   * Error category
   *
   * **Examples**: 'network', 'validation', 'runtime', 'permission', 'timeout'
   */
  type: string;

  /**
   * Error severity level
   */
  severity: ErrorSeverity;

  /**
   * Whether error is recoverable
   */
  recoverable: boolean;

  /**
   * Whether error should be reported to monitoring
   *
   * **false**: Expected errors (validation), don't spam logs
   * **true**: Unexpected errors, should be investigated
   */
  shouldReport: boolean;

  /**
   * Suggested user-facing message
   *
   * **Purpose**: Friendly error message for UI
   * **Example**: "Unable to load component. Please try again."
   */
  userMessage?: string;
}
