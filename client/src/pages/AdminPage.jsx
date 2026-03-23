import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchProducts, addProduct, deleteProduct,
  fetchAdminUsers, grantAdminAccess, revokeAdminAccess, transferOwnership,
  fetchAdminOrders, fetchRevenue, updateOrderStatus
} from '../services/api';
import { resolveImagePath } from '../utils/images';
import { formatPrice } from '../utils/formatPrice';

const TABS = ['products', 'orders', 'users'];

export default function AdminPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState('orders');

  useEffect(() => { document.title = `${t('admin.title')} — FitShoes`; }, []);

  const tabStyle = (key) => ({
    padding: '.8rem 2rem', borderRadius: '2rem 2rem 0 0', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '1.4rem',
    background: tab === key ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f0f0f0',
    color: tab === key ? '#fff' : '#555',
    transition: 'all .2s'
  });

  return (
    <section style={{ padding: '2rem 4%', minHeight: '70vh' }}>
      <h2 style={{ fontSize: '2.6rem', color: 'var(--helping-color)', marginBottom: '1.5rem' }}>{t('admin.title')}</h2>

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '0' }}>
        {TABS.map((k) => (
          <button key={k} onClick={() => setTab(k)} style={tabStyle(k)}>
            {k === 'products' ? '📦 Products' : k === 'orders' ? '🧾 Orders & Revenue' : '👥 Users'}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '0 1rem 1rem 1rem', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: '50vh' }}>
        {tab === 'products' && <ProductsTab t={t} />}
        {tab === 'orders' && <OrdersTab t={t} />}
        {tab === 'users' && <UsersTab t={t} user={user} />}
      </div>
    </section>
  );
}

