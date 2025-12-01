import { DOMCache } from "./dom-cache";

describe("dom-cache", () => {
  let domCache: DOMCache;

  beforeEach(() => {
    // Create new instance for each test
    domCache = new DOMCache();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    // Clean up
    domCache.clear();
    document.body.innerHTML = "";
  });

  describe("getCanvas", () => {
    it("should return null for non-existent canvas", () => {
      const canvas = domCache.getCanvas("non-existent");
      expect(canvas).toBeNull();
    });

    it("should find and cache canvas element", () => {
      // Create canvas element
      const canvasElement = document.createElement("div");
      canvasElement.id = "canvas1";
      document.body.appendChild(canvasElement);

      // First call - should query DOM and cache
      const canvas1 = domCache.getCanvas("canvas1");
      expect(canvas1).toBe(canvasElement);

      // Second call - should use cache
      const canvas2 = domCache.getCanvas("canvas1");
      expect(canvas2).toBe(canvasElement);
      expect(canvas2).toBe(canvas1); // Same reference
    });

    it("should cache different canvases independently", () => {
      // Create multiple canvas elements
      const canvas1Element = document.createElement("div");
      canvas1Element.id = "canvas1";
      document.body.appendChild(canvas1Element);

      const canvas2Element = document.createElement("div");
      canvas2Element.id = "canvas2";
      document.body.appendChild(canvas2Element);

      // Get both canvases
      const canvas1 = domCache.getCanvas("canvas1");
      const canvas2 = domCache.getCanvas("canvas2");

      expect(canvas1).toBe(canvas1Element);
      expect(canvas2).toBe(canvas2Element);
      expect(canvas1).not.toBe(canvas2);
    });

    it("should return cached value even if element is removed from DOM", () => {
      // Create and cache canvas
      const canvasElement = document.createElement("div");
      canvasElement.id = "canvas1";
      document.body.appendChild(canvasElement);

      const canvas1 = domCache.getCanvas("canvas1");
      expect(canvas1).toBe(canvasElement);

      // Remove element from DOM
      document.body.removeChild(canvasElement);

      // Should still return cached reference
      const canvas2 = domCache.getCanvas("canvas1");
      expect(canvas2).toBe(canvasElement);
      expect(canvas2).toBe(canvas1);
    });
  });

  describe("invalidate", () => {
    it("should remove specific canvas from cache", () => {
      // Create canvas
      const canvasElement = document.createElement("div");
      canvasElement.id = "canvas1";
      document.body.appendChild(canvasElement);

      // Cache canvas
      const canvas1 = domCache.getCanvas("canvas1");
      expect(canvas1).toBe(canvasElement);

      // Invalidate canvas
      domCache.invalidate("canvas1");

      // Should query DOM again (returns same element but re-caches)
      const canvas2 = domCache.getCanvas("canvas1");
      expect(canvas2).toBe(canvasElement);
    });

    it("should not affect other cached canvases", () => {
      // Create two canvases
      const canvas1Element = document.createElement("div");
      canvas1Element.id = "canvas1";
      document.body.appendChild(canvas1Element);

      const canvas2Element = document.createElement("div");
      canvas2Element.id = "canvas2";
      document.body.appendChild(canvas2Element);

      // Cache both
      domCache.getCanvas("canvas1");
      const canvas2 = domCache.getCanvas("canvas2");

      // Invalidate only canvas1
      domCache.invalidate("canvas1");

      // canvas2 should still be cached
      const canvas2Again = domCache.getCanvas("canvas2");
      expect(canvas2Again).toBe(canvas2);
    });

    it("should handle invalidation of non-cached canvas", () => {
      // Should not throw error
      expect(() => {
        domCache.invalidate("non-existent");
      }).not.toThrow();
    });
  });

  describe("clear", () => {
    it("should clear all cached canvases", () => {
      // Create and cache multiple canvases
      const canvas1Element = document.createElement("div");
      canvas1Element.id = "canvas1";
      document.body.appendChild(canvas1Element);

      const canvas2Element = document.createElement("div");
      canvas2Element.id = "canvas2";
      document.body.appendChild(canvas2Element);

      domCache.getCanvas("canvas1");
      domCache.getCanvas("canvas2");

      // Clear cache
      domCache.clear();

      // Both should be re-queried from DOM
      const canvas1 = domCache.getCanvas("canvas1");
      const canvas2 = domCache.getCanvas("canvas2");

      expect(canvas1).toBe(canvas1Element);
      expect(canvas2).toBe(canvas2Element);
    });

    it("should handle clearing empty cache", () => {
      expect(() => {
        domCache.clear();
      }).not.toThrow();
    });
  });

  describe("Performance Benefits", () => {
    it("should reduce repeated getElementById calls", () => {
      // Create canvas
      const canvasElement = document.createElement("div");
      canvasElement.id = "canvas1";
      document.body.appendChild(canvasElement);

      // Spy on getElementById
      const getElementByIdSpy = jest.spyOn(document, "getElementById");

      // First call - should query DOM
      domCache.getCanvas("canvas1");
      expect(getElementByIdSpy).toHaveBeenCalledTimes(1);

      // Multiple subsequent calls - should NOT query DOM
      domCache.getCanvas("canvas1");
      domCache.getCanvas("canvas1");
      domCache.getCanvas("canvas1");
      expect(getElementByIdSpy).toHaveBeenCalledTimes(1); // Still only 1 call

      // Clean up spy
      getElementByIdSpy.mockRestore();
    });
  });

  describe("Multiple Instance Independence", () => {
    it("should allow multiple independent cache instances", () => {
      // Create two separate cache instances
      const cache1 = new DOMCache();
      const cache2 = new DOMCache();

      // Create canvas elements
      const canvas1Element = document.createElement("div");
      canvas1Element.id = "canvas1";
      document.body.appendChild(canvas1Element);

      const canvas2Element = document.createElement("div");
      canvas2Element.id = "canvas2";
      document.body.appendChild(canvas2Element);

      // Cache canvas1 in cache1
      cache1.getCanvas("canvas1");

      // Cache canvas2 in cache2
      cache2.getCanvas("canvas2");

      // Verify each instance has its own cache
      // cache1 should NOT have canvas2 cached
      const getElementByIdSpy = jest.spyOn(document, "getElementById");

      cache1.getCanvas("canvas2"); // Should query DOM (not cached in cache1)
      expect(getElementByIdSpy).toHaveBeenCalledTimes(1);

      cache2.getCanvas("canvas1"); // Should query DOM (not cached in cache2)
      expect(getElementByIdSpy).toHaveBeenCalledTimes(2);

      // But repeated calls within same instance should use cache
      cache1.getCanvas("canvas2"); // Should NOT query DOM (now cached)
      expect(getElementByIdSpy).toHaveBeenCalledTimes(2); // Still 2

      cache2.getCanvas("canvas1"); // Should NOT query DOM (now cached)
      expect(getElementByIdSpy).toHaveBeenCalledTimes(2); // Still 2

      getElementByIdSpy.mockRestore();
    });

    it("should not share cache between instances", () => {
      const cache1 = new DOMCache();
      const cache2 = new DOMCache();

      // Create canvas
      const canvasElement = document.createElement("div");
      canvasElement.id = "canvas1";
      document.body.appendChild(canvasElement);

      // Cache in cache1
      cache1.getCanvas("canvas1");

      // Clear cache1
      cache1.clear();

      // Cache in cache2
      cache2.getCanvas("canvas1");

      // Verify cache2 still has cached value after cache1 was cleared
      const getElementByIdSpy = jest.spyOn(document, "getElementById");

      cache2.getCanvas("canvas1"); // Should use cache (cache2 not cleared)
      expect(getElementByIdSpy).toHaveBeenCalledTimes(0);

      cache1.getCanvas("canvas1"); // Should query DOM (cache1 was cleared)
      expect(getElementByIdSpy).toHaveBeenCalledTimes(1);

      getElementByIdSpy.mockRestore();
    });

    it("should support invalidation per instance", () => {
      const cache1 = new DOMCache();
      const cache2 = new DOMCache();

      // Create canvas
      const canvasElement = document.createElement("div");
      canvasElement.id = "canvas1";
      document.body.appendChild(canvasElement);

      // Cache in both instances
      cache1.getCanvas("canvas1");
      cache2.getCanvas("canvas1");

      // Invalidate in cache1 only
      cache1.invalidate("canvas1");

      // Spy on getElementById
      const getElementByIdSpy = jest.spyOn(document, "getElementById");

      // cache1 should re-query DOM (invalidated)
      cache1.getCanvas("canvas1");
      expect(getElementByIdSpy).toHaveBeenCalledTimes(1);

      // cache2 should use cache (not invalidated)
      cache2.getCanvas("canvas1");
      expect(getElementByIdSpy).toHaveBeenCalledTimes(1); // Still 1

      getElementByIdSpy.mockRestore();
    });
  });
});
