import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { NAV, ROLE_LABELS } from '../../lib/nav';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui';
import Logo from './Logo';

export default function Sidebar({ onNavigate }) {
  const { can, user, company, logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-ink text-ink-text">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo />
      </div>

      <div className="mx-3 mb-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
        <p className="truncate text-[13.5px] font-semibold text-white">{company?.name}</p>
        <p className="text-[12px] text-ink-text/80">{company?.currency} workspace</p>
      </div>

      <nav className="scrollbar-dark flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {NAV.map((section) => {
          const items = section.items.filter((i) => can(i.module));
          if (!items.length) return null;
          return (
            <div key={section.group} className="mt-4 first:mt-1">
              <p className="mb-1 px-3 text-[12px] font-medium text-[#7C8BA3]">{section.group}</p>
              <ul className="space-y-px">
                {items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg px-3 py-[7px] text-[14px] transition-colors ${isActive ? 'bg-ink-2 text-white' : 'hover:bg-white/[0.04] hover:text-white'}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span layoutId="nav-marker" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-ledger-bright" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
                          )}
                          <Icon className={`size-[17px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-ledger-bright' : ''}`} strokeWidth={isActive ? 2.2 : 1.8} />
                          {label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-white/8 px-4 py-3.5">
        <Avatar name={user?.name} src={user?.avatar?.url} size={34} className="bg-ink-3 text-white" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-white">{user?.name}</p>
          <p className="truncate text-[12px]">{ROLE_LABELS[user?.role]}</p>
        </div>
        <button onClick={logout} className="rounded-lg p-2 hover:bg-white/5 hover:text-white" aria-label="Sign out" title="Sign out">
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}
