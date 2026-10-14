import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postsApi } from '../api/posts.api';
import { extractApiError } from '../api/client';
import { useAuth } from '../context/useAuth';
import { DeleteConfirmModal } from '../components/posts/DeleteConfirmModal';
import type { Post } from '../types/posts.types';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(!id);

  // Deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [refreshIndex, setRefreshIndex] = useState(0);
  const handleRetry = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadPost = async () => {
      try {
        const data = await postsApi.getPostById(id);
        if (!isMounted) return;
        setPost(data);
      } catch (err) {
        if (!isMounted) return;
        const extracted = extractApiError(err);
        if (extracted.status === 404 || extracted.status === 400) {
          setIsNotFound(true);
        } else {
          setErrorMessage(extracted.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPost();
    return () => {
      isMounted = false;
    };
  }, [id, refreshIndex]);

  const handleDelete = async () => {
    if (!post) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await postsApi.deletePost(post.id);
      setIsDeleteModalOpen(false);
      navigate('/essays', { replace: true });
    } catch (err) {
      const extracted = extractApiError(err);
      setDeleteError(extracted.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = Boolean(
    isAuthenticated && user && post && user.id === post.authorId
  );

  const formattedDate = post
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(post.createdAt))
    : '';

  if (isLoading) {
    return (
      <div className="article-container">
        <div className="article-loading-state" aria-live="polite">
          <div className="article-loading-spinner" aria-hidden="true" />
          <p className="article-loading-text">Loading essay...</p>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="article-container">
        <div className="article-not-found-card">
          <span className="not-found-label">404 · NOT FOUND</span>
          <h1 className="not-found-title">Essay Unavailable</h1>
          <p className="not-found-desc">
            The essay you are looking for does not exist or may have been permanently
            removed by its author.
          </p>
          <div className="not-found-actions">
            <Link to="/essays" className="btn-black-pill">
              <span>Return to Essays</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/" className="btn-outline-pill">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage && !post) {
    return (
      <div className="article-container">
        <div className="alert-banner alert-error" role="alert">
          <div>{errorMessage}</div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn-outline-pill"
            onClick={handleRetry}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <article className="article-container">
      {/* Back navigation */}
      <nav className="article-nav" aria-label="Breadcrumb">
        <Link to="/essays" className="article-back-link">
          <span aria-hidden="true">←</span>
          <span>All Essays</span>
        </Link>
      </nav>

      {deleteError && (
        <div className="alert-banner alert-error" role="alert">
          <div>{deleteError}</div>
        </div>
      )}

      {/* Article Header */}
      <header className="article-header">
        <div className="article-meta-top">
          {post.category && (
            <span className="post-category-badge">{post.category}</span>
          )}
          <time className="article-date" dateTime={post.createdAt}>
            {formattedDate}
          </time>
        </div>

        <h1 className="article-headline">{post.title}</h1>

        <div className="article-author-bar">
          <div className="article-author-info">
            <span className="author-avatar-dot" aria-hidden="true" />
            <div>
              <span className="article-author-label">WRITTEN BY</span>
              <div className="article-author-name">{post.author.name}</div>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="article-owner-actions">
              <Link
                to={`/essays/${post.id}/edit`}
                className="btn-outline-pill"
                aria-label="Edit this essay"
              >
                Edit Essay
              </Link>
              <button
                type="button"
                className="btn-danger-pill"
                onClick={() => setIsDeleteModalOpen(true)}
                aria-label="Delete this essay"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Article Body - Plain text rendered safely with preserved paragraph breaks */}
      <div className="article-body">
        {post.content}
      </div>

      {/* Article Footer */}
      <footer className="article-footer">
        <div className="article-footer-divider" aria-hidden="true" />
        <div className="article-footer-inner">
          <div className="article-footer-info">
            <span>Published on Talent Growth Editorial Platform</span>
            {post.updatedAt !== post.createdAt && (
              <span className="article-updated-label">
                · Updated {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(post.updatedAt))}
              </span>
            )}
          </div>
          <Link to="/essays" className="btn-outline-pill">
            ← Explore More Essays
          </Link>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        postTitle={post.title}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setIsDeleteModalOpen(false)}
      />
    </article>
  );
};
