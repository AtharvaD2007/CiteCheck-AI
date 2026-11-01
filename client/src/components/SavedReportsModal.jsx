import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FolderArchive,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Sparkles
} from 'lucide-react';

export function SavedReportsModal({
  isOpen,
  onClose,
  reports = [],
  onSelectReport,
  onDeleteReport,
  onStartNewCheck
}) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Supported':
        return <CheckCircle2 size={16} style={{ color: 'var(--status-supported-accent)' }} />;
      case 'Partially Supported':
        return <AlertTriangle size={16} style={{ color: 'var(--status-partial-accent)' }} />;
      case 'Not Supported':
        return <XCircle size={16} style={{ color: 'var(--status-unsupported-accent)' }} />;
      case 'Insufficient Evidence':
      default:
        return <HelpCircle size={16} style={{ color: 'var(--status-insufficient-accent)' }} />;
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Supported': return 'badge-status supported';
      case 'Partially Supported': return 'badge-status partially-supported';
      case 'Not Supported': return 'badge-status not-supported';
      default: return 'badge-status insufficient-evidence';
    }
  };

  const filteredReports = reports.filter((r) => {
    const verdict = r.report?.result || '';
    if (filter !== 'ALL' && verdict !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const claim = r.input?.claim?.toLowerCase() || '';
      const title = r.title?.toLowerCase() || '';
      return claim.includes(q) || title.includes(q);
    }
    return true;
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this verification report?')) {
      setDeletingId(id);
      await onDeleteReport(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '750px' }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <FolderArchive size={20} style={{ color: 'var(--lavender-400)' }} />
            <span>My Verification Reports ({reports.length})</span>
          </div>
          <motion.button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="modal-body">
          {reports.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Search your reports by claim or keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--slate-400)',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              <select
                className="input-text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '170px' }}
              >
                <option value="ALL">All Outcomes</option>
                <option value="Supported">Supported</option>
                <option value="Partially Supported">Partially Supported</option>
                <option value="Not Supported">Not Supported</option>
                <option value="Insufficient Evidence">Insufficient Evidence</option>
              </select>
            </div>
          )}

          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--slate-500)' }}>
              <motion.div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--slate-50)',
                  color: 'var(--slate-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
                }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <FolderArchive size={32} />
              </motion.div>
              <h4 style={{ color: 'var(--slate-900)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.45rem', letterSpacing: '-0.02em' }}>
                No Reports Yet
              </h4>
              <p style={{ fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.55 }}>
                You have not run or saved any citation verifications yet. Enter a claim and source excerpt to generate your first live report.
              </p>
              {onStartNewCheck && (
                <motion.button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onStartNewCheck();
                  }}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Sparkles size={15} />
                  <span>Start New Citation Check</span>
                </motion.button>
              )}
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--slate-500)' }}>
              <p style={{ fontWeight: 600 }}>No reports matched your search.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); setFilter('ALL'); }}
                style={{ marginTop: '0.75rem' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '58vh', overflowY: 'auto', paddingRight: '0.25rem' }}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
              }}
            >
              <AnimatePresence>
                {filteredReports.map((r) => {
                  const date = new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <motion.div
                      key={r.id}
                      className="saved-report-item"
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      exit={{ opacity: 0, scale: 0.96, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -2 }}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                          {getStatusIcon(r.report?.result)}
                          <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.title || r.input?.claim}
                          </span>
                        </div>

                        <span
                          className={getBadgeClass(r.report?.result)}
                          style={{ fontSize: '0.72rem', padding: '0.15rem 0.6rem', flexShrink: 0 }}
                        >
                          {r.report?.result}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--slate-700)', fontStyle: 'italic', lineBreak: 'anywhere' }}>
                        "{r.input?.claim}"
                      </p>

                      {r.input?.citation && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                          <strong>Citation:</strong> {r.input.citation}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', paddingTop: '0.55rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--slate-400)' }}>
                          Verified: {date} • Model: {r.report?.modelUsed || 'Gemini'}
                        </span>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <motion.button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => { onSelectReport(r); onClose(); }}
                            title="Open report in main viewer"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <ExternalLink size={13} />
                            <span>View Report</span>
                          </motion.button>

                          <motion.button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => handleDelete(r.id, e)}
                            disabled={deletingId === r.id}
                            title="Delete saved report"
                            style={{ padding: '0.3rem 0.6rem', color: 'var(--status-unsupported-accent)' }}
                            aria-label="Delete report"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                          >
                            <Trash2 size={13} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