/* ═══════════════════ PRODUCTS TAB ═══════════════════ */
function ProductsTab({ t }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', brand: '', description: '', images: '', gender: 'unisex' });
  const [msg, setMsg] = useState({ text: '', isError: false });

  useEffect(() => { loadProducts(); }, []);
  async function loadProducts() {
    try { const res = await fetchProducts(); setProducts(res.data?.data || []); } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault(); setMsg({ text: '', isError: false });
    try {
      await addProduct({ title_vi: form.name, price: Number(form.price), brand: form.brand, description_vi: form.description, gender: form.gender, currency: 'VND', images: form.images.split(',').map(s => s.trim()).filter(Boolean) });
      setMsg({ text: '✅ Added', isError: false });
      setForm({ name: '', price: '', brand: '', description: '', images: '', gender: 'unisex' });
      loadProducts();
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Error', isError: true }); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); loadProducts(); } catch {}
  }

  const inp = { width: '100%', padding: '.8rem 1rem', border: '1px solid #ddd', borderRadius: '.6rem', fontSize: '1.3rem' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', color: 'var(--main-color)' }}>Add Product</h3>
        {msg.text && <div style={{ padding: '.6rem', borderRadius: '.4rem', marginBottom: '.8rem', background: msg.isError ? '#fef2f2' : '#f0fdf4', color: msg.isError ? '#dc2626' : '#16a34a', fontSize: '1.2rem' }}>{msg.text}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
          <input placeholder="Product name (Vietnamese)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} />
          <input placeholder="Price (VND)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={inp} />
          <input placeholder="Brand" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} style={inp} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} />
          <input placeholder="Image paths (comma-separated)" value={form.images} onChange={e => setForm(p => ({ ...p, images: e.target.value }))} style={inp} />
          <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} style={inp}>
            <option value="unisex">Unisex</option><option value="male">Male</option><option value="female">Female</option>
          </select>
          <button type="submit" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '.9rem', borderRadius: '.7rem', fontSize: '1.3rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Add Product</button>
        </form>
      </div>
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', color: 'var(--main-color)' }}>Product List ({products.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          {products.map(p => (
            <div key={p._id || p.id} style={{ border: '1px solid #eee', padding: '.6rem', borderRadius: '.5rem', textAlign: 'center' }}>
              <img src={resolveImagePath(p.images?.[0] || '')} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '.3rem' }} alt="" />
              <div style={{ fontWeight: 600, fontSize: '1.2rem', marginTop: '.3rem' }}>{p.title_vi || p.title}</div>
              <div style={{ fontSize: '1.1rem', color: '#667eea' }}>{formatPrice(p.price, p.currency)}</div>
              <button onClick={() => handleDelete(p._id || p.id)} style={{ marginTop: '.3rem', background: '#dc2626', color: '#fff', border: 'none', padding: '.4rem .8rem', borderRadius: '.3rem', cursor: 'pointer', fontSize: '1.1rem' }}>Delete</button>
            </div>
          ))}
          {products.length === 0 && <div style={{ color: '#999', gridColumn: '1/-1', textAlign: 'center' }}>No products</div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ ORDERS TAB ═══════════════════ */
function OrdersTab({ t }) {
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  useEffect(() => { loadOrders(); loadRevenue(); }, [filters, page]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetchAdminOrders({ ...filters, page, limit });
      setOrders(res.data?.orders || []);
      setTotal(res.data?.total || 0);
    } catch {} finally { setLoading(false); }
  }

  async function loadRevenue() {
    try {
      const res = await fetchRevenue({ startDate: filters.startDate, endDate: filters.endDate });
      setRevenue(res.data?.revenue || null);
    } catch {}
  }

  async function handleStatusChange(orderId, newStatus) {
    try { await updateOrderStatus(orderId, newStatus); loadOrders(); loadRevenue(); } catch {}
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const cardStyle = { background: 'linear-gradient(135deg,#667eea22,#764ba222)', padding: '1.2rem', borderRadius: '.8rem', textAlign: 'center', flex: 1, minWidth: '140px' };
  const labelStyle = { fontSize: '1.1rem', color: '#666', marginBottom: '.3rem' };
  const valStyle = { fontSize: '2rem', fontWeight: 800, color: '#333' };
  const statusColor = { SUCCESS: '#16a34a', PENDING: '#f59e0b', FAILED: '#dc2626' };

  return (
    <div>
      {/* Revenue Cards */}
      {revenue && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={cardStyle}><div style={labelStyle}>Total Revenue</div><div style={valStyle}>{formatPrice(revenue.total)}</div></div>
          <div style={cardStyle}><div style={labelStyle}>Orders (Success)</div><div style={valStyle}>{revenue.orderCount}</div></div>
          <div style={cardStyle}><div style={labelStyle}>Avg Order</div><div style={valStyle}>{formatPrice(revenue.avgOrderValue)}</div></div>
          <div style={cardStyle}><div style={labelStyle}>Today Revenue</div><div style={valStyle}>{formatPrice(revenue.todayRevenue)}</div></div>
          <div style={cardStyle}><div style={labelStyle}>Today Orders</div><div style={valStyle}>{revenue.todayOrders}</div></div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.8rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          style={{ padding: '.6rem 1rem', border: '1px solid #ddd', borderRadius: '.5rem', fontSize: '1.2rem' }}>
          <option value="">All Status</option>
          <option value="SUCCESS">✅ Success</option>
          <option value="PENDING">⏳ Pending</option>
          <option value="FAILED">❌ Failed</option>
        </select>
        <input type="date" value={filters.startDate} onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }}
          style={{ padding: '.6rem .8rem', border: '1px solid #ddd', borderRadius: '.5rem', fontSize: '1.2rem' }} />
        <input type="date" value={filters.endDate} onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }}
          style={{ padding: '.6rem .8rem', border: '1px solid #ddd', borderRadius: '.5rem', fontSize: '1.2rem' }} />
        <input placeholder="Search by Order ID or User ID" value={filters.search}
          onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
          style={{ padding: '.6rem 1rem', border: '1px solid #ddd', borderRadius: '.5rem', fontSize: '1.2rem', flex: 1, minWidth: '180px' }} />
      </div>

      {/* Order Table */}
      {loading ? <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Order ID</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>User</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Amount</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Items</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Status</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Date</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '.7rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>{o.app_trans_id}</td>
                  <td style={{ padding: '.7rem' }}>{o.userId || 'guest'}</td>
                  <td style={{ padding: '.7rem', fontWeight: 600 }}>{formatPrice(o.amount)}</td>
                  <td style={{ padding: '.7rem' }}>{Array.isArray(o.items) ? o.items.length : 0}</td>
                  <td style={{ padding: '.7rem' }}>
                    <span style={{ padding: '.3rem .7rem', borderRadius: '2rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff', background: statusColor[o.status] || '#999' }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '.7rem', fontSize: '1.1rem', color: '#666' }}>{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '.7rem' }}>
                    <select value={o.status} onChange={e => handleStatusChange(o._id, e.target.value)}
                      style={{ padding: '.3rem .5rem', border: '1px solid #ddd', borderRadius: '.3rem', fontSize: '1.1rem' }}>
                      <option value="PENDING">PENDING</option>
                      <option value="SUCCESS">SUCCESS</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.2rem', alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ padding: '.5rem 1rem', border: '1px solid #ddd', borderRadius: '.4rem', cursor: 'pointer', fontSize: '1.2rem' }}>← Prev</button>
          <span style={{ fontSize: '1.2rem' }}>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ padding: '.5rem 1rem', border: '1px solid #ddd', borderRadius: '.4rem', cursor: 'pointer', fontSize: '1.2rem' }}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ USERS TAB ═══════════════════ */
