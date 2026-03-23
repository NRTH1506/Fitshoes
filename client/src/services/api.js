// Centralized API service
// In dev: Vite proxy forwards /api → localhost:8081
// In prod: VITE_API_URL points to the Render backend

const BASE = import.meta.env.VITE_API_URL || '';

function getStoredAuthToken() {
  return localStorage.getItem('authToken') || '';
}

async function request(endpoint, options = {}) {
  const url = `${BASE}${endpoint}`;
  const token = getStoredAuthToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const config = {
    headers: { 'Content-Type': 'application/json', ...authHeaders, ...options.headers },
    ...options,
  };
  const res = await fetch(url, config);
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'API request failed');
    error.response = { status: res.status, data };
    throw error;
  }
  return { ok: res.ok, status: res.status, data };
}

// ─── Auth ─────────────────────────────────────────────
export const login = (email, password) =>
  request('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const loginGoogle = (credential) =>
  request('/api/login-google', { method: 'POST', body: JSON.stringify({ credential }) });

export const register = (payload) =>
  request('/api/register', { method: 'POST', body: JSON.stringify(payload) });

export const verifyOtp = (email, code) =>
  request('/api/verify-otp', { method: 'POST', body: JSON.stringify({ email, code }) });

export const resendOtp = (email) =>
  request('/api/resend-otp', { method: 'POST', body: JSON.stringify({ email }) });

// ─── User ─────────────────────────────────────────────
export const getMe = () =>
  request('/api/me');

export const updateProfile = (payload) =>
  request('/api/profile', { method: 'PUT', body: JSON.stringify(payload) });

export const uploadAvatar = (formData) => {
  const token = getStoredAuthToken();
  return fetch(`${import.meta.env.VITE_API_URL || ''}/api/profile/upload`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'Avatar upload failed');
      error.response = { status: res.status, data };
      throw error;
    }
    return data;
  });
};

// ─── Products ─────────────────────────────────────────
export const getProducts = () =>
  request('/api/products');

export const getProduct = (id) =>
  request(`/api/products/${id}`);

export const addProduct = (payload) =>
  request('/api/products/add', { method: 'POST', body: JSON.stringify(payload) });

export const deleteProduct = (id) =>
  request(`/api/products/${id}`, { method: 'DELETE' });

// ─── Payment ──────────────────────────────────────────
export const createZaloPayOrder = (amount, items, userId) =>
  request('/api/pay/zalopay', { method: 'POST', body: JSON.stringify({ amount, items, userId }) });

export const queryZaloPayOrder = (appTransId) =>
  request(`/api/pay/zalopay/query/${appTransId}`);

export const fetchUserOrders = (userId) =>
  request(`/api/orders/user/${userId}`);

// ─── Chatbot ──────────────────────────────────────────
export const sendChatMessage = (message, userId, isAdmin) =>
  request('/api/chat', { method: 'POST', body: JSON.stringify({ message, userId, isAdmin }) });

// ─── Logs ─────────────────────────────────────────────
export const getLogs = (params = {}) => {
  if (typeof params === 'string') {
    return request(`/api/logs?type=${encodeURIComponent(params)}`);
  }

  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return request(`/api/logs${qs ? `?${qs}` : ''}`);
};

// ─── Admin ────────────────────────────────────────────
export const fetchAdminUsers = () =>
  request('/api/admin/users');

export const grantAdminAccess = (userId) =>
  request(`/api/admin/users/${userId}/grant`, { method: 'PUT' });

export const revokeAdminAccess = (userId) =>
  request(`/api/admin/users/${userId}/revoke`, { method: 'PUT' });

export const transferOwnership = (targetEmail) =>
  request('/api/admin/transfer-ownership', { method: 'PUT', body: JSON.stringify({ targetEmail }) });

export const fetchAdminOrders = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return request(`/api/admin/orders${qs ? `?${qs}` : ''}`);
};

export const fetchRevenue = (params = {}) => {
  const query = new URLSearchParams();
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  const qs = query.toString();
  return request(`/api/admin/revenue${qs ? `?${qs}` : ''}`);
};

export const updateOrderStatus = (orderId, status) =>
  request(`/api/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

export const deleteUser = (userId) =>
  request(`/api/admin/users/${userId}`, { method: 'DELETE' });

export const getUserById = (userId) =>
  request(`/api/admin/users/${userId}`);

export const setSale = (data) =>
  request('/api/admin/products/sale', { method: 'PUT', body: JSON.stringify(data) });

export const uploadProductImage = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${BASE}/api/admin/products/upload-image`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData
  });
  return { data: await res.json() };
};

export const updateProduct = (id, data) =>
  request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const fetchAdminActivityLogs = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return request(`/api/admin/activity-logs${qs ? `?${qs}` : ''}`);
};

// ─── Aliases (used by page components) ────────────────
export { getProducts as fetchProducts };
export { login as loginUser };
export { register as registerUser };
export { getLogs as fetchLogs };
