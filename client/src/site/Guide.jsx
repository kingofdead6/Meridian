import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Compass, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/nav';
import { ASSISTANT, FLOW, ROLE_GUIDE, RULES, SETUP, SHORTCUTS, TROUBLESHOOTING } from '../lib/guide';
import { EASE, Eyebrow, PageHero, Reveal, Stagger, item } from './motion';

const TOC = [
  ['start', 'Before you begin'],
  ['setup', 'Set-up checklist'],
  ['flow', 'How documents flow'],
  ['roles', 'Roles and daily work'],
  ['shortcuts', 'Shortcuts and assistant'],
  ['help', 'Troubleshooting'],
];

function useActiveSection() {
  const [active, setActive] = useState(TOC[0][0]);
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-30% 0px -60% 0px' });
    TOC.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    // Above the first section nothing intersects the band, so fall back to the first entry
    const onScroll = () => {
      const first = document.getElementById(TOC[0][0]);
      if (first && first.getBoundingClientRect().top > window.innerHeight * 0.3) setActive(TOC[0][0]);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);
  return active;
}

function Section({ id, eyebrow, title, intro, children }) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-rule-2 pb-16 pt-4 last:border-0">
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-[30px] font-semibold leading-tight tracking-tight text-ink">{title}</h2>
        {intro && <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">{intro}</p>}
      </Reveal>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Kbd({ children }) {
  return <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-rule border-b-2 bg-sheet px-2 text-[12.5px] font-semibold text-graphite">{children}</kbd>;
}

function Faq() {
  const [open, setOpen] = useState(-1);
  return (
    <div className="divide-y divide-rule rounded-2xl border border-rule bg-sheet">
      {TROUBLESHOOTING.map(([q, a], i) => (
        <div key={q}>
          <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15.5px] font-medium text-ink" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {q}
            <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.25 }}><ChevronDown className="size-4 text-muted" /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} className="overflow-hidden">
                <p className="px-5 pb-4 text-[15px] leading-relaxed text-muted">{a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function Guide() {
  const { user } = useAuth();
  const active = useActiveSection();
  const roles = Object.keys(ROLE_GUIDE);
  const [role, setRole] = useState(user?.role && ROLE_GUIDE[user.role] ? user.role : 'admin');
  const r = ROLE_GUIDE[role];

  return (
    <>
      <PageHero eyebrow="Guide" title="How to get Meridian running for your company." highlight={['running']}>
        What you need before you start, the order to set things up, how documents move through the system and what each role does every day.
      </PageHero>

      <div className="bg-paper">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-28" aria-label="On this page">
              <p className="mb-3 text-[12.5px] font-semibold text-muted">On this page</p>
              <ul className="space-y-0.5 border-l border-rule">
                {TOC.map(([id, label]) => (
                  <li key={id} className="relative">
                    {active === id && <motion.span layoutId="toc" className="absolute -left-px inset-y-0 w-0.5 rounded-full bg-ledger" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                    <a href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`block py-1.5 pl-4 text-[14px] transition-colors ${active === id ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}>{label}</a>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl bg-ink p-5 text-white">
                <Compass className="mb-3 size-6 text-ledger-bright" />
                <p className="text-[14px] font-semibold">Prefer a walkthrough?</p>
                <p className="mt-1 text-[13px] text-ink-text">The interactive tour covers the essentials in two minutes.</p>
                <Link to={user ? '/?tour=1' : '/login'} className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ledger-bright hover:underline">
                  {user ? 'Replay the tour' : 'Sign in to start'} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </nav>
          </aside>

          <div className="min-w-0 space-y-14">
            <Section id="start" eyebrow="Step 0" title="Before you begin"
              intro="Meridian runs in the browser. There is nothing to install for your team; you only need the following.">
              <Stagger className="grid gap-4 sm:grid-cols-3">
                {[
                  ['A workspace', 'Create one from the sign-in page with "Create a workspace". You become its administrator.'],
                  ['Your basic records', 'A list of products, customers, suppliers and, for payroll, employees with salaries.'],
                  ['Who does what', 'Decide which role each colleague gets: admin, manager, accountant, sales, warehouse or HR.'],
                ].map(([t, d], i) => (
                  <motion.div key={t} variants={item} className="rounded-2xl border border-rule bg-sheet p-5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">{i + 1}</span>
                    <p className="mt-4 font-semibold text-ink">{t}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">{d}</p>
                  </motion.div>
                ))}
              </Stagger>
              <p className="mt-5 text-[14px] text-muted">
                Just exploring? The <Link to="/login" className="font-semibold text-ledger hover:underline">demo company</Link> already has six months of data, so you can skip set-up entirely.
              </p>
            </Section>

            <Section id="setup" eyebrow="Step 1" title="Set-up checklist"
              intro="Do these once, in this order. A chart of accounts and a first warehouse are created for you when the workspace is made.">
              <ol className="relative space-y-3">
                {SETUP.map(({ icon: Icon, title, text, to }, i) => (
                  <Reveal as="li" key={title} delay={i * 0.04}>
                    <div className="flex gap-4 rounded-2xl border border-rule bg-sheet p-5 transition hover:border-ledger/40 hover:shadow-[0_14px_30px_-20px_rgba(22,35,58,0.35)]">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ledger-soft text-ledger"><Icon className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink"><span className="text-faint num">{String(i + 1).padStart(2, '0')}</span>{title}</p>
                        <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{text}</p>
                      </div>
                      {user && <Link to={to} className="hidden shrink-0 self-center rounded-lg border border-rule px-3 py-1.5 text-[13px] font-medium text-graphite transition hover:border-ledger hover:text-ledger sm:block">Open</Link>}
                    </div>
                  </Reveal>
                ))}
              </ol>
            </Section>

            <Section id="flow" eyebrow="Step 2" title="How documents flow"
              intro="Every sale moves through the same statuses. Purchases mirror it: confirm the purchase order, receive the goods, post the supplier bill, then pay it.">
              <div className="relative overflow-x-auto pb-2">
                <Stagger gap={0.12} className="grid min-w-[640px] grid-cols-5 gap-3">
                  {FLOW.map((f, i) => (
                    <motion.div key={f.status} variants={item} className="relative">
                      <div className={`mb-3 flex h-10 items-center justify-center rounded-xl text-[14px] font-semibold ${i === FLOW.length - 1 ? 'bg-ledger text-white' : 'bg-ink text-white'}`}>
                        {f.status}
                      </div>
                      {i < FLOW.length - 1 && <ArrowRight className="absolute -right-[11px] top-[11px] z-10 size-4 rounded-full bg-paper text-ledger" />}
                      <p className="text-[13.5px] leading-relaxed text-muted">{f.text}</p>
                    </motion.div>
                  ))}
                </Stagger>
              </div>
              <ul className="mt-8 space-y-2.5">
                {RULES.map((rule, i) => (
                  <Reveal as="li" key={rule} delay={i * 0.06} className="flex items-start gap-3 rounded-xl bg-sheet px-4 py-3 text-[14.5px] text-graphite ring-1 ring-rule-2">
                    {i === 0 ? <Lock className="mt-0.5 size-4 shrink-0 text-amber" /> : <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ledger" />}{rule}
                  </Reveal>
                ))}
              </ul>
            </Section>

            <Section id="roles" eyebrow="Step 3" title="Roles and daily work"
              intro="Each person sees only the modules their role allows. Pick a role to see where that person spends their day.">
              <div className="mb-5 flex flex-wrap gap-2" role="tablist">
                {roles.map((k) => (
                  <button key={k} role="tab" aria-selected={role === k} onClick={() => setRole(k)}
                    className={`relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${role === k ? 'text-white' : 'text-muted hover:text-ink'}`}>
                    {role === k && <motion.span layoutId="guide-role" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                    <span className="relative">{ROLE_LABELS[k]}{user?.role === k && ' (you)'}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25, ease: EASE }}
                  className="rounded-2xl border border-rule bg-sheet p-6">
                  <p className="text-[15.5px] text-graphite">{r.focus}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {r.tasks.map(({ icon: Icon, label, text }) => (
                      <div key={label} className="flex gap-3 rounded-xl bg-paper-2 p-4">
                        <Icon className="mt-0.5 size-5 shrink-0 text-ledger" />
                        <div><p className="font-semibold text-ink">{label}</p><p className="text-[14px] text-muted">{text}</p></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </Section>

            <Section id="shortcuts" eyebrow="Work faster" title="Shortcuts and assistant">
              <div className="grid gap-4 md:grid-cols-2">
                <Reveal className="rounded-2xl border border-rule bg-sheet p-6">
                  <p className="mb-4 font-semibold text-ink">Keyboard</p>
                  <ul className="space-y-3">
                    {SHORTCUTS.map((s) => (
                      <li key={s.text} className="flex items-center justify-between gap-4 text-[14.5px]">
                        {s.text}<span className="flex gap-1">{s.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[13px] text-muted">On a Mac, use ⌘ instead of Ctrl.</p>
                </Reveal>
                <Reveal delay={0.08} className="rounded-2xl bg-ink p-6 text-white">
                  <ASSISTANT.icon className="mb-4 size-6 text-ledger-bright" />
                  <p className="font-semibold">Assistant</p>
                  <p className="mt-1 text-[14.5px] text-ink-text">{ASSISTANT.text} It answers from a live summary of your own company data.</p>
                  <ul className="mt-4 space-y-1.5 text-[14px] text-ink-text">
                    {['Which invoices are overdue?', 'What were our best sellers this quarter?', 'Which products need reordering?'].map((q) => (
                      <li key={q} className="flex items-center gap-2"><Check className="size-3.5 text-ledger-bright" />{q}</li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </Section>

            <Section id="help" eyebrow="Stuck?" title="Troubleshooting"
              intro="The questions people ask most in their first week.">
              <Faq />
              <p className="mt-6 text-[14.5px] text-muted">Still stuck? <Link to="/contact" className="font-semibold text-ledger hover:underline">Contact us</Link> and tell us what you were trying to do.</p>
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
