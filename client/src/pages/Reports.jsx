import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Printer, XCircle } from 'lucide-react';
import { useList } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { date, money } from '../lib/format';
import { Button, Field, Input, PageHeader, Select, Spinner, Tabs, cx } from '../components/ui';

const iso = (d) => d.toISOString().slice(0, 10);
function preset(name) {
  const n = new Date();
  const y = n.getFullYear();
  const m = n.getMonth();
  switch (name) {
    case 'last-month': return [new Date(y, m - 1, 1), new Date(y, m, 0)];
    case 'quarter': return [new Date(y, Math.floor(m / 3) * 3, 1), n];
    case 'ytd': return [new Date(y, 0, 1), n];
    case 'six': return [new Date(y, m - 5, 1), n];
    default: return [new Date(y, m, 1), n];
  }
}

function Row({ label, value, to, strong, indent, rule }) {
  return (
    <div className={cx('flex items-baseline justify-between gap-4 py-1.5', strong && 'font-semibold text-ink', rule === 'single' && 'mt-1 border-t border-rule pt-2', rule === 'double' && 'mt-2 border-t-[3px] border-double border-rule pt-2.5 text-[16px]')}>
      <span className={indent ? 'pl-5' : ''}>{to ? <Link to={to} className="hover:text-ledger hover:underline">{label}</Link> : label}</span>
      <span className={cx('num', value < 0 && 'text-debit')}>{money(value)}</span>
    </div>
  );
}

const Section = ({ title, rows, total, totalLabel }) => (
  <div className="mb-5">
    <h3 className="mb-1 text-[13px] font-semibold text-muted">{title}</h3>
    {rows.map((r) => <Row key={r._id} label={`${r.code} ${r.name}`} value={r.balance} to={`/accounting/accounts/${r._id}`} indent />)}
    {!rows.length && <p className="py-1.5 pl-5 text-faint">Nothing posted</p>}
    <Row label={totalLabel} value={total} strong rule="single" />
  </div>
);

function ProfitLoss({ from, to }) {
  const { data: d, isLoading } = useList('reports/profit-loss', { from, to });
  if (isLoading || !d) return <Spinner />;
  return (
    <>
      <Section title="Income" rows={d.income} total={d.totalIncome} totalLabel="Total income" />
      <Section title="Cost of sales" rows={d.cogs} total={d.totalCogs} totalLabel="Total cost of sales" />
      <Row label="Gross profit" value={d.grossProfit} strong rule="single" />
      <p className="mb-5 text-[13px] text-muted">Gross margin {d.totalIncome ? ((d.grossProfit / d.totalIncome) * 100).toFixed(1) : '0.0'}%</p>
      <Section title="Operating expenses" rows={d.operating} total={d.totalOperating} totalLabel="Total operating expenses" />
      <Row label="Net profit" value={d.netProfit} strong rule="double" />
    </>
  );
}

