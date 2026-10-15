import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { topicsApi } from '../api/topics.api';
import { extractApiError } from '../api/client';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import type { TopicItem } from '../types/topics.types';

export const TopicsPage: React.FC = () => {
  useDocumentTitle('Topics', 'Explore technical essays and architectural perspectives organized by topic taxonomy.');
  const { isAuthenticated } = useAuth();

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await topicsApi.getTopics();
      setTopics(data);
    } catch (err) {
      const extracted = extractApiError(err);
      setError(extracted.message || 'Failed to load topics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const data = await topicsApi.getTopics();
        if (!isCancelled) {
          setTopics(data);
        }
      } catch (err) {
        if (!isCancelled) {
          const extracted = extractApiError(err);
          setError(extracted.message || 'Failed to load topics.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="topics-page-container">
      {/* Editorial Header */}
      <header className="topics-header">
        <span className="topics-eyebrow">TAXONOMY & THEMES</span>
        <h1 className="topics-title">Editorial Topics</h1>
        <p className="topics-subtitle">
          Explore technical deep-dives, architectural perspectives, and essays
          organized by engineering field and discipline.
        </p>
      </header>

      {/* Error State with Retry Action */}
      {error && (
        <div className="alert-banner alert-error" role="alert">
          <div>{error}</div>
          <button
            type="button"
            className="btn-outline-pill"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', marginLeft: 'auto' }}
            onClick={fetchTopics}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="topics-loading-state" aria-live="polite">
          <div className="topics-loading-spinner" aria-hidden="true" />
          <p className="topics-loading-text">Loading editorial topics...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && topics.length === 0 && (
        <div className="topics-empty-card">
          <span className="not-found-label">NO ACTIVE TOPICS</span>
          <h2 className="topics-empty-title">Taxonomy Catalog Empty</h2>
          <p className="topics-empty-desc">
            Topics appear automatically once essays are published with assigned categories.
          </p>
          <div className="topics-empty-actions">
            {isAuthenticated ? (
              <Link to="/essays/new" className="btn-black-pill">
                <span>Write an Essay</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <Link to="/essays" className="btn-black-pill">
                <span>Browse All Essays</span>
                <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Topics Grid */}
      {!isLoading && !error && topics.length > 0 && (
        <div className="topics-grid" role="list">
          {topics.map((topic) => (
            <article key={topic.name} className="aurora-topic-card" role="listitem">
              <div className="topic-card-header">
                <span className="post-category-badge">{topic.name}</span>
                <span className="topic-card-count">
                  {topic.postCount} {topic.postCount === 1 ? 'essay' : 'essays'}
                </span>
              </div>

              <h2 className="topic-card-title">
                <Link to={`/essays?category=${encodeURIComponent(topic.name)}`}>
                  {topic.name}
                </Link>
              </h2>

              <p className="topic-card-description">
                Explore curated perspectives, technical architectural insights, and
                discussion in {topic.name}.
              </p>

              <div className="topic-card-footer">
                <Link
                  to={`/essays?category=${encodeURIComponent(topic.name)}`}
                  className="topic-card-link"
                  aria-label={`Explore ${topic.postCount} essays in ${topic.name}`}
                >
                  <span>Explore essays</span>
                  <span aria-hidden="true" className="topic-link-arrow">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
