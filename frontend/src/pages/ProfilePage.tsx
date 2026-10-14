import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { postsApi } from '../api/posts.api';
import { extractApiError } from '../api/client';
import { useAuth } from '../context/useAuth';
import { PostCard } from '../components/posts/PostCard';
import { DeleteConfirmModal } from '../components/posts/DeleteConfirmModal';
import type { User } from '../types/auth.types';
import type { Post } from '../types/posts.types';

export const ProfilePage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Author's posts state
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Delete modal state
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfileAndEssays = async () => {
      try {
        const currentUser = await authApi.getMe();
        if (!isMounted) return;
        setProfile(currentUser);
        setIsLoadingProfile(false);

        // Fetch posts for author
        try {
          const allPosts = await postsApi.getPosts();
          if (isMounted) {
            setUserPosts(allPosts.filter((p) => p.authorId === currentUser.id));
          }
        } catch (postErr) {
          if (isMounted) {
            const extracted = extractApiError(postErr);
            setPostsError(extracted.message);
          }
        } finally {
          if (isMounted) {
            setIsLoadingPosts(false);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setIsLoadingProfile(false);
        setIsLoadingPosts(false);
        const extracted = extractApiError(err);
        if (extracted.status === 401) {
          await logout();
          navigate('/login?session_expired=1');
          return;
        }
        setProfileError(extracted.message);
      }
    };

    loadProfileAndEssays();
    return () => {
      isMounted = false;
    };
  }, [logout, navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await postsApi.deletePost(postToDelete.id);
      setUserPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
    } catch (err) {
      const extracted = extractApiError(err);
      setDeleteError(extracted.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-left">
          <h1 className="profile-page-title">Author Workspace</h1>
          <p className="profile-page-subtitle">
            Authenticated author identity verified via <code>GET /api/v1/auth/me</code>
          </p>
          <span className="profile-badge-session">
            ● Active Session (In-Memory RAM)
          </span>
        </div>
        <div className="profile-header-actions">
          <Link to="/essays/new" className="btn-black-pill">
            <span>Write an essay</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <button
            type="button"
            className="btn-outline-pill"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>

      {profileError && (
        <div className="alert-banner alert-error" role="alert">
          <div>{profileError}</div>
        </div>
      )}

      {deleteError && (
        <div className="alert-banner alert-error" role="alert">
          <div>{deleteError}</div>
        </div>
      )}

      {isLoadingProfile && !profile && (
        <div className="aurora-profile-card" aria-live="polite">
          <p className="profile-page-subtitle">Retrieving author workspace...</p>
        </div>
      )}

      {profile && (
        <div className="aurora-profile-card">
          <div className="profile-identity-row">
            <div className="profile-monogram-large" aria-hidden="true">
              {getInitials(profile.name)}
            </div>

            <div className="profile-identity-details">
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
            </div>
          </div>

          <div className="profile-meta-grid">
            <div className="profile-meta-item">
              <span className="meta-label">Author Identifier</span>
              <span className="meta-value mono">{profile.id}</span>
            </div>
            <div className="profile-meta-item">
              <span className="meta-label">Member Since</span>
              <span className="meta-value">{formatDate(profile.createdAt)}</span>
            </div>
            <div className="profile-meta-item">
              <span className="meta-label">Published Essays</span>
              <span className="meta-value">
                {isLoadingPosts ? '...' : `${userPosts.length} published`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Author's Published Essays Section */}
      <section className="profile-essays-section">
        <div className="section-title-row">
          <div>
            <h2 className="essays-title">Your Published Essays</h2>
            <p className="essays-subtitle">
              Manage your publications, edit live content, or remove outdated articles.
            </p>
          </div>
          <Link to="/essays/new" className="btn-black-pill">
            <span>New Essay ↗</span>
          </Link>
        </div>

        {postsError && (
          <div className="alert-banner alert-error" role="alert">
            <div>{postsError}</div>
          </div>
        )}

        {isLoadingPosts && (
          <div className="article-loading-state" aria-live="polite">
            <div className="article-loading-spinner" aria-hidden="true" />
            <p className="article-loading-text">Loading your essays...</p>
          </div>
        )}

        {!isLoadingPosts && !postsError && userPosts.length === 0 && (
          <div className="empty-state-box">
            <div className="empty-icon" aria-hidden="true">
              ✍️
            </div>
            <h3 className="empty-title">You have not published any essays yet</h3>
            <p className="empty-desc">
              Your essays, draft notes, and technical articles will appear here. Publish your
              first piece to start your author portfolio.
            </p>
            <div className="empty-actions">
              <Link to="/essays/new" className="btn-black-pill">
                <span>Write Your First Essay</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        )}

        {!isLoadingPosts && userPosts.length > 0 && (
          <div className="essays-grid">
            {userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showActions={true}
                onDeleteClick={(p) => setPostToDelete(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(postToDelete)}
        postTitle={postToDelete?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeletePost}
        onCancel={() => !isDeleting && setPostToDelete(null)}
      />
    </div>
  );
};