function BalanceSheet({ to }) {
  const { data: d, isLoading } = useList('reports/balance-sheet', { asOf: to });
  if (isLoading || !d) return <Spinner />;
  return (
    <>
      <Section title="Assets" rows={d.assets} total={d.totalAssets} totalLabel="Total assets" />
      <Section title="Liabilities" rows={d.liabilities} total={d.totalLiabilities} totalLabel="Total liabilities" />
      <div className="mb-5">
        <h3 className="mb-1 text-[13px] font-semibold text-muted">Equity</h3>
        {d.equity.map((r) => <Row key={r._id} label={`${r.code} ${r.name}`} value={r.balance} to={`/accounting/accounts/${r._id}`} indent />)}
        <Row label="Current earnings (not yet closed)" value={d.currentEarnings} indent />
        <Row label="Total equity" value={d.totalEquity} strong rule="single" />
      </div>
      <Row label="Liabilities and equity" value={d.totalLiabilities + d.totalEquity} strong rule="double" />
      <p className={cx('mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium', d.balanced ? 'text-ledger' : 'text-debit')}>
        {d.balanced ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
        {d.balanced ? 'Assets equal liabilities plus equity' : 'The balance sheet does not balance'}
      </p>
    </>
  );
}

function TrialBalance({ from, to }) {
  const { data: d, isLoading } = useList('reports/trial-balance', { from, to });
  if (isLoading || !d) return <Spinner />;
  return (
    <table className="w-full text-[14px]">
      <thead><tr className="border-b border-rule text-left text-[12.5px] text-muted"><th className="py-2 font-medium">Account</th><th className="py-2 text-right font-medium">Debit</th><th className="py-2 text-right font-medium">Credit</th></tr></thead>
      <tbody>
        {d.rows.map((r) => (
          <tr key={r._id} className="border-b border-rule-2">
            <td className="py-1.5"><Link to={`/accounting/accounts/${r._id}`} className="hover:text-ledger hover:underline"><span className="text-muted num">{r.code}</span> {r.name}</Link></td>
            <td className="py-1.5 text-right num">{r.debit ? money(r.debit) : ''}</td>
            <td className="py-1.5 text-right num">{r.credit ? money(r.credit) : ''}</td>
          </tr>
        ))}
      </tbody>
      <tfoot><tr className="border-t-[3px] border-double border-rule font-semibold text-ink"><td className="py-2.5">Totals</td><td className="py-2.5 text-right num">{money(d.totalDebit)}</td><td className="py-2.5 text-right num">{money(d.totalCredit)}</td></tr></tfoot>
    </table>
  );
}

const TITLES = { pl: 'Profit and loss', bs: 'Balance sheet', tb: 'Trial balance' };

export default function Reports() {
  const { company } = useAuth();
  const [tab, setTab] = useState('pl');
  const [range, setRange] = useState('month');
  const initial = useMemo(() => preset('month').map(iso), []);
  const [from, setFrom] = useState(initial[0]);
  const [to, setTo] = useState(initial[1]);

  const applyPreset = (p) => { setRange(p); const [f, t] = preset(p).map(iso); setFrom(f); setTo(t); };

  return (
    <div>
      <div className="no-print">
        <PageHeader title="Reports" description="Financial statements built from posted journal entries."
          actions={<Button icon={Printer} onClick={() => window.print()}>Print</Button>} />
        <Tabs className="mb-5" value={tab} onChange={setTab} tabs={Object.entries(TITLES).map(([value, label]) => ({ value, label }))} />
        <div className="mb-6 flex flex-wrap items-end gap-3">
          {tab !== 'bs' && (
            <Field label="Period">
              <Select value={range} onChange={(e) => applyPreset(e.target.value)} className="w-auto min-w-[170px]">
                <option value="month">This month</option><option value="last-month">Last month</option><option value="quarter">This quarter</option>
                <option value="six">Last six months</option><option value="ytd">Year to date</option><option value="custom">Custom</option>
              </Select>
            </Field>
          )}
          {tab !== 'bs' && <Field label="From"><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setRange('custom'); }} /></Field>}
          <Field label={tab === 'bs' ? 'As of' : 'To'}><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setRange('custom'); }} /></Field>
        </div>
      </div>

      <article className="sheet mx-auto max-w-[760px] px-6 py-8 sm:px-12 sm:py-10">
        <header className="mb-8 border-b border-rule pb-5">
          <p className="text-[13px] text-muted">{company?.name}</p>
          <h2 className="text-[24px] font-semibold text-ink">{TITLES[tab]}</h2>
          <p className="mt-0.5 text-muted">{tab === 'bs' ? `As of ${date(to)}` : `${date(from)} to ${date(to)}`} · {company?.currency}</p>
        </header>
        {tab === 'pl' && <ProfitLoss from={from} to={to} />}
        {tab === 'bs' && <BalanceSheet to={to} />}
        {tab === 'tb' && <TrialBalance from={from} to={to} />}
      </article>
    </div>
  );
}
