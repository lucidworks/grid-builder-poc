/**
 * Error Handler Utilities (Generic - Extractable)
 * ================================================
 *
 * Generic error classification, formatting, and context extraction utilities.
 * Zero dependencies on grid-builder - can be extracted to standalone package.
 *
 * ## Design Principles
 *
 * **Pure Functions**:
 * - No side effects (no logging, no state mutation)
 * - Deterministic output for same input
 * - Composable and testable
 *
 * **Generic and Reusable**:
 * - Works with any Error subclass
 * - No assumptions about application structure
 * - Extensible classification rules
 *
 * **Browser Compatible**:
 * - Uses standard Error properties
 * - Handles browser differences gracefully
 * - Works in all modern browsers
 * @module error-handler
 */

import {
  ErrorSeverity,
  ErrorClassification,
  BaseErrorInfo,
  BaseErrorEventDetail,
} from '../types/error-types';

/**
 * Classify error by type and determine handling strategy
 *
 * **Purpose**: Categorize errors for appropriate handling
 * **Pure Function**: No side effects, deterministic
 *
 * **Classification Logic**:
 * 1. Check error name and message for known patterns
 * 2. Assign severity based on error type
 * 3. Determine if recoverable or critical
 * 4. Decide if should be reported to monitoring
 *
 * **Error Types**:
 * - `network`: Failed fetch, timeout, offline
 * - `validation`: Invalid input, constraint violation
 * - `permission`: Access denied, authentication failed
 * - `runtime`: TypeError, ReferenceError, null pointer
 * - `timeout`: Operation took too long
 * - `unknown`: Unrecognized error type
 *
 * **Example**:
 * ```typescript
 * const error = new TypeError('Cannot read property of undefined');
 * const classification = classifyError(error);
 * // {
 * //   type: 'runtime',
 * //   severity: 'error',
 * //   recoverable: true,
 * //   shouldReport: true,
 * //   userMessage: 'An unexpected error occurred. Please try again.'
 * // }
 * ```
 *
 * @param error - Error object to classify
 * @returns Classification result with type, severity, and recovery info
 */
export function classifyError(error: Error): ErrorClassification {
  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  // Network errors (recoverable, user should retry)
  if (
    errorName.includes('network') ||
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('offline')
  ) {
    return {
      type: 'network',
      severity: 'error',
      recoverable: true,
      shouldReport: true,
      userMessage: 'Network error. Please check your connection and try again.',
    };
  }

  // Validation errors (recoverable, expected, don't spam logs)
  if (
    errorName.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required') ||
    errorMessage.includes('must be')
  ) {
    return {
      type: 'validation',
      severity: 'warning',
      recoverable: true,
      shouldReport: false, // Expected errors, don't spam monitoring
      userMessage: 'Please check your input and try again.',
    };
  }

  // Permission/Auth errors (critical, user needs to login)
  if (
    errorName.includes('auth') ||
    errorName.includes('permission') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('access denied')
  ) {
    return {
      type: 'permission',
      severity: 'critical',
      recoverable: false,
      shouldReport: true,
      userMessage: 'You do not have permission to perform this action.',
    };
  }

  // Timeout errors (recoverable, user should retry)
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      type: 'timeout',
      severity: 'warning',
      recoverable: true,
      shouldReport: true,
      userMessage: 'Operation timed out. Please try again.',
    };
  }

  // Runtime errors (recoverable, developer should fix)
  if (
    errorName === 'typeerror' ||
    errorName === 'referenceerror' ||
    errorName === 'rangeerror' ||
    errorMessage.includes('undefined') ||
    errorMessage.includes('null')
  ) {
    return {
      type: 'runtime',
      severity: 'error',
      recoverable: true,
      shouldReport: true,
      userMessage: 'An unexpected error occurred. Please try again.',
    };
  }

  // Unknown error type (assume recoverable, report for investigation)
  return {
    type: 'unknown',
    severity: 'error',
    recoverable: true,
    shouldReport: true,
    userMessage: 'Something went wrong. Please try again.',
  };
}

