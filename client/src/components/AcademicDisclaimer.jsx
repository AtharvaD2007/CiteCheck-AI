import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function AcademicDisclaimer() {
  return (
    <aside className="academic-disclaimer" role="note" aria-label="Academic disclaimer">
      <ShieldAlert size={20} className="disclaimer-icon" />
      <div>
        <strong>Scholarly Integrity & AI Assessment Notice:</strong>
        <p style={{ marginTop: '0.2rem' }}>
          CiteCheck AI generates heuristic semantic comparisons between student claims and cited textual excerpts.
          Automated verdicts (Supported, Partially Supported, Not Supported, Insufficient Evidence) assist in spotting
          misquotes, overclaims, or misattributed findings, but <strong>do not replace manual scholar inspection</strong>,
          replication, or peer-reviewed primary literature reading. Always verify claims against complete source publications
          prior to thesis, dissertation, or manuscript submission.
        </p>
      </div>
    </aside>
  );
}
