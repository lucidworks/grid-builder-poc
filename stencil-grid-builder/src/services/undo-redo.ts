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

import { createStore } from "@stencil/store";
import { createDebugLogger } from "../utils/debug";

const debug = createDebugLogger("undo-redo");

/**
 * Command Interface
 * =================
 *
 * Core abstraction for undoable operations. All commands must implement
 * both undo() and redo() methods to reverse and reapply their effects.
 *
 * **Design principle**: Commands are **self-contained** - they store all
 * data needed to both undo and redo without external dependencies.
 *
 * **Typical implementation**:
 * ```typescript
 * class MyCommand implements Command {
 * private beforeState: any;
 * private afterState: any;
 *
 * constructor(initialState) {
 * this.beforeState = JSON.parse(JSON.stringify(initialState));
 * // ... perform operation ...
 * this.afterState = JSON.parse(JSON.stringify(finalState));
 * }
 *
 * undo() { restoreState(this.beforeState); }
 * redo() { restoreState(this.afterState); }
 * }
 * ```
 *
 * **Why separate undo/redo methods**:
 * - ❌ Not: Single execute(reverse: boolean) method
 * - ✅ Yes: Separate undo() and redo() methods
 * - Reason: Clearer intent, easier to implement, matches user mental model
 *
 * **Concrete implementations**:
 * - AddItemCommand: Add/remove grid item
 * - DeleteItemCommand: Remove/restore grid item with index preservation
 * - MoveItemCommand: Update item position (cross-canvas support)
 * - ResizeCommand: Update item dimensions
 * @example
 * ```typescript
 * class DeleteItemCommand implements Command {
 *   constructor(
 *     private canvasId: string,
 *     private item: GridItem,
 *     private itemIndex: number
 *   ) {}
 *
 *   undo() {
 *     // Restore item at original index
 *     const canvas = gridState.canvases[this.canvasId];
 *     canvas.items.splice(this.itemIndex, 0, this.item);
 *     gridState.canvases = { ...gridState.canvases };
 *   }
 *
 *   redo() {
 *     // Remove item again
 *     removeItemFromCanvas(this.canvasId, this.item.id);
 *   }
 * }
 * ```
 */
export interface Command {
  /**
   * Reverse the effect of this command
   *
   * **Idempotent**: Calling undo() multiple times has same effect as once
   * **Side effects**: May update global state, trigger re-renders
   * **Error handling**: Should not throw (use try/catch internally)
   */
  undo(): void;

  /**
   * Reapply the effect of this command
   *
   * **Idempotent**: Calling redo() multiple times has same effect as once
   * **Side effects**: May update global state, trigger re-renders
   * **Error handling**: Should not throw (use try/catch internally)
   */
  redo(): void;
}

/**
 * Undo/Redo State
 * ================
 *
 * Reactive state for UI button enable/disable logic.
 * Components subscribe to this state to update undo/redo button states.
 *
 * **Why reactive**:
 * - Automatic button state updates (no manual DOM manipulation)
 * - Components re-render when canUndo/canRedo changes
 * - Declarative UI logic
 *
 * **Usage in components**:
 * ```tsx
 * import { undoRedoState } from './undo-redo';
 *
 * render() {
 *   return (
 *     <div>
 *       <button
 *         disabled={!undoRedoState.canUndo}
 *         onClick={() => undo()}>
 *         Undo
 *       </button>
 *       <button
 *         disabled={!undoRedoState.canRedo}
 *         onClick={() => redo()}>
 *         Redo
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export interface UndoRedoState {
  /** Whether undo operation is available (historyPosition >= 0) */
  canUndo: boolean;

  /** Whether redo operation is available (historyPosition < commandHistory.length - 1) */
  canRedo: boolean;
}

/**
 * Reactive state store for undo/redo button states
 *
 * **StencilJS integration**: Components automatically subscribe when accessing properties
 * **Updates**: Modified by updateButtonStates() after each operation
 */
const { state: undoRedoState } = createStore<UndoRedoState>({
  canUndo: false,
  canRedo: false,
});

export { undoRedoState };

