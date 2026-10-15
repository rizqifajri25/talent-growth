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

          <NavLink
            to="/essays"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Essays
          </NavLink>

          {/* Planned modules kept as clear upcoming indicators */}
          <span
            className="nav-link nav-link-disabled"
            title="Topic taxonomy arriving in Phase 8"
            aria-disabled="true"
          >
            Topics
          </span>
          <NavLink
            to="/writers"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Writers
          </NavLink>
        </nav>

        {/* Action Group */}
        <div className="nav-actions">
          {/* Desktop-only actions */}
          <div className="nav-actions-desktop">
            {isAuthenticated && user ? (
              <>
                <Link to="/essays/new" className="btn-write-nav">
                  <span>Write an essay</span>
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link to="/profile" className="nav-link" aria-label="View author profile">
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
          </div>

          {/* Mobile Hamburger Button (Only element shown in header bar on mobile) */}
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

          <NavLink
            to="/essays"
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Essays
          </NavLink>

          <NavLink
            to="/writers"
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Writers
          </NavLink>

          {isAuthenticated && user ? (
            <>
              <NavLink
                to="/essays/new"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Write an Essay ↗
              </NavLink>
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
