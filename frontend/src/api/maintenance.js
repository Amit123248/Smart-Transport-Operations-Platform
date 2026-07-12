import { request } from './client.js';
import { store, delay } from './mockStore.js';

// GET /api/maintenance?vehicle_id= -> Maintenance[]
export async function listMaintenance(vehicleId) {
  try {
    return await request(`/maintenance${vehicleId ? `?vehicle_id=${vehicleId}` : ''}`);
  } catch {
    await delay();
    return vehicleId ? store.maintenance.filter((m) => m.vehicle_id === vehicleId) : [...store.maintenance];
  }
}

// POST /api/maintenance -> 201 Maintenance. Side effect: status="Open", vehicle.status -> "In Shop" immediately.
export async function createMaintenance(payload) {
  try {
    return await request('/maintenance', { method: 'POST', body: payload });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const record = { id: store.nextId.maintenance++, status: 'Open', ...payload };
    store.maintenance.push(record);
    const vehicle = store.vehicles.find((v) => v.id === payload.vehicle_id);
    if (vehicle) vehicle.status = 'In Shop';
    return record;
  }
}

// PATCH /api/maintenance/:id/close -> status "Closed", vehicle.status -> "Available" (unless Retired)
export async function closeMaintenance(id) {
  try {
    return await request(`/maintenance/${id}/close`, { method: 'PATCH' });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const record = store.maintenance.find((m) => m.id === id);
    if (!record) {
      const e = new Error('Maintenance record not found.');
      e.status = 404;
      throw e;
    }
    record.status = 'Closed';
    const vehicle = store.vehicles.find((v) => v.id === record.vehicle_id);
    if (vehicle && vehicle.status !== 'Retired') vehicle.status = 'Available';
    return record;
  }
}
