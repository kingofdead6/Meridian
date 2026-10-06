/* eslint-disable no-console */
/**
 * Seeds a demo company with six months of realistic, fully posted activity.
 * Every document goes through the same services the API uses, so the ledger,
 * stock levels and reports are consistent. WARNING: drops the configured database.
 *
 *   npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';
import Contact from '../models/Contact.js';
import StockLevel from '../models/StockLevel.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import AuditLog from '../models/AuditLog.js';
import Invoice from '../models/Invoice.js';
import { setupCompany } from '../services/setup.js';
import { postEntry } from '../services/ledger.js';
import { createOrder, confirmOrder, fulfillOrder, invoiceOrder } from '../services/orders.js';
import { createInvoice, postInvoice } from '../services/invoices.js';
import { recordPayment } from '../services/payments.js';
import { generatePayroll, postPayroll } from '../services/payroll.js';
import { adjustStock, transferStock } from '../services/inventory.js';

// Deterministic randomness so every seed looks the same
let seed = 20260601;
const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const sample = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);

const TODAY = new Date();
const day = (base, offset) => { const d = new Date(base); d.setDate(d.getDate() + offset); d.setHours(10, 0, 0, 0); return d > TODAY ? new Date(TODAY) : d; };
const PASSWORD = 'demo1234';

const PRODUCTS = [
  ['DSK-ERG-01', 'Ergonomic standing desk', 'Furniture', 649, 380, 5],
  ['CHR-MSH-02', 'Mesh task chair', 'Furniture', 289, 150, 8],
  ['CBN-FIL-04', 'Four-drawer filing cabinet', 'Furniture', 329, 185, 3],
  ['MON-27-4K', '27-inch 4K monitor', 'Electronics', 379, 255, 6],
  ['KBD-MEC-75', 'Mechanical keyboard', 'Electronics', 129, 68, 10],
  ['MSE-WRL-03', 'Wireless mouse', 'Electronics', 49, 21, 15],
  ['DCK-USBC-12', 'USB-C docking station', 'Electronics', 189, 112, 6],
  ['HDS-NC-07', 'Noise-cancelling headset', 'Electronics', 219, 132, 6],
  ['LMP-LED-05', 'LED desk lamp', 'Accessories', 59, 26, 10],
  ['ARM-MON-02', 'Dual monitor arm', 'Accessories', 119, 58, 6],
  ['CAB-USB-10', 'USB-C cables, pack of 10', 'Accessories', 39, 14, 20],
  ['WBD-MAG-90', 'Magnetic whiteboard 90 cm', 'Office supplies', 145, 72, 4],
  ['PPR-A4-500', 'A4 paper, box of 5 reams', 'Office supplies', 32, 19, 25],
  ['NTB-DOT-A5', 'Dotted notebook A5', 'Office supplies', 12, 4.5, 30],
  ['PEN-GEL-12', 'Gel pens, pack of 12', 'Office supplies', 9, 3.2, 30],
];

const SUPPLIER_FOR = {
  Furniture: 'Apex Furniture Manufacturing',
  Electronics: 'Voltline Electronics',
  Accessories: 'Ridgeway Accessories',
  'Office supplies': 'Paperworks Wholesale',
};

const CUSTOMERS = [
  ['Northwind Studio', 'Hannah Wells', 'Portland', 30], ['Brightline Dental', 'Dr. Omar Faris', 'Seattle', 15],
  ['Harbor & Finch Law', 'Grace Finch', 'Boston', 30], ['Kestrel Analytics', 'Ivan Petrov', 'Austin', 30],
  ['Oakridge Primary School', 'Linda Mensah', 'Denver', 45], ['Lumen Architects', 'Sofia Reyes', 'Chicago', 30],
  ['Cobalt Coworking', 'Marcus Lee', 'Austin', 15], ['Summit Physio', 'Chloe Martin', 'Denver', 30],
  ['Vela Logistics', 'Ahmed Karim', 'Houston', 30], ['Juniper Labs', 'Noah Fischer', 'San Diego', 30],
];

const SUPPLIERS = [
  ['Apex Furniture Manufacturing', 'Grand Rapids'], ['Voltline Electronics', 'San Jose'], ['Ridgeway Accessories', 'Dallas'],
  ['Paperworks Wholesale', 'Atlanta'], ['Harbor Properties', 'Austin'], ['CityGrid Utilities', 'Austin'], ['Spark Media', 'Austin'],
];

async function main() {
  await connectDB();
  console.log('Dropping database…');
  await mongoose.connection.dropDatabase();
  await mongoose.connection.syncIndexes().catch((e) => console.warn('Index sync warning:', e.message));

  const company = await Company.create({
    name: 'Meridian Supply Co.', legalName: 'Meridian Supply Company LLC', email: 'hello@meridian.demo', phone: '+1 512 555 0142',
    website: 'meridian.demo', address: '1200 Riverside Drive', city: 'Austin', country: 'United States', taxId: 'US-84-2290117', currency: 'USD',
  });
  await setupCompany(company._id);

  const users = {};
  for (const [role, name] of [['admin', 'Alex Morgan'], ['manager', 'Priya Shah'], ['accountant', 'Daniel Okafor'], ['sales', 'Lucía Romero'], ['warehouse', 'Tom Becker'], ['hr', 'Mei Lin']]) {
    users[role] = await User.create({ company: company._id, name, role, email: `${role}@meridian.demo`, password: PASSWORD });
  }
  const admin = users.admin;
  const actor = { _id: admin._id, company: company._id, name: admin.name };

  const acc = Object.fromEntries((await Account.find({ company: company._id })).map((a) => [a.systemKey || a.code, a._id]));
  const main = await Warehouse.findOne({ company: company._id, isDefault: true });
  const store = await Warehouse.create({ company: company._id, name: 'Downtown showroom', code: 'DTWN', address: '45 Congress Ave, Austin' });

  const products = await Product.insertMany([
    ...PRODUCTS.map(([sku, name, category, salePrice, purchasePrice, reorderLevel]) => ({
      company: company._id, sku, name, category, salePrice, purchasePrice: Math.round(purchasePrice * 88) / 100, avgCost: Math.round(purchasePrice * 88) / 100, reorderLevel: reorderLevel * 3, type: 'goods', taxRate: 20,
    })),
    { company: company._id, sku: 'SRV-INST', name: 'Installation and setup', category: 'Services', type: 'service', unit: 'hour', salePrice: 85, taxRate: 20 },
    { company: company._id, sku: 'SRV-CONS', name: 'Workspace design consultation', category: 'Services', type: 'service', unit: 'hour', salePrice: 120, taxRate: 20 },
  ]);
  const goods = products.filter((p) => p.type === 'goods');
  const install = products.find((p) => p.sku === 'SRV-INST');
  const consult = products.find((p) => p.sku === 'SRV-CONS');

  const customers = await Contact.insertMany(CUSTOMERS.map(([name, contactPerson, city, terms]) => ({
    company: company._id, type: 'customer', name, contactPerson, city, country: 'United States', paymentTermsDays: terms,
    email: `accounts@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`, phone: `+1 555 ${between(100, 999)} ${between(1000, 9999)}`,
  })));
  const suppliers = await Contact.insertMany(SUPPLIERS.map(([name, city]) => ({
    company: company._id, type: 'supplier', name, city, country: 'United States', paymentTermsDays: 30,
    email: `billing@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
  })));
  const supplier = (name) => suppliers.find((s) => s.name === name);

  const start = new Date(TODAY.getFullYear(), TODAY.getMonth() - 5, 1);
  await postEntry({
    company: company._id, date: start, source: 'opening', memo: 'Opening balances', user: admin._id,
    lines: [{ account: acc.bank, debit: 150000 }, { account: acc.cash, debit: 5000 }, { account: acc.equity, credit: 155000 }],
  });

  // HR first so payroll can run each month
  const deptDefs = [['Operations', '#2E6B4E'], ['Sales', '#3A5A8C'], ['Finance', '#8A6A1F'], ['Warehouse', '#6B4E8A'], ['People', '#A1503A']];
  const depts = Object.fromEntries((await Department.insertMany(deptDefs.map(([name, color]) => ({ company: company._id, name, color })))).map((d) => [d.name, d._id]));
  const staff = [
    ['Alex', 'Morgan', 'Operations', 'Managing director', 7200], ['Priya', 'Shah', 'Operations', 'Operations manager', 5200],
    ['Lucía', 'Romero', 'Sales', 'Account executive', 3900], ['Jamal', 'Brooks', 'Sales', 'Account executive', 3800],
    ['Ella', 'Novak', 'Sales', 'Sales coordinator', 3000], ['Daniel', 'Okafor', 'Finance', 'Accountant', 4300],
    ['Tom', 'Becker', 'Warehouse', 'Warehouse lead', 3400], ['Rafael', 'Costa', 'Warehouse', 'Logistics associate', 2800],
    ['Nina', 'Sato', 'Warehouse', 'Installer', 2900], ['Owen', 'Price', 'Warehouse', 'Installer', 2800],
    ['Mei', 'Lin', 'People', 'People partner', 3800], ['Sara', 'Haddad', 'Operations', 'Customer success', 3100],
  ];
  const employees = [];
  for (const [i, [firstName, lastName, dept, position, salary]] of staff.entries()) {
    employees.push(await Employee.create({
      company: company._id, employeeNo: `EMP-${String(i + 1).padStart(5, '0')}`, firstName, lastName, position, salary,
      department: depts[dept], email: `${firstName.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}@meridian.demo`,
      phone: `+1 512 555 ${between(1000, 9999)}`, hireDate: new Date(2021 + (i % 5), between(0, 11), between(1, 28)),
    }));
  }
  const { default: Counter } = await import('../models/Counter.js');
  await Counter.create({ company: company._id, key: 'employee', seq: employees.length });

  const stockOf = async (product) => (await StockLevel.findOne({ company: company._id, product, warehouse: main._id }))?.quantity || 0;
  const payIfDue = async (inv, date, share = 1) => {
    if (date > TODAY) return;
    const fresh = await Invoice.findById(inv._id);
    const amount = Math.round(fresh.total * share * 100) / 100;
    if (amount > 0) {
      await recordPayment({ invoice: inv._id, amount, date, method: pick(['bank_transfer', 'bank_transfer', 'card', 'check']), account: acc.bank }, { user: actor });
    }
  };

  let invoiceCount = 0;
  for (let m = 5; m >= 0; m -= 1) {
    const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1);
    const isCurrent = m === 0;
    console.log(`Month ${monthStart.toLocaleString('en', { month: 'long', year: 'numeric' })}`);

    // Rent, utilities and marketing bills
    const expenses = [
      ['Harbor Properties', 'Office and warehouse rent', 4200, 0, acc.rent, 1],
      ['CityGrid Utilities', 'Electricity and water', between(380, 560), 20, acc.utilities, 6],
    ];
    if (m % 2 === 0) expenses.push(['Spark Media', 'Social and search campaign', between(700, 1600), 20, acc.marketing, 9]);
    for (const [name, description, unitPrice, taxRate, account, offset] of expenses) {
      const date = day(monthStart, offset);
      const bill = await createInvoice(actor, { kind: 'supplier', contact: supplier(name)._id, date, lines: [{ description, quantity: 1, unitPrice, taxRate, account }] });
      await postInvoice(bill._id, { user: actor });
      if (!isCurrent || offset < TODAY.getDate() - 2) await payIfDue(bill, day(date, 3));
    }

    // Restock: one purchase order per supplier category
    for (const [category, supplierName] of Object.entries(SUPPLIER_FOR)) {
      const items = goods.filter((p) => p.category === category);
      const lines = [];
      for (const p of items) {
        const have = await stockOf(p._id);
        const target = p.reorderLevel * (m === 5 ? 5 : 4);
        if (have < target) lines.push({ product: p._id, description: p.name, quantity: target - have + between(0, 4), unitPrice: p.purchasePrice, taxRate: 20 });
      }
      if (!lines.length) continue;
      const date = day(monthStart, between(1, 4));
      const po = await createOrder(actor, { kind: 'purchase', contact: supplier(supplierName)._id, date, lines, warehouse: main._id });
      await confirmOrder(po);
      if (isCurrent && rand() < 0.35) continue; // still waiting for delivery
      await fulfillOrder(po._id, { user: actor, date: day(date, 3) });
      const bill = await invoiceOrder(po._id, { user: actor, date: day(date, 4) });
      await postInvoice(bill._id, { user: actor });
      if (!isCurrent) await payIfDue(bill, day(date, between(18, 28)));
    }

    // Sales: growing a little each month
    const salesCount = isCurrent ? Math.max(4, Math.round(TODAY.getDate() * 0.8)) : 18 + (5 - m) * 2;
    for (let s = 0; s < Math.max(salesCount, 3); s += 1) {
      const customer = pick(customers);
      const lines = [];
      for (const p of sample(goods, between(2, 5))) {
        const qty = Math.min(p.category === 'Furniture' ? between(3, 12) : between(5, 24), await stockOf(p._id));
        if (qty > 0) lines.push({ product: p._id, description: p.name, quantity: qty, unitPrice: p.salePrice, taxRate: 20, discount: rand() < 0.2 ? 5 : 0 });
      }
      if (rand() < 0.4) lines.push({ product: install._id, description: install.name, quantity: between(4, 16), unitPrice: install.salePrice, taxRate: 20 });
      if (!lines.length) continue;

      const maxDay = isCurrent ? Math.max(TODAY.getDate() - 1, 1) : 26;
      const date = day(monthStart, between(0, maxDay - 1));
      const so = await createOrder(actor, { kind: 'sale', contact: customer._id, date, lines, warehouse: main._id });
      if (isCurrent && s >= salesCount - 2) continue; // open quotations
      await confirmOrder(so);
      if (isCurrent && s === salesCount - 3) continue; // confirmed, awaiting delivery
      await fulfillOrder(so._id, { user: actor, date: day(date, 1) });
      const inv = await invoiceOrder(so._id, { user: actor, date: day(date, 1) });
      await postInvoice(inv._id, { user: actor });
      invoiceCount += 1;

      const due = new Date(inv.dueDate);
      const roll = rand();
      if (due < TODAY) {
        if (roll < 0.8) await payIfDue(inv, day(due, between(-10, 4)));
        else if (roll < 0.9) await payIfDue(inv, day(due, -5), 0.5);
        // else: left overdue on purpose
      } else if (roll < 0.3) await payIfDue(inv, day(date, between(3, 10)));
    }

    // A consultation invoiced directly, without an order
    if (m % 2 === 1) {
      const date = day(monthStart, between(10, 20));
      const inv = await createInvoice(actor, {
        kind: 'customer', contact: pick(customers)._id, date,
        lines: [{ product: consult._id, description: 'Workspace layout and ergonomics review', quantity: between(4, 12), unitPrice: consult.salePrice, taxRate: 20 }],
      });
      await postInvoice(inv._id, { user: actor });
      await payIfDue(inv, day(date, 14));
    }

    // Payroll for completed months
    if (!isCurrent || TODAY.getDate() >= 25) {
      const period = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
      const run = await generatePayroll(period, { user: actor });
      await postPayroll(run._id, { user: actor, account: acc.bank });
    }
  }

  // A few stock housekeeping moves
  const lamp = goods.find((p) => p.sku === 'LMP-LED-05');
  if ((await stockOf(lamp._id)) > 2) await adjustStock({ company: company._id, product: lamp._id, warehouse: main._id, quantity: -2, reason: 'Damaged in transit', user: admin._id, date: day(TODAY, -12) });
  for (const sku of ['CHR-MSH-02', 'MON-27-4K', 'LMP-LED-05']) {
    const p = goods.find((x) => x.sku === sku);
    const qty = Math.min(3, await stockOf(p._id));
    if (qty > 0) await transferStock({ company: company._id, product: p._id, from: main._id, to: store._id, quantity: qty, note: 'Showroom display', user: admin._id });
  }

  // Leave requests
  const leave = (e, type, from, to, status, reason) => LeaveRequest.create({ company: company._id, employee: e._id, type, startDate: day(TODAY, from), endDate: day(TODAY, to), status, reason, ...(status !== 'pending' ? { reviewedBy: users.hr._id, reviewedAt: day(TODAY, from - 5) } : {}) });
  await leave(employees[2], 'annual', 9, 13, 'pending', 'Family trip');
  await leave(employees[7], 'sick', -3, -2, 'approved', 'Flu');
  await leave(employees[4], 'annual', 20, 30, 'pending', 'Wedding');
  await leave(employees[9], 'annual', -40, -36, 'approved', 'Holiday');
  await leave(employees[5], 'unpaid', -20, -19, 'rejected', 'Personal errand');

  // CRM pipeline
  const leads = [
    ['Fit-out for 40-seat office', 'Rhea Kapoor', 'Tidewater Insurance', 38000, 'new'],
    ['Standing desks for engineering', 'Ben Carter', 'Quarry Software', 21500, 'new'],
    ['Reception refresh', 'Lena Vogel', 'Arbor Clinic', 6400, 'new'],
    ['Classroom monitors', 'Linda Mensah', 'Oakridge Primary School', 9800, 'qualified'],
    ['Hybrid meeting rooms', 'Karim Aziz', 'Delta Freight', 15200, 'qualified'],
    ['Second floor expansion', 'Marcus Lee', 'Cobalt Coworking', 27400, 'proposal'],
    ['Ergonomic chairs rollout', 'Grace Finch', 'Harbor & Finch Law', 11300, 'proposal'],
    ['Headsets for support team', 'Ivan Petrov', 'Kestrel Analytics', 7900, 'proposal'],
    ['New studio furniture', 'Hannah Wells', 'Northwind Studio', 18600, 'negotiation'],
    ['Lab workstation upgrade', 'Noah Fischer', 'Juniper Labs', 24300, 'negotiation'],
    ['Dock stations for all staff', 'Ahmed Karim', 'Vela Logistics', 8700, 'won'],
    ['Treatment room desks', 'Chloe Martin', 'Summit Physio', 5200, 'won'],
    ['Open-plan redesign', 'Sam Ortiz', 'Pinecrest Media', 31000, 'lost'],
    ['Paper supply contract', 'Iris Bell', 'Westgate Accounting', 4100, 'lost'],
  ];
  const posInStage = {};
  await Lead.insertMany(leads.map(([title, contactName, organization, value, stage]) => {
    posInStage[stage] = (posInStage[stage] || 0) + 1;
    return {
      company: company._id, title, contactName, organization, value, stage, position: posInStage[stage],
      owner: rand() < 0.6 ? users.sales._id : users.manager._id, source: pick(['Website', 'Referral', 'Trade show', 'Outbound']),
      email: `${contactName.split(' ')[0].toLowerCase()}@${organization.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      expectedClose: day(TODAY, between(5, 60)),
    };
  }));

  // Projects
  const byName = (n) => customers.find((c) => c.name === n)._id;
  const projects = await Project.insertMany([
    { company: company._id, name: 'Kestrel Analytics office fit-out', client: byName('Kestrel Analytics'), status: 'active', budget: 42000, color: '#2E6B4E', startDate: day(TODAY, -30), dueDate: day(TODAY, 25), description: 'Full fit-out of the new 3rd floor: 36 desks, two meeting rooms and a quiet zone.' },
    { company: company._id, name: 'Oakridge classroom refresh', client: byName('Oakridge Primary School'), status: 'planning', budget: 15500, color: '#3A5A8C', startDate: day(TODAY, 10), dueDate: day(TODAY, 70), description: 'Replace teacher desks and add wall displays in six classrooms.' },
    { company: company._id, name: 'Cobalt Coworking phase 1', client: byName('Cobalt Coworking'), status: 'completed', budget: 26000, color: '#8A6A1F', startDate: day(TODAY, -120), dueDate: day(TODAY, -60), description: 'Hot desks, phone booths and the community kitchen.' },
  ]);
  const taskDefs = [
    [0, 'Confirm floor plan with client', 'done', 'high', 'manager'], [0, 'Order 36 standing desks', 'done', 'high', 'warehouse'],
    [0, 'Schedule delivery window', 'review', 'medium', 'warehouse'], [0, 'Install monitor arms', 'in_progress', 'medium', 'warehouse'],
    [0, 'Cable management in meeting rooms', 'todo', 'low', 'warehouse'], [0, 'Final walkthrough and sign-off', 'todo', 'high', 'manager'],
    [0, 'Send progress invoice', 'todo', 'medium', 'accountant'],
    [1, 'Site visit and measurements', 'todo', 'high', 'sales'], [1, 'Prepare quotation', 'todo', 'medium', 'sales'],
    [1, 'Agree delivery during school holidays', 'todo', 'medium', 'manager'],
    [2, 'Deliver phone booths', 'done', 'high', 'warehouse'], [2, 'Assemble hot desks', 'done', 'medium', 'warehouse'], [2, 'Client sign-off', 'done', 'high', 'manager'],
  ];
  const taskPos = {};
  await Task.insertMany(taskDefs.map(([p, title, status, priority, role]) => {
    const key = `${p}:${status}`;
    taskPos[key] = (taskPos[key] || 0) + 1;
    return { company: company._id, project: projects[p]._id, title, status, priority, assignee: users[role]._id, position: taskPos[key], dueDate: day(TODAY, between(-5, 30)) };
  }));

  // Recent activity for the dashboard feed
  const recent = await Invoice.find({ company: company._id }).sort('-date').limit(6).populate('contact', 'name');
  await AuditLog.insertMany(recent.map((inv, i) => ({
    company: company._id, user: pick(Object.values(users))._id, userName: pick([users.sales.name, users.accountant.name, admin.name]),
    action: inv.status === 'paid' ? 'payment' : 'post', entity: 'Invoice', entityId: inv._id,
    summary: inv.status === 'paid' ? `Recorded payment for ${inv.number} · ${inv.contact?.name}` : `Posted ${inv.number} · ${inv.contact?.name}`,
    createdAt: new Date(TODAY.getTime() - (i + 1) * 3.7 * 3600000),
  })));

  console.log(`\nSeeded ${invoiceCount} sales invoices, ${products.length} products, ${employees.length} employees.`);
  console.log(`Sign in with any of: ${Object.keys(users).map((r) => `${r}@meridian.demo`).join(', ')}`);
  console.log(`Password: ${PASSWORD}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
