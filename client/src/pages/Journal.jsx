import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Undo2, X } from 'lucide-react';
import api from '../lib/api';
import { useAction, useList, useOptions, useRecord } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { date, money, titleCase, today } from '../lib/format';
import { Badge, Button, Field, Input, PageHeader, Select, Spinner, StatusBadge, cx } from '../components/ui';
import DataTable from '../components/ui/DataTable';
import { Drawer, useConfirm } from '../components/ui/Overlay';

const SOURCES = ['manual', 'invoice', 'bill', 'payment', 'stock', 'payroll', 'reversal', 'opening'];

function EntryView({ id, onClose }) {
  const { can } = useAuth();
  const { data: e, isLoading } = useRecord(`journal/${id}`);
  const [confirm, dialog] = useConfirm();
  const reverse = useAction(() => api.post(`/journal/${id}/reverse`), { success: 'Reversing entry posted', onSuccess: onClose });
  if (isLoading || !e) return <div className="flex justify-center py-10"><Spinner /></div>;
  return (
    <div>
      <dl className="mb-5 grid grid-cols-2 gap-4 text-[13.5px]">
        <div><dt className="text-muted">Date</dt><dd className="font-medium">{date(e.date)}</dd></div>
        <div><dt className="text-muted">Source</dt><dd><Badge>{titleCase(e.source)}</Badge></dd></div>
        <div className="col-span-2"><dt className="text-muted">Memo</dt><dd className="font-medium">{e.memo || '—'}</dd></div>
        {e.reversedBy && <div className="col-span-2 text-debit">Reversed by {e.reversedBy.number}</div>}
        {e.reversalOf && <div className="col-span-2 text-muted">Reverses {e.reversalOf.number}</div>}
      </dl>
      <table className="w-full text-[14px]">
        <thead><tr className="border-b border-rule text-left text-[12.5px] text-muted"><th className="py-2 font-medium">Account</th><th className="py-2 text-right font-medium">Debit</th><th className="py-2 text-right font-medium">Credit</th></tr></thead>
        <tbody>
          {e.lines.map((l) => (
            <tr key={l._id} className="border-b border-rule-2">
              <td className={cx('py-2', l.credit && 'pl-6')}><span className="text-muted num">{l.account?.code}</span> {l.account?.name}</td>
              <td className="py-2 text-right num">{l.debit ? money(l.debit) : ''}</td>
              <td className="py-2 text-right num">{l.credit ? money(l.credit) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr className="border-t-2 border-double border-rule font-semibold"><td className="py-2">Total</td><td className="py-2 text-right num">{money(e.totalDebit)}</td><td className="py-2 text-right num">{money(e.totalCredit)}</td></tr></tfoot>
      </table>
      {can('accounting') && ['manual', 'opening'].includes(e.source) && e.status === 'posted' && (
        <Button className="mt-6" variant="danger" icon={Undo2} loading={reverse.isPending}
          onClick={async () => (await confirm({ title: `Reverse ${e.number}?`, message: 'A new entry with debits and credits swapped is posted today. The original stays in the journal.', confirmLabel: 'Reverse', danger: true })) && reverse.mutate()}>Reverse entry</Button>
      )}
      {!['manual', 'opening'].includes(e.source) && <p className="mt-6 text-[13px] text-muted">This entry was posted automatically. Void its source document to reverse it.</p>}
      {dialog}
    </div>
  );
}

function NewEntry({ onDone }) {
  const accounts = useOptions('accounts', { active: true });
  const [form, setForm] = useState({ date: today(), memo: '', reference: '', lines: [{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }] });
  const save = useAction(() => api.post('/journal', { ...form, lines: form.lines.map((l) => ({ ...l, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })) }), { success: 'Entry posted', onSuccess: onDone });
  const totals = form.lines.reduce((t, l) => ({ d: t.d + (Number(l.debit) || 0), c: t.c + (Number(l.credit) || 0) }), { d: 0, c: 0 });
  const balanced = totals.d > 0 && Math.abs(totals.d - totals.c) < 0.005;
  const setLine = (i, patch) => setForm((f) => ({ ...f, lines: f.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  const cell = 'h-9 w-full rounded-md border border-rule bg-sheet px-2 text-[14px] focus:border-ledger focus:outline-none';

  return (
    <form id="journal-form" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
        <Field label="Reference"><Input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} /></Field>
        <Field label="Memo" className="sm:col-span-2"><Input value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} placeholder="What this entry records" required /></Field>
      </div>
      <div className="mt-5 space-y-2">
        <div className="grid grid-cols-[1fr_96px_96px_28px] gap-2 text-[12.5px] text-muted"><span>Account</span><span className="text-right">Debit</span><span className="text-right">Credit</span></div>
        {form.lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_96px_96px_28px] items-center gap-2">
            <select className={cell} value={l.account} onChange={(e) => setLine(i, { account: e.target.value })} required aria-label="Account">
              <option value="">Choose account</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.code} {a.name}</option>)}
            </select>
            <input className={cx(cell, 'text-right num')} type="number" min="0" step="0.01" value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: '' })} aria-label="Debit" />
            <input className={cx(cell, 'text-right num')} type="number" min="0" step="0.01" value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: '' })} aria-label="Credit" />
            <button type="button" disabled={form.lines.length <= 2} onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))} className="text-faint hover:text-debit disabled:opacity-30" aria-label="Remove line"><X className="size-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, { account: '', debit: '', credit: '' }] }))} className="inline-flex items-center gap-1 text-[14px] font-medium text-ledger hover:underline"><Plus className="size-4" />Add line</button>
        <div className="grid grid-cols-[1fr_96px_96px_28px] gap-2 border-t-2 border-double border-rule pt-2 font-semibold">
          <span className={balanced ? 'text-ledger' : 'text-debit'}>{balanced ? 'Balanced' : `Out by ${money(Math.abs(totals.d - totals.c))}`}</span>
          <span className="text-right num">{money(totals.d)}</span><span className="text-right num">{money(totals.c)}</span>
        </div>
      </div>
      <div className="mt-6 flex justify-end"><Button variant="primary" type="submit" disabled={!balanced} loading={save.isPending}>Post entry</Button></div>
    </form>
  );
}

