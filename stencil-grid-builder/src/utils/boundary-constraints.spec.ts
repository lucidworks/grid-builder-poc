/**
 * Boundary Constraints Tests
 * ===========================
 *
 * Tests for boundary constraint utilities that ensure components
 * stay fully within canvas bounds.
 */

import {
  canComponentFitCanvas,
  constrainSizeToCanvas,
  constrainPositionToCanvas,
  applyBoundaryConstraints,
} from './boundary-constraints';
import { ComponentDefinition } from '../types/component-definition';

describe('boundary-constraints', () => {
  describe('canComponentFitCanvas', () => {
    it('should return true when component fits', () => {
      const definition: ComponentDefinition = {
        type: 'test',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 20, height: 10 },
        minSize: { width: 10, height: 5 },
        render: () => null,
      };

      expect(canComponentFitCanvas(definition)).toBe(true);
    });

    it('should return false when minSize exceeds canvas width', () => {
      const definition: ComponentDefinition = {
        type: 'huge',
        name: 'Huge',
        icon: '📦',
        defaultSize: { width: 60, height: 10 },
        minSize: { width: 60, height: 10 },
        render: () => null,
      };

      expect(canComponentFitCanvas(definition, 50)).toBe(false);
    });

    it('should return true when minSize equals canvas width', () => {
      const definition: ComponentDefinition = {
        type: 'full-width',
        name: 'Full Width',
        icon: '📏',
        defaultSize: { width: 50, height: 10 },
        minSize: { width: 50, height: 10 },
        render: () => null,
      };

      expect(canComponentFitCanvas(definition, 50)).toBe(true);
    });

    it('should return true when no minSize specified', () => {
      const definition: ComponentDefinition = {
        type: 'flexible',
        name: 'Flexible',
        icon: '🔧',
        defaultSize: { width: 20, height: 10 },
        render: () => null,
      };

      expect(canComponentFitCanvas(definition)).toBe(true);
    });
  });

  describe('constrainSizeToCanvas', () => {
    it('should not adjust size when default fits', () => {
      const definition: ComponentDefinition = {
        type: 'test',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 20, height: 10 },
        render: () => null,
      };

      const result = constrainSizeToCanvas(definition);

      expect(result).toEqual({
        width: 20,
        height: 10,
        wasAdjusted: false,
      });
    });

    it('should shrink width when default exceeds canvas', () => {
      const definition: ComponentDefinition = {
        type: 'wide',
        name: 'Wide',
        icon: '↔️',
        defaultSize: { width: 60, height: 10 },
        minSize: { width: 20, height: 5 },
        render: () => null,
      };

      const result = constrainSizeToCanvas(definition, 50);

      expect(result).toEqual({
        width: 50,
        height: 10,
        wasAdjusted: true,
      });
    });

    it('should respect minSize when shrinking', () => {
      const definition: ComponentDefinition = {
        type: 'constrained',
        name: 'Constrained',
        icon: '🔒',
        defaultSize: { width: 60, height: 10 },
        minSize: { width: 40, height: 5 },
        render: () => null,
      };

      const result = constrainSizeToCanvas(definition, 35);

      expect(result.width).toBe(40); // Uses minSize, not canvas width
      expect(result.wasAdjusted).toBe(true);
    });

    it('should respect maxSize', () => {
      const definition: ComponentDefinition = {
        type: 'limited',
        name: 'Limited',
        icon: '📏',
        defaultSize: { width: 60, height: 10 },
        maxSize: { width: 30, height: 15 },
        render: () => null,
      };

      const result = constrainSizeToCanvas(definition, 50);

      expect(result.width).toBe(30); // Uses maxSize
      expect(result.wasAdjusted).toBe(true);
    });

    it('should not constrain height by canvas', () => {
      const definition: ComponentDefinition = {
        type: 'tall',
        name: 'Tall',
        icon: '↕️',
        defaultSize: { width: 20, height: 100 },
        render: () => null,
      };

      const result = constrainSizeToCanvas(definition);

      expect(result.height).toBe(100); // Height not constrained
      expect(result.wasAdjusted).toBe(false);
    });
  });

  describe('constrainPositionToCanvas', () => {
    it('should not adjust position when component fits', () => {
      const result = constrainPositionToCanvas(10, 10, 20, 10, 50);

      expect(result).toEqual({
        x: 10,
        y: 10,
        width: 20,
        height: 10,
        positionAdjusted: false,
        sizeAdjusted: false,
      });
    });

    it('should constrain left edge', () => {
      const result = constrainPositionToCanvas(-5, 10, 20, 10, 50);

      expect(result.x).toBe(0);
      expect(result.y).toBe(10);
      expect(result.positionAdjusted).toBe(true);
    });

    it('should constrain right edge', () => {
      const result = constrainPositionToCanvas(45, 10, 20, 10, 50);

      expect(result.x).toBe(30); // 50 - 20 = 30
      expect(result.y).toBe(10);
      expect(result.positionAdjusted).toBe(true);
    });

    it('should constrain top edge', () => {
      const result = constrainPositionToCanvas(10, -5, 20, 10, 50);

      expect(result.x).toBe(10);
      expect(result.y).toBe(0);
      expect(result.positionAdjusted).toBe(true);
    });

    it('should not constrain bottom edge (canvas grows)', () => {
      const result = constrainPositionToCanvas(10, 100, 20, 10, 50);

      expect(result.x).toBe(10);
      expect(result.y).toBe(100); // Not constrained
      expect(result.positionAdjusted).toBe(false);
    });

    it('should constrain both x and y', () => {
      const result = constrainPositionToCanvas(-5, -10, 20, 10, 50);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.positionAdjusted).toBe(true);
    });

    it('should handle full-width component', () => {
      const result = constrainPositionToCanvas(5, 10, 50, 10, 50);

      expect(result.x).toBe(0); // Adjusted from 5 to 0
      expect(result.positionAdjusted).toBe(true);
    });
  });

  describe('applyBoundaryConstraints', () => {
    it('should apply full constraint pipeline', () => {
      const definition: ComponentDefinition = {
        type: 'test',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 60, height: 10 },
        minSize: { width: 20, height: 5 },
        render: () => null,
      };

      const result = applyBoundaryConstraints(definition, 45, 10, 50);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(0); // Adjusted from 45 to fit width 50
      expect(result!.y).toBe(10);
      expect(result!.width).toBe(50); // Shrunk from 60
      expect(result!.height).toBe(10);
      expect(result!.positionAdjusted).toBe(true);
      expect(result!.sizeAdjusted).toBe(true);
    });

    it('should return null when component cannot fit', () => {
      const definition: ComponentDefinition = {
        type: 'too-large',
        name: 'Too Large',
        icon: '📦',
        defaultSize: { width: 60, height: 10 },
        minSize: { width: 60, height: 10 },
        render: () => null,
      };

      const result = applyBoundaryConstraints(definition, 10, 10, 50);

      expect(result).toBeNull();
    });

    it('should handle placement at origin', () => {
      const definition: ComponentDefinition = {
        type: 'test',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 20, height: 10 },
        render: () => null,
      };

      const result = applyBoundaryConstraints(definition, 0, 0, 50);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 20,
        height: 10,
        positionAdjusted: false,
        sizeAdjusted: false,
      });
    });

    it('should handle negative positions', () => {
      const definition: ComponentDefinition = {
        type: 'test',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 20, height: 10 },
        render: () => null,
      };

      const result = applyBoundaryConstraints(definition, -10, -5, 50);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(0);
      expect(result!.y).toBe(0);
      expect(result!.positionAdjusted).toBe(true);
    });

    it('should use default canvas width', () => {
      const definition: ComponentDefinition = {
        type: 'test',
        name: 'Test',
        icon: '🧪',
        defaultSize: { width: 20, height: 10 },
        render: () => null,
      };

      // Call without canvasWidth parameter
      const result = applyBoundaryConstraints(definition, 40, 10);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(30); // 50 - 20 = 30 (using CANVAS_WIDTH_UNITS = 50)
    });

    it('should combine size and position constraints', () => {
      const definition: ComponentDefinition = {
        type: 'complex',
        name: 'Complex',
        icon: '🔧',
        defaultSize: { width: 70, height: 15 },
        minSize: { width: 30, height: 8 },
        maxSize: { width: 50, height: 20 },
        render: () => null,
      };

      const result = applyBoundaryConstraints(definition, 25, 5, 50);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(0); // Adjusted from 25 (since 25 + 50 > 50)
      expect(result!.y).toBe(5);
      expect(result!.width).toBe(50); // Limited by maxSize
      expect(result!.height).toBe(15);
      expect(result!.positionAdjusted).toBe(true);
      expect(result!.sizeAdjusted).toBe(true);
    });
  });
});
