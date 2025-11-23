/**
 * Debug Utility
 * ==============
 *
 * Environment-aware logging utility for the grid-builder library. Provides conditional
 * logging that only outputs in development mode, keeping production console clean.
 *
 * ## Problem
 *
 * Development logging is helpful for debugging but pollutes production console:
 * - Performance tracking logs on every drag/resize
 * - Build timestamp logs on initialization
 * - State change debug messages
 * - Verbose interaction tracking
 *
 * ## Solution
 *
 * Centralized debug utility that checks environment before logging:
 * - Development: Full logging for debugging
 * - Production: Silent (no console pollution)
 * - Test: Configurable via `ENABLE_TEST_LOGS` flag
 *
 * ## Usage
 *
 * ```typescript
 * import { debug } from '../utils/debug';
 *
 * // Replace console.log with debug.log
 * debug.log('Component mounted', { itemId, canvasId });
 *
 * // Still use console.warn/error for actual issues
 * console.warn('Invalid configuration:', config);
 * ```
 *
 * ## Environment Detection
 *
 * **How it works**:
 * - Checks `process.env.NODE_ENV` at runtime
 * - StencilJS sets NODE_ENV during build
 * - Development builds: NODE_ENV = 'development'
 * - Production builds: NODE_ENV = 'production'
 * - Test builds: NODE_ENV = 'test'
 *
 * **Build-time optimization**:
 * - Production: debug.log() calls are no-ops (dead code elimination)
 * - Tree-shaking removes unused debug code
 * - Zero runtime overhead in production
 *
 * @module debug
 */
/**
 * Debug logger instance
 *
 * Provides console.log-compatible methods that only log in development mode.
 * All methods are no-ops in production, allowing tree-shaking to remove them.
 */
export declare const debug: {
    /**
     * Log informational message
     *
     * **Use for**: General debugging, state changes, lifecycle events
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.log output
     *
     * @param args - Arguments to pass to console.log
     *
     * @example
     * ```typescript
     * debug.log('Item added:', item);
     * debug.log('Grid size:', gridSize, 'for canvas:', canvasId);
     * ```
     */
    log(...args: any[]): void;
    /**
     * Log warning message
     *
     * **Use for**: Recoverable issues, deprecation warnings, suspicious state
     *
     * **Note**: Consider using console.warn directly for warnings that should
     * always be visible (even in production)
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.warn output
     *
     * @param args - Arguments to pass to console.warn
     *
     * @example
     * ```typescript
     * debug.warn('Deprecated API usage:', methodName);
     * ```
     */
    warn(...args: any[]): void;
    /**
     * Log error message
     *
     * **Use for**: Non-critical errors, caught exceptions, debugging errors
     *
     * **Note**: Use console.error directly for critical errors that should
     * always be visible (even in production)
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.error output
     *
     * @param args - Arguments to pass to console.error
     *
     * @example
     * ```typescript
     * debug.error('Failed to initialize drag handler:', error);
     * ```
     */
    error(...args: any[]): void;
    /**
     * Log grouped messages
     *
     * **Use for**: Complex debug output, nested data structures
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.group/groupEnd output
     *
     * @param label - Group label
     * @param fn - Function to execute within group
     *
     * @example
     * ```typescript
     * debug.group('Drag operation', () => {
     *   debug.log('Start position:', startPos);
     *   debug.log('End position:', endPos);
     *   debug.log('Delta:', delta);
     * });
     * ```
     */
    group(label: string, fn: () => void): void;
    /**
     * Check if debug mode is enabled
     *
     * **Use for**: Expensive debug operations that should be skipped in production
     *
     * @returns true if debug logging is enabled
     *
     * @example
     * ```typescript
     * if (debug.isEnabled()) {
     *   // Expensive operation only in development
     *   const stats = calculateDetailedStats();
     *   debug.log('Stats:', stats);
     * }
     * ```
     */
    isEnabled(): boolean;
};
/**
 * Create a namespaced debug logger
 *
 * **Use for**: Module-specific logging with consistent prefixes
 *
 * @param namespace - Namespace for log messages (e.g., 'drag-handler', 'grid-calculations')
 * @returns Debug logger with namespace prefix
 *
 * @example
 * ```typescript
 * // In drag-handler.ts
 * const debug = createDebugLogger('drag-handler');
 * debug.log('Drag started'); // → [drag-handler] Drag started
 * ```
 */
export declare function createDebugLogger(namespace: string): {
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    group(label: string, fn: () => void): void;
    isEnabled(): boolean;
};
