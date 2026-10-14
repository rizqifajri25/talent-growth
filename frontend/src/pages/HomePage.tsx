import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

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
                <Link to="/profile" className="btn-black-pill large">
                  <span>Author Workspace</span>
                  <span aria-hidden="true">↗</span>
                </Link>
                <a href="#essays" className="btn-outline-pill large">
                  Browse Essays
                </a>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-black-pill large">
                  <span>Start Reading</span>
                  <span aria-hidden="true">↗</span>
                </Link>
                <a href="#topics" className="btn-outline-pill large">
                  Explore Topics
                </a>
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

      {/* Editorial Milestones Section */}
      <section id="essays" className="home-milestones-section">
        <div className="milestones-inner">
          <span className="section-label">CURATED PLATFORM</span>
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
              <h3 className="milestone-title">Phase 5 Publishing</h3>
              <p className="milestone-desc">
                Full Markdown authoring, category feeds, and thoughtful discussions
                unlocking in the upcoming milestone.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
