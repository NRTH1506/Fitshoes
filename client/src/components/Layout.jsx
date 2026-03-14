import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotWidget from './ChatbotWidget';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  return (
    <div className="wrapper">
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
