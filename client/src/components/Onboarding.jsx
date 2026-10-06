import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Lock, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/nav';
import { ASSISTANT, FLOW, ROLE_GUIDE, RULES, SETUP, SHORTCUTS } from '../lib/guide';
import Logo from './layout/Logo';
import { Button } from './ui';

const EASE = [0.2, 0.7, 0.2, 1];
const mac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

function Kbd({ children }) {
  return <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-rule border-b-2 bg-sheet px-1.5 text-[12px] font-semibold text-graphite">{children}</kbd>;
}

function Welcome({ user, company }) {
  return (
    <div className="text-center">
      <motion.div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-ink shadow-[0_20px_50px_-15px_rgba(22,35,58,0.6)]"
        initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        <span className="scale-[1.6]"><Logo className="[&>span]:hidden" /></span>
      </motion.div>
      <h2 className="text-[28px] font-semibold tracking-tight text-ink">Welcome to Meridian, {user.name.split(' ')[0]}</h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-[15.5px] text-muted">
        You are signed in to <b className="text-graphite">{company?.name}</b> as <b className="text-graphite">{ROLE_LABELS[user.role]}</b>.
        This short tour shows how the platform works and what you need before you start.
      </p>
      <div className="mx-auto mt-7 grid max-w-[460px] gap-2 text-left sm:grid-cols-2">
        {['How documents flow', 'What to set up first', 'Where your work lives', 'Shortcuts and help'].map((t, i) => (
          <motion.div key={t} className="flex items-center gap-2.5 rounded-xl border border-rule-2 bg-paper-2 px-3.5 py-2.5 text-[14px]"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07 }}>
            <span className="flex size-6 items-center justify-center rounded-full bg-ledger-soft text-[12px] font-bold text-ledger">{i + 1}</span>{t}
          </motion.div>
        ))}
      </div>
      <p className="mt-6 text-[13px] text-faint">About two minutes · you can reopen it any time from the sidebar</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-tight text-ink">How Meridian works</h2>
      <p className="mt-1.5 text-[15px] text-muted">You do the business step. Meridian moves the stock and writes the accounting for you.</p>
      <ol className="relative mt-6 space-y-1">
        <motion.span aria-hidden className="absolute bottom-5 left-[15px] top-5 w-0.5 origin-top bg-linear-to-b from-ledger-bright to-ledger"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1, delay: 0.2, ease: EASE }} />
        {FLOW.map((f, i) => (
          <motion.li key={f.status} className="relative flex gap-4 rounded-xl px-0 py-2"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12, ease: EASE }}>
            <span className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold ${i === FLOW.length - 1 ? 'bg-ledger text-white' : 'border-2 border-ledger bg-sheet text-ledger'}`}>
              {i === FLOW.length - 1 ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <div className="pt-1">
              <p className="text-[15px] font-semibold text-ink">{f.status}</p>
              <p className="text-[14px] text-muted">{f.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
      <motion.div className="mt-5 rounded-xl border border-amber/25 bg-amber-soft px-4 py-3 text-[13.5px] text-[#7A5210]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        <p className="flex items-start gap-2"><Lock className="mt-0.5 size-4 shrink-0" />{RULES[0]}</p>
      </motion.div>
    </div>
  );
}

function Setup({ can, onGo }) {
  const isAdmin = can('settings');
  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-tight text-ink">What you need before you start</h2>
      <p className="mt-1.5 text-[15px] text-muted">
        {isAdmin
          ? 'Work through these once, in this order. Everything else builds on them.'
          : 'An administrator sets up the company. These are the parts you can help with; the rest is done for you.'}
      </p>
      <ul className="mt-5 max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {[...SETUP].sort((a, b) => Number(can(b.module)) - Number(can(a.module))).map((s, i) => {
          const allowed = can(s.module);
          const owner = s.module === 'settings' ? 'Admin' : 'Another role';
          const Icon = s.icon;
          return (
            <motion.li key={s.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05, ease: EASE }}>
              <button type="button" disabled={!allowed} onClick={() => onGo(s.to)}
                className={`group flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition ${allowed ? 'border-rule bg-sheet hover:border-ledger/50 hover:bg-ledger-soft/40' : 'cursor-default border-rule-2 bg-paper-2 opacity-60'}`}>
                <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${allowed ? 'bg-ink text-ledger-bright' : 'bg-rule-2 text-faint'}`}><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                    {s.title}{!allowed && <span className="rounded-full bg-rule-2 px-2 py-px text-[11px] font-medium text-muted">{owner}</span>}
                  </span>
                  <span className="block text-[13.5px] leading-snug text-muted">{s.text}</span>
                </span>
                {allowed && <ChevronRight className="mt-2 size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ledger" />}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function YourWork({ role, onGo }) {
  const guide = ROLE_GUIDE[role] || ROLE_GUIDE.admin;
  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-tight text-ink">Where your work lives</h2>
      <p className="mt-1.5 text-[15px] text-muted">{guide.focus}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {guide.tasks.map(({ icon: Icon, label, to, text }, i) => (
          <motion.button key={to + label} type="button" onClick={() => onGo(to)}
            className="group rounded-xl border border-rule bg-sheet p-4 text-left transition hover:-translate-y-0.5 hover:border-ledger/50 hover:shadow-[0_14px_30px_-18px_rgba(22,35,58,0.4)]"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 + i * 0.07, ease: EASE }}>
            <span className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-ledger-soft text-ledger transition-transform group-hover:scale-110"><Icon className="size-[18px]" /></span>
              <ArrowRight className="size-4 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-ledger" />
            </span>
            <span className="mt-3 block text-[15px] font-semibold text-ink">{label}</span>
            <span className="mt-0.5 block text-[13.5px] leading-snug text-muted">{text}</span>
          </motion.button>
        ))}
      </div>
      <p className="mt-4 text-[13px] text-muted">Your sidebar only shows the modules your role can open.</p>
    </div>
  );
}

