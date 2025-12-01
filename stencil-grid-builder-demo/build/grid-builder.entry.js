import { r as registerInstance, h, e as Host, d as getElement } from './index-CoCbyscT.js';
import { i as interact } from './interact.min-DWbYNq4G.js';
import { S as StateManager, u as updateItemsBatch, d as deleteItemsBatch, a as addItemsBatch, b as generateItemId } from './state-manager-BtBFePO6.js';
import { V as VirtualRendererService } from './virtual-renderer-CMNhlZbw.js';
import { a as applyBoundaryConstraints, c as constrainPositionToCanvas, C as CANVAS_WIDTH_UNITS, M as MoveItemCommand, R as RemoveCanvasCommand, A as AddCanvasCommand, B as BatchUpdateConfigCommand, b as BatchDeleteCommand, d as BatchAddCommand } from './boundary-constraints-Bp5RmeLZ.js';
import { c as createDebugLogger, a as createStore } from './debug-BAq8PPFJ.js';
import { D as DOMCache, c as clearGridSizeCache, p as pixelsToGridX, d as pixelsToGridY } from './grid-calculations-C87xQzOc.js';

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
 * @module event-manager
 */
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
class EventManager {
    constructor() {
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
        this.listeners = new Map();
        /**
         * Debounce timers for events
         *
         * **Key**: Event name
         * **Value**: setTimeout timer ID
         *
         * **Purpose**: Store timers for debounced events
         */
        this.debounceTimers = new Map();
        /**
         * Debounce delay in milliseconds
         *
         * **Default**: 300ms
         * **Configured by**: grid-builder via setDebounceDelay()
         */
        this.debounceDelay = 300;
        /**
         * Events that should be debounced
         *
         * **Events**: componentDragged, componentResized, stateChanged
         * **Reason**: Fire on every pixel during drag/resize
         */
        this.debouncedEvents = new Set([
            "componentDragged",
            "componentResized",
            "stateChanged",
        ]);
    }
    /**
     * Subscribe to event
     *
     * **Idempotent**: Calling multiple times with same callback does nothing
     * **Thread-safe**: Uses Set which handles concurrent additions
     * @param eventName - Event to subscribe to
     * @param callback - Function called when event fires
     * @example
     * ```typescript
     * eventManager.on('componentAdded', (data) => {
     *   console.log(`Added ${data.item.type} to ${data.canvasId}`);
     * });
     * ```
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
    }
    /**
     * Unsubscribe from event
     *
     * **Requirements**:
     * - Must pass EXACT same callback reference used in on()
     * - Callback stored as property or bound method
     *
     * **Cleanup**: If event has no more listeners, delete the Set
     * @param eventName - Event to unsubscribe from
     * @param callback - Exact callback reference used in on()
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
    off(eventName, callback) {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.delete(callback);
            // Cleanup empty event listeners
            if (callbacks.size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }
    /**
     * Fire event to all subscribers
     *
     * **Debouncing**: Some events are automatically debounced:
     * - componentDragged (fires on every pixel)
     * - componentResized (fires on every pixel)
     * - stateChanged (fires on every state update)
     *
     * **Immediate events** (not debounced):
     * - componentSelected, componentDeleted, componentAdded, etc.
     *
     * **Execution order**: Subscribers called in insertion order
     * **Error handling**: One callback error doesn't prevent others
     *
     * **Performance**: O(n) where n = number of callbacks for this event
     * @param eventName - Event to fire
     * @param data - Data to pass to callbacks
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
    emit(eventName, data) {
        // Check if this event should be debounced
        if (this.debouncedEvents.has(eventName)) {
            this.emitDebounced(eventName, data);
        }
        else {
            this.emitImmediate(eventName, data);
        }
    }
    /**
     * Fire event immediately (no debouncing)
     *
     * **Private method**: Called by emit()
     * @param eventName - Event to fire
     * @param data - Data to pass to callbacks
     */
    emitImmediate(eventName, data) {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            callbacks.forEach((callback) => {
                try {
                    callback(data);
                }
                catch (error) {
                    console.error(`Error in event callback for "${eventName}":`, error);
                }
            });
        }
    }
    /**
     * Fire event with debouncing
     *
     * **How it works**:
     * 1. Clear any existing timer for this event
     * 2. Set new timer with debounceDelay
     * 3. When timer fires, call emitImmediate()
     * 4. If emit() called again before timer fires, restart timer
     *
     * **Result**: Event only fires once after activity stops
     *
     * **Private method**: Called by emit()
     * @param eventName - Event to fire
     * @param data - Data to pass to callbacks
     */
    emitDebounced(eventName, data) {
        // Clear existing timer for this event
        const existingTimer = this.debounceTimers.get(eventName);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new timer
        const timer = setTimeout(() => {
            this.emitImmediate(eventName, data);
            this.debounceTimers.delete(eventName);
        }, this.debounceDelay);
        this.debounceTimers.set(eventName, timer);
    }
    /**
     * Set debounce delay for all debounced events
     *
     * **Configurable**: Called by grid-builder with config.eventDebounceDelay
     * @param delay - Delay in milliseconds
     * @example
     * ```typescript
     * // In grid-builder componentDidLoad
     * eventManager.setDebounceDelay(config?.eventDebounceDelay || 300);
     * ```
     */
    setDebounceDelay(delay) {
        this.debounceDelay = delay;
    }
    /**
     * Get current debounce delay
     *
     * **Use case**: Debugging, testing
     * @returns Debounce delay in milliseconds
     */
    getDebounceDelay() {
        return this.debounceDelay;
    }
    /**
     * Remove all listeners for specific event
     *
     * **Use case**: Cleanup during component unmount
     * @param eventName - Event to remove all listeners from
     * @example
     * ```typescript
     * // Clear all componentAdded listeners
     * eventManager.removeAllListeners('componentAdded');
     * ```
     */
    removeAllListeners(eventName) {
        if (eventName) {
            this.listeners.delete(eventName);
        }
        else {
            this.listeners.clear();
        }
    }
    /**
     * Get listener count for debugging
     *
     * **Use case**: Check for memory leaks (too many listeners)
     * @param eventName - Event to count listeners for
     * @returns Number of listeners or 0 if event not registered
     * @example
     * ```typescript
     * const count = eventManager.listenerCount('componentAdded');
     * console.log(`${count} listeners for componentAdded`);
     * ```
     */
    listenerCount(eventName) {
        var _a;
        return ((_a = this.listeners.get(eventName)) === null || _a === void 0 ? void 0 : _a.size) || 0;
    }
}
/**
 * Backward Compatibility Layer
 * ==============================
 *
 * Singleton instance export for backward compatibility.
 * Existing code can continue using this while we migrate to instance-based architecture.
 */
// Create singleton instance (for backward compatibility only)
const defaultManager$1 = new EventManager();
// Export singleton instance
const eventManager = defaultManager$1;

/**
 * Undo/Redo Service
 * ==================
 *
 * Command pattern implementation for undo/redo functionality in the grid builder.
 * Provides stack-based history management with keyboard shortcuts and UI state tracking.
 *
 * ## Problem
 *
 * Interactive applications need undo/redo capabilities for:
 * - Recovering from mistakes (accidental delete)
 * - Experimenting with layouts (try different arrangements)
 * - Learning the interface (undo to see what changed)
 * - Building confidence (knowing you can undo)
 *
 * **Without undo/redo**:
 * - Users hesitant to experiment
 * - Mistakes are permanent
 * - No way to review history
 * - Poor user experience
 *
 * ## Solution
 *
 * Implement **Command Pattern** with stack-based history:
 *
 * 1. **Command Interface**: Each undoable action implements undo() and redo()
 * 2. **History Stack**: Array of command objects
 * 3. **Position Pointer**: Tracks current position in history
 * 4. **Bounded History**: Limited to 50 commands to prevent memory bloat
 * 5. **Branching**: New actions after undo discard "future" history
 *
 * ## Architecture: Command Pattern
 *
 * **Classic Gang of Four pattern** for undo/redo:
 *
 * **Key Components**:
 * - **Command Interface**: Defines undo() and redo() methods
 * - **Concrete Commands**: AddItemCommand, DeleteItemCommand, MoveItemCommand, ResizeCommand
 * - **Invoker**: undo-redo.ts (this file) manages command execution
 * - **Receiver**: state-manager.ts (receives state mutations)
 *
 * **Flow**:
 * ```
 * User Action → Create Command → pushCommand() → Execute & Store
 * Undo (Ctrl+Z) → Get command at position → command.undo() → Update position
 * Redo (Ctrl+Y) → Advance position → command.redo() → Execute
 * ```
 *
 * **Why Command Pattern**:
 * - ✅ Encapsulates actions as objects
 * - ✅ Enables undo/redo without coupling to specific operations
 * - ✅ Supports macro commands (batch operations)
 * - ✅ Easy to extend with new command types
 * - ✅ History can be serialized/persisted
 *
 * ## History Management
 *
 * **Stack-based with position pointer**:
 * ```
 * commandHistory = [cmd1, cmd2, cmd3, cmd4, cmd5]
 * ↑
 * historyPosition = 2
 * ```
 *
 * **Operations**:
 * - **Push new command**: Discard commands after position, append new command
 * - **Undo**: Execute command.undo() at position, decrement position
 * - **Redo**: Increment position, execute command.redo() at new position
 *
 * **Branching behavior** (discarding future on new action):
 * ```
 * Initial:  [cmd1, cmd2, cmd3, cmd4, cmd5]
 * ↑ position = 2
 *
 * Undo 2x:  [cmd1, cmd2, cmd3, cmd4, cmd5]
 * ↑ position = 0
 *
 * New cmd:  [cmd1, cmd6]  ← cmd2-cmd5 discarded!
 * ↑ position = 1
 * ```
 *
 * **Why branching (not tree)**:
 * - Simpler mental model for users
 * - No UI complexity for branch navigation
 * - Standard undo/redo UX pattern
 *
 * ## Memory Management
 *
 * **Bounded history** (MAX_HISTORY = 50):
 * - Prevents unbounded memory growth
 * - Removes oldest command when limit reached
 * - 50 commands ≈ typical user session
 *
 * **Memory per command**:
 * - Command object: ~200-500 bytes
 * - State snapshots: ~1-5 KB (JSON serialized GridItem)
 * - Total for 50 commands: ~50-250 KB (acceptable)
 *
 * **Sliding window approach**:
 * ```
 * When history full:
 * [cmd1, cmd2, ..., cmd50]  ← At capacity
 * Push cmd51:
 * [cmd2, cmd3, ..., cmd51]  ← cmd1 removed
 * ```
 *
 * ## State Snapshot Strategy
 *
 * Each command stores **before/after snapshots**:
 * ```typescript
 * class MoveItemCommand implements Command {
 * beforeState = JSON.parse(JSON.stringify(item));  // Deep clone
 * afterState = JSON.parse(JSON.stringify(updatedItem));
 *
 * undo() { restoreState(beforeState); }
 * redo() { restoreState(afterState); }
 * }
 * ```
 *
 * **Deep cloning required because**:
 * - Prevents mutations from affecting snapshots
 * - Ensures independent state copies
 * - Simple and reliable (no reference tracking needed)
 *
 * **Trade-off**:
 * - ✅ Simple implementation
 * - ✅ No reference bugs
 * - ❌ Higher memory usage than delta-based
 * - ❌ Slower than structural sharing (acceptable for this use case)
 *
 * ## Keyboard Shortcuts
 *
 * Implemented in grid-builder-app.tsx:
 * - **Ctrl+Z** (Cmd+Z on Mac): Undo last command
 * - **Ctrl+Y** (Cmd+Y on Mac): Redo next command
 * - **Ctrl+Shift+Z**: Alternative redo (common in design tools)
 *
 * ## UI Integration
 *
 * **Reactive state for buttons**:
 * ```typescript
 * undoRedoState = {
 * canUndo: boolean,  // Enable/disable undo button
 * canRedo: boolean   // Enable/disable redo button
 * }
 * ```
 *
 * **Updates on**:
 * - New command pushed
 * - Undo executed
 * - Redo executed
 * - History cleared
 *
 * **Button rendering**:
 * ```tsx
 * <button disabled={!undoRedoState.canUndo} onClick={undo}>
 * Undo
 * </button>
 * ```
 *
 * ## Extracting This Pattern
 *
 * To adapt Command pattern for your project:
 *
 * **Minimal implementation**:
 * ```typescript
 * interface Command {
 * undo(): void;
 * redo(): void;
 * }
 *
 * class UndoRedoManager {
 * private history: Command[] = [];
 * private position = -1;
 *
 * push(command: Command) {
 * this.history.splice(this.position + 1);  // Discard future
 * this.history.push(command);
 * this.position++;
 * }
 *
 * undo() {
 * if (this.position >= 0) {
 * this.history[this.position].undo();
 * this.position--;
 * }
 * }
 *
 * redo() {
 * if (this.position < this.history.length - 1) {
 * this.position++;
 * this.history[this.position].redo();
 * }
 * }
 * }
 * ```
 *
 * **Example commands**:
 * ```typescript
 * class AddItemCommand implements Command {
 * constructor(
 * private canvasId: string,
 * private item: GridItem
 * ) {}
 *
 * undo() { removeItemFromCanvas(this.canvasId, this.item.id); }
 * redo() { addItemToCanvas(this.canvasId, this.item); }
 * }
 * ```
 *
 * **For different frameworks**:
 * - React: Use useReducer or Zustand middleware
 * - Vue: Use Pinia plugin or custom composable
 * - Angular: Use NgRx effects or service
 * @module undo-redo
 */
