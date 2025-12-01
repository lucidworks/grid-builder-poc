import {
  addItemToCanvas,
  deselectItem,
  generateItemId,
  getItem,
  gridState,
  moveItemToCanvas,
  removeItemFromCanvas,
  reset,
  selectItem,
  updateItem,
  addItemsBatch,
  deleteItemsBatch,
  updateItemsBatch,
  setActiveCanvas,
  clearActiveCanvas,
} from "./state-manager";

describe("state-manager", () => {
  beforeEach(() => {
    // Reset state before each test
    reset();

    // Create test canvases (library now starts empty in Phase 2)
    gridState.canvases = {
      canvas1: { items: [], zIndexCounter: 0 },
      canvas2: { items: [], zIndexCounter: 0 },
      canvas3: { items: [], zIndexCounter: 0 },
    };
  });

  describe("Initial State", () => {
    it("should start with empty canvases after reset", () => {
      // After reset and setup, we should have 3 empty canvases
      expect(Object.keys(gridState.canvases)).toHaveLength(3);
      expect(gridState.canvases.canvas1).toBeDefined();
      expect(gridState.canvases.canvas2).toBeDefined();
      expect(gridState.canvases.canvas3).toBeDefined();
    });

    it("should have desktop as default viewport", () => {
      expect(gridState.currentViewport).toBe("desktop");
    });

    it("should show grid by default", () => {
      expect(gridState.showGrid).toBe(true);
    });

    it("should have no item selected", () => {
      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();
    });

    it("should have no active canvas", () => {
      expect(gridState.activeCanvasId).toBeNull();
    });

    it("should have empty items arrays (library starts empty)", () => {
      expect(gridState.canvases.canvas1.items).toHaveLength(0); // Library starts empty
      expect(gridState.canvases.canvas2.items).toHaveLength(0);
      expect(gridState.canvases.canvas3.items).toHaveLength(0);
    });
  });

  describe("generateItemId", () => {
    it("should generate unique sequential IDs starting from 1", () => {
      const id1 = generateItemId();
      const id2 = generateItemId();
      const id3 = generateItemId();

      expect(id1).toBe("item-1"); // Library starts at 1 (empty state)
      expect(id2).toBe("item-2");
      expect(id3).toBe("item-3");
    });
  });

  describe("addItemToCanvas", () => {
    it("should add item to canvas", () => {
      const item = {
        id: "test-1",
        canvasId: "canvas1",
        type: "text",
        name: "Test Item",
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
      };

      addItemToCanvas("canvas1", item);

      expect(gridState.canvases.canvas1.items).toHaveLength(1); // Empty + 1 new
      expect(gridState.canvases.canvas1.items[0]).toEqual(item); // New item is at index 0
    });

    it("should not add item to non-existent canvas", () => {
      const item = {
        id: "test-1",
        canvasId: "canvas99",
        type: "text",
        name: "Test Item",
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
      };

      addItemToCanvas("canvas99", item);

      // Should not throw error, just silently fail (canvas1 should remain empty)
      expect(gridState.canvases.canvas1.items).toHaveLength(0);
    });
  });

  describe("removeItemFromCanvas", () => {
    beforeEach(() => {
      // Setup test item
      gridState.canvases.canvas1.items = [];

      const item = {
        id: "test-1",
        canvasId: "canvas1",
        type: "text",
        name: "Test Item",
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
      };
      addItemToCanvas("canvas1", item);
    });

    it("should remove item from canvas", () => {
      expect(gridState.canvases.canvas1.items).toHaveLength(1);

      removeItemFromCanvas("canvas1", "test-1");

      expect(gridState.canvases.canvas1.items).toHaveLength(0);
    });

    it("should not affect other items", () => {
      const item2 = {
        id: "test-2",
        canvasId: "canvas1",
        type: "text",
        name: "Test Item 2",
        layouts: {
          desktop: { x: 10, y: 0, width: 10, height: 6 },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 2,
      };
      addItemToCanvas("canvas1", item2);

      removeItemFromCanvas("canvas1", "test-1");

      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas1.items[0].id).toBe("test-2");
    });

    it("should handle removing non-existent item", () => {
      removeItemFromCanvas("canvas1", "non-existent");

      expect(gridState.canvases.canvas1.items).toHaveLength(1);
    });
  });

  describe("updateItem", () => {
    beforeEach(() => {
      // Setup test item
      gridState.canvases.canvas1.items = [];

      const item = {
        id: "test-1",
        canvasId: "canvas1",
        type: "text",
        name: "Test Item",
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
      };
      addItemToCanvas("canvas1", item);
    });

    it("should update item properties", () => {
      updateItem("canvas1", "test-1", { name: "Updated Name" });

      const item = gridState.canvases.canvas1.items[0];
      expect(item.name).toBe("Updated Name");
    });

    it("should update nested properties", () => {
      updateItem("canvas1", "test-1", {
        layouts: {
          desktop: { x: 5, y: 5, width: 15, height: 10 },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
      });

      const item = gridState.canvases.canvas1.items[0];
      expect(item.layouts.desktop.x).toBe(5);
      expect(item.layouts.desktop.width).toBe(15);
    });

    it("should handle non-existent item", () => {
      updateItem("canvas1", "non-existent", { name: "Updated" });

      // Should not throw error
      expect(gridState.canvases.canvas1.items[0].name).toBe("Test Item");
    });
  });

  describe("getItem", () => {
    beforeEach(() => {
      // Setup test items
      gridState.canvases.canvas1.items = [];

      const item = {
        id: "test-1",
        canvasId: "canvas1",
        type: "text",
        name: "Test Item",
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
      };
      addItemToCanvas("canvas1", item);
    });

    it("should get item by id", () => {
      const item = getItem("canvas1", "test-1");

      expect(item).toBeDefined();
      expect(item?.id).toBe("test-1");
      expect(item?.name).toBe("Test Item");
    });

    it("should return null for non-existent item", () => {
      const item = getItem("canvas1", "non-existent");

      expect(item).toBeNull();
    });

    it("should return null for non-existent canvas", () => {
      const item = getItem("canvas99", "test-1");

      expect(item).toBeNull();
    });
  });

  describe("moveItemToCanvas", () => {
    beforeEach(() => {
      // Setup test items
      gridState.canvases.canvas1.items = [];
      gridState.canvases.canvas2.items = [];

      const item = {
        id: "test-1",
        canvasId: "canvas1",
        type: "text",
        name: "Test Item",
        layouts: {
          desktop: { x: 0, y: 0, width: 10, height: 6 },
          mobile: {
            x: null,
            y: null,
            width: null,
            height: null,
            customized: false,
          },
        },
        zIndex: 1,
      };
      addItemToCanvas("canvas1", item);
    });

    it("should move item to different canvas", () => {
      moveItemToCanvas("canvas1", "canvas2", "test-1");

      expect(gridState.canvases.canvas1.items).toHaveLength(0);
      expect(gridState.canvases.canvas2.items).toHaveLength(1);
      expect(gridState.canvases.canvas2.items[0].id).toBe("test-1");
    });

    it("should update item canvasId", () => {
      moveItemToCanvas("canvas1", "canvas2", "test-1");

      const item = gridState.canvases.canvas2.items[0];
      expect(item.canvasId).toBe("canvas2");
    });

    it("should handle non-existent item", () => {
      moveItemToCanvas("canvas1", "canvas2", "non-existent");

      // Should not throw error
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
      expect(gridState.canvases.canvas2.items).toHaveLength(0);
    });

    it("should handle non-existent canvas", () => {
      moveItemToCanvas("canvas99", "canvas2", "test-1");

      // Should not throw error
      expect(gridState.canvases.canvas1.items).toHaveLength(1);
    });
  });

  describe("selectItem", () => {
    it("should select an item", () => {
      selectItem("test-1", "canvas1");

      expect(gridState.selectedItemId).toBe("test-1");
      expect(gridState.selectedCanvasId).toBe("canvas1");
    });
  });

  describe("deselectItem", () => {
    it("should deselect item", () => {
      selectItem("test-1", "canvas1");
      deselectItem();

      expect(gridState.selectedItemId).toBeNull();
      expect(gridState.selectedCanvasId).toBeNull();
    });
  });

  describe("Batch Operations", () => {
    describe("addItemsBatch", () => {
      it("should add multiple items with single state update", () => {
        const items = [
          {
            canvasId: "canvas1",
            type: "header",
            name: "Header",
            layouts: {
              desktop: { x: 0, y: 0, width: 20, height: 8 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
          },
          {
            canvasId: "canvas1",
            type: "text",
            name: "Text",
            layouts: {
              desktop: { x: 0, y: 10, width: 20, height: 10 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
          },
          {
            canvasId: "canvas2",
            type: "button",
            name: "Button",
            layouts: {
              desktop: { x: 5, y: 5, width: 10, height: 4 },
              mobile: {
                x: null,
                y: null,
                width: null,
                height: null,
                customized: false,
              },
            },
          },
        ];

        const itemIds = addItemsBatch(items);

        expect(itemIds).toHaveLength(3);
        expect(gridState.canvases.canvas1.items).toHaveLength(2);
        expect(gridState.canvases.canvas2.items).toHaveLength(1);
      });

      it("should assign proper z-index to each item", () => {
        const items = [
          {
            canvasId: "canvas1",
            type: "header",
            name: "Header",
          },
          {
            canvasId: "canvas1",
            type: "text",
            name: "Text",
          },
        ];

        const itemIds = addItemsBatch(items);
        const item1 = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[0],
        );
        const item2 = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[1],
        );

        expect(item2!.zIndex).toBeGreaterThan(item1!.zIndex);
      });

      it("should apply default layouts if not provided", () => {
        const items = [{ canvasId: "canvas1", type: "header", name: "Header" }];
        const itemIds = addItemsBatch(items);
        const item = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[0],
        );

        expect(item!.layouts.desktop).toBeDefined();
        expect(item!.layouts.mobile).toBeDefined();
      });

      it("should handle invalid canvas gracefully", () => {
        const items = [
          { canvasId: "invalid-canvas", type: "header", name: "Header" },
        ];

        const itemIds = addItemsBatch(items);

        expect(itemIds).toHaveLength(0); // No items added
      });

      it("should return array of created item IDs", () => {
        const items = [
          { canvasId: "canvas1", type: "header", name: "Header" },
          { canvasId: "canvas1", type: "text", name: "Text" },
        ];

        const itemIds = addItemsBatch(items);

        expect(itemIds).toHaveLength(2);
        expect(itemIds[0]).toMatch(/^item-\d+$/);
        expect(itemIds[1]).toMatch(/^item-\d+$/);
      });
    });

    describe("deleteItemsBatch", () => {
      let itemIds: string[];

      beforeEach(() => {
        // Add test items
        const items = [
          { canvasId: "canvas1", type: "header", name: "Header" },
          { canvasId: "canvas1", type: "text", name: "Text" },
          { canvasId: "canvas2", type: "button", name: "Button" },
        ];
        itemIds = addItemsBatch(items);
      });

      it("should delete multiple items with single state update", () => {
        expect(gridState.canvases.canvas1.items).toHaveLength(2);
        expect(gridState.canvases.canvas2.items).toHaveLength(1);

        deleteItemsBatch([itemIds[0], itemIds[1]]);

        expect(gridState.canvases.canvas1.items).toHaveLength(0);
        expect(gridState.canvases.canvas2.items).toHaveLength(1); // Unchanged
      });

      it("should handle missing IDs gracefully", () => {
        expect(() => {
          deleteItemsBatch(["nonexistent-id-1", "nonexistent-id-2"]);
        }).not.toThrow();

        expect(gridState.canvases.canvas1.items).toHaveLength(2); // Unchanged
      });

      it("should delete items from multiple canvases", () => {
        deleteItemsBatch([itemIds[0], itemIds[2]]);

        expect(gridState.canvases.canvas1.items).toHaveLength(1); // One deleted
        expect(gridState.canvases.canvas2.items).toHaveLength(0); // One deleted
      });

      it("should handle empty array", () => {
        expect(() => {
          deleteItemsBatch([]);
        }).not.toThrow();

        expect(gridState.canvases.canvas1.items).toHaveLength(2);
        expect(gridState.canvases.canvas2.items).toHaveLength(1);
      });

      it("should handle partial matches (some valid, some invalid IDs)", () => {
        deleteItemsBatch([itemIds[0], "invalid-id", itemIds[1]]);

        expect(gridState.canvases.canvas1.items).toHaveLength(0); // Both valid ones deleted
        expect(gridState.canvases.canvas2.items).toHaveLength(1); // Unchanged
      });
    });

    describe("updateItemsBatch", () => {
      let itemIds: string[];

      beforeEach(() => {
        // Add test items with configs
        const items = [
          {
            canvasId: "canvas1",
            type: "header",
            name: "Header",
            config: { text: "Old Header", color: "blue" },
          },
          {
            canvasId: "canvas1",
            type: "text",
            name: "Text",
            config: { content: "Old Text", fontSize: 14 },
          },
        ];
        itemIds = addItemsBatch(items);
      });

      it("should update multiple items with single state update", () => {
        updateItemsBatch([
          {
            itemId: itemIds[0],
            canvasId: "canvas1",
            updates: { config: { text: "New Header" } },
          },
          {
            itemId: itemIds[1],
            canvasId: "canvas1",
            updates: { config: { content: "New Text" } },
          },
        ]);

        const item1 = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[0],
        );
        const item2 = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[1],
        );

        expect(item1!.config!.text).toBe("New Header");
        expect(item2!.config!.content).toBe("New Text");
      });

      it("should update config when caller provides merged config", () => {
        // Get current item to merge config (this is what the API does)
        const currentItem = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[0],
        );
        const mergedConfig = { ...currentItem!.config, text: "New Header" };

        updateItemsBatch([
          {
            itemId: itemIds[0],
            canvasId: "canvas1",
            updates: { config: mergedConfig },
          },
        ]);

        const item = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[0],
        );

        // Text updated, color preserved (because we merged before calling updateItemsBatch)
        expect(item!.config!.text).toBe("New Header");
        expect(item!.config!.color).toBe("blue");
      });

      it("should handle invalid item IDs gracefully", () => {
        expect(() => {
          updateItemsBatch([
            {
              itemId: "invalid-id",
              canvasId: "canvas1",
              updates: { name: "Updated" },
            },
          ]);
        }).not.toThrow();

        const item = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[0],
        );
        expect(item!.name).toBe("Header"); // Unchanged
      });

      it("should handle invalid canvas IDs gracefully", () => {
        expect(() => {
          updateItemsBatch([
            {
              itemId: itemIds[0],
              canvasId: "invalid-canvas",
              updates: { name: "Updated" },
            },
          ]);
        }).not.toThrow();

        const item = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[0],
        );
        expect(item!.name).toBe("Header"); // Unchanged
      });

      it("should update multiple properties at once", () => {
        updateItemsBatch([
          {
            itemId: itemIds[0],
            canvasId: "canvas1",
            updates: {
              name: "Updated Header",
              config: { text: "New Text" },
            },
          },
        ]);

        const item = gridState.canvases.canvas1.items.find(
          (i) => i.id === itemIds[0],
        );

        expect(item!.name).toBe("Updated Header");
        expect(item!.config!.text).toBe("New Text");
      });

      it("should handle empty updates array", () => {
        expect(() => {
          updateItemsBatch([]);
        }).not.toThrow();

        expect(gridState.canvases.canvas1.items).toHaveLength(2);
      });
    });
  });

  describe("Active Canvas State Management", () => {
    it("should initialize activeCanvasId to null", () => {
      expect(gridState.activeCanvasId).toBeNull();
    });

    it("should set active canvas via setActiveCanvas()", () => {
      setActiveCanvas("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas1");
    });

    it("should update active canvas when calling setActiveCanvas() multiple times", () => {
      setActiveCanvas("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas1");

      setActiveCanvas("canvas2");
      expect(gridState.activeCanvasId).toBe("canvas2");
    });

    it("should allow setting same canvas as active multiple times", () => {
      setActiveCanvas("canvas1");
      setActiveCanvas("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas1");
    });

    it("should clear active canvas via clearActiveCanvas()", () => {
      setActiveCanvas("canvas1");
      clearActiveCanvas();
      expect(gridState.activeCanvasId).toBeNull();
    });

    it("should handle clearActiveCanvas() when no canvas is active", () => {
      expect(gridState.activeCanvasId).toBeNull();
      expect(() => clearActiveCanvas()).not.toThrow();
      expect(gridState.activeCanvasId).toBeNull();
    });

    it("should reset activeCanvasId when reset() is called", () => {
      setActiveCanvas("canvas2");
      expect(gridState.activeCanvasId).toBe("canvas2");

      reset();

      expect(gridState.activeCanvasId).toBeNull();
    });

    it("should handle switching between multiple canvases", () => {
      setActiveCanvas("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas1");

      setActiveCanvas("canvas2");
      expect(gridState.activeCanvasId).toBe("canvas2");

      setActiveCanvas("canvas3");
      expect(gridState.activeCanvasId).toBe("canvas3");

      setActiveCanvas("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas1");
    });

    it("should allow activeCanvasId to be set independently of selectedCanvasId", () => {
      // Set selection
      const item = {
        id: "item-1",
        canvasId: "canvas1",
        type: "header",
        name: "Header Item",
        layouts: {
          desktop: { x: 1, y: 1, width: 10, height: 6 },
          mobile: { x: 1, y: 1, width: 14, height: 5, customized: false },
        },
        config: {},
        zIndex: 1,
      };
      addItemToCanvas("canvas1", item);
      selectItem("item-1", "canvas1");

      // Activate different canvas
      setActiveCanvas("canvas2");

      // Both should be independently set
      expect(gridState.selectedCanvasId).toBe("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas2");
    });

    it("should not affect selection state when setting active canvas", () => {
      const item = {
        id: "item-1",
        canvasId: "canvas1",
        type: "header",
        name: "Header Item",
        layouts: {
          desktop: { x: 1, y: 1, width: 10, height: 6 },
          mobile: { x: 1, y: 1, width: 14, height: 5, customized: false },
        },
        config: {},
        zIndex: 1,
      };
      addItemToCanvas("canvas1", item);
      selectItem("item-1", "canvas1");

      expect(gridState.selectedItemId).toBe("item-1");
      expect(gridState.selectedCanvasId).toBe("canvas1");

      setActiveCanvas("canvas2");

      expect(gridState.selectedItemId).toBe("item-1");
      expect(gridState.selectedCanvasId).toBe("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas2");
    });

    it("should not affect active canvas when deselecting item", () => {
      setActiveCanvas("canvas1");
      expect(gridState.activeCanvasId).toBe("canvas1");

      const item = {
        id: "item-1",
        canvasId: "canvas1",
        type: "header",
        name: "Header Item",
        layouts: {
          desktop: { x: 1, y: 1, width: 10, height: 6 },
          mobile: { x: 1, y: 1, width: 14, height: 5, customized: false },
        },
        config: {},
        zIndex: 1,
      };
      addItemToCanvas("canvas1", item);
      selectItem("item-1", "canvas1");
      deselectItem();

      expect(gridState.activeCanvasId).toBe("canvas1");
    });
  });
});
