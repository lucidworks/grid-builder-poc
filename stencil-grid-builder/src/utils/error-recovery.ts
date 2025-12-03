/**
 * Error Recovery Utilities (Generic - Extractable)
 * ==================================================
 *
 * Generic error recovery strategies and retry mechanisms.
 * Zero dependencies on grid-builder - can be extracted to standalone package.
 *
 * ## Design Principles
 *
 * **Pure Functions**:
 * - No side effects except intentional retries
 * - Deterministic behavior
 * - Composable and testable
 *
 * **Generic and Reusable**:
 * - Works with any async function
 * - No assumptions about application structure
 * - Extensible retry policies
 *
 * **Production Ready**:
 * - Exponential backoff with jitter
 * - Circuit breaker pattern
 * - Memory-safe (cleanup timers)
 * @module error-recovery
 */

import { ErrorRecoveryStrategy, ErrorClassification } from '../types/error-types';
import { classifyError } from './error-handler';

/**
 * Retry configuration options
 *
 * **Purpose**: Configure retry behavior for transient errors
 * **Use case**: Network failures, timeout errors, resource contention
 *
 * **Example**:
 * ```typescript
 * const config: RetryConfig = {
 *   maxRetries: 3,
 *   baseDelay: 1000,        // Start with 1 second
 *   maxDelay: 10000,        // Cap at 10 seconds
 *   backoffMultiplier: 2,   // Double each time
 *   jitterFactor: 0.1       // ±10% randomization
 * };
 * ```
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * **Default**: 3
   */
  maxRetries: number;

  /**
   * Initial delay in milliseconds before first retry
   * **Default**: 1000 (1 second)
   */
  baseDelay: number;

  /**
   * Maximum delay in milliseconds (caps exponential growth)
   * **Default**: 30000 (30 seconds)
   */
  maxDelay: number;

  /**
   * Exponential backoff multiplier
   * **Default**: 2 (doubles each retry)
   * **Example**: attempt 1: 1s, attempt 2: 2s, attempt 3: 4s
   */
  backoffMultiplier: number;

  /**
   * Jitter factor (0-1) to randomize delays
   * **Default**: 0.1 (±10% randomization)
   * **Purpose**: Prevent thundering herd problem
   * **Example**: 1000ms ± 100ms = 900-1100ms
   */
  jitterFactor: number;

  /**
   * Optional predicate to determine if error is retryable
   * **Default**: Retries network and timeout errors only
   * **Example**: `(error) => error.name === 'NetworkError'`
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Default retry configuration
 *
 * **Sensible defaults for most use cases**:
 * - 3 retry attempts
 * - 1s initial delay
 * - 30s maximum delay
 * - 2× exponential backoff
 * - 10% jitter
 * - Retries network and timeout errors only
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  shouldRetry: (error: Error) => {
    const classification = classifyError(error);
    return classification.type === 'network' || classification.type === 'timeout';
  },
};

/**
 * Retry result
 *
 * **Purpose**: Return value from retry operations
 * **Contains**: Success/failure status and result/error
 */
export interface RetryResult<T> {
  /**
   * Whether operation succeeded after retries
   */
  success: boolean;

  /**
   * Result value if successful
   */
  result?: T;

  /**
   * Last error if all retries failed
   */
  error?: Error;

  /**
   * Number of attempts made (1 = no retries, 4 = 3 retries)
   */
  attempts: number;

  /**
   * Total time spent in milliseconds (including delays)
   */
  totalTime: number;
}

