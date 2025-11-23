import { h } from "@stencil/core";
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
export class ConfirmationModal {
    constructor() {
        /**
         * Modal open/closed state
         * Controlled by parent component (blog-app)
         */
        this.isOpen = false;
        /**
         * Modal content (title and message)
         * Passed from parent when showing confirmation
         */
        this.data = null;
        /**
         * Handle Confirm Button Click
         * ----------------------------
         * Fires confirm event → Parent resolves Promise(true) → Library deletes component
         */
        this.handleConfirm = () => {
            this.confirm.emit();
        };
        /**
         * Handle Cancel Button Click
         * ---------------------------
         * Fires cancel event → Parent resolves Promise(false) → Library cancels deletion
         */
        this.handleCancel = () => {
            this.cancel.emit();
        };
    }
    render() {
        if (!this.isOpen || !this.data) {
            return null;
        }
        return (h("div", { class: "confirmation-overlay", onClick: this.handleCancel }, h("div", { class: "confirmation-modal", onClick: (e) => e.stopPropagation() }, h("div", { class: "modal-header" }, h("h2", { class: "modal-title" }, this.data.title)), h("div", { class: "modal-body" }, h("p", { class: "modal-message" }, this.data.message)), h("div", { class: "modal-footer" }, h("button", { class: "cancel-btn", onClick: this.handleCancel }, "Cancel"), h("button", { class: "confirm-btn", onClick: this.handleConfirm }, "Delete")))));
    }
    static get is() { return "confirmation-modal"; }
    static get originalStyleUrls() {
        return {
            "$": ["confirmation-modal.scss"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["confirmation-modal.css"]
        };
    }
    static get properties() {
        return {
            "isOpen": {
                "type": "boolean",
                "mutable": false,
                "complexType": {
                    "original": "boolean",
                    "resolved": "boolean",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Modal open/closed state\nControlled by parent component (blog-app)"
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "is-open",
                "defaultValue": "false"
            },
            "data": {
                "type": "unknown",
                "mutable": false,
                "complexType": {
                    "original": "ConfirmationModalData | null",
                    "resolved": "ConfirmationModalData",
                    "references": {
                        "ConfirmationModalData": {
                            "location": "import",
                            "path": "../../types/confirmation-modal-data",
                            "id": "src/demo/types/confirmation-modal-data.ts::ConfirmationModalData"
                        }
                    }
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": "Modal content (title and message)\nPassed from parent when showing confirmation"
                },
                "getter": false,
                "setter": false,
                "defaultValue": "null"
            }
        };
    }
    static get events() {
        return [{
                "method": "confirm",
                "name": "confirm",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event: User confirmed deletion\nParent resolves deletion hook Promise with `true`"
                },
                "complexType": {
                    "original": "void",
                    "resolved": "void",
                    "references": {}
                }
            }, {
                "method": "cancel",
                "name": "cancel",
                "bubbles": true,
                "cancelable": true,
                "composed": true,
                "docs": {
                    "tags": [],
                    "text": "Event: User cancelled deletion\nParent resolves deletion hook Promise with `false`"
                },
                "complexType": {
                    "original": "void",
                    "resolved": "void",
                    "references": {}
                }
            }];
    }
}
//# sourceMappingURL=confirmation-modal.js.map
