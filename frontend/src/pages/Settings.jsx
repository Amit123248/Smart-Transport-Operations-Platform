import React from 'react';
import { ROLES, PERMISSIONS } from '../permissions.js';
import { PageHeader, Panel } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'fleet', label: 'Vehicle Registry' },
  { key: 'drivers', label: 'Drivers & Safety' },
  { key: 'trips', label: 'Trip Dispatcher' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'fuelExpenses', label: 'Fuel & Expenses' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
];

const LEVEL_STYLE = {
  full: 'bg-[#EAF6F2] text-signal-go',
  view: 'bg-[#EAF0FC] text-signal-transit',
  none: 'bg-[#F0F0EE] text-muted',
};

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        eyebrow="Access Control"
        title="Settings & RBAC"
        description="Role-based access is enforced client-side for navigation and server-side on every write endpoint via the JWT's role claim."
      />

      <Panel className="p-5 mb-6">
        <h3 className="font-display font-semibold text-ink mb-4">Your Account</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted mb-1">Name</p>
            <p className="font-semibold text-ink">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Email</p>
            <p className="font-semibold text-ink">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Role</p>
            <p className="font-semibold text-ink">{user.role}</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="border-b border-line px-5 py-4">
          <h3 className="font-display font-semibold text-ink">Permission Matrix</h3>
          <p className="text-xs text-muted mt-0.5">Full access, view-only, or hidden — per role, per module</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted border-b border-line">
                <th className="px-5 py-3">Module</th>
                {ROLES.map((r) => <th key={r} className="px-3 py-3">{r}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MODULES.map((m) => (
                <tr key={m.key}>
                  <td className="px-5 py-3.5 font-semibold text-ink">{m.label}</td>
                  {ROLES.map((r) => {
                    const level = PERMISSIONS[r][m.key];
                    return (
                      <td key={r} className="px-3 py-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${LEVEL_STYLE[level]}`}>
                          {level}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
