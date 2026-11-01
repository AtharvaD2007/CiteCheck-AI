import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Clock,
  Sparkles,
  Check,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Copy,
  Download,
  BookmarkCheck,
  Bookmark,
  Cpu,
  Quote,
  Lightbulb,
  Radio,
  FileCheck2,
  FileQuestion,
  Search,
  CheckCircle2,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { formatReportMarkdown, downloadFile } from '../utils/exportHelpers';

export function CitationPreviewCard({
  formData = { claim: '', citation: '', sourcePassage: '' },
  inputSnapshot = null,
  loading = false,
  report = null,
  onSaveReport,
  isSaved = false,
  onCopySuccess
}) {
  const [copied, setCopied] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  // Correct, authentic verification stages corresponding to real processing steps
  const stages = [
    { title: 'Reading Input', desc: 'Validating and reading the submitted academic claim, citation and source passage' },
    { title: 'Analyzing Source', desc: 'Examining the supplied source passage and identifying relevant information' },
    { title: 'Comparing Evidence', desc: 'Comparing the academic claim against the actual source evidence' },
    { title: 'Generating Report', desc: 'Preparing the classification, evidence quotations and explanation' },
    { title: 'Verification Complete', desc: 'Displaying the actual Gemini response' }
  ];

  // Stage progression synchronized with active verification processing
  // Timers are cleaned up immediately when the API response arrives or fails.
  useEffect(() => {
    let t1, t2, t3;
    if (loading) {
      setCurrentStageIdx(0); // Stage 1: Reading Input
      t1 = setTimeout(() => setCurrentStageIdx(1), 500); // Stage 2: Analyzing Source
      t2 = setTimeout(() => setCurrentStageIdx(2), 1200); // Stage 3: Comparing Evidence
      t3 = setTimeout(() => setCurrentStageIdx(3), 2000); // Stage 4: Generating Report
    } else if (report) {
      setCurrentStageIdx(4); // Stage 5: Verification Complete
    } else {
      setCurrentStageIdx(0);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loading, report]);

  // Determine active data: snapshot if verified report exists, else live formData
  const activeInput = report && inputSnapshot ? inputSnapshot : formData;
  const rawClaim = (activeInput.claim || '').trim();
  const rawCitation = (activeInput.citation || '').trim();
  const rawPassage = (activeInput.sourcePassage || '').trim();

  // Break passage into lines/sentences for clean academic document rendering
  const passageSentences = useMemo(() => {
    if (!rawPassage) {
      return [
        'Enter original source passage or publication excerpt above.',
        'This viewport previews the verbatim source document text before AI verification.'
      ];
    }
    const raw = rawPassage.match(/[^.!?]+[.!?]+/g) || [rawPassage];
    return raw.map((s) => s.trim()).filter(Boolean);
  }, [rawPassage]);

  // Status configuration for State 2 (Verified report)
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Supported':
        return {
          icon: <Check size={28} strokeWidth={3} />,
          label: 'Supported',
          desc: 'The cited passage directly and faithfully confirms the stated claim.',
          pillBg: '#EAF7EE',
          textColor: '#065F46',
          circleBg: '#059669',
          border: '#A7F3D0'
        };
      case 'Partially Supported':
        return {
          icon: <AlertTriangle size={28} strokeWidth={2.6} />,
          label: 'Partially Supported',
          desc: 'The claim is partially grounded, but contains caveats or overgeneralization.',
          pillBg: '#FDF6E3',
          textColor: '#92400E',
          circleBg: '#D97706',
          border: '#FDE68A'
        };
      case 'Not Supported':
        return {
          icon: <XCircle size={28} strokeWidth={2.6} />,
          label: 'Not Supported',
          desc: 'The source passage explicitly contradicts, refutes, or inverts the claim.',
          pillBg: '#FDECEE',
          textColor: '#9F1239',
          circleBg: '#E11D48',
          border: '#FECDD3'
        };
      case 'Insufficient Evidence':
      default:
        return {
          icon: <HelpCircle size={28} strokeWidth={2.6} />,
          label: 'Insufficient Evidence',
          desc: 'The cited passage does not provide enough substantive context to verify the claim.',
          pillBg: '#EFEBF5',
          textColor: '#334155',
          circleBg: '#64748B',
          border: '#D5CDE2'
        };
    }
  };

  const statusConfig = report ? getStatusConfig(report.result) : null;

  const handleCopy = async () => {
    try {
      const markdown = formatReportMarkdown(report, activeInput);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      if (onCopySuccess) onCopySuccess();
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  };

  const handleDownload = () => {
    const markdown = formatReportMarkdown(report, activeInput);
    const dateStr = new Date().toISOString().slice(0, 10);
    const cleanStatus = (report.result || 'verification').toLowerCase().replace(/\s+/g, '-');
    const filename = `citecheck-report-${cleanStatus}-${dateStr}.md`;
    downloadFile(markdown, filename, 'text/markdown');
  };

  // State 2: Verified state is strictly active when report exists and loading is false
  const isVerifiedState = Boolean(report) && !loading;

  return (
    <motion.section
      className="citation-preview-wrapper"
      id="verification-report-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`citation-preview-card ${loading ? 'is-scanning-active' : ''} ${isVerifiedState ? 'is-verified-report' : 'is-unverified-doc'}`}
      >
        {/* =========================================================================
            GLOWING HORIZONTAL SCANNING BEAM & PURPLE HALO
            Rendered ONLY while verification is actively in progress (loading === true).
            Completely removed when loading ends.
           ========================================================================= */}
        {loading && (
          <>
            <div className="doc-scanner-beam-line" />
            <div className="doc-scanner-beam-glow" />
            <div className="doc-scanner-ambient-overlay" />
          </>
        )}

        {/* =========================================================================
            CARD HEADER
           ========================================================================= */}
        <div className="doc-preview-header">
          <div className="doc-header-left">
            {isVerifiedState ? (
              <motion.div
                key="verified-header-icon"
                className="header-badge-icon verified"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              >
                <Check size={18} strokeWidth={3} />
              </motion.div>
            ) : (
              <div className="header-badge-icon draft">
                <FileText size={18} />
              </div>
            )}

            <div className="doc-header-titles">
              <div className="doc-title-row">
                <h3 className="doc-main-title">
                  {loading
                    ? 'Verifying Academic Document...'
                    : isVerifiedState
                    ? 'Citation Verification Report'
                    : 'Academic Research Document'}
                </h3>
                {loading && (
                  <span className="doc-scan-live-badge">
                    <span className="live-ping-pulse" />
                    SCANNING IN PROGRESS
                  </span>
                )}
              </div>
              <p className="doc-sub-title">
                {loading
                  ? 'AI laser scanner cross-referencing claim against source excerpt...'
                  : isVerifiedState
                  ? `Authenticated verification synthesized with ${report?.modelUsed || 'Gemini AI'}`
                  : 'Unverified manuscript draft preview • Awaiting AI verification'}
              </p>
            </div>
          </div>

          <div className="doc-header-right">
            {loading ? (
              <div className="doc-status-neutral-tag">
                <Cpu size={14} className="radar-icon-pulse" />
                <span>AI Scan Active</span>
              </div>
            ) : isVerifiedState ? (
              <motion.div
                className="doc-header-actions"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {onSaveReport && (
                  <motion.button
                    type="button"
                    className="doc-action-btn"
                    onClick={onSaveReport}
                    title={isSaved ? 'Saved in personal library' : 'Save to library'}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {isSaved ? <BookmarkCheck size={15} style={{ color: '#A78BFA' }} /> : <Bookmark size={15} />}
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </motion.button>
                )}

                <motion.button
                  type="button"
                  className="doc-action-btn"
                  onClick={handleCopy}
                  title="Copy markdown report"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {copied ? <Check size={15} style={{ color: '#A78BFA' }} /> : <Copy size={15} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </motion.button>

                <motion.button
                  type="button"
                  className="doc-action-btn"
                  onClick={handleDownload}
                  title="Download Markdown report"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Download size={15} />
                  <span>Export</span>
                </motion.button>
              </motion.div>
            ) : (
              <div className="doc-status-neutral-tag">
                <Clock size={14} />
                <span>Pending Verification</span>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            ACTIVE SCANNING TELEMETRY BAR (Displayed ONLY when loading === true)
           ========================================================================= */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="scanner-live-telemetry-bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="telemetry-bar-content">
                <div className="telemetry-stage-info">
                  <span className="telemetry-step-pill">Stage {currentStageIdx + 1} of {stages.length}</span>
                  <strong className="telemetry-stage-name">{stages[currentStageIdx].title}</strong>
                  <span className="telemetry-stage-desc">— {stages[currentStageIdx].desc}</span>
                </div>
                <div className="telemetry-radar-ping">
                  <Cpu size={14} className="radar-icon-pulse" />
                  <span>Gemini Grounding Stream</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            DOCUMENT BODY:
            State 1: Academic Document Layout (Metadata, Claim, Source Passage)
            State 2: Verification Report (Status Sidebar, Evidence Highlights, Explanation)
           ========================================================================= */}
        <div className={`doc-body-container ${isVerifiedState ? 'layout-verified-grid' : 'layout-academic-doc'}`}>
          {/* =======================================================================
              LEFT COLUMN: Status Verdict (Displayed ONLY in State 2 after verification)
             ======================================================================= */}
          {isVerifiedState && statusConfig && (
            <motion.div
              className="doc-verdict-sidebar"
              style={{ background: statusConfig.pillBg }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div
                className="verdict-status-icon-circle"
                style={{ background: statusConfig.circleBg }}
              >
                {statusConfig.icon}
              </div>

              <h4 className="verdict-status-label" style={{ color: statusConfig.textColor }}>
                {statusConfig.label}
              </h4>

              <p className="verdict-status-description">{statusConfig.desc}</p>

              {report.confidenceScore && (
                <div
                  className="verdict-confidence-badge"
                  style={{
                    color: statusConfig.textColor,
                    border: `1px solid ${statusConfig.circleBg}33`
                  }}
                >
                  <span>{report.confidenceScore}% Confidence</span>
                  {report.confidenceLevel && <span>• {report.confidenceLevel}</span>}
                </div>
              )}

              {report.modelUsed && (
                <div className="verdict-model-attribution" style={{ color: statusConfig.textColor }}>
                  <Cpu size={12} />
                  <span>Verified with {report.modelUsed}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* =======================================================================
              MAIN DOCUMENT FLOW
             ======================================================================= */}
          <div className="doc-content-stream">
            {/* 1. DOCUMENT METADATA STRIP */}
            <div className="doc-metadata-bar">
              <div className="metadata-item">
                <span className="meta-label">Citation Reference:</span>
                <span className="meta-value citation-text">
                  {rawCitation || 'No reference cited — evaluated as unlinked claim'}
                </span>
              </div>
              <div className="metadata-item right">
                <span className="meta-label">Document Status:</span>
                <span className={`meta-value status-indicator ${isVerifiedState ? 'verified' : 'draft'}`}>
                  {isVerifiedState ? report.result : loading ? 'Analyzing...' : 'Unverified Draft'}
                </span>
              </div>
            </div>

            {/* 2. SECTION: STATED RESEARCH CLAIM */}
            <div
              className={`doc-section-card claim-section ${loading ? 'is-analyzing' : ''} ${isVerifiedState ? 'is-verified-section' : ''}`}
            >
              <div className="section-label-row">
                <span className="section-index-tag">§ 1. STATED RESEARCH CLAIM</span>
                {isVerifiedState ? (
                  <span className="section-verified-pill" style={{ color: statusConfig?.textColor }}>
                    <CheckCircle2 size={13} />
                    Evaluated Claim
                  </span>
                ) : (
                  <span className="section-unverified-tag">Subject Claim</span>
                )}
              </div>

              <div className="claim-quote-viewport">
                <Quote size={20} className="claim-bg-quote-icon" />
                <p className="claim-rendered-text">
                  {rawClaim || (
                    <span className="placeholder-text">
                      Enter an academic claim in the form above to preview it in this research document.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 3. SECTION: ORIGINAL SOURCE PASSAGE (Unverified/Scanning) OR HIGHLIGHTED EVIDENCE (Verified) */}
            <div
              className={`doc-section-card passage-section ${loading ? 'is-analyzing' : ''} ${isVerifiedState ? 'is-verified-section' : ''}`}
            >
              <div className="section-label-row">
                <span className="section-index-tag">
                  {isVerifiedState ? '§ 2. HIGHLIGHTED SOURCE EVIDENCE' : '§ 2. ORIGINAL SOURCE PASSAGE'}
                </span>
                {isVerifiedState ? (
                  <span className="section-verified-pill" style={{ color: statusConfig?.textColor }}>
                    <BookOpen size={13} />
                    Grounded Passage Excerpt
                  </span>
                ) : (
                  <span className="section-unverified-tag">Unverified Excerpt</span>
                )}
              </div>

              {/* Before verification or during scan: display unverified passage. Line highlighting active ONLY while loading */}
              {!isVerifiedState ? (
                <div className="academic-source-sheet">
                  <div className="source-lines-flow">
                    {passageSentences.map((sentence, idx) => {
                      const isActiveScanLine = loading && idx % 4 === currentStageIdx;
                      return (
                        <div
                          key={`passage-line-${idx}`}
                          className={`academic-passage-line ${isActiveScanLine ? 'active-scan-highlight' : ''}`}
                        >
                          <span className="academic-line-num">
                            L{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="academic-line-text">{sentence}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* After verification: reveal verbatim highlighted evidence passages. Zero scanning animations */
                <div className="evidence-verified-container">
                  {report.evidenceQuotes && report.evidenceQuotes.length > 0 ? (
                    report.evidenceQuotes.map((eq, qIdx) => {
                      const isSupporting = (eq.alignment || '').toLowerCase().includes('support') &&
                        !(eq.alignment || '').toLowerCase().includes('contradict') &&
                        !(eq.alignment || '').toLowerCase().includes('not');

                      return (
                        <div
                          key={`quote-${qIdx}`}
                          className={`evidence-highlight-card ${isSupporting ? 'border-support' : 'border-contradict'}`}
                        >
                          <div className="evidence-header-row">
                            <span className={`evidence-alignment-badge ${isSupporting ? 'badge-support' : 'badge-contradict'}`}>
                              {isSupporting ? 'Supporting Evidence' : 'Contradicting Evidence'}
                            </span>
                            <span className="evidence-quote-index">Citation Excerpt #{qIdx + 1}</span>
                          </div>
                          <blockquote className="evidence-quote-body">
                            &ldquo;{eq.quote}&rdquo;
                          </blockquote>
                          {eq.relevance && (
                            <p className="evidence-relevance-text">
                              <strong>Analysis: </strong>
                              {eq.relevance}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="evidence-highlight-card border-neutral">
                      <p className="evidence-quote-body">
                        &ldquo;{report.verdictSummary || rawPassage}&rdquo;
                      </p>
                      <p className="evidence-relevance-text">
                        <strong>Evaluation: </strong>
                        Extracted directly from the provided source passage.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. SECTION: EXPLANATION & SUGGESTIONS (Displayed ONLY after verification, clean with zero scan elements) */}
            {isVerifiedState && (
              <div className="doc-section-card explanation-section">
                <div className="section-label-row">
                  <span className="section-index-tag">§ 3. ANALYTICAL EXPLANATION</span>
                  <span className="section-verified-pill" style={{ color: statusConfig?.textColor }}>
                    <Lightbulb size={13} />
                    Gemini AI Synthesis
                  </span>
                </div>

                <div className="explanation-body-text">
                  <p>{report.explanation || report.verdictSummary}</p>
                </div>

                {report.suggestions && report.suggestions.length > 0 && (
                  <div className="recommendations-box">
                    <div className="rec-box-header">
                      <Sparkles size={14} className="rec-sparkle" />
                      <strong>Academic Integrity Recommendation:</strong>
                    </div>
                    <ul className="rec-list">
                      {report.suggestions.map((sug, sIdx) => (
                        <li key={`sug-${sIdx}`}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* State 1 Informative Pre-Scan Guidance Strip (Visible only before verification) */}
            {!isVerifiedState && !loading && (
              <div className="pre-scan-guidance-strip">
                <div className="guidance-icon-wrap">
                  <Radio size={16} className="radar-icon-pulse" />
                </div>
                <div className="guidance-text-content">
                  <strong>Ready for Verification: </strong>
                  <span>
                    Click the <strong>Verify Citation</strong> button above to start the AI laser scanner and verify this claim against the source passage.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export const ReportCard = CitationPreviewCard;
export default CitationPreviewCard;
