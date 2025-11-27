/**
 * Input Validation Utilities
 * ===========================
 *
 * Validates grid item data structure and bounds to prevent corrupt state.
 * Used for defensive programming in state-manager operations.
 *
 * ## Design Philosophy
 *
 * **Non-blocking validation**:
 * - All validation functions return results with warnings
 * - State operations proceed even if validation fails
 * - Warnings logged via debug utility (dev-only, tree-shaken in production)
 *
 * **What validation protects against**:
 * - State corruption (invalid layouts causing render errors)
 * - Layout integrity violations (out-of-bounds positions)
 * - Data persistence issues (malformed items in export)
 * - Undo/redo stack corruption (invalid snapshots)
 *
 * **What validation does NOT protect against**:
 * - XSS attacks (handled by API documentation in ComponentDefinition)
 * - Authentication/authorization (not library's responsibility)
 * - Network attacks (library is client-side only)
 *
 * ## Validation Rules
 *
 * **Desktop Layout**:
 * - x ≥ 0 (left boundary)
 * - y ≥ 0 (top boundary)
 * - width: 1-50 units (2%-100% of canvas)
 * - height: 1-100 units (20px-2000px typically)
 *
 * **Mobile Layout**:
 * - Same bounds as desktop if values present
 * - May be auto-generated (customized: false)
 *
 * **Item Properties**:
 * - id: non-empty string
 * - canvasId: non-empty string
 * - type: non-empty string
 * - zIndex: finite number
 *
 * @module validation
 */

/**
 * Validation result with success flag and error messages
 */
export interface ValidationResult {
  /** True if validation passed, false if any errors */
  valid: boolean;

  /** Array of validation error messages */
  errors: string[];
}

/**
 * Grid layout bounds configuration
 */
const LAYOUT_BOUNDS = {
  x: { min: 0, max: Infinity },
  y: { min: 0, max: Infinity },
  width: { min: 1, max: 50 }, // 50 units = 100% canvas width
  height: { min: 1, max: 100 }, // Reasonable maximum height
};

/**
 * Validate a single layout object (desktop or mobile)
 *
 * **Checks**:
 * - All required properties present (x, y, width, height)
 * - All values are finite numbers
 * - Values within valid bounds
 *
 * @param layout - Layout object to validate
 * @param layoutType - 'desktop' or 'mobile' (for error messages)
 * @returns ValidationResult with errors if any
 */
