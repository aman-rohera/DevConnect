import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Lock, ArrowRight, Terminal } from 'lucide-react';
import './ResetPassword.css';

export const ResetPassword: React.FC = () => {
  const { resetPassword, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Extract access token from url fragment on mount
  useEffect(() => {
    clearError();
    // Supabase appends the access token as a hash fragment like:
    // #access_token=xxxx&type=recovery
    const hash = location.hash || window.location.hash;
    if (!hash) {
      setTokenError('Invalid or expired recovery link. Please request a new link.');
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (!accessToken || type !== 'recovery') {
      setTokenError('Invalid or expired recovery link. Please request a new link.');
      return;
    }

    // Set token in localStorage so our API client sends it in the Authorization header.
    // The resetPassword backend route is protected and expects this token.
    localStorage.setItem('dc_token', accessToken);
  }, [location]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (tokenError || !validate()) return;

    setIsSubmitting(true);
    try {
      await resetPassword(password);
      setResetSuccess(true);
    } catch (err) {
      console.error('Password reset submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dc-reset-container">
      <div className="dc-reset-grid" />
      <div className="dc-accent-light dc-accent-light--purple" />
      <div className="dc-accent-light dc-accent-light--teal" />

      <div className="dc-reset-content">
        <div className="dc-reset-form-wrapper">
          <Card glow className="dc-reset-card">
            <div className="dc-reset-logo-wrapper">
              <Terminal className="dc-reset-logo-icon" />
              <span className="dc-reset-logo-text text-gradient">DevConnect</span>
            </div>

            <div className="dc-form-header">
              <h2>Set New Access Key</h2>
              <p>Configure a secure password for your developer profile.</p>
            </div>

            {tokenError ? (
              <div className="dc-reset-error-view">
                <div className="dc-alert dc-alert--danger" role="alert">
                  <span className="dc-alert-message">{tokenError}</span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Return to Login
                </Button>
              </div>
            ) : resetSuccess ? (
              <div className="dc-reset-success-view">
                <div className="dc-alert dc-alert--success" role="alert">
                  <span className="dc-alert-message">
                    Access Key modified successfully! You can now authenticate with your new credentials.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Proceed to Login
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="dc-alert dc-alert--danger" role="alert">
                    <span className="dc-alert-message">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="dc-form-fields" noValidate>
                  <Input
                    label="New Password"
                    placeholder="Enter at least 6 characters"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formErrors.password) {
                        setFormErrors((prev) => ({ ...prev, password: '' }));
                      }
                    }}
                    error={formErrors.password}
                    leftIcon={<Lock size={18} />}
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    placeholder="Confirm password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formErrors.confirmPassword) {
                        setFormErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    error={formErrors.confirmPassword}
                    leftIcon={<Lock size={18} />}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Commit Password Reset
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
