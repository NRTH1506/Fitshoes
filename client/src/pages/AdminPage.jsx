import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchProducts, addProduct, deleteProduct, updateProduct, uploadProductImage,
  fetchAdminUsers, grantAdminAccess, revokeAdminAccess, transferOwnership,
  fetchAdminOrders, fetchRevenue, updateOrderStatus, deleteUser, getUserById, setSale,
  fetchAdminActivityLogs
} from '../services/api';
import { resolveImagePath } from '../utils/images';
import { formatPrice } from '../utils/formatPrice';

const TABS = ['shop', 'orders', 'users', 'activity'];
const CATEGORIES = ['running', 'gym', 'casual', 'sandals', 'boots', 'other'];
const SIZES = [36, 37, 38, 39, 40, 41, 42, 43];

export default function AdminPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState('shop');

  useEffect(() => { document.title = `${t('admin.title')} — FitShoes`; }, []);

  const tabLabels = { shop: '🛍️ Shop Management', orders: '🧾 Order', users: '👥 Users', activity: '📋 Activity Logs' };
  const tabStyle = (key) => ({
    padding: '.8rem 2rem', borderRadius: '2rem 2rem 0 0', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '1.4rem',
    background: tab === key ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f0f0f0',
    color: tab === key ? '#fff' : '#555', transition: 'all .2s'
  });

  return (
    <section style={{ padding: '2rem 4%', minHeight: '70vh' }}>
      <h2 style={{ fontSize: '2.6rem', color: 'var(--helping-color)', marginBottom: '1.5rem' }}>{t('admin.title')}</h2>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '0' }}>
        {TABS.map((k) => <button key={k} onClick={() => setTab(k)} style={tabStyle(k)}>{tabLabels[k]}</button>)}
      </div>
      <div style={{ background: '#fff', borderRadius: '0 1rem 1rem 1rem', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: '50vh' }}>
        {tab === 'shop' && <ShopTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'users' && <UsersTab user={user} />}
        {tab === 'activity' && <ActivityLogsTab />}
      </div>
    </section>
  );
}

