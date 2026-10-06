import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { initials, titleCase } from '../../lib/format';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

const VARIANTS = {
  primary: 'bg-ledger text-white hover:bg-ledger-2 border border-ledger-2/40 shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_6px_16px_-8px_rgba(46,107,78,0.6)] hover:shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_10px_22px_-8px_rgba(46,107,78,0.7)]',
  secondary: 'bg-sheet text-graphite border border-rule hover:border-[#C5CDC2] hover:bg-paper-2',
  ghost: 'text-muted hover:text-graphite hover:bg-rule-2/70',
  danger: 'bg-sheet text-debit border border-debit/30 hover:bg-debit-soft',
  ink: 'bg-ink text-white hover:bg-ink-2',
};

export const Button = forwardRef(function Button({ variant = 'secondary', size = 'md', icon: Icon, loading, className, children, ...props }, ref) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color,box-shadow] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3.5 text-[14px]',
        VARIANTS[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4 shrink-0" strokeWidth={2} />}
      {children}
    </motion.button>
  );
});

export const IconButton = ({ icon: Icon, label, className, ...props }) => (
  <button aria-label={label} title={label} className={cx('inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-rule-2 hover:text-graphite transition-colors', className)} {...props}>
    <Icon className="size-4" />
  </button>
);

export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <motion.div className="min-w-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}>
        {children}
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-[65ch] text-muted">{description}</p>}
      </motion.div>
      {actions && (
        <motion.div className="flex flex-wrap items-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}>
          {actions}
        </motion.div>
      )}
    </div>
  );
}

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-graphite">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-[12.5px] text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-[12.5px] text-debit">{error}</span>}
    </label>
  );
}

export const Input = forwardRef((props, ref) => <input ref={ref} {...props} className={cx('field', props.className)} />);
export const Textarea = forwardRef((props, ref) => <textarea ref={ref} rows={3} {...props} className={cx('field', props.className)} />);
export const Select = forwardRef(({ children, className, ...props }, ref) => (
  <select ref={ref} {...props} className={cx('field pr-8 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat', className)}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2366707A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}>
    {children}
  </select>
));

export const Spinner = ({ className }) => <Loader2 className={cx('size-5 animate-spin text-faint', className)} />;

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <motion.div className="flex flex-col items-center justify-center px-6 py-14 text-center" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
      {Icon && (
        <motion.span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-paper-2 ring-1 ring-rule-2" initial={{ y: 6 }} animate={{ y: [6, -3, 0] }} transition={{ duration: 0.6, delay: 0.05 }}>
          <Icon className="size-7 text-faint" strokeWidth={1.5} />
        </motion.span>
      )}
      <p className="font-medium text-graphite">{title}</p>
      {children && <p className="mt-1 max-w-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

export function Avatar({ name, src, size = 32, className }) {
  return src ? (
    <img src={src} alt="" className={cx('shrink-0 rounded-full object-cover', className)} style={{ width: size, height: size }} />
  ) : (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full bg-ledger-soft font-semibold text-ledger-2', className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

const TONES = {
  neutral: 'bg-rule-2 text-muted',
  green: 'bg-ledger-soft text-ledger-2',
  blue: 'bg-steel-soft text-steel',
  amber: 'bg-amber-soft text-amber',
  red: 'bg-debit-soft text-debit',
  ink: 'bg-ink text-white',
};

export const STATUS_TONE = {
  draft: 'neutral', confirmed: 'blue', fulfilled: 'green', invoiced: 'ink', cancelled: 'red',
  posted: 'blue', partial: 'amber', paid: 'green', void: 'red', overdue: 'red', reversed: 'neutral',
  pending: 'amber', approved: 'green', rejected: 'red',
  active: 'green', on_leave: 'amber', terminated: 'red', planning: 'blue', on_hold: 'amber', completed: 'neutral',
  new: 'neutral', qualified: 'blue', proposal: 'blue', negotiation: 'amber', won: 'green', lost: 'red',
  customer: 'green', supplier: 'blue', both: 'amber', goods: 'neutral', service: 'blue',
  todo: 'neutral', in_progress: 'blue', review: 'amber', done: 'green',
  in: 'green', out: 'blue', low: 'amber', high: 'red', medium: 'blue',
};

export function Badge({ tone = 'neutral', children, className, dot = true }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[12.5px] font-medium', TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export const StatusBadge = ({ status, label, className }) => (
  <Badge tone={STATUS_TONE[status] || 'neutral'} className={className}>{label || titleCase(status)}</Badge>
);

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cx('flex gap-1 overflow-x-auto border-b border-rule', className)} role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('relative whitespace-nowrap px-3 pb-2.5 pt-1 text-[14px] font-medium transition-colors', value === t.value ? 'text-ink' : 'text-muted hover:text-graphite')}>
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-faint num">{t.count}</span>}
          {value === t.value && <motion.span layoutId={`tab-${tabs.map((x) => x.value).join()}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ledger" />}
        </button>
      ))}
    </div>
  );
}

export function Panel({ title, action, children, className, bodyClassName }) {
  return (
    <motion.section className={cx('sheet transition-shadow duration-300 hover:shadow-[0_18px_40px_-28px_rgba(22,35,58,0.35)]', className)}
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-rule-2 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </motion.section>
  );
}

export function KeyValue({ label, children, className }) {
  return (
    <div className={className}>
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-graphite">{children}</dd>
    </div>
  );
}
