import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import Logo from './Logo';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);
  const mac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  return (
    <div className="min-h-screen lg:pl-[252px]">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[252px] lg:block">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside className="absolute inset-y-0 left-0 w-[272px]" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-rule bg-paper/90 px-4 backdrop-blur sm:px-6">
        <button className="rounded-lg p-2 text-muted hover:bg-rule-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <span className="lg:hidden"><Logo light={false} /></span>
        <button onClick={() => setPaletteOpen(true)}
          className="ml-auto flex h-9 w-full max-w-sm items-center gap-2.5 rounded-lg border border-rule bg-sheet px-3 text-[13.5px] text-faint hover:border-[#C5CDC2] lg:ml-0">
          <Search className="size-4" />
          <span className="flex-1 text-left">Search or jump to…</span>
          <kbd className="hidden rounded border border-rule bg-paper-2 px-1.5 text-[11px] text-muted sm:inline">{mac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <Link to="/assistant" className="ml-auto hidden h-9 items-center gap-2 rounded-lg px-3 text-[13.5px] font-medium text-ledger hover:bg-ledger-soft sm:inline-flex">
          <Sparkles className="size-4" /> Ask about your numbers
        </Link>
      </header>

      <main className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}>
          <Outlet />
        </motion.div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
