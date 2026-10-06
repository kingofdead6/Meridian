import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Eye, Layers, Scale } from 'lucide-react';
import { CountUp, Eyebrow, PageHero, Reveal, Stagger, item, spotlight } from './motion';

const PRINCIPLES = [
  { icon: Scale, title: 'The books always balance', text: 'Every document that touches money posts a balanced journal entry. If it does not balance, it does not save.' },
  { icon: Layers, title: 'One record, many uses', text: 'A product, a customer or an employee is entered once and shows up everywhere it is needed.' },
  { icon: Eye, title: 'Nothing happens silently', text: 'Every change is in the audit log with who made it and when. Posted entries are reversed, never edited.' },
];

const TIMELINE = [
  ['The spreadsheet problem', 'Small companies run on a sales sheet, a stock sheet and an accountant who re-types both at month end.'],
  ['A ledger at the centre', 'We started from the general ledger and built every module so that it posts into it, instead of exporting to it.'],
  ['Roles, not menus', 'Six roles with module-level permissions keep each person focused on the part of the business they run.'],
  ['An assistant that reads the books', 'Ask about revenue, margins or late customers in plain language, answered from your own data.'],
];

const STACK = ['React 19', 'Vite', 'Tailwind CSS', 'Framer Motion', 'TanStack Query', 'Express 5', 'MongoDB', 'Mongoose', 'Cloudinary', 'PDFKit'];

function Timeline() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const height = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <div ref={ref} className="relative pl-10">
      <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-rule" />
      <motion.div className="absolute left-[11px] top-2 w-0.5 origin-top bg-ledger" style={{ scaleY: height, bottom: 8 }} />
      <ol className="space-y-12">
        {TIMELINE.map(([title, text], i) => (
          <Reveal as="li" key={title} delay={i * 0.05} className="relative">
            <span className="absolute -left-10 top-0.5 flex size-6 items-center justify-center rounded-full border-2 border-ledger bg-sheet text-[11px] font-bold text-ledger">{i + 1}</span>
            <h3 className="text-[18px] font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 max-w-[52ch] text-[15.5px] leading-relaxed text-muted">{text}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

export default function About() {
  return (
    <>
      <PageHero eyebrow="About" title="We built the ERP we wanted our accountant to have." highlight={['accountant']}>
        Meridian is an open-source ERP for small and growing companies. It treats the ledger as the source of truth and lets every
        other module write to it.
      </PageHero>

      <section className="bg-paper px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-[620px]">
            <Eyebrow>What we believe</Eyebrow>
            <h2 className="text-[34px] font-semibold leading-tight tracking-tight text-ink">Three rules the whole system follows.</h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, text }) => (
              <motion.div key={title} variants={item}>
                <div onMouseMove={spotlight} className="spotlight h-full rounded-2xl border border-rule bg-sheet p-7">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-ledger-soft text-ledger"><Icon className="size-6" /></span>
                  <h3 className="mt-6 text-[18px] font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{text}</p>
                </div>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="bg-sheet px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[1fr_1.3fr]">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>Our story</Eyebrow>
            <h2 className="text-[34px] font-semibold leading-tight tracking-tight text-ink">From four spreadsheets to one ledger.</h2>
            <div className="mt-10 grid grid-cols-2 gap-6">
              {[[<CountUp key="m" to={11} />, 'modules'], [<CountUp key="r" to={6} />, 'roles'], [<CountUp key="a" to={21} />, 'data collections'], [<CountUp key="l" to={100} suffix="%" />, 'open source']].map(([v, l]) => (
                <div key={l}>
                  <p className="text-[38px] font-semibold leading-none text-ink">{v}</p>
                  <p className="mt-1.5 text-[14px] text-muted">{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Timeline />
        </div>
      </section>

      <section className="bg-paper px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1180px] text-center">
          <Reveal>
            <Eyebrow>Under the hood</Eyebrow>
            <h2 className="text-[30px] font-semibold tracking-tight text-ink">Built on tools you already know.</h2>
          </Reveal>
          <Stagger gap={0.04} className="mx-auto mt-10 flex max-w-[760px] flex-wrap justify-center gap-2.5">
            {STACK.map((s) => (
              <motion.span key={s} variants={item} whileHover={{ y: -3 }} className="rounded-full border border-rule bg-sheet px-4 py-2 text-[14px] font-medium text-graphite shadow-sm">{s}</motion.span>
            ))}
          </Stagger>
          <Reveal delay={0.2} className="mt-14">
            <Link to="/contact" className="group inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-semibold text-white transition hover:bg-ink-2">
              Get in touch <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
