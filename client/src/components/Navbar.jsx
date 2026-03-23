import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

const SHOP_CATEGORIES = [
  { key: 'running', label: 'Running', icon: '🏃' },
  { key: 'gym', label: 'Training & Gym', icon: '💪' },
  { key: 'casual', label: 'Casual', icon: '👟' },
  { key: 'sandals', label: 'Sandals', icon: '🩴' },
  { key: 'boots', label: 'Boots', icon: '🥾' },
];

const GENDER_LINKS = [
  { key: 'male', label: "Men's Shoes" },
  { key: 'female', label: "Women's Shoes" },
  { key: 'unisex', label: 'Unisex' },
];

export default function Navbar() {
  const { user, logout, canAccessAdmin } = useAuth();
  const { cart } = useCart();
  const { t, lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setDropdown(null); setOpen(false); }, [location.pathname]);

  const navStyle = { position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 };
  const navClass = `d-flex justify-between align-center padding-inline ${(!isHome || scrolled) ? 'nav-dark' : ''}`;

  function goShop(params) {
    const qs = new URLSearchParams(params).toString();
    navigate(`/shop?${qs}`);
    setDropdown(null);
  }

  return (
    <>
      <nav className={navClass} style={navStyle}>
        <Link to="/" className="logo-box d-flex align-center">
          <h2>FitShoes</h2>
        </Link>

        <div className="nav-links" style={{ maxWidth: open ? '300px' : undefined }}>
          <ul className="d-flex align-center">
            <li><Link to="/" onClick={() => setOpen(false)}>{t('nav.home')}</Link></li>
            <li
              className="nav-dropdown-trigger"
              onMouseEnter={() => setDropdown('shop')}
              onMouseLeave={() => setDropdown(null)}
            >
              <Link to="/shop" onClick={() => setOpen(false)}>{t('nav.shop')}</Link>

              {/* Mega Dropdown */}
              <div className={`mega-dropdown ${dropdown === 'shop' ? 'mega-dropdown--open' : ''}`}
                onMouseEnter={() => setDropdown('shop')}
                onMouseLeave={() => setDropdown(null)}>
                <div className="mega-dropdown__inner">
                  {/* Categories */}
                  <div className="mega-dropdown__col">
                    <h4 className="mega-dropdown__heading">Categories</h4>
                    {SHOP_CATEGORIES.map(c => (
                      <button key={c.key} className="mega-dropdown__link" onClick={() => goShop({ category: c.key })}>
                        <span>{c.icon}</span> {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Gender */}
                  <div className="mega-dropdown__col">
                    <h4 className="mega-dropdown__heading">Shop By</h4>
                    {GENDER_LINKS.map(g => (
                      <button key={g.key} className="mega-dropdown__link" onClick={() => goShop({ gender: g.key })}>
                        {g.label}
                      </button>
                    ))}
                    <div style={{ marginTop: '1rem' }}>
                      <h4 className="mega-dropdown__heading">Quick Links</h4>
                      <button className="mega-dropdown__link mega-dropdown__link--sale" onClick={() => goShop({ sale: '1' })}>
                        🔥 On Sale
                      </button>
                      <button className="mega-dropdown__link" onClick={() => goShop({})}>
                        All Products
                      </button>
                    </div>
                  </div>

                  {/* Featured */}
                  <div className="mega-dropdown__col mega-dropdown__featured">
                    <div className="mega-dropdown__featured-card">
                      <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>👟</div>
                      <h4>New Arrivals</h4>
                      <p>Explore our latest collection</p>
                      <button className="mega-dropdown__featured-btn" onClick={() => goShop({})}>
                        Shop Now →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <Link to="/cart" onClick={() => setOpen(false)}>
                {t('nav.cart')} {totalItems > 0 && <span>({totalItems})</span>}
              </Link>
            </li>
            {canAccessAdmin && <li><Link to="/admin" onClick={() => setOpen(false)}>{t('admin.title')}</Link></li>}
            {canAccessAdmin && <li><Link to="/logs" onClick={() => setOpen(false)}>{t('logs.title')}</Link></li>}
          </ul>
        </div>

        <div className="d-flex align-center" style={{ gap: '1rem' }}>
          <button onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'} className="lang-toggle-btn">
            {lang === 'vi' ? 'EN' : 'VI'}
          </button>
          {user ? (
            <>
              <Link to="/profile" className="login-btn"><i className="fa fa-user"></i> {user.name?.split(' ')[0] || t('nav.profile')}</Link>
              <button onClick={logout} className="login-btn">{t('nav.logout')}</button>
            </>
          ) : (
            <Link to="/login" className="login-btn"><i className="fa fa-sign-in"></i> {t('nav.login')}</Link>
          )}
          <button className="mobile-toggle-btn" onClick={() => setOpen(!open)}>
            <i className={`fa ${open ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      {dropdown && <div className="mega-dropdown__backdrop" onMouseEnter={() => setDropdown(null)} />}
    </>
  );
}
