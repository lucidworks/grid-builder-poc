import { f as getRenderingRef, i as forceUpdate } from './index-CoCbyscT.js';

const appendToMap = (map, propName, value) => {
    const items = map.get(propName);
    if (!items) {
        map.set(propName, [value]);
    }
    else if (!items.includes(value)) {
        items.push(value);
    }
};
const debounce = (fn, ms) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = 0;
            fn(...args);
        }, ms);
    };
};

/**
 * Check if a possible element isConnected.
 * The property might not be there, so we check for it.
 *
 * We want it to return true if isConnected is not a property,
 * otherwise we would remove these elements and would not update.
 *
 * Better leak in Edge than to be useless.
 */
const isConnected = (maybeElement) => !('isConnected' in maybeElement) || maybeElement.isConnected;
const cleanupElements = debounce((map) => {
    for (let key of map.keys()) {
        map.set(key, map.get(key).filter(isConnected));
    }
}, 2_000);
const stencilSubscription = () => {
    if (typeof getRenderingRef !== 'function') {
        // If we are not in a stencil project, we do nothing.
        // This function is not really exported by @stencil/core.
        return {};
    }
    const elmsToUpdate = new Map();
    return {
        dispose: () => elmsToUpdate.clear(),
        get: (propName) => {
            const elm = getRenderingRef();
            if (elm) {
                appendToMap(elmsToUpdate, propName, elm);
            }
        },
        set: (propName) => {
            const elements = elmsToUpdate.get(propName);
            if (elements) {
                elmsToUpdate.set(propName, elements.filter(forceUpdate));
            }
            cleanupElements(elmsToUpdate);
        },
        reset: () => {
            elmsToUpdate.forEach((elms) => elms.forEach(forceUpdate));
            cleanupElements(elmsToUpdate);
        },
    };
};

const unwrap = (val) => (typeof val === 'function' ? val() : val);
const createObservableMap = (defaultState, shouldUpdate = (a, b) => a !== b) => {
    const unwrappedState = unwrap(defaultState);
    let states = new Map(Object.entries(unwrappedState ?? {}));
    const handlers = {
        dispose: [],
        get: [],
        set: [],
        reset: [],
    };
    // Track onChange listeners to enable removeListener functionality
    const changeListeners = new Map();
    const reset = () => {
        // When resetting the state, the default state may be a function - unwrap it to invoke it.
        // otherwise, the state won't be properly reset
        states = new Map(Object.entries(unwrap(defaultState) ?? {}));
        handlers.reset.forEach((cb) => cb());
    };
    const dispose = () => {
        // Call first dispose as resetting the state would
        // cause less updates ;)
        handlers.dispose.forEach((cb) => cb());
        reset();
    };
    const get = (propName) => {
        handlers.get.forEach((cb) => cb(propName));
        return states.get(propName);
    };
    const set = (propName, value) => {
        const oldValue = states.get(propName);
        if (shouldUpdate(value, oldValue, propName)) {
            states.set(propName, value);
            handlers.set.forEach((cb) => cb(propName, value, oldValue));
        }
    };
    const state = (typeof Proxy === 'undefined'
        ? {}
        : new Proxy(unwrappedState, {
            get(_, propName) {
                return get(propName);
            },
            ownKeys(_) {
                return Array.from(states.keys());
            },
            getOwnPropertyDescriptor() {
                return {
                    enumerable: true,
                    configurable: true,
                };
            },
            has(_, propName) {
                return states.has(propName);
            },
            set(_, propName, value) {
                set(propName, value);
                return true;
            },
        }));
    const on = (eventName, callback) => {
        handlers[eventName].push(callback);
        return () => {
            removeFromArray(handlers[eventName], callback);
        };
    };
    const onChange = (propName, cb) => {
        const setHandler = (key, newValue) => {
            if (key === propName) {
                cb(newValue);
            }
        };
        const resetHandler = () => cb(unwrap(defaultState)[propName]);
        // Register the handlers
        const unSet = on('set', setHandler);
        const unReset = on('reset', resetHandler);
        // Track the relationship between the user callback and internal handlers
        changeListeners.set(cb, { setHandler, resetHandler, propName });
        return () => {
            unSet();
            unReset();
            changeListeners.delete(cb);
        };
    };
    const use = (...subscriptions) => {
        const unsubs = subscriptions.reduce((unsubs, subscription) => {
            if (subscription.set) {
                unsubs.push(on('set', subscription.set));
            }
            if (subscription.get) {
                unsubs.push(on('get', subscription.get));
            }
            if (subscription.reset) {
                unsubs.push(on('reset', subscription.reset));
            }
            if (subscription.dispose) {
                unsubs.push(on('dispose', subscription.dispose));
            }
            return unsubs;
        }, []);
        return () => unsubs.forEach((unsub) => unsub());
    };
    const forceUpdate = (key) => {
        const oldValue = states.get(key);
        handlers.set.forEach((cb) => cb(key, oldValue, oldValue));
    };
    const removeListener = (propName, listener) => {
        const listenerInfo = changeListeners.get(listener);
        if (listenerInfo && listenerInfo.propName === propName) {
            // Remove the specific handlers that were created for this listener
            removeFromArray(handlers.set, listenerInfo.setHandler);
            removeFromArray(handlers.reset, listenerInfo.resetHandler);
            changeListeners.delete(listener);
        }
    };
    return {
        state,
        get,
        set,
        on,
        onChange,
        use,
        dispose,
        reset,
        forceUpdate,
        removeListener,
    };
};
const removeFromArray = (array, item) => {
    const index = array.indexOf(item);
    if (index >= 0) {
        array[index] = array[array.length - 1];
        array.length--;
    }
};

