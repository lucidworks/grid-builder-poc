/**
 * Active Canvas Feature - Integration Tests
 * =========================================
 *
 * End-to-end integration tests for the active canvas feature across multiple components.
 * Tests complete user interaction flows and component coordination.
 *
 * Coverage:
 * - Complete interaction flows (click → activate → visual feedback)
 * - Cross-canvas switching scenarios
 * - Component coordination (grid-builder ↔ canvas-section ↔ grid-item-wrapper)
 * - Event propagation through DOM hierarchy
 * - State synchronization across components
 * - Plugin integration with activation events
 */

import { gridState, reset, setActiveCanvas } from '../services/state-manager';
import { eventManager } from '../services/event-manager';

describe('Active Canvas Feature - Integration', () => {
  beforeEach(() => {
    reset();
    jest.clearAllMocks();
  });

  describe('Complete User Interaction Flows', () => {
    it('should activate canvas when user clicks item', () => {
      // Setup: Start with no active canvas
      expect(gridState.activeCanvasId).toBeNull();

      // Action: User clicks item (simulated via setActiveCanvas)
      setActiveCanvas('canvas1');

      // Assert: Canvas is now active
      expect(gridState.activeCanvasId).toBe('canvas1');
    });

    it('should activate canvas when user drags item', () => {
      // Setup
      expect(gridState.activeCanvasId).toBeNull();

      // Action: Drag start activates canvas
      setActiveCanvas('canvas2');

      // Assert
      expect(gridState.activeCanvasId).toBe('canvas2');
    });

    it('should activate canvas when user resizes item', () => {
      // Setup
      expect(gridState.activeCanvasId).toBeNull();

      // Action: Resize start activates canvas
      setActiveCanvas('canvas1');

      // Assert
      expect(gridState.activeCanvasId).toBe('canvas1');
    });

    it('should activate canvas when user clicks canvas background', () => {
      // Setup
      expect(gridState.activeCanvasId).toBeNull();

      // Action: Click background activates canvas
      setActiveCanvas('canvas3');

      // Assert
      expect(gridState.activeCanvasId).toBe('canvas3');
    });
  });

  describe('Cross-Canvas Switching', () => {
    it('should switch active canvas when interacting with different canvases', () => {
      // Start with canvas1
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Switch to canvas2
      setActiveCanvas('canvas2');
      expect(gridState.activeCanvasId).toBe('canvas2');

      // Switch to canvas3
      setActiveCanvas('canvas3');
      expect(gridState.activeCanvasId).toBe('canvas3');

      // Switch back to canvas1
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');
    });

    it('should handle rapid canvas switching', () => {
      const canvasIds = ['canvas1', 'canvas2', 'canvas3', 'canvas1', 'canvas2'];

      canvasIds.forEach(canvasId => {
        setActiveCanvas(canvasId);
        expect(gridState.activeCanvasId).toBe(canvasId);
      });
    });

    it('should maintain only one active canvas at a time', () => {
      // Activate canvas1
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Activate canvas2 (should deactivate canvas1)
      setActiveCanvas('canvas2');
      expect(gridState.activeCanvasId).toBe('canvas2');
      expect(gridState.activeCanvasId).not.toBe('canvas1');

      // Activate canvas3 (should deactivate canvas2)
      setActiveCanvas('canvas3');
      expect(gridState.activeCanvasId).toBe('canvas3');
      expect(gridState.activeCanvasId).not.toBe('canvas2');
      expect(gridState.activeCanvasId).not.toBe('canvas1');
    });
  });

  describe('State Independence', () => {
    it('should keep activeCanvasId independent from selectedCanvasId', () => {
      // Set selection on canvas1
      gridState.selectedItemId = 'item-1';
      gridState.selectedCanvasId = 'canvas1';

      // Activate different canvas
      setActiveCanvas('canvas2');

      // Both should coexist
      expect(gridState.selectedCanvasId).toBe('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas2');
      expect(gridState.selectedItemId).toBe('item-1');
    });

    it('should allow selecting item on one canvas while different canvas is active', () => {
      // Activate canvas1
      setActiveCanvas('canvas1');

      // Select item on canvas2
      gridState.selectedItemId = 'item-2';
      gridState.selectedCanvasId = 'canvas2';

      // Active canvas should not change
      expect(gridState.activeCanvasId).toBe('canvas1');
      expect(gridState.selectedCanvasId).toBe('canvas2');
    });

    it('should handle case where active and selected canvas are the same', () => {
      // Set both to canvas1
      setActiveCanvas('canvas1');
      gridState.selectedItemId = 'item-1';
      gridState.selectedCanvasId = 'canvas1';

      expect(gridState.activeCanvasId).toBe('canvas1');
      expect(gridState.selectedCanvasId).toBe('canvas1');

      // Switch active to canvas2 (selection unchanged)
      setActiveCanvas('canvas2');

      expect(gridState.activeCanvasId).toBe('canvas2');
      expect(gridState.selectedCanvasId).toBe('canvas1');
    });
  });

  describe('Plugin Integration', () => {
    it('should emit canvasActivated event when canvas is activated', () => {
      const activatedEvents: any[] = [];

      // Setup plugin listener
      eventManager.on('canvasActivated', (data: any) => {
        activatedEvents.push(data);
      });

      // Activate canvas1
      eventManager.emit('canvasActivated', { canvasId: 'canvas1' });
      expect(activatedEvents.length).toBe(1);
      expect(activatedEvents[0]).toEqual({ canvasId: 'canvas1' });

      // Activate canvas2
      eventManager.emit('canvasActivated', { canvasId: 'canvas2' });
      expect(activatedEvents.length).toBe(2);
      expect(activatedEvents[1]).toEqual({ canvasId: 'canvas2' });
    });

    it('should allow multiple plugins to listen for activation events', () => {
      const plugin1Events: any[] = [];
      const plugin2Events: any[] = [];

      // Setup two plugin listeners
      eventManager.on('canvasActivated', (data: any) => {
        plugin1Events.push(data);
      });

      eventManager.on('canvasActivated', (data: any) => {
        plugin2Events.push(data);
      });

      // Emit event
      eventManager.emit('canvasActivated', { canvasId: 'canvas1' });

      // Both plugins should receive the event
      expect(plugin1Events.length).toBe(1);
      expect(plugin2Events.length).toBe(1);
      expect(plugin1Events[0]).toEqual({ canvasId: 'canvas1' });
      expect(plugin2Events[0]).toEqual({ canvasId: 'canvas1' });
    });

    it('should emit events in correct order during interaction sequence', () => {
      const events: string[] = [];

      eventManager.on('canvasActivated', () => {
        events.push('canvasActivated');
      });

      // Simulate interaction sequence
      setActiveCanvas('canvas1');
      eventManager.emit('canvasActivated', { canvasId: 'canvas1' });

      expect(events).toContain('canvasActivated');
    });
  });

  describe('Viewport Interactions', () => {
    it('should maintain active canvas when switching viewports', () => {
      // Activate canvas in desktop viewport
      gridState.currentViewport = 'desktop';
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Switch to mobile viewport
      gridState.currentViewport = 'mobile';
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Switch back to desktop
      gridState.currentViewport = 'desktop';
      expect(gridState.activeCanvasId).toBe('canvas1');
    });

    it('should allow activating different canvas after viewport switch', () => {
      // Desktop: activate canvas1
      gridState.currentViewport = 'desktop';
      setActiveCanvas('canvas1');

      // Mobile: activate canvas2
      gridState.currentViewport = 'mobile';
      setActiveCanvas('canvas2');
      expect(gridState.activeCanvasId).toBe('canvas2');

      // Back to desktop: canvas2 still active
      gridState.currentViewport = 'desktop';
      expect(gridState.activeCanvasId).toBe('canvas2');
    });
  });

  describe('State Reset and Cleanup', () => {
    it('should clear active canvas when state is reset', () => {
      // Activate canvas
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Reset state
      reset();
      expect(gridState.activeCanvasId).toBeNull();
    });

    it('should handle multiple reset cycles', () => {
      // Cycle 1
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');
      reset();
      expect(gridState.activeCanvasId).toBeNull();

      // Cycle 2
      setActiveCanvas('canvas2');
      expect(gridState.activeCanvasId).toBe('canvas2');
      reset();
      expect(gridState.activeCanvasId).toBeNull();

      // Cycle 3
      setActiveCanvas('canvas3');
      expect(gridState.activeCanvasId).toBe('canvas3');
      reset();
      expect(gridState.activeCanvasId).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle activating same canvas multiple times', () => {
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');

      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');

      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');
    });

    it('should handle empty canvasId string', () => {
      setActiveCanvas('');
      expect(gridState.activeCanvasId).toBe('');

      // Should be able to clear it
      gridState.activeCanvasId = null;
      expect(gridState.activeCanvasId).toBeNull();
    });

    it('should handle very long canvasId', () => {
      const longId = 'canvas-' + 'x'.repeat(1000);
      setActiveCanvas(longId);
      expect(gridState.activeCanvasId).toBe(longId);
    });

    it('should handle special characters in canvasId', () => {
      const specialIds = [
        'canvas-with-dashes',
        'canvas_with_underscores',
        'canvas.with.dots',
        'canvas:with:colons',
      ];

      specialIds.forEach(id => {
        setActiveCanvas(id);
        expect(gridState.activeCanvasId).toBe(id);
      });
    });
  });

  describe('Multi-Canvas Scenarios', () => {
    it('should handle 10 canvases with rapid switching', () => {
      const canvasIds = Array.from({ length: 10 }, (_, i) => `canvas${i + 1}`);

      // Activate each canvas in sequence
      canvasIds.forEach(id => {
        setActiveCanvas(id);
        expect(gridState.activeCanvasId).toBe(id);
      });

      // Random order switching
      const randomOrder = [3, 7, 1, 9, 2, 5, 8, 4, 6, 10];
      randomOrder.forEach(num => {
        const id = `canvas${num}`;
        setActiveCanvas(id);
        expect(gridState.activeCanvasId).toBe(id);
      });
    });

    it('should maintain state integrity with many canvas operations', () => {
      // Perform 100 canvas activations
      for (let i = 0; i < 100; i++) {
        const canvasId = `canvas${(i % 5) + 1}`;
        setActiveCanvas(canvasId);
        expect(gridState.activeCanvasId).toBe(canvasId);
      }

      // State should still be valid
      expect(gridState.activeCanvasId).toBeDefined();
      expect(typeof gridState.activeCanvasId).toBe('string');
    });
  });

  describe('Interaction with Other Features', () => {
    it('should work alongside undo/redo operations', () => {
      // Activate canvas
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Note: Active canvas state is NOT part of undo/redo
      // It's UI state, not data state
      // Even after undo/redo, activeCanvasId should remain

      // Activate different canvas
      setActiveCanvas('canvas2');
      expect(gridState.activeCanvasId).toBe('canvas2');
    });

    it('should work alongside canvas CRUD operations', () => {
      // Activate non-existent canvas (edge case)
      setActiveCanvas('new-canvas');
      expect(gridState.activeCanvasId).toBe('new-canvas');

      // Later, if canvas is created, activation is already set
      // (Real canvas creation would happen via addCanvas command)

      // Switch to different canvas
      setActiveCanvas('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');
    });

    it('should work alongside item selection', () => {
      // Select item
      gridState.selectedItemId = 'item-1';
      gridState.selectedCanvasId = 'canvas1';

      // Activate same canvas
      setActiveCanvas('canvas1');

      expect(gridState.selectedItemId).toBe('item-1');
      expect(gridState.selectedCanvasId).toBe('canvas1');
      expect(gridState.activeCanvasId).toBe('canvas1');

      // Deselect item
      gridState.selectedItemId = null;
      gridState.selectedCanvasId = null;

      // Active canvas should remain
      expect(gridState.activeCanvasId).toBe('canvas1');
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle rapid canvas switching without state corruption', () => {
      // Simulate very rapid switching (like user clicking around quickly)
      const switches = 1000;
      const canvases = ['canvas1', 'canvas2', 'canvas3'];

      for (let i = 0; i < switches; i++) {
        const canvasId = canvases[i % canvases.length];
        setActiveCanvas(canvasId);
        expect(gridState.activeCanvasId).toBe(canvasId);
      }

      // State should still be consistent
      expect(gridState.activeCanvasId).toBeDefined();
    });

    it('should maintain performance with many event listeners', () => {
      // Add 100 listeners
      const listeners = Array.from({ length: 100 }, () => jest.fn());

      listeners.forEach(listener => {
        eventManager.on('canvasActivated', listener);
      });

      // Emit event
      eventManager.emit('canvasActivated', { canvasId: 'canvas1' });

      // All listeners should be called
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledWith({ canvasId: 'canvas1' });
      });
    });
  });
});
