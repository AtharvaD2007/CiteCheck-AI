import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileQuestion,
  HelpCircle,
  ChevronDown,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const CONDITIONS = [
  {
    id: 'supported',
    status: 'Supported',
    badgeClass: 'verdict-badge-supported',
    accentColor: '#059669',
    bgColor: '#EAF7EE',
    borderColor: '#A7F3D0',
    icon: <CheckCircle2 size={22} className="condition-icon icon-supported" />,
    summary: 'The source passage directly, unambiguously, and fully supports the substantive assertions made in the claim.',
    definition:
      'The claim is completely grounded in the primary cited text without exaggeration, fabricated percentages, or distorted conclusions. Direct verbatim proof exists within the text.',
    criteria: [
      'Empirical and logical alignment with the author’s primary findings.',
      'Exact verbatim quotation available to substantiate the conclusion.',
      'Accurate preservation of experimental conditions, scope, and numbers.'
    ],
    example: {
      claim: 'The Transformer architecture relies exclusively on attention mechanisms, discarding recurrence.',
      passage: 'We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies...',
      takeaway: 'Exact match: the author explicitly affirms reliance on attention while dispensing with recurrent structures.'
    }
  },
  {
    id: 'partially-supported',
    status: 'Partially Supported',
    badgeClass: 'verdict-badge-partial',
    accentColor: '#D97706',
    bgColor: '#FDF6E3',
    borderColor: '#FDE68A',
    icon: <AlertTriangle size={22} className="condition-icon icon-partial" />,
    summary: 'The claim has elements grounded in the text, but exaggerates findings, generalizes scope, or omits caveats.',
    definition:
      'The researcher identified the right topic, but overstated the results—such as extrapolating animal or in-vitro trials to humans, asserting causation from correlation, or omitting conditional parameters.',
    criteria: [
      'Converts correlational observation into definitive causal claims.',
      'Overgeneralizes experimental population (e.g. murine models to clinical human therapy).',
      'Omits crucial caveats, boundary conditions, or statistical significance boundaries.'
    ],
    example: {
      claim: 'Compound RG-109 cures early-stage Alzheimer’s pathology in clinical patients.',
      passage: 'Administration of RG-109 significantly attenuated amyloid-beta deposition in transgenic murine models (p < 0.01). Phase-1 clinical human efficacy remains uninvestigated.',
      takeaway: 'Nuance discrepancy: results were proven strictly in mice, yet the claim overstates clinical human efficacy.'
    }
  },
  {
    id: 'not-supported',
    status: 'Not Supported',
    badgeClass: 'verdict-badge-unsupported',
    accentColor: '#E11D48',
    bgColor: '#FDECEE',
    borderColor: '#FECDD3',
    icon: <XCircle size={22} className="condition-icon icon-unsupported" />,
    summary: 'The source passage explicitly contradicts, refutes, or inverts the claim’s core conclusion.',
    definition:
      'The cited paper reaches the opposite empirical or analytical conclusion from what the researcher asserted. Citing this paper as evidence constitutes an academic misattribution.',
    criteria: [
      'The cited passage explicitly disproves the researcher’s stated thesis.',
      'Opposite directional outcome observed (e.g. performance declined rather than improved).',
      'The original authors explicitly refute the cited mechanism or hypothesis.'
    ],
    example: {
      claim: 'Increasing network depth past 20 layers without residual links steadily accelerates model convergence.',
      passage: 'With network depth increasing, accuracy gets saturated and then degrades rapidly. Degradation is not caused by overfitting, and adding more layers leads to higher training error...',
      takeaway: 'Direct contradiction: the authors prove deeper plain networks degrade accuracy, contradicting the claim.'
    }
  },
  {
    id: 'insufficient-evidence',
    status: 'Insufficient Evidence',
    badgeClass: 'verdict-badge-insufficient',
    accentColor: '#64748B',
    bgColor: '#EFEBF5',
    borderColor: '#D5CDE2',
    icon: <FileQuestion size={22} className="condition-icon icon-insufficient" />,
    summary: 'The source passage lacks enough empirical data, methods, or findings to evaluate the claim.',
    definition:
      'The supplied excerpt does not contain the required variables, statistical benchmarks, or empirical outcomes needed to confirm or deny the claim (e.g. passage only describes background or apparatus).',
    criteria: [
      'The excerpt discusses adjacent topics but omits the key outcome metric.',
      'The passage only contains speculative literature review or future work aspirations.',
      'Hardware or methodological descriptions without empirical results.'
    ],
    example: {
      claim: 'Algorithm Alpha achieved a 94.6% F1-score on the MIMIC-III benchmark.',
      passage: 'All experiments were executed on four Nvidia A100 GPUs using PyTorch 2.1 with mixed-precision FP16 enabled and an initial learning rate of 3e-4.',
      takeaway: 'Missing data: the excerpt only describes computational hardware and learning rate, not the F1 benchmark result.'
    }
  }
];

