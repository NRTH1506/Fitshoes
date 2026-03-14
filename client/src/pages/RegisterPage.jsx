import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { registerUser } from '../services/api';

export default function RegisterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', address: '' });
  const [error, setError] = useState('');

  useEffect(() => { document.title = `${t('register.title')} — FitShoes`; }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    try {
      await registerUser(form);
      navigate('/verify-otp', { state: { email: form.email, from: 'register' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  }

  function set(field) { return (e) => setForm((p) => ({ ...p, [field]: e.target.value })); }

  return (
    <div className="auth-body">
      <div className="auth-wrapper">
        <div className="auth-container auth-register">
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
              <h2>{t('register.title')}</h2>
              <p className="auth-form-subtitle">{t('register.subtitle')}</p>

              {error && <div style={{ color: '#d32f2f', fontSize: '1.2rem', marginBottom: '1rem' }}>{error}</div>}

              <div className="form-row-two">
                <div className="form-group"><label><i className="fa fa-user"></i> {t('register.fullName')}</label><input className="auth-input" value={form.name} onChange={set('name')} required /></div>
                <div className="form-group"><label><i className="fa fa-envelope"></i> {t('register.email')}</label><input type="email" className="auth-input" value={form.email} onChange={set('email')} required /></div>
              </div>
              <div className="form-row-two">
                <div className="form-group"><label><i className="fa fa-phone"></i> {t('register.phone')}</label><input className="auth-input" value={form.phone} onChange={set('phone')} /></div>
                <div className="form-group"><label><i className="fa fa-map-marker"></i> {t('register.address')}</label><input className="auth-input" value={form.address} onChange={set('address')} /></div>
              </div>
              <div className="form-row-two">
                <div className="form-group"><label><i className="fa fa-lock"></i> {t('register.password')}</label><input type="password" className="auth-input" value={form.password} onChange={set('password')} required /></div>
                <div className="form-group"><label><i className="fa fa-lock"></i> {t('register.confirmPassword')}</label><input type="password" className="auth-input" value={form.confirmPassword} onChange={set('confirmPassword')} required /></div>
              </div>
              <button type="submit" className="btn-auth-submit">{t('register.submit')} <i className="fa fa-arrow-right"></i></button>

              <div className="auth-footer">
                <p>{t('register.hasAccount')} <Link to="/login" className="auth-link">{t('register.login')}</Link></p>
                <Link to="/" className="auth-back-link"><i className="fa fa-arrow-left"></i> {t('register.backHome')}</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
