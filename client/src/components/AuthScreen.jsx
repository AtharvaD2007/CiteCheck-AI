import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Cpu,
  Scale,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function AuthScreen({ onAuthSuccess, onVerifyToken }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Graduate Student',
    institution: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessInfo(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      localStorage.setItem('citecheck_token', data.token);
      localStorage.setItem('citecheck_user', JSON.stringify(data.user));

      if (isRegister) {
        setSuccessInfo({
          user: data.user,
          token: data.token,
          emailResult: data.emailResult
        });
        onAuthSuccess(data.user, data.token);
      } else {
        onAuthSuccess(data.user, data.token);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-portal-wrapper">
      <div className="auth-portal-ambient-blob blob-1" />
      <div className="auth-portal-ambient-blob blob-2" />

      <div className="auth-portal-container">
        {/* Brand Header */}
        <motion.div
          className="auth-portal-brand"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="auth-brand-icon">
            <BookOpen size={28} strokeWidth={2.4} />
          </div>
          <h1 className="auth-brand-title">
            CiteCheck <span className="auth-brand-highlight">AI</span>
          </h1>
          <p className="auth-brand-subtitle">
            Academic Citation & Evidence Verification System
          </p>
        </motion.div>

        {/* Auth Card Container */}
        <motion.div
          className="auth-card-shell"
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {successInfo ? (
            <motion.div
              className="auth-success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <div className="auth-success-icon-wrap">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="auth-success-title">Account Created Successfully</h2>
              <p className="auth-success-text">
                We have generated an email verification link for <strong>{successInfo.user.email}</strong>.
                Please verify your academic email address to unlock citation verification and personal report management.
              </p>

              {successInfo.emailResult?.verificationUrl && (
                <div className="auth-dev-verification-box">
                  <span className="auth-dev-label">Development Quick Verification Link:</span>
                  <a
                    href={successInfo.emailResult.verificationUrl}
                    className="auth-dev-link"
                    onClick={(e) => {
                      if (onVerifyToken) {
                        e.preventDefault();
                        const parsed = new URL(successInfo.emailResult.verificationUrl);
                        const token = parsed.searchParams.get('verify_token');
                        onVerifyToken(token);
                      }
                    }}
                  >
                    {successInfo.emailResult.verificationUrl}
                  </a>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
                onClick={() => onAuthSuccess(successInfo.user, successInfo.token)}
              >
                <span>Continue to Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="auth-tabs-row">
                <button
                  type="button"
                  className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
                  onClick={() => { setIsRegister(false); setErrorMsg(''); }}
                >
                  <span>Sign In</span>
                  {!isRegister && (
                    <motion.div
                      className="auth-active-tab-bar"
                      layoutId="authPortalActiveTab"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
                  onClick={() => { setIsRegister(true); setErrorMsg(''); }}
                >
                  <span>Register Account</span>
                  {isRegister && (
                    <motion.div
                      className="auth-active-tab-bar"
                      layoutId="authPortalActiveTab"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {errorMsg && (
                <motion.div
                  className="form-error-banner anim-shake"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <AnimatePresence mode="wait">
                  {isRegister && (
                    <motion.div
                      key="register-fields-portal"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="form-group">
                        <label className="field-label" htmlFor="portal-name">
                          <span>Full Name</span>
                          <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="portal-name"
                          name="name"
                          required
                          className="input-text"
                          placeholder="e.g. Dr. Jane Smith"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label className="field-label" htmlFor="portal-role">
                          <span>Academic Role</span>
                        </label>
                        <select
                          id="portal-role"
                          name="role"
                          className="input-text"
                          value={formData.role}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="Undergraduate Student">Undergraduate Student</option>
                          <option value="Graduate Student">Graduate / PhD Student</option>
                          <option value="Postdoctoral Fellow">Postdoctoral Fellow</option>
                          <option value="Faculty / Professor">Faculty / Professor</option>
                          <option value="Independent Researcher">Independent Researcher</option>
                          <option value="Peer Reviewer">Peer Reviewer / Editor</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="field-label" htmlFor="portal-institution">
                          <span>Institution / University</span>
                        </label>
                        <input
                          type="text"
                          id="portal-institution"
                          name="institution"
                          className="input-text"
                          placeholder="e.g. Cambridge University or MIT"
                          value={formData.institution}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="form-group">
                  <label className="field-label" htmlFor="portal-email">
                    <span>Academic Email</span>
                    <span className="required">*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      id="portal-email"
                      name="email"
                      required
                      className="input-text"
                      placeholder="scholar@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      style={{ paddingLeft: '2.4rem' }}
                    />
                    <Mail
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                  {isRegister && (
                    <span className="field-hint">A secure verification link will be sent to this address.</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="portal-password">
                    <span>Password</span>
                    <span className="required">*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="portal-password"
                      name="password"
                      required
                      minLength={6}
                      className="input-text"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                    />
                    <Lock
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-password-toggle-btn"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="field-hint">Minimum 6 characters securely hashed with bcrypt.</span>
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', marginTop: '1.25rem' }}
                  disabled={loading}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading
                    ? (isRegister ? 'Creating Account...' : 'Signing In...')
                    : (isRegister ? 'Create Academic Account' : 'Sign In to CiteCheck AI')}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          className="auth-portal-features"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="auth-feature-pill">
            <ShieldCheck size={16} className="feature-pill-icon" />
            <div>
              <strong>Verbatim Evidence Grounding</strong>
              <p>Passages are audited line-by-line without hallucination.</p>
            </div>
          </div>
          <div className="auth-feature-pill">
            <Scale size={16} className="feature-pill-icon" />
            <div>
              <strong>4-Tier Academic Taxonomy</strong>
              <p>Supported, Partially Supported, Not Supported, Insufficient Evidence.</p>
            </div>
          </div>
          <div className="auth-feature-pill">
            <Cpu size={16} className="feature-pill-icon" />
            <div>
              <strong>Gemini AI Intelligence</strong>
              <p>Deep logical and causal consistency validation.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
