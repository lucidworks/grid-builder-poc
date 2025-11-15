import { canRedo, canUndo, clearHistory, Command, pushCommand, redo, undo, undoRedoState } from './undo-redo';

// Mock command for testing
class MockCommand implements Command {
  public undoCalled: boolean = false;
  public redoCalled: boolean = false;
  public undoCount: number = 0;
  public redoCount: number = 0;

  undo(): void {
    this.undoCalled = true;
    this.undoCount++;
  }

  redo(): void {
    this.redoCalled = true;
    this.redoCount++;
  }

  reset(): void {
    this.undoCalled = false;
    this.redoCalled = false;
    this.undoCount = 0;
    this.redoCount = 0;
  }
}

describe('undo-redo', () => {
  beforeEach(() => {
    // Clear history before each test
    clearHistory();
  });

  describe('Initial State', () => {
    it('should have no undo available', () => {
      expect(canUndo()).toBe(false);
      expect(undoRedoState.canUndo).toBe(false);
    });

    it('should have no redo available', () => {
      expect(canRedo()).toBe(false);
      expect(undoRedoState.canRedo).toBe(false);
    });
  });

  describe('pushCommand', () => {
    it('should add command to history', () => {
      const command = new MockCommand();
      pushCommand(command);

      expect(canUndo()).toBe(true);
      expect(undoRedoState.canUndo).toBe(true);
    });

    it('should update button states after push', () => {
      const command = new MockCommand();
      pushCommand(command);

      expect(undoRedoState.canUndo).toBe(true);
      expect(undoRedoState.canRedo).toBe(false);
    });

    it('should allow multiple commands to be pushed', () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      const command3 = new MockCommand();

      pushCommand(command1);
      pushCommand(command2);
      pushCommand(command3);

      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(false);
    });

    it('should remove forward history when pushing after undo', () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      const command3 = new MockCommand();

      // Push 3 commands
      pushCommand(command1);
      pushCommand(command2);
      pushCommand(command3);

      // Undo twice (go back to command1)
      undo();
      undo();
      expect(canRedo()).toBe(true);

      // Push new command (should remove command2 and command3 from history)
      const command4 = new MockCommand();
      pushCommand(command4);

      // Should not be able to redo (forward history was removed)
      expect(canRedo()).toBe(false);

      // Undo twice should work (command4, command1)
      undo();
      expect(canUndo()).toBe(true);
      undo();
      expect(canUndo()).toBe(false);
    });

    it('should limit history to 50 commands', () => {
      // Push 60 commands
      for (let i = 0; i < 60; i++) {
        pushCommand(new MockCommand());
      }

      // Should be able to undo, but only 50 times max
      let undoCount = 0;
      while (canUndo()) {
        undo();
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });

  describe('undo', () => {
    it('should call command.undo()', () => {
      const command = new MockCommand();
      pushCommand(command);

      undo();

      expect(command.undoCalled).toBe(true);
      expect(command.undoCount).toBe(1);
    });

    it('should update button states after undo', () => {
      const command = new MockCommand();
      pushCommand(command);

      expect(undoRedoState.canUndo).toBe(true);
      expect(undoRedoState.canRedo).toBe(false);

      undo();

      expect(undoRedoState.canUndo).toBe(false);
      expect(undoRedoState.canRedo).toBe(true);
    });

    it('should handle multiple undos', () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      const command3 = new MockCommand();

      pushCommand(command1);
      pushCommand(command2);
      pushCommand(command3);

      undo(); // Undo command3
      expect(command3.undoCalled).toBe(true);
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(true);

      undo(); // Undo command2
      expect(command2.undoCalled).toBe(true);
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(true);

      undo(); // Undo command1
      expect(command1.undoCalled).toBe(true);
      expect(canUndo()).toBe(false);
      expect(canRedo()).toBe(true);
    });

    it('should do nothing when no commands to undo', () => {
      // Try to undo with empty history
      undo();

      // Should not throw error
      expect(canUndo()).toBe(false);
    });

    it('should not undo beyond history start', () => {
      const command = new MockCommand();
      pushCommand(command);

      undo();
      expect(command.undoCount).toBe(1);

      // Try to undo again (should do nothing)
      undo();
      expect(command.undoCount).toBe(1); // Count should not increase

      expect(canUndo()).toBe(false);
    });
  });

  describe('redo', () => {
    it('should call command.redo()', () => {
      const command = new MockCommand();
      pushCommand(command);
      undo();

      redo();

      expect(command.redoCalled).toBe(true);
      expect(command.redoCount).toBe(1);
    });

    it('should update button states after redo', () => {
      const command = new MockCommand();
      pushCommand(command);
      undo();

      expect(undoRedoState.canUndo).toBe(false);
      expect(undoRedoState.canRedo).toBe(true);

      redo();

      expect(undoRedoState.canUndo).toBe(true);
      expect(undoRedoState.canRedo).toBe(false);
    });

    it('should handle multiple redos', () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      const command3 = new MockCommand();

      pushCommand(command1);
      pushCommand(command2);
      pushCommand(command3);

      // Undo all
      undo();
      undo();
      undo();

      // Redo all
      redo(); // Redo command1
      expect(command1.redoCalled).toBe(true);
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(true);

      redo(); // Redo command2
      expect(command2.redoCalled).toBe(true);
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(true);

      redo(); // Redo command3
      expect(command3.redoCalled).toBe(true);
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(false);
    });

    it('should do nothing when no commands to redo', () => {
      const command = new MockCommand();
      pushCommand(command);

      // Try to redo (should do nothing - no undo yet)
      redo();

      // Should not throw error
      expect(command.redoCalled).toBe(false);
      expect(canRedo()).toBe(false);
    });

    it('should not redo beyond history end', () => {
      const command = new MockCommand();
      pushCommand(command);
      undo();

      redo();
      expect(command.redoCount).toBe(1);

      // Try to redo again (should do nothing)
      redo();
      expect(command.redoCount).toBe(1); // Count should not increase

      expect(canRedo()).toBe(false);
    });
  });

  describe('canUndo', () => {
    it('should return true when commands are available', () => {
      const command = new MockCommand();
      pushCommand(command);

      expect(canUndo()).toBe(true);
    });

    it('should return false when no commands available', () => {
      expect(canUndo()).toBe(false);
    });

    it('should return false after undoing all commands', () => {
      const command = new MockCommand();
      pushCommand(command);
      undo();

      expect(canUndo()).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('should return true after undo', () => {
      const command = new MockCommand();
      pushCommand(command);
      undo();

      expect(canRedo()).toBe(true);
    });

    it('should return false when no undos performed', () => {
      const command = new MockCommand();
      pushCommand(command);

      expect(canRedo()).toBe(false);
    });

    it('should return false after redoing all commands', () => {
      const command = new MockCommand();
      pushCommand(command);
      undo();
      redo();

      expect(canRedo()).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear all commands', () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();

      pushCommand(command1);
      pushCommand(command2);

      clearHistory();

      expect(canUndo()).toBe(false);
      expect(canRedo()).toBe(false);
    });

    it('should update button states', () => {
      const command = new MockCommand();
      pushCommand(command);

      clearHistory();

      expect(undoRedoState.canUndo).toBe(false);
      expect(undoRedoState.canRedo).toBe(false);
    });

    it('should allow new commands after clear', () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();

      pushCommand(command1);
      clearHistory();
      pushCommand(command2);

      expect(canUndo()).toBe(true);

      undo();
      expect(command2.undoCalled).toBe(true);
      expect(command1.undoCalled).toBe(false); // command1 was cleared
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle undo, redo, undo sequence', () => {
      const command = new MockCommand();
      pushCommand(command);

      undo();
      expect(command.undoCount).toBe(1);
      expect(command.redoCount).toBe(0);

      redo();
      expect(command.undoCount).toBe(1);
      expect(command.redoCount).toBe(1);

      undo();
      expect(command.undoCount).toBe(2);
      expect(command.redoCount).toBe(1);
    });

    it('should handle push after partial undo', () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      const command3 = new MockCommand();
      const command4 = new MockCommand();

      pushCommand(command1);
      pushCommand(command2);
      pushCommand(command3);

      // Undo once
      undo();

      // Push new command (removes command3 from forward history)
      pushCommand(command4);

      // Verify: can undo command4 and command2
      undo(); // Undo command4
      expect(command4.undoCalled).toBe(true);

      undo(); // Undo command2
      expect(command2.undoCalled).toBe(true);

      undo(); // Undo command1
      expect(command1.undoCalled).toBe(true);

      expect(canUndo()).toBe(false);

      // command3 should never be undone (it was removed from history)
      expect(command3.undoCalled).toBe(true); // Was undone before push
      expect(command3.undoCount).toBe(1); // But not undone again
    });

    it('should maintain correct state through mixed operations', () => {
      const commands = Array.from({ length: 5 }, () => new MockCommand());

      // Push 5 commands
      commands.forEach(cmd => pushCommand(cmd));
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(false);

      // Undo 3 times
      undo();
      undo();
      undo();
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(true);

      // Redo 2 times
      redo();
      redo();
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(true);

      // Undo 1 time
      undo();
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(true);

      // Push new command
      const newCommand = new MockCommand();
      pushCommand(newCommand);
      expect(canUndo()).toBe(true);
      expect(canRedo()).toBe(false); // Forward history cleared
    });
  });
});