const debug$1 = createDebugLogger("undo-redo");
/**
 * Maximum number of commands in history
 *
 * **Why 50**: Balance between:
 * - ✅ Enough for typical user session
 * - ✅ Reasonable memory usage (~50-250 KB)
 * - ❌ Not unlimited (prevents memory bloat)
 *
 * **Behavior when exceeded**: Oldest command removed (sliding window)
 */
const MAX_HISTORY = 50;
/**
 * UndoRedoManager Class
 * =====================
 *
 * Instance-based undo/redo management for grid builder.
 * Each grid-builder component can create its own UndoRedoManager instance.
 *
 * ## Architecture
 *
 * **Before (Singleton)**:
 * - Single global history shared by all grid-builder instances
 * - Multiple instances pollute each other's history
 * - Storybook stories contaminate each other
 *
 * **After (Instance-based)**:
 * - Each grid-builder creates its own UndoRedoManager
 * - Isolated history per instance
 * - Multiple grid-builders on same page work independently
 *
 * ## Usage
 *
 * **New code (instance-based)**:
 * ```typescript
 * // In grid-builder component
 * componentWillLoad() {
 *   this.undoRedoManager = new UndoRedoManager();
 *   this.undoRedoState = this.undoRedoManager.state;
 * }
 * ```
 *
 * **Legacy code (backward compatible)**:
 * ```typescript
 * // Still works via singleton export
 * import { undoRedo } from './services/undo-redo';
 * undoRedo.push(new AddItemCommand(...));
 * ```
 *
 * ## Instance State
 *
 * Each instance has:
 * - Independent reactive state (StencilJS store)
 * - Own command history stack
 * - Own history position pointer
 * - Own lifecycle (dispose() cleanup)
 */
class UndoRedoManager {
    /**
     * Create new UndoRedoManager instance
     *
     * @example
     * ```typescript
     * // Empty history (default)
     * const manager = new UndoRedoManager();
     * ```
     */
    constructor() {
        /**
         * Command history stack
         *
         * **Structure**: Array of Command objects in chronological order
         * **Growth**: Appends new commands to end
         * **Bounded**: Limited to MAX_HISTORY commands (50)
         * **Branching**: Discards commands after current position on new push
         */
        this.commandHistory = [];
        /**
         * Current position in command history
         *
         * **Range**: -1 (empty history) to commandHistory.length - 1
         * **Meaning**:
         * - -1: No commands or all undone
         * - 0: First command is current state
         * - N: Command at index N is current state
         */
        this.historyPosition = -1;
        // Create StencilJS reactive store
        const { state, dispose } = createStore({
            canUndo: false,
            canRedo: false,
        });
        this.state = state;
        this.dispose = dispose;
    }
    /**
     * Update reactive state for undo/redo button enablement
     *
     * **Called after**:
     * - push() - New command added
     * - undo() - Position moved backward
     * - redo() - Position moved forward
     * - clearHistory() - History reset
     *
     * **Updates**:
     * - `canUndo`: true if historyPosition >= 0 (commands available to undo)
     * - `canRedo`: true if historyPosition < commandHistory.length - 1 (commands available to redo)
     */
    updateButtonStates() {
        this.state.canUndo = this.historyPosition >= 0;
        this.state.canRedo = this.historyPosition < this.commandHistory.length - 1;
    }
    /**
     * Push a new command to the history stack
   *
   * **Use cases**:
   * - After drag operation completes
   * - After resize operation completes
   * - After adding new item
   * - After deleting item
   *
   * **Branching behavior** (discards future):
   * ```
   * Before: [cmd1, cmd2, cmd3, cmd4]
   * ↑ position = 1 (undid twice)
   *
   * Push cmd5: [cmd1, cmd2, cmd5]
   * ↑ position = 2
   *
   * Note: cmd3 and cmd4 discarded!
   * ```
   *
   * **Why discard future**:
   * - Matches user mental model (new action erases "undone" history)
   * - Simpler implementation than tree-based history
   * - Standard undo/redo UX pattern
   *
   * **Memory management**:
   * - If history exceeds MAX_HISTORY (50), oldest command removed
   * - Position adjusted to maintain integrity
   *
   * **Operation sequence**:
   * 1. Discard commands after current position (splice)
   * 2. Append new command to history
   * 3. If over limit, remove oldest (shift)
   * 4. Update position pointer
   * 5. Update button states (triggers UI)
   *
   * **Typical usage**:
   * ```typescript
   * // After drag end
   * const command = new MoveItemCommand(item, oldPos, newPos);
   * pushCommand(command);
   * ```
   *
   * **Important**: Command should be fully constructed (with snapshots taken)
   * before being pushed. This function does NOT execute the command - it's
   * assumed the operation already happened.
   * @param command - Fully constructed command with before/after snapshots
   * @example
   * ```typescript
   * // Delete item example
   * handleDelete(itemId: string, canvasId: string) {
   *   const item = getItem(canvasId, itemId);
   *   const index = gridState.canvases[canvasId].items.indexOf(item);
   *
   *   // Perform the delete
   *   removeItemFromCanvas(canvasId, itemId);
   *
   *   // Push command for undo (AFTER operation)
   *   const command = new DeleteItemCommand(canvasId, item, index);
   *   pushCommand(command);
   * }
   * ```
     * @param command - Fully constructed command with before/after snapshots
     */
    push(command) {
        debug$1.log("➕ PUSH: Adding command to history:", command.description || command);
        // Remove any commands after current position
        this.commandHistory.splice(this.historyPosition + 1);
        // Add new command
        this.commandHistory.push(command);
        // Limit history size
        if (this.commandHistory.length > MAX_HISTORY) {
            this.commandHistory.shift();
        }
        else {
            this.historyPosition++;
        }
        debug$1.log("  History position now:", this.historyPosition, ", Total commands:", this.commandHistory.length);
        // Update button states
        this.updateButtonStates();
    }
    /**
     * Undo the last command in history
     *
     * **Triggered by**:
     * - Ctrl+Z / Cmd+Z keyboard shortcut
     * - Undo button click
     * - Programmatic undo (rare)
     *
     * **Operation sequence**:
     * 1. Check if undo available (historyPosition >= 0)
     * 2. Get command at current position
     * 3. Execute command.undo() (reverses operation)
     * 4. Decrement position pointer
     * 5. Update button states (triggers UI)
     *
     * **Side effects**:
     * - Mutates global state (via command.undo())
     * - Triggers component re-renders
     * - Updates undo/redo button states
     * - May deselect items (depending on command)
     *
     * **Position before/after**:
     * ```
     * Before: [cmd1, cmd2, cmd3]
     * ↑ position = 2
     *
     * After:  [cmd1, cmd2, cmd3]
     * ↑ position = 1
     * ```
     *
     * **Safety**: No-op if historyPosition < 0 (nothing to undo)
     *
     * **Multiple undo**: Can be called repeatedly to undo multiple commands
     * @example
     * ```typescript
     * // Keyboard shortcut handler
     * window.addEventListener('keydown', (e) => {
     *   if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
     *     undo();
     *     e.preventDefault();
     *   }
     * });
     * ```
     */
    undo() {
        if (this.historyPosition < 0) {
            return;
        }
        const command = this.commandHistory[this.historyPosition];
        debug$1.log("🔙 UNDO: Executing command at position", this.historyPosition, ":", command);
        debug$1.log("  Command description:", command.description);
        command.undo();
        this.historyPosition--;
        debug$1.log("  New position after undo:", this.historyPosition);
        this.updateButtonStates();
    }
    /**
     * Redo the next command in history
     *
     * **Triggered by**:
     * - Ctrl+Y / Cmd+Y keyboard shortcut
     * - Ctrl+Shift+Z / Cmd+Shift+Z (alternative)
     * - Redo button click
     * - Programmatic redo (rare)
     *
     * **Operation sequence**:
     * 1. Check if redo available (historyPosition < commandHistory.length - 1)
     * 2. Increment position pointer
     * 3. Get command at new position
     * 4. Execute command.redo() (reapplies operation)
     * 5. Update button states (triggers UI)
     *
     * **Side effects**:
     * - Mutates global state (via command.redo())
     * - Triggers component re-renders
     * - Updates undo/redo button states
     * - May select items (depending on command)
     *
     * **Position before/after**:
     * ```
     * Before: [cmd1, cmd2, cmd3]
     * ↑ position = 1
     *
     * After:  [cmd1, cmd2, cmd3]
     * ↑ position = 2
     * ```
     *
     * **Safety**: No-op if no commands to redo (position at end)
     *
     * **Multiple redo**: Can be called repeatedly to redo multiple commands
     *
     * **Redo after new action**: Redo becomes unavailable after new command
     * pushed (future history discarded)
     * @example
     * ```typescript
     * // Keyboard shortcut handler
     * window.addEventListener('keydown', (e) => {
     *   if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
     *     redo();
     *     e.preventDefault();
     *   }
     * });
     * ```
     */
    redo() {
        if (this.historyPosition >= this.commandHistory.length - 1) {
            return;
        }
        this.historyPosition++;
        const command = this.commandHistory[this.historyPosition];
        command.redo();
        this.updateButtonStates();
    }
    /**
     * Check if undo operation is available
     *
     * **Use cases**:
     * - Enabling/disabling undo button
     * - Showing undo keyboard hint
     * - Programmatic checks before undo
     *
     * **Returns true when**: historyPosition >= 0 (commands in history)
     * **Returns false when**: historyPosition = -1 (no history or all undone)
     *
     * **Note**: Prefer using `undoRedoState.canUndo` in UI components
     * for automatic reactivity. This function is for imperative checks.
     * @returns true if undo() can be called, false otherwise
     * @example
     * ```typescript
     * // Imperative check
     * if (canUndo()) {
     *   debug.log('Undo available');
     *   undo();
     * }
     *
     * // Prefer reactive state in UI
     * <button disabled={!undoRedoState.canUndo}>Undo</button>
     * ```
     */
    canUndo() {
        return this.historyPosition >= 0;
    }
    /**
     * Check if redo operation is available
     *
     * **Use cases**:
     * - Enabling/disabling redo button
     * - Showing redo keyboard hint
     * - Programmatic checks before redo
     *
     * **Returns true when**: historyPosition < commandHistory.length - 1
     * **Returns false when**: At end of history or history empty
     *
     * **Becomes false after**: New command pushed (future discarded)
     *
     * **Note**: Prefer using `undoRedoState.canRedo` in UI components
     * for automatic reactivity. This function is for imperative checks.
     * @returns true if redo() can be called, false otherwise
     * @example
     * ```typescript
     * // Imperative check
     * if (canRedo()) {
     *   debug.log('Redo available');
     *   redo();
     * }
     *
     * // Prefer reactive state in UI
     * <button disabled={!undoRedoState.canRedo}>Redo</button>
     * ```
     */
    canRedo() {
        return this.historyPosition < this.commandHistory.length - 1;
    }
    /**
     * Clear all command history
     *
     * **Use cases**:
     * - Application reset
     * - Loading new project
     * - Test cleanup
     * - Memory management (rare)
     *
     * **Effects**:
     * - Empties command history array
     * - Resets position to -1
     * - Disables both undo and redo buttons
     * - Does NOT affect current state (only history)
     *
     * **Memory**: Allows garbage collection of command objects and snapshots
     *
     * **Cannot be undone**: This operation itself is not undoable
     *
     * **Safety**: Safe to call even if history already empty
     * @example
     * ```typescript
     * // Reset application
     * function resetApp() {
     *   clearHistory();
     *   reset(); // Reset state
     *   debug.log('Application reset');
     * }
     *
     * // Test cleanup
     * afterEach(() => {
     *   clearHistory();
     * });
     * ```
     */
    clearHistory() {
        this.commandHistory.length = 0;
        this.historyPosition = -1;
        this.updateButtonStates();
    }
}
/**
 * Backward Compatibility Layer
 * ==============================
 *
 * Singleton instance and helper function exports for backward compatibility.
 * Existing code can continue using these while we migrate to instance-based architecture.
 *
 */
