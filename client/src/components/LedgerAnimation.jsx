import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// The one orchestrated moment: a double-entry ledger writes itself and balances.
const ENTRIES = [
  { date: '02 Mar', account: 'Accounts receivable', debit: '7,788.00', credit: '' },
  { date: '', account: 'Product sales', debit: '', credit: '6,490.00', indent: true },
  { date: '', account: 'VAT payable', debit: '', credit: '1,298.00', indent: true },
  { date: '04 Mar', account: 'Cost of goods sold', debit: '3,420.00', credit: '' },
  { date: '', account: 'Inventory', debit: '', credit: '3,420.00', indent: true },
  { date: '09 Mar', account: 'Bank account', debit: '7,788.00', credit: '' },
  { date: '', account: 'Accounts receivable', debit: '', credit: '7,788.00', indent: true },
];
const STEP = 0.32;

export default function LedgerAnimation({ delay = 0.3 }) {
  const done = delay + ENTRIES.length * STEP + 0.2;
  return (
    <div className="ruled relative rounded-xl border border-white/10 bg-white/[0.02] px-6 pb-6 pt-4 font-medium">
      <div className="grid grid-cols-[64px_1fr_96px_96px] gap-3 border-b border-white/15 pb-2 text-[12.5px] text-[#7C8BA3]">
        <span>Date</span><span>Account</span><span className="text-right">Debit</span><span className="text-right">Credit</span>
      </div>
      {ENTRIES.map((e, i) => (
        <motion.div key={i} className="grid h-10 grid-cols-[64px_1fr_96px_96px] items-center gap-3 text-[14px] num"
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }} animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          transition={{ delay: delay + i * STEP, duration: 0.45, ease: [0.3, 0.7, 0.3, 1] }}>
          <span className="text-[#7C8BA3]">{e.date}</span>
          <span className={e.indent ? 'pl-6 text-ink-text' : 'text-white'}>{e.account}</span>
          <span className="text-right text-white">{e.debit}</span>
          <span className="text-right text-ink-text">{e.credit}</span>
        </motion.div>
      ))}
      <motion.div className="mt-1 h-[5px] origin-left border-y border-white/40" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: done, duration: 0.5, ease: 'easeOut' }} />
      <div className="mt-3 grid grid-cols-[64px_1fr_96px_96px] gap-3 text-[14px] num">
        <span />
        <motion.span className="flex items-center gap-2 text-ledger-bright" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: done + 0.45 }}>
          <motion.span className="flex size-5 items-center justify-center rounded-full bg-ledger-bright text-ink" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: done + 0.5, type: 'spring', stiffness: 500, damping: 16 }}>
            <Check className="size-3" strokeWidth={3.5} />
          </motion.span>
          Balanced
        </motion.span>
        <motion.span className="text-right font-semibold text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: done + 0.3 }}>18,996.00</motion.span>
        <motion.span className="text-right font-semibold text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: done + 0.3 }}>18,996.00</motion.span>
      </div>
    </div>
  );
}
