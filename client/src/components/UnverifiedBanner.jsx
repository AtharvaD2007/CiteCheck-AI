import React, { useState } from 'react';
import { Mail, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '../utils/api';

export function UnverifiedBanner({ user, onResendVerification, onSimulatedVerify }) {
  const [resending, setResending] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);
  const [lastVerificationUrl, setLastVerificationUrl] = useState(null);

  if (!user || user.isVerified) {
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    setResentSuccess(false);
    try {
      const res = await fetch(apiUrl('/api/auth/resend-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('citecheck_token')}`
        },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification email.');
      }
      setResentSuccess(true);
      if (data.emailResult?.verificationUrl) {
        setLastVerificationUrl(data.emailResult.verificationUrl);
      }
      setTimeout(() => setResentSuccess(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="unverified-alert-banner anim-slide-down">
      <div className="unverified-banner-container">
        <div className="unverified-banner-left">
          <Mail size={18} className="unverified-banner-icon" />
          <div className="unverified-banner-text">
            <strong>Email Verification Required:</strong>
            <span>
              {' '}Please verify your academic email address (<strong>{user.email}</strong>) to run citation checks and save reports.
            </span>
          </div>
        </div>

        <div className="unverified-banner-right">
          {lastVerificationUrl && onSimulatedVerify && (
            <button
              type="button"
              className="btn-unverified-action dev-link"
              onClick={() => onSimulatedVerify(lastVerificationUrl)}
              title="Quickly activate account in development mode"
            >
              Verify Now (Dev Mode)
            </button>
          )}

          <button
            type="button"
            className="btn-unverified-action"
            onClick={handleResend}
            disabled={resending || resentSuccess}
          >
            {resending ? (
              <>
                <RefreshCw size={13} className="anim-spin" />
                <span>Sending Link...</span>
              </>
            ) : resentSuccess ? (
              <>
                <CheckCircle2 size={13} style={{ color: '#10B981' }} />
                <span>Verification Sent!</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
