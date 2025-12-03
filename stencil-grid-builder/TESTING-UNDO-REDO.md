# Manual Testing Guide: Undo/Redo Structured Descriptions

## Overview

This guide documents how to manually test that undo/redo operations emit structured event descriptions with coordinates and dimensions (instead of plain strings).

## Changes Implemented

### 1. Command Pattern Enhancements
All 13 Command classes now have `getDescription()` methods that return structured objects:

**Command Classes Updated:**
1. `AddItemCommand` - Returns `{action, type, position: {x, y}, size: {width, height}}`
2. `DeleteItemCommand` - Returns `{action, type, position: {x, y}, size: {width, height}}`
3. `MoveItemCommand` - Returns `{action, source: {position, size}, target: {position, size}}`
4. `UpdateItemCommand` - Returns `{action, itemId, updates}`
5. `RemoveItemCommand` - Returns `{action, type, position: {x, y}, size: {width, height}}`
6. `SetViewportCommand` - Returns `{action, oldViewport, newViewport}`
7. `ToggleGridCommand` - Returns `{action, oldValue, newValue}`
8. `BatchAddCommand` - Returns `{action, itemCount, items: [{id, type, position, size}]}`
9. `BatchDeleteCommand` - Returns `{action, itemCount, items: [{id, type, position, size}]}`
10. `BatchUpdateConfigCommand` - Returns `{action, updateCount, updates: [{itemId, canvasId, oldConfig, newConfig}]}`
11. `AddCanvasCommand` - Returns `{action, canvasId}`
12. `RemoveCanvasCommand` - Returns `{action, canvasId, itemCount}`
13. `ChangeZIndexCommand` - Returns `{action, changeCount, changes: [{itemId, canvasId, oldZIndex, newZIndex}]}`

### 2. Event Emission Updates
- `grid-builder-api.ts` undo()/redo() methods now emit `undoExecuted`/`redoExecuted` events with structured `description` field
- Events include both `description` (structured object) and `actionType` (extracted from description.action)

### 3. Mobile Viewport Support
- `grid-item-wrapper.tsx` now uses `currentViewport` instead of hardcoded "desktop"
- `isDrag`/`isResize` detection compares current viewport's layout
- `componentDragged` and `componentResized` events emit current viewport's coordinates/dimensions

## Manual Testing Steps

### Prerequisites
1. Start Storybook development server:
   ```bash
   cd stencil-grid-builder
   npm run storybook
   ```

2. Navigate to the Undo Redo Demo story:
   ```
   http://localhost:6006/?path=/story/components-grid-builder--undo-redo-demo
   ```

3. Open the **Actions** tab at the bottom of the Storybook UI

### Test 1: Add Component Undo/Redo

**Steps:**
1. Click "Header" button in the component palette
2. Observe Actions panel for `componentAdded` event
3. Click "Undo" button or press Ctrl+Z
4. Observe Actions panel for `undoExecuted` event
5. Click "Redo" button or press Ctrl+Y
6. Observe Actions panel for `redoExecuted` event

**Expected Results:**
- `undoExecuted` event should show:
  ```javascript
  {
    description: {
      action: "add",
      type: "header",
      position: { x: <number>, y: <number> },
      size: { width: <number>, height: <number> }
    },
    actionType: "add"
  }
  ```

- `redoExecuted` event should show identical structure

### Test 2: Move Component Undo/Redo

**Steps:**
1. Drag a component to a new position (grab the header bar)
2. Release the drag
3. Click "Undo" button
4. Observe Actions panel for `undoExecuted` event
5. Click "Redo" button
6. Observe Actions panel for `redoExecuted` event

**Expected Results:**
- `undoExecuted` event should show:
  ```javascript
  {
    description: {
      action: "move",
      source: {
        position: { x: <number>, y: <number> },
        size: { width: <number>, height: <number> }
      },
      target: {
        position: { x: <number>, y: <number> },
        size: { width: <number>, height: <number> }
      }
    },
    actionType: "move"
  }
  ```

### Test 3: Resize Component Undo/Redo

**Steps:**
1. Grab a resize handle (corners or edges) on a component
2. Drag to resize
3. Release
4. Click "Undo" button
5. Observe Actions panel for `undoExecuted` event