// Create singleton instance (for backward compatibility only)
const defaultManager = new UndoRedoManager();
// Export singleton state (backward compatible)
const undoRedoState = defaultManager.state;
// Export singleton instance methods as standalone functions (backward compatible)
const pushCommand = (command) => defaultManager.push(command);
const undo = () => defaultManager.undo();
const redo = () => defaultManager.redo();
const canUndo = () => defaultManager.canUndo();
const canRedo = () => defaultManager.canRedo();
const clearHistory = () => defaultManager.clearHistory();
// Export object wrapper for backward compatibility (deprecated, use standalone functions)
const undoRedo = {
    push: pushCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
};

const gridBuilderCss = ":host{--grid-builder-primary-color:#007bff;--grid-builder-palette-bg:#f5f5f5;--grid-builder-canvas-bg:#ffffff;--grid-builder-grid-line-color:rgba(0, 0, 0, 0.1);--grid-builder-selection-color:#007bff;--grid-builder-resize-handle-color:#007bff;--grid-builder-font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\",\n    \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif;display:block;width:100%;height:100%;font-family:var(--grid-builder-font-family)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border-width:0}.grid-builder-container{position:relative;display:flex;width:100%;height:100%}.canvas-area{position:relative;flex:1;background:var(--grid-builder-canvas-bg);overflow-y:auto}.canvases-container{display:flex;flex-direction:column;min-height:100%;gap:0;}.canvas-wrapper{position:relative;display:flex;flex-direction:column;gap:0}.canvas-wrapper:first-child{padding-top:38px}.config-area{position:fixed;z-index:1000;right:0;bottom:0;display:none;width:350px;max-height:60%;border:1px solid #ddd;border-radius:8px 8px 0 0;background:white;box-shadow:0 -2px 10px rgba(0, 0, 0, 0.1)}.config-area.visible{display:block}";

