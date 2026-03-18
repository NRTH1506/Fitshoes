import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { updateProfile, fetchUserOrders, uploadAvatar } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', bio: '' });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { document.title = `${t('profile.title')} — FitShoes`; }, []);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', bio: user.bio || '' });
      loadOrders();
    }
  }, [user]);

  async function loadOrders() {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const res = await fetchUserOrders(user._id || user.id);
      if (res.data?.success) setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  }

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
      setMsg({ text: '✅ ' + t('common.success'), isError: false });
      setEditing(false);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error', isError: true });
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', user._id || user.id);

    try {
      const res = await uploadAvatar(formData);
      if (res.success && res.user) {
        login(res.user);
        setMsg({ text: '✅ ' + t('profile.avatarUpdated'), isError: false });
      }
    } catch (err) {
      setMsg({ text: 'Error uploading image', isError: true });
    } finally {
      setUploading(false);
    }
  }

  function set(field) { return (e) => setForm((p) => ({ ...p, [field]: e.target.value })); }

  function getStatusColor(status) {
    if (status === 'SUCCESS') return '#4caf50';
    if (status === 'FAILED') return '#f44336';
    return '#ff9800';
  }

  return (
    <section style={{ padding: '2rem 5%' }}>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar" style={{ position: 'relative', overflow: 'hidden' }}>
              {user.avatar ? (
                <img 
                  src={user.avatar.startsWith('http') ? user.avatar : (import.meta.env.VITE_API_URL || '') + user.avatar} 
                  alt="avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : '👤'}
              <label style={{ 
                position: 'absolute', bottom: 0, left: 0, right: 0, 
                background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '.9rem', 
                padding: '.2rem', cursor: 'pointer', textAlign: 'center' 
              }}>
                {uploading ? '...' : t('profile.upload')}
                <input type="file" hidden onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
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
            </div>

            {/* Order History Section */}
            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--helping-color)' }}>{t('profile.orders')}</h2>
              {loadingOrders ? (
                <p>{t('common.loading')}</p>
              ) : orders.length === 0 ? (
                <p style={{ color: '#999' }}>{t('profile.noOrders')}</p>
              ) : (
                <div className="order-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orders.map(order => (
                    <div key={order._id} className="order-item-container" style={{ display: 'flex', flexDirection: 'column', border: '1px solid #eee', borderRadius: '1rem', overflow: 'hidden', background: '#fff' }}>
                      <div className="order-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                        <div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--primary-color)' }}>{t('profile.orderId')}: #{order.app_trans_id}</div>
                          <div style={{ fontSize: '1.2rem', color: '#888' }}>{new Date(order.createdAt).toLocaleString()}</div>
                          <div style={{ marginTop: '.5rem', fontSize: '1.3rem' }}>
                            <strong>{order.items?.length || 0}</strong> {t('nav.cart')} • <strong style={{ color: '#333' }}>{formatPrice(order.amount, 'VND')}</strong>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.5rem' }}>
                          <div style={{ 
                            display: 'inline-block', 
                            padding: '.3rem .8rem', 
                            borderRadius: '1rem', 
                            fontSize: '1.1rem', 
                            fontWeight: 700, 
                            background: getStatusColor(order.status) + '15', 
                            color: getStatusColor(order.status),
                            border: `1px solid ${getStatusColor(order.status)}33`
                          }}>
                            {order.status}
                          </div>
                          <div style={{ fontSize: '1.1rem', color: '#666', fontWeight: 500 }}>
                            {expandedOrder === order._id ? `▲ ${t('profile.hideDetails')}` : `▼ ${t('profile.viewDetails')}`}
                          </div>
                        </div>
                      </div>
                      
                      {expandedOrder === order._id && (
                        <div className="order-details" style={{ padding: '1.5rem', background: '#f9f9f9', borderTop: '1px solid #eee' }}>
                          <h4 style={{ fontSize: '1.4rem', marginBottom: '1.2rem', color: '#444', borderBottom: '2px solid #eee', paddingBottom: '.5rem' }}>{t('profile.itemsBought')}</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', background: '#fff', padding: '1rem', borderRadius: '.8rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '.5rem', overflow: 'hidden', flexShrink: 0, background: '#eee' }}>
                                  {(item.images && item.images[0]) ? (
                                    <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>👟</div>
                                  )}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#333' }}>{item.title}</div>
                                  <div style={{ fontSize: '1.1rem', color: '#666' }}>
                                    {t('cart.size')}: <strong>{item.size || 'N/A'}</strong> • {t('product.quantity')}: <strong>{item.qty}</strong>
                                  </div>
                                </div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                  {formatPrice(item.price * item.qty, item.currency || 'VND')}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #ccc', textAlign: 'right', fontSize: '1.4rem' }}>
                            <span style={{ color: '#666' }}>{t('cart.total')}: </span>
                            <strong style={{ color: 'var(--primary-color)', fontSize: '1.6rem' }}>{formatPrice(order.amount, 'VND')}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
