/**
 * Component Registry Tests
 * =========================
 *
 * Comprehensive test coverage for ComponentRegistry service.
 * Tests registration, lookup, validation, and edge cases.
 */

import { ComponentRegistry } from "./component-registry";
import { ComponentDefinition } from "../types/component-definition";

describe("ComponentRegistry", () => {
  // Mock component definitions for testing
  const headerDef: ComponentDefinition = {
    type: "header",
    name: "Header",
    icon: "📄",
    defaultSize: { width: 20, height: 6 },
    render: jest.fn(),
    renderDragClone: jest.fn(),
  };

  const galleryDef: ComponentDefinition = {
    type: "gallery",
    name: "Gallery",
    icon: "🖼️",
    defaultSize: { width: 30, height: 20 },
    render: jest.fn(),
    renderDragClone: jest.fn(),
  };

  const textDef: ComponentDefinition = {
    type: "text",
    name: "Text Block",
    icon: "📝",
    defaultSize: { width: 20, height: 8 },
    render: jest.fn(),
    renderDragClone: jest.fn(),
  };

  describe("constructor", () => {
    it("should create empty registry when no initial definitions provided", () => {
      const registry = new ComponentRegistry();

      expect(registry.size()).toBe(0);
      expect(registry.getTypes()).toEqual([]);
      expect(registry.getAll()).toEqual([]);
    });

    it("should register initial definitions when provided", () => {
      const registry = new ComponentRegistry([headerDef, galleryDef]);

      expect(registry.size()).toBe(2);
      expect(registry.has("header")).toBe(true);
      expect(registry.has("gallery")).toBe(true);
    });

    it("should support empty array as initial definitions", () => {
      const registry = new ComponentRegistry([]);

      expect(registry.size()).toBe(0);
      expect(registry.getTypes()).toEqual([]);
    });
  });

  describe("register", () => {
    it("should register a component definition", () => {
      const registry = new ComponentRegistry();

      registry.register(headerDef);

      expect(registry.size()).toBe(1);
      expect(registry.has("header")).toBe(true);
      expect(registry.get("header")).toEqual(headerDef);
    });

    it("should overwrite existing definition with same type", () => {
      const registry = new ComponentRegistry();
      const headerDef2: ComponentDefinition = {
        ...headerDef,
        name: "Updated Header",
      };

      registry.register(headerDef);
      registry.register(headerDef2);

      expect(registry.size()).toBe(1);
      expect(registry.get("header")?.name).toBe("Updated Header");
    });

    it("should throw error for invalid component type (empty string)", () => {
      const registry = new ComponentRegistry();
      const invalidDef = { ...headerDef, type: "" };

      expect(() => registry.register(invalidDef as any)).toThrow(
        "Component definition must have a valid type string",
      );
    });

    it("should throw error for invalid component type (non-string)", () => {
      const registry = new ComponentRegistry();
      const invalidDef = { ...headerDef, type: 123 };

      expect(() => registry.register(invalidDef as any)).toThrow(
        "Component definition must have a valid type string",
      );
    });

    it("should throw error for missing component type", () => {
      const registry = new ComponentRegistry();
      const invalidDef = { ...headerDef };
      delete (invalidDef as any).type;

      expect(() => registry.register(invalidDef as any)).toThrow(
        "Component definition must have a valid type string",
      );
    });
  });

  describe("registerAll", () => {
    it("should register multiple component definitions", () => {
      const registry = new ComponentRegistry();

      registry.registerAll([headerDef, galleryDef, textDef]);

      expect(registry.size()).toBe(3);
      expect(registry.has("header")).toBe(true);
      expect(registry.has("gallery")).toBe(true);
      expect(registry.has("text")).toBe(true);
    });

    it("should handle empty array", () => {
      const registry = new ComponentRegistry();

      registry.registerAll([]);

      expect(registry.size()).toBe(0);
    });

    it("should overwrite existing definitions", () => {
      const registry = new ComponentRegistry([headerDef]);
      const headerDef2: ComponentDefinition = {
        ...headerDef,
        name: "Updated Header",
      };

      registry.registerAll([headerDef2, galleryDef]);

      expect(registry.size()).toBe(2);
      expect(registry.get("header")?.name).toBe("Updated Header");
    });
  });

  describe("get", () => {
    it("should retrieve registered component definition", () => {
      const registry = new ComponentRegistry([headerDef]);

      const definition = registry.get("header");

      expect(definition).toEqual(headerDef);
    });

    it("should return undefined for unregistered component type", () => {
      const registry = new ComponentRegistry();

      const definition = registry.get("nonexistent");

      expect(definition).toBeUndefined();
    });

    it("should return correct definition after multiple registrations", () => {
      const registry = new ComponentRegistry();

      registry.register(headerDef);
      registry.register(galleryDef);
      registry.register(textDef);

      expect(registry.get("header")).toEqual(headerDef);
      expect(registry.get("gallery")).toEqual(galleryDef);
      expect(registry.get("text")).toEqual(textDef);
    });
  });

  describe("has", () => {
    it("should return true for registered component type", () => {
      const registry = new ComponentRegistry([headerDef]);

      expect(registry.has("header")).toBe(true);
    });

    it("should return false for unregistered component type", () => {
      const registry = new ComponentRegistry();

      expect(registry.has("nonexistent")).toBe(false);
    });

    it("should return true after registration", () => {
      const registry = new ComponentRegistry();

      expect(registry.has("header")).toBe(false);

      registry.register(headerDef);

      expect(registry.has("header")).toBe(true);
    });

    it("should return false after unregistration", () => {
      const registry = new ComponentRegistry([headerDef]);

      expect(registry.has("header")).toBe(true);

      registry.unregister("header");

      expect(registry.has("header")).toBe(false);
    });
  });

  describe("getTypes", () => {
    it("should return empty array for empty registry", () => {
      const registry = new ComponentRegistry();

      expect(registry.getTypes()).toEqual([]);
    });

    it("should return all registered component types", () => {
      const registry = new ComponentRegistry([headerDef, galleryDef, textDef]);

      const types = registry.getTypes();

      expect(types).toHaveLength(3);
      expect(types).toContain("header");
      expect(types).toContain("gallery");
      expect(types).toContain("text");
    });

    it("should update after registration", () => {
      const registry = new ComponentRegistry();

      expect(registry.getTypes()).toEqual([]);

      registry.register(headerDef);

      expect(registry.getTypes()).toEqual(["header"]);

      registry.register(galleryDef);

      const types = registry.getTypes();
      expect(types).toHaveLength(2);
      expect(types).toContain("header");
      expect(types).toContain("gallery");
    });
  });

  describe("getAll", () => {
    it("should return empty array for empty registry", () => {
      const registry = new ComponentRegistry();

      expect(registry.getAll()).toEqual([]);
    });

    it("should return all registered component definitions", () => {
      const registry = new ComponentRegistry([headerDef, galleryDef, textDef]);

      const definitions = registry.getAll();

      expect(definitions).toHaveLength(3);
      expect(definitions).toContainEqual(headerDef);
      expect(definitions).toContainEqual(galleryDef);
      expect(definitions).toContainEqual(textDef);
    });

    it("should update after registration", () => {
      const registry = new ComponentRegistry();

      expect(registry.getAll()).toEqual([]);

      registry.register(headerDef);

      expect(registry.getAll()).toEqual([headerDef]);

      registry.register(galleryDef);

      const definitions = registry.getAll();
      expect(definitions).toHaveLength(2);
      expect(definitions).toContainEqual(headerDef);
      expect(definitions).toContainEqual(galleryDef);
    });
  });

  describe("unregister", () => {
    it("should remove registered component definition", () => {
      const registry = new ComponentRegistry([headerDef, galleryDef]);

      const removed = registry.unregister("header");

      expect(removed).toBe(true);
      expect(registry.size()).toBe(1);
      expect(registry.has("header")).toBe(false);
      expect(registry.has("gallery")).toBe(true);
    });

    it("should return false when removing nonexistent component", () => {
      const registry = new ComponentRegistry();

      const removed = registry.unregister("nonexistent");

      expect(removed).toBe(false);
      expect(registry.size()).toBe(0);
    });

    it("should handle multiple unregister calls", () => {
      const registry = new ComponentRegistry([headerDef, galleryDef, textDef]);

      registry.unregister("header");
      registry.unregister("gallery");

      expect(registry.size()).toBe(1);
      expect(registry.has("text")).toBe(true);
    });
  });

  describe("clear", () => {
    it("should remove all component definitions", () => {
      const registry = new ComponentRegistry([headerDef, galleryDef, textDef]);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.getTypes()).toEqual([]);
      expect(registry.getAll()).toEqual([]);
    });

    it("should work on empty registry", () => {
      const registry = new ComponentRegistry();

      registry.clear();

      expect(registry.size()).toBe(0);
    });

    it("should allow re-registration after clear", () => {
      const registry = new ComponentRegistry([headerDef]);

      registry.clear();
      registry.register(galleryDef);

      expect(registry.size()).toBe(1);
      expect(registry.has("gallery")).toBe(true);
      expect(registry.has("header")).toBe(false);
    });
  });

  describe("size", () => {
    it("should return 0 for empty registry", () => {
      const registry = new ComponentRegistry();

      expect(registry.size()).toBe(0);
    });

    it("should return correct count after registrations", () => {
      const registry = new ComponentRegistry();

      expect(registry.size()).toBe(0);

      registry.register(headerDef);
      expect(registry.size()).toBe(1);

      registry.register(galleryDef);
      expect(registry.size()).toBe(2);

      registry.register(textDef);
      expect(registry.size()).toBe(3);
    });

    it("should decrease after unregister", () => {
      const registry = new ComponentRegistry([headerDef, galleryDef]);

      expect(registry.size()).toBe(2);

      registry.unregister("header");

      expect(registry.size()).toBe(1);
    });

    it("should not increase when overwriting existing definition", () => {
      const registry = new ComponentRegistry([headerDef]);
      const headerDef2: ComponentDefinition = {
        ...headerDef,
        name: "Updated",
      };

      registry.register(headerDef2);

      expect(registry.size()).toBe(1);
    });
  });

  describe("instance isolation", () => {
    it("should maintain separate state for different instances", () => {
      const registry1 = new ComponentRegistry([headerDef]);
      const registry2 = new ComponentRegistry([galleryDef]);

      expect(registry1.has("header")).toBe(true);
      expect(registry1.has("gallery")).toBe(false);
      expect(registry2.has("header")).toBe(false);
      expect(registry2.has("gallery")).toBe(true);
    });

    it("should not share state between instances", () => {
      const registry1 = new ComponentRegistry();
      const registry2 = new ComponentRegistry();

      registry1.register(headerDef);

      expect(registry1.has("header")).toBe(true);
      expect(registry2.has("header")).toBe(false);
    });

    it("should support independent modifications", () => {
      const registry1 = new ComponentRegistry([headerDef, galleryDef]);
      const registry2 = new ComponentRegistry([headerDef, galleryDef]);

      registry1.unregister("header");

      expect(registry1.size()).toBe(1);
      expect(registry2.size()).toBe(2);
    });
  });
});
