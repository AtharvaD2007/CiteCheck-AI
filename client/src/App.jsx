import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { HeroIllustration } from './components/HeroIllustration';
import { VerificationForm } from './components/VerificationForm';
import { CitationPreviewCard } from './components/CitationPreviewCard';
import { VerificationConditionsGuide } from './components/VerificationConditionsGuide';
import { BackgroundParticles } from './components/BackgroundParticles';
import { AuthScreen } from './components/AuthScreen';
import { AuthModal } from './components/AuthModal';
import { UnverifiedBanner } from './components/UnverifiedBanner';
import { SavedReportsModal } from './components/SavedReportsModal';
import { AboutModal } from './components/AboutModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CheckCircle2, AlertCircle, Sparkles, Lock, ArrowRight, RotateCcw } from 'lucide-react';
import { apiUrl } from './utils/api';

export default function App() {
  const [health, setHealth] = useState(null);

  // Authenticated User State (Compulsory authentication check)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('citecheck_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Personal Reports for logged in user
  const [savedReports, setSavedReports] = useState([]);
  const [isReportSaved, setIsReportSaved] = useState(false);

  // Clean empty form inputs initially (No dummy or pre-filled data)
  const [formData, setFormData] = useState({
    claim: '',
    citation: '',
    sourcePassage: ''
  });

  // Verification Result (null initially - no fake reports)
  const [verificationResult, setVerificationResult] = useState(null);
  const [currentInputSnapshot, setCurrentInputSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modals Visibility
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [showSavedReportsModal, setShowSavedReportsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch API Health & Model status
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/health'));
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        return data;
      }
    } catch (err) {
      console.warn('Backend connection issue:', err);
      setHealth({ hasApiKey: false, status: 'offline' });
    }
    return null;
  }, []);

  // Fetch user personal reports from database (deduplicated)
  const isFetchingReportsRef = useRef(false);
  const fetchReports = useCallback(async () => {
    const token = localStorage.getItem('citecheck_token');
    if (!token) {
      setSavedReports([]);
      return;
    }
    if (isFetchingReportsRef.current) return;
    isFetchingReportsRef.current = true;

    try {
      const res = await fetch(apiUrl('/api/reports'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedReports(data.reports || []);
      } else if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('citecheck_token');
        localStorage.removeItem('citecheck_user');
        setUser(null);
      }
    } catch (err) {
      console.warn('Could not load user reports:', err);
    } finally {
      isFetchingReportsRef.current = false;
    }
  }, []);

  // Sync user profile from server
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('citecheck_token');
    if (!token) return;

    try {
      const res = await fetch(apiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('citecheck_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.warn('Error refreshing user:', err);
    }
  }, []);

  // Direct email token verification handler
  const handleDirectVerifyToken = async (token) => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Academic email successfully verified! Full access unlocked.');
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('citecheck_user', JSON.stringify(data.user));
        }
      } else {
        setErrorMessage(data.error || 'Email verification failed or token has expired.');
      }
    } catch (err) {
      setErrorMessage('Could not complete email verification.');
    }
  };

  // Handle URL email verification link on load
  useEffect(() => {
    const handleUrlVerification = async () => {
      const params = new URLSearchParams(window.location.search);
      const verifyToken = params.get('verify_token');
      const wasVerified = params.get('verified');

      if (verifyToken) {
        await handleDirectVerifyToken(verifyToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (wasVerified) {
        showToast('Academic email successfully verified!');
        refreshUser();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    fetchHealth();
    handleUrlVerification();
  }, [fetchHealth, refreshUser]);

  // When user state changes, refresh personal reports
  useEffect(() => {
    if (user) {
      fetchReports();
    } else {
      setSavedReports([]);
    }
  }, [user, fetchReports]);

  // Synchronous guards against duplicate submissions / saves
  const isVerifyingRef = useRef(false);
  const isSavingRef = useRef(false);

  // Verify Citation Handler
  const handleVerify = async () => {
    // Prevent duplicate triggers if already verifying
    if (isVerifyingRef.current || loading) {
      return;
    }

    setErrorMessage('');

    // 1. Must be logged in (Compulsory authentication)
    if (!user) {
      setAuthModalMode('login');
      setShowAuthModal(true);
      setErrorMessage('Please sign in to verify academic citations.');
      return;
    }

    // 1b. Academic email verification requirement
    if (!user.isVerified) {
      setErrorMessage('Academic email verification required. Please click the verification link sent to your inbox to unlock live verification.');
      return;
    }

    // 2. API key must be ready
    if (!health?.hasApiKey) {
      setShowSetupModal(true);
      return;
    }

    // Start verification & scanning animation
    isVerifyingRef.current = true;
    setLoading(true);
    setVerificationResult(null); // Clean state when starting new verification

    // Trigger hero preview card audit sequence synchronously
    window.dispatchEvent(new CustomEvent('citecheck:trigger-hero-scan'));

    try {
      const token = localStorage.getItem('citecheck_token');
      const res = await fetch(apiUrl('/api/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          localStorage.removeItem('citecheck_token');
          localStorage.removeItem('citecheck_user');
          throw new Error('Your session has expired. Please sign in again.');
        }
        if (res.status === 403 && (data.code === 'EMAIL_UNVERIFIED' || data.emailUnverified)) {
          throw new Error('Academic email verification required. Please click the verification link sent to your inbox.');
        }
        throw new Error(data.error || 'Failed to verify citation.');
      }

      // Successfully verified: set results and mark saved
      setVerificationResult(data.report);
      setCurrentInputSnapshot({ ...formData });
      setIsReportSaved(true);

      // Refresh user reports list
      fetchReports();
      showToast('Citation verified & saved to My Reports!');

      // Smooth scroll to report view
      setTimeout(() => {
        const reportElement = document.getElementById('verification-report-section');
        if (reportElement) {
          reportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (err) {
      // If verification fails, stop animation and show error state
      setVerificationResult(null);
      setErrorMessage(err.message);
    } finally {
      // Immediately stop all scanning animation states
      isVerifyingRef.current = false;
      setLoading(false);
    }
  };

  // Reset form
  const handleClearForm = () => {
    setFormData({
      claim: '',
      citation: '',
      sourcePassage: ''
    });
    setVerificationResult(null);
    setCurrentInputSnapshot(null);
    setIsReportSaved(false);
    setErrorMessage('');
  };

  // Manual save current report (Deduplicated)
  const handleSaveCurrentReport = async () => {
    if (!verificationResult || !currentInputSnapshot) return;

    if (isReportSaved) {
      showToast('Report is already saved in your library.');
      return;
    }

    if (isSavingRef.current) return;
    isSavingRef.current = true;

    if (!user) {
      setErrorMessage('Please sign in to save reports.');
      isSavingRef.current = false;
      return;
    }

    if (!user.isVerified) {
      setErrorMessage('Please verify your academic email address to save reports to your library.');
      isSavingRef.current = false;
      return;
    }

    try {
      const token = localStorage.getItem('citecheck_token');
      const res = await fetch(apiUrl('/api/reports'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: currentInputSnapshot.claim.slice(0, 60) + (currentInputSnapshot.claim.length > 60 ? '...' : ''),
          input: currentInputSnapshot,
          report: verificationResult
        })
      });

      if (res.ok) {
        setIsReportSaved(true);
        fetchReports();
        showToast('Report saved to your library!');
      } else {
        const data = await res.json();
        showToast(data.error || 'Could not save report.');
      }
    } catch (err) {
      showToast('Network error while saving report.');
    } finally {
      isSavingRef.current = false;
    }
  };

  // Select a saved report to view
  const handleSelectSavedReport = (savedRecord) => {
    setVerificationResult(savedRecord.report);
    setCurrentInputSnapshot(savedRecord.input);
    if (savedRecord.input) {
      setFormData({
        claim: savedRecord.input.claim || '',
        citation: savedRecord.input.citation || '',
        sourcePassage: savedRecord.input.sourcePassage || ''
      });
    }
    setIsReportSaved(true);
    setErrorMessage('');
    showToast('Loaded saved verification report.');

    setTimeout(() => {
      const reportElement = document.getElementById('verification-report-section');
      if (reportElement) {
        reportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Delete a report
  const handleDeleteReport = async (reportId) => {
    try {
      const token = localStorage.getItem('citecheck_token');
      const res = await fetch(apiUrl(`/api/reports/${reportId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSavedReports((prev) => prev.filter((r) => r.id !== reportId));
        showToast('Report deleted.');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete report.');
      }
    } catch (err) {
      showToast('Error deleting report.');
    }
  };

  // Auth Success Handler (Instant dashboard navigation, no redundant calls)
  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    localStorage.setItem('citecheck_user', JSON.stringify(authenticatedUser));
    showToast(`Welcome, ${authenticatedUser.name}!`);
  };

  // Logout Handler (Compulsory Auth: returns immediately to login portal)
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('citecheck_token');
      if (token) {
        await fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {
      // ignore
    }
    localStorage.removeItem('citecheck_token');
    localStorage.removeItem('citecheck_user');
    setUser(null);
    setSavedReports([]);
    setVerificationResult(null);
    setCurrentInputSnapshot(null);
    showToast('Signed out of CiteCheck AI.');
  };

  // Helper for dev verification link
  const handleSimulatedVerify = (url) => {
    try {
      const parsed = new URL(url);
      const token = parsed.searchParams.get('verify_token');
      if (token) {
        handleDirectVerifyToken(token);
      } else {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }
  };

  // =========================================================================
  // COMPULSORY AUTHENTICATION GATEWAY
  // If user is not authenticated, render the dedicated full-page Auth Portal
  // =========================================================================
  if (!user) {
    return (
      <div className="app-main-layout">
        <BackgroundParticles />
        <AuthScreen
          onAuthSuccess={handleAuthSuccess}
          onVerifyToken={handleDirectVerifyToken}
        />
        {toastMessage && (
          <div className="toast-notice">
            <CheckCircle2 size={16} style={{ color: 'var(--secondary)' }} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-main-layout">
      {/* 0. Ambient Floating Particle Background */}
      <BackgroundParticles />

      {/* 1. Header Navigation Bar */}
      <Navbar
        user={user}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onOpenSavedReports={() => {
          if (!user.isVerified) {
            showToast('Please verify your academic email address first.');
          } else {
            setShowSavedReportsModal(true);
          }
        }}
        onOpenSetup={() => setShowSetupModal(true)}
        onOpenAbout={() => setShowAboutModal(true)}
        savedReportsCount={savedReports.length}
        hasApiKey={Boolean(health?.hasApiKey)}
      />

      {/* Email Verification Reminder Banner (when user is unverified) */}
      <UnverifiedBanner
        user={user}
        onSimulatedVerify={(url) => {
          window.location.href = url;
        }}
      />

      {/* 2. Hero Section with Staggered Entrance and Gradient Animation */}
      <section className="hero-wrapper">
        <div className="hero-ambient-shape shape-lavender" />
        <div className="hero-ambient-shape shape-indigo" />
        
        <div className="hero-content-container">
          <div className="hero-text-block">
            <motion.div
              className="hero-badge-pill"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Sparkles size={13} className="hero-badge-sparkle" />
              <span>AI Citation Verification • Powered by Gemini</span>
            </motion.div>

            <motion.h1
              className="hero-headline"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="hero-title-dark">Verify Your </span>
              <span className="hero-title-gradient">Research Evidence</span>
            </motion.h1>

            <motion.p
              className="hero-tagline-text"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              Critically analyze scholarly assertions against primary literature with zero-hallucination comparative evidence verification.
            </motion.p>

            <motion.div
              className="hero-trust-row"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="trust-pill">
                <span className="trust-dot" />
                <span>Zero Hallucination</span>
              </div>
              <div className="trust-pill">
                <span className="trust-dot" />
                <span>Verbatim Extraction</span>
              </div>
              <div className="trust-pill">
                <span className="trust-dot" />
                <span>4-Tier Taxonomy</span>
              </div>
            </motion.div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      {/* 4. Main Workspace Area */}
      <main className="app-workspace-body">
        {/* Error notification banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              className="form-error-banner anim-shake"
              style={{ marginBottom: '1.5rem' }}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong>Notice: </strong>
                <span>{errorMessage}</span>
              </div>
              {errorMessage.toLowerCase().includes('api key') ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSetupModal(true)}
                >
                  Configure Key
                </button>
              ) : (
                Boolean(formData.claim && formData.sourcePassage && !errorMessage.toLowerCase().includes('sign in')) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleVerify}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RotateCcw size={13} />
                    <span>Retry</span>
                  </button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enter Details Card (Horizontal 3-column input card) */}
        <VerificationForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleVerify}
          onClear={handleClearForm}
          loading={loading}
          hasApiKey={Boolean(health?.hasApiKey)}
          onOpenSetup={() => setShowSetupModal(true)}
        />

        {/* =========================================================================
            TWO-STATE INTERACTIVE ACADEMIC DOCUMENT SCANNER & VERIFICATION REPORT:
            State 1: Normal Academic Document Preview (Before scanning, zero fake results)
            Scanning Transition: Glowing horizontal laser beam sweeps down across sections
            State 2: Progressively transformed verification report with actual Gemini results
           ========================================================================= */}
        <CitationPreviewCard
          formData={formData}
          inputSnapshot={currentInputSnapshot}
          loading={loading}
          report={verificationResult}
          onSaveReport={handleSaveCurrentReport}
          isSaved={isReportSaved}
          onCopySuccess={() => showToast('Report copied to clipboard in Markdown format!')}
        />

        {/* 5. Verification Conditions & Verdicts Taxonomy Guide */}
        <VerificationConditionsGuide />
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      <SavedReportsModal
        isOpen={showSavedReportsModal}
        onClose={() => setShowSavedReportsModal(false)}
        reports={savedReports}
        onSelectReport={handleSelectSavedReport}
        onDeleteReport={handleDeleteReport}
        onStartNewCheck={() => {
          window.scrollTo({ top: 320, behavior: 'smooth' });
        }}
      />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      <ApiKeyModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onRefreshHealth={fetchHealth}
        isConnected={Boolean(health?.hasApiKey)}
      />

      {/* Floating Toast Notice */}
      {toastMessage && (
        <div className="toast-notice">
          <CheckCircle2 size={16} style={{ color: 'var(--secondary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
