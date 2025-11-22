import { SpecPage } from '@stencil/core/testing';
import { GridItem } from '../services/state-manager';
/**
 * Mock global objects for testing
 * Call this before importing components that use these globals
 */
export declare function setupGlobalMocks(): void;
/**
 * Reset gridState to initial state
 * Call this in beforeEach to ensure clean state
 */
export declare function resetGridState(): void;
/**
 * Create a test grid item with sensible defaults
 * Customize with partial override
 */
export declare function createTestItem(overrides?: Partial<GridItem>): GridItem;
/**
 * Create multiple test items
 */
export declare function createTestItems(count: number, baseOverrides?: Partial<GridItem>): GridItem[];
/**
 * Create a mock canvas element with specified width
 * Returns the element so it can be appended to the test page
 */
export declare function createMockCanvas(page: SpecPage, canvasId?: string, width?: number): HTMLElement;
/**
 * Setup a spec page with mock canvas for layout tests
 * This handles the complex setup needed for tests that use grid calculations
 */
export interface MockCanvasSetupOptions {
    canvasId?: string;
    canvasWidth?: number;
    component: any;
    componentProps?: Record<string, any>;
    componentTag?: string;
}
export declare function setupSpecPageWithCanvas(page: SpecPage, options: MockCanvasSetupOptions): Promise<HTMLElement>;
/**
 * Dispatch a custom event on an element or document
 */
export declare function dispatchCustomEvent<T = any>(element: Element | Document, eventName: string, detail: T, options?: {
    bubbles?: boolean;
    composed?: boolean;
}): void;
/**
 * Wait for a condition to be true
 * Useful for async operations in tests
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * Get element text content trimmed
 */
export declare function getTextContent(element: Element | null): string;
/**
 * Check if element has class
 */
export declare function hasClass(element: Element | null, className: string): boolean;
/**
 * Mock pattern: Create a jest spy function that can be chained
 */
export declare function createChainableMock(): jest.Mock;
