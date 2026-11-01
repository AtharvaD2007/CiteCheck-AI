import React from 'react';
import { X, BookOpen, Scale, Cpu, ShieldCheck } from 'lucide-react';

export function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={18} style={{ color: 'var(--lavender-400)' }} />
            <span>About CiteCheck AI</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ lineHeight: 1.6 }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '1.2rem', color: 'var(--slate-900)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              Academic Citation & Evidence Verification System
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)' }}>
              CiteCheck AI is engineered for researchers, postgraduate scholars, and peer reviewers to critically audit assertions against verbatim excerpts from cited literature before paper submission or thesis defense.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--slate-50)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--lavender-primary)', fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.35rem' }}>
                <Scale size={16} />
                <span>Rigorous Taxonomy</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-600)', lineHeight: 1.45 }}>
                Categorizes into Supported, Partially Supported, Not Supported, and Insufficient Evidence with confidence scoring.
              </p>
            </div>

            <div style={{ background: 'var(--slate-50)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--lavender-primary)', fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.35rem' }}>
                <Cpu size={16} />
                <span>Google Gemini Engine</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-600)', lineHeight: 1.45 }}>
                Leverages advanced Gemini generative models configured for zero hallucination and strict passage grounding.
              </p>
            </div>
          </div>

          <div style={{ background: 'var(--lavender-subtle)', border: '1px solid var(--lavender-border)', borderRadius: 'var(--radius-md)', padding: '0.9rem 1.1rem', fontSize: '0.84rem', color: 'var(--slate-700)' }}>
            <strong style={{ color: 'var(--lavender-primary)' }}>Scholarly Integrity Notice:</strong> CiteCheck AI is an assistive comparative audit tool. It does not replace independent scholarly peer review or reading of complete peer-reviewed source literature.
          </div>
        </div>
      </div>
    </div>
  );
}