export function validateLayout(
  layout: any,
  layoutType: string,
): ValidationResult {
  const errors: string[] = [];

  // Check required properties
  if (!layout) {
    errors.push(`${layoutType} layout is missing or undefined`);
    return { valid: false, errors };
  }

  // Check numeric properties
  const numericProps = ["x", "y", "width", "height"];
  for (const prop of numericProps) {
    if (typeof layout[prop] !== "number" || !Number.isFinite(layout[prop])) {
      errors.push(
        `${layoutType} layout.${prop} must be a finite number, got: ${layout[prop]}`,
      );
    }
  }

  // Check bounds
  if (Number.isFinite(layout.x) && layout.x < LAYOUT_BOUNDS.x.min) {
    errors.push(
      `${layoutType} layout.x must be >= ${LAYOUT_BOUNDS.x.min}, got: ${layout.x}`,
    );
  }

  if (Number.isFinite(layout.y) && layout.y < LAYOUT_BOUNDS.y.min) {
    errors.push(
      `${layoutType} layout.y must be >= ${LAYOUT_BOUNDS.y.min}, got: ${layout.y}`,
    );
  }

  if (
    Number.isFinite(layout.width) &&
    (layout.width < LAYOUT_BOUNDS.width.min ||
      layout.width > LAYOUT_BOUNDS.width.max)
  ) {
    errors.push(
      `${layoutType} layout.width must be between ${LAYOUT_BOUNDS.width.min}-${LAYOUT_BOUNDS.width.max}, got: ${layout.width}`,
    );
  }

  if (
    Number.isFinite(layout.height) &&
    (layout.height < LAYOUT_BOUNDS.height.min ||
      layout.height > LAYOUT_BOUNDS.height.max)
  ) {
    errors.push(
      `${layoutType} layout.height must be between ${LAYOUT_BOUNDS.height.min}-${LAYOUT_BOUNDS.height.max}, got: ${layout.height}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a complete grid item structure
 *
 * **Checks**:
 * - Required properties: id, canvasId, type, zIndex, layouts
 * - String properties are non-empty
 * - zIndex is finite number
 * - Desktop layout is valid
 * - Mobile layout is valid (if present)
 *
 * **Usage**:
 * ```typescript
 * const result = validateGridItem(item);
 * if (!result.valid) {
 *   debug.warn('Invalid item:', { itemId: item.id, errors: result.errors });
 * }
 * ```
 *
 * @param item - Grid item to validate
 * @returns ValidationResult with errors if any
 */
export function validateGridItem(item: any): ValidationResult {
  const errors: string[] = [];

  // Check required properties exist
  if (!item) {
    errors.push("Item is null or undefined");
    return { valid: false, errors };
  }

  // Validate id
  if (typeof item.id !== "string" || item.id.trim() === "") {
    errors.push(`Item.id must be a non-empty string, got: ${item.id}`);
  }

  // Validate canvasId
  if (typeof item.canvasId !== "string" || item.canvasId.trim() === "") {
    errors.push(
      `Item.canvasId must be a non-empty string, got: ${item.canvasId}`,
    );
  }

  // Validate type
  if (typeof item.type !== "string" || item.type.trim() === "") {
    errors.push(`Item.type must be a non-empty string, got: ${item.type}`);
  }

  // Validate zIndex
  if (typeof item.zIndex !== "number" || !Number.isFinite(item.zIndex)) {
    errors.push(
      `Item.zIndex must be a finite number, got: ${item.zIndex} (type: ${typeof item.zIndex})`,
    );
  }

  // Validate layouts object
  if (!item.layouts || typeof item.layouts !== "object") {
    errors.push("Item.layouts must be an object");
    return { valid: false, errors };
  }

  // Validate desktop layout (required)
  const desktopResult = validateLayout(item.layouts.desktop, "desktop");
  if (!desktopResult.valid) {
    errors.push(...desktopResult.errors);
  }

  // Validate mobile layout (optional, but if present must be valid)
  if (item.layouts.mobile) {
    const mobileResult = validateLayout(item.layouts.mobile, "mobile");
    if (!mobileResult.valid) {
      errors.push(...mobileResult.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate item update object (partial updates)
 *
 * **Checks**:
 * - If layout updates present, validate layout structure
 * - If zIndex update present, validate it's a finite number
 * - If config update present, validate it's an object
 *
 * **Usage**:
 * ```typescript
 * const result = validateItemUpdates(updates);
 * if (!result.valid) {
 *   debug.warn('Invalid updates:', { itemId, errors: result.errors });
 * }
 * ```
 *
 * @param updates - Partial item updates to validate
 * @returns ValidationResult with errors if any
 */
export function validateItemUpdates(updates: any): ValidationResult {
  const errors: string[] = [];

  if (!updates || typeof updates !== "object") {
    errors.push("Updates must be an object");
    return { valid: false, errors };
  }

  // Validate layouts if present
  if (updates.layouts) {
    if (typeof updates.layouts !== "object") {
      errors.push("Updates.layouts must be an object");
    } else {
      // Validate desktop layout if present
      if (updates.layouts.desktop) {
        const desktopResult = validateLayout(
          updates.layouts.desktop,
          "desktop",
        );
        if (!desktopResult.valid) {
          errors.push(...desktopResult.errors);
        }
      }

      // Validate mobile layout if present
      if (updates.layouts.mobile) {
        const mobileResult = validateLayout(updates.layouts.mobile, "mobile");
        if (!mobileResult.valid) {
          errors.push(...mobileResult.errors);
        }
      }
    }
  }

  // Validate zIndex if present
  if (
    "zIndex" in updates &&
    (typeof updates.zIndex !== "number" || !Number.isFinite(updates.zIndex))
  ) {
    errors.push(
      `Updates.zIndex must be a finite number, got: ${updates.zIndex}`,
    );
  }

  // Validate config if present (must be object, but any shape is allowed)
  if ("config" in updates && typeof updates.config !== "object") {
    errors.push(`Updates.config must be an object, got: ${typeof updates.config}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
