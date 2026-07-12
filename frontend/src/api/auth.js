import { request } from './client.js';
import { store, delay } from './mockStore.js';

// POST /api/auth/login  { email, password }  -> { token, user }
export async function login(email, password) {
  try {
    return await request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  } catch (err) {
    // Backend not up yet — fall back to mock auth for demo purposes.
    await delay();
    const user = store.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      const e = new Error('Invalid credentials.');
      e.status = 401;
      throw e;
    }
    const { password: _pw, ...safeUser } = user;
    return { token: 'mock-jwt-token', user: safeUser };
  }
}

// POST /api/auth/signup  { name, email, password, role } -> user (201)
export async function signup({ name, email, password, role }) {
  try {
    return await request('/auth/signup', { method: 'POST', body: { name, email, password, role }, auth: false });
  } catch (err) {
    await delay();
    if (store.users.some((u) => u.email === email)) {
      const e = new Error('An account with this email already exists.');
      e.status = 400;
      throw e;
    }
    const user = { id: store.nextId.users++, name, email, password, role };
    store.users.push(user);
    const { password: _pw, ...safeUser } = user;
    return safeUser;
  }
}
