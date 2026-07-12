import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { getDashboardKpis, getVehicleReport, exportReportsCsv, getMonthlyRevenue } from '../api/reports.js';
import { listVehicles } from '../api/vehicles.js';
import { PageHeader, Panel, Button, Spinner } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';

const PIE_COLORS = ['#128A6E', '#E0A800', '#2F6FE0', '#D53B3B'];

export default function Analytics() {
  const { showToast } = useToast();
  const [kpis, setKpis] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [reports, setReports] = useState({});
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [k, v, rev] = await Promise.all([getDashboardKpis(), listVehicles(), getMonthlyRevenue()]);
      setKpis(k);
      setVehicles(v);
      setRevenue(rev);
      const reps = {};
      await Promise.all(v.map(async (vh) => { reps[vh.id] = await getVehicleReport(vh.id); }));
      setReports(reps);
      setLoading(false);
    })();
  }, []);

  const fleetMix = useMemo(() => {
    const counts = { Available: 0, 'On Trip': 0, 'In Shop': 0, Retired: 0 };
    vehicles.forEach((v) => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  }, [vehicles]);

  const efficiencyData = vehicles.map((v) => ({
    name: v.name,
    efficiency: reports[v.id]?.fuel_efficiency || 0,
    cost: reports[v.id]?.operational_cost || 0,
  }));

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportReportsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transitops-fleet-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('CSV export downloaded.', 'success');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner className="text-muted h-6 w-6" /></div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fleet Intelligence"
        title="Reports & Analytics"
        description="Fuel efficiency, utilization, operational cost, and ROI — computed from live trip, fuel, and maintenance records."
        action={<Button variant="dark" onClick={handleExport} disabled={exporting}>{exporting ? <Spinner /> : <Download size={15} />} Export CSV</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fleet Utilization</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">{kpis.fleet_utilization_pct}%</p>
          <p className="text-xs text-muted mt-1">On-trip share of active fleet</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avg. Fuel Efficiency</p>
          <p className="mt-2 font-display text-2xl font-semibold text-signal-transit">
            {(efficiencyData.reduce((s, d) => s + d.efficiency, 0) / (efficiencyData.length || 1)).toFixed(1)} <span className="text-sm font-medium text-muted">km/L</span>
          </p>
          <p className="text-xs text-muted mt-1">Distance / fuel across fleet</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Operational Cost</p>
          <p className="mt-2 font-display text-2xl font-semibold text-[#8A6100]">
            ₹{efficiencyData.reduce((s, d) => s + d.cost, 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted mt-1">Fuel + maintenance, fleet-wide</p>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mb-6">
        <Panel className="p-5">
          <h3 className="font-display font-semibold text-ink mb-1">Revenue vs. Cost</h3>
          <p className="text-xs text-muted mb-4">Monthly trend — revenue tracking not yet in the backend contract, shown here from the flagged endpoint fallback.</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5A1F" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DA" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#787A72' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#787A72' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E2DA' }} />
              <Area type="monotone" dataKey="revenue" stroke="#FF5A1F" fill="url(#rev)" strokeWidth={2} />
              <Area type="monotone" dataKey="cost" stroke="#12151A" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="p-5">
          <h3 className="font-display font-semibold text-ink mb-1">Fleet Composition</h3>
          <p className="text-xs text-muted mb-4">Vehicles by current status</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={fleetMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>
                {fleetMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E2DA' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
            {fleetMix.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5 mb-6">
        <h3 className="font-display font-semibold text-ink mb-1">Fuel Efficiency by Vehicle</h3>
        <p className="text-xs text-muted mb-4">Distance ÷ fuel consumed, per vehicle</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DA" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#787A72' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#787A72' }} axisLine={false} tickLine={false} width={36} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E2DA' }} />
            <Bar dataKey="efficiency" fill="#2F6FE0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel>
        <div className="border-b border-line px-5 py-4">
          <h3 className="font-display font-semibold text-ink">Vehicle ROI Breakdown</h3>
          <p className="text-xs text-muted mt-0.5">ROI = (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted border-b border-line">
              <th className="px-5 py-3">Vehicle</th>
              <th className="px-3 py-3">Fuel Efficiency</th>
              <th className="px-3 py-3">Operational Cost</th>
              <th className="px-3 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {vehicles.map((v) => {
              const r = reports[v.id] || {};
              return (
                <tr key={v.id}>
                  <td className="px-5 py-3.5 font-semibold text-ink">{v.name}</td>
                  <td className="px-3 py-3.5 text-muted">{r.fuel_efficiency ?? 0} km/L</td>
                  <td className="px-3 py-3.5 text-muted">₹{(r.operational_cost || 0).toLocaleString()}</td>
                  <td className={`px-3 py-3.5 font-semibold ${(r.roi || 0) >= 0 ? 'text-signal-go' : 'text-signal-stop'}`}>
                    {((r.roi || 0) * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