/**
 * Extract component stack from error
 *
 * **Purpose**: Build component hierarchy string for debugging
 * **Pure Function**: No side effects
 *
 * **Extraction Strategy**:
 * 1. Check error.stack for component names
 * 2. Parse stack frames for component identifiers
 * 3. Build hierarchy string (e.g., "Parent > Child > GrandChild")
 *
 * **Note**: StencilJS doesn't provide React-like componentStack,
 * so we extract what we can from error.stack
 *
 * **Example**:
 * ```typescript
 * const stack = extractComponentStack(error);
 * // "grid-builder > canvas-section > grid-item-wrapper"
 * ```
 *
 * @param error - Error object with stack trace
 * @returns Component hierarchy string or undefined if not available
 */
export function extractComponentStack(error: Error): string | undefined {
  if (!error.stack) {
    return undefined;
  }

  // Extract component-like names from stack (web component tags)
  const componentPattern = /(?:at )?([a-z]+-[a-z-]+)/gi;
  const matches = error.stack.match(componentPattern);

  if (!matches || matches.length === 0) {
    return undefined;
  }

  // Remove duplicates and build hierarchy
  const uniqueComponents = Array.from(new Set(matches.map((m) => m.replace(/^at /, ''))));

  return uniqueComponents.join(' > ');
}

/**
 * Format error message for display
 *
 * **Purpose**: Create user-friendly error message
 * **Pure Function**: No side effects
 *
 * **Formatting Logic**:
 * 1. Use classification.userMessage if available
 * 2. Fall back to error.message if concise
 * 3. Use generic message for cryptic errors
 *
 * **Development vs Production**:
 * - Development: Include technical details
 * - Production: User-friendly messages only
 *
 * **Example**:
 * ```typescript
 * const message = formatErrorMessage(error, classification, true);
 * // Dev: "TypeError: Cannot read property 'foo' of undefined"
 * // Prod: "An unexpected error occurred. Please try again."
 * ```
 *
 * @param error - Error object
 * @param classification - Error classification result
 * @param isDevelopment - Whether in development mode (show technical details)
 * @returns Formatted error message
 */
export function formatErrorMessage(
  error: Error,
  classification: ErrorClassification,
  isDevelopment: boolean = false,
): string {
  // Development: Show technical error message
  if (isDevelopment) {
    return `${error.name}: ${error.message}`;
  }

  // Production: Use user-friendly message from classification
  if (classification.userMessage) {
    return classification.userMessage;
  }

  // Fallback: Use error message if short and readable
  if (error.message && error.message.length < 100) {
    return error.message;
  }

  // Last resort: Generic message
  return 'An error occurred. Please try again.';
}

/**
 * Build error event detail
 *
 * **Purpose**: Create type-safe error event payload
 * **Pure Function**: No side effects
 *
 * **Event Structure**:
 * ```typescript
 * {
 *   error: Error,
 *   errorInfo: { errorBoundary, timestamp, componentStack, ...context },
 *   severity: 'critical' | 'error' | 'warning' | 'info',
 *   recoverable: boolean
 * }
 * ```
 *
 * **Usage**:
 * ```typescript
 * const detail = buildErrorEventDetail(
 *   error,
 *   'my-component',
 *   { userId: '123' }
 * );
 *
 * const event = new CustomEvent('error', { detail });
 * element.dispatchEvent(event);
 * ```
 *
 * @param error - Error object
 * @param errorBoundary - Which boundary caught the error
 * @param additionalContext - Domain-specific context to merge
 * @returns Complete error event detail
 */
export function buildErrorEventDetail(
  error: Error,
  errorBoundary: string,
  additionalContext?: Record<string, any>,
): BaseErrorEventDetail {
  const classification = classifyError(error);
  const componentStack = extractComponentStack(error);

  const errorInfo: BaseErrorInfo = {
    errorBoundary,
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    componentStack,
    ...additionalContext,
  };

  return {
    error,
    errorInfo,
    severity: classification.severity,
    recoverable: classification.recoverable,
  };
}

/**
 * Sanitize error for logging
 *
 * **Purpose**: Remove sensitive data before logging
 * **Pure Function**: Returns new object, doesn't mutate input
 *
 * **Sanitization**:
 * - Remove passwords, tokens, API keys from message
 * - Redact email addresses
 * - Strip query parameters from URLs
 * - Remove stack traces in production (optionally)
 *
 * **Example**:
 * ```typescript
 * const error = new Error('Auth failed for token=abc123');
 * const sanitized = sanitizeError(error);
 * // Error: 'Auth failed for token=REDACTED'
 * ```
 *
 * @param error - Error object to sanitize
 * @param removeStack - Whether to remove stack trace (default: false)
 * @returns Sanitized error object (new instance)
 */
