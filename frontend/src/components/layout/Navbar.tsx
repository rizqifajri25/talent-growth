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
        <Link to="/" className="logo" aria-label="Talent Growth Home">
          <div className="logo-icon">📝</div>
          <span>Talent Growth</span>
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

          {isAuthenticated && user ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span className="user-avatar-small" aria-hidden="true">
                  {getInitials(user.name)}
                </span>
                <span>Profile</span>
              </NavLink>

              <button
                type="button"
                className="btn-logout"
                onClick={handleLogout}
                disabled={isLoggingOut || isLoading}
                aria-label="Log out of account"
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Log in
              </NavLink>

              <Link to="/register" className="btn-primary-nav">
                Get Started
              </Link>
            </>
          )}
        </nav>

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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav" role="dialog" aria-modal="true">
          <NavLink
            to="/"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
            end
          >
            Home
          </NavLink>

          {isAuthenticated && user ? (
            <>
              <NavLink
                to="/profile"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile ({user.name})
              </NavLink>
              <button
                type="button"
                className="btn-logout-mobile"
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
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </NavLink>
              <Link
                to="/register"
                className="mobile-btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
