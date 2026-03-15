import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { t, lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const isHome = location.pathname === '/';

  return (
    <nav className={`d-flex justify-between align-center padding-inline ${!isHome ? 'nav-dark' : ''}`} style={isHome ? { position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 } : {}}>
      <Link to="/" className="logo-box d-flex align-center">
        <h2>FitShoes</h2>
      </Link>

      <div className="nav-links" style={{ maxWidth: open ? '300px' : undefined }}>
        <ul className="d-flex align-center">
          <li><Link to="/" onClick={() => setOpen(false)}>{t('nav.home')}</Link></li>
          <li><Link to="/shop" onClick={() => setOpen(false)}>{t('nav.shop')}</Link></li>
          <li>
            <Link to="/cart" onClick={() => setOpen(false)}>
              {t('nav.cart')} {totalItems > 0 && <span>({totalItems})</span>}
            </Link>
          </li>
        </ul>
      </div>

      <div className="d-flex align-center" style={{ gap: '1rem' }}>
        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          className="lang-toggle-btn"
        >
          {lang === 'vi' ? 'EN' : 'VI'}
        </button>

        {user ? (
          <>
            <Link to="/profile" className="login-btn"><i className="fa fa-user"></i> {user.name?.split(' ')[0] || t('nav.profile')}</Link>
            <button onClick={logout} className="login-btn">
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn"><i className="fa fa-sign-in"></i> {t('nav.login')}</Link>
        )}
        <button className="mobile-toggle-btn" onClick={() => setOpen(!open)}>
          <i className={`fa ${open ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
    </nav>
  );
}