/**
 * Undo/Redo Service API
 * =====================
 *
 * Provides a clear, namespaced API for undo/redo operations.
 * Use this instead of individual function imports for better clarity.
 * @example
 * ```typescript
 * import { undoRedo } from './services/undo-redo';
 *
 * // Add command to history
 * undoRedo.push(new AddItemCommand(canvasId, item));
 *
 * // Undo/redo
 * undoRedo.undo();
 * undoRedo.redo();
 *
 * // Check availability
 * if (undoRedo.canUndo()) {
 *   undoRedo.undo();
 * }
 * ```
 */
export const undoRedo = {
  /** Add command to undo/redo history */
  push: pushCommand,

  /** Undo last command */
  undo,

  /** Redo previously undone command */
  redo,

  /** Check if undo is available */
  canUndo,

  /** Check if redo is available */
  canRedo,

  /** Clear entire history */
  clearHistory,
};

/**
 * Internal Command History State
 * ===============================
 *
 * Private state managing command stack and position.
 * Not exported - accessed only through public functions.
 */

/**
 * Command history stack
 *
 * **Structure**: Array of Command objects in chronological order
 * **Growth**: Appends new commands to end
 * **Bounded**: Limited to MAX_HISTORY commands (50)
 * **Branching**: Discards commands after current position on new push
 * @example
 * ```
 * [AddItemCommand, DeleteItemCommand, MoveItemCommand]
 *  ↑                ↑                  ↑
 *  0                1                  2 (historyPosition)
 * ```
 */
const commandHistory: Command[] = [];

/**
 * Current position in command history
 *
 * **Range**: -1 (empty history) to commandHistory.length - 1
 * **Meaning**:
 * - -1: No commands or all undone
 * - 0: First command is current state
 * - N: Command at index N is current state
 *
 * **Operations**:
 * - Push command: position++
 * - Undo: position--
 * - Redo: position++
 *
 * **Invariant**: position < commandHistory.length
 */
let historyPosition: number = -1;

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
 * Update reactive state for undo/redo button enablement
 *
 * **Called after**:
 * - pushCommand() - New command added
 * - undo() - Position moved backward
 * - redo() - Position moved forward
 * - clearHistory() - History reset
 *
 * **Updates**:
 * - `canUndo`: true if historyPosition >= 0 (commands available to undo)
 * - `canRedo`: true if historyPosition < commandHistory.length - 1 (commands available to redo)
 *
 * **Triggers**:
 * - Component re-renders (via StencilJS Store reactivity)
 * - Button enable/disable state changes
 *
 * **Why not inline**:
 * - DRY principle (called from 4 places)
 * - Single responsibility (updating button states)
 * - Easier to extend (e.g., add logging, analytics)
 */
function updateButtonStates(): void {
  undoRedoState.canUndo = historyPosition >= 0;
  undoRedoState.canRedo = historyPosition < commandHistory.length - 1;
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
 */
export function pushCommand(command: Command): void {
  debug.log(
    "➕ PUSH: Adding command to history:",
    (command as any).description || command,
  );

  // Remove any commands after current position
  commandHistory.splice(historyPosition + 1);

  // Add new command
  commandHistory.push(command);

  // Limit history size
  if (commandHistory.length > MAX_HISTORY) {
    commandHistory.shift();
  } else {
    historyPosition++;
  }

  debug.log(
    "  History position now:",
    historyPosition,
    ", Total commands:",
    commandHistory.length,
  );

  // Update button states
  updateButtonStates();
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
export function undo(): void {
  if (historyPosition < 0) {
    return;
  }

  const command = commandHistory[historyPosition];
  debug.log(
    "🔙 UNDO: Executing command at position",
    historyPosition,
    ":",
    command,
  );
  debug.log("  Command description:", (command as any).description);
  command.undo();
  historyPosition--;
  debug.log("  New position after undo:", historyPosition);

  updateButtonStates();
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
export function redo(): void {
  if (historyPosition >= commandHistory.length - 1) {
    return;
  }

  historyPosition++;
  const command = commandHistory[historyPosition];
  command.redo();

  updateButtonStates();
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
export function canUndo(): boolean {
  return historyPosition >= 0;
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
export function canRedo(): boolean {
  return historyPosition < commandHistory.length - 1;
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
export function clearHistory(): void {
  commandHistory.length = 0;
  historyPosition = -1;
  updateButtonStates();
}
