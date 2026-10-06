import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CornerDownLeft, Search } from 'lucide-react';
import api from '../../lib/api';
import { NAV } from '../../lib/nav';
import { useAuth } from '../../context/AuthContext';
import { useDebounced } from '../../lib/hooks';
import { Spinner, cx } from '../ui';

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { can } = useAuth();
  const term = useDebounced(q.trim(), 200);

  useEffect(() => { if (open) { setQ(''); setActive(0); } }, [open]);

  const pages = useMemo(() => NAV.flatMap((s) => s.items.filter((i) => can(i.module)).map((i) => ({ type: 'Go to', title: i.label, to: i.to, icon: i.icon }))), [can]);
  const { data: found = [], isFetching } = useQuery({
    queryKey: ['search', term],
    queryFn: () => api.get('/search', { params: { q: term } }).then((r) => r.data),
    enabled: open && term.length >= 2,
  });

  const items = useMemo(() => {
    const lower = q.toLowerCase();
    const nav = pages.filter((p) => !lower || p.title.toLowerCase().includes(lower)).slice(0, lower ? 5 : 8);
    return [...nav, ...(term.length >= 2 ? found : [])];
  }, [pages, found, q, term]);

  useEffect(() => setActive(0), [q]);

  const go = (item) => { if (!item) return; navigate(item.to); onClose(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); go(items[active]); }
    if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[14vh]">
          <motion.div className="fixed inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-label="Search" className="relative w-full max-w-xl overflow-hidden rounded-xl border border-rule bg-sheet shadow-[0_30px_80px_-30px_rgba(22,35,58,0.55)]"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
            <div className="flex items-center gap-3 border-b border-rule px-4">
              <Search className="size-4 text-faint" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
                placeholder="Search invoices, orders, contacts, products or pages"
                className="h-13 flex-1 bg-transparent py-4 text-[15px] outline-none placeholder:text-faint" />
              {isFetching && <Spinner className="size-4" />}
            </div>
            <ul className="max-h-[52vh] overflow-y-auto p-2">
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={`${item.type}-${item.to}-${i}`}>
                    <button onMouseEnter={() => setActive(i)} onClick={() => go(item)}
                      className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left', i === active ? 'bg-paper' : '')}>
                      <span className="w-[92px] shrink-0 text-[12.5px] text-muted">{item.type}</span>
                      {Icon && <Icon className="size-4 text-muted" />}
                      <span className="min-w-0 flex-1 truncate font-medium text-graphite">{item.title}</span>
                      {item.subtitle && <span className="truncate text-[13px] text-muted">{item.subtitle}</span>}
                      {i === active && <CornerDownLeft className="size-3.5 text-faint" />}
                    </button>
                  </li>
                );
              })}
              {!items.length && <li className="px-3 py-8 text-center text-muted">No matches for “{q}”</li>}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
