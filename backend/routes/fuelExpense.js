const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// POST /api/fuel-logs
router.post('/fuel-logs', (req, res) => {
  const { vehicle_id, liters, cost, date } = req.body;
  if (!vehicle_id || !liters || !cost || !date) {
    return res.status(400).json({ error: 'vehicle_id, liters, cost, and date are required' });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const result = db.prepare(
    'INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES (?, ?, ?, ?)'
  ).run(vehicle_id, liters, cost, date);

  const log = db.prepare('SELECT * FROM fuel_logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(log);
});

// GET /api/fuel-logs?vehicle_id=1
router.get('/fuel-logs', (req, res) => {
  const { vehicle_id } = req.query;
  let query = 'SELECT * FROM fuel_logs WHERE 1=1';
  const params = [];
  if (vehicle_id) {
    query += ' AND vehicle_id = ?';
    params.push(vehicle_id);
  }
  res.json(db.prepare(query).all(...params));
});

// POST /api/expenses
router.post('/expenses', (req, res) => {
  const { vehicle_id, type, amount, date } = req.body;
  if (!vehicle_id || !type || !amount || !date) {
    return res.status(400).json({ error: 'vehicle_id, type, amount, and date are required' });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const result = db.prepare(
    'INSERT INTO expenses (vehicle_id, type, amount, date) VALUES (?, ?, ?, ?)'
  ).run(vehicle_id, type, amount, date);

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(expense);
});

// GET /api/expenses?vehicle_id=1
router.get('/expenses', (req, res) => {
  const { vehicle_id } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];
  if (vehicle_id) {
    query += ' AND vehicle_id = ?';
    params.push(vehicle_id);
  }
  res.json(db.prepare(query).all(...params));
});

// GET /api/vehicles/:id/cost-summary
router.get('/vehicles/:id/cost-summary', (req, res) => {
  const vehicleId = req.params.id;

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const fuelTotal = db.prepare(
    'SELECT COALESCE(SUM(cost), 0) as total FROM fuel_logs WHERE vehicle_id = ?'
  ).get(vehicleId).total;

  const maintenanceTotal = db.prepare(
    'SELECT COALESCE(SUM(cost), 0) as total FROM maintenance WHERE vehicle_id = ?'
  ).get(vehicleId).total;

  const expenseTotal = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE vehicle_id = ?'
  ).get(vehicleId).total;

  res.json({
    vehicle_id: Number(vehicleId),
    total_fuel_cost: fuelTotal,
    total_maintenance_cost: maintenanceTotal,
    total_expenses: expenseTotal,
    total_operational_cost: fuelTotal + maintenanceTotal + expenseTotal
  });
});

module.exports = router;
