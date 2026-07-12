import { request } from './client.js';
import { store, delay } from './mockStore.js';

function findOr404(arr, id, label) {
  const item = arr.find((x) => x.id === id);
  if (!item) {
    const e = new Error(`${label} not found.`);
    e.status = 404;
    throw e;
  }
  return item;
}

// GET /api/trips?status= -> Trip[]
export async function listTrips(status) {
  try {
    return await request(`/trips${status ? `?status=${status}` : ''}`);
  } catch {
    await delay();
    return status ? store.trips.filter((t) => t.status === status) : [...store.trips];
  }
}

// POST /api/trips -> 201 Trip (status = "Draft")
// Validation (400 if violated): cargo_weight <= vehicle.max_load,
// vehicle.status === 'Available', driver.status === 'Available',
// driver.license_expiry in the future.
export async function createTrip(payload) {
  try {
    return await request('/trips', { method: 'POST', body: payload });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const vehicle = findOr404(store.vehicles, payload.vehicle_id, 'Vehicle');
    const driver = findOr404(store.drivers, payload.driver_id, 'Driver');

    if (payload.cargo_weight > vehicle.max_load) {
      throw badRequest(`Capacity exceeded by ${payload.cargo_weight - vehicle.max_load} kg — dispatch blocked.`);
    }
    if (vehicle.status !== 'Available') throw badRequest('Vehicle is not Available.');
    if (driver.status !== 'Available') throw badRequest('Driver is not Available.');
    if (new Date(driver.license_expiry) <= new Date()) throw badRequest("Driver's license has expired.");

    const trip = {
      id: store.nextId.trips++,
      status: 'Draft',
      final_odometer: null,
      fuel_consumed: null,
      created_at: new Date().toISOString().slice(0, 10),
      ...payload,
    };
    store.trips.push(trip);
    return trip;
  }
}

function badRequest(message) {
  const e = new Error(message);
  e.status = 400;
  return e;
}

// PATCH /api/trips/:id/dispatch -> trip.status="Dispatched", vehicle&driver -> "On Trip"
export async function dispatchTrip(id) {
  try {
    return await request(`/trips/${id}/dispatch`, { method: 'PATCH' });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const trip = findOr404(store.trips, id, 'Trip');
    const vehicle = store.vehicles.find((v) => v.id === trip.vehicle_id);
    const driver = store.drivers.find((d) => d.id === trip.driver_id);
    trip.status = 'Dispatched';
    if (vehicle) vehicle.status = 'On Trip';
    if (driver) driver.status = 'On Trip';
    return trip;
  }
}

// PATCH /api/trips/:id/complete { final_odometer, fuel_consumed }
// -> trip "Completed", vehicle & driver "Available", vehicle.odometer updated
export async function completeTrip(id, { final_odometer, fuel_consumed }) {
  try {
    return await request(`/trips/${id}/complete`, { method: 'PATCH', body: { final_odometer, fuel_consumed } });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const trip = findOr404(store.trips, id, 'Trip');
    const vehicle = store.vehicles.find((v) => v.id === trip.vehicle_id);
    const driver = store.drivers.find((d) => d.id === trip.driver_id);
    trip.status = 'Completed';
    trip.final_odometer = final_odometer;
    trip.fuel_consumed = fuel_consumed;
    if (vehicle) { vehicle.status = 'Available'; vehicle.odometer = final_odometer; }
    if (driver) driver.status = 'Available';
    return trip;
  }
}

// PATCH /api/trips/:id/cancel -> trip "Cancelled", vehicle & driver "Available" (only if was Dispatched)
export async function cancelTrip(id) {
  try {
    return await request(`/trips/${id}/cancel`, { method: 'PATCH' });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const trip = findOr404(store.trips, id, 'Trip');
    const wasDispatched = trip.status === 'Dispatched';
    trip.status = 'Cancelled';
    if (wasDispatched) {
      const vehicle = store.vehicles.find((v) => v.id === trip.vehicle_id);
      const driver = store.drivers.find((d) => d.id === trip.driver_id);
      if (vehicle) vehicle.status = 'Available';
      if (driver) driver.status = 'Available';
    }
    return trip;
  }
}