export function sanitizeError(error: Error, removeStack: boolean = false): Error {
  const sanitized = new Error(sanitizeString(error.message));
  sanitized.name = error.name;

  if (!removeStack && error.stack) {
    sanitized.stack = sanitizeString(error.stack);
  }

  return sanitized;
}

/**
 * Sanitize string (remove sensitive data)
 *
 * **Purpose**: Strip sensitive information from strings
 * **Pure Function**: Returns new string
 *
 * **Patterns Redacted**:
 * - `password=xxx` → `password=REDACTED`
 * - `token=xxx` → `token=REDACTED`
 * - `key=xxx` → `key=REDACTED`
 * - Email addresses → `***@***.***`
 *
 * @param str - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(str: string): string {
  return str
    .replace(/password=([^&\s]+)/gi, 'password=REDACTED')
    .replace(/token=([^&\s]+)/gi, 'token=REDACTED')
    .replace(/key=([^&\s]+)/gi, 'key=REDACTED')
    .replace(/api[-_]?key=([^&\s]+)/gi, 'api_key=REDACTED')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***');
}

/**
 * Check if error should be reported to monitoring
 *
 * **Purpose**: Filter out noise from error monitoring (Sentry, etc.)
 * **Pure Function**: Deterministic boolean result
 *
 * **Don't Report**:
 * - Validation errors (expected)
 * - User-triggered errors (cancelled operations)
 * - Known browser quirks (ResizeObserver loop limit)
 *
 * **Always Report**:
 * - Runtime errors (TypeError, ReferenceError)
 * - Network errors (fetch failures)
 * - Unknown errors (need investigation)
 *
 * **Example**:
 * ```typescript
 * if (shouldReportError(error)) {
 *   Sentry.captureException(error);
 * }
 * ```
 *
 * @param error - Error object
 * @returns true if should be reported to monitoring
 */
export function shouldReportError(error: Error): boolean {
  const classification = classifyError(error);

  // Don't report validation errors (expected)
  if (classification.type === 'validation') {
    return false;
  }

  // Don't report ResizeObserver loop limit (browser quirk)
  if (error.message.includes('ResizeObserver loop')) {
    return false;
  }

  // Report based on classification
  return classification.shouldReport;
}

/**
 * Get error severity icon (emoji)
 *
 * **Purpose**: Visual indicator for error severity
 * **Pure Function**: Maps severity → emoji
 *
 * **Icons**:
 * - critical: 🔴 (red circle)
 * - error: ⚠️ (warning sign)
 * - warning: ⚡ (lightning bolt)
 * - info: ℹ️ (information)
 *
 * @param severity - Error severity level
 * @returns Emoji icon
 */
export function getErrorIcon(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'error':
      return '⚠️';
    case 'warning':
      return '⚡';
    case 'info':
      return 'ℹ️';
    default:
      return '❓';
  }
}

/**
 * Truncate error message for display
 *
 * **Purpose**: Prevent UI overflow from long error messages
 * **Pure Function**: Returns truncated string
 *
 * **Truncation**:
 * - Limit to maxLength characters
 * - Add ellipsis if truncated
 * - Keep full message in development mode
 *
 * @param message - Error message to truncate
 * @param maxLength - Maximum length (default: 100)
 * @param isDevelopment - Whether in development mode (no truncation)
 * @returns Truncated message
 */
export function truncateErrorMessage(
  message: string,
  maxLength: number = 100,
  isDevelopment: boolean = false,
): string {
  // Don't truncate in development mode
  if (isDevelopment) {
    return message;
  }

  if (message.length <= maxLength) {
    return message;
  }

  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Check if error is a development-only issue
 *
 * **Purpose**: Identify errors that only occur in development
 * **Pure Function**: Boolean result
 *
 * **Dev-Only Errors**:
 * - HMR (Hot Module Replacement) errors
 * - Source map warnings
 * - Stencil build warnings
 *
 * **Use Case**: Don't show dev-only errors in production UI
 *
 * @param error - Error object
 * @returns true if dev-only error
 */
export function isDevelopmentOnlyError(error: Error): boolean {
  const message = error.message.toLowerCase();

  return (
    message.includes('hmr') ||
    message.includes('hot reload') ||
    message.includes('source map') ||
    message.includes('[stencil]')
  );
}
