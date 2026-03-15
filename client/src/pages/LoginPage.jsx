import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { loginUser, loginGoogle } from '../services/api';

export default function LoginPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = `${t('login.title')} — FitShoes`; }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await loginUser(email, password);
      if (res.data?.needOtp) {
        navigate('/verify-otp', { state: { email, from: 'login' } });
      } else if (res.data?.user) {
        login(res.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google && clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const res = await loginGoogle(response.credential);
            if (res.data?.needOtp) {
              navigate('/verify-otp', { state: { email: res.data.email, from: 'login' } });
            } else if (res.data?.user) {
              login(res.data.user);
              navigate('/');
            }
          } catch { setError('Google login failed'); }
        },
      });
      const container = document.getElementById('google-signin-btn');
      if (container) window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 320 });
    }
  }, []);

  return (
    <div className="auth-body">
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-brand">
            <div className="brand-logo">👟</div>
            <h1>{t('login.brandTitle')}</h1>
            <p>{t('login.brandSubtitle')}</p>
            <div className="brand-features">
              <div className="feature-item"><i className="fa fa-truck"></i> {t('login.feature1')}</div>
              <div className="feature-item"><i className="fa fa-refresh"></i> {t('login.feature2')}</div>
              <div className="feature-item"><i className="fa fa-shield"></i> {t('login.feature3')}</div>
            </div>
          </div>

          <div className="auth-form-container">
            <form className="auth-form" onSubmit={handleSubmit}>
              <h2>{t('login.title')}</h2>
              <p className="auth-form-subtitle">{t('login.subtitle')}</p>

              {error && <div style={{ color: '#d32f2f', fontSize: '1.2rem', marginBottom: '1rem' }}>{error}</div>}

              <div className="form-group">
                <label><i className="fa fa-envelope"></i> {t('login.email')}</label>
                <input type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label><i className="fa fa-lock"></i> {t('login.password')}</label>
                <div className="password-wrapper">
                  <input type={showPw ? 'text' : 'password'} className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="toggle-password" onClick={() => setShowPw(!showPw)} title={showPw ? t('login.hidePassword') : t('login.showPassword')}>
                    <i className={`fa ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-auth-submit">{t('login.submit')} <i className="fa fa-arrow-right"></i></button>

              <div className="auth-divider">{t('login.or')}</div>
              <div className="google-signin-wrapper">
                <div id="google-signin-btn"></div>
                <p className="google-note">{t('login.googleNote')}</p>
              </div>

              <div className="auth-footer">
                <p>{t('login.noAccount')} <Link to="/register" className="auth-link">{t('login.register')}</Link></p>
                <Link to="/" className="auth-back-link"><i className="fa fa-arrow-left"></i> {t('login.backHome')}</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
