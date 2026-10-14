import React, { useEffect } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  postTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  postTitle,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={!isDeleting ? onCancel : undefined}>
      <div
        className="modal-box"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-badge-danger">PERMANENT ACTION</span>
          <h2 id="delete-dialog-title" className="modal-title">
            Delete Essay?
          </h2>
        </div>

        <p id="delete-dialog-desc" className="modal-description">
          Are you sure you want to permanently delete{' '}
          <strong>&ldquo;{postTitle}&rdquo;</strong>? This action cannot be reversed
          and the essay will be removed immediately from the publication database.
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-outline-pill"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger-pill"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};
