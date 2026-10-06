import { Check } from 'lucide-react';
import { cx } from './ui';

/** Document lifecycle — the steps really are a sequence, so they're numbered. */
export default function Steps({ steps, current, cancelled }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px]">
      {steps.map((s, i) => {
        const done = !cancelled && i < current;
        const active = !cancelled && i === current;
        return (
          <li key={s} className="flex items-center gap-2">
            <span className={cx('flex size-6 items-center justify-center rounded-full border text-[12px] font-semibold num',
              done && 'border-ledger bg-ledger text-white', active && 'border-ledger text-ledger', !done && !active && 'border-rule text-faint')}>
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cx(active ? 'font-semibold text-ink' : done ? 'text-graphite' : 'text-faint')}>{s}</span>
            {i < steps.length - 1 && <span className={cx('mx-1 h-px w-6 sm:w-10', done ? 'bg-ledger' : 'bg-rule')} />}
          </li>
        );
      })}
    </ol>
  );
}
