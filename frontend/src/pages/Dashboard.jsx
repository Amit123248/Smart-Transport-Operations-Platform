import React, { useEffect, useMemo, useState } from 'react';
import { getDashboardKpis } from '../api/reports.js';
import { listVehicles } from '../api/vehicles.js';
import { listTrips } from '../api/trips.js';
import { PageHeader, Panel, KpiCard, Select, EmptyState } from '../components/ui.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const VEHICLE_TYPES = ['All', 'Van', 'Truck', 'Mini'];
const STATUSES = ['All', 'Available', 'On Trip', 'In Shop', 'Retired'];
const REGIONS = ['All', 'North', 'South', 'East', 'West'];

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'All', status: 'All', region: 'All' });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [k, v, t] = await Promise.all([getDashboardKpis(), listVehicles(), listTrips()]);
      if (!alive) return;
      setKpis(k);
      setVehicles(v);
      setTrips(t);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (filters.type !== 'All' && v.type !== filters.type) return false;
      if (filters.status !== 'All' && v.status !== filters.status) return false;
      if (filters.region !== 'All' && v.region && v.region !== filters.region) return false;
      return true;
    });
  }, [vehicles, filters]);

  const recentTrips = [...trips].slice(-5).reverse();

  return (
    <div>
      <PageHeader
        eyebrow="Operations Overview"
        title={`Good to see you, ${user.name.split(' ')[0]}`}
        description="Fleet-wide status pulled from vehicle, driver, and trip records — filter the snapshot below by type, status, or region."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active Vehicles" value={loading ? '—' : kpis.active_vehicles} tone="ink" sub="Fleet excluding retired" />
        <KpiCard label="Available" value={loading ? '—' : kpis.available_vehicles} tone="go" sub="Ready for dispatch" />
        <KpiCard label="In Maintenance" value={loading ? '—' : kpis.vehicles_in_maintenance} tone="transit" sub="Hidden from dispatch pool" />
        <KpiCard label="Fleet Utilization" value={loading ? '—' : kpis.fleet_utilization_pct} unit="%" tone="hold" sub="On-trip share of active fleet" />
        <KpiCard label="Active Trips" value={loading ? '—' : kpis.active_trips} tone="transit" sub="Currently dispatched" />
        <KpiCard label="Pending Trips" value={loading ? '—' : kpis.pending_trips} tone="hold" sub="Drafted, not yet dispatched" />
        <KpiCard label="Drivers On Duty" value={loading ? '—' : kpis.drivers_on_duty} tone="ink" sub="Assigned to a live trip" />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h3 className="font-display font-semibold text-ink">Fleet Snapshot</h3>
              <p className="text-xs text-muted mt-0.5">{filteredVehicles.length} of {vehicles.length} vehicles</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select className="w-28 !py-1.5 text-xs" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t === 'All' ? 'All types' : t}</option>)}
              </Select>
              <Select className="w-32 !py-1.5 text-xs" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>)}
              </Select>
              <Select className="w-28 !py-1.5 text-xs" value={filters.region} onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}>
                {REGIONS.map((r) => <option key={r} value={r}>{r === 'All' ? 'All regions' : r}</option>)}
              </Select>
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <EmptyState icon="🚚" title="No vehicles match these filters" description="Try widening the type, status, or region filter." />
          ) : (
            <div className="divide-y divide-line">
              {filteredVehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{v.name}</p>
                    <p className="font-mono text-xs text-muted">{v.reg_number} · {v.type}{v.region ? ` · ${v.region}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="hidden sm:block text-xs text-muted font-mono">{Number(v.odometer).toLocaleString()} km</span>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <h3 className="font-display font-semibold text-ink mb-1">Recent Trips</h3>
          <p className="text-xs text-muted mb-4">Latest dispatch activity across the fleet</p>
          {recentTrips.length === 0 ? (
            <EmptyState icon="🧭" title="No trips yet" description="Trips will appear here once dispatched." />
          ) : (
            <div className="space-y-3">
              {recentTrips.map((t) => (
                <div key={t.id} className="manifest-row manifest-perf pl-5 pr-3 py-3">
                  <span className="manifest-rail" style={{ background: railColor(t.status) }} />
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                        <span className="truncate max-w-[90px]">{t.source}</span>
                        <span className="text-muted">→</span>
                        <span className="truncate max-w-[90px]">{t.destination}</span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">{t.cargo_weight}kg · {t.planned_distance}km planned</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function railColor(status) {
  const map = {
    Draft: '#8A8F98', Dispatched: '#E0A800', Completed: '#128A6E', Cancelled: '#D53B3B',
  };
  return map[status] || '#8A8F98';
}
