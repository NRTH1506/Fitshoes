import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function PaymentSuccessPage() {
  const { clearCart } = useCart();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const orderId = params.get('apptransid') || params.get('orderId') || '—';

  useEffect(() => { clearCart(); document.title = `${t('payment.title')} — FitShoes`; }, []);

  return (
    <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
      <div>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontSize: '2.8rem', color: 'var(--helping-color)', marginBottom: '1rem' }}>{t('payment.title')}</h2>
        <p style={{ fontSize: '1.4rem', color: '#555', marginBottom: '1.5rem' }}>{t('payment.desc')}</p>
        <p style={{ fontSize: '1.3rem', color: '#999' }}>{t('payment.orderId')}: <strong>{orderId}</strong></p>
        <Link to="/" className="primary-btn" style={{ marginTop: '2rem', display: 'inline-block', padding: '1rem 2rem', borderRadius: '.8rem' }}>
          {t('payment.backHome')}
        </Link>
      </div>
    </section>
  );
}
