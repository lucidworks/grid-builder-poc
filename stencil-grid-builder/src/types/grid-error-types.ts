/**
 * Grid-Specific Error Types (Grid-Builder Domain)
 * =================================================
 *
 * Grid-builder specific error types extending the generic base error types.
 * These types add grid-specific context (itemId, canvasId, componentType).
 *
 * ## Design Principles
 *
 * **Domain Extension**:
 * - Extends generic BaseErrorInfo with grid fields
 * - Maintains compatibility with base error boundary
 * - Adds grid-specific event types
 *
 * **EventManager Integration**:
 * - Designed for EventManager.emit() compatibility
 * - Matches plugin API event structure
 * - Supports both @Event and EventManager patterns
 *
 * **Type Safety**:
 * - Strong typing for grid context fields
 * - Union types for boundary levels
 * - Discriminated unions for error sources
 * @module grid-error-types
 */

import {
  BaseErrorInfo,
  BaseErrorEventDetail,
  ErrorSeverity,
} from "./error-types";

/**
 * Grid-specific error boundary levels
 *
 * **Purpose**: Type-safe boundary identifiers for grid-builder
 * **Hierarchy**: grid-builder → canvas-section → grid-item-wrapper
 *
 * **Error isolation strategy**:
 * - Level 1 (grid-builder): Plugin init, API creation, global state
 * - Level 2 (canvas-section): Dropzone, canvas rendering, canvas state
 * - Level 3 (grid-item-wrapper): Component render (user-provided code)
 *
 * **Example**:
 * ```typescript
 * const errorInfo: GridErrorInfo = {
 *   errorBoundary: 'grid-item-wrapper',  // Type-safe
 *   itemId: 'item-123',
 *   canvasId: 'canvas1'
 * };
 * ```
 */
export type GridErrorBoundaryLevel =
  | "grid-builder"
  | "canvas-section"
  | "grid-item-wrapper";

/**
 * Grid-specific error information
 *
 * **Purpose**: Extend BaseErrorInfo with grid-specific context
 * **Used by**: GridErrorAdapter, error event handlers
 *
 * **Grid-specific fields**:
 * - `itemId`: Which grid item (if error in item-level boundary)
 * - `canvasId`: Which canvas section
 * - `componentType`: Type of component that failed
 *
 * **Example**:
 * ```typescript
 * const errorInfo: GridErrorInfo = {
 *   errorBoundary: 'grid-item-wrapper',
 *   timestamp: Date.now(),
 *   itemId: 'item-123',
 *   canvasId: 'canvas1',
 *   componentType: 'header',
 *   userAgent: navigator.userAgent
 * };
 * ```
 */
export interface GridErrorInfo extends BaseErrorInfo {
  /**
   * Grid-builder specific error boundary level
   */
  errorBoundary: GridErrorBoundaryLevel;

  /**
   * Grid item ID (if error in grid-item-wrapper)
   * **Optional**: Only present for item-level errors
   */
  itemId?: string;

  /**
   * Canvas ID where error occurred
   * **Optional**: Only present for canvas/item errors
   */
  canvasId?: string;

  /**
   * Component type that failed to render
   * **Optional**: Only present for item-level render errors
   * **Example**: 'header', 'text-block', 'gallery'
   */
  componentType?: string;
}

/**
 * Grid error event detail
 *
 * **Purpose**: Event payload for grid-builder error events
 * **Used by**: @Event decorator, EventManager.emit()
 *
 * **Extends BaseErrorEventDetail** with grid-specific error info
 *
 * **Example - @Event usage**:
 * ```typescript
 * @Event({
 *   eventName: 'gridError',
 *   composed: true,
 *   bubbles: true
 * })
 * gridError: EventEmitter<GridErrorEventDetail>;
 *
 * // Emit event
 * this.gridError.emit({
 *   error: new Error('Component failed'),
 *   errorInfo: {
 *     errorBoundary: 'grid-item-wrapper',
 *     itemId: 'item-123',
 *     canvasId: 'canvas1',
 *     componentType: 'header'
 *   },
 *   severity: 'error',
 *   recoverable: true
 * });
 * ```
 *
 * **Example - EventManager usage**:
 * ```typescript
 * eventManager.emit('error', {
 *   error: new Error('Component failed'),
 *   errorInfo: { ... },
 *   severity: 'error',
 *   recoverable: true
 * });
 * ```
 */
