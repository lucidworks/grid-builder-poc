/**
 * Event Manager Tests
 * ====================
 *
 * Tests for the event manager service including:
 * - Event emission and subscription
 * - Event debouncing for high-frequency events
 * - Configurable debounce delay
 * - Cleanup on unsubscribe
 */

import { eventManager } from './event-manager';

describe('eventManager', () => {
  beforeEach(() => {
    // Clear all event listeners before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear any pending timers
    jest.clearAllTimers();
  });

  describe('Basic Event Emission', () => {
    it('should emit and receive immediate events', () => {
      const listener = jest.fn();

      eventManager.on('componentSelected', listener);
      eventManager.emit('componentSelected', { itemId: 'item-1', canvasId: 'canvas-1' });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ itemId: 'item-1', canvasId: 'canvas-1' });
    });

    it('should support multiple listeners for the same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventManager.on('componentAdded', listener1);
      eventManager.on('componentAdded', listener2);
      eventManager.emit('componentAdded', { itemId: 'item-1' });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener1).toHaveBeenCalledWith({ itemId: 'item-1' });
      expect(listener2).toHaveBeenCalledWith({ itemId: 'item-1' });
    });

    it('should not call listener after unsubscribe', () => {
      const listener = jest.fn();

      eventManager.on('componentDeleted', listener);
      eventManager.off('componentDeleted', listener);
      eventManager.emit('componentDeleted', { itemId: 'item-1' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle unsubscribing non-existent listener gracefully', () => {
      const listener = jest.fn();

      // Should not throw
      expect(() => {
        eventManager.off('nonExistentEvent', listener);
      }).not.toThrow();
    });
  });

  describe('Event Debouncing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce componentDragged events', () => {
      const listener = jest.fn();

      eventManager.on('componentDragged', listener);

      // Emit multiple times rapidly
      eventManager.emit('componentDragged', { itemId: 'item-1', position: { x: 10, y: 10 } });
      eventManager.emit('componentDragged', { itemId: 'item-1', position: { x: 20, y: 20 } });
      eventManager.emit('componentDragged', { itemId: 'item-1', position: { x: 30, y: 30 } });

      // Should not be called yet
      expect(listener).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      jest.advanceTimersByTime(300);

      // Should only be called once with the last value
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ itemId: 'item-1', position: { x: 30, y: 30 } });
    });

    it('should debounce componentResized events', () => {
      const listener = jest.fn();

      eventManager.on('componentResized', listener);

      // Emit multiple times rapidly
      eventManager.emit('componentResized', { itemId: 'item-1', size: { width: 100, height: 100 } });
      eventManager.emit('componentResized', { itemId: 'item-1', size: { width: 150, height: 120 } });
      eventManager.emit('componentResized', { itemId: 'item-1', size: { width: 200, height: 150 } });

      expect(listener).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ itemId: 'item-1', size: { width: 200, height: 150 } });
    });

    it('should debounce stateChanged events', () => {
      const listener = jest.fn();

      eventManager.on('stateChanged', listener);

      // Emit multiple times rapidly
      eventManager.emit('stateChanged', { reason: 'item-moved' });
      eventManager.emit('stateChanged', { reason: 'item-resized' });
      eventManager.emit('stateChanged', { reason: 'item-deleted' });

      expect(listener).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ reason: 'item-deleted' });
    });

    it('should NOT debounce componentSelected events (immediate)', () => {
      const listener = jest.fn();

      eventManager.on('componentSelected', listener);

      eventManager.emit('componentSelected', { itemId: 'item-1' });
      eventManager.emit('componentSelected', { itemId: 'item-2' });
      eventManager.emit('componentSelected', { itemId: 'item-3' });

      // Should be called immediately for each emit
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('should NOT debounce componentDeleted events (immediate)', () => {
      const listener = jest.fn();

      eventManager.on('componentDeleted', listener);

      eventManager.emit('componentDeleted', { itemId: 'item-1' });
      eventManager.emit('componentDeleted', { itemId: 'item-2' });

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should NOT debounce componentAdded events (immediate)', () => {
      const listener = jest.fn();

      eventManager.on('componentAdded', listener);

      eventManager.emit('componentAdded', { itemId: 'item-1' });
      eventManager.emit('componentAdded', { itemId: 'item-2' });

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configurable Debounce Delay', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      // Reset to default delay
      eventManager.setDebounceDelay(300);
    });

    it('should use custom debounce delay when configured', () => {
      const listener = jest.fn();

      // Set custom delay of 500ms
      eventManager.setDebounceDelay(500);

      eventManager.on('componentDragged', listener);
      eventManager.emit('componentDragged', { itemId: 'item-1', position: { x: 10, y: 10 } });

      // Should not be called after 300ms (old default)
      jest.advanceTimersByTime(300);
      expect(listener).not.toHaveBeenCalled();

      // Should be called after 500ms (new delay)
      jest.advanceTimersByTime(200);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should allow setting shorter debounce delay', () => {
      const listener = jest.fn();

      // Set shorter delay of 100ms
      eventManager.setDebounceDelay(100);

      eventManager.on('componentResized', listener);
      eventManager.emit('componentResized', { itemId: 'item-1', size: { width: 200, height: 150 } });

      // Should be called after 100ms
      jest.advanceTimersByTime(100);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending debounced event when new event is emitted', () => {
      const listener = jest.fn();

      eventManager.on('componentDragged', listener);

      // Emit first event
      eventManager.emit('componentDragged', { itemId: 'item-1', position: { x: 10, y: 10 } });

      // Wait 200ms (not enough to trigger)
      jest.advanceTimersByTime(200);

      // Emit second event (should cancel first timer)
      eventManager.emit('componentDragged', { itemId: 'item-1', position: { x: 20, y: 20 } });

      // Wait another 200ms (total 400ms from first emit, but only 200ms from second)
      jest.advanceTimersByTime(200);

      // Should not be called yet (needs 300ms from second emit)
      expect(listener).not.toHaveBeenCalled();

      // Wait final 100ms
      jest.advanceTimersByTime(100);

      // Should be called once with the second value
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ itemId: 'item-1', position: { x: 20, y: 20 } });
    });
  });

  describe('Multiple Event Types', () => {
    it('should handle multiple different event types independently', () => {
      const dragListener = jest.fn();
      const selectedListener = jest.fn();
      const deletedListener = jest.fn();

      eventManager.on('componentDragged', dragListener);
      eventManager.on('componentSelected', selectedListener);
      eventManager.on('componentDeleted', deletedListener);

      // Emit all events
      eventManager.emit('componentDragged', { itemId: 'item-1' });
      eventManager.emit('componentSelected', { itemId: 'item-2' });
      eventManager.emit('componentDeleted', { itemId: 'item-3' });

      // Immediate events should fire
      expect(selectedListener).toHaveBeenCalledTimes(1);
      expect(deletedListener).toHaveBeenCalledTimes(1);

      // Debounced event should not fire yet
      expect(dragListener).not.toHaveBeenCalled();
    });

    it('should allow same listener for multiple events', () => {
      const listener = jest.fn();

      eventManager.on('componentSelected', listener);
      eventManager.on('componentDeleted', listener);

      eventManager.emit('componentSelected', { itemId: 'item-1' });
      eventManager.emit('componentDeleted', { itemId: 'item-2' });

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(1, { itemId: 'item-1' });
      expect(listener).toHaveBeenNthCalledWith(2, { itemId: 'item-2' });
    });
  });

  describe('Event Data Types', () => {
    it('should pass through complex event data correctly', () => {
      const listener = jest.fn();

      const complexData = {
        itemId: 'item-1',
        canvasId: 'canvas-1',
        position: { x: 100, y: 200 },
        size: { width: 300, height: 400 },
        metadata: {
          timestamp: Date.now(),
          user: 'test-user',
        },
      };

      eventManager.on('componentSelected', listener);
      eventManager.emit('componentSelected', complexData);

      expect(listener).toHaveBeenCalledWith(complexData);
    });

    it('should handle null and undefined event data', () => {
      const listener = jest.fn();

      eventManager.on('componentSelected', listener);

      eventManager.emit('componentSelected', null);
      expect(listener).toHaveBeenCalledWith(null);

      eventManager.emit('componentSelected', undefined);
      expect(listener).toHaveBeenCalledWith(undefined);
    });
  });
});