export function VerificationConditionsGuide() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="conditions-guide-section" id="conditions-guide" aria-label="Verification Conditions Guide">
      <div className="conditions-guide-header">
        <div className="guide-header-badge">
          <BookOpen size={16} />
          <span>Academic Taxonomy & Grounding Standards</span>
        </div>
        <h2 className="guide-main-title">Understanding CiteCheck AI Verification Verdicts</h2>
        <p className="guide-sub-title">
          CiteCheck AI evaluates claims against source passages using rigorous peer-review standards. Every citation audit classifies evidence into one of four distinct conditions:
        </p>
      </div>

      <div className="conditions-grid">
        {CONDITIONS.map((cond) => {
          const isExpanded = expandedId === cond.id;

          return (
            <motion.div
              key={cond.id}
              className={`condition-card ${isExpanded ? 'is-card-expanded' : ''}`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
              style={{
                borderTop: `4px solid ${cond.accentColor}`
              }}
            >
              <div className="condition-card-top">
                <div className="condition-badge-row">
                  <span
                    className="condition-verdict-pill"
                    style={{
                      background: cond.bgColor,
                      color: cond.accentColor,
                      borderColor: cond.borderColor
                    }}
                  >
                    {cond.icon}
                    <strong>{cond.status}</strong>
                  </span>
                </div>
                <h3 className="condition-card-heading">{cond.summary}</h3>
                <p className="condition-card-desc">{cond.definition}</p>
              </div>

              <div className="condition-criteria-block">
                <h4 className="criteria-header">
                  <ShieldCheck size={14} style={{ color: cond.accentColor }} />
                  <span>Evaluation Criteria:</span>
                </h4>
                <ul className="criteria-list">
                  {cond.criteria.map((item, idx) => (
                    <li key={idx} className="criteria-item">
                      <span className="criteria-bullet" style={{ background: cond.accentColor }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Collapsible Illustrative Example */}
              <div className="condition-example-toggle-wrapper">
                <button
                  type="button"
                  className="condition-toggle-btn"
                  onClick={() => toggleExpand(cond.id)}
                  aria-expanded={isExpanded}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={13} style={{ color: cond.accentColor }} />
                    <strong>{isExpanded ? 'Hide Academic Example' : 'View Real Academic Example'}</strong>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`toggle-chevron ${isExpanded ? 'rotate-up' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="condition-example-drawer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="example-box">
                        <div className="example-row">
                          <span className="example-tag tag-claim">Academic Claim</span>
                          <p className="example-text quote-claim">"{cond.example.claim}"</p>
                        </div>
                        <div className="example-row">
                          <span className="example-tag tag-passage">Cited Source Passage</span>
                          <p className="example-text quote-passage">"{cond.example.passage}"</p>
                        </div>
                        <div className="example-verdict-note" style={{ borderLeftColor: cond.accentColor }}>
                          <strong>AI Audit Verdict: </strong>
                          <span>{cond.example.takeaway}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
