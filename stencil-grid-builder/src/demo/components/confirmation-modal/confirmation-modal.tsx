import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { ConfirmationModalData } from '../../types/confirmation-modal-data';

/**
 * Confirmation Modal Component
 * =============================
 *
 * Demo Component - NOT Part of Library
 *
 * This component demonstrates how to implement the grid-builder library's
 * deletion hook system with a custom confirmation modal.
 *
 * Library Feature Being Demonstrated:
 * -----------------------------------
 * This modal is used with the library's **onBeforeDelete hook** system.
 *
 * How It Works:
 * -------------
 * 1. Library calls onBeforeDelete hook when user deletes component
 * 2. Hook returns a Promise that doesn't resolve immediately
 * 3. Host app shows this modal (or any modal library)
 * 4. User clicks "Delete" or "Cancel"
 * 5. Modal fires confirm/cancel event
 * 6. Host app resolves Promise with true/false
 * 7. Library proceeds with or cancels deletion
 *
 * Code Flow Example:
 * ------------------
 * ```typescript
 * // In parent component (blog-app.tsx):
 * private handleBeforeDelete = (context: DeletionHookContext): Promise<boolean> => {
 *   return new Promise((resolve) => {
 *     this.deleteResolve = resolve;
 *     this.isConfirmModalOpen = true;  // Show this modal
 *   });
 * };
 *
 * private handleConfirmDelete = () => {
 *   this.deleteResolve(true);   // Tell library to proceed
 * };
 *
 * private handleCancelDelete = () => {
 *   this.deleteResolve(false);  // Tell library to cancel
 * };
 * ```
 *
 * Why This Pattern:
 * -----------------
 * - **Library agnostic**: Library doesn't provide modal UI
 * - **Flexibility**: Use any modal library (Material, Bootstrap, Ant Design, etc.)
 * - **Customization**: Full control over modal appearance and behavior
 * - **Async support**: Can make API calls before resolving
 *
 * Alternative Implementations:
 * ---------------------------
 * You could replace this component with:
 * - Material Design modal
 * - Bootstrap modal
 * - Ant Design modal
 * - Native browser confirm() (not recommended)
 * - Custom modal from your design system
 *
 * The library doesn't care what modal you use - it just waits for the
 * Promise to resolve with true/false.
 */
@Component({
  tag: 'confirmation-modal',
  styleUrl: 'confirmation-modal.scss',
  shadow: false,
})
export class ConfirmationModal {
  /**
   * Modal open/closed state
   * Controlled by parent component (blog-app)
   */
  @Prop() isOpen: boolean = false;

  /**
   * Modal content (title and message)
   * Passed from parent when showing confirmation
   */
  @Prop() data: ConfirmationModalData | null = null;

  /**
   * Event: User confirmed deletion
   * Parent resolves deletion hook Promise with `true`
   */
  @Event() confirm: EventEmitter<void>;

  /**
   * Event: User cancelled deletion
   * Parent resolves deletion hook Promise with `false`
   */
  @Event() cancel: EventEmitter<void>;

  /**
   * Handle Confirm Button Click
   * ----------------------------
   * Fires confirm event → Parent resolves Promise(true) → Library deletes component
   */
  private handleConfirm = () => {
    this.confirm.emit();
  };

  /**
   * Handle Cancel Button Click
   * ---------------------------
   * Fires cancel event → Parent resolves Promise(false) → Library cancels deletion
   */
  private handleCancel = () => {
    this.cancel.emit();
  };

  render() {
    if (!this.isOpen || !this.data) {
      return null;
    }

    return (
      <div class="confirmation-overlay" onClick={this.handleCancel}>
        <div class="confirmation-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">{this.data.title}</h2>
          </div>

          <div class="modal-body">
            <p class="modal-message">{this.data.message}</p>
          </div>

          <div class="modal-footer">
            <button class="cancel-btn" onClick={this.handleCancel}>
              Cancel
            </button>
            <button class="confirm-btn" onClick={this.handleConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
}
