export default function Logo({ className = '', light = true }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <circle cx="16" cy="16" r="11" fill="none" stroke={light ? '#F3F5F2' : '#16233A'} strokeWidth="2" />
        <path d="M16 3.5v25" stroke="#4FA57A" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M6 16h20" stroke={light ? '#F3F5F2' : '#16233A'} strokeWidth="1.2" opacity=".45" />
      </svg>
      <span className={`text-[17px] font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>Meridian</span>
    </span>
  );
}
