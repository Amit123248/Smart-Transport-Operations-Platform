const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('Seeding database...');

// ---- USERS ----
const users = [
  { name: 'Amit Fleet Manager', email: 'fleet@transitops.com', password: 'password123', role: 'Fleet Manager' },
  { name: 'Sara Safety Officer', email: 'safety@transitops.com', password: 'password123', role: 'Safety Officer' },
  { name: 'Raj Financial Analyst', email: 'finance@transitops.com', password: 'password123', role: 'Financial Analyst' },
  { name: 'Divya Dispatcher', email: 'dispatch@transitops.com', password: 'password123', role: 'Dispatcher' }
];

const insertUser = db.prepare(
  'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
);

users.forEach(u => {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
  if (!exists) {
    const hash = bcrypt.hashSync(u.password, 10);
    insertUser.run(u.name, u.email, hash, u.role);
    console.log(`Created user: ${u.email} / password123 (${u.role})`);
  }
});

// ---- VEHICLES ----
const vehicles = [
  { reg_number: 'Van-05', name: 'Van-05', type: 'Van', max_load: 500, odometer: 12000, acquisition_cost: 20000, status: 'Available' },
  { reg_number: 'Truck-11', name: 'Truck-11', type: 'Truck', max_load: 2000, odometer: 45000, acquisition_cost: 55000, status: 'Available' },
  { reg_number: 'Van-08', name: 'Van-08', type: 'Van', max_load: 500, odometer: 30000, acquisition_cost: 21000, status: 'In Shop' },
  { reg_number: 'Truck-14', name: 'Truck-14', type: 'Truck', max_load: 2500, odometer: 60000, acquisition_cost: 60000, status: 'Retired' },
  { reg_number: 'Mini-02', name: 'Mini-02', type: 'Mini Truck', max_load: 800, odometer: 8000, acquisition_cost: 18000, status: 'Available' }
];

const insertVehicle = db.prepare(
  `INSERT INTO vehicles (reg_number, name, type, max_load, odometer, acquisition_cost, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

vehicles.forEach(v => {
  const exists = db.prepare('SELECT id FROM vehicles WHERE reg_number = ?').get(v.reg_number);
  if (!exists) {
    insertVehicle.run(v.reg_number, v.name, v.type, v.max_load, v.odometer, v.acquisition_cost, v.status);
    console.log(`Created vehicle: ${v.reg_number} (${v.status})`);
  }
});

// ---- DRIVERS ----
const drivers = [
  { name: 'Alex Kumar', license_number: 'DL1001', license_category: 'LMV', license_expiry: '2027-06-01', contact: '9000000001', safety_score: 95, status: 'Available' },
  { name: 'Priya Sharma', license_number: 'DL1002', license_category: 'HMV', license_expiry: '2027-01-15', contact: '9000000002', safety_score: 88, status: 'Available' },
  { name: 'Ravi Singh', license_number: 'DL1003', license_category: 'LMV', license_expiry: '2025-01-01', contact: '9000000003', safety_score: 70, status: 'Available' },
  { name: 'Neha Gupta', license_number: 'DL1004', license_category: 'HMV', license_expiry: '2027-09-01', contact: '9000000004', safety_score: 60, status: 'Suspended' },
  { name: 'Karan Mehta', license_number: 'DL1005', license_category: 'LMV', license_expiry: '2027-03-01', contact: '9000000005', safety_score: 90, status: 'Off Duty' }
];

const insertDriver = db.prepare(
  `INSERT INTO drivers (name, license_number, license_category, license_expiry, contact, safety_score, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

drivers.forEach(d => {
  const exists = db.prepare('SELECT id FROM drivers WHERE license_number = ?').get(d.license_number);
  if (!exists) {
    insertDriver.run(d.name, d.license_number, d.license_category, d.license_expiry, d.contact, d.safety_score, d.status);
    console.log(`Created driver: ${d.name} (${d.status}, license expiry ${d.license_expiry})`);
  }
});

console.log('Seeding complete.');