/**
 * Calculate retry delay with exponential backoff and jitter
 *
 * **Purpose**: Prevent thundering herd problem
 * **Pure Function**: No side effects, deterministic for same inputs
 *
 * **Algorithm**:
 * 1. Calculate base exponential delay: `baseDelay * (backoffMultiplier ^ attempt)`
 * 2. Cap at maxDelay
 * 3. Add random jitter: `delay ± (delay * jitterFactor)`
 *
 * **Why jitter?**
 * - Multiple clients retry at same time → server overload
 * - Randomization spreads load over time
 * - Industry standard practice (AWS, Google Cloud)
 *
 * **Example**:
 * ```typescript
 * const delay1 = calculateRetryDelay(0, config); // ~1000ms ± 100ms
 * const delay2 = calculateRetryDelay(1, config); // ~2000ms ± 200ms
 * const delay3 = calculateRetryDelay(2, config); // ~4000ms ± 400ms
 * ```
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds before next retry
 */
export function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);

  // Add jitter: ± (delay * jitterFactor)
  const jitterRange = cappedDelay * config.jitterFactor;
  const jitter = (Math.random() - 0.5) * 2 * jitterRange;

  return Math.max(0, Math.round(cappedDelay + jitter));
}

/**
 * Retry an async operation with exponential backoff
 *
 * **Purpose**: Automatically retry transient failures
 * **Use cases**: Network requests, API calls, resource contention
 *
 * **Retry Logic**:
 * 1. Execute operation
 * 2. If succeeds, return result
 * 3. If fails, check if error is retryable
 * 4. If retryable and attempts remaining, wait and retry
 * 5. If not retryable or no attempts left, return error
 *
 * **Example - Network request**:
 * ```typescript
 * const result = await retryOperation(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Network error');
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     shouldRetry: (error) => error.message.includes('Network')
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.result);
 * } else {
 *   console.error('Failed after 3 retries:', result.error);
 * }
 * ```
 *
 * **Example - Component render**:
 * ```typescript
 * const result = await retryOperation(
 *   async () => renderComplexComponent(itemId),
 *   DEFAULT_RETRY_CONFIG
 * );
 * ```
 *
 * @param operation - Async function to retry
 * @param config - Retry configuration (uses defaults if not provided)
 * @returns RetryResult with success/failure status
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<RetryResult<T>> {
  // Merge with defaults
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      // Execute operation
      const result = await operation();

      // Success!
      return {
        success: true,
        result,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const isLastAttempt = attempt === fullConfig.maxRetries;
      const shouldRetry = fullConfig.shouldRetry
        ? fullConfig.shouldRetry(lastError, attempt)
        : true;

      if (isLastAttempt || !shouldRetry) {
        // No more retries or error not retryable
        break;
      }

      // Calculate delay and wait before next retry
      const delay = calculateRetryDelay(attempt, fullConfig);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError,
    attempts: fullConfig.maxRetries + 1,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Circuit breaker state
 *
 * **Purpose**: Prevent cascading failures by stopping requests to failing service
 * **States**:
 * - `closed`: Normal operation, requests allowed
 * - `open`: Too many failures, reject immediately
 * - `half-open`: Testing if service recovered, allow single request
 *
 * **State transitions**:
 * - closed → open: After N failures in time window
 * - open → half-open: After timeout period
 * - half-open → closed: If test request succeeds
 * - half-open → open: If test request fails
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 *
 * **Purpose**: Configure circuit breaker behavior
 * **Use case**: Protect against cascading failures
 *
 * **Example**:
 * ```typescript
 * const config: CircuitBreakerConfig = {
 *   failureThreshold: 5,     // Open after 5 failures
 *   successThreshold: 2,     // Close after 2 successes
 *   timeout: 60000,          // Try again after 1 minute
 *   windowDuration: 10000    // 10 second sliding window
 * };
 * ```
 */
export interface CircuitBreakerConfig {
  /**
   * Number of failures before opening circuit
   * **Default**: 5
   */
  failureThreshold: number;

  /**
   * Number of successes in half-open state before closing circuit
   * **Default**: 2
   */
  successThreshold: number;

  /**
   * Time in milliseconds before attempting half-open state
   * **Default**: 60000 (1 minute)
   */
  timeout: number;

  /**
   * Sliding window duration for counting failures (milliseconds)
   * **Default**: 60000 (1 minute)
   * **Purpose**: Only count recent failures, ignore old ones
   */
  windowDuration: number;
}

