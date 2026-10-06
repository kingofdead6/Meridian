import Product from '../models/Product.js';
import StockLevel from '../models/StockLevel.js';
import StockMove from '../models/StockMove.js';
import Warehouse from '../models/Warehouse.js';
import ApiError from '../utils/ApiError.js';
import { round2 } from '../utils/money.js';
import { postEntry, systemAccounts } from './ledger.js';

export async function defaultWarehouse(company, session = null) {
  const wh = (await Warehouse.findOne({ company, isDefault: true }).session(session)) || (await Warehouse.findOne({ company }).session(session));
  if (!wh) throw ApiError.badRequest('Create a warehouse first');
  return wh;
}

/**
 * Moves stock in (positive quantity) or out (negative). Receipts update the weighted average cost.
 * Returns { move, cost } where cost is the value moved (always positive), or null for services.
 */
export async function moveStock(
  { company, product, warehouse, quantity, unitCost, type, reference, sourceType, sourceId, note, user, date },
  session = null
) {
  const prod = await Product.findOne({ _id: product, company }).session(session);
  if (!prod) throw ApiError.notFound('Product');
  if (prod.type === 'service') return null;
  const qty = Number(quantity);
  if (!qty) return null;

  const levels = await StockLevel.find({ company, product: prod._id }).session(session);
  const totalQty = levels.reduce((s, l) => s + l.quantity, 0);
  const here = levels.find((l) => String(l.warehouse) === String(warehouse))?.quantity || 0;

  if (qty < 0 && here + qty < -1e-9) {
    throw ApiError.badRequest(`Not enough ${prod.name} in stock: ${here} available, ${-qty} needed`);
  }

  let cost = prod.avgCost;
  if (qty > 0 && type === 'receipt') {
    cost = Number(unitCost ?? prod.purchasePrice);
    const base = Math.max(totalQty, 0);
    prod.avgCost = round2(base + qty > 0 ? (base * prod.avgCost + qty * cost) / (base + qty) : cost);
    await prod.save({ session });
  } else if (unitCost !== undefined && type === 'reversal') {
    cost = Number(unitCost);
  }

  await StockLevel.findOneAndUpdate(
    { company, product: prod._id, warehouse },
    { $inc: { quantity: qty } },
    { upsert: true, new: true, session }
  );

  const move = new StockMove({
    company, product: prod._id, warehouse, quantity: qty, unitCost: cost, type, reference, sourceType, sourceId, note, user, date: date || new Date(),
  });
  await move.save({ session });
  return { move, product: prod, cost: round2(Math.abs(qty) * cost) };
}

export async function adjustStock({ company, product, warehouse, quantity, reason, user, date }, session = null) {
  const res = await moveStock(
    { company, product, warehouse, quantity, type: 'adjustment', reference: 'Stock adjustment', note: reason, user, date },
    session
  );
  if (!res) throw ApiError.badRequest('Services do not carry stock');
  if (res.cost > 0) {
    const acc = await systemAccounts(company, session);
    const gain = quantity > 0;
    await postEntry(
      {
        company, date, user, source: 'stock', sourceId: res.move._id,
        memo: `Stock adjustment: ${res.product.name}${reason ? ` (${reason})` : ''}`,
        lines: [
          { account: acc.inventory, debit: gain ? res.cost : 0, credit: gain ? 0 : res.cost },
          { account: acc.inv_adjust, debit: gain ? 0 : res.cost, credit: gain ? res.cost : 0 },
        ],
      },
      session
    );
  }
  return res.move;
}

export async function transferStock({ company, product, from, to, quantity, user, note }, session = null) {
  if (String(from) === String(to)) throw ApiError.badRequest('Choose two different warehouses');
  const qty = Math.abs(Number(quantity));
  if (!qty) throw ApiError.badRequest('Quantity must be above zero');
  const out = await moveStock({ company, product, warehouse: from, quantity: -qty, type: 'transfer_out', reference: 'Transfer', note, user }, session);
  if (!out) throw ApiError.badRequest('Services do not carry stock');
  await moveStock({ company, product, warehouse: to, quantity: qty, type: 'transfer_in', reference: 'Transfer', note, user }, session);
  return out.move;
}

/** Undo every stock move created by a source document. */
export async function reverseMovesFor(company, sourceType, sourceId, user, session = null) {
  const moves = await StockMove.find({ company, sourceType, sourceId, type: { $ne: 'reversal' } }).session(session);
  for (const m of moves) {
    await moveStock(
      { company, product: m.product, warehouse: m.warehouse, quantity: -m.quantity, unitCost: m.unitCost, type: 'reversal', reference: `Reversal of ${m.reference || ''}`.trim(), sourceType, sourceId, user },
      session
    );
  }
  return moves;
}
