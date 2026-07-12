import React, { useEffect, useState } from 'react';
import { Fuel, Receipt, Plus } from 'lucide-react';
import { listFuelLogs, createFuelLog, listExpenses, createExpense } from '../api/fuelExpenses.js';
import { listVehicles, getVehicleCostSummary } from '../api/vehicles.js';
import { PageHeader, Panel, Button, Modal, Field, Input, Select, EmptyState, Spinner } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canEdit } from '../permissions.js';

const EXPENSE_TYPES = ['Toll', 'Parking', 'Fine', 'Other'];

export default function FuelExpenses() {
  const { user } = useAuth();
  const editable = canEdit(user.role, 'fuelExpenses');
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('fuel');
  const [modalOpen, setModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) });
  const [expenseForm, setExpenseForm] = useState({ vehicle_id: '', type: 'Toll', amount: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    const [v, f, e] = await Promise.all([listVehicles(), listFuelLogs(), listExpenses()]);
    setVehicles(v);
    setFuelLogs(f);
    setExpenses(e);
    const sums = {};
    await Promise.all(v.map(async (vh) => { sums[vh.id] = await getVehicleCostSummary(vh.id); }));
    setSummaries(sums);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  function vehicleName(id) {
    const v = vehicles.find((x) => x.id === id);
    return v ? v.name : `Vehicle #${id}`;
  }

  async function handleFuelSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createFuelLog({ ...fuelForm, vehicle_id: Number(fuelForm.vehicle_id), liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) });
      showToast('Fuel log recorded.', 'success');
      setModalOpen(false);
      setFuelForm({ vehicle_id: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) });
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleExpenseSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createExpense({ ...expenseForm, vehicle_id: Number(expenseForm.vehicle_id), amount: Number(expenseForm.amount) });
      showToast('Expense recorded.', 'success');
      setModalOpen(false);
      setExpenseForm({ vehicle_id: '', type: 'Toll', amount: '', date: new Date().toISOString().slice(0, 10) });
      refresh();
    } finally {
      setSaving(false);
    }
  }

  const totalOperational = Object.values(summaries).reduce((s, v) => s + (v?.total_operational_cost || 0), 0);
  const totalFuel = Object.values(summaries).reduce((s, v) => s + (v?.total_fuel_cost || 0), 0);
  const totalMaint = Object.values(summaries).reduce((s, v) => s + (v?.total_maintenance_cost || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Cost Tracking"
        title="Fuel & Expense Management"
        description="Operational cost per vehicle is computed automatically as fuel spend plus maintenance spend."
        action={editable && (
          <Button onClick={() => setModalOpen(true)}><Plus size={15} /> Log {tab === 'fuel' ? 'Fuel' : 'Expense'}</Button>
        )}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Operational Cost</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">₹{totalOperational.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">Fuel + Maintenance, fleet-wide</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fuel Spend</p>
          <p className="mt-2 font-display text-2xl font-semibold text-signal-transit">₹{totalFuel.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">{fuelLogs.length} logs recorded</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Maintenance Spend</p>
          <p className="mt-2 font-display text-2xl font-semibold text-[#8A6100]">₹{totalMaint.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">Across all shop visits</p>
        </Panel>
      </div>

      <div className="flex gap-1.5 mb-5">
        <button onClick={() => setTab('fuel')} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${tab === 'fuel' ? 'bg-ink text-white' : 'bg-[#F0F0EE] text-muted hover:text-ink'}`}>
          <Fuel size={12} /> Fuel Logs
        </button>
        <button onClick={() => setTab('expense')} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${tab === 'expense' ? 'bg-ink text-white' : 'bg-[#F0F0EE] text-muted hover:text-ink'}`}>
          <Receipt size={12} /> Expenses
        </button>
        <button onClick={() => setTab('vehicle')} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${tab === 'vehicle' ? 'bg-ink text-white' : 'bg-[#F0F0EE] text-muted hover:text-ink'}`}>
          By Vehicle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="text-muted h-6 w-6" /></div>
      ) : tab === 'fuel' ? (
        <Panel>
          {fuelLogs.length === 0 ? <EmptyState icon="⛽" title="No fuel logs yet" /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted border-b border-line">
                  <th className="px-5 py-3">Vehicle</th><th className="px-3 py-3">Liters</th><th className="px-3 py-3">Cost</th><th className="px-3 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...fuelLogs].reverse().map((f) => (
                  <tr key={f.id}><td className="px-5 py-3.5 font-semibold text-ink">{vehicleName(f.vehicle_id)}</td><td className="px-3 py-3.5 text-muted">{f.liters} L</td><td className="px-3 py-3.5 text-muted">₹{f.cost.toLocaleString()}</td><td className="px-3 py-3.5 font-mono text-xs text-muted">{f.date}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      ) : tab === 'expense' ? (
        <Panel>
          {expenses.length === 0 ? <EmptyState icon="🧾" title="No expenses yet" /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted border-b border-line">
                  <th className="px-5 py-3">Vehicle</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...expenses].reverse().map((ex) => (
                  <tr key={ex.id}><td className="px-5 py-3.5 font-semibold text-ink">{vehicleName(ex.vehicle_id)}</td><td className="px-3 py-3.5 text-muted">{ex.type}</td><td className="px-3 py-3.5 text-muted">₹{ex.amount.toLocaleString()}</td><td className="px-3 py-3.5 font-mono text-xs text-muted">{ex.date}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      ) : (
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted border-b border-line">
                <th className="px-5 py-3">Vehicle</th><th className="px-3 py-3">Fuel Cost</th><th className="px-3 py-3">Maintenance Cost</th><th className="px-3 py-3">Other Expenses</th><th className="px-3 py-3">Total Operational Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {vehicles.map((v) => {
                const s = summaries[v.id] || {};
                return (
                  <tr key={v.id}>
                    <td className="px-5 py-3.5 font-semibold text-ink">{v.name} <span className="font-mono text-xs text-muted">{v.reg_number}</span></td>
                    <td className="px-3 py-3.5 text-muted">₹{(s.total_fuel_cost || 0).toLocaleString()}</td>
                    <td className="px-3 py-3.5 text-muted">₹{(s.total_maintenance_cost || 0).toLocaleString()}</td>
                    <td className="px-3 py-3.5 text-muted">₹{(s.total_expenses || 0).toLocaleString()}</td>
                    <td className="px-3 py-3.5 font-semibold text-ink">₹{(s.total_operational_cost || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={tab === 'expense' ? 'Log Expense' : 'Log Fuel'}>
        {tab === 'expense' ? (
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <Field label="Vehicle" required>
              <Select required value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.reg_number}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type" required>
                <Select value={expenseForm.type} onChange={(e) => setExpenseForm((f) => ({ ...f, type: e.target.value }))}>
                  {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Amount" required>
                <Input required type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} placeholder="200" />
              </Field>
            </div>
            <Field label="Date" required>
              <Input required type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <Spinner /> : 'Log Expense'}</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleFuelSubmit} className="space-y-4">
            <Field label="Vehicle" required>
              <Select required value={fuelForm.vehicle_id} onChange={(e) => setFuelForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.reg_number}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Liters" required>
                <Input required type="number" min="0" value={fuelForm.liters} onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))} placeholder="20" />
              </Field>
              <Field label="Cost" required>
                <Input required type="number" min="0" value={fuelForm.cost} onChange={(e) => setFuelForm((f) => ({ ...f, cost: e.target.value }))} placeholder="2000" />
              </Field>
            </div>
            <Field label="Date" required>
              <Input required type="date" value={fuelForm.date} onChange={(e) => setFuelForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <Spinner /> : 'Log Fuel'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
