import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProducts } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { resolveImagePath } from '../utils/images';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { showToast } from '../utils/toast';

export default function ProductDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [mainImg, setMainImg] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts().then((res) => {
      const list = res.data?.data || [];
      setAllProducts(list);
      const found = list.find((p) => String(p.id) === id || String(p._id) === id);
      setProduct(found || null);
      if (found) {
        setMainImg(resolveImagePath((found.images && found.images.length) ? found.images[0] : ''));
        document.title = `${found.title_vi} — FitShoes`;
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <section style={{ padding: '3rem 5%', textAlign: 'center' }}><p style={{ fontSize: '1.4rem' }}>{t('product.loading')}</p></section>;
  if (!product) return (
    <section style={{ padding: '3rem 5%', textAlign: 'center' }}>
      <p style={{ fontSize: '1.6rem', color: '#d32f2f' }}>{t('product.notFound')}</p>
      <Link to="/shop" style={{ color: '#667eea', fontSize: '1.3rem', marginTop: '1rem', display: 'inline-block' }}>{t('product.backToShop')}</Link>
    </section>
  );

  const images = Array.isArray(product.images) && product.images.length ? product.images : [product.img || ''];
  const related = allProducts.filter((p) => (p.id !== product.id && p._id !== product._id) && p.gender === product.gender).slice(0, 6);
  const sizes = [36, 37, 38, 39, 40, 41, 42, 43];

  function handleAdd() {
    if (!selectedSize) { alert(t('product.pleaseSelectSize')); return; }
    addToCart(product, qty, selectedSize);
    showToast(`✅ ${t('product.addedToCart', { name: product.title_vi, qty })}`);
  }

  return (
    <section style={{ padding: '3rem 5%' }}>
      <div className="product-detail-grid">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="gallery-main" style={{ borderRadius: '1rem', overflow: 'hidden', marginBottom: '1rem' }}>
            <img id="main-product-img" src={mainImg} alt={product.title_vi} style={{ width: '100%', height: 'auto' }} />
          </div>
          <div className="gallery-thumbs-row">
            {images.map((src, i) => {
              const rSrc = resolveImagePath(src);
              return (
                <img key={i} src={rSrc} alt={`${product.title_vi} - ${i + 1}`}
                  onClick={() => setMainImg(rSrc)}
                  style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '.5rem', cursor: 'pointer', border: mainImg === rSrc ? '2px solid #667eea' : '2px solid transparent' }} />
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="product-info-section">
          <h1 style={{ fontSize: '2.6rem', color: 'var(--helping-color)', marginBottom: '1rem' }}>{product.title_vi}</h1>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>{formatPrice(product.price, product.currency)}</span>
            {product.oldPrice && <span style={{ fontSize: '1.5rem', color: '#999', textDecoration: 'line-through', marginLeft: '1rem' }}>{formatPrice(product.oldPrice, product.currency)}</span>}
          </div>
          <div style={{ marginBottom: '1rem', color: '#e5a100' }}>
            <i className="fa fa-star"></i> <span>4.8 (128 {t('product.reviews')})</span>
          </div>
          <p style={{ fontSize: '1.4rem', color: '#555', lineHeight: 1.6, marginBottom: '2rem' }}>{product.description_vi}</p>

          {/* Sizes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '1.3rem', marginBottom: '.8rem' }}><i className="fa fa-ruler"></i> {t('product.selectSize')}</div>
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
              {sizes.map((s) => (
                <button key={s} onClick={() => setSelectedSize(String(s))}
                  style={{
                    padding: '.7rem 1.4rem', borderRadius: '.5rem', border: '2px solid', fontSize: '1.3rem', cursor: 'pointer', fontWeight: 600,
                    background: selectedSize === String(s) ? 'var(--main-color)' : '#fff',
                    color: selectedSize === String(s) ? '#fff' : 'var(--main-color)',
                    borderColor: 'var(--main-color)',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '.4rem' }}>{t('product.quantity')}</div>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '.5rem', overflow: 'hidden' }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ padding: '.6rem 1rem', background: '#f5f5f5', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>−</button>
                <span style={{ padding: '.6rem 1.5rem', fontSize: '1.4rem', fontWeight: 600 }}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} style={{ padding: '.6rem 1rem', background: '#f5f5f5', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>+</button>
              </div>
            </div>
            <button onClick={handleAdd} style={{ flex: 1, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '1.1rem', borderRadius: '.8rem', fontSize: '1.4rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              <i className="fa fa-shopping-cart"></i> {t('product.addToCart')}
            </button>
          </div>

          <Link to="/shop" style={{ color: '#667eea', fontSize: '1.3rem' }}><i className="fa fa-arrow-left"></i> {t('product.backToShop')}</Link>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h3 style={{ fontSize: '2.2rem', color: 'var(--helping-color)', marginBottom: '2rem' }}>{t('product.related')}</h3>
          <div className="d-grid grid-4-columns" style={{ gap: '0' }}>
            {related.map((p) => (
              <Link to={`/product/${p.id || p._id}`} key={p.id || p._id} className="shoes-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <img src={resolveImagePath((Array.isArray(p.images) && p.images.length) ? p.images[0] : '')} alt={p.title_vi} />
                <h3>{p.title_vi}</h3>
                <h4 className="product-price">{formatPrice(p.price, p.currency)}</h4>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
