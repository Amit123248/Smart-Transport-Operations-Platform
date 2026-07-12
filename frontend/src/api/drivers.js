import { request } from './client.js';
import { store, delay } from './mockStore.js';

// GET /api/drivers -> Driver[]
export async function listDrivers() {
  try {
    return await request('/drivers');
  } catch {
    await delay();
    return [...store.drivers];
  }
}

// GET /api/drivers/available -> Driver[]
// Rule: only status === 'Available' AND license_expiry in the future AND status !== 'Suspended'
export async function listAvailableDrivers() {
  try {
    return await request('/drivers/available');
  } catch {
    await delay();
    const today = new Date();
    return store.drivers.filter(
      (d) => d.status === 'Available' && d.status !== 'Suspended' && new Date(d.license_expiry) > today
    );
  }
}

// POST /api/drivers -> 201 Driver (status defaults "Available", safety_score defaults 100)
export async function createDriver(payload) {
  try {
    return await request('/drivers', { method: 'POST', body: payload });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const driver = { id: store.nextId.drivers++, status: 'Available', safety_score: 100, ...payload };
    store.drivers.push(driver);
    return driver;
  }
}

// PUT /api/drivers/:id -> Driver
export async function updateDriver(id, payload) {
  try {
    return await request(`/drivers/${id}`, { method: 'PUT', body: payload });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const d = store.drivers.find((x) => x.id === id);
    Object.assign(d, payload);
    return d;
  }
}

// DELETE /api/drivers/:id
export async function deleteDriver(id) {
  try {
    return await request(`/drivers/${id}`, { method: 'DELETE' });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    store.drivers = store.drivers.filter((x) => x.id !== id);
    return { ok: true };
  }
}
