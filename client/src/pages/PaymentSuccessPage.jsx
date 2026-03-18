import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { queryZaloPayOrder } from '../services/api';

export default function PaymentSuccessPage() {
  const { clearCart } = useCart();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState(params.get('status')); // fallback to URL status
  const appTransId = params.get('apptransid');
  const orderId = appTransId || params.get('orderId') || '—';

  useEffect(() => {
    async function verify() {
      if (!appTransId) {
        setVerifying(false);
        return;
      }
      try {
        const res = await queryZaloPayOrder(appTransId);
        if (res.data?.success) {
          setStatus(res.data.status === 'SUCCESS' ? '1' : '0'); 
          if (res.data.status === 'SUCCESS') clearCart();
        }
      } catch (err) {
        console.error('Verify failed:', err);
      } finally {
        setVerifying(false);
      }
    }
    verify();
  }, [appTransId]);

  const isSuccess = status === '1';

  if (verifying) return (
    <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loader">Đang xác thực thanh toán...</div>
    </section>
  );

  return (
    <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
      <div>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{isSuccess ? '🎉' : '❌'}</div>
        <h2 style={{ fontSize: '2.8rem', color: isSuccess ? 'var(--helping-color)' : '#d32f2f', marginBottom: '1rem' }}>
          {isSuccess ? t('payment.title') : 'Thanh toán thất bại'}
        </h2>
        <p style={{ fontSize: '1.4rem', color: '#555', marginBottom: '1.5rem' }}>
          {isSuccess ? t('payment.desc') : `Đã có lỗi xảy ra, bạn đã hủy thanh toán hoặc giao dịch chưa hoàn tất (Code: ${status})`}
        </p>
        <p style={{ fontSize: '1.3rem', color: '#999' }}>{t('payment.orderId')}: <strong>{orderId}</strong></p>
        <Link to={isSuccess ? "/" : "/cart"} className="primary-btn" style={{ marginTop: '2rem', display: 'inline-block', padding: '1rem 2rem', borderRadius: '.8rem', background: isSuccess ? undefined : '#666' }}>
          {isSuccess ? t('payment.backHome') : 'Quay lại giỏ hàng'}
        </Link>
      </div>
    </section>
  );
}
