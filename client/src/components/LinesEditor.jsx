import { Plus, X } from 'lucide-react';
import { money } from '../lib/format';
import { useOptions } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { cx } from './ui';

const lineMath = (l) => {
  const sub = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 - (Number(l.discount) || 0) / 100);
  const tax = (sub * (Number(l.taxRate) || 0)) / 100;
  return { sub, tax };
};

export function totalsOf(lines = []) {
  return lines.reduce((t, l) => {
    const { sub, tax } = lineMath(l);
    return { subtotal: t.subtotal + sub, tax: t.tax + tax, total: t.total + sub + tax };
  }, { subtotal: 0, tax: 0, total: 0 });
}

export const blankLine = () => ({ product: '', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 });

/** Normalises populated lines from the API into plain form values. */
export const toLines = (lines = []) => lines.map((l) => ({
  product: l.product?._id || l.product || '', description: l.description || '', quantity: l.quantity, unitPrice: l.unitPrice,
  discount: l.discount || 0, taxRate: l.taxRate || 0, account: l.account?._id || l.account || '', _product: l.product,
}));

export const fromLines = (lines = []) => lines
  .filter((l) => l.product || l.description)
  .map(({ _product, ...l }) => ({ ...l, product: l.product || undefined, account: l.account || undefined }));

const cell = 'h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-[14px] hover:border-rule focus:border-ledger focus:bg-sheet focus:outline-none disabled:hover:border-transparent';

/**
 * Editable document lines for orders, invoices and bills.
 * priceField decides which product price fills in (salePrice for sales, purchasePrice for purchases).
 */
export default function LinesEditor({ lines, onChange, readOnly, priceField = 'salePrice', showAccount }) {
  const { company } = useAuth();
  const products = useOptions('products', { active: true });
  const accounts = useOptions('accounts', { type: 'expense' }, Boolean(showAccount));
  const taxRates = company?.taxRates || [];

  const update = (i, patch) => onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const pickProduct = (i, id) => {
    const p = products.find((x) => x._id === id);
    if (!p) return update(i, { product: '' });
    update(i, { product: id, description: p.name, unitPrice: p[priceField] || p.salePrice || 0, taxRate: p.taxRate ?? 0 });
  };

  const totals = totalsOf(lines);
  const byCategory = products.reduce((acc, p) => { (acc[p.category || 'Other'] ||= []).push(p); return acc; }, {});

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-rule bg-paper-2 text-[12.5px] text-muted">
              <th className="px-3 py-2 font-medium" style={{ width: '24%' }}>Item</th>
              <th className="px-3 py-2 font-medium">Description</th>
              {showAccount && <th className="px-3 py-2 font-medium" style={{ width: '16%' }}>Expense account</th>}
              <th className="px-3 py-2 text-right font-medium" style={{ width: 80 }}>Qty</th>
              <th className="px-3 py-2 text-right font-medium" style={{ width: 110 }}>Unit price</th>
              <th className="px-3 py-2 text-right font-medium" style={{ width: 76 }}>Disc. %</th>
              <th className="px-3 py-2 font-medium" style={{ width: 120 }}>Tax</th>
              <th className="px-3 py-2 text-right font-medium" style={{ width: 120 }}>Amount</th>
              {!readOnly && <th style={{ width: 36 }} />}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-rule-2 last:border-0">
                <td className="px-1 py-1">
                  {readOnly ? <span className="px-2 font-medium">{l._product?.name || '—'}</span> : (
                    <select className={cell} value={l.product || ''} onChange={(e) => pickProduct(i, e.target.value)} aria-label="Product">
                      <option value="">No product</option>
                      {Object.entries(byCategory).map(([cat, ps]) => (
                        <optgroup key={cat} label={cat}>{ps.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</optgroup>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-1 py-1"><input className={cell} disabled={readOnly} value={l.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Description" aria-label="Description" /></td>
                {showAccount && (
                  <td className="px-1 py-1">
                    <select className={cell} disabled={readOnly || Boolean(l.product)} value={l.account || ''} onChange={(e) => update(i, { account: e.target.value })} aria-label="Expense account">
                      <option value="">{l.product ? 'Stock' : 'General expenses'}</option>
                      {accounts.map((a) => <option key={a._id} value={a._id}>{a.code} {a.name}</option>)}
                    </select>
                  </td>
                )}
                <td className="px-1 py-1"><input className={cx(cell, 'num text-right')} disabled={readOnly} type="number" min="0" step="any" value={l.quantity} onChange={(e) => update(i, { quantity: e.target.value })} aria-label="Quantity" /></td>
                <td className="px-1 py-1"><input className={cx(cell, 'num text-right')} disabled={readOnly} type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => update(i, { unitPrice: e.target.value })} aria-label="Unit price" /></td>
                <td className="px-1 py-1"><input className={cx(cell, 'num text-right')} disabled={readOnly} type="number" min="0" max="100" value={l.discount} onChange={(e) => update(i, { discount: e.target.value })} aria-label="Discount" /></td>
                <td className="px-1 py-1">
                  <select className={cell} disabled={readOnly} value={l.taxRate} onChange={(e) => update(i, { taxRate: Number(e.target.value) })} aria-label="Tax rate">
                    {[...new Set([...taxRates.map((t) => t.rate), Number(l.taxRate) || 0])].map((r) => {
                      const t = taxRates.find((x) => x.rate === r);
                      return <option key={r} value={r}>{t ? `${t.name} ${r}%` : `${r}%`}</option>;
                    })}
                  </select>
                </td>
                <td className="px-3 py-1 text-right font-medium num">{money(lineMath(l).sub)}</td>
                {!readOnly && (
                  <td className="pr-2">
                    <button type="button" onClick={() => onChange(lines.filter((_, idx) => idx !== i))} className="rounded-md p-1.5 text-faint hover:bg-debit-soft hover:text-debit" aria-label="Remove line">
                      <X className="size-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        {!readOnly ? (
          <button type="button" onClick={() => onChange([...lines, blankLine()])} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[14px] font-medium text-ledger hover:bg-ledger-soft">
            <Plus className="size-4" /> Add line
          </button>
        ) : <span />}
        <dl className="w-full max-w-[300px] space-y-1.5 text-[14px]">
          <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd className="num">{money(totals.subtotal)}</dd></div>
          <div className="flex justify-between text-muted"><dt>Tax</dt><dd className="num">{money(totals.tax)}</dd></div>
          <div className="flex justify-between border-t-2 border-double border-rule pt-2 text-[16px] font-semibold text-ink"><dt>Total</dt><dd className="num">{money(totals.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
