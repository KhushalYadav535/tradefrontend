'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileTabBar({ onOpenMenu }) {
  const pathname = usePathname();

  const tabs = [
    {
      href: '/watchlist',
      label: 'Watchlist',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
        </svg>
      )
    },
    {
      href: '/portfolio',
      label: 'Portfolio',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      href: '/trades',
      label: 'Trades',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around z-50 md:hidden pb-safe">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              active ? 'text-accent' : 'text-muted hover:text-fg'
            }`}
          >
            <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
              {t.icon}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">{t.label}</span>
          </Link>
        );
      })}
      
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted hover:text-fg transition-colors"
      >
        <div className="transition-transform duration-200 scale-100 active:scale-95">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
        <span className="text-[10px] font-semibold tracking-wide">Menu</span>
      </button>
    </nav>
  );
}
