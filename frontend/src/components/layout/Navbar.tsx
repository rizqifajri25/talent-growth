import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo-group" aria-label="Talent Growth Home">
          <span className="logo-text">Talent Growth</span>
          <span className="logo-badge">Editorial Studio</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-menu" aria-label="Main Navigation">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end
          >
            Home
          </NavLink>

          <a href="#essays" className="nav-link">
            Essays
          </a>
          <a href="#topics" className="nav-link">
            Topics
          </a>
          <a href="#writers" className="nav-link">
            Writers
          </a>
        </nav>

        {/* Action Group */}
        <div className="nav-actions">
          {isAuthenticated && user ? (
            <>
              <Link to="/profile" className="nav-link" aria-label="View profile">
                <span className="user-monogram-nav" aria-hidden="true">
                  {getInitials(user.name)}
                </span>
              </Link>
              <button
                type="button"
                className="btn-logout-ghost"
                onClick={handleLogout}
                disabled={isLoggingOut || isLoading}
                aria-label="Log out of account"
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
              <Link to="/register" className="btn-black-pill">
                <span>Get Started</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav" role="dialog" aria-modal="true">
          <NavLink
            to="/"
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
            end
          >
            Home
          </NavLink>

          {isAuthenticated && user ? (
            <>
              <NavLink
                to="/profile"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile ({user.name})
              </NavLink>
              <button
                type="button"
                className="btn-logout-ghost"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </NavLink>
              <Link
                to="/register"
                className="btn-black-pill"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started ↗
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
