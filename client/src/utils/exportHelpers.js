/**
 * Formats a verification report into clean GitHub-Flavored Academic Markdown
 */
export function formatReportMarkdown(report, input) {
  const verifiedDate = report.verifiedAt
    ? new Date(report.verifiedAt).toLocaleString()
    : new Date().toLocaleString();

  let md = `# Academic Citation Verification Report
**Tool:** CiteCheck AI  
**Generated:** ${verifiedDate}  
**Model:** ${report.modelUsed || "Gemini"}  

---

## 1. Executive Verdict
- **Status:** **${report.result}**
- **Confidence Rating:** ${report.confidenceScore}% (${report.confidenceLevel})
- **Summary:** ${report.verdictSummary}

---

## 2. Claim Under Review
> "${input.claim.trim()}"

**Cited Reference:**  
${input.citation && input.citation.trim() ? input.citation.trim() : "*No citation details provided*"}

---

## 3. Original Source Passage
\`\`\`text
${input.sourcePassage.trim()}
\`\`\`

---

## 4. Key Evidence Quotations
`;

  if (report.evidenceQuotes && report.evidenceQuotes.length > 0) {
    report.evidenceQuotes.forEach((eq, index) => {
      md += `### Evidence #${index + 1} [${eq.alignment ? eq.alignment.toUpperCase() : "EVIDENCE"}]
> "${eq.quote}"

*Relevance:* ${eq.relevance}

`;
    });
  } else {
    md += `*No direct verbatim quotations extracted from the source text.*\n\n`;
  }

  md += `---

## 5. Detailed Comparative Analysis
${report.detailedExplanation}

---

## 6. Identified Discrepancies & Caveats
`;

  if (report.discrepancies && report.discrepancies.length > 0) {
    report.discrepancies.forEach((d) => {
      md += `- ${d}\n`;
    });
  } else {
    md += `- None identified.\n`;
  }

  md += `\n---

## 7. Recommended Academic Revision
*CiteCheck AI suggests rephrasing the claim as follows to ensure complete fidelity to the original research:*

> "${report.suggestedRevision || input.claim}"

---

## 8. Integrity Recommendations
`;

  if (report.suggestions && report.suggestions.length > 0) {
    report.suggestions.forEach((s) => {
      md += `1. ${s}\n`;
    });
  }

  md += `\n---
*Disclaimer: CiteCheck AI provides assistive comparative text analysis. This automated assessment does not replace peer review or direct scholarly inspection of primary sources.*
`;

  return md;
}

/**
 * Downloads text as a file in browser
 */
export function downloadFile(content, filename, type = "text/markdown") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
