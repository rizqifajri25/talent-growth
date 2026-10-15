import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postsApi } from '../api/posts.api';
import { extractApiError } from '../api/client';
import { useAuth } from '../context/useAuth';
import { PostCard } from '../components/posts/PostCard';
import { Pagination } from '../components/common/Pagination';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import type { Post, PaginationMeta } from '../types/posts.types';

const STANDARD_CATEGORIES = [
  'All',
  'Architecture',
  'Engineering',
  'Systems',
  'Philosophy',
  'Career',
];

export const EssaysPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters as single source of truth
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'All';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  useDocumentTitle(
    categoryParam !== 'All' ? `${categoryParam} Essays` : 'The Archive — Essays',
    'Browse our curated collection of technical essays, architecture patterns, and engineering reflections.'
  );

  // Search input state with live typing responsiveness
  const [prevQuery, setPrevQuery] = useState(queryParam);
  const [searchInput, setSearchInput] = useState(queryParam);

  // Synchronize local search input if URL changes externally (e.g. browser Back/Forward)
  if (queryParam !== prevQuery) {
    setPrevQuery(queryParam);
    setSearchInput(queryParam);
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: pageParam,
    limit: 9,
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
        // Always reset to page 1 on query change
        nextParams.delete('page');
        setSearchParams(nextParams, { replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, queryParam, searchParams, setSearchParams]);

  // Fetch posts when URL parameters change
  useEffect(() => {
    const requestId = ++activeRequestIdRef.current;
    let isMounted = true;

    const fetchPosts = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await postsApi.getPosts({
          q: queryParam || undefined,
          category: categoryParam !== 'All' ? categoryParam : undefined,
          page: pageParam,
          limit: 9,
        });

        // Only commit state if this is the newest active request
        if (isMounted && requestId === activeRequestIdRef.current) {
          setPosts(result.posts);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (isMounted && requestId === activeRequestIdRef.current) {
          const extracted = extractApiError(err);
          setErrorMessage(extracted.message);
        }
      } finally {
        if (isMounted && requestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [queryParam, categoryParam, pageParam, refreshIndex]);

  // Category change handler (resets page to 1)
  const handleCategorySelect = (category: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category && category !== 'All') {
      nextParams.set('category', category);
    } else {
      nextParams.delete('category');
    }
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  // Pagination page change handler
  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newPage > 1) {
      nextParams.set('page', String(newPage));
    } else {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
    // Smoothly scroll back to top of archive
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchInput('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  // Categories list combining standard and dynamic
  const availableCategories = useMemo(() => {
    const set = new Set<string>(STANDARD_CATEGORIES);
    for (const p of posts) {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    }
    return Array.from(set);
  }, [posts]);

  return (
    <div className="essays-archive-page">
      {/* Editorial Header */}
      <header className="archive-header">
        <div className="archive-header-left">
          <span className="archive-eyebrow">ESSAYS & EDITORIALS</span>
          <h1 className="archive-headline">The Archive</h1>
          <p className="archive-subtitle">
            Long-form essays, technical architectures, and career perspectives authored
            by our community of engineers and thinkers.
          </p>
        </div>

        {isAuthenticated && (
          <div className="archive-header-actions">
            <Link to="/essays/new" className="btn-black-pill">
              <span>Write an essay</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )}
      </header>

      {/* Search and Category Control Bar */}
      <div className="archive-controls-card">
        {/* Search Input Box */}
        <div className="archive-search-box">
          <label htmlFor="essay-search" className="sr-only">
            Search essays by title or content
          </label>
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              id="essay-search"
              type="search"
              className="porcelain-search-input"
              placeholder="Search essays by title or content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={100}
              aria-label="Search essays by title or content"
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

        {/* Category Filter Pills */}
        <div className="category-filter-bar" role="tablist" aria-label="Filter essays by topic">
          {availableCategories.map((cat) => {
            const isSelected = categoryParam === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`category-filter-pill ${isSelected ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
                role="tab"
                aria-selected={isSelected}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="alert-banner alert-error" role="alert">
          <div>{errorMessage}</div>
          <button
            type="button"
            className="btn-outline-pill"
            style={{ marginTop: '0.75rem' }}
            onClick={() => setRefreshIndex((prev) => prev + 1)}
          >
            Retry Fetching
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="article-loading-state" aria-live="polite">
          <div className="article-loading-spinner" aria-hidden="true" />
          <p className="article-loading-text">
            {queryParam
              ? `Searching essays for "${queryParam}"...`
              : 'Retrieving published essays...'}
          </p>
        </div>
      )}

      {/* Empty States */}
      {!isLoading && !errorMessage && posts.length === 0 && (
        <>
          {/* Case 1: Search yielded no matches */}
          {queryParam ? (
            <div className="empty-state-box">
              <div className="empty-icon" aria-hidden="true">
                🔍
              </div>
              <h2 className="empty-title">No matching essays found</h2>
              <p className="empty-desc">
                We couldn&rsquo;t find any essays matching &ldquo;{queryParam}&rdquo;
                {categoryParam !== 'All' ? ` in the ${categoryParam} category.` : '.'}
              </p>
              <div className="empty-actions">
                <button
                  type="button"
                  className="btn-outline-pill"
                  onClick={handleClearSearch}
                >
                  Clear Search Query
                </button>
              </div>
            </div>
          ) : categoryParam !== 'All' ? (
            /* Case 2: Selected category has no essays */
            <div className="empty-state-box">
              <h2 className="empty-title">No essays in &ldquo;{categoryParam}&rdquo;</h2>
              <p className="empty-desc">
                No essays match this topic filter. Try selecting &ldquo;All&rdquo; to browse all
                essays in the archive.
              </p>
              <button
                type="button"
                className="btn-outline-pill"
                onClick={() => handleCategorySelect('All')}
              >
                View All Essays
              </button>
            </div>
          ) : (
            /* Case 3: Archive is completely empty */
            <div className="empty-state-box">
              <div className="empty-icon" aria-hidden="true">
                ✍️
              </div>
              <h2 className="empty-title">No essays published yet</h2>
              <p className="empty-desc">
                The archive is currently waiting for its opening publication. Be the first
                author to share your perspective with our readers.
              </p>
              <div className="empty-actions">
                {isAuthenticated ? (
                  <Link to="/essays/new" className="btn-black-pill">
                    <span>Write the First Essay</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ) : (
                  <Link to="/register" className="btn-black-pill">
                    <span>Join & Start Writing</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Posts Grid */}
      {!isLoading && !errorMessage && posts.length > 0 && (
        <>
          <div className="essays-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Reusable Aurora Pagination */}
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            itemName="essays"
          />
        </>
      )}
    </div>
  );
};
