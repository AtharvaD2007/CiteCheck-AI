import React, { useState } from 'react';
import { X, Key, ExternalLink, RefreshCw, CheckCircle2, Copy, Check } from 'lucide-react';

export function ApiKeyModal({ isOpen, onClose, onRefreshHealth, isConnected }) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const envSnippet = `PORT=5001\nGEMINI_API_KEY=your_actual_gemini_api_key_here\nGEMINI_MODEL=gemini-2.5-flash`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleTestConnection = async () => {
    setRefreshing(true);
    await onRefreshHealth();
    setRefreshing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Key size={18} style={{ color: 'var(--lavender-400)' }} />
            <span>Gemini API Key Configuration</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {isConnected ? (
            <div
              style={{
                background: 'var(--status-supported-bg)',
                border: '1px solid var(--status-supported-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'var(--status-supported-text)',
              }}
            >
              <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>Gemini API Connected & Ready!</strong>
                <p style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                  CiteCheck AI backend is successfully initialized with a valid API key.
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--status-unsupported-bg)',
                border: '1px solid var(--status-unsupported-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                color: 'var(--status-unsupported-text)',
                fontSize: '0.88rem',
              }}
            >
              <strong>API Key Not Detected</strong>
              <p style={{ marginTop: '0.25rem' }}>
                CiteCheck AI requires a Google Gemini API key configured in the backend environment to perform live citation checks.
              </p>
            </div>
          )}

          <h4 style={{ fontSize: '0.95rem', color: 'var(--slate-900)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Setup Instructions (2 Quick Steps):
          </h4>

          <ol style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
            <li>
              <strong>Get your free Gemini API key:</strong>
              <div style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', gap: '0.4rem', color: 'var(--lavender-primary)' }}
                >
                  <span>Open Google AI Studio</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </li>
            <li>
              <strong>Add your key to the backend <code>server/.env</code> file:</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                Open <code>server/.env</code> in your editor and paste:
              </p>
              <pre
                style={{
                  background: 'var(--slate-900)',
                  color: '#C4B5FD',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  margin: '0.5rem 0',
                  overflowX: 'auto'
                }}
              >
                {envSnippet}
              </pre>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                {copiedSnippet ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedSnippet ? 'Copied snippet!' : 'Copy .env template'}</span>
              </button>
            </li>
          </ol>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? 'anim-spin' : ''} style={{ margin: 0 }} />
              <span>{refreshing ? 'Testing connection...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
