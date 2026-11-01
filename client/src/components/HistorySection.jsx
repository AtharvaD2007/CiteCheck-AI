import React from 'react';
import { History, Clock, ArrowRight, Trash2, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export function HistorySection({ history, onSelectHistoryItem, onClearHistory }) {
  if (!history || history.length === 0) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Supported':
        return <CheckCircle2 size={14} style={{ color: 'var(--status-supported-accent)' }} />;
      case 'Partially Supported':
        return <AlertTriangle size={14} style={{ color: 'var(--status-partial-accent)' }} />;
      case 'Not Supported':
        return <XCircle size={14} style={{ color: 'var(--status-unsupported-accent)' }} />;
      case 'Insufficient Evidence':
      default:
        return <HelpCircle size={14} style={{ color: 'var(--status-insufficient-accent)' }} />;
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Supported':
        return 'badge-status supported';
      case 'Partially Supported':
        return 'badge-status partially-supported';
      case 'Not Supported':
        return 'badge-status not-supported';
      case 'Insufficient Evidence':
      default:
        return 'badge-status insufficient-evidence';
    }
  };

  return (
    <div className="history-section">
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} style={{ color: 'var(--teal-primary)' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--midnight-navy)' }}>
            Recent Verifications ({history.length})
          </h3>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClearHistory}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          title="Clear history"
        >
          <Trash2 size={13} />
          <span>Clear History</span>
        </button>
      </div>

      <div className="history-list">
        {history.map((item, idx) => {
          const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div
              key={idx}
              className="history-item"
              onClick={() => onSelectHistoryItem(item)}
              title="Click to view full verification report"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, overflow: 'hidden' }}>
                {getStatusIcon(item.report.result)}
                <span className="history-item-claim">
                  "{item.input.claim}"
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} />
                  {time}
                </span>
                <span
                  className={getBadgeClass(item.report.result)}
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.5rem',
                  }}
                >
                  {item.report.result}
                </span>
                <ArrowRight size={14} style={{ color: 'var(--text-light)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
