import { useRef } from 'react';
import { motion } from 'framer-motion';

const STYLES = {
  posted: { label: 'Posted', color: '#3A5A8C' },
  partial: { label: 'Part paid', color: '#A86E14' },
  paid: { label: 'Paid', color: '#2E6B4E' },
  void: { label: 'Void', color: '#B3432F' },
  cancelled: { label: 'Cancelled', color: '#B3432F' },
  invoiced: { label: 'Invoiced', color: '#16233A' },
};

/**
 * Rubber stamp shown on posted documents. It only animates when the status changes
 * while the page is open — the moment a document is posted, paid or voided.
 */
export default function Stamp({ status }) {
  const first = useRef(status);
  const animate = first.current !== status;
  const s = STYLES[status];
  if (!s) return null;
  return (
    <motion.div
      key={status}
      aria-label={`Status: ${s.label}`}
      initial={animate ? { scale: 2.2, opacity: 0, rotate: -18 } : false}
      animate={{ scale: 1, opacity: 0.9, rotate: -9 }}
      transition={{ type: 'spring', stiffness: 520, damping: 18, mass: 0.8 }}
      className="pointer-events-none select-none rounded-md px-4 py-1.5 text-[19px] font-extrabold uppercase tracking-[0.12em]"
      style={{ color: s.color, border: `3px double ${s.color}`, mixBlendMode: 'multiply' }}
    >
      {s.label}
    </motion.div>
  );
}
