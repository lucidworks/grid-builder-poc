// Mock IntersectionObserver BEFORE importing virtualRenderer
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();
let mockCallback: any;
let mockOptions: any;

(global as any).IntersectionObserver = jest.fn((callback, options) => {
  mockCallback = callback;
  mockOptions = options;
  return {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
    root: null,
    rootMargin: "200px",
    thresholds: [0.01],
    takeRecords: jest.fn(),
  };
});

import { VirtualRendererService, VisibilityCallback } from "./virtual-renderer";

describe("virtual-renderer", () => {
  let service: VirtualRendererService;
  let mockElement: HTMLElement;
  let callback: jest.Mock<VisibilityCallback>;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Create service
    service = new VirtualRendererService();

    // Create mock element
    mockElement = document.createElement("div");
    mockElement.id = "test-element";

    // Create mock callback
    callback = jest.fn();
  });

  afterEach(() => {
    // Clean up
    service.destroy();
  });

  describe("constructor", () => {
    it("should initialize IntersectionObserver with correct options", () => {
      expect(mockOptions).toEqual({
        rootMargin: "200px",
        threshold: [0, 0.01],
      });
    });
  });

  describe("observe", () => {
    it("should observe element and store callback", () => {
      service.observe(mockElement, "test-element", callback);

      expect(mockObserve).toHaveBeenCalledWith(mockElement);
    });

    it("should handle null element gracefully", () => {
      expect(() => {
        service.observe(null as any, "test-element", callback);
      }).not.toThrow();

      expect(mockObserve).not.toHaveBeenCalled();
    });

    it("should store callback for element ID", () => {
      service.observe(mockElement, "test-element", callback);

      // Simulate intersection observer callback
      const entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: mockElement,
          isIntersecting: true,
        },
      ];

      mockCallback(entries);

      expect(callback).toHaveBeenCalledWith(true);
    });

    it("should handle multiple elements", () => {
      const element2 = document.createElement("div");
      element2.id = "test-element-2";
      const callback2 = jest.fn();

      service.observe(mockElement, "test-element", callback);
      service.observe(element2, "test-element-2", callback2);

      expect(mockObserve).toHaveBeenCalledTimes(2);
      expect(mockObserve).toHaveBeenCalledWith(mockElement);
      expect(mockObserve).toHaveBeenCalledWith(element2);
    });
  });

  describe("unobserve", () => {
    beforeEach(() => {
      service.observe(mockElement, "test-element", callback);
      // Clear the call from observe() sync callback
      callback.mockClear();
    });

    it("should unobserve element and remove callback", () => {
      service.unobserve(mockElement, "test-element");

      expect(mockUnobserve).toHaveBeenCalledWith(mockElement);

      // Callback should not be called after unobserve
      const entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: mockElement,
          isIntersecting: true,
        },
      ];

      mockCallback(entries);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle null element gracefully", () => {
      expect(() => {
        service.unobserve(null as any, "test-element");
      }).not.toThrow();
    });

    it("should handle unobserving non-observed element", () => {
      const element2 = document.createElement("div");
      element2.id = "test-element-2";

      expect(() => {
        service.unobserve(element2, "test-element-2");
      }).not.toThrow();
    });
  });

  describe("destroy", () => {
    beforeEach(() => {
      service.observe(mockElement, "test-element", callback);
      // Clear the call from observe() sync callback
      callback.mockClear();
    });

    it("should disconnect observer", () => {
      service.destroy();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("should clear all observed elements", () => {
      service.destroy();

      // Callback should not be called after destroy
      const entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: mockElement,
          isIntersecting: true,
        },
      ];

      mockCallback(entries);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle multiple destroy calls", () => {
      service.destroy();

      expect(() => {
        service.destroy();
      }).not.toThrow();
    });
  });

  describe("Intersection Callbacks", () => {
    beforeEach(() => {
      service.observe(mockElement, "test-element", callback);
      // Clear the call from observe() sync callback
      callback.mockClear();
    });

    it("should call callback with true when element becomes visible", () => {
      const entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: mockElement,
          isIntersecting: true,
        },
      ];

      mockCallback(entries);

      expect(callback).toHaveBeenCalledWith(true);
    });

    it("should call callback with false when element becomes invisible", () => {
      const entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: mockElement,
          isIntersecting: false,
        },
      ];

      mockCallback(entries);

      expect(callback).toHaveBeenCalledWith(false);
    });

    it("should handle multiple intersection changes", () => {
      // Becomes visible
      let entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: mockElement,
          isIntersecting: true,
        },
      ];

      mockCallback(entries);
      expect(callback).toHaveBeenCalledWith(true);

      // Becomes invisible
      entries = [
        {
          target: mockElement,
          isIntersecting: false,
        },
      ];

      mockCallback(entries);
      expect(callback).toHaveBeenCalledWith(false);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple elements in single callback", () => {
      const element2 = document.createElement("div");
      element2.id = "test-element-2";
      const callback2 = jest.fn();

      service.observe(element2, "test-element-2", callback2);

      const entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: mockElement,
          isIntersecting: true,
        },
        {
          target: element2,
          isIntersecting: false,
        },
      ];

      mockCallback(entries);

      expect(callback).toHaveBeenCalledWith(true);
      expect(callback2).toHaveBeenCalledWith(false);
    });

    it("should not call callback for unknown element", () => {
      const unknownElement = document.createElement("div");
      unknownElement.id = "unknown-element";

      const entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: unknownElement,
          isIntersecting: true,
        },
      ];

      expect(() => {
        mockCallback(entries);
      }).not.toThrow();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Performance Benefits", () => {
    it("should use 200px rootMargin for pre-rendering", () => {
      const options = mockOptions;
      expect(options.rootMargin).toBe("200px");
    });

    it("should trigger at 1% visibility threshold", () => {
      const options = mockOptions;
      expect(options.threshold).toEqual([0, 0.01]);
    });

    it("should support lazy loading pattern", () => {
      let isVisible = false;

      // Mock getBoundingClientRect to make element appear outside viewport
      // This prevents the synchronous callback from firing
      jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
        top: 2000,  // Far below viewport
        bottom: 2100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 2000,
        toJSON: () => ({})
      } as DOMRect);

      service.observe(mockElement, "test-element", (visible) => {
        isVisible = visible;
      });

      // Initially not visible (element is outside viewport)
      expect(isVisible).toBe(false);

      // Becomes visible
      const entries: Partial<IntersectionObserverEntry>[] = [
        {
          target: mockElement,
          isIntersecting: true,
        },
      ];

      mockCallback(entries);

      expect(isVisible).toBe(true);
    });
  });
});
