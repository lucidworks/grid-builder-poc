/**
 * Deletion Hook Types
 * ===================
 *
 * Types for the component deletion hook system that allows host applications
 * to intercept deletion requests and implement custom workflows (confirmation
 * modals, API calls, etc.).
 */

import { GridItem } from '../services/state-manager';

/**
 * Result of a deletion hook
 *
 * The hook can either:
 * - Return `true` to proceed with deletion immediately
 * - Return `false` to cancel the deletion
 * - Return a Promise that resolves to true/false for async operations
 */
export type DeletionHookResult = boolean | Promise<boolean>;

/**
 * Context provided to the deletion hook
 *
 * Contains all information about the component being deleted
 */
export interface DeletionHookContext {
  /** The grid item being deleted */
  item: GridItem;
  /** The canvas ID containing the item */
  canvasId: string;
  /** The item ID */
  itemId: string;
}

/**
 * Deletion hook function signature
 *
 * Called before a component is deleted. The host application can:
 * - Show a confirmation modal
 * - Make API calls to backend
 * - Perform validation
 * - Log the deletion
 *
 * @param context - Information about the component being deleted
 * @returns true to proceed with deletion, false to cancel, or a Promise
 *
 * @example
 * ```tsx
 * const onBeforeDelete = async (context) => {
 *   // Show confirmation modal
 *   const confirmed = await showConfirmModal(
 *     `Delete ${context.item.name}?`
 *   );
 *
 *   if (confirmed) {
 *     // Make API call
 *     await deleteFromBackend(context.itemId);
 *     return true;
 *   }
 *   return false;
 * };
 *
 * <grid-builder onBeforeDelete={onBeforeDelete} />
 * ```
 */
export type DeletionHook = (context: DeletionHookContext) => DeletionHookResult;