function UsersTab({ t, user: currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [transferEmail, setTransferEmail] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);

  const isOwner = currentUser?.role === 'admin';

  useEffect(() => { loadUsers(); }, []);
  async function loadUsers() {
    setLoading(true);
    try { const res = await fetchAdminUsers(); setUsers(res.data?.users || []); } catch {}
    finally { setLoading(false); }
  }

  async function handleGrant(id) {
    try { await grantAdminAccess(id); setMsg('✅ Access granted'); loadUsers(); } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  }

  async function handleRevoke(id) {
    if (!confirm('Revoke admin access?')) return;
    try { await revokeAdminAccess(id); setMsg('✅ Access revoked'); loadUsers(); } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  }

  async function handleTransfer() {
    if (!transferEmail.trim()) return;
    if (!confirm(`Transfer ownership to ${transferEmail}? You will lose admin role.`)) return;
    try {
      await transferOwnership(transferEmail);
      setMsg('✅ Ownership transferred. Logging out...');
      setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 2000);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  }

  const roleColor = { admin: '#dc2626', user: '#666' };

  return (
    <div>
      {msg && <div style={{ padding: '.7rem 1rem', borderRadius: '.5rem', marginBottom: '1rem', background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontSize: '1.2rem' }}>{msg}</div>}

      {/* Transfer Ownership */}
      {isOwner && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '.7rem' }}>
          <button onClick={() => setShowTransfer(!showTransfer)}
            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '.6rem 1.2rem', borderRadius: '.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '1.2rem' }}>
            🔄 Transfer Ownership
          </button>
          {showTransfer && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '.8rem', alignItems: 'center' }}>
              <input placeholder="Target user email" value={transferEmail} onChange={e => setTransferEmail(e.target.value)}
                style={{ padding: '.6rem 1rem', border: '1px solid #ddd', borderRadius: '.5rem', fontSize: '1.2rem', flex: 1 }} />
              <button onClick={handleTransfer}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '.6rem 1.2rem', borderRadius: '.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '1.2rem' }}>
                Confirm Transfer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Users Table */}
      {loading ? <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Name</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Email</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Role</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Admin Access</th>
                <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Joined</th>
                {isOwner && <th style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf = String(u._id) === String(currentUser?._id);
                return (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f0f0f0', background: isSelf ? '#f0f4ff' : 'transparent' }}>
                    <td style={{ padding: '.7rem', fontWeight: isSelf ? 700 : 400 }}>{u.name} {isSelf && '(You)'}</td>
                    <td style={{ padding: '.7rem' }}>{u.email}</td>
                    <td style={{ padding: '.7rem' }}>
                      <span style={{ padding: '.2rem .6rem', borderRadius: '2rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff', background: roleColor[u.role] || '#999' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '.7rem' }}>
                      {u.canAccessAdmin ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Yes</span> : <span style={{ color: '#999' }}>No</span>}
                    </td>
                    <td style={{ padding: '.7rem', fontSize: '1.1rem', color: '#666' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    {isOwner && (
                      <td style={{ padding: '.7rem' }}>
                        {!isSelf && u.role !== 'admin' && (
                          u.canAccessAdmin ? (
                            <button onClick={() => handleRevoke(u._id)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '.4rem .8rem', borderRadius: '.3rem', cursor: 'pointer', fontSize: '1.1rem' }}>Revoke</button>
                          ) : (
                            <button onClick={() => handleGrant(u._id)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '.4rem .8rem', borderRadius: '.3rem', cursor: 'pointer', fontSize: '1.1rem' }}>Grant</button>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {users.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No users</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
