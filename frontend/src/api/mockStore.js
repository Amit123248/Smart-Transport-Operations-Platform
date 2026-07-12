// ============================================================
// In-memory mock store — lets the frontend run standalone before
// the real backend (port 5000) exists. Shapes mirror the API
// contract's DB schema exactly (same field names, same enums).
// Every api/*.js module tries the real endpoint first and only
// falls back to this store on a network error (backend not up yet).
// ============================================================

// NOTE: `region` isn't in the original DB schema (see BACKEND_HANDOFF.md §2) but the
// spec's Dashboard filters ask for one, so it's carried on the mock vehicle records here.
// Flagged in BACKEND_HANDOFF.md as a field to add to the real Vehicle table.
let vehicles = [
  { id: 1, reg_number: 'GJ01AB4521', name: 'VAN-05', type: 'Van', max_load: 500, odometer: 74000, acquisition_cost: 620000, status: 'Available', region: 'West' },
  { id: 2, reg_number: 'GJ01AB9987', name: 'TRUCK-11', type: 'Truck', max_load: 5000, odometer: 182000, acquisition_cost: 2450000, status: 'On Trip', region: 'West' },
  { id: 3, reg_number: 'GJ01AB1120', name: 'MINI-03', type: 'Mini', max_load: 1000, odometer: 66000, acquisition_cost: 410000, status: 'In Shop', region: 'North' },
  { id: 4, reg_number: 'GJ01AB0087', name: 'VAN-09', type: 'Van', max_load: 750, odometer: 241900, acquisition_cost: 540000, status: 'Retired', region: 'East' },
];

let drivers = [
  { id: 1, name: 'Alex', license_number: 'DL-88213', license_category: 'LMV', license_expiry: '2028-12-01', contact: '9876500000', safety_score: 96, status: 'Available' },
  { id: 2, name: 'John', license_number: 'DL-44120', license_category: 'HMV', license_expiry: '2025-03-01', contact: '9822000000', safety_score: 81, status: 'Suspended' },
  { id: 3, name: 'Priya', license_number: 'DL-77031', license_category: 'LMV', license_expiry: '2028-08-01', contact: '9911000000', safety_score: 99, status: 'On Trip' },
  { id: 4, name: 'Suresh', license_number: 'DL-90045', license_category: 'HMV', license_expiry: '2027-01-01', contact: '9744000000', safety_score: 88, status: 'Available' },
];

let trips = [
  { id: 1, source: 'Gandhinagar Depot', destination: 'Ahmedabad Hub', vehicle_id: 2, driver_id: 3, cargo_weight: 700, planned_distance: 38, status: 'Dispatched', final_odometer: null, fuel_consumed: null, created_at: '2026-07-05' },
  { id: 2, source: 'Vatva Industrial Area', destination: 'Sanand Warehouse', vehicle_id: null, driver_id: null, cargo_weight: 300, planned_distance: 22, status: 'Draft', final_odometer: null, fuel_consumed: null, created_at: '2026-07-06' },
  { id: 3, source: 'Mansa', destination: 'Kalol Depot', vehicle_id: 3, driver_id: null, cargo_weight: 150, planned_distance: 15, status: 'Cancelled', final_odometer: null, fuel_consumed: null, created_at: '2026-07-04' },
];

let maintenance = [
  { id: 1, vehicle_id: 1, description: 'Oil Change', status: 'Open', cost: 2500, date: '2026-07-07' },
  { id: 2, vehicle_id: 2, description: 'Engine Repair', status: 'Closed', cost: 18000, date: '2026-07-01' },
  { id: 3, vehicle_id: 3, description: 'Tyre Replace', status: 'Open', cost: 6200, date: '2026-07-06' },
];

let fuelLogs = [
  { id: 1, vehicle_id: 1, liters: 42, cost: 3150, date: '2026-07-05' },
  { id: 2, vehicle_id: 2, liters: 110, cost: 8400, date: '2026-07-06' },
  { id: 3, vehicle_id: 3, liters: 28, cost: 2050, date: '2026-07-06' },
];

let expenses = [
  { id: 1, vehicle_id: 1, type: 'Toll', amount: 120, date: '2026-07-05' },
  { id: 2, vehicle_id: 2, type: 'Toll', amount: 340, date: '2026-07-06' },
];

let users = [
  { id: 1, name: 'Raven K.', email: 'raven.k@transitops.in', password: 'demo1234', role: 'Dispatcher' },
];

let nextId = { vehicles: 5, drivers: 5, trips: 4, maintenance: 4, fuelLogs: 4, expenses: 3, users: 2 };

export const store = {
  vehicles, drivers, trips, maintenance, fuelLogs, expenses, users, nextId,
};

export function delay(ms = 250) {
  return new Promise((res) => setTimeout(res, ms));
}