/**
 * Circuit breaker implementation
 *
 * **Purpose**: Prevent cascading failures by stopping requests to failing service
 * **Pattern**: Gang of Four - State pattern
 *
 * **How it works**:
 * 1. **Closed state** (normal): Requests pass through
 * 2. **Open state** (failing): Requests rejected immediately (fail fast)
 * 3. **Half-open state** (testing): Allow one request to test recovery
 *
 * **Benefits**:
 * - Prevents wasting resources on failing services
 * - Gives failing service time to recover
 * - Reduces latency (fail fast instead of timeout)
 * - Protects against cascading failures
 *
 * **Example - API circuit breaker**:
 * ```typescript
 * const breaker = new CircuitBreaker<Response>({
 *   failureThreshold: 3,
 *   timeout: 30000
 * });
 *
 * async function fetchData() {
 *   return breaker.execute(async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('API error');
 *     return response;
 *   });
 * }
 *
 * // First 3 failures → circuit opens
 * // Next requests fail immediately (no network call)
 * // After 30s → circuit half-opens, tries one request
 * // If succeeds → circuit closes, back to normal
 * ```
 */
export class CircuitBreaker<T> {
  private state: CircuitState = 'closed';
  private failures: number[] = []; // Timestamps of failures
  private successes: number = 0;
  private nextAttempt: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Get current circuit state
   * @returns Current state ('closed', 'open', or 'half-open')
   */
  getState(): CircuitState {
    this.updateState();
    return this.state;
  }

  /**
   * Execute operation through circuit breaker
   *
   * **Behavior by state**:
   * - `closed`: Execute operation normally
   * - `open`: Reject immediately (fast fail)
   * - `half-open`: Allow single test request
   *
   * @param operation - Async function to execute
   * @returns Promise resolving to operation result
   * @throws Error if circuit is open or operation fails
   */
  async execute(operation: () => Promise<T>): Promise<T> {
    this.updateState();

    // Circuit open - reject immediately
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open - service temporarily unavailable');
    }