/* ═══════════════════ SHOP MANAGEMENT TAB ═══════════════════ */
function ShopTab() {
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saleModal, setSaleModal] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadProducts(); }, []);
  async function loadProducts() {
    try { const res = await fetchProducts(); setProducts(res.data?.data || []); } catch {}
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); loadProducts(); } catch {}
  }

  return (
    <div>
      {msg && <div style={{ padding: '.6rem 1rem', borderRadius: '.5rem', marginBottom: '1rem', background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontSize: '1.2rem' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => { setShowAdd(true); setEditProduct(null); }} style={btnPrimary}>➕ Add Product</button>
        <button onClick={() => setSaleModal({ mode: 'category' })} style={{ ...btnPrimary, background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>🏷️ Set Sale</button>
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editProduct) && (
        <ProductModal product={editProduct} onClose={() => { setShowAdd(false); setEditProduct(null); }}
          onSaved={(m) => { setMsg(m); loadProducts(); setShowAdd(false); setEditProduct(null); }} />
      )}

      {/* Sale Modal */}
      {saleModal && <SaleModal onClose={() => setSaleModal(null)} products={products} onDone={(m) => { setMsg(m); loadProducts(); setSaleModal(null); }} />}

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {products.map(p => (
          <div key={p._id || p.id} style={{ border: '1px solid #eee', borderRadius: '.6rem', overflow: 'hidden', position: 'relative' }}>
            {p.salePrice && <span style={{ position: 'absolute', top: '.5rem', left: '.5rem', background: '#dc2626', color: '#fff', padding: '.2rem .5rem', borderRadius: '.3rem', fontSize: '1rem', fontWeight: 700, zIndex: 2 }}>SALE</span>}
            <img src={resolveImagePath(p.images?.[0] || '')} style={{ width: '100%', height: '150px', objectFit: 'cover' }} alt="" />
            <div style={{ padding: '.8rem' }}>
              <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '.2rem' }}>{p.title_vi || p.title}</div>
              <div style={{ fontSize: '1.1rem', color: '#667eea', marginBottom: '.2rem' }}>
                {p.salePrice ? <><span style={{ color: '#dc2626', fontWeight: 700 }}>{formatPrice(p.salePrice, p.currency)}</span> <span style={{ textDecoration: 'line-through', color: '#999' }}>{formatPrice(p.price, p.currency)}</span></> : formatPrice(p.price, p.currency)}
              </div>
              <div style={{ fontSize: '1rem', color: '#888' }}>{p.category || 'other'} · {p.gender}</div>
              <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem' }}>
                <button onClick={() => setEditProduct(p)} style={{ flex: 1, background: '#667eea', color: '#fff', border: 'none', padding: '.4rem', borderRadius: '.3rem', cursor: 'pointer', fontSize: '1.1rem' }}>Edit</button>
                <button onClick={() => handleDelete(p._id || p.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '.4rem .6rem', borderRadius: '.3rem', cursor: 'pointer', fontSize: '1.1rem' }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <div style={{ color: '#999', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>No products</div>}
      </div>
    </div>
  );
}

/* ─── Product Add/Edit Modal ─── */
function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    title_vi: product?.title_vi || '', title: product?.title || '', price: product?.price || '',
    brand: product?.brand || '', description_vi: product?.description_vi || '',
    gender: product?.gender || 'unisex', category: product?.category || 'other',
    images: product?.images || [],
    inventory: product?.inventory?.length ? product.inventory : SIZES.map(s => ({ size: s, quantity: 0 }))
  });
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadProductImage(file);
      if (res.data?.imageUrl) set('images', [...form.images, res.data.imageUrl]);
    } catch {} finally { setUploading(false); }
  }

  function removeImage(idx) {
    set('images', form.images.filter((_, i) => i !== idx));
  }

  function updateInventory(idx, qty) {
    const inv = [...form.inventory];
    inv[idx] = { ...inv[idx], quantity: Math.max(0, Number(qty) || 0) };
    set('inventory', inv);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = { ...form, title: form.title || form.title_vi, price: Number(form.price) };
    try {
      if (isEdit) { await updateProduct(product._id || product.id, data); onSaved('✅ Product updated'); }
      else { await addProduct(data); onSaved('✅ Product added'); }
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  }

  const inp = { width: '100%', padding: '.7rem', border: '1px solid #ddd', borderRadius: '.5rem', fontSize: '1.2rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '3rem', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', width: '700px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.8rem', color: 'var(--main-color)' }}>{isEdit ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
          <input placeholder="Product name (Vietnamese)" value={form.title_vi} onChange={e => set('title_vi', e.target.value)} style={inp} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
            <input placeholder="Price (VND)" type="number" value={form.price} onChange={e => set('price', e.target.value)} style={inp} required />
            <input placeholder="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} style={inp} />
          </div>
          <textarea placeholder="Description" value={form.description_vi} onChange={e => set('description_vi', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
            <select value={form.gender} onChange={e => set('gender', e.target.value)} style={inp}>
              <option value="unisex">Unisex</option><option value="male">Male</option><option value="female">Female</option>
            </select>
            <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {/* Images */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '.3rem', display: 'block' }}>Images</label>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              {form.images.map((img, i) => (
                <div key={i} style={{ position: 'relative', width: '70px', height: '70px' }}>
                  <img src={resolveImagePath(img)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '.3rem' }} alt="" />
                  <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '1rem', cursor: 'pointer', lineHeight: '20px', padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            {uploading && <span style={{ color: '#667eea', fontSize: '1.1rem' }}>Uploading...</span>}
          </div>

          {/* Inventory per size */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '.5rem', display: 'block' }}>Inventory (per size)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem' }}>
              {form.inventory.map((item, i) => (
                <div key={item.size} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', border: '1px solid #eee', padding: '.4rem', borderRadius: '.3rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem', minWidth: '30px' }}>{item.size}</span>
                  <input type="number" min="0" value={item.quantity} onChange={e => updateInventory(i, e.target.value)}
                    style={{ width: '60px', padding: '.3rem', border: '1px solid #ddd', borderRadius: '.3rem', fontSize: '1.1rem' }} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" style={btnPrimary}>{isEdit ? 'Save Changes' : 'Add Product'}</button>
        </form>
      </div>
    </div>
  );
}

/* ─── Sale Modal ─── */
function SaleModal({ onClose, products, onDone }) {
  const [mode, setMode] = useState('category');
  const [category, setCategory] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [salePrice, setSalePrice] = useState('');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [clearSale, setClearSale] = useState(false);

  function toggleProduct(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    const data = { salePrice: Number(salePrice), saleEndDate: saleEndDate || null, clearSale };
    if (mode === 'category') data.category = category;
    else data.productIds = selectedIds;
    try {
      const res = await setSale(data);
      onDone(`✅ ${res.data?.message || 'Sale updated'}`);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  }

  const inp = { padding: '.6rem', border: '1px solid #ddd', borderRadius: '.4rem', fontSize: '1.2rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '5rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', width: '500px', maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.6rem', color: '#f59e0b' }}>🏷️ Set Sale</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          <button onClick={() => setMode('category')} style={{ ...inp, background: mode === 'category' ? '#667eea' : '#f0f0f0', color: mode === 'category' ? '#fff' : '#333', border: 'none', cursor: 'pointer', fontWeight: 600 }}>By Category</button>
          <button onClick={() => setMode('products')} style={{ ...inp, background: mode === 'products' ? '#667eea' : '#f0f0f0', color: mode === 'products' ? '#fff' : '#333', border: 'none', cursor: 'pointer', fontWeight: 600 }}>By Products</button>
        </div>

        {mode === 'category' ? (
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, width: '100%', marginBottom: '.8rem' }}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            <option value="male">Men's</option><option value="female">Women's</option>
          </select>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '.4rem', padding: '.5rem', marginBottom: '.8rem' }}>
            {products.map(p => (
              <label key={p._id || p.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedIds.includes(p._id || p.id)} onChange={() => toggleProduct(p._id || p.id)} />
                <span style={{ fontSize: '1.2rem' }}>{p.title_vi} — {formatPrice(p.price, p.currency)}</span>
              </label>
            ))}
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.8rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={clearSale} onChange={e => setClearSale(e.target.checked)} />
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Clear sale (remove discount)</span>
        </label>

        {!clearSale && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '1rem' }}>
            <input type="number" placeholder="Sale price (VND)" value={salePrice} onChange={e => setSalePrice(e.target.value)} style={inp} />
            <input type="date" value={saleEndDate} onChange={e => setSaleEndDate(e.target.value)} style={inp} />
          </div>
        )}

        <button onClick={handleSubmit} style={btnPrimary}>{clearSale ? 'Clear Sale' : 'Apply Sale'}</button>
      </div>
    </div>
  );
}

