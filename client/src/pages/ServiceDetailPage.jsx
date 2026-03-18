import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { resolveImagePath } from '../utils/images';

const serviceData = {
  'free-shipping': {
    title_vi: 'Miễn phí vận chuyển', title_en: 'Free Shipping',
    short_vi: 'Miễn phí vận chuyển cho đơn hàng từ 500.000đ trên toàn quốc.',
    short_en: 'Free shipping on orders over 500,000₫ nationwide.',
    description_vi: 'Chúng tôi cam kết miễn phí vận chuyển cho tất cả đơn hàng từ 500.000đ, áp dụng trên toàn quốc. Đơn hàng sẽ được giao tận nơi một cách nhanh chóng và an toàn.',
    description_en: 'We offer free shipping on all orders over 500,000₫, applicable nationwide. Orders will be delivered to your door quickly and safely.',
    benefits_vi: ['Miễn phí cho đơn từ 500K', 'Áp dụng toàn quốc', 'Đóng gói cẩn thận'],
    benefits_en: ['Free on orders from 500K', 'Available nationwide', 'Carefully packaged'],
    img: '/assets/images/gallery-1.jpg',
  },
  'fast-delivery': {
    title_vi: 'Giao hàng nhanh', title_en: 'Fast Delivery',
    short_vi: 'Giao hàng trong 24h tại nội thành và 2-3 ngày toàn quốc.',
    short_en: 'Delivered within 24h in the city and 2-3 days nationwide.',
    description_vi: 'Dịch vụ giao hàng nhanh giúp bạn nhận sản phẩm trong thời gian ngắn nhất. Nội thành giao trong 24 giờ, các tỉnh thành khác từ 2-3 ngày làm việc.',
    description_en: 'Our fast delivery service ensures you receive your products in the shortest time. Within 24 hours in the city, and 2-3 business days for other provinces.',
    benefits_vi: ['Giao nội thành 24h', 'Toàn quốc 2-3 ngày', 'Theo dõi đơn hàng'],
    benefits_en: ['City delivery 24h', 'Nationwide 2-3 days', 'Order tracking'],
    img: '/assets/images/gallery-2.jpg',
  },
  'online-shopping': {
    title_vi: 'Mua sắm trực tuyến', title_en: 'Online Shopping',
    short_vi: 'Trải nghiệm mua sắm tiện lợi mọi lúc, mọi nơi.',
    short_en: 'Shop conveniently anytime, anywhere.',
    description_vi: 'Nền tảng mua sắm trực tuyến hiện đại, dễ sử dụng với giao diện thân thiện. Tìm kiếm, so sánh và đặt hàng chỉ với vài cú click.',
    description_en: 'A modern, easy-to-use online shopping platform with a friendly interface. Search, compare, and order with just a few clicks.',
    benefits_vi: ['Giao diện thân thiện', 'Thanh toán an toàn', 'Hỗ trợ 24/7'],
    benefits_en: ['User-friendly interface', 'Secure payment', '24/7 support'],
    img: '/assets/images/gallery-3.jpg',
  },
};

export default function ServiceDetailPage() {
  const { t, lang } = useLanguage();
  const { id } = useParams();
  const svc = serviceData[id];

  useEffect(() => {
    if (svc) document.title = `${lang === 'vi' ? svc.title_vi : svc.title_en} — FitShoes`;
  }, [svc, lang]);

  if (!svc) return (
    <section style={{ padding: '3rem 5%', textAlign: 'center' }}>
      <p style={{ fontSize: '1.6rem', color: '#d32f2f' }}>{t('service.notFound')}</p>
    </section>
  );

  const title = lang === 'vi' ? svc.title_vi : svc.title_en;
  const short = lang === 'vi' ? svc.short_vi : svc.short_en;
  const description = lang === 'vi' ? svc.description_vi : svc.description_en;
  const benefits = lang === 'vi' ? svc.benefits_vi : svc.benefits_en;

  return (
    <section style={{ padding: '4rem 5%' }}>
      <div className="service-detail-grid">
        <div style={{ borderRadius: '1rem', overflow: 'hidden' }}>
          <img src={resolveImagePath(svc.img)} alt={title} style={{ width: '100%', height: 'auto' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '2.8rem', color: 'var(--helping-color)', marginBottom: '1rem' }}>{title}</h2>
          <p style={{ fontSize: '1.4rem', color: '#555', marginBottom: '1rem' }}>{short}</p>
          <p style={{ fontSize: '1.4rem', color: '#555', marginBottom: '1.5rem' }}>{description}</p>
          <h4 style={{ fontSize: '1.6rem', marginBottom: '.8rem' }}>{t('service.benefits')}</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '2rem' }}>
            {benefits.map((b, i) => <li key={i} style={{ fontSize: '1.3rem', color: '#555' }}>• {b}</li>)}
          </ul>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: '#667eea', fontSize: '1.3rem' }}>{t('service.backServices')}</Link>
            <Link to="/shop" style={{ background: 'var(--main-color)', color: '#fff', padding: '.8rem 1.5rem', borderRadius: '.6rem', fontSize: '1.3rem' }}>{t('service.shopRelated')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
