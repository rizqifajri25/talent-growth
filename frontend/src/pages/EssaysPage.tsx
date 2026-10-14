import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '../api/posts.api';
import { extractApiError } from '../api/client';
import { useAuth } from '../context/useAuth';
import { PostCard } from '../components/posts/PostCard';
import type { Post } from '../types/posts.types';

export const EssaysPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const handleRetry = () => {
    setRefreshIndex((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    const loadPosts = async () => {
      try {
        const data = await postsApi.getPosts();
        if (!isMounted) return;
        setPosts(data);
      } catch (err) {
        if (!isMounted) return;
        const extracted = extractApiError(err);
        setErrorMessage(extracted.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPosts();
    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const post of posts) {
      if (post.category && post.category.trim()) {
        set.add(post.category.trim());
      }
    }
    return ['All', ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All') return posts;
    return posts.filter((p) => p.category === selectedCategory);
  }, [posts, selectedCategory]);

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

      {/* Category Pills Filter */}
      {categories.length > 1 && (
        <div className="category-filter-bar" role="tablist" aria-label="Filter essays by topic">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              role="tab"
              aria-selected={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="alert-banner alert-error" role="alert">
          <div>{errorMessage}</div>
          <button
            type="button"
            className="btn-outline-pill"
            style={{ marginTop: '0.75rem' }}
            onClick={handleRetry}
          >
            Retry Fetching
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="article-loading-state" aria-live="polite">
          <div className="article-loading-spinner" aria-hidden="true" />
          <p className="article-loading-text">Retrieving published essays...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !errorMessage && posts.length === 0 && (
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

      {/* Filtered empty state */}
      {!isLoading && !errorMessage && posts.length > 0 && filteredPosts.length === 0 && (
        <div className="empty-state-box">
          <h2 className="empty-title">No essays in &ldquo;{selectedCategory}&rdquo;</h2>
          <p className="empty-desc">
            No essays match this topic filter. Try selecting &ldquo;All&rdquo; to browse all
            essays.
          </p>
          <button
            type="button"
            className="btn-outline-pill"
            onClick={() => setSelectedCategory('All')}
          >
            View All Essays
          </button>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && !errorMessage && filteredPosts.length > 0 && (
        <div className="essays-grid">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};
