import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { postsApi } from '../api/posts.api';
import { extractApiError } from '../api/client';
import { MarkdownEditor } from '../components/markdown/MarkdownEditor';

export const NewPostPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const createdPost = await postsApi.createPost({
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || null,
      });

      // Redirect immediately to the new post detail page
      navigate(`/essays/${createdPost.id}`);
    } catch (err) {
      const extracted = extractApiError(err);
      setGeneralError(extracted.message);
      if (extracted.fieldErrors) {
        setFieldErrors(extracted.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-card">
        <div className="editor-header">
          <div className="editor-eyebrow">EDITORIAL DESK</div>
          <h1 className="editor-title">Compose New Essay</h1>
          <p className="editor-subtitle">
            Share technical deep-dives, architectural perspectives, or career insights
            with the community.
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
              placeholder="e.g. Architectural Minimalism in Modern Frontend Engineering"
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
              placeholder="e.g. Architecture, TypeScript, Systems, Philosophy"
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
            <Link to="/essays" className="btn-outline-pill">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-black-pill"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Publishing...' : 'Publish Essay'}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
