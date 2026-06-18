'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/* ─── Nav config ─────────────────────────────── */
const TRADING_ITEMS_USER = [
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/trades',    label: 'Trades' },
  { href: '/portfolio', label: 'Portfolio/Position' },
  { href: '/banned',    label: 'Banned/Blocked Scripts' },
  { href: '/maxqty',   label: 'Max Quantity Details' },
];

const TRADING_ITEMS_ADMIN = [
  ...TRADING_ITEMS_USER,
  { href: '/margin',    label: 'Margin Management' },
  { href: '/summary',   label: 'Summary Report' },
  { href: '/summary2',  label: 'Summary Report V2' },
];

const TRADING_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const UTILITIES_SECTION = {
  key: 'utilities',
  title: 'Utilities',
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  items: [
    { href: '/editlog',      label: 'Trade Edit/Delete Log' },
    { href: '/rejectionlog', label: 'Rejection Log' },
  ],
};

const ACCOUNTS_SECTION = {
  key: 'accounts',
  title: 'Accounts',
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  items: [
    { href: '/ledger', label: 'Ledger' },
  ],
};

const SETTINGS_SECTION = {
  key: 'settings',
  title: 'Settings',
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  items: [
    { href: '/preferences', label: 'Preferences' },
  ],
};



/* Build sections based on user role */
function buildSections(role) {
  const isAdmin = role === 'admin';
  const tradingItems = isAdmin ? TRADING_ITEMS_ADMIN : TRADING_ITEMS_USER;
  return [
    { key: 'trading',   title: 'Trading',   icon: TRADING_ICON,       items: tradingItems },
    UTILITIES_SECTION,
    ACCOUNTS_SECTION,
    SETTINGS_SECTION,
  ];
}

/* ─── Collapsed icon sidebar ─────────────────── */
function CollapsedSidebar({ sections, onLogout, onClose }) {
  return (
    <aside style={{
      width: 52, flexShrink: 0,
      background: 'rgb(var(--surface))',
      borderRight: '1px solid rgb(var(--border))',
      display: 'flex', flexDirection: 'column',
    }}>
      <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sections.map((s) => (
          <Link key={s.key} href={s.items[0].href} title={s.title} style={{ textDecoration: 'none' }} onClick={onClose}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgb(var(--muted))', cursor: 'pointer',
              transition: 'all 150ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--surface2))'; e.currentTarget.style.color = 'rgb(var(--fg))'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgb(var(--muted))'; }}
            >
              {s.icon}
            </div>
          </Link>
        ))}
      </nav>
      {/* Logout always visible */}
      <div style={{ padding: '8px 6px', borderTop: '1px solid rgb(var(--border))' }}>
        <button onClick={onLogout} title="Logout" style={{
          width: 40, height: 40, borderRadius: 8, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgb(var(--red))', cursor: 'pointer', background: 'transparent',
          transition: 'background 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}


/* ─── Full sidebar ───────────────────────────── */
export default function Sidebar({ collapsed, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const sections = buildSections(user?.role);

  const getInitialOpen = () => {
    for (const s of sections) {
      if (s.items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))) return s.key;
    }
    return 'trading';
  };

  const [open, setOpen] = useState(getInitialOpen);

  const onLogout = () => { logout(); router.replace('/login'); };

  if (collapsed) {
    return <CollapsedSidebar sections={sections} onLogout={onLogout} onClose={onClose} />;
  }

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'rgb(var(--surface))',
      borderRight: '1px solid rgb(var(--border))',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {sections.map((s) => {
          const isOpen = open === s.key;
          const hasActive = s.items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'));

          return (
            <div key={s.key} style={{ marginBottom: 2 }}>
              {/* Section header button */}
              <button
                onClick={() => setOpen(isOpen ? null : s.key)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: hasActive ? 'rgb(var(--surface2))' : 'transparent',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { if (!hasActive) e.currentTarget.style.background = 'rgb(var(--surface2))'; }}
                onMouseLeave={e => { if (!hasActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: hasActive ? 'rgb(var(--warn))' : 'rgb(var(--muted))', flexShrink: 0 }}>{s.icon}</span>
                <span style={{
                  flex: 1, textAlign: 'left',
                  fontSize: 13, fontWeight: 700,
                  color: 'rgb(var(--fg))',
                  letterSpacing: '-0.01em',
                }}>{s.title}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{
                    color: 'rgb(var(--muted))', flexShrink: 0,
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 200ms ease',
                  }}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              {/* Children */}
              {isOpen && (
                <ul style={{
                  listStyle: 'none', margin: '2px 0 4px 20px', padding: '0 0 0 10px',
                  borderLeft: '1px solid rgb(var(--border))',
                }}>
                  {s.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link href={item.href} style={{ textDecoration: 'none' }} onClick={onClose}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 8px', borderRadius: 6, margin: '1px 0',
                            background: active ? 'rgba(var(--brand), 0.08)' : 'transparent',
                            cursor: 'pointer', transition: 'all 150ms',
                          }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgb(var(--surface2))'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'rgba(var(--brand), 0.08)' : 'transparent'; }}
                          >
                            {/* Dot indicator */}
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                              background: active ? 'rgb(var(--warn))' : 'rgb(var(--border))',
                              transition: 'background 150ms',
                            }} />
                            <span style={{
                              fontSize: 12.5,
                              color: active ? 'rgb(var(--warn))' : 'rgb(var(--fg) / 0.8)',
                              fontWeight: active ? 600 : 400,
                              transition: 'color 150ms',
                            }}>{item.label}</span>
                          </div>
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

      {/* Logout */}
      <div style={{ padding: '8px', borderTop: '1px solid rgb(var(--border))' }}>
        <button onClick={onLogout} style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 8,
          border: 'none', cursor: 'pointer',
          background: 'transparent',
          color: 'rgb(var(--red))',
          fontSize: 13, fontWeight: 700,
          transition: 'background 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