export interface GridErrorEventDetail extends BaseErrorEventDetail {
  /**
   * Grid-specific error information
   */
  errorInfo: GridErrorInfo;
}

/**
 * Grid error event handler type
 *
 * **Purpose**: Type-safe event handler for grid error events
 * **Used by**: Plugin API, host application
 *
 * **Example - Plugin usage**:
 * ```typescript
 * const plugin: GridBuilderPlugin = {
 *   name: 'error-logger',
 *   init(api) {
 *     api.on('error', (detail: GridErrorEventDetail) => {
 *       console.error(`Error in ${detail.errorInfo.errorBoundary}:`, detail.error);
 *       if (detail.errorInfo.itemId) {
 *         console.error(`  Item: ${detail.errorInfo.itemId}`);
 *       }
 *       if (detail.errorInfo.componentType) {
 *         console.error(`  Component: ${detail.errorInfo.componentType}`);
 *       }
 *     });
 *   }
 * };
 * ```
 *
 * **Example - Host app usage**:
 * ```typescript
 * <grid-builder
 *   onGridError={(e: CustomEvent<GridErrorEventDetail>) => {
 *     const { error, errorInfo, severity } = e.detail;
 *     logToSentry({ error, errorInfo, severity });
 *   }}
 * />
 * ```
 */
export type GridErrorEventHandler = (detail: GridErrorEventDetail) => void;

/**
 * Grid error context builder
 *
 * **Purpose**: Helper for building grid-specific error context
 * **Use case**: Consistent context creation across grid-builder
 *
 * **Example**:
 * ```typescript
 * const context = buildGridErrorContext('grid-item-wrapper', {
 * itemId: 'item-123',
 * canvasId: 'canvas1',
 * componentType: 'header'
 * });
 *
 * // Use in error boundary
 * <error-boundary
 * error-boundary="grid-item-wrapper"
 * context={context}
 * />
 * ```
 * @param errorBoundary - Which boundary caught the error
 * @param gridContext - Grid-specific context fields
 * @param gridContext.itemId - ID of grid item (if applicable)
 * @param gridContext.canvasId - ID of canvas (if applicable)
 * @param gridContext.componentType - Type of component (if applicable)
 * @returns Complete error context object
 */
export function buildGridErrorContext(
  errorBoundary: GridErrorBoundaryLevel,
  gridContext: {
    itemId?: string;
    canvasId?: string;
    componentType?: string;
  },
): Record<string, any> {
  return {
    errorBoundary,
    ...gridContext,
  };
}

/**
 * Grid error severity classification helper
 *
 * **Purpose**: Map grid error types to severity levels
 * **Use case**: Consistent severity assignment
 *
 * **Classification rules**:
 * - Item render error: 'error' (isolated to item, canvas continues)
 * - Canvas render error: 'critical' (whole canvas fails)
 * - Builder init error: 'critical' (whole grid fails)
 * - Plugin error: 'warning' (plugin fails, grid continues)
 *
 * **Example**:
 * ```typescript
 * const severity = getGridErrorSeverity('grid-item-wrapper', error);
 * // Returns 'error' for item-level failures
 *
 * const severity2 = getGridErrorSeverity('grid-builder', error);
 * // Returns 'critical' for builder-level failures
 * ```
 * @param errorBoundary - Which boundary caught the error
 * @param error - The caught error
 * @returns Recommended severity level
 */
