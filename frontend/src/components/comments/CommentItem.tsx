import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Comment } from '../../types/comments.types';
import { useAuth } from '../../context/useAuth';

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onReply: (parentId: string, content: string) => Promise<boolean>;
  onEdit: (commentId: string, content: string) => Promise<boolean>;
  onRequestDelete: (comment: Comment) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth = 0,
  onReply,
  onEdit,
  onRequestDelete,
}) => {
  const { user, isAuthenticated } = useAuth();

  // State for inline reply form
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // State for inline edit form
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isOwner = Boolean(
    isAuthenticated && user && comment.author && user.id === comment.author.id
  );
  const isDeleted = Boolean(comment.deletedAt);

  // Formatting date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(comment.createdAt));

  // Author initial for avatar fallback
  const authorInitial = comment.author?.name
    ? comment.author.name.charAt(0).toUpperCase()
    : '?';

  // Handle submit reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyContent.trim();
    if (!trimmed) {
      setReplyError('Reply cannot be empty.');
      return;
    }
    if (trimmed.length > 5000) {
      setReplyError('Reply cannot exceed 5,000 characters.');
      return;
    }

    setIsSubmittingReply(true);
    setReplyError(null);
    try {
      const success = await onReply(comment.id, trimmed);
      if (success) {
        setReplyContent('');
        setIsReplying(false);
      }
    } catch {
      setReplyError('Failed to post reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle submit edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError('Comment cannot be empty.');
      return;
    }
    if (trimmed.length > 5000) {
      setEditError('Comment cannot exceed 5,000 characters.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);
    try {
      const success = await onEdit(comment.id, trimmed);
      if (success) {
        setIsEditing(false);
      }
    } catch {
      setEditError('Failed to update comment. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div
      className={`comment-node ${depth > 0 ? 'comment-nested' : ''}`}
      id={`comment-${comment.id}`}
    >
      <div className="comment-card">
        {/* Comment Header */}
        <div className="comment-header">
          <div className="comment-author-group">
            <div className="comment-avatar" aria-hidden="true">
              {!isDeleted && comment.author?.avatarUrl ? (
                <img
                  src={comment.author.avatarUrl}
                  alt=""
                  className="comment-avatar-img"
                />
              ) : (
                authorInitial
              )}
            </div>
            <div className="comment-author-meta">
              <span className="comment-author-name">
                {isDeleted ? (
                  'Former Contributor'
                ) : comment.author?.id ? (
                  <Link
                    to={`/writers/${comment.author.id}`}
                    className="comment-author-link"
                  >
                    {comment.author.name}
                  </Link>
                ) : (
                  comment.author?.name || 'Anonymous'
                )}
              </span>
              <time className="comment-timestamp" dateTime={comment.createdAt}>
                {formattedDate}
              </time>
              {!isDeleted && comment.updatedAt !== comment.createdAt && (
                <span className="comment-edited-badge" title="Comment was edited">
                  (edited)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Comment Body or Inline Edit Mode */}
        {isEditing ? (
          <form className="comment-edit-form" onSubmit={handleSubmitEdit}>
            <label htmlFor={`edit-input-${comment.id}`} className="sr-only">
              Edit your comment
            </label>
            <textarea
              id={`edit-input-${comment.id}`}
              className="comment-textarea"
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSubmittingEdit}
              maxLength={5000}
              placeholder="Edit your comment..."
              autoFocus
            />

            <div className="comment-form-footer">
              <span className="comment-char-counter">
                {editContent.length} / 5,000
              </span>
              <div className="comment-form-actions">
                <button
                  type="button"
                  className="btn-text-subtle"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                    setEditError(null);
                  }}
                  disabled={isSubmittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-black-pill btn-pill-sm"
                  disabled={isSubmittingEdit || !editContent.trim()}
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {editError && (
              <div className="comment-form-error" role="alert">
                {editError}
              </div>
            )}
          </form>
        ) : (
          <div className="comment-content">
            {isDeleted ? (
              <p className="comment-deleted-notice">
                <em>This comment has been deleted</em>
              </p>
            ) : (
              <p className="comment-text">{comment.content}</p>
            )}
          </div>
        )}

        {/* Action Controls */}
        {!isEditing && (
          <div className="comment-actions">
            {isAuthenticated && (
              <button
                type="button"
                className="comment-action-btn"
                onClick={() => {
                  setIsReplying(!isReplying);
                  setReplyError(null);
                }}
                aria-expanded={isReplying}
                aria-label={`Reply to ${comment.author?.name || 'comment'}`}
              >
                <span className="comment-action-icon" aria-hidden="true">
                  ↳
                </span>
                <span>{isReplying ? 'Cancel Reply' : 'Reply'}</span>
              </button>
            )}

            {isOwner && !isDeleted && (
              <>
                <button
                  type="button"
                  className="comment-action-btn"
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(comment.content);
                    setEditError(null);
                  }}
                  aria-label="Edit comment"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="comment-action-btn comment-action-danger"
                  onClick={() => onRequestDelete(comment)}
                  aria-label="Delete comment"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Inline Reply Form */}
        {isReplying && (
          <form className="comment-reply-form" onSubmit={handleSubmitReply}>
            <label htmlFor={`reply-input-${comment.id}`} className="sr-only">
              Write a reply
            </label>
            <textarea
              id={`reply-input-${comment.id}`}
              className="comment-textarea"
              rows={2}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={isSubmittingReply}
              maxLength={5000}
              placeholder={`Replying to ${comment.author?.name || 'contributor'}...`}
              autoFocus
            />

            <div className="comment-form-footer">
              <span className="comment-char-counter">
                {replyContent.length} / 5,000
              </span>
              <div className="comment-form-actions">
                <button
                  type="button"
                  className="btn-text-subtle"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                    setReplyError(null);
                  }}
                  disabled={isSubmittingReply}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-black-pill btn-pill-sm"
                  disabled={isSubmittingReply || !replyContent.trim()}
                >
                  {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>

            {replyError && (
              <div className="comment-form-error" role="alert">
                {replyError}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Recursive Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies-list">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
