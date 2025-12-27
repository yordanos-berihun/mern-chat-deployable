// Centralized API client
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000'; // no trailing /api

function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const isForm = options.body instanceof FormData;

  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // send HttpOnly cookies (refresh token)
    ...options,
    headers
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with ${res.status}`);
  }

  // try parse json, otherwise return raw response
  const text = await res.text().catch(() => '');
  try { return JSON.parse(text); } catch { return text; }
}

export { API_BASE };

export const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) => apiRequest(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  del: (path) => apiRequest(path, { method: 'DELETE' }),
};
