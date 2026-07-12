import { request } from './client.js';
import { store, delay } from './mockStore.js';

// GET /api/fuel-logs -> FuelLog[]
export async function listFuelLogs() {
  try {
    return await request('/fuel-logs');
  } catch {
    await delay();
    return [...store.fuelLogs];
  }
}

// POST /api/fuel-logs { vehicle_id, liters, cost, date } -> 201 FuelLog
export async function createFuelLog(payload) {
  try {
    return await request('/fuel-logs', { method: 'POST', body: payload });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const log = { id: store.nextId.fuelLogs++, ...payload };
    store.fuelLogs.push(log);
    return log;
  }
}

// GET /api/expenses -> Expense[]
export async function listExpenses() {
  try {
    return await request('/expenses');
  } catch {
    await delay();
    return [...store.expenses];
  }
}

// POST /api/expenses { vehicle_id, type, amount, date } -> 201 Expense
export async function createExpense(payload) {
  try {
    return await request('/expenses', { method: 'POST', body: payload });
  } catch (err) {
    if (err.status) throw err;
    await delay();
    const expense = { id: store.nextId.expenses++, ...payload };
    store.expenses.push(expense);
    return expense;
  }
}
