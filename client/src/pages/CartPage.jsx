import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatPrice';
import { createZaloPayOrder } from '../services/api';

export default function CartPage() {
  const { t } = useLanguage();
  const { cart, updateQty, removeItem, clearCart, subtotal } = useCart();
  const { user } = useAuth();

  document.title = `${t('cart.title')} — FitShoes`;

  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  async function handleCheckout() {
    try {
      const res = await createZaloPayOrder(cart, user?._id || user?.id || 'guest');
      if (res.data?.order_url) window.location.href = res.data.order_url;
    } catch { alert('Payment error'); }
  }

  if (cart.length === 0) return (
    <section style={{ padding: '3rem 5%', textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🛒</div>
      <h2 style={{ fontSize: '2.4rem', color: 'var(--helping-color)', marginBottom: '1rem' }}>{t('cart.empty')}</h2>
      <p style={{ fontSize: '1.4rem', color: '#666', marginBottom: '2rem' }}>{t('cart.emptyDesc')}</p>
      <Link to="/shop" className="primary-btn" style={{ padding: '1rem 2rem', borderRadius: '.8rem', fontSize: '1.4rem' }}>{t('cart.goShopping')}</Link>
    </section>
  );

  return (
    <section style={{ padding: '3rem 5%', minHeight: '60vh' }}>
      <h2 style={{ fontSize: '2.8rem', color: 'var(--helping-color)', marginBottom: '2rem' }}>{t('cart.title')}</h2>
      <div className="cart-grid">
        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {cart.map((item) => (
            <div key={item.id + (item.size || '')} className="cart-item-row">
              <div>
                <h3 style={{ fontSize: '1.6rem', color: 'var(--helping-color)', marginBottom: '.3rem' }}>{item.title || ''}</h3>
                <div style={{ fontSize: '1.2rem', color: '#666' }}>{t('cart.size')}: <strong>{item.size || '-'}</strong></div>
                <div style={{ fontSize: '1.3rem', color: 'var(--primary-color)', fontWeight: 600 }}>{formatPrice(item.price, 'VND')}</div>
              </div>
              <div className="cart-item-actions">
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '.4rem', overflow: 'hidden' }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ padding: '.4rem .8rem', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>−</button>
                  <span style={{ padding: '.4rem 1rem', fontSize: '1.3rem' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ padding: '.4rem .8rem', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>+</button>
                </div>
                <strong style={{ fontSize: '1.4rem', minWidth: '100px', textAlign: 'right' }}>{formatPrice(item.price * item.qty, 'VND')}</strong>
                <button onClick={() => removeItem(item.id)} style={{ background: '#d32f2f', color: '#fff', padding: '.5rem 1rem', border: 'none', borderRadius: '.4rem', cursor: 'pointer', fontSize: '1.2rem' }}>
                  <i className="fa fa-trash"></i> {t('cart.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '.8rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', marginBottom: '1rem' }}>
            <span>{t('cart.subtotal')}:</span><span>{formatPrice(subtotal, 'VND')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', marginBottom: '1rem' }}>
            <span>{t('cart.shipping')}:</span><span>{shipping === 0 ? t('cart.shippingFree') : formatPrice(shipping, 'VND')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.8rem', fontWeight: 700, borderTop: '2px solid #eee', paddingTop: '1rem', marginBottom: '1.5rem' }}>
            <span>{t('cart.total')}:</span><span style={{ color: 'var(--primary-color)' }}>{formatPrice(total, 'VND')}</span>
          </div>
          <button onClick={handleCheckout} style={{ width: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '1.1rem', border: 'none', borderRadius: '.8rem', fontSize: '1.5rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' }}>
            {t('cart.checkout')}
          </button>
          <button onClick={() => { if (confirm(t('cart.clearConfirm'))) clearCart(); }} style={{ width: '100%', background: '#f5f5f5', color: '#666', padding: '.9rem', border: '1px solid #ddd', borderRadius: '.8rem', fontSize: '1.3rem', cursor: 'pointer' }}>
            {t('cart.clearAll')}
          </button>
        </div>
      </div>
    </section>
  );
}
