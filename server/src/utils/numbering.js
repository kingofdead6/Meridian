import Counter from '../models/Counter.js';

export const PREFIXES = {
  sale: 'SO', purchase: 'PO', customer: 'INV', supplier: 'BILL', payment_in: 'RCPT', payment_out: 'PAY',
  journal: 'JE', payroll: 'PR', employee: 'EMP',
};

export async function nextNumber(company, key, session = null) {
  const counter = await Counter.findOneAndUpdate(
    { company, key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  const prefix = PREFIXES[key] || key.toUpperCase();
  return `${prefix}-${String(counter.seq).padStart(5, '0')}`;
}
