import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { canAccess } from '../permissions.js';

export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireModule({ moduleKey, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(user.role, moduleKey)) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FBEBEB] text-signal-stop text-2xl font-display font-bold mb-4">
          ×
        </div>
        <h2 className="font-display text-lg font-semibold text-ink">Restricted to your role</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          Your role, <span className="font-semibold text-ink">{user.role}</span>, doesn't have
          access to this module. Ask a Fleet Manager to adjust permissions in Settings.
        </p>
      </div>
    );
  }
  return children;
}
