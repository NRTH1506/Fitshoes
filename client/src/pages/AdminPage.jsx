import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchProducts, addProduct, deleteProduct } from '../services/api';
import { resolveImagePath } from '../utils/images';

export default function AdminPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', brand: '', description: '', images: '', gender: 'unisex' });
  const [msg, setMsg] = useState({ text: '', isError: false });

  useEffect(() => { document.title = `${t('admin.title')} — FitShoes`; loadProducts(); }, []);

  async function loadProducts() {
    try { const res = await fetchProducts(); setProducts(res.data?.data || []); } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg({ text: '', isError: false });
    try {
      await addProduct({
        title_vi: form.name, price: Number(form.price), brand: form.brand,
        description_vi: form.description, gender: form.gender, currency: 'VND',
        images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setMsg({ text: '✅ Added', isError: false });
      setForm({ name: '', price: '', brand: '', description: '', images: '', gender: 'unisex' });
      loadProducts();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error', isError: true });
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete?')) return;
    try { await deleteProduct(id); loadProducts(); } catch {}
  }

  const inputStyle = { width: '100%', padding: '.9rem 1rem', border: '1px solid #ddd', borderRadius: '.6rem', fontSize: '1.4rem' };

  return (
    <section style={{ padding: '3rem 5%', minHeight: '60vh' }}>
      <h2 style={{ fontSize: '2.8rem', color: 'var(--helping-color)', marginBottom: '2rem' }}>{t('admin.title')}</h2>

      <div className="admin-grid">
        {/* Add Form */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--main-color)' }}>{t('admin.addTitle')}</h3>
          {msg.text && <div style={{ padding: '.8rem', borderRadius: '.5rem', marginBottom: '1rem', background: msg.isError ? '#fef2f2' : '#f0fdf4', color: msg.isError ? '#dc2626' : '#16a34a', fontSize: '1.2rem' }}>{msg.text}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input placeholder={t('admin.name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
            <input placeholder={t('admin.price')} type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} style={inputStyle} />
            <input placeholder={t('admin.brand')} value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} style={inputStyle} />
            <textarea placeholder={t('admin.description')} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <input placeholder={t('admin.images')} value={form.images} onChange={(e) => setForm((p) => ({ ...p, images: e.target.value }))} style={inputStyle} />
            <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} style={inputStyle}>
              <option value="unisex">{t('common.unisex')}</option><option value="male">{t('common.male')}</option><option value="female">{t('common.female')}</option>
            </select>
            <button type="submit" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '1rem', borderRadius: '.8rem', fontSize: '1.4rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>{t('admin.submit')}</button>
          </form>
        </div>

        {/* Product List */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxHeight: '70vh', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--main-color)' }}>{t('admin.listTitle')} ({products.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {products.map((p) => {
              const img = (p.images && p.images.length) ? p.images[0] : '/assets/images/shoes-1.png';
              return (
                <div key={p._id || p.id} style={{ border: '1px solid #eee', padding: '.8rem', borderRadius: '.6rem', textAlign: 'center' }}>
                  <img src={resolveImagePath(img)} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '.4rem' }} alt="" />
                  <div style={{ fontWeight: 600, marginTop: '.5rem', fontSize: '1.3rem' }}>{p.title_vi || p.title}</div>
                  {p.brand && <div style={{ color: '#666', fontSize: '1.1rem' }}>{t('admin.brand')}: {p.brand}</div>}
                  <button onClick={() => handleDelete(p._id || p.id)} style={{ marginTop: '.5rem', background: '#b00', color: '#fff', border: 'none', padding: '.5rem 1rem', borderRadius: '.4rem', cursor: 'pointer', fontSize: '1.2rem' }}>{t('admin.delete')}</button>
                </div>
              );
            })}
            {products.length === 0 && <div style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center' }}>{t('admin.noProducts')}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
