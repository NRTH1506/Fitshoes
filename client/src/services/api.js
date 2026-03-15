// Centralized API service
// In dev: Vite proxy forwards /api → localhost:8081
// In prod: VITE_API_URL points to the Render backend

const BASE = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
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
  request('/api/me', { credentials: 'include' });

export const updateProfile = (userId, payload) =>
  request('/api/profile', { method: 'PUT', body: JSON.stringify({ userId, ...payload }) });

// ─── Products ─────────────────────────────────────────
export const getProducts = () =>
  request('/api/products');

export const getProduct = (id) =>
  request(`/api/products/${id}`);

export const addProduct = (payload, adminKey) => {
  const headers = {};
  if (adminKey) headers['x-admin-key'] = adminKey;
  return request('/api/products/add', { method: 'POST', body: JSON.stringify(payload), headers });
};

export const deleteProduct = (id) =>
  request(`/api/products/${id}`, { method: 'DELETE' });

// ─── Payment ──────────────────────────────────────────
export const createZaloPayOrder = (amount, items, userId) =>
  request('/api/pay/zalopay', { method: 'POST', body: JSON.stringify({ amount, items, userId }) });

// ─── Chatbot ──────────────────────────────────────────
export const sendChatMessage = (message, userId, isAdmin) =>
  request('/api/chat', { method: 'POST', body: JSON.stringify({ message, userId, isAdmin }) });

// ─── Logs ─────────────────────────────────────────────
export const getLogs = (type) =>
  request(`/api/logs?type=${type}`);

// ─── Aliases (used by page components) ────────────────
export { getProducts as fetchProducts };
export { login as loginUser };
export { register as registerUser };
export { getLogs as fetchLogs };

