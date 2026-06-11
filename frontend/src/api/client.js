function resolveApiBase() {
  // 1. Environment variable takes priority (set via VITE_API_URL in .env or Vercel env vars)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Auto-detect Vercel production by hostname
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // On Vercel, backend is served under /_/backend via experimentalServices
    return '/_/backend';
  }

  // 3. Local development — Vite proxy handles /api → http://localhost:5000
  return '';
}

const API_BASE = resolveApiBase();

function getMeaningfulMessage(status, endpoint) {
  if (status === 405) {
    return 'Authentication endpoint misconfigured. Unable to contact authentication service. Please try again later.';
  }
  if (status === 0 || status === 404) {
    if (endpoint.includes('/auth/')) {
      return 'Authentication service unreachable. Please try again later.';
    }
    return 'Service temporarily unavailable. Please try again later.';
  }
  return null;
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { ...options, headers };
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (options.body) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(options.body);
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, config);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = getMeaningfulMessage(res.status, endpoint) || data?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};