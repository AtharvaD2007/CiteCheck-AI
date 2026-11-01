import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PenLine,
  Search,
  ArrowRight,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export function VerificationForm({
  formData,
  setFormData,
  onSubmit,
  onClear,
  loading,
  hasApiKey,
  onOpenSetup
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [activeField, setActiveField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions while verification is in progress
    if (!formData.claim || !formData.claim.trim()) {
      setErrorMsg('Please enter an academic claim to verify.');
      return;
    }
    if (formData.claim.trim().length < 5) {
      setErrorMsg('Academic claim is too short. Please provide at least 5 characters.');
      return;
    }
    if (!formData.sourcePassage || !formData.sourcePassage.trim()) {
      setErrorMsg('Please provide the original source passage excerpt.');
      return;
    }
    if (formData.sourcePassage.trim().length < 15) {
      setErrorMsg('Source passage is too short. Please provide a substantive excerpt (at least 15 characters).');
      return;
    }

    if (!hasApiKey) {
      onOpenSetup();
      return;
    }

    setErrorMsg('');
    onSubmit();
  };

  const hasContent = Boolean(
    formData.claim?.trim() ||
    formData.citation?.trim() ||
    formData.sourcePassage?.trim()
  );

  return (
    <motion.section
      className="details-card-wrapper"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`details-card ${activeField ? 'card-field-active' : ''}`}>
        {/* Card Header */}
        <div className="details-card-header">
          <div className="details-header-title">
            <motion.div
              className="details-pen-icon"
              whileHover={{ rotate: 12, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <PenLine size={18} strokeWidth={2.4} />
            </motion.div>
            <h2 className="details-title-text">Enter Details</h2>
          </div>

          {hasContent && (
            <motion.button
              type="button"
              className="details-reset-btn"
              onClick={onClear}
              disabled={loading}
              title="Reset input fields"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div whileHover={{ rotate: -180 }} transition={{ duration: 0.35 }}>
                <RotateCcw size={13} />
              </motion.div>
              <span>Reset</span>
            </motion.button>
          )}
        </div>

        {errorMsg && (
          <motion.div
            className="form-error-banner anim-shake"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 3 Horizontal Input Fields */}
          <div className="details-inputs-grid">
            {/* Field 1: Academic Claim */}
            <div className={`detail-input-col ${activeField === 'claim' ? 'is-focused' : ''}`}>
              <label htmlFor="claim" className="detail-label">
                <span>Academic Claim</span>
                <span className="required-star">*</span>
              </label>
              <div className="textarea-wrapper">
                <textarea
                  id="claim"
                  name="claim"
                  className="detail-textarea"
                  placeholder="Enter the specific scholarly statement or hypothesis you want to verify..."
                  value={formData.claim}
                  onChange={handleChange}
                  onFocus={() => setActiveField('claim')}
                  onBlur={() => setActiveField(null)}
                  disabled={loading}
                />
                <span className="textarea-focus-glow" />
              </div>
              <span className="detail-subtext">The assertion to verify against evidence</span>
            </div>

            {/* Field 2: Citation / Reference */}
            <div className={`detail-input-col ${activeField === 'citation' ? 'is-focused' : ''}`}>
              <label htmlFor="citation" className="detail-label">
                <span>Citation / Reference</span>
                <span className="optional-tag">(Optional)</span>
              </label>
              <div className="textarea-wrapper">
                <textarea
                  id="citation"
                  name="citation"
                  className="detail-textarea"
                  placeholder="e.g. Author et al. (Year), Journal / Conference, Title..."
                  value={formData.citation}
                  onChange={handleChange}
                  onFocus={() => setActiveField('citation')}
                  onBlur={() => setActiveField(null)}
                  disabled={loading}
                />
                <span className="textarea-focus-glow" />
              </div>
              <span className="detail-subtext">Source attribution details</span>
            </div>

            {/* Field 3: Source Passage */}
            <div className={`detail-input-col ${activeField === 'sourcePassage' ? 'is-focused' : ''}`}>
              <label htmlFor="sourcePassage" className="detail-label">
                <span>Source Passage</span>
                <span className="required-star">*</span>
              </label>
              <div className="textarea-wrapper">
                <textarea
                  id="sourcePassage"
                  name="sourcePassage"
                  className="detail-textarea"
                  placeholder="Paste the verbatim passage or findings paragraph directly from the cited paper..."
                  value={formData.sourcePassage}
                  onChange={handleChange}
                  onFocus={() => setActiveField('sourcePassage')}
                  onBlur={() => setActiveField(null)}
                  disabled={loading}
                />
                <span className="textarea-focus-glow" />
              </div>
              <span className="detail-subtext">Original text to check claim against</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="details-actions-bar" style={{ justifyContent: 'flex-end' }}>
            <motion.button
              type="submit"
              className="btn-verify-citation"
              disabled={loading}
              style={{
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                pointerEvents: loading ? 'none' : 'auto'
              }}
              whileHover={loading ? {} : { scale: 1.02, y: -2 }}
              whileTap={loading ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {loading ? (
                <>
                  <div className="verify-spinner" />
                  <span>Verifying with Gemini...</span>
                </>
              ) : (
                <>
                  <Search size={17} strokeWidth={2.4} />
                  <span>Verify Citation</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight size={17} strokeWidth={2.4} />
                  </motion.div>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.section>
  );
}