const createStore = (defaultState, shouldUpdate) => {
    const map = createObservableMap(defaultState, shouldUpdate);
    map.use(stencilSubscription());
    return map;
};

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
 * - Checks `"development"` at runtime
 * - StencilJS sets NODE_ENV during build
 * - Development builds: NODE_ENV = 'development'
 * - Production builds: NODE_ENV = 'production'
 * - Test builds: NODE_ENV = 'test'
 *
 * **Build-time optimization**:
 * - Production: debug.log() calls are no-ops (dead code elimination)
 * - Tree-shaking removes unused debug code
 * - Zero runtime overhead in production
 * @module debug
 */
/**
 * Check if debug logging is enabled
 *
 * **Enabled when**:
 * - NODE_ENV === 'development'
 * - NODE_ENV === 'test' AND ENABLE_TEST_LOGS === true
 *
 * **Disabled when**:
 * - NODE_ENV === 'production'
 * - NODE_ENV === 'test' AND ENABLE_TEST_LOGS !== true
 * @returns true if debug logging should be enabled
 */
function isDebugEnabled() {
    // Check if we're in development mode
    if (typeof process !== "undefined" &&
        process.env &&
        "development" === "development") {
        return true;
    }
    // Allow test logs if explicitly enabled
    if (typeof process !== "undefined" &&
        process.env &&
        "development" === "test") {
        return process.env.ENABLE_TEST_LOGS === "true";
    }
    // Disable in production
    return false;
}
/**
 * Debug logger instance
 *
 * Provides console.log-compatible methods that only log in development mode.
 * All methods are no-ops in production, allowing tree-shaking to remove them.
 */
const debug = {
    /**
     * Log informational message
     *
     * **Use for**: General debugging, state changes, lifecycle events
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.log output
     * @param args - Arguments to pass to console.log
     * @example
     * ```typescript
     * debug.log('Item added:', item);
     * debug.log('Grid size:', gridSize, 'for canvas:', canvasId);
     * ```
     */
    log(...args) {
        if (isDebugEnabled()) {
            console.log(...args);
        }
    },
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
     * @param args - Arguments to pass to console.warn
     * @example
     * ```typescript
     * debug.warn('Deprecated API usage:', methodName);
     * ```
     */
    warn(...args) {
        if (isDebugEnabled()) {
            console.warn(...args);
        }
    },
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
     * @param args - Arguments to pass to console.error
     * @example
     * ```typescript
     * debug.error('Failed to initialize drag handler:', error);
     * ```
     */
    error(...args) {
        if (isDebugEnabled()) {
            console.error(...args);
        }
    },
    /**
     * Log grouped messages
     *
     * **Use for**: Complex debug output, nested data structures
     *
     * **Production**: No-op (dead code eliminated)
     * **Development**: console.group/groupEnd output
     * @param label - Group label
     * @param fn - Function to execute within group
     * @example
     * ```typescript
     * debug.group('Drag operation', () => {
     *   debug.log('Start position:', startPos);
     *   debug.log('End position:', endPos);
     *   debug.log('Delta:', delta);
     * });
     * ```
     */
    group(label, fn) {
        if (isDebugEnabled()) {
            console.group(label);
            fn();
            console.groupEnd();
        }
    },
    /**
     * Check if debug mode is enabled
     *
     * **Use for**: Expensive debug operations that should be skipped in production
     * @returns true if debug logging is enabled
     * @example
     * ```typescript
     * if (debug.isEnabled()) {
     *   // Expensive operation only in development
     *   const stats = calculateDetailedStats();
     *   debug.log('Stats:', stats);
     * }
     * ```
     */
    isEnabled() {
        return isDebugEnabled();
    },
};
/**
 * Create a namespaced debug logger
 *
 * **Use for**: Module-specific logging with consistent prefixes
 * @param namespace - Namespace for log messages (e.g., 'drag-handler', 'grid-calculations')
 * @returns Debug logger with namespace prefix
 * @example
 * ```typescript
 * // In drag-handler.ts
 * const debug = createDebugLogger('drag-handler');
 * debug.log('Drag started'); // → [drag-handler] Drag started
 * ```
 */
function createDebugLogger(namespace) {
    return {
        log(...args) {
            debug.log(`[${namespace}]`, ...args);
        },
        warn(...args) {
            debug.warn(`[${namespace}]`, ...args);
        },
        error(...args) {
            debug.error(`[${namespace}]`, ...args);
        },
        group(label, fn) {
            debug.group(`[${namespace}] ${label}`, fn);
        },
        isEnabled() {
            return debug.isEnabled();
        },
    };
}

export { createStore as a, createDebugLogger as c };
//# sourceMappingURL=debug-BAq8PPFJ.js.map

//# sourceMappingURL=debug-BAq8PPFJ.js.map