import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { extractApiError } from '../api/client';
import { useDocumentTitle } from '../utils/useDocumentTitle';

export const RegisterPage: React.FC = () => {
  useDocumentTitle('Create an Account', 'Register to join the Talent Growth editorial platform and publish technical essays.');
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to profile
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else {
      const byteLength = new TextEncoder().encode(formData.password).length;
      if (byteLength > 72) {
        errors.password = 'Password cannot exceed 72 bytes.';
      }
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match.';
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
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // Clear password from local state
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      navigate('/profile', { replace: true });
    } catch (err) {
      const extracted = extractApiError(err);
      if (extracted.status === 409) {
        setGeneralError('This email is already registered. Please sign in or use another email.');
      } else if (extracted.fieldErrors) {
        setFieldErrors(extracted.fieldErrors);
      } else {
        setGeneralError(extracted.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-split-card">
        {/* Left: Registration Form */}
        <div className="auth-form-column">
          <h1 className="auth-title">Begin Your Journey</h1>
          <p className="auth-subtitle">Publish insightful essays and join a thoughtful community</p>

          {generalError && (
            <div className="alert-banner alert-error" role="alert" aria-live="polite">
              <span>{generalError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                className={`form-input ${fieldErrors.name ? 'has-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                required
              />
              {fieldErrors.name && (
                <span id="name-error" className="form-error-text" role="alert">
                  {fieldErrors.name}
                </span>
              )}
            </div>

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
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className={`form-input ${fieldErrors.password ? 'has-error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : 'password-help'
                }
                required
              />
              {fieldErrors.password ? (
                <span id="password-error" className="form-error-text" role="alert">
                  {fieldErrors.password}
                </span>
              ) : (
                <span id="password-help" className="form-help-text">
                  Must be at least 8 characters (max 72 bytes).
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className={`form-input ${fieldErrors.confirmPassword ? 'has-error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={
                  fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined
                }
                required
              />
              {fieldErrors.confirmPassword && (
                <span
                  id="confirmPassword-error"
                  className="form-error-text"
                  role="alert"
                >
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn-submit-black"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-inline" aria-hidden="true" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span aria-hidden="true">↗</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right: Architectural Visual Art */}
        <div className="auth-visual-column" aria-hidden="true">
          <img
            src="/images/aurora-register.jpg"
            alt="Architectural fluted glass wall with granite stone and brass sphere"
            className="auth-visual-image"
          />
        </div>
      </div>
    </div>
  );
};
