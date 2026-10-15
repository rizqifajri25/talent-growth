import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsApi } from '../api/posts.api';
import { extractApiError } from '../api/client';
import { useAuth } from '../context/useAuth';
import { MarkdownEditor } from '../components/markdown/MarkdownEditor';
import type { Post } from '../types/posts.types';

export const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(!id);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadPost = async () => {
      try {
        const data = await postsApi.getPostById(id);
        if (!isMounted) return;
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setCategory(data.category || '');

        if (user && data.authorId !== user.id) {
          setIsForbidden(true);
        }
      } catch (err) {
        if (!isMounted) return;
        const extracted = extractApiError(err);
        if (extracted.status === 404 || extracted.status === 400) {
          setIsNotFound(true);
        } else {
          setGeneralError(extracted.message);
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
  }, [id, user]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required and cannot be empty.';
    } else if (title.trim().length > 255) {
      errors.title = 'Title must not exceed 255 characters.';
    }

    if (!content.trim()) {
      errors.content = 'Content is required and cannot be empty.';
    } else if (content.trim().length > 50000) {
      errors.content = 'Content must not exceed 50,000 characters.';
    }

    if (category.trim().length > 100) {
      errors.category = 'Category must not exceed 100 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !post) return;
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedPost = await postsApi.updatePost(id, {
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || null,
      });

      // Redirect to the updated post detail page
      navigate(`/essays/${updatedPost.id}`);
    } catch (err) {
      const extracted = extractApiError(err);
      if (extracted.status === 403) {
        setIsForbidden(true);
      } else if (extracted.status === 404) {
        setIsNotFound(true);
      } else {
        setGeneralError(extracted.message);
        if (extracted.fieldErrors) {
          setFieldErrors(extracted.fieldErrors);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="editor-container">
        <div className="article-loading-state" aria-live="polite">
          <div className="article-loading-spinner" aria-hidden="true" />
          <p className="article-loading-text">Loading essay for editing...</p>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="editor-container">
        <div className="article-not-found-card">
          <span className="not-found-label">404 · NOT FOUND</span>
          <h1 className="not-found-title">Essay Unavailable</h1>
          <p className="not-found-desc">
            The essay you are attempting to edit does not exist or has been deleted.
          </p>
          <div className="not-found-actions">
            <Link to="/essays" className="btn-black-pill">
              <span>Return to Essays</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="editor-container">
        <div className="article-not-found-card">
          <span className="modal-badge-danger">403 · FORBIDDEN</span>
          <h1 className="not-found-title">Permission Denied</h1>
          <p className="not-found-desc">
            You do not have permission to edit this essay because it was authored by
            another member of the editorial platform.
          </p>
          <div className="not-found-actions">
            <Link to={id ? `/essays/${id}` : '/essays'} className="btn-black-pill">
              <span>View Essay</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/essays" className="btn-outline-pill">
              All Essays
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-card">
        <div className="editor-header">
          <div className="editor-eyebrow">EDITORIAL REVISION</div>
          <h1 className="editor-title">Edit Essay</h1>
          <p className="editor-subtitle">
            Refine your thoughts, update analysis, or polish typographical formatting.
          </p>
        </div>

        {generalError && (
          <div className="alert-banner alert-error" role="alert">
            <div>{generalError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="editor-form">
          {/* Title Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="post-title" className="form-label">
                Essay Title <span className="required-star">*</span>
              </label>
              <span className="char-count">{title.length}/255</span>
            </div>
            <input
              id="post-title"
              type="text"
              className={`porcelain-input ${fieldErrors.title ? 'input-error' : ''}`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: '' }));
                }
              }}
              maxLength={255}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? 'title-error' : undefined}
            />
            {fieldErrors.title && (
              <span id="title-error" className="field-error-message" role="alert">
                {fieldErrors.title}
              </span>
            )}
          </div>

          {/* Category Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="post-category" className="form-label">
                Category / Topic <span className="optional-tag">(Optional)</span>
              </label>
              <span className="char-count">{category.length}/100</span>
            </div>
            <input
              id="post-category"
              type="text"
              className={`porcelain-input ${fieldErrors.category ? 'input-error' : ''}`}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (fieldErrors.category) {
                  setFieldErrors((prev) => ({ ...prev, category: '' }));
                }
              }}
              maxLength={100}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={fieldErrors.category ? 'category-error' : undefined}
            />
            {fieldErrors.category && (
              <span id="category-error" className="field-error-message" role="alert">
                {fieldErrors.category}
              </span>
            )}
          </div>

          {/* Content Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="post-content" className="form-label">
                Essay Content <span className="required-star">*</span>
              </label>
              <span className="char-count">{content.length}/50,000</span>
            </div>
            <MarkdownEditor
              id="post-content"
              value={content}
              onChange={(newVal) => {
                setContent(newVal);
                if (fieldErrors.content) {
                  setFieldErrors((prev) => ({ ...prev, content: '' }));
                }
              }}
              disabled={isSubmitting}
              hasError={Boolean(fieldErrors.content)}
              ariaDescribedBy={fieldErrors.content ? 'content-error' : undefined}
            />
            {fieldErrors.content && (
              <span id="content-error" className="field-error-message" role="alert">
                {fieldErrors.content}
              </span>
            )}
          </div>

          {/* Form Actions */}
          <div className="editor-actions">
            <Link to={id ? `/essays/${id}` : '/essays'} className="btn-outline-pill">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-black-pill"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Revisions'}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
