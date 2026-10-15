import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authorsApi } from '../api/authors.api';
import { extractApiError } from '../api/client';
import type { AuthorSummary } from '../types/authors.types';

export const WritersPage: React.FC = () => {
  const [authors, setAuthors] = useState<AuthorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchAuthors = async () => {
      try {
        const data = await authorsApi.getAuthors();
        if (!isMounted) return;
        setAuthors(data);
        setErrorMessage(null);
      } catch (err) {
        if (!isMounted) return;
        const extracted = extractApiError(err);
        setErrorMessage(extracted.message || 'Failed to load writers directory.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAuthors();
    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatJoinedDate = (dateString: string): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="writers-directory-page">
      {/* Editorial Header */}
      <header className="writers-hero-section">
        <div className="writers-hero-inner">
          <span className="hero-eyebrow">CONTRIBUTOR ROSTER</span>
          <h1 className="writers-headline">The Writers</h1>
          <p className="writers-subhead">
            Meet the engineers, systems architects, and independent thinkers shaping the
            intellectual discourse on Talent Growth.
          </p>
        </div>
      </header>

      <main className="writers-content-container">
        {/* Error State */}
        {errorMessage && !isLoading && (
          <div className="writers-error-card" role="alert">
            <p className="writers-error-text">{errorMessage}</p>
            <button
              type="button"
              className="btn-outline-pill"
              onClick={handleRetry}
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="writers-loading-state" aria-live="polite">
            <div className="article-loading-spinner" aria-hidden="true" />
            <p className="writers-loading-text">Loading contributor directory...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMessage && authors.length === 0 && (
          <div className="writers-empty-state">
            <span className="writers-empty-icon" aria-hidden="true">
              ✍️
            </span>
            <h2 className="writers-empty-title">No Contributors Found</h2>
            <p className="writers-empty-desc">
              No authors have published public essays yet. Be among the first to publish your
              perspective.
            </p>
            <div className="writers-empty-action">
              <Link to="/essays/new" className="btn-black-pill">
                <span>Write the First Essay</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        )}

        {/* Authors Grid */}
        {!isLoading && !errorMessage && authors.length > 0 && (
          <div className="writers-grid">
            {authors.map((author) => (
              <article key={author.id} className="writer-card">
                <div className="writer-card-top">
                  <div className="writer-avatar-circle" aria-hidden="true">
                    {getInitials(author.name)}
                  </div>
                  <div className="writer-info">
                    <h2 className="writer-name">{author.name}</h2>
                    <span className="writer-meta-joined">
                      Member since {formatJoinedDate(author.joinedAt)}
                    </span>
                  </div>
                </div>

                <div className="writer-card-body">
                  <p className="writer-bio">
                    {author.bio || (
                      <span className="writer-bio-muted">
                        Contributing author on Talent Growth Editorial Studio.
                      </span>
                    )}
                  </p>
                </div>

                <div className="writer-card-footer">
                  <span className="writer-post-count-badge">
                    {author.postCount} {author.postCount === 1 ? 'essay' : 'essays'}
                  </span>
                  <Link
                    to={`/writers/${author.id}`}
                    className="writer-view-link"
                    aria-label={`View public profile of ${author.name}`}
                  >
                    <span>View Profile</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
