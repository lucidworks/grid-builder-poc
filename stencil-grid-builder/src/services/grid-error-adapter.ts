/**
 * Grid Error Adapter (Grid-Builder Specific)
 * ==========================================
 *
 * Adapter service that bridges generic error-boundary component to grid-builder domain.
 * Integrates with EventManager for dual-channel error reporting (@Event + EventManager).
 *
 * ## Design Principles
 *
 * **Adapter Pattern**:
 * - Converts generic BaseErrorEventDetail → GridErrorEventDetail
 * - Adds grid-specific context (itemId, canvasId, componentType)
 * - Routes errors to EventManager for plugin consumption
 *
 * **Instance-Based Architecture**:
 * - Each grid-builder instance has its own adapter
 * - Adapter holds reference to instance's EventManager
 * - Supports multiple grids on same page
 *
 * **Dual-Channel Error Reporting**:
 * - **@Event decorator**: Web component standard (bubbles up DOM)
 * - **EventManager**: Plugin API (programmatic subscription)
 * - Both channels receive same error data
 *
 * ## Usage
 *
 * **Create adapter for grid instance**:
 * ```typescript
 * const adapter = new GridErrorAdapter(eventManager, 'grid-1');
 * ```
 *
 * **Handle error from error-boundary**:
 * ```typescript
 * <error-boundary
 *   error-boundary="grid-item-wrapper"
 *   context={{ itemId: 'item-123', canvasId: 'canvas1' }}
 *   onError={(e) => adapter.handleErrorEvent(e.detail)}
 * />
 * ```
 *
 * **Wrap component render with error catching**:
 * ```typescript
 * render() {
 *   return adapter.wrapRender(
 *     'grid-item-wrapper',
 *     () => <div>Component content</div>,
 *     { itemId: this.itemId, canvasId: this.canvasId }
 *   );
 * }
 * ```
 * @module grid-error-adapter
 */

import { EventManager } from "./event-manager";
import {
  BaseErrorEventDetail,
  BaseErrorInfo,
  ErrorRecoveryStrategy,
  ErrorFallbackRenderer,
} from "../types/error-types";
import {
  GridErrorBoundaryLevel,
  GridErrorInfo,
  GridErrorEventDetail,
  buildGridErrorContext,
  getGridErrorSeverity,
  isGridErrorRecoverable,
  formatGridErrorMessage,
} from "../types/grid-error-types";
import { classifyError } from "../utils/error-handler";

/**
 * Grid error adapter options
 *
 * **Purpose**: Configure adapter behavior
 * **Use case**: Per-grid customization of error handling
 *
 * **Example**:
 * ```typescript
 * const adapter = new GridErrorAdapter(eventManager, 'grid-1', {
 *   showErrorUI: true,
 *   logErrors: true,
 *   reportToSentry: true
 * });
 * ```
 */
export interface GridErrorAdapterOptions {
  /**
   * Whether to show error UI by default
   * **Default**: Environment-based (dev: true, prod: false)
   */
  showErrorUI?: boolean;

  /**
   * Whether to log errors to console
   * **Default**: true
   */
  logErrors?: boolean;

  /**
   * Whether to report errors to external service (Sentry, etc.)
   * **Default**: false
   * **Note**: Host application must implement reportError callback
   */
  reportToSentry?: boolean;

  /**
   * Custom error fallback renderer for this grid instance
   * **Optional**: Overrides default error UI
   */
  errorFallback?: ErrorFallbackRenderer;

  /**
   * Recovery strategy for this grid instance
   * **Default**: Auto-determined per error
   */
  recoveryStrategy?: ErrorRecoveryStrategy;
}

/**
 * Grid error context for wrapping renders
 *
 * **Purpose**: Provide grid-specific context when wrapping component renders
 * **Required**: errorBoundary (which level caught error)
 * **Optional**: itemId, canvasId, componentType
 */
export interface GridErrorContext {
  /**
   * Which error boundary level
   * **Required**: One of 'grid-builder', 'canvas-section', 'grid-item-wrapper'
   */
  errorBoundary: GridErrorBoundaryLevel;

  /**
   * Grid item ID (if error in item-level boundary)
   * **Optional**: Only present for item-level errors
   */
  itemId?: string;

  /**
   * Canvas ID where error occurred
   * **Optional**: Only present for canvas/item errors
   */
  canvasId?: string;

  /**
   * Component type that failed
   * **Optional**: Only present for item-level render errors
   */
  componentType?: string;
}