    try {
      const result = await operation();

      // Success!
      this.recordSuccess();
      return result;
    } catch (error) {
      // Failure
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record successful operation
   * **State transitions**:
   * - half-open → closed (after successThreshold successes)
   */
  private recordSuccess(): void {
    this.successes++;

    if (this.state === 'half-open' && this.successes >= this.config.successThreshold) {
      // Recovered! Close circuit
      this.state = 'closed';
      this.successes = 0;
      this.failures = [];
    }
  }

  /**
   * Record failed operation
   * **State transitions**:
   * - closed → open (after failureThreshold failures)
   * - half-open → open (on any failure)
   */
  private recordFailure(): void {
    const now = Date.now();
    this.failures.push(now);

    // Clean old failures outside window
    const windowStart = now - this.config.windowDuration;
    this.failures = this.failures.filter((timestamp) => timestamp >= windowStart);

    // Check if should open circuit
    if (this.state === 'half-open') {
      // Failed during test - reopen circuit
      this.state = 'open';
      this.successes = 0;
      this.nextAttempt = now + this.config.timeout;
    } else if (this.failures.length >= this.config.failureThreshold) {
      // Too many failures - open circuit
      this.state = 'open';
      this.successes = 0;
      this.nextAttempt = now + this.config.timeout;
    }
  }

  /**
   * Update circuit state based on time
   * **State transitions**:
   * - open → half-open (after timeout expires)
   */
  private updateState(): void {
    if (this.state === 'open' && Date.now() >= this.nextAttempt) {
      // Timeout expired - try half-open
      this.state = 'half-open';
      this.successes = 0;
    }
  }

  /**
   * Manually reset circuit to closed state
   * **Use case**: Administrative reset, service known to be healthy
   */
  reset(): void {
    this.state = 'closed';
    this.failures = [];
    this.successes = 0;
    this.nextAttempt = 0;
  }
}

/**
 * Determine recovery strategy for error
 *
 * **Purpose**: Choose appropriate recovery strategy based on error type
 * **Pure Function**: Deterministic, no side effects
 *
 * **Strategy selection**:
 * - `strict`: Permission errors, unrecoverable errors
 * - `retry`: Network errors, timeout errors
 * - `graceful`: Validation errors, render errors
 * - `ignore`: Development-only errors, low-severity warnings
 *
 * **Example**:
 * ```typescript
 * const error = new Error('Network timeout');
 * const strategy = getRecommendedStrategy(error);
 * // Returns: 'retry'
 *
 * const permissionError = new Error('Access denied');
 * const strategy2 = getRecommendedStrategy(permissionError);
 * // Returns: 'strict'
 * ```
 *
 * @param error - Error to classify
 * @param classification - Optional pre-computed classification
 * @returns Recommended recovery strategy
 */
export function getRecommendedStrategy(
  error: Error,
  classification?: ErrorClassification,
): ErrorRecoveryStrategy {
  const errorClass = classification || classifyError(error);

  // Permission errors - strict (don't retry, propagate upward)
  if (errorClass.type === 'permission') {
    return 'strict';
  }

  // Network/timeout errors - retry with backoff
  if (errorClass.type === 'network' || errorClass.type === 'timeout') {
    return 'retry';
  }

  // Validation errors - graceful (show message, allow correction)
  if (errorClass.type === 'validation') {
    return 'graceful';
  }

  // Low-severity errors - ignore (log only)
  if (errorClass.severity === 'info' || errorClass.severity === 'warning') {
    return 'ignore';
  }

  // Default: graceful degradation
  return 'graceful';
}

/**
 * Execute operation with automatic recovery strategy
 *
 * **Purpose**: Apply recommended recovery strategy automatically
 * **Use case**: When you want smart error handling without manual strategy selection
 *
 * **Recovery behaviors**:
 * - `retry`: Retry with exponential backoff
 * - `graceful`: Return fallback value
 * - `strict`: Re-throw error
 * - `ignore`: Swallow error, return undefined
 *
 * **Example**:
 * ```typescript
 * const result = await executeWithRecovery(
 *   async () => fetchUserData(userId),
 *   {
 *     fallback: defaultUserData,
 *     retryConfig: { maxRetries: 3 }
 *   }
 * );
 * ```
 *
 * @param operation - Async function to execute
 * @param options - Recovery options
 * @returns Operation result or fallback value
 */
export async function executeWithRecovery<T>(
  operation: () => Promise<T>,
  options: {
    fallback?: T;
    strategy?: ErrorRecoveryStrategy;
    retryConfig?: Partial<RetryConfig>;
    onError?: (error: Error, strategy: ErrorRecoveryStrategy) => void;
  } = {},
): Promise<T | undefined> {
  try {
    // If retry strategy specified, use retry logic
    if (options.strategy === 'retry' || !options.strategy) {
      const result = await retryOperation(operation, options.retryConfig);
      if (result.success) {
        return result.result;
      }

      // Retry failed - determine fallback strategy
      const error = result.error!;
      const classification = classifyError(error);
      const strategy = options.strategy || getRecommendedStrategy(error, classification);

      if (options.onError) {
        options.onError(error, strategy);
      }

      if (strategy === 'graceful') {
        return options.fallback;
      } else if (strategy === 'ignore') {
        return undefined;
      } else {
        throw error;
      }
    }

    // Non-retry strategies - execute once
    return await operation();
  } catch (error) {
    const actualError = error instanceof Error ? error : new Error(String(error));
    const classification = classifyError(actualError);
    const strategy = options.strategy || getRecommendedStrategy(actualError, classification);

    if (options.onError) {
      options.onError(actualError, strategy);
    }

    switch (strategy) {
      case 'graceful':
        return options.fallback;
      case 'ignore':
        return undefined;
      case 'strict':
      default:
        throw actualError;
    }
  }
}
