// ============================================================
// TransitOps — API client
// Matches "TransitOps — API & Data Contract" exactly:
//   - Base URL: http://localhost:5000/api
//   - Auth: JWT in header  Authorization: Bearer <token>
//   - snake_case JSON fields everywhere
//   - Dates: ISO 8601 string ("2026-07-12")
//   - Errors: { "error": "message here" } with proper HTTP status
//   - List endpoints return a plain JSON array (never { data: [...] })
//   - Single-object endpoints return the object directly (never wrapped)
//
// USE_MOCK: while the backend isn't running yet, every request
// transparently falls back to in-memory mock data (see mockData.js)
// so the frontend is fully demoable on its own. Once the real API
// at localhost:5000 responds, set USE_MOCK = false (or just leave
// it — real fetches are attempted first automatically, see below).
// ============================================================

export const BASE_URL = 'http://localhost:5000/api';

export function getToken() {
  return localStorage.getItem('transitops_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('transitops_token', token);
  else localStorage.removeItem('transitops_token');
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Core request helper. Always sends/expects snake_case JSON.
 * Throws ApiError with the backend's { error } message on failure.
 */
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const text = await res.text();
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = null; }
  }

  if (!res.ok) {
    const message = payload?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return payload;
}

export { ApiError };
