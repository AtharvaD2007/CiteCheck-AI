import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FolderArchive,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export function Navbar({
  user,
  onOpenAuth,
  onLogout,
  onOpenSavedReports,
  onOpenSetup,
  onOpenAbout,
  savedReportsCount = 0,
  hasApiKey = true
}) {
  return (
    <motion.header
      className="navbar-custom"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="navbar-container">
        {/* Left Brand Identity */}
        <motion.div
          className="nav-brand-group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ cursor: 'pointer' }}
          whileHover="hover"
          initial="initial"
        >
          <motion.div
            className="nav-logo-icon"
            whileHover={{ scale: 1.08, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <BookOpen size={21} strokeWidth={2.4} />
          </motion.div>
          <div className="nav-title-group">
            <span className="nav-brand-text">
              CiteCheck <span className="nav-brand-highlight">AI</span>
            </span>
            <span className="nav-divider"></span>
            <span className="nav-brand-tagline">Academic Citation Verification</span>
          </div>
        </motion.div>

        {/* Right Navigation & Action Items */}
        <div className="nav-links-group">
          <nav className="nav-menu-links">
            <motion.button
              type="button"
              className="nav-item active"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
            >
              <span>Home</span>
              <motion.span
                className="nav-item-active-bar"
                layoutId="activeNavIndicator"
                transition={{ type: 'spring', stiffness: 380, damping: 25 }}
              />
            </motion.button>

            <motion.button
              type="button"
              className="nav-item"
              onClick={onOpenAbout}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
            >
              <span>About</span>
            </motion.button>

            {/* User Personal Reports */}
            <motion.button
              type="button"
              className="nav-action-pill"
              onClick={onOpenSavedReports}
              title={user ? "View your personal verification reports" : "Sign in to view your reports"}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <FolderArchive size={14} />
              <span>My Reports</span>
              {user && savedReportsCount > 0 && (
                <motion.span
                  className="nav-badge-count"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  {savedReportsCount}
                </motion.span>
              )}
            </motion.button>
          </nav>

          <div className="nav-user-actions">
            {/* API Key Status / Setup */}
            <motion.button
              type="button"
              className={`nav-status-indicator ${hasApiKey ? 'ready' : 'missing'}`}
              onClick={onOpenSetup}
              title={hasApiKey ? 'Gemini API active & connected' : 'Click to configure Gemini API Key'}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="status-ping" />
              <span>{hasApiKey ? 'API Ready' : 'Set Key'}</span>
            </motion.button>

            {/* Auth Profile / Sign In */}
            {user ? (
              <div className="nav-user-profile">
                <motion.div
                  className="user-avatar-badge"
                  title={`Signed in as: ${user.name ? `${user.name} (${user.email})` : user.email} • ${user.isVerified ? 'Verified Account' : 'Email Unverified'}`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="user-avatar-circle">
                    {user.name && user.name.trim()
                      ? user.name.trim().charAt(0).toUpperCase()
                      : user.email
                      ? user.email.charAt(0).toUpperCase()
                      : <User size={12} />}
                  </div>
                  <div className="user-identity-text">
                    <span className="user-name-label">
                      {user.name && user.name.trim() ? user.name.trim() : user.email}
                    </span>
                    {user.name && user.email && (
                      <span className="user-email-label">{user.email}</span>
                    )}
                  </div>
                  {!user.isVerified && (
                    <motion.span
                      title="Email address unverified"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#F59E0B',
                        marginLeft: '3px'
                      }}
                    >
                      <ShieldAlert size={13} />
                    </motion.span>
                  )}
                </motion.div>

                <motion.button
                  type="button"
                  className="nav-logout-btn"
                  onClick={onLogout}
                  title="Sign out of academic account"
                  aria-label="Sign out"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <LogOut size={14} />
                </motion.button>
              </div>
            ) : (
              <motion.button
                type="button"
                className="nav-signin-btn"
                onClick={onOpenAuth}
                title="Sign in or register for an academic account"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
