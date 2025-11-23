/**
 * Plugin System Types
 * ====================
 *
 * Type definitions for creating plugins that extend grid builder functionality.
 */

import { GridBuilderAPI } from "./api";

/**
 * Grid Builder Plugin Interface
 * ===============================
 *
 * Defines a plugin that can extend grid builder functionality.
 * Plugins have access to the full GridBuilderAPI and can subscribe to events,
 * modify state, and add custom UI.
 *
 * **Lifecycle**:
 * 1. User provides plugin instances to `<grid-builder plugins={[...]} />`
 * 2. grid-builder calls `plugin.init(api)` on componentDidLoad
 * 3. Plugin subscribes to events, adds UI, etc.
 * 4. grid-builder calls `plugin.destroy()` on disconnectedCallback
 * 5. Plugin cleans up subscriptions, removes UI, etc.
 *
 * **Example: Simple Logger Plugin**
 * ```typescript
 * export class LoggerPlugin implements GridBuilderPlugin {
 *   name = 'logger';
 *   version = '1.0.0';
 *
 *   private api: GridBuilderAPI;
 *
 *   init(api: GridBuilderAPI) {
 *     this.api = api;
 *
 *     // Subscribe to all events
 *     api.on('componentAdded', (e) => console.log('Added:', e));
 *     api.on('componentDragged', (e) => console.log('Dragged:', e));
 *     api.on('componentDeleted', (e) => console.log('Deleted:', e));
 *   }
 *
 *   destroy() {
 *     // Cleanup if needed
 *     console.log('Logger plugin destroyed');
 *   }
 * }
 * ```
 *
 * **Example: Performance Monitor Plugin**
 * ```typescript
 * export class PerformanceMonitorPlugin implements GridBuilderPlugin {
 *   name = 'performance-monitor';
 *   version = '1.0.0';
 *
 *   private api: GridBuilderAPI;
 *   private metrics = {
 *     dragOperations: [],
 *     resizeOperations: [],
 *     fps: 60
 *   };
 *   private uiElement: HTMLElement | null = null;
 *
 *   init(api: GridBuilderAPI) {
 *     this.api = api;
 *
 *     // Subscribe to drag events
 *     api.on('dragStart', this.onDragStart);
 *     api.on('dragEnd', this.onDragEnd);
 *
 *     // Subscribe to resize events
 *     api.on('resizeStart', this.onResizeStart);
 *     api.on('resizeEnd', this.onResizeEnd);
 *
 *     // Start FPS monitoring
 *     this.startFPSMonitoring();
 *
 *     // Add performance UI
 *     this.renderPerformanceUI();
 *   }
 *
 *   destroy() {
 *     // Unsubscribe from events
 *     this.api.off('dragStart', this.onDragStart);
 *     this.api.off('dragEnd', this.onDragEnd);
 *     this.api.off('resizeStart', this.onResizeStart);
 *     this.api.off('resizeEnd', this.onResizeEnd);
 *
 *     // Stop FPS monitoring
 *     this.stopFPSMonitoring();
 *
 *     // Remove UI
 *     this.removePerformanceUI();
 *   }
 *
 *   private onDragStart = (event) => {
 *     // Track drag start time
 *   };
 *
 *   private onDragEnd = (event) => {
 *     // Calculate drag metrics
 *   };
 *
 *   private renderPerformanceUI() {
 *     // Create and inject UI element
 *     this.uiElement = document.createElement('div');
 *     this.uiElement.className = 'performance-monitor';
 *     document.body.appendChild(this.uiElement);
 *   }
 *
 *   private removePerformanceUI() {
 *     this.uiElement?.remove();
 *     this.uiElement = null;
 *   }
 * }
 * ```
 *
 * **Example: Auto-Save Plugin**
 * ```typescript
 * export class AutoSavePlugin implements GridBuilderPlugin {
 *   name = 'auto-save';
 *   version = '1.0.0';
 *
 *   private api: GridBuilderAPI;
 *   private intervalId: number | null = null;
 *   private saveInterval: number;
 *
 *   constructor(options: { interval?: number } = {}) {
 *     this.saveInterval = options.interval || 30000; // Default 30s
 *   }
 *
 *   init(api: GridBuilderAPI) {
 *     this.api = api;
 *
 *     // Start auto-save interval
 *     this.intervalId = window.setInterval(() => {
 *       this.saveState();
 *     }, this.saveInterval);
 *
 *     console.log(`Auto-save enabled (every ${this.saveInterval}ms)`);
 *   }
 *
 *   destroy() {
 *     // Stop auto-save interval
 *     if (this.intervalId !== null) {
 *       window.clearInterval(this.intervalId);
 *       this.intervalId = null;
 *     }
 *   }
 *
 *   private saveState() {
 *     const state = this.api.getState();
 *     localStorage.setItem('grid-builder-state', JSON.stringify(state));
 *     console.log('State auto-saved');
 *   }
 * }
 * ```
 */
