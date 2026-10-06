import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import Company from '../models/Company.js';
import Contact from '../models/Contact.js';
import ApiError from '../utils/ApiError.js';
import { nextNumber } from '../utils/numbering.js';
import { round2 } from '../utils/money.js';
import { runInTransaction } from '../utils/transaction.js';
import { defaultWarehouse, moveStock, reverseMovesFor } from './inventory.js';
import { postEntry, reverseEntry, systemAccounts } from './ledger.js';
import { isGoods, productMap } from './orders.js';

export const EDITABLE_FIELDS = ['contact', 'date', 'dueDate', 'lines', 'notes', 'supplierReference'];

export async function createInvoice(user, data) {
  const kind = data.kind === 'supplier' ? 'supplier' : 'customer';
  const company = await Company.findById(user.company);
  const contact = data.contact ? await Contact.findById(data.contact) : null;
  const date = data.date ? new Date(data.date) : new Date();
  const terms = contact?.paymentTermsDays ?? company?.paymentTermsDays ?? 30;
  const payload = Object.fromEntries(EDITABLE_FIELDS.filter((f) => data[f] !== undefined).map((f) => [f, data[f]]));
  return Invoice.create({
    notes: kind === 'customer' ? company?.invoiceNote : undefined,
    dueDate: new Date(date.getTime() + terms * 86400000),
    ...payload,
    date,
    kind,
    number: await nextNumber(user.company, kind),
    company: user.company,
    user: user._id,
  });
}

/**
 * Posting turns a draft into accounting reality:
 *  customer: Dr Receivable / Cr Revenue + VAT payable (+ COGS if goods ship straight from the invoice)
 *  supplier: Dr GRNI, Inventory or Expense + VAT receivable / Cr Payable
 */
export async function postInvoice(invoiceId, { user }) {
  return runInTransaction(async (session) => {
    const inv = await Invoice.findOne({ _id: invoiceId, company: user.company }).session(session);
    if (!inv) throw ApiError.notFound('Invoice');
    if (inv.status !== 'draft') throw ApiError.conflict('This document has already been posted');

    const acc = await systemAccounts(user.company, session);
    const products = await productMap(user.company, inv.lines, session);
    const isCustomer = inv.kind === 'customer';
    const lines = [];
    let stockValue = 0;
    const needsStock = !inv.order;
    const wh = needsStock ? await defaultWarehouse(user.company, session) : null;

    for (const line of inv.lines) {
      const goods = isGoods(line, products);
      if (isCustomer) {
        const account = line.account || (line.product && !goods ? acc.service_rev : acc.sales);
        lines.push({ account, credit: line.subtotal });
        if (goods && needsStock) {
          const res = await moveStock(
            { company: user.company, product: line.product, warehouse: wh._id, quantity: -line.quantity, type: 'delivery', reference: inv.number, sourceType: 'invoice', sourceId: inv._id, user: user._id, date: inv.date },
            session
          );
          if (res) stockValue += res.cost;
        }
      } else {
        let account = line.account;
        if (!account) account = goods ? (inv.order ? acc.grni : acc.inventory) : acc.expense;
        lines.push({ account, debit: line.subtotal });
        if (goods && needsStock) {
          await moveStock(
            { company: user.company, product: line.product, warehouse: wh._id, quantity: line.quantity, unitCost: round2(line.subtotal / line.quantity), type: 'receipt', reference: inv.number, sourceType: 'invoice', sourceId: inv._id, user: user._id, date: inv.date },
            session
          );
        }
      }
    }

    if (isCustomer) {
      lines.unshift({ account: acc.ar, debit: inv.total });
      if (inv.taxTotal) lines.push({ account: acc.vat_out, credit: inv.taxTotal });
      stockValue = round2(stockValue);
      if (stockValue > 0) lines.push({ account: acc.cogs, debit: stockValue }, { account: acc.inventory, credit: stockValue });
    } else {
      if (inv.taxTotal) lines.push({ account: acc.vat_in, debit: inv.taxTotal });
      lines.push({ account: acc.ap, credit: inv.total });
    }

    const contact = await Contact.findById(inv.contact).session(session);
    const entry = await postEntry(
      {
        company: user.company, date: inv.date, user: user._id, reference: inv.number, sourceId: inv._id,
        source: isCustomer ? 'invoice' : 'bill',
        memo: `${isCustomer ? 'Invoice' : 'Bill'} ${inv.number}${contact ? ` · ${contact.name}` : ''}`,
        lines,
      },
      session
    );

    inv.status = 'posted';
    inv.postedAt = new Date();
    inv.journalEntry = entry._id;
    await inv.save({ session });
    return inv;
  });
}

export async function voidInvoice(invoiceId, { user }) {
  return runInTransaction(async (session) => {
    const inv = await Invoice.findOne({ _id: invoiceId, company: user.company }).session(session);
    if (!inv) throw ApiError.notFound('Invoice');
    if (!['posted'].includes(inv.status)) throw ApiError.conflict('Only posted documents without payments can be voided');
    if (inv.amountPaid > 0) throw ApiError.conflict('Remove payments before voiding');

    if (inv.journalEntry) await reverseEntry(inv.journalEntry, { user: user._id, memo: `Void ${inv.number}` }, session);
    await reverseMovesFor(user.company, 'invoice', inv._id, user._id, session);
    if (inv.order) await Order.updateOne({ _id: inv.order }, { status: 'fulfilled', $unset: { invoice: 1 } }, { session });

    inv.status = 'void';
    await inv.save({ session });
    return inv;
  });
}
