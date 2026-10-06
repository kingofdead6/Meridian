import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, BarChart3, Banknote, Boxes, Check, CircleDollarSign, Columns3, FileText, FolderKanban, PackageCheck,
  Receipt, ShieldCheck, ShoppingCart, Sparkles, Truck, Users, Wallet,
} from 'lucide-react';
import LedgerAnimation from '../components/LedgerAnimation';
import { CountUp, EASE, Eyebrow, Reveal, Stagger, WordReveal, item, spotlight } from './motion';

function FloatingChip({ icon: Icon, title, sub, className, delay, tone = 'green' }) {
  return (
    <motion.div className={`absolute z-10 hidden items-center gap-3 rounded-xl border border-white/10 bg-ink-2/90 px-3.5 py-2.5 shadow-2xl backdrop-blur sm:flex ${className}`}
      initial={{ opacity: 0, scale: 0.85, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}>
      <div className="animate-float flex items-center gap-3" style={{ animationDelay: `${delay}s` }}>
        <span className={`flex size-8 items-center justify-center rounded-lg ${tone === 'green' ? 'bg-ledger-bright/15 text-ledger-bright' : 'bg-[#E0A84A]/15 text-[#E0A84A]'}`}><Icon className="size-4" /></span>
        <span>
          <span className="block text-[13px] font-semibold text-white">{title}</span>
          <span className="block text-[12px] text-ink-text">{sub}</span>
        </span>
      </div>
    </motion.div>
  );
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink pb-28 pt-36 text-white lg:pb-36 lg:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines" />
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-32 size-[620px] rounded-full bg-ledger/30 blur-[140px] animate-drift" />
      <div aria-hidden className="pointer-events-none absolute -right-48 top-40 size-[520px] rounded-full bg-steel/35 blur-[140px] animate-drift-slow" />

      <motion.div style={{ y, opacity: fade }} className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="min-w-0">
          <motion.span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-1 pl-1 pr-3.5 text-[13px] text-ink-text"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <span className="rounded-full bg-ledger-bright px-2 py-0.5 text-[11.5px] font-bold text-ink">New</span>
            AI assistant that reads your books
          </motion.span>
          <h1 className="text-[44px] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[64px]">
            <WordReveal text="Run the whole company from one balanced ledger." highlight={['balanced', 'ledger']} delay={0.15} />
          </h1>
          <motion.p className="mt-7 max-w-[50ch] text-[17.5px] leading-relaxed text-ink-text"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6, ease: EASE }}>
            Meridian connects sales, stock, purchasing, accounting and people. Confirm an order and the stock moves, the invoice
            posts and the books balance on their own.
          </motion.p>
          <motion.div className="mt-10 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6, ease: EASE }}>
            <Link to="/login" className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-ledger-bright px-6 text-[15px] font-semibold text-ink shadow-[0_10px_40px_-10px_rgba(79,165,122,0.7)] transition hover:bg-[#6BBE93]">
              <span aria-hidden className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Explore the live demo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/features" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-6 text-[15px] font-medium text-white transition hover:border-white/35 hover:bg-white/5">
              See how it works
            </Link>
          </motion.div>
          <motion.ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-ink-text"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
            {['No credit card', 'Six demo roles', 'Open source'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-ledger-bright" />{t}</li>
            ))}
          </motion.ul>
        </div>

        <motion.div className="relative min-w-0" initial={{ opacity: 0, y: 40, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.35, duration: 0.9, ease: EASE }}>
          <div aria-hidden className="absolute -inset-6 rounded-[28px] bg-linear-to-br from-ledger-bright/20 via-transparent to-steel/20 blur-2xl" />
          <div className="relative rounded-2xl border border-white/10 bg-ink-2/70 p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)] backdrop-blur">
            <div className="flex items-center gap-1.5 px-3 pb-2 pt-1.5">
              <span className="size-2.5 rounded-full bg-white/15" /><span className="size-2.5 rounded-full bg-white/15" /><span className="size-2.5 rounded-full bg-white/15" />
              <span className="ml-3 text-[12px] text-[#7C8BA3]">Journal · March</span>
            </div>
            <div className="overflow-x-auto"><div className="min-w-[460px]"><LedgerAnimation delay={0.9} /></div></div>
          </div>
          <FloatingChip icon={PackageCheck} title="12 desks shipped" sub="Stock moved from Main warehouse" className="-left-6 -top-12" delay={1.6} />
          <FloatingChip icon={CircleDollarSign} title="INV-0042 paid" sub="7,788.00 received" className="-right-4 -bottom-10" delay={2.1} />
          <FloatingChip icon={Boxes} title="Reorder mesh chairs" sub="4 left · level is 8" className="-left-8 -bottom-10" delay={3.4} tone="amber" />
        </motion.div>
      </motion.div>
    </section>
  );
}

