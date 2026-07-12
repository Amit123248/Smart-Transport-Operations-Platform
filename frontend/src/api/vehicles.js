import { request } from './client.js';
import { store, delay } from './mockStore.js';

// GET /api/vehicles?status=&type=&region=  -> Vehicle[]
export async function listVehicles(params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v && v !== 'All')).toString();
  try {
    return await request(`/vehicles${qs ? `?${qs}` : ''}`);
  } catch {
    await delay();
    let rows = [...store.vehicles];
    if (params.status && params.status !== 'All') rows = rows.filter((v) => v.status === params.status);
    if (params.type && params.type !== 'All') rows = rows.filter((v) => v.type === params.type);
    return rows;
  }
}

// GET /api/vehicles/available -> Vehicle[] (status === 'Available' only)
// Rule: this is the ONLY list the Trip dropdown should use.
export async function listAvailableVehicles() {
  try {
    return await request('/vehicles/available');
  } catch {
    await delay();
    return store.vehicles.filter((v) => v.status === 'Available');
  }
}

// POST /api/vehicles -> 201 Vehicle (status defaults to "Available"). 400 if reg_number exists.
export async function createVehicle(payload) {
  try {
    return await request('/vehicles', { method: 'POST', body: payload });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    if (store.vehicles.some((v) => v.reg_number === payload.reg_number)) {
      const e = new Error('reg_number already exists.');
      e.status = 400;
      throw e;
    }
    const vehicle = { id: store.nextId.vehicles++, odometer: 0, status: 'Available', ...payload };
    store.vehicles.push(vehicle);
    return vehicle;
  }
}

// PUT /api/vehicles/:id -> Vehicle
export async function updateVehicle(id, payload) {
  try {
    return await request(`/vehicles/${id}`, { method: 'PUT', body: payload });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const v = store.vehicles.find((x) => x.id === id);
    Object.assign(v, payload);
    return v;
  }
}

// DELETE /api/vehicles/:id
export async function deleteVehicle(id) {
  try {
    return await request(`/vehicles/${id}`, { method: 'DELETE' });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    store.vehicles = store.vehicles.filter((x) => x.id !== id);
    return { ok: true };
  }
}

// GET /api/vehicles/:id/cost-summary -> { vehicle_id, total_fuel_cost, total_maintenance_cost, total_expenses, total_operational_cost }
export async function getVehicleCostSummary(id) {
  try {
    return await request(`/vehicles/${id}/cost-summary`);
  } catch {
    await delay();
    const total_fuel_cost = store.fuelLogs.filter((f) => f.vehicle_id === id).reduce((s, f) => s + f.cost, 0);
    const total_maintenance_cost = store.maintenance.filter((m) => m.vehicle_id === id).reduce((s, m) => s + m.cost, 0);
    const total_expenses = store.expenses.filter((e) => e.vehicle_id === id).reduce((s, e) => s + e.amount, 0);
    return {
      vehicle_id: id,
      total_fuel_cost,
      total_maintenance_cost,
      total_expenses,
      total_operational_cost: total_fuel_cost + total_maintenance_cost,
    };
  }
}
