import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { RequireAuth, RequireModule } from './components/RouteGuards.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import VehicleRegistry from './pages/VehicleRegistry.jsx';
import Drivers from './pages/Drivers.jsx';
import Trips from './pages/Trips.jsx';
import Maintenance from './pages/Maintenance.jsx';
import FuelExpenses from './pages/FuelExpenses.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';

function Shell({ moduleKey, children }) {
  return (
    <RequireAuth>
      <Layout>
        <RequireModule moduleKey={moduleKey}>{children}</RequireModule>
      </Layout>
    </RequireAuth>
  );
}

export default function App() {
  const { ready } = useAuth();
  if (!ready) return null;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Shell moduleKey="dashboard"><Dashboard /></Shell>} />
      <Route path="/fleet" element={<Shell moduleKey="fleet"><VehicleRegistry /></Shell>} />
      <Route path="/drivers" element={<Shell moduleKey="drivers"><Drivers /></Shell>} />
      <Route path="/trips" element={<Shell moduleKey="trips"><Trips /></Shell>} />
      <Route path="/maintenance" element={<Shell moduleKey="maintenance"><Maintenance /></Shell>} />
      <Route path="/fuel-expenses" element={<Shell moduleKey="fuelExpenses"><FuelExpenses /></Shell>} />
      <Route path="/analytics" element={<Shell moduleKey="analytics"><Analytics /></Shell>} />
      <Route path="/settings" element={<Shell moduleKey="settings"><Settings /></Shell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
