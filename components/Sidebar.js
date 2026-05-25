'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const SECTIONS = [
  {
    key: 'trading',
    title: 'Trading',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
    items: [
      { href: '/watchlist', label: 'Watchlist' },
      { href: '/trades', label: 'Trades' },
      { href: '/portfolio', label: 'Portfolio / Position' },
      { href: '/banned', label: 'Banned / Blocked Scripts' },
      { href: '/maxqty', label: 'Max Quantity Details' },
    ],
  },
  {
    key: 'utilities',
    title: 'Utilities',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    items: [
      { href: '/editlog', label: 'Trade Edit / Delete Log' },
      { href: '/rejectionlog', label: 'Rejection Log' },
    ],
  },
  {
    key: 'accounts',
    title: 'Accounts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
    items: [
      { href: '/ledger', label: 'Ledger' },
    ],
  },
];

export default function Sidebar({ collapsed }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  // expanded section based on current path
  const initial = SECTIONS.find((s) => s.items.some((i) => i.href === pathname))?.key || 'trading';
  const [open, setOpen] = useState(initial);

  const onLogout = () => {
    logout();
    router.replace('/login');
  };

  if (collapsed) {
    return (
      <aside className="w-14 shrink-0 bg-black border-r border-border flex flex-col">
        <nav className="flex-1 py-3 px-2 space-y-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={s.items[0].href}
              className="flex items-center justify-center w-10 h-10 rounded hover:bg-surface text-muted hover:text-white"
              title={s.title}
            >
              {s.icon}
            </Link>
          ))}
        </nav>
        <button onClick={onLogout} className="m-2 w-10 h-10 rounded hover:bg-red/10 text-red flex items-center justify-center" title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-60 shrink-0 bg-black border-r border-border flex flex-col">
      <nav className="flex-1 p-3 overflow-y-auto">
        {SECTIONS.map((s) => {
          const isOpen = open === s.key;
          const hasActive = s.items.some((i) => pathname === i.href);
          return (
            <div key={s.key} className="mb-1">
              <button
                onClick={() => setOpen(isOpen ? null : s.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  hasActive ? 'text-white bg-surface' : 'text-white/90 hover:bg-surface'
                }`}
              >
                <span className={hasActive ? 'text-accent' : 'text-muted'}>{s.icon}</span>
                <span className="flex-1 text-left">{s.title}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              {isOpen && (
                <ul className="mt-0.5 mb-2 ml-2 pl-4 border-l border-border space-y-0.5">
                  {s.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-2 px-3 py-2 rounded text-[13px] transition-colors ${
                            active ? 'text-accent bg-accent/10' : 'text-white/70 hover:bg-surface hover:text-white'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-accent' : 'bg-muted'}`} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-red hover:bg-red/10 text-sm font-semibold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