/**
 * Grid Error Adapter
 * ===================
 *
 * Bridges generic error-boundary component to grid-builder domain.
 *
 * **Responsibilities**:
 * 1. Convert BaseErrorEventDetail → GridErrorEventDetail
 * 2. Emit errors to EventManager for plugin consumption
 * 3. Add grid-specific context (itemId, canvasId, componentType)
 * 4. Provide helper methods for wrapping component renders
 * 5. Coordinate error reporting across multiple channels
 *
 * **Instance-Based**:
 * - Each grid-builder instance creates its own adapter
 * - Adapter holds reference to instance's EventManager
 * - Supports multiple grids on same page
 *
 * **Example - grid-builder.tsx**:
 * ```typescript
 * export class GridBuilder {
 *   private errorAdapter: GridErrorAdapter;
 *
 *   componentWillLoad() {
 *     this.errorAdapter = new GridErrorAdapter(this.eventManager, this.apiRef.key);
 *   }
 *
 *   render() {
 *     return (
 *       <error-boundary
 *         error-boundary="grid-builder"
 *         onError={(e) => this.errorAdapter.handleErrorEvent(e.detail)}
 *       >
 *         {this.renderContent()}
 *       </error-boundary>
 *     );
 *   }
 * }
 * ```
 */
export class GridErrorAdapter {
  /**
   * Grid instance ID
   * **Purpose**: Identify which grid this adapter belongs to
   */
  private gridId: string;

  /**
   * EventManager instance for this grid
   * **Purpose**: Emit errors to plugin API
   */
  private eventManager: EventManager;

  /**
   * Adapter options
   * **Purpose**: Configure error handling behavior
   */
  private options: GridErrorAdapterOptions;

  /**
   * Create grid error adapter
   *
   * **Purpose**: Initialize adapter for grid instance
   * @param eventManager - EventManager instance for this grid
   * @param gridId - Grid instance identifier
   * @param options - Optional adapter configuration
   */
  constructor(
    eventManager: EventManager,
    gridId: string,
    options: GridErrorAdapterOptions = {},
  ) {
    this.eventManager = eventManager;
    this.gridId = gridId;
    this.options = {
      logErrors: true,
      reportToSentry: false,
      ...options,
    };
  }

  /**
   * Convert BaseErrorEventDetail to GridErrorEventDetail
   *
   * **Purpose**: Enrich generic error with grid-specific context
   * **Pure Function**: No side effects, deterministic
   *
   * **Conversion**:
   * 1. Extract base error info
   * 2. Add grid-specific fields (itemId, canvasId, componentType)
   * 3. Recalculate severity based on grid context
   * 4. Recalculate recoverability based on grid context
   *
   * **Example**:
   * ```typescript
   * const baseDetail: BaseErrorEventDetail = {
   * error: new Error('Component failed'),
   * errorInfo: {
   * errorBoundary: 'grid-item-wrapper',
   * itemId: 'item-123',
   * canvasId: 'canvas1',
   * componentType: 'header',
   * timestamp: Date.now()
   * },
   * severity: 'error',
   * recoverable: true
   * };
   *
   * const gridDetail = adapter.convertToGridError(baseDetail);
   * // gridDetail.errorInfo.errorBoundary is now typed as GridErrorBoundaryLevel
   * // gridDetail.errorInfo has itemId, canvasId, componentType
   * ```
   * @param baseDetail - Generic error event detail from error-boundary
   * @returns Grid-specific error event detail
   */
  convertToGridError(baseDetail: BaseErrorEventDetail): GridErrorEventDetail {
    // Extract grid-specific fields from context
    const { errorBoundary, itemId, canvasId, componentType, ...otherContext } =
      baseDetail.errorInfo;

    // Build grid error info
    const gridErrorInfo: GridErrorInfo = {
      errorBoundary: errorBoundary as GridErrorBoundaryLevel,
      itemId,
      canvasId,
      componentType,
      timestamp: baseDetail.errorInfo.timestamp,
      userAgent: baseDetail.errorInfo.userAgent,
      componentStack: baseDetail.errorInfo.componentStack,
      ...otherContext,
    };

    // Recalculate severity based on grid context
    const gridSeverity = getGridErrorSeverity(
      gridErrorInfo.errorBoundary,
      baseDetail.error,
    );

    // Recalculate recoverability based on grid context
    const gridRecoverable = isGridErrorRecoverable(
      gridErrorInfo.errorBoundary,
      baseDetail.error,
    );

    return {
      error: baseDetail.error,
      errorInfo: gridErrorInfo,
      severity: gridSeverity,
      recoverable: gridRecoverable,
    };
  }

