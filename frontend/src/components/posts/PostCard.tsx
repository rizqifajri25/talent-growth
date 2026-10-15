import React from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../../types/posts.types';

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  onDeleteClick?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  showActions = false,
  onDeleteClick,
}) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(post.createdAt));

  // Extract a clean excerpt from plain text content (max ~180 characters)
  const getExcerpt = (text: string, maxLength = 180): string => {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (trimmed.length <= maxLength) return trimmed;
    return `${trimmed.substring(0, maxLength).trim()}...`;
  };

  return (
    <article className="aurora-post-card">
      <div className="post-card-header">
        {post.category && (
          <span className="post-category-badge">{post.category}</span>
        )}
        <time className="post-card-date" dateTime={post.createdAt}>
          {formattedDate}
        </time>
      </div>

      <h3 className="post-card-title">
        <Link to={`/essays/${post.id}`}>{post.title}</Link>
      </h3>

      <p className="post-card-excerpt">{getExcerpt(post.content)}</p>

      <div className="post-card-footer">
        <div className="post-author-row">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt=""
              className="post-author-avatar-tiny"
            />
          ) : (
            <span className="author-dot" aria-hidden="true" />
          )}
          <Link to={`/writers/${post.author.id}`} className="post-author-name">
            {post.author.name}
          </Link>
        </div>

        <div className="post-card-actions">
          {showActions && (
            <>
              <Link
                to={`/essays/${post.id}/edit`}
                className="btn-edit-ghost"
                aria-label={`Edit essay: ${post.title}`}
              >
                Edit
              </Link>
              {onDeleteClick && (
                <button
                  type="button"
                  className="btn-delete-ghost"
                  onClick={() => onDeleteClick(post)}
                  aria-label={`Delete essay: ${post.title}`}
                >
                  Delete
                </button>
              )}
            </>
          )}
          <Link
            to={`/essays/${post.id}`}
            className="read-more-link"
            aria-label={`Read essay: ${post.title}`}
          >
            <span>Read essay</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
