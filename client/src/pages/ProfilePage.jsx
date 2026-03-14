import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { updateProfile } from '../services/api';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', bio: '' });
  const [msg, setMsg] = useState({ text: '', isError: false });

  useEffect(() => { document.title = `${t('profile.title')} — FitShoes`; }, []);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', bio: user.bio || '' });
  }, [user]);

  if (!user) return (
    <section style={{ padding: '4rem 5%', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ fontSize: '1.6rem', color: '#666', marginBottom: '1rem' }}>{t('profile.notLoggedIn')}</p>
      <Link to="/login" className="primary-btn" style={{ padding: '1rem 2rem', borderRadius: '.8rem' }}>{t('profile.goLogin')}</Link>
    </section>
  );

  async function handleSave(e) {
    e.preventDefault();
    setMsg({ text: '', isError: false });
    try {
      const res = await updateProfile({ userId: user._id || user.id, ...form });
      if (res.data?.user) login(res.data.user);
      setMsg({ text: '✅ Updated', isError: false });
      setEditing(false);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error', isError: true });
    }
  }

  function set(field) { return (e) => setForm((p) => ({ ...p, [field]: e.target.value })); }

  return (
    <section style={{ padding: '2rem 5%' }}>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">👤</div>
            <div className="profile-title">
              <h1>{user.name || 'User'}</h1>
              <p className="profile-subtitle">{t('profile.subtitle')}</p>
            </div>
          </div>
          {!editing && <button className="btn-edit" onClick={() => setEditing(true)}><i className="fa fa-edit"></i> {t('profile.edit')}</button>}
        </div>

        {!editing ? (
          <div className="profile-view">
            <div className="profile-info-grid">
              <div className="info-card"><div className="info-icon"><i className="fa fa-user"></i></div><div className="info-content"><label>{t('profile.fullName')}</label><p>{user.name || t('profile.notSet')}</p></div></div>
              <div className="info-card"><div className="info-icon"><i className="fa fa-envelope"></i></div><div className="info-content"><label>{t('profile.email')}</label><p>{user.email}</p></div></div>
              <div className="info-card"><div className="info-icon"><i className="fa fa-phone"></i></div><div className="info-content"><label>{t('profile.phone')}</label><p>{user.phone || t('profile.notSet')}</p></div></div>
              <div className="info-card"><div className="info-icon"><i className="fa fa-map-marker"></i></div><div className="info-content"><label>{t('profile.address')}</label><p>{user.address || t('profile.notSet')}</p></div></div>
              <div className="info-card info-card-full"><div className="info-icon"><i className="fa fa-info-circle"></i></div><div className="info-content"><label>{t('profile.bio')}</label><p>{user.bio || t('profile.notSet')}</p></div></div>
            </div>
          </div>
        ) : (
          <div className="profile-edit">
            {msg.text && <div className={`profile-message ${msg.isError ? 'error' : 'success'}`}>{msg.text}</div>}
            <form className="edit-form" onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group"><label><i className="fa fa-user"></i> {t('profile.fullName')}</label><input className="form-input" value={form.name} onChange={set('name')} /></div>
                <div className="form-group"><label><i className="fa fa-envelope"></i> {t('profile.email')}</label><input className="form-input disabled-input" value={user.email} disabled /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label><i className="fa fa-phone"></i> {t('profile.phone')}</label><input className="form-input" value={form.phone} onChange={set('phone')} /></div>
                <div className="form-group"><label><i className="fa fa-map-marker"></i> {t('profile.address')}</label><input className="form-input" value={form.address} onChange={set('address')} /></div>
              </div>
              <div className="form-group"><label><i className="fa fa-info-circle"></i> {t('profile.bio')}</label><textarea className="form-input textarea-input" value={form.bio} onChange={set('bio')} /></div>
              <div className="form-actions">
                <button type="submit" className="btn-save"><i className="fa fa-check"></i> {t('profile.save')}</button>
                <button type="button" className="btn-cancel" onClick={() => setEditing(false)}><i className="fa fa-times"></i> {t('profile.cancel')}</button>
              </div>
            </form>
          </div>
        )}

        <div className="profile-footer">
          <button className="btn-logout" onClick={() => { logout(); navigate('/'); }}><i className="fa fa-sign-out"></i> {t('profile.logout')}</button>
        </div>
      </div>
    </section>
  );
}