  /**
   * Handle error event from error-boundary
   *
   * **Purpose**: Process error and emit to EventManager
   * **Called from**: error-boundary onError handler
   *
   * **Process**:
   * 1. Convert BaseErrorEventDetail → GridErrorEventDetail
   * 2. Log error (if enabled)
   * 3. Report to Sentry (if enabled)
   * 4. Emit to EventManager for plugin consumption
   *
   * **Example**:
   * ```typescript
   * <error-boundary
   * error-boundary="grid-item-wrapper"
   * context={{ itemId: 'item-123', canvasId: 'canvas1' }}
   * onError={(e) => this.errorAdapter.handleErrorEvent(e.detail)}
   * />
   * ```
   * @param baseDetail - Generic error event detail from error-boundary
   */
  handleErrorEvent(baseDetail: BaseErrorEventDetail): void {
    // Convert to grid error
    const gridDetail = this.convertToGridError(baseDetail);

    // Log error (if enabled)
    if (this.options.logErrors) {
      this.logError(gridDetail);
    }

    // Report to Sentry (if enabled and configured)
    if (this.options.reportToSentry) {
      this.reportError(gridDetail);
    }

    // Emit to EventManager for plugin consumption
    this.eventManager.emit("error", gridDetail);
  }

  /**
   * Log error to console
   *
   * **Purpose**: Developer-friendly error logging
   * **Format**: Different messages for different severity levels
   *
   * **Output format**:
   * - critical: console.error (red, with stack trace)
   * - error: console.error (red)
   * - warning: console.warn (yellow)
   * - info: console.info (blue)
   * @param detail - Grid error event detail
   */
  private logError(detail: GridErrorEventDetail): void {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const message = formatGridErrorMessage(
      detail.errorInfo,
      detail.error,
      isDevelopment,
    );

    const logData = {
      message,
      grid: this.gridId,
      errorBoundary: detail.errorInfo.errorBoundary,
      itemId: detail.errorInfo.itemId,
      canvasId: detail.errorInfo.canvasId,
      componentType: detail.errorInfo.componentType,
      severity: detail.severity,
      recoverable: detail.recoverable,
      timestamp: new Date(detail.errorInfo.timestamp).toISOString(),
    };

    switch (detail.severity) {
      case "critical":
        console.error("🔴 CRITICAL ERROR:", logData, detail.error);
        if (detail.error.stack) {
          console.error("Stack trace:", detail.error.stack);
        }
        break;

      case "error":
        console.error("❌ ERROR:", logData, detail.error);
        break;

      case "warning":
        console.warn("⚠️ WARNING:", logData, detail.error);
        break;

      case "info":
        console.info("ℹ️ INFO:", logData, detail.error);
        break;
    }
  }

  /**
   * Report error to external service (Sentry, etc.)
   *
   * **Purpose**: Send error to monitoring service
   * **Note**: Host application must configure Sentry or other service
   *
   * **Implementation**:
   * - Checks for global Sentry object
   * - Sends error with grid context
   * - Tags with grid ID, error boundary level, severity
   *
   * **Example - Host app configuration**:
   * ```typescript
   * // In host application
   * import * as Sentry from '@sentry/browser';
   *
   * Sentry.init({
   * dsn: 'YOUR_SENTRY_DSN',
   * environment: process.env.NODE_ENV
   * });
   *
   * // Grid builder will automatically report errors
   * ```
   * @param detail - Grid error event detail
   */
  private reportError(detail: GridErrorEventDetail): void {
    // Check if Sentry is available
    if (typeof window === "undefined" || !(window as any).Sentry) {
      console.warn(
        "GridErrorAdapter: Sentry is not configured, skipping error report",
      );
      return;
    }

    const Sentry = (window as any).Sentry;

    // Send to Sentry with context
    Sentry.withScope((scope: any) => {
      // Set context
      scope.setTag("grid-id", this.gridId);
      scope.setTag("error-boundary", detail.errorInfo.errorBoundary);
      scope.setTag("severity", detail.severity);
      scope.setLevel(
        detail.severity === "critical" ? "fatal" : detail.severity,
      );

      // Add grid-specific context
      scope.setContext("grid-error", {
        errorBoundary: detail.errorInfo.errorBoundary,
        itemId: detail.errorInfo.itemId,
        canvasId: detail.errorInfo.canvasId,
        componentType: detail.errorInfo.componentType,
        recoverable: detail.recoverable,
      });

      // Add component stack if available
      if (detail.errorInfo.componentStack) {
        scope.setContext("component-stack", {
          stack: detail.errorInfo.componentStack,
        });
      }

      // Capture exception
      Sentry.captureException(detail.error);
    });
  }

