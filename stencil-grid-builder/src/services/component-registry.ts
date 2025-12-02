/**
 * Component Registry Service
 * ==========================
 *
 * Centralized service for managing component definitions in the grid builder.
 * Provides type-safe component lookup and registration.
 *
 * ## Purpose
 *
 * The ComponentRegistry replaces the pattern of passing componentRegistry as a prop
 * through multiple component layers. Instead, it provides:
 * - Centralized component definition storage
 * - Type-safe component lookup by type string
 * - Instance-based architecture (multiple registries can coexist)
 * - Clear API for registering and retrieving definitions
 *
 * ## Instance-Based Architecture
 *
 * Each grid-builder/grid-viewer component gets its own ComponentRegistry instance:
 * - Supports multiple independent grids on the same page
 * - Each grid can have different component definitions
 * - No global singleton state
 *
 * ## Usage Example
 *
 * ```typescript
 * // Create registry instance
 * const registry = new ComponentRegistry();
 *
 * // Register component definitions
 * registry.register({
 * type: 'header',
 * name: 'Header',
 * icon: '📄',
 * defaultSize: { width: 20, height: 6 },
 * render: (item) => <div>Header Component</div>
 * });
 *
 * // Retrieve component definition
 * const definition = registry.get('header');
 *
 * // Check if component type exists
 * if (registry.has('header')) {
 * // ...
 * }
 *
 * // Get all registered types
 * const types = registry.getTypes();
 *
 * // Get all definitions
 * const definitions = registry.getAll();
 * ```
 *
 * ## Integration with Components
 *
 * Components receive registry instance as a prop:
 * ```typescript
 * @Prop() componentRegistry?: ComponentRegistry;
 * ```
 *
 * This replaces the previous pattern:
 * ```typescript
 * // Old pattern (prop drilling)
 * @Prop() componentRegistry?: Map<string, ComponentDefinition>;
 *
 * // New pattern (service instance)
 * @Prop() componentRegistry?: ComponentRegistry;
 * ```
 * @module component-registry
 */

import { ComponentDefinition } from "../types/component-definition";

/**
 * ComponentRegistry - Centralized component definition management
 *
 * **Instance-based design**: Each grid-builder gets its own registry instance
 *
 * **Type safety**: All lookups return ComponentDefinition or undefined
 *
 * **Performance**: Uses Map internally for O(1) lookups
 */
export class ComponentRegistry {
  /**
   * Internal storage using Map for O(1) lookups
   * Key: component type string (e.g., 'header', 'gallery')
   * Value: ComponentDefinition object
   */
  private definitions: Map<string, ComponentDefinition>;

  /**
   * Change listeners for reactive updates
   * Set of callbacks to notify when registry changes
   *
   * **Observer Pattern**: Components can subscribe to registry changes
   * **Use case**: component-palette auto-updates when components are registered
   */
  private changeListeners: Set<() => void> = new Set();

  /**
   * Create a new ComponentRegistry instance
   *
   * **Instance-based architecture**: Each grid-builder gets its own registry
   *
   * **Optional initial definitions**: Can provide definitions at construction time
   * @param initialDefinitions - Optional array of component definitions to register
   * @example
   * ```typescript
   * // Empty registry
   * const registry = new ComponentRegistry();
   *
   * // Registry with initial definitions
   * const registry = new ComponentRegistry([
   *   { type: 'header', name: 'Header', ... },
   *   { type: 'gallery', name: 'Gallery', ... }
   * ]);
   * ```
   */
  constructor(initialDefinitions?: ComponentDefinition[]) {
    this.definitions = new Map();

    // Register initial definitions if provided
    if (initialDefinitions) {
      initialDefinitions.forEach((def) => this.register(def));
    }
  }

  /**
   * Register a component definition
   *
   * **Overwrites existing**: If component type already registered, replaces it
   *
   * **Validation**: Ensures component type is non-empty string
   * @param definition - Component definition to register
   * @throws Error if component type is empty or invalid
   * @example
   * ```typescript
   * registry.register({
   *   type: 'header',
   *   name: 'Header',
   *   icon: '📄',
   *   defaultSize: { width: 20, height: 6 },
   *   render: (item) => <div>Header</div>
   * });
   * ```
   */
  register(definition: ComponentDefinition): void {
    if (!definition.type || typeof definition.type !== "string") {
      throw new Error("Component definition must have a valid type string");
    }

    this.definitions.set(definition.type, definition);
    this.notifyListeners(); // Notify observers of change
  }

