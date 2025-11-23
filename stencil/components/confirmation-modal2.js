import { proxyCustomElement, HTMLElement, createEvent, h } from '@stencil/core/internal/client';

const confirmationModalCss = "confirmation-modal .confirmation-overlay{position:fixed;z-index:10000;top:0;right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease-out;background:rgba(0, 0, 0, 0.5)}confirmation-modal .confirmation-modal{width:90%;max-width:400px;border-radius:8px;animation:slideUp 0.2s ease-out;background:white;box-shadow:0 4px 20px rgba(0, 0, 0, 0.15)}confirmation-modal .modal-header{padding:20px 24px;border-bottom:1px solid #e9ecef}confirmation-modal .modal-header .modal-title{margin:0;color:#212529;font-size:18px;font-weight:600}confirmation-modal .modal-body{padding:24px}confirmation-modal .modal-body .modal-message{margin:0;color:#495057;font-size:14px;line-height:1.5}confirmation-modal .modal-footer{display:flex;justify-content:flex-end;padding:16px 24px;border-top:1px solid #e9ecef;gap:12px}confirmation-modal .modal-footer button{padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:500;transition:all 0.15s}confirmation-modal .modal-footer button.cancel-btn{background:#f8f9fa;color:#495057}confirmation-modal .modal-footer button.cancel-btn:hover{background:#e9ecef}confirmation-modal .modal-footer button.confirm-btn{background:#dc3545;color:white}confirmation-modal .modal-footer button.confirm-btn:hover{background:#c82333}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}";

const ConfirmationModal = /*@__PURE__*/ proxyCustomElement(class ConfirmationModal extends HTMLElement {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.confirm = createEvent(this, "confirm", 7);
        this.cancel = createEvent(this, "cancel", 7);
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
    static get style() { return confirmationModalCss; }
}, [256, "confirmation-modal", {
        "isOpen": [4, "is-open"],
        "data": [16]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["confirmation-modal"];
    components.forEach(tagName => { switch (tagName) {
        case "confirmation-modal":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, ConfirmationModal);
            }
            break;
    } });
}

export { ConfirmationModal as C, defineCustomElement as d };
//# sourceMappingURL=confirmation-modal2.js.map

//# sourceMappingURL=confirmation-modal2.js.map