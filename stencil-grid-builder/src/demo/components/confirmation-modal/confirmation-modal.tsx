import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';

export interface ConfirmationModalData {
  title: string;
  message: string;
}

@Component({
  tag: 'confirmation-modal',
  styleUrl: 'confirmation-modal.scss',
  shadow: false,
})
export class ConfirmationModal {
  @Prop() isOpen: boolean = false;
  @Prop() data: ConfirmationModalData | null = null;

  @Event() confirm: EventEmitter<void>;
  @Event() cancel: EventEmitter<void>;

  private handleConfirm = () => {
    this.confirm.emit();
  };

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
