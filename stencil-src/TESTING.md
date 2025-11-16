# Testing Guide

This guide documents testing best practices and utilities for the StencilJS Grid Builder project.

## Table of Contents

- [Running Tests](#running-tests)
- [Test Utilities](#test-utilities)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Running Tests

```bash
# Run all tests
npm run test-unit

# Run tests in watch mode
npm run test-unit:watch

# Run specific test file
npm run test-unit -- --spec=src/components/path/to/component.spec.tsx

# Run tests with coverage
npm run test-unit:coverage
```

## Test Utilities

The project provides a comprehensive set of testing utilities in `src/utils/test-utils.ts` to simplify common testing scenarios.

### Setup Functions

#### `setupGlobalMocks()`
Sets up global mocks for IntersectionObserver and interact.js. Call this **before** importing components that use these APIs.

```typescript
// At the top of your test file, before imports
setupGlobalMocks();

import { MyComponent } from './my-component';
```

#### `resetGridState()`
Resets gridState to initial defaults. Use in `beforeEach()` to ensure clean state between tests.

```typescript
beforeEach(() => {
  resetGridState();
});
```

### Test Data Creation

#### `createTestItem(overrides?: Partial<GridItem>): GridItem`
Creates a test grid item with sensible defaults. Customize specific properties via the overrides parameter.

```typescript
// Default item
const item = createTestItem();

// Custom item
const customItem = createTestItem({
  id: 'custom-id',
  type: 'button',
  zIndex: 5
});
```

#### `createTestItems(count: number, baseOverrides?: Partial<GridItem>): GridItem[]`
Creates multiple test items with incremental positions and IDs.

```typescript
// Create 5 items
const items = createTestItems(5);

// Create 3 button items on canvas2
const buttons = createTestItems(3, {
  type: 'button',
  canvasId: 'canvas2'
});
```

### Canvas Mocking

#### `createMockCanvas(page: SpecPage, canvasId?: string, width?: number): HTMLElement`
Creates a mock canvas element with a specified width for layout tests.

```typescript
const mockCanvas = createMockCanvas(page, 'canvas1', 1200);
page.body.appendChild(mockCanvas);
```

#### `setupSpecPageWithCanvas(page: SpecPage, options: MockCanvasSetupOptions): Promise<HTMLElement>`
Comprehensive setup for tests requiring canvas layout calculations. Handles canvas creation, component instantiation, and prop application.

```typescript
const wrapper = await setupSpecPageWithCanvas(page, {
  canvasId: 'canvas1',
  canvasWidth: 1000,
  component: GridItemWrapper,
  componentProps: { item: testItem },
  componentTag: 'grid-item-wrapper'
});
```

### Event Utilities

#### `dispatchCustomEvent<T>(element: Element, eventName: string, detail: T, options?): void`
Dispatches a custom event with proper bubbling and composition.

```typescript
// Dispatch item-click event
dispatchCustomEvent(document, 'item-click', {
  itemId: 'item-1',
  canvasId: 'canvas1'
});
```

### Async Utilities

#### `waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>`
Waits for a condition to become true, useful for async operations.

```typescript
let dataLoaded = false;

// Wait for data to load (max 1000ms)
await waitFor(() => dataLoaded, 1000, 50);
```

### DOM Utilities

#### `getTextContent(element: Element | null): string`
Returns trimmed text content or empty string if element is null.

```typescript
const text = getTextContent(element); // Safe, won't throw
```

#### `hasClass(element: Element | null, className: string): boolean`
Safely checks if element has a class.

```typescript
if (hasClass(element, 'selected')) {
  // ...
}
```

## Common Patterns

### Basic Component Test

```typescript
import { newSpecPage } from '@stencil/core/testing';
import { createTestItem, resetGridState } from '../../utils/test-utils';
import { MyComponent } from './my-component';

describe('my-component', () => {
  beforeEach(() => {
    resetGridState();
  });

  it('should render', async () => {
    const page = await newSpecPage({
      components: [MyComponent],
      html: '<my-component></my-component>',
    });

    expect(page.root).toBeTruthy();
  });
});
```

### Component with Grid Item

```typescript
it('should render grid item', async () => {
  const testItem = createTestItem({ name: 'Custom Name' });
  gridState.canvases.canvas1.items.push(testItem);

  const page = await newSpecPage({
    components: [MyComponent],
    template: () => <my-component item={testItem} />,
  });

  expect(page.root.querySelector('.item-name').textContent).toBe('Custom Name');
});
```

### Testing Custom Events

```typescript
it('should handle custom event', async () => {
  const page = await newSpecPage({
    components: [MyComponent],
    html: '<my-component></my-component>',
  });

  // Dispatch event using test utility
  dispatchCustomEvent(document, 'my-event', {
    value: 'test'
  });

  await page.waitForChanges();

  // Assert changes
  expect(page.rootInstance.someState).toBe('test');
});
```

### Layout Tests with Canvas

```typescript
it('should apply correct layout', async () => {
  const testItem = createTestItem();

  const page = await newSpecPage({
    components: [MyComponent],
    html: '<div></div>',
    supportsShadowDom: false,
  });

  // Create mock canvas
  const mockCanvas = createMockCanvas(page, 'canvas1', 1000);
  page.body.appendChild(mockCanvas);

  // Render component
  const wrapper = page.doc.createElement('my-component') as any;
  wrapper.item = testItem;
  page.root.appendChild(wrapper);
  await page.waitForChanges();

  // Test layout calculations
  const element = wrapper.querySelector('.my-element');
  expect(element.style.width).toBe('2000px');
});
```

## Best Practices

### 1. Use Test Utilities

**Don't:**
```typescript
beforeEach(() => {
  gridState.canvases = {
    canvas1: { items: [], zIndexCounter: 1, backgroundColor: '#ffffff' }
  };
  gridState.selectedItemId = null;
  gridState.currentViewport = 'desktop';
  // ... more boilerplate
});
```

**Do:**
```typescript
beforeEach(() => {
  resetGridState();
});
```

### 2. Create Realistic Test Data

**Don't:**
```typescript
const item = {
  id: 'x',
  type: 'y',
  // Missing required fields...
} as GridItem;
```

**Do:**
```typescript
const item = createTestItem({ id: 'custom-id' });
```

### 3. Test One Thing at a Time

Each test should verify a single behavior or aspect of the component.

```typescript
it('should render header text', async () => {
  // Test only header rendering
});

it('should handle click events', async () => {
  // Test only click handling
});
```

### 4. Use Descriptive Test Names

Test names should clearly describe the expected behavior.

**Don't:**
```typescript
it('works', async () => {
  // What works?
});
```

**Do:**
```typescript
it('should close panel but keep selection when close button clicked', async () => {
  // Clear and descriptive
});
```

### 5. Clean Up Global State

Always reset state in `beforeEach()` to prevent test interdependence.

```typescript
beforeEach(() => {
  resetGridState();
  jest.clearAllMocks();
});
```

### 6. Test User Interactions

Focus on testing component behavior from a user's perspective.

```typescript
it('should toggle selected class when clicked', async () => {
  const button = page.root.querySelector('button');
  button.click();
  await page.waitForChanges();

  expect(hasClass(page.root, 'selected')).toBe(true);
});
```

### 7. Use Async/Await Properly

Always `await page.waitForChanges()` after state-changing operations.

```typescript
it('should update after state change', async () => {
  gridState.selectedItemId = 'item-1';
  await page.waitForChanges(); // Don't forget this!

  expect(hasClass(element, 'selected')).toBe(true);
});
```

## Examples

### Complete Example: Testing Config Panel

```typescript
import { newSpecPage } from '@stencil/core/testing';
import { gridState } from '../../services/state-manager';
import { createTestItem, dispatchCustomEvent, resetGridState } from '../../utils/test-utils';
import { ConfigPanel } from './config-panel';

describe('config-panel', () => {
  let testItem;

  beforeEach(() => {
    // Clean state
    resetGridState();

    // Create test data
    testItem = createTestItem();
    gridState.canvases.canvas1.items.push(testItem);
  });

  it('should open when item-click event dispatched', async () => {
    const page = await newSpecPage({
      components: [ConfigPanel],
      html: '<config-panel></config-panel>',
    });

    // Use event utility
    dispatchCustomEvent(document, 'item-click', {
      itemId: 'item-1',
      canvasId: 'canvas1'
    });

    await page.waitForChanges();

    // Verify behavior
    const panel = page.root.querySelector('.config-panel');
    expect(hasClass(panel, 'open')).toBe(true);
  });
});
```

### Complete Example: Testing Multiple Items

```typescript
it('should render multiple grid items', async () => {
  // Create 5 test items
  const items = createTestItems(5);
  gridState.canvases.canvas1.items = items;

  const page = await newSpecPage({
    components: [GridContainer],
    html: '<grid-container canvas-id="canvas1"></grid-container>',
  });

  const renderedItems = page.root.querySelectorAll('.grid-item');
  expect(renderedItems.length).toBe(5);

  // Verify each item rendered with correct ID
  items.forEach((item, index) => {
    expect(renderedItems[index].id).toBe(item.id);
  });
});
```

## Additional Resources

- [Stencil Testing Documentation](https://stenciljs.com/docs/unit-testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)

## Contributing

When adding new test utilities:

1. Add the utility function to `src/utils/test-utils.ts`
2. Add comprehensive tests in `src/utils/test-utils.spec.ts`
3. Document the function in this guide with examples
4. Update an existing test file to demonstrate usage
5. Ensure all tests pass before committing
