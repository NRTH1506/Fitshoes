import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotWidget from './ChatbotWidget';
import ErrorBoundary from './ErrorBoundary';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout() {
  const { t } = useLanguage();

  return (
    <div className="wrapper">
      <div className="top-promo-bar">
        <span>{t('hero.badge')}</span>
      </div>
      <Navbar />
      <main>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