const MODULE_STRIP = [
  [Columns3, 'Pipeline'], [Users, 'Contacts'], [FileText, 'Sales orders'], [Receipt, 'Invoices'], [ShoppingCart, 'Purchasing'],
  [Boxes, 'Inventory'], [Wallet, 'Payments'], [BarChart3, 'Reports'], [Banknote, 'Payroll'], [FolderKanban, 'Projects'], [Sparkles, 'Assistant'],
];

function Marquee() {
  return (
    <section className="border-b border-rule bg-sheet py-7">
      <p className="mb-5 text-center text-[13px] font-medium text-muted">Eleven modules, one database, zero re-typing</p>
      <div className="fade-x overflow-hidden">
        <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {[...MODULE_STRIP, ...MODULE_STRIP].map(([Icon, label], i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper-2 px-4 py-2 text-[14px] font-medium text-graphite">
              <Icon className="size-4 text-ledger" />{label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    [<CountUp key="a" to={11} />, 'connected modules'],
    [<CountUp key="b" to={6} />, 'roles with their own permissions'],
    [<CountUp key="c" to={100} suffix="%" />, 'double-entry, every document'],
    [<CountUp key="d" to={0} />, 'spreadsheets to reconcile'],
  ];
  return (
    <section className="bg-paper px-5 py-20 sm:px-8">
      <Stagger className="mx-auto grid max-w-[1180px] gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([value, label]) => (
          <motion.div key={label} variants={item} className="bg-sheet px-8 py-9">
            <p className="text-[46px] font-semibold leading-none tracking-tight text-ink">{value}</p>
            <p className="mt-3 text-[14.5px] text-muted">{label}</p>
          </motion.div>
        ))}
      </Stagger>
    </section>
  );
}

const FLOW = [
  { icon: FileText, title: 'Confirm the order', text: 'Lock in what the customer agreed to buy.', post: ['Confirmed', '12 × Standing desk'] },
  { icon: Truck, title: 'Ship it', text: 'Delivery moves stock and books its cost automatically.', post: ['Dr Cost of goods', 'Cr Inventory'] },
  { icon: Receipt, title: 'Invoice', text: 'One click turns the order into a posted invoice with tax.', post: ['Dr Receivable', 'Cr Sales · VAT'] },
  { icon: Wallet, title: 'Get paid', text: 'Record the payment and the invoice closes itself.', post: ['Dr Bank', 'Cr Receivable'] },
];

function Flow() {
  return (
    <section className="relative overflow-hidden bg-paper pb-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">One document. Every book updated.</h2>
          <p className="mt-4 text-[16.5px] text-muted">You do the business step. Meridian writes the journal entries, moves the stock and keeps the balances honest.</p>
        </Reveal>

        <div className="relative mt-16">
          <motion.div aria-hidden className="absolute left-[12%] right-[12%] top-[34px] hidden h-0.5 origin-left bg-linear-to-r from-ledger via-ledger-bright to-ledger lg:block"
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-120px' }} transition={{ duration: 1.4, ease: EASE, delay: 0.2 }} />
          <Stagger gap={0.22} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map(({ icon: Icon, title, text, post }, i) => (
              <motion.div key={title} variants={item} className="relative text-center">
                <motion.span className="relative mx-auto flex size-[68px] items-center justify-center rounded-2xl border border-rule bg-sheet text-ledger shadow-sm"
                  whileHover={{ rotate: -6, scale: 1.06 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
                  <Icon className="size-7" strokeWidth={1.8} />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">{i + 1}</span>
                </motion.span>
                <h3 className="mt-5 text-[17px] font-semibold text-ink">{title}</h3>
                <p className="mx-auto mt-1.5 max-w-[26ch] text-[14.5px] text-muted">{text}</p>
                <div className="mx-auto mt-4 w-fit rounded-lg border border-dashed border-ledger/40 bg-ledger-soft/60 px-3 py-2 text-left font-mono text-[12px] leading-relaxed text-ledger-2">
                  {post.map((p) => <div key={p}>{p}</div>)}
                </div>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

const MODULES = [
  { icon: Columns3, title: 'CRM & pipeline', text: 'Drag leads across stages and see what each stage is worth.', to: '/features#sell' },
  { icon: Receipt, title: 'Sales & invoicing', text: 'Quotes to orders to invoices, with VAT and PDF export.', to: '/features#sell' },
  { icon: ShoppingCart, title: 'Purchasing', text: 'Purchase orders, receipts and supplier bills that match up.', to: '/features#stock' },
  { icon: Boxes, title: 'Inventory', text: 'Multi-warehouse stock, transfers, adjustments and reorder alerts.', to: '/features#stock' },
  { icon: BarChart3, title: 'Accounting', text: 'Chart of accounts, journal, trial balance, P&L and balance sheet.', to: '/features#money' },
  { icon: Banknote, title: 'People & payroll', text: 'Employees, leave requests and payroll runs that post to the books.', to: '/features#people' },
  { icon: FolderKanban, title: 'Projects', text: 'Boards, tasks and deadlines for the work behind every sale.', to: '/features#people' },
  { icon: Sparkles, title: 'AI assistant', text: 'Ask plain questions about revenue, stock or overdue customers.', to: '/features#assistant' },
];

function Modules() {
  return (
    <section className="bg-sheet py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[560px]">
            <Eyebrow>Everything in one place</Eyebrow>
            <h2 className="text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">The modules a growing company actually uses.</h2>
          </div>
          <Link to="/features" className="group inline-flex items-center gap-1.5 text-[15px] font-semibold text-ledger">
            Tour every feature <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <Stagger gap={0.06} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map(({ icon: Icon, title, text, to }) => (
            <motion.div key={title} variants={item}>
              <Link to={to} onMouseMove={spotlight} className="spotlight group block h-full rounded-2xl border border-rule bg-paper-2 p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-ledger-bright transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-[16.5px] font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ledger opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                  Learn more <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const BARS = [[42, 30], [55, 34], [48, 38], [66, 40], [74, 45], [88, 50]];

function DashboardPreview() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink py-28 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 size-[700px] -translate-x-1/2 rounded-full bg-ledger/20 blur-[160px]" />
      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <Eyebrow dark>Live numbers</Eyebrow>
          <h2 className="text-[34px] font-semibold leading-tight tracking-tight sm:text-[42px]">Know where the money is, every morning.</h2>
          <p className="mt-4 text-[16.5px] text-ink-text">Cash, receivables, margins and stock value come straight from the ledger. Nobody has to export anything.</p>
        </Reveal>

        <div className="mt-16 [perspective:1600px]">
          <motion.div style={{ rotateX, scale }} className="origin-top rounded-2xl border border-white/10 bg-paper p-3 text-graphite shadow-[0_60px_140px_-40px_rgba(0,0,0,0.8)]">
            <div className="grid gap-3 md:grid-cols-[1.3fr_repeat(3,1fr)]">
              <div className="rounded-xl bg-ink px-5 py-4 text-white">
                <p className="text-[12.5px] text-ink-text">Cash on hand and in the bank</p>
                <p className="mt-1 text-[30px] font-semibold tracking-tight"><CountUp to={184620} prefix="$" /></p>
              </div>
              {[['Revenue this month', 64210, '+12.4%'], ['Customers owe you', 38940, '3 overdue'], ['Stock value', 92300, '17 products']].map(([l, v, s]) => (
                <div key={l} className="rounded-xl border border-rule bg-sheet px-5 py-4">
                  <p className="text-[12.5px] text-muted">{l}</p>
                  <p className="mt-1 text-[22px] font-semibold text-ink"><CountUp to={v} prefix="$" /></p>
                  <p className="text-[12px] text-ledger">{s}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border border-rule bg-sheet p-5">
                <p className="text-[14px] font-semibold text-ink">Income and expenses, last six months</p>
                <div className="mt-6 flex h-[200px] items-end gap-4 border-b border-rule-2 sm:gap-8">
                  {BARS.map(([inc, exp], i) => (
                    <div key={i} className="flex h-full flex-1 items-end justify-center gap-1.5">
                      <motion.div className="w-full max-w-[26px] rounded-t-md bg-ledger" initial={{ height: 0 }} whileInView={{ height: `${inc}%` }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: EASE }} />
                      <motion.div className="w-full max-w-[26px] rounded-t-md bg-[#C9D3C6]" initial={{ height: 0 }} whileInView={{ height: `${exp}%` }} viewport={{ once: true }} transition={{ delay: 0.36 + i * 0.08, duration: 0.8, ease: EASE }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-4 text-[12px] text-muted sm:gap-8">
                  {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((m) => <span key={m} className="flex-1 text-center">{m}</span>)}
                </div>
              </div>
              <div className="rounded-xl border border-rule bg-sheet p-5">
                <p className="text-[14px] font-semibold text-ink">Open pipeline</p>
                <ul className="mt-5 space-y-4">
                  {[['New', 38], ['Qualified', 62], ['Proposal', 84], ['Negotiation', 46]].map(([s, w], i) => (
                    <li key={s}>
                      <div className="mb-1 flex justify-between text-[13px]"><span>{s}</span><span className="text-muted">{w}k</span></div>
                      <div className="h-1.5 rounded-full bg-rule-2">
                        <motion.div className="h-full rounded-full bg-steel" initial={{ width: 0 }} whileInView={{ width: `${w}%` }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.1, duration: 0.9, ease: EASE }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const ROLES = {
  Accountant: { sees: ['Payments', 'Chart of accounts', 'Journal', 'Reports', 'Invoices & bills', 'Payroll postings'], quote: 'Closes the month without chasing anyone for numbers.' },
  Sales: { sees: ['Pipeline', 'Contacts', 'Sales orders', 'Invoices', 'Products'], quote: 'Sees stock before promising a delivery date.' },
  Warehouse: { sees: ['Products', 'Inventory', 'Warehouses', 'Transfers', 'Adjustments'], quote: 'Ships what was confirmed and nothing else.' },
  'People & HR': { sees: ['Employees', 'Departments', 'Leave', 'Payroll runs'], quote: 'Runs payroll that lands in the books by itself.' },
  Manager: { sees: ['Dashboard', 'Reports', 'Projects', 'Pipeline', 'Orders'], quote: 'Gets the whole picture without asking for a report.' },
};

function Roles() {
  const names = Object.keys(ROLES);
  const [active, setActive] = useState(names[0]);
  const role = ROLES[active];
  return (
    <section className="bg-paper py-28">
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <Eyebrow>Built for every desk</Eyebrow>
          <h2 className="text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">Each role sees exactly what it needs.</h2>
          <p className="mt-4 max-w-[46ch] text-[16.5px] text-muted">Permissions are per module, so the warehouse never stumbles into payroll and sales never edits the journal.</p>
          <div className="mt-8 flex flex-wrap gap-2" role="tablist">
            {names.map((n) => (
              <button key={n} role="tab" aria-selected={active === n} onClick={() => setActive(n)}
                className={`relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${active === n ? 'text-white' : 'text-muted hover:text-ink'}`}>
                {active === n && <motion.span layoutId="role-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span className="relative">{n}</span>
              </button>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="relative min-h-[340px] rounded-2xl border border-rule bg-sheet p-8 shadow-[0_30px_80px_-40px_rgba(22,35,58,0.35)]">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3, ease: EASE }}>
              <p className="text-[13px] font-medium text-muted">Signed in as</p>
              <p className="text-[24px] font-semibold text-ink">{active}</p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {role.sees.map((s, i) => (
                  <motion.li key={s} className="flex items-center gap-2.5 rounded-lg bg-paper-2 px-3 py-2.5 text-[14px]"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.05 }}>
                    <span className="flex size-5 items-center justify-center rounded-full bg-ledger text-white"><Check className="size-3" strokeWidth={3} /></span>{s}
                  </motion.li>
                ))}
              </ul>
              <p className="mt-6 border-t border-rule-2 pt-5 text-[15px] italic text-muted">“{role.quote}”</p>
            </motion.div>
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="bg-paper px-5 pb-28 sm:px-8">
      <Reveal className="relative mx-auto max-w-[1180px] overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center text-white sm:px-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-ledger/40 blur-[120px] animate-drift" />
        <div className="relative">
          <ShieldCheck className="mx-auto mb-5 size-10 text-ledger-bright" strokeWidth={1.6} />
          <h2 className="mx-auto max-w-[20ch] text-[34px] font-semibold leading-tight tracking-tight sm:text-[44px]">See six months of real activity in the demo company.</h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-[16.5px] text-ink-text">Sign in as an accountant, a salesperson or the warehouse and click around. Nothing you do can break it.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="group inline-flex h-12 items-center gap-2 rounded-xl bg-ledger-bright px-6 text-[15px] font-semibold text-ink transition hover:bg-[#6BBE93]">
              Open the demo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/pricing" className="inline-flex h-12 items-center rounded-xl border border-white/15 px-6 text-[15px] font-medium transition hover:bg-white/5">View pricing</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Stats />
      <Flow />
      <Modules />
      <DashboardPreview />
      <Roles />
      <Cta />
    </>
  );
}
