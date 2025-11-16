import { c as createStore } from './index-28d0c3f6.js';

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
 *                                  ↑
 *                            historyPosition = 2
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
 *                         ↑ position = 2
 *
 * Undo 2x:  [cmd1, cmd2, cmd3, cmd4, cmd5]
 *                  ↑ position = 0
 *
 * New cmd:  [cmd1, cmd6]  ← cmd2-cmd5 discarded!
 *                  ↑ position = 1
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
 *   beforeState = JSON.parse(JSON.stringify(item));  // Deep clone
 *   afterState = JSON.parse(JSON.stringify(updatedItem));
 *
 *   undo() { restoreState(beforeState); }
 *   redo() { restoreState(afterState); }
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
 *   canUndo: boolean,  // Enable/disable undo button
 *   canRedo: boolean   // Enable/disable redo button
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
 *   Undo
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
 *   undo(): void;
 *   redo(): void;
 * }
 *
 * class UndoRedoManager {
 *   private history: Command[] = [];
 *   private position = -1;
 *
 *   push(command: Command) {
 *     this.history.splice(this.position + 1);  // Discard future
 *     this.history.push(command);
 *     this.position++;
 *   }
 *
 *   undo() {
 *     if (this.position >= 0) {
 *       this.history[this.position].undo();
 *       this.position--;
 *     }
 *   }
 *
 *   redo() {
 *     if (this.position < this.history.length - 1) {
 *       this.position++;
 *       this.history[this.position].redo();
 *     }
 *   }
 * }
 * ```
 *
 * **Example commands**:
 * ```typescript
 * class AddItemCommand implements Command {
 *   constructor(
 *     private canvasId: string,
 *     private item: GridItem
 *   ) {}
 *
 *   undo() { removeItemFromCanvas(this.canvasId, this.item.id); }
 *   redo() { addItemToCanvas(this.canvasId, this.item); }
 * }
 * ```
 *
 * **For different frameworks**:
 * - React: Use useReducer or Zustand middleware
 * - Vue: Use Pinia plugin or custom composable
 * - Angular: Use NgRx effects or service
 *
 * @module undo-redo
 */
/**
 * Reactive state store for undo/redo button states
 *
 * **StencilJS integration**: Components automatically subscribe when accessing properties
 * **Updates**: Modified by updateButtonStates() after each operation
 */
const { state: undoRedoState } = createStore({
    canUndo: false,
    canRedo: false,
});
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
 *
 * @example
 * ```
 * [AddItemCommand, DeleteItemCommand, MoveItemCommand]
 *  ↑                ↑                  ↑
 *  0                1                  2 (historyPosition)
 * ```
 */
const commandHistory = [];
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
let historyPosition = -1;
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
 * Update undo/redo button states
 * This triggers UI updates via the store
 */
function updateButtonStates() {
    undoRedoState.canUndo = historyPosition >= 0;
    undoRedoState.canRedo = historyPosition < commandHistory.length - 1;
}
/**
 * Push a new command to the history
 * Removes any commands after current position (if we undid and then did something new)
 */
function pushCommand(command) {
    // Remove any commands after current position
    commandHistory.splice(historyPosition + 1);
    // Add new command
    commandHistory.push(command);
    // Limit history size
    if (commandHistory.length > MAX_HISTORY) {
        commandHistory.shift();
    }
    else {
        historyPosition++;
    }
    // Update button states
    updateButtonStates();
}
/**
 * Undo the last command
 */
function undo() {
    if (historyPosition < 0) {
        return;
    }
    const command = commandHistory[historyPosition];
    command.undo();
    historyPosition--;
    updateButtonStates();
}
/**
 * Redo the next command
 */
function redo() {
    if (historyPosition >= commandHistory.length - 1) {
        return;
    }
    historyPosition++;
    const command = commandHistory[historyPosition];
    command.redo();
    updateButtonStates();
}
/**
 * Check if undo is available
 */
function canUndo() {
    return historyPosition >= 0;
}
/**
 * Check if redo is available
 */
function canRedo() {
    return historyPosition < commandHistory.length - 1;
}
/**
 * Clear all history
 */
function clearHistory() {
    commandHistory.length = 0;
    historyPosition = -1;
    updateButtonStates();
}

export { undoRedoState as a, pushCommand as p, redo as r, undo as u };

//# sourceMappingURL=undo-redo-fcad8abb.js.map