/* ═══════════════════ ORDERS TAB ═══════════════════ */
function OrdersTab() {
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
    try { const res = await fetchAdminOrders({ ...filters, page, limit }); setOrders(res.data?.orders || []); setTotal(res.data?.total || 0); } catch {} finally { setLoading(false); }
  }
  async function loadRevenue() {
    try { const res = await fetchRevenue({ startDate: filters.startDate, endDate: filters.endDate }); setRevenue(res.data?.revenue || null); } catch {}
  }
  async function handleStatusChange(id, status) { try { await updateOrderStatus(id, status); loadOrders(); loadRevenue(); } catch {} }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const cardStyle = { background: 'linear-gradient(135deg,#667eea22,#764ba222)', padding: '1.2rem', borderRadius: '.8rem', textAlign: 'center', flex: 1, minWidth: '140px' };
  const statusColor = { SUCCESS: '#16a34a', PENDING: '#f59e0b', FAILED: '#dc2626' };

  return (
    <div>
      {revenue && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={cardStyle}><div style={{ fontSize: '1.1rem', color: '#666' }}>Total Revenue</div><div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatPrice(revenue.total)}</div></div>
          <div style={cardStyle}><div style={{ fontSize: '1.1rem', color: '#666' }}>Orders</div><div style={{ fontSize: '2rem', fontWeight: 800 }}>{revenue.orderCount}</div></div>
          <div style={cardStyle}><div style={{ fontSize: '1.1rem', color: '#666' }}>Avg Order</div><div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatPrice(revenue.avgOrderValue)}</div></div>
          <div style={cardStyle}><div style={{ fontSize: '1.1rem', color: '#666' }}>Today</div><div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatPrice(revenue.todayRevenue)}</div></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '.8rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }} style={filterInp}>
          <option value="">All Status</option><option value="SUCCESS">✅ Success</option><option value="PENDING">⏳ Pending</option><option value="FAILED">❌ Failed</option>
        </select>
        <input type="date" value={filters.startDate} onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }} style={filterInp} />
        <input type="date" value={filters.endDate} onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }} style={filterInp} />
        <input placeholder="Search by Order ID or User ID" value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} style={{ ...filterInp, flex: 1, minWidth: '180px' }} />
      </div>

      {loading ? <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem' }}>
            <thead><tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
              {['Order ID', 'User', 'Amount', 'Items', 'Status', 'Date', 'Action'].map(h => <th key={h} style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '.7rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>{o.app_trans_id}</td>
                  <td style={{ padding: '.7rem' }}>{o.userId || 'guest'}</td>
                  <td style={{ padding: '.7rem', fontWeight: 600 }}>{formatPrice(o.amount)}</td>
                  <td style={{ padding: '.7rem' }}>{Array.isArray(o.items) ? o.items.length : 0}</td>
                  <td style={{ padding: '.7rem' }}><span style={{ padding: '.3rem .7rem', borderRadius: '2rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff', background: statusColor[o.status] || '#999' }}>{o.status}</span></td>
                  <td style={{ padding: '.7rem', fontSize: '1.1rem', color: '#666' }}>{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '.7rem' }}>
                    <select value={o.status} onChange={e => handleStatusChange(o._id, e.target.value)} style={{ padding: '.3rem .5rem', border: '1px solid #ddd', borderRadius: '.3rem', fontSize: '1.1rem' }}>
                      <option value="PENDING">PENDING</option><option value="SUCCESS">SUCCESS</option><option value="FAILED">FAILED</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.2rem', alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={pageBtnStyle}>← Prev</button>
          <span style={{ fontSize: '1.2rem' }}>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pageBtnStyle}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ USERS TAB ═══════════════════ */
function UsersTab({ user: currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);

  const isOwner = currentUser?.role === 'admin';

  useEffect(() => { loadUsers(); }, []);
  async function loadUsers() {
    setLoading(true);
    try { const res = await fetchAdminUsers(); setUsers(res.data?.users || []); } catch {} finally { setLoading(false); }
  }

  const sorted = [...users].sort((a, b) => {
    const va = String(a[sortBy] || '').toLowerCase();
    const vb = String(b[sortBy] || '').toLowerCase();
    return va.localeCompare(vb);
  });

  async function handleGrant(id) { try { await grantAdminAccess(id); setMsg('✅ Access granted'); loadUsers(); } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); } }
  async function handleRevoke(id) { if (!confirm('Revoke?')) return; try { await revokeAdminAccess(id); setMsg('✅ Revoked'); loadUsers(); } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); } }
  async function handleDeleteUser(id) { if (!confirm('Delete this user permanently?')) return; try { await deleteUser(id); setMsg('✅ User deleted'); setSelectedUser(null); loadUsers(); } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); } }

  async function handleTransfer() {
    if (!transferEmail.trim() || !confirm(`Transfer ownership to ${transferEmail}? You will lose admin role.`)) return;
    try { await transferOwnership(transferEmail); setMsg('✅ Ownership transferred. Logging out...'); setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 2000); }
    catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  }

  async function viewUser(id) {
    try { const res = await getUserById(id); setSelectedUser(res.data?.user || null); } catch {}
  }

  const roleColor = { admin: '#dc2626', user: '#666' };

  return (
    <div>
      {msg && <div style={{ padding: '.7rem 1rem', borderRadius: '.5rem', marginBottom: '1rem', background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontSize: '1.2rem' }}>{msg}</div>}

      {/* Sort + Transfer */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Sort by:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={filterInp}>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </div>
        {isOwner && (
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => setShowTransfer(!showTransfer)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '.6rem 1.2rem', borderRadius: '.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '1.2rem' }}>🔄 Transfer Ownership</button>
          </div>
        )}
      </div>
      {showTransfer && (
        <div style={{ display: 'flex', gap: '.8rem', marginBottom: '1rem', padding: '1rem', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '.5rem' }}>
          <input placeholder="Target user email" value={transferEmail} onChange={e => setTransferEmail(e.target.value)} style={{ ...filterInp, flex: 1 }} />
          <button onClick={handleTransfer} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '.6rem 1.2rem', borderRadius: '.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '1.2rem' }}>Confirm</button>
        </div>
      )}

      {/* User Detail Panel */}
      {selectedUser && (
        <div style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '.7rem', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.5rem', color: 'var(--main-color)' }}>User Details</h4>
            <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '1.2rem' }}>
            {[['Name', selectedUser.name], ['Email', selectedUser.email], ['Phone', selectedUser.phone || '—'], ['Gender', selectedUser.gender || '—'],
              ['Address', selectedUser.address || '—'], ['Role', selectedUser.role], ['Admin Access', selectedUser.canAccessAdmin ? 'Yes' : 'No'],
              ['Bio', selectedUser.bio || '—'], ['Joined', new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')]
            ].map(([k, v]) => <div key={k}><strong>{k}:</strong> {v}</div>)}
          </div>
          {selectedUser.role !== 'admin' && isOwner && (
            <button onClick={() => handleDeleteUser(selectedUser._id)} style={{ marginTop: '1rem', background: '#dc2626', color: '#fff', border: 'none', padding: '.6rem 1.2rem', borderRadius: '.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '1.2rem' }}>🗑 Delete User</button>
          )}
        </div>
      )}

      {/* Users Table */}
      {loading ? <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem' }}>
            <thead><tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
              {['Name', 'Email', 'Phone', 'Role', 'Admin Access', 'Joined', ...(isOwner ? ['Action'] : [])].map(h => <th key={h} style={{ padding: '.8rem', borderBottom: '2px solid #eee' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {sorted.map(u => {
                const isSelf = String(u._id) === String(currentUser?._id);
                return (
                  <tr key={u._id} onClick={() => viewUser(u._id)} style={{ borderBottom: '1px solid #f0f0f0', background: isSelf ? '#f0f4ff' : 'transparent', cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => { if (!isSelf) e.currentTarget.style.background = '#f8f8ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSelf ? '#f0f4ff' : 'transparent'; }}>
                    <td style={{ padding: '.7rem', fontWeight: isSelf ? 700 : 400 }}>{u.name} {isSelf && '(You)'}</td>
                    <td style={{ padding: '.7rem' }}>{u.email}</td>
                    <td style={{ padding: '.7rem' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '.7rem' }}><span style={{ padding: '.2rem .6rem', borderRadius: '2rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff', background: roleColor[u.role] || '#999' }}>{u.role}</span></td>
                    <td style={{ padding: '.7rem' }}>{u.canAccessAdmin ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Yes</span> : <span style={{ color: '#999' }}>No</span>}</td>
                    <td style={{ padding: '.7rem', fontSize: '1.1rem', color: '#666' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    {isOwner && (
                      <td style={{ padding: '.7rem' }} onClick={e => e.stopPropagation()}>
                        {!isSelf && u.role !== 'admin' && (
                          u.canAccessAdmin
                            ? <button onClick={() => handleRevoke(u._id)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '.4rem .8rem', borderRadius: '.3rem', cursor: 'pointer', fontSize: '1.1rem' }}>Revoke</button>
                            : <button onClick={() => handleGrant(u._id)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '.4rem .8rem', borderRadius: '.3rem', cursor: 'pointer', fontSize: '1.1rem' }}>Grant</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ ACTIVITY LOGS TAB ═══════════════════ */
function ActivityLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 20;

  useEffect(() => { loadLogs(); }, [page, search]);
  async function loadLogs() {
    setLoading(true);
    try { const res = await fetchAdminActivityLogs({ page, limit, search }); setLogs(res.data?.logs || []); setTotal(res.data?.total || 0); } catch {} finally { setLoading(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const actionColors = {
    GRANT_ACCESS: '#16a34a', REVOKE_ACCESS: '#f59e0b', TRANSFER_OWNERSHIP: '#dc2626',
    DELETE_USER: '#dc2626', UPDATE_ORDER_STATUS: '#667eea', SET_SALE: '#f59e0b', CLEAR_SALE: '#999',
    ADD_PRODUCT: '#16a34a', UPDATE_PRODUCT: '#667eea', DELETE_PRODUCT: '#dc2626'
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '.8rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input placeholder="Search by action, email, or target..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ ...filterInp, flex: 1 }} />
        <span style={{ fontSize: '1.2rem', color: '#666' }}>{total} entries</span>
      </div>

      {loading ? <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {logs.map((log, i) => (
            <div key={log._id || i} style={{ display: 'grid', gridTemplateColumns: '160px 200px 1fr 120px', gap: '1rem', alignItems: 'center', padding: '.8rem 1rem', background: i % 2 === 0 ? '#f8f9fa' : '#fff', borderRadius: '.4rem', fontSize: '1.2rem' }}>
              <span style={{ color: actionColors[log.action] || '#333', fontWeight: 700, fontSize: '1.1rem' }}>{log.action}</span>
              <span style={{ color: '#555' }}>{log.adminEmail}</span>
              <span style={{ color: '#777', fontSize: '1.1rem' }}>
                {log.targetType && <><strong>{log.targetType}</strong>: {log.targetId} </>}
                {log.details && <span style={{ color: '#999' }}>— {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</span>}
              </span>
              <span style={{ color: '#999', fontSize: '1rem', textAlign: 'right' }}>
                {log.ip && <span title="IP" style={{ marginRight: '.3rem' }}>🌐</span>}
                {new Date(log.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
          ))}
          {logs.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No activity logs yet</div>}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.2rem', alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={pageBtnStyle}>← Prev</button>
          <span style={{ fontSize: '1.2rem' }}>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={pageBtnStyle}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ═══════ Shared Styles ═══════ */
const btnPrimary = { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '.8rem 1.5rem', borderRadius: '.7rem', fontSize: '1.3rem', fontWeight: 700, border: 'none', cursor: 'pointer', width: '100%' };
const filterInp = { padding: '.6rem 1rem', border: '1px solid #ddd', borderRadius: '.5rem', fontSize: '1.2rem' };
const pageBtnStyle = { padding: '.5rem 1rem', border: '1px solid #ddd', borderRadius: '.4rem', cursor: 'pointer', fontSize: '1.2rem' };
