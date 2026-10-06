import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Account from '../models/Account.js';
import ApiError from '../utils/ApiError.js';
import { nextNumber } from '../utils/numbering.js';
import { round2 } from '../utils/money.js';
import { runInTransaction } from '../utils/transaction.js';
import { postEntry, systemAccounts } from './ledger.js';

export async function recordPayment({ invoice: invoiceId, amount, date, method, account, reference, notes }, { user }) {
  return runInTransaction(async (session) => {
    const inv = await Invoice.findOne({ _id: invoiceId, company: user.company }).session(session);
    if (!inv) throw ApiError.notFound('Invoice');
    if (!['posted', 'partial'].includes(inv.status)) throw ApiError.conflict('Post the document before recording payments');

    const value = round2(amount);
    if (!(value > 0)) throw ApiError.badRequest('Amount must be above zero');
    if (value > inv.balanceDue + 0.005) throw ApiError.badRequest(`Amount exceeds the balance due (${inv.balanceDue})`);

    const cashAccount = await Account.findOne({ _id: account, company: user.company, isCash: true }).session(session);
    if (!cashAccount) throw ApiError.badRequest('Choose a cash or bank account');

    const kind = inv.kind === 'customer' ? 'in' : 'out';
    const acc = await systemAccounts(user.company, session);
    const when = date ? new Date(date) : new Date();
    const number = await nextNumber(user.company, kind === 'in' ? 'payment_in' : 'payment_out', session);

    const entry = await postEntry(
      {
        company: user.company, date: when, user: user._id, source: 'payment', reference: number,
        memo: `${kind === 'in' ? 'Payment received' : 'Payment sent'} for ${inv.number}`,
        lines:
          kind === 'in'
            ? [{ account: cashAccount._id, debit: value }, { account: acc.ar, credit: value }]
            : [{ account: acc.ap, debit: value }, { account: cashAccount._id, credit: value }],
      },
      session
    );

    const payment = new Payment({
      company: user.company, number, kind, contact: inv.contact, invoice: inv._id, date: when, amount: value,
      method, account: cashAccount._id, reference, notes, journalEntry: entry._id, user: user._id,
    });
    await payment.save({ session });
    entry.sourceId = payment._id;
    await entry.save({ session });

    inv.amountPaid = round2(inv.amountPaid + value);
    inv.status = inv.balanceDue <= 0.005 ? 'paid' : 'partial';
    await inv.save({ session });
    return payment;
  });
}
