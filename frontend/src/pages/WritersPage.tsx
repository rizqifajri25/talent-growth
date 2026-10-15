import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authorsApi } from '../api/authors.api';
import { extractApiError } from '../api/client';
import { Pagination } from '../components/common/Pagination';
import type { AuthorSummary } from '../types/authors.types';
import type { PaginationMeta } from '../types/posts.types';

export const WritersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters as single source of truth
  const queryParam = searchParams.get('q') || '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  // Search input state with live typing responsiveness
  const [prevQuery, setPrevQuery] = useState(queryParam);
  const [searchInput, setSearchInput] = useState(queryParam);

  // Synchronize local search input if URL changes externally (e.g. browser Back/Forward)
  if (queryParam !== prevQuery) {
    setPrevQuery(queryParam);
    setSearchInput(queryParam);
  }

  const [authors, setAuthors] = useState<AuthorSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: pageParam,
    limit: 12,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Stale request race-condition protection
  const activeRequestIdRef = useRef<number>(0);

  // Debounced search typing -> URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedInput = searchInput.trim();
      if (trimmedInput !== queryParam) {
        const nextParams = new URLSearchParams(searchParams);
        if (trimmedInput) {
          nextParams.set('q', trimmedInput);
        } else {
          nextParams.delete('q');
        }
        nextParams.delete('page');
        setSearchParams(nextParams, { replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, queryParam, searchParams, setSearchParams]);

  // Fetch authors when URL parameters change
  useEffect(() => {
    const requestId = ++activeRequestIdRef.current;
    let isMounted = true;

    const fetchAuthors = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await authorsApi.getAuthors({
          q: queryParam || undefined,
          page: pageParam,
          limit: 12,
        });

        if (isMounted && requestId === activeRequestIdRef.current) {
          setAuthors(result.authors);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (isMounted && requestId === activeRequestIdRef.current) {
          const extracted = extractApiError(err);
          setErrorMessage(extracted.message || 'Failed to load writers directory.');
        }
      } finally {
        if (isMounted && requestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchAuthors();

    return () => {
      isMounted = false;
    };
  }, [queryParam, pageParam, refreshIndex]);

  const handleRetry = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newPage > 1) {
      nextParams.set('page', String(newPage));
    } else {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

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

      {/* Search Input Box */}
      <div className="writers-search-container">
        <div className="archive-search-box">
          <label htmlFor="writer-search" className="sr-only">
            Search writers by name or biography
          </label>
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              id="writer-search"
              type="search"
              className="porcelain-search-input"
              placeholder="Search writers by name or biography..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={100}
              aria-label="Search writers by name or biography"
            />
            {searchInput && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

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
            <p className="writers-loading-text">
              {queryParam
                ? `Searching writers for "${queryParam}"...`
                : 'Loading contributor roster...'}
            </p>
          </div>
        )}

        {/* Empty States */}
        {!isLoading && !errorMessage && authors.length === 0 && (
          <>
            {queryParam ? (
              <div className="writers-empty-state">
                <span className="writers-empty-icon" aria-hidden="true">
                  🔍
                </span>
                <h2 className="writers-empty-title">No matching writers</h2>
                <p className="writers-empty-desc">
                  We couldn&rsquo;t find any contributors matching &ldquo;{queryParam}&rdquo;.
                </p>
                <button
                  type="button"
                  className="btn-outline-pill"
                  onClick={handleClearSearch}
                >
                  Clear Search Query
                </button>
              </div>
            ) : (
              <div className="writers-empty-state">
                <span className="writers-empty-icon" aria-hidden="true">
                  🖋️
                </span>
                <h2 className="writers-empty-title">Roster Forming</h2>
                <p className="writers-empty-desc">
                  No authors have published essays yet. When contributors release their
                  first writings, they will appear in this permanent roster.
                </p>
                <Link to="/essays" className="btn-outline-pill">
                  Explore Essays Archive ↗
                </Link>
              </div>
            )}
          </>
        )}

        {/* Authors Grid */}
        {!isLoading && !errorMessage && authors.length > 0 && (
          <>
            <div className="writers-grid">
              {authors.map((author) => (
                <article key={author.id} className="writer-card">
                  <div>
                    <div className="writer-card-top">
                      <div className="writer-avatar-circle" aria-hidden="true">
                        {author.avatarUrl ? (
                          <img
                            src={author.avatarUrl}
                            alt={author.name}
                            className="writer-avatar-img"
                          />
                        ) : (
                          <span className="writer-monogram">
                            {getInitials(author.name)}
                          </span>
                        )}
                      </div>

                      <div className="writer-info">
                        <h2 className="writer-name">{author.name}</h2>
                        <span className="writer-meta-joined">
                          Member since {formatJoinedDate(author.joinedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="writer-card-body">
                      {author.bio ? (
                        <p className="writer-bio">{author.bio}</p>
                      ) : (
                        <p className="writer-bio writer-bio-muted">
                          Contributing author on Talent Growth Editorial Studio.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="writer-card-footer">
                    <span className="writer-post-count-badge">
                      {author.postCount}{' '}
                      {author.postCount === 1 ? 'essay' : 'essays'}
                    </span>

                    <Link
                      to={`/writers/${author.id}`}
                      className="writer-view-link"
                      aria-label={`View ${author.name}'s public profile and essays`}
                    >
                      <span>View Profile</span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Reusable Aurora Pagination */}
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              itemName="writers"
            />
          </>
        )}
      </main>
    </div>
  );
};
