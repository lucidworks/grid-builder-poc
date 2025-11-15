/**
 * Undo/Redo Service
 * Command pattern for undo/redo functionality
 *
 * Purpose: Provide undo/redo capabilities for user actions
 * Maintains a command history with max 50 operations
 */

import { createStore } from '@stencil/store';

/**
 * Command Interface
 * All undoable operations must implement this interface
 */
export interface Command {
  undo(): void;
  redo(): void;
}

/**
 * Undo/Redo State
 */
interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
}

// Create store for undo/redo state (for UI reactivity)
const { state: undoRedoState } = createStore<UndoRedoState>({
  canUndo: false,
  canRedo: false,
});

export { undoRedoState };

/**
 * Internal state
 */
const commandHistory: Command[] = [];
let historyPosition: number = -1;
const MAX_HISTORY = 50;

/**
 * Update undo/redo button states
 * This triggers UI updates via the store
 */
function updateButtonStates(): void {
  undoRedoState.canUndo = historyPosition >= 0;
  undoRedoState.canRedo = historyPosition < commandHistory.length - 1;
}

/**
 * Push a new command to the history
 * Removes any commands after current position (if we undid and then did something new)
 */
export function pushCommand(command: Command): void {
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

  // Update button states
  updateButtonStates();
}

/**
 * Undo the last command
 */
export function undo(): void {
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
 * Check if undo is available
 */
export function canUndo(): boolean {
  return historyPosition >= 0;
}

/**
 * Check if redo is available
 */
export function canRedo(): boolean {
  return historyPosition < commandHistory.length - 1;
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  commandHistory.length = 0;
  historyPosition = -1;
  updateButtonStates();
}
