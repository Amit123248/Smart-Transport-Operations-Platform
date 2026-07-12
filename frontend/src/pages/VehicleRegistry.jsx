import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/vehicles.js';
import { PageHeader, Panel, Button, Modal, Field, Input, Select, EmptyState, Spinner } from '../components/ui.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canEdit } from '../permissions.js';

const TYPES = ['Van', 'Truck', 'Mini'];
const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

const EMPTY = { reg_number: '', name: '', type: 'Van', max_load: '', odometer: '', acquisition_cost: '', region: 'West' };

export default function VehicleRegistry() {
  const { user } = useAuth();
  const editable = canEdit(user.role, 'fleet');
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setVehicles(await listVehicles());
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setModalOpen(true);
  }

  function openEdit(v) {
    setEditing(v);
    setForm({ ...v });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        max_load: Number(form.max_load),
        odometer: Number(form.odometer || 0),
        acquisition_cost: Number(form.acquisition_cost || 0),
      };
      if (editing) {
        await updateVehicle(editing.id, payload);
        showToast(`${form.name} updated.`, 'success');
      } else {
        await createVehicle(payload);
        showToast(`${form.name} added to the registry.`, 'success');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err.message || 'Could not save vehicle.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(v, status) {
    await updateVehicle(v.id, { status });
    showToast(`${v.name} marked ${status}.`, 'success');
    refresh();
  }

  async function handleDelete(v) {
    if (!confirm(`Remove ${v.name} (${v.reg_number}) from the registry? This can't be undone.`)) return;
    await deleteVehicle(v.id);
    showToast(`${v.name} removed.`, 'default');
    refresh();
  }

  const filtered = vehicles.filter((v) => {
    if (statusFilter !== 'All' && v.status !== statusFilter) return false;
    if (query && !`${v.name} ${v.reg_number} ${v.type}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Master Fleet List"
        title="Vehicle Registry"
        description="Unique registration numbers, load capacity, and lifecycle status. Retired and In Shop vehicles are automatically hidden from dispatch."
        action={editable && (
          <Button onClick={openCreate}><Plus size={15} /> Register Vehicle</Button>
        )}
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder="Search by name, reg. number, type…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
          <Select className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-muted h-6 w-6" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🚐" title="No vehicles found" description="Adjust your search or register the first vehicle." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted border-b border-line">
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-3 py-3">Reg. No.</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Max Load</th>
                  <th className="px-3 py-3">Odometer</th>
                  <th className="px-3 py-3">Status</th>
                  {editable && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-black/[0.015]">
                    <td className="px-5 py-3.5 font-semibold text-ink">{v.name}</td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted">{v.reg_number}</td>
                    <td className="px-3 py-3.5 text-muted">{v.type}</td>
                    <td className="px-3 py-3.5 text-muted">{v.max_load} kg</td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted">{Number(v.odometer).toLocaleString()} km</td>
                    <td className="px-3 py-3.5">
                      {editable ? (
                        <select
                          value={v.status}
                          onChange={(e) => handleStatusChange(v, e.target.value)}
                          className="rounded-full border-0 bg-transparent text-xs font-semibold focus:ring-1 focus:ring-ink cursor-pointer"
                          style={{ color: 'inherit' }}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <StatusBadge status={v.status} />
                      )}
                    </td>
                    {editable && (
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openEdit(v)} className="p-1.5 rounded-md text-muted hover:bg-black/5 hover:text-ink" aria-label="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(v)} className="p-1.5 rounded-md text-muted hover:bg-[#FBEBEB] hover:text-signal-stop" aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Register Vehicle'} subtitle="Registration number must be unique across the fleet.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration Number" required>
              <Input required value={form.reg_number} onChange={(e) => setForm((f) => ({ ...f, reg_number: e.target.value.toUpperCase() }))} placeholder="GJ01AB4521" className="font-mono" />
            </Field>
            <Field label="Vehicle Name / Model" required>
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VAN-05" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" required>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Region">
              <Select value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}>
                {['North', 'South', 'East', 'West'].map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Max Load (kg)" required>
              <Input required type="number" min="0" value={form.max_load} onChange={(e) => setForm((f) => ({ ...f, max_load: e.target.value }))} placeholder="500" />
            </Field>
            <Field label="Odometer (km)">
              <Input type="number" min="0" value={form.odometer} onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))} placeholder="0" />
            </Field>
            <Field label="Acquisition Cost">
              <Input type="number" min="0" value={form.acquisition_cost} onChange={(e) => setForm((f) => ({ ...f, acquisition_cost: e.target.value }))} placeholder="620000" />
            </Field>
          </div>

          {error && <div className="rounded-md bg-[#FBEBEB] px-3 py-2.5 text-xs font-medium text-signal-stop">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Spinner /> : editing ? 'Save Changes' : 'Register Vehicle'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
