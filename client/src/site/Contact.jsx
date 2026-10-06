import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, LifeBuoy, MessageSquare, Send } from 'lucide-react';
import { Button, Field, Input, Select, Textarea } from '../components/ui';
import { EASE, PageHero, Reveal, Stagger, item, spotlight } from './motion';

const CHANNELS = [
  { icon: MessageSquare, title: 'Sales', text: 'Questions about Cloud or Enterprise plans.' },
  { icon: LifeBuoy, title: 'Support', text: 'Help with setup, data import or a bug.' },
  { icon: BookOpen, title: 'Try it first', text: 'The demo company is open to everyone.', to: '/login', cta: 'Open the demo' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', topic: 'sales', message: '' });
  const [state, setState] = useState('idle');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setState('sending');
    // No backend endpoint yet: keep the message in the page and confirm locally.
    setTimeout(() => setState('sent'), 900);
  };

  return (
    <>
      <PageHero eyebrow="Contact" title="Tell us what your company runs on today." highlight={['today.']}>
        Whether you are replacing spreadsheets or another ERP, we will tell you honestly if Meridian fits.
      </PageHero>

      <section className="bg-paper px-5 pb-28 sm:px-8">
        <div className="mx-auto -mt-12 grid max-w-[1180px] gap-8 lg:grid-cols-[1.5fr_1fr]">
          <Reveal className="relative rounded-2xl border border-rule bg-sheet p-7 shadow-[0_30px_80px_-40px_rgba(22,35,58,0.35)] sm:p-9">
            <AnimatePresence mode="wait">
              {state === 'sent' ? (
                <motion.div key="sent" className="flex min-h-[420px] flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: EASE }}>
                  <motion.span className="flex size-16 items-center justify-center rounded-full bg-ledger text-white"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.1 }}>
                    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.45 }} />
                    </svg>
                  </motion.span>
                  <h2 className="mt-6 text-[24px] font-semibold text-ink">Thanks, {form.name.split(' ')[0] || 'there'}.</h2>
                  <p className="mt-2 max-w-[40ch] text-muted">Your note is ready. While you wait, the demo company is the fastest way to see Meridian.</p>
                  <div className="mt-7 flex gap-3">
                    <Link to="/login"><Button variant="primary">Open the demo</Button></Link>
                    <Button onClick={() => { setState('idle'); setForm((f) => ({ ...f, message: '' })); }}>Write another</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} className="space-y-5" exit={{ opacity: 0, y: -10 }}>
                  <h2 className="text-[22px] font-semibold text-ink">Send a message</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Your name"><Input required value={form.name} onChange={set('name')} autoComplete="name" /></Field>
                    <Field label="Work email"><Input type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
                    <Field label="Company"><Input value={form.company} onChange={set('company')} autoComplete="organization" /></Field>
                    <Field label="Topic">
                      <Select value={form.topic} onChange={set('topic')}>
                        <option value="sales">Plans and pricing</option>
                        <option value="support">Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Something else</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="How can we help?"><Textarea required rows={6} value={form.message} onChange={set('message')} /></Field>
                  <Button variant="primary" type="submit" icon={Send} loading={state === 'sending'} className="h-11 px-6">Send message</Button>
                </motion.form>
              )}
            </AnimatePresence>
          </Reveal>

          <Stagger className="space-y-4">
            {CHANNELS.map(({ icon: Icon, title, text, to, cta }) => (
              <motion.div key={title} variants={item}>
                <div onMouseMove={spotlight} className="spotlight flex gap-4 rounded-2xl border border-rule bg-sheet p-6">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-ledger-bright"><Icon className="size-5" /></span>
                  <div>
                    <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
                    <p className="mt-1 text-[14.5px] text-muted">{text}</p>
                    {to && <Link to={to} className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-ledger hover:underline"><Check className="size-4" />{cta}</Link>}
                  </div>
                </div>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}
