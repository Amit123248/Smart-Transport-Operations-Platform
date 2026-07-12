require('dotenv').config();
console.log("JWT_SECRET =", process.env.JWT_SECRET);
console.log("Current directory =", process.cwd());
const express = require('express');
const cors = require('cors');

require('./db'); // initializes DB and creates tables on startup

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const maintenanceRoutes = require('./routes/maintenance');
const fuelExpenseRoutes = require('./routes/fuelExpense');
const tripRoutes = require('./routes/trips');
const reportRoutes = require('./routes/reports');

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173'] }));
app.use(express.json());

// Health check must come BEFORE any router that has a blanket auth
// middleware mounted at '/api', otherwise that router intercepts this
// request first and blocks it for having no token.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TransitOps backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api', fuelExpenseRoutes); // handles /fuel-logs, /expenses, /vehicles/:id/cost-summary
app.use('/api', reportRoutes); // handles /dashboard/kpis, /reports/vehicle/:id, /reports/export/csv

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TransitOps backend running on http://localhost:${PORT}`);
});