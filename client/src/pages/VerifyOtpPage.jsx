import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { verifyOtp, resendOtp } from '../services/api';

export default function VerifyOtpPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const redirectTo = location.state?.redirect || '/';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [resending, setResending] = useState(false);

  useEffect(() => { document.title = `${t('otp.title')} — FitShoes`; }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await verifyOtp(email, otp);
      if (res.data?.user && res.data?.token) { login(res.data.user, res.data.token); navigate(redirectTo); }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendOtp(email);
      setCountdown(300);
    } catch { setError('Resend failed'); }
    finally { setResending(false); }
  }

  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="otp-body">
      <div className="otp-wrapper">
        <div className="otp-container">
          <div className="otp-security">
            <div className="security-icon">🔒</div>
            <h2>{t('otp.securityTitle')}</h2>
            <p>{t('otp.securityDesc')}</p>
            <div className="security-features">
              <div className="security-item"><i className="fa fa-envelope"></i> {t('otp.securityFeature1')}</div>
              <div className="security-item"><i className="fa fa-clock"></i> {t('otp.securityFeature2')}</div>
              <div className="security-item"><i className="fa fa-key"></i> {t('otp.securityFeature3')}</div>
            </div>
          </div>

          <div className="otp-form-container">
            <form className="otp-form" onSubmit={handleSubmit}>
              <div className="otp-header">
                <div className="otp-step"><span className="step-number">2</span> {t('otp.step')}</div>
                <h1>{t('otp.title')}</h1>
                <p className="otp-subtitle">{t('otp.subtitle')}: <strong>{email}</strong></p>
              </div>

              {error && <div style={{ color: '#d32f2f', fontSize: '1.2rem', marginBottom: '1rem' }}>{error}</div>}

              <div className="otp-input-group">
                <label><i className="fa fa-key"></i> {t('otp.label')}</label>
                <input type="text" className="otp-input" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder={t('otp.placeholder')} required />
                <p className="otp-input-hint">{t('otp.hint')}</p>
              </div>

              <button type="submit" className="btn-otp-submit" disabled={otp.length !== 6}>
                {t('otp.submit')} <i className="fa fa-check-circle"></i>
              </button>

              {countdown > 0 ? (
                <div className="otp-timer"><i className="fa fa-clock"></i> {t('otp.timer', { time: `${mins}:${secs}` })}</div>
              ) : (
                <div className="otp-timer" style={{ color: '#d32f2f' }}>{t('otp.expired')}</div>
              )}

              <div className="otp-resend">
                <p>{t('otp.resendTitle')}</p>
                <button type="button" className="btn-resend" onClick={handleResend} disabled={resending || countdown > 240}>
                  <i className="fa fa-refresh"></i> {t('otp.resend')}
                </button>
                <p className="resend-note">{t('otp.resendNote')}</p>
              </div>

              <div className="otp-footer">
                <Link to="/login" className="otp-back-link"><i className="fa fa-arrow-left"></i> {t('otp.backLogin')}</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
