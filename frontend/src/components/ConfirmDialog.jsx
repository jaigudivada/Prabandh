import Modal from './Modal';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel', intent = 'warning' }) {
  return (
    <Modal
      open={open}
      title={title || 'Please confirm'}
      subtitle={message}
      onClose={onCancel}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary w-full sm:w-auto">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`btn-primary w-full sm:w-auto ${intent === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}>
            {confirmLabel}
          </button>
        </div>
      }
    />
  );
}
