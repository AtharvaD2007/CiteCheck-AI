import React from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ArrowRight } from 'lucide-react';

export function SamplePickerModal({ isOpen, onClose, samples, onSelectSample, selectedSampleId }) {
  if (!isOpen) return null;

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'Supported':
        return {
          icon: <CheckCircle2 size={13} />,
          className: 'badge-status supported',
        };
      case 'Partially Supported':
        return {
          icon: <AlertTriangle size={13} />,
          className: 'badge-status partially-supported',
        };
      case 'Not Supported':
        return {
          icon: <XCircle size={13} />,
          className: 'badge-status not-supported',
        };
      case 'Insufficient Evidence':
      default:
        return {
          icon: <HelpCircle size={13} />,
          className: 'badge-status insufficient-evidence',
        };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} style={{ color: 'var(--teal-border)' }} />
            <span>Curated Academic Test Scenarios</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Choose an academic test case to immediately populate the form and evaluate that verification outcome against primary literature:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {samples.map((sample) => {
              const badge = getOutcomeBadge(sample.outcome);
              const isSelected = selectedSampleId === sample.id;

              return (
                <div
                  key={sample.id}
                  className={`sample-selection-card ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectSample(sample);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {sample.domain}
                    </span>
                    <span className={badge.className} style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem' }}>
                      {badge.icon}
                      <span>{sample.outcome}</span>
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--midnight-navy)', lineHeight: 1.45, marginBottom: '0.35rem' }}>
                    "{sample.claim}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.45rem', marginTop: '0.2rem' }}>
                    <span>{sample.citation.slice(0, 65)}...</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--teal-primary)', fontWeight: 600 }}>
                      Load Scenario <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
