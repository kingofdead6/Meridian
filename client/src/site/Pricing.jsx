import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Minus, Plus } from 'lucide-react';
import { EASE, Eyebrow, PageHero, Reveal, Stagger, item, spotlight } from './motion';

const PLANS = [
  { name: 'Self-hosted', blurb: 'Run Meridian on your own server.', monthly: 0, yearly: 0, unit: 'forever', cta: 'Get the code', to: '/contact',
    features: ['Every module included', 'Unlimited users and companies', 'Bring your own MongoDB', 'Community support'] },
  { name: 'Cloud', blurb: 'We host, back up and update it for you.', monthly: 12, yearly: 10, unit: 'per user / month', cta: 'Start with the demo', to: '/login', featured: true,
    features: ['Everything in Self-hosted', 'Daily backups and updates', 'AI assistant included', 'Email support within one business day'] },
  { name: 'Enterprise', blurb: 'For groups with several entities.', custom: true, unit: 'tailored to you', cta: 'Talk to us', to: '/contact',
    features: ['Everything in Cloud', 'Single sign-on and audit exports', 'Dedicated onboarding', 'Uptime commitment'] },
];

const COMPARE = [
  ['CRM, sales and purchasing', true, true, true],
  ['Inventory with multiple warehouses', true, true, true],
  ['Double-entry accounting and reports', true, true, true],
  ['People, leave and payroll', true, true, true],
  ['Managed hosting and backups', false, true, true],
  ['AI assistant', 'Your own key', true, true],
  ['Single sign-on', false, false, true],
  ['Dedicated onboarding', false, false, true],
];

const FAQ = [
  ['Is the demo company real data?', 'It is generated, but it goes through the same services as real use: six months of orders, deliveries, invoices, payments and payroll, all posted to the ledger.'],
  ['Can I move from self-hosted to cloud later?', 'Yes. Your data lives in MongoDB, so moving is an export and an import. We help Cloud and Enterprise customers do it.'],
  ['Which AI models does the assistant support?', 'Any OpenAI-compatible chat endpoint, including Hugging Face, OpenAI or a model you run yourself. Set it in the server configuration.'],
  ['Do you charge for read-only users?', 'No. Users who only view dashboards and reports are free on every plan.'],
];

function Price({ plan, yearly }) {
  if (plan.custom) return <span className="text-[40px] font-semibold tracking-tight">Custom</span>;
  const value = yearly ? plan.yearly : plan.monthly;
  return (
    <span className="inline-flex items-baseline text-[48px] font-semibold leading-none tracking-tight">
      $
      <span className="relative inline-flex overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} className="num" initial={{ y: '-100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

function Cell({ value }) {
  if (value === true) return <Check className="mx-auto size-5 text-ledger" strokeWidth={2.5} />;
  if (value === false) return <Minus className="mx-auto size-4 text-faint" />;
  return <span className="text-[13px] text-muted">{value}</span>;
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-rule rounded-2xl border border-rule bg-sheet">
      {FAQ.map(([q, a], i) => (
        <div key={q}>
          <button className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[16px] font-medium text-ink" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {q}
            <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper-2">
              <Plus className="size-4" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                <p className="px-6 pb-5 text-[15px] leading-relaxed text-muted">{a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <>
      <PageHero eyebrow="Pricing" title="Free to run yourself. Simple when we run it." highlight={['Free', 'Simple']}>
        Every plan includes every module. You only choose who looks after the servers.
      </PageHero>

      <section className="relative bg-paper px-5 pb-24 sm:px-8">
        <div className="relative mx-auto -mt-10 max-w-[1180px]">
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-full border border-rule bg-sheet p-1 shadow-sm" role="radiogroup" aria-label="Billing period">
              {[[false, 'Monthly'], [true, 'Yearly']].map(([val, label]) => (
                <button key={label} role="radio" aria-checked={yearly === val} onClick={() => setYearly(val)}
                  className={`relative rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${yearly === val ? 'text-white' : 'text-muted hover:text-ink'}`}>
                  {yearly === val && <motion.span layoutId="billing" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative">{label}{val && <span className={`ml-1.5 text-[12px] font-semibold ${yearly ? 'text-ledger-bright' : 'text-ledger'}`}>−17%</span>}</span>
                </button>
              ))}
            </div>
          </div>

          <Stagger gap={0.1} className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <motion.div key={plan.name} variants={item} className={`flex ${plan.featured ? 'lg:-my-4' : ''}`}>
                <div onMouseMove={spotlight}
                  className={`spotlight flex w-full flex-col rounded-2xl border p-8 ${plan.featured ? 'border-ink bg-ink text-white lg:py-12' : 'border-rule bg-sheet text-ink'}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-semibold">{plan.name}</h2>
                  {plan.featured && <span className="rounded-full bg-ledger-bright px-2.5 py-0.5 text-[12px] font-bold text-ink">Most popular</span>}
                </div>
                <p className={`mt-1.5 text-[14.5px] ${plan.featured ? 'text-ink-text' : 'text-muted'}`}>{plan.blurb}</p>
                <div className="mt-7"><Price plan={plan} yearly={yearly} /></div>
                <p className={`mt-1.5 text-[13.5px] ${plan.featured ? 'text-ink-text' : 'text-muted'}`}>{plan.unit}{!plan.custom && plan.monthly > 0 && yearly && ', billed yearly'}</p>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14.5px]">
                      <Check className={`mt-0.5 size-4 shrink-0 ${plan.featured ? 'text-ledger-bright' : 'text-ledger'}`} strokeWidth={2.5} />{f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.to} className={`group mt-9 inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[14.5px] font-semibold transition ${plan.featured ? 'bg-ledger-bright text-ink hover:bg-[#6BBE93]' : 'border border-rule bg-paper-2 text-ink hover:border-ink'}`}>
                  {plan.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                </div>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="bg-paper px-5 pb-24 sm:px-8">
        <Reveal className="mx-auto max-w-[1180px]">
          <h2 className="mb-6 text-[26px] font-semibold text-ink">Compare plans</h2>
          <div className="overflow-x-auto rounded-2xl border border-rule bg-sheet">
            <table className="w-full min-w-[620px] text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-rule bg-paper-2 text-[13px] text-muted">
                  <th className="px-6 py-3.5 font-medium">Feature</th>
                  {PLANS.map((p) => <th key={p.name} className="w-[160px] px-4 py-3.5 text-center font-semibold text-ink">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, ...vals], i) => (
                  <motion.tr key={label} className="border-b border-rule-2 last:border-0 hover:bg-paper-2"
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                    <td className="px-6 py-3.5">{label}</td>
                    {vals.map((v, j) => <td key={j} className="px-4 py-3.5 text-center"><Cell value={v} /></td>)}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      <section className="bg-paper px-5 pb-28 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink">Things people ask before switching.</h2>
            <p className="mt-4 text-[16px] text-muted">Something else on your mind? <Link to="/contact" className="font-semibold text-ledger hover:underline">Send us a note.</Link></p>
          </Reveal>
          <Reveal delay={0.1}><Faq /></Reveal>
        </div>
      </section>
    </>
  );
}
