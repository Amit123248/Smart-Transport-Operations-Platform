import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings as SettingsIcon,
  LogOut, Menu, X, ChevronsLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { canAccess } from '../permissions.js';

const NAV = [
  { to: '/', label: 'Dashboard', module: 'dashboard', icon: LayoutGrid, end: true },
  { to: '/fleet', label: 'Vehicle Registry', module: 'fleet', icon: Truck },
  { to: '/drivers', label: 'Drivers & Safety', module: 'drivers', icon: Users },
  { to: '/trips', label: 'Trip Dispatcher', module: 'trips', icon: Route },
  { to: '/maintenance', label: 'Maintenance', module: 'maintenance', icon: Wrench },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', module: 'fuelExpenses', icon: Fuel },
  { to: '/analytics', label: 'Reports & Analytics', module: 'analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings & RBAC', module: 'settings', icon: SettingsIcon },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const items = NAV.filter((n) => canAccess(user.role, n.module));
  const current = NAV.find((n) => window.location.pathname === n.to || (n.to !== '/' && window.location.pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen flex">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between bg-console px-4 h-14 text-white">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display font-semibold text-sm">TransitOps</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 z-30 h-screen bg-console text-white flex flex-col
          transition-all duration-200 ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          w-64 pt-14 lg:pt-0
        `}
      >
        <div className="hidden lg:flex items-center gap-2.5 px-5 h-16 border-b border-console-line shrink-0">
          <LogoMark />
          {!collapsed && (
            <div className="leading-none">
              <p className="font-display font-semibold text-sm">TransitOps</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mt-0.5">Console</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors relative ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent" />}
                    <Icon size={17} strokeWidth={2} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-console-line p-3 shrink-0">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs text-white/45 hover:text-white hover:bg-white/5 mb-1"
          >
            <ChevronsLeft size={15} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && 'Collapse'}
          </button>
          <div className={`flex items-center gap-2.5 px-1 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xs font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="truncate text-[11px] text-white/45">{user.role}</p>
              </div>
            )}
            <button onClick={handleLogout} aria-label="Log out" className="text-white/40 hover:text-accent">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-ink/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 pt-14 lg:pt-0">
        <header className="hidden lg:flex items-center justify-between h-16 border-b border-line bg-paper/80 backdrop-blur px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <span className="text-ink font-semibold">{current?.label || 'TransitOps'}</span>
            <span>/</span>
            <span>{today()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#F0F0EE] px-3 py-1 text-xs font-semibold text-ink">{user.role}</span>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}

function today() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 100 100" fill="none" className="shrink-0">
      <rect width="100" height="100" rx="22" fill="#FF5A1F" />
      <path d="M20 62 L45 32 L58 48 L80 24" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
