import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, IconButton } from './index';

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const fn = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [open, onClose]);
}

/** Right-hand panel used for create / edit forms. */
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 520 }) {
  useEscape(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog" aria-modal="true" aria-label={title}
            className="absolute inset-y-0 right-0 flex w-full flex-col bg-sheet shadow-[-20px_0_60px_-20px_rgba(22,35,58,0.35)]"
            style={{ maxWidth: width }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
              <div>
                <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
                {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
              </div>
              <IconButton icon={X} label="Close" onClick={onClose} />
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <footer className="flex items-center justify-end gap-2 border-t border-rule bg-paper-2 px-6 py-3">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Modal({ open, onClose, title, children, footer, width = 460 }) {
  useEscape(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[12vh]">
          <motion.div className="fixed inset-0 bg-ink/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className="relative w-full rounded-xl border border-rule bg-sheet shadow-[0_30px_80px_-30px_rgba(22,35,58,0.5)]"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            {title && (
              <header className="flex items-center justify-between border-b border-rule-2 px-5 py-3.5">
                <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
                <IconButton icon={X} label="Close" onClick={onClose} />
              </header>
            )}
            <div className="px-5 py-4">{children}</div>
            {footer && <footer className="flex justify-end gap-2 border-t border-rule-2 bg-paper-2 px-5 py-3 rounded-b-xl">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Promise-based confirmation: const [confirm, dialog] = useConfirm(); if (await confirm({...})) ... */
export function useConfirm() {
  const [state, setState] = useState(null);
  const resolver = useRef(null);
  const confirm = useCallback((opts) => new Promise((resolve) => { resolver.current = resolve; setState(opts); }), []);
  const close = (value) => { resolver.current?.(value); setState(null); };
  const dialog = (
    <Modal open={Boolean(state)} onClose={() => close(false)} title={state?.title} width={420}
      footer={<>
        <Button onClick={() => close(false)}>Keep it</Button>
        <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{state?.confirmLabel || 'Confirm'}</Button>
      </>}>
      <p className="text-muted">{state?.message}</p>
    </Modal>
  );
  return [confirm, dialog];
}
