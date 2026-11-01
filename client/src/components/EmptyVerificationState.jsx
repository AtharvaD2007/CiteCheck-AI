import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Search,
  Radio
} from 'lucide-react';

export function EmptyVerificationState() {
  const categories = [
    {
      title: 'Supported',
      icon: <CheckCircle2 size={18} />,
      color: '#065F46',
      bg: '#EAF7EE',
      border: '#BDE3C8',
      desc: 'The source passage directly and faithfully confirms the claim without overstatements.'
    },
    {
      title: 'Partially Supported',
      icon: <AlertTriangle size={18} />,
      color: '#92400E',
      bg: '#FDF6E3',
      border: '#F9E4A6',
      desc: 'Grounded in text but overgeneralizes, converts correlation to causation, or misses caveats.'
    },
    {
      title: 'Not Supported',
      icon: <XCircle size={18} />,
      color: '#9F1239',
      bg: '#FDECEE',
      border: '#F8BFC7',
      desc: 'The source passage explicitly contradicts, refutes, or inverts the stated claim.'
    },
    {
      title: 'Insufficient Evidence',
      icon: <HelpCircle size={18} />,
      color: '#334155',
      bg: '#EFEBF5',
      border: '#D5CDE2',
      desc: 'The excerpt does not contain enough substantive data or context to verify the claim.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.section
      className="empty-verification-wrapper"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="empty-verification-card">
        {/* Subtle Scanning Radar Icon & Ready to Verify Status */}
        <div className="empty-header-block">
          <div className="empty-status-tag">
            <span className="empty-status-radar-ping" />
            <Radio size={14} className="radar-icon-pulse" />
            <span>Ready to Verify • Awaiting Input</span>
          </div>

          <motion.div
            className="empty-icon-circle"
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <ShieldCheck size={28} strokeWidth={2.2} />
          </motion.div>

          <h3 className="empty-headline">Verification Engine Standby</h3>
          <p className="empty-subtext">
            Enter an academic claim, citation reference, and verbatim source passage above, then select <strong>Verify Citation</strong> to begin semantic comparative analysis.
          </p>
        </div>

        {/* 4 Classification Outlines */}
        <motion.div
          className="empty-categories-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {categories.map((c) => (
            <motion.div
              key={c.title}
              className="empty-category-pill"
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                background: c.bg,
                borderColor: c.border
              }}
            >
              <div className="empty-pill-header" style={{ color: c.color }}>
                {c.icon}
                <span className="empty-pill-title">{c.title}</span>
              </div>
              <p className="empty-pill-desc">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
