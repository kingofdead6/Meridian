import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, motion } from 'framer-motion';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, PackageX } from 'lucide-react';
import { useList } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { compactMoney, money, number, timeAgo } from '../lib/format';
import { Panel, cx } from '../components/ui';

const EASE = [0.2, 0.7, 0.2, 1];

function CountUp({ value, format = money }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const controls = animate(0, value || 0, { duration: 1.1, ease: EASE, onUpdate: setShown });
    return () => controls.stop();
  }, [value]);
  return <>{format(shown)}</>;
}

const compact = (v) => money(v, { compact: true });

const strip = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const cell = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

function Figure({ label, value, children, tone }) {
  return (
    <motion.div variants={cell} className="group relative px-5 py-4 transition-colors hover:bg-paper-2">
      <p className="text-[13px] text-muted">{label}</p>
      <p className={cx('mt-1 text-[22px] font-semibold num', tone === 'red' ? 'text-debit' : 'text-ink')}><CountUp value={value} format={compact} /></p>
      {children && <div className="mt-1 text-[12.5px] text-muted">{children}</div>}
      <span className="absolute inset-x-5 bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-ledger transition-transform duration-300 group-hover:scale-x-100" />
    </motion.div>
  );
}

const listItem = (i) => ({
  initial: { opacity: 0, x: -8 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true },
  transition: { delay: 0.05 + i * 0.05, duration: 0.35, ease: EASE },
});

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const get = (k) => payload.find((p) => p.dataKey === k)?.value || 0;
  return (
    <div className="rounded-lg border border-rule bg-sheet px-3 py-2 text-[13px] shadow-lg">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      <p className="flex justify-between gap-6 text-ledger"><span>Income</span><span className="num">{money(get('income'))}</span></p>
      <p className="flex justify-between gap-6 text-muted"><span>Expenses</span><span className="num">{money(get('expenses'))}</span></p>
      <p className="mt-1 flex justify-between gap-6 border-t border-rule-2 pt-1 font-medium text-ink"><span>Profit</span><span className="num">{money(get('profit'))}</span></p>
    </div>
  );
}

