// ============================================================
// RBAC matrix — derived from the "8. Settings & RBAC" wireframe
// table (Fleet / Driver / Trip / Fuel&Exp / Analytics columns)
// plus the login page's role -> default scope bullets.
// 'full' = create/edit, 'view' = read-only, 'none' = hidden/blocked.
//
// ASSUMPTION (not shown in the wireframe table, inferred):
//   - Dashboard is visible to every role.
//   - Maintenance follows the same access level as Fleet, since
//     maintenance is a fleet-management sub-function.
//   - Settings is Fleet Manager only (admin-style screen).
// Flag these to your backend teammates if they should differ.
// ============================================================

export const ROLES = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

export const PERMISSIONS = {
  'Fleet Manager': {
    dashboard: 'full', fleet: 'full', drivers: 'full', trips: 'none',
    maintenance: 'full', fuelExpenses: 'none', analytics: 'full', settings: 'full',
  },
  'Dispatcher': {
    dashboard: 'full', fleet: 'view', drivers: 'none', trips: 'full',
    maintenance: 'view', fuelExpenses: 'none', analytics: 'none', settings: 'none',
  },
  'Safety Officer': {
    dashboard: 'full', fleet: 'none', drivers: 'full', trips: 'view',
    maintenance: 'none', fuelExpenses: 'none', analytics: 'none', settings: 'none',
  },
  'Financial Analyst': {
    dashboard: 'full', fleet: 'view', drivers: 'none', trips: 'none',
    maintenance: 'view', fuelExpenses: 'full', analytics: 'full', settings: 'none',
  },
};

export function accessLevel(role, moduleKey) {
  return PERMISSIONS[role]?.[moduleKey] || 'none';
}

export function canAccess(role, moduleKey) {
  return accessLevel(role, moduleKey) !== 'none';
}

export function canEdit(role, moduleKey) {
  return accessLevel(role, moduleKey) === 'full';
}
