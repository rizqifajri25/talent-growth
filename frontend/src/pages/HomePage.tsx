import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const techStack = [
    'React 19',
    'TypeScript',
    'Vite',
    'Node.js',
    'Express',
    'PostgreSQL',
    'Prisma v7',
    'JWT + bcrypt',
  ];

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow animate-in">
            🚀 Phase 4 — Frontend Authentication Integration
          </div>

          <h1 className="hero-title animate-in">
            <span className="gradient-text">Talent Growth</span>
            <br />
            Blog Platform
          </h1>

          <p className="hero-description animate-in">
            A modern, full-stack blog platform built with React, Express, PostgreSQL,
            and Prisma. Authentication is fully implemented with bcrypt password hashing
            and database-verified JWT sessions.
          </p>

          {/* Quick CTA Actions */}
          <div className="hero-actions animate-in">
            {isAuthenticated && user ? (
              <>
                <Link to="/profile" className="btn-primary-large">
                  Go to Profile ({user.name}) →
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary-large">
                  Create Account →
                </Link>
                <Link to="/login" className="btn-secondary-large">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Status Cards */}
          <div className="status-grid">
            <div className="status-card animate-in">
              <div className="status-icon frontend">⚛️</div>
              <div className="status-info">
                <h3>Frontend Active</h3>
                <p>React 19 + TypeScript + Vite with in-memory JWT authentication state.</p>
              </div>
            </div>
            <div className="status-card animate-in">
              <div className="status-icon backend">🔐</div>
              <div className="status-info">
                <h3>Auth API Ready</h3>
                <p>Protected routes backed by PostgreSQL database sessions and bcrypt.</p>
              </div>
            </div>
            <div className="status-card animate-in">
              <div className="status-icon next">📋</div>
              <div className="status-info">
                <h3>Next Milestones</h3>
                <p>Blog post publishing, category feeds, and comments system coming in Phase 5.</p>
              </div>
            </div>
          </div>

          {/* Tech Stack Badges */}
          <div className="tech-stack animate-in">
            {techStack.map((tech) => (
              <span key={tech} className="tech-badge">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
