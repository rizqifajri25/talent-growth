import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <p>
            <span className="footer-highlight">Talent Growth Blog Platform</span> · Phase 4 · Full-Stack Authentication Active
          </p>
        </div>
      </footer>
    </div>
  );
};