export interface GridBuilderPlugin {
  /**
   * Plugin name
   *
   * **Requirements**:
   * - Must be unique across all plugins
   * - Lowercase recommended (e.g., 'logger', 'auto-save')
   *
   * **Usage**:
   * - Identifying plugin in logs
   * - Debugging
   * - Plugin management
   *
   * @example 'performance-monitor', 'auto-save', 'analytics'
   */
  name: string;

  /**
   * Plugin version
   *
   * **Optional**: Semantic versioning recommended
   * **Usage**:
   * - Compatibility checking
   * - Debugging
   * - Update notifications
   *
   * @example '1.0.0', '2.1.3'
   */
  version?: string;

  /**
   * Initialize plugin
   *
   * **Called**: When grid-builder component mounts (componentDidLoad)
   * **Provided**: GridBuilderAPI for full access to grid builder functionality
   *
   * **Typical initialization tasks**:
   * 1. Store API reference for later use
   * 2. Subscribe to events via `api.on(...)`
   * 3. Add custom UI elements
   * 4. Start timers/intervals
   * 5. Initialize state
   *
   * **Important**: Must be synchronous or handle async internally.
   * Grid builder does not await plugin initialization.
   *
   * @param api - Grid Builder API for interacting with the library
   *
   * @example
   * ```typescript
   * init(api: GridBuilderAPI) {
   *   this.api = api;
   *
   *   // Subscribe to events
   *   api.on('componentAdded', this.handleComponentAdded);
   *
   *   // Add UI
   *   this.addToolbarButton();
   *
   *   // Start background task
   *   this.startMonitoring();
   * }
   * ```
   */
  init(api: GridBuilderAPI): void;

  /**
   * Cleanup plugin resources
   *
   * **Called**: When grid-builder component unmounts (disconnectedCallback)
   *
   * **Typical cleanup tasks**:
   * 1. Unsubscribe from all events via `api.off(...)`
   * 2. Remove custom UI elements
   * 3. Clear timers/intervals
   * 4. Free resources
   * 5. Reset state
   *
   * **Important**:
   * - Must unsubscribe ALL event listeners to prevent memory leaks
   * - Must remove ALL DOM elements added by plugin
   * - Must clear ALL timers/intervals
   *
   * **Failure to cleanup properly can cause**:
   * - Memory leaks
   * - Duplicate event handlers
   * - Orphaned DOM elements
   * - Background tasks continuing after unmount
   *
   * @example
   * ```typescript
   * destroy() {
   *   // Unsubscribe from events
   *   this.api.off('componentAdded', this.handleComponentAdded);
   *
   *   // Remove UI
   *   this.removeToolbarButton();
   *
   *   // Stop background task
   *   this.stopMonitoring();
   *
   *   // Clear timers
   *   if (this.intervalId) {
   *     clearInterval(this.intervalId);
   *   }
   * }
   * ```
   */
  destroy(): void;
}