function Help({ onGuide }) {
  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-tight text-ink">Shortcuts and help</h2>
      <p className="mt-1.5 text-[15px] text-muted">A few things that make everyday work faster.</p>
      <ul className="mt-5 space-y-2.5">
        {SHORTCUTS.map((s, i) => (
          <motion.li key={s.text} className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-sheet px-4 py-3 text-[14.5px]"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.07 }}>
            {s.text}
            <span className="flex gap-1">{s.keys.map((k) => <Kbd key={k}>{k === 'Ctrl' && mac ? '⌘' : k}</Kbd>)}</span>
          </motion.li>
        ))}
        <motion.li className="flex items-center gap-3 rounded-xl border border-rule bg-sheet px-4 py-3 text-[14.5px]"
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ledger-soft text-ledger"><ASSISTANT.icon className="size-4" /></span>
          <span><b className="font-semibold text-ink">Assistant.</b> {ASSISTANT.text}</span>
        </motion.li>
      </ul>
      <motion.div className="mt-5 flex items-center gap-4 rounded-2xl bg-ink p-5 text-white"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, ease: EASE }}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-ledger-bright"><BookOpen className="size-5" /></span>
        <div className="flex-1">
          <p className="font-semibold">The full guide is always one click away</p>
          <p className="text-[13.5px] text-ink-text">Use <b className="text-white">Guide</b> at the bottom of the sidebar, or the link in the website footer.</p>
        </div>
        <button type="button" onClick={onGuide} className="hidden shrink-0 rounded-lg bg-white/10 px-3 py-2 text-[13.5px] font-medium transition hover:bg-white/20 sm:block">Open guide</button>
      </motion.div>
    </div>
  );
}

const STEPS = ['welcome', 'flow', 'setup', 'work', 'help'];

export default function Onboarding({ open, onClose }) {
  const { user, company, can, markOnboarded } = useAuth();
  const navigate = useNavigate();
  const [[step, dir], setStep] = useState([0, 1]);

  useEffect(() => { if (open) setStep([0, 1]); }, [open]);

  const finish = useCallback(() => { markOnboarded(); onClose(); }, [markOnboarded, onClose]);
  const go = useCallback((to) => { finish(); navigate(to); }, [finish, navigate]);
  const next = useCallback(() => (step < STEPS.length - 1 ? setStep([step + 1, 1]) : finish()), [step, finish]);
  const back = useCallback(() => step > 0 && setStep([step - 1, -1]), [step]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, finish, next, back]);

  if (!user) return null;
  const last = step === STEPS.length - 1;
  const body = {
    welcome: <Welcome user={user} company={company} />,
    flow: <HowItWorks />,
    setup: <Setup can={can} onGo={go} />,
    work: <YourWork role={user.role} onGo={go} />,
    help: <Help onGuide={() => go('/guide')} />,
  }[STEPS[step]];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
          <motion.div className="absolute inset-0 bg-ink/55 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={finish} />
          <motion.div role="dialog" aria-modal="true" aria-label="Welcome tour"
            className="relative flex max-h-[calc(100vh-24px)] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl bg-paper shadow-[0_50px_120px_-30px_rgba(10,18,32,0.7)]"
            initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
            <div className="h-1 bg-rule-2">
              <motion.div className="h-full bg-linear-to-r from-ledger to-ledger-bright" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.5, ease: EASE }} />
            </div>
            <div className="flex items-center justify-between px-6 pt-4">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ledger"><Sparkles className="size-3.5" />Getting started · {step + 1} of {STEPS.length}</span>
              <button onClick={finish} className="rounded-lg p-1.5 text-faint transition hover:bg-rule-2 hover:text-graphite" aria-label="Skip the tour"><X className="size-4" /></button>
            </div>

            <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-6 pb-2 pt-4 sm:min-h-[460px] sm:px-9">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div key={step} custom={dir}
                  variants={{ enter: (d) => ({ opacity: 0, x: d * 40 }), center: { opacity: 1, x: 0 }, exit: (d) => ({ opacity: 0, x: d * -40 }) }}
                  initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: EASE }}>
                  {body}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 border-t border-rule-2 bg-sheet px-6 py-4">
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <button key={s} onClick={() => setStep([i, i > step ? 1 : -1])} aria-label={`Go to step ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-ledger' : i < step ? 'w-2 bg-ledger/50' : 'w-2 bg-rule'}`} />
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {step === 0
                  ? <Button variant="ghost" onClick={finish}>Skip tour</Button>
                  : <Button variant="ghost" icon={ArrowLeft} onClick={back}>Back</Button>}
                <Button variant="primary" onClick={next} className="min-w-[132px]">
                  {step === 0 ? 'Show me around' : last ? 'Start using Meridian' : 'Next'}
                  {!last && <ArrowRight className="size-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export { Kbd };
