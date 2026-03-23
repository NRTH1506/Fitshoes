import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { resolveImagePath } from '../utils/images';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { showToast } from '../utils/toast';

const CATEGORIES = [
  { key: 'running', label: 'Running' },
  { key: 'gym', label: 'Training & Gym' },
  { key: 'casual', label: 'Casual' },
  { key: 'sandals', label: 'Sandals' },
  { key: 'boots', label: 'Boots' },
];

const GENDERS = [
  { key: 'male', label: "Men's" },
  { key: 'female', label: "Women's" },
  { key: 'unisex', label: 'Unisex' },
];

const SIZES = [36, 37, 38, 39, 40, 41, 42, 43];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A-Z' },
];

export default function ShopPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters from URL
  const [genderFilter, setGenderFilter] = useState(searchParams.get('gender') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [saleFilter, setSaleFilter] = useState(searchParams.get('sale') === '1');
  const [sizeFilter, setSizeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Collapsible sections
  const [openSections, setOpenSections] = useState({ category: true, gender: true, size: false, sale: false });

  useEffect(() => {
    document.title = `${t('shop.title')} — FitShoes`;
    fetchProducts()
      .then((res) => setProducts(res.data?.data || []))
      .catch(() => setError(t('shop.error')))
      .finally(() => setLoading(false));
  }, []);

  // Sync URL params on mount
  useEffect(() => {
    setGenderFilter(searchParams.get('gender') || '');
    setCategoryFilter(searchParams.get('category') || '');
    setSaleFilter(searchParams.get('sale') === '1');
  }, [searchParams]);

  function toggleSection(key) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Filter + sort
  const filtered = products
    .filter(p => !genderFilter || p.gender === genderFilter)
    .filter(p => !categoryFilter || p.category === categoryFilter)
    .filter(p => !saleFilter || (p.salePrice && p.salePrice > 0))
    .filter(p => !sizeFilter || (p.inventory || []).some(inv => inv.size === Number(sizeFilter) && inv.quantity > 0))
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (p.title_vi || '').toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'name') return (a.title_vi || '').localeCompare(b.title_vi || '');
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

  function clearFilters() {
    setGenderFilter(''); setCategoryFilter(''); setSaleFilter(false); setSizeFilter(''); setSearch('');
    setSearchParams({});
  }

  const hasFilters = genderFilter || categoryFilter || saleFilter || sizeFilter || search;

  // Build title
  let pageTitle = t('shop.title');
  if (genderFilter === 'male') pageTitle = "Men's Shoes";
  else if (genderFilter === 'female') pageTitle = "Women's Shoes";
  if (categoryFilter) pageTitle += ` · ${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}`;

  return (
    <section style={{ padding: '2rem 4%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2.4rem', color: 'var(--helping-color)' }}>{pageTitle} <span style={{ fontSize: '1.4rem', color: '#999', fontWeight: 400 }}>({filtered.length})</span></h2>
        <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center' }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '.5rem 1rem', border: '1px solid #ddd', borderRadius: '.4rem', fontSize: '1.2rem' }}>
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="shop-layout">
        {/* ─── SIDEBAR ─── */}
        <aside className="shop-sidebar">
          {/* Search */}
          <div className="shop-sidebar__section">
            <input type="text" placeholder={t('shop.search')} value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '.6rem .8rem', border: '1px solid #ddd', borderRadius: '.4rem', fontSize: '1.2rem' }} />
          </div>

          {/* Categories */}
          <div className="shop-sidebar__section">
            <div className="shop-sidebar__heading" onClick={() => toggleSection('category')}>
              Categories <span className={`chevron ${openSections.category ? 'open' : ''}`}>▼</span>
            </div>
            {openSections.category && (
              <div className="shop-sidebar__list">
                <button className={`shop-sidebar__item ${!categoryFilter ? 'active' : ''}`} onClick={() => setCategoryFilter('')}>All</button>
                {CATEGORIES.map(c => (
                  <button key={c.key} className={`shop-sidebar__item ${categoryFilter === c.key ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(categoryFilter === c.key ? '' : c.key)}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gender */}
          <div className="shop-sidebar__section">
            <div className="shop-sidebar__heading" onClick={() => toggleSection('gender')}>
              Gender <span className={`chevron ${openSections.gender ? 'open' : ''}`}>▼</span>
            </div>
            {openSections.gender && (
              <div className="shop-sidebar__list">
                <button className={`shop-sidebar__item ${!genderFilter ? 'active' : ''}`} onClick={() => setGenderFilter('')}>All</button>
                {GENDERS.map(g => (
                  <button key={g.key} className={`shop-sidebar__item ${genderFilter === g.key ? 'active' : ''}`}
                    onClick={() => setGenderFilter(genderFilter === g.key ? '' : g.key)}>
                    {g.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size */}
          <div className="shop-sidebar__section">
            <div className="shop-sidebar__heading" onClick={() => toggleSection('size')}>
              Size <span className={`chevron ${openSections.size ? 'open' : ''}`}>▼</span>
            </div>
            {openSections.size && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                {SIZES.map(s => (
                  <button key={s} onClick={() => setSizeFilter(sizeFilter === String(s) ? '' : String(s))}
                    style={{
                      padding: '.4rem .8rem', border: `1px solid ${sizeFilter === String(s) ? 'var(--main-color)' : '#ddd'}`,
                      borderRadius: '.3rem', fontSize: '1.1rem', cursor: 'pointer',
                      background: sizeFilter === String(s) ? 'var(--main-color)' : '#fff',
                      color: sizeFilter === String(s) ? '#fff' : '#444', fontWeight: 600, transition: 'all .15s'
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sale */}
          <div className="shop-sidebar__section">
            <div className="shop-sidebar__heading" onClick={() => toggleSection('sale')}>
              Sale & Offers <span className={`chevron ${openSections.sale ? 'open' : ''}`}>▼</span>
            </div>
            {openSections.sale && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .7rem', cursor: 'pointer', fontSize: '1.2rem' }}>
                <input type="checkbox" checked={saleFilter} onChange={e => setSaleFilter(e.target.checked)} />
                🔥 On Sale Only
              </label>
            )}
          </div>

          {hasFilters && (
            <button onClick={clearFilters}
              style={{ width: '100%', padding: '.6rem', border: '1px solid #ddd', borderRadius: '.4rem', cursor: 'pointer', fontSize: '1.2rem', background: '#f5f5f5', marginTop: '.5rem' }}>
              ✕ Clear All Filters
            </button>
          )}
        </aside>

        {/* ─── PRODUCT GRID ─── */}
        <div>
          {loading ? (
            <p style={{ textAlign: 'center', fontSize: '1.4rem', color: '#666', padding: '3rem' }}>{t('shop.loading')}</p>
          ) : error ? (
            <p style={{ textAlign: 'center', fontSize: '1.4rem', color: '#d32f2f' }}>{error}</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '1.4rem', color: '#666', padding: '3rem' }}>{t('shop.noProducts')}</p>
          ) : (
            <div className="d-grid grid-4-columns" style={{ gap: '0' }}>
              {filtered.map((p) => {
                const img = resolveImagePath((Array.isArray(p.images) && p.images.length) ? p.images[0] : '');
                const hasSale = p.salePrice && p.salePrice > 0;
                return (
                  <div className="shoes-card d-flex flex-d-col align-center justify-center" key={p.id || p._id}>
                    {hasSale && <span className="product-sale-badge">SALE</span>}
                    <Link to={`/product/${p.id || p._id}`}><img src={img} alt={p.title_vi} /></Link>
                    <h3>{p.title_vi}</h3>
                    <div style={{ fontSize: '1.1rem', color: '#888', marginBottom: '.2rem' }}>{p.category || ''}</div>
                    <h4>
                      {hasSale ? (
                        <>{formatPrice(p.salePrice, p.currency)} <span>{formatPrice(p.price, p.currency)}</span></>
                      ) : formatPrice(p.price, p.currency)}
                    </h4>
                    <div className="product-actions">
                      <Link to={`/product/${p.id || p._id}`} style={{ color: '#667eea', fontSize: '1.2rem', fontWeight: 600 }}>{t('shop.viewDetail')}</Link>
                      <button onClick={() => { addToCart(p, 1, '40'); showToast(` ${t('shop.addToCart')}`); }}
                        style={{ background: 'var(--main-color)', color: '#fff', padding: '.5rem 1rem', border: 'none', borderRadius: '.5rem', cursor: 'pointer', fontSize: '1.2rem' }}>
                        <i className="fa fa-cart-plus"></i> {t('shop.addToCart')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
