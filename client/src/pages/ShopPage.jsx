import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { showToast } from '../utils/toast';

export default function ShopPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    document.title = `${t('shop.title')} — FitShoes`;
    fetchProducts()
      .then((res) => setProducts(res.data?.data || []))
      .catch(() => setError(t('shop.error')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products
    .filter((p) => filter === 'all' || p.gender === filter)
    .filter((p) => {
      const q = search.toLowerCase();
      return !q || (p.title_vi || '').toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q);
    });

  const filters = [
    { key: 'all', label: t('shop.all') },
    { key: 'male', label: t('shop.male') },
    { key: 'female', label: t('shop.female') },
    { key: 'unisex', label: t('shop.unisex') },
  ];

  return (
    <section style={{ padding: '3rem 5%' }}>
      <h2 style={{ fontSize: '2.8rem', color: 'var(--helping-color)', marginBottom: '2rem' }}>{t('shop.title')}</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '.7rem 1.8rem', borderRadius: '2rem', border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: '1.3rem',
              background: filter === f.key ? 'var(--main-color)' : '#fff',
              color: filter === f.key ? '#fff' : 'var(--main-color)',
              borderColor: 'var(--main-color)' }}>
            {f.label}
          </button>
        ))}
        <input type="text" placeholder={t('shop.search')} value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '.7rem 1.2rem', border: '2px solid #ddd', borderRadius: '2rem', fontSize: '1.3rem', flex: 1, minWidth: '200px' }} />
      </div>

      {/* Products */}
      {loading ? (
        <p style={{ textAlign: 'center', fontSize: '1.4rem', color: '#666' }}>{t('shop.loading')}</p>
      ) : error ? (
        <p style={{ textAlign: 'center', fontSize: '1.4rem', color: '#d32f2f' }}>{error}</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.4rem', color: '#666' }}>{t('shop.noProducts')}</p>
      ) : (
        <div className="d-grid grid-4-columns" style={{ gap: '0' }}>
          {filtered.map((p) => {
            const img = (Array.isArray(p.images) && p.images.length) ? p.images[0] : '';
            return (
              <div className="shoes-card d-flex flex-d-col align-center justify-center" key={p.id || p._id}>
                <Link to={`/product/${p.id || p._id}`}><img src={img} alt={p.title_vi} /></Link>
                <h3>{p.title_vi}</h3>
                <h4>{formatPrice(p.price, p.currency)} {p.oldPrice && <span>{formatPrice(p.oldPrice, p.currency)}</span>}</h4>
                <div className="product-actions">
                  <Link to={`/product/${p.id || p._id}`} style={{ color: '#667eea', fontSize: '1.2rem', fontWeight: 600 }}>{t('shop.viewDetail')}</Link>
                  <button onClick={() => { addToCart(p, 1, '40'); showToast(`✅ ${t('shop.addToCart')}`); }}
                    style={{ background: 'var(--main-color)', color: '#fff', padding: '.5rem 1rem', border: 'none', borderRadius: '.5rem', cursor: 'pointer', fontSize: '1.2rem' }}>
                    <i className="fa fa-cart-plus"></i> {t('shop.addToCart')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
