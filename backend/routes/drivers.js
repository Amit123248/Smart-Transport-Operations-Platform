const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/drivers
router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM drivers WHERE 1=1';
  const params = [];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  const drivers = db.prepare(query).all(...params);
  res.json(drivers);
});

// GET /api/drivers/available
// Must come before /:id
router.get('/available', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const drivers = db.prepare(
    `SELECT * FROM drivers
     WHERE status = 'Available'
     AND license_expiry > ?`
  ).all(today);
  res.json(drivers);
});

// GET /api/drivers/:id
router.get('/:id', (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  res.json(driver);
});

// POST /api/drivers
router.post('/', (req, res) => {
  const { name, license_number, license_category, license_expiry, contact } = req.body;

  if (!name || !license_number || !license_expiry) {
    return res.status(400).json({ error: 'name, license_number, and license_expiry are required' });
  }

  const result = db.prepare(
    `INSERT INTO drivers (name, license_number, license_category, license_expiry, contact, safety_score, status)
     VALUES (?, ?, ?, ?, ?, 100, 'Available')`
  ).run(name, license_number, license_category || null, license_expiry, contact || null);

  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(driver);
});

// PUT /api/drivers/:id
router.put('/:id', (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  const { name, license_number, license_category, license_expiry, contact, safety_score, status } = req.body;
  const validStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  db.prepare(
    `UPDATE drivers SET
      name = COALESCE(?, name),
      license_number = COALESCE(?, license_number),
      license_category = COALESCE(?, license_category),
      license_expiry = COALESCE(?, license_expiry),
      contact = COALESCE(?, contact),
      safety_score = COALESCE(?, safety_score),
      status = COALESCE(?, status)
     WHERE id = ?`
  ).run(name, license_number, license_category, license_expiry, contact, safety_score, status, req.params.id);

  const updated = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/drivers/:id
router.delete('/:id', (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Driver deleted' });
});

module.exports = router;
