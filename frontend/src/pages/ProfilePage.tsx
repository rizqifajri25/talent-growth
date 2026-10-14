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
      const freshUser = await authApi.getMe();
      setProfile(freshUser);
    } catch (err) {
      const extracted = extractApiError(err);
      if (extracted.status === 401) {
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
      <div className="profile-header-banner">
        <div className="profile-header-left">
          <h1 className="profile-page-title">Author Profile</h1>
          <p className="profile-page-subtitle">
            Live credentials retrieved from protected endpoint <code>GET /api/v1/auth/me</code>
          </p>
          <span className="profile-badge-session">
            ● Authenticated Session (In-Memory RAM)
          </span>
        </div>
        <button
          type="button"
          className="btn-outline-pill"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      {profileError && (
        <div className="alert-banner alert-error" role="alert">
          <div>{profileError}</div>
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
              <span className="meta-label">Token Security</span>
              <span className="meta-value">In-Memory RAM (0 bytes in Web Storage)</span>
            </div>
          </div>
        </div>
      )}

      <section className="profile-essays-section">
        <div className="section-title-row">
          <h3 className="essays-title">Published Essays</h3>
        </div>

        <div className="empty-state-box">
          <div className="empty-icon" aria-hidden="true">
            ✍️
          </div>
          <h4 className="empty-title">No essays published yet</h4>
          <p className="empty-desc">
            Your published essays, drafts, and reading analytics will appear here once
            authoring is unlocked in Phase 5.
          </p>
        </div>
      </section>
    </div>
  );
};
