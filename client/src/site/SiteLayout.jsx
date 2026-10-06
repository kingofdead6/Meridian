import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Code2, Menu, X } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { EASE } from './motion';

const LINKS = [['/features', 'Features'], ['/pricing', 'Pricing'], ['/about', 'About'], ['/contact', 'Contact']];

function Nav() {
  const { user } = useAuth();
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className={`transition-all duration-300 ${scrolled ? 'bg-ink/85 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] backdrop-blur-lg' : 'bg-transparent'}`}>
        <nav className={`mx-auto flex max-w-[1180px] items-center gap-6 px-5 transition-all duration-300 sm:px-8 ${scrolled ? 'h-16' : 'h-20'}`} aria-label="Website">
          <Link to="/" aria-label="Meridian home"><Logo /></Link>
          <ul className="ml-6 hidden items-center gap-1 md:flex">
            {LINKS.map(([to, label]) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => `relative rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${isActive ? 'text-white' : 'text-ink-text hover:text-white'}`}>
                  {({ isActive }) => (
                    <>
                      {label}
                      {isActive && <motion.span layoutId="site-nav" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-ledger-bright" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {user ? (
              <Link to="/" className="group inline-flex h-10 items-center gap-2 rounded-lg bg-ledger-bright px-4 text-[14px] font-semibold text-ink transition hover:bg-[#6BBE93]">
                Open dashboard <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-[14px] font-medium text-ink-text transition-colors hover:text-white">Sign in</Link>
                <Link to="/login" className="group inline-flex h-10 items-center gap-2 rounded-lg bg-ledger-bright px-4 text-[14px] font-semibold text-ink transition hover:bg-[#6BBE93]">
                  Try the demo <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>
          <button className="ml-auto rounded-lg p-2 text-white md:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
        <motion.div className="h-0.5 origin-left bg-ledger-bright" style={{ scaleX: progress, opacity: scrolled ? 1 : 0 }} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="border-t border-white/10 bg-ink/95 backdrop-blur-lg md:hidden"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
            <ul className="space-y-1 px-5 py-4">
              {LINKS.map(([to, label], i) => (
                <motion.li key={to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                  <NavLink to={to} className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-[15px] font-medium ${isActive ? 'bg-white/10 text-white' : 'text-ink-text'}`}>{label}</NavLink>
                </motion.li>
              ))}
              <li className="pt-3">
                <Link to={user ? '/' : '/login'} className="flex h-11 items-center justify-center rounded-lg bg-ledger-bright font-semibold text-ink">
                  {user ? 'Open dashboard' : 'Try the demo'}
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

const FOOTER = [
  ['Product', [['/features', 'Features'], ['/pricing', 'Pricing'], ['/login', 'Live demo']]],
  ['Company', [['/about', 'About'], ['/contact', 'Contact']]],
  ['Modules', [['/features#sell', 'CRM & sales'], ['/features#stock', 'Inventory'], ['/features#money', 'Accounting'], ['/features#people', 'People & payroll']]],
];

function Footer() {
  return (
    <footer className="bg-ink text-ink-text">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed">
            Open-source ERP where every sale, purchase and payment posts itself to a ledger that always balances.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[12.5px]">
            <span className="size-2 rounded-full bg-ledger-bright animate-pulse-ring" /> Demo environment online
          </span>
        </div>
        {FOOTER.map(([title, links]) => (
          <div key={title}>
            <p className="mb-3 text-[13px] font-semibold text-white">{title}</p>
            <ul className="space-y-2 text-[14px]">
              {links.map(([to, label]) => (
                <li key={label}><Link to={to} className="transition-colors hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-[13px] text-[#7C8BA3] sm:px-8">
          <p>© {new Date().getFullYear()} Meridian ERP · Released under the MIT licence</p>
          <span className="inline-flex items-center gap-1.5"><Code2 className="size-4" /> Built with React, Express and MongoDB</span>
        </div>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const location = useLocation();
  const outlet = useOutlet();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120); return; }
    }
    window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-paper">
      <Nav />
      <AnimatePresence mode="wait">
        <motion.main key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-ink"><Spinner /></div>}>
            {outlet}
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
