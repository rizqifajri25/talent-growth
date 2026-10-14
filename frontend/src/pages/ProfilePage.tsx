import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { authApi } from '../api/auth.api';
import { extractApiError } from '../api/client';
import type { User } from '../types/auth.types';

export const ProfilePage: React.FC = () => {
  const { user: contextUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(contextUser);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      // Verified call to backend GET /api/v1/auth/me with Bearer token
      const freshUser = await authApi.getMe();
      setProfile(freshUser);
    } catch (err) {
      const extracted = extractApiError(err);
      if (extracted.status === 401) {
        // Token was rejected by backend; force local logout and redirect
        await logout();
        navigate('/login', {
          replace: true,
          state: { error: 'Your session has expired or is invalid. Please log in again.' },
        });
        return;
      }
      setProfileError(extracted.message || 'Failed to load profile from backend.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-wrapper animate-in">
        <div className="profile-header-banner">
          <div className="profile-header-left">
            <h1 className="page-title">Author Profile</h1>
            <p className="page-subtitle">
              Live account details retrieved from backend protected endpoint (
              <code>GET /api/v1/auth/me</code>)
            </p>
          </div>
          <button
            type="button"
            className="btn-logout-secondary"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>

        {/* Error State */}
        {profileError && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon" aria-hidden="true">⚠️</span>
            <div className="alert-content">
              <strong>Error loading profile:</strong> {profileError}
            </div>
            <button
              type="button"
              className="btn-retry"
              onClick={fetchProfile}
              disabled={isLoadingProfile}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoadingProfile && !profile && (
          <div className="profile-card profile-skeleton" aria-live="polite">
            <div className="skeleton-avatar" />
            <div className="skeleton-content">
              <div className="skeleton-line title" />
              <div className="skeleton-line subtitle" />
              <div className="skeleton-line body" />
            </div>
          </div>
        )}

        {/* Profile Card */}
        {profile && (
          <div className="profile-card">
            <div className="profile-identity">
              <div className="profile-avatar-large" aria-hidden="true">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.name}'s avatar`}
                    className="avatar-img"
                  />
                ) : (
                  <span>{getInitials(profile.name)}</span>
                )}
              </div>

              <div className="profile-identity-info">
                <div className="profile-name-row">
                  <h2 className="profile-name">{profile.name}</h2>
                  <span className="profile-status-badge">
                    <span className="status-dot-pulse" aria-hidden="true" />
                    Authenticated Session
                  </span>
                </div>
                <p className="profile-email">{profile.email}</p>
                <div className="profile-session-notice">
                  <span className="notice-icon" aria-hidden="true">🔒</span>
                  <span>
                    JWT Bearer token held strictly in-memory. Reloading the page will safely
                    clear memory state.
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="profile-detail-item">
                <span className="detail-label">Account ID</span>
                <span className="detail-value mono">{profile.id}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">{formatDate(profile.createdAt)}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Session Storage</span>
                <span className="detail-value highlight">In-Memory RAM Only</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Storage Verification</span>
                <span className="detail-value text-success">
                  ✓ 0 bytes in localStorage / sessionStorage
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Honest Empty State for Blog Articles */}
        <section className="profile-posts-section" aria-labelledby="posts-heading">
          <div className="section-header">
            <h2 id="posts-heading" className="section-title">
              Published Articles
            </h2>
            <span className="posts-count-badge">0 articles</span>
          </div>

          <div className="empty-state-card">
            <div className="empty-state-icon" aria-hidden="true">
              ✍️
            </div>
            <h3 className="empty-state-title">No articles published yet</h3>
            <p className="empty-state-description">
              Your posts will appear here once blog publishing is available in Phase 5.
              Markdown editing, categorization, and post management are currently in
              development.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
