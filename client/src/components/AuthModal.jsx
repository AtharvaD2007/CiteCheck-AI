import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Lock
} from 'lucide-react';
import { apiUrl } from '../utils/api';

export function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Graduate Student',
    institution: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleModalClose = () => {
    setErrorMsg('');
    onClose();
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setErrorMsg('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      const activeUser = data.user;
      localStorage.setItem('citecheck_token', data.token);
      localStorage.setItem('citecheck_user', JSON.stringify(activeUser));

      onAuthSuccess(activeUser, data.token);
      handleModalClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <GraduationCap size={20} style={{ color: 'var(--lavender-400)' }} />
            <span>{isRegister ? 'Create Academic Account' : 'Academic Sign In'}</span>
          </div>
          <motion.button
            type="button"
            className="modal-close"
            onClick={handleModalClose}
            aria-label="Close modal"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="modal-body">
          {/* Sliding Tab Switcher with layoutId */}
          <div
            style={{
              display: 'flex',
              position: 'relative',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
            }}
          >
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: !isRegister ? 'var(--slate-900)' : 'var(--slate-500)',
                    fontWeight: !isRegister ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    position: 'relative',
                    transition: 'color 0.2s ease'
                  }}
                  onClick={() => { setIsRegister(false); setErrorMsg(''); }}
                >
                  <span>Sign In</span>
                  {!isRegister && (
                    <motion.div
                      layoutId="authTabIndicator"
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        left: 0,
                        right: 0,
                        height: '2.5px',
                        background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                        boxShadow: '0 0 8px rgba(124, 58, 237, 0.5)'
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: isRegister ? 'var(--slate-900)' : 'var(--slate-500)',
                    fontWeight: isRegister ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    position: 'relative',
                    transition: 'color 0.2s ease'
                  }}
                  onClick={() => { setIsRegister(true); setErrorMsg(''); }}
                >
                  <span>Register New Account</span>
                  {isRegister && (
                    <motion.div
                      layoutId="authTabIndicator"
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        left: 0,
                        right: 0,
                        height: '2.5px',
                        background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
                        boxShadow: '0 0 8px rgba(124, 58, 237, 0.5)'
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {errorMsg && (
                <motion.div
                  className="form-error-banner anim-shake"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {isRegister && (
                    <motion.div
                      key="register-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="form-group">
                        <label className="field-label" htmlFor="auth-name">
                          <span>Full Name</span>
                          <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="auth-name"
                          name="name"
                          required
                          className="input-text"
                          placeholder="e.g. Dr. Jane Smith or Marcus Vance"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label className="field-label" htmlFor="auth-role">
                          <span>Academic Role</span>
                        </label>
                        <select
                          id="auth-role"
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
                        <label className="field-label" htmlFor="auth-institution">
                          <span>Institution / University</span>
                        </label>
                        <input
                          type="text"
                          id="auth-institution"
                          name="institution"
                          className="input-text"
                          placeholder="e.g. Stanford University or Oxford University"
                          value={formData.institution}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="form-group">
                  <label className="field-label" htmlFor="auth-email">
                    <span>Academic Email</span>
                    <span className="required">*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      id="auth-email"
                      name="email"
                      required
                      className="input-text"
                      placeholder="name@university.edu"
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
                        color: 'var(--slate-400)',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="auth-password">
                    <span>Password</span>
                    <span className="required">*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="auth-password"
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
                        color: 'var(--slate-400)',
                        pointerEvents: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="field-hint">Minimum 6 characters securely hashed with bcrypt.</span>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem' }}
                    disabled={loading}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {loading
                      ? (isRegister ? 'Creating Account...' : 'Signing In...')
                      : (isRegister ? 'Create Academic Account' : 'Sign In')}
                  </motion.button>
                </div>
              </form>
        </div>
      </motion.div>
    </div>
  );
}
