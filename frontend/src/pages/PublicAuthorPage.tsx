import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authorsApi } from '../api/authors.api';
import { extractApiError } from '../api/client';
import type { PublicAuthorProfile } from '../types/authors.types';

export const PublicAuthorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [author, setAuthor] = useState<PublicAuthorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(!id);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadAuthor = async () => {
      try {
        const data = await authorsApi.getAuthorById(id);
        if (!isMounted) return;
        setAuthor(data);
        setIsNotFound(false);
      } catch (err) {
        if (!isMounted) return;
        const extracted = extractApiError(err);
        if (extracted.status === 404 || extracted.status === 400) {
          setIsNotFound(true);
        } else {
          setErrorMessage(extracted.message || 'Failed to load contributor profile.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAuthor();
    return () => {
      isMounted = false;
    };
  }, [id, refreshIndex]);

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return '—';
    }
  };

  if (isLoading) {
    return (
      <div className="author-page-container">
        <div className="article-loading-state" aria-live="polite">
          <div className="article-loading-spinner" aria-hidden="true" />
          <p className="article-loading-text">Loading contributor profile...</p>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="author-page-container">
        <div className="article-not-found-card">
          <span className="not-found-label">404 · NOT FOUND</span>
          <h1 className="not-found-title">Contributor Unavailable</h1>
          <p className="not-found-desc">
            The author you are looking for does not exist or may have removed their account.
          </p>
          <div className="not-found-actions">
            <Link to="/writers" className="btn-black-pill">
              <span>View All Writers</span>
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

  if (errorMessage && !author) {
    return (
      <div className="author-page-container">
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

  if (!author) return null;

  return (
    <div className="author-page-container">
      {/* Back Navigation */}
      <nav className="author-nav" aria-label="Breadcrumb">
        <Link to="/writers" className="author-back-link">
          <span aria-hidden="true">←</span>
          <span>All Writers</span>
        </Link>
      </nav>

      {/* Author Profile Header Card */}
      <header className="author-hero-card">
        <div className="author-hero-content">
          <div className="author-monogram-large" aria-hidden="true">
            {getInitials(author.name)}
          </div>

          <div className="author-hero-details">
            <span className="author-eyebrow">PUBLISHED CONTRIBUTOR</span>
            <h1 className="author-hero-name">{author.name}</h1>

            <p className="author-hero-bio">
              {author.bio || (
                <span className="author-bio-placeholder">
                  This author has not provided a biography yet.
                </span>
              )}
            </p>

            <div className="author-meta-bar">
              <span className="author-meta-pill">
                Member since {formatDate(author.joinedAt)}
              </span>
              <span className="author-meta-pill author-meta-pill-accent">
                {author.postCount} {author.postCount === 1 ? 'Published Essay' : 'Published Essays'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Published Essays Section */}
      <section className="author-essays-section" aria-labelledby="author-essays-heading">
        <div className="author-essays-header">
          <h2 id="author-essays-heading" className="author-section-title">
            Published Essays
          </h2>
          <span className="author-essays-count">{author.posts.length}</span>
        </div>

        {author.posts.length === 0 ? (
          <div className="author-empty-essays">
            <p className="author-empty-text">
              {author.name} has not published any essays yet. Check back soon for future
              publications.
            </p>
          </div>
        ) : (
          <div className="author-essays-grid">
            {author.posts.map((post) => (
              <article key={post.id} className="author-essay-card">
                <div className="author-essay-top">
                  {post.category && (
                    <span className="post-category-badge">{post.category}</span>
                  )}
                  <time className="author-essay-date" dateTime={post.createdAt}>
                    {formatDate(post.createdAt)}
                  </time>
                </div>

                <h3 className="author-essay-title">
                  <Link to={`/essays/${post.id}`}>{post.title}</Link>
                </h3>

                <p className="author-essay-excerpt">
                  {post.content.length > 180
                    ? `${post.content.substring(0, 180)}...`
                    : post.content}
                </p>

                <div className="author-essay-footer">
                  <Link
                    to={`/essays/${post.id}`}
                    className="author-essay-link"
                    aria-label={`Read essay: ${post.title}`}
                  >
                    <span>Read Essay</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
