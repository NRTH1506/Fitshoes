import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFoundPage() {
  const { t } = useLanguage();
  document.title = `${t('notFound.title')} — FitShoes`;

  return (
    <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
      <div>
        <h1 style={{ fontSize: '10rem', color: 'var(--main-color)', lineHeight: 1 }}>{t('notFound.title')}</h1>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--helping-color)', marginBottom: '1rem' }}>{t('notFound.heading')}</h2>
        <p style={{ fontSize: '1.4rem', color: '#666', marginBottom: '2rem' }}>
          {t('notFound.desc')}
        </p>
        <Link to="/" className="primary-btn" style={{ padding: '1rem 2.5rem', borderRadius: '.8rem', fontSize: '1.4rem' }}>
          <i className="fa fa-home" style={{ marginRight: '.5rem' }}></i> {t('notFound.backHome')}
        </Link>
      </div>
    </section>
  );
}