export function getGridErrorSeverity(
  errorBoundary: GridErrorBoundaryLevel,
  error: Error,
): ErrorSeverity {
  // Critical errors (whole grid fails)
  if (errorBoundary === "grid-builder") {
    // Builder init, API creation, global state
    return "critical";
  }

  // High-severity errors (canvas fails)
  if (errorBoundary === "canvas-section") {
    // Check if it's a minor error (validation, render)
    if (
      error.message.includes("invalid") ||
      error.message.includes("not found")
    ) {
      return "error";
    }
    // Canvas-level failures are critical for that canvas
    return "critical";
  }

  // Item-level errors (isolated, grid continues)
  if (errorBoundary === "grid-item-wrapper") {
    // Most item errors are isolated and recoverable
    return "error";
  }

  // Default: error
  return "error";
}

/**
 * Check if grid error is recoverable
 *
 * **Purpose**: Determine if grid can continue after error
 * **Use case**: Recovery strategy selection
 *
 * **Recovery rules**:
 * - Item render error: Recoverable (show fallback, other items OK)
 * - Canvas render error: Depends on error type
 * - Builder init error: Not recoverable (grid cannot function)
 *
 * **Example**:
 * ```typescript
 * const recoverable = isGridErrorRecoverable('grid-item-wrapper', error);
 * // Returns true - can show fallback for this item
 *
 * const recoverable2 = isGridErrorRecoverable('grid-builder', error);
 * // Returns false - grid cannot function without builder
 * ```
 * @param errorBoundary - Which boundary caught the error
 * @param error - The caught error
 * @returns true if grid can continue operating
 */
export function isGridErrorRecoverable(
  errorBoundary: GridErrorBoundaryLevel,
  error: Error,
): boolean {
  // Item-level errors are always recoverable
  if (errorBoundary === "grid-item-wrapper") {
    return true;
  }

  // Canvas-level errors are usually recoverable
  if (errorBoundary === "canvas-section") {
    // Critical errors are not recoverable
    if (error.message.includes("fatal") || error.message.includes("critical")) {
      return false;
    }
    return true;
  }

  // Builder-level errors are usually not recoverable
  if (errorBoundary === "grid-builder") {
    // Only validation/minor errors are recoverable
    if (
      error.message.includes("validation") ||
      error.message.includes("config")
    ) {
      return true;
    }
    return false;
  }

  // Default: recoverable
  return true;
}

/**
 * Format grid error message for user
 *
 * **Purpose**: User-friendly error messages with grid context
 * **Use case**: Error UI display
 *
 * **Message templates**:
 * - Item error: "Unable to load {componentType} component"
 * - Canvas error: "Unable to render canvas section"
 * - Builder error: "Grid builder failed to initialize"
 *
 * **Example**:
 * ```typescript
 * const message = formatGridErrorMessage({
 * errorBoundary: 'grid-item-wrapper',
 * componentType: 'header',
 * itemId: 'item-123'
 * }, error);
 * // Returns: "Unable to load header component"
 * ```
 * @param errorInfo - Grid error information
 * @param error - The caught error
 * @param isDevelopment - Whether in development mode (show technical details)
 * @returns User-friendly error message
 */
export function formatGridErrorMessage(
  errorInfo: GridErrorInfo,
  error: Error,
  isDevelopment: boolean = false,
): string {
  // Development mode - show technical details
  if (isDevelopment) {
    return `${errorInfo.errorBoundary}: ${error.name}: ${error.message}`;
  }

  // Production mode - user-friendly messages
  switch (errorInfo.errorBoundary) {
    case "grid-item-wrapper":
      if (errorInfo.componentType) {
        return `Unable to load ${errorInfo.componentType} component. Please try again.`;
      }
      return "Unable to load component. Please try again.";

    case "canvas-section":
      return "Unable to render canvas section. Please refresh the page.";

    case "grid-builder":
      return "Grid builder failed to initialize. Please refresh the page.";

    default:
      return "Something went wrong. Please try again.";
  }
}
