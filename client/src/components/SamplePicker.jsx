import React from 'react';
import { Sparkles, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export function SamplePicker({ samples, selectedSampleId, onSelectSample }) {
  if (!samples || samples.length === 0) return null;

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'Supported':
        return {
          icon: <CheckCircle size={12} />,
          className: 'badge-status supported',
        };
      case 'Partially Supported':
        return {
          icon: <AlertTriangle size={12} />,
          className: 'badge-status partially-supported',
        };
      case 'Not Supported':
        return {
          icon: <XCircle size={12} />,
          className: 'badge-status not-supported',
        };
      case 'Insufficient Evidence':
      default:
        return {
          icon: <HelpCircle size={12} />,
          className: 'badge-status insufficient-evidence',
        };
    }
  };

  return (
    <div className="sample-bar">
      <div className="sample-bar-header">
        <div className="sample-bar-title">
          <Sparkles size={16} style={{ color: 'var(--teal-primary)' }} />
          <span>Curated Academic Test Scenarios</span>
        </div>
        <div className="sample-bar-hint">
          Click any scenario to auto-populate the form and test that verification outcome:
        </div>
      </div>

      <div className="sample-grid">
        {samples.map((sample) => {
          const badge = getOutcomeBadge(sample.outcome);
          const isSelected = selectedSampleId === sample.id;

          return (
            <button
              key={sample.id}
              type="button"
              className={`sample-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectSample(sample)}
            >
              <div className="sample-card-top">
                <span className="sample-domain">{sample.domain}</span>
                <span className={badge.className} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                  {badge.icon}
                  <span>{sample.outcome}</span>
                </span>
              </div>
              <div className="sample-card-text" title={sample.claim}>
                "{sample.claim}"
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
