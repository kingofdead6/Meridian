import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'framer-motion';

export const EASE = [0.2, 0.7, 0.2, 1];

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ as = 'div', delay = 0, y = 18, className, children, ...props }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Parent / child pair that staggers a list in as it scrolls into view. */
export function Stagger({ as = 'div', gap = 0.08, className, children }) {
  const Tag = motion[as];
  return (
    <Tag className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}>
      {children}
    </Tag>
  );
}

export const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** Headline that writes itself in word by word. */
export function WordReveal({ text, className, delay = 0, highlight = [] }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={`inline-block ${highlight.includes(word.replace(/[.,]/g, '')) ? 'bg-linear-to-r from-ledger-bright to-[#9FD6B6] bg-clip-text text-transparent' : ''}`}
            initial={{ y: '110%' }} animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: delay + i * 0.055, ease: EASE }}
          >
            {word}
          </motion.span>
          {' '}
        </span>
      ))}
    </span>
  );
}

/** Counts from zero once visible. */
export function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(0, to, { duration, ease: EASE, onUpdate: setValue });
    return () => controls.stop();
  }, [inView, to, duration]);
  return <span ref={ref} className="num">{prefix}{value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

/** Feeds the cursor position to a .spotlight card. */
export const spotlight = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

/** Small uppercase-free section label with a ledger tick. */
export function Eyebrow({ children, dark }) {
  return (
    <p className={`mb-4 inline-flex items-center gap-2 text-[13px] font-semibold ${dark ? 'text-ledger-bright' : 'text-ledger'}`}>
      <span className="h-px w-6 bg-current" />{children}
    </p>
  );
}

/** Dark band hero shared by the inner marketing pages. */
export function PageHero({ eyebrow, title, highlight, children }) {
  return (
    <section className="relative overflow-hidden bg-ink pb-24 pt-36 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines" />
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[560px] rounded-full bg-ledger/25 blur-[130px] animate-drift" />
      <div aria-hidden className="pointer-events-none absolute -bottom-56 left-[10%] size-[440px] rounded-full bg-steel/30 blur-[120px] animate-drift-slow" />
      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <Eyebrow dark>{eyebrow}</Eyebrow>
        </motion.div>
        <h1 className="max-w-[18ch] text-[40px] font-semibold leading-[1.08] tracking-tight sm:text-[56px]">
          <WordReveal text={title} highlight={highlight} delay={0.1} />
        </h1>
        {children && (
          <motion.p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-ink-text"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45, ease: EASE }}>
            {children}
          </motion.p>
        )}
      </div>
    </section>
  );
}
