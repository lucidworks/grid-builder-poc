/**
 * Test Helper Utilities
 * ======================
 *
 * Shared utilities for test files
 */

import { h } from "@stencil/core";

/**
 * Simple drag clone for test mocks
 * Use this in test component definitions to satisfy the required renderDragClone
 */
export const mockDragClone = () => <div>Mock Clone</div>;
