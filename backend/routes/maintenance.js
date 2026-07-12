const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/maintenance?vehicle_id=1
router.get('/', (req, res) => {
  const { vehicle_id } = req.query;
  let query = 'SELECT * FROM maintenance WHERE 1=1';
  const params = [];
  if (vehicle_id) {
    query += ' AND vehicle_id = ?';
    params.push(vehicle_id);
  }
  const records = db.prepare(query).all(...params);
  res.json(records);
});

// POST /api/maintenance
// Creating an active maintenance record automatically sets vehicle status to "In Shop"
router.post('/', (req, res) => {
  const { vehicle_id, description, cost, date } = req.body;

  if (!vehicle_id || !description || !date) {
    return res.status(400).json({ error: 'vehicle_id, description, and date are required' });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const insertMaintenance = db.transaction(() => {
    const result = db.prepare(
      `INSERT INTO maintenance (vehicle_id, description, status, cost, date)
       VALUES (?, ?, 'Open', ?, ?)`
    ).run(vehicle_id, description, cost || 0, date);

    db.prepare("UPDATE vehicles SET status = 'In Shop' WHERE id = ?").run(vehicle_id);

    return result.lastInsertRowid;
  });

  const newId = insertMaintenance();
  const record = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(newId);
  res.status(201).json(record);
});

// PATCH /api/maintenance/:id/close
// Closing maintenance restores vehicle to Available, UNLESS vehicle is Retired
router.patch('/:id/close', (req, res) => {
  const record = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Maintenance record not found' });

  if (record.status === 'Closed') {
    return res.status(400).json({ error: 'Maintenance record is already closed' });
  }

  const closeMaintenance = db.transaction(() => {
    db.prepare("UPDATE maintenance SET status = 'Closed' WHERE id = ?").run(req.params.id);

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(record.vehicle_id);
    if (vehicle && vehicle.status !== 'Retired') {
      db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(record.vehicle_id);
    }
  });

  closeMaintenance();
  const updated = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
