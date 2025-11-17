/**
 * Event Manager Service
 * ======================
 *
 * Simple event emitter for grid builder events. Provides on/off/emit pattern
 * for plugins and API consumers to subscribe to grid builder actions.
 *
 * ## Design Pattern
 *
 * **EventEmitter pattern**:
 * - on(event, callback) - Subscribe to event
 * - off(event, callback) - Unsubscribe from event
 * - emit(event, data) - Fire event to all subscribers
 *
 * **Callback storage**: Map<eventName, Set<callback>>
 * - O(1) subscription/unsubscription
 * - Set prevents duplicate callbacks
 * - Easy cleanup (delete entire event Set)
 *
 * ## Usage Example
 *
 * ```typescript
 * import { eventManager } from './event-manager';
 *
 * // Subscribe
 * const callback = (data) => console.log('Item added:', data);
 * eventManager.on('componentAdded', callback);
 *
 * // Fire event
 * eventManager.emit('componentAdded', { itemId: '123', canvasId: 'canvas1' });
 *
 * // Unsubscribe
 * eventManager.off('componentAdded', callback);
 * ```
 *
 * ## Memory Management
 *
 * **Plugin cleanup**:
 * - Plugins MUST unsubscribe in destroy()
 * - Use same callback reference for on/off
 * - Prevents memory leaks
 *
 * **Internal cleanup**:
 * - Empty event Sets auto-deleted
 * - No memory retention for unused events
 *
 * @module event-manager
 */

import { EventCallback } from '../types/api';

/**
 * EventManager Class
 * ==================
 *
 * Simple event emitter for grid builder events.
 *
 * **Storage structure**:
 * ```typescript
 * Map {
 *   'componentAdded' => Set([callback1, callback2, ...]),
 *   'componentDeleted' => Set([callback3, callback4, ...]),
 *   ...
 * }
 * ```
 *
 * **Why Set instead of Array**:
 * - O(1) lookup for has/delete
 * - Prevents duplicate callbacks
 * - Better performance for large subscriber counts
 */
export class EventManager {
  /**
   * Event listeners storage
   *
   * **Key**: Event name (e.g., 'componentAdded')
   * **Value**: Set of callback functions
   *
   * **Why Map instead of plain object**:
   * - Better type safety
   * - No prototype pollution
   * - Better performance for dynamic keys
   */
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to event
   *
   * **Idempotent**: Calling multiple times with same callback does nothing
   * **Thread-safe**: Uses Set which handles concurrent additions
   *
   * @param eventName - Event to subscribe to
   * @param callback - Function called when event fires
   *
   * @example
   * ```typescript
   * eventManager.on('componentAdded', (data) => {
   *   console.log(`Added ${data.item.type} to ${data.canvasId}`);
   * });
   * ```
   */
  on<T = any>(eventName: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback as EventCallback);
  }

  /**
   * Unsubscribe from event
   *
   * **Requirements**:
   * - Must pass EXACT same callback reference used in on()
   * - Callback stored as property or bound method
   *
   * **Cleanup**: If event has no more listeners, delete the Set
   *
   * @param eventName - Event to unsubscribe from
   * @param callback - Exact callback reference used in on()
   *
   * @example
   * ```typescript
   * // ✅ Correct pattern
   * class MyPlugin {
   *   private handleAdd = (data) => console.log(data);
   *
   *   init(api) {
   *     eventManager.on('componentAdded', this.handleAdd);
   *   }
   *
   *   destroy() {
   *     eventManager.off('componentAdded', this.handleAdd);
   *   }
   * }
   * ```
   */
  off<T = any>(eventName: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);

      // Cleanup empty event listeners
      if (callbacks.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * Fire event to all subscribers
   *
   * **Execution order**: Subscribers called in insertion order
   * **Error handling**: One callback error doesn't prevent others
   *
   * **Performance**: O(n) where n = number of callbacks for this event
   *
   * @param eventName - Event to fire
   * @param data - Data to pass to callbacks
   *
   * @example
   * ```typescript
   * // Internal usage (in state-manager.ts)
   * eventManager.emit('componentAdded', {
   *   item: newItem,
   *   canvasId: 'canvas1',
   *   timestamp: Date.now()
   * });
   * ```
   */
  emit<T = any>(eventName: string, data: T): void {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for specific event
   *
   * **Use case**: Cleanup during component unmount
   *
   * @param eventName - Event to remove all listeners from
   *
   * @example
   * ```typescript
   * // Clear all componentAdded listeners
   * eventManager.removeAllListeners('componentAdded');
   * ```
   */
  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for debugging
   *
   * **Use case**: Check for memory leaks (too many listeners)
   *
   * @param eventName - Event to count listeners for
   * @returns Number of listeners or 0 if event not registered
   *
   * @example
   * ```typescript
   * const count = eventManager.listenerCount('componentAdded');
   * console.log(`${count} listeners for componentAdded`);
   * ```
   */
  listenerCount(eventName: string): number {
    return this.listeners.get(eventName)?.size || 0;
  }
}

/**
 * Global event manager instance
 *
 * **Singleton pattern**: One instance shared across entire library
 * **Why singleton**: Ensures all components/plugins use same event bus
 */
export const eventManager = new EventManager();
