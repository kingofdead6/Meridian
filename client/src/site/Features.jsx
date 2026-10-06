import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Banknote, BarChart3, Boxes, Check, Columns3, Sparkles } from 'lucide-react';
import { EASE, Eyebrow, PageHero, Reveal } from './motion';

const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-80px' } };

function PipelineVisual() {
  const cols = [['New', ['Northwind', 'Apex Labs']], ['Proposal', ['Kestrel Co', 'Bluefin']], ['Won', ['Harbor & Sons']]];
  return (
    <div className="grid grid-cols-3 gap-3">
      {cols.map(([stage, cards], c) => (
        <div key={stage} className="rounded-xl bg-paper-2 p-2.5">
          <p className="mb-2 px-1 text-[12px] font-semibold text-muted">{stage}</p>
          {cards.map((name, i) => (
            <motion.div key={name} className={`mb-2 rounded-lg border bg-sheet px-3 py-2.5 shadow-sm ${stage === 'Won' ? 'border-ledger/40' : 'border-rule'}`}
              variants={{ hidden: { opacity: 0, y: -16, rotate: -3 }, show: { opacity: 1, y: 0, rotate: 0, transition: { delay: 0.2 + c * 0.25 + i * 0.12, type: 'spring', stiffness: 300, damping: 20 } } }}>
              <p className="text-[13px] font-medium text-ink">{name}</p>
              <p className="text-[11.5px] text-muted">{['$12.4k', '$8.9k', '$21k', '$5.2k', '$34k'][c * 2 + i]}</p>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

function StockVisual() {
  const rows = [['Standing desk', 72, 'ledger'], ['Mesh chair', 18, 'amber'], ['27" monitor', 54, 'ledger'], ['USB-C dock', 9, 'debit']];
  const tones = { ledger: ['text-ledger', 'bg-ledger'], amber: ['text-amber', 'bg-amber'], debit: ['text-debit', 'bg-debit'] };
  return (
    <ul className="space-y-4">
      {rows.map(([name, pct, tone], i) => (
        <li key={name}>
          <div className="mb-1.5 flex justify-between text-[13.5px]"><span className="font-medium text-ink">{name}</span><span className={`num ${tones[tone][0]}`}>{pct} units</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-rule-2">
            <motion.div className={`h-full rounded-full ${tones[tone][1]}`} variants={{ hidden: { width: 0 }, show: { width: `${pct}%`, transition: { delay: 0.2 + i * 0.12, duration: 0.9, ease: EASE } } }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function LedgerVisual() {
  const lines = [['Bank account', '7,788.00', ''], ['Accounts receivable', '', '7,788.00']];
  return (
    <div className="rounded-xl bg-ink p-5 font-medium text-white">
      <p className="mb-3 text-[12px] text-[#7C8BA3]">JE-0218 · Payment received</p>
      {lines.map(([acc, dr, cr], i) => (
        <motion.div key={acc} className="grid grid-cols-[1fr_80px_80px] border-b border-white/10 py-2 text-[13.5px] num"
          variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { delay: 0.2 + i * 0.25, ease: EASE } } }}>
          <span className={i ? 'pl-5 text-ink-text' : ''}>{acc}</span><span className="text-right">{dr}</span><span className="text-right text-ink-text">{cr}</span>
        </motion.div>
      ))}
      <motion.p className="mt-3 inline-flex items-center gap-2 text-[13px] text-ledger-bright"
        variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { delay: 0.85, type: 'spring' } } }}>
        <span className="flex size-4 items-center justify-center rounded-full bg-ledger-bright text-ink"><Check className="size-2.5" strokeWidth={4} /></span> Balanced
      </motion.p>
    </div>
  );
}

function PayrollVisual() {
  const people = [['Amira K.', 'Engineering', '4,850'], ['Jonas P.', 'Sales', '3,920'], ['Lea M.', 'Operations', '3,410']];
  return (
    <div className="space-y-2.5">
      {people.map(([n, d, pay], i) => (
        <motion.div key={n} className="flex items-center gap-3 rounded-xl border border-rule bg-sheet px-4 py-3"
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.12, ease: EASE } } }}>
          <span className="flex size-9 items-center justify-center rounded-full bg-ledger-soft text-[13px] font-semibold text-ledger-2">{n[0]}{n.split(' ')[1][0]}</span>
          <span className="flex-1"><span className="block text-[14px] font-medium text-ink">{n}</span><span className="block text-[12px] text-muted">{d}</span></span>
          <span className="text-[14px] font-semibold text-ink num">${pay}</span>
        </motion.div>
      ))}
      <motion.div className="flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-white"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.6 } } }}>
        <span className="text-[13px] text-ink-text">October payroll · posted</span><span className="font-semibold num">$12,180</span>
      </motion.div>
    </div>
  );
}

function AssistantVisual() {
  return (
    <div className="space-y-3">
      <motion.div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[14px] text-white"
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { delay: 0.15 } } }}>
        Which customers are more than 30 days late?
      </motion.div>
      <motion.div className="flex w-fit gap-1 rounded-2xl bg-paper-2 px-4 py-3"
        variants={{ hidden: { opacity: 0 }, show: { opacity: [0, 1, 1, 0], transition: { delay: 0.5, duration: 1.2, times: [0, 0.1, 0.8, 1] } } }}>
        {[0, 1, 2].map((d) => <motion.span key={d} className="size-1.5 rounded-full bg-muted" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: d * 0.15 }} />)}
      </motion.div>
      <motion.div className="max-w-[90%] rounded-2xl rounded-bl-md border border-rule bg-sheet px-4 py-3 text-[14px] leading-relaxed text-graphite"
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { delay: 1.6 } } }}>
        Three: <b>Kestrel Co</b> owes $8,940 (41 days), <b>Bluefin</b> $3,215 (36 days) and <b>Apex Labs</b> $1,180 (33 days).
      </motion.div>
    </div>
  );
}

