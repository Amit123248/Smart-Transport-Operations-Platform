const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken); // every vehicle route requires login

// GET /api/vehicles?status=Available&type=Van&region=West
router.get('/', (req, res) => {
  const { status, type } = req.query;
  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  const vehicles = db.prepare(query).all(...params);
  res.json(vehicles);
});

// IMPORTANT: this route must be defined BEFORE /:id, or Express will
// treat "available" as an :id value.
// GET /api/vehicles/available
router.get('/available', (req, res) => {
  const vehicles = db.prepare("SELECT * FROM vehicles WHERE status = 'Available'").all();
  res.json(vehicles);
});

// GET /api/vehicles/:id
router.get('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

// POST /api/vehicles
router.post('/', (req, res) => {
  const { reg_number, name, type, max_load, odometer, acquisition_cost } = req.body;

  if (!reg_number || !name || !type || !max_load) {
    return res.status(400).json({ error: 'reg_number, name, type, and max_load are required' });
  }

  const existing = db.prepare('SELECT id FROM vehicles WHERE reg_number = ?').get(reg_number);
  if (existing) {
    return res.status(400).json({ error: 'Registration number must be unique' });
  }

  const result = db.prepare(
    `INSERT INTO vehicles (reg_number, name, type, max_load, odometer, acquisition_cost, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Available')`
  ).run(reg_number, name, type, max_load, odometer || 0, acquisition_cost || 0);

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(vehicle);
});

// PUT /api/vehicles/:id
router.put('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const { name, type, max_load, odometer, acquisition_cost, status } = req.body;
  const validStatuses = ['Available', 'On Trip', 'In Shop', 'Retired'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  db.prepare(
    `UPDATE vehicles SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      max_load = COALESCE(?, max_load),
      odometer = COALESCE(?, odometer),
      acquisition_cost = COALESCE(?, acquisition_cost),
      status = COALESCE(?, status)
     WHERE id = ?`
  ).run(name, type, max_load, odometer, acquisition_cost, status, req.params.id);

  const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/vehicles/:id
router.delete('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
  res.json({ message: 'Vehicle deleted' });
});

module.exports = router;