  /**
   * Create error boundary config for grid component
   *
   * **Purpose**: Factory for creating error boundary configurations
   * **Use case**: Simplify error boundary setup in grid components
   *
   * **Returns**: Configuration object for error-boundary component
   * - showErrorUI (from adapter options or environment)
   * - errorFallback (from adapter options if set)
   * - recoveryStrategy (from adapter options if set)
   * - context (grid-specific context)
   * - onError (bound to handleErrorEvent)
   *
   * **Example - grid-item-wrapper.tsx**:
   * ```typescript
   * render() {
   * const errorConfig = this.errorAdapter.createErrorBoundaryConfig(
   * 'grid-item-wrapper',
   * {
   * itemId: this.itemId,
   * canvasId: this.canvasId,
   * componentType: this.item.type
   * }
   * );
   *
   * return (
   * <error-boundary {...errorConfig}>
   * {this.renderItemContent()}
   * </error-boundary>
   * );
   * }
   * ```
   * @param errorBoundary - Which error boundary level
   * @param gridContext - Grid-specific context (itemId, canvasId, componentType)
   * @returns Error boundary configuration object
   */
  createErrorBoundaryConfig(
    errorBoundary: GridErrorBoundaryLevel,
    gridContext: Omit<GridErrorContext, "errorBoundary"> = {},
  ) {
    // Build context
    const context = buildGridErrorContext(errorBoundary, gridContext);

    // Determine showErrorUI
    const isDevelopment = process.env.NODE_ENV !== "production";
    const showErrorUI =
      this.options.showErrorUI !== undefined
        ? this.options.showErrorUI
        : isDevelopment;

    return {
      errorBoundary,
      showErrorUI,
      errorFallback: this.options.errorFallback,
      recoveryStrategy: this.options.recoveryStrategy,
      context,
      onError: (e: CustomEvent<BaseErrorEventDetail>) =>
        this.handleErrorEvent(e.detail),
    };
  }

  /**
   * Wrap component render with error handling
   *
   * **Purpose**: Simplify error boundary usage in component render methods
   * **Use case**: When you want error handling without JSX error-boundary wrapper
   *
   * **Important**: This does NOT provide error boundary isolation.
   * For true error boundaries, use <error-boundary> component.
   * This is just a try/catch helper with error reporting.
   *
   * **Example - Quick error handling**:
   * ```typescript
   * render() {
   * return this.errorAdapter.wrapRender(
   * 'grid-item-wrapper',
   * () => {
   * // Component render logic that might throw
   * return <div>{this.renderComplexContent()}</div>;
   * },
   * {
   * itemId: this.itemId,
   * canvasId: this.canvasId,
   * componentType: this.item.type
   * }
   * );
   * }
   * ```
   *
   * **Note**: For proper error isolation, prefer:
   * ```typescript
   * render() {
   * const config = this.errorAdapter.createErrorBoundaryConfig(...);
   * return (
   * <error-boundary {...config}>
   * {this.renderContent()}
   * </error-boundary>
   * );
   * }
   * ```
   * @param errorBoundary - Which error boundary level
   * @param renderFn - Render function that might throw
   * @param gridContext - Grid-specific context
   * @returns Rendered content or error fallback
   */
  wrapRender(
    errorBoundary: GridErrorBoundaryLevel,
    renderFn: () => any,
    gridContext: Omit<GridErrorContext, "errorBoundary"> = {},
  ): any {
    try {
      return renderFn();
    } catch (error) {
      const actualError =
        error instanceof Error ? error : new Error(String(error));

      // Build error context
      const context = buildGridErrorContext(errorBoundary, gridContext);
      const errorInfo: BaseErrorInfo = {
        errorBoundary,
        timestamp: Date.now(),
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        ...context,
      };

      // Classify error
      const classification = classifyError(actualError);

      // Build event detail
      const baseDetail: BaseErrorEventDetail = {
        error: actualError,
        errorInfo,
        severity: classification.severity,
        recoverable: classification.recoverable,
      };

      // Handle error
      this.handleErrorEvent(baseDetail);

      // Return fallback (if custom fallback renderer provided)
      if (this.options.errorFallback) {
        return this.options.errorFallback(actualError, errorInfo, undefined);
      }

      // Return null (graceful degradation)
      return null;
    }
  }

  /**
   * Get error adapter options
   *
   * **Purpose**: Access current adapter configuration
   * **Use case**: Debugging, configuration introspection
   * @returns Current adapter options
   */
  getOptions(): GridErrorAdapterOptions {
    return { ...this.options };
  }

  /**
   * Update adapter options
   *
   * **Purpose**: Reconfigure adapter at runtime
   * **Use case**: Dynamic error handling behavior changes
   *
   * **Example**:
   * ```typescript
   * // Enable error UI for debugging
   * adapter.updateOptions({ showErrorUI: true });
   *
   * // Disable logging in production
   * adapter.updateOptions({ logErrors: false });
   * ```
   * @param options - Partial options to update
   */
  updateOptions(options: Partial<GridErrorAdapterOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Get grid ID
   *
   * **Purpose**: Identify which grid this adapter belongs to
   * **Use case**: Debugging, multi-grid scenarios
   * @returns Grid instance identifier
   */
  getGridId(): string {
    return this.gridId;
  }
}
