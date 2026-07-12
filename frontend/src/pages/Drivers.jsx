import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ShieldAlert } from 'lucide-react';
import { listDrivers, createDriver, updateDriver, deleteDriver } from '../api/drivers.js';
import { PageHeader, Panel, Button, Modal, Field, Input, Select, EmptyState, Spinner } from '../components/ui.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canEdit } from '../permissions.js';

const STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
const CATEGORIES = ['LMV', 'HMV', 'MC'];
const EMPTY = { name: '', license_number: '', license_category: 'LMV', license_expiry: '', contact: '' };

function isExpired(date) {
  return new Date(date) <= new Date();
}
function expiresSoon(date) {
  const d = new Date(date);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  return d > new Date() && d <= in30;
}

export default function Drivers() {
  const { user } = useAuth();
  const editable = canEdit(user.role, 'drivers');
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setDrivers(await listDrivers());
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  const expiringSoon = useMemo(() => drivers.filter((d) => expiresSoon(d.license_expiry) || isExpired(d.license_expiry)), [drivers]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setModalOpen(true);
  }
  function openEdit(d) {
    setEditing(d);
    setForm({ ...d });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateDriver(editing.id, form);
        showToast(`${form.name}'s profile updated.`, 'success');
      } else {
        await createDriver(form);
        showToast(`${form.name} added to the roster.`, 'success');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err.message || 'Could not save driver.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(d, status) {
    await updateDriver(d.id, { status });
    showToast(`${d.name} marked ${status}.`, status === 'Suspended' ? 'error' : 'success');
    refresh();
  }

  async function handleDelete(d) {
    if (!confirm(`Remove ${d.name} from the roster?`)) return;
    await deleteDriver(d.id);
    showToast(`${d.name} removed.`, 'default');
    refresh();
  }

  const filtered = drivers.filter((d) =>
    !query || `${d.name} ${d.license_number} ${d.contact}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        eyebrow="Roster & Compliance"
        title="Drivers & Safety Profiles"
        description="License validity and safety scores. Expired licenses or Suspended status automatically block trip assignment."
        action={editable && <Button onClick={openCreate}><Plus size={15} /> Add Driver</Button>}
      />

      {expiringSoon.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-[#F3DCA0] bg-[#FEF6E2] px-4 py-3.5">
          <ShieldAlert size={17} className="text-[#8A6100] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-[#8A6100]">{expiringSoon.length} license{expiringSoon.length > 1 ? 's' : ''} need attention</p>
            <p className="text-[#8A6100]/80 text-xs mt-0.5">
              {expiringSoon.map((d) => d.name).join(', ')} — expired or expiring within 30 days.
            </p>
          </div>
        </div>
      )}

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder="Search by name, license, contact…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-muted h-6 w-6" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🪪" title="No drivers found" description="Adjust your search or add the first driver." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted border-b border-line">
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-3 py-3">License</th>
                  <th className="px-3 py-3">Expiry</th>
                  <th className="px-3 py-3">Safety Score</th>
                  <th className="px-3 py-3">Status</th>
                  {editable && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((d) => {
                  const expired = isExpired(d.license_expiry);
                  return (
                    <tr key={d.id} className="hover:bg-black/[0.015]">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-ink">{d.name}</p>
                        <p className="text-xs text-muted">{d.contact}</p>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-xs text-muted">{d.license_number} · {d.license_category}</td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-mono ${expired ? 'text-signal-stop font-semibold' : expiresSoon(d.license_expiry) ? 'text-[#8A6100] font-semibold' : 'text-muted'}`}>
                          {d.license_expiry}{expired ? ' · expired' : ''}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-[#F0F0EE] overflow-hidden">
                            <div className="h-full rounded-full bg-signal-go" style={{ width: `${d.safety_score}%` }} />
                          </div>
                          <span className="text-xs font-mono text-muted">{d.safety_score}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        {editable ? (
                          <select
                            value={d.status}
                            onChange={(e) => handleStatusChange(d, e.target.value)}
                            className="rounded-full border-0 bg-transparent text-xs font-semibold focus:ring-1 focus:ring-ink cursor-pointer"
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <StatusBadge status={d.status} />
                        )}
                      </td>
                      {editable && (
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => openEdit(d)} className="p-1.5 rounded-md text-muted hover:bg-black/5 hover:text-ink" aria-label="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(d)} className="p-1.5 rounded-md text-muted hover:bg-[#FBEBEB] hover:text-signal-stop" aria-label="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Driver' : 'Add Driver'} subtitle="Status defaults to Available and safety score to 100 for new drivers.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full Name" required>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Alex Rao" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="License Number" required>
              <Input required value={form.license_number} onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))} placeholder="DL-88213" className="font-mono" />
            </Field>
            <Field label="License Category" required>
              <Select value={form.license_category} onChange={(e) => setForm((f) => ({ ...f, license_category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="License Expiry" required>
              <Input required type="date" value={form.license_expiry} onChange={(e) => setForm((f) => ({ ...f, license_expiry: e.target.value }))} />
            </Field>
            <Field label="Contact Number" required>
              <Input required value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="9876500000" />
            </Field>
          </div>

          {error && <div className="rounded-md bg-[#FBEBEB] px-3 py-2.5 text-xs font-medium text-signal-stop">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Spinner /> : editing ? 'Save Changes' : 'Add Driver'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
