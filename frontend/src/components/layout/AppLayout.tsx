import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

const PageLoadingFallback: React.FC = () => (
  <div className="article-loading-state" aria-live="polite">
    <div className="article-loading-spinner" aria-hidden="true" />
    <p className="article-loading-text">Loading...</p>
  </div>
);

export const AppLayout: React.FC = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            Talent Growth · Editorial Studio
          </div>
          <div className="footer-note">
            A calm, independent platform for engineering, craft, and thought leadership.
          </div>
        </div>
      </footer>
    </div>
  );
};
