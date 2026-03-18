import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{ background: '#153356', color: '#fff', padding: '4rem 5%' }}>
      <div className="footer-grid">
        {/* Brand */}
        <div>
          <h3 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>FitShoes</h3>
          <p style={{ fontSize: '1.3rem', opacity: 0.8 }}>
            {t('footer.brand')}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{t('footer.links')}</h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <li><Link to="/" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem' }}>{t('nav.home')}</Link></li>
            <li><Link to="/shop" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem' }}>{t('nav.shop')}</Link></li>
            <li><Link to="/cart" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem' }}>{t('nav.cart')}</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{t('footer.services')}</h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <li><Link to="/service/free-shipping" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem' }}>{t('footer.freeShipping')}</Link></li>
            <li><Link to="/service/fast-delivery" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem' }}>{t('footer.fastDelivery')}</Link></li>
            <li><Link to="/service/online-shopping" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem' }}>{t('footer.onlineShopping')}</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{t('footer.contact')}</h4>
          <p style={{ fontSize: '1.3rem', opacity: 0.8, marginBottom: '.5rem' }}>
            <i className="fa fa-envelope" style={{ marginRight: '.5rem' }}></i> support@fitshoes.vn
          </p>
          <p style={{ fontSize: '1.3rem', opacity: 0.8, marginBottom: '.5rem' }}>
            <i className="fa fa-phone" style={{ marginRight: '.5rem' }}></i> 0123 456 789
          </p>
          <div style={{ display: 'flex', gap: '1.2rem', marginTop: '1rem' }}>
            <a href="#" style={{ color: '#fff', fontSize: '1.8rem' }}><i className="fa-brands fa-facebook"></i></a>
            <a href="#" style={{ color: '#fff', fontSize: '1.8rem' }}><i className="fa-brands fa-instagram"></i></a>
            <a href="#" style={{ color: '#fff', fontSize: '1.8rem' }}><i className="fa-brands fa-twitter"></i></a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '3rem', paddingTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', opacity: 0.7 }}>{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
