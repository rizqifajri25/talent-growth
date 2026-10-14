import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { extractApiError } from '../api/client';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect destination after successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Clear sensitive password from memory state
      setFormData((prev) => ({ ...prev, password: '' }));
      navigate(from, { replace: true });
    } catch (err) {
      const extracted = extractApiError(err);
      if (extracted.status === 401) {
        setGeneralError('Invalid email or password.');
      } else if (extracted.status === 0) {
        setGeneralError('Network error: Unable to contact server. Please verify the backend is running.');
      } else {
        setGeneralError(extracted.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card animate-in">
        <div className="auth-header">
          <div className="auth-icon-badge">🔐</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to manage your profile and articles</p>
        </div>

        {generalError && (
          <div className="alert-banner alert-error" role="alert" aria-live="polite">
            <span className="alert-icon" aria-hidden="true">⚠️</span>
            <span>{generalError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className={`form-input ${fieldErrors.email ? 'has-error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              required
            />
            {fieldErrors.email && (
              <span id="email-error" className="form-error-text" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`form-input ${fieldErrors.password ? 'has-error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              required
            />
            {fieldErrors.password && (
              <span id="password-error" className="form-error-text" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-inline" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
