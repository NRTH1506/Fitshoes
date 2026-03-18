import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotWidget from './ChatbotWidget';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="wrapper">
      <Navbar />
      <main style={{ paddingTop: isHome ? '0' : '80px', minHeight: 'calc(100vh - 200px)' }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
