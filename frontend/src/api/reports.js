import { request } from './client.js';
import { store, delay } from './mockStore.js';

// GET /api/dashboard/kpis -> { active_vehicles, available_vehicles, vehicles_in_maintenance,
//   active_trips, pending_trips, drivers_on_duty, fleet_utilization_pct }
export async function getDashboardKpis() {
  try {
    return await request('/dashboard/kpis');
  } catch {
    await delay();
    const totalActive = store.vehicles.filter((v) => v.status !== 'Retired').length;
    const available = store.vehicles.filter((v) => v.status === 'Available').length;
    const inMaintenance = store.vehicles.filter((v) => v.status === 'In Shop').length;
    const onTrip = store.vehicles.filter((v) => v.status === 'On Trip').length;
    const activeTrips = store.trips.filter((t) => t.status === 'Dispatched').length;
    const pendingTrips = store.trips.filter((t) => t.status === 'Draft').length;
    const driversOnDuty = store.drivers.filter((d) => d.status === 'On Trip').length;
    return {
      active_vehicles: totalActive,
      available_vehicles: available,
      vehicles_in_maintenance: inMaintenance,
      active_trips: activeTrips,
      pending_trips: pendingTrips,
      drivers_on_duty: driversOnDuty,
      fleet_utilization_pct: totalActive ? Number(((onTrip / totalActive) * 100).toFixed(1)) : 0,
    };
  }
}

// GET /api/reports/vehicle/:id -> { vehicle_id, fuel_efficiency, fleet_utilization_pct, operational_cost, roi }
export async function getVehicleReport(id) {
  try {
    return await request(`/reports/vehicle/${id}`);
  } catch {
    await delay();
    const vehicle = store.vehicles.find((v) => v.id === id);
    const fuel = store.fuelLogs.filter((f) => f.vehicle_id === id);
    const totalLiters = fuel.reduce((s, f) => s + f.liters, 0);
    const totalFuelCost = fuel.reduce((s, f) => s + f.cost, 0);
    const maint = store.maintenance.filter((m) => m.vehicle_id === id).reduce((s, m) => s + m.cost, 0);
    const distance = store.trips.filter((t) => t.vehicle_id === id && t.status === 'Completed')
      .reduce((s, t) => s + (t.planned_distance || 0), 0);
    const operational_cost = totalFuelCost + maint;
    const acquisitionCost = vehicle?.acquisition_cost || 1;
    // roi = (revenue - (maintenance + fuel)) / acquisition_cost — revenue not tracked yet, treated as 0 in mock
    const roi = Number(((0 - operational_cost) / acquisitionCost).toFixed(3));
    return {
      vehicle_id: id,
      fuel_efficiency: totalLiters ? Number((distance / totalLiters).toFixed(1)) : 0,
      fleet_utilization_pct: 0,
      operational_cost,
      roi,
    };
  }
}

// GET /api/reports/monthly-revenue -> {month, revenue}[]
// NOT YET IN BACKEND CONTRACT (flagged in BACKEND_HANDOFF.md #9) — falls back to a
// deterministic mock series derived from trip/fuel data so Analytics still renders.
export async function getMonthlyRevenue() {
  try {
    return await request('/reports/monthly-revenue');
  } catch {
    await delay();
    const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const baseCost = store.fuelLogs.reduce((s, f) => s + f.cost, 0)
      + store.maintenance.reduce((s, m) => s + m.cost, 0);
    return months.map((month, i) => ({
      month,
      revenue: Math.round((baseCost || 40000) * (0.7 + i * 0.09) * 1.6),
      cost: Math.round((baseCost || 40000) * (0.6 + i * 0.06)),
    }));
  }
}

// GET /api/reports/export/csv -> text/csv file across all vehicles
export async function exportReportsCsv() {
  const token = localStorage.getItem('transitops_token');
  try {
    const res = await fetch('http://localhost:5000/api/reports/export/csv', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('failed');
    return await res.blob();
  } catch {
    // Mock CSV fallback
    const rows = [['vehicle_id', 'name', 'fuel_efficiency', 'operational_cost']];
    for (const v of store.vehicles) {
      const fuel = store.fuelLogs.filter((f) => f.vehicle_id === v.id);
      const liters = fuel.reduce((s, f) => s + f.liters, 0);
      const cost = fuel.reduce((s, f) => s + f.cost, 0)
        + store.maintenance.filter((m) => m.vehicle_id === v.id).reduce((s, m) => s + m.cost, 0);
      rows.push([v.id, v.name, liters ? (v.odometer / liters).toFixed(1) : 0, cost]);
    }
    const csv = rows.map((r) => r.join(',')).join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }
}