**Expected Results:**
- `undoExecuted` event should show:
  ```javascript
  {
    description: {
      action: "resize",  // Note: action is "resize" not "move"
      source: {
        position: { x: <number>, y: <number> },
        size: { width: <original_width>, height: <original_height> }
      },
      target: {
        position: { x: <number>, y: <number> },
        size: { width: <new_width>, height: <new_height> }
      }
    },
    actionType: "resize"
  }
  ```

### Test 4: Delete Component Undo/Redo

**Steps:**
1. Click a component to select it
2. Press Delete key or click the × button
3. Click "Undo" button
4. Observe Actions panel for `undoExecuted` event

**Expected Results:**
- `undoExecuted` event should show:
  ```javascript
  {
    description: {
      action: "delete",
      type: "header",
      position: { x: <number>, y: <number> },
      size: { width: <number>, height: <number> }
    },
    actionType: "delete"
  }
  ```

### Test 5: Mobile Viewport Events

**Steps:**
1. Switch to Mobile viewport using the viewport toggle button
2. Drag a component to a new position
3. Observe Actions panel for `componentDragged` event
4. Resize a component
5. Observe Actions panel for `componentResized` event

**Expected Results:**
- Events should use mobile layout coordinates:
  ```javascript
  // componentDragged
  {
    itemId: "...",
    canvasId: "...",
    position: {
      x: <mobile_x>,  // From item.layouts.mobile, not desktop
      y: <mobile_y>
    }
  }

  // componentResized
  {
    itemId: "...",
    canvasId: "...",
    size: {
      width: <mobile_width>,
      height: <mobile_height>
    }
  }
  ```

### Test 6: Batch Operations

**Steps:**
1. Click "Add 100 Items" button (stress test)
2. Click "Undo" button
3. Observe Actions panel for `undoExecuted` event

**Expected Results:**
- `undoExecuted` event should show:
  ```javascript
  {
    description: {
      action: "batchAdd",
      itemCount: 100,
      items: [
        { id: "...", type: "...", position: {x, y}, size: {width, height} },
        // ... 99 more items
      ]
    },
    actionType: "batchAdd"
  }
  ```

## Code Verification (Alternative to Manual Testing)

If manual testing is not possible (e.g., Playwright browser lock), you can verify the implementation by reviewing these files:

### 1. Command Implementations
```bash
# Verify all 13 Command classes have getDescription()
grep -n "getDescription()" src/services/undo-redo-commands.ts | wc -l
# Should output: 13
```

### 2. Event Emission
```bash
# Verify grid-builder-api.ts emits with description
grep -A 10 "undoExecuted" src/services/grid-builder-api.ts
grep -A 10 "redoExecuted" src/services/grid-builder-api.ts
```

### 3. Mobile Viewport Support
```bash
# Verify currentViewport is used for event data
grep -B 5 -A 10 "currentLayout =" src/components/grid-item-wrapper/grid-item-wrapper.tsx
```

## Troubleshooting

### Issue: Actions Panel Not Showing Events
**Solution**: Ensure the Actions tab is open at the bottom of Storybook UI

### Issue: Events Show String Instead of Object
**Solution**: This indicates the old implementation - rebuild Stencil:
```bash
npm run build
npm run build-storybook
```

### Issue: Playwright Browser Lock
**Solution**: Manually close all Playwright browser windows:
- macOS: Close Chrome windows with title containing "Playwright"
- Or restart computer to clear all browser instances

### Issue: Mobile Coordinates Show Desktop Values
**Solution**: Ensure you've switched to Mobile viewport BEFORE performing the drag/resize action

## Success Criteria

All tests pass when:
1. ✅ `undoExecuted` events show structured `description` objects (not strings)
2. ✅ Description objects include coordinates `{x, y}` and dimensions `{width, height}`
3. ✅ Move operations show both `source` and `target` coordinates/dimensions
4. ✅ Resize operations set `action: "resize"` (not "move")
5. ✅ Mobile viewport events use mobile layout coordinates
6. ✅ Batch operations show item count and array of item details
7. ✅ All 13 Command types have appropriate structured descriptions

## Related Files

- `/src/services/undo-redo-commands.ts` - All Command implementations
- `/src/services/grid-builder-api.ts` - Event emission in undo()/redo()
- `/src/components/grid-item-wrapper/grid-item-wrapper.tsx` - Mobile viewport support
- `/src/types/events.ts` - Event type definitions
- `/.storybook/stories/undo-redo-demo.stories.ts` - Storybook test story
