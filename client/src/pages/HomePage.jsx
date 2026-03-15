import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { useLanguage } from '../contexts/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    document.title = 'FitShoes — ' + t('hero.subtitle');
    fetchProducts().then((res) => setFeatured((res.data?.data || []).slice(0, 8))).catch(() => {});
  }, []);

  const services = [
    { icon: 'fa-truck', key: 'freeShipping', link: '/service/free-shipping' },
    { icon: 'fa-bolt', key: 'fastDelivery', link: '/service/fast-delivery' },
    { icon: 'fa-shopping-bag', key: 'onlineShopping', link: '/service/online-shopping' },
    { icon: 'fa-gem', key: 'bestQuality', link: '/service/best-quality' },
  ];

  return (
    <>
      {/* Hero */}
      <header>
        <div id="hero-text" className="d-flex flex-d-col justify-center padding-inline">
          <h1>{t('hero.title')}</h1>
          <h3>{t('hero.subtitle')}</h3>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="hero-register-btn">{t('hero.register')} <i className="fa fa-arrow-right"></i></Link>
            <Link to="/shop" className="hero-btn primary-btn">{t('hero.shop')}</Link>
          </div>
        </div>
      </header>

      {/* Services */}
      <section id="services-section" className="d-grid grid-4-columns section-shadow">
        {services.map((s) => (
          <div className="service-box d-flex flex-d-col" key={s.key}>
            <i className={`fa ${s.icon} service-icon`}></i>
            <h3>{t(`services.${s.key}.title`)}</h3>
            <p>{t(`services.${s.key}.desc`)}</p>
            <Link to={s.link} className="service-btn d-flex align-center">
              {t(`services.${s.key}.btn`)} <i className="fa fa-arrow-right"></i>
            </Link>
          </div>
        ))}
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section id="biggest-sale-section">
          <h1>{t('home.featured')}</h1>
          <p>{t('home.featuredDesc')}</p>
          <div id="shoes-cards-section" className="d-grid grid-4-columns section-shadow">
            {featured.map((p) => (
              <Link to={`/product/${p.id || p._id}`} key={p.id || p._id} className="shoes-card d-flex flex-d-col align-center justify-center" style={{ textDecoration: 'none', color: 'inherit' }}>
                <img src={(Array.isArray(p.images) && p.images.length) ? p.images[0] : ''} alt={p.title_vi} />
                <h3>{p.title_vi}</h3>
                <h4>{formatPrice(p.price, p.currency)} {p.oldPrice && <span>{formatPrice(p.oldPrice, p.currency)}</span>}</h4>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      <section>
        <div id="biggest-sale-section"><h1>{t('home.gallery')}</h1></div>
        <div id="gallery-section" className="d-grid grid-4-columns">
          {[1,2,3,4,2,4,3,1].map((n, i) => <div className="gallery-box" key={i} style={{ backgroundImage: `url(/assets/images/gallery-${n}.jpg)` }}></div>)}
        </div>
      </section>

      {/* Brands */}
      <section>
        <div id="biggest-sale-section"><h1>{t('home.brands')}</h1></div>
        <div id="brands-section">
          {['c-1','c-2','c-3','c-4','c-5','c-6','c-7','c-1','c-2','c-3','c-4','c-5'].map((n, i) => (
            <div className="brand-box" key={i}><img src={`/assets/images/${n}.png`} alt="brand" /></div>
          ))}
        </div>
      </section>
    </>
  );
}
