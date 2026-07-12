import React, { useEffect, useState } from 'react';
import { Plus, Send, CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
import { listTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from '../api/trips.js';
import { listAvailableVehicles } from '../api/vehicles.js';
import { listAvailableDrivers } from '../api/drivers.js';
import { PageHeader, Panel, Button, Modal, Field, Input, Select, EmptyState, Spinner } from '../components/ui.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canEdit } from '../permissions.js';

const EMPTY = { source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' };
const FILTERS = ['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'];

export default function Trips() {
  const { user } = useAuth();
  const editable = canEdit(user.role, 'trips');
  const { showToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [completeModal, setCompleteModal] = useState(null);
  const [completeForm, setCompleteForm] = useState({ final_odometer: '', fuel_consumed: '' });
  const [busyId, setBusyId] = useState(null);

  async function refresh() {
    setLoading(true);
    const [t] = await Promise.all([listTrips()]);
    setTrips(t);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function openCreate() {
    setError('');
    setForm(EMPTY);
    setModalOpen(true);
    const [v, d] = await Promise.all([listAvailableVehicles(), listAvailableDrivers()]);
    setVehicles(v);
    setDrivers(d);
  }

  const selectedVehicle = vehicles.find((v) => String(v.id) === String(form.vehicle_id));
  const capacityExceeded = selectedVehicle && form.cargo_weight && Number(form.cargo_weight) > selectedVehicle.max_load;

  async function handleSubmit(e) {
    e.preventDefault();
    if (capacityExceeded) {
      setError(`Cargo weight exceeds ${selectedVehicle.name}'s max load of ${selectedVehicle.max_load} kg.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createTrip({
        source: form.source,
        destination: form.destination,
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight: Number(form.cargo_weight),
        planned_distance: Number(form.planned_distance),
      });
      showToast('Trip created as Draft.', 'success');
      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err.message || 'Could not create trip.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDispatch(t) {
    setBusyId(t.id);
    try {
      await dispatchTrip(t.id);
      showToast(`Trip #${t.id} dispatched — vehicle & driver now On Trip.`, 'success');
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not dispatch trip.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(t) {
    if (!confirm(`Cancel trip #${t.id} from ${t.source} to ${t.destination}?`)) return;
    setBusyId(t.id);
    try {
      await cancelTrip(t.id);
      showToast(`Trip #${t.id} cancelled.`, 'default');
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not cancel trip.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleComplete(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await completeTrip(completeModal.id, {
        final_odometer: Number(completeForm.final_odometer),
        fuel_consumed: Number(completeForm.fuel_consumed),
      });
      showToast(`Trip #${completeModal.id} completed.`, 'success');
      setCompleteModal(null);
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not complete trip.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter === 'All' ? trips : trips.filter((t) => t.status === filter);

  return (
    <div>
      <PageHeader
        eyebrow="Live Dispatch"
        title="Trip Dispatcher"
        description="Vehicle and driver dropdowns only ever list Available options — retired, in-shop, suspended, and expired-license entries never appear here."
        action={editable && <Button onClick={openCreate}><Plus size={15} /> New Trip</Button>}
      />

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? 'bg-ink text-white' : 'bg-[#F0F0EE] text-muted hover:text-ink'
            }`}
          >
            {f} {f !== 'All' && `(${trips.filter((t) => t.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="text-muted h-6 w-6" /></div>
      ) : filtered.length === 0 ? (
        <Panel><EmptyState icon="🧭" title="No trips here" description="Create a new trip to get it into the dispatch queue." /></Panel>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <Panel key={t.id} className="p-4 sm:p-5 manifest-perf pl-8 relative">
              <span className="manifest-rail" style={{ background: railColor(t.status) }} />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted mb-2">
                    <span>TRIP #{t.id}</span>
                    <span>·</span>
                    <span>{t.created_at}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="font-display font-semibold text-ink">{t.source}</span>
                    <span className="route-line" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="route-line" />
                    <span className="font-display font-semibold text-ink">{t.destination}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>Cargo: <strong className="text-ink">{t.cargo_weight} kg</strong></span>
                    <span>Distance: <strong className="text-ink">{t.planned_distance} km</strong></span>
                    {t.final_odometer != null && <span>Final odometer: <strong className="text-ink">{t.final_odometer} km</strong></span>}
                    {t.fuel_consumed != null && <span>Fuel used: <strong className="text-ink">{t.fuel_consumed} L</strong></span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <StatusBadge status={t.status} />
                  {editable && (
                    <div className="flex gap-1.5">
                      {t.status === 'Draft' && (
                        <Button size="sm" onClick={() => handleDispatch(t)} disabled={busyId === t.id}>
                          {busyId === t.id ? <Spinner /> : <Send size={12} />} Dispatch
                        </Button>
                      )}
                      {t.status === 'Dispatched' && (
                        <Button size="sm" onClick={() => { setCompleteModal(t); setCompleteForm({ final_odometer: '', fuel_consumed: '' }); }}>
                          <PackageCheck size={12} /> Complete
                        </Button>
                      )}
                      {(t.status === 'Draft' || t.status === 'Dispatched') && (
                        <Button size="sm" variant="danger" onClick={() => handleCancel(t)} disabled={busyId === t.id}>
                          <XCircle size={12} /> Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Create trip modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Trip" subtitle="Server re-validates capacity, status, and license expiry — this is a live preview.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source" required>
              <Input required value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="Gandhinagar Depot" />
            </Field>
            <Field label="Destination" required>
              <Input required value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} placeholder="Ahmedabad Hub" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vehicle" required hint={vehicles.length === 0 ? 'No available vehicles right now.' : undefined}>
              <Select required value={form.vehicle_id} onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · max {v.max_load}kg</option>)}
              </Select>
            </Field>
            <Field label="Driver" required hint={drivers.length === 0 ? 'No available drivers right now.' : undefined}>
              <Select required value={form.driver_id} onChange={(e) => setForm((f) => ({ ...f, driver_id: e.target.value }))}>
                <option value="">Select driver</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.license_category}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cargo Weight (kg)" required error={capacityExceeded ? `Exceeds vehicle capacity by ${form.cargo_weight - selectedVehicle.max_load} kg` : undefined}>
              <Input required type="number" min="0" value={form.cargo_weight} onChange={(e) => setForm((f) => ({ ...f, cargo_weight: e.target.value }))} placeholder="450" />
            </Field>
            <Field label="Planned Distance (km)" required>
              <Input required type="number" min="0" value={form.planned_distance} onChange={(e) => setForm((f) => ({ ...f, planned_distance: e.target.value }))} placeholder="150" />
            </Field>
          </div>

          {error && <div className="rounded-md bg-[#FBEBEB] px-3 py-2.5 text-xs font-medium text-signal-stop">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || capacityExceeded}>{saving ? <Spinner /> : 'Create Trip'}</Button>
          </div>
        </form>
      </Modal>

      {/* Complete trip modal */}
      <Modal open={!!completeModal} onClose={() => setCompleteModal(null)} title={`Complete Trip #${completeModal?.id}`} subtitle="Enter final odometer and fuel consumed to close out this trip.">
        <form onSubmit={handleComplete} className="space-y-4">
          <Field label="Final Odometer (km)" required>
            <Input required type="number" min="0" value={completeForm.final_odometer} onChange={(e) => setCompleteForm((f) => ({ ...f, final_odometer: e.target.value }))} placeholder="12150" />
          </Field>
          <Field label="Fuel Consumed (L)" required>
            <Input required type="number" min="0" step="0.1" value={completeForm.fuel_consumed} onChange={(e) => setCompleteForm((f) => ({ ...f, fuel_consumed: e.target.value }))} placeholder="18.5" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCompleteModal(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Spinner /> : <><CheckCircle2 size={14} /> Mark Completed</>}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function railColor(status) {
  const map = { Draft: '#8A8F98', Dispatched: '#E0A800', Completed: '#128A6E', Cancelled: '#D53B3B' };
  return map[status] || '#8A8F98';
}
