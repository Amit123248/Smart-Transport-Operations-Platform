import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Wrench } from 'lucide-react';
import { listMaintenance, createMaintenance, closeMaintenance } from '../api/maintenance.js';
import { listVehicles } from '../api/vehicles.js';
import { PageHeader, Panel, Button, Modal, Field, Input, Select, EmptyState, Spinner } from '../components/ui.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canEdit } from '../permissions.js';

const EMPTY = { vehicle_id: '', description: '', cost: '', date: new Date().toISOString().slice(0, 10) };
const FILTERS = ['All', 'Open', 'Closed'];

export default function Maintenance() {
  const { user } = useAuth();
  const editable = canEdit(user.role, 'maintenance');
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function refresh() {
    setLoading(true);
    const [m, v] = await Promise.all([listMaintenance(), listVehicles()]);
    setRecords(m);
    setVehicles(v);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  function vehicleName(id) {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.name} · ${v.reg_number}` : `Vehicle #${id}`;
  }

  function openCreate() {
    setError('');
    setForm(EMPTY);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createMaintenance({ ...form, vehicle_id: Number(form.vehicle_id), cost: Number(form.cost) });
      showToast('Maintenance logged — vehicle moved to In Shop.', 'success');
      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err.message || 'Could not create maintenance record.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(r) {
    setBusyId(r.id);
    try {
      await closeMaintenance(r.id);
      showToast(`${r.description} closed — vehicle back in the pool.`, 'success');
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not close record.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const eligibleVehicles = vehicles.filter((v) => v.status !== 'Retired');
  const filtered = filter === 'All' ? records : records.filter((r) => r.status === filter);

  return (
    <div>
      <PageHeader
        eyebrow="Shop Floor"
        title="Maintenance Log"
        description="Opening a record instantly pulls the vehicle from the dispatch pool. Closing restores it — unless the vehicle is Retired."
        action={editable && <Button onClick={openCreate}><Plus size={15} /> Log Maintenance</Button>}
      />

      <div className="flex gap-1.5 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? 'bg-ink text-white' : 'bg-[#F0F0EE] text-muted hover:text-ink'
            }`}
          >
            {f} {f !== 'All' && `(${records.filter((r) => r.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="text-muted h-6 w-6" /></div>
      ) : filtered.length === 0 ? (
        <Panel><EmptyState icon="🔧" title="No maintenance records" description="Log a service to pull a vehicle out of dispatch rotation." /></Panel>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <Panel key={r.id} className="p-4 manifest-perf pl-8 relative">
              <span className="manifest-rail" style={{ background: r.status === 'Open' ? '#2F6FE0' : '#8A8F98' }} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted mb-1.5">
                    <Wrench size={12} /> {r.date}
                  </div>
                  <p className="font-display font-semibold text-ink">{r.description}</p>
                  <p className="text-xs text-muted mt-0.5">{vehicleName(r.vehicle_id)}</p>
                  <p className="text-xs text-muted mt-1">Cost: <strong className="text-ink">₹{Number(r.cost).toLocaleString()}</strong></p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={r.status} />
                  {editable && r.status === 'Open' && (
                    <Button size="sm" variant="subtle" onClick={() => handleClose(r)} disabled={busyId === r.id}>
                      {busyId === r.id ? <Spinner /> : <CheckCircle2 size={12} />} Close
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Maintenance" subtitle="Vehicle status switches to In Shop the moment this is saved.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Vehicle" required>
            <Select required value={form.vehicle_id} onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">Select vehicle</option>
              {eligibleVehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.reg_number}</option>)}
            </Select>
          </Field>
          <Field label="Description" required>
            <Input required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Oil Change" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cost" required>
              <Input required type="number" min="0" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} placeholder="1500" />
            </Field>
            <Field label="Date" required>
              <Input required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
          </div>

          {error && <div className="rounded-md bg-[#FBEBEB] px-3 py-2.5 text-xs font-medium text-signal-stop">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Spinner /> : 'Log Maintenance'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
