import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Quote,
  Cpu,
  RotateCcw
} from 'lucide-react';

export function HeroIllustration() {
  // Two states: 'scanning' (unverified 2.6s sweep) and 'verified' (supported report for 4.0s)
  const [scanState, setScanState] = useState('scanning');
  const timerRef = useRef(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    if (scanState === 'scanning') {
      // Run scanner line over 2.6 seconds, then trigger state transition to verified
      timerRef.current = setTimeout(() => {
        setScanState('verified');
      }, 2600);
    } else if (scanState === 'verified') {
      // Keep verified report visible for 4.0 seconds, then reset to scanning
      timerRef.current = setTimeout(() => {
        setScanState('scanning');
      }, 4000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scanState]);

  // Allow triggering the interactive sequence via custom event (e.g. from Verify Citation button)
  useEffect(() => {
    const handleTrigger = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setScanState('scanning');
    };
    window.addEventListener('citecheck:trigger-hero-scan', handleTrigger);
    return () => window.removeEventListener('citecheck:trigger-hero-scan', handleTrigger);
  }, []);

  const handleManualReplay = (e) => {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    setScanState('scanning');
  };

  const isScanning = scanState === 'scanning';

  return (
    <div className="hero-illustration-wrapper">
      {/* Ambient background glows */}
      <motion.div
        className="hero-ambient-glow"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.55, 0.35]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className="hero-ambient-glow-secondary"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.25, 0.45, 0.25]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
      />

      {/* Main SaaS Evidence Glass Preview Card */}
      <motion.div
        className="hero-preview-glass-card"
        initial={{ opacity: 0, y: 35, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -4, transition: { duration: 0.25 } }}
        onClick={handleManualReplay}
        title="Click to replay interactive scanner audit"
        style={{ cursor: 'pointer' }}
      >
        {/* Animated Laser Scanner Line (Active only during 'scanning', fades out on completion) */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              key="hero-scan-beam"
              className="hero-scanner-line-active"
              initial={{ top: '0%', opacity: 0 }}
              animate={{
                top: ['0%', '10%', '90%', '100%'],
                opacity: [0, 1, 1, 0]
              }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{
                duration: 2.6,
                ease: 'easeInOut'
              }}
            />
          )}
        </AnimatePresence>

        {/* Card Header with window controls */}
        <div className="hero-glass-header">
          <div className="hero-window-dots">
            <span className="dot dot-red" />
            <span className="dot dot-amber" />
            <span className="dot dot-green" />
          </div>
          <div className="hero-engine-badge">
            <motion.div
              animate={{ rotate: isScanning ? 360 : 0 }}
              transition={isScanning ? { duration: 3, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
            >
              <Sparkles size={12} className="engine-sparkle" />
            </motion.div>
            <span>Gemini Semantic Audit</span>
            <button
              type="button"
              className="hero-replay-btn"
              onClick={handleManualReplay}
              title="Re-scan audit"
              aria-label="Replay audit"
            >
              <RotateCcw size={10} />
            </button>
          </div>
        </div>

        {/* Claim Bar */}
        <div className="hero-glass-claim-row">
          <div className="hero-claim-label-row">
            <span className="hero-claim-label">Sample Academic Claim</span>
            {isScanning ? (
              <span className="hero-scan-indicator">
                <span className="hero-scan-pulse-dot" />
                Scanning
              </span>
            ) : (
              <span className="hero-grounded-indicator">Grounded</span>
            )}
          </div>
          <p className="hero-claim-text">
            &ldquo;Transformer architectures rely solely on self-attention mechanisms without recurrence or convolutions.&rdquo;
          </p>
        </div>

        {/* =========================================================================
            INTERACTIVE VERDICT BOX:
            Initial State (Unverified Scan): Pending Verification + generic placeholder
            Final State (Verified Report): Supported + 98% Confidence + verbatim quote + green glow
           ========================================================================= */}
        <div className="hero-verdict-container">
          <AnimatePresence mode="wait">
            {isScanning ? (
              /* State 1: Unverified Scan */
              <motion.div
                key="unverified-scan-box"
                className="hero-glass-verdict-box is-unverified"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="hero-verdict-icon-wrap unverified">
                  <Clock size={18} className="hero-verdict-icon" />
                </div>
                <div className="hero-verdict-text-group">
                  <div className="hero-verdict-title-row">
                    <span className="hero-verdict-status unverified">Pending Verification</span>
                    <span className="hero-verdict-confidence unverified">Awaiting Audit</span>
                  </div>
                  <p className="hero-verdict-quote unverified">
                    Awaiting AI verification... scanning claim against primary literature
                  </p>
                </div>
              </motion.div>
            ) : (
              /* State 2: Verified Report */
              <motion.div
                key="verified-report-box"
                className="hero-glass-verdict-box is-verified"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  className="hero-verdict-icon-wrap verified"
                  initial={{ scale: 0.6, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 18 }}
                >
                  <CheckCircle2 size={20} className="hero-verdict-icon" />
                </motion.div>
                <div className="hero-verdict-text-group">
                  <div className="hero-verdict-title-row">
                    <span className="hero-verdict-status verified">Supported</span>
                    <motion.span
                      className="hero-verdict-confidence verified"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.12 }}
                    >
                      98% Confidence
                    </motion.span>
                  </div>
                  <p className="hero-verdict-quote verified">
                    <Quote size={12} className="quote-micro-icon" />
                    &ldquo;The Transformer is based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.&rdquo;
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating SaaS Metric Pills */}
        <motion.div
          className="hero-floating-pill pill-top"
          animate={{
            y: [0, -8, 0],
            rotate: [0, 1, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          whileHover={{ scale: 1.06 }}
        >
          <ShieldCheck size={14} className="pill-icon-shield" />
          <span>Verbatim Grounding</span>
        </motion.div>

        <motion.div
          className="hero-floating-pill pill-bottom"
          animate={{
            y: [0, 8, 0],
            rotate: [0, -1, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
          whileHover={{ scale: 1.06 }}
        >
          <Cpu size={14} className="pill-icon-cpu" />
          <span>Gemini 2.5 Active</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default HeroIllustration;