const debug = createDebugLogger("grid-builder");
const GridBuilder = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        /**
         * Custom API exposure configuration
         *
         * **Optional prop**: Control where and how the Grid Builder API is exposed
         * **Default**: `{ key: 'gridBuilderAPI' }`
         * **Purpose**: Allows multiple grid-builder instances on the same page
         *
         * **Options**:
         * 1. **Custom key on window** (multiple instances):
         * ```typescript
         * <grid-builder api-ref={{ key: 'gridAPI1' }}></grid-builder>
         * <grid-builder api-ref={{ key: 'gridAPI2' }}></grid-builder>
         * // Access: window.gridAPI1, window.gridAPI2
         * ```
         *
         * 2. **Disable automatic exposure** (use ref instead):
         * ```typescript
         * <grid-builder api-ref={null}></grid-builder>
         * // Access via ref: <grid-builder ref={el => this.api = el?.api}></grid-builder>
         * ```
         */
        this.apiRef = {
            key: "gridBuilderAPI",
        };
        /**
         * Component registry (internal state)
         *
         * **Purpose**: Map component type → definition for lookup
         * **Built from**: components prop
         * **Used by**: grid-item-wrapper for dynamic rendering
         *
         * **Structure**: `{ 'header': ComponentDefinition, 'text': ComponentDefinition, ... }`
         */
        this.componentRegistry = new Map();
        /**
         * Initialized plugins (internal state)
         *
         * **Purpose**: Track plugin instances for cleanup
         * **Lifecycle**: Set in componentDidLoad, cleared in disconnectedCallback
         */
        this.initializedPlugins = [];
        /**
         * Screen reader announcement (ARIA live region)
         *
         * **Purpose**: Announce dynamic changes to screen reader users
         * **Updated by**: Event listeners for component operations
         * **Non-visual**: Only affects screen readers, no visual impact
         *
         * **Announces**:
         * - Component added/deleted
         * - Drag/drop operations
         * - Undo/redo actions
         * - Canvas switching
         */
        this.announcement = "";
        /**
         * Setup ResizeObserver for container-based viewport switching
         *
         * **Purpose**: Automatically switch between desktop/mobile viewports based on container width
         * **Breakpoint**: 768px (container width, not window viewport)
         *
         * **Observer callback**:
         * 1. Get container width from ResizeObserver entry
         * 2. Determine target viewport (mobile if < 768px, desktop otherwise)
         * 3. Update this.stateManager!.state.currentViewport if changed
         *
         * **Why container-based**:
         * - More flexible than window.resize (e.g., sidebar layouts, embedded widgets)
         * - Grid-builder can be embedded at any size
         * - Multiple instances can have different viewports on same page
         *
         * **Debouncing**: Not needed - ResizeObserver is already efficient
         */
        this.setupViewportResizeObserver = () => {
            if (!this.hostElement) {
                return;
            }
            // Watch for grid-builder container size changes
            this.viewportResizeObserver = new ResizeObserver((entries) => {
                var _a, _b;
                for (const entry of entries) {
                    // Get container width directly from the element
                    // Note: We use offsetWidth instead of entry.contentRect.width because
                    // the grid-builder uses Shadow DOM and contentRect can return 0 for elements with height: 100%
                    const width = this.hostElement.offsetWidth ||
                        ((_b = (_a = entry.borderBoxSize) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.inlineSize) ||
                        entry.contentRect.width;
                    // Skip viewport switching if width is 0 or very small (container not yet laid out)
                    // This prevents premature switching to mobile before CSS layout is complete
                    if (width < 100) {
                        debug.log(`📱 Skipping viewport switch - container not yet laid out (width: ${Math.round(width)}px)`);
                        return;
                    }
                    // Determine target viewport based on container width
                    const targetViewport = width < 768 ? "mobile" : "desktop";
                    // Only update if viewport changed
                    if (this.stateManager.state.currentViewport !== targetViewport) {
                        debug.log(`📱 Container-based viewport switch: ${this.stateManager.state.currentViewport} → ${targetViewport} (width: ${Math.round(width)}px)`);
                        this.stateManager.state.currentViewport = targetViewport;
                    }
                }
            });
            this.viewportResizeObserver.observe(this.hostElement);
        };
        /**
         * Setup screen reader announcements for dynamic changes
         *
         * **Purpose**: Subscribe to events and announce changes via ARIA live region
         * **Non-visual**: Only affects screen readers, no visual impact
         *
         * **Subscribes to**:
         * - componentAdded: "Component added to canvas"
         * - componentDeleted: "Component deleted"
         * - componentMoved: "Component moved to new canvas"
         * - undoExecuted: "Undo action performed"
         * - redoExecuted: "Redo action performed"
         * - canvasActivated: "Canvas activated"
         *
         * **WCAG Compliance**: 4.1.3 Status Messages (Level AA)
         */
        this.setupScreenReaderAnnouncements = () => {
            var _a, _b, _c, _d, _e, _f;
            // Component added
            (_a = this.eventManagerInstance) === null || _a === void 0 ? void 0 : _a.on("componentAdded", (data) => {
                const definition = this.componentRegistry.get(data.item.type);
                const componentName = (definition === null || definition === void 0 ? void 0 : definition.name) || data.item.type;
                this.announce(`${componentName} component added to canvas`);
            });
            // Component deleted
            (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.on("componentDeleted", (_data) => {
                this.announce(`Component deleted`);
            });
            // Component moved (cross-canvas)
            (_c = this.eventManagerInstance) === null || _c === void 0 ? void 0 : _c.on("componentMoved", (_data) => {
                this.announce(`Component moved to new canvas`);
            });
            // Undo/Redo with focus management
            (_d = this.eventManagerInstance) === null || _d === void 0 ? void 0 : _d.on("undoExecuted", () => {
                this.announce(`Undo action performed`);
                // Restore focus to selected item after undo (if any)
                this.restoreFocusToSelection();
            });
            (_e = this.eventManagerInstance) === null || _e === void 0 ? void 0 : _e.on("redoExecuted", () => {
                this.announce(`Redo action performed`);
                // Restore focus to selected item after redo (if any)
                this.restoreFocusToSelection();
            });
            // Canvas activated
            (_f = this.eventManagerInstance) === null || _f === void 0 ? void 0 : _f.on("canvasActivated", (data) => {
                var _a;
                const metadata = (_a = this.canvasMetadata) === null || _a === void 0 ? void 0 : _a[data.canvasId];
                const canvasTitle = (metadata === null || metadata === void 0 ? void 0 : metadata.title) || data.canvasId;
                this.announce(`${canvasTitle} canvas activated`);
            });
        };
        /**
         * Announce message to screen readers via ARIA live region
         *
         * **Purpose**: Update announcement state for screen reader users
         * **Non-visual**: Only affects screen readers, no visual impact
         *
         * **Implementation**:
         * - Updates @State() announcement property
         * - Triggers re-render of ARIA live region
         * - Screen reader automatically announces new content
         * - Clears announcement after 100ms (prevents repeat announcements)
         *
         * **WCAG Compliance**: 4.1.3 Status Messages (Level AA)
         * @param message - Message to announce to screen reader users
         */
        this.announce = (message) => {
            this.announcement = message;
            // Clear announcement after brief delay to allow re-announcing same message
            setTimeout(() => {
                this.announcement = "";
            }, 100);
        };
        /**
         * Move focus to next logical item after deletion
         *
         * **Purpose**: Improve keyboard navigation by maintaining focus context after deletion
         * **Non-visual**: Uses programmatic focus, no visual changes
         *
         * **Focus strategy**:
         * 1. Try to focus the next item in the same canvas (by y position, then x)
         * 2. If no next item, try to focus the previous item
         * 3. If no items left in canvas, focus the canvas container
         * 4. If canvas not found, focus the component palette
         *
         * **WCAG Compliance**: 2.4.3 Focus Order (Level A)
         * @param canvasId - Canvas that contained the deleted item
         * @param _deletedItemId - ID of the item that was deleted (unused, for documentation)
         */
        this.moveFocusAfterDeletion = (canvasId, _deletedItemId) => {
            // Get the canvas that contained the deleted item
            const canvas = this.stateManager.state.canvases[canvasId];
            if (!canvas) {
                debug.log("⌨️ Focus: Canvas not found, focusing palette");
                // Focus the component palette as fallback
                const paletteElement = this.hostElement.querySelector("component-palette");
                if (paletteElement) {
                    paletteElement.focus();
                }
                return;
            }
            // Get remaining items in the canvas
            const remainingItems = canvas.items;
            if (remainingItems.length === 0) {
                debug.log("⌨️ Focus: No items left, focusing canvas");
                // No items left in canvas - focus the canvas container
                const canvasElement = this.hostElement.querySelector(`canvas-section[canvas-id="${canvasId}"]`);
                if (canvasElement) {
                    canvasElement.focus();
                }
                else {
                    // Fallback to component palette
                    const paletteElement = this.hostElement.querySelector("component-palette");
                    if (paletteElement) {
                        paletteElement.focus();
                    }
                }
                return;
            }
            // Sort items by position (top-to-bottom, left-to-right) to find next logical item
            const sortedItems = [...remainingItems].sort((a, b) => {
                const aLayout = a.layouts.desktop;
                const bLayout = b.layouts.desktop;
                // Sort by y position first (top to bottom)
                if (aLayout.y !== bLayout.y) {
                    return aLayout.y - bLayout.y;
                }
                // If same y, sort by x position (left to right)
                return aLayout.x - bLayout.x;
            });
            // Focus the first item in the sorted list
            const nextItem = sortedItems[0];
            debug.log("⌨️ Focus: Focusing next item", {
                itemId: nextItem.id,
                position: {
                    x: nextItem.layouts.desktop.x,
                    y: nextItem.layouts.desktop.y,
                },
            });
            // Find the DOM element for the next item
            const nextItemElement = this.hostElement.querySelector(`#${nextItem.id}`);
            if (nextItemElement) {
                // Focus the item element
                nextItemElement.focus();
                // Also select it in the state
                this.stateManager.state.selectedItemId = nextItem.id;
                this.stateManager.state.selectedCanvasId = nextItem.canvasId;
            }
        };
        /**
         * Restore focus to currently selected item (for undo/redo)
         *
         * **Purpose**: Maintain focus context after undo/redo operations
         * **Non-visual**: Uses programmatic focus, no visual changes
         *
         * **Implementation**:
         * - Check if an item is selected in state
         * - Find the DOM element for that item
         * - Focus it programmatically
         * - Use setTimeout to ensure DOM has updated after state change
         *
         * **WCAG Compliance**: 2.4.3 Focus Order (Level A)
         */
        this.restoreFocusToSelection = () => {
            // Wait for DOM to update after state change
            setTimeout(() => {
                if (this.stateManager.state.selectedItemId) {
                    debug.log("⌨️ Focus: Restoring focus to selected item", {
                        itemId: this.stateManager.state.selectedItemId,
                    });
                    const selectedElement = this.hostElement.querySelector(`#${this.stateManager.state.selectedItemId}`);
                    if (selectedElement) {
                        selectedElement.focus();
                    }
                }
            }, 10);
        };
    }
    /**
     * Component will load lifecycle
     *
     * **Purpose**: Validate props and initialize component registry
     *
     * **Validation**:
     * - Components prop is required
     * - Each component must have unique type
     * - Basic structure validation
     *
     * **Registry building**:
     * - Convert array to Map for O(1) lookups
     * - Key = component type, Value = ComponentDefinition
     *
     * **Initial state restoration**:
     * - If initialState provided, merge into gridState
     * - Otherwise use empty canvases
     */
    /**
     * Handle item deletion from grid-item-wrapper
     * Internal event dispatched by grid-item-wrapper after user clicks delete
     */
    handleGridItemDelete(event) {
        var _a;
        debug.log("🗑️ @Listen(grid-item:delete) in grid-builder", {
            detail: event.detail,
        });
        const { itemId } = event.detail;
        if (itemId) {
            debug.log("  ✅ Deleting item via API (with undo support):", itemId);
            // Use API method instead of direct deleteItemsBatch to enable undo/redo
            (_a = this.api) === null || _a === void 0 ? void 0 : _a.deleteComponent(itemId);
        }
    }
    /**
     * Handle palette item click (click-to-add feature)
     *
     * **Triggered**: User clicks palette item (emitted by component-palette)
     * **Purpose**: Add component to active canvas using smart positioning
     *
     * **Event Listener Target**: `document` (not component host element)
     * - Listens at document level to hear events from palette even when it's a DOM sibling
     * - Critical for Storybook stories where palette and grid-builder are rendered as siblings
     * - Events with `bubbles: true` and `composed: true` propagate to document level
     * - This pattern works in all scenarios: parent-child, siblings, or separate component trees
     *
     * ## Implementation Steps
     *
     * 1. **Check if enabled**: Only proceed if `config.enableClickToAdd !== false`
     * 2. **Get active canvas**: Use this.stateManager!.state.activeCanvasId or auto-select first
     * 3. **Find component definition**: Look up in component registry
     * 4. **Find free space**: Use findFreeSpace() for collision-free placement
     * 5. **Create grid item**: Generate ID, build item object with found position
     * 6. **Add to state**: Use api.addComponent() for undo/redo support
     * 7. **Visual feedback**: Highlight canvas, show position indicator, animate component
     * 8. **Emit event**: componentAdded event for plugins
     *
     * ## Edge Cases Handled
     *
     * - **No active canvas**: Auto-selects first canvas
     * - **No canvases exist**: Logs warning, exits gracefully
     * - **Component definition not found**: Logs error, exits
     * - **No free space**: Places at canvas bottom (auto-expands canvas)
     *
     * ## Visual Feedback Sequence
     *
     * 1. **Canvas highlight** (600ms pulse on border)
     * 2. **Position indicator** (800ms ghost outline at target position)
     * 3. **Component animation** (400ms fade + scale when added)
     *
     * **Example flow**:
     * ```
     * User clicks "Header" in palette
     * → Canvas border pulses
     * → Ghost outline shows where header will appear
     * → Header component fades/scales in at position
     * → Canvas height adjusts if needed
     * ```
     * @param event - Custom event with { componentType: string }
     */
    async handlePaletteItemClick(event) {
        var _a, _b, _c, _d, _e, _f, _g;
        debug.log("➕ @Listen(palette-item-click) in grid-builder", {
            detail: event.detail,
        });
        // Filter events by target instance ID (for multi-instance support)
        // If targetGridBuilderId is specified, only respond if it matches our instance ID
        const { targetGridBuilderId } = event.detail;
        if (targetGridBuilderId) {
            const myInstanceId = ((_a = this.apiRef) === null || _a === void 0 ? void 0 : _a.key) || "gridBuilderAPI";
            if (targetGridBuilderId !== myInstanceId) {
                debug.log(`  ⏭️ Skipping - event targeted at ${targetGridBuilderId}, this instance is ${myInstanceId}`);
                return;
            }
            debug.log(`  ✅ Event matches this instance (${myInstanceId})`);
        }
        // Check if click-to-add is enabled (default: true)
        const enableClickToAdd = (_c = (_b = this.config) === null || _b === void 0 ? void 0 : _b.enableClickToAdd) !== null && _c !== void 0 ? _c : true;
        if (!enableClickToAdd) {
            debug.log("  ⏭️ Click-to-add disabled via config");
            return;
        }
        const { componentType } = event.detail;
        if (!componentType) {
            debug.warn("handlePaletteItemClick: Component type not provided");
            return;
        }
        // Get or auto-select active canvas
        let canvasId = this.stateManager.state.activeCanvasId;
        if (!canvasId) {
            // Auto-select first canvas
            const canvasIds = Object.keys(this.stateManager.state.canvases);
            if (canvasIds.length === 0) {
                debug.warn("handlePaletteItemClick: No canvases available");
                return;
            }
            canvasId = canvasIds[0];
            (_d = this.api) === null || _d === void 0 ? void 0 : _d.setActiveCanvas(canvasId);
            debug.log(`  🎯 Auto-selected first canvas: ${canvasId}`);
        }
        // Get component definition
        const definition = this.componentRegistry.get(componentType);
        if (!definition) {
            debug.error(`handlePaletteItemClick: Component definition not found for type: ${componentType}`);
            return;
        }
        // Get default size from definition (or use fallback)
        const defaultSize = definition.defaultSize || { width: 10, height: 6 };
        // Import space-finder utility (dynamic import to avoid circular dependency)
        const { findFreeSpace } = await import('./space-finder-1IlEzUwJ.js');
        // Find free space on canvas (pass state instance for multi-instance support)
        const position = findFreeSpace(canvasId, defaultSize.width, defaultSize.height, this.stateManager.state);
        if (!position) {
            debug.error(`handlePaletteItemClick: Could not find space on canvas ${canvasId}`);
            return;
        }
        debug.log("  📍 Found free space:", position);
        // Import visual feedback utilities (dynamic import)
        const visualFeedback = await import('./visual-feedback-NdurxFwM.js');
        // Show visual feedback (canvas highlight + position indicator)
        visualFeedback.highlightCanvas(canvasId);
        visualFeedback.showPositionIndicator(canvasId, position.x, position.y, defaultSize.width, defaultSize.height, this.config);
        debug.log("  ➕ Adding component via API");
        // Add via API for undo/redo support (correct signature)
        const newItemId = (_e = this.api) === null || _e === void 0 ? void 0 : _e.addComponent(canvasId, componentType, {
            x: position.x,
            y: position.y,
            width: defaultSize.width,
            height: defaultSize.height,
        }, {});
        if (!newItemId) {
            debug.error("Failed to add component to canvas");
            return;
        }
        // Activate the canvas where the component was dropped
        (_f = this.api) === null || _f === void 0 ? void 0 : _f.setActiveCanvas(canvasId);
        debug.log(`  🎯 Activated canvas: ${canvasId}`);
        // Animate component in (after DOM update completes)
        // Use double requestAnimationFrame to ensure:
        // 1. First rAF: Current frame completes
        // 2. Second rAF: Next frame starts (after StencilJS render + positioning)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                visualFeedback.animateComponentIn(newItemId);
            });
        });
        // Set as selected (focus on newly added item)
        this.stateManager.state.selectedItemId = newItemId;
        this.stateManager.state.selectedCanvasId = canvasId;
        // Emit componentAdded event for plugins
        // Must include full item object to match ComponentAddedEvent interface
        const canvas = this.stateManager.state.canvases[canvasId];
        const newItem = canvas === null || canvas === void 0 ? void 0 : canvas.items.find((item) => item.id === newItemId);
        if (newItem) {
            (_g = this.eventManagerInstance) === null || _g === void 0 ? void 0 : _g.emit("componentAdded", {
                item: newItem,
                canvasId,
            });
        }
        debug.log("  ✅ Component added successfully");
    }
    componentWillLoad() {
        var _a;
        // Validate required props
        if (!this.components || this.components.length === 0) {
            console.error("GridBuilder: components prop is required");
            return;
        }
        // Build component registry
        this.componentRegistry = new Map(this.components.map((comp) => [comp.type, comp]));
        // Validate unique component types
        if (this.componentRegistry.size !== this.components.length) {
            debug.warn("GridBuilder: Duplicate component types detected");
        }
        // Expose interact.js globally (required for drag/drop handlers)
        window.interact = interact;
        // Phase 2: Create service instances (instance-based architecture)
        // Each grid-builder component gets its own isolated service instances
        this.stateManager = new StateManager();
        this.undoRedoManager = new UndoRedoManager();
        this.eventManagerInstance = new EventManager();
        this.virtualRendererInstance = new VirtualRendererService();
        this.domCacheInstance = new DOMCache();
        debug.log("GridBuilder: Service instances created", {
            stateManager: !!this.stateManager,
            undoRedoManager: !!this.undoRedoManager,
            eventManagerInstance: !!this.eventManagerInstance,
            virtualRendererInstance: !!this.virtualRendererInstance,
            domCacheInstance: !!this.domCacheInstance,
        });
        // Set instanceId for cache isolation (stored as private property to avoid mutating config prop)
        // This prevents cache collisions when multiple instances share canvasIds
        this.instanceId = ((_a = this.apiRef) === null || _a === void 0 ? void 0 : _a.key) || 'gridBuilderAPI';
        debug.log("GridBuilder: Instance ID set", {
            instanceId: this.instanceId,
            hasCustomConfig: !!this.config,
        });
        // Clear this instance's cache on load to prevent stale values when remounting
        // Critical for Storybook tab switching: prevents cache from previous tab (Docs/Canvas)
        // ResizeObserver only fires on changes, not initial load, so we must clear here
        clearGridSizeCache(this.instanceId);
        debug.log("GridBuilder: Cleared instance cache on load", {
            instanceId: this.instanceId,
        });
        // Restore initial state if provided
        if (this.initialState) {
            Object.assign(this.stateManager.state, this.initialState);
        }
    }
    /**
     * Component did load lifecycle
     *
     * **Purpose**: Initialize global dependencies and plugins
     *
     * **Initialization sequence**:
     * 1. Expose virtualRenderer singleton globally
     * 2. Create GridBuilderAPI instance
     * 3. Initialize plugins via plugin.init(api)
     * 4. Apply theme via CSS variables
     * 5. Expose debug helpers
     */
    componentDidLoad() {
        var _a, _b, _c, _d;
        // Create GridBuilderAPI instance
        this.api = this.createAPI();
        // Expose API and service instances based on apiRef configuration
        debug.log("🔧 grid-builder exposing API and service instances", {
            hasApiRef: !!this.apiRef,
            apiRefKey: (_a = this.apiRef) === null || _a === void 0 ? void 0 : _a.key,
            apiCreated: !!this.api,
        });
        if (this.apiRef && this.apiRef.key) {
            debug.log("  📤 Setting API and services on window", {
                key: this.apiRef.key,
            });
            // Expose main API
            window[this.apiRef.key] = this.api;
            // Phase 2: Expose service instances globally (for debugging)
            // Use namespaced keys to support multiple grid-builder instances
            window[`${this.apiRef.key}_virtualRenderer`] = this.virtualRendererInstance;
            debug.log("  ✅ API and services set on window", {
                key: this.apiRef.key,
                apiExists: !!window[this.apiRef.key],
                virtualRendererExists: !!window[`${this.apiRef.key}_virtualRenderer`],
            });
        }
        // Initialize plugins
        if (this.plugins && this.plugins.length > 0) {
            this.initializedPlugins = this.plugins.filter((plugin) => {
                try {
                    plugin.init(this.api);
                    debug.log(`GridBuilder: Initialized plugin "${plugin.name}"`);
                    return true;
                }
                catch (e) {
                    console.error(`GridBuilder: Failed to initialize plugin "${plugin.name}":`, e);
                    return false;
                }
            });
        }
        // Apply theme
        if (this.theme) {
            this.applyTheme(this.theme);
        }
        // Configure event debouncing (Phase 2: use instance)
        const debounceDelay = (_c = (_b = this.config) === null || _b === void 0 ? void 0 : _b.eventDebounceDelay) !== null && _c !== void 0 ? _c : 300;
        (_d = this.eventManagerInstance) === null || _d === void 0 ? void 0 : _d.setDebounceDelay(debounceDelay);
        debug.log(`GridBuilder: Event debounce delay set to ${debounceDelay}ms`);
        // Debug helper
        window.debugInteractables = () => {
            const interactables = interact.interactables.list;
            debug.log("Total interactables:", interactables.length);
            interactables.forEach((interactable, index) => {
                debug.log(`Interactable ${index}:`, {
                    target: interactable.target,
                    actions: interactable._actions,
                    options: interactable.options,
                });
            });
        };
        // Setup canvas drop event handler for palette items
        this.canvasDropHandler = (event) => {
            var _a, _b;
            const customEvent = event;
            const { canvasId, componentType, x, y } = customEvent.detail;
            debug.log("🎯 canvas-drop event received:", {
                canvasId,
                componentType,
                x,
                y,
            });
            // Get component definition to determine default size
            const definition = this.componentRegistry.get(componentType);
            if (!definition) {
                debug.warn(`Component definition not found for type: ${componentType}`);
                return;
            }
            // Convert pixel position to grid units
            const gridX = pixelsToGridX(x, canvasId, this.config);
            const gridY = pixelsToGridY(y, this.config);
            debug.log("  Converting to grid units (before constraints):", {
                gridX,
                gridY,
                defaultWidth: definition.defaultSize.width,
                defaultHeight: definition.defaultSize.height,
            });
            // Apply boundary constraints (validate, adjust size, constrain position)
            const constrained = applyBoundaryConstraints(definition, gridX, gridY);
            if (!constrained) {
                debug.warn(`Cannot place component "${definition.name}" - minimum size exceeds canvas width`);
                return;
            }
            debug.log("  After boundary constraints:", constrained);
            // Use existing addComponent API method with constrained values
            const newItem = (_a = this.api) === null || _a === void 0 ? void 0 : _a.addComponent(canvasId, componentType, {
                x: constrained.x,
                y: constrained.y,
                width: constrained.width,
                height: constrained.height,
            });
            debug.log("  Created item:", newItem);
            // Set the target canvas as active when item is dropped
            (_b = this.api) === null || _b === void 0 ? void 0 : _b.setActiveCanvas(canvasId);
        };
        this.hostElement.addEventListener("canvas-drop", this.canvasDropHandler);
        // Setup canvas move event handler for cross-canvas moves
        this.canvasMoveHandler = (event) => {
            var _a, _b, _c;
            const customEvent = event;
            const { itemId, sourceCanvasId, targetCanvasId, x, y } = customEvent.detail;
            debug.log("🔄 canvas-move event received:", {
                itemId,
                sourceCanvasId,
                targetCanvasId,
                x,
                y,
            });
            // 1. Get item from source canvas
            const sourceCanvas = this.stateManager.state.canvases[sourceCanvasId];
            if (!sourceCanvas) {
                console.error("Source canvas not found:", sourceCanvasId);
                return;
            }
            const itemIndex = sourceCanvas.items.findIndex((i) => i.id === itemId);
            if (itemIndex === -1) {
                console.error("Item not found in source canvas:", itemId);
                return;
            }
            const item = sourceCanvas.items[itemIndex];
            // 2. Capture state BEFORE move (for undo)
            const sourcePosition = {
                x: item.layouts.desktop.x,
                y: item.layouts.desktop.y,
            };
            // 3. Convert drop position (pixels) to grid units for target canvas
            let gridX = pixelsToGridX(x, targetCanvasId, this.config);
            let gridY = pixelsToGridY(y, this.config);
            // 4. Constrain position to target canvas boundaries
            const constrained = constrainPositionToCanvas(gridX, gridY, item.layouts.desktop.width, item.layouts.desktop.height, CANVAS_WIDTH_UNITS);
            gridX = constrained.x;
            gridY = constrained.y;
            const targetPosition = { x: gridX, y: gridY };
            // 5. Capture source z-index before modification
            const sourceZIndex = item.zIndex;
            // 6. Update item position in desktop layout
            item.layouts.desktop.x = gridX;
            item.layouts.desktop.y = gridY;
            // 7. Move item between canvases (updates canvasId, removes from source, adds to target)
            // Remove from source canvas
            sourceCanvas.items = sourceCanvas.items.filter((i) => i.id !== itemId);
            // Update item's canvasId
            item.canvasId = targetCanvasId;
            // Add to target canvas
            const targetCanvas = this.stateManager.state.canvases[targetCanvasId];
            targetCanvas.items.push(item);
            // 8. Assign new z-index in target canvas (prevents z-index conflicts)
            const targetZIndex = targetCanvas.zIndexCounter++;
            item.zIndex = targetZIndex;
            this.stateManager.state.canvases = Object.assign({}, this.stateManager.state.canvases); // Trigger reactivity
            // 9. Set target canvas as active
            (_a = this.api) === null || _a === void 0 ? void 0 : _a.setActiveCanvas(targetCanvasId);
            // 10. Update selection state if item was selected
            if (this.stateManager.state.selectedItemId === itemId) {
                this.stateManager.state.selectedCanvasId = targetCanvasId;
            }
            // 11. Create undo/redo command with z-index tracking
            const command = new MoveItemCommand(itemId, sourceCanvasId, targetCanvasId, sourcePosition, targetPosition, itemIndex, sourceZIndex, targetZIndex);
            (_b = this.undoRedoManager) === null || _b === void 0 ? void 0 : _b.push(command);
            // 11. Emit events for plugins
            (_c = this.eventManagerInstance) === null || _c === void 0 ? void 0 : _c.emit("componentMoved", {
                item,
                sourceCanvasId,
                targetCanvasId,
                position: targetPosition,
            });
            debug.log("✅ Cross-canvas move completed:", {
                itemId,
                from: sourceCanvasId,
                to: targetCanvasId,
                position: targetPosition,
            });
        };
        this.hostElement.addEventListener("canvas-move", this.canvasMoveHandler);
        // Setup canvas activated event handler
        this.canvasActivatedHandler = (event) => {
            var _a;
            const customEvent = event;
            const { canvasId } = customEvent.detail;
            debug.log("🎨 canvas-activated event received:", { canvasId });
            // Emit plugin event
            (_a = this.eventManagerInstance) === null || _a === void 0 ? void 0 : _a.emit("canvasActivated", { canvasId });
        };
        this.hostElement.addEventListener("canvas-activated", this.canvasActivatedHandler);
        // Setup keyboard shortcuts
        this.keyboardHandler = (event) => {
            var _a, _b, _c, _d, _e;
            // Get modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
            const isUndo = (event.metaKey || event.ctrlKey) &&
                event.key === "z" &&
                !event.shiftKey;
            const isRedo = (event.metaKey || event.ctrlKey) &&
                ((event.key === "z" && event.shiftKey) || // Ctrl/Cmd+Shift+Z
                    event.key === "y"); // Ctrl/Cmd+Y
            // Handle undo/redo
            if (isUndo) {
                debug.log("⌨️ Keyboard: Undo triggered");
                event.preventDefault();
                (_a = this.api) === null || _a === void 0 ? void 0 : _a.undo();
                return;
            }
            if (isRedo) {
                debug.log("⌨️ Keyboard: Redo triggered");
                event.preventDefault();
                (_b = this.api) === null || _b === void 0 ? void 0 : _b.redo();
                return;
            }
            // Handle Delete key (delete selected component)
            if (event.key === "Delete" || event.key === "Backspace") {
                if (this.stateManager.state.selectedItemId && this.stateManager.state.selectedCanvasId) {
                    debug.log("⌨️ Keyboard: Delete triggered", {
                        itemId: this.stateManager.state.selectedItemId,
                    });
                    event.preventDefault();
                    // Capture the item ID and canvas ID before deletion
                    const deletedItemId = this.stateManager.state.selectedItemId;
                    const deletedCanvasId = this.stateManager.state.selectedCanvasId;
                    // Delete the selected item (async - respects onBeforeDelete hook)
                    (_c = this.api) === null || _c === void 0 ? void 0 : _c.deleteComponent(this.stateManager.state.selectedItemId).then((deleted) => {
                        if (deleted) {
                            // Announce deletion only if actually deleted (not cancelled by modal)
                            this.announce("Component deleted");
                            // Move focus to next logical item for keyboard users
                            this.moveFocusAfterDeletion(deletedCanvasId, deletedItemId);
                        }
                    });
                    return;
                }
            }
            // Handle Escape key (deselect component)
            if (event.key === "Escape") {
                if (this.stateManager.state.selectedItemId || this.stateManager.state.selectedCanvasId) {
                    debug.log("⌨️ Keyboard: Escape triggered (deselecting)");
                    event.preventDefault();
                    // Clear selection
                    this.stateManager.state.selectedItemId = null;
                    this.stateManager.state.selectedCanvasId = null;
                    // Announce deselection
                    this.announce("Selection cleared");
                    return;
                }
            }
            // Handle arrow key nudging (only if component is selected)
            if (!this.stateManager.state.selectedItemId || !this.stateManager.state.selectedCanvasId) {
                return;
            }
            const isArrowKey = [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
            ].includes(event.key);
            if (!isArrowKey) {
                return;
            }
            event.preventDefault();
            // Get selected item
            const canvas = this.stateManager.state.canvases[this.stateManager.state.selectedCanvasId];
            if (!canvas) {
                return;
            }
            const item = canvas.items.find((i) => i.id === this.stateManager.state.selectedItemId);
            if (!item) {
                return;
            }
            // Get current viewport layout
            const viewport = this.stateManager.state.currentViewport;
            const layout = item.layouts[viewport];
            // Calculate nudge amount (1 grid unit in each direction)
            const nudgeAmount = 1;
            let deltaX = 0;
            let deltaY = 0;
            switch (event.key) {
                case "ArrowUp":
                    deltaY = -nudgeAmount;
                    break;
                case "ArrowDown":
                    deltaY = nudgeAmount;
                    break;
                case "ArrowLeft":
                    deltaX = -nudgeAmount;
                    break;
                case "ArrowRight":
                    deltaX = nudgeAmount;
                    break;
            }
            debug.log("⌨️ Keyboard: Nudging component", {
                key: event.key,
                deltaX,
                deltaY,
                itemId: item.id,
            });
            // Capture old position for undo
            const oldX = layout.x;
            const oldY = layout.y;
            // Update position with boundary checks
            const newX = Math.max(0, layout.x + deltaX);
            const newY = Math.max(0, layout.y + deltaY);
            // Check right boundary (100 grid units = 100%)
            const maxX = 100 - layout.width;
            const constrainedX = Math.min(newX, maxX);
            const constrainedY = newY; // No vertical limit
            // Only update if position actually changed
            if (oldX === constrainedX && oldY === constrainedY) {
                return; // No change, don't create undo command
            }
            // Update item layout (mutate in place to preserve all properties like 'customized')
            layout.x = constrainedX;
            layout.y = constrainedY;
            // Create undo command for nudge (same canvas = z-index unchanged)
            const nudgeCommand = new MoveItemCommand(item.id, this.stateManager.state.selectedCanvasId, this.stateManager.state.selectedCanvasId, { x: oldX, y: oldY }, { x: constrainedX, y: constrainedY }, canvas.items.findIndex((i) => i.id === item.id), item.zIndex, // sourceZIndex
            item.zIndex);
            (_d = this.undoRedoManager) === null || _d === void 0 ? void 0 : _d.push(nudgeCommand);
            // Trigger state update
            this.stateManager.state.canvases = Object.assign({}, this.stateManager.state.canvases);
            // Emit event
            (_e = this.eventManagerInstance) === null || _e === void 0 ? void 0 : _e.emit("componentDragged", {
                itemId: item.id,
                canvasId: this.stateManager.state.selectedCanvasId,
                position: { x: constrainedX, y: constrainedY },
            });
        };
        document.addEventListener("keydown", this.keyboardHandler);
        // Setup container-based viewport switching
        this.setupViewportResizeObserver();
        // Setup screen reader announcements (ARIA live region)
        this.setupScreenReaderAnnouncements();
    }
    /**
     * Disconnected callback (cleanup)
     *
     * **Purpose**: Clean up resources when component unmounts
     *
     * **Cleanup sequence**:
     * 1. Remove event listeners
     * 2. Destroy all plugins
     * 3. Clear global references
     */
    disconnectedCallback() {
        // Remove event listeners
        if (this.canvasDropHandler) {
            this.hostElement.removeEventListener("canvas-drop", this.canvasDropHandler);
        }
        if (this.canvasMoveHandler) {
            this.hostElement.removeEventListener("canvas-move", this.canvasMoveHandler);
        }
        if (this.canvasActivatedHandler) {
            this.hostElement.removeEventListener("canvas-activated", this.canvasActivatedHandler);
        }
        if (this.keyboardHandler) {
            document.removeEventListener("keydown", this.keyboardHandler);
        }
        // Cleanup ResizeObserver
        if (this.viewportResizeObserver) {
            this.viewportResizeObserver.disconnect();
        }
        // Destroy plugins
        if (this.initializedPlugins.length > 0) {
            this.initializedPlugins.forEach((plugin) => {
                try {
                    plugin.destroy();
                    debug.log(`GridBuilder: Destroyed plugin "${plugin.name}"`);
                }
                catch (e) {
                    console.error(`GridBuilder: Failed to destroy plugin "${plugin.name}":`, e);
                }
            });
            this.initializedPlugins = [];
        }
        // Phase 2: Cleanup service instances
        if (this.undoRedoManager) {
            this.undoRedoManager.dispose();
            debug.log("GridBuilder: Disposed undoRedoManager");
        }
        if (this.virtualRendererInstance) {
            this.virtualRendererInstance.destroy();
            debug.log("GridBuilder: Destroyed virtualRendererInstance");
        }
        if (this.eventManagerInstance) {
            this.eventManagerInstance.removeAllListeners();
            debug.log("GridBuilder: Cleared eventManagerInstance listeners");
        }
        if (this.domCacheInstance) {
            this.domCacheInstance.clear();
            debug.log("GridBuilder: Cleared domCacheInstance");
        }
        // StateManager will be garbage collected (no explicit cleanup needed)
        // Clear grid size cache for this instance only (instance-aware cleanup)
        if (this.instanceId) {
            clearGridSizeCache(this.instanceId);
            debug.log("GridBuilder: Cleared grid size cache for instance", {
                instanceId: this.instanceId,
            });
        }
        // Clear global references
        if (this.apiRef && this.apiRef.key) {
            // Clear API
            delete window[this.apiRef.key];
            // Clear namespaced service instances
            delete window[`${this.apiRef.key}_virtualRenderer`];
        }
    }
    /**
     * Watch components prop for changes
     *
     * **Purpose**: Rebuild component registry when components prop changes
     */
    handleComponentsChange(newComponents) {
        this.componentRegistry = new Map(newComponents.map((comp) => [comp.type, comp]));
    }
    /**
     * Watch theme prop changes and reapply theme
     *
     * **When triggered**: Theme prop changes (e.g., from Storybook controls)
     * **Purpose**: Reapply CSS custom properties when theme colors change
     */
    handleThemeChange(newTheme) {
        if (newTheme) {
            this.applyTheme(newTheme);
        }
    }
    /**
     * Create GridBuilderAPI instance
     *
     * **Purpose**: Provide API to plugins and external code
     * **Returns**: GridBuilderAPI implementation
     *
     * **Implementation**: Full API with event system integration
     */
    createAPI() {
        return {
            // ======================
            // Event Subscriptions
            // ======================
            on: (eventName, callback) => {
                var _a;
                (_a = this.eventManagerInstance) === null || _a === void 0 ? void 0 : _a.on(eventName, callback);
            },
            off: (eventName, callback) => {
                var _a;
                (_a = this.eventManagerInstance) === null || _a === void 0 ? void 0 : _a.off(eventName, callback);
            },
            // ======================
            // State Access (Read)
            // ======================
            getState: () => this.stateManager.state,
            getItems: (canvasId) => {
                var _a;
                return ((_a = this.stateManager.state.canvases[canvasId]) === null || _a === void 0 ? void 0 : _a.items) || [];
            },
            getItem: (itemId) => {
                // Search across all canvases
                for (const canvasId in this.stateManager.state.canvases) {
                    const canvas = this.stateManager.state.canvases[canvasId];
                    const item = canvas.items.find((i) => i.id === itemId);
                    if (item) {
                        return item;
                    }
                }
                return null;
            },
            // ======================
            // Programmatic Operations
            // ======================
            addComponent: (canvasId, componentType, position, config) => {
                var _a, _b;
                const canvas = this.stateManager.state.canvases[canvasId];
                if (!canvas) {
                    console.error(`Canvas not found: ${canvasId}`);
                    return null;
                }
                // Look up component definition to get proper name
                const definition = this.componentRegistry.get(componentType);
                const componentName = (definition === null || definition === void 0 ? void 0 : definition.name) || componentType;
                // Create new item
                const newItem = {
                    id: generateItemId(),
                    canvasId,
                    name: componentName,
                    type: componentType,
                    zIndex: ++canvas.zIndexCounter,
                    layouts: {
                        desktop: Object.assign({}, position),
                        mobile: {
                            x: 0,
                            y: 0,
                            width: 50,
                            height: position.height,
                            customized: false,
                        },
                    },
                    config: config || {},
                };
                // Add to canvas (immutable update)
                const newItems = [...canvas.items, newItem];
                const newCanvas = Object.assign(Object.assign({}, canvas), { items: newItems });
                const newCanvases = Object.assign(Object.assign({}, this.stateManager.state.canvases), { [canvasId]: newCanvas });
                this.stateManager.state.canvases = newCanvases;
                // Add to undo/redo history
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(new BatchAddCommand([newItem.id]));
                // Emit event
                (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("componentAdded", { item: newItem, canvasId });
                return newItem.id;
            },
            deleteComponent: async (itemId) => {
                var _a, _b;
                // Find item and canvas across all canvases
                let targetCanvasId = null;
                let targetItem = null;
                for (const canvasId in this.stateManager.state.canvases) {
                    const canvas = this.stateManager.state.canvases[canvasId];
                    const item = canvas.items.find((i) => i.id === itemId);
                    if (item) {
                        targetCanvasId = canvasId;
                        targetItem = item;
                        break;
                    }
                }
                if (!targetCanvasId || !targetItem) {
                    return false;
                }
                // Call onBeforeDelete hook if provided (for deletion confirmation)
                if (this.onBeforeDelete) {
                    try {
                        const shouldDelete = await this.onBeforeDelete({
                            item: targetItem,
                            canvasId: targetCanvasId,
                            itemId,
                        });
                        if (!shouldDelete) {
                            // Deletion cancelled by hook
                            return false;
                        }
                    }
                    catch (error) {
                        console.error("Error in onBeforeDelete hook:", error);
                        return false;
                    }
                }
                // Proceed with deletion
                const canvas = this.stateManager.state.canvases[targetCanvasId];
                const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
                if (itemIndex !== -1) {
                    // Add to undo/redo history BEFORE deletion (need state for undo)
                    (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(new BatchDeleteCommand([itemId]));
                    // Delete item
                    canvas.items.splice(itemIndex, 1);
                    this.stateManager.state.canvases = Object.assign({}, this.stateManager.state.canvases);
                    // Deselect if deleted item was selected
                    if (this.stateManager.state.selectedItemId === itemId) {
                        this.stateManager.state.selectedItemId = null;
                        this.stateManager.state.selectedCanvasId = null;
                    }
                    // Emit event
                    (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("componentDeleted", {
                        itemId,
                        canvasId: targetCanvasId,
                    });
                    return true;
                }
                return false;
            },
            updateConfig: (itemId, config) => {
                var _a, _b;
                // Find and update item across all canvases
                for (const canvasId in this.stateManager.state.canvases) {
                    const canvas = this.stateManager.state.canvases[canvasId];
                    const itemIndex = canvas.items.findIndex((i) => i.id === itemId);
                    if (itemIndex !== -1) {
                        const item = canvas.items[itemIndex];
                        const newConfig = Object.assign(Object.assign({}, item.config), config);
                        // Create undo command BEFORE making changes
                        const batchUpdate = [
                            {
                                itemId,
                                canvasId,
                                updates: { config: newConfig },
                            },
                        ];
                        (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(new BatchUpdateConfigCommand(batchUpdate));
                        // Merge config
                        canvas.items[itemIndex] = Object.assign(Object.assign({}, canvas.items[itemIndex]), { config: newConfig });
                        this.stateManager.state.canvases = Object.assign({}, this.stateManager.state.canvases);
                        // Emit event
                        (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("configChanged", { itemId, canvasId, config });
                        return true;
                    }
                }
                return false;
            },
            // ======================
            // Batch Operations
            // ======================
            addComponentsBatch: (components) => {
                var _a, _b;
                // Convert API format to state-manager format
                const partialItems = components.map(({ canvasId, type, position, config }) => {
                    // Look up component definition to get proper name
                    const definition = this.componentRegistry.get(type);
                    const componentName = (definition === null || definition === void 0 ? void 0 : definition.name) || type;
                    return {
                        canvasId,
                        type,
                        name: componentName,
                        layouts: {
                            desktop: Object.assign({}, position),
                            mobile: {
                                x: 0,
                                y: 0,
                                width: 50,
                                height: position.height,
                                customized: false,
                            },
                        },
                        config: config || {},
                    };
                });
                // Use state-manager batch operation (single state update)
                const itemIds = addItemsBatch(partialItems);
                // Add to undo/redo history
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(new BatchAddCommand(itemIds));
                // Emit batch event
                const createdItems = itemIds
                    .map((id) => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(id);
                    return item ? { item, canvasId: item.canvasId } : null;
                })
                    .filter(Boolean);
                (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("componentsBatchAdded", { items: createdItems });
                return itemIds;
            },
            deleteComponentsBatch: (itemIds) => {
                var _a, _b;
                // Store deleted items for event
                const deletedItems = itemIds
                    .map((itemId) => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(itemId);
                    return item ? { itemId, canvasId: item.canvasId } : null;
                })
                    .filter(Boolean);
                // Add to undo/redo history BEFORE deletion (need state for undo)
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(new BatchDeleteCommand(itemIds));
                // Use state-manager batch operation (single state update)
                deleteItemsBatch(itemIds);
                // Clear selection if any deleted item was selected
                if (this.stateManager.state.selectedItemId &&
                    itemIds.includes(this.stateManager.state.selectedItemId)) {
                    this.stateManager.state.selectedItemId = null;
                    this.stateManager.state.selectedCanvasId = null;
                }
                // Emit batch event
                (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("componentsBatchDeleted", { items: deletedItems });
            },
            updateConfigsBatch: (updates) => {
                var _a, _b;
                // Convert to state-manager format (need canvasId)
                const batchUpdates = updates
                    .map(({ itemId, config }) => {
                    var _a;
                    const item = (_a = this.api) === null || _a === void 0 ? void 0 : _a.getItem(itemId);
                    if (!item) {
                        debug.warn(`Item ${itemId} not found for config update`);
                        return null;
                    }
                    return {
                        itemId,
                        canvasId: item.canvasId,
                        updates: { config: Object.assign(Object.assign({}, item.config), config) },
                    };
                })
                    .filter(Boolean);
                // Add to undo/redo history
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(new BatchUpdateConfigCommand(batchUpdates));
                // Use state-manager batch operation (single state update)
                updateItemsBatch(batchUpdates);
                // Emit batch event
                const updatedItems = batchUpdates.map(({ itemId, canvasId, updates }) => ({
                    itemId,
                    canvasId,
                    config: updates.config,
                }));
                (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("configsBatchChanged", { items: updatedItems });
            },
            // ======================
            // Canvas Access
            // ======================
            getCanvasElement: (canvasId) => {
                return document.getElementById(canvasId);
            },
            // ======================
            // Undo/Redo Operations
            // ======================
            undo: () => {
                var _a, _b;
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.undo();
                // Emit event after undo
                (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("undoExecuted", {});
            },
            redo: () => {
                var _a, _b;
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.redo();
                // Emit event after redo
                (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("redoExecuted", {});
            },
            canUndo: () => {
                var _a;
                return (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.canUndo();
            },
            canRedo: () => {
                var _a;
                return (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.canRedo();
            },
            undoRedoState,
            // ======================
            // Canvas Management
            // ======================
            addCanvas: (canvasId) => {
                var _a, _b;
                // Create command with instance state and event manager
                const command = new AddCanvasCommand(canvasId, this.stateManager.state, this.eventManagerInstance);
                // Add to undo/redo stack
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(command);
                // Execute the command
                command.redo();
                // Set newly added canvas as active
                this.stateManager.state.activeCanvasId = canvasId;
                (_b = this.eventManagerInstance) === null || _b === void 0 ? void 0 : _b.emit("canvasActivated", { canvasId });
                // Scroll to the new canvas after DOM has updated
                requestAnimationFrame(() => {
                    var _a;
                    const canvasElement = (_a = this.domCacheInstance) === null || _a === void 0 ? void 0 : _a.getCanvas(canvasId);
                    if (canvasElement) {
                        canvasElement.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                        });
                    }
                });
            },
            removeCanvas: (canvasId) => {
                var _a;
                // Create command with instance state and event manager
                const command = new RemoveCanvasCommand(canvasId, this.stateManager.state, this.eventManagerInstance);
                // Add to undo/redo stack
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(command);
                // Execute the command
                command.redo();
            },
            setActiveCanvas: (canvasId) => {
                var _a;
                this.stateManager.state.activeCanvasId = canvasId;
                (_a = this.eventManagerInstance) === null || _a === void 0 ? void 0 : _a.emit("canvasActivated", { canvasId });
            },
            getActiveCanvas: () => {
                return this.stateManager.state.activeCanvasId;
            },
            // ======================
            // Custom Command Support
            // ======================
            pushCommand: (command) => {
                var _a;
                (_a = this.undoRedoManager) === null || _a === void 0 ? void 0 : _a.push(command);
            },
        };
    }
    /**
     * Apply theme via CSS variables
     *
     * **Purpose**: Apply theme customization to host element
     * **Implementation**: Set CSS custom properties on :host
     */
    applyTheme(theme) {
        const host = this.el;
        if (!host)
            return;
        // Apply predefined theme properties
        if (theme.primaryColor) {
            host.style.setProperty("--grid-builder-primary-color", theme.primaryColor);
        }
        if (theme.paletteBackground) {
            host.style.setProperty("--grid-builder-palette-bg", theme.paletteBackground);
        }
        if (theme.canvasBackground) {
            host.style.setProperty("--grid-builder-canvas-bg", theme.canvasBackground);
        }
        if (theme.gridLineColor) {
            host.style.setProperty("--grid-builder-grid-line-color", theme.gridLineColor);
        }
        if (theme.selectionColor) {
            host.style.setProperty("--grid-builder-selection-color", theme.selectionColor);
        }
        if (theme.resizeHandleColor) {
            host.style.setProperty("--grid-builder-resize-handle-color", theme.resizeHandleColor);
        }
        if (theme.fontFamily) {
            host.style.setProperty("--grid-builder-font-family", theme.fontFamily);
        }
        // Apply custom properties
        if (theme.customProperties) {
            Object.entries(theme.customProperties).forEach(([key, value]) => {
                host.style.setProperty(key, value);
            });
        }
    }
    /**
     * Export current state to JSON-serializable format
     *
     * **Purpose**: Export grid layout for saving or transferring to viewer app
     *
     * **Use Cases**:
     * - Save layout to database/localStorage
     * - Transfer layout to viewer app via API
     * - Create layout templates/presets
     * - Backup/restore functionality
     *
     * **Example - Save to API**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const exportData = await builder.exportState();
     * await fetch('/api/layouts', {
     * method: 'POST',
     * headers: { 'Content-Type': 'application/json' },
     * body: JSON.stringify(exportData)
     * });
     * ```
     *
     * **Example - Save to localStorage**:
     * ```typescript
     * const exportData = await builder.exportState();
     * localStorage.setItem('grid-layout', JSON.stringify(exportData));
     * ```
     * @returns Promise<GridExport> - JSON-serializable export object
     */
    async exportState() {
        // Build export data from current gridState
        const exportData = {
            version: "1.0.0",
            canvases: {},
            viewport: this.stateManager.state.currentViewport,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
        // Export each canvas with its items
        for (const canvasId in this.stateManager.state.canvases) {
            const canvas = this.stateManager.state.canvases[canvasId];
            exportData.canvases[canvasId] = {
                items: canvas.items.map((item) => ({
                    id: item.id,
                    canvasId: item.canvasId,
                    type: item.type,
                    name: item.name,
                    layouts: {
                        desktop: Object.assign({}, item.layouts.desktop),
                        mobile: Object.assign({}, item.layouts.mobile),
                    },
                    zIndex: item.zIndex,
                    config: Object.assign({}, item.config), // Deep copy to avoid mutations
                })),
            };
        }
        return exportData;
    }
    /**
     * Import state from JSON-serializable format
     *
     * **Purpose**: Restore previously exported grid state
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const savedState = JSON.parse(localStorage.getItem('grid-layout'));
     * await builder.importState(savedState);
     * ```
     * @param state - GridExport or partial GridState object
     */
    async importState(state) {
        // Import grid state
        Object.assign(this.stateManager.state, state);
    }
    /**
     * Get current grid state
     *
     * **Purpose**: Direct access to grid state for reading
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const state = await builder.getState();
     * console.log('Current viewport:', state.currentViewport);
     * ```
     * @returns Promise<GridState> - Current grid state
     */
    async getState() {
        return this.stateManager.state;
    }
    /**
     * Add a new canvas programmatically
     *
     * **Purpose**: Create new section/canvas in the grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.addCanvas('new-section');
     * ```
     * @param canvasId - Unique canvas identifier
     */
    async addCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.addCanvas(canvasId);
    }
    /**
     * Remove a canvas programmatically
     *
     * **Purpose**: Delete section/canvas from the grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.removeCanvas('old-section');
     * ```
     * @param canvasId - Canvas identifier to remove
     */
    async removeCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.removeCanvas(canvasId);
    }
    /**
     * Set active canvas programmatically
     *
     * **Purpose**: Activate a specific canvas for focused editing
     *
     * **Use cases**:
     * - Focus specific section after adding items
     * - Programmatic navigation between sections
     * - Show canvas-specific settings panel
     *
     * **Events triggered**: 'canvasActivated'
     * @param canvasId - Canvas to activate
     * @example
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.setActiveCanvas('canvas2');
     * ```
     */
    async setActiveCanvas(canvasId) {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.setActiveCanvas(canvasId);
    }
    /**
     * Get currently active canvas ID
     *
     * **Purpose**: Check which canvas is currently active/focused
     * @returns Promise<string | null> - Active canvas ID or null if none active
     * @example
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const activeId = await builder.getActiveCanvas();
     * if (activeId === 'canvas1') {
     *   console.log('Canvas 1 is active');
     * }
     * ```
     */
    async getActiveCanvas() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.getActiveCanvas()) || null;
    }
    /**
     * Undo last action
     *
     * **Purpose**: Revert last user action (move, resize, add, delete, etc.)
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.undo();
     * ```
     */
    async undo() {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.undo();
    }
    /**
     * Redo last undone action
     *
     * **Purpose**: Re-apply last undone action
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * await builder.redo();
     * ```
     */
    async redo() {
        var _a;
        (_a = this.api) === null || _a === void 0 ? void 0 : _a.redo();
    }
    /**
     * Check if undo is available
     *
     * **Purpose**: Determine if there are actions to undo
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const canUndo = await builder.canUndo();
     * undoButton.disabled = !canUndo;
     * ```
     * @returns Promise<boolean> - True if undo is available
     */
    async canUndo() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.canUndo()) || false;
    }
    /**
     * Check if redo is available
     *
     * **Purpose**: Determine if there are actions to redo
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const canRedo = await builder.canRedo();
     * redoButton.disabled = !canRedo;
     * ```
     * @returns Promise<boolean> - True if redo is available
     */
    async canRedo() {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.canRedo()) || false;
    }
    /**
     * Add a component programmatically
     *
     * **Purpose**: Add new component to canvas without dragging from palette
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const itemId = await builder.addComponent('canvas1', 'header', {
     * x: 10, y: 10, width: 30, height: 6
     * }, { title: 'My Header' });
     * ```
     * @param canvasId - Canvas to add component to
     * @param componentType - Component type from registry
     * @param position - Grid position and size
     * @param config - Optional component configuration
     * @returns Promise<string | null> - New item ID or null if failed
     */
    async addComponent(canvasId, componentType, position, config) {
        var _a;
        return (((_a = this.api) === null || _a === void 0 ? void 0 : _a.addComponent(canvasId, componentType, position, config)) || null);
    }
    /**
     * Delete a component programmatically
     *
     * **Purpose**: Remove component from grid
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const success = await builder.deleteComponent('item-123');
     * ```
     * @param itemId - Item ID to delete
     * @returns Promise<boolean> - True if deleted successfully
     */
    async deleteComponent(itemId) {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.deleteComponent(itemId)) || false;
    }
    /**
     * Update component configuration
     *
     * **Purpose**: Update component properties/config
     *
     * **Example**:
     * ```typescript
     * const builder = document.querySelector('grid-builder');
     * const success = await builder.updateConfig('item-123', {
     * title: 'Updated Title',
     * color: '#ff0000'
     * });
     * ```
     * @param itemId - Item ID to update
     * @param config - Configuration updates
     * @returns Promise<boolean> - True if updated successfully
     */
    async updateConfig(itemId, config) {
        var _a;
        return ((_a = this.api) === null || _a === void 0 ? void 0 : _a.updateConfig(itemId, config)) || false;
    }
    /**
     * Render component template
     *
     * **Purpose**: Render main UI structure
     *
     * **Structure**:
     * - Host element with theme classes
     * - Component palette (sidebar or custom)
     * - Canvas area with sections
     *
     * **Note**: Actual rendering delegates to child components:
     * - <component-palette> or custom ComponentPalette
     * - <canvas-section> for each canvas
     *
     * **Config Panel**: Users should implement their own config panels
     * - See custom-config-panel in demo for reference implementation
     * - Listen to 'item-click' events to show your config UI
     */
    render() {
        const canvasIds = Object.keys(this.stateManager.state.canvases);
        // Merge instanceId into config for child components (avoids mutating prop)
        const configWithInstance = this.config
            ? Object.assign(Object.assign({}, this.config), { instanceId: this.instanceId }) : { instanceId: this.instanceId };
        return (h(Host, { key: '4e61ef6bd49bbc96f2c4b906125347defa0af844', ref: (el) => (this.el = el) }, h("div", { key: 'ed5aa5eb93db1cb91dfc976aab3ea3e606405a1a', class: "sr-only", role: "status", "aria-live": "polite", "aria-atomic": "true" }, this.announcement), h("div", { key: 'a66639c01c7a009f2283e17c63cc9ffe7f8490e2', class: "grid-builder-container", role: "application", "aria-label": "Grid builder" }, h("div", { key: '45930bd451c9cfca8e274198ddbb35369bee43a3', class: "canvas-area" }, h("div", { key: 'a2ad5d7ff80ef99443d2ed9d73cf001c533ec2ad', class: "canvases-container" }, canvasIds.map((canvasId) => {
            var _a, _b, _c;
            const isActive = this.stateManager.state.activeCanvasId === canvasId;
            const metadata = ((_a = this.canvasMetadata) === null || _a === void 0 ? void 0 : _a[canvasId]) || {};
            // Render custom canvas header if provided
            const headerElement = (_c = (_b = this.uiOverrides) === null || _b === void 0 ? void 0 : _b.CanvasHeader) === null || _c === void 0 ? void 0 : _c.call(_b, {
                canvasId,
                metadata,
                isActive,
            });
            // Handle both vNode and HTMLElement returns
            const headerContent = headerElement instanceof HTMLElement ? (h("div", { ref: (el) => {
                    if (el) {
                        // Clear existing children to allow updates when active state changes
                        el.innerHTML = "";
                        el.appendChild(headerElement);
                    }
                } })) : (headerElement);
            return (h("div", { key: canvasId, class: "canvas-wrapper" }, headerContent, h("canvas-section", { canvasId: canvasId, isActive: isActive, config: configWithInstance, componentRegistry: this.componentRegistry, backgroundColor: metadata.backgroundColor, canvasTitle: metadata.title, onBeforeDelete: this.onBeforeDelete, virtualRendererInstance: this.virtualRendererInstance, eventManagerInstance: this.eventManagerInstance, undoRedoManagerInstance: this.undoRedoManager, stateInstance: this.stateManager.state, onStateChange: (key, callback) => this.stateManager.onChange(key, callback), domCacheInstance: this.domCacheInstance, theme: this.theme })));
        }))))));
    }
    get hostElement() { return getElement(this); }
    static get watchers() { return {
        "components": ["handleComponentsChange"],
        "theme": ["handleThemeChange"]
    }; }
};
GridBuilder.style = gridBuilderCss;

export { GridBuilder as grid_builder };
//# sourceMappingURL=grid-builder.entry.esm.js.map
