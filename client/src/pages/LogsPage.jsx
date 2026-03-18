import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchLogs } from '../services/api';

export default function LogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const perPage = 20;

  useEffect(() => { document.title = `${t('logs.title')} — FitShoes`; }, []);

  useEffect(() => {
    setLoading(true);
    fetchLogs({ type: filter, search, page, limit: perPage })
      .then((res) => { setLogs(res.data?.logs || []); setTotal(res.data?.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const filters = [
    { key: '', label: t('logs.all') },
    { key: 'http', label: t('logs.http') },
    { key: 'auth', label: t('logs.auth') },
    { key: 'audit', label: t('logs.audit') },
    { key: 'error', label: t('logs.error') },
  ];

  return (
    <section style={{ padding: '3rem 5%', minHeight: '60vh' }}>
      <h2 style={{ fontSize: '2.8rem', color: 'var(--helping-color)', marginBottom: '2rem' }}>{t('logs.title')}</h2>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
        {filters.map((f) => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            style={{ padding: '.6rem 1.4rem', borderRadius: '2rem', border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: '1.2rem',
              background: filter === f.key ? 'var(--main-color)' : '#fff',
              color: filter === f.key ? '#fff' : 'var(--main-color)',
              borderColor: 'var(--main-color)' }}>
            {f.label}
          </button>
        ))}
        <input placeholder={t('logs.search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '.6rem 1rem', border: '2px solid #ddd', borderRadius: '2rem', fontSize: '1.2rem', flex: 1, minWidth: '180px' }} />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', fontSize: '1.4rem', color: '#666' }}>{t('logs.loading')}</p>
      ) : logs.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.4rem', color: '#666' }}>{t('logs.noLogs')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ background: '#fff', padding: '1.2rem', borderRadius: '.6rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', fontSize: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem', flexWrap: 'wrap', gap: '.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--main-color)' }}>{log.type || 'log'}</span>
                <span style={{ color: '#999', fontSize: '1.1rem' }}>{log.timestamp || ''}</span>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#333' }}>{typeof log.message === 'string' ? log.message : JSON.stringify(log, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ padding: '.6rem 1.2rem', border: '1px solid #ddd', borderRadius: '.4rem', cursor: 'pointer', fontSize: '1.2rem' }}>{t('logs.prev')}</button>
          <span style={{ fontSize: '1.3rem' }}>{t('logs.page', { current: page, total: totalPages })}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ padding: '.6rem 1.2rem', border: '1px solid #ddd', borderRadius: '.4rem', cursor: 'pointer', fontSize: '1.2rem' }}>{t('logs.next')}</button>
        </div>
      )}
    </section>
  );
}