export default function Journal() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useList('journal', { source, page, limit: 30 });

  useEffect(() => {
    const id = params.get('open');
    if (id) { setViewing({ _id: id }); params.delete('open'); setParams(params, { replace: true }); }
  }, [params, setParams]);

  return (
    <div>
      <PageHeader title="Journal" description="Every posting in date order. Automatic entries come from invoices, bills, payments, stock and payroll."
        actions={can('accounting') && <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Manual entry</Button>} />
      <div className="mb-4">
        <Select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className="w-auto min-w-[180px]" aria-label="Source">
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
      </div>
      <DataTable loading={isLoading} rows={data?.data || []} page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} onRowClick={setViewing} dense
        columns={[
          { key: 'number', label: 'Entry', render: (r) => <span className="font-medium">{r.number}</span> },
          { key: 'date', label: 'Date', render: (r) => date(r.date) },
          { key: 'memo', label: 'Memo', render: (r) => <span className="line-clamp-1">{r.memo}</span> },
          { key: 'accounts', label: 'Accounts', render: (r) => <span className="text-[12.5px] text-muted num">{[...new Set(r.lines.map((l) => l.account?.code))].join(' · ')}</span> },
          { key: 'source', label: 'Source', render: (r) => <Badge>{titleCase(r.source)}</Badge> },
          { key: 'status', label: '', render: (r) => r.status === 'reversed' && <StatusBadge status="reversed" /> },
          { key: 'totalDebit', label: 'Amount', align: 'right', render: (r) => <span className="font-medium">{money(r.totalDebit)}</span> },
        ]} />
      <Drawer open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing?.number || 'Journal entry'}>
        {viewing && <EntryView id={viewing._id} onClose={() => setViewing(null)} />}
      </Drawer>
      <Drawer open={creating} onClose={() => setCreating(false)} title="Manual journal entry" subtitle="Debits must equal credits before the entry can be posted." width={640}>
        {creating && <NewEntry onDone={() => setCreating(false)} />}
      </Drawer>
    </div>
  );
}
