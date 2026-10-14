import React, { useEffect } from 'react';

interface CommentDeleteModalProps {
  isOpen: boolean;
  hasReplies: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CommentDeleteModal: React.FC<CommentDeleteModalProps> = ({
  isOpen,
  hasReplies,
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
        aria-labelledby="comment-delete-title"
        aria-describedby="comment-delete-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-badge-danger">
            {hasReplies ? 'THREAD PRESERVATION' : 'PERMANENT ACTION'}
          </span>
          <h2 id="comment-delete-title" className="modal-title">
            {hasReplies ? 'Remove Comment Content?' : 'Delete Comment?'}
          </h2>
        </div>

        <p id="comment-delete-desc" className="modal-description">
          {hasReplies ? (
            <>
              This comment has active replies from the community. To keep the conversation intact,
              your text will be replaced with a placeholder notice (
              <em>&ldquo;This comment has been deleted&rdquo;</em>), and all replies will remain
              visible.
            </>
          ) : (
            <>
              Are you sure you want to permanently delete this comment? This action cannot be
              undone and will remove the comment completely.
            </>
          )}
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
            {isDeleting
              ? 'Processing...'
              : hasReplies
              ? 'Remove Content'
              : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};