const STAGE_LABEL = { new: 'New', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation' };

export default function Dashboard() {
  const { user, can } = useAuth();
  const { data: d, isLoading } = useList('dashboard');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (isLoading || !d) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="space-y-2"><div className="skeleton h-7 w-64 rounded-lg" /><div className="skeleton h-4 w-48 rounded" /></div>
        <div className="skeleton h-[112px] rounded-xl" />
        <div className="grid gap-6 xl:grid-cols-3"><div className="skeleton h-[360px] rounded-xl xl:col-span-2" /><div className="skeleton h-[360px] rounded-xl" /></div>
      </div>
    );
  }

  const change = d.revenueLastMonth ? ((d.revenueThisMonth - d.revenueLastMonth) / d.revenueLastMonth) * 100 : 0;
  const pipelineMax = Math.max(...(d.pipeline || []).map((p) => p.value), 1);
  const pipeline = ['new', 'qualified', 'proposal', 'negotiation'].map((s) => d.pipeline.find((p) => p._id === s) || { _id: s, value: 0, count: 0 });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">{greeting}, {user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-muted">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </motion.div>

      {/* Headline strip: one ruled row, cash first */}
      <motion.section variants={strip} initial="hidden" animate="show" className="sheet grid overflow-hidden md:grid-cols-[1.4fr_repeat(4,1fr)] md:divide-x divide-y md:divide-y-0 divide-rule-2">
        <motion.div variants={cell} className="relative overflow-hidden bg-ink px-6 py-5 text-white">
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-ledger/40 blur-3xl animate-drift" />
          <p className="text-[13px] text-ink-text">Cash on hand and in the bank</p>
          <p className="mt-1.5 text-[34px] font-semibold leading-none tracking-tight num"><CountUp value={d.cash} /></p>
          <p className="mt-2.5 text-[12.5px] text-ink-text">Stock on hand worth <span className="text-white num">{money(d.stockValue)}</span></p>
        </motion.div>
        <Figure label="Revenue this month" value={d.revenueThisMonth}>
          <span className={cx('inline-flex items-center gap-0.5 font-medium', change >= 0 ? 'text-ledger' : 'text-debit')}>
            {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{number(Math.abs(change), 1)}%
          </span>{' '}vs last month ({compactMoney(d.revenueLastMonth)})
        </Figure>
        <Figure label="Expenses this month" value={d.expensesThisMonth}>
          Profit {money(d.profitThisMonth, { compact: true })}
        </Figure>
        <Figure label="Customers owe you" value={d.receivables}>
          {d.overdueCount ? <Link to="/sales/invoices?overdue=true" className="font-medium text-debit hover:underline">{d.overdueCount} overdue · {compactMoney(d.overdueAmount)}</Link> : 'Nothing overdue'}
        </Figure>
        <Figure label="You owe suppliers" value={d.payables}>Open bills</Figure>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Income and expenses, last six months" className="xl:col-span-2" bodyClassName="px-3 pb-3 pt-5">
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={d.series} margin={{ top: 0, right: 12, left: 4, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#E9EDE7" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#66707A', fontSize: 12.5 }} />
                <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} tick={{ fill: '#98A1A9', fontSize: 12 }} width={64} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(46,107,78,0.06)' }} />
                <Bar dataKey="income" fill="#2E6B4E" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" fill="#C9D3C6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line dataKey="profit" type="monotone" stroke="#16233A" strokeWidth={2} dot={{ r: 3, fill: '#16233A' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 px-3 pt-2 text-[12.5px] text-muted">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-ledger" />Income</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[#C9D3C6]" />Expenses</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-ink" />Profit</span>
          </div>
        </Panel>

        <Panel title="Overdue invoices" action={<Link to="/sales/invoices?overdue=true" className="text-[13px] font-medium text-ledger hover:underline">View all</Link>}>
          {d.overdueInvoices.length ? (
            <ul className="divide-y divide-rule-2">
              {d.overdueInvoices.map((inv, i) => {
                const days = Math.floor((Date.now() - new Date(inv.dueDate)) / 86400000);
                return (
                  <motion.li key={inv._id} {...listItem(i)}>
                    <Link to={`/sales/invoices/${inv._id}`} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-2">
                      <AlertTriangle className="size-4 shrink-0 text-debit" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{inv.contact}</p>
                        <p className="text-[12.5px] text-muted">{inv.number} · {days} days late</p>
                      </div>
                      <span className="font-medium num transition-transform group-hover:-translate-x-0.5">{money(inv.balance)}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          ) : <p className="px-5 py-10 text-center text-muted">Every customer is paid up.</p>}
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Best sellers, six months">
          <ol className="divide-y divide-rule-2">
            {d.topProducts.map((p, i) => (
              <motion.li key={p._id} {...listItem(i)} className="flex items-center gap-3 px-5 py-2.5">
                <span className={cx('flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold num', i === 0 ? 'bg-ledger text-white' : 'bg-rule-2 text-muted')}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-[12.5px] text-muted num">{number(p.quantity)} sold</p>
                </div>
                <span className="text-[13.5px] font-medium num">{compactMoney(p.revenue)}</span>
              </motion.li>
            ))}
          </ol>
        </Panel>

        <Panel title="Running low" action={can('inventory') && <Link to="/inventory" className="text-[13px] font-medium text-ledger hover:underline">Stock</Link>}>
          {d.lowStock.length ? (
            <ul className="divide-y divide-rule-2">
              {d.lowStock.map((p, i) => (
                <motion.li key={p._id} {...listItem(i)} className="flex items-center gap-3 px-5 py-2.5">
                  <PackageX className={cx('size-4 shrink-0', p.quantity <= 0 ? 'text-debit' : 'text-amber')} />
                  <p className="min-w-0 flex-1 truncate">{p.name}</p>
                  <span className={cx('text-[13.5px] font-medium num', p.quantity <= 0 ? 'text-debit' : 'text-amber')}>{number(p.quantity)}</span>
                  <span className="text-[12.5px] text-faint num">/ {p.reorderLevel}</span>
                </motion.li>
              ))}
            </ul>
          ) : <p className="px-5 py-10 text-center text-muted">Everything is above its reorder level.</p>}
        </Panel>

        <Panel title="Open pipeline" action={can('crm') && <Link to="/crm" className="text-[13px] font-medium text-ledger hover:underline">Pipeline</Link>}>
          <ul className="space-y-3.5 px-5 py-4">
            {pipeline.map((p, i) => (
              <li key={p._id}>
                <div className="mb-1 flex justify-between text-[13.5px]">
                  <span>{STAGE_LABEL[p._id]} <span className="text-faint num">{p.count}</span></span>
                  <span className="font-medium num">{compactMoney(p.value)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-rule-2">
                  <motion.div className="h-full rounded-full bg-linear-to-r from-steel to-[#5B7FB8]" initial={{ width: 0 }} whileInView={{ width: `${(p.value / pipelineMax) * 100}%` }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, duration: 0.9, ease: EASE }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent activity">
          <ul className="divide-y divide-rule-2">
            {d.activity.map((a, i) => (
              <motion.li key={a._id} {...listItem(i)} className="relative py-2.5 pl-9 pr-5">
                <span className="absolute left-5 top-[15px] size-1.5 rounded-full bg-ledger ring-4 ring-ledger-soft" />
                <p className="text-[13.5px] leading-snug">{a.summary}</p>
                <p className="mt-0.5 text-[12px] text-muted">{a.userName} · {timeAgo(a.createdAt)}</p>
              </motion.li>
            ))}
            {!d.activity.length && <li className="px-5 py-10 text-center text-muted">No activity yet.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