  /**
   * Register multiple component definitions at once
   *
   * **Batch registration**: Convenience method for registering multiple components
   *
   * **Overwrites existing**: Same behavior as individual register() calls
   *
   * **Optimization**: Only notifies listeners once after all registrations
   * @param definitions - Array of component definitions to register
   * @example
   * ```typescript
   * registry.registerAll([
   *   { type: 'header', name: 'Header', ... },
   *   { type: 'gallery', name: 'Gallery', ... },
   *   { type: 'text', name: 'Text', ... }
   * ]);
   * ```
   */
  registerAll(definitions: ComponentDefinition[]): void {
    // Register all without notifications (for performance)
    definitions.forEach((def) => {
      if (!def.type || typeof def.type !== "string") {
        throw new Error("Component definition must have a valid type string");
      }
      this.definitions.set(def.type, def);
    });

    // Single notification after all registrations
    this.notifyListeners();
  }

  /**
   * Retrieve a component definition by type
   *
   * **Returns undefined**: If component type not registered
   *
   * **Type-safe**: Caller must handle undefined case
   * @param type - Component type string
   * @returns Component definition or undefined
   * @example
   * ```typescript
   * const definition = registry.get('header');
   * if (definition) {
   *   // Use definition.render(), definition.defaultSize, etc.
   * } else {
   *   console.warn('Component type not found');
   * }
   * ```
   */
  get(type: string): ComponentDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * Check if a component type is registered
   *
   * **Use before get()**: Avoid undefined checks
   * @param type - Component type string
   * @returns True if type is registered, false otherwise
   * @example
   * ```typescript
   * if (registry.has('header')) {
   *   const definition = registry.get('header')!; // Safe to use !
   * }
   * ```
   */
  has(type: string): boolean {
    return this.definitions.has(type);
  }

  /**
   * Get all registered component types
   *
   * **Returns array**: Useful for validation, debugging, UI lists
   * @returns Array of component type strings
   * @example
   * ```typescript
   * const types = registry.getTypes();
   * // ['header', 'gallery', 'text', 'dashboard']
   * ```
   */
  getTypes(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get all registered component definitions
   *
   * **Returns array**: Useful for component palette, debugging
   * @returns Array of all component definitions
   * @example
   * ```typescript
   * const definitions = registry.getAll();
   * // Render component palette
   * definitions.forEach(def => {
   *   renderPaletteItem(def.name, def.icon);
   * });
   * ```
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Remove a component definition by type
   *
   * **Use sparingly**: Most applications don't need to unregister components
   *
   * **Returns boolean**: True if component was removed, false if not found
   *
   * **Notifies observers**: Triggers onChange listeners if component was removed
   * @param type - Component type string to remove
   * @returns True if component was removed, false otherwise
   * @example
   * ```typescript
   * const removed = registry.unregister('old-component');
   * if (removed) {
   *   console.log('Component unregistered');
   * }
   * ```
   */
  unregister(type: string): boolean {
    const wasDeleted = this.definitions.delete(type);

    // Only notify if something was actually removed
    if (wasDeleted) {
      this.notifyListeners();
    }

    return wasDeleted;
  }

  /**
   * Remove all component definitions
   *
   * **Use sparingly**: Most applications don't need to clear registry
   *
   * **Resets state**: After clear(), registry is empty
   *
   * **Notifies observers**: Triggers onChange listeners
   * @example
   * ```typescript
   * registry.clear();
   * console.log(registry.getTypes()); // []
   * ```
   */
  clear(): void {
    const hadDefinitions = this.definitions.size > 0;
    this.definitions.clear();

    // Only notify if there were definitions to clear
    if (hadDefinitions) {
      this.notifyListeners();
    }
  }

  /**
   * Get the number of registered components
   *
   * **Useful for validation**: Ensure components were registered
   * @returns Number of registered components
   * @example
   * ```typescript
   * console.log(`Registry has ${registry.size()} components`);
   * ```
   */
  size(): number {
    return this.definitions.size;
  }

  /**
   * Subscribe to registry changes (Observer Pattern)
   *
   * **Use case**: component-palette subscribes to auto-update when components are registered
   *
   * **Returns unsubscribe function**: Call to remove listener and prevent memory leaks
   *
   * **When notified**: Callback fires on register(), registerAll(), unregister(), clear()
   *
   * **Pattern**: Observer pattern for reactive updates
   * @param listener - Callback function to invoke on registry changes
   * @returns Unsubscribe function to remove the listener
   * @example
   * ```typescript
   * // Subscribe to changes
   * const unsubscribe = registry.onChange(() => {
   *   console.log('Registry changed!');
   *   this.components = registry.getAll(); // Refresh component list
   * });
   *
   * // Later: cleanup to prevent memory leaks
   * unsubscribe();
   * ```
   */
  onChange(listener: () => void): () => void {
    this.changeListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  /**
   * Notify all change listeners (private method)
   *
   * **Called by**: register(), registerAll(), unregister(), clear()
   *
   * **Observers**: component-palette and other reactive consumers
   */
  private notifyListeners(): void {
    this.changeListeners.forEach((listener) => listener());
  }
}
