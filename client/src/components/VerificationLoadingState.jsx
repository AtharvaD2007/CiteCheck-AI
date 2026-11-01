import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Search, Sparkles, CheckCircle2, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

export function VerificationLoadingState({ claim = '', citation = '', sourcePassage = '' }) {
  const stages = [
    { title: 'Reading source passage', desc: 'Parsing grammatical tokens, sentence boundaries and empirical context' },
    { title: 'Extracting relevant evidence', desc: 'Identifying verbatim passages and contextual caveats related to the claim' },
    { title: 'Comparing claim with evidence', desc: 'Evaluating logical consistency, causal validity and statistical scope' },
    { title: 'Generating verification report', desc: 'Synthesizing structured verdict with recommendations and quotation alignment' },
  ];

  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => clearInterval(timer);
  }, [stages.length]);

  // Break source passage into sentences or clean chunks for progressive text line scanning
  const passageSentences = React.useMemo(() => {
    if (!sourcePassage || !sourcePassage.trim()) {
      return ['Analyzing source passage content for evidence...'];
    }
    const raw = sourcePassage.match(/[^.!?]+[.!?]+/g) || [sourcePassage];
    return raw.map((s) => s.trim()).filter(Boolean);
  }, [sourcePassage]);

  return (
    <motion.section
      className="loading-card-wrapper"
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="active-scanning-card">
        {/* Top Scanner HUD Header */}
        <div className="scanner-hud-header">
          <div className="scanner-hud-left">
            <div className="scanner-orbit-wrap">
              <motion.div
                className="scanner-radar-ring-outer"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="scanner-radar-ring-inner"
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              <div className="scanner-core-pulse" />
              <div className="scanner-core-icon">
                <Cpu size={20} />
              </div>
            </div>

            <div className="scanner-hud-info">
              <div className="scanner-hud-title-row">
                <span className="scanner-live-badge">
                  <span className="live-ping-dot" />
                  LIVE AI VERIFICATION
                </span>
                <span className="scanner-hud-stage-counter">
                  Stage {currentStageIdx + 1} of {stages.length}
                </span>
              </div>
              <h3 className="scanner-hud-headline">
                {stages[currentStageIdx].title}
              </h3>
            </div>
          </div>

          <div className="scanner-hud-right">
            <div className="scanner-telemetry-pill">
              <Sparkles size={13} className="telemetry-sparkle" />
              <span>Gemini Grounding Stream Active</span>
            </div>
          </div>
        </div>

        {/* 4 Genuine Stage Steps Progress Tracker */}
        <div className="scanner-stages-stepper">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <div
                key={stage.title}
                className={`scanner-stage-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
              >
                <div className="stage-step-marker">
                  {isCompleted ? (
                    <CheckCircle2 size={14} className="step-check" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="stage-step-labels">
                  <span className="stage-step-title">{stage.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Dual-Panel Live Document Analysis Preview */}
        <div className="scanner-documents-grid">
          {/* Panel 1: The Claim being tested */}
          <div className="scanner-document-box claim-box">
            <div className="scanner-doc-header">
              <span className="scanner-doc-tag">TARGET SCHOLARLY CLAIM</span>
              {citation && <span className="scanner-citation-tag">{citation}</span>}
            </div>
            <p className="scanner-claim-text">
              "{claim}"
            </p>
          </div>

          {/* Panel 2: The Source Passage with Laser Scanning Beam and Line Illumination */}
          <div className="scanner-document-box passage-box">
            <div className="scanner-doc-header">
              <span className="scanner-doc-tag">PRIMARY SOURCE EXCERPT</span>
              <span className="scanner-scan-status">SCANNING PASSAGE...</span>
            </div>

            {/* Document Content View with Moving Laser Scanning Line */}
            <div className="passage-scan-viewport">
              {/* Moving Laser Beam that repeatedly travels down the text */}
              <div className="passage-laser-beam" />
              <div className="passage-laser-glow" />

              <div className="passage-sentences-list">
                {passageSentences.map((sentence, sIdx) => (
                  <p
                    key={sIdx}
                    className={`scanned-passage-line ${sIdx <= currentStageIdx ? 'is-active-line' : ''}`}
                  >
                    <span className="line-number">{String(sIdx + 1).padStart(2, '0')}</span>
                    <span className="line-text">{sentence}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Stage Description Footer */}
        <div className="scanner-footer-status">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStageIdx}
              className="scanner-stage-detail"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <span className="footer-status-dot" />
              <span>{stages[currentStageIdx].desc}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
