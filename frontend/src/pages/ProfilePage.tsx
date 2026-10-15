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
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarMarkedForDeletion, setIsAvatarMarkedForDeletion] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState<string | null>(null);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(null);

  // Cleanup object URL previews on unmount
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

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
        setEditName(currentUser.name);
        setEditBio(currentUser.bio || '');
        setIsLoadingProfile(false);

        // Fetch posts for author
        try {
          const result = await postsApi.getPosts({ limit: 50 });
          if (isMounted) {
            setUserPosts(result.posts.filter((p) => p.authorId === currentUser.id));
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

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileUpdateError(null);

    // Client-side file size check: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setProfileUpdateError('Avatar file size exceeds the 5MB limit.');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setProfileUpdateError('Only JPEG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreviewUrl(preview);
    setIsAvatarMarkedForDeletion(false);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setIsAvatarMarkedForDeletion(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    const trimmedBio = editBio.trim();

    if (!trimmedName) {
      setProfileUpdateError('Display name cannot be empty.');
      return;
    }

    if (trimmedName.length > 80) {
      setProfileUpdateError('Display name must not exceed 80 characters.');
      return;
    }

    if (trimmedBio.length > 500) {
      setProfileUpdateError('Bio must not exceed 500 characters.');
      return;
    }

    setIsSavingProfile(true);
    setProfileUpdateError(null);
    setProfileUpdateSuccess(null);

    try {
      let latestUser = profile!;

      // 1. Process avatar changes via dedicated Supabase storage endpoints
      if (avatarFile) {
        latestUser = await authApi.uploadAvatar(avatarFile);
      } else if (isAvatarMarkedForDeletion && profile?.avatarUrl) {
        latestUser = await authApi.deleteAvatar();
      }

      // 2. Process name/bio changes if modified
      if (trimmedName !== latestUser.name || (trimmedBio || null) !== latestUser.bio) {
        latestUser = await authApi.updateProfile({
          name: trimmedName,
          bio: trimmedBio || null,
        });
      }

      if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }

      setProfile(latestUser);
      setEditName(latestUser.name);
      setEditBio(latestUser.bio || '');
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setIsAvatarMarkedForDeletion(false);
      setIsEditingProfile(false);
      setProfileUpdateSuccess('Your profile has been updated successfully.');

      // Refresh app-wide context synchronously
      updateUser(latestUser);
    } catch (err) {
      const extracted = extractApiError(err);
      setProfileUpdateError(extracted.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    if (profile) {
      setEditName(profile.name);
      setEditBio(profile.bio || '');
    }
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setIsAvatarMarkedForDeletion(false);
    setProfileUpdateError(null);
    setIsEditingProfile(false);
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
            Manage your personal contributor identity, public biography, and authored essays.
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

      {profileUpdateSuccess && (
        <div className="alert-banner alert-success" role="status">
          <span>{profileUpdateSuccess}</span>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={() => setProfileUpdateSuccess(null)}
            aria-label="Dismiss message"
          >
            ×
          </button>
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
          <div className="profile-card-header">
            <div className="profile-identity-row">
              <div className="profile-avatar-large-circle" aria-hidden="true">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="profile-avatar-large-img"
                  />
                ) : (
                  <span className="profile-monogram-large">
                    {getInitials(profile.name)}
                  </span>
                )}
              </div>

              <div className="profile-identity-details">
                <h2>{profile.name}</h2>
                <p>{profile.email}</p>
              </div>
            </div>

            <div className="profile-card-actions">
              <Link
                to={`/writers/${profile.id}`}
                className="btn-outline-pill btn-pill-sm"
                aria-label="View your public profile as seen by readers"
              >
                <span>Public Profile</span>
                <span aria-hidden="true">↗</span>
              </Link>
              {!isEditingProfile && (
                <button
                  type="button"
                  className="btn-black-pill btn-pill-sm"
                  onClick={() => {
                    setIsEditingProfile(true);
                    setProfileUpdateError(null);
                    setProfileUpdateSuccess(null);
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Edit Profile Form Mode */}
          {isEditingProfile ? (
            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              {/* Photo Upload Section */}
              <div className="profile-avatar-edit-box">
                <div className="profile-avatar-large-circle" aria-hidden="true">
                  {(avatarPreviewUrl || (!isAvatarMarkedForDeletion && profile.avatarUrl)) ? (
                    <img
                      src={avatarPreviewUrl || profile.avatarUrl || ''}
                      alt="Avatar preview"
                      className="profile-avatar-large-img"
                    />
                  ) : (
                    <span className="profile-monogram-large">
                      {getInitials(editName || profile.name)}
                    </span>
                  )}
                </div>

                <div className="profile-avatar-edit-actions">
                  <span className="profile-label">Profile Avatar</span>
                  <p className="profile-avatar-help">
                    Choose a photo from your computer or phone (JPEG, PNG, WebP &middot; max 5MB).
                    {avatarFile && <span style={{ color: 'var(--color-accent-brass)', display: 'block' }}>Ready to upload: {avatarFile.name}</span>}
                    {isAvatarMarkedForDeletion && <span style={{ color: '#C93B2B', display: 'block' }}>Avatar will be removed upon saving.</span>}
                  </p>
                  <div className="profile-avatar-btn-group">
                    <input
                      id="avatar-file-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFileChange}
                      disabled={isSavingProfile}
                    />
                    <label
                      htmlFor="avatar-file-upload"
                      className={`btn-outline-pill btn-pill-sm ${
                        isSavingProfile ? 'disabled' : ''
                      }`}
                      style={{
                        cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span>
                        {(avatarPreviewUrl || (!isAvatarMarkedForDeletion && profile.avatarUrl))
                          ? 'Change Avatar 📷'
                          : 'Upload Avatar 📷'}
                      </span>
                    </label>

                    {(avatarPreviewUrl || (!isAvatarMarkedForDeletion && profile.avatarUrl)) && (
                      <button
                        type="button"
                        className="btn-delete-ghost btn-pill-sm"
                        onClick={handleRemoveAvatar}
                        disabled={isSavingProfile}
                      >
                        Remove Avatar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-input-group">
                  <label htmlFor="edit-name" className="profile-label">
                    Display Name <span className="label-required">*</span>
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    className="profile-text-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={80}
                    disabled={isSavingProfile}
                    required
                  />
                  <span className="profile-input-hint">Maximum 80 characters</span>
                </div>

                <div className="profile-input-group">
                  <label htmlFor="readonly-email" className="profile-label">
                    Email Address <span className="label-badge-readonly">Read-Only</span>
                  </label>
                  <input
                    id="readonly-email"
                    type="email"
                    className="profile-text-input profile-input-readonly"
                    value={profile.email}
                    disabled
                    readOnly
                  />
                  <span className="profile-input-hint">
                    Primary account email cannot be changed
                  </span>
                </div>
              </div>

              <div className="profile-input-group profile-bio-group">
                <div className="profile-label-row">
                  <label htmlFor="edit-bio" className="profile-label">
                    Author Biography
                  </label>
                  <span className="profile-char-counter">
                    {editBio.length} / 500
                  </span>
                </div>
                <textarea
                  id="edit-bio"
                  className="profile-textarea"
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={500}
                  placeholder="Introduce yourself, your technical specialties, engineering philosophy, or current research..."
                  disabled={isSavingProfile}
                />
                <span className="profile-input-hint">
                  Your bio appears on your public profile and the Writers directory.
                </span>
              </div>

              {profileUpdateError && (
                <div className="comment-form-error" role="alert">
                  {profileUpdateError}
                </div>
              )}

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="btn-outline-pill"
                  onClick={handleCancelEdit}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-black-pill"
                  disabled={isSavingProfile || !editName.trim()}
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Display Bio */}
              <div className="profile-bio-display-box">
                <span className="meta-label">Biography</span>
                <p className="profile-bio-text">
                  {profile.bio || (
                    <span className="profile-bio-empty">
                      No biography added yet. Click &ldquo;Edit Profile&rdquo; to introduce yourself to readers.
                    </span>
                  )}
                </p>
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
            </>
          )}
        </div>
      )}

      {/* Author's Published Essays Section */}
      <div className="profile-essays-section">
        <div className="profile-essays-header">
          <div>
            <h2 className="profile-essays-title">Your Published Essays</h2>
            <p className="profile-essays-subtitle">
              Manage, revise, or review the essays you have contributed to the publication.
            </p>
          </div>
          <span className="profile-essays-badge">
            {isLoadingPosts ? 'Loading...' : `${userPosts.length} total`}
          </span>
        </div>

        {postsError && (
          <div className="alert-banner alert-error" role="alert">
            <div>{postsError}</div>
          </div>
        )}

        {isLoadingPosts ? (
          <div className="aurora-profile-card" aria-live="polite">
            <p className="profile-page-subtitle">Loading your published essays...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="profile-empty-essays">
            <p className="profile-empty-title">You haven&rsquo;t published any essays yet.</p>
            <p className="profile-empty-desc">
              Share your insights on systems design, product engineering, or leadership.
            </p>
            <Link to="/essays/new" className="btn-black-pill">
              <span>Write your first essay</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {userPosts.map((post) => (
              <div key={post.id} className="profile-post-card-wrapper">
                <PostCard post={post} />
                <div className="profile-post-card-actions">
                  <Link
                    to={`/essays/${post.id}/edit`}
                    className="btn-outline-pill btn-pill-sm"
                    aria-label={`Edit ${post.title}`}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn-danger-pill btn-pill-sm"
                    onClick={() => setPostToDelete(post)}
                    aria-label={`Delete ${post.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(postToDelete)}
          postTitle={postToDelete.title}
          isDeleting={isDeleting}
          onConfirm={handleDeletePost}
          onCancel={() => !isDeleting && setPostToDelete(null)}
        />
      )}
    </div>
  );
};
