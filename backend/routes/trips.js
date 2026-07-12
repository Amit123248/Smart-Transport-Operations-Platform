const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken); // every trip route requires login

// GET /api/trips?status=Draft -> Trip[]
router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM trips WHERE 1=1';
  const params = [];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY id DESC';
  const trips = db.prepare(query).all(...params);
  res.json(trips);
});

// GET /api/trips/:id
router.get('/:id', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// POST /api/trips -> 201 Trip (status = "Draft")
// Business rules (all enforced server-side, never trust the client):
//   - vehicle and driver must exist
//   - cargo_weight must not exceed vehicle.max_load
//   - vehicle.status must be "Available" (also blocks vehicles already On Trip/In Shop/Retired)
//   - driver.status must be "Available" (also blocks Suspended/On Trip/Off Duty)
//   - driver.license_expiry must be in the future
// Only "Dispatcher" role may create trips (mirrors src/permissions.js RBAC matrix).
router.post('/', requireRole('Dispatcher'), (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.body;

  if (!source || !destination || !vehicle_id || !driver_id || cargo_weight == null || planned_distance == null) {
    return res.status(400).json({
      error: 'source, destination, vehicle_id, driver_id, cargo_weight, and planned_distance are all required',
    });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  if (cargo_weight > vehicle.max_load) {
    return res.status(400).json({
      error: `Capacity exceeded by ${cargo_weight - vehicle.max_load} kg — dispatch blocked.`,
    });
  }
  if (vehicle.status !== 'Available') {
    return res.status(400).json({ error: 'Vehicle is not Available.' });
  }
  if (driver.status !== 'Available') {
    return res.status(400).json({ error: 'Driver is not Available.' });
  }
  if (new Date(driver.license_expiry) <= new Date()) {
    return res.status(400).json({ error: "Driver's license has expired." });
  }

  const result = db.prepare(
    `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Draft')`
  ).run(source, destination, vehicle_id, driver_id, cargo_weight, planned_distance);

  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(trip);
});

// PATCH /api/trips/:id/dispatch
// trip -> Dispatched, vehicle -> On Trip, driver -> On Trip (single transaction)
router.patch('/:id/dispatch', requireRole('Dispatcher'), (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'Draft') {
    return res.status(400).json({ error: `Trip cannot be dispatched from status "${trip.status}".` });
  }

  // Re-validate at dispatch time too, in case the vehicle/driver state changed
  // between trip creation and dispatch (e.g. driver got Suspended in the meantime).
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(trip.vehicle_id);
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(trip.driver_id);
  if (!vehicle || vehicle.status !== 'Available') {
    return res.status(400).json({ error: 'Vehicle is no longer Available.' });
  }
  if (!driver || driver.status !== 'Available') {
    return res.status(400).json({ error: 'Driver is no longer Available.' });
  }
  if (new Date(driver.license_expiry) <= new Date()) {
    return res.status(400).json({ error: "Driver's license has expired." });
  }

  const dispatch = db.transaction(() => {
    db.prepare("UPDATE trips SET status = 'Dispatched' WHERE id = ?").run(trip.id);
    db.prepare("UPDATE vehicles SET status = 'On Trip' WHERE id = ?").run(trip.vehicle_id);
    db.prepare("UPDATE drivers SET status = 'On Trip' WHERE id = ?").run(trip.driver_id);
  });
  dispatch();

  const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id);
  res.json(updated);
});

// PATCH /api/trips/:id/complete { final_odometer, fuel_consumed }
// trip -> Completed, vehicle & driver -> Available, vehicle.odometer -> final_odometer
router.patch('/:id/complete', requireRole('Dispatcher'), (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'Dispatched') {
    return res.status(400).json({ error: `Trip cannot be completed from status "${trip.status}".` });
  }

  const { final_odometer, fuel_consumed } = req.body;
  if (final_odometer == null || fuel_consumed == null) {
    return res.status(400).json({ error: 'final_odometer and fuel_consumed are required' });
  }
  if (final_odometer < 0 || fuel_consumed < 0) {
    return res.status(400).json({ error: 'final_odometer and fuel_consumed must not be negative' });
  }

  const complete = db.transaction(() => {
    db.prepare(
      "UPDATE trips SET status = 'Completed', final_odometer = ?, fuel_consumed = ? WHERE id = ?"
    ).run(final_odometer, fuel_consumed, trip.id);
    db.prepare("UPDATE vehicles SET status = 'Available', odometer = ? WHERE id = ?").run(final_odometer, trip.vehicle_id);
    db.prepare("UPDATE drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);
  });
  complete();

  const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id);
  res.json(updated);
});

// PATCH /api/trips/:id/cancel
// trip -> Cancelled. Vehicle & driver only restored to Available if the trip
// had actually been Dispatched (a cancelled Draft never locked them in the first place).
router.patch('/:id/cancel', requireRole('Dispatcher'), (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status === 'Completed' || trip.status === 'Cancelled') {
    return res.status(400).json({ error: `Trip cannot be cancelled from status "${trip.status}".` });
  }

  const wasDispatched = trip.status === 'Dispatched';

  const cancel = db.transaction(() => {
    db.prepare("UPDATE trips SET status = 'Cancelled' WHERE id = ?").run(trip.id);
    if (wasDispatched) {
      db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(trip.vehicle_id);
      db.prepare("UPDATE drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);
    }
  });
  cancel();

  const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id);
  res.json(updated);
});

module.exports = router;
