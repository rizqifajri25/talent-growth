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
