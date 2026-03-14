import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Class components can't use hooks, so we access translations via props or hardcode both languages
      return (
        <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: '#f5f5f5' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--main-color)', marginBottom: '1rem' }}>
              Something went wrong / Đã xảy ra lỗi
            </h2>
            <p style={{ fontSize: '1.4rem', color: '#666', marginBottom: '2rem' }}>
              An unexpected error occurred. Please try again.
              <br />
              Xin lỗi, đã có lỗi không mong muốn. Vui lòng thử lại.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); }}
                style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '1rem 2rem', borderRadius: '.8rem', fontWeight: 600, fontSize: '1.3rem', border: 'none', cursor: 'pointer' }}
              >
                <i className="fa fa-refresh" style={{ marginRight: '.5rem' }}></i> Try again / Thử lại
              </button>
              <Link to="/" style={{ border: '2px solid var(--main-color)', color: 'var(--main-color)', padding: '1rem 2rem', borderRadius: '.8rem', fontWeight: 600, fontSize: '1.3rem' }}>
                <i className="fa fa-home" style={{ marginRight: '.5rem' }}></i> Home / Trang chủ
              </Link>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
