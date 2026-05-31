import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Mail, Lock, User, Briefcase, Cpu, ArrowRight, Terminal } from 'lucide-react';
import './Register.css';

export const Register: React.FC = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Form inputs state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [headline, setHeadline] = useState('');
  const [skills, setSkills] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
      await register(email, password, fullName, headline, skills);
      navigate('/');
    } catch (err) {
      console.error('Registration submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dc-register-container">
      {/* Background patterns */}
      <div className="dc-register-grid" />
      <div className="dc-accent-light dc-accent-light--purple" />
      <div className="dc-accent-light dc-accent-light--teal" />

      <div className="dc-register-content">
        {/* Left Side: Brand Promo (Compact for signup) */}
        <div className="dc-register-brand">
          <div className="dc-brand-logo glow-hover">
            <Terminal className="dc-brand-logo-icon" />
            <span className="dc-brand-logo-text text-gradient">DevConnect</span>
          </div>
          <h1 className="dc-register-promo-title">
            Build Your <span className="text-gradient">Developer ID</span> Today.
          </h1>
          <p className="dc-register-promo-subtitle">
            Join the developer ecosystem. Create a premium profile, import your GitHub commits, discuss design patterns, and find open source contributors or tech jobs.
          </p>

          <div className="dc-quick-stats">
            <div className="dc-stat-box">
              <span className="dc-stat-num">50k+</span>
              <span className="dc-stat-label">Active Engineers</span>
            </div>
            <div className="dc-stat-box">
              <span className="dc-stat-num">4.8★</span>
              <span className="dc-stat-label">Recruiter Rating</span>
            </div>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="dc-register-form-wrapper">
          <Card glow className="dc-register-card">
            <div className="dc-register-header">
              <h2>Initialize Profile</h2>
              <p>Setup your credentials to compile your network profile.</p>
            </div>

            {error && (
              <div className={`dc-alert ${error.toLowerCase().includes('successful') ? 'dc-alert--success' : 'dc-alert--danger'}`} role="alert">
                <span className="dc-alert-message">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="dc-register-form-fields" noValidate>
              <div className="dc-form-row">
                <Input
                  label="Full Name"
                  placeholder="Linus Torvalds"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formErrors.fullName) {
                      setFormErrors((prev) => ({ ...prev, fullName: '' }));
                    }
                  }}
                  error={formErrors.fullName}
                  leftIcon={<User size={18} />}
                  required
                />

                <Input
                  label="Developer Email"
                  placeholder="linus@git.org"
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
              </div>

              <div className="dc-form-row">
                <Input
                  label="Access Password"
                  placeholder="Min 6 characters"
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
                  label="Professional Headline"
                  placeholder="e.g. Creator of Git & Linux"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  leftIcon={<Briefcase size={18} />}
                />
              </div>

              <Input
                label="Core Stack Skills (Comma-separated)"
                placeholder="e.g. C, Git, Bash, Linux Kernel, Rust"
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                leftIcon={<Cpu size={18} />}
              />

              <Button
                type="submit"
                variant="secondary"
                fullWidth
                isLoading={isSubmitting}
                rightIcon={<ArrowRight size={16} />}
                className="mt-4"
              >
                Compile & Register profile
              </Button>
            </form>

            <div className="dc-login-prompt">
              Already have a developer ID?{' '}
              <Link to="/login" className="dc-text-link-primary">
                Authenticate Instead
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