const SECTIONS = [
  { id: 'sell', icon: Columns3, eyebrow: 'Sell', title: 'From first call to paid invoice', text: 'Track leads on a drag-and-drop pipeline, take sales orders and turn each one into an invoice in one click.',
    points: ['Kanban pipeline with stage values', 'Orders that ship from any warehouse', 'Invoices with VAT, PDF and payment status', 'Customer statements and overdue tracking'], Visual: PipelineVisual },
  { id: 'stock', icon: Boxes, eyebrow: 'Stock & purchasing', title: 'Stock you can trust, in every warehouse', text: 'Every delivery, receipt, transfer and adjustment is a stock move, so quantities and stock value always match the books.',
    points: ['Multiple warehouses and transfers', 'Reorder levels with alerts', 'Purchase orders, receipts and supplier bills', 'Average cost valuation'], Visual: StockVisual },
  { id: 'money', icon: BarChart3, eyebrow: 'Money', title: 'Double-entry, without the data entry', text: 'Documents post their own journal entries. Accountants review, reverse and report, instead of re-typing.',
    points: ['Chart of accounts and general ledger', 'Manual journals with reversal', 'Trial balance, P&L and balance sheet', 'Payments that close invoices automatically'], Visual: LedgerVisual },
  { id: 'people', icon: Banknote, eyebrow: 'People & projects', title: 'Payroll that lands in the books', text: 'Keep employee records, approve leave and run payroll. Salaries post to the ledger and projects keep the work moving.',
    points: ['Employee directory and departments', 'Leave requests with approvals', 'Payroll runs with payslips', 'Project boards with tasks and deadlines'], Visual: PayrollVisual },
  { id: 'assistant', icon: Sparkles, eyebrow: 'Assistant', title: 'Ask your numbers a question', text: 'The assistant reads a live summary of your company and answers in plain language. It works with any OpenAI-compatible model.',
    points: ['Revenue, margins and cash questions', 'Overdue customers and low stock', 'Runs on Hugging Face, OpenAI or your own model', 'Answers only from your data'], Visual: AssistantVisual },
];

function SectionNav() {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
    }, { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    // Above the first section nothing intersects the band, so fall back to the first tab
    const onScroll = () => {
      const first = document.getElementById(SECTIONS[0].id);
      if (first && first.getBoundingClientRect().top > window.innerHeight * 0.5) setActive(SECTIONS[0].id);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);
  return (
    <div className="sticky top-16 z-30 border-b border-rule bg-paper/85 backdrop-blur-lg">
      <nav className="fade-x mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-5 py-2.5 sm:px-8" aria-label="Feature sections">
        {SECTIONS.map(({ id, eyebrow, icon: Icon }) => (
          <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', `#${id}`); }}
            className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${active === id ? 'text-white' : 'text-muted hover:text-ink'}`}>
            {active === id && <motion.span layoutId="feature-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <Icon className="relative size-4" /><span className="relative">{eyebrow}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

export default function Features() {
  return (
    <>
      <PageHero eyebrow="Features" title="Every part of the business, posting to one ledger." highlight={['one', 'ledger']}>
        Meridian is a complete ERP: selling, buying, stock, accounting, people and projects. Here is what each part does and how they connect.
      </PageHero>
      <SectionNav />
      <div className="bg-paper">
        {SECTIONS.map(({ id, icon: Icon, eyebrow, title, text, points, Visual }, i) => (
          <section key={id} id={id} className="scroll-mt-32 border-b border-rule-2 py-24 last:border-0">
            <div className={`mx-auto grid max-w-[1180px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <Reveal>
                <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-ink text-ledger-bright"><Icon className="size-6" /></span>
                <Eyebrow>{eyebrow}</Eyebrow>
                <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[38px]">{title}</h2>
                <p className="mt-4 max-w-[50ch] text-[16.5px] leading-relaxed text-muted">{text}</p>
                <ul className="mt-7 space-y-3">
                  {points.map((p, j) => (
                    <motion.li key={p} className="flex items-center gap-3 text-[15px] text-graphite"
                      initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + j * 0.07, ease: EASE }}>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ledger-soft text-ledger"><Check className="size-3" strokeWidth={3} /></span>{p}
                    </motion.li>
                  ))}
                </ul>
              </Reveal>
              <motion.div {...inView} className="relative">
                <div aria-hidden className="absolute -inset-4 rounded-[28px] bg-linear-to-br from-ledger-soft to-steel-soft opacity-70 blur-xl" />
                <motion.div className="relative rounded-2xl border border-rule bg-sheet p-6 shadow-[0_30px_80px_-40px_rgba(22,35,58,0.4)]"
                  variants={{ hidden: { opacity: 0, y: 30, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } } }}>
                  <Visual />
                </motion.div>
              </motion.div>
            </div>
          </section>
        ))}
      </div>
      <section className="bg-paper pb-24 text-center">
        <Reveal>
          <Link to="/login" className="group inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-semibold text-white transition hover:bg-ink-2">
            Try every feature in the demo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
