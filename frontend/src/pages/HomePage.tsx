import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { postsApi } from '../api/posts.api';
import { extractApiError } from '../api/client';
import { PostCard } from '../components/posts/PostCard';
import type { Post } from '../types/posts.types';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRecentPosts = async () => {
      setIsLoadingPosts(true);
      setPostsError(null);
      try {
        const data = await postsApi.getPosts();
        if (isMounted) {
          setPosts(data);
        }
      } catch (err) {
        if (isMounted) {
          const extracted = extractApiError(err);
          setPostsError(extracted.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      }
    };

    fetchRecentPosts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-page">
      {/* Aurora Editorial Hero */}
      <section className="aurora-hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            PERSPECTIVE · ESSAYS · CRAFT
          </div>

          <h1 className="hero-headline">
            A calm space for minds that want an <em>edge</em>.
          </h1>

          <p className="hero-description">
            A thoughtful, full-stack blog platform built for engineers and independent
            thinkers. Explore curated perspectives, share technical insights, and grow
            together without noise.
          </p>

          <div className="hero-actions">
            {isAuthenticated && user ? (
              <>
                <Link to="/essays/new" className="btn-black-pill large">
                  <span>Write an Essay</span>
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link to="/essays" className="btn-outline-pill large">
                  Browse Archive
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-black-pill large">
                  <span>Start Reading</span>
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link to="/essays" className="btn-outline-pill large">
                  Browse Archive
                </Link>
              </>
            )}
          </div>

          <div className="scroll-indicator" aria-hidden="true">
            <span className="scroll-icon" />
            <span>Scroll to explore</span>
          </div>
        </div>

        <div className="hero-right">
          <div className="sculpture-card">
            <img
              src="/images/aurora-home.jpg"
              alt="Architectural sculpture with fluted glass, volcanic stone, and satin brass details"
              className="sculpture-image"
            />
          </div>
        </div>
      </section>

      {/* Real Blog Posts Section */}
      <section id="essays" className="home-essays-section">
        <div className="section-header-row">
          <div>
            <span className="section-label">LATEST WRITING</span>
            <h2 className="section-headline">Recent Perspectives</h2>
            <p className="section-subtitle">
              Essays and technical commentaries published directly to the platform.
            </p>
          </div>

          <div className="section-header-action">
            {isAuthenticated ? (
              <Link to="/essays/new" className="btn-black-pill">
                <span>Write an essay</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <Link to="/essays" className="btn-outline-pill">
                View Archive ↗
              </Link>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoadingPosts && (
          <div className="article-loading-state" aria-live="polite">
            <div className="article-loading-spinner" aria-hidden="true" />
            <p className="article-loading-text">Loading latest essays...</p>
          </div>
        )}

        {/* Error State */}
        {postsError && (
          <div className="alert-banner alert-error" role="alert">
            <div>{postsError}</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingPosts && !postsError && posts.length === 0 && (
          <div className="empty-state-box">
            <div className="empty-icon" aria-hidden="true">
              ✍️
            </div>
            <h3 className="empty-title">No essays published yet</h3>
            <p className="empty-desc">
              Be the first author to contribute to the platform. Your essay will appear here
              and in the permanent archive.
            </p>
            <div className="empty-actions">
              {isAuthenticated ? (
                <Link to="/essays/new" className="btn-black-pill">
                  <span>Write the First Essay</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <Link to="/register" className="btn-black-pill">
                  <span>Sign Up to Publish</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Real Posts Grid */}
        {!isLoadingPosts && !postsError && posts.length > 0 && (
          <>
            <div className="essays-grid">
              {posts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {posts.length > 6 && (
              <div className="view-more-container">
                <Link to="/essays" className="btn-outline-pill large">
                  View All {posts.length} Essays in Archive ↗
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* Editorial Milestones / Philosophy Section */}
      <section className="home-milestones-section">
        <div className="milestones-inner">
          <span className="section-label">PLATFORM PRINCIPLES</span>
          <h2 className="section-headline">
            Designed for clarity, focus, and technical depth.
          </h2>

          <div className="milestone-grid">
            <div className="milestone-card">
              <span className="milestone-num">01</span>
              <h3 className="milestone-title">Curated Essays</h3>
              <p className="milestone-desc">
                High-signal writing on architecture, full-stack engineering, and career
                trajectories, crafted with utmost typographical care.
              </p>
            </div>

            <div className="milestone-card">
              <span className="milestone-num">02</span>
              <h3 className="milestone-title">Verified Identity</h3>
              <p className="milestone-desc">
                Stateful authentication backed by PostgreSQL database sessions and bcrypt
                password hashing with zero client Web Storage exposure.
              </p>
            </div>

            <div className="milestone-card">
              <span className="milestone-num">03</span>
              <h3 className="milestone-title">Author Ownership</h3>
              <p className="milestone-desc">
                Complete control over your essays. Authors can compose, update, and remove
                their publications with cryptographic permission checks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
