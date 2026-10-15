import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { postsApi } from '../api/posts.api';
import { extractApiError } from '../api/client';
import { PostCard } from '../components/posts/PostCard';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import type { Post } from '../types/posts.types';

export const HomePage: React.FC = () => {
  useDocumentTitle('Home', 'A calm editorial publication platform for engineering, systems craft, and thought leadership.');
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [totalPostsCount, setTotalPostsCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchRecentPosts = async () => {
      setIsLoadingPosts(true);
      setPostsError(null);
      try {
        const data = await postsApi.getPosts({ limit: 6 });
        if (isMounted) {
          setPosts(data.posts);
          setTotalPostsCount(data.pagination.totalItems);
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

            {totalPostsCount > 6 && (
              <div className="view-more-container">
                <Link to="/essays" className="btn-outline-pill large">
                  View All {totalPostsCount} Essays in Archive ↗
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* Editorial Milestones / Philosophy Section */}
      <section className="home-milestones-section">
        <div className="milestones-inner">
          <span className="section-label">PLATFORM OPERATIONS</span>
          <h2 className="section-headline">
            A structured workflow from authoring to community discovery.
          </h2>

          <div className="milestone-grid">
            <div className="milestone-card">
              <span className="milestone-num">01</span>
              <h3 className="milestone-title">Authoring & Publishing</h3>
              <p className="milestone-desc">
                Writers draft essays in a dedicated Markdown workspace with real-time preview,
                categorize work into curated topic taxonomies, and attach editorial cover imagery.
              </p>
            </div>

            <div className="milestone-card">
              <span className="milestone-num">02</span>
              <h3 className="milestone-title">Discovery & Discussion</h3>
              <p className="milestone-desc">
                Readers explore publications through topic taxonomies and archive search,
                participating in structured, threaded conversations beneath each essay.
              </p>
            </div>

            <div className="milestone-card">
              <span className="milestone-num">03</span>
              <h3 className="milestone-title">Author Workspace & Ownership</h3>
              <p className="milestone-desc">
                Contributors curate their public profile with personal bios and avatars,
                showcase work in the Writers directory, and maintain full ownership to update or withdraw publications.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
