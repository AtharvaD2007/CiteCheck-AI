import React, { useState } from 'react';
import { X, FileEdit, Upload, Check, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

export function CustomReportModal({ isOpen, onClose, onSaveCustomReport }) {
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'import'
  const [markdownInput, setMarkdownInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [customData, setCustomData] = useState({
    title: '',
    claim: '',
    citation: '',
    sourcePassage: '',
    result: 'Supported',
    confidenceScore: 95,
    verdictSummary: '',
    quote: '',
    quoteRelevance: '',
    quoteAlignment: 'supports',
    detailedExplanation: '',
    discrepancy: '',
    suggestedRevision: '',
    suggestions: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setCustomData({ ...customData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!customData.claim.trim()) {
      setErrorMsg('Academic claim is required.');
      return;
    }
    if (!customData.sourcePassage.trim()) {
      setErrorMsg('Source passage is required.');
      return;
    }
    if (!customData.verdictSummary.trim()) {
      setErrorMsg('Please provide a 1-2 sentence executive verdict summary.');
      return;
    }

    const reportObj = {
      result: customData.result,
      confidenceScore: parseInt(customData.confidenceScore, 10) || 90,
      confidenceLevel: customData.confidenceScore >= 85 ? 'High' : customData.confidenceScore >= 70 ? 'Moderate' : 'Low',
      verdictSummary: customData.verdictSummary.trim(),
      evidenceQuotes: customData.quote.trim() ? [
        {
          quote: customData.quote.trim(),
          relevance: customData.quoteRelevance.trim() || 'Key evidence supporting/refuting claim',
          alignment: customData.quoteAlignment
        }
      ] : [],
      detailedExplanation: customData.detailedExplanation.trim() || 'Author-provided analytical review of the claim against the source literature.',
      discrepancies: customData.discrepancy.trim() ? [customData.discrepancy.trim()] : ['None noted in author assessment.'],
      suggestedRevision: customData.suggestedRevision.trim() || customData.claim.trim(),
      suggestions: customData.suggestions.trim() ? customData.suggestions.split('\n').filter(Boolean) : [
        'Confirm findings against full manuscript methodology.',
        'Review citation formatting according to target journal guidelines.'
      ],
      academicChecklist: {
        causalityAccurate: customData.result === 'Supported',
        scopeAccurate: customData.result === 'Supported',
        magnitudeAccurate: customData.result === 'Supported',
        caveatsPreserved: customData.result === 'Supported'
      },
      verifiedAt: new Date().toISOString(),
      modelUsed: 'Self-Authored Verification'
    };

    const inputObj = {
      claim: customData.claim.trim(),
      citation: customData.citation.trim(),
      sourcePassage: customData.sourcePassage.trim(),
    };

    onSaveCustomReport({
      isCustom: true,
      title: customData.title.trim() || customData.claim.slice(0, 60) + '...',
      input: inputObj,
      report: reportObj,
    });

    onClose();
  };

  // Parse Markdown input
  const handleImportMarkdown = () => {
    if (!markdownInput.trim()) {
      setErrorMsg('Please paste Markdown content to import.');
      return;
    }

    try {
      const text = markdownInput;
      // Extract Status
      let result = 'Supported';
      if (/Status:\*\*\s*\*{0,2}(Partially Supported)/i.test(text)) result = 'Partially Supported';
      else if (/Status:\*\*\s*\*{0,2}(Not Supported)/i.test(text)) result = 'Not Supported';
      else if (/Status:\*\*\s*\*{0,2}(Insufficient Evidence)/i.test(text)) result = 'Insufficient Evidence';
      else if (/Status:\*\*\s*\*{0,2}(Supported)/i.test(text)) result = 'Supported';

      // Extract Claim
      const claimMatch = text.match(/## 2\. Claim Under Review\s*> "([^"]+)"/i) || text.match(/Claim[^\n]*\n> "([^"]+)"/i);
      const claim = claimMatch ? claimMatch[1] : 'Imported Academic Claim';

      // Extract Citation
      const citationMatch = text.match(/\*\*Cited Reference:\*\*\s*\n([^\n]+)/i);
      const citation = citationMatch ? citationMatch[1].replace(/\*No citation.*?\*/, '').trim() : '';

      // Extract Source Passage
      const passageMatch = text.match(/## 3\. Original Source Passage\s*```text([\s\S]*?)```/i) || text.match(/```text([\s\S]*?)```/i);
      const sourcePassage = passageMatch ? passageMatch[1].trim() : 'Source passage from imported report.';

      // Extract Summary
      const summaryMatch = text.match(/- \*\*Summary:\*\*\s*([^\n]+)/i);
      const verdictSummary = summaryMatch ? summaryMatch[1].trim() : `Imported assessment verdict: ${result}`;

      // Extract Quotes
      const quoteMatch = text.match(/### Evidence #\d+[^>]*\n> "([^"]+)"/i);
      const evidenceQuotes = quoteMatch ? [{
        quote: quoteMatch[1],
        relevance: 'Extracted from imported report',
        alignment: result === 'Not Supported' ? 'contradicts' : 'supports'
      }] : [];

      // Extract Explanation
      const explMatch = text.match(/## 5\. Detailed Comparative Analysis\s*([\s\S]*?)(?=## 6|\n---)/i);
      const detailedExplanation = explMatch ? explMatch[1].trim() : 'Imported comparative analysis.';

      // Extract Revision
      const revMatch = text.match(/## 7\. Recommended Academic Revision[\s\S]*?> "([^"]+)"/i);
      const suggestedRevision = revMatch ? revMatch[1].trim() : claim;

      const reportObj = {
        result,
        confidenceScore: 92,
        confidenceLevel: 'High',
        verdictSummary,
        evidenceQuotes,
        detailedExplanation,
        discrepancies: ['Imported from markdown record.'],
        suggestedRevision,
        suggestions: ['Review imported citations against primary text.'],
        academicChecklist: {
          causalityAccurate: true,
          scopeAccurate: true,
          magnitudeAccurate: true,
          caveatsPreserved: true
        },
        verifiedAt: new Date().toISOString(),
        modelUsed: 'Imported Markdown Report'
      };

      onSaveCustomReport({
        isCustom: true,
        title: `Imported Report (${result})`,
        input: { claim, citation, sourcePassage },
        report: reportObj,
      });

      onClose();
    } catch (err) {
      setErrorMsg('Failed to parse Markdown report. Please check format or use the form builder.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <FileEdit size={18} style={{ color: 'var(--teal-border)' }} />
            <span>Author & Import Custom Reports</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '1.25rem',
            }}
          >
            <button
              type="button"
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'form' ? '2px solid var(--teal-primary)' : '2px solid transparent',
                color: activeTab === 'form' ? 'var(--midnight-navy)' : 'var(--text-muted)',
                fontWeight: activeTab === 'form' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
              onClick={() => { setActiveTab('form'); setErrorMsg(''); }}
            >
              Custom Report Builder
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'import' ? '2px solid var(--teal-primary)' : '2px solid transparent',
                color: activeTab === 'import' ? 'var(--midnight-navy)' : 'var(--text-muted)',
                fontWeight: activeTab === 'import' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
              onClick={() => { setActiveTab('import'); setErrorMsg(''); }}
            >
              Import Existing Markdown
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                background: 'var(--status-unsupported-bg)',
                border: '1px solid var(--status-unsupported-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--status-unsupported-text)',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'form' ? (
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="field-label" htmlFor="title">
                  <span>Report Title / Subject</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="input-text"
                  placeholder="e.g. My Peer Review on Attention Mechanisms"
                  value={customData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="result">
                  <span>Your Verification Verdict</span>
                  <span className="required">*</span>
                </label>
                <select
                  id="result"
                  name="result"
                  className="input-text"
                  value={customData.result}
                  onChange={handleChange}
                >
                  <option value="Supported">Supported (Directly corroborated)</option>
                  <option value="Partially Supported">Partially Supported (Overstated/Conditional)</option>
                  <option value="Not Supported">Not Supported (Contradicts original text)</option>
                  <option value="Insufficient Evidence">Insufficient Evidence (Unclear/Lacking data)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="claim">
                  <span>Academic Claim Under Review</span>
                  <span className="required">*</span>
                </label>
                <textarea
                  id="claim"
                  name="claim"
                  rows={2}
                  className="input-textarea"
                  placeholder="The claim made by the student or manuscript author..."
                  value={customData.claim}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="citation">
                  <span>Cited Reference Details</span>
                </label>
                <input
                  type="text"
                  id="citation"
                  name="citation"
                  className="input-text"
                  placeholder="Authors, Year, Title, DOI..."
                  value={customData.citation}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="sourcePassage">
                  <span>Original Source Passage</span>
                  <span className="required">*</span>
                </label>
                <textarea
                  id="sourcePassage"
                  name="sourcePassage"
                  rows={3}
                  className="input-textarea"
                  placeholder="The excerpt from the cited paper..."
                  value={customData.sourcePassage}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="verdictSummary">
                  <span>Executive Verdict Summary</span>
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="verdictSummary"
                  name="verdictSummary"
                  className="input-text"
                  placeholder="1-2 sentences summarizing why this claim is or isn't supported..."
                  value={customData.verdictSummary}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="quote">
                  <span>Verbatim Supporting/Contradictory Quote</span>
                </label>
                <input
                  type="text"
                  id="quote"
                  name="quote"
                  className="input-text"
                  placeholder="Exact quote from the source excerpt..."
                  value={customData.quote}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="detailedExplanation">
                  <span>Detailed Analytical Explanation</span>
                </label>
                <textarea
                  id="detailedExplanation"
                  name="detailedExplanation"
                  rows={3}
                  className="input-textarea"
                  placeholder="Detailed breakdown comparing nuances, sample scope, and methodology..."
                  value={customData.detailedExplanation}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="suggestedRevision">
                  <span>Recommended Academic Rephrasing</span>
                </label>
                <input
                  type="text"
                  id="suggestedRevision"
                  name="suggestedRevision"
                  className="input-text"
                  placeholder="An academically sound, faithful rephrasing of the claim..."
                  value={customData.suggestedRevision}
                  onChange={handleChange}
                />
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary">
                  Save & View Custom Report
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Paste the full Markdown report (generated from CiteCheck or exported earlier) to import it into your personal reports dashboard.
              </p>

              <textarea
                rows={12}
                className="input-textarea"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                placeholder="# Academic Citation Verification Report&#10;**Tool:** CiteCheck AI&#10;## 1. Executive Verdict&#10;- **Status:** **Supported**&#10;..."
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
              />

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImportMarkdown}
                >
                  <Upload size={16} />
                  <span>Parse & Import Report</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
