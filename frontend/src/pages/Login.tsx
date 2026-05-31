import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Mail, Lock, Code, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { login, forgotPassword, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Form Mode State
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Inputs state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo Skeleton Loading State to show "ghost loading effects"
  const [showDemoGhost, setShowDemoGhost] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    
    // Validate password only if we are logging in, not when sending recovery links
    if (!isForgotPasswordMode) {
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isForgotPasswordMode) {
        await forgotPassword(email);
        setResetEmailSent(true);
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo simulation to trigger beautiful skeleton/ghost loaders!
  const handleTriggerGhostDemo = () => {
    setShowDemoGhost(true);
    setTimeout(() => {
      setShowDemoGhost(false);
      setEmail('developer@devconnect.io');
      setPassword('git-commit-push');
    }, 2000);
  };

  const handleBackToLogin = () => {
    setIsForgotPasswordMode(false);
    setResetEmailSent(false);
    setPassword('');
    setFormErrors({});
    clearError();
  };

  return (
    <div className="dc-login-container">
      {/* Decorative Grid and Accent Lights */}
      <div className="dc-login-grid" />
      <div className="dc-accent-light dc-accent-light--purple" />
      <div className="dc-accent-light dc-accent-light--teal" />

      <div className="dc-login-content">
        {/* Left Side: Brand Promo */}
        <div className="dc-brand-promo">
          <div className="dc-brand-logo glow-hover">
            <Terminal className="dc-brand-logo-icon" />
            <span className="dc-brand-logo-text text-gradient">DevConnect</span>
          </div>
          
          <h1 className="dc-promo-title">
            The Professional Network Built For <span className="text-gradient">Developers</span>.
          </h1>
          <p className="dc-promo-subtitle">
            Showcase your repositories, match with tech recruiters, review commits, and network with engineers globally.
          </p>

          <div className="dc-features-list">
            <div className="dc-feature-item">
              <div className="dc-feature-icon-wrapper">
                <Code size={18} />
              </div>
              <div>
                <h4>Interactive Profiles</h4>
                <p>Sync GitHub repositories, highlight skills, and show your stack.</p>
              </div>
            </div>

            <div className="dc-feature-item">
              <div className="dc-feature-icon-wrapper">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4>Enterprise-Grade Security</h4>
                <p>Equipped with Supabase JWT checking, Helmet safeguards, and route filters.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Card Form */}
        <div className="dc-login-form-wrapper">
          <Card glow className="dc-login-card">
            {showDemoGhost ? (
              // Ghost Skeleton Loader View! Shows dynamic, beautiful skeleton elements.
              <div className="dc-ghost-loader-view" data-testid="ghost-loader-view">
                <div className="dc-ghost-header">
                  <SkeletonLoader variant="circle" />
                  <div>
                    <SkeletonLoader variant="text" width={140} height={20} />
                    <SkeletonLoader variant="text" width={90} height={14} className="mt-2" />
                  </div>
                </div>
                <div className="dc-ghost-body">
                  <SkeletonLoader variant="text" count={3} />
                  <SkeletonLoader variant="rectangle" height={80} className="dc-ghost-box" />
                  <SkeletonLoader variant="text" width="60%" />
                </div>
              </div>
            ) : isForgotPasswordMode ? (
              // Forgot Password View
              <>
                <div className="dc-form-header">
                  <h2>Reset Access Key</h2>
                  <p>Provide your email to receive recovery instructions.</p>
                </div>

                {resetEmailSent ? (
                  <div className="dc-reset-success-view">
                    <div className="dc-alert dc-alert--success" role="alert">
                      <span className="dc-alert-message">
                        Success! A password reset link has been dispatched to <strong>{email}</strong>. Please check your inbox and click the recovery link.
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      fullWidth
                      onClick={handleBackToLogin}
                    >
                      Return to Authentication Terminal
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
                        label="Developer Email"
                        placeholder="e.g. linus@devconnect.io"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) {
                            setFormErrors((prev) => ({ ...prev, email: '' }));
                          }
                        }}
                        error={formErrors.email}
                        leftIcon={<Mail size={18} />}
                        required
                      />

                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={isSubmitting}
                        rightIcon={<ArrowRight size={16} />}
                      >
                        Transmit Recovery Link
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={handleBackToLogin}
                      >
                        Cancel & Return
                      </Button>
                    </form>
                  </>
                )}
              </>
            ) : (
              // Standard Form View
              <>
                <div className="dc-form-header">
                  <h2>Welcome Back, Dev!</h2>
                  <p>Execute your session login to connect.</p>
                </div>

                {error && (
                  <div className="dc-alert dc-alert--danger" role="alert">
                    <span className="dc-alert-message">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="dc-form-fields" noValidate>
                  <Input
                    label="Developer Email"
                    placeholder="e.g. linus@devconnect.io"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) {
                        setFormErrors((prev) => ({ ...prev, email: '' }));
                      }
                    }}
                    error={formErrors.email}
                    leftIcon={<Mail size={18} />}
                    required
                  />

                  <Input
                    label="Access Key (Password)"
                    placeholder="••••••••"
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

                  <div className="dc-forgot-link-wrapper">
                    <button
                      type="button"
                      className="dc-text-link-btn"
                      onClick={() => {
                        setIsForgotPasswordMode(true);
                        clearError();
                        setFormErrors({});
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Authenticate Session
                  </Button>
                </form>

                <div className="dc-form-divider">
                  <span>OR</span>
                </div>

                <div className="dc-demo-trigger-wrapper">
                  <Button
                    type="button"
                    variant="glass"
                    fullWidth
                    onClick={handleTriggerGhostDemo}
                  >
                    Load Mock Sandbox (Ghost Shimmer UI)
                  </Button>
                </div>

                <div className="dc-signup-prompt">
                  New to the terminal?{' '}
                  <Link to="/register" className="dc-text-link-primary">
                    Create Developer ID
                  </Link>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
