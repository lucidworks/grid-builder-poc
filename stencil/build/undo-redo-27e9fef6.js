import { c as createStore } from './index-28d0c3f6.js';

/**
 * Undo/Redo Service
 * Command pattern for undo/redo functionality
 *
 * Purpose: Provide undo/redo capabilities for user actions
 * Maintains a command history with max 50 operations
 */
// Create store for undo/redo state (for UI reactivity)
const { state: undoRedoState } = createStore({
    canUndo: false,
    canRedo: false,
});
/**
 * Internal state
 */
const commandHistory = [];
let historyPosition = -1;
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

//# sourceMappingURL=undo-redo-27e9fef6.js.map