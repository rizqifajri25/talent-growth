import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { commentsApi } from '../../api/comments.api';
import { extractApiError } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import { CommentItem } from './CommentItem';
import { CommentDeleteModal } from './CommentDeleteModal';
import type { Comment } from '../../types/comments.types';

interface CommentSectionProps {
  postId: string;
}

/**
 * Counts total comments across all nested levels in the tree.
 */
function countTotalComments(list: Comment[]): number {
  let total = 0;
  for (const item of list) {
    total += 1;
    if (item.replies && item.replies.length > 0) {
      total += countTotalComments(item.replies);
    }
  }
  return total;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Top-level comment form state
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Deletion modal state
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refreshComments = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchComments = async () => {
      try {
        const data = await commentsApi.getComments(postId);
        if (!isMounted) return;
        setComments(data);
        setLoadError(null);
      } catch (err) {
        if (!isMounted) return;
        const extracted = extractApiError(err);
        setLoadError(extracted.message || 'Failed to load comments.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [postId, refreshIndex]);

  // Create top-level comment
  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed) {
      setFormError('Comment cannot be empty.');
      return;
    }
    if (trimmed.length > 5000) {
      setFormError('Comment cannot exceed 5,000 characters.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFeedbackNotice(null);

    try {
      await commentsApi.createComment(postId, { content: trimmed });
      setNewContent('');
      setFeedbackNotice('Your comment has been published.');
      refreshComments();
    } catch (err) {
      const extracted = extractApiError(err);
      setFormError(extracted.message || 'Failed to publish comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reply handler passed to CommentItem
  const handleReply = async (parentId: string, content: string): Promise<boolean> => {
    try {
      await commentsApi.createComment(postId, { content, parentId });
      setFeedbackNotice('Your reply has been published.');
      refreshComments();
      return true;
    } catch (err) {
      const extracted = extractApiError(err);
      throw new Error(extracted.message || 'Failed to publish reply.');
    }
  };

  // Edit handler passed to CommentItem
  const handleEdit = async (commentId: string, content: string): Promise<boolean> => {
    try {
      await commentsApi.updateComment(commentId, { content });
      setFeedbackNotice('Comment updated successfully.');
      refreshComments();
      return true;
    } catch (err) {
      const extracted = extractApiError(err);
      throw new Error(extracted.message || 'Failed to update comment.');
    }
  };

  // Delete handler triggered from modal confirmation
  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    setIsDeleting(true);

    try {
      await commentsApi.deleteComment(commentToDelete.id);
      setFeedbackNotice('Comment removed.');
      setCommentToDelete(null);
      refreshComments();
    } catch (err) {
      const extracted = extractApiError(err);
      setFormError(extracted.message || 'Failed to delete comment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalCount = countTotalComments(comments);

  return (
    <section className="comment-section" aria-labelledby="comments-heading">
      <div className="comment-section-header">
        <div className="comment-heading-wrap">
          <h2 id="comments-heading" className="comment-section-title">
            Conversation
          </h2>
          <span className="comment-count-badge" aria-label={`${totalCount} comments`}>
            {totalCount}
          </span>
        </div>
        <p className="comment-section-subtitle">
          Share reflections, architectural critiques, and diverse perspectives.
        </p>
      </div>

      {feedbackNotice && (
        <div className="alert-banner alert-success" role="status">
          <span>{feedbackNotice}</span>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={() => setFeedbackNotice(null)}
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      {/* Top-Level Add Comment Form */}
      {isAuthenticated ? (
        <form className="comment-new-form" onSubmit={handleCreateComment}>
          <label htmlFor="new-comment-textarea" className="sr-only">
            Add your comment
          </label>
          <textarea
            id="new-comment-textarea"
            className="comment-textarea"
            rows={3}
            placeholder="Add to the discussion..."
            value={newContent}
            onChange={(e) => {
              setNewContent(e.target.value);
              if (formError) setFormError(null);
            }}
            disabled={isSubmitting}
            maxLength={5000}
          />

          <div className="comment-form-footer">
            <span className="comment-char-counter">
              {newContent.length} / 5,000
            </span>
            <button
              type="submit"
              className="btn-black-pill btn-pill-sm"
              disabled={isSubmitting || !newContent.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>

          {formError && (
            <div className="comment-form-error" role="alert">
              {formError}
            </div>
          )}
        </form>
      ) : (
        <div className="comment-auth-prompt">
          <div className="comment-auth-prompt-content">
            <h3 className="comment-auth-prompt-title">Join the Discussion</h3>
            <p className="comment-auth-prompt-desc">
              Sign in to share your perspective or reply to contributors.
            </p>
          </div>
          <Link
            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
            className="btn-black-pill btn-pill-sm"
          >
            <span>Sign In to Comment</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="comment-loading-state" aria-live="polite">
          <div className="article-loading-spinner" aria-hidden="true" />
          <p className="comment-loading-text">Loading conversation...</p>
        </div>
      )}

      {/* Error State */}
      {loadError && !isLoading && (
        <div className="comment-error-card" role="alert">
          <p className="comment-error-text">{loadError}</p>
          <button
            type="button"
            className="btn-outline-pill btn-pill-sm"
            onClick={refreshComments}
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !loadError && comments.length === 0 && (
        <div className="comment-empty-state">
          <div className="comment-empty-icon" aria-hidden="true">
            💬
          </div>
          <h3 className="comment-empty-title">No comments yet</h3>
          <p className="comment-empty-desc">
            Be the first to share your thoughts and contribute to this essay.
          </p>
        </div>
      )}

      {/* Comments Thread List */}
      {!isLoading && comments.length > 0 && (
        <div className="comment-threads-list" role="feed" aria-label="Comments feed">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              onReply={handleReply}
              onEdit={handleEdit}
              onRequestDelete={(c) => setCommentToDelete(c)}
            />
          ))}
        </div>
      )}

      {/* Accessible Delete Confirmation Dialog */}
      <CommentDeleteModal
        isOpen={Boolean(commentToDelete)}
        hasReplies={Boolean(
          commentToDelete && commentToDelete.replies && commentToDelete.replies.length > 0
        )}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setCommentToDelete(null)}
      />
    </section>
  );
};
