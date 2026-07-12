const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

function fleetUtilizationPct() {
  const activeVehicles = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status != 'Retired'").get().c;
  const onTrip = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status = 'On Trip'").get().c;
  return activeVehicles ? Number(((onTrip / activeVehicles) * 100).toFixed(1)) : 0;
}

// GET /api/dashboard/kpis
router.get('/dashboard/kpis', (req, res) => {
  const active_vehicles = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status != 'Retired'").get().c;
  const available_vehicles = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status = 'Available'").get().c;
  const vehicles_in_maintenance = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status = 'In Shop'").get().c;
  const active_trips = db.prepare("SELECT COUNT(*) as c FROM trips WHERE status = 'Dispatched'").get().c;
  const pending_trips = db.prepare("SELECT COUNT(*) as c FROM trips WHERE status = 'Draft'").get().c;
  const drivers_on_duty = db.prepare("SELECT COUNT(*) as c FROM drivers WHERE status = 'On Trip'").get().c;

  res.json({
    active_vehicles,
    available_vehicles,
    vehicles_in_maintenance,
    active_trips,
    pending_trips,
    drivers_on_duty,
    fleet_utilization_pct: fleetUtilizationPct(),
  });
});

// GET /api/reports/vehicle/:id
// fuel_efficiency      = total_distance / total_fuel_liters   (distance = sum of planned_distance across Completed trips)
// operational_cost     = total_fuel_cost + total_maintenance_cost
// roi                  = (revenue - (maintenance_cost + fuel_cost)) / acquisition_cost
//   NOTE: revenue is not captured anywhere in the current schema (flagged in
//   BACKEND_HANDOFF.md §9 as a known gap). Treated as 0 here, same assumption
//   the frontend mock already makes — this makes roi always <= 0 until a
//   revenue field/source is agreed on with the team.
// fleet_utilization_pct here is the fleet-wide figure (same formula/value as
//   the dashboard KPI) since utilization is not a meaningful per-vehicle stat;
//   flagging this the same way the handoff doc flags the revenue gap.
router.get('/reports/vehicle/:id', (req, res) => {
  const vehicleId = req.params.id;
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const totalLiters = db.prepare(
    'SELECT COALESCE(SUM(liters), 0) as total FROM fuel_logs WHERE vehicle_id = ?'
  ).get(vehicleId).total;

  const totalFuelCost = db.prepare(
    'SELECT COALESCE(SUM(cost), 0) as total FROM fuel_logs WHERE vehicle_id = ?'
  ).get(vehicleId).total;

  const totalMaintenanceCost = db.prepare(
    'SELECT COALESCE(SUM(cost), 0) as total FROM maintenance WHERE vehicle_id = ?'
  ).get(vehicleId).total;

  const totalDistance = db.prepare(
    "SELECT COALESCE(SUM(planned_distance), 0) as total FROM trips WHERE vehicle_id = ? AND status = 'Completed'"
  ).get(vehicleId).total;

  const operational_cost = totalFuelCost + totalMaintenanceCost;
  const acquisitionCost = vehicle.acquisition_cost || 0;
  const revenue = 0; // known gap — see note above
  const roi = acquisitionCost ? Number(((revenue - operational_cost) / acquisitionCost).toFixed(3)) : 0;

  res.json({
    vehicle_id: Number(vehicleId),
    fuel_efficiency: totalLiters ? Number((totalDistance / totalLiters).toFixed(2)) : 0,
    fleet_utilization_pct: fleetUtilizationPct(),
    operational_cost,
    roi,
  });
});

// GET /api/reports/export/csv -> one row per vehicle, across the whole fleet
router.get('/reports/export/csv', (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles').all();

  const header = [
    'vehicle_id', 'reg_number', 'name', 'type', 'status',
    'fuel_efficiency', 'total_fuel_cost', 'total_maintenance_cost',
    'operational_cost', 'roi',
  ];
  const rows = [header];

  for (const v of vehicles) {
    const totalLiters = db.prepare(
      'SELECT COALESCE(SUM(liters), 0) as total FROM fuel_logs WHERE vehicle_id = ?'
    ).get(v.id).total;
    const totalFuelCost = db.prepare(
      'SELECT COALESCE(SUM(cost), 0) as total FROM fuel_logs WHERE vehicle_id = ?'
    ).get(v.id).total;
    const totalMaintenanceCost = db.prepare(
      'SELECT COALESCE(SUM(cost), 0) as total FROM maintenance WHERE vehicle_id = ?'
    ).get(v.id).total;
    const totalDistance = db.prepare(
      "SELECT COALESCE(SUM(planned_distance), 0) as total FROM trips WHERE vehicle_id = ? AND status = 'Completed'"
    ).get(v.id).total;

    const operational_cost = totalFuelCost + totalMaintenanceCost;
    const fuel_efficiency = totalLiters ? (totalDistance / totalLiters).toFixed(2) : 0;
    const roi = v.acquisition_cost ? ((0 - operational_cost) / v.acquisition_cost).toFixed(3) : 0;

    rows.push([
      v.id, v.reg_number, v.name, v.type, v.status,
      fuel_efficiency, totalFuelCost, totalMaintenanceCost,
      operational_cost, roi,
    ]);
  }

  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"');
  res.send(csv);
});

module.exports = router